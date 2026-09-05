# Tahap 43 — Lapisan eksploratif: `DESIGN_VARIANCE` 3 → 7

> Dial yang dibelanjakan: **VARIANCE** (3 → 7) dan **MOTION** (sudah 8).
> Prasyarat: Tahap 42, yang menamai kategori ketiga. Empat dari lima butir
> rencana ini adalah respons berkelanjutan atau komposisi statis; tanpa §0
> tidak satu pun punya tempat untuk dicatat.

## 0. Ringkasan keputusan

Lima butir direncanakan. **Satu ditolak dengan dua pengukuran**, empat
dibangun. Penolakan ditulis di §2 lengkap dengan angkanya, bukan didiamkan
sebagai "belum sempat" — pola yang sama dengan `sticky-stack` di Tahap 42.

| Butir                                    | Keputusan                                                                     |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| 43a `work-constellation`                 | **Dibangun.** Premis terkonfirmasi: 3 dari 3 baris katalog sejajar sempurna.  |
| 43b `type-pressure`                      | **DITOLAK.** Diukur; kedua paruhnya memicu layout. §2.                        |
| 43c Kursor membawa informasi             | **Dibangun.**                                                                 |
| 43d Jurnal bertema terang + `theme-turn` | **Dibangun**, tapi premisnya salah dan memaksa perbaikan arsitektur tema. §3. |
| 43e Ikonografi                           | **Dibangun.** Phosphor MIT, diverifikasi dengan membaca `LICENSE`-nya.        |

---

## 1. Cacat yang diukur lebih dulu

### 1.1 Katalog berjalan pada satu ritme — angkanya

Diukur pada build produksi, 1440×900, `/en/work`, enam karya:

| Kartu |   x | y (dokumen) | lebar | tinggi |
| ----: | --: | ----------: | ----: | -----: |
|     0 |  16 |         506 |   691 |    919 |
|     1 | 723 |         506 |   691 |    919 |
|     2 |  16 |        1441 |   691 |    919 |
|     3 | 723 |        1441 |   691 |    919 |
|     4 |  16 |        2376 |   691 |    919 |
|     5 | 723 |        2376 |   691 |    919 |

Dua nilai `x` saja. Tiga nilai `y` saja. Jarak antar baris **935px, tiga
kali berturut-turut**. Setiap kartu **691 × 919** — identik sampai
pikselnya. **Tiga dari tiga baris punya dua kartu dengan `top` yang persis
sama.**

Itu `DESIGN_VARIANCE` 3, diukur alih-alih ditaksir: sebuah kisi yang bisa
ditebak seluruhnya dari dua kartu pertama. `layout="catalogue"` memang
sengaja membuang `span` (Tahap 8 mengukur alasannya, dan alasan itu masih
benar) — tapi membuang `span` tidak harus berarti membuang komposisi.

### 1.2 Tema terang tayang di nol rute yang bisa dicapai pembaca

Audit menyebut "dua rute". Diukur, angkanya **nol**:

- `app/[locale]/error.tsx` — hanya melukis saat ada kesalahan runtime.
- `app/[locale]/[...slug]/page.tsx` — `curl /en/about` mengembalikan **200**,
  dan isinya "Page not found": nol dokumen `page` terbit, jadi rute markdown
  **selalu** jatuh ke not-found. Ia tidak pernah merender badan bertema
  terang.

Setengah sistem warna proyek ini — sebelas pasang kontras di
`contrast.test.ts` — menjaga tema yang tidak pernah dilihat siapa pun.

### 1.3 Ikon: nol, dan satu-satunya SVG adalah logo perusahaan lain

`components/ui/lightbox` mengirim `←`, `→`, `−`, `+`, `✕` sebagai **glyph
teks**; `components/ui/breadcrumbs` memakai `<span class=separator>`. Glyph
teks bukan ikon: ia mewarisi metrik font, tidak sejajar secara optis, dan
berubah bentuk antar platform. `components/ui/darkroom.svg` — wordmark
darkroom.engineering, sisa starter — masih satu-satunya berkas SVG di repo,
dengan nol referensi JSX.

---

## 2. `type-pressure` ditolak, dan ini pengukurannya

