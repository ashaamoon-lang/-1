# Tahap 100 — Bingkai yang tidak pernah dikomposit

> **Status: terkirim, dan rancangannya gugur di tengah jalan.** Spec ditulis
> lebih dulu sesuai `ROADMAP.md` §3.0. Hipotesis §1.3 — bahwa tangkapan
> terpotong yang tidak mengomposit adalah sebabnya — **dibantah oleh
> perubahannya sendiri** (§7.1), lalu dikembalikan. Yang terkirim adalah
> penjaga atas pembacaannya, bukan atas cara menangkapnya.
>
> Tetap tidak mengklaim flaky-nya tertutup.

---

## 1. Pengukuran

### 1.1 Bukti dari CI, kali ini tersimpan

CI `6eb786e`: **722 lulus / 1 flaky / 14 dilewati**. Flaky-nya kembali ke
gerbang aksen, dan berkat Tahap 98 artefaknya ikut terunggah:

```
visual-substance…-consulting-at-mobile-mobile/accent-reading.json
visual-substance…-consulting-at-mobile-mobile/accent-with.png
visual-substance…-consulting-at-mobile-mobile/accent-without.png
```

Isi `accent-reading.json` dari percobaan yang **gagal**:

```json
"lit":   { "min": 70.28, "p05": 242.92, "mean": 242.45, "p95": 242.92, "max": 254.78, "range": 0 }
"bare":  { "min": 13.28, "p05": 13.35,  "mean": 14.28,  "p95": 15.21,  "max": 15.28,  "range": 1.86 }
"added": { "mean": 228.17, "range": 1.93, "coverage": 1 }
"paint": { "backgroundImage": "linear-gradient(135deg, lab(4.43481 …), oklab(0.26528 …))",
           "opacity": "1", "transform": "none", "scrollY": 0,
           "devicePixelRatio": 3, "curtain": "hidden" }
```

### 1.2 Yang angka itu katakan, dan ia tidak ambigu

Bingkai **ber-aksen** ber-mean **242,45 dari 255 dengan `range` nol** —
nyaris putih dan rata sempurna. Kontrolnya, diambil 600 ms kemudian, **benar**:
14,28, yaitu tanah gelap.

Tidak ada apa pun di halaman itu yang putih. Gradien region-nya resolusi ke
`lab(4.43481 …)`, dan diverifikasi di peramban itu **warna yang sama** dengan
latar tanahnya — hampir hitam. Sebuah bingkai seragam dengan `range` nol juga
tidak mungkin sebuah gradien: gradien, per definisi, punya rentang.

Jadi yang terpotret bukan halaman. Itu tangkapan yang **tidak pernah
dikomposit**.

### 1.3 Dan aturannya sudah tertulis di berkas itu, untuk helper lain

`e2e/visual-substance.e2e.ts`, pada dokumentasi `moved()`:

> _"Full frames cropped afterwards, never `page.screenshot({ clip })`: a
> clipped capture **does not composite WebGL**, which `docs/stages/TAHAP-14.md`
> recorded and Tahap 21 walked into again — the first measurement returned zero
> in both arms, which looked like a finding and was an instrument."_

Gerbang aksen memakai `page.screenshot({ clip })` di kedua lengannya.

Aturan itu ditulis untuk WebGL, dan rute ini **tidak memasang WebGL** —
`live: false` di bukti di atas. Dugaan saya: aturannya berlaku lebih luas, dan
tangkapan terpotong gagal mengomposit lapisan apa pun.

> **Dugaan itu salah, dan §7.1 memuat pengukuran yang membantahnya.** Gerbang
> diubah ke bingkai penuh, bingkai kosong itu **tetap muncul** — kini seragam
> sempurna — dan perubahannya membuat tiap tangkapan 2,7× lebih mahal tanpa
> membeli apa pun. Ia dikembalikan.

### 1.4 Kenapa hanya kadang, dan hanya di satu proyek

