# Tahap 42 — Kategori ketiga dinamai, lalu dibelanjakan

> Rencana: Bagian II, Tahap 42. Dial yang dibelanjakan: **MOTION**.
> Prasyarat: Tahap 41 selesai — `07b41d6`.

---

## 1. Cacat D2 — spesifikasi punya lubang berbentuk kategori

`docs/MOTION-SPEC.md` §1 hanya mendamaikan dua hal: CSS dan GSAP. Empat
mekanisme gerak **tayang hari ini** dan tidak satu pun punya entri:

| Mekanisme           | Di mana                                                 | Sejak    |
| ------------------- | ------------------------------------------------------- | -------- |
| `--scroll-velocity` | `components/layout/lenis`, dipublikasikan tiap frame    | Tahap 33 |
| Parallax plat       | `vault/motion/parallax`                                 | Tahap 33 |
| Kursor kustom       | `vault/primitives/cursor`, transform per-frame permanen | fork     |
| Web Animations API  | `vault/motion/flip` (`catalogue-sift`), baris palet     | Tahap 39 |

Keempatnya berbagi satu sifat yang membuat §9.5 tidak bisa menghitungnya:
**tidak punya awal dan akhir.** §9.5 sudah menyelesaikan kasus yang sama untuk
lapisan material dengan alasan yang tepat — _"tidak punya pita, tidak punya
awal dan akhir… Pembaca menjumpainya, bukan menontonnya"_ — dan Tahap 40
menerapkan alasan yang sama lagi untuk `project-spine`.

Tiga pengecualian yang beralasan identik bukan pengecualian; itu **kategori
yang belum dinamai**. Spesifikasinya tidak perlu dilanggar — ia perlu menyebut
apa yang sudah dipraktikkannya tiga kali.

Dua cacat dokumen yang lebih kecil ikut ditutup:

- **§7 tidak menggambarkan yang dikirim.** Ia menulis _"Under reduced motion:
  cross-fade only, ~200 ms"_; `page-transition.module.css` menghapus overlay
  sepenuhnya. Ia menulis anggaran 800–1200ms; yang dikirim `--duration-fast`
  keluar dan `--duration` masuk.
- **§11 berada sebelum §10 di dalam berkas.** Nomornya benar, urutannya tidak.

---

## 2. Yang berubah dari rencana, dengan alasannya

### 2.1 `velocity-marquee` sudah ada — ia hanya tidak punya rumah

Rencana meminta modul baru `vault/motion/velocity-marquee`.
`components/ui/marquee` **sudah** melakukan hampir seluruhnya, dan sudah
benar pada hal-hal yang sulit:

- berjalan di `useTempus({ order: 6 })` — di dalam loop yang sama, bukan loop
  RAF kedua (`CLAUDE.md` #6);
- sudah membaca `lenis.velocity` dan melipatnya ke kecepatan dasar;
- `useIntersectionObserver` menghentikannya saat di luar layar;
- menulis `translate3d` saja, tidak pernah layout.

Yang **tidak** ia punya: satu pun konsumen, dan satu pun baris
`prefers-reduced-motion`. Menulis modul kedua yang melakukan hal yang sama
adalah persis cacat yang Tahap 27 hilangkan saat mengekstrak
`useActiveInSequence` — "mekanisme yang hidup di satu halaman adalah
pengecualian, bukan kosakata".

Jadi: **beri ia rumah dan beri ia blok reduced-motion.** Nol modul baru.

### 2.2 `sticky-stack` ditolak, dan alasannya bukan biaya

Rencana menyebut dua rumah, dan **keduanya sudah ditempati mekanisme yang
lebih cocok**:

- **Kartu praktik beranda** adalah `<details>`/`<summary>` — pengungkapan yang
  dibuka di tempat, dipilih justru karena bekerja tanpa JavaScript
  (`practice-list` §"Why native `<details>`"). Menumpuknya berarti dua
  interaksi bersaing pada satu elemen: kartu yang menutupi tetangganya
  _sekaligus_ bisa dibuka.
- **`step-sequence`** sudah punya kolom yang disematkan plus indeks yang
  ditahan — versi yang sudah dipertimbangkan dari ide yang sama, dinamai
  `studio-process`, dan `/studio` sudah **di plafon** §9.5 dengan dua momen.

Tidak ada rumah ketiga yang masuk akal: `/practice/<v>`, galeri proyek dan
entri jurnal masing-masing sudah punya bentuknya sendiri.

Menumpuk demi menumpuk adalah efek yang mencari halaman — persis yang Bagian
IV rencana ini sendiri tolak sebagai _"efek baru di halaman yang belum punya
isi"_, dan yang `CLAUDE.md` tutup dengan **do less, and do it more
precisely**. Ditolak, tercatat, bukan dilewatkan diam-diam.

### 2.3 `counter` dipindahkan ke tempat yang membuatnya beralasan

Rencana meminta hitungan katalog menghitung naik saat masuk viewport. Uji
`taste-skill` yang rencana ini sendiri jadikan batu uji — _apa yang
dikomunikasikan gerak ini? Jawaban sah: hierarki, narasi, umpan balik,
transisi status_ — **tidak dilewati** oleh versi itu: angka yang merayap dari
0 ke 6 saat halaman dibuka tidak mengatakan apa pun yang "6" statis tidak
katakan. Itu dekorasi.

Angka yang sama **berubah** saat pembaca menyaring: 6 → 2. Menghitung di
antara dua keadaan itu adalah **transisi status**, jawaban yang sah, dan ia
berpasangan dengan `catalogue-sift` yang sudah menganimasikan kisinya. Gerak
yang sama, dipindahkan ke momen yang memotivasinya.

---

## 3. Yang dibangun

### 3a — kategori ketiga dinamai

`MOTION-SPEC.md` §1 menyebut **tiga** kategori:

1. **Micro / standard** — 150–600ms, pita §2, kosakata sehari-hari.
2. **Berkoreografi** — 800–1200ms, dihitung §9.5, maksimal dua per halaman,
   **wajib bernama** di DOM.
3. **Respons berkelanjutan** — diatur §11, **tidak dihitung**, karena tidak
   punya awal dan akhir.

Aturan kategori ketiga, **lebih ketat** justru karena selalu berjalan:

- hanya `transform` dan `opacity`;
- tidak pernah pada prosa;
- tidak pernah pada elemen yang difoto `<ViewTransition>`;
- **mati total** di bawah `prefers-reduced-motion` — bukan diperlambat;
- sumber sinyalnya wajib `--scroll-velocity`, ScrollTrigger, atau observer
  yang sudah ada. **Nol loop RAF kedua** (`CLAUDE.md` #6).

Keempat mekanisme di §1 dicatat surut, §7 diselaraskan dengan yang dikirim,
dan §11 dipindah setelah §10.

### 3b — marquee mendapat rumah

Strip wordmark di footer, di atas kolomnya. Satu per halaman, tidak pernah dua
(aturan `taste-skill`). Ditambah blok `prefers-reduced-motion` yang komponen
itu tidak pernah punya: strip diam, teks terbaca penuh.

### 3c — counter, pada transisi status

`vault/motion/counter` menghitung dari nilai sebelumnya ke nilai baru saat
hitungan katalog berubah, **400ms**, `--ease-out-quart`,
`font-variant-numeric: tabular-nums` supaya lebarnya tidak bergoyang. Pada
muat pertama tidak ada nilai sebelumnya dan angkanya langsung benar. Reduced
motion: langsung, selalu.

---

## 4. Gerbang

`e2e/continuous-motion.e2e.ts`, diperluas — merah dulu:

1. **Marquee bergerak** saat halaman digulir, dan **diam** di bawah reduced
   motion, dengan teksnya terbaca penuh di keduanya.
2. **Tepat satu marquee per halaman.**
3. **Jumlah loop `requestAnimationFrame` aktif tetap satu** — asersi yang
   melindungi seluruh kategori ketiga sekaligus.
4. **Counter mendarat pada angka yang benar** di kedua mode gerak.

---

## 5. Risiko

- Footer dirender di setiap rute. Marquee di sana berarti `route-budget`,
  `route-sweep` dan `taste-preflight` semuanya melihatnya di sebelas halaman.
- Footer duduk di bawah kanvas di dua rute (Tahap 22); strip yang bergerak di
  sana harus tetap terbaca.
- `Marquee` menduplikasi anaknya `repeat` kali dengan `aria-hidden` — axe dan
  hitungan teks pada gerbang lain akan melihat teks ganda.

---

## 6. Hasil

### 6.1 Yang dikirim, diukur pada build produksi

|                                     | Normal                                | Reduced motion |
| ----------------------------------- | ------------------------------------- | -------------- |
| Wordmark bergerak saat digulir      | **ya**                                | **tidak**      |
| Strip per halaman                   | 1                                     | 1              |
| Hitungan katalog, sesudah menyaring | `6 engagements` → **`2 engagements`** | `6` → **`2`**  |

Di kedua mode angkanya mendarat benar dan stripnya tetap terbaca —
`CLAUDE.md` #5: hasilnya tidak pernah bergantung pada animasinya berjalan.

### 6.2 Tiga koreksi terhadap rencana

**`velocity-marquee` tidak ditulis.** `components/ui/marquee` sudah melakukan
bagian yang sulit dan sudah benar: `useTempus({ order: 6 })` di dalam loop
yang sama, `lenis.velocity` sudah dibaca, `IntersectionObserver` menghentikan
saat di luar layar, dan `translate3d` saja. Yang tidak ia punya adalah
konsumen dan satu pun baris reduced-motion. Menulis modul kedua yang
melakukan hal yang sama persis cacat yang Tahap 27 hilangkan.

**`sticky-stack` ditolak, dengan buktinya.** Kedua rumah yang rencana sebut
sudah ditempati mekanisme yang lebih cocok — kartu praktik adalah `<details>`
yang dibuka di tempat, dan `step-sequence` sudah punya kolom tersemat plus
indeks tertahan dengan `/studio` di plafon §9.5. Menumpuk demi menumpuk adalah
efek yang mencari halaman. §2.2 menuliskannya.

**`counter` dipindahkan.** Versi rencana — menghitung naik dari nol saat masuk
viewport — **tidak lulus** uji `taste-skill` yang rencana ini sendiri jadikan
batu uji. Angka yang sama berubah saat pembaca menyaring, dan menghitung di
antara dua keadaan itu adalah transisi status. Geraknya tidak perlu dipotong;
ia perlu dipindah ke momen yang memotivasinya.

### 6.3 Dua cacat ditangkap saat menulis, bukan sesudah

**Fungsi menyeberangi batas RSC.** `Counter` mula-mula menerima
`format: (value: number) => string`. `catalogue.tsx` adalah Server Component,
dan fungsi tidak bisa diserahkan ke komponen klien — **typecheck lulus**, dan
build akan gagal. Diganti dengan `labels: readonly string[]` yang dihitung di
server. Bentuknya juga yang lebih benar: kalimatnya di-pluralkan, jadi
menyusunnya di klien berarti mengirim aturan plural next-intl ke browser
untuk mengucapkan angka yang server sudah tahu cara mengucapkannya.

**Ukuran tipe keempat.** `.wordmarkWord` sempat membawa `font-size` sendiri,
dan gerbang tipe Tahap 37 menolaknya seketika dan dengan benar: ukuran display
keempat yang dikarang untuk satu strip persis drift yang gerbang itu ada untuk
hentikan. Wordmark adalah teks berukuran display; `h1` **adalah** teks
berukuran display. Utilitasnya dipakai, CSS-nya menyusut.

### 6.4 Dokumen

- **§0 baru** menamai tiga kategori, mencatat empat mekanisme yang selama ini
  tayang tanpa entri, dan memberi kategori ketiga enam aturan yang lebih ketat
  justru karena ia tidak pernah berhenti — termasuk larangan memakainya
  sebagai celah untuk menghindari anggaran §9.5.
- **§7 sekarang menggambarkan yang dikirim**, bukan yang diniatkan: tabel
  empat fase dari `page-transition.module.css`, dan koreksi bahwa reduced
  motion **menghapus** overlay alih-alih me-cross-fade-nya — cross-fade yang
  dokumen itu janjikan tidak pernah ada.
- **§11 dipindah setelah §10.** Nomornya benar, urutannya tidak.

### 6.5 Regresi nyata yang ditangkap suite, dan akar yang sebenarnya

Jalan penuh pertama: **11 gagal**. Sepuluh di antaranya satu gerbang; satu
adalah regresi perilaku yang nyata.

**Sepuluh — cacat instrumen di gerbang saya sendiri (Tahap 34).**
`taste-preflight` menghitung marquee dengan
`document.querySelectorAll('[class*="marquee"], [data-marquee]')`. CSS Modules
menaruh **nama berkas sumber** ke dalam setiap kelas yang ia hasilkan, jadi
`.inner` milik marquee itu sendiri cocok dengan nama modulnya sendiri: satu
strip dengan empat pengulangan melaporkan **lima** marquee. Gerbang itu
mengukur stylesheet, bukan halaman.

`Marquee` sekarang menandai dirinya `data-marquee` dan gerbang menghitung akar.
Jaringnya tidak dilepas — asersi kedua menuntut **nol** elemen berbentuk
marquee yang berada di luar akar bertanda, jadi implementasi kedua tetap
tertangkap.

**Satu — `covering` tidak pernah tergambar pada navigasi Back.**
`journey.e2e.ts` melaporkan `revealing:history, idle:history` tanpa
`covering`. Tiga langkah untuk memisahkan instrumen dari cacat:

1. **Instrumennya diperbaiki dulu.** Prob lamanya mem-poll `data-state` sekali
   per frame; fase cover pada navigasi histori adalah `--duration-micro`
   (150ms), yang terpendek di situs. Diganti `MutationObserver`, yang menyala
   **pada penulisan atributnya** dan karena itu tidak bisa melewatkan fase.
2. **Instrumen barunya tetap merah** — jadi cover memang benar-benar tidak
   pernah tergambar.
3. **Diisolasi dengan pengukuran, bukan tebakan.** Perubahan sumber
   di-`git stash`, prob barunya dipertahankan, build ulang: **lulus**. Jadi
   penyebabnya perubahan tahap ini, bukan probnya.

Akar sebenarnya **bukan** marquee-nya. `page-transition/index.tsx` sudah
mendokumentasikan tabrakan ini sejak Tahap 16a: kalau `covering` dan
`revealing` mendarat di satu commit React, atributnya melompat `idle` →
`revealing` dan **cover tidak pernah tergambar**. Perbaikan waktu itu
memindahkan sinyal ke Navigation API yang menyala ~14ms lebih awal — dan
komentarnya sendiri menyebut kelemahannya: _"the two states are far enough
apart" is a timing assumption_.

Tahap 42 menagih asumsi itu. Menambah satu konsumen per-frame ke footer —
yang dirender setiap rute — cukup untuk menutup celahnya.

**Perbaikannya membuat tabrakan itu tidak bisa terjadi**, bukan membuatnya
lebih kecil kemungkinannya: reveal menunggu sisa dari `MIN_COVER` (32ms, dua
frame) sejak cover naik. Cover yang sudah lebih lama dari itu — kasus normal —
tidak mendapat penundaan sama sekali.

Ditulis dengan `setTimeout`, bukan `requestAnimationFrame`: gerbang gerak
proyek ini menolak rAF telanjang di luar `lib/dev/` dan `lib/scripts/` —
dengan benar, karena begitulah loop kedua masuk — dan berkas itu sudah memakai
dua timer untuk dua jaring lainnya. Timer juga lebih tahan: rAF di-throttle di
tab latar belakang, dan navigasi yang dimulai sebelum tab disembunyikan akan
tertutup sampai ia kembali.

**Ini perbaikan yang membuat §9.4 aturan 7 benar**, bukan hanya mungkin:
navigasi histori memang berpakaian, dan keadaan yang tidak pernah tergambar
bukan pakaian.

### 6.6 Gerbang

Dijalankan terhadap build produksi segar (`rm -rf .next && bun run build &&
bun run start`), suite penuh, bukan hanya berkas yang disentuh — persis karena
regresi §6.5 hidup di `journey.e2e.ts`, berkas yang tidak satu pun perubahan
Tahap ini sebut.

```
bun run build            ✅
bun run build-storybook  ✅  (exit 0)
bun run check            ✅  oxlint · oxfmt · tsc · unit 458 lulus, 0 gagal ·
                             plugin anti-slop · manifest · assets
CI=true bun run test:e2e ✅  518 lulus, 0 gagal, 16 dilewati (11,2 menit)
```

**515 → 518, dan ketiganya adalah tiga asersi baru Tahap ini** — bukan
kebetulan aritmetika: `e2e/continuous-motion.e2e.ts` bertambah tepat tiga
(strip bergerak dan hanya ada satu; reduced motion mendiamkannya dan ia tetap
terbaca; angka menghitung antar keadaan filter). Sisa 515 adalah angka Tahap
41, tidak berubah, jadi tidak ada gerbang lama yang dilonggarkan atau
dilewati untuk mendapatkan yang baru.

Empat berkas yang menyentuh perubahan Tahap ini dijalankan ulang secara
terarah lebih dulu (`journey`, `taste-preflight`, `continuous-motion`,
`motion`): **95 lulus**. Itu yang mengonfirmasi perbaikan §6.5; suite penuh
yang mengonfirmasi tidak ada yang lain ikut rusak.

**Yang tidak diukur, dan dikatakan di sini alih-alih didiamkan:** tidak ada
profil browser di lingkungan ini, jadi klaim "strip berjalan pada 60fps"
tidak dibuat. Yang diukur adalah **posisi**: `getBoundingClientRect().x` dari
anak pertama strip pada dua sampel terpisah, dan jumlah loop
`requestAnimationFrame` yang aktif (tetap satu). Biaya frame sebenarnya
adalah anggaran, bukan pengukuran (`CLAUDE.md` #19).