Rencana meminta bobot variabel Syne digerakkan `--scroll-velocity`:
`font-variation-settings: 'wght' calc(700 + var(--scroll-velocity) * 60)`.
Ia menyebut versi `h1` sebagai satu-satunya butir yang mungkin tidak selamat,
dan menyatakan versi wordmark **aman** karena "wordmark hidup di kotak
berukuran tetap dengan empat huruf, jadi reflow-nya terkurung dan tak
terlihat."

**Diukur pada header yang sebenarnya, `/en`, 1440×900, setelah
`document.fonts.ready`:**

|         `wght` | lebar wordmark |  x `<nav>` | x tombol pencarian |
| -------------: | -------------: | ---------: | -----------------: |
|            640 |        42,61px | **268,55** |            1000,95 |
| 700 (hari ini) |        45,61px | **270,55** |            1001,95 |
|            760 |        57,61px | **278,55** |            1005,95 |
|            800 |        66,61px |     284,55 |            1008,95 |

Rentang yang diminta rencana (640–760) **menggeser navigasi header 10 piksel**
dan tombol pencarian 5 piksel. Kotaknya tidak tetap: `.brand` adalah
`flex-shrink: 0` di dalam baris flex, jadi lebarnya **adalah** lebar
intrinsiknya. Premis "reflow terkurung" tidak reproduce.

**Versi `h1` lebih buruk, dan gagal dengan cara lain.** Lebarnya tetap
1080,06px (ia blok selebar kolom) — tapi tingginya:

| `wght` | tinggi `<h1>` |
| -----: | ------------: |
|    640 |         204px |
|    700 |         204px |
|    760 |     **306px** |

Pada 760 judul beranda **membungkus satu baris tambahan** dan tumbuh 102
piksel. Bukan guncangan; sebuah baris baru muncul dan segalanya di bawahnya
turun — digerakkan kecepatan gulir, tiap frame.

**Dan aturan yang menutup kasusnya ditulis tahap lalu.** `MOTION-SPEC.md`
§0.2, Tahap 42: kategori respons berkelanjutan hanya boleh menyentuh
`transform` dan `opacity`. Sumbu bobot bukan keduanya, dan kedua pengukuran di
atas menunjukkan persis mengapa aturan itu ada. Melonggarkannya satu tahap
setelah menulisnya adalah cara gerbang berhenti berarti.

**Kosakatanya tetap tidak dibelanjakan, dan itu keputusan.** Sumbu `wght`
400–800 Syne benar-benar ada — diverifikasi di `@font-face` build produksi:
`font-weight: 400 800`. Ia tidak mendapat konsumen di sini. Sama seperti
`--duration-choreographed` di Tahap 41: token tanpa rumah yang tepat bukan
cacat, dan memaksanya masuk ke satu-satunya tempat yang muat adalah cara
kosakata berubah jadi kebisingan.

**Yang tidak boleh disimpulkan dari sini:** bahwa Syne statis. Menambah bobot
keempat sebagai komposisi juga ditolak — gerbang tipe Tahap 37 menghitung
bobot, dan "tiga bobot" adalah janji `CLAUDE.md`.

---

## 3. Tema ternyata bukan keputusan server, dan itu memaksa perbaikan

Rencana memperlakukan "pindahkan `/journal` ke tema terang" sebagai satu baris
prop. Diukur, ia bukan.

**`data-theme` ditulis oleh efek klien.** `components/layout/theme/index.tsx`
menetapkan `document.documentElement.setAttribute('data-theme', …)` di dalam
`useEffect`. Root layout mengirim `data-theme="dark"` **hardcoded**, dengan
`suppressHydrationWarning`. Diukur dengan `curl` (nol JavaScript):

| Rute                                   | `data-theme` di HTML server |
| -------------------------------------- | --------------------------- |
| `/en`                                  | `dark`                      |
| `/en/work`                             | `dark`                      |
| `/en/journal`                          | `dark`                      |
| `/en/journal/scope-is-the-deliverable` | `dark`                      |
| `/en/studio`                           | `dark`                      |

Lima dari lima. Jadi rute bertema terang akan:

1. **berkedip** — dilukis gelap, lalu berubah terang setelah hidrasi;
2. **tetap gelap selamanya tanpa JavaScript**, melanggar aturan tetap #7
   ("terbaca tanpa JavaScript") dalam bentuk yang paling terlihat: warnanya
   salah.

