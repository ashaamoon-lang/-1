# ROADMAP — Dari Fondasi ke Website Jadi

> **Status:** disetujui, belum dieksekusi. Tahap 0 adalah pekerjaan berikutnya.
>
> Dokumen ini adalah kontrak kerja untuk membangun situsnya. Agen mana pun yang
> membuka repo ini membacanya setelah `CLAUDE.md`. Ia menetapkan **apa** yang
> dibangun dan **urutannya**; `CLAUDE.md` menetapkan **bagaimana** menulis
> kodenya, dan menang kalau keduanya tampak bertentangan.
>
> Rencana ini berhenti di level arsitektur **dengan sengaja**. Lihat §3.0 —
> tiap tahap wajib diperdalam menjadi stage-spec sendiri sebelum dikerjakan.

## Context

Fondasi sudah berdiri dan hijau: Satūs ter-fork, di-prune, riset terukur di
`docs/`, dan `vault/` berisi delapan pola siap pasang. Yang belum ada adalah
**situsnya sendiri** — dan cara kerja yang menjamin kualitasnya tidak turun
begitu kita mulai menulis banyak kode.

Dokumen ini menjawab tiga hal, berurutan:

1. **Struktur & ekspektasi akhir** — bentuk situs yang kita tuju, dan definisi
   "selesai" yang bisa diuji, bukan dirasakan.
2. **Alur kerja** — ritual skill yang wajib di setiap tahap, dan aturan
   library-first supaya kita tidak membuang waktu menulis sintaks yang sudah
   disediakan orang lain.
3. **Tahapan eksekusi** — enam tahap dengan gerbang masuk/keluar, masing-masing
   **wajib diperdalam ulang** oleh reasoning sebelum dieksekusi.

Keputusan yang sudah dikunci oleh user:

|               |                                             |
| ------------- | ------------------------------------------- |
| Jenis karya   | **Still image** — ilustrasi, lukisan, mural |
| Sumber konten | **Sanity CMS**                              |
| Bahasa        | **Bilingual ID/EN**                         |
| Cakupan v1    | **Single page + halaman detail proyek**     |

---

# BAGIAN 1 — Struktur & Ekspektasi Akhir

## 1.1 Peta rute

Bilingual dengan **kedua locale diberi prefix**, dan root melakukan redirect:

```
/                    → redirect ke locale hasil negosiasi (default: /en)
/en                  → home (single page)
/id                  → home (single page)
/en/work/[slug]      → detail proyek
/id/work/[slug]      → detail proyek
/studio              → Sanity Studio (tidak dilokalkan)
/ai, /llms.txt, /sitemap.xml, /robots.txt   (sudah ada, perlu sadar-locale)
```

**Kenapa kedua locale di-prefix, bukan `/` = EN dan `/id` = ID.**
`lib/seo/alternates.ts` menegaskan canonical harus sama persis dengan URL yang
disubmit `app/sitemap.ts` — kalau tidak, mesin pencari merayapi satu URL dan
mengindeks yang lain. Skema asimetris membuat home punya dua bentuk sah (`/`
dan `/en`) dan itu persis ambiguitas yang diperingatkan file tersebut. Prefix
simetris = satu bentuk canonical per halaman, tanpa kasus khusus di sitemap,
llms.txt, maupun negosiasi Markdown.

Implementasi: segmen `app/(site)/[locale]/` dengan `generateStaticParams`
mengembalikan `['en','id']`, plus redirect root.

## 1.2 Susunan home (single page)

Diambil dari pola **`Portfolio Grid`** di `ui-ux-pro-max` (`landing.csv`), yang
menetapkan urutan seksi: `Hero (Name/Role) > Project Grid (Masonry) >
About/Philosophy > Contact`, dengan strategi warna _"Neutral background (let
work shine), accent minimal"_ — sejalan dengan temuan `docs/TEARDOWN.md` §3.

