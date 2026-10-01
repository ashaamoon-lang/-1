# Tahap 71 — Gerbang yang hanya tahu satu tata letak

> Tahap 70 menemukan bahwa menyemai empat gambar **tidak** akan menayangkan run
> horizontal — ia akan memerahkan `media-edge`. Tahap ini memperbaiki sebabnya:
> gerbang itu menghakimi **setiap** gambar dengan kontrak kisi, dan run bukan
> kisi.

## 1. Yang diukur, sebelum satu baris kode

`e2e/media-edge.e2e.ts` punya tiga uji. Diperiksa satu per satu terhadap
halaman yang run-nya menyala — **bukan ditebak**, karena di Tahap 70 saya
menebak yang ini dan salah.

### 1.1 Uji 1 **selamat**, dan saya sempat menyiratkan sebaliknya

"artwork sits on at most two widths" mengelompokkan semua lebar dan menuntut
**≤ 2** yang berbeda. Pada halaman ber-run:

```
sampul hero   lebar dari rasionya sendiri     -> lebar #1
plat run      34vw, seragam, semuanya         -> lebar #2
```

Tepat dua. **Lulus.** Di catatan Tahap 70 saya menulis "sapuan lebar per
golongan juga pecah" tanpa memisahkan uji mana — itu benar untuk uji 2 dan
salah kalau dibaca sebagai uji 1. Dikoreksi di sini.

### 1.2 Uji 2 yang pecah, dan persis di baris mana

`media-edge.e2e.ts:218` — "the track a work lands in follows its shape":

```ts
const fulls = artwork.filter((item) => item.ratio >= 1)
const halves = artwork.filter((item) => item.ratio < 1)
expect(spread(fulls)).toBeLessThanOrEqual(TOLERANCE)
expect(spread(halves)).toBeLessThanOrEqual(TOLERANCE)
expect(half).toBeLessThan(full - TOLERANCE)
```

Dua cara ia merah pada halaman ber-run, dan keduanya nyata:

1. **Sapuan dalam golongan.** Sampul hero potret dan plat run potret masuk
   `halves` yang sama, tapi yang satu memakai lebar dari rasionya dan yang lain
   `34vw`. Selisihnya jauh di atas `TOLERANCE` 1,5px.
2. **Potret lebih sempit daripada lanskap.** Di dalam run keduanya `34vw`, jadi
   `half === full` dan `toBeLessThan(full - 1.5)` gagal.

### 1.3 Uji 3 tidak bisa saya pastikan tanpa datanya

"every artwork box is filled by its image" menuntut `<img>` mengisi kotak yang
`.media` pesan. Plat run memakai `figure` yang **byte-identical** dengan jalur
kisi, jadi saya **memperkirakan** ia lulus — dan mengatakannya sebagai perkiraan,
bukan hasil. Ia baru terverifikasi saat ada datanya.

## 2. Kenapa bukan "kecualikan saja run-nya"

Itu yang pertama terpikir, dan ia salah. Mengecualikan plat run dari
`media-edge` berarti **tidak ada yang mengatakan apa pun** tentang lebar mereka.
Run punya kontraknya sendiri, dan ia justru lebih ketat daripada kisi:

| tata letak | kontrak                                                         |
| ---------- | --------------------------------------------------------------- |
| kisi       | dua lebar — satu trek penuh, satu setengah; potret lebih sempit |
| run        | **satu** lebar, dibagi setiap plat, apa pun rasionya            |
| keduanya   | tiap kotak diisi gambarnya                                      |

Jadi gerbangnya harus **tahu ia sedang melihat tata letak yang mana**, lalu
menerapkan aturan yang cocok. Bukan diam.

## 3. Yang dikerjakan

### 71a — keputusannya jadi fungsi murni, karena cabang run-nya kosong hari ini

Kalau logikanya ditulis langsung di dalam `page.evaluate` e2e, cabang run-nya
**tidak akan pernah dijalankan** pada dataset hari ini — gerbang yang tidak bisa
gagal pada kasus yang melahirkannya, yang persis pelajaran Tahap 68 dan 70.

Jadi keputusannya diangkat jadi `trackFaults()` di `e2e/track-contract.ts`,
fungsi murni dari daftar plat (`ratio`, `width`, `inRun`) ke daftar pelanggaran
— dan diuji di `e2e/track-contract.test.ts` dengan **kedua** bentuk, termasuk
yang tidak ada di dataset.

Preseden ada di repo ini: Tahap 66 mengangkat `loneHalves()` jadi fungsi murni
dan mengujinya dengan kasus sintetis yang tidak ada di fixture, termasuk kasus
yang aturan naif lewatkan.