Ini juga menjelaskan cacat laten yang sudah tayang: `error.tsx` menyatakan
`theme="light"` dan tidak pernah mendapatkannya sebelum hidrasi.

### 3.1 Tiga jalan, dan mengapa dua ditolak

- **Root layout membaca path.** Layout tidak menerima pathname, dan membaca
  `headers()` membuat **setiap** rute dinamis di bawah `cacheComponents` —
  membayar seluruh situs untuk satu segmen. Ditolak.
- **Route group dengan root layout kedua** (`app/(reading)/…`). Berpindah
  antar root layout memaksa **muat ulang penuh**, yang membunuh morph
  `journal-transport` yang baru dibangun Tahap 41 dan overlay rutenya.
  Ditolak, dan ini penolakan yang paling penting: ia akan menghapus tahap
  sebelumnya untuk memenangkan tahap ini.
- **Tema mendapat elemennya sendiri.** Dipilih. Selektor temanya sudah
  `[data-theme=light]`, **bukan** `:root[data-theme=light]`
  (`lib/styles/css/tailwind.css:34`), jadi token sudah mengalir ke subtree
  mana pun. Yang hilang hanya elemennya.

### 3.2 Bentuknya

`components/layout/wrapper` merender satu elemen pembungkus yang membawa
`data-theme` **di server**, melukis groundnya sendiri
(`background-color: var(--color-primary)`), dan tumbuh mengisi body. `<html>`
berhenti membawa `data-theme` sama sekali, sehingga tidak pernah ada dua nilai
di satu halaman — `e2e/taste-preflight.e2e.ts:315` sudah mengasersikan satu
tema per halaman dan akan menangkap pelanggarannya.

Karena groundnya kini dilukis elemen, `body` mendapat warna dasar dokumen dari
`:root` supaya tidak ada kilat putih sebelum CSS halaman terpasang.

**Yang tidak berubah:** `useTheme()` dan `setTheme` tetap ada dengan bentuk
yang sama; header `position: fixed` tetap relatif viewport karena pembungkus
tidak membawa `transform` maupun `filter`.

---

## 4. Yang dibangun

### 4a — `work-constellation`

**Komposisi.** Kartu katalog mendapat offset editorial vertikal dari token,
**tiga nilai saja** (0, +1 unit, −0,5 unit), diputar per indeks. Tiga nilai
dari token adalah yang membuat ketidakteraturan terbaca sebagai keputusan;
offset acak terbaca sebagai bug. Offset adalah `margin-block-start` — komposisi
statis, bukan animasi, jadi larangan `transform`/`opacity` tidak berlaku dan
tidak ada yang dianimasikan.

Di bawah 800px offsetnya **nol**: satu kolom, dan menggeser kartu ke bawah di
satu kolom hanya menambah jarak, bukan komposisi.

**Koreografi — `constellation-drift` (respons berkelanjutan, §0).** Parallax
yang sudah ada mendapat `distance` berbeda per kolom: kolom kiri 4, kanan 9.
Yang terbaca adalah **selisihnya**, bukan besarnya. `scrub`, `ease: 'none'`,
hanya `yPercent`. Nol durasi, nol easing.

**Batas:** selisih maksimum 6; kartu tidak boleh tumpang tindih di titik gulir
mana pun. Reduced motion: offset tetap (komposisi), drift mati total.

### 4c — Kursor membawa informasi

`vault/primitives/cursor` sudah membaca `data-cursor` dari
`closest('[data-cursor]')`. Ia mendapat satu atribut pendamping,
`data-cursor-label`, dibaca dari elemen yang sama.

- Chip filter: jumlah karya yang akan tersisa (`04`).
- Figur galeri: posisinya (`02 / 04`).
- Kartu proyek: praktiknya.

Transisi muatan: `opacity` + `translate3d`, **150ms** (`--duration-micro`)
`--ease-out-quart`. Muatan lama keluar, yang baru masuk — tidak pernah morph.

**Aturan yang mengikat:** informasi yang dibawa kursor **wajib** ada di DOM.
Pointer kasar tidak pernah merender kursor, jadi informasi yang hanya hidup di
sana adalah informasi yang tidak ada untuk separuh pengunjung. Digerbangi.

### 4d — Jurnal bertema terang, dan `theme-turn`

