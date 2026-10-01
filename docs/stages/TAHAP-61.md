# Tahap 61 — Hijaukan CI, koreksi tanahnya, rapikan dependensi

> **Nol perubahan visual.** Tahap ini memperbaiki tiga hal yang membuat tahap
> 62–67 tidak bisa dipercaya kalau dibiarkan: build yang bisa mati karena satu
> reset TCP, dua klaim di dokumen yang salah, dan sepuluh PR merah yang melatih
> siapa pun berhenti membaca CI.

---

## 1. Kenapa tahap ini ada

Rencana produksi disusun ulang sesudah VPS dibatalkan. Menyusunnya berarti
memverifikasi keadaan, dan verifikasinya menemukan tiga hal yang harus
didahulukan — dua di antaranya adalah kesalahan saya sendiri di Tahap 60.

Urutannya bukan selera: tahap 63–67 menambah animasi, dan setiap tahap itu
diverifikasi oleh CI. CI yang bisa mati karena jaringan, dan dokumen yang
berbohong tentang batas mana yang berlaku, membuat verifikasi itu tidak
bernilai.

---

## 2. Yang diukur sebelum satu baris diubah

Diambil 2026-09-12 dari repo dan GitHub API.

| yang diukur          | hasil                                                    |
| -------------------- | -------------------------------------------------------- |
| HEAD                 | `0997969`                                                |
| CI job `e2e` di HEAD | **hijau** — 18 menit, seluruh suite lolos                |
| CI job `ci` di HEAD  | **merah** — build mati di detik ke-9 pada langkah Build  |
| PR terbuka           | 11 — #9 milik kita, 10 Dependabot dan **semuanya merah** |
| berkas e2e           | 40                                                       |

---

## 3. §61a — `search.json` merunduk, bukan mati

### 3.1 Yang sebenarnya terjadi

```
Export encountered an error on /[locale]/search.json/route: /en/search.json,
exiting the build.
  [cause] Error: read ECONNRESET   errno: -104   attemptNumber: 5
```

`app/[locale]/search.json/route.ts` → `buildIndex()` punya jalur mundur untuk
**"Sanity tidak dikonfigurasi"**:

```ts
if (!isConfigured('sanity')) {
  return buildSearchIndex(locale, {
    projects: null,
    journal: resolveJournalEntries(locale, null),
  })
}
```

dan **tidak punya apa pun** untuk "dikonfigurasi tapi tidak terjangkau". Satu
reset TCP dari `apicdn.sanity.io` membunuh seluruh build.

### 3.2 Kenapa rerun bukan perbaikan

`attemptNumber: 5` adalah penghitung retry milik klien Sanity sendiri. Ia sudah
mencoba lima kali dan menyerah. Mode kegagalan yang sama sudah tercatat di
`docs/DEPLOYMENT.md` §7 — artinya ini berulang, bukan sekali. "Flake" bukan akar
masalah kalau ia punya nama, alamat, dan entri dokumentasi sendiri.

### 3.3 Bentuk perbaikannya

`lib/content/search-index.ts` mendapat `resolveSearchIndex(locale, load)`:
memanggil `load()`, dan pada lemparan apa pun jatuh ke set mundur yang sama.
Ditaruh di sini, bukan di rute, karena `buildIndex` ada di dalam batas
`'use cache'` dan tidak bisa dipanggil langsung oleh tes unit.

Rute memakainya; `lib/content/search-index.test.ts` membuktikan `load` yang
menolak menghasilkan indeks mundur alih-alih lemparan.

### 3.4 Konsekuensi, dinyatakan apa adanya

Kalau Sanity mati tepat saat build, palette pada build itu hanya berisi entri
halaman statis — tanpa proyek dan tanpa jurnal. Itu perdagangan yang benar:
palette kurang isi jauh lebih baik daripada situs yang tidak ada. Ia juga
**sunyi**, jadi peringatan ditulis ke stderr supaya build yang merunduk bisa
dibedakan dari dataset yang memang kosong.

---

### 3.5 Yang ditemukan saat membuktikannya, dan kenapa saya melebar sedikit

Pembuktiannya: build dengan `NEXT_PUBLIC_SANITY_PROJECT_ID=zzzzzzzz` —
terkonfigurasi, formatnya sah, datasetnya tidak ada. Hasil percobaan pertama:

```
Build error occurred
Error: Failed to collect page data for /[locale]/work/[slug]
```

