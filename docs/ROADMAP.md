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

Implementasi: segmen `app/[locale]/[locale]/` dengan `generateStaticParams`
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

> **Diperluas di Tahap 15, bukan dibatalkan.** Beranda tetap satu halaman
> panjang. Yang bertambah adalah tujuan untuk pergi: tiga praktik mendapat
> halamannya sendiri di `/practice/<value>`. Keputusan di atas dibuat saat
> situs ini masih studio karya pesanan dengan nol karya terbit; sejak Tahap 13
> praktik adalah kosakata struktural, dan sebuah kosakata yang jadi segmen URL,
> nilai skema, dan entri JSON-LD pantas punya halaman. Anchor `#studio` dan
> `#contact` **tetap** anchor — `/studio` sudah dipakai Sanity Studio, dan
> memecah beranda bukan yang diminta.

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

- Segmen `app/[locale]/[locale]/`, `generateStaticParams` → `['en','id']`,
  redirect dari root.
- Modul kamus bertipe (`lib/i18n/`): tipe locale, kamus, `getDictionary()`.
  Kunci hilang harus gagal saat typecheck, bukan diam-diam render kosong.
- **Perluas `routeAlternates()`** di `lib/seo/alternates.ts` dengan
  `languages` + `x-default`. Ini titik sisip yang benar: doc comment-nya
  menjelaskan Next menggabungkan metadata secara dangkal, jadi semua rute
  memang harus lewat helper ini.
- Ganti `locale: 'en_US'` yang di-hardcode di `lib/utils/metadata.ts:115` dan
  `app/[locale]/layout.tsx:65` menjadi sadar-locale.
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

## Tahap 6 — Deploy & handoff ⚠️

Spec penuh: **`docs/stages/TAHAP-6.md`**.

**Satu dari tiga kriteria keluar tidak terpenuhi, dan itu disengaja
dinyatakan, bukan dibulatkan:**

| Kriteria                               | Status                                                           |
| -------------------------------------- | ---------------------------------------------------------------- |
| preview deploy hijau                   | ❌ tidak ada kredensial Vercel di kontainer ini                  |
| sitemap & robots benar di domain nyata | ✅ diverifikasi terhadap build `https://arth.studio`, 10/10 rute |
| studio bisa menambah karya tanpa saya  | ⚠️ `docs/PANDUAN-STUDIO.md` ada; belum diuji orang selain saya   |

**Empat cacat, semuanya di artefak yang benar-benar terkirim:**

1. **Situs masih memperkenalkan dirinya sebagai Satūs.** `og:site_name` dan
   nama PWA berbunyi `@darkroom.engineering/satus`; JSON-LD `Organization`
   berbunyi "Satūs"; dan `app/opengraph-image.jpg` masih kartu merah
   bertuliskan **"SATŪS — NEXT.JS STARTER"** — gambar yang muncul setiap kali
   tautan situs ini dibagikan. Merah, pula: satu-satunya warna yang justru
   dibuang di Tahap 1. Identitas sekarang bersumber dari `lib/seo/site.ts`,
   dan asetnya dirender dari token desain oleh `bun run brand:assets`
   (312 KB → 16 KB, dan sekarang memakai Syne dan tinta yang sama dengan
   halamannya).
2. **`og:url` tidak setuju dengan canonical**, karena satu opsi `url` dipakai
   untuk dua kosakata berbeda — template vs localized path
   (`lib/i18n/paths.ts` sudah menamai bedanya). Cacat ketiga dari akar yang
   sama: `og:locale` **selalu** `en_US`, termasuk di seluruh halaman
   berbahasa Indonesia. Ditambah `og:locale` memakai ejaan hreflang
   (`en-US`) padahal OpenGraph minta `en_US`.
3. **`/en/ai` dan `/id/ai` sama-sama mengaku `canonical: /ai`** — URL yang
   tidak dilayani aplikasi ini. Penyebabnya struktural: `export const
metadata` statis tidak bisa membaca locale.
4. **`/llms.txt` dan `/ai` mengiklankan URL yang hanya redirect** untuk tiap
   karya. Sitemap sudah benar sejak Tahap 0; dua permukaan saudaranya tidak
   ikut. `localizedContentRoutes()` sekarang dipakai ketiganya.

**Pelajaran metodologis, dan ini yang paling penting dari tahap ini.** Cacat 3
dan 4 tidak ditemukan dengan membaca HTML halaman satu per satu — saya sudah
melakukan itu dan sempat menyatakan "semuanya benar". Keduanya muncul begitu
pemeriksaannya diubah jadi skrip yang membuka **setiap** URL di `sitemap.xml`:
2 dari 10 rute gagal. Pemeriksaan manual mengukur ketelitian pemeriksanya.

**Baru:** `e2e/canonical-sweep.e2e.ts` (sweep itu, jadi permanen) ·
`docs/PANDUAN-STUDIO.md` (bahasa Indonesia, untuk studio) · `PROD-README.md`
ditulis ulang · `bun run brand:assets`.

**Keluar:** `bun run check` (380 test) · `bun run build` ·
`build-storybook` · `CI=true bun run test:e2e` (123 lulus) · halaman dilihat
langsung pada 1440×900, kedua bahasa · kartu OG dibuka sebagai gambar dan
dilihat.

**Belum dikerjakan, eksplisit:** preview deploy Vercel · rotasi token Sanity
(ditunda atas permintaan; ada di checklist pra-luncur) · `bun run handoff`
tidak dijalankan (menghapus kredit MIT yang harus tetap ada) · `setup:lean`
belum diuji ulang sejak restrukturisasi Tahap 0.

---

## Tahap 7 — Cacat yang dilihat pengunjung ✅

Spec penuh: **`docs/stages/TAHAP-7.md`**. Sumbernya Tier 1
`docs/AUDIT-2026-08.md`.

Tahap pertama yang bentuknya bukan "bangun sesuatu" melainkan **perbaiki hal
yang sudah dinyatakan selesai** — empat kriteria keluar bertanda ✅ yang
ternyata tidak benar. Aturannya satu: tidak ada perbaikan di-commit tanpa gate
yang **terbukti merah lebih dulu**.