`e2e/` karena satu-satunya konsumennya ada di sana; `*.test.ts` karena
`bun test` menyapu repo sementara Playwright hanya cocokkan `*.e2e.ts`.

### 71b — `media-edge` memanggilnya, dan mengumpulkan `inRun` dari DOM

Plat dianggap milik run kalau `[data-epic="project-run"]` memuatnya. Jalur kisi
tidak berubah perilakunya sama sekali — dan itu yang dibuktikan: gerbangnya
tetap hijau pada dataset hari ini, karena hari ini setiap gambar adalah gambar
kisi.

### 71c — kontrak run ditegakkan di tempat ia bisa diuji hari ini

`e2e/gallery-run.e2e.ts` dapat satu tuntutan baru: **setiap plat run berbagi
satu lebar**. Itu berjalan terhadap Storybook, jadi ia hidup sekarang, bukan
menunggu dataset.

## 4. Yang **tidak** dikerjakan

| butir                             | kenapa tidak                                                                                                    |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Menyemai dataset                  | Tulisan ke CMS Anda. Setelah tahap ini ia tidak lagi memerahkan `media-edge`, tapi perintahnya tetap milik Anda |
| Menurunkan `TOLERANCE`            | 1,5px adalah toleransi sub-piksel, bukan angka selera. Tidak disentuh                                           |
| Mengubah lebar plat run           | `34vw` terukur di Tahap 64. Yang salah gerbangnya, bukan tata letaknya                                          |
| Menjanjikan uji 3 lulus           | §1.3 — perkiraan, dan dikatakan sebagai perkiraan                                                               |
| Menjanjikan `epic-sequence` lulus | Halaman ber-run naik 1 → 2 momen dari plafon 6. Itu **tidak bisa diverifikasi tanpa datanya**; lihat §6         |

## 5. Gerbang

| gerbang                     | menuntut                                                                 |
| --------------------------- | ------------------------------------------------------------------------ |
| **baru** `track-contract`   | kedua tata letak dihakimi aturannya sendiri; kasus run diuji sintetis    |
| `e2e/media-edge.e2e.ts`     | tetap hijau pada dataset hari ini — jalur kisi tidak berubah perilakunya |
| `e2e/gallery-run.e2e.ts`    | plat run berbagi satu lebar, ditambah keempat tuntutan Tahap 70          |
| `e2e/project-spread.e2e.ts` | spread Tahap 66 tetap hijau                                              |
| `e2e/held-screen.e2e.ts`    | tetap hijau — gerbang Tahap 69                                           |
| `vault/vault-api.test.ts`   | tetap hijau — gerbang Tahap 68                                           |
| `contrast.test.ts`          | **tidak berubah** — nol token warna disentuh                             |

## 5.1 Bukti: aturan lama memang merah, aturan baru hijau, dan masih menggigit

Aturan lama dijalankan ulang apa adanya terhadap bentuk halaman ber-run
(sampul hero potret 572px + empat plat run 490px):

```
ATURAN LAMA   2 pelanggaran
              - portrait works land on different widths
              - a portrait work is not narrower than a landscape one
ATURAN BARU   0 pelanggaran pada halaman yang sama
ATURAN BARU   1 pelanggaran pada run yang platnya dua lebar
```

Dua pelanggaran itu **persis** dua yang Tahap 70 sebut sebagai alasan tidak
menyemai — diprediksi lebih dulu, lalu dibuktikan. Dan baris ketiga yang
penting: aturan barunya tidak menjadi lunak, ia hanya berhenti memakai aturan
yang salah.

`bun test` 447 → **457 lulus**, 0 gagal: sepuluh uji `track-contract`.

## 6. Yang tersisa sebelum run tayang, setelah tahap ini

Satu hal, dan satu risiko yang saya sebut sekarang alih-alih menemukannya nanti:

1. **Satu proyek dengan empat gambar di dataset.** Perintahnya milik Anda:

   ```bash
   bun --env-file .env.local lib/scripts/seed-fixtures.ts
   bun --env-file .env.local lib/scripts/seed-fixtures.ts --clean
   ```

2. **`epic-sequence` belum terverifikasi untuk halaman ber-run.** Rute itu naik
   dari 1 ke 2 momen (`project-arrival` + `project-run`) dari plafon 6, dan
   gerbang itu menuntut tiap momen punya rentang gulirnya sendiri. Saya **tidak
   bisa** memastikannya tanpa datanya. Kalau ia merah setelah Anda menyemai,
   itu pekerjaan berikutnya — dan saya sudah menyebutnya lebih dulu, bukan
   menemukannya sebagai kejutan.