`/journal` dan `/journal/<slug>` pindah ke tema terang, di atas perbaikan §3.
Jurnal adalah permukaan **baca**; situs yang menyalakan kertas saat Anda
beralih dari melihat ke membaca terbaca sebagai situs yang dikarang. Ia juga
memaksa jalur kode yang nyaris tidak pernah dijalankan untuk lolos gerbang
kontras nyata.

**`theme-turn`:** pergantian terjadi **di balik overlay `page-transition` yang
sudah ada**, jadi tidak ada kilat dan **nol elemen menganimasikan warnanya
sendiri** — pergantian tema yang di-crossfade adalah cara termurah membuat
situs terlihat murah. Karena tema kini dirender server sebagai bagian dari
dokumen rute berikutnya, pergantiannya tiba bersama konten barunya: tidak ada
yang perlu ditambahkan ke overlay, dan itu justru buktinya benar.

### 4e — Ikonografi lahir

**Phosphor Icons, MIT — diverifikasi dengan membaca `LICENSE` repo itu
sendiri** (`CLAUDE.md` #18), bukan badge: `phosphor-icons/core` (MIT,
Copyright (c) 2023 Phosphor Icons) dan `phosphor-icons/react` (MIT,
Copyright (c) 2020 Phosphor Icons).

**Nol dependensi runtime.** Path-nya disalin ke `vault/primitives/icon`
dengan header provenance, karena `@phosphor-icons/react` akan membawa pustaka
ke dalam `route-budget.e2e.ts` demi lima glyph. MIT mengizinkan penyalinan
dengan pemberitahuannya, dan pemberitahuan itu ikut — di berkasnya dan di
`docs/PROVENANCE.md`.

`currentColor`, ukuran dari token, `aria-hidden` kecuali ia satu-satunya isi
sebuah kontrol. Dipakai di: pemisah breadcrumb, kontrol lightbox (menggantikan
`←  →  −  +  ✕`), pemicu pencarian, penanda tautan luar. **Nol ikon
dekoratif** — tiap ikon menamai sebuah aksi, atau ia tidak dipasang.

---

## 5. Gerbang — `e2e/exploratory-layer.e2e.ts`

Tiap asersi dibuktikan merah lebih dulu, angkanya ditulis di §6.

1. Kartu katalog tidak pernah tumpang tindih, di 12 posisi gulir.
2. Tidak semua baris katalog sejajar — merah hari ini dengan 3 dari 3.
3. Selisih drift antar kolom ≤ 6.
4. Setiap informasi yang dibawa kursor juga ada di DOM.
5. Kedua rute jurnal merender tema terang **tanpa JavaScript**.
6. Satu nilai `data-theme` per halaman (sudah ada di `taste-preflight`).
7. Nol ikon tanpa nama aksesibel.
8. Reduced motion: drift mati, offset tetap, isi terbaca penuh.

Ditambah gerbang lama yang harus tetap hijau: `contrast.test.ts` pada tema
terang untuk rute jurnal, `route-budget`, `no-javascript`, `motion`.

## 6. Hasil

### 6.1 Gerbang dibuktikan merah lebih dulu

`e2e/exploratory-layer.e2e.ts` dijalankan terhadap situs sebelum satu baris
kode Tahap ini ditulis: **5 gagal, 3 lulus**.

| Asersi                                       | Sebelum                                                          |
| -------------------------------------------- | ---------------------------------------------------------------- |
| baris katalog tidak pernah sejajar           | **merah** — tiap kartu kolom dua berbagi `top` dengan kolom satu |
| selisih drift antar kolom                    | **merah** — `1.863183333333333` lawan `1.863183333333333`        |
| muatan kursor ada juga di DOM                | **merah** — nol elemen `[data-cursor-label]`                     |
| `/en/journal` bertema terang tanpa JS        | **merah** — `dark`                                               |
| `/en/journal/<slug>` bertema terang tanpa JS | **merah** — `dark`                                               |
| kartu tidak pernah tumpang tindih            | hijau (pagar, bukan fitur baru)                                  |
| dua rute tanpa ikon tanpa nama               | hijau (nol ikon untuk dinilai)                                   |

Tiga yang hijau sejak awal dibiarkan hijau dengan sengaja: mereka pagar yang
menjaga fitur baru tidak merusak sesuatu, bukan klaim bahwa fitur itu ada.