| Yang diukur                           | Sebelum                    | Sesudah       |
| ------------------------------------- | -------------------------- | ------------- |
| `<h1>` `/id` luber pada 320–768px     | 7 dari 7 lebar             | **0**         |
| Piksel gambar vs kebutuhan (dpr 2–3)  | 0,51–0,66×                 | **≥ 1,0×**    |
| `target-size` gagal                   | 10 dari 10 rute × viewport | **0**         |
| three.js, reduced-motion & ponsel     | 859,2 KB                   | **0 KB**      |
| Total chunk `/en`, reduced-motion     | 2038,6 KB                  | **1054,9 KB** |
| Halaman karya dengan kartu OG sendiri | 0 dari 6                   | **6 dari 6**  |
| Test e2e                              | 123                        | **144**       |

**Empat cacat, dan satu lubang gate yang menutupi semuanya:**

1. **Judul `/id` terpotong di setiap lebar ≤768px.** `overflow-wrap:
break-word` tidak mengurangi kontribusi min-content — hanya `anywhere` yang
   begitu — jadi jaring pengaman yang komentarnya sebut "should never fire"
   memang tidak pernah bisa menyala. Sekaligus terungkap bahwa aturan ukuran
   `h1` di `typography.ts` hanya pernah diukur untuk bahasa Inggris:
   "memperhatikan" 8,59em vs "Commissioned" 7,97em, jadi 42 → **38**.
2. **Lukisan di-upscale.** `maxWidth` memikul dua peran — plafon piksel Sanity
   dan lebar layout — sehingga di dpr ≥ 2 browser meminta `w=2560` dan hanya
   menerima 1440. Situs yang seluruh proposisinya reproduksi lukisan
   menampilkannya di setengah resolusi di setiap MacBook dan ponsel modern.
3. **Kartu share tiap karya generik dan tanpa description**, padahal skema
   memberi tahu editor bahwa cover dipakai sebagai gambar OpenGraph.
4. **three.js 859 KB ke setiap pengunjung `/en`**, termasuk ponsel dan
   reduced-motion yang tidak pernah merender kanvas. Dua jalur impor statis
   menyebabkannya (`<Canvas>` dan `SceneShell`); memperbaiki salah satu saja
   tidak mengubah apa pun.

**Lubang gate-nya:** suite e2e hanya merender **satu viewport, 1280×720**, dan
axe **tidak pernah menjalankan aturan WCAG 2.2** (opt-in lewat tag). Keduanya
ditutup di tahap ini — sekarang dua project Playwright, dan satu daftar tag
bersama di `e2e/axe-tags.ts`.

**Dua gate gagal dalam bentuk pertamanya, dan itu pelajarannya.** Gate luberan
berbasis `scrollWidth` lolos padahal teksnya terpotong (`overflow: clip`
menyembunyikannya dari metrik dokumen); gate WebGL berbasis ukuran menandai
chunk React dan Next yang sah. **Gate yang bentuknya salah menghasilkan ✅, dan
itu lebih berbahaya daripada tidak ada gate** — hal yang sama yang membuat
metode gambar Tahap 5 tidak bisa melihat cacat #2.

**Baru:** `e2e/responsive.e2e.ts` · `e2e/image-resolution.e2e.ts` ·
`e2e/webgl-budget.e2e.ts` · `e2e/axe-tags.ts` · project Playwright kedua
(390×844 dpr3) · token `--tap-target`.

**Keluar:** `bun run check` (380 test) · `bun run build` · `build-storybook` ·
`CI=true bun run test:e2e` (**144 lulus**, dua project) · halaman dilihat
langsung di 390×844 dan 1440×900, kedua bahasa.

**Belum dikerjakan, eksplisit:** dampak waktu dari 859 KB yang dihemat tidak
diukur (tidak ada latensi maupun profiler di sini) · `fetchpriority` pada LCP ·
`transition: height` pada accordion · lint CSS dan sapuan header respons —
ketiganya ke Tahap 9.

---

## Tahap 8 — Halaman indeks karya & janji yang tidak ditepati ✅

Spec penuh: **`docs/stages/TAHAP-8.md`**.

Benang merahnya bukan bug tersembunyi melainkan **janji tertulis yang tidak
ditepati** — dan dua di antaranya saya sendiri yang menulisnya:

| Yang dijanjikan                               | Di mana                | Kenyataannya            |
| --------------------------------------------- | ---------------------- | ----------------------- |
| "Browse the work at /en/work"                 | `SITE.agentGuidance`   | soft-404                |
| "matikan Featured untuk menyembunyikan karya" | `PANDUAN-STUDIO.md` §7 | tidak menyembunyikan    |
| "Skip to main content"                        | layout                 | tidak memindahkan fokus |
| `lang="id-ID"`                                | `/id/ai`, 404, error   | isinya bahasa Inggris   |
| "Lewati ke konten utama"                      | `messages/id.json`     | kunci mati              |

| Yang diukur                           | Sebelum    | Sesudah                |
| ------------------------------------- | ---------- | ---------------------- |
| `/en/work` dan `/id/work`             | soft-404   | **200, katalog penuh** |
| Karya tanpa pintu masuk dari navigasi | 1 dari 3   | **0**                  |
| Skip-link memindahkan fokus           | tidak      | **ya**, dua locale     |
| String identik `/en/ai` vs `/id/ai`   | 38 dari 38 | **di bawah ambang**    |
| Test e2e                              | 144        | **156**                |

**Halaman `/work` dibangun setelah ritual `ui-ux-pro-max`**, dan hasilnya
dicatat di spec §1. Pola `portfolio-grid` sendiri yang menuntut **"Filter by
category"** — jadi field `discipline` bukan tambahan saya — dan tiga guideline
lain (Chip Collection Reflow _High_, Deep Linking, Empty States) menentukan
bentuknya. `--stack nextjs "grid"` mengembalikan **0 hasil**, dinyatakan
terus terang sesuai §2.1.

