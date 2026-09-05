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
/en/studio           → halaman studio
/id/studio           → halaman studio
/cms                 → Sanity Studio (tidak dilokalkan; `/studio` sampai Tahap 38)
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
> `#contact` **tetap** anchor — `/studio` waktu itu masih dipakai Sanity
> Studio, dan memecah beranda bukan yang diminta. Tahap 38 memindahkan CMS ke
> `/cms` karena tabrakan itu ternyata sudah mengirim pembaca ke halaman login.

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

- `/cms` **tidak boleh** dilokalkan. Tanpa pengecualian eksplisit, next-intl
  me-redirect-nya ke `/en/cms` yang tidak ada — CMS mati sementara seluruh
  halaman lain tampak normal. Prefiks itu `/studio` sampai Tahap 38, dan
  justru karena itu `components/ui/link` menolak melokalkan `/studio` —
  sehingga tautan footer ke **halaman** studio dirender tanpa prefiks dan
  menyajikan CMS. Aturannya benar; jalurnya yang salah pilih.
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

## Tahap 16 — Perjalanan ✅

Spec penuh: **`docs/stages/TAHAP-16.md`**.

**Menambah halaman lagi akan memperburuk situs ini.** Peta rute §1.1 sudah
lengkap dan isinya yang belum — pernyataan praktik masih placeholder (Tahap 13
§9). Yang belum pernah diperiksa sekali pun dalam enam belas tahap adalah **apa
yang terjadi di antara halaman**: setiap gate di repositori ini memakai
`page.goto`, yang selalu mulai dari nol, sendirian, tanpa sejarah. Itulah
sebabnya cacat pendaratan Tahap 15b bertahan enam belas tahap dengan semua
gerbang hijau. Tahap ini menutup kelasnya, bukan satu contohnya.

**Terukur sebelum spec ditulis:** rute **sudah** diumumkan ke pembaca layar
(`next-route-announcer`, `aria-live="assertive"`, `"Consulting — Arth"`) ·
scroll **dipulihkan** saat mundur · judul dokumen ikut berubah · dan mundur
menjalankan **nol transisi** — potongan keras, karena `announceNavigation()`
hanya dipanggil dari `onNavigate` sebuah `<Link>`, dan tombol back tidak
menekan tautan apa pun.

**Tiga instrumen salah bentuk dicatat di spec §4.1.** Pertanyaan "apakah
rutenya diumumkan" butuh tiga percobaan, dan dua jawaban pertama keduanya
salah ke arah yang mengkhawatirkan — `querySelectorAll` tidak menembus shadow
root, dan `getElementsByName` mencocokkan atribut `name` bukan nama tag. Kalau
keduanya masuk spec, tahap ini akan dibuka dengan cacat aksesibilitas yang
tidak ada.

**Basis data skill tidak punya satu baris pun** tentang apakah navigasi mundur
harus bergerak sama sekali, dan itu disebut terus terang (§2.1 aturan 2). Yang
berbasis skill hanya asimetri waktunya: _"exit should always resolve faster
than entrance so back/forward feels snappy"_.

Isinya: **16a** mundur mendapat cover yang lebih cepat daripada maju (bukan
morph — menjanjikan morph yang merosot jadi cross-fade adalah cacat yang baru
diperbaiki) · **16b** `e2e/journey.e2e.ts`, satu pembaca, tujuh hop, enam
invarian per hop, dua viewport · **16c** shell instan — investigasi, bukan
janji, karena ia tarik-menarik dengan Tahap 9 yang mencabut batas Suspense
supaya halaman terbaca tanpa JavaScript.

**16a: mekanisme pertamanya salah, dan gate-nya yang menemukan.** Versi
`popstate` tidak pernah mengumumkan apa pun, dan handler-nya melaporkan
sendiri kenapa — `POP DEBUG: /en/practice/consulting vs
/en/practice/consulting`, kedua sisinya tujuan. Saat sebuah listener `popstate`
di sini berjalan, router sudah commit dan React sudah render ulang; balapan itu
tidak bisa dimenangkan. **Navigation API** menembak sebelum commit (23ms lawan
37ms) dan memberi `navigationType` serta `hashChange` sebagai data. Syaratnya
`traverse && !hashChange` — dan risiko §10.1 dikecualikan oleh bendera platform,
bukan heuristik. Risiko itu juga terbukti nyata: versi tanpa guard membuat gate
melaporkan `the overlay ran for an in-page anchor: idle, covering`.

**Satu cacat laten ditemukan lalu dibuat mustahil.** Gate perjalanan sempat
melaporkan `hop 3 back: the route overlay was left at "revealing" instead of
idle`. Overlay pulang ke `idle` lewat `transitionend`, dan event itu tidak
dijamin datang kalau dua keadaan mendarat di satu commit. Panel lalu duduk
separuh jalan selamanya. Timeout 900ms membuat keadaan terdampar itu tidak
terwakilkan — bentuk yang sama dengan kontrak `drew` Tahap 14a.

**16c dijawab, bukan ditunda.** Jalan pertama diukur dan ditolak: `<Suspense>`
di halaman praktik menurunkan render tanpa-JavaScript dari **924 karakter jadi
20** — harfiah "Skip to main content". Jalan kedua diambil: `export const
instant = false` pada kedua rute dinamis — diagnostik nol di delapan rute dua
bahasa, tanpa-JS tetap 924 karakter. Efek sampingnya, daftar pengecualian
`KNOWN` di gate perjalanan **dihapus**, jadi setiap console error kembali fatal
di sana.

**Gate ini lulus pada tulisan pertama, dan itu tidak membuktikan apa-apa** —
jadi tiap kelas asersinya dibuktikan bisa merah lebih dulu.

