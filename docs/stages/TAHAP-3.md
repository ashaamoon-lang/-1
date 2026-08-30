# TAHAP 3 — Home single page

Stage-spec yang diwajibkan `docs/ROADMAP.md` §3.0. Tidak ada kode ditulis
sebelum dokumen ini ada.

**Prasyarat:** Tahap 1 v2 (palet dua netral, Syne + Geist Mono) dan Tahap 2
(`section-header`, `project-card`, `project-grid`, `language-switcher`, nav,
footer) sudah terkunci. Tahap ini merakit, bukan menemukan.

---

## 0. Masalah utamanya bukan layout. Datasetnya kosong.

Diukur terhadap dataset produksi, bukan diasumsikan:

```
$ curl -sS 'https://az53j4l1.apicdn.sanity.io/.../production?query={
    "projects": count(*[_type=="project"]),
    "featured": count(*[_type=="project" && featured==true]),
    "studio":   count(*[_type=="studioSettings"])}'

  {"projects":0,"featured":0,"studio":0}
```

Seluruh isi lima seksi di roadmap §1.2 datang dari Sanity, dan Sanity tidak
punya apa-apa. Tiga pilihan, dan pilihan yang diambil bukan yang paling
nyaman:

| Pilihan                                    | Konsekuensi                                                                                                            |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Rakit apa adanya, biarkan kosong           | `<h1>` hilang, `agent-readiness.e2e.ts` gagal (butuh tepat satu h1 dan ≥500 char). Halamannya juga tidak bisa dinilai. |
| Isi dataset produksi dengan karya karangan | **Ditolak.** Itu menulis konten palsu ke CMS asli studio, dan saya tidak punya izin untuk itu.                         |
| Salinan cadangan di kode, ditandai jelas   | **Dipilih.** Halaman lengkap dan bisa dinilai sekarang; CMS menang begitu ada isinya.                                  |

**Di mana cadangan itu tinggal.** Bukan di `messages/*.json`.
`schemas/studioSettings.ts` sudah menegaskan pemisahannya: `messages/` untuk
teks **antarmuka** (label nav, teks tombol), `studioSettings` untuk teks
**editorial** (statement, baris kontak) yang harus bisa diubah studio tanpa
deploy. Menaruh copy editorial di `messages/` adalah kesalahan yang memaksa
developer masuk ke setiap perubahan kata.

Jadi: `lib/content/home-fallback.ts`, per-locale, dengan doc comment yang
menyatakan terang-terangan bahwa isinya placeholder dan setiap field kalah
oleh `studioSettings` begitu dokumen itu ada.

---

## 1. Seksi mana yang benar-benar dirender

Roadmap §1.2 menyebut lima. Roadmap yang sama juga menulis: _"Seksi kosong
lebih merusak daripada tidak ada."_ Kedua kalimat itu harus dipatuhi
bersama-sama:

| #   | Seksi         | Dirender kapan               | Sumber isi                  |
| --- | ------------- | ---------------------------- | --------------------------- |
| 1   | Hero          | selalu                       | `studioSettings` → cadangan |
| 2   | Selected Work | **hanya jika ada ≥1 proyek** | `featuredProjectsQuery`     |
| 3   | Studio        | selalu                       | `studioSettings` → cadangan |
| 4   | Process       | **tidak dibangun**           | —                           |
| 5   | Contact       | selalu                       | `studioSettings` → cadangan |

**Process tidak dibangun**, dan itu mengikuti roadmap secara harfiah: _"Hanya
jika ada isi nyata."_ Tidak ada isi nyata, tidak ada skema untuknya, dan
membangunnya sekarang berarti menciptakan seksi yang isinya saya karang
sendiri. Dicatat di sini supaya jelas ini keputusan, bukan kelalaian.

**Konsekuensi yang harus ditangani:** dengan dataset kosong, seksi Work tidak
ada — jadi anchor `#work` di nav menunjuk ke ruang hampa. Nav karena itu
**diturunkan dari seksi yang benar-benar dirender**, bukan dari daftar
konstanta. Anchor yang tidak punya target tidak ditampilkan.

---

## 2. Koreografi scroll — dan apa yang sengaja tidak dipakai

Roadmap menyebut titik gagalnya sendiri: _"halaman panjang dengan banyak
`ScrollTrigger` adalah tempat lahirnya jank dan kebocoran."_

Maka tahap ini **tidak menambah satu pun ScrollTrigger.**

