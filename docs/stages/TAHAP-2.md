# TAHAP 2 — Melengkapi primitive & blok

Stage-spec yang diwajibkan `docs/ROADMAP.md` §3.0. Tidak ada kode ditulis
sebelum dokumen ini ada.

**Prasyarat:** Tahap 1 versi 2 (`docs/stages/TAHAP-1.md`) sudah dikunci —
palet dua netral, Syne + Geist Mono, skala tipografi final. Setiap komponen di
tahap ini dibangun langsung di atas token itu, tanpa satu pun nilai desain
mentah.

---

## 0. Apa yang sudah ada, dan tidak boleh dibangun ulang

Tabel di `vault/README.md` adalah daftar otoritatifnya. Diperiksa ulang
sebelum menulis rencana ini:

| Sudah ada                                                                     | Di mana                    |
| ----------------------------------------------------------------------------- | -------------------------- |
| accordion, alert-dialog, checkbox, select, switch, tabs, toast, tooltip, form | `components/ui/` (Base UI) |
| marquee, fold, image, sanity-image, scrollbar, link                           | `components/ui/`           |
| header, footer, wrapper, lenis, theme                                         | `components/layout/`       |
| text-reveal, page-transition, cursor, magnetic, scene-shell                   | `vault/`                   |
| hero, project-grid                                                            | `vault/blocks/`            |
| reveal-on-scroll (IntersectionObserver + CSS)                                 | `lib/hooks/use-reveal.ts`  |

Jadi `nav` dan `footer` di roadmap **bukan komponen baru** — keduanya sudah
ada sebagai `components/layout/header` dan `components/layout/footer`, tapi
isinya masih milik Satūs: logo darkroom, tautan "use this template", dan
`pathname` mentah yang ditampilkan sebagai debug. Tahap ini menulis ulang
isinya, bukan membuat file kembar di `vault/`.

---

## 1. Blocker: `components/ui/link` membuang locale

**Ini dikerjakan lebih dulu dan bisa menghentikan sisanya.** Setiap item nav
yang ditambahkan tahap ini akan membawa cacatnya kalau tidak.

`components/ui/link` mengimpor `next/link` dan `usePathname` dari
`next/navigation` — bukan wrapper di `lib/i18n/navigation.ts`, yang doc
comment-nya sendiri memperingatkan: _"Using the bare Next APIs drops the
prefix and silently sends a reader from `/id/...` back to the default
locale."_

**Diverifikasi terhadap build produksi, bukan dibaca dari kode:**

```
$ curl -sS localhost:3000/id | grep -o '<a [^>]*href="[^"]*"'
  … class="…navLink navLinkDim" href="/"        ← locale hilang

$ curl -sSI -H 'Accept-Language: id' localhost:3000/  →  location: /id
$ curl -sSI                          localhost:3000/  →  location: /en
```

Dua akibatnya, keduanya senyap:

1. **Pembaca kehilangan bahasanya.** Tautan internal merender `/`, dan `/`
   di-redirect berdasarkan header `Accept-Language` browser — bukan
   berdasarkan locale yang benar-benar dipilih pembaca. Pembaca berbahasa
   Indonesia dengan browser berbahasa Inggris yang membuka `/id` akan
   dikembalikan ke `/en` begitu ia menekan tautan apa pun.
2. **State aktif tidak pernah menyala.** `getLinkIntent` membandingkan
   `pathname === href`, yaitu `'/id' === '/'`. Selalu `false`. Terlihat di
   output di atas: `navLinkDim`, tidak pernah `navLinkActive`.

**Perbaikan:**

- `components/ui/link` merutekan href internal lewat `Link` dari
  `lib/i18n/navigation.ts`, dan href eksternal tetap ke anchor biasa.
- `getLinkIntent` membandingkan **template** (`/work`) dengan template dari
  path aktif, lewat `templateFromLocalizedPath()` yang sudah ada di
  `lib/i18n/paths.ts` — bukan membandingkan string mentah.
- Unit test untuk keduanya. Bug ini tidak menghasilkan error apa pun, jadi
  hanya test yang bisa menjaganya.

