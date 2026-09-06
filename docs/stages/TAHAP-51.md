# Tahap 51 — `/work`: masthead yang menyebut dirinya, dan kisi yang tidak jadi turun

> Rencana punya empat butir untuk tahap ini. **Satu benar, tiga salah**, dan
> yang benar itu yang paling kecil. Ketiga koreksinya bukan pengurangan
> cakupan — dua di antaranya mencegah mengirim gerak yang tidak akan ada yang
> melihat.
>
> Lalu butir yang benar itu **dikirim salah**, dan suite e2e penuh yang
> menemukannya — §4a. Dokumen ini menulis keduanya.

## 1. Baseline, diukur

Build produksi, `HEAD` sesudah Tahap 50, 1440×900:

|                 |                                        `/en/work` |        `/en/work/arus-balik` |
| --------------- | ------------------------------------------------: | ---------------------------: |
| Dokumen         |                           4395px = **4,88 layar** |      4193px = **4,66 layar** |
| Hero / masthead |                            **192px = 0,21 layar** |       **857px = 0,95 layar** |
| `data-epic`     | `catalogue-sift`, `work-transport` — **2 dari 3** | `project-arrival` — 1 dari 2 |
| Gambar · kanvas |                                             6 · 1 |                        4 · 1 |

## 2. Empat premis, satu benar

### 2.1 ✅ `/work` masthead memang tipis

Rencana menulis "hero `/work`: nol → 72svh". Bukan nol — **192px, 0,21 layar**
— tapi arahnya benar. Katalog ini mengumumkan dirinya dalam seperlima layar
lalu menumpahkan enam sampul. Ini satu-satunya premis tahap ini yang bertahan
setelah diukur.

### 2.2 ❌ `/work/<slug>` hero **sudah** 0,95 layar

Rencana menulis "nol → 80svh". Terukur **857px dari 900px**. Tidak diubah.

### 2.3 ❌ `pixel-image` tidak punya rumah, dan tidak akan pernah punya di sini

Ditunda dari Tahap 49 ke sini dengan alasan "`/work/<slug>` punya plate proyek
yang nyata". Plate itu memang ada — dan sejak Tahap 45 ia
**`vault/webgl/material-image`**.

`MaterialImage` menyembunyikan gambar DOM begitu mesh melaporkan sudah
melukis (gerbang `drew`, `TAHAP-14.md` §2). Sebuah pixel-reveal pada gambar
itu adalah animasi yang berjalan di bawah permukaan yang menggantikannya —
**gerak yang tidak ada yang melihat**, dan cara termahal untuk menambah berat.

Kartu katalog di `/work` juga `material`. Jadi kedua rute yang rencana ini
sebut sudah dimiliki lapisan material, dan tidak ada rute ketiga dengan plate
non-material yang cukup penting untuk membayar komponen baru.

**Ditolak, bukan ditunda lagi.** Menundanya ketiga kali adalah cara sebuah
item berpindah dari rencana ke rencana tanpa pernah diputuskan.

### 2.4 ❌ `glyph-matrix` — kanvas kedua di satu-satunya rute yang sudah punya kanvas

Rencana memberinya ground `/work`. Dibaca dari sumbernya: 162 baris, satu loop
`requestAnimationFrame`, tiga hex mentah. Rewiring ke Tempus tractable.

Yang tidak tractable adalah biayanya. `/en/work` **sudah** menjalankan kanvas
WebGL (lapisan material) plus parallax dua kolom. `glyph-matrix` melukis tiap
frame, dan biayanya **tidak bisa saya profil di sini** — tidak ada profiler,
dan `CLAUDE.md` #19 melarang mengklaim angka yang tidak diukur. Memasang
kanvas kedua sambil berkata "ringan" adalah klaim itu.

Ground-nya `grid-pattern`: nol RAF, dua elemen SVG, sudah terpasang sejak
Tahap 47. Dan ia **lebih benar**, bukan sekadar lebih murah — katalog ini
adalah kisi, jadi ground dan subjeknya sepakat. `vault/magic/README.md` sudah
menetapkan pembagian itu: kisi menegaskan struktur, titik hanya menyebut
permukaan.

## 3. `catalogue-descent` — dibangun, diukur, **dibatalkan**

Ini kegagalan tahap ini, dan ia ditulis penuh karena percobaan yang dibuang
tanpa catatan adalah percobaan yang akan diulang orang berikutnya.

### 3.1 Bentuknya, dan kenapa masthead bukan tempatnya