| #   | Seksi               | Komponen                    | Catatan                                                                  |
| --- | ------------------- | --------------------------- | ------------------------------------------------------------------------ |
| 1   | Hero                | `vault/blocks/hero`         | Nama studio + proposisi. `TextReveal` + `SceneShell` sebagai aksen.      |
| 2   | Selected Work       | `vault/blocks/project-grid` | Grid 12 kolom, span 6/12 dicampur supaya tidak terbaca spreadsheet.      |
| 3   | Studio / Philosophy | blok baru                   | Teks pendek + satu potret/foto studio.                                   |
| 4   | Process             | blok baru (opsional)        | Hanya jika ada isi nyata. Seksi kosong lebih merusak daripada tidak ada. |
| 5   | Contact             | blok baru                   | Satu CTA, email, sosial.                                                 |

Navigasi adalah anchor dalam halaman (`#work`, `#studio`, `#contact`) plus
pengalih bahasa. Karena satu halaman panjang, **koreografi scroll harus kuat** —
itu konsekuensi yang diterima saat memilih opsi single-page.

## 1.3 Halaman detail proyek

```
Hero gambar sampul  →  Meta (klien, tahun, medium, dimensi)
                    →  Deskripsi  →  Galeri  →  Proyek berikutnya
```

Galeri = gambar diam, jadi `next/image` + `@sanity/image-url` sudah cukup;
tidak perlu pipeline video. `components/ui/sanity-image` sudah ada.

## 1.4 Model konten Sanity — lokalisasi di level field

Dua pendekatan standar. Untuk situs ini, **field-level** yang benar:

- **Field-level** (dipilih): satu dokumen `project`, field teks berisi objek
  `{ en, id }`. Gambar, urutan, tahun, dan slug **dipakai bersama**.
- Document-level (ditolak): satu dokumen per bahasa. Untuk portofolio yang
  bedanya cuma teks, ini menggandakan aset gambar dan membuat dua dokumen bisa
  hanyut isinya — karya yang sama bisa punya galeri berbeda per bahasa.

Skema baru (menyusul pola `lib/integrations/sanity/schemas/`):

```
localeString / localeText / localeRichText   ← tipe objek reusable {en, id}
project        title(loc) slug year medium client cover gallery[] body(loc) order
studioSettings name statement(loc) email socials[]
siteSettings   navLabels(loc) seoDefaults(loc)
```

`slug` sengaja tidak dilokalkan: satu slug per karya membuat hreflang
antar-bahasa sepele dan URL tetap stabil kalau nanti terjemahan berubah.

## 1.5 Definisi "selesai" — yang bisa diuji

Bukan perasaan. Setiap baris di bawah ini bisa dijalankan:

| Gerbang             | Perintah / bukti                                                            |
| ------------------- | --------------------------------------------------------------------------- |
| Semua cek CI        | `bun run check` exit 0                                                      |
| Build produksi      | `bun run build` exit 0                                                      |
| Unit test           | `bun test` — 0 fail                                                         |
| E2E + aksesibilitas | `CI=true bun run test:e2e` — 0 fail, axe bersih                             |
| Katalog komponen    | `bun run build-storybook` exit 0, tiap primitive punya story                |
| Kontras warna       | `lib/styles/scripts/contrast.test.ts` hijau, tanpa di-silence               |
| Reduced motion      | Tiap seksi diperiksa dengan preferensi aktif; konten **terlihat penuh**     |
| Bilingual           | `/en` & `/id` render; hreflang + `x-default` benar; sitemap memuat keduanya |
| Token               | Nol hex/px/ms mentah di komponen (ditegakkan saat review)                   |
| Tanpa JS            | Home tetap punya satu `<h1>` dan teks terbaca (test sudah ada)              |

**Yang sengaja TIDAK diklaim:** angka performa. Tidak ada profiling nyata yang
mungkin di lingkungan ini (`docs/TEARDOWN.md` mencatat proxy menutup tunnel
browser). Sampai `chrome-devtools-mcp` tersedia, semua angka performa disebut
**anggaran**, bukan hasil ukur. Ini aturan keras `CLAUDE.md` #19.