**Build-nya bahkan tidak sampai ke `search.json`.** `generateStaticParams` di
`app/[locale]/work/[slug]/page.tsx` melempar lebih dulu, pada fase pengumpulan
data halaman, sebelum export dimulai. Jadi `ECONNRESET` yang membunuh CI bukan
satu-satunya tempat satu kedipan jaringan bisa menjatuhkan build — ia hanya
yang pertama kebetulan apes.

Fungsi itu **sudah menulis jawabannya sendiri** di komentarnya:

> `dynamicParams` defaults to true … Prerendering is an optimisation here, not
> a gate on content existing.

Jadi satu-satunya arti jujur dari kegagalan jaringan di sana adalah _build ini
tidak berhasil mempelajari daftarnya_, dan jawabannya adalah sentinel yang sama
yang sudah dipakai untuk dataset kosong. Setiap halaman proyek tetap dirender
on demand dan tetap di-cache; ongkosnya satu kunjungan dingin per slug.

**Halaman konten sengaja TIDAK diperlakukan begitu, dan itu bukan kemalasan.**
Daftar params yang gagal diambil kehilangan sebuah optimisasi; sebuah _halaman_
yang isinya gagal diambil akan tayang kosong dan **terlihat selesai**. Di sana
build yang gagal adalah hasil yang jujur, dan ia tetap begitu.

Percobaan kedua, sesudah penjagaan itu dipasang:

```
[work/[slug]] project slugs unreachable, prerendering none.        <- merunduk
[search-index] id: content source unreachable, serving pages only. <- merunduk
Export encountered an error on /[locale]/journal/[slug]/page:
  /en/journal/scope-is-the-deliverable, exiting the build.         <- sengaja
```

Baris kedua adalah pembuktian §61a: rute yang membunuh CI sekarang lolos lewat
jalur mundurnya. Baris ketiga adalah halaman konten, gagal sesuai rancangan.

---

## 4. §61b — dua klaim yang tidak bertahan

### 4.1 "Tidak ada gerbang yang membatasi tinggi hero" — salah

`TAHAP-60.md` §2.1 dan `DIREKSI.md` §2.1 menyatakan itu setelah mencari
`svh` / `100vh` / `clientHeight` / `innerHeight` di 39 berkas e2e, dan
menyimpulkan hanya `media-edge.e2e.ts` yang cocok.

**Pencariannya menemukan lebih banyak dari yang saya baca.** Tiga gerbang
membatasi tinggi, hanya tidak dengan kata "tinggi":

| gerbang                            | menahan                         | yang dituntut                                             |
| ---------------------------------- | ------------------------------- | --------------------------------------------------------- |
| `e2e/first-screen.e2e.ts:113`      | `/work`, `/journal`             | item pertama mulai `< 85%` layar **dan** `opacity > 0.99` |
| `e2e/project-detail.e2e.ts:100`    | `/work/<slug>`                  | `<dl>` fakta memotong fold **800px** di viewport 1280×800 |
| `e2e/navigation-landing.e2e.ts:95` | `/practice/<v>`, `/work/<slug>` | `h1` mendarat di layar pertama sesudah navigasi           |

Dua yang pertama **gerbang kebenaran, bukan selera**, jadi menurut `DIREKSI.md`
§3.1 keduanya TETAP. `first-screen.e2e.ts` menuliskan alasannya dengan angka:
`60svh` di `/work` menaruh sampul pertama di **886px dari 900 (98%)**, lewat
garis 75% milik `useReveal`, sehingga setiap sampul tinggal di `opacity: 0` dan
`catalogue-sift` bermain di tempat yang tidak bisa dilihat siapa pun.

Ruang tinggi yang benar-benar tersisa:

| rute              | sekarang | tersisa                                                |
| ----------------- | -------- | ------------------------------------------------------ |
| `/`               | 100svh   | nol — sudah penuh layar                                |
| `/studio`         | 87%      | kecil                                                  |
| `/practice/<v>`   | 70%      | **nyata** — satu-satunya rute merek yang tidak ditahan |
| `/work/<slug>`    | 95%      | **nol** — fold 800px                                   |
| `/journal/<slug>` | —        | nyata                                                  |
| `/work`           | 31%      | **nol** — `first-screen`                               |
| `/journal`        | 39%      | **nol** — `first-screen`                               |