**Filternya adalah tautan, bukan tombol,** dan penyaringan terjadi di GROQ.
Konsekuensinya: URL yang bisa dibagikan, nol byte JavaScript klien, dan halaman
yang berfungsi penuh tanpa JS — yang penting karena audit §2.6 mencatat `/en`
justru tidak demikian.

**`featured` dan `listed` sekarang dua tombol untuk dua hal berbeda.** Satu
klausa `listed != false` dipakai bersama oleh sitemap, `/llms.txt`, `/ai`, grid
beranda, halaman katalog, dan rantai next-project — sehingga "disembunyikan"
tidak bisa lagi berarti satu hal di beranda dan hal lain di peta situs.

**`e2e/promises.e2e.ts` dibuktikan merah lebih dulu**, empat kali, tepat pada
cacat yang dilaporkan audit. Ia membaca URL dari prosa `/llms.txt` yang
benar-benar dirender, bukan dari konstanta — yang diuji adalah apa yang situs
ini _katakan_.

**Keluar:** `bun run check` (380 test) · `bun run build` · `build-storybook` ·
`CI=true bun run test:e2e` (**156 lulus**) · halaman katalog dilihat langsung,
dua locale, 390px dan 1440px.

**Belum dikerjakan, eksplisit:** prosa `SITE` masih satu bahasa, jadi kriteria
"nol prosa Inggris di `/id`" **belum** terpenuhi seluruhnya — label sudah,
entity copy belum · `listed: false` belum diuji terhadap dokumen nyata ·
`/studio` masih tanpa smoke test yang berarti (sandbox ini tidak punya egress,
jadi test-nya akan gagal karena lingkungan, bukan karena kode) · keputusan soal
tipe `page`/`article` · paginasi `/work`.

---

## Tahap 9 — Gate yang bisa gagal ✅

Spec penuh: **`docs/stages/TAHAP-9.md`**.

Tahap-tahap sebelumnya memperbaiki cacat lalu menambahkan gate yang
menangkapnya. Tahap ini membalik urutannya: **memasang empat kelas gate yang
belum pernah ada sama sekali**, lalu memperbaiki apa pun yang mereka temukan.

| Kelas gate             | Yang tidak pernah dilihat siapa pun sebelumnya      |
| ---------------------- | --------------------------------------------------- |
| CSS yang kita tulis    | aturan motion #1–#4 dan #8 — nol penegakan otomatis |
| Header respons         | `Cache-Control` di kelas rute mana pun              |
| Tanpa JavaScript       | apa yang dilihat crawler yang tidak mengeksekusi JS |
| Anggaran byte per rute | pustaka yang masuk lewat `import()` setelah hidrasi |

**Temuan terbesarnya lebih luas dari yang dicatat audit.** Bukan hanya `/en`:
**setiap** halaman yang lewat `<Wrapper>` hanya menampilkan 28 karakter tanpa
JavaScript — header dan footernya sekalian. Penyebabnya satu file di tempat
yang salah: `app/[locale]/loading.tsx` memasang Suspense boundary pada seluruh
segmen `[locale]`, termasuk rute yang tidak membaca data request. Diturunkan ke
empat segmen yang benar-benar memerlukannya, beranda jadi **28 → 1073
karakter**, identik dengan versi ber-JS.

**Gate CSS menemukan pelanggaran di 14 file**, bukan 2 seperti audit — karena
audit membaca CSS _terkirim_, dan sebagian besar komponen Base UI itu belum
dipakai rute mana pun. Bentuk pertama gate-nya pun salah: memindai output build
menandai 7 pelanggaran milik Sanity Studio, 170 KB CSS pihak ketiga yang bukan
wewenang kita.

**Dan satu regresi yang menjelaskan seluruh tahap ini.** Memperbaiki tanpa-JS
membuat `route-sweep` gagal `color-contrast` di `/en` dan `/id` — halaman yang
**selalu** lulus axe, karena isinya dulu berada di dalam `<div hidden>` sehingga
**axe memindai halaman yang praktis kosong**. Klaim "axe bersih" untuk beranda
sama berongganya dengan klaim "terbaca tanpa JS", dan dari sebab yang sama.
Memperbaiki satu cacat membuat sebuah gate bermakna dan flaky dalam commit yang
sama.

Test karakterisasi Tahap 4 juga gagal — dan itu memang instruksinya sendiri:
_"kalau ini mulai gagal karena halamannya render penuh tanpa skrip, itu kabar
baik."_

**Diperbaiki di sepanjang jalan:** indikator tab dan ring kursor jadi komposit
(`translate`/`scale`, `@property --ring-scale`) · LQIP asli dari Sanity
menggantikan shimmer putih generik yang animasinya tidak menganimasikan apa pun
· `fetchPriority="high"` pada elemen LCP · GSAP dan `@sanity/client` tidak lagi
dikirim ke rute yang tidak meng-opt-in · header cache untuk aset build ·
judul soft-404 (penjaganya dulu `toHaveTitle(/.+/)`, regex yang tidak bisa
gagal) · rate limit pada `/api/draft-mode/enable` · `RESERVED_PATHS` yang
mencadangkan rute terhapus alih-alih `/work`.

**Baru:** `lib/styles/scripts/motion-rules.test.ts` ·
`e2e/response-headers.e2e.ts` · `e2e/no-javascript.e2e.ts` ·
`e2e/route-budget.e2e.ts` · token `--duration-micro`, `--stagger-*`,
`--reveal-duration` · `components/ui/route-loading`.

**Keluar:** `bun run check` (384 test) · `bun run build` · `build-storybook` ·
`CI=true bun run test:e2e` (**174 lulus**, dua project).

**Belum dikerjakan, eksplisit:** `/work` dan halaman proyek tetap tidak terbaca
tanpa JS — keduanya membaca data request, dan menghilangkannya adalah keputusan
bentuk URL, bukan pekerjaan gate · prosa `SITE` masih satu bahasa · 93 export
tak dirujuk belum dipilah · `/studio` masih tanpa smoke test (sandbox ini tidak
punya egress) · angka performa tetap byte, bukan waktu.