---

# BAGIAN 2 — Alur Kerja

## 2.1 Ritual skill — wajib, setiap tahap

Bukan opsional dan bukan "kalau sempat". Urutannya tetap:

**Sebelum mendesain UI apa pun — `ui-ux-pro-max`:**

```bash
S=.claude/skills/ui-ux-pro-max/scripts/search.py

python3 $S "Portfolio Grid"        --domain landing      # urutan seksi
python3 $S "<kebutuhan>"           --domain ux -n 5      # aturan interaksi & a11y
python3 $S "<kebutuhan>"           --domain typography   # pasangan font
python3 $S "<kebutuhan>"           --domain color        # palet + reasoning
python3 $S "scroll reveal stagger" --domain gsap         # durasi, easing, snippet
python3 $S "<topik>" --stack nextjs                      # 60 guideline Next
python3 $S "<topik>" --stack threejs                     # 53 guideline 3D
```

Dua aturan pemakaian yang lahir dari uji coba saya barusan:

1. **Pakai kosakata skill-nya.** Query `"creative studio portfolio commissioned
artwork"` mengembalikan **0 hasil**; `"Portfolio Grid"` mengembalikan pola
   lengkap. Kalau 0 hasil, skill menyebutkan _"Closest known terms"_ — ulangi
   dengan istilah itu.
2. **Kalau tetap 0 hasil, katakan terus terang** bahwa tidak ada kecocokan
   database sebelum memakai default umum. Skill itu sendiri yang memerintahkan
   ini, dan itu mencegah kita mengarang lalu mengklaimnya berbasis riset.

Hasil query **dicatat di stage-spec tahap tersebut**, supaya keputusan desain
bisa ditelusuri, bukan diperdebatkan sebagai selera.

**Skill lain, pada titik tetap:**

| Skill              | Kapan                                                      | Kenapa                                                  |
| ------------------ | ---------------------------------------------------------- | ------------------------------------------------------- |
| `/code-review`     | akhir tiap tahap, sebelum commit                           | Menangkap bug korektness + duplikasi                    |
| `/simplify`        | setelah tahap yang menambah ≥3 komponen                    | Membuang lapisan sebelum menumpuk                       |
| `/security-review` | tahap apa pun yang menyentuh form, route handler, atau env | Wajib sebelum kontak/CMS live                           |
| `/run`             | tiap tahap yang menghasilkan UI                            | Melihat halaman berjalan, bukan cuma test hijau         |
| `/init`            | —                                                          | Tidak dipakai; `CLAUDE.md` sudah ada dan lebih spesifik |

## 2.2 Aturan library-first — hemat sintaks

**Jangan tulis tangan apa yang sudah disediakan.** Sebelum menulis util atau
komponen baru, cek daftar ini dulu:

| Kebutuhan                                                      | Pakai ini                                                            | Sudah terpasang |
| -------------------------------------------------------------- | -------------------------------------------------------------------- | --------------- |
| Dialog, tabs, accordion, select, tooltip, toast, menu, switch  | `@base-ui/react` — sudah dibungkus di `components/ui/` (10 komponen) | ✅              |
| IntersectionObserver, ResizeObserver, window size, media query | `hamo`                                                               | ✅              |
| Smooth scroll                                                  | `lenis/react` — `useLenis`, `ReactLenis`                             | ✅              |
| Animasi + cleanup otomatis                                     | `@gsap/react` — `useGSAP` (scoping + revert)                         | ✅              |
| Frame loop bersama                                             | `tempus/react` — `useTempus` dengan `order` eksplisit                | ✅              |
| Helper 3D                                                      | `@react-three/drei`                                                  | ✅              |
| Query & live CMS                                               | `next-sanity` — `defineQuery`, `sanityFetch`, `SanityLive`           | ✅              |
| Gambar responsif dari CMS                                      | `@sanity/image-url` + `components/ui/sanity-image`                   | ✅              |
| Validasi                                                       | `zod`                                                                | ✅              |
| State klien                                                    | `zustand`                                                            | ✅              |
| Komposisi className                                            | `clsx`                                                               | ✅              |
| Reveal on scroll (CSS, tanpa GSAP)                             | `lib/hooks/use-reveal.ts`                                            | ✅              |
| Reveal teks, magnetic, cursor, transisi, scene 3D              | `vault/`                                                             | ✅              |

