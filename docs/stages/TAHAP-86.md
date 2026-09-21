# Tahap 86 — Setengah yang ditinggal sendirian di beranda

> **Status: terkirim.** Spec ditulis lebih dulu sesuai `ROADMAP.md` §3.0;
> diamandemen dua kali saat implementasi (§1.5, §3), hasilnya di §7.
>
> Dilaporkan pemilik repo dengan screenshot beranda: _"ada grid yang hilang
> (tidak proporsional dan tidak estetis)"_.

---

## 1. Pengukuran

### 1.1 Lubangnya, di seluruh sitemap

Setiap `ul[data-layout]` di setiap rute sitemap, 1600×900 dan 1440×900,
dikelompokkan per baris:

```
1600  /en   editorial  [6 | 12 | 6+6]   kartu pertama menyisakan 787 px kosong
1600  /id   editorial  [6 | 12 | 6+6]   787 px
1440  /en   editorial  [6 | 12 | 6+6]   707 px
1440  /id   editorial  [6 | 12 | 6+6]   707 px
```

787 px di 1600 adalah persis yang terlihat di screenshot pemilik repo: kartu
"Arus Balik" ~776 px dan tanah kosong di sebelahnya.

### 1.2 Katalog tampak rusak di instrumen pertama saya, dan tidak rusak

Pembacaan pertama menandai `/work` dan `/practice/*` juga — setiap kartu
"sendirian di barisnya". Instrumennya yang salah: ia mengelompokkan baris
berdasarkan `top` yang persis sama, sedangkan katalog sengaja menggeser
`margin-block-start` per `data-offset` (Tahap 44). Diukur ulang dengan posisi
x dan tepi bawah:

```
x=0    w=771  top= 606  bottom=1681      x=787  w=771  top= 659  bottom=1681
x=0    w=771  top=1804  bottom=2826      x=787  w=771  top=1697  bottom=2826
x=0    w=771  top=2895  bottom=3970      x=787  w=771  top=2948  bottom=3970
```

Setiap pasangan berbagi baris. **Cakupan tahap ini hanya grid editorial.**
Gerbangnya karena itu mengukur tumpang-tindih vertikal, bukan `top` yang sama —
pelajaran dari instrumen yang salah membaca dirinya sendiri.

### 1.3 Sebabnya

`vault/blocks/project-grid` pada tata letak `editorial` mengambil lebar kartu
langsung dari `project.span` — field per proyek di CMS, 6 atau 12 — tanpa
simulasi baris. Fixture beranda (`featured`, `order asc`):

```
arus-balik 6 · pusat-beban 12 · bacaan-mesin 6 · takar 6
```

Nilai ini tidak berubah sejak Tahap 12a (`24db8af`, 2026-09-01). Lubangnya
bukan regresi: ia sudah ada sejak grid itu pertama dibuat.

### 1.4 Repo sudah pernah memecahkan persoalan yang sama

`vault/blocks/project-gallery` punya `loneHalves()` (Tahap 66), yang
menyimulasikan aliran 12 kolom dan melaporkan setengah yang sendirian di
barisnya. Komentarnya merekam cacat berbentuk sama pada galeri: `half, full,
half` meninggalkan 572 px di samping tiap gambar. Perbaikan itu tidak pernah
sampai ke grid beranda.

### 1.5 Temuan kedua, dari melihat hasilnya: WebGL meregang karya

Sesudah kartu Arus Balik dinaikkan, kubahnya tampak **pipih** di layar —
lebar:tinggi sekitar 2.8, padahal di kartu setengahnya 1.27. Memotong dengan
`object-fit: cover` tidak mengubah proporsi bentuk; ia hanya memotong. Jadi
dilacak:

- Dengan lapisan WebGL disembunyikan, kartu itu gelap seluruhnya — gambar DOM
  sudah diserahkan ke kanvas. Yang tampil adalah tekstur yang digambar
  `vault/webgl/material-image`.
- Fragment shader-nya: `texture2D(uTexture, vUv + …)`, dengan `vUv` 0–1
  membentang di plat dan mesh diskalakan ke `rect.width × rect.height`. **Tidak
  ada koreksi rasio.** `<img>` yang ia gantikan memakai `object-fit: cover`;
  shader tidak.
- Rasio kotak dibagi rasio aset: 1.646 / 0.800 = **×2.06**. Rasio kubah
  berubah ×2.2. Cocok.

Lalu diukur di setiap kartu yang digambar material, rasio aset berbanding rasio
kotak:

```
/en/work   Pusat Beban   aset 1.778  kotak 0.800   tergencet ke 45%
           Pelabuhan     aset 1.500                 53%
           Lantai Dua    aset 1.333                 60%
           Bacaan Mesin  aset 1.000                 80%
           Takar         aset 0.667                 teregang 120%
/en        Bacaan Mesin, Takar — sama, sebelum tahap ini menyentuh apa pun
```

Dibandingkan dengan file sumbernya dari CMS: kubah Pusat Beban **bulat** di
sumber (≈1.33), dan digambar sebagai **elips sempit** (≈0.53) di `/en/work`.

**Ini cacat yang sudah tayang, bukan yang dibuat tahap ini.** Ia tidak pernah
terlihat selama setiap sampul kebetulan cocok dengan kartunya. Pembaca tanpa
WebGL (reduced motion) melihat potongan yang benar sejak awal, karena
`<img>`-nya benar. Tidak ada gerbang yang pernah bertanya: gerbang material
menanyakan apakah kanvas ada, menggambar, bergerak, dan meninggalkan lubang —
bukan apakah bentuk yang digambarnya benar.

Dan ia mengikat tahap ini: menaikkan Arus Balik tanpa memperbaikinya akan
meregangnya ×2.06, lebih buruk dari lubangnya. Pemicu **T8** — perbaikannya
menuntut berkas di luar daftar §3, artinya pemahaman awal kurang. Daftarnya
diamandemen di bawah, dengan sebab tertulis lebih dulu.

---

## 2. Keputusan: dinaikkan ke bentuk penuh, bukan diisi teks

Galeri mengisi separuh kosong dengan **catatan gambar itu sendiri**, dan
gambarnya tidak dilebarkan. Bentuk itu tidak bisa dipakai jujur di sini:

- Kartu proyek hanya membawa judul, `engagement`, `client`, dan tahun — dua
  baris yang sudah tampil di bawah gambarnya.
- Satu-satunya teks tambahan di skema adalah `outcome` (Tahap 79), dan fixture
  tidak mengisinya.