---

## Tahap 10 — Menutup yang tersisa ✅

Spec penuh: **`docs/stages/TAHAP-10.md`**.

Tahap 9 menutup daftar roadmap dan meninggalkan empat hal tertulis sebagai
**belum dikerjakan**. Tahap ini mengerjakan semuanya, termasuk yang di
spec-nya sendiri sempat diputuskan untuk **tidak** dikerjakan.

**Keputusan yang dibalik, dan itu intinya.** §1.4 spec ini semula memutuskan
mempertahankan `?discipline=mural`, dengan tiga alasan yang ditulis lengkap.
Dua error build membatalkannya: di bawah `cacheComponents`, rute yang membaca
`searchParams` **wajib** menaruh isinya di balik `<Suspense>`, dan
`export const dynamic = 'force-dynamic'` ditolak mentah-mentah. Isi di balik
Suspense hanya sampai ke pembaca lewat skrip inline — jadi `/en/work` tanpa
JavaScript menampilkan judulnya, paragrafnya, kata _Loading_, dan **nol
karya**. `lib/seo/site.ts` menyuruh setiap agen membuka halaman itu.

Filternya jadi segmen path: `/work/discipline/mural`. Yang dibeli: setiap
tampilan `○` statis, `s-maxage=31536000`, terbaca penuh tanpa JS, dan tiga
halaman indeks tambahan per bahasa yang layak di-index sendiri. Yang dibayar:
slug `discipline` jadi terlarang, ditegakkan di tiga tempat.

**Prosa entitas jadi dua bahasa.** `SITE.description`, `services`,
`knowsAbout`, `areaServed`, dan panduan agen berubah dari `string` menjadi
`Record<Locale, …>`, dibaca lewat `siteFacts(locale)`. Ikut terbawa, dan tidak
ada di rencana: `label`/`description` di `route-catalog.ts`, karena `/id/ai`
adalah halaman Indonesia yang mendaftar deskripsi Inggris untuk halamannya
sendiri.

**Dua tipe dokumen dibuang.** `article` (tipe blog di situs studio karya
pesanan, lengkap dengan rutenya) dan `navigation` (dirender **nol** tempat —
editor mengisinya dan tidak ada yang berubah). `page` **tetap**, dan sekarang
dijelaskan di panduan studio. `schemas/schema-coverage.test.ts` menahan yang
berikutnya.

**Dua gate lama gagal karena perilakunya membaik**, dan keduanya diperbarui
alih-alih dilonggarkan — termasuk slug tak dikenal, yang sekarang **mengendap**
jadi 404 sungguhan (permintaan pertama tetap 200; diukur, dan dinyatakan
terbuka di §5 spec).

**Baru:** `lib/content/disciplines.ts` · `app/[locale]/work/catalogue.tsx` ·
`app/[locale]/work/discipline/[value]/` · `siteFacts()` ·
`schemas/schema-coverage.test.ts`.

**Angka:** `/en/work/rimbun` tanpa JS 28 → 498 karakter · `/en/work` "Loading"
→ 513 karakter dan 6 tautan karya · `Cache-Control` halaman proyek `no-store`
→ `s-maxage=31536000` · halaman indeks dapat di-index 2 → 8 · tipe dokumen
tanpa jalur render 2 → 0.

**Keluar:** `bun run check` (**385 test**) · `bun run build` ·
`build-storybook` · `CI=true bun run test:e2e` (**189 lulus**, dua project).

**Belum dikerjakan, eksplisit:** permintaan **pertama** ke slug tak dikenal
tetap 200 + `noindex` (batas model streaming Cache Components, bukan kode
rute) · build sekarang bergantung pada Sanity yang bisa dihubungi, dan sempat
gagal sekali karena `HTTP 503 DNS resolution failed` · belum ada profiling
browser, jadi tidak ada angka Core Web Vitals · 93 export tak dirujuk belum
dipilah · kredensial Sanity belum dirotasi, atas permintaan user.

---

## Tahap 11 — Mempercantik: dari benar menjadi indah ✅

Spec penuh: **`docs/stages/TAHAP-11.md`**.

Sepuluh tahap membuat situs ini benar. Tidak satu pun membuatnya indah. Tahap
ini soal yang kedua, dan seperti biasa: tiap klaim diukur, tiap perbaikan
datang dengan gate.

Ritual `ui-ux-pro-max` dijalankan dan hasilnya dipakai sebagai **pembanding**,
bukan perintah — palet near-black tanpa aksen kromatik ternyata **sepakat**
dengan yang dikunci Tahap 1 (dua sumber independen, satu kesimpulan),
sementara usul tipografi Archivo / Space Grotesk **ditolak** karena Syne
dipilih atas alasan provenance dan Space Grotesk ada di daftar "AI-design
tell" proyek ini. Hasilnya sengaja tidak di-`--persist`: itu akan menciptakan
sumber kebenaran kedua yang bersaing dengan `docs/DESIGN-SYSTEM.md`.

**Empat temuan terukur:** ritme spasial putus di satu tempat (`#work` 0px,
`#studio` dan `#contact` 48px) · tepi kanan halaman detail bergerigi (enam
elemen, enam lebar: 92/78/45/65/78/32%) · prosa 45% di samping gambar 78% ·
dan seluruh `vault/motion/` — `page-transition`, `text-reveal` — dibangun di
Phase C lalu **tidak pernah dipasang**, sehingga berpindah halaman terasa
seperti memuat dokumen.

**Satu yang diperiksa dan ternyata bukan cacat:** `<h1>` halaman detail tidak
terpotong — `overflow: visible`, kotak mulai persis di induknya. Kerapatannya
adalah leading 85% yang disengaja.

**Keempat sub-tahap dikerjakan.** Ritme spasial jadi satu token
(`--section-lead`); tepi media dari enam lebar jadi dua (1398px / 691px);
`page-transition` dipasang setelah **dua bug** di dalamnya diperbaiki — ia
berjalan dari perubahan `usePathname()`, yaitu setelah rute baru sudah render,
dan ia menagih GSAP di rute yang tidak memuat GSAP.