**Yang tidak diubah:** deteksi href eksternal, `newTab`, hint prefetch dari
Network Information API, dan cabang button/div. Semuanya sudah benar.

---

## 2. `section-header`

Dibuat pertama karena dipakai oleh semua yang lain.

Eyebrow mono + judul `h2`, dengan slot opsional di kanan (hitungan, tautan
"lihat semua"). Tipografi murni dari skala Tahap 1 — kelas `.h2` dan
`.caption`, bukan `font-size` mentah.

Level heading bisa dikonfigurasi (`as`), karena urutan heading tidak boleh
melompat dan `e2e/agent-readiness.e2e.ts` mengujinya.

---

## 3. `project-card`

Saat ini kartu adalah markup inline di dalam `vault/blocks/project-grid`.
Roadmap meminta komponennya berdiri sendiri, dan ada alasan teknis yang
menguatkan: markup itu memuat **nilai desain mentah** yang melanggar aturan
keras #8 — `font-size: 20px`, `font-size: 12px`, `gap: 12px`,
`translateY(32px)`. Semuanya sekarang punya token.

**Kerja:**

- Ekstrak jadi `vault/blocks/project-card`, dengan `project-grid` menyusunnya.
- Ganti `next/image` mentah dengan `components/ui/sanity-image`, supaya kartu
  menerima bentuk data yang benar-benar dikembalikan `projectsQuery`
  (`cover`, `coverAlt`, `title`, `medium`, `year`, `client`, `span`) alih-alih
  bentuk buatan sendiri yang harus dipetakan di setiap pemanggil.
- Ruang tetap ter-reserve. `SanityImage` menurunkan `aspectRatio` dari aset,
  jadi tidak ada pergeseran layout saat gambar datang.
- Tipografi: judul pakai kelas skala, metadata pakai `caption` (mono).
- Href dibangun dengan `localizedPath()`, bukan dirangkai tangan.

**Yang dipertahankan:** `data-reveal-item`, hover `scale(1.03)` pada
`transform` saja, focus-visible yang berbagi perlakuan dengan hover, dan
`minmax(0, 1fr)` di grid.

---

## 4. `language-switcher`

Dua locale, jadi ini **pasangan tombol**, bukan `<select>`. Sebuah select
untuk dua pilihan menambah satu klik tanpa menambah informasi.

- `usePathname()` dari `lib/i18n/navigation.ts` mengembalikan template tanpa
  prefix, jadi pindah bahasa **mempertahankan halaman yang sedang dibaca** —
  bukan melempar pembaca ke beranda.
- Label dari `LOCALE_LABELS` di `lib/i18n/routing.ts`, yang sudah ada dan
  komentarnya menyebut "for the language switcher".
- Teks UI dari `messages/{en,id}.json` (`language.label`, `language.switchTo`),
  yang juga sudah ada.
- `aria-current="true"` pada bahasa aktif, dan `hreflang` pada tiap tautan.

---

## 5. `nav` — menulis ulang isi `components/layout/header`

Sekarang: brand "Satūs" + `pathname` mentah, tautan `home` / `storybook` /
`github` milik darkroom.

Menjadi: wordmark Arth, anchor dalam halaman (`#work`, `#studio`, `#contact`)
dari `messages`, indikator progres baca, dan `language-switcher`.

Keputusan yang perlu dinyatakan:

- **Anchor dalam halaman, bukan rute**, karena Tahap 3 membangun beranda satu
  halaman. Anchor tetap berfungsi sebelum halaman itu ada — ia hanya tidak
  menemukan target, dan itu tidak merusak apa pun.
- **Tautan Storybook dipertahankan di dev**, dihapus di produksi. Logika
  `STORYBOOK_ENABLED` yang ada sudah benar dan tidak diubah.
- **Progres baca memakai `transform: scaleX()`**, bukan `width` — aturan keras
  #4.
- Menu mobile mempertahankan `aria-expanded` / `aria-controls` yang sudah ada.

---

## 6. `footer` — menulis ulang isi `components/layout/footer`

Sekarang: logo darkroom + "use this template". Itu footer starter, bukan
footer studio.

