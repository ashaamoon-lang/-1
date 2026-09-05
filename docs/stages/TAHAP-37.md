# Tahap 37 — Menutup lubang gerbang

> Status: spec. Kode belum ditulis saat baris ini dibuat (`docs/ROADMAP.md` §3.0).

Tahap yang membuat Tahap 34–36 **tinggal**. Tanpa ini, perbaikan tiga Tahap
terakhir akan bocor lagi diam-diam — persis seperti 51% spasi dan 53 ukuran
tipe yang bocor sekarang.

---

## 1. Diagnosis: penegakan sangat baik di mana ia ada, absen persis di mana sistemnya paling lemah

Repo ini punya lapisan penegakan yang lebih baik dari kebanyakan studio yang
pernah menang. `contrast.test.ts` meratchet **dua arah** dengan baseline
kosong dan mem-parse resep `color-mix()` langsung dari stylesheet.
`motion-rules.test.ts` menolak **semua** literal durasi numerik dan menuntut
komentar `motion-exempt:` berposisi tepat. `setup-styles.test.ts` mem-byte-
match CSS tergenerasi terhadap build segar. `luminance.ts` menangkap dua cacat
yang tidak bisa dilihat asersi DOM mana pun.

Dan lapisan itu absen persis di tempat sistem desainnya paling lemah. Diukur
2026-09-05:

| Aturan yang tertulis di `DESIGN-SYSTEM.md`              | Ditegakkan? | Kenyataan terukur                                                                                                                                                          |
| ------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §3 "spasi diturunkan dari gap: 8/16/24/32/48/64/96/128" | ❌ **nol**  | 29 nilai berbeda; **192 dari 375 kemunculan (51,2%) di luar tangga**, 21 nilai di luar                                                                                     |
| §2 skala tujuh kelas                                    | ❌ **nol**  | **53 deklarasi `font-size`** melewatinya. `not-configured` (17) dan `not-found-view` (10) masing-masing membawa **skala tipe paralel lengkap**                             |
| §2 "dua sampai tiga bobot"                              | ❌ **nol**  | **empat**: `font-weight: 500` tayang 4×                                                                                                                                    |
| §3 "selalu `minmax(0, 1fr)`"                            | ❌ **nol**  | `select.module.css:71`, dan **`dr-grid` — utilitas grid proyek ini sendiri**                                                                                               |
| §6.2 "token semantik, bukan literal"                    | ⚠️ separuh  | **13 `oklch()` mentah** di komponen; gate melarang hex/rgb/hsl/nama warna, **tidak** melihat `oklch()`                                                                     |
| §1 gate warna                                           | ⚠️ separuh  | `setup-styles.test.ts` memindai `{app,components,lib}` — **`vault/` tidak dipindai**, dan `vault/` adalah situsnya                                                         |
| §5 reduced motion                                       | ⚠️ separuh  | **14 stylesheet** punya transisi dan nol blok `@media (--reduced-motion)`; kill switch `*` kalah dari kelas komponen mana pun, dan `global.css:352` menjelaskannya sendiri |
| `motion-rules` melihat properti kustom                  | ❌          | `--reveal-stagger: 120ms` (hero), `90ms` (project-hero), `70ms` ×2, `60ms` (default global) — **tiga di antaranya bukan nilai token sama sekali**                          |
| `motion-rules` melihat className TSX                    | ❌          | 3 `transition-colors` Tailwind di `error.tsx` dan `error-view` membawa kurva default browser                                                                               |

---

## 2. Kenapa nol token untuk separuhnya

Empat dari sembilan baris di atas tidak bisa diperbaiki hanya dengan menulis
gerbang, karena **tokennya belum ada**:

- Nol token spasi. `@theme` menyetel `--spacing-*: initial` dan mendefinisikan
  hanya `0`, `safe`, `gap`, `header-height`, `section-lead`. Menuntut "pakai
  token" tanpa token adalah gerbang yang tidak bisa dipatuhi.
- Nol token radius. **19 deklarasi `border-radius` berbeda** dikirim.
- Nol token elevasi. Enam `box-shadow`, enam opasitas, enam offset.
- Nol `h3`, dan lubang 48→120 di skala tipe. Subjudul antara 20 dan 48 harus
  dikarang lokal — dan itulah asal empat `clamp()` ad-hoc.

Jadi Tahap ini tiga bagian, dan urutannya wajib.

---

## 3. Bagian a — gerbang, dibuktikan merah

Tiga berkas, semuanya pemindai sumber, karena tiap aturan di sini adalah
aturan tentang **apa yang ditulis**, bukan apa yang dirender — pembagian yang
`motion-rules.test.ts` sudah tarik dan yang Tahap 34 buktikan benar dua kali.