### 6.2 Yang dikirim, diukur pada build produksi

**43a — `work-constellation`.** Nilai `y` berbeda naik dari **3 menjadi 6**;
tidak ada dua kartu yang berbagi `top`. Offset 0 / 48px / 96px berputar per
indeks, hanya di desktop, hanya di katalog. Drift per kolom 4 dan 9, selisih
5, di bawah plafon 6.

**43c — kursor membawa informasi.** Chip filter: `All 06`, `Consulting 02`,
`AI & Data 02`, `Commission 02` — total 06, jadi bagian-bagiannya menjumlah
keseluruhannya. Figur galeri: `01 / 04`. Keduanya **dirender juga**, bukan
hanya dibawa ring.

**43d — jurnal bertema terang.** Diukur dengan `curl`, nol JavaScript:

| Rute                            | Sebelum | Sesudah     |
| ------------------------------- | ------- | ----------- |
| `/en/journal`                   | `dark`  | **`light`** |
| `/en/journal/<slug>`            | `dark`  | **`light`** |
| `/id/journal`                   | `dark`  | **`light`** |
| `/en`, `/en/work`, `/en/studio` | `dark`  | `dark`      |

Satu nilai per halaman, di HTML server, tanpa efek dan tanpa kilat.

**43e — ikonografi.** Tujuh glyph Phosphor (MIT, diverifikasi dengan membaca
`LICENSE`-nya) menggantikan `/`, `←`, `→`, `−`, `+`, `✕` dan `⌕`. Nol
dependensi runtime.

### 6.3 `type-pressure` ditolak — §2

Satu-satunya butir rencana yang tidak dikirim, dengan dua pengukuran, dan
rencana ini hanya memperkirakan setengahnya. Ia menyebut versi `h1` berisiko
dan versi wordmark **aman**; wordmark-lah yang gagal paling jelas — 10 piksel
pergeseran navigasi header pada tiap frame. Sumbu `wght` Syne tetap tanpa
konsumen, dicatat sebagai keputusan, sama seperti `--duration-choreographed`
di Tahap 41.

### 6.4 Lima regresi yang ditangkap suite, dan akar yang sama untuk tiga

Suite penuh setelah kode pertama: **511 lulus, 15 gagal**. Ketiganya di bawah
ini bukan gerbang yang rewel — semuanya cacat nyata yang dibuat Tahap ini,
dan tiga punya satu akar.

**Akar bersama: token turunan dideklarasikan di `:root`.** `--surface`,
`--surface-2`, `--text-muted`, `--line`, `--line-strong` dan kedua
`--hero-wash-*` adalah resep `color-mix()` atas warna tema — dan sebuah
properti kustom di `:root` **dihitung sekali, di sana**. Selama `<html>`
membawa `data-theme`, itu benar. Begitu §3 memindahkan tema ke dalam halaman,
semuanya diam-diam terhitung terhadap default tak bertema, yaitu palet
**terang**, untuk setiap halaman termasuk yang gelap.

Akibatnya tidak halus. Pada 404: `--surface` keluar sebagai
`oklab(0.9322 …)` di belakang teks `--color-secondary`, yang pada tema gelap
adalah kertas. axe mengukur tujuh simpul pada rasio **1.06, 1.07 dan 1.1** —
kertas di atas nyaris-kertas, halaman yang tidak terbaca sama sekali.
Diperbaiki dengan mengubah selektornya menjadi `:root, [data-theme]`, yang
membuat komentar blok itu sendiri — _"they adapt automatically across every
`[data-theme]`"_ — benar untuk pertama kalinya sejak tema pindah.

**Wash hilang.** `e2e/visual-substance.e2e.ts` melaporkan halaman ber-aksen
dan kontrolnya pada **16.977343750000337** keduanya, identik sampai lima
belas desimal. `body` punya latar istimewa: browser mempropagasikannya ke
kanvas dokumen, yang dilukis di belakang **segalanya**, termasuk
`z-index: -1`. Tiga wash mengandalkan itu. Latar di elemen biasa dilukis di
aliran normal, jadi anak `z-index: -1` pergi ke belakangnya. Diperbaiki
dengan `isolation: isolate` pada ground — di dalam konteks penumpukan, latar
elemen dilukis lebih dulu, anak ber-`z-index` negatif kedua, isi ketiga.
`isolation` dan bukan `transform`/`filter`, yang juga membuat konteks
penumpukan tapi sekaligus menjadi containing block bagi `position: fixed` —
itu akan mencabut header, kursor dan kanvas dari viewport.

