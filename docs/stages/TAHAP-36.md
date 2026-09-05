# Tahap 36 — Skala yang punya langit-langit

> Status: spec. Kode belum ditulis saat baris ini dibuat (`docs/ROADMAP.md` §3.0).

Satu-satunya cacat dalam audit kurator yang bisa ditemukan juri dalam sepuluh
detik, dengan menyeret sudut jendela. Ia juga melanggar aturan yang
`docs/DESIGN-SYSTEM.md` tulis sendiri.

---

## 1. Diagnosis, diukur di browser

Tidak ada satu pun `clamp()` di seluruh token, dan tidak ada container
`max-width` di mana pun di repo. Setiap ukuran adalah `vw` linear murni,
dijangkarkan pada dua lebar desain (375 dan 1440) dengan satu breakpoint di
800px.

Diukur pada build produksi, `/en`, 2026-09-05 — bukan dihitung di atas kertas:

|   Lebar |      `h1` | `caption` |  `--gap` | `--safe` | `--header-height` | `--column-width` |
| ------: | --------: | --------: | -------: | -------: | ----------------: | ---------------: |
|     320 |      32,4 |   **9,4** |     13,6 |     13,6 |              49,5 |             62,9 |
|     374 |      37,9 |      11,0 |     16,0 |     16,0 |              57,8 |             73,5 |
|     700 |      70,9 |      20,5 |     29,9 |     29,9 |             108,3 |            137,7 |
| **799** |  **81,0** |  **23,4** | **34,1** | **34,1** |         **123,6** |        **157,1** |
| **800** |  **66,7** |   **6,7** |  **8,9** |  **8,9** |          **40,0** |         **57,0** |
|    1000 |      83,3 |       8,3 |     11,1 |     11,1 |              50,0 |             71,3 |
|    1440 |     120,0 |      12,0 |     16,0 |     16,0 |              72,0 |            102,7 |
|    1920 |     160,0 |      16,0 |     21,3 |     21,3 |              96,0 |            136,9 |
|    2560 | **213,3** |      21,3 |     28,4 |     28,4 |         **128,0** |            182,5 |

### 1.1 Tebing di 800px

| Token              | 799px | 800px |  Perubahan |
| ------------------ | ----: | ----: | ---------: |
| `h1`               |  81,0 |  66,7 | **−17,7%** |
| `caption`          |  23,4 |   6,7 | **−71,4%** |
| `--gap` / `--safe` |  34,1 |   8,9 | **−73,9%** |
| `--header-height`  | 123,6 |  40,0 | **−67,6%** |
| `--column-width`   | 157,1 |  57,0 |     −63,7% |

Satu piksel lebar jendela, dan caption menyusut jadi seperempatnya.

`--columns` (4 → 12) memang berubah di sana dengan sengaja, jadi
`--column-width` ikut melompat karena kisinya berganti. Itu bukan cacat, dan
tetap begitu sesudah Tahap ini.

### 1.2 Ujung yang tidak berbatas

- **320px:** caption **9,4px**, gutter 13,6px. Di bawah lantai keterbacaan
  yang `typography.ts` sendiri tetapkan ketika ia menaikkan caption dari 8px
  ke 11px dan menulis "sebuah flag bukan perbaikan".
- **2560px:** `h1` **213px**, header **128px**. Header memakan 14% tinggi
  layar 900px, untuk membawa wordmark dan tiga tautan.

### 1.3 Dokumen ini sudah menuliskan aturannya

`DESIGN-SYSTEM.md` §2: _"Fluid sizing: pakai `clamp()` dengan **koefisien
viewport kecil**… 1–1,5vw… penskalaan `vw` agresif membuat teks tersentak saat
resize dan merupakan petunjuk amatir yang andal."_

Koefisien sebenarnya: `h1` **10,13vw** di mobile, **8,33vw** di desktop.
Delapan sampai sepuluh kali angka yang dokumennya sendiri sebut.

---