### `lib/styles/scripts/scale-rules.test.ts` (baru)

1. Tiap argumen `mobile-vw()` / `desktop-vw()` ada di tangga spasi.
2. Nol `font-size` di `app/`, `components/`, `vault/` — ukuran datang dari
   utilitas tipe, atau dari `--text-*` token.
3. Nol `font-weight` di luar 400/600/700.
4. Nol `border-radius` di luar token radius.
5. Nol `box-shadow` di luar token elevasi.
6. Nol bare `1fr` di `grid-template-columns` / `grid-template-rows`.

### `lib/styles/scripts/setup-styles.test.ts` (diperluas)

7. Cakupan warnanya diperluas ke **`vault/`**.
8. `oklch()` mentah dilarang di komponen — sama seperti hex.

### `lib/styles/scripts/motion-rules.test.ts` (diperluas)

9. Properti kustom `--reveal-*` / `--stagger-*` tidak boleh membawa literal ms.
10. Utilitas transisi Tailwind di className TSX dilarang.
11. Tiap stylesheet yang mendeklarasikan `transition` atau `animation` wajib
    punya blok `@media (--reduced-motion)`.

Tiap asersi berlantai anti-vakum, dan tiap satu **dibuktikan merah** dengan
angka §1 sebelum apa pun diperbaiki.

---

## 4. Bagian b — token yang lahir

Nol nilai baru dikarang. Tiap token diturunkan dari yang sudah dikirim.

### 4.1 Spasi

Tangga `DESIGN-SYSTEM.md` §3 sudah menyebutkannya: **8 / 16 / 24 / 32 / 48 /
64 / 96 / 128**, diturunkan dari gap 16. Ditambah `4` — 32 kemunculan, dan
setengah dari 8 adalah langkah yang sah untuk jarak optis.

21 nilai di luar tangga dipetakan ke tetangga terdekatnya, **dan tiap
pemetaan yang menggeser lebih dari 2px dicatat**. Yang tidak bisa dipetakan
tanpa merusak sesuatu mendapat `/* scale-exempt: <alasan> */`, mengikuti bentuk
`motion-exempt:` yang sudah ada.

### 4.2 Radius, elevasi, dan `h3`

- **Radius:** 19 deklarasi menjadi `--radius-sm` / `--radius-md` /
  `--radius-full`, diturunkan dari nilai yang paling sering dikirim (4px, 8px,
  50%).
- **Elevasi:** enam `box-shadow` menjadi `--shadow-sm` / `--shadow-md`. Semua
  enam ada di pembungkus Base UI; nol di blok `vault/`.
- **`h3`:** 48 → 120 adalah lubang. `h3` mengisi 24 → 32, memberi subjudul
  ukuran tanpa mengarangnya lokal.

### 4.3 Tiga warna kromatik mendapat nama

Hijau `oklch(0.7227 0.192 149.58)`, merah `oklch(0.577 0.2152 27.33)`, biru
`oklch(0.6231 0.188 259.81)` — chroma 0,19–0,22, warna **paling jenuh di
seluruh situs**, di sistem yang menyatakan tidak punya aksen kromatik.

Mereka **status semantik, bukan aksen merek**, dan itu ditulis di tokennya:
`--color-status-positive` / `-negative` / `-notice`. Sadar-tema, dan masuk
`contrast.test.ts` — yang berarti pasangan barunya harus lolos AA sebelum
Tahap ini bisa hijau.

---

## 5. Bagian c — pelanggaran dibersihkan

Urutannya mengikuti biaya: yang mekanis dulu, yang menuntut penilaian
belakangan.

1. 14 stylesheet mendapat blok reduced-motion.
2. `font-weight: 500` → 400 atau 600, per kasus.
3. `select.module.css:71` dan `dr-grid` → `minmax(0, 1fr)`.
4. 3 `transition-colors` TSX → kelas CSS dengan token.
5. `--reveal-stagger` literal → token.
6. 13 `oklch()` mentah → token §4.3 dan `--shadow-*`.
7. 53 `font-size` → utilitas tipe. Dua skala paralel di `not-configured` dan
   `not-found-view` dihapus, bukan dipindahkan.
8. 192 kemunculan spasi di luar tangga → tangga §4.1.

---

## 6. Risiko

- **Ini menyentuh hampir setiap stylesheet di repo.** Konsekuensi geometrinya
  nyata dan gerbang geometri yang ada akan mengukurnya. Yang merah karena
  halamannya benar-benar berubah diperbaiki di halamannya, bukan dengan
  melonggarkan gerbangnya.