**Dependency baru butuh pembenaran tertulis** di stage-spec: apa yang
dihematnya, dan alternatif mana yang ditolak. Kandidat yang sudah saya
setujui di muka: `maath` dan `meshline` (keduanya MIT, dicatat di
`references/website-2k25-architecture.md`) kalau kebutuhan 3D memerlukannya.

**i18n memakai `next-intl` — keputusan user, dan sudah dieksekusi di Tahap 0.**

Rencana awal di sini merekomendasikan menolaknya: `proxy.ts` sudah menangani
negosiasi konten Markdown, rate limiting, dan header, plus katalog SEO sendiri
(`lib/seo/route-catalog.ts`) yang memberi makan sitemap, `/ai`, dan
`/llms.txt` — jadi library yang mengambil alih routing berisiko berebut dengan
semua itu. User memilih next-intl, dan itu keputusannya.

**Kekhawatiran itu ternyata dapat dikelola, dan sudah terbukti berjalan.**
next-intl mendokumentasikan komposisi manual: `createMiddleware(routing)`
dipanggil di dalam fungsi `proxy` kita sendiri, bukan sebagai default export
yang menggantikannya. Urutannya yang menentukan — Markdown diselesaikan lebih
dulu, sehingga alias `.md` tidak pernah sampai ke next-intl, dan redirect
locale dikembalikan apa adanya tanpa header Vary negosiasi.

Dua hal yang harus dijaga selamanya, keduanya sudah dites:

- `/studio` **tidak boleh** dilokalkan. Tanpa pengecualian eksplisit,
  next-intl me-redirect-nya ke `/en/studio` yang tidak ada — CMS mati
  sementara seluruh halaman lain tampak normal.
- Canonical harus tetap identik dengan URL sitemap. `localePrefix: 'always'`
  dipilih justru karena itu: satu bentuk canonical per halaman.

Risiko terbesarnya — next-intl tidak mendokumentasikan apa pun soal
`cacheComponents`, yang aktif di repo ini — diuji lewat spike sebelum kode
lain ditulis. Hasilnya: `/en` dan `/id` tetap terprerender statis (`○`),
karena locale dibaca dari `next/root-params` yang dapat dianalisis statis.

## 2.3 Aturan yang sudah mengikat

`CLAUDE.md` tetap berlaku penuh dan tidak diulang di sini. Yang paling sering
dilanggar saat menulis halaman: **nol `cubic-bezier()` mentah**, **nol 300ms
generik** (default 400ms), **hanya `transform`/`opacity`**, **satu RAF loop**,
dan **`prefers-reduced-motion` menyisakan konten terlihat penuh**.

---

# BAGIAN 3 — Tahapan Eksekusi

## 3.0 Gerbang pendalaman — berlaku untuk SETIAP tahap

Tidak ada tahap yang boleh langsung dikerjakan dari rencana ini. Rencana ini
sengaja berhenti di level arsitektur. Sebelum menulis kode, tiap tahap **wajib**
melalui langkah berikut, dan menghasilkan `docs/stages/TAHAP-<n>.md`:

1. **Baca ulang** `CLAUDE.md`, `docs/MOTION-SPEC.md`, `docs/DESIGN-SYSTEM.md`,
   dan `vault/README.md` bagian "apa yang jangan dibangun ulang".
2. **Jalankan query skill** yang relevan (§2.1) dan **tempel hasilnya** ke
   stage-spec — termasuk kalau hasilnya 0.