**Plat memperlihatkan bingkainya sendiri.** `e2e/continuous-motion.e2e.ts`:
2 plat terekspos di tiga dari empat posisi gulir. `useParallax` menggerakkan
lapisan sejauh `distance / 2` persen dari tingginya, dan lapisan itu
di-_hardcode_ `108%` / `-4%` terhadap distance default 6 — tidak menyisakan
apa pun ketika kolom kanan naik ke 9. Diperbaiki dengan `--card-drift`, yang
`ProjectCard` set dari angka yang sama yang ia berikan ke hook: dua angka
yang seharusnya sepakat dan tidak punya cara untuk sepakat adalah persis
cacatnya.

**Recede jurnal disapu ulang, di tema yang benar.** `--row-recede: 0.7`
ditetapkan Tahap 27 oleh sapuan axe — di tema **gelap**, lantai 0.65. Di
terang, 0.7 memberi **3.8:1**, enam simpul. Itu bukan regresi nilai; itu
nilai yang ditanya pertanyaan yang belum pernah ditanyakan kepadanya.
Disapu ulang dengan metode yang sama pada halaman terang yang dirender:

| recede | hasil  |
| -----: | ------ |
|   0.70 | 3.80:1 |
|   0.75 | 4.27:1 |
|   0.80 | bersih |
|   0.85 | bersih |

Lantai terang adalah **0.80**, dan nilainya satu langkah di atasnya — aturan
yang sama yang diikuti sapuan gelap, diterapkan pada angka yang sapuan gelap
tidak mungkin tahu.

**Anggaran rute: nol plafon dinaikkan.** `/en/practice/consulting` mencapai
**tepat 900KB** terhadap plafon 900. Dibuktikan dua arah dengan gerbangnya
sendiri sebagai instrumen: tanpa ikon, sembilan rute lulus; dengan ikon,
rute itu menyentuh plafonnya. Rencana Tahap ini mengizinkan menaikkan plafon
dengan alasan tertulis — dan `route-budget.e2e.ts` sendiri mencatat dua kali
sebelumnya bahwa **tidak ada plafon dinaikkan**, karena perbaikannya adalah
berhenti mengirim beratnya. Aturan itu yang dipakai: satu record `PATHS`
harus mengirim setiap entri ke apa pun yang membaca satu entri, jadi halaman
dengan breadcrumb dan kotak pencarian mengunduh empat glyph lightbox juga.
Dipecah satu glyph per modul; sembilan rute lulus, plafon tidak disentuh.

### 6.4b Ronde kedua: satu perbaikan yang membuat keadaan lebih buruk

Suite penuh setelah perbaikan di atas: **498 lulus, 27 gagal** — lebih banyak
dari 15 sebelumnya. Itu bukan gerbang baru yang menemukan cacat lama; itu
satu perbaikan saya yang salah, dan pantas ditulis karena cara menemukannya
adalah metode yang sama.

Memindahkan ground ke elemen bertema berarti saya **menghapus**
`background-color` dan `color` dari `body`, dengan alasan yang terdengar
benar: `body` tidak bisa tahu tema rutenya, jadi melukisnya akan menaruh
ground satu tema di belakang halaman tema lain.

Diukur langsung dengan axe, keenam rute **bersih**. Dijalankan lewat
gerbangnya, empat merah. Selisihnya adalah satu baris di `route-sweep`:
`settleReveals()` menggulir seluruh halaman lalu kembali ke atas. Ditiru
persis, cacatnya muncul:

```
div[aria-hidden="false"] > .wordmarkWord.h1
  contrast of 1.08 (foreground #f7f6f3, background #ffffff)
```

`#ffffff` bukan warna mana pun di situs ini. Itu **kanvas dokumen yang tidak
dilukis**: axe jatuh ke warna dokumen ketika elemen berada di luar layar, dan
setelah `scrollTo(0, 0)` footer memang di luar layar. Selama `body` punya
latar, cadangan itu benar. Tanpa itu, ia putih — dan setiap cerita Storybook,
yang tidak punya elemen ground sama sekali, gagal karena hal yang sama.