Rencana menempatkannya di masthead. Masthead `/work` sudah punya **dua**
kedatangan — `TextReveal` pada `<h1>` (dengan `key={practice}` yang
load-bearing sejak Tahap 39) dan `useReveal` pada `<header>`. Yang ketiga di
elemen yang sama melanggar §9.4 aturan 2.

Jadi momennya diberikan ke **kisinya**, sebagai prop opt-in `descent` pada
`ProjectGrid` — pola yang sama persis dengan `sift` yang sudah ada di file
itu.

### 3.2 Dua cacat saya sendiri, ditangkap berurutan, dan keduanya diperbaiki

**`yPercent` bukan piksel yang sama.** `e2e/exploratory-layer.e2e.ts` merah
pada jalan penuh pertama: `fixture-pusat-beban overlaps fixture-takar at
scroll 0`. Akarnya: `yPercent` diselesaikan terhadap tinggi elemennya sendiri,
dan `docs/stages/TAHAP-12.md` sengaja memberi kartu-kartu ini rasio berbeda.
Diperbaiki dengan travel piksel seragam.

**Custom property tidak mengembalikan panjang.** Perbaikannya membaca
`getPropertyValue('--section-lead')` — dan nilai terhitung custom property
adalah **string yang dispesifikasikan**. Yang kembali literal
`clamp(32px, calc(…), 55.211px)`, `parseFloat` memberi `NaN`, guard menyala,
dan animasinya tidak pernah dibangun. Terukur sebagai enam kartu di `1@0`
sejak frame pertama. Diperbaiki dengan `row-gap`, yang panjang terhitung nyata
**dan** angka yang lebih benar.

**`fromTo` menerapkan keadaan "from" seketika.** Dua gerbang merah bersamaan:
`e2e/motion.e2e.ts` — _"going back left content at opacity 0"_ — dan
`e2e/catalogue-layout.e2e.ts` dengan kartu yang tidak pernah mengendap di 1.
Itu `CLAUDE.md` #5 persis. Diperbaiki dengan `immediateRender: false`.

Setelah ketiganya, descent bekerja tepat seperti dirancang:

```
normal   load [0@-48 ×6]                     travel seragam, 3 × gap 16px
         mid  [0.71@-14  0.36@-14  ×3]       y identik, opacity dua kolom
         rest [1@0 ×6]
reduced  ketiganya [1@0 ×6]
```

### 3.3 Yang tidak bisa diperbaiki: ia bertabrakan dengan `catalogue-sift`

`e2e/catalogue-layout.e2e.ts` tetap merah pada asersi lain:

```
surviving cards animate from where they were
  → "nothing animated on a filter change", 0 animasi WAAPI ditemukan
```

**Diisolasi, bukan ditebak.** Descent dilepas dari halaman, build dijalankan
ulang, tes yang sama **lulus dalam 3,3 detik**. Konfliknya nyata dan milik
descent.

Tiga hipotesis dicoba dan tidak satu pun menyelesaikannya: memisahkan tween
`y` dari `opacity`, membatasi `clearProps` ke `opacity` saja, dan melepas
`projects.length` dari dependensi supaya efeknya tidak dibongkar saat FLIP
mengukur. **Mekanisme persisnya tidak berhasil saya isolasi di dalam tahap
ini, dan saya menuliskannya begitu alih-alih mengarang penjelasan.**

### 3.4 Keputusannya, dan alasannya bukan kelelahan

`catalogue-sift` adalah **umpan balik filter** — satu-satunya hal yang memberi
tahu pembaca bahwa tekanan mereka mengubah daftar. `catalogue-descent` adalah
kedatangan. Ketika dua mekanisme memperebutkan transform yang sama dan hanya
satu bisa menang, yang menang adalah yang menjawab tindakan pembaca.

Slot §9.5 ketiga `/work` **tetap kosong**, dan `MOTION-SPEC.md` mencatat bahwa
ia kosong karena alasan yang terukur — bukan karena belum ada yang mencoba.

Percobaan berikutnya punya tempat mulai yang jelas: tiga cacat di §3.2 sudah
diperbaiki dan tidak perlu ditemukan lagi, dan konfliknya ada di antara
descent dan FLIP, bukan di dalam descent.

## 4. Yang dikirim

### 4a — Masthead `/work`: 192px → 280px, dan angkanya bukan yang direncanakan