| Kebutuhan                     | Alat                                 | Alasan                                                         |
| ----------------------------- | ------------------------------------ | -------------------------------------------------------------- |
| Masuknya seksi saat di-scroll | `lib/hooks/use-reveal.ts` (CSS + IO) | Berjalan di compositor, selamat dari hidrasi lambat, 0 KB GSAP |
| Anchor nav aktif              | satu IntersectionObserver bersama    | Bukan satu ScrollTrigger per seksi                             |
| Reveal headline hero          | `TextReveal` (sudah ada)             | Satu-satunya tempat GSAP memang perlu — split + timeline       |

Aturan yang sudah tertulis di `vault/motion/README.md` — _"Reach for CSS
before GSAP"_ — dijalankan, bukan dikutip.

---

## 3. Anchor aktif mengikuti scroll

Hook baru `lib/hooks/use-active-section.ts`: satu `IntersectionObserver` atas
seluruh id seksi, melaporkan yang paling atas dan sedang terlihat.

- **Satu observer, bukan satu per seksi.** Observer per seksi berarti N
  callback yang saling balapan di tiap frame scroll.
- **`aria-current="location"`, bukan `"page"`.** Nilai `page` menandai halaman
  aktif dalam kumpulan tautan; `location` menandai posisi saat ini **di dalam**
  halaman, yang persis situasinya di sini. Nav Tahap 2 memakai `page` untuk
  tautan rute, dan itu tetap benar untuk tautan rute.
- Di bawah `prefers-reduced-motion` hook ini tetap jalan: menyorot posisi bukan
  animasi, dan mematikannya justru menghapus informasi.

---

## 4. Tanpa JS, dan reduced motion

Keduanya kriteria keluar, jadi keduanya dirancang, bukan diharapkan:

- **Tanpa JS.** Seluruh isi dirender di server. `useReveal` tidak pernah
  menyetel `data-reveal`, sehingga state tersembunyi di CSS (yang di-scope di
  bawah `[data-reveal]`) tidak pernah berlaku dan konten tampil penuh. Anchor
  bekerja secara native. Yang hilang hanya sorotan nav aktif — informasi
  tambahan, bukan isi.
- **Reduced motion.** Reveal selesai seketika, hero merender teks biasa,
  latar WebGL jatuh ke gradien statis. Tidak ada yang tertinggal di
  `opacity: 0`.

---

## 5. Nol pergeseran layout

Kriteria keluar menuntutnya. Dua sumber gambar di halaman ini:

- **Sampul karya** — `ProjectCard` sudah memesan kotaknya (`aspect-ratio` di
  `.media`, `SanityImage` menurunkan rasio dari aset).
- **Potret studio** — seksi baru, jadi kotaknya dipesan dengan cara yang sama.

Keduanya lewat `components/ui/sanity-image`, yang menolak render tanpa
informasi ukuran.

---

## 6. Satu bug yang sudah terlihat sebelum kode ditulis

`components/layout/footer` memakai `id="contact"` sejak Tahap 2. Seksi Contact
di halaman ini juga butuh `#contact`. Dua elemen dengan id sama adalah
pelanggaran `duplicate-id` — dan sekarang gate axe berjalan di **setiap**
impact (Tahap 2 §8.5), jadi ini akan gagal, bukan lolos diam-diam.

Id-nya pindah ke seksi Contact; footer melepasnya.

---

## 7. File

**Baru**

- `lib/content/home-fallback.ts` — salinan cadangan dua bahasa
- `lib/hooks/use-active-section.ts` — observer anchor aktif
- `vault/blocks/studio-note/` — statement + potret
- `vault/blocks/contact-block/` — email, sosial, satu CTA
- story untuk keduanya

**Diubah**

- `app/[locale]/page.tsx` — halaman sebenarnya, menggantikan copy fondasi
- `components/layout/header/` — anchor diturunkan dari seksi yang dirender
- `components/layout/footer/` — melepas `id="contact"`
- `messages/{en,id}.json` — label seksi
- `app/[locale]/page.module.css`

**Dipakai ulang, jangan tulis ulang:** `Hero`, `ProjectGrid`, `ProjectCard`,
`SectionHeader`, `SanityImage`, `RichText`, `useReveal`, pola `'use cache'` +
`sanityFetch` dari `app/[locale]/[...slug]/page.tsx`.

---

## 8. Kriteria keluar — status

| Kriteria                                            | Status                                                     |
| --------------------------------------------------- | ---------------------------------------------------------- |
| `bun run check`                                     | ✅ 349 test lulus                                          |
| `bun run build`, `/en` dan `/id` tetap `○ (Static)` | ✅ keduanya `○`, dengan revalidate 1y dari `'use cache'`   |
| `CI=true bun run test:e2e`                          | ✅ 94 lulus, axe di setiap impact + gate Storybook         |
| Tepat satu `<h1>`, urutan heading tidak melompat    | ✅ diukur dari HTML: `[1,2,2,3,2,2,2]`, nol lompatan       |
| Home terbaca penuh tanpa JS                         | ✅ 1014 char teks body di HTML awal (minimum 500)          |
| Nol pergeseran layout dari gambar                   | ✅ kedua sumber gambar lewat `SanityImage` + kotak dipesan |
| Reduced motion per seksi                            | ✅ story `ReducedMotion` untuk tiap blok baru              |
| Nol nilai desain hardcode                           | ✅ `page.module.css` lama (16px/24px/999px/clamp) diganti  |