## 2. Kenapa satu tuas memperbaiki semuanya

Dua sistem menghasilkan setiap angka di atas, dan keduanya memancarkan bentuk
yang sama:

1. **Skala tipe** — `lib/styles/typography.ts`, tujuh kelas, tiap satu punya
   `{ mobile, desktop }`. Dikompilasi `setup-styles.ts` menjadi
   `font-size: calc(((N * 100) / var(--device-width)) * 1vw)` plus varian
   `dt`.
2. **Token layout** — `lib/styles/layout.mjs`, lima nilai, formula identik.

Ditambah **377 pemanggilan** `mobile-vw()` / `desktop-vw()` di seluruh
komponen (`postcss-functions.mjs`), yang memancarkan `calc(N*100/375 * 1vw)`
dan `calc(N*100/1440 * 1vw)`.

Jadi tidak ada 377 perbaikan. Ada **dua**: rumus yang dipancarkan generator,
dan rumus yang dipancarkan fungsi PostCSS.

---

## 3. Bentuk penggantinya

### 3.1 Satu kurva menerus, bukan dua cabang (tipe dan token layout)

Sebuah nilai dengan desain `m` di 375 dan `d` di 1440 menjadi satu interpolasi
linear melewati kedua jangkar itu, dijepit di kedua ujung:

```
slope  = (d - m) / (1440 - 375) * 100        →  satuan vw
origin = m - (d - m) / (1440 - 375) * 375    →  satuan px

clamp(FLOOR, calc(origin * 1px + slope * 1vw), CEILING)
```

- **`FLOOR` = nilai desain mobile (`m`)** — ukurannya berhenti mengecil di
  bawah 375px. Ini yang mengangkat caption dari 9,4px ke 11px di 320.
- **`CEILING` = nilai kurva di 1920px** — ukurannya berhenti tumbuh di atas
  itu. Ini yang menahan `h1` di 157px alih-alih 213px di 2560.

**Sifat yang membuat perubahan ini aman: di 375px dan 1440px, tiap nilai tetap
persis seperti yang didesain.** Kurvanya melewati kedua jangkar itu menurut
konstruksinya. Yang berubah hanya di antaranya dan di luarnya — yaitu persis
tempat cacatnya berada.

Angka yang dihasilkan, dihitung dari tabel §1:

| Token             |  320 |  800 |  1440 |  2560 |
| ----------------- | ---: | ---: | ----: | ----: |
| `h1`              | 38,0 | 70,7 | 120,0 | 157,0 |
| `caption`         | 11,0 | 11,4 |  12,0 |  12,5 |
| `--gap`           | 16,0 | 16,0 |  16,0 |  16,0 |
| `--header-height` | 58,0 | 63,6 |  72,0 |  78,3 |
| `--section-lead`  | 32,0 | 38,4 |  48,0 |  52,8 |

`--gap` dan `--safe` menjadi **16px konstan**, dan itu bukan kebetulan: desain
mereka 16 di _kedua_ jangkar. Nilai yang 16px di 375 dan 16px di 1440 tidak
pernah dimaksudkan menjadi 34px di 799.

Header di 1920 menjadi 78,3px, masih di bawah plafon 80px yang Tahap 34
tetapkan — diperiksa, bukan diasumsikan.

### 3.2 Pita untuk 377 pemanggilan komponen

`mobile-vw()` dan `desktop-vw()` dipanggil di blok media yang berbeda dengan
angka yang penulisnya pilih sendiri, jadi keduanya tidak bisa digabung jadi
satu kurva tanpa menulis ulang 377 tempat. Yang bisa dilakukan tanpa
menyentuh satu pun: **membatasi keduanya**.

```
mobile-vw(N)   → clamp(0.85*N px, N/3.75 * 1vw, 1.35*N px)
desktop-vw(N)  → clamp(0.85*N px, N/14.4 * 1vw, 1.35*N px)
```

Kedua angka pita itu diturunkan, bukan dipilih:

- **0,85** ≈ 320/375 — "jangan pernah lebih kecil dari nilai di lebar
  terkecil yang didukung".
- **1,35** ≈ 1920/1440 — "berhenti tumbuh di lebar yang sama dengan langit-
  langit kurva di §3.1".

Di jangkarnya nilainya tetap tepat: `mobile-vw(24)` = 24px di 375,
`desktop-vw(32)` = 32px di 1440.

**Sisa yang tidak hilang, dan angkanya diukur bukan ditaksir.** Di
breakpoint, cabang mobile terpaku di plafonnya dan cabang desktop di
lantainya, jadi langkahnya persis `plafon / lantai` = 1,3333 / 0,8533 =
**1,5625×**. Untuk pasangan yang cocok (`mobile-vw(24px)` /
`desktop-vw(24px)`) itu turun dari **3,84×** menjadi **1,5625×** — 60% cacatnya
hilang, sisanya tidak.

Draf spec ini menulis "sekitar 1,2×". Itu tebakan, dan salah;
`postcss-functions.test.ts` sekarang memaku angka sebenarnya.

Mempersempitnya lebih jauh berarti mempersempit pita sampai kedua fungsi ini
berhenti menskala sama sekali — keputusan yang berbeda dari membatasinya, dan
bukan yang Tahap ini ambil. Menutupnya benar-benar butuh 377 pemanggilan
ditulis ulang jadi pasangan yang generatornya bisa lihat sekaligus.

Dan ketika penulis memang memilih angka desktop yang jauh lebih kecil dari
angka mobile-nya (`mobile-vw(20px)` / `desktop-vw(12px)`), lompatan di 800px
adalah maksud penulisnya, hanya mendadak. Pita membatasi ujung; ia tidak
menebak maksud.

---

## 4. Gerbang

`e2e/scale-continuity.e2e.ts`, baru. Diukur di **sembilan lebar** — 320, 374,
700, 799, 800, 1000, 1440, 1920, 2560 — pada `/en` dan `/id`.

1. **Lantai keterbacaan.** Nol teks yang dirender di bawah 11px di lebar mana
   pun.
2. **Nol tebing.** Antara dua lebar berurutan, tidak ada nilai terukur yang
   turun lebih dari **10%** ketika viewport **bertambah**. Ini asersi yang
   menangkap 800px.
3. **Langit-langit.** Nol nilai yang melewati langit-langit yang dideklarasikan
   di 2560.
4. **Jangkarnya tidak bergerak.** Di 375 dan 1440, tiap nilai sama dengan
   angka desainnya di `typography.ts` dan `layout.mjs` — perubahan ini tidak
   boleh mendesain ulang apa pun, hanya membatasinya.

Lantai anti-vakum: jumlah elemen dan token yang terukur harus di atas nol di
tiap lebar.

Dibuktikan merah dulu dengan tabel §1.

---

## 5. Risiko

- **Ini menyentuh setiap halaman di setiap lebar.** `spatial-rhythm`,
  `responsive`, `visual-substance`, `catalogue-layout`, `media-edge` dan
  `taste-preflight` semuanya mengukur geometri dan bisa ikut merah. Yang merah
  karena instrumennya mengasumsikan kurva lama diperbaiki dan dicatat; yang
  merah karena halamannya benar-benar rusak diperbaiki di halamannya.
- **`setup-styles.test.ts` mem-byte-match CSS tergenerasi terhadap build
  segar**, jadi ia akan merah sampai generatornya dan filenya sepakat. Itu
  gerbang yang bekerja.
- Hero memakai `min-height: 88svh` dan padding `--header-height`; header yang
  berubah di 800–1440 menggeser judulnya, yang menggeser pita yang
  `visual-substance` sampel. Tahap 34 §9.10 sudah membuat asersi itu tahan
  layout; ini ujinya.
- Nilai di 375 dan 1440 **tidak boleh berubah**. Kalau berubah, ini bukan
  pembatasan melainkan desain ulang, dan gerbang §4.4 yang mengatakannya.

