# Tahap 70 — Cabang yang tidak pernah diambil

> Tahap 64 membangun gulir horizontal-dalam-vertikal untuk galeri
> `/work/<slug>`: ter-pin, bertoken, ber-reduced-motion, punya penanda epic,
> punya label aksesibel di **kedua** kamus, dan dioper dari halamannya. **Dan
> cabangnya tidak pernah sekali pun diambil** — tidak oleh rute mana pun, tidak
> oleh satu story pun, tidak oleh satu uji pun.

## 1. Yang diukur, sebelum satu baris kode

Kondisinya ada di `vault/blocks/project-gallery/index.tsx:376`:

```ts
const RUN_MINIMUM = 4
const travels = run && images.length >= RUN_MINIMUM
```

Tiga tempat yang bisa membuatnya benar, dan ketiganya tidak:

| tempat       | keadaan                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| **rute**     | `seed-fixtures.ts` memberi **keenam** proyek tepat **dua** plate galeri, dari kolam tiga plate bersama |
| **katalog**  | lima story — `Three`, `Two`, `Five`, `Single`, `Empty` — dan **tidak satu pun mengoper `run`**         |
| **uji unit** | `project-gallery.test.ts` menguji lebar plate dan `loneHalves`, bukan kondisi `travels`                |

Story `Five` yang paling telak: ia punya **lima** gambar, melewati
`RUN_MINIMUM` dengan sisa, dan tetap menggambar kisi — karena `run` tidak
dioper. Katalognya memperagakan mode yang salah pada hitungan yang justru
dirancang untuk mode satunya.

Bloknya sendiri sudah menuliskan separuh temuan ini, dan itu kredit untuk Tahap
64, bukan cacat baru:

> _"Consequence, stated rather than hidden: **on today's fixtures the run never
> appears.**"_

Yang tidak tertulis, dan yang tahap ini tambahkan: ia juga tidak muncul di
**katalog** maupun di **uji**. Jadi satu-satunya bukti hidupnya adalah aritmetika
`travel()`, bukan satu pun render.

## 2. Kenapa gerbang Tahap 68 tidak bisa melihatnya

`vault/vault-api.test.ts` menanyakan: **apakah prop yang dideklarasikan punya
pemanggil?** `run` punya — `app/[locale]/work/[slug]/page.tsx:448` mengopernya,
dengan komentar sepanjang dua puluh baris tentang kenapa rute ini dan bukan `/`.
Jadi gerbangnya benar dan hijau.

Tapi **boolean yang mengganti seluruh mode render bisa dioper dan tetap tidak
pernah mengambil cabangnya.** Gerbang Tahap 68 satu tingkat terlalu dangkal
untuk kelas ini: ia mengukur _tepi panggilan_, bukan _cabang yang dieksekusi_.

Itu bukan celaan terhadap gerbang itu — ia menangkap kelasnya sendiri dengan
baik. Ini kelas berikutnya, dan ia butuh alat yang berbeda: sesuatu yang
benar-benar **menggambar** cabangnya.

## 3. Yang dikerjakan

### 70a — katalog menggambar cabangnya

Story `Run` di `project-gallery.stories.tsx`: `images(4)` dengan `run`. Itu
membuat mode yang selama ini hanya ada di kepala pembacanya jadi hal yang bisa
dilihat, dan `storybook-a11y` langsung meliputinya tanpa satu byte pun dari CMS.

Ini persis pelajaran Tahap 67, terbalik: di sana story menghilangkan argumen yang
bloknya dirancang di sekitarnya, dan mendokumentasikan bloknya salah selama lima
puluh lima tahap. Di sini story tidak pernah menyalakan mode yang bloknya
dibangun untuknya.

### 70b — gerbang yang menuntut cabangnya benar-benar berjalan

`e2e/gallery-run.e2e.ts`, dijalankan terhadap Storybook yang sudah dibangun,
jadi ia **tidak bergantung pada dataset sama sekali**:

- trek itu benar-benar lebih lebar dari kotaknya — pin dengan travel nol adalah
  kegagalan yang `step-sequence` sudah namai dan yang Tahap 64 sudah ukur
  (`items: 2, trackWidth: 1027, viewportWidth: 1161, travel: -134`);
- ia bergerak saat digulir, dan hanya `transform`;
- reduced motion berakhir terbaca, nol plat terdampar;
- axe dari dalam run-nya.

Dibuktikan merah lebih dulu dengan keadaan hari ini — tanpa story `Run` tidak
ada apa pun untuk diukur, yang justru bukti terbaiknya.

### 70c — dan kenapa fixture-nya **tidak** disentuh di tahap ini

Rencana awal saya: perluas `seed-fixtures.ts` supaya satu proyek membawa empat
plate. Saya **membatalkannya setelah membaca gerbangnya**, dan itu temuan
tahap ini, bukan kehati-hatian.

`e2e/media-edge.e2e.ts:218` menuntut, pada halaman yang sama:

```ts
expect(half).toBeLessThan(full - TOLERANCE)
```

**Potret harus lebih sempit daripada lanskap.** Itu kontrak Tahap 11b, dan ia
benar untuk kisi. Tapi run memberi **setiap** plat `34vw` yang sama — jadi
`half === full`, dan gerbangnya merah. Sapuan lebar per golongan
(`spread(fulls)`, `spread(halves)`) juga pecah, karena sampul hero tetap
memakai lebar dari rasionya sendiri sementara plat-plat run seragam.