**Angka:** e2e 267 → **275** · unit 400 · `bun run check` exit 0. Tidak ada
klaim performa: "23ms lawan 37ms" adalah urutan event yang diukur di dalam
halaman, bukan kecepatan (`CLAUDE.md` #19).

---

## Tahap 17 — Audit: situs ini dilihat, bukan hanya dibaca ✅

Spec penuh: **`docs/stages/TAHAP-17.md`**.

Permintaan pemilik menentukan metodenya: "jangan sampai website terlihat
buruk" adalah pertanyaan visual, dan **enam belas tahap sebelumnya tidak
pernah sekali pun merender halaman lalu memandanginya.** Semua gerbang
memeriksa DOM, header, bobot bundel, dan pelanggaran aturan; tidak satu pun
menanyakan seperti apa tampilannya.

**Layar pertama situs ini adalah persegi hitam rata, dan aksennya yang
membuatnya begitu.** Diukur pada band antara header dan headline: mean
luminansi **4.0/255 dengan canvas, 15.5/255 dengan canvas disembunyikan.**
Halaman terlihat lebih baik dengan dekorasinya sendiri dimatikan.

**Sebabnya satu kata:** `linear` pada `<Canvas>` R3F, warisan fork Satūs. Ia
mematikan konversi sRGB di sisi keluaran sementara three tetap mengonversi
tiap `new Color(...)` di sisi masukan — jadi setiap warna custom-shader
mendarat sebagai `authored ^ 2.2`. Terbukti dengan aritmetika, bukan dugaan:
`#242527` adalah 39, dan `(39/255)^2.2 × 255 = 4.1`, persis angka yang
terukur. Sesudah: **30.2 mean, rentang gradien 2.0 → 13.9.**

**Dan perbaikan itu membuka kalibrasi kedua.** Grain hero disetel `0.06`
melawan pipeline yang rusak; dengan kurva benar ia terukur **sd 21.0/255** —
77% dari mean band, statik bukan film grain. Diturunkan ke `0.014` → **6.45**.
Setiap nilai yang pernah disetel dengan mata melawan pipeline salah harus
disetel ulang.

**Sistem desain dilewati persis di tempat terburuknya.** Dua-satunya hex
mentah di seluruh kode terkirim adalah dua warna hero itu. Aturan token
`CLAUDE.md` #8/#10 ternyata **tidak punya gate sama sekali** — §1.5 di atas
mencatatnya "ditegakkan saat review", dan gate gerak yang ada hanya memindai
CSS sementara warna WebGL adalah nilai TypeScript.
`lib/styles/scripts/token-rules.test.ts` menutupnya, dibuktikan merah dulu.
Wash-nya kini token, dan `contrast.test.ts` mengukur tinta di atasnya — gate
proyek ini sendiri yang menuntut itu, dengan langsung merah saat token baru
ditambahkan.

**Instrumen saya sendiri salah dua kali, lagi.** Sapuan hex pertama dipotong
`head -10` dan sepuluh baris pertamanya kebetulan komentar — kesimpulannya
"bersih, nol hex mentah", tepat di atas pelanggarannya. Dan `readPixels` di
tengah band mengembalikan `[0,0,0,0]` karena buffer sudah dibersihkan setelah
komposit; pembacaan itu hampir membuat saya menyimpulkan mesh-nya tidak
menggambar.

**Dicatat, tidak dikerjakan:** sebelas komponen `components/ui/*` nol pemakai
(warisan Base UI dari fork; `vault/` sebaliknya habis terpakai kecuali satu) ·
kartu setengah lebar yang berdiri sendiri di grid beranda, yang `span`-nya
datang dari CMS sehingga memperbaikinya adalah keputusan desain tersendiri.
**Belum semua halaman dipandangi** — `/en` dua viewport lima posisi scroll;
sisanya baru lewat gerbang otomatis, dan itu disebut karena audit visual
setengah jalan lebih berbahaya kalau dilaporkan selesai.

**Angka:** e2e 275 · unit 400 → **401** · hex mentah 2 → **0** · gate token
0 → **1**. Tidak ada klaim performa: semua angka di sini luminansi piksel dan
geometri tata letak.

---

## Tahap 18 — Selesaikan pandangan, lalu jadikan gate ✅

Spec penuh: **`docs/stages/TAHAP-18.md`**.

Tahap 17 sengaja berhenti setengah jalan: baru `/en` yang dipandangi, dan
sebuah flag render global dicabut tanpa dilihat efeknya di luar beranda.
Tahap ini menyelesaikan keduanya — empat puluh dua tangkapan, tujuh rute, dua
viewport, diukur lalu dipandangi.

**Dan menemukan cacat terkirim: setiap halaman praktik merender isinya
menempel ke tepi layar.** `h1` di **0px** sementara wordmark header di 14
(desktop) dan 17 (mobile) — tiga rute, dua viewport, dua bahasa. Sebabnya satu
baris: `.page` punya `padding-block` dan **tidak punya padding inline sama
sekali**, sementara `/en/work` memakai `var(--safe)`. Setiap gerbang
melewatkannya karena tidak ada yang pernah menanyakan **di mana isi dimulai** —
bentuk titik buta yang sama dengan posisi pendaratan Tahap 15b dan hero Tahap 17.

**`e2e/visual-substance.e2e.ts` menutup kelasnya.** Dua kelompok asersi,
keduanya **selisih halaman dengan dirinya sendiri** sehingga teks dan pipeline
tangkapan layar saling membatalkan. Bukti merah untuk yang kedua diperoleh
dengan menghidupkan kembali cacat Tahap 17 — mengembalikan `linear`, bangun
ulang — dan gerbangnya menangkapnya: `the accent made the page darker: 3.4
with it, 15.5 without`.

**Dua instrumen saya sendiri salah dan dikoreksi sebelum sempat berbohong:**
asersi "body copy" memakai `<p>` pertama dalam urutan DOM, yang di beranda
adalah indeks praktik yang memang rata kanan — merah terhadap desain yang
benar. Dan kontrolnya semula selalu menyembunyikan canvas, padahal di mobile
tidak ada canvas (WebGL digerbangi `supportsWebGL && isDesktop`), sehingga
lengan mobile hanya _skip_ — gerbang yang tidak bisa gagal.

**Kursor dipasang; scrollbar tidak.** Kursor punya kosakata yang menunggunya —
`data-cursor` sudah dideklarasikan di tiga blok sejak tahap-tahap lalu dan
komponennya tidak pernah dipasang. Hambatannya nyata: ia mengimpor GSAP,
sementara `route-budget` mengizinkan GSAP di dua rute dan **nol** di tiga
lainnya. Geraknya pindah ke loop Tempus yang sudah ada — yang `CLAUDE.md` #6
memang tuntut — jadi kursor terkirim ke seluruh situs dengan **nol biaya
pustaka**, anggaran tetap hijau tanpa satu pun dinaikkan. Scrollbar tidak
punya kosakata yang menunggunya dan bersaing dengan karyanya; sembilan sisanya
kontrol formulir tanpa tempat di sini.

**Gerak diverifikasi, bukan diasumsikan.** Kurva follow kursor disampel per
frame setelah lompatan 800px: 39% → 71% → 83% → **95% pada 200ms** → 98% →
99%. Persis `duration.fast`, karena `FOLLOW_TAU = duration.fast / 3`. Hanya 16
frame dalam 600ms (~27fps headless) — justru itu yang membuktikan kenapa
bentuk eksponensialnya penting. Reduced motion: **1000px pada 50ms**, menempel,
cincin tetap ada. Wash hero benar-benar bergeser: mean |delta| **1.06/255**
dalam 4 detik.

**Terbuka, dan disebut:** kekosongan hero (keputusan komposisi, bukan cacat) ·
kartu setengah lebar sendirian · **header tanpa nav di rute dalam** — dari
`/en/work` atau halaman praktik hanya ada wordmark dan pengalih bahasa, dan
belum diputuskan apakah itu kehematan atau jalan buntu.

**Angka:** e2e 275 → **297** · unit 401 · `bun run check` exit 0 ·
`route-budget` hijau tanpa anggaran dinaikkan.

---

## Tahap 19 — Halaman proyek: apa yang ia jawab sebelum digulir ✅

Spec penuh: **`docs/stages/TAHAP-19.md`**.

Prioritasnya dijangkarkan pada kriteria penilaian awwwards yang dipublikasikan
— **Design 40% · Usability 30% · Creativity 20% · Content 10%** — dan halaman
proyek adalah halaman yang paling dinilai di sebuah portofolio.

**Terukur di 1280×800: setiap fakta tentang sebuah karya dimulai 259px di
bawah lipatan**, sementara separuh kanan layar kosong sepanjang 767px tinggi
sampulnya. Layar pertama berisi sebuah nama dan setengah gambar, tidak lebih.
Di 390×844 fakta sudah di atas lipatan (611 dari 844) — cacatnya desktop-only,
dan perbaikannya juga.

**Faktanya pindah ke kolom yang memang sudah kosong**, sejajar puncak sampul:
`<dl>` dari **1059 → 256**. Layar pertama kini menjawab apa, untuk siapa,
kapan, dan seberapa besar tanpa digulir.

**Sampulnya tidak bergerak satu piksel** — 614 lebar, tepi kanan 628, sebelum
dan sesudah. Pola `Portfolio Grid` yang situs ini pakai meminta _"visuals
first"_, dan Tahap 11b menyetel lebar itu supaya sampul dan galeri berbagi tepi
kanan. Track grid-nya **mengulang ekspresi lebar yang sama** alih-alih
menimpanya, dan `media-edge.e2e.ts` yang membuktikan hasilnya identik.

**Basis data skill nol** untuk `"case study"` dan `"above the fold"`. Dicatat,
lalu prinsip universal pola yang dipakai situs ini yang jadi jangkar — dan
prinsip itu yang melarang solusi malas berupa menggeser sampul turun.

**Dua aturan proyek ini menolak kode saya, dan keduanya benar:**
`no-nested-ternary`, lalu `no-shape-in-symbol-names` atas `coverShape` —
diganti `coverSpan`, kata domain yang komponennya sendiri sudah pakai.

**Angka:** e2e 297 → **299** · unit 401 · `check` exit 0 · `media-edge` dan
`spatial-rhythm` hijau.

---

## Tahap 20 — Jalan keluar dari rute dalam ✅

Spec penuh: **`docs/stages/TAHAP-20.md`**.

Rencana menuntut angka sebelum pendapat, dan angkanya mengubah kesimpulan.
Dihitung di build produksi, dua viewport, memisahkan header, footer dan isi:
`/en` 12 tautan lanjut · `/en/work` 11, termasuk tiga chip praktik ·
halaman praktik 3 · **halaman proyek 1** — hanya "proyek berikutnya".

Dan pada **setiap** rute, footer situs ini tidak membawa satu pun tautan
navigasi. Halaman proyek justru yang paling mungkin jadi halaman pendaratan,
dari hasil pencarian atau tautan yang dibagikan, dan ia menawarkan pembaca
tepat satu jalan lanjut. Gerbang barunya bahkan menemukan bahwa **beranda
sendiri tidak pernah menautkan ke katalognya**.

**Koreksi terhadap rencana saya sendiri:** §1.3 mengusulkan navigasi di
header. Header sudah memutuskan dengan sadar untuk tidak membawa anchor
beranda di rute dalam — anchor itu akan jadi tautan mati — dan argumennya
sahih. Footer menyelesaikan masalah yang sama tanpa menyentuhnya, sudah
ter-mount di tiap rute, dan **setiap tautannya rute nyata** sehingga tidak
bisa mati. Basis data skill mendukungnya lewat pola yang situs ini pakai:
`Portfolio Grid` menaruh CTA utamanya di _"Project Card Hover + Footer
Contact"_.

Satu kolom keempat, berbentuk identik dengan "Elsewhere" yang sudah ada:
Work plus tiga praktik, diambil dari `lib/content/practices` — satu-satunya
tempat yang memutuskan ke mana sebuah praktik menunjuk sejak Tahap 15. Nama
praktiknya dari `workIndex.<value>`, string yang sudah dipakai chip katalog
dan hero praktik, jadi footer menyebutnya sama seperti seluruh situs. Kolomnya
terukur rata di 300px masing-masing pada 1280.

**Angka:** e2e 299 → **306** · unit 401 · `check` exit 0 · `route-budget`
hijau tanpa anggaran dinaikkan. Header tidak disentuh.

## Tahap 21 — Satu momen milik sendiri: materialnya ternyata beku ✅

> Spec: [`docs/stages/TAHAP-21.md`](./stages/TAHAP-21.md)

Rencana §1.2 meminta lapisan material dinaikkan "dari aksen jadi tanda
tangan". Dua hal menghalanginya, dan yang kedua tidak diduga.

Yang pertama sudah tertulis di proyek ini sendiri: `MAX_DISPLACEMENT` ada
**justru karena** nilai itu menggoda untuk dinaikkan, dan `CLAUDE.md` #13
menyebut 3D sebagai aksen. Jadi jalur "lebih keras" ditutup, dan menutupnya
adalah jawaban yang benar.

Yang kedua muncul saat mengukur: **lapisan material tidak pernah bergerak sama
sekali.** Beku sejak ia dikirim di Tahap 14. Setiap uniform per-frame ditulis
ke objek `useMemo` milik komponen, bukan objek yang three pakai untuk
merender — jadi platnya menggambar nilai frame nol selamanya. Terukur:
`uniform1f` untuk `uTime` milik program material terpanggil **satu kali,
dengan nilai 0**, seumur halaman, sementara nilai JS-nya maju normal tiap
frame. Dua build dengan shader berbeda (satu diberi tint yang digerakkan
`uTime`) menghasilkan piksel **identik byte-per-byte**.

Semua gerbang Tahap 14 hijau dan semuanya benar — mereka menggerbangi
**keberadaan** (ada canvas, ada mesh, tekstur terikat, tidak ada kebocoran
GPU). Tidak satu pun menanyakan apakah materialnya **bergerak**. Pola yang
sama dengan Tahap 17: pertanyaannya berhenti satu langkah sebelum yang dilihat
pembaca.

Perbaikannya struktural dan sudah ada contohnya di repo: tulis lewat
`materialRef.current.uniforms`, seperti `vault/webgl/scene-shell` yang memang
beranimasi. Di atas material yang kini hidup, barulah input kedua dipasang —
**kecepatan gulir**, sebagai shear sumbu-Y yang mewarisi edge falloff yang
sudah ada, sehingga tepi plat tetap diam. Nol pendengar baru, nol dependensi,
nol perubahan rute; `scene.tsx` memang sudah membaca `window.scrollY` tiap
frame.

Hasilnya tangga tiga anak, diurutkan menurut seberapa disengaja gerakan yang
memicunya: **hanyut 0.002 (tak seorang pun) → gulir 0.005 (sedang membaca) →
pointer 0.008 (menjangkaunya)**.

**Angka:** piksel plat yang berubah, kursor dikecualikan —
`0,00% → 0,66-2,99%` diam, `0,00% → 3,75-6,80%` sapuan pointer,
`0,00% → 1,48-2,45%` menggulir. e2e 306 → **307 lulus, 2 dilewati** (mobile,
alasan tertulis) · unit 401 → **404** · `check` exit 0 · storybook 92 lulus ·
`route-budget` hijau tanpa anggaran dinaikkan.

**Sepuluh instrumen salah dicatat di §8.4**, termasuk yang paling mahal:
baseline "pointer menggerakkan 2,6% plat" ternyata **cincin kursor**, bukan
platnya. Dan gerbang kedua sengaja **bukan** berbasis piksel — diukur dulu,
lalu dibatalkan, karena shear meluruh pada 133ms sementara rana CDP mendarat
50-150ms kemudian, dan urutan lengannya terbalik antar-jalan.

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

## Tahap 22 — Pondasi: footer yang tertelan canvas ✅

> Spec: [`docs/stages/TAHAP-22.md`](./stages/TAHAP-22.md)

Fase 0 dari scaffold pengembangan lanjutan yang disetujui pemilik proyek.
Pondasi harus bersih dulu, karena Fase 6 akan menaruh canvas di lebih banyak
rute — dan menambah canvas sebelum tahap ini akan **menggandakan** cacatnya.

Cacatnya ditemukan bukan oleh gerbang mana pun, melainkan dengan **menelusuri
situs sebagai pengunjung**: menggulir ke dasar beranda mencari alamat email,
dan menemukan ruang gelap kosong. Footer empat kolomnya ada di sana — DOM
benar, `opacity: 1`, lolos hit-test, axe bersih — dan **tidak terbaca**.

Sebabnya bukan WebGL, bukan reveal, bukan opacity, melainkan **urutan lukis
CSS**: `<footer>` dikirim sebagai `position: static` sementara saudaranya
`<main>` membawa `relative`. Blok non-berposisi dilukis di lapisan 3, seluruh
keturunan berposisi di lapisan 6 — termasuk pembungkus WebGL yang `fixed`.
Footer melukis **di bawah** canvas. Satu properti yang hilang.

**Instrumen pertama saya salah, dan salahnya informatif:** luminansi rata-rata
pita footer justru **naik** melintasi cacat ini (16,90 → 23,82), karena wash
memang menambah cahaya. Yang ia hancurkan adalah jarak teks ke latarnya —
p99 jatuh **98 → 39**. Kedua kalinya di proyek ini statistik yang salah
menyembunyikan cacat yang persis sedang dicari (Tahap 17 yang pertama).

**Angka:** p99 teks footer `39 → 88` (kontrol tanpa canvas: 82 — perbaikannya
melampauinya, karena wash lalu menyumbang cahaya _di belakang_ teks).
Gerbangnya menangkap `/id` merah juga, yang tidak saya ukur manual.

**Soft-404: premis saya salah, dan dikoreksi bukan ditambal.** Status 200 pada
URL tak dikenal ternyata konsekuensi terdokumentasi dari Cache Components,
sudah ditegaskan `e2e/not-found.e2e.ts` berikut alasannya, dan sudah
dimitigasi `noindex` + judul jujur. Tidak diubah. Yang dikerjakan masalah
manusianya — dan pemeriksaan setiap label nav di kedua bahasa menemukan
**lima** URL tebakan yang 404, bukan satu: `/en/contact`, `/id/kontak`,
`/en/practice`, `/id/praktik`, dan yang paling tajam `/id/karya` (labelnya
"Karya", rutenya `/work`, jadi pembaca Indonesia yang mengetik apa yang ia
baca **selalu** salah). Kelimanya kini 308 asli lewat `proxy.ts`, satu-satunya
lapisan tempat status nyata memang tersedia.

**Anggaran: aturannya dicabut, angkanya tidak dinaikkan.** Aturan Tahap 7
("WebGL di tepat satu rute") dicabut eksplisit di dalam `route-budget.e2e.ts`,
karena melanggar diam-diam lebih buruk daripada mencabut terbuka. Tapi tidak
ada plafon yang naik: menaikkan anggaran untuk berat yang belum ada adalah
cara anggaran berhenti bermakna. Temuan sampingannya: **`/id` tidak pernah
diukur sama sekali** — seluruh daftar berisi rute `/en`, padahal beranda
Indonesia membawa 1899 KB dan dua library yang sama. Sekarang ada di daftar.

e2e **319 lulus**, 12 dilewati · unit **410 lulus** · `check` exit 0 ·
storybook 92 lulus. Satu kegagalan awal (`storybook-a11y` penjaga kebasian)
adalah gerbang yang bekerja benar, bukan cacat.

**Dua instrumen salah dicatat di §8.4**, termasuk asersi status pengalihan
yang bentuk pertamanya **tidak bisa gagal** — ia menyubstitusi nilai yang
diharapkan ketika tidak ada pengalihan sama sekali, jadi lulus paling kuat
justru saat fiturnya hilang. Diperbaiki lalu dibuktikan bisa merah.

---

## Tahap 23 — Satu kosakata masuk, diucapkan di setiap halaman ✅

> Spec: [`docs/stages/TAHAP-23.md`](./stages/TAHAP-23.md)

Fase 1 dari scaffold. Scaffold-nya menulis bahwa `text-reveal` dan `magnetic`
punya nol konsumen dan tinggal dikirim; memeriksanya dengan benar menunjukkan
**keduanya sudah terkirim** — di `vault/blocks/hero`, yang render di beranda.
Yang benar-benar menganggur ternyata `components/ui/marquee`.

Setelah premisnya diperbaiki, cacat yang sebenarnya kelihatan: situs ini punya
**dua kosakata masuk**. Beranda menaikkan `h1`-nya baris demi baris di balik
mask; katalog, halaman proyek, dan halaman praktik memakai reveal blok
generik. Gerakan yang mahal hidup di satu rute dan sisanya dapat default —
kebalikan persis dari standar yang `CLAUDE.md` tutup dengan, bahwa yang
membedakan situs award adalah **pengendalian diri yang diterapkan konsisten**.

`TextReveal` kini membawa `h1` katalog dan halaman proyek. Halaman praktik
sengaja tidak: `h1`-nya di dalam `<ViewTransition share="morph">` — seluruh
hasil Tahap 15b — dan SplitText mengganti persis node yang morph itu potret.

**Angka:** +120 KB per rute (751 → 871 dan 746 → 866), yaitu GSAP,
ScrollTrigger, dan SplitText tiba di rute yang sebelumnya tidak membawanya.
Kenaikan anggaran **diizinkan pemilik proyek dan tidak dipakai** — keduanya
tetap di bawah plafon 900 yang sudah ada, sisa ~30 KB. Yang berubah cuma
daftar `allow`, dan itu memang keputusan yang berkas anggaran jaga.

e2e **319 → 323 lulus** · unit 410 · `check` exit 0 · storybook 92 ·
`journey.e2e.ts` lulus, jadi split ini tidak mematahkan morph mana pun.

**Dua rencana ditolak oleh pengukuran, bukan dikecilkan diam-diam.**
`Magnetic` tidak diperluas: ketiga kandidatnya elemen selebar kolom
(`block`/`flex`, sampai 440px tinggi) sementara `.magnetic` `inline-block` —
membungkusnya menciutkan tata letak, dan pada tautan email ia meniadakan
pembungkusan baris yang komentarnya sendiri lindungi. Parallax tidak dipasang
pada karyanya: gambar galeri mengisi kotaknya persis, jadi menggesernya
menuntut membesarkan gambar — **memotong karya supaya efeknya punya ruang**,
yang persis argumen `MAX_DISPLACEMENT` proyek ini sendiri.

**Tiga premis salah dicatat di §8.6**, termasuk satu "cacat" yang saya
laporkan dan ternyata bukan (chip filter bernavigasi ke halaman praktik lewat
`permanentRedirect`, jadi `h1` yang saya ukur memang sengaja tidak displit),
dan satu komentar yang saya tulis memuat klaim palsu tentang `key` — diperbaiki
alih-alih dibiarkan.

---

## Tahap 24 — Halaman Studio, dan cacat a11y yang sembilan tahap tak terlihat ✅

> Spec: [`docs/stages/TAHAP-24.md`](./stages/TAHAP-24.md)

Fase 2 dari scaffold. Pemilik proyek mencabut larangan konten fiktif untuk
tahap ini: teksnya perancah tata letak, akan diganti, dan fokusnya **desain
dan gerak**. Ditulis dengan panjang realistis supaya tata letaknya teruji oleh
bentuk yang akan benar-benar dipakai. Kolofonnya pengecualian — faktual, dan
dibiarkan benar.

`/[locale]/studio` menutup janji yang Tahap 22 catat: label `STUDIO` menunjuk
anchor sejak awal, `/en/studio` mengembalikan 404, dan itu satu-satunya label
nav yang sengaja tidak dialihkan karena rutenya akan lahir di sini.

Nol primitif gerak baru — `TextReveal`, `Reveal`, dan `ProgressText` semuanya
sudah ada. Satu momen berkoreografi, dinamai `studio-statement`. Kolom label
"cara kerja" **menempel** lewat CSS `position: sticky`: koreografi tanpa satu
baris JavaScript, tanpa satu kilobyte, dan tanpa pertanyaan reduced-motion
untuk dijawab, karena ia tata letak bukan animasi.

**Tiga cacat, dan yang ketiga jauh lebih besar daripada halaman ini.**

Dua ditemukan dengan **memandang**, bukan oleh gerbang: halaman merender di
bawah header tetap (`h1` di 86 sementara header berakhir di 98 — setiap rute
lain lolos di 146-480), dan nama kapabilitas merender kunci mentah
(`work.consulting`) karena label praktik ada di namespace `workIndex`.

Yang ketiga ditangkap `route-sweep` — yang menemukan rute baru itu sendiri,
membuktikan pendaftarannya benar — dan sumbernya **bukan halaman ini**:
`components/effects/progress-text` menyuruh SplitText menulis teksnya ke
`aria-label` pada sebuah `<span>`. `aria-label` **dilarang** pada elemen yang
role-nya tidak mendukung penamaan, dan tidak ada tag yang akan membuatnya sah.
Cacat itu ada di **setiap halaman praktik** sejak Tahap 15, dan gerbangnya
hijau selama sembilan tahap **karena keberuntungan posisi**: pernyataan di
sana ada di bawah lipatan, jadi SplitText belum jalan saat axe mengaudit.
Halaman Studio menaruh satu dekat atas, dan cacat laten itu muncul.
Diperbaiki dengan pola yang bisa dibuktikan benar — salinan visual
disembunyikan dari teknologi bantu, teks lengkap di elemen `sr-only`
sebelahnya — dan keempat rute kini bersih.

e2e **328 lulus + 5 gagal → 333 lulus, 0 gagal** · unit 410 · `check` exit 0 ·
axe langsung bersih di empat rute · reduced motion 47 elemen `minOpacity: 1`,
nol tersembunyi · ponsel tanpa overflow.

Satu hal **diperiksa dan ternyata bukan cacat** (§8.5): bagian penutup yang
tampak kosong di satu tangkapan layar ternyata `opacity: 1` dengan teks utuh —
ia hanya belum tercapai pada posisi gulir itu.

---

## Tahap 25 — Koreografi Studio: anggaran dibebaskan, kontras yang mahal ✅

> Spec: [`docs/stages/TAHAP-25.md`](./stages/TAHAP-25.md)

Pemilik proyek membebaskan anggaran untuk animasi. **Tidak terpakai** — rute
studio berakhir 835 KB dari plafon 900 yang sudah ada. Yang mahal ternyata
bukan berat melainkan **kontras**.

Uji ulang Fase 2 mengukur dua hal. Kolom menempelnya **bekerja** — terpaku
tepat di offsetnya, 146px — tapi bagiannya 580px di viewport 900px, jadi
pin-nya berlangsung ~200px dan selesai sebelum ada yang menyadarinya. Kelas
cacat yang sama dengan Tahap 21: bergerak benar, tak pernah ditemui. Dan
scrub pernyataannya sudah sepertiga selesai saat halaman **dibuka**.

`vault/blocks/step-sequence` menjawab keduanya sekaligus, dan keduanya saling
menopang: bagiannya diberi tinggi nyata, dan labelnya diberi pekerjaan —
melaporkan langkah yang sedang dibaca (`01 / 04` dan namanya), dengan langkah
lain mundur. Label yang tertahan tiga layar sambil mengucapkan satu kata mati
lebih buruk daripada tidak ditahan sama sekali.

**Angka:** pin `~200px → 1500px` · indeks `statis → 01→02→03→04` · scrub
`selesai di 400px → ~1000px, dan belum mulai saat dibuka` · dokumen
`2261 → 4644px` (harganya, disengaja).

**Dua bacaan saya salah, keduanya dikoreksi di catatan.** "Sticky-nya rusak"
salah — mekanismenya benar, skalanya yang kurang. Lalu saya mematahkannya
sendiri dengan membungkusnya: blok penampung sticky berpindah dari grid area
ke kotak 14px, dan pin hilang total. Dan premis gerbang saya salah: **efek
terkait-gulir pada elemen yang sudah di layar sudah dimulai** — tidak ada nilai
`start` yang memperbaikinya, hanya tata letak.

**Dua kegagalan kontras, dan yang kedua berumur sepuluh tahap.** Peredupan
langkah ditulis 0,55 dan diukur **3,70:1**; disapu terhadap axe, 0,65 lantai
pertamanya, dipakai 0,7. Lalu route-sweep gagal dengan **89 node**: sembilan
puluh kata `ProgressText` pada `dimOpacity: 0.33` = **2,78:1** — default
komponen sejak Tahap 15, yang tak pernah terlihat karena di halaman praktik
passage-nya di bawah lipatan dan split-nya belum jalan. Disapu: 0,5 lantainya,
default jadi 0,55, dan perbaikannya ikut menutup ketiga halaman praktik.

**Untuk ketiga kalinya** cacat lolos karena axe mengaudit pada `scrollY 0`
sementara elemennya di bawah lipatan. Gerbang baru menggulir **masuk** ke
dalam urutan, memastikan satu langkah sudah mundur, lalu menjalankan axe di
sana — dua bahasa.

e2e **337 lulus, 0 gagal** · unit 410 · `check` exit 0 · reduced motion
`[1,1,1,1]`, dijamin stylesheet bukan state komponen · anggaran tidak
dinaikkan.

---

## Tahap 26 — Journal, dan nol kosakata gerak baru ✅

> Spec: [`docs/stages/TAHAP-26.md`](./stages/TAHAP-26.md)

Fase 3. Empat rute baru (indeks dan entri, dua bahasa), skema `journalEntry`
terdaftar dengan tiga query, dan **nol byte ditulis ke dataset**.

Scaffold menulis "skema baru". Skemanya dibuat — itu arsitektur yang benar dan
ia tidak menulis apa pun. Yang **tidak** dilakukan: menaruh entri contoh ke
dalam dataset, yang bernama `production`. Proyek ini sudah menghadapi kasus
persis ini di `lib/content/home-fallback.ts` dan sudah memutuskan: perancah di
kode, CMS menang seluruhnya, jangan pernah menaruh karangan ke pustaka konten
yang nyata. Kontraknya **diuji unit**, bukan diniatkan.

**Sebuah pintu yang Tahap 10 tutup dibuka lagi, dan itu disebut.** Starter
Satūs mengirim tipe `article` dan Tahap 10 menghapusnya karena ia "blog
lengkap di situs studio yang tidak menulis" yang tak pernah diberitahukan ke
siapa pun. `journalEntry` berbeda dalam tiga hal, ketiganya ditulis di dalam
skemanya: ia diminta, ia punya rute dan halaman yang dirender di hari ia
dikirim, dan ia didokumentasikan. Kalau ketiganya berhenti benar, ia harus
pergi seperti `article` pergi.

**Gerak: nol kosakata baru, dan itu keputusan.** Tahap 25 baru saja
menghabiskan satu tahap mengukur dua peredupan yang gagal WCAG; menambahkan
gerak keenam di tahap berikutnya adalah cara koherensi yang baru dibayar mahal
itu hilang. Kedua halaman memakai `TextReveal`, `Reveal`, dan tata bahasa
INTENT yang sudah ada. §9.5 mengizinkan dua momen berkoreografi; keduanya
memakai **nol**. Ringkasan tidak disembunyikan di balik hover — indeks yang
isinya hanya muncul saat ditunjuk tidak bisa dipakai dengan keyboard.

**Dua penolakan lint diperbaiki dengan mengubah bentuk, bukan membungkam:**
type assertion diganti type guard (`PRACTICES.some`), dan anotasi `Record`
diganti `satisfies`.

Satu cacat ditemukan **dengan mata**: tanggal dan praktik menyatu jadi satu
string. Diberi pemisah `·` — konvensi yang kartu proyek sudah punya.

e2e **351 lulus, 0 gagal**, 18 dilewati · unit **417** (dari 410) · `check`
exit 0 · ponsel tanpa overflow.

Satu celah **disengaja dan disebut** (§8.8): rute entri membaca perancah saja;
cabang CMS-nya menunggu dokumen pertama supaya tidak ditulis buta terhadap
bentuk Portable Text yang belum pernah ada.

---

## Tahap 27 — Indeks jurnal yang membaca balik, dan satu kosakata dipakai dua kali ✅

> Spec: [`docs/stages/TAHAP-27.md`](./stages/TAHAP-27.md)

Uji ulang Fase 3. Indeksnya **sepenuhnya statis sesudah muat**: keempat item
reveal-nya di atas lipatan, jadi masuknya terjadi sekali di frame pertama dan
ketiga barisnya melaporkan `1.00 1.00 1.00` di setiap posisi gulir yang
diukur. Isi halaman itu **tiga judul** — tiga judul yang tiba bersamaan lalu
diam adalah seluruh pengalamannya.

**Dan yang dikirim bukan kosakata baru — itu justru argumennya.** Logika "mana
yang sedang dibaca" diekstrak dari `step-sequence` ke
`vault/motion/use-active-in-sequence`, lalu dipakai indeks jurnal. Sebuah
mekanisme yang cuma hidup di satu halaman bukan kosakata, ia pengecualian —
argumen yang sama dengan Tahap 23 tentang kosakata masuk, satu tingkat lebih
dalam. Digerakkan gulir, bukan pointer, supaya ia ada di ponsel.

**Angka:** dokumen `1534 → 2228px` · opacity `1.00 1.00 1.00` di mana-mana →
`1.00 0.70 0.70` / `0.70 1.00 0.70` / `0.70 0.70 1.00` · jarak judul→ringkasan
`215 → 27px`.

**Kontras disapu lebih dulu, bukan sesudah gerbang merah:** 0,55 → 3,70:1,
0,60 → 4,21:1, **0,65 lantainya**, dikirim 0,7. Angka 3,70:1 itu persis sama
dengan peredupan langkah Tahap 25 — token dan latar yang sama pada opacity
yang sama. Dan ambang judul display memang **3:1**, terukur oleh axe, bukan
diasumsikan dari ukurannya.

**Satu cacat baru, dan hanya ponsel yang punya.** Tinggi barisnya ditulis di
dalam `@media (--desktop)`, jadi di 390×844 dua baris sudah melewati garis
baca di frame pertama: **entri terbaru tampil redup saat halaman dibuka**, yang
memimpin entri kedua, dan 200px kemudian kepemimpinan menetap di baris ketiga
untuk sisa ~1400px. Diberi `min-block-size: 40svh` di aturan dasarnya; sesudah
itu baris terbaru memimpin saat diam dan urutannya `01 → 02 → 03`. Urutan
langkah studio **diukur untuk cacat yang sama dan tidak punya**, jadi tidak
diubah.

**Untuk ketiga kalinya** `min-block-size` pada grid menyebarkan tinggi
tambahannya _melalui_ isinya — judul 215px dari ringkasannya. Pasangannya
`align-content: start`, dan sekarang ditulis sebagai aturan di CSS-nya, bukan
perbaikan satu kali. Dua kesalahan saya yang lain juga dicatat: `Reveal` dan
peredupan berebut `opacity` di elemen yang sama (reveal menang lewat urutan
sumber, peredupannya inert), dan sebuah komentar JSX yang tidak sah di dalam
`map`.

e2e **354 lulus, 0 gagal**, 18 dilewati · unit 417 · `check` exit 0 · reduced
motion nol baris di bawah 0,99 · ponsel dua bahasa tanpa overflow.

---

## Tahap 28 — Pencarian: satu permukaan yang menjangkau ke dalam halaman ✅

> Spec: [`docs/stages/TAHAP-28.md`](./stages/TAHAP-28.md)

Fase 4. Palette ⌘K di setiap rute, 17 entri dua bahasa dari sumber yang sudah
ada — katalog rute, praktik, proyek, entri jurnal. **Nol konten baru, nol
dependensi baru**: `dialog`, `autocomplete` dan `scroll-area` adalah tiga
komponen Base UI yang scaffold catat sebagai terpasang tapi nol impor.

Yang membedakannya dari hiasan ditulis di spec §1 dan dikerjakan: ia
menjangkau **ke dalam** halaman (mengetik nama klien menemukan proyek yang
judulnya tidak memuatnya), ia punya **tombol yang terlihat** karena pintasan
tanpa pintu hanya melayani yang sudah tahu, dan ia **gratis sampai dibuka**.

**Gerbang anggaran merah, dan penyebabnya bukan yang saya duga.** Tiga rute
lewat plafon untuk kode yang belum dibuka siapa pun: `/en/work` 871 → **914**,
praktik 874 → **917**. Bukan `next/dynamic` (diganti `React.lazy`, identik),
bukan Base UI bocor (kode palette-nya memang tidak pernah tiba lebih awal).
Penyebabnya **satu impor**: palette memakai `components/ui/link`, yang juga
tinggal di chunk eager header — sebuah modul yang dipakai chunk eager _dan_
async membuat webpack menggandakan seluruh grup chunk-nya, 43 KB dikirim dua
kali. Dicabut: 914 → **880**. Barisnya tetap `<a href>` sungguhan dan navigasi
kliennya dikembalikan lewat `router.push`. **Nol plafon dinaikkan**, padahal
diizinkan — aturan file itu sendiri yang berlaku: perbaikan yang benar adalah
berhenti mengirim beratnya.

**Jawaban yang salah, dibuktikan merah.** Urutan struktural + sorot-yang-pertama
berarti mengetik `scope` — kata pertama judul entri jurnal — membuka
**beranda**, karena deskripsi beranda memuat "scopes". Diperbaiki dengan
peringkat: judul-diawali > judul-memuat > baris-memuat, dan grupnya ikut
diurutkan oleh jawaban terbaiknya.

**Dua cacat tata letak yang nol gerbang temukan**, ditemukan dengan
memandanginya sesudah semuanya hijau: daftarnya keluar **689px** di bawah
bingkai (`max-block-size: 100%` bukan tinggi yang definit), dan kotak "tidak
ada hasil" menahan 56px sementara tujuh belas hasil tampil. Keduanya kesalahan
saya; ini persis yang `CLAUDE.md` maksud dengan gerbang hijau bukan situs yang
benar.

axe bersih **pada palette yang terbuka** dua bahasa — pelajaran Tahap 25 §7.5
dalam bentuk baru, karena dialog yang tertutup tidak ada di DOM.

e2e **362 lulus, 0 gagal**, 18 dilewati · unit **432** (dari 417) · `check`
exit 0 · `route-budget` 9/9 · tanpa JS pemicunya tidak ditawarkan sama sekali.

---

## Tahap 29 — Palette itu halaman situs ini, bukan kotak gelap milik tool mana pun ✅

> Spec: [`docs/stages/TAHAP-29.md`](./stages/TAHAP-29.md)

Tahap 28 lulus setiap gerbang dan tampak seperti command palette mana pun:
kotak gelap di tengah, satu ukuran huruf untuk judul dan deskripsi, satu kolom
rata. Ia bekerja dan **tidak menyerupai situs ini sama sekali**.

Yang menggantikannya **bukan gaya baru** — nol warna, ukuran, radius, atau
bayangan ditambahkan. Ia bahasa yang indeks jurnal sudah pakai, diucapkan
ketiga kalinya: rel mono di kiri, penanda bagian huruf kapital berjarak, dan
grid dua belas kolom yang sama dengan halaman di belakangnya. Barisnya jadi
tiga pita — **fakta · nama · janji** — yaitu bentuk daftar isi terbitan.

**Angka:** kotak 672px → **lembar 1398px** selebar pelipir · satu ukuran huruf
→ **12 / 20 / 16** · jarak antar pita **226px dan 452px** · penghitung
`03 / 17` yang mengikuti kueri.

**Koreografi, semuanya dari token:** latar 200ms masuk / 150ms keluar, lembar
400ms `expo.out` turun dari −12px, baris berurut `0, 40, 80…ms` masing-masing
200ms. **Menutup memakai kurva masuk dan lebih cepat** — deselerasi saat tiba,
akselerasi saat pergi. Saat kuerinya berubah barisnya menyelesaikan diri
dengan **satu** gerakan (`delay [0]`), karena stagger penuh pada tiap ketukan
tombol terasa mabuk.

**Bukan GSAP, dan itu diukur.** Pelajaran Tahap 28 masih baru: modul yang
dipakai chunk eager _dan_ async membuat webpack menggandakan grup chunk-nya.
`element.animate()` nol biaya impor, berjalan di compositor (jadi tidak
menambah loop RAF kedua), dan hasilnya **880 → 881 KB**.

**Cacat yang Tahap 28 kirim dengan seluruh gerbang hijau.** Indeksnya diambil
saat palette pertama dibuka; ditahan 900ms, palette menjawab **"Nothing
matches that"** di atas penghitung `00 / 00` — jawaban atas kueri yang belum
diketik — selama seluruh perjalanan jaringan. Permintaan yang **gagal**
mengatakan kalimat yang sama, yang lebih buruk lagi. Sekarang tiga keadaan:
memuat, hasil, dan gagal yang menyebut apa yang masih bekerja.

**Empat gerbang ditulis, tiga dibuang karena hampa.** `nama.left > rel.left`
lulus dengan inset glif 7px; melewati lebar rel lulus karena span inline
menyusut; berbagi `top` lulus karena `align-items: baseline` menggeser lebih
jauh daripada tumpukan. Yang dipakai: jarak ≥100px antar pita — 226 dan 452
terkirim, 7 dan −7 bertumpuk.

**axe menangkap koreografinya, dan benar.** Gerbang jadi "flaky" dengan
`color-contrast (3 node)`: baris yang setengah memudar memang gagal kontras.
Staggernya dibatasi delapan baris (840ms → **520ms**) dan gerbangnya menunggu
`animation.finished` sebelum mengaudit — WCAG bicara tentang keadaan
istirahat.

e2e **368 lulus, 0 gagal**, 18 dilewati · unit 432 · `check` exit 0 ·
palette **15/15 dua kali tanpa flake** · `route-budget` 9/9, nol plafon naik ·
320/360/390px nol overflow · reduced motion nol animasi, nol baris redup.

---

## Tahap 30 — Menutup yang ditunda, dan menyebut yang bukan penundaan ✅

> Spec: [`docs/stages/TAHAP-30.md`](./stages/TAHAP-30.md)

Tahap 28 dan 29 masing-masing berakhir dengan daftar "yang tidak dikerjakan".
Pemilik proyek menolak daftar itu: **kalau aman dan sesuai rencana, kerjakan.**
Aturannya benar, dan dua dari tiga item saya memang tidak punya alasan yang
bertahan.

**Pencocokan kata, dibuktikan merah terhadap indeks sungguhan.** `matchScore`
mencocokkan satu substring, jadi: `balik arus` → **nol**, `tanjung 2025` →
**nol**, `scope deliverable` → **nol**. Yang terakhir paling tajam — itu
kata-kata judulnya sendiri, dalam urutannya sendiri, tanpa kata sambung yang
tidak akan diketik siapa pun. Dan klien dan tahun ada di satu baris rel dipisah
`·`, jadi mengetik keduanya tidak menemukan apa pun. Sekarang kuerinya dibaca
sebagai kata dan **setiap kata harus ada** (AND, bukan OR — menambah kata
selalu mempersempit, dan OR yang melebarkan adalah perilaku yang membuat
pencarian terasa rusak). Keempatnya sekarang ketemu.

**Story Storybook, didapat dengan mengubah komponennya bukan memalsu `fetch`.**
`CommandPalette` menerima `entries` opsional; diberikan → dipakai, tidak →
mengambil sendiri. Story-nya jadi merender palette yang sebenarnya. Dua story
lulus sapuan axe, jadi palette sekarang **diaudit terisolasi dari halaman**.

**Dua kolom: pertentangan, bukan penundaan — dan alasan lama saya keliru.**
Barisnya tiga pita terukur 210 / 436 / 662px; dipecah dua kolom jadi 115 / 230
/ **345px**, dan deskripsi 16px dalam 345px ≈ 24 karakter per baris. Jadi dua
kolom bukan tambahan melainkan **penggantian**: lebih banyak hasil terlihat
dengan membuang kolom deskripsi — pertukaran yang pemilik proyek putuskan.
`Autocomplete.Row` menangani panah kiri/kanan dengan benar, jadi aksesibilitas
**bukan** penghalangnya; itu yang saya katakan sebelumnya dan itu salah.

**Satu kesalahan saya sendiri, ditangkap gerbang.** Fixture dan story pertama
memakai **"Museum MACAN"** sebagai klien — nama yang saya karang; klien
sebenarnya "Rumah Tanjung". Ketahuan karena gerbang e2e berjalan terhadap situs
sungguhan: fixture-nya lulus, situsnya tidak. Proyek ini melarang mengarang
nama klien, dan story Storybook adalah katalog yang bisa dijelajahi.

unit **438** (dari 432) · e2e **372 lulus, 0 gagal**, 18 dilewati, nol flake ·
palette 16/16 · `storybook-a11y` 94 lulus · anggaran rute tidak disentuh.

---

## Tahap 31 — Galeri yang bisa dipegang ✅

> Spec: [`docs/stages/TAHAP-31.md`](./stages/TAHAP-31.md)

Fase 5. Karya pesanan sekarang bisa dibuka layar penuh, dijelajahi dengan
panah, diperbesar satu langkah, lalu **digeser** untuk memeriksa detailnya —
dan menggeser hanya hidup **setelah** diperbesar, karena menyeret gambar yang
sudah pas di layar tidak berguna. Itu yang membuatnya informasi, bukan hiasan.

Dialognya **tidak** di dalam galeri: paragraf "No lightbox, deliberately" di
`vault/blocks/project-gallery` sudah menunjuk ke mana ia harus pergi kalau
suatu saat dibangun — `components/ui/`, di samping dialog Base UI lain — dan
di sanalah ia dibangun. Paragrafnya ditulis ulang, bukan dibiarkan berbohong.

**Anggaran:** 878 → **879 KB** terhadap plafon 900. Dialog tetap di luar graf
eager.

**`Draggable` diukur, dan dugaan saya meleset.** Spec menduga ia akan
mengulang cacat Tahap 28 (modul yang dipakai chunk eager _dan_ async
menggandakan grup chunk-nya). Build percobaan yang benar-benar mengimpornya:
**879 KB — nol penggandaan**, karena GSAP di rute ini sendiri tiba lewat batas
`dynamic()` dan **tidak pernah ada di chunk eager** untuk digandakan dari.
Aturan Tahap 28 ternyata tentang keanggotaan grup chunk, bukan waktu
kedatangan. Jadi argumen beratnya gugur; yang memutuskan perilaku — inersia
`Draggable` butuh `InertiaPlugin` berbayar, jadi tanpa itu keduanya sama dan
satu tidak punya plugin untuk didaftarkan.

**Empat cacat, semuanya ditemukan dengan menjalankannya:** panah tidak
melakukan apa-apa (Base UI menghentikan perambatannya — pendengar fase capture
melihatnya, fase bubble tidak sama sekali); menggeser **menutup dialognya**
(`display: contents` tidak menghasilkan kotak, dan Base UI menilai tekanan
luar dari geometri popup); gambarnya **terpotong** (baris grid implisit diukur
oleh isinya, jadi `block-size: 100%` melingkar dan dibuang — 786px di panggung
698px, sekarang 1240×698 rasio utuh); dan **jumlah gambarnya salah di spec
saya sendiri** — "tiga" dihitung dari `data-span=`, atribut yang kartu proyek
berikutnya juga pakai. Sebenarnya **dua**, dan angkanya penting karena ia yang
memutuskan kontrol mana yang pantas ada.

**Satu temuan isi:** kedua gambar galeri tiap proyek membawa `alt` identik.
Itu isi CMS, bukan kode; nama dialognya tetap membedakan karena diawali posisi.

unit 438 · e2e **382 lulus, 0 gagal**, 18 dilewati, nol flake · lightbox 10/10
termasuk axe bersih pada dialog **terbuka** dua bahasa · `route-budget` lulus,
nol plafon naik · tanpa JS galerinya tetap terbaca.

---

## Tahap 32 — WebGL di rute kedua, dan satu pass yang tidak lulus ujiannya ✅

> Spec: [`docs/stages/TAHAP-32.md`](./stages/TAHAP-32.md)

Fase 6. Separuh dikirim, separuh **ditolak dengan bukti**.

**Katalog membawa lapisan materialnya.** Beranda menampilkan pilihan karya
dengan plat yang menjawab pointer; katalog menampilkan seluruhnya lewat
komponen yang sama, dan platnya diam. Pengunjung yang menekan plat di beranda
lalu membuka katalog menemukan objek yang sama berhenti merespons.

**Harganya: 880 → 1909 KB**, plafon 900 → **2100**, izin `three` + `gsap`.
Kenaikan yang diputuskan, diukur, dan ditulis alasannya **di dalam file
anggarannya** — tempat file itu sendiri memintanya ("when a stage wants it, it
adds `three` here and says why"). Platnya **benar-benar tergambar**: 2 → 4 → 6
hidup sambil digulir, empat plat hidup di `opacity: 0` dan dua yang belum
hidup masih menampilkan `<img>`-nya. Ponsel dan reduced motion tetap mengunduh
**nol** mesin 3D.

Efek samping menyenangkan: dua uji yang selama ini dilewati sekarang berjalan
— "footer di bawah kanvas masih terbaca" hanya jalan di rute yang punya
kanvas, dan `/en/work` sekarang punya. Dilewati 18 → 16, keduanya lulus.

**Postprocessing dibangun, difoto, dan tidak dikirim.** Modulnya apa adanya
merender lalu menyalin dengan nol perubahan visual, jadi ia diberi efek —
grain amplitudo rendah, kosakata situs ini sendiri — lalu halaman yang sama
difoto dengan dan tanpanya. **Ia mengangkat seluruh kanvas**: beda absolut
rata-rata **55,8/255**, 93,5% kanal bergerak. Rust dalam jadi aprikot susu,
hijau hutan jadi mint, violet jadi lavender — buffer `HalfFloatType` komposer
mengeluarkan render dari penanganan ruang warna renderer. Di situs yang
subjeknya karya seni, itu bukan pass halus melainkan color grade yang tidak
diminta.

Itu bisa diperbaiki dengan satu output pass. **Tidak dikejar**, karena yang
tersisa sesudahnya adalah grain ketiga: situs ini sudah memakainya di shader
hero (di mana ia mendither banding — pekerjaan nyata) dan dikomposit ke dalam
plat karyanya sendiri. Lapisan ketiga duduk di atas karyanya, seharga +19 KB
dan satu pass layar-penuh tiap frame. Alasannya ditulis **di dalam modulnya**
supaya tahap berikutnya mulai dari pengukuran, bukan dari satu baris scaffold.

unit 438 · e2e **384 lulus, 0 gagal**, 16 dilewati, nol flake · `route-budget`
lulus di plafon barunya · `webgl-budget` reduced motion nol mesin, nol kanvas.

**Angka 1909 KB itu keputusan Anda untuk dibalik kalau terlalu mahal** — ia
ada di gerbangnya dan di sini, dan membalikkannya satu baris.

---

## Tahap 43 — Lapisan eksploratif: `DESIGN_VARIANCE` 3 → 7 ✅

> Spec: [`docs/stages/TAHAP-43.md`](./stages/TAHAP-43.md)

Dial `DESIGN_VARIANCE` disetel ke 7 di Tahap 34 dan katalognya berjalan di 3
selama sembilan tahap. Itu bisa diukur meski dialnya tidak: enam karya duduk
di **dua** nilai `x` dan **tiga** nilai `y`, jarak antar baris 935px tiga kali
berturut-turut, tiga dari tiga baris berbagi `top` yang identik, dan setiap
kartu 691 × 919 sampai pikselnya. Sesudahnya: **enam** nilai `top` berbeda,
nol kartu berbagi baris, dan selisih drift antar kolom di mana sebelumnya
kedua kolom melaporkan `1.863183333333333` lawan `1.863183333333333` —
identik sampai tiga belas desimal.

Empat butir dibangun, **satu ditolak dengan pengukurannya**.

**`type-pressure` ditolak, dan rencana ini salah menebak paruh mana yang
gagal.** Ia menyebut versi `h1` berisiko dan versi wordmark **aman** karena
"kotaknya tetap". Diukur pada header sebenarnya: pada rentang 640–760 yang
diminta, wordmark tumbuh 42,61px → 57,61px dan `<nav>` header bergeser
**10 piksel**; pada `<h1>` beranda, bobot 760 menambah satu baris dan
menumbuhkan judul 204px → **306px**. Sumbu bobot bukan `transform` maupun
`opacity`, dan `MOTION-SPEC.md` §0.2 — ditulis tahap lalu — melarangnya.
Dilonggarkan satu tahap setelah ditulis adalah cara gerbang berhenti berarti,
jadi butirnya dibuang, bukan dikecualikan.

**Tema ternyata bukan keputusan server, dan itu memaksa perbaikan
arsitektur.** Rencana memperlakukan "pindahkan `/journal` ke terang" sebagai
satu prop. `data-theme` ditulis oleh **efek klien**, dan root layout mengirim
`dark` hardcoded: lima dari lima rute, diukur dengan `curl`. Rute terang akan
berkedip, dan tanpa JavaScript tidak pernah berubah sama sekali — melanggar
"terbaca tanpa JavaScript" dalam bentuk paling terlihat. Dua jalan ditolak
dengan alasan (membaca `headers()` mendinamiskan seluruh situs; root layout
kedua memaksa muat ulang penuh dan **membunuh morph Tahap 41**), dan tema
mendapat elemennya sendiri di dalam halaman.

**Tiga regresi lahir dari perbaikan itu, semuanya nyata, semuanya diukur.**
Token turunan (`--surface`, `--text-muted`, wash) dideklarasikan di `:root`,
jadi begitu `<html>` berhenti bertema semuanya terhitung terhadap palet
terang — pada 404 axe mengukur tujuh simpul di **1.06–1.1:1**, kertas di atas
kertas. Tiga hero wash hilang karena `z-index: -1` yang mengandalkan latar
`body` dipropagasikan ke kanvas; `visual-substance` melaporkan halaman
ber-aksen dan kontrolnya **identik sampai lima belas desimal**. Dan plat
katalog memperlihatkan bingkainya sendiri karena overshoot lapisan
di-_hardcode_ terhadap distance 6 sementara kolom kanan naik ke 9.

**Satu perbaikan saya sendiri membuatnya lebih buruk, dan itu ditulis.**
Menghapus latar `body` terbaca benar dan lulus pengukuran langsung — keenam
rute bersih — lalu empat gerbang merah. Selisihnya `settleReveals()`, yang
menggulir lalu kembali ke atas: axe jatuh ke warna dokumen untuk elemen di
luar layar, dan tanpa latar `body` wordmark footer terukur **1.08:1 terhadap
`#ffffff`**. Ground tetap yang memutuskan tema; `body` melukis kertas di
bawahnya lagi.

**Recede jurnal disapu ulang di tema yang benar.** `--row-recede: 0.7`
ditetapkan Tahap 27 oleh sapuan axe di tema gelap. Di terang ia memberi
3,80:1. Disapu ulang: 0,75 → 4,27:1, **0,80 bersih**. Lantai terang 0,80,
nilainya satu langkah di atas — aturan yang sama, angka yang sapuan gelap
tidak mungkin tahu.

**Nol plafon anggaran dinaikkan.** `/en/practice/consulting` menyentuh tepat
900KB terhadap plafon 900, dibuktikan dua arah dengan gerbangnya sendiri.
Rencana Tahap ini mengizinkan menaikkan dengan alasan; `route-budget.e2e.ts`
sudah dua kali mencatat bahwa perbaikannya adalah berhenti mengirim
beratnya. Satu record ikon harus mengirim setiap entri ke apa pun yang
membaca satu entri, jadi halaman dengan breadcrumb mengunduh empat glyph
lightbox juga. Dipecah satu glyph per modul.

Ikonografi lahir: tujuh path Phosphor (**MIT, diverifikasi dengan membaca
`LICENSE` repo itu sendiri**, bukan badge) menggantikan `/`, `←`, `→`, `−`,
`+`, `✕`, `⌕`, dengan nol dependensi runtime. `docs/PROVENANCE.md` §6
dikoreksi di commit yang sama: ia berbunyi "No third-party source has been
copied" sampai tahap ini menyalin tujuh path.

**Dua perbaikan saya sendiri dibatalkan setelah diukur** — satu latar strip
yang tidak memperbaiki apa pun (9 dari 12 kali masih gagal), dan satu
komentar yang mengklaim hasil yang tidak pernah terjadi. Yang tersisa berdiri
di atas alasannya sendiri.

unit 458 · e2e **529 lulus, 0 gagal, 0 flaky**, 16 dilewati (11,5 menit) ·
+11 tepat: delapan asersi gerbang baru dan tiga story `Icon` · Storybook
dibangun ulang · nol plafon anggaran dinaikkan.

## Tahap 42 — Kategori ketiga dinamai, lalu dibelanjakan ✅

> Spec: [`docs/stages/TAHAP-42.md`](./stages/TAHAP-42.md)

`MOTION-SPEC.md` mendamaikan CSS dan GSAP dan berhenti di situ, sementara
**empat mekanisme tayang tanpa entri**: `--scroll-velocity` (dipublikasikan
tiap frame sejak Tahap 33), parallax plat, kursor kustom, dan Web Animations
API (baris palet, lalu `catalogue-sift`). Bukan pelanggaran yang lolos —
sebuah **kategori** yang dokumennya tidak punya nama untuknya, jadi tidak ada
satu pun yang bisa dicatat dengan benar. §0 sekarang menamai ketiganya:
micro/standard, berkoreografi (dihitung §9.5, maksimal dua, wajib bernama),
dan **respons berkelanjutan** — tidak dihitung, karena tidak punya awal dan
akhir.

Aturannya **lebih ketat** justru karena selalu berjalan: hanya
`transform`/`opacity`; tidak pernah pada prosa; tidak pernah pada elemen yang
difoto `<ViewTransition>`; **mati total** di bawah `prefers-reduced-motion`,
bukan diperlambat; sinyalnya wajib yang sudah ada — nol loop RAF kedua.
Sekaligus §7 berhenti menjanjikan cross-fade yang tidak pernah ada:
reduced motion **menghapus** overlay, dan itu yang dikirim sejak Tahap 16.

**Tiga koreksi terhadap rencana.**

1. **`velocity-marquee` tidak ditulis** — `components/ui/marquee` sudah
   membaca `--scroll-velocity`, sudah duduk di Tempus order 6, dan sudah nol
   konsumen sejak fork. Modul baru akan jadi mekanisme kedua untuk pekerjaan
   yang sama. Ia mendapat **rumah** (strip wordmark footer) dan satu hal yang
   benar-benar hilang: `prefers-reduced-motion`.
2. **`sticky-stack` ditolak, dan bukan karena biaya.** Kartu yang menumpuk
   memindahkan isi ke belakang isi lain, dan §0.2 baru saja melarang kategori
   ketiga menyentuh prosa. Alasannya ditulis di spec, bukan didiamkan sebagai
   "belum sempat".
3. **`counter` dipindahkan ke transisi status.** Rencana memintanya menghitung
   saat masuk viewport — angka yang menari saat pertama dilihat adalah
   dekorasi, dan uji `taste-skill` menolaknya. Ia sekarang menghitung **antar
   keadaan filter**, di mana angkanya adalah umpan balik: `06 → 02`.
   Pluralisasi dihitung di server (`labels: readonly string[]`), karena sebuah
   **fungsi tidak bisa menyeberangi batas RSC** — typecheck lolos, build yang
   akan gagal.

**Regresi nyata yang ditangkap suite, dan akarnya bukan yang disangka.**
`journey.e2e.ts` merah: keadaan `covering` tidak pernah tergambar pada
navigasi Back. Probe RAF-poll diganti `MutationObserver` (masih merah — jadi
bukan instrumen), lalu perubahan sumber di-stash dan build diulang (**lulus** —
jadi memang perubahan ini). Akarnya kerapuhan yang Tahap 16a sudah catat:
`covering` dan `revealing` bisa masuk satu commit React. Diperbaiki dengan
lantai penjadwalan `MIN_COVER = 32` ms plus stempel `coveredAt`, memakai
`setTimeout` karena gerbang proyek ini sendiri menolak `requestAnimationFrame`
telanjang.

**Dua cacat ditangkap saat menulis, bukan sesudah:** `.wordmarkWord` sempat
membawa `font-size` sendiri — ukuran display **keempat** untuk satu strip,
ditolak gerbang tipe Tahap 37, diganti utilitas `h1`; dan penghitung marquee
melaporkan **5** strip di satu halaman karena `[class*="marquee"]` cocok
dengan nama kelas yang CSS Modules hasilkan untuk `.inner` — diperbaiki
dengan `data-marquee` plus asersi containment.

unit 458 · e2e **518 lulus, 0 gagal**, 16 dilewati (11,2 menit) · +3 tepat
sama dengan tiga asersi baru Tahap ini, jadi nol gerbang lama dilonggarkan ·
Storybook dibangun ulang.

---

## Tahap 41 — `journal-transport` ✅

> Spec: [`docs/stages/TAHAP-41.md`](./stages/TAHAP-41.md)

`/work` → `/work/<slug>` punya morph kelas atas sejak Tahap 11d. `/journal` →
`/journal/<slug>` **tidak punya apa-apa**: dibuktikan merah, nol
`document.startViewTransition` dan nol pasangan. Dua permukaan baca di situs
yang sama, satu diperlakukan sebagai peristiwa dan satu sebagai muat ulang.
Mesinnya sudah ada dan teruji; yang belum ada hanyalah pemakaiannya.

Judul yang pembaca pilih sekarang membawa dirinya sendiri ke entri. Diukur:
pasangan `view-transition-group` terbentuk dengan kedua paruh; baris lain
mundur `1 · 0,7 · 0,7` → **`1 · 0,35 · 0,35`** saat satu ditekan, dan
`1 · 1 · 1` di bawah reduced motion.

**Tiga koreksi terhadap rencana, semuanya dengan bukti di repo.**

1. **Durasi tetap 400ms, bukan 1200ms.** Rencana meminta pita berkoreografi
   supaya `--duration-choreographed` mendapat konsumen pertamanya.
   `global.css` sudah menyetel **setiap** morph di situs ke `var(--duration)`
   dengan alasan tertulis, dan membuat jurnal tiga kali lebih lambat menukar
   konsistensi — satu-satunya standar yang `CLAUDE.md` sebut penting — dengan
   sebuah centang. Momennya tetap berkoreografi lewat **rentang**-nya: morph,
   lalu prosa mengendap di belakangnya. Tokennya tetap nol konsumen, dan itu
   dicatat sebagai keputusan.
2. **Judul entri berhenti jadi `TextReveal`.** SplitText mengganti node teks
   yang morph potret — panggilan yang Tahap 23 §3.2 sudah buat untuk halaman
   praktik. Morph **adalah** kedatangannya. Diukur sesudahnya: `h1Split: 0`.
3. **COMMIT ditulis di CSS**, bukan di state klien:
   `.list:has(.row:active) .row:not(:has(:active))`. §9 memang memintanya
   begitu, dan `:active` menyala untuk Enter — jadi keyboard mendapat COMMIT
   yang sama.

**§9.4 aturan 5 ("satu morph per navigasi") akhirnya diasersikan** — mengikat
sejak Tahap 12 dan tidak pernah diperiksa — pada **kedua** pasangan yang situs
ini punya, bukan hanya yang baru.

**Satu gerbang merah yang benar:** `every page enters the same way` menuntut
tiap `<h1>` di-split. Gerbang itu sudah punya pengecualian identik untuk rute
praktik, tertulis lengkap dengan alasannya; entri jurnal bergabung lewat
mekanisme yang sama. Bukan pelonggaran — pengecualiannya ditukar dengan asersi
morph yang baru, bukan dengan ketiadaan.

**Dan satu token yang tidak ada, lagi:** SETTLE minta `--stagger-items`, yang
hanya hidup di TypeScript sejak Tahap 12b. Kelas cacat yang sama dengan
`--space-2xs` di Tahap 40 — tapi di sini pasangannya memang seharusnya ada,
jadi ia dibuat dan `tokens.test.ts` diperluas untuk menjaganya.

unit 458 · e2e **515 lulus, 0 gagal**, 16 dilewati · empat asersi baru,
semuanya merah lebih dulu · Storybook dibangun ulang.

---

## Tahap 40 — `project-spine`, dan gerbang epik yang melihat tujuh halaman ✅

> Spec: [`docs/stages/TAHAP-40.md`](./stages/TAHAP-40.md)

Anggaran momen epik §9.5 mengatur **tujuh** jenis halaman dan samplernya hanya
pernah mengunjungi **satu**. Diperluas ke ketujuhnya, dan rencana memperkirakan
satu halaman akan tertangkap — yang tertangkap **lima**, semuanya elemen yang
sama: mask baris `<h1>` masing-masing halaman, bergerak 662–766ms.

`vault/motion/text-reveal` memakai `duration.slow` — 800ms, pita
berkoreografi — tanpa syarat, jadi **setiap** halaman membelanjakan gerak
pita-berkoreografi untuk judulnya muncul. Perbaikannya bukan menamai lima
"momen epik" baru: itu akan menaruh `/work` dan `/studio` di tiga, melewati
plafon, dan membatalkan keputusan "nol, sengaja" milik `/journal/<slug>`.
Gerak yang identik di tujuh halaman adalah **default**, bukan momen. Jadi
`TextReveal` mendapat prop `pace`: `arrival` (400ms) untuk tiap masthead,
`epic` (800ms) hanya untuk dua tempat yang §9.5 sudah namai. `ProjectHero`
akhirnya mendapat `data-epic="project-arrival"` — namanya ada sejak Tahap 11d,
atributnya tidak pernah. **Tujuh dari tujuh lulus.**

**`project-spine`** menutup cacat B5: halaman terpanjang kedua di situs, 4,7
layar, nol subjudul. Indeks sticky yang menandai wilayah yang sedang dibaca —
diukur: Overview → Images → Next, rail `scaleY` 0,25 → 0,75 → 1,00, tepat satu
baris aktif di tiap posisi. Reduced motion: semua baris `opacity: 1`, nol
transform, indeks terbaca penuh.

Premisnya dikoreksi lagi: rencana menamai baris _Brief · Approach · Outcome_,
dan bagian itu **tidak ada** — sebuah proyek punya satu blok Portable Text.
Menulisnya berarti mengarang konten. Spine mengindeks wilayah yang benar-benar
dirender, dan baris hanya muncul untuk wilayah yang ada.

**Empat cacat ditangkap gerbang, dan satu di antaranya komentar saya sendiri.**
axe menolak spine versi pertama dua kali: `color-contrast` karena recede 0,45
— dan komentar yang saya tulis tepat di atasnya mengklaim 0,45 adalah nilai
terukur `step-sequence`, padahal nilainya **0,7**; dan `target-size` karena
tautan seukuran caption. `visual-substance` menolak spine di kolom kiri karena
dua kolom sebelum konten mendorong `<h1>` keluar dari gutter yang setiap
halaman lain pakai — spine pindah ke kanan alih-alih gerbangnya dilonggarkan.
`continuous-motion` melaporkan label nav sebagai prosa yang di-parallax;
selektornya dipersempit supaya mengukur apa yang komentarnya sudah klaim.

Ditambah satu temuan sampingan: `vault/motion/flip` (Tahap 39) membaca
`--space-2xs`, **token yang tidak pernah ada** — proyek ini tidak punya skala
spasi runtime. Menamai token yang tidak ada terbaca sebagai ter-tokenisasi dan
berperilaku sebagai hardcoded; diganti dengan angka yang ditulis apa adanya.

unit 458 · e2e **512 lulus, 0 gagal**, 16 dilewati · Storybook dibangun ulang.

---

## Tahap 39 — Filter yang benar-benar memfilter, lalu `catalogue-sift` ✅

> Spec: [`docs/stages/TAHAP-39.md`](./stages/TAHAP-39.md)

Chip praktik di `/work` tampak seperti filter, berperilaku seperti navigasi,
dan **tidak pernah menunjukkan keadaan terpilih** — `page.tsx` menghardcode
`practice={null}`, jadi "All" permanen aktif dan cabang katalog terfilter
adalah kode mati sejak Tahap 15a. Dibuktikan merah: menyaring ke consulting
mengubah jumlah kartu **6 → 6**.

Premis rencananya sendiri ternyata salah, dan repo sudah menolaknya **dua
kali**: Tahap 10 mencatat dua galat build, dan `response-headers.e2e.ts`
memasang gerbang eksplisit bahwa "query string tidak boleh kembali". Diukur
ulang dengan `export const instant = false` — yang belum ada saat Tahap 10 —
dan keberatan pertama **tidak reproduce**: `?practice=consulting` merender 612
karakter, `<h1>Consulting</h1>`, dua proyek, dengan JavaScript **mati**.
Keberatan kedua reproduce penuh, jadi harganya ditulis di depan dan
diputuskan: dua URL berhenti bisa di-cache CDN. Gerbangnya **dipindahkan
dengan alasan**, bukan dibungkam.

**`catalogue-sift`** membelanjakan tiga token yang punya nol konsumen:
`--duration-slow` (800ms), `--stagger-cards` (70ms) dan `--ease-in-out-quart`
— satu-satunya tempat `in-out` sah menurut `CLAUDE.md` #2, karena kartunya
berangkat _dan_ mendarat. FLIP tangan dengan WAAPI, nol loop RAF kedua, nol
dependensi. Stagger menurut **jarak**, terbalik, supaya kisinya mendarat
bersamaan. Kartu yang keluar dipindah ke lapisan `aria-hidden` dan dipudarkan
di sana — 4 ghost mid-flight, 0 sesudah mengendap.

Dua pengukuran mengubah rancangannya: menekan chip menjalankan **nol**
`document.startViewTransition` (jadi tidak ada morph native yang bersaing),
dan navigasinya me-reset gulir **900 → 0** (jadi posisi diukur di koordinat
dokumen, dan chip membawa `scroll={false}`).

**Dua cacat instrumen ditangkap sebelum mereka menangkap situs:** selektor
filter cocok dengan navigasi header yang baru dipasang Tahap 38 dan melaporkan
chip terpilih sebagai "Work"; dan selektor FLIP membaca animasi kartu-keluar
sebagai FLIP yang gagal. Keduanya ditulis di §7.3.

unit 458 · e2e **499 lulus, 0 gagal**, 17 dilewati · tujuh asersi baru,
semuanya merah lebih dulu · Storybook dibangun ulang.

---

## Tahap 38 — Navigasi: header, breadcrumb, sirkuit ✅

> Spec: [`docs/stages/TAHAP-38.md`](./stages/TAHAP-38.md)

Situs ini kumpulan jalan buntu. Diukur: sembilan dari sebelas jenis halaman
mengirim header berisi wordmark, pencarian dan pengalih bahasa — **nol tautan
rute** — sementara halaman proyek, halaman studio dan entri jurnal
masing-masing menawarkan **satu** jalan keluar dari isinya sendiri. Tiga
builder JSON-LD (`breadcrumbSchema`, `collectionPageSchema`, `articleSchema`)
sudah ditulis, di-type, diekspor, dan tidak pernah dipanggil. Enam URL entri
jurnal absen dari `sitemap.xml`, `/llms.txt` dan `/ai` sekaligus.

Sesudahnya: proyek 1 → 4, studio 1 → 4, entri 1 → 4; breadcrumb dan
`ItemList` di lima rute; enam URL jurnal di ketiga permukaan mesin dengan
judul yang benar per bahasa.

**Cacat yang tidak dicari, dan yang paling mahal.** Menambahkan `/studio` ke
header berarti menambahkannya ke setiap halaman — dan tautan itu menyajikan
**Sanity Studio**, bukan halaman studio. `curl` pada build produksi: `/studio`
→ 200, `<title>Sanity Studio</title>`. Penyebabnya bukan salah ketik:
`lib/i18n/paths.ts` mendaftarkan `/studio` sebagai rute sengaja bebas-locale
karena itu base path CMS, jadi `components/ui/link` **dengan benar** menolak
memberinya prefiks. Dua hal berbeda memakai satu alamat. `TAHAP-15.md` §1.3
sudah mencatat tabrakan itu; Tahap 24 membangun halamannya di sana, Tahap 22
menautkannya, dan cacatnya tayang **empat belas Tahap** — termasuk lolos dari
gerbang Tahap ini sendiri, yang mencocokkan `endsWith('/studio')` dan karena
itu **lulus justru saat tautannya salah**. CMS pindah ke `/cms`; gerbang
diganti dengan yang menuntut setiap tautan chrome membawa prefiks locale.

**Yang gagal dan dibatalkan.** 404 merender **28 karakter** tanpa JavaScript
("Skip to main content / Loading"), nol `<h1>`, nol tautan. Dua perbaikan
dicoba dan diukur — menghapus `loading.tsx` dengan `instant = false` (28 → **0**,
lebih buruk) dan melepas `draftMode()` (tetap 0) — dan **keduanya dibatalkan**
karena penyebabnya belum ditemukan. Butir 404 dikirim setengah dan dicatat
sebagai terbuka, bukan diam-diam dianggap selesai (`TAHAP-38.md` §7.4).
`e2e/no-javascript.e2e.ts` memang tidak pernah mencakup 404.

unit 458 · e2e **492 lulus, 0 gagal**, 16 dilewati · dua gerbang baru, keduanya
merah lebih dulu terhadap situs sebelum tahap ini · Storybook dibangun ulang
dengan story `Breadcrumbs`.

---

## Tahap 37 — Menutup lubang gerbang ✅

> Spec: [`docs/stages/TAHAP-37.md`](./stages/TAHAP-37.md)

Tahap yang membuat Tahap 34–36 **tinggal**. Repo ini punya lapisan penegakan
yang lebih baik dari kebanyakan studio yang pernah menang — dan lapisan itu
absen persis di tempat sistem desainnya paling lemah. Spasi, ukuran tipe,
bobot, radius, elevasi dan `1fr` **tidak punya gerbang sama sekali**.

Sepuluh gerbang ditulis, sepuluh merah: 159 baris spasi di luar kisi, 52
`font-size` melewati skala, 44 radius tulisan tangan, 14 stylesheet yang
menganimasikan tanpa pernah berhenti untuk `prefers-reduced-motion` (dua di
antaranya tayang), 14 warna yang gate-nya tidak bisa lihat, dan enam knob
reveal yang membawa literal.

**Satu keputusan diambil terbuka: tangganya diganti, bukan ditegakkan.**
Dokumen menyebut 8/16/24/32/48/64/96/128 dan 51% kemunculan di luarnya. Sebelum
menegakkan, histogramnya dibaca: **12 dikirim 39 kali, 20 dikirim 30 kali** —
penulis yang mengikuti sistem 36 Tahap dan berulang kali butuh langkah antara
8 dan 16. Memaksa 69 di antaranya pindah berarti menggeser piksel nyata demi
tangga yang ditulis sebelum situsnya ada. Aturannya jadi **kelipatan 4**, yang
tetap menolak masalah dua-puluh-sembilan-nilai-sembarang, dan
`DESIGN-SYSTEM.md` §3 dikoreksi dengan histogramnya sebagai alasan. **Dan yang
di bawah satu langkah bukan spasi**: 1, 2, 3px adalah hairline dan inset optis,
dan membulatkan inset 2px ke 4px menggandakannya.

Empat token lahir, semuanya diturunkan: **radius** (19 deklarasi → lima token,
piksel tetap karena sudut adalah perlakuan tepi bukan ukuran ruang),
**elevasi** (enam bayangan tulisan tangan, semuanya di pembungkus Base UI dan
nol di `vault/` — bentuk sistem yang tidak pernah memutuskan ia punya
elevasi), **`h3`** (skala melompat dari 20 ke 48; empat `clamp()` ad-hoc adalah
lubang itu diisi tangan), dan **tiga warna status** — chroma 0,19–0,22, warna
paling jenuh di seluruh situs, di sistem yang menyatakan tidak punya aksen
kromatik. Plus `--stagger-hero`, untuk literal 120ms yang tak terlihat siapa
pun.

**Instrumennya salah empat kali**, semuanya dalam arah yang mengarang
pelanggaran atau menyembunyikan pengecualian: aturan `font-size` menandai
`inherit` dan `1.1em`; pengecualian hanya membaca satu baris di atas, jadi
**tiap pengecualian multi-baris di repo terbaca sebagai tidak-dikecualikan**;
penjelajah komentar berhenti di tengah blok; dan regex pengecualian
tingkat-berkas tidak bisa melewati `*` pembuka komentar. Ditambah satu yang
benar: blok reduced-motion yang saya sisipkan memakai `0.01ms` dan
`motion-rules` #8 menolaknya, tepat sebagaimana mestinya.

unit **457** (49 berkas) · e2e **464 lulus, nol gagal di jalan pertama**,
untuk Tahap yang menyentuh hampir setiap stylesheet · **yang disebut belum
selesai**: tujuh stylesheet nol-konsumen membawa `scale-exempt-file:` yang
menamai Tahap 45c sebagai penghapusnya, dan enam pengecualian per-baris
masing-masing dengan alasannya.

---

## Tahap 36 — Skala yang punya langit-langit ✅

> Spec: [`docs/stages/TAHAP-36.md`](./stages/TAHAP-36.md)

Satu-satunya cacat dalam audit kurator yang bisa ditemukan juri dalam sepuluh
detik, dengan menyeret sudut jendela. Nol `clamp()` di seluruh token, nol
container `max-width`, setiap ukuran `vw` linear murni dijangkarkan pada dua
lebar desain dengan satu breakpoint.

**Diukur di browser, bukan dihitung di kertas.** Menyeberangi 800px: `h1`
turun 17,7%, `--gap` runtuh 3,8×, dan `caption` jatuh dari **23,4px ke 6,7px**
— satu piksel lebar jendela, dan caption menyusut jadi seperempatnya. Di
320px caption merender 9,4px; di 2560px `h1` mencapai 213px dan header 128px.
`DESIGN-SYSTEM.md` §2 sudah menulis aturannya sendiri ("koefisien viewport
kecil, 1–1,5vw; penskalaan `vw` agresif adalah petunjuk amatir yang andal");
koefisien sebenarnya 10,13vw.

**Tidak ada 377 perbaikan. Ada dua.** Setiap angka itu dipancarkan dua
generator dengan bentuk yang sama. `fluidCalc()` menggantinya dengan **satu
garis terjepit melalui kedua jangkar desain**, jadi tidak ada deklarasi kedua
untuk berselisih dengan yang pertama; dan `mobile-vw()`/`desktop-vw()`
dibatasi pita `[320/375, 1920/1440]`, yang mengikat 377 pemanggilan komponen
**tanpa satu pun disentuh**.

Sesudahnya, 799 dan 800 **identik di setiap kolom**. Caption hidup di
11,0–12,5 alih-alih berayun 6,7–23,4. Gutter 16px di mana pun, yang memang
selalu maksudnya — nilai yang 16px di 375 _dan_ 16px di 1440 tidak pernah
dimaksudkan jadi 34px di 799.

**Sifat yang membuat ini pembatasan dan bukan desain ulang: di 375 dan 1440
tidak ada yang bergerak sepiksel pun.** Itu asersi keempat gerbangnya, dan ia
hijau sebelum maupun sesudah — kontrol, bukan formalitas.

Gerbangnya lalu menemukan **satu elemen di seluruh situs** yang tetap melanggar
lantai keterbacaan: tombol hero, 10,2px di 320px, karena ia menulis sendiri
`font-size: mobile-vw(12px)` alih-alih memakai utilitas `cta` yang sudah persis
itu. Satu dari 54 deklarasi yang melewati skala tipe, dan satu-satunya yang
benar-benar jatuh di bawah lantai.

**Instrumennya salah dua kali:** pembulatan tiga desimal memindahkan jangkar
(`desktop-vw(32)` mendarat di 31,9968px di 1440), dan klaim "sekitar 1,2×" di
spec adalah tebakan — sisa langkahnya **1,5625×**, aritmetika `plafon/lantai`,
sekarang dipaku unit test. Ditambah satu kesalahan yang bukan instrumen: `cn`
dipakai tanpa diimpor, dilewatkan `tsc`, ditangkap build produksi.

unit 448 (5 baru untuk dua fungsi yang sebelumnya **nol cakupan**) · e2e
**463 lulus, nol gagal di jalan pertama** · nol gerbang lama ikut merah ·
**sisa yang disebut**: langkah 1,5625× di 377 pemanggilan komponen, dan 53
deklarasi `font-size` lain yang masih melewati skala — keduanya Tahap 37.

---

## Tahap 35 — Kejujuran ✅

> Spec: [`docs/stages/TAHAP-35.md`](./stages/TAHAP-35.md)

`CLAUDE.md` §Honesty menuntut satu hal di atas segalanya: kalau sesuatu
dilewati atau gagal, **katakan eksplisit**. Audit kurator menemukan situs ini
melanggar semangat itu bukan di kodenya, melainkan di **apa yang ia katakan
tentang dirinya sendiri**. Lima cacat, semuanya kecil, tidak satu pun terlihat
oleh gerbang mana pun.

**Gerbangnya merah di 8 dari 10 asersi.** Dua yang sudah hijau berguna: mereka
mempersempit cacatnya — alamat cadangan itu tidak pernah mencapai `/llms.txt`
maupun sitemap, jadi yang terkontaminasi persis `/ai` di kedua locale dan graf
Organization di tiap halaman.

**Label mengikuti bidang, bukan dokumen.** `isPlaceholder: settings === null`
adalah pertanyaan yang berbeda dari yang dijawab resolvernya: dengan dokumen
fixture yang setengah terisi, flag-nya `false` sementara paragraf placeholder
tetap tayang. Salinan sementara terbit tanpa label. Diganti satu boolean per
bidang, dengan helper yang memutuskan nilai **dan** asalnya di satu tempat.
Satu asersi unit yang sudah ada ternyata cacat itu ditulis sebagai tes:
`expect(resolved.isPlaceholder).toBe(false)` pada dokumen yang subline, email,
dan seluruh statement-nya masih fallback.

**Diam di permukaan mesin, label di permukaan manusia.** `studio@arth.example`
adalah TLD cadangan RFC 2606 — placeholder bagi orang, fakta bagi crawler.
`SITE.email` dikosongkan sehingga bidangnya **dihilangkan** dari JSON-LD,
`/ai`, dan `/llms.txt`; beranda tetap menampilkannya, kini dengan catatan yang
hilang sendiri begitu CMS terisi. Tiga salinan alamat itu jadi satu.

**`/studio` berhenti mengasersikan yang tidak diketahui siapa pun.** `Founded
2021`, `Jakarta, working remotely`, `Four, plus specialists` adalah scaffolding
— halaman itu sendiri mengatakannya di komentarnya — dan tayang tanpa
kualifikasi. Audit membingkainya sebagai "yang dibaca mesin yang bisu";
penyelesaiannya **ke arah sebaliknya**: menyalin `2021` dan `Jakarta` ke
`schema.org` akan memperbanyak karangannya. Diamnya benar; yang kurang
labelnya.

Ditambah dua yang lebih kecil: `formatList` menyuntik konjungsi Inggris ke
`/id/ai` (`…Rekayasa AI dan data, **and** Pengerjaan pesanan`), dan panduan
agen menyuruh agen ke `/en/work/practice/consulting`, yang sekarang 308.

**Instrumennya salah sekali, dan merahnya menyesatkan.** Asersi konjungsi
memindai seluruh `/id/ai` dan tetap merah setelah perbaikannya mendarat —
benar merahnya, salah alasannya: halaman itu sengaja mencantumkan setiap rute
statis di **kedua** locale, jadi prosa Inggris di sana memang seharusnya ada.

**Dua temuan audit sengaja tidak ditindaklanjuti**, dan alasannya ditulis:
`/llms.txt` dan `manifest.webmanifest` "hanya bahasa Inggris" keduanya sudah
punya argumen tertulis yang benar. Mengubahnya berarti membatalkan keputusan
yang sudah dipikirkan demi mencentang temuan.

unit 443 · e2e **459 lulus**, 16 dilewati, nol flake · 10 asersi baru di
`promises.e2e.ts` · nol konten baru, nol dependensi, nol gerak · **satu hal
disebut belum selesai**: footer tidak bisa tahu apakah CMS punya alamat asli
(ia dirender di dalam `Wrapper` yang client), jadi placeholder-nya tetap tanpa
label sampai sebuah provider dipasang di layout.

---

## Tahap 34 — Selera diberi angka ✅

> Spec: [`docs/stages/TAHAP-34.md`](./stages/TAHAP-34.md)

Keluhan yang sama datang tiga kali: situs ini **kurang animatif, kurang
kreatif, kurang eksploratif**. Tiga Tahap terakhir menjawab dengan menambah
gerak, dan keluhannya tidak berubah. Diagnosisnya bukan kurangnya efek —
proyek ini punya angka untuk durasi, kontras, luminansi, dan berat rute, dan
**nol angka untuk komposisi**. "Lebih eksploratif" adalah perasaan, dan
perasaan tidak bisa digerbangi.

`taste-skill` ([Leonxlnx](https://github.com/Leonxlnx/taste-skill), **MIT,
diverifikasi dengan membaca `LICENSE`-nya sendiri** — `CLAUDE.md` #18)
divendor ke `.claude/skills/`, dan Arth disetel ke
**`DESIGN_VARIANCE 7 / MOTION_INTENSITY 9 / VISUAL_DENSITY 3`** dari
baseline skill `8 / 6 / 4`, tiap angka diargumenkan di `DESIGN-SYSTEM.md` §0.
Density adalah satu-satunya dial yang hampir tidak naik, dengan sengaja: 8–10
di skill itu berarti "cockpit", dan itu membunuh situs karya.

Tiga belas aturannya diadopsi, **lima ditolak dengan alasan** — termasuk contoh
geraknya sendiri, `transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1)`, yang
melanggar tiga aturan keras `CLAUDE.md` sekaligus.

**Gerbangnya merah dulu: 21 asersi.** Nav 98px (plafon 80), hero 5 elemen teks
(plafon 4), scroll cue di `/en` dan `/id`, eyebrow 4 dari 5 seksi di beranda,
dan em-dash di 8 dari 8 rute. Semuanya diperbaiki: **39 string** di sembilan
berkas, header ke 72px, dua eyebrow dijatuhkan setelah tiap pasang
eyebrow/judul dinilai satu per satu.

**Dua cacat yang tidak bisa dilihat dari halaman mana pun** ditemukan pemindai
sumber: `min-height: 100vh` pada `body` sejak fork, dan
`window.addEventListener('scroll')` di `lib/webgl/hooks/use-webgl-rect.ts`.
Keduanya lolos 33 Tahap karena tidak satu pun terlihat dari DOM.

**Dua skill bertabrakan soal scroll cue** — `ui-ux-pro-max` menambahkannya di
Tahap 12 dengan pengukuran, `taste-skill` melarangnya sebagai AI tell.
Keduanya benar: masalahnya nyata, **katanya** yang merupakan tell. Hero
melepas 12svh (`100svh` → `88svh`) dan tepi seksi berikutnya kini terlihat di
layar pertama; afordansinya bertahan tanpa satu kata pun.

Perubahan itu lalu **mematahkan sebuah gerbang lama secara jujur**: judul naik
96px dan menyeberang ke pita yang `visual-substance.e2e.ts` sampel, sehingga
`range`-nya melaporkan kontras huruf, bukan wash. Diperbaiki dengan mengukur
**selisih dua frame** (`contribution()`), yang mengisolasi kontribusi lapisan
itu sendiri: `/en` **15.9**, praktik **12.1**, dan diperiksa bisa gagal dengan
menaikkan ambangnya ke 99.

**Instrumennya sendiri salah enam kali**, tiga kali mengarang cacat dan tiga
kali menyembunyikannya. Semuanya ditulis di `TAHAP-34.md` §9.3.

`DESIGN-SYSTEM.md` mendapat **§7: sepuluh baris di mana dokumen ini dan
kodenya masih berbeda**, tiap baris menyebut Tahap yang menutupnya — utang
yang diakui, bukan yang dibayar. Empat angka palsu di dokumen itu diperbaiki:
`h1` 72→120 sebenarnya **38→120**, "18 pasang" sebenarnya **22 pengukuran**,
kontras terendah **9.08:1** bukan 14.22:1, APCA terendah **Lc 60.6** bukan
86.1.

unit 443 · e2e **440 lulus, 0 gagal**, 16 dilewati · 2 berkas gerbang baru
(9 asersi DOM, 5 asersi sumber) · nol dependensi baru · **satu hal tidak
selesai dan disebut**: dokumen fixture `studioSettings` di dataset live masih
membawa subline lama, jadi beranda terbangun masih merender satu em-dash
sampai seseorang menjalankan ulang seed.

---

## Tahap 33 — Situs yang tidak berhenti bergerak ✅

> Spec: [`docs/stages/TAHAP-33.md`](./stages/TAHAP-33.md)

Pemilik proyek menilai situs ini kurang animatif, kurang kreatif, kurang
eksploratif. **Itu diukur sebelum dijawab**: tiap rute digulir melalui delapan
posisi, dihitung berapa elemen membawa transform bukan-identitas.

**Katalog karya — halaman portofolio utama — punya SATU frame berbeda di
sepanjang 4,5 layar.** Nol dari 79 elemen bergerak. Indeks jurnal sama.
Diagnosisnya bisa dinamai: gerak situs ini hampir seluruhnya **gerak masuk** —
blok tiba lalu membeku. Penilaiannya benar, dan sekarang ada angkanya.

Sebagian juga sudah dijanjikan scaffold lalu ditunda: dari empat primitif
Fase 1, Tahap 23 menunda `sticky-stack` dan `counter`, dan menolak memasang
`parallax`. Masing-masing masuk akal saat itu; **efek gabungannya** adalah
tabel di atas.

**Satu masukan baru, banyak pembaca** — bukan lima efek yang berebut.
Kecepatan gulir yang Lenis sudah hitung dan tak seorang pun baca kini
diterbitkan sekali per frame, **di dalam callback Tempus yang Lenis sudah
jalankan** (nol loop RAF kedua), sebagai custom property dan sebagai angka
untuk GPU. Plat karya membacanya sebagai regangan ≤3%, dan `vault/motion/parallax`
memberi media kedalaman diferensial — **media saja, tidak pernah prosa**,
yang justru aturan yang Tahap 23 benar tentangnya.

| rute                  | sebelum     | sesudah       |
| --------------------- | ----------- | ------------- |
| `/en/work`            | **0/79, 1** | 6/85, **8**   |
| `/en/work/arus-balik` | 1/43, 4     | 3/45, **8**   |
| `/en`                 | 11/127, 7   | 14/131, **9** |

**Fase 6 diulang, dan dugaan Tahap 32 ternyata salah.** Tahap 32 menolak pass
postprocessing karena mengangkat warna (55,8/255) dan menduga sebabnya buffer
`HalfFloatType`. Dugaan itu **diuji**: buffer dihapus, efeknya diganti dengan
dispersi yang digerakkan kecepatan — yang saat diam menggeser sebesar nol,
jadi secara matematis identitas. Diukur saat benar-benar diam: **58,7/255.
Tidak membaik.**

Jadi pengangkatannya bukan efeknya dan bukan buffer-nya — ia **manajemen warna
komposer bertemu renderer yang proyek ini konfigurasikan dengan sengaja**
(`flat` + sRGB, keduanya hasil pengukuran Tahap 17 §4, yang memperbaiki bug di
mana tiap warna ber-shader mendarat sebagai `authored ^ 2.2`). Membuat komposer
setuju berarti membuka lagi keputusan itu, dan efek ambien tidak sepadan
dengan mempertaruhkan pipeline warna situs. Pass tetap tidak dikirim — tapi
sekarang alasannya menyebut konflik sebenarnya, dan percobaan ketiga tahu harus
mulai dari mana. Satu perbaikan tetap dikirim: flag `postprocessing` ada di
`WebGLCanvas` dan **tidak bisa dicapai** dari `Wrapper`; celah itu ditutup.

**Satu instrumen dikoreksi:** `/en/journal` tampak tidak berubah karena
geraknya opacity dan probe-nya hanya menghitung transform. Diverifikasi
terpisah: `1.00 0.70 0.70` → `0.70 1.00 0.70` → `0.70 0.70 1.00`.

unit 438 · e2e **389 lulus, 0 gagal**, 16 dilewati, nol flake · 5 gerbang baru
termasuk yang **merah** terhadap situs sebelum tahap ini · prosa nol transform ·
reduced motion nol plat tergeser · anggaran tidak dinaikkan.

---

Lalu `/code-review` sebelum commit, dan `/run` untuk benar-benar melihat
halamannya.

**Catatan yang sudah diketahui:** `bun run test:e2e` tanpa `CI=true` kadang
gagal di `e2e/not-found.e2e.ts` karena kompilasi on-demand dev server berlomba
dengan validasi prefetch `instant` milik Next. Lewat build produksi — jalur
yang dipakai CI — suite lulus 17/17 tanpa console error. Sudah tercatat di
`docs/RESOURCES.md` §6. **Gunakan `CI=true` sebagai sinyal yang menentukan.**

Kalau ada yang gagal atau dilewati, itu dilaporkan eksplisit beserta alasannya —
bukan diam-diam dikurangi cakupannya (`CLAUDE.md` #21).