Sub-tahap terakhir tidak memakai GSAP Flip seperti rencananya: React
`<ViewTransition>` bekerja di App Router **tanpa konfigurasi**, jadi morphnya
nol pustaka. Terbukti di browser — `::view-transition-group(work-cover-…)`
dengan kedua paruh `old` dan `new`. Satu konflik yang seharusnya terlihat di
rencana: 11c mengirim penutup satu layar penuh, dan morph hanya terbaca kalau
pembaca melihat kedua keadaan. `Link` kini mengumumkan niat dan overlay
menyingkir.

**Dua cacat ditemukan di luar rencana, keduanya lebih serius darinya.** Teks
redup di tujuh komponen berada **di bawah WCAG AA** pada tema terang (4.11:1)
— tak terlihat karena tiap halaman mengirim `theme="dark"`, dan tak terukur
karena gate kontras hanya membaca token dari `global.css` sementara ketujuhnya
menulis `color-mix` sendiri di modulnya. Dijadikan token `--text-muted`, dan
nilainya ditetapkan APCA (Lc 60 pada ~11px), bukan WCAG: **75%**. Kedua: suite
menguji **Storybook yang basi** — `test:e2e` tidak membangunnya, jadi cacat itu
hijau selama beberapa tahap. Sekarang ada gate untuk itu.

**Angka:** `#work` 0px → 48px · lebar media 6 → 2 · teks redup 4.11:1 → 9.08:1
(APCA Lc 35.3 → 60.6) · e2e 195 → **211**.

---

## Tahap 12 — Tata bahasa interaksi: dari indah menjadi hidup ✅

Spec penuh: **`docs/stages/TAHAP-12.md`**.

Tahap 11 membuat halaman ini indah **saat diam**. Tahap ini soal apa yang
terjadi ketika seseorang menyentuhnya.

**Koreksi yang mengubah kalibrasi.** Arth adalah **agency high-ticket**
(consulting, AI/data, komisi berbayar), bukan studio karya seni. Itu
**membalik** alasan saya menolak palet v1 di Tahap 1: korpus `TEARDOWN.md`
justru sepuluh agency yang menjual lewat demonstrasi kepiawaian. Palet,
tipografi, kurva, dan grid **tetap** — alasannya berdiri sendiri di atas hasil
ukur kontras. Yang berubah adalah standar yang berlaku.

**Temuan intinya satu perintah:** `grep -rn ":active" --include=*.css` →
**nol**. Delapan belas file memakai `:hover`; tidak satu pun elemen berubah
saat ditekan. Antara "saya menyentuh ini" dan "halaman baru muncul", situs ini
diam total. Itu bukan bug satu komponen — itu **kosakata yang hilang**, dan
`MOTION-SPEC.md` memang tidak punya satu pun model state interaksi: ia
mendefinisikan material (kurva, pita, stagger), bukan momen.

**Yang dibangun: tata bahasa, bukan efek.**
`REST → INTENT → COMMIT → TRANSPORT → SETTLE`, satu kalimat untuk lima kata
benda (kartu, CTA, chip, nav, email). COMMIT — kompresi antisipasi ~120ms
sebelum lepas — adalah yang membedakan animasi game dari transisi web, dan
adalah state yang hari ini tidak ada. Ditulis sebagai **`MOTION-SPEC.md` §9**,
memperluas dokumen yang sudah mengikat, bukan dokumen baru yang bersaing.

**Anggaran momen epik: maksimal dua per halaman**, disebut namanya (kedatangan
hero, kartu→halaman karya), dan **digerbangi**.

**Temuan terukur lain:** hero mengisi 51% tinggi layarnya (456px tinta dari
900px) tanpa isyarat bahwa dokumen 4385px ini berlanjut · `#studio`
meninggalkan **748px kolom kosong** karena cabang `[data-has-portrait]` tidak
pernah menyala · beranda memajang **dua** karya · seluruh situs punya **dua**
rasio gambar, sehingga aturan persegi `project-gallery` terbukti sebagai fungsi
tapi tidak pernah terbukti sampai ke layar.

**Koreksi kedua, atas rencana tahap ini sendiri:** rencananya menulis "tiga
section memakai kolom kiri sempit". Diukur per elemen daun alih-alih per
section, yang benar **satu** — `#contact` sudah memakai kedua tepi dengan
sengaja. Ketiga kalinya di proyek ini pengukuran yang salah bentuk menghasilkan
angka meyakinkan yang menuntun ke perbaikan salah sasaran.

**Prasyarat aset dummy sudah 90% ada**: `lib/scripts/seed-fixtures.ts`
meng-generate, mengunggah ke Sanity, dan `--clean` menghapus dokumen **dan**
asetnya. Tahap ini memperluasnya (6 karya, lima rasio, satu portrait), tidak
menggantinya — dan sumber eksternal tetap ditolak dua kali oleh
`remotePatterns` dan `img-src`.

**Kelima sub-tahap dikerjakan.** **12a** aset (3 → 6 karya, 2 → 7 rasio, dan
aset persegi pertama yang sampai ke halaman terender) · **12b** tata bahasa
ditulis sebagai §9 dan diberi 9 tes · **12c** COMMIT terpasang di enam kata
benda · **12d** hero berjangkar (terisi 51% → **82%**, ruang mati atas 141px →
**0**) dan tiap section ditandai garis rambut · **12e** anggaran epik ditegakkan
(gerakan > 600ms **8 → 3**, tak bernama **8 → 0**, terpanjang 2453ms → 814ms).