Jadi menyemai empat gambar **tidak** akan membuat run tayang; ia akan
memerahkan `media-edge` di rute itu. Mengajari gerbang itu soal run adalah
pekerjaan nyata — ia harus tahu kapan lebar seragam benar dan kapan itu cacat
Tahap 11b yang kembali — dan itu **tidak bisa diverifikasi tanpa datanya**.
Setengah mengerjakannya berarti mengirim generator yang memecah suite pada
perintah pertama yang Anda jalankan.

Ia dapat tahapnya sendiri. Yang tahap ini kirim adalah cabangnya benar-benar
digambar dan ditahan, tanpa bergantung pada dataset sama sekali.

## 4. Yang **tidak** dikerjakan, dan kenapa

| butir                                  | kenapa tidak                                                                                                                                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Menyemai dataset Sanity yang nyata** | Dua alasan, dan yang pertama teknis: §70c — ia akan memerahkan `media-edge`, bukan menayangkan run. Yang kedua, itu tulisan ke CMS Anda                                                          |
| Memperluas `seed-fixtures.ts`          | §70c. Generator yang memecah suite pada perintah pertama yang Anda jalankan lebih buruk daripada generator yang belum diubah                                                                     |
| Menurunkan `RUN_MINIMUM` jadi 2 atau 3 | Angkanya terukur, bukan selera: pada `34vw` per item, tiga item melewati viewport ~320px, empat ~800px. Menurunkannya mengirim pin yang nyaris tidak bergerak — persis cacat yang Tahap 64 tolak |
| Momen koreografi baru di rute itu      | `/work/<slug>` tetap 1 dari 6, dan Tahap 66 sudah menolak membelanjakannya tanpa subjek. Run bukan momen baru — ia mode lain dari yang sudah ada                                                 |
| Mengarang isi                          | Aturan pemilik: presentasi berubah, isi tidak. Plate fixture bukan isi — ia perancah bertanda `fixture.` yang `--clean` hapus                                                                    |

## 5. Gerbang

| gerbang                     | menuntut                                                             |
| --------------------------- | -------------------------------------------------------------------- |
| **baru** `gallery-run`      | trek melebihi kotaknya, bergerak, reduced-motion terbaca, axe bersih |
| `storybook-a11y`            | story `Run` ikut tersapu                                             |
| `vault/vault-api.test.ts`   | tetap hijau — gerbang Tahap 68                                       |
| `e2e/media-edge.e2e.ts`     | jalur kisi tidak tersentuh; `figure`-nya tetap byte-identical        |
| `e2e/project-spread.e2e.ts` | spread Tahap 66 tetap hijau                                          |
| `e2e/held-screen.e2e.ts`    | tetap hijau — gerbang Tahap 69                                       |
| `contrast.test.ts`          | **tidak berubah** — nol token warna disentuh                         |

## 6. Apa yang tersisa sebelum run tayang di situs

Dua hal, berurutan, dan yang pertama pekerjaan saya bukan Anda:

1. **`media-edge` harus tahu soal run** — §70c. Selama ia menuntut potret lebih
   sempit daripada lanskap di setiap halaman, rute mana pun yang run-nya
   menyala akan merah. Ini tahap tersendiri karena verifikasinya butuh datanya.
2. **Satu proyek dengan empat gambar di dataset.** Itu tulisan ke CMS Anda,
   jadi perintahnya milik Anda:

   ```bash
   bun --env-file .env.local lib/scripts/seed-fixtures.ts          # semai
   bun --env-file .env.local lib/scripts/seed-fixtures.ts --clean  # bersihkan
   ```

Urutannya penting: (2) sebelum (1) memerahkan suite.

## 7. Koreksi terhadap instrumen saya sendiri

Empat kali sapuan awal tahap ini melaporkan sesuatu yang tidak benar, dan
keempatnya ditulis di sini karena saya mengatakannya lebih dulu:

1. **"3 kelas CSS mati"** — `.split-line/-word/-char` di `text-reveal`. Ketiganya
   di dalam `:global()`, nama kelas milik SplitText GSAP sendiri. Pemindai saya
   tidak melewatkan `:global`. **Nol kelas mati** dari 373 kelas di 59 modul.
2. **"`lightbox.run` tidak ada di kamus mana pun"** — ada, di kedua kamus. Saya
   memeriksa namespace `project`, sementara bloknya memakai `lightbox`.
3. **39 ekspor tanpa pemakai luar** — sebagian besar `lib/scripts/` (perkakas
   scaffolding Satūs), `lib/dev/theatre` (khusus dev), dan `tools/oxlint`. Itu
   permukaan pustaka, bukan kode situs. Tidak dijadikan temuan.
4. Ditambah dua dari Tahap 69 yang sudah tercatat di spec-nya.

Aturan yang Tahap 69 §8 tulis berlaku lagi dan berhasil: **angka pertama dari
instrumen baru diperiksa dulu terhadap sumbernya, sebelum dipakai membenarkan
sebuah tahap.** Keempatnya tertangkap sebelum masuk dokumen.