Menjadi: kontak (email), sosial, tahun + nama, dan kredit yang jujur — Satūs
tetap disebut, karena `docs/PROVENANCE.md` mewajibkannya dan MIT mensyaratkan
atribusi. Yang dihapus adalah tautan "use this template", bukan atribusinya.

---

## 7. Story untuk setiap primitive

Kriteria keluar roadmap: _"tiap primitive punya story"_. Yang belum punya:

| Komponen                       | Kenapa perlu                                |
| ------------------------------ | ------------------------------------------- |
| `section-header`               | baru                                        |
| `project-card`                 | baru                                        |
| `language-switcher`            | baru                                        |
| `vault/blocks/hero`            | ada sejak Tahap C, tidak pernah punya story |
| `vault/blocks/project-grid`    | idem                                        |
| `vault/motion/page-transition` | idem                                        |

Tiap story menyertakan state reduced-motion, sesuai `vault/README.md` #6.

---

## 8. Cacat yang dipaksa terlihat oleh tahap ini

Semuanya ditemukan dengan mengukur, bukan menebak, dan semuanya **senyap** —
tidak ada yang menghasilkan error, warning build, atau test merah.

### 8.1 `new Date()` saat render mengosongkan seluruh halaman prerender

Yang paling mahal, dan yang paling tidak terlihat.

Footer sempat membaca tahun dengan `new Date().getFullYear()` di dalam badan
komponen. Di bawah **Cache Components**, membaca jam saat render membuat
boundary di sekitarnya dinamis. Karena footer dirender di dalam `Wrapper`
(Client Component), React tidak sekadar merender ulang — ia **membatalkan
seluruh boundary ke client-side rendering**, dan HTML prerender untuk `/en`
dan `/id` terkirim hanya sebagai cangkang: skip link, tag `<script>`, tidak
ada lagi.

Diukur, dengan membandingkan build produksi baris demi baris:

| Build                                | `header-module` di HTML | Teks body tanpa JS |
| ------------------------------------ | ----------------------- | ------------------ |
| HEAD (sebelum Tahap 2)               | 13                      | 1966 char          |
| Tahap 2 dengan `new Date()`          | **0**                   | cangkang saja      |
| Tahap 2 dengan pembacaan modul-scope | 12                      | 2159 char          |

Yang membuatnya berbahaya: `bun run build` **berhasil**, `bun dev`
**merender dengan benar**, dan hanya byte yang benar-benar dikirim yang
menunjukkannya. Diisolasi lewat tujuh build eksperimen — mengganti header
lama, mencabut language switcher, menukar sumber `usePathname`, dan menetapkan
tahun sebagai konstanta — sampai satu baris tersisa sebagai penyebab.

**Perbaikan:** baca jam di module scope, sekali saat bundle dimuat, di luar
render. **Penjaga:** test baru di `e2e/agent-readiness.e2e.ts` yang menuntut
`id="header-nav"` dan `<footer` ada di HTML `/en` dan `/id`, dengan pesan
gagal yang menyebut penyebabnya. Aturannya juga ditulis di
`components/layout/README.md`.

Sisi yang perlu dicatat jujur: eksperimen pertama saya salah baca. Saya
sempat menyimpulkan "tidak ada regresi" setelah membandingkan angka yang
ternyata berasal dari server HEAD yang masih memegang port 3000 — build baru
gagal bind dan saya mengukur build lama. Kesimpulan itu dikoreksi begitu log
server dibaca.

### 8.2 Tautan internal membuang locale (blocker §1)

Diperbaiki sesuai rencana. Yang **tidak** ada di rencana dan muncul saat
eksekusi: merutekan semua href internal lewat next-intl juga memberi prefix
pada `/llms.txt`, `/sitemap.xml`, dan `/studio` — yang membuatnya 404.

Aturannya sekarang tinggal di `lib/i18n/paths.ts` sebagai
`isLocalizableRoute()`, dan `proxy.ts` mempertahankan daftarnya sendiri yang
**lebih sempit** (hanya `/studio`) karena penjaga lain di hulu sudah
mengecualikan sisanya. Dua daftar dengan lebar berbeda itu disengaja;
`proxy.test.ts` menegaskan daftar proxy tetap subset dari daftar link,
sehingga keduanya tidak pernah bisa saling bertentangan.