**Empat cacat ditemukan di luar rencana, dan tiga di antaranya lebih serius
dari rencananya.** Rebuild tidak memungut perubahan konten — `'use cache'`
menyimpan hasil fetch di `.next/cache` dan build memakainya ulang, jadi CMS
punya enam karya sementara situs terbangun menyajikan tiga, dengan log hijau
(`DEPLOYMENT.md` §7). `--reveal-duration: 700ms` berada **di luar semua pita**
dan lolos karena gate aturan gerak membaca `transition`, bukan custom property.
Kill switch reduced-motion berspesifisitas `*` dan kalah dari kelas mana pun,
jadi ia komentar, bukan mekanisme. Dan yang terberat: **di bawah
`prefers-reduced-motion`, dua dari tiga baris `<h1>` beranda tidak terlihat**,
terkirim sejak Tahap 11c — `TextReveal` memarkirnya di luar mask-nya sendiri
pada `opacity: 1`, sehingga gate yang ada persis untuk cacat ini tidak bisa
melihatnya karena ia membaca opacity.

**Empat kali alat ukurnya sendiri yang salah**, semuanya dicatat: tekanan yang
mengenai header alih-alih kartu, snapshot keadaan yang terlalu sempit sehingga
warna tidak terhitung sebagai pengakuan, Back yang menginterupsi klik alih-alih
transisi, dan perilaku cache navigasi Next yang nyaris tercatat sebagai cacat
landmark ganda. Pola yang sama seperti selalu — **pengukuran yang salah bentuk
menghasilkan centang hijau** — kali ini pada gate-nya sendiri.

**Angka:** e2e 211 → **229** · unit 386 → **395** · `:active` di seluruh proyek
0 → satu aturan bersama + 6 kata benda.

---

## Tahap 13 — Situs ini akhirnya mengatakan apa yang Arth kerjakan ✅

Spec penuh: **`docs/stages/TAHAP-13.md`**.

Dua belas tahap membangun situs ini sebagai studio karya pesanan. Sektornya
bukan itu. Arth adalah **agency high-ticket** — **Consulting · AI/Data ·
Commission** — dan sejak Tahap 12 §0 penyelarasan kosakata tercatat sebagai
utang terbuka yang menunggu keputusan pemilik. Keputusan itu sekarang ada, dan
kata-katanya dikutip apa adanya.

**Ini bukan penggantian teks.** Kosakata itu struktural: nilai tertutup di
skema, segmen di URL, entri di JSON-LD `services` dan `knowsAbout`, label
filter, tiga baris di hero. Diukur dari yang benar-benar **disajikan** build
produksi: `/en/ai` **137** sebutan kosakata seni · `/en` **113** · `/id/ai`
**109** · `/id` **84** · `/en/work` **82** · `/llms.txt` **44** · dan
`knowsAbout` **5 dari 5**. Mesin jawaban membaca janji itu dengan patuh, karena
kedua permukaan itu memang dibangun untuk dipercaya.

**Satu sumber kebenaran menyelamatkan tahap ini.** `lib/content/disciplines.ts`
punya sepuluh konsumen yang semuanya mengimpor darinya — keputusan Tahap 8 yang
berbuah sekarang. Jadi: penggantian terarah, bukan pencarian-dan-penggantian.

Dua puluh tujuh berkas menyebut kosakata lama, tapi **hanya sebelas menanggung
nilai**; enam belas sisanya komentar penjelas dan URL contoh. Yang pertama
cacat, yang kedua kebersihan — keduanya dikerjakan, hanya yang pertama
digerbangi, karena gate yang memaksa penulisan ulang komentar ilustratif
menghukum dokumentasi alih-alih melindungi pembaca.

**Skema: tiga field, bukan satu.** `discipline` → `practice`, `medium` →
`engagement`, `dimensions` → `scope`. Di-rename, bukan sekadar diberi judul
baru: field bernama `medium` yang berisi "Retainer, enam bulan" adalah nama
yang berbohong tentang isinya, dan itu tidak pernah gagal di gate mana pun.

**Gate yang menentukan mengukur HTTP yang disajikan, bukan sumber** — sebuah
grep sumber bisa dipuaskan dengan menyunting komentar; ini tidak bisa.

**Ketiga sub-tahap dikerjakan.** Sebutan kosakata seni yang **disajikan** turun
`137 → 0` · `113 → 0` · `109 → 0` · `84 → 0` · `82 → 0` · `44 → 0`, dan
`knowsAbout` dari 5-dari-5 menjadi nol. Rute `/work/discipline/*` menjadi
`/work/practice/{consulting,ai-data,commission}`; skema me-rename tiga field,
dan typegen membuat `tsc` menolak setiap sisa nama lama — rename ini
dituntaskan kompiler, bukan ingatan. Rasio keenam pelat dipertahankan persis,
termasuk yang **persegi**, karena gate Tahap 12a bergantung padanya.

**Empat temuan di luar rencana.** `sanity schema extract` menolak menimpa dan
keluar dengan error sementara `typegen` tetap berhasil dari skema **lama** —
`tsc` lalu lulus terhadap bentuk yang sudah tidak ada; `--force` sekarang
dipakai. Sebelas tes di enam berkas memaku nama fixture, diselesaikan dengan
`e2e/fixtures.ts` — satu sumber, sama seperti yang menyelamatkan tahap ini. Dua
regex sitemap menyaring dengan `(?!discipline/)` yang **berhenti mengecualikan
apa pun**, sehingga keduanya mengukur katalog tersaring sebagai satu karya dan
melapor "a portrait work is not narrower than a landscape one (614px vs 614px)"
— benar sebagai deskripsi, bukan cacat sama sekali. Dan `/llms.txt` masih
berbunyi "medium and dimensions" setelah semua gate hijau: keduanya kata
Inggris biasa yang tidak bisa dilarang tanpa positif palsu, jadi ia ditemukan
dengan **membaca halamannya**.

**Angka:** unit 395 → **400** · e2e 229 → **237**.

## Tahap 14 — Gerak ✅

Spec penuh: **`docs/stages/TAHAP-14.md`**.

Tahap ini lahir dari satu pertanyaan pemilik: bisakah animasinya dibuat setara
dengan **melius.com**. Jawabannya diukur sebelum dijawab — HTML tersaji plus
**22 dari 25 chunk JS (1,9 MB)** — dan hasilnya membalik rencana yang sudah
disetujui sebelumnya.