---

## 6. Hasil

### 6.1 Gerbang merah dulu: 3 dari 4

`e2e/scale-continuity.e2e.ts` dijalankan terhadap situs sebagaimana adanya:

| Asersi                 | Sebelum                                                        |
| ---------------------- | -------------------------------------------------------------- |
| Lantai keterbacaan     | **merah** — `320px renders 9.4px type`                         |
| Nol tebing             | **merah** — `h1 falls 17.7% from 799px (81.0) to 800px (66.7)` |
| Langit-langit          | **merah** — `h1 reaches 213.3px at 2560px`                     |
| Jangkar tidak bergerak | **hijau**                                                      |

Yang keempat hijau sejak awal, dan itu justru gunanya: ia **kontrol**. Ia
membuktikan nilai di 375 dan 1440 memang di tempat yang saya kira **sebelum**
apa pun diubah, sehingga ketika ia tetap hijau sesudahnya, itu berarti
sesuatu.

### 6.2 Kurvanya, diukur ulang

|   Lebar |     `h1` | `caption` | `--gap` | `--safe` | `--header-height` | `--section-lead` |
| ------: | -------: | --------: | ------: | -------: | ----------------: | ---------------: |
|     320 |     38,0 |      11,0 |    16,0 |     16,0 |              58,0 |             32,0 |
|     374 |     38,0 |      11,0 |    16,0 |     16,0 |              58,0 |             32,0 |
|     700 |     63,0 |      11,3 |    16,0 |     16,0 |              62,3 |             36,9 |
| **799** | **70,7** |  **11,4** |    16,0 |     16,0 |              63,6 |             38,4 |
| **800** | **70,7** |  **11,4** |    16,0 |     16,0 |              63,6 |             38,4 |
|    1000 |     86,1 |      11,6 |    16,0 |     16,0 |              66,2 |             41,4 |
|    1440 |    120,0 |      12,0 |    16,0 |     16,0 |              72,0 |             48,0 |
|    1920 |    157,0 |      12,5 |    16,0 |     16,0 |              78,3 |             55,2 |
|    2560 |    157,0 |      12,5 |    16,0 |     16,0 |              78,3 |             55,2 |

799 dan 800 **identik di setiap kolom**. Caption yang dulu berayun 6,7–23,4
sekarang hidup di 11,0–12,5. `h1` berhenti di 157 alih-alih 213. Gutter 16px
di mana pun, yang memang selalu jadi maksudnya.

Dan yang paling penting: **375 dan 1440 tidak bergerak sepiksel pun.** Ini
pembatasan, bukan desain ulang, dan gerbangnya yang mengatakannya.

### 6.3 Satu elemen di seluruh situs melanggar lantai, dan gerbang itu menemukannya

Setelah kurvanya menerus, asersi lantai masih merah: **10,2px di 320px**.
Persis satu elemen, dan hanya di satu lebar —
`.heroCta`, tombol "See the work".

Ia menulis sendiri `font-family`, `font-size: mobile-vw(12px)`, dan
`line-height`, alih-alih memakai utilitas `cta` yang sudah persis itu.
`mobile-vw(12px)` berlantai 12 × 0,853 = **10,24px**. Salah satu dari 54
deklarasi `font-size` yang audit temukan melewati skala tipe — dan
satu-satunya yang benar-benar jatuh di bawah lantai.

Diperbaiki dengan memberinya kelasnya. Hanya `letter-spacing` yang tetap
lokal, karena kontrol ini diset huruf besar dan −0,01em skalanya untuk huruf
kecil.

### 6.4 Instrumennya salah dua kali

1. **Pembulatan tiga desimal memindahkan jangkar.** `desktop-vw(32)`
   memancarkan `2.222vw`, dan 2,222% dari 1440 adalah **31,9968px**, bukan 32.
   Seluruh klaim Tahap ini adalah bahwa jangkarnya tidak bergerak, jadi
   kemiringannya sekarang membawa lima desimal. Ditemukan oleh unit test yang
   ditulis bersama pitanya, bukan oleh mata.