**Perbaikannya membuat kedua lapis benar sekaligus, bukan memilih satu.**
`body` melukis lagi, dan `Theme` menyalin temanya ke `documentElement` di
sebuah efek — tapi efek itu tidak lagi _menentukan_ apa pun. Ground yang
dirender server memutuskan tema; efek hanya menjaga kertas di bawahnya
sewarna. Urutan itu yang penting, dan ia ditulis di kedua berkas supaya tidak
terbaca sebagai kembali ke titik awal:

- tanpa JavaScript: `<html>` tanpa tema, `body` melukis default, **ground
  melukis tema rute yang benar secara opak di atas 100% body** — yang dilihat
  pembaca benar;
- dengan JavaScript: `<html>` ikut, jadi kanvas dan cadangan axe ikut benar;
- `taste-preflight` "satu tema per halaman" tetap lulus di kedua keadaan.

### 6.4c Satu tes flaky, dikejar sampai akar, dan dua perbaikan saya sendiri

dibatalkan

Ronde ketiga: **528 lulus, 0 gagal, 1 flaky**. Suite keluar dengan kode 0,
dan itu tidak cukup — proyek ini memperlakukan flaky sebagai sinyal.

`project-detail` "passes axe at every impact" gagal di mobile lalu lulus saat
diulang. Ditiru: **5 dari 5** kali gagal, jadi bukan kebetulan. Targetnya
bukan yang saya duga:

```
.marquee-module__inner[aria-hidden="false"] > .wordmarkWord
  contrast of 1.02 (foreground #f7f6f3, background #f4f3ef)
```

Wordmark footer, bukan caption galeri yang baru saya tambahkan.

**Dua perbaikan dicoba dan keduanya salah — dan itu ditulis, bukan dibiarkan
berdiri.**

1. `aria-hidden={i !== 0}` merender `aria-hidden="false"` pada track pertama,
   di dalam `<section aria-hidden="true">`. Itu memang markup yang keliru dan
   diperbaiki, tapi ia **tidak memperbaiki temuannya**: `color-contrast`
   mengukur teks yang bisa dilihat mata, jadi `aria-hidden` tidak pernah
   mengecualikannya. Perubahannya tetap, komentarnya ditulis ulang supaya
   berdiri di atas "ini markup yang benar", bukan di atas hasil yang tidak
   pernah terjadi.
2. Strip wordmark diberi latarnya sendiri supaya groundnya determinan.
   Diukur: **9 dari 12** kali masih gagal. Dibatalkan — kode yang tidak
   melakukan apa pun dengan komentar yang menyiratkan sebaliknya adalah
   persis cacat yang dokumen §6.5 di bawah ini ada untuk mencegah.

**Akar sebenarnya.** Tes itu menjalankan axe tepat setelah
`domcontentloaded`, jadi ia mengukur halaman yang animasi masuknya masih
berjalan. Diukur pada build yang sama, 390×844:

| Kapan diukur    | Hasil                                                          |
| --------------- | -------------------------------------------------------------- |
| belum mengendap | `color-contrast` 1.04, 1.04, 1.05 — figcaption, eyebrow, `.h2` |
| sudah mengendap | **bersih**                                                     |

Ia lulus selama halaman ini tidak punya **teks** yang muncul di bawah lipatan
untuk dijangkau axe. Tahap 43 memberi tiap plat nomornya, dan frame pada
`opacity: 0.02` tertangkap — bersama eyebrow dan judul karya berikutnya, yang
sudah mid-fade sejak dulu dan hanya tidak punya apa pun di sebelahnya untuk
menarik pandangan.

Jadi instrumennya yang dibetulkan, dengan preseden yang sudah ada di repo
ini: `e2e/route-sweep.e2e.ts` membawa `settleReveals()` untuk alasan yang
sama persis, dan Tahap 26 membatasi stagger katalog di delapan kartu
"untuk mencegah axe mengaudit frame di tengah fade". Menggulir juga penting
sendiri: reveal digerakkan `IntersectionObserver`, jadi isi di bawah lipatan
bahkan belum mulai sebelum terlihat.

### 6.5 Yang berubah dari spec ini sendiri, dan dikatakan