3. **Inventaris dulu, baru tulis**: daftar apa yang sudah ada di
   `components/ui/`, `lib/hooks/`, dan `vault/` yang menutupi kebutuhan tahap
   ini. Komponen baru hanya untuk yang benar-benar belum ada.
4. **Tulis stage-spec**: daftar file yang disentuh, kontrak props tiap komponen
   baru, dan kriteria keluar yang bisa dijalankan.
5. **Sebutkan risikonya** — apa yang paling mungkin gagal di tahap ini.

Baru setelah stage-spec itu ada, kode ditulis. Ini yang mencegah tahap
belakangan dikerjakan dengan kedalaman lebih dangkal dari tahap awal.

---

## Tahap 0 — Kontrak data & bilingual

Paling berisiko, jadi paling depan. Semua tahap lain bergantung padanya, dan
menambal i18n belakangan berarti menyentuh ulang setiap komponen.

**Kerja:**

- Segmen `app/(site)/[locale]/`, `generateStaticParams` → `['en','id']`,
  redirect dari root.
- Modul kamus bertipe (`lib/i18n/`): tipe locale, kamus, `getDictionary()`.
  Kunci hilang harus gagal saat typecheck, bukan diam-diam render kosong.
- **Perluas `routeAlternates()`** di `lib/seo/alternates.ts` dengan
  `languages` + `x-default`. Ini titik sisip yang benar: doc comment-nya
  menjelaskan Next menggabungkan metadata secara dangkal, jadi semua rute
  memang harus lewat helper ini.
- Ganti `locale: 'en_US'` yang di-hardcode di `lib/utils/metadata.ts:115` dan
  `app/(site)/layout.tsx:65` menjadi sadar-locale.
- `lib/seo/route-catalog.ts`, `app/sitemap.ts`, dan `/llms.txt` menjadi
  sadar-locale (tiap rute muncul dua kali).
- Skema Sanity: `localeString`/`localeText`/`localeRichText`, `project`,
  `studioSettings`, `siteSettings`; query + `bun run sanity:typegen`.
- Pengalih bahasa yang mempertahankan rute saat ini.

**Butuh dari Anda:** `NEXT_PUBLIC_SANITY_PROJECT_ID` + dataset. Tanpa itu
saya bisa menulis skema dan query, tapi tidak bisa memverifikasi data nyata —
dan saya akan menyebutnya sebagai belum terverifikasi, bukan hijau.

**Keluar:** build hijau · `/en` dan `/id` render · sitemap memuat keduanya ·
hreflang benar · typegen bersih · e2e lama tetap lulus.

---

## Tahap 1 — Mengunci sistem desain ✅ (dikerjakan dua kali)

Sekarang, bukan nanti: selama nilainya masih terbuka, setiap komponen yang
ditulis berisiko dibongkar ulang.

Spec penuh dan kronologinya ada di **`docs/stages/TAHAP-1.md`**. Ringkasnya:

**v1 — ditolak.** Geist + Geist Mono dengan satu aksen merah berkroma tinggi,
mengikuti pola sepuluh situs di `TEARDOWN.md`. Pengukurannya benar, tapi
diterapkan pada jenis situs yang salah: situs yang diukur adalah studio kode
dan 3D, tempat aksen memang satu-satunya pemegang identitas. Situs ini
memajang karya seni, dan karyanya sendiri yang berwarna.

**v2 — yang berlaku.**

- **Warna:** dua netral hangat, **nol aksen kromatik**. `ink`
  `oklch(0.17 0.006 66)` dan `paper` `oklch(0.964 0.006 92)`; tema `red`
  dihapus. Seluruh 18 pasangan lolos WCAG AA dan
  `contrast-baseline.json` **kosong** — turun dari 12 pengecualian.
- **Typeface:** **Syne** (digambar untuk pusat seni Synesthésie) + **Geist
  Mono**. Display membawa yang dibaca, mono membawa yang dipindai.