```
proyek desktop, DPR 1   0,9 MP per tangkapan    tidak pernah terlihat gagal
proyek mobile,  DPR 3   8,3 MP per tangkapan    gagal, berulang, sejak Tahap 91
```

Dan di laptop ini, dengan DPR 3 yang sama, `range` terukur **8,00** di setiap
penundaan, pada muat segar, di lima run berurutan — jadi ia tidak pernah
tereproduksi di sini. Itu sebabnya empat tahap mengejarnya sebagai soal waktu.

---

## 2. Rancangan

> **Dikoreksi — §7.1.** Rancangan di bawah ini yang dikirim lebih dulu, gugur,
> dan dikembalikan. Yang akhirnya terkirim ada di §2b. Bagian ini ditinggalkan
> utuh karena ia yang menunjukkan apa yang saya kira benar.

Kedua lengan gerbang aksen mengambil **bingkai penuh**, lalu memotongnya
dengan `sharp().extract()` — pola yang `moved()` di berkas yang sama sudah
pakai, dengan komentarnya sendiri sebagai alasan.

Potongannya dalam **piksel perangkat**, jadi ia dikali `devicePixelRatio`.
Sebuah tangkapan terpotong mengembalikan `clip × dpr` piksel, dan potongan ini
mengembalikan kotak yang sama persis — sehingga `tone`, `contribution` dan
`grain` melihat bentuk yang sama dengan yang mereka dikalibrasi terhadapnya.

## 2b. Yang terkirim: penjaga atas pembacaannya

Aksen nyata menyumbang `added.mean` sekitar **8,9** di
`/en/practice/consulting` dan sekitar **5** di `/en`. Bingkai kosong
menyumbang **228**. Dua orde besaran, jadi tidak ada ambang yang rapuh di
antaranya.

```
| added.mean | > 100  ->  tangkapan itu bukan foto halaman ini
                          diambil ulang sekali, sesudah 1200 ms
                          kalau tetap: gagal, dengan pesan yang menyebut
                          "tangkapan yang tidak pernah dikomposit",
                          bukan "halaman yang memutih"
```

Penjaga ini menangkap **kedua** tanda tangan yang terukur — CI 228,17 dan
lokal 228,5 — dan tidak menyentuh pembacaan yang sah, yang jaraknya sepuluh
kali lipat dari ambangnya.

## 3. Daftar berkas

| berkas                                                 | perubahan                                                                                                                                |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `e2e/visual-substance.e2e.ts`                          | penjaga bingkai-kosong pada gerbang aksen: pembacaan di atas `BLANK_FRAME_MEAN` diambil ulang sekali, lalu gagal dengan sebab yang benar |
| `docs/stages/TAHAP-100.md`, `ROADMAP.md`, `HANDOFF.md` | berkas ini, posisi, dan utang §5 ditutup                                                                                                 |

---

## 4. Kriteria keluar

1. **Angkanya tidak bergeser.** `added.range` di laptop ini tetap sekitar 8
   untuk `/en/practice/consulting` dan sekitar 5 untuk `/en`. — **Diperiksa
   saat rancangan §2 masih berlaku, dan terbukti: 8,72 dan 5,00, dengan
   `lit.mean` 22,65 dan `bare.mean` 13,77 cocok sampai dua desimal dengan
   pembacaan sebelumnya.** Rancangan itu kemudian dikembalikan (§7.1), jadi
   kriteria ini tidak lagi mengikat apa pun yang terkirim — tetapi
   pengukurannya sah dan itulah yang menyingkirkan "potongannya salah" sebagai
   penjelasan.
2. Gerbang aksen hijau di kedua profil, dijalankan lebih dari sekali.
3. `bun run build` hijau; tahap `check` satu per satu.
4. **Flaky-nya hanya dinyatakan tertutup oleh beberapa run CI berturut-turut**,
   dan tahap ini tidak menyatakannya.

---

## 5. Risiko