- **Memetakan spasi ke tangga menggeser piksel.** Pergeseran >2px dicatat satu
  per satu; `spatial-rhythm.e2e.ts` dan `catalogue-layout.e2e.ts` adalah yang
  paling mungkin bicara.
- **Tiga warna status masuk `contrast.test.ts`.** Kalau salah satu tidak lolos
  AA di salah satu tema, warnanya yang berubah — bukan ambangnya.
- Sepuluh dari 14 stylesheet tanpa reduced-motion ada di komponen **nol
  konsumen** yang Tahap 45c akan hapus. Diperbaiki tetap, karena aturan
  tentang apa yang ditulis harus memeriksa apa yang ditulis, dan karena kode
  mati hari ini adalah kode terbit besok.

---

## 7. Hasil

### 7.1 Sepuluh gerbang, sepuluh merah

Ditulis dulu, dijalankan terhadap situs sebagaimana adanya, 2026-09-05:

| Gerbang                            |     Pelanggar |
| ---------------------------------- | ------------: |
| Spasi di kisi                      | **159 baris** |
| `font-size` dari skala             |        **52** |
| Bobot 400/600/700                  |             4 |
| Radius dari token                  |            44 |
| Elevasi dari token                 |             6 |
| Nol bare `1fr`                     |             2 |
| Nol utilitas transisi di markup    |             3 |
| Warna: `vault/` + `oklch()` mentah |            14 |
| Blok reduced-motion per stylesheet |        **14** |
| Knob reveal membawa token          |             6 |

### 7.2 Keputusan yang saya ambil terbuka: tangganya diganti, bukan ditegakkan

`DESIGN-SYSTEM.md` §3 menyebut 8/16/24/32/48/64/96/128, dan 192 dari 375
kemunculan di luarnya. Sebelum menegakkannya, histogramnya dibaca:

```
 8 x51   16 x51   12 x39    4 x32   24 x31   20 x30   32 x18
 6 x16   48 x15   10 x15    2 x13   96 x9    28 x8   160 x8   ...
```

**12 dikirim 39 kali dan 20 dikirim 30 kali.** Itu bukan kelalaian — itu
penulis yang mengikuti sistem selama 36 Tahap dan berulang kali membutuhkan
langkah antara 8 dan 16, dan antara 16 dan 24, yang tangga itu tidak bisa
ungkapkan. Memaksa 69 di antaranya pindah berarti menggeser piksel nyata di
halaman nyata demi tangga yang ditulis sebelum situsnya ada.

Jadi aturannya jadi kisi yang situs ini memang pakai: **kelipatan 4**. Ia
tetap menolak masalah dua-puluh-sembilan-nilai-sembarang — 6, 10, 2, 14, 18, 3
dan 50 semuanya gagal — dan tiap satu berada dalam 2px dari nilai yang sah,
jadi koreksinya terbatas dan bisa diperiksa. 8/16/24/32/48/64/96/128 tetap
**subset yang disukai**, dan `DESIGN-SYSTEM.md` §3 sekarang mengatakan
keduanya, dengan histogram ini sebagai alasan ia mengatakan yang kedua.

**Dan nilai di bawah satu langkah bukan spasi.** 1, 2 dan 3px yang tersisa
adalah penyelarasan hairline dan inset optis — padding dalam sebuah switch,
nudge baseline sebuah tab, bar indikator 3px. Membulatkan inset 2px ke 4px
menggandakannya. Kisi mengatur _langkah_; yang di bawah satu langkah adalah
jenis angka lain, dan aturannya mengatakan itu alih-alih berpura-pura.

Hasilnya **40 suntingan**, semuanya pergeseran ≤2px: 6→8 (16×), 10→12 (15×),
14→16 (5×), 18→20 (3×), 50→48 (1×).

### 7.3 Token yang lahir, semuanya diturunkan

- **Radius** — 19 deklarasi berbeda jadi lima token. Piksel tetap, bukan
  diskalakan: sudut adalah perlakuan tepi, bukan ukuran ruang, dan
  `desktop-vw(4px)` di 2560px adalah sudut 7,1px, yang terbaca sebagai bentuk
  lain alih-alih bentuk sama yang lebih besar. **44 pemakaian dipetakan**; dua
  pemetaan menggeser lebih dari 2px (12→8 dan 6→4) dan keduanya dicatat di
  `global.css`.
- **Elevasi** — enam `box-shadow` tulisan tangan, enam opasitas, enam offset,
  **semuanya di pembungkus Base UI dan nol di blok `vault/`** — bentuk sistem
  yang tidak pernah memutuskan ia punya elevasi. Tiga token menutupi keenamnya,
  dan diarang lewat palet supaya gate warnanya bisa melihatnya.