Yang dikirim lebih dulu adalah `min-height: 60svh`, dengan argumen "60, bukan
100, karena katalog didatangi untuk dijelajahi". Lalu diukur pada build
produksi, dan pengukuran itu membatalkan argumennya sendiri. **Posisi sampul
pertama:**

| viewport |      atas sampul | garis reveal | `data-reveal` | opacity |
| -------- | ---------------: | -----------: | ------------: | ------: |
| 1440×900 |  886px = **98%** |        675px |      `hidden` |   **0** |
| 1280×720 | 752px = **104%** |        540px |      `hidden` |   **0** |
| 390×844  |  833px = **99%** |        633px |      `hidden` |   **0** |

`60svh` adalah 60% layar **kalau kotaknya diukur sendirian**. Di tempatnya ia
duduk di bawah padding atas halaman (`--header-height` + 80px, yang
membersihkan header tetap) dan di atas filter serta penghitung — bersama 194px
pada 1440. Jadi masthead `60svh` justru **adalah** kedatangan satu layar penuh
yang tahap ini tolak di kalimat berikutnya.

Dan bukan cuma proporsi. `useReveal` membuka sebuah blok ketika atasnya
melewati 75% viewport; kisi yang didorong melewati garis itu **tidak pernah
terbuka**. Setiap sampul tinggal di `opacity: 0` sampai pembaca menggulir —
dan `catalogue-sift`, satu-satunya animasi yang menjawab tekanan chip, main di
tempat yang tidak bisa dilihat siapa pun.

**Dua gerbang menangkapnya, dan keduanya menangkapnya secara kebetulan:**

```
catalogue-layout  catalogue-sift › departing cards leave, and leave nothing behind
                  → settled.opacities.every(v => v === '1') = false

motion            going back mid-transition strands nothing
                  → "going back left content at opacity 0"
                    6 × LI.project-grid-module__item
```

Keduanya mengukur pada scroll 0 dan keduanya diam-diam bergantung pada kisi
sudah terbuka saat halaman dimuat — sesuatu yang benar hanya selama masthead
masih 192px. **Tidak ada yang mengukurnya dengan sengaja.**

Jadi tingginya ditulis sebagai apa yang ia harus artikan: **semua yang di atas
filter berakhir di 48% layar**, padding halaman ikut dihitung.

```css
min-height: calc(48svh - var(--header-height) - desktop-vw(80px));
```

Terukur sesudahnya, dan kali ini di lima rute katalog (dua bahasa, tersaring
dan tidak):

| viewport |     atas sampul | jarak ke garis reveal | `data-reveal` | opacity |
| -------- | --------------: | --------------------: | ------------: | ------: |
| 1440×900 | 594px = **66%** |                 +81px |     `visible` |   **1** |
| 1280×720 | 496px = **69%** |                 +44px |     `visible` |   **1** |
| 390×844  | 590px = **70%** |                 +43px |     `visible` |   **1** |

Masthead **192px → 280px** pada 1440 (0,21 → **0,31 layar**), dokumen 4395px →
**4484px** (4,88 → **4,98 layar**). Lebih kecil dari +349px yang sempat
dikirim, dan itu memang angka yang benar: 194px filter-dan-penghitung plus
garis di 75% menyisakan sisanya untuk masthead. Itu plafon yang tata letak ini
izinkan, bukan preferensi.

### 4b — Ground `grid-pattern`

Kategori ketiga, tidak dihitung §9.5. Kisi, bukan titik, dan di sinilah
pilihan itu bukan preferensi: halaman ini **adalah** kisi, jadi ground dan
subjeknya mengatakan hal yang sama. `/studio` mengambil separuh lainnya dari
pembagian yang `vault/magic/README.md` tetapkan.

### 4c — Gerbang yang mengukurnya dengan sengaja

`e2e/first-screen.e2e.ts` — _"the catalogue opens on work"_, tiga rute masuk
(dua bahasa plus katalog tersaring, yang halaman praktik tautkan langsung).
Dua asersi per rute: sampul pertama ada **di dalam** viewport, dan ia
**terlihat** — bukan terparkir di `opacity: 0` di balik reveal yang belum
menyala. Sampul di dalam viewport yang tidak terlihat adalah layar kosong yang
sama.

**Berkas sendiri, bukan di `catalogue-layout.e2e.ts`**, karena seberapa banyak
halaman yang muat di atas lipatan adalah pertanyaan viewport dan proyek mobile
mengambil berkas utuh. Dengan begini ia jalan di 390×844 juga, tanpa menyeret
tiga belas tes pengaturan-waktu FLIP ke proyek yang tidak punya satu pun.