Mengisi separuh kosong berarti dua baris di dasar sel setinggi ~970 px — masih
kosong — atau teks yang dikarang. Yang kedua dilarang (_"Konten tidak
diciptakan"_).

Jadi setengah yang sendirian **dinaikkan ke bentuk penuh milik sistem kartu itu
sendiri**: 12 kolom, potongan 16:9, `sizes` yang sesuai. `media-edge.e2e.ts`
menuntut karya duduk di paling banyak dua lebar; beranda sudah memakai
keduanya, jadi tidak ada lebar ketiga.

**Urutan tidak diubah.** Menarik setengah berikutnya ke atas akan mengubah
keputusan editor, dan memisahkan urutan visual dari urutan baca (WCAG 1.3.2).

### 2.1 Satu lintasan sudah titik tetap

Setengah hanya "sendirian" bila item berikutnya tidak muat di barisnya (sebuah
penuh) atau memang tidak ada. Versi penuhnya karena itu mengisi persis barisnya
sendiri, dan tidak menggeser baris lain. Diuji, bukan diklaim: hasilnya
dimasukkan lagi dan harus identik, dan `loneHalves` atas hasilnya harus kosong.

---

## 3. Daftar berkas

| berkas                                                | perubahan                                                                                    |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `lib/utils/grid-flow.ts`                              | **baru** — `loneHalves` dipindah ke sini, modul murni                                        |
| `vault/blocks/project-gallery/index.tsx`              | mengimpor dan mengekspor ulang `loneHalves`, supaya uji dan pemanggil yang ada tidak berubah |
| `lib/utils/grid-flow.ts` (lanjutan)                   | `settledSpans()` juga tinggal di sini — lihat catatan di bawah tabel                         |
| `vault/blocks/project-grid/index.tsx`                 | memakai `settledSpans()` untuk tata letak `editorial`                                        |
| `lib/utils/grid-flow.test.ts`                         | **baru** — urutan beranda, titik tetap, dan nol setengah sendirian                           |
| `e2e/grid-rows.e2e.ts`                                | **baru** — gerbang geometris, menyusuri sitemap                                              |
| `vault/webgl/material-image/scene.tsx`                | faktor _cover_ dari rasio tekstur dan rasio plat — §1.5                                      |
| `vault/webgl/material-image/shaders.ts`               | sampel tekstur lewat faktor _cover_, dipusatkan seperti `object-fit: cover`                  |
| `e2e/material-shape.e2e.ts`                           | **baru** — gerbang bentuk: render lebih dekat ke potongan daripada ke regangan               |
| `COMPONENTS.md`                                       | di-generate — lihat catatan                                                                  |
| `docs/stages/TAHAP-85.md`                             | §7.8: perbandingan CI yang dijanjikan tahap itu                                              |
| `docs/stages/TAHAP-86.md`, `ROADMAP.md`, `HANDOFF.md` | berkas ini dan posisi                                                                        |

**`COMPONENTS.md` ditambahkan ke daftar ini saat implementasi.** Ia
di-generate dari ekspor `lib/utils/`, dan `bun run manifest:check` menolaknya
begitu modul baru ada — risiko R3, yang memang tertangkap di sana. Diff-nya
delapan baris: satu bagian `Grid-flow` dengan tiga ekspornya.

**Diamandemen saat implementasi.** Versi pertama daftar ini menaruh
`settledSpans()` di `project-grid/index.tsx` dan ujinya di
`project-grid.test.ts`. Uji itu gagal sebelum berjalan: mengimpor blok itu di
Bun menyeret `ProjectCard`, yang rantainya memakai `ViewTransition` dari React —
ekspor yang tidak ada di build React untuk uji (`SyntaxError: Export named
'ViewTransition' not found`). Fungsinya murni, jadi ia pindah ke modul murni
bersama `loneHalves`, dan ujinya ikut. Uji galeri tidak terkena karena galeri
tidak menyentuh rantai itu.

Kenapa modul baru dan bukan impor langsung dari galeri: `project-gallery`
mengimpor `Horizontal`, `PixelImage`, parallax, lightbox, dan `next-intl`.
Grid beranda tidak boleh bergantung pada modul itu demi satu fungsi murni —
anggaran KB `/en` dijaga `route-budget.e2e.ts`.

---

## 4. Kriteria keluar

1. Di setiap rute sitemap, 1440 dan 1600, **nol** kartu setengah lebar yang
   tidak bertumpang-tindih vertikal dengan kartu lain.
2. Gerbang terbukti **merah lebih dulu** terhadap kode hari ini (`/en`, `/id`).
3. Katalog tidak berubah — pasangannya tetap berbagi baris.
4. `media-edge`, `route-budget`, `first-screen`, `composition-density` tetap
   hijau.
5. Dilihat dengan mata di 1600×900.

---

## 5. Risiko

| #   | risiko                                           | penangkal                                                                |
| --- | ------------------------------------------------ | ------------------------------------------------------------------------ |
| R1  | Potongan 16:9 memotong komposisi sampul potret   | Dilihat dengan mata; sampul adalah plat fixture, dan JEDA 3 menggantinya |
| R2  | Editor memilih `span: 6` dan melihat kartu penuh | Dinyatakan di komentar komponen; skema tetap mengizinkan 6               |
| R3  | `vault-api` / manifest menolak ekspor baru       | `bun run check` menjalankan `manifest:check`                             |

---

## 6. Yang tidak dikerjakan, dinyatakan eksplisit

- **Tidak ada teks yang ditambahkan ke kartu** — §2.
- **Data fixture tidak diubah.** Lubang ini tidak boleh bergantung pada
  editor yang kebetulan memilih urutan yang benar; perbaikannya di komponen.
- **Nol angka performa diklaim** — `CLAUDE.md` #19.

---

## 7. Hasil

### 7.1 Lubang grid: merah dulu, lalu hijau

`e2e/grid-rows.e2e.ts` terhadap kode sebelum perbaikan:

```
1600 /en: editorial card 1 "Arus Balik..." leaves 787px empty
1600 /id: editorial card 1 "Arus Balik..." leaves 787px empty
1440 /en: ... 707px      1440 /id: ... 707px
```

Katalog **tidak** ditandai — cek tumpang-tindih vertikal membaca pasangan
berselang dengan benar, yang instrumen pertama saya tidak (§1.2). Sesudah
perbaikan: lulus, dan beranda di 1600 adalah

```
span=12 x=16 w=1558 | span=12 x=16 w=1558 | span=6 x=16 w=771 + span=6 x=803 w=771
```

`lib/utils/grid-flow.test.ts`: urutan beranda, urutan yang sudah berpasangan
tidak disentuh, setengah di ekor, span kosong, dan **setiap urutan sampai enam
kartu — 127 — tanpa setengah sendirian dan merupakan titik tetap**.

### 7.2 Bentuk karya: merah dulu, lalu hijau

`e2e/material-shape.e2e.ts` terhadap build yang sudah menaikkan kartu tetapi
belum memperbaiki shader — setiap kartu yang ditanya lebih dekat ke regangan:

```
/en/work  Pusat Beban   x0.39   cover 25.1  vs  stretch  6.1
/en/work  Pelabuhan     x0.49   cover 18.7  vs  stretch 10.7
/en/work  Lantai Dua    x0.53   cover 23.2  vs  stretch 14.2
/id       Arus Balik    x2.06   cover 21.1  vs  stretch  8.5
          (+ Bacaan Mesin, dan kembarannya di /id: 11 kartu, 11 merah)
```

Sesudah perbaikan, dengan ambang akhir 0.3:

```
/en/work  Pusat Beban   cover  7.6  vs  stretch 22.7
/en/work  Pelabuhan     cover 10.1  vs  stretch 17.2
/en/work  Lantai Dua    cover 14.8  vs  stretch 19.6
/id       Arus Balik    cover  8.7  vs  stretch 17.7
/id/work  (tiga yang sama)
          margin terkecil keseluruhan: 4.8, Lantai Dua /en/work
```

Ambangnya dinaikkan dari 0.25 ke 0.3 **sesudah** run hijau pertama, karena
Bacaan Mesin (×0.73) menang hanya 18.5 lawan 20.2 — cukup tipis untuk diputus
oleh drift shader dan grain. Gerbangnya lalu dijalankan ulang dengan nilai
akhirnya; ia tidak dikirim dengan angka yang belum pernah berjalan.

Dan dilihat dengan mata: kubah Pusat Beban di `/en/work` kembali bulat,
dipotong dari tengah; kubah Arus Balik di kartu penuh beranda bulat, bukan
pipih.

### 7.3 Regresi: 10 merah, dipilah

Sembilan belas spec — grid, kartu, lapisan material, WebGL, dan sapuan rute —
`--workers=2`:

```
190 lulus · 10 gagal · 15 dilewati    (215, 19.7 mnt)
```

| kelompok                                                                                                | isolasi                                           | putusan                                 |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------- |
| `material-layer:99` "no plate is ever a blank box", `catalogue-layout:273` sift (desktop)               | **2 lulus**, `--workers=1`                        | beban mesin                             |
| `route-sweep` `/en` + `/id`, `visual-substance:742` "/en renders its work", `:178` aksen `/en` (mobile) | **4 lulus**, `--workers=1`                        | lihat bawah                             |
| `visual-substance:602` footer x4 (mobile)                                                               | anggaran 150 s: **4 lulus**, 6 melewatkan dirinya | anggaran screenshot, §7.8 `TAHAP-85.md` |

`route-sweep` gagal karena sebuah resource menjawab **500**, dan log server
menyebut sebabnya: `upstream image response timed out` — optimizer gambar Next
tidak mendapat jawaban dari `cdn.sanity.io` tepat waktu. URL-nya mencakup
hampir setiap sampul di dataset, bukan hanya kartu yang dinaikkan, dan
`visual-substance:742` ("0 images") adalah gejala yang sama dari sisi lain.
Jaringan laptop ini ke CDN Sanity, di bawah beban suite.

`material-layer:99` membaca _"plate 0 is marked active but is not handed
over"_ — plat 0 di beranda adalah kartu yang tahap ini naikkan, jadi ia diisolasi
lebih dulu, bukan dimaafkan. Sendirian ia lulus.

### 7.4 Log perpindahan mode

```
E->R  T6  instrumen pertama menandai setiap kartu katalog sendirian;
          diukur ulang dengan x dan tepi bawah: pasangan berbagi baris
R->E  sebab: pengelompokan berdasarkan `top` yang sama salah untuk grid berselang
E->R  T8  kubah Arus Balik pipih sesudah dinaikkan; shader tanpa koreksi rasio
R->E  sebab tertulis di §1.5, daftar berkas diamandemen, gerbang merah lalu hijau
E->R  T1  regresi 10 merah
R->E  sebab: beban mesin (6 hijau sendirian), timeout CDN di log server,
          anggaran screenshot footer (4 hijau dengan waktu)
```

### 7.5 Gerbang lain

```
bun run check    597 lulus, 0 gagal   (591 + 6 uji grid-flow)
bun run build    hijau
```

### 7.6 Yang tidak dikerjakan, dinyatakan eksplisit

- **Arus Balik di `/en` tidak pernah ditanya `material-shape`**, di run mana
  pun — hanya kembarannya di `/id`. Gerbang itu melewati plat yang belum
  melaporkan `data-material` dalam 6 detik, dan itu bentuk yang sama dengan
  gerbang yang melewati dirinya sendiri di `HANDOFF.md` §5.1. Penjaga
  anti-vakumnya (minimal satu kartu ditanya) mencegah run kosong, tetapi tidak
  mencegah satu kartu tertentu lolos dari pertanyaan. Dicatat, tidak ditutup.
- **Tidak ada teks yang ditambahkan ke kartu** — §2.
- **Data fixture tidak diubah** — §6.
- **Nol angka performa diklaim** — `CLAUDE.md` #19. Faktor _cover_ dihitung per
  frame (dua pembagian); biayanya tidak diukur.