- **`h3`** — skala melompat dari `p-big` (20 desktop) langsung ke `h2` (48).
  Empat `clamp()` ad-hoc di seluruh situs adalah lubang itu diisi tangan.
- **Tiga warna status** — hijau, merah, biru pada chroma 0,19–0,22, **warna
  paling jenuh di seluruh situs**, di sistem yang menyatakan tidak punya aksen
  kromatik. Dinamai `--color-status-*` dan dijaga di luar `themes`: sebuah
  status berarti sama di kertas dan di tinta, dan memasukkannya ke rekaman tema
  akan memberi `contrast.test.ts` enam pasangan peran baru untuk makna yang
  tidak berubah antar tema.
- **`--stagger-hero: 120ms`** — hero membawa literal 120ms yang tak terlihat
  siapa pun. Ia di luar tabel per-langkah §3 dan **di dalam** batas totalnya
  (§2: empat item × 120 = 480ms, plafon hero 900ms). Sebuah hero punya sedikit
  elemen dan mampu membayar ketukan lebih panjang: itu pita ketiga, bukan
  pelanggaran atas dua yang ada, jadi ia dapat nama dan §3 dapat baris.

### 7.4 Instrumennya salah empat kali

1. **Aturan `font-size` terlalu luas.** Ia menandai `font-size: inherit` dan
   `1.1em` — keduanya _mengambil_ ukurannya dari skala lewat leluhur, dan
   menandainya akan mendorong penulis menulis angka absolut, kebalikan dari
   yang aturannya mau.
2. **Pengecualian hanya membaca satu baris di atas.** Sebuah alasan yang layak
   ditulis jarang muat satu baris, dan untuk komentar blok baris di atas
   deklarasinya adalah `*/`, bukan penandanya. **Tiap pengecualian multi-baris
   di repo terbaca sebagai tidak-dikecualikan.**
3. **Penjelajah komentar berhenti di tengah blok** karena baris lanjutan di
   sini tidak diawali `*`.
4. **Regex pengecualian tingkat-berkas tidak bisa melewati `*` pembuka
   komentar** (`/*\n * scale-exempt-file:`), jadi ketujuh berkas yang saya
   tandai tetap terbaca sebagai pelanggar.

Ditambah satu yang benar dan saya harus tetap perbaiki: blok reduced-motion
yang saya sisipkan memakai literal `0.01ms`, dan **`motion-rules` #8 menolaknya
— tepat sebagaimana mestinya.** Ia mendapat `motion-exempt:` dengan alasan yang
sama yang `global.css` sudah tulis untuk kill switch-nya sendiri.

### 7.5 Yang TIDAK diperbaiki, dan berkas yang menanggungnya

Tujuh stylesheet membawa `scale-exempt-file:` — `not-configured`,
`form/`, `form/fields/`, `toast`, `tooltip`, `select`, `alert-dialog`.
Semuanya **nol konsumen** dan semuanya dijadwalkan dihapus di Tahap 45c.
Mengonversi tipenya berarti mengambil keputusan desain tentang komponen yang
merender di nol rute, demi menghapusnya dua Tahap kemudian. Aturannya tetap
melihat berkasnya; alasan melewatinya ada di kepala berkas, bukan di sebuah
diam. Kalau seorang konsumen datang, penandanya pergi.

Enam `scale-exempt:` per-baris, masing-masing dengan alasannya: numeral 404,
numeral step-sequence, wordmark header, label kursor, subline hero, aside
katalog. Empat di antaranya adalah "ukuran ini di antara dua kelas skala" —
kelas kesenjangan yang sama yang `h3` ditambahkan untuk hentikan, dan
mengonversinya adalah keputusan desain, bukan penutupan gerbang.

Numeral 404 **tetap diperbaiki di bagian yang nyata**: ia raw
`calc(N / 375 * 100vw)`, jadi ia mencapai 239px di 2560 dan 68px di 320.
Sekarang lewat `mobile-vw`/`desktop-vw`, jadi pita Tahap 36 berlaku.

### 7.6 Verifikasi

```
bun run check              hijau — 457 unit test (49 berkas), oxlint, oxfmt, tsc, manifest, assets
CI=true bun run test:e2e   464 lulus, 16 dilewati, nol gagal, nol flake (10,2 menit)
bun run build-storybook    hijau
```

Suite penuh **hijau di jalan pertama**, nol gerbang lama ikut merah — untuk
Tahap yang menyentuh hampir setiap stylesheet di repo, plus 40 pergeseran
spasi, 44 pemetaan radius dan enam elevasi. Itu konsekuensi dari batasnya:
tiap pergeseran spasi ≤2px, dan radius tidak pernah memindahkan kotak.