### Yang benar-benar dirender hari ini

Dengan dataset kosong, HTML `/en` berisi:

```
heading levels : [1, 2, 2, 3, 2, 2, 2]     ← satu h1, nol lompatan
section ids    : studio, contact           ← work tidak ada, sesuai rancangan
nav anchors    : #studio, #contact         ← #work juga tidak ada
```

Itu bukan kegagalan — itu §1 bekerja. Seksi Work dan anchor-nya muncul
bersama-sama begitu ada satu proyek terbit.

## 9. Risiko — apa yang benar-benar terjadi

**Tidak terjadi.** `/en` dan `/id` tetap `○ (Static)` setelah dua `sanityFetch`
ditambahkan; keduanya sekarang membawa revalidate 1 tahun dari `'use cache'`,
yang memang perilaku yang diinginkan. Analisis awalnya tetap ditulis di bawah
karena alasannya masih berlaku untuk tahap berikutnya.

**Yang paling mungkin gagal: `'use cache'` + dataset kosong + prerender.**
`sanityFetch` memanggil `cacheTag()`, yang di bawah Cache Components hanya
legal di dalam fungsi `'use cache'`. Pola itu sudah terbukti di
`app/[locale]/[...slug]/page.tsx`, tapi halaman itu **dinamis** (`◐`),
sedangkan home harus tetap **statis** (`○`). Kalau menambahkan fetch membuat
`/en` dan `/id` berhenti statis, itu regresi dan dilaporkan — bukan diterima
diam-diam. Tahap 2 sudah memberi pelajaran persis tentang jenis kegagalan ini:
build tetap hijau sementara HTML yang dikirim kosong.

**Risiko kedua: cadangan yang menang atas CMS.** Logika "pakai CMS kalau ada,
kalau tidak pakai cadangan" gampang terbalik untuk field kosong-tapi-ada
(`""`). Diuji sebagai unit test, bukan diperiksa dengan mata.

---

## 10. Yang muncul saat eksekusi, di luar rencana

**Anchor nav ternyata milik halaman, bukan milik header.** Rencana §1 hanya
menyebut "nav diturunkan dari seksi yang dirender". Saat dikerjakan, jelas
bahwa daftar `#work/#studio/#contact` yang di-hardcode di header Tahap 2 salah
di **setiap** halaman lain juga — di 404 dan di halaman detail proyek nanti,
ketiganya menunjuk ke ruang hampa. Jadi `sections` menjadi prop `Wrapper`, dan
halaman tanpa seksi mendapat header berisi wordmark + pengalih bahasa saja.
Itu header yang benar untuk halaman itu, bukan versi yang berkurang.

**`SanityImage` tidak bisa menerima objek gambar CMS apa adanya.** Gambar yang
dilokalkan membawa `alt` sebagai `internationalizedArray*` (`[{_key, value}]`),
sementara `SanityImage` mengetikkan `alt` sebagai string biasa. Memperlebar
`SanityImage` adalah jawaban yang salah — alt yang benar per bahasa sudah
diselesaikan GROQ (`coverAlt`, `portraitAlt`) dan selalu dikirim eksplisit di
call site. Jadi ditambahkan `toImageSource()` di
`lib/integrations/sanity/utils/image.ts`, yang menyempitkan objek CMS ke tiga
field yang benar-benar dibaca.

**Anchor memakai `<a>` mentah, bukan `components/ui/link`.** Aturan lint
melarangnya, dan pengecualiannya di sini punya alasan yang bisa diuji: hash
sehalaman harus discroll oleh browser sendiri supaya tetap bekerja tanpa
JavaScript — kriteria keluar tahap ini. `Link` juga menetapkan
`scroll = false` secara default, yang benar untuk rute dan salah untuk anchor.
Kehalusan scroll-nya datang dari Lenis (`lenis={{ anchors: true }}`), bukan
dari router.

**Footer melepas `id="contact"`.** Diperkirakan di §6 sebelum kode ditulis, dan
memang terbukti: dua elemen dengan id sama akan gagal `duplicate-id`, yang
sekarang menggagalkan suite karena Tahap 2 menghapus filter severity axe.