Jadi menaikkan tinggi menyentuh **tiga rute, bukan tujuh** — dan itu pun bukan
pekerjaan yang berarti sendirian. `DIREKSI.md` §2.1 sudah menulis prinsipnya
benar, _"yang bertambah adalah ruang, lapisan, dan gerak — bukan baris teks"_,
dan konsekuensi jujurnya: **hero lebih tinggi dengan isi yang sama bukan lebih
memukau, melainkan lebih kosong.** Tinggi naik sebagai akibat di tahap yang
memasukkan lapisannya (Tahap 65), bukan sebagai tahap tersendiri.

### 4.2 `CLAUDE.md` #19 — kalimat penutupnya basi

> "No browser profiling has been possible in this environment."

Chromium nyata ada di container ini lewat Playwright dan sudah dipakai untuk
seluruh suite e2e, sampling piksel, dan pengukuran rentang gulir. Aturannya
sendiri benar dan tetap; kalimatnya yang salah, dan siapa pun yang membaca
berkas itu mempercayainya.

Dicabut **sesudah** satu jejak performa nyata diambil di sini, supaya
penggantinya juga terukur alih-alih sekadar tukar klaim.

---

## 5. §61c — dependensi, manual

Sepuluh PR npm Dependabot gagal karena satu hal, dan tidak satu pun tentang
dependensinya:

```
error: lockfile had changes, but lockfile is frozen
```

Dependabot menaikkan `package.json` tapi tidak bisa membuat ulang `bun.lock`.
`.github/workflows/dependabot-lockfile.yml` ditulis persis untuk itu dan
**diam** karena `DEPENDABOT_PAT` tidak pernah diisi — berkasnya sendiri
mencatat setup satu kali yang dibutuhkan.

Keputusan user: tidak mengurus PAT; dependensi di-update manual.

### 5.1 Yang diambil

`bun update` menaikkan 20 paket di dalam rentangnya, ditambah empat pin yang
dinaikkan sengaja:

| paket                                               | dari → ke           | catatan                                                                                                          |
| --------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `next`, `@next/bundle-analyzer`, `@next/playwright` | 16.3.3 → **16.3.4** | patch, ketiganya bergerak bersama (PR #8/#5/#4)                                                                  |
| `oxlint` + `@oxlint/plugins`                        | 1.80 → **1.82**     | harus sepadan (PR #14)                                                                                           |
| `storybook` + `@storybook/*` + `addon-mcp`          | → **10.6.0**        | `addon-mcp` 0.7 → 10.6 adalah penyelarasan versi monorepo, bukan lompatan fitur (PR #10)                         |
| `sanity`, `@sanity/vision`                          | 6.11 → **6.13.2**   | dalam rentang                                                                                                    |
| `oxfmt`                                             | 0.65 → **0.67**     | di luar rentang `^0.65.0`, jadi diuji sendiri: `oxfmt --check` pada 572 berkas **nol perubahan format** (PR #15) |
| `@sanity/client`                                    | 7.26.2 → **7.27.0** | dalam rentang; **bukan** v8 (PR #13 tetap ditolak)                                                               |

Dua hal yang ikut ketahuan dan harus diperbaiki di tahap ini juga:

**`oxlint` 1.82 membuat satu direktif jadi mubazir.**
`components/ui/command/palette.tsx` mematikan `jsx-a11y/anchor-has-content`
pada sebuah `render` prop; 1.82 berhenti melaporkannya, dan
`--report-unused-disable-directives` menangkap sisanya. Direktifnya dipangkas,
tidak dibungkam, dan alasannya ditulis di tempatnya.

**`next-sanity` 13.3.4 memecahkan build dengan `Cannot find module
'@sanity/browserslist-config'`.** Jalur lengkapnya terukur:
`app/[locale]/layout.tsx` → `next-sanity/visual-editing` →
`@sanity/visual-editing/node_modules/@sanity/ui/dist/styles.css` → autoprefixer
→ browserslist. Browserslist menelusuri ke atas dari berkas CSS bersarang itu,
menemukan `package.json` Sanity yang `browserslist`-nya berbunyi
`["@sanity/browserslist-config"]`, dan paket itu tidak pernah ada di lockfile.
Diperbaiki dengan memasang paketnya (MIT, 1 paket) alih-alih membekukan
`next-sanity`.

**`@clack/prompts` 1.8 mempersempit type guard-nya dan memerahkan `tsc`.**
`lib/scripts/generate-shared.ts:76` — `isCancel` sekarang dideklarasikan
`value is typeof CANCEL_SYMBOL` dengan `CANCEL_SYMBOL: unique symbol`.
Menyempitkan `T | symbol` terhadap sebuah symbol _unique_ tidak bisa membuang
`symbol` yang lebih lebar dari `T` yang tidak dibatasi, jadi cabang negatifnya
tetap bertipe `T | symbol` (TS2322) walaupun `process.exit(1)` di atasnya
bertipe `never`. Diselesaikan dengan satu cast ber-`SAFETY:` yang menuliskan
persis alasan itu — bukan dengan membatasi `T`, yang akan jadi kebohongan
karena pemanggilnya mengoper string.

### 5.2 Yang ditolak, dan alasannya bukan "lockfile"

| PR      | paket                       | alasan ditolak                                                                                                                       |
| ------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **#11** | `@playwright/test` → 1.63.0 | **Diuji dan dibatalkan.** Lihat di bawah                                                                                             |
| **#12** | `three` → 0.186.0           | Di luar rentang `^0.185.1`; ia menyeret `@react-three/drei`, `-fiber`, `@types/three`. Layak tahapnya sendiri                        |
| **#13** | `@sanity/client` → 8.6.1    | Major. Changelog dibaca dulu; ia menyentuh setiap jalur konten                                                                       |
| **#1**  | `actions/github-script` → 9 | Ekosistem github-actions, tidak menyentuh `bun.lock`. Dipakai hanya di `lighthouse-to-slack.yml`; dinilai saat workflow itu ditinjau |

**PR #11 dicoba dan ditarik kembali, dan ini temuan yang sebenarnya.**
`package.json` memuat `overrides.playwright-core: "1.62.1"`. Menaikkan
runner-nya saja meninggalkan core di 1.62.1, dan **656 tes mati semua dalam
<10ms**:

```
TypeError: browserType.launch: renderParamsForCall is not a function
```

Itu ketidakcocokan protokol, bukan kegagalan tes. Jadi bump Playwright adalah
perubahan **dua baris** — runner dan override — dan ia harus divalidasi di
tempat browser bisa diunduh; container ini hanya punya revisi 1.62.x di
`/opt/pw-browsers` dan `playwright install` tidak tersedia. Dicatat di
`AGENTS.md` supaya tidak ditemukan ulang.

Alasan menutup ekosistem npm ditulis di `.github/dependabot.yml`, bukan di sini
saja: CI yang selalu merah melatih siapa pun berhenti membacanya, dan itu
justru gerbang paling mahal untuk hilang.

---

## 6. Pengukuran performa pertama proyek ini

`CLAUDE.md` #19 melarang mengklaim angka yang tidak diukur, lalu menutup
dirinya dengan kalimat _"No browser profiling has been possible in this
environment"_ — yang saya ulangi tanpa pernah mengeceknya. Ini ceknya.

**Metode.** Build produksi, `bun run start`, lalu Playwright + Chromium asli
(`/opt/pw-browsers/chromium-1234`), 1440×900, CDP `Performance.getMetrics` plus
`PerformanceObserver` untuk long task. Gulir setengah layar per 120ms dari atas
ke bawah sambil menghitung jarak antar-frame `requestAnimationFrame`.

**Peringatan yang menentukan cara membaca tabelnya.** Renderernya
`ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device …))` — **rasteriser
perangkat lunak, tanpa GPU**, di 4 core. Jadi angka frame pada rute ber-WebGL
adalah **lantai**, bukan ramalan untuk pengguna. Yang bermakna adalah
**perbandingan setara antar rute pada kondisi yang sama**, dan angka
main-thread (long task, script time, FCP) yang memang tidak dibantu GPU.

| rute              |   FCP | transfer | long task | terpanjang | frame gulir median | >32ms | WebGL |
| ----------------- | ----: | -------: | --------: | ---------: | -----------------: | ----: | :---: |
| `/en`             | 548ms |   879 KB |    **90** |      173ms |         **71,8ms** | 62/62 |  ya   |
| `/en/work`        | 604ms |   866 KB |    **22** |      180ms |         **68,5ms** | 27/30 |  ya   |
| `/en/studio`      | 436ms |   509 KB |         3 |       71ms |             16,7ms |  0/93 | tidak |
| `/en/work/<slug>` | 828ms |   491 KB |         2 |      167ms |             16,7ms |  0/28 | tidak |

Dua rute tanpa WebGL menggulir di **16,7ms — 60fps penuh, nol frame lewat
32ms** — dan itu angka yang sah dikutip: ia dibatasi CPU dan compositor, bukan
GPU, dan 4 core adalah mesin kelas bawah yang nyata.

Dua rute ber-WebGL, pada kondisi yang sama, **empat kali lebih lambat**. Di
SwiftShader itu wajar dan bukan bukti cacat. Yang **bukan** soal GPU, dan
karena itu perlu dicatat: **90 long task di `/en`** dengan yang terpanjang
**173ms**. Long task adalah main thread, bukan rasteriser.

**Ini tidak diperbaiki di Tahap 61**, dan alasannya jujur: saya belum bisa
memisahkan berapa dari 90 itu milik kompilasi shader sekali jalan (yang di
SwiftShader mahal dan di GPU nyata hampir gratis) dan berapa milik kode kita
sendiri. Memperbaiki tanpa pemisahan itu berarti menebak. Yang ia beri adalah
**garis dasar**: Tahap 63–66 menambah animasi, dan tahap mana pun yang membuat
angka long task `/en` naik tajam sekarang punya sesuatu untuk dibandingkan.

Perintah untuk mengulangnya ada di §7.

---

## 7. Gerbang keluar

| harus                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------------- |
| `bun run build` dengan CMS tak terjangkau: `search.json` dan `generateStaticParams` **merunduk**, halaman konten tetap gagal (§3.5) |
| `bun run check` hijau                                                                                                               |
| `bun run test:e2e` hijau                                                                                                            |
| CI GitHub hijau di HEAD, **dibaca dari API**, bukan dari notifikasi                                                                 |
| `DIREKSI.md`, `DESIGN-SYSTEM.md`, `CLAUDE.md` tidak lagi memuat klaim §4                                                            |
| Nol PR Dependabot npm terbuka; `dependabot.yml` tidak lagi membuatnya                                                               |

---

## 8. Hasil

| gerbang                                     | hasil                                                                   |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| `bun run check`                             | **424 lulus / 0 gagal** (dari 421; +3 §61a)                             |
| `bun run test:e2e` (`CI=1`, build produksi) | **642 lulus / 14 dilewati / 0 gagal**, 19,2m                            |
| `bun run build`                             | hijau, 56,7s                                                            |
| `bun run build-storybook`                   | hijau                                                                   |
| `bun run build` dengan CMS tak terjangkau   | merunduk di dua tempat, gagal di halaman konten — sesuai rancangan §3.5 |

### 8.1 Satu kesalahan saya sendiri, dicatat karena ia mahal

Seluruh 16 tes command-palette "gagal" di percobaan lokal pertama, dan saya
sempat menyalahkan `@base-ui/react` 1.8 sampai mereverth-nya. Itu salah.
**Sebuah `next start` lama masih memegang port 3000**, sisa dari sesi
pengukuran performa; `playwright.config.ts` memakai `reuseExistingServer:
!process.env.CI`, jadi Playwright lokal menyambung ke server basi itu — yang
menyajikan manifest dari `.next` yang sudah saya hapus, sehingga **setiap chunk
JS mengembalikan 500** dan tidak ada JavaScript yang jalan sama sekali.

Dua pelajarannya, dan keduanya sudah dipakai di tahap ini:

- Verifikasi lokal harus `CI=1` — itu yang membuat `webServer` menjalankan
  `bun run build && bun run start` alih-alih `bun run dev`, persis seperti CI.
  Dengan `CI=1`, 16/16 palette lulus di Base UI 1.8.0 tanpa perubahan apa pun.
- Sebuah tes yang gagal dalam <10ms atau yang gagal _seluruhnya sekaligus_
  hampir tidak pernah tes itu sendiri. Dua kali di tahap ini pola itu benar:
  sekali `renderParamsForCall` (ketidakcocokan protokol), sekali server basi.

### 8.2 Yang dibawa ke tahap berikutnya

- **Garis dasar long task**: 90 di `/en`, terpanjang 173ms (§6). Tahap 63–66
  menambah animasi; angka itu yang dibandingkan.
- **PR #11, #12, #13** ditolak dengan alasan tertulis, bukan ditutup diam-diam.
- **`DEPENDABOT_PAT`** tetap kosong, sengaja. Kalau suatu saat diisi, blok npm
  di `.github/dependabot.yml` dihidupkan lagi di hari yang sama.