**Dibuktikan merah lebih dulu, di kedua lebar.** Pada build `60svh` yang
pertama, desktop 1280×720:

```
the first cover starts at 752px of a 720px screen —
the catalogue opens on nothing but its own title
  Expected: < 612   Received: 752
```

Dan sesudah berkasnya dipindah, dengan `calc(60svh − header − padding)`
dipasang kembali sebentar, enam dari enam merah — dan keduanya merah dengan
alasan yang berbeda, yang justru membuktikan kedua asersi itu perlu:

```
[desktop] the first cover is in the viewport but still waiting for a scroll
          to reveal it            Expected: > 0.99   Received: 0
[mobile]  the first cover starts at 725px of a 844px screen
                                  Expected: < 717.4  Received: 725
```

## 5. Hasil

### 5.1 Verifikasi

```
bun run check        lulus — unit 421 lulus
bun run build        lulus
build-storybook      lulus

CI=true test:e2e     567 lulus, 2 gagal, 14 dilewati (12,4m)   ← sebelum 4a diperbaiki
                     575 lulus, 0 gagal, 14 dilewati (12,2m)   ← sesudahnya
```

Selisih delapan tes: dua yang merah kembali hijau tanpa satu pun tesnya
diubah, dan enam yang baru (`first-screen`, tiga rute × dua lebar).

### 5.2 Yang ditolak, dan tidak akan ditunda lagi

- **`pixel-image`** — kedua rute yang rencana sebut sudah dimiliki
  `MaterialImage`, yang menyembunyikan gambar DOM begitu mesh melukis. Sebuah
  pixel-reveal di sana adalah gerak yang tidak ada yang melihat. Ditunda dari
  Tahap 49; **ditolak** di sini, karena menundanya ketiga kali adalah cara
  sebuah item berpindah antar-rencana tanpa pernah diputuskan.
- **`glyph-matrix`** — kanvas kedua yang melukis tiap frame, di satu-satunya
  rute yang sudah menjalankan kanvas WebGL, dengan biaya yang tidak bisa
  diprofil di sini.
- **Hero `/work/<slug>`** — sudah 0,95 layar.
- **`catalogue-descent`** — §3. Dibangun, tiga cacat diperbaiki, konflik
  dengan `catalogue-sift` tidak terselesaikan, dibatalkan.

### 5.3 Yang ditemukan dan **tidak** diperbaiki di sini

`/en/practice/<v>` — halaman topik praktik, hero `70svh` sejak Tahap 15 —
punya cacat yang sama dan **lebih parah**, dan ia sudah ada di sana sebelum
tahap ini:

```
1440×900   sampul pertama 1184px = 132% layar   data-reveal="hidden"   opacity 0
1280×720                  1008px = 140%          hidden                0
 390×844                  1083px = 128%          hidden                0
```

Tidak diperbaiki di sini karena itu halaman lain, dan karena **Tahap 52 sudah
menjadwalkan hero itu 70svh → 88svh** — yang, tanpa pengukuran ini, akan
memperburuknya. Angkanya ditulis supaya tahap itu mulai dari sini alih-alih
menemukannya lagi.

### 5.4 Kejujuran tentang tahap ini

Empat butir direncanakan. **Satu dikirim** (masthead), satu ditambahkan
(ground), satu gerbang baru ditulis, dan **tiga ditolak dengan pengukuran**.
Yang paling substansial — descent — dibangun sepenuhnya dan dibuang.

Dan butir yang dikirim itu **dikirim salah lebih dulu**: `60svh` lolos `bun run
check` dan lolos build, lalu suite e2e penuh menemukannya lewat dua gerbang
yang tidak mengukurnya. Itu persis bentuk kegagalan yang `docs/AUDIT-2026-08.md`
terus tunjuk — gerbang hijau bukan halaman yang benar — kecuali kali ini
gerbangnya tidak hijau, dan itu satu-satunya alasan cacatnya ketahuan sebelum
dikirim.

Itu bukan tahap yang berhasil. Yang bisa dikatakan untuknya: nol gerak rusak
dikirim, empat cacat nyata ditemukan dan diperbaiki di sepanjang jalan, satu
cacat lama ditemukan dan dicatat dengan angkanya untuk tahap berikutnya, dan
percobaan yang gagal meninggalkan catatan yang membuat percobaan berikutnya
lebih murah alih-alih mengulanginya dari nol.