2. **Klaim "sekitar 1,2×" di spec ini adalah tebakan, dan salah.** Sisa
   langkah di breakpoint untuk pasangan yang cocok adalah `plafon / lantai` =
   **1,5625×**, aritmetika bukan selera. Angkanya sekarang dipaku
   `postcss-functions.test.ts`, dan §3.2 sudah dikoreksi.

Ditambah satu kesalahan saya sendiri yang bukan instrumen: `cn` dipakai di
`app/[locale]/page.tsx` tanpa diimpor. `tsc` melewatkannya, dan **build
produksi yang menangkapnya** — `ReferenceError: cn is not defined` saat
prerender `/en`.

### 6.5 Yang dikirim

- `lib/styles/scripts/utils.ts` — `fluidCalc()`, satu garis terjepit melalui
  kedua jangkar desain. Dipakai `generate-root.ts` dan `generate-tailwind.ts`,
  yang sekarang memancarkan **satu** deklarasi per nilai, bukan satu per
  breakpoint.
- `lib/styles/scripts/postcss-functions.mjs` — `mobile-vw()` dan
  `desktop-vw()` dibatasi pita `[320/375, 1920/1440]`. **377 pemanggilan
  terikat tanpa satu pun disentuh.**
- Lima unit test baru untuk kedua fungsi itu, yang sebelumnya **nol cakupan**
  padahal merekalah yang memancarkan setiap ukuran komponen.
- `e2e/scale-continuity.e2e.ts` — 4 asersi × 9 lebar.

### 6.6 Yang TIDAK selesai, disebut eksplisit

1. **Sisa 1,5625× di 377 pemanggilan komponen.** Turun dari 3,84×, tapi tidak
   nol. Menutupnya butuh menulis ulang tiap pemanggilan jadi pasangan yang
   generatornya bisa lihat sekaligus — 377 tempat, dan menebak pasangan mana
   yang dimaksudkan sama. Gerbang §4 mengukur token dan skala tipe, **bukan**
   padding komponen, dan itu disebut di sini supaya hijaunya tidak dibaca
   lebih luas dari yang ia ukur.
2. **53 deklarasi `font-size` lain masih melewati skala.** Yang satu ini
   ditemukan karena ia jatuh di bawah lantai; sisanya tidak. Itu Tahap 37.
3. **`--column-width` masih melompat di 800px**, karena `--columns` 4 → 12.
   Itu kisi yang berganti, bukan ukuran yang tersentak, dan gerbangnya sengaja
   tidak mengukurnya.
4. **Tidak ada container `max-width`.** Isi masih membentang penuh di 2560px;
   yang Tahap ini perbaiki adalah _ukuran_-nya, bukan _lebar bacanya_. Batas
   `ch` per blok sudah ada di beberapa tempat dan pantas jadi keputusan
   tersendiri.

### 6.7 Verifikasi

```
bun run check              hijau — 448 unit test (5 baru), oxlint, oxfmt, tsc, manifest, assets
CI=true bun run test:e2e   463 lulus, 17 dilewati, nol flake, nol gagal (10,2 menit)
bun run build-storybook    hijau
```

Kurvanya dipandangi di sembilan lebar, bukan dua. Nol klaim performa
(`CLAUDE.md` #19).

Suite penuh **hijau di jalan pertama**, nol gerbang lama yang ikut merah.
Untuk perubahan yang menyentuh setiap ukuran di setiap halaman, itu bukan
keberuntungan melainkan konsekuensi dari sifat di §3.1: kurvanya melewati
kedua jangkar desain, dan proyek Playwright berjalan di 1280 dan 390 — cukup
dekat ke jangkar sehingga geometri yang gerbang lain ukur praktis tidak
berubah (`h1` di 1280: 106,7 → 107,7).