### 8.3 `<main>` bersarang — 3 pelanggaran axe

`Wrapper` merender `<main id="main-content">`, lalu `app/[locale]/page.tsx`
merender `<main>` lagi di dalamnya:

```
moderate  landmark-main-is-top-level    1 node
moderate  landmark-no-duplicate-main    1 node
moderate  landmark-unique               1 node
```

Tidak tertangkap karena `route-sweep.e2e.ts` menyaring ke `critical` dan
`serious` saja.

### 8.4 Kanvas WebGL memicu `region` di setiap halaman

Setelah `<main>` diperbaiki, satu pelanggaran `moderate` tersisa di **semua**
rute: `region` pada `div.webgl` — konten di luar setiap landmark.

`aria-hidden` dipasang pada `<Canvas>`, **bukan** pada container-nya.
Container itu juga memuat `<DOMTunnel.Out />`, jalur resmi untuk menaruh HTML
nyata di atas kanvas; menyembunyikan container akan diam-diam menghapus konten
itu dari accessibility tree begitu ada yang memakainya. Aturan keras #13/#14
sudah menetapkan 3D sebagai aksen yang tidak boleh membawa makna, jadi
menyembunyikan kanvasnya sendiri konsisten dengan kontrak yang ada.

### 8.5 Filter severity axe dihapus

Dengan 8.3 dan 8.4 selesai, seluruh rute bersih di **setiap** impact:

```
/en                 clean at every impact
/id                 clean at every impact
/en/ai              clean at every impact
/id/ai              clean at every impact
/en/does-not-exist  clean at every impact
```

Komentar starter menjanjikan pengetatan _"once the starter is confirmed clean
at the full severity level"_. Sekarang benar, jadi filternya dihapus dari
`route-sweep.e2e.ts` dan `not-found.e2e.ts`. Filter itu bukan tanpa biaya
selama berlaku: ia persis yang membuat empat cacat nyata duduk di suite
sementara suite melaporkan hijau.

### 8.6 `Select` tanpa nama aksesibel

Ditemukan oleh gate Storybook (§10) pada menit pertama gate itu ada: 3 dari 4
story `UI/Select` gagal `button-name`, impact **serious**.

Penyebabnya bukan story. Base UI mengarahkan `aria-labelledby` trigger ke
`Select.Label`; kalau label tidak dirender, referensi itu kosong — dan
`aria-labelledby` kosong **mengalahkan** teks di dalam tombol. Jadi
placeholder yang terlihat bukanlah namanya, dan kontrol itu diumumkan sebagai
tombol tanpa label. Trigger sekarang mengambil nama dari `placeholder` ketika
tidak ada `label`; label yang terlihat tetap pilihan yang lebih baik dan tetap
menang bila ada.

### 8.7 Sisa Tahap 1 yang terlewat

- `.storybook/preview.tsx` masih menawarkan tema `red` yang sudah tidak ada.
- JSDoc `Wrapper` masih menulis `'dark' | 'light' | 'red'`.
- `components/layout/README.md` masih mendeskripsikan `app/layout.tsx` dan
  `app/(site)/layout.tsx` — struktur yang dihapus di Tahap 0.

Semuanya diperbaiki.

---

## 9. Gate axe untuk Storybook

Kriteria keluar roadmap menuntut _"axe bersih di Storybook"_, tapi
**mekanismenya tidak ada**: tidak ada `@storybook/addon-a11y`, tidak ada test
runner. Menyatakan kriteria itu terpenuhi tanpa alat pengukurnya melanggar
aturan keras #20.

`e2e/storybook-a11y.e2e.ts` membangunnya: membaca `storybook-static/index.json`
(di-parse dengan zod, bukan di-assert — itu artefak build alat lain), menyajikan
`storybook-static/` sendiri di port bebas, memuat tiap story di iframe-nya, dan
menjalankan axe. Spec-nya **skip dengan pesan** kalau Storybook belum dibangun,
supaya `test:e2e` tetap bisa dijalankan sendirian.