| #   | risiko                                                     | penangkal                                                                                                                                                 |
| --- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Bingkai penuh di DPR 3 lebih mahal daripada yang terpotong | Benar, dan itu harga yang dibayar untuk tangkapan yang benar. Anggaran uji sudah 90 detik sejak Tahap 94, dan §7.2 mencatat durasinya sebelum dan sesudah |
| R2  | Potongan salah, dan angkanya bergeser tanpa disadari       | §4.1 menuntut angkanya diukur, bukan diasumsikan                                                                                                          |
| R3  | Ternyata bukan komposit, dan flaky-nya kembali             | Mungkin. Bukti berikutnya tetap tersimpan (Tahap 98), dan `lit.range = 0` akan tetap jadi tanda tangan yang sama                                          |

---

## 6. Yang tidak dikerjakan, dinyatakan eksplisit

- **Gerbang lain yang memakai `screenshot({ clip })` tidak disapu** — hanya
  gerbang aksen yang punya bukti. Menyapu sisanya tanpa bukti adalah menebak.
- **Flaky tidak diklaim tertutup** — §4.4.
- **Nol angka performa diklaim** — `CLAUDE.md` #19.

---

## 7. Hasil

### 7.1 Rancangan §2 gugur, dan pengukurannya yang membantahnya

Sesudah gerbang beralih ke bingkai penuh, bingkai kosong itu tetap muncul —
dan kali ini **seragam sempurna**:

```
lokal, bingkai penuh   lit min 242.92 ... max 242.92   setiap piksel identik
                       bare mean 14.38                 benar
                       added mean 228.5  range 0  coverage 1
```

Kalau pemotongan adalah sebabnya, ini tidak boleh terjadi. Ia terjadi. Jadi
pemotongan bukan sebabnya.

Dan perubahan itu punya harga yang terukur:

```
viewport   dpr  piksel    bingkai penuh   terpotong
1280x800    3   9,22 MP   16,4-16,9 s     6,7-7,7 s
 390x844    3   2,96 MP    4,3-4,5 s      1,6-1,7 s
```

16,7 detik melampaui tenggat 15 detik yang Tahap 94 turunkan dari biaya
**potongan**, jadi run pertama sesudah perubahan gagal dengan
`TimeoutError: page.screenshot: Timeout 15000ms exceeded` — tenggat itu
bekerja, pada tangkapan yang bukan menggantung melainkan sekadar besar.

Saya menaikkan tenggat ke 45 detik dan anggaran ke 180 detik, lalu bingkai
kosongnya muncul lagi. Pada titik itu jelas bahwa yang saya bayar bukan
perbaikan. Keduanya dikembalikan ke 15 dan 90 detik.

### 7.2 Dan satu kesalahan proses saya, tiga kali

Bukti kegagalan lokal terhapus **tiga kali** karena saya menjalankan ulang
suite sebelum membacanya — Playwright membersihkan `test-results` saat run
berikutnya mulai. Yang menutupnya: menjalankan dan membaca dalam **satu**
perintah, tanpa apa pun di antaranya. Itu sebabnya bukti keempat selamat, dan
bukti keempat itu yang membantah §2.

### 7.3 Hijau, dan diulang

```
gerbang aksen, kedua profil, tiga run berturut-turut   8 lulus, exit 0
durasi                                                 1,3-2,0 mnt per run
berkas bukti tertulis                                  nol
```

### 7.4 Suite lokal penuh: tidak sah sebagai instrumen, dan dikatakan

Run penuh terhadap build Tahap 99 melaporkan **717 lulus / 6 gagal / 14
dilewati** dalam **19,7 jam waktu dinding** — mesinnya tertidur di tengah
jalan. Keenam kegagalannya timeout atau koneksi terputus
(`apiRequestContext.get: read ECONNRESET`,
`Test timeout ... while setting up "page"`), yaitu tanda tangan tautan
peramban-server yang terputus, bukan cacat halaman.

Angka yang mengikat tetap CI: **722 lulus / 1 flaky / 14 dilewati** pada
`6eb786e`.