- **Skala:** `h1` lh 85% / −0.04em, `h2` w600 / lh 90%, prosa pindah ke
  display, dan `caption` naik 8→11px — menutup cacat yang v1 hanya _tandai_.

**Catatan yang sudah tidak berlaku:** kalimat "satu aksen" di
`DESIGN-SYSTEM.md` §1 lama, dan peringatan `caption` 8px. Keduanya sudah
dikoreksi di tempatnya masing-masing, bukan dibiarkan bertentangan.

**Masih terbuka:** typeface komersial tetap celah #1 di `docs/RESOURCES.md`.
Syne adalah pilihan open-source terbaik untuk register ini, bukan pilihan
terbaik secara mutlak; menukarnya hanya menyentuh `lib/styles/fonts.ts`.

---

## Tahap 2 — Melengkapi primitive & blok ✅

Spec penuh: **`docs/stages/TAHAP-2.md`**.

**Dibangun:** `section-header`, `project-card` (diekstrak dari `project-grid`
dan dipindahkan ke `sanity-image` + skala tipografi), `language-switcher`,
serta `nav` dan `footer` — keduanya menulis ulang isi
`components/layout/{header,footer}` yang masih milik Satūs, bukan file baru.
66 story, tiap komponen baru menyertakan state reduced-motion.

**Empat cacat senyap yang dipaksa terlihat oleh tahap ini:**

1. **Tautan internal membuang locale.** `components/ui/link` memakai
   `next/link`, jadi `/work` merender tanpa prefix dan `/` di-redirect
   berdasarkan `Accept-Language` browser — bukan bahasa yang dipilih pembaca.
   State aktif juga tidak pernah menyala (`'/id' === '/'`).
2. **`new Date()` saat render mengosongkan halaman prerender.** Di bawah Cache
   Components, membaca jam di badan komponen membatalkan boundary-nya ke
   client-side rendering; `/en` dan `/id` terkirim sebagai cangkang. Build
   hijau, dev benar, produksi kosong.
3. **`<main>` bersarang** — 3 pelanggaran axe yang lolos karena gate menyaring
   ke critical/serious saja.
4. **Kanvas WebGL memicu `region`** di setiap halaman.

Setelah 3 dan 4 diperbaiki, seluruh rute bersih di **setiap** impact, jadi
filter severity starter dihapus dari `route-sweep.e2e.ts` dan
`not-found.e2e.ts`.

**Gate baru:** `e2e/storybook-a11y.e2e.ts` menjalankan axe atas tiap story.
Kriteria "axe bersih di Storybook" sebelumnya tidak punya alat pengukur sama
sekali; gate-nya dibangun lebih dulu, dan langsung menemukan `Select` tanpa
nama aksesibel (impact serious).

**Keluar:** `bun run check` (342 test) · `bun run build` (`/en` dan `/id`
tetap `○ Static`) · `build-storybook` · `CI=true bun run test:e2e` (86 lulus).

---

## Tahap 3 — Home single page ✅

Spec penuh: **`docs/stages/TAHAP-3.md`**.

**Masalah utamanya bukan layout — datasetnya kosong** (diukur: 0 proyek, 0
`studioSettings`). Salinan cadangan dua bahasa ditaruh di
`lib/content/home-fallback.ts`, kalah per-field oleh CMS begitu ada isinya, dan
halaman menyatakan sendiri di layar bahwa teksnya sementara. Mengisi dataset
produksi dengan karya karangan ditolak — itu CMS asli studio.

**Seksi yang dirender:** Hero, Studio, Contact selalu; **Work hanya jika ada
proyek**; **Process tidak dibangun** karena tidak ada isi nyata untuknya
(roadmap: _"Hanya jika ada isi nyata"_).

**Nol ScrollTrigger baru.** Roadmap menyebut sendiri titik gagalnya; masuknya
seksi memakai kontrak CSS `useReveal` yang sudah ada, dan anchor aktif memakai
**satu** IntersectionObserver bersama (`lib/hooks/use-active-section.ts`), bukan
satu trigger per seksi. GSAP tetap hanya di `TextReveal`.