**melius tidak memakai three.js sama sekali.** `WebGLRenderer`,
`PerspectiveCamera`, `ShaderMaterial`, `BufferGeometry`, dan `new THREE`
kelimanya **0/22 chunk**. Mesin animasinya **Motion/framer-motion**; GSAP ada
tapi hanya untuk `SplitText`. `scrub:` **0**, `pin:` **0**, `Observer.create`
**0** — tidak ada koreografi scroll-scrub sedikit pun.

**Dua kali instrumen saya sendiri salah bentuk, dan itu dicatat.** Pembacaan
pertama melaporkan `Observer` di 12 chunk (ternyata `IntersectionObserver` /
`ResizeObserver`; plugin GSAP-nya **1** kemunculan) dan 185 tween `ease:"none"`
yang di-scrub (ternyata `display:"none"`; hitungan sebenarnya **1**).
Kesimpulan pertama — "melius adalah koreografi scroll-scrub bervolume tinggi" —
terbalik seluruhnya setelah instrumennya dibetulkan. Pelajaran Tahap 12 §10,
lagi: pengukuran yang salah bentuk menghasilkan angka meyakinkan yang menunjuk
perbaikan yang keliru.

**Tata bahasa gerak Arth ternyata sudah lebih ketat.** Kurva dominan melius
varian `in-out` (`ease-sin-in-out` ×29, `ease-quart-in-out` ×12) — yang
`CLAUDE.md` #2 batasi; default kita `outQuart`. Gradient WebGL di hero kita
adalah benda yang sama dengan `minigl` mereka.

**Jaraknya tiga hal, tak satu pun three.js:** imagery bergerak (6 klip `.webm`
lawan 10 pelat statis), volume (27 blok setingkat `h3` lawan ~6 blok reveal),
dan perubahan konten di tempat (primitif `accordion`/`tabs` kita: **nol
pemakai**).

**Kerja:**

- **14a — lapisan material.** `vault/webgl/material-image/` menggerakkan pelat
  yang sudah ada lewat medan kecepatan `lib/webgl/utils/flowmaps/` — mesin GPU
  yang sudah dibangun dan **nol pemakai**. Beranda saja
  (`route-budget.e2e.ts`), fallback pelat statis, dan serah-terima ke DOM pada
  **COMMIT** supaya morph `<ViewTransition>` Tahap 11d tetap hidup.
- **14b — volume dan cakupan.** Reveal untuk tiap blok di tiga rute; seksi
  Practice yang membuka isinya di tempat, dengan native `<details>` karena
  `components/ui/accordion` client-only dan akan mematahkan kriteria no-JS.

**Tidak dikerjakan, dinyatakan di muka:** tidak ada `.webm` dibuat, tidak ada
material di `/en/work` atau halaman detail, tidak ada scroll-scrub atau pin,
tidak ada Motion/framer-motion ditambahkan.

**Keduanya dikerjakan.** Pelat karya di beranda kini permukaan, digerakkan
medan kecepatan GPU yang sudah dibangun dan **nol pemakai** sejak fork. Judul
tanpa reveal turun `4 dari 8 → 0` di `/en` dan `1 dari 7 → 0` di `/en/work`.
Seksi Practice memakai native `<details>` — terverifikasi ada di HTML server
tanpa JavaScript — dan **tidak menambah satu kalimat pun** yang perlu
dikoreksi pemilik, karena ia memakai ulang `workIndex.<practice>Intro` dari
Tahap 13.

**Dua cacat WebGL yang saling menutupi perbaikan satu sama lain.** Quad latar
hero menulis depth di z = 0 dan menutupi tiap mesh berjangkar-DOM; penempatan
mesh membaca `lenis.scroll` (nilai animasi) alih-alih posisi dokumen, menaruh
pelat 660px di luar layar. Saya sempat **mencabut** perbaikan pertama karena
A/B menunjukkan tidak ada bedanya — A/B itu dijalankan saat cacat kedua masih
mengosongkan pelat di kedua kaki percobaan.

**Enam instrumen saya sendiri salah bentuk**, dan tiap satunya dicatat: dua di
pengukuran melius, satu locator yang selektornya hilang saat perbaikan bekerja,
satu wilayah sampel yang memang rata, `page.screenshot({ clip })` yang
**tidak mengomposit lapisan WebGL**, dan gate cakupan yang hijau di sebuah rute
sambil menemukan **nol kandidat**. Yang terakhir kini punya lantai per rute.

**Empat gate lama membayar dirinya sendiri di 14b:** `spatial-rhythm`
menemukan nol pasang header/body setelah satu `<div>` pembungkus;
`interaction-grammar` menemukan shorthand reveal menimpa COMMIT alamat email,
dan tiga noun yang tak terjangkau di dalam `<details>` tertutup — saya
mengubah gate itu empat kali sebelum menerima bahwa desain saya yang salah,
lalu membatalkan seluruh perubahannya; `manifest:check` menolak `SectionHeader`
yang berubah Server → Client.

**Gate piksel material tidak berhasil distabilkan**, dan itu dinyatakan, bukan
disembunyikan: lapisan WebGL tertangkap di sebagian capture dan tidak di
capture lain, run ke run. Perbandingannya dilakukan manual (material
`178/159/120`, DOM `177/157/120`); yang diotomasi adalah invarian yang membuat
kotak kosong **mustahil** — `data-material` hanya ditulis setelah mesh melapor
satu frame yang benar-benar bisa menggambarnya.

**Angka:** `/en` 1853 → **1892 KB** (plafon 2100) · `/en/work` 740 → 746 KB ·
detail dan `/en/ai` tak berubah, ketiganya tetap **nol three.js** · e2e 237 →
**244** · unit 400.