Disaring ke `critical` + `serious` — dan di sini penyaringan itu punya alasan,
tidak seperti §8.5: story dirender di luar dokumen, tanpa landmark dan sering
tanpa `<h1>`, jadi aturan landmark dan urutan heading akan menyala di hampir
semua story tanpa mengatakan apa pun tentang komponennya. Aturan itu diuji di
tempat yang bermakna, yaitu `route-sweep.e2e.ts`.

Hasil: **66 story, semuanya lulus** setelah §8.6 diperbaiki.

---

## 10. Kriteria keluar — status

| Kriteria                                              | Status                                   |
| ----------------------------------------------------- | ---------------------------------------- |
| `bun run check`                                       | ✅ 342 test lulus                        |
| `bun run build`                                       | ✅ `/en` dan `/id` tetap `○ (Static)`    |
| `bun run build-storybook`                             | ✅                                       |
| `CI=true bun run test:e2e`                            | ✅ 86 lulus, termasuk gate axe Storybook |
| Tiap komponen baru punya story + state reduced-motion | ✅ 66 story                              |
| Nol nilai desain hardcode masuk lewat perubahan ini   | ✅                                       |
| Tidak ada tautan internal yang membuang prefix locale | ✅ dijaga 13 unit test + e2e             |
| axe bersih di Storybook                               | ✅ gate dibangun lebih dulu, lalu lulus  |
| axe bersih di rute nyata                              | ✅ di **setiap** impact, filter dihapus  |

---

## 11. Yang tidak dikerjakan, dinyatakan eksplisit

- **`components/ui/darkroom.svg` tidak dihapus** meski footer tidak lagi
  memakainya. `lib/scripts/prepare-handoff.ts` masih merujuknya secara
  eksplisit sebagai aset branding yang ia hapus saat handoff; menghapus
  filenya sekarang berarti ikut mengubah script itu, dan itu di luar lingkup
  tahap ini. Asetnya 5.4KB dan lolos `check:assets`.
- **Indikator progres baca tidak dibangun.** Rencana §5 menyebutnya. Header
  sekarang memuat wordmark, anchor, dan pengalih bahasa; progres baca hanya
  bermakna di atas halaman tunggal yang belum ada, jadi ia pindah ke Tahap 3
  bersama halaman itu — bukan dibuat sekarang di atas konten placeholder.
- **Alamat email dan tautan sosial di footer masih placeholder**
  (`studio@arth.example`, `instagram.com`, `are.na`). Menunggu data asli.
- **Tidak ada profiling browser**, seperti sebelumnya. Tidak ada satu pun
  angka performa di tahap ini.
- **Kartu karya belum pernah dirender dengan gambar nyata.** Dataset Sanity
  masih kosong, jadi semua story `ProjectCard` dan `ProjectGrid` memakai
  `cover: null`. Yang teruji adalah kotak yang sudah dipesan (aspect-ratio)
  dan perilaku kolom — bukan perlakuan gambarnya.

## 12. Risiko yang diperkirakan, dan apa yang benar-benar terjadi

Rencana menebak dua risiko. Keduanya meleset, dan yang sebenarnya terjadi
tidak ada di daftar:

| Diperkirakan                                 | Hasil                                                                        |
| -------------------------------------------- | ---------------------------------------------------------------------------- |
| `typedRoutes` melawan `Link` next-intl       | Friksinya persis sama: satu assertion bertanda `SAFETY:`, seperti sebelumnya |
| `language-switcher` merusak prerender statis | Tidak. Dicabut di eksperimen 2 dan halaman tetap kosong                      |
| —                                            | **`new Date()` di footer** yang merusaknya (§8.1)                            |

Pelajarannya bukan "tebakannya buruk". Pelajarannya adalah bahwa yang
menyelesaikan ini bukan tebakan sama sekali, melainkan membandingkan HTML yang
benar-benar dikirim antara dua build — dan itu langkah yang tidak ada di
rencana.