- **Kursor tidak menyilangkan muatan lama dan baru.** §4c menjanjikan yang
  lama keluar lalu yang baru masuk. Yang dikirim menganimasikan **kedatangan
  saja**: pertukaran dua fase menghabiskan `--duration-micro` dua kali, 300ms,
  untuk menyembunyikan dua karakter yang tidak sedang dilihat pembaca — dan
  selama itu ring tidak menampilkan angka lama **maupun** baru.
- **Kartu proyek tidak mendapat muatan kursor.** §4c mendaftarkannya
  ("praktiknya"). Kartu tidak menampilkan praktiknya di DOM — barisnya
  `engagement · client · year` — jadi memberinya muatan akan melanggar aturan
  paritas DOM yang ditulis dua paragraf di atasnya. Kartu tetap "View".
- **Ikon tautan luar dibuang.** `arrow-up-right` sudah diambil sebelum
  diukur bahwa situs ini **tidak merender satu pun tautan luar**: satu-satunya
  `target="_blank"` ada di `/ai` di dalam `SITE.sameAs.length > 0`, dan Tahap
  35 mengosongkan `sameAs`. Penanda untuk tautan yang tidak dirender adalah
  cacat yang sama dengan token tanpa konsumen.
- **`docs/PROVENANCE.md` §6 dikoreksi.** Ia berbunyi "No third-party source
  has been copied" sampai Tahap ini menyalin tujuh path Phosphor. Kalimat itu
  akan menjadi dokumen yang berbohong tentang kodenya sendiri, jadi ia
  diperbaiki di commit yang sama dengan penyalinannya.

### 6.6 Gerbang

Dijalankan terhadap build produksi segar (`rm -rf .next && bun run build`),
suite penuh, bukan hanya berkas yang disentuh — perbaikan tema menyentuh
setiap rute di situs, dan tiga dari lima regresi §6.4 hidup di berkas yang
tidak satu pun perubahan Tahap ini sebut.

```
bun run build            ✅
bun run build-storybook  ✅  (exit 0)
bun run check            ✅  oxlint · oxfmt · tsc · unit 458 lulus, 0 gagal ·
                             plugin anti-slop · manifest · assets
CI=true bun run test:e2e ✅  529 lulus, 0 gagal, 0 flaky, 16 dilewati (11,5 menit)
```

**518 → 529, dan kesebelasnya terhitung:** delapan asersi
`e2e/exploratory-layer.e2e.ts` (desktop) dan tiga story Storybook baru untuk
`vault/primitives/icon`. Sisa 518 adalah angka Tahap 42, tidak berubah — jadi
tidak ada gerbang lama yang dilonggarkan untuk mendapatkan yang baru, dan
satu-satunya gerbang yang **diubah** adalah dua yang §6.4c dan §6.4 jelaskan:
`catalogue-layout` membaca nama chip alih-alih `textContent`-nya, dan
`project-detail` mengendapkan reveal sebelum menjalankan axe. Keduanya
instrumen yang mengukur hal yang salah, dengan angka sebelum-sesudahnya
ditulis.

**Nol flaky.** Ronde sebelumnya melaporkan satu, dan itu dikejar sampai akar
alih-alih diulang sampai hijau — §6.4c.

**Nol plafon anggaran dinaikkan**, dan itu dibuktikan dua arah dengan
gerbangnya sendiri sebagai instrumen.

**Yang tidak diukur, dan dikatakan di sini alih-alih didiamkan:** tidak ada
profiler browser di lingkungan ini, jadi tidak ada klaim biaya frame untuk
`constellation-drift`. Yang diukur adalah geometri (`getBoundingClientRect`
pada 12 posisi gulir), warna (axe pada rasio sebenarnya, dan sapuan recede
per nilai), dan berat (byte `/_next/static/*.js` lewat `route-budget`).
Biaya per frame tetap anggaran, bukan pengukuran (`CLAUDE.md` #19).

**Yang belum dikerjakan dan bukan bagian Tahap ini:** `vault/motion/flip`,
`vault/blocks/project-spine` dan `vault/primitives/cursor` masih tanpa story
untuk bentuk barunya (Tahap 46); 404 tanpa JavaScript masih merender 28
karakter (`TAHAP-38.md` §7.4, masih terbuka).