**Divalidasi setelahnya, dan tidak ada cacat baru.** Agen auditor mati dua kali
di batas pakai sesi tanpa membaca satu berkas pun, jadi validasinya dijalankan
inline dan terukur (spec §13). Yang dibuktikan: memblokir chunk scene sungguhan
memberi **nol kotak kosong**; `data-reveal=` muncul **0×** di HTML tersaji, jadi
tanpa JavaScript tak ada yang bisa tersembunyi; reduced motion menyisakan **0
dari 22** item tersembunyi; `<summary>` 1242×74 dan 347×72 dengan urutan heading
tak melompat; `SectionHeader` yang jadi Client Component **tidak** membocorkan
apa pun ke `/en/ai`. Enam pertanyaan adversarial dijawab dengan angka — di
antaranya `window.scrollY` yang terbukti melacak Lenis **selama** scroll, bukan
hanya saat diam, dan `--press-scale: 0.995` yang menempuh 6,21px lawan 6,14px
milik kartu proyek: selisih 0,03px, jadi bukan gestur token.

## Tahap 15 — Halaman per topik, dan gerak yang mengikutinya ✅

Spec penuh: **`docs/stages/TAHAP-15.md`**.

Dari dua permintaan pemilik: **halaman terpisah untuk setiap topiknya**, dan
animasi setingkat award yang **memakai pustaka dan sumber daya yang sudah ada
di repositori ini**. Yang kedua adalah batasan paling ketat di tahap ini, dan
yang paling berguna: **nol dependensi baru**.

**Tiga praktik akhirnya punya halaman.** Consulting, AI & Data, dan Commission
adalah kosakata tertutup sejak Tahap 13 — nilai skema, segmen URL, entri
JSON-LD, chip filter, tiga baris di hero, dan sejak Tahap 14b sebuah
`<details>` di beranda. Yang tidak mereka punya adalah halaman.
`/practice/<value>` menjadi halaman topik itu dan **menyerap** katalog
tersaring; `/work/practice/<value>` dialihkan permanen. Satu URL per topik.

**`ProgressText` akhirnya mendapat pekerjaannya.** Dibangun saat fork, punya
`scrub: true`, dan **nol pemakai selama lima belas tahap** — sementara komentar
dokumennya sendiri sudah menyebut untuk apa: _"a long passage the reader moves
through"_. Pernyataan sebuah praktik persis itu.

**Tiga perkakas menganggur sengaja tetap menganggur.** Observer, Flip, Tabs,
Accordion, dan sim fluid tetap nol pemakai. "Sudah terpasang" bukan alasan
untuk memakai, dan menyebut yang ditolak sama pentingnya dengan menyebut yang
dipakai.

**Aturan dari skill yang jadi batasan:** _"Don't use shared-element transitions
across more than one element pair per navigation"_ — tiap navigasi baru
memorf **satu** pasang. Dan `routing --stack nextjs` hanya mengembalikan satu
hasil generik, jadi keputusan arsitektur rute di tahap ini **bukan** berbasis
database skill, dan disebut begitu.

**Tidak dikerjakan, dinyatakan di muka:** tidak ada dependensi baru, tidak ada
halaman "tentang" (`/studio` dipakai Sanity), beranda tidak dipecah, tidak ada
material WebGL di rute baru.

**Hasilnya: morph yang diminta mengungkap cacat yang jauh lebih besar dari
dirinya sendiri.** Pasangan morph baru terpasang dalam beberapa menit dan
gate-nya merah — `::view-transition-old(morph-practice-consulting)` sendirian,
tanpa `group`, tanpa `new`. Enam dugaan diuji dan **lima salah**: bukan Client
Component, bukan chunk WebGL, bukan prefetch, bukan kedalaman rute, bukan nama
yang tidak cocok. Yang benar tidak ada hubungannya dengan halaman praktik:
React hanya memberi `view-transition-name` pada elemen yang **berada di dalam
viewport** saat commit, dan mencabutnya lagi kalau tidak — dibaca langsung di
sumber `react-dom` yang dipaketkan Next, bukan diduga.

**Dan tujuannya memang selalu di luar viewport, karena setiap navigasi internal
di situs ini membawa offset scroll halaman sebelumnya.** `components/ui/link`
memakai `scroll={false}` sejak fork, dengan komentar tentang peringatan yang
tidak pernah muncul sekali pun dalam pengukuran ini. Harganya: dari beranda di
y=3520, `/practice/consulting` **dibuka di 1522** — maksimum halamannya —
dengan `<h1>`-nya **1136px di atas layar**. Pembaca yang meminta sebuah halaman
mendarat di ujung bawahnya. Beranda → detail karya: 1047. `/work` → detail: 394.
Praktik → praktik berikutnya: 1480.

**Enam belas tahap gate hijau melewatkan ini** karena tidak satu pun gate
menanyakan ke mana sebuah navigasi _berakhir_ — semuanya memakai `page.goto`,
yang selalu mulai dari nol. Gate morph lama pun hijau justru karena `/work`
menaruh grid-nya dekat puncak: offset yang terbawa cukup kecil untuk menyisakan
sampul tujuan di dalam viewport. Ia hanya pernah menguji jalur yang pendek.

Perbaikannya satu baris — `scroll` kembali ke bawaan Next — dan memperbaiki
pendaratan dan morph sekaligus. `e2e/navigation-landing.e2e.ts` (baru, dua
viewport) memegang sebabnya; `e2e/motion.e2e.ts` memegang akibatnya, sekarang
dari tautan yang jauh di bawah halaman dan bukan hanya yang dekat puncak.
`MOTION-SPEC.md` §9.4 aturan 6 mencatat syaratnya.

**Yang tidak diperbaiki, dan disebut:** konsol dev melaporkan `params` dibaca
di luar `<Suspense>` pada `/[locale]/practice/[value]` — dan diukur, pada
`/en/work/arus-balik` juga. Pola lama di **setiap** rute dinamis, bukan bawaan
tahap ini, dan memperbaikinya tarik-menarik dengan Tahap 9 yang justru mencabut
batas Suspense supaya halaman terbaca tanpa JavaScript. Tahap tersendiri, bukan
sisipan diam-diam.

**Angka:** e2e 257 → **267** · unit 400 · `bun run check` exit 0 · build
produksi bersih. Enam asersi baru, semuanya dibuktikan merah dulu dengan
angkanya. Tidak ada klaim performa: tidak ada profiler di lingkungan ini
(`CLAUDE.md` #19).

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