**Anchor nav pindah dari header ke halaman.** Daftar `#work/#studio/#contact`
yang di-hardcode Tahap 2 salah di setiap halaman yang bukan home. Sekarang
`Wrapper` menerima `sections`, dan halaman tanpa seksi mendapat header berisi
wordmark + pengalih bahasa saja.

**Tiga cacat visual yang lolos setiap gate** dan hanya ketahuan setelah
situsnya dijalankan dan di-screenshot: `max-width: 16ch` pada container hero
memotong `<h1>` jadi kolom 128px (`ch` diukur pada font elemen itu sendiri,
bukan pada judulnya); `body` tidak pernah punya `font-family`, jadi judulnya
dirender Times; dan token `h1` mobile 72px tidak muat memuat satu kata
duabelas huruf. Detail dan angkanya di `TAHAP-3.md` §11.

**Keluar:** `bun run check` (349 test) · `bun run build` (`/en` dan `/id` tetap
`○ Static`) · `build-storybook` · `CI=true bun run test:e2e` (94 lulus) ·
HTML awal `/en` memuat 1014 char teks tanpa JS, satu `<h1>`, nol lompatan
heading · **dilihat langsung di 360/390/430/1440px**.

---

## Tahap 4 — Detail proyek ✅

Spec penuh: **`docs/stages/TAHAP-4.md`**.

**Dibangun:** rute `[locale]/work/[slug]`, blok `project-hero`,
`project-gallery`, `next-project`, metadata + hreflang + canonical per proyek,
dan `project` ditambahkan ke `urlForReference` serta ke query sitemap
(sebelumnya sebuah link CMS ke dokumen `project` menghasilkan `#`).

**Datasetnya masih kosong**, jadi verifikasinya memakai fixture sementara —
`lib/scripts/seed-fixtures.ts`, tiga proyek dan satu `studioSettings` dengan
gambar sungguhan. Fixture itu **masih hidup** supaya situsnya bisa diperiksa;
hapus dengan `bun --env-file .env.local lib/scripts/seed-fixtures.ts --clean`,
yang membuang dokumen **dan** asetnya.

**Enam temuan, semuanya senyap** (detail dan angkanya di TAHAP-4.md §9):

1. **Prefix locale ganda** — setiap kartu karya menuju halaman not-found
   berstatus 200, karena komponen melokalkan href lalu `Link` melokalkannya
   lagi.
2. **Judul terlokalisasi menghapus semua proyek dari sitemap** — `title`
   sebuah `project` adalah array, skema zod-nya gagal, entri di-skip diam-diam.
3. **Id berawalan titik tidak pernah terbit** — Sanity membaca `fixture.x`
   sebagai versi, bukan dokumen terbit.
4. **`generateStaticParams` tidak bisa hidup dengan dataset kosong** — Cache
   Components menolak build; rute ini `◐`, seperti rute CMS lainnya.
5. **"404 benar" hanya bisa berupa soft-404** — status 200 + `noindex`, sama
   seperti setiap rute CMS lain di aplikasi ini.
6. **Halaman CMS tidak terbaca tanpa JavaScript** — dan **bukan regresi**:
   kode Tahap 3 apa adanya menghasilkan angka identik terhadap dataset yang
   sama. Kriteria "tanpa JS home tetap terbaca" di Tahap 3 lulus hanya karena
   datasetnya kosong.

**Keluar:** `bun run check` (369 test) · `bun run build` · `build-storybook` ·
`CI=true bun run test:e2e` (112 lulus) · sitemap memuat 3 proyek × 2 locale ·
halaman detail dilihat langsung pada 390px dan 1440px, kedua bahasa.

---

## Tahap 5 — Poles & performa ✅

Spec penuh: **`docs/stages/TAHAP-5.md`**.

**Kejujuran, diperbarui.** Roadmap memperkirakan tahap ini hanya menghasilkan
anggaran karena `chrome-devtools-mcp` tidak terpasang. Ternyata Chromium dan
Playwright ada, jadi **setiap angka di bawah ini diukur** — terhadap
`next start` di kontainer ini, viewport 1440×900. Bukan data lapangan, bukan
profil perangkat, dan bukan skor Lighthouse.

| Rute              | Total          | Script    | LCP            | CLS         |
| ----------------- | -------------- | --------- | -------------- | ----------- |
| `/en`             | 679→675 KB     | 32→31     | 164→144 ms     | 0           |
| `/en/work/<slug>` | 705→649 KB     | 34→29     | **816→216 ms** | **0.226→0** |
| `/en/ai`          | **621→327 KB** | **28→21** | 68→88 ms       | 0           |

**Lima temuan, semuanya terukur:**

1. **CLS 0.226 di halaman proyek** — dan kriteria keluar Tahap 4 menandai "nol
   pergeseran layout" sebagai ✅. Itu **salah**: saya menalar tentang kotak
   yang dipesan, bukan mengukur. `max-height` pada gambar membiarkan lebarnya
   tak tentu sampai berkasnya termuat. Diperbaiki dengan menghitung kotaknya
   dari rasio aset.
2. **three.js dikirim ke halaman teks** — `/en/ai` mengunduh 859 KB three +
   R3F karena layout memasang kanvas WebGL tanpa syarat. Sekarang opt-in per
   halaman; hanya beranda yang punya scene.
3. **Sampul proyek `loading="lazy"`** padahal ia elemen LCP-nya.
4. **Over-fetch gambar hingga 3×** — `sizes` tidak tahu tata letak
   membatasinya. Sekarang dinyatakan persis lewat `min(vw, vh × rasio)`.
5. **State loading merender kotak 0×0** — ditulis dengan utility Tailwind yang
   tidak ada di proyek ini. Layar kosong, dan itulah satu-satunya yang dilihat
   pengunjung tanpa JavaScript.

**Baru:** `e2e/keyboard-focus.e2e.ts` menyapu Tab di tiap rute — diverifikasi
bisa gagal, bukan hiasan.

**Keluar:** `bun run check` (373 test) · `bun run build` · `build-storybook` ·
`CI=true bun run test:e2e` (120 lulus).

---

## Tahap 6 — Deploy & handoff

**Kerja:** Vercel, env produksi (`NEXT_PUBLIC_BASE_URL` — build sekarang
memperingatkan kalau kosong), `PROD-README.md`, akses Sanity Studio untuk
studio, jalur ke VPS kalau nanti pindah.

**Keluar:** preview deploy hijau · sitemap & robots benar di domain nyata ·
studio bisa menambah karya tanpa bantuan saya.

---

# Verifikasi

Setiap tahap ditutup dengan urutan yang sama, dan **tidak boleh ada tahap
di-commit sebelum semuanya hijau**:

```bash
bun run check              # oxlint, oxfmt, type-aware lint, tsc, unit, manifest, aset
bun run build              # build produksi
CI=true bun run test:e2e   # Playwright + axe, lewat build produksi
bun run build-storybook    # katalog komponen
```

Lalu `/code-review` sebelum commit, dan `/run` untuk benar-benar melihat
halamannya.

**Catatan yang sudah diketahui:** `bun run test:e2e` tanpa `CI=true` kadang
gagal di `e2e/not-found.e2e.ts` karena kompilasi on-demand dev server berlomba
dengan validasi prefetch `instant` milik Next. Lewat build produksi — jalur
yang dipakai CI — suite lulus 17/17 tanpa console error. Sudah tercatat di
`docs/RESOURCES.md` §6. **Gunakan `CI=true` sebagai sinyal yang menentukan.**

Kalau ada yang gagal atau dilewati, itu dilaporkan eksplisit beserta alasannya —
bukan diam-diam dikurangi cakupannya (`CLAUDE.md` #21).
