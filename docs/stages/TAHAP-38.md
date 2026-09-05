# Tahap 38 — Navigasi: header, breadcrumb, sirkuit

> Status: spec. Kode belum ditulis saat baris ini dibuat (`docs/ROADMAP.md` §3.0).

Cacat terpenting dalam audit kurator, dan bukan cacat estetika. Juri awwwards
menilai **Usability 30%** — bobot terbesar setelah Design — dan pola
penelusurannya selalu sama: masuk lewat satu karya, lalu coba temukan karya
kedua tanpa kembali ke beranda.

Di situs ini, jalan itu tidak ada.

---

## 1. Diagnosis, diukur di halaman terbangun

Tautan dalam-situs **di dalam `<main>`**, yaitu isi halaman itu sendiri.
Footer sengaja tidak dihitung: ia sama di setiap halaman, jadi ia bukan
petunjuk arah _dari_ halaman ini.

| Rute                     | Tautan di `main` | Tautan rute di `header` |
| ------------------------ | ---------------: | ----------------------: |
| `/en`                    |                7 |                       0 |
| `/en/work`               |               10 |                       0 |
| **`/en/work/<slug>`**    |            **1** |                       0 |
| `/en/practice/<v>`       |                3 |                       0 |
| **`/en/studio`**         |            **1** |                       0 |
| `/en/journal`            |                3 |                       0 |
| **`/en/journal/<slug>`** |            **1** |                       0 |
| 404                      |                4 |                       0 |

Tiga halaman menawarkan **satu** pintu keluar. Dan header — satu-satunya
elemen yang muncul di setiap rute — membawa **nol** tautan rute di sembilan
dari sebelas jenis halaman: hanya wordmark, pencarian, dan pengalih bahasa.
`components/layout/header/index.tsx` berargumen benar tentang _anchor_, lalu
tidak pernah menambahkan tautan rute yang `components/layout/footer` sendiri
katakan harus ada di suatu tempat.

Empat tautan di 404 pun bukan untuk manusia: `/en/ai`, `/llms.txt`,
`/sitemap.xml`, `/en`.

### 1.1 Rute yang ada dan tidak pernah ditautkan

`app/[locale]/work/practice/[value]/page.tsx` sudah ada, prerendered untuk
ketiga nilai, dan **nol halaman menaut ke sana**. Halaman proyek tahu praktik
proyeknya dan tidak mengatakannya.

### 1.2 Tiga builder JSON-LD ditulis, di-type, diekspor, tidak pernah dipanggil

`lib/seo/schemas.ts`: `breadcrumbSchema()` (baris 162),
`collectionPageSchema()` (190), `articleSchema()` (234). Tiap halaman hanya
mengirim graf Organization + WebSite site-wide. Nol structured data
per-proyek, nol per-entri, nol `ItemList` di katalog.

### 1.3 Entri jurnal ada sebagai halaman dan tidak ada di permukaan mesin mana pun

`routableContentQuery` hanya mencakup `page` dan `project`, dan
`STATIC_ROUTE_TEMPLATES` punya `/journal` tapi bukan anak-anaknya. Enam URL
entri **absen dari `sitemap.xml`, `/llms.txt`, dan `/ai`** — sementara hadir
di palet pencarian, yang berarti situs ini bisa mencarinya tapi tidak
mengumumkannya.

---

## 2. Nol konten baru

Tiap tautan di bawah menghubungkan sesuatu yang **sudah ada**. Tidak satu pun
menuntut studio menulis apa pun.

---

## 3. Yang dibangun

### 3.1 Header membawa navigasi rute di setiap halaman

Work · Studio · Journal, dengan `aria-current="page"` pada yang aktif. Anchor
tetap hanya di beranda — argumen `header/index.tsx` soal itu benar dan
dipertahankan; yang ditambahkan adalah tautan rute, bukan anchor.

### 3.2 Breadcrumb, dan tiga builder yang akhirnya dipanggil

- Breadcrumb di `/work/<slug>`, `/practice/<v>`, `/journal/<slug>`.
- `breadcrumbSchema()` dipanggil dari ketiganya.
- `collectionPageSchema()` di `/work` dan `/journal`.
- `articleSchema()` di entri jurnal.
- `ItemList` di katalog.

### 3.3 Sirkuit isi halaman

| Halaman                |   Dari |         Ke | Lewat                                                           |
| ---------------------- | -----: | ---------: | --------------------------------------------------------------- |
| `/work/<slug>`         |      1 |         ≥4 | breadcrumb + chip praktik → `/work/practice/<v>` + next-project |
| `/journal/<slug>`      |      1 |         ≥3 | breadcrumb + praktik terkait + entri berikutnya                 |
| `/studio`              |      1 |         ≥5 | tiga praktik + katalog                                          |
| 404                    | 4 agen | ≥3 manusia | katalog, studio, jurnal                                         |
| `/practice/<v>` kosong |      — |         +1 | "lihat semua karya"                                             |

### 3.4 Entri jurnal masuk permukaan mesin

`sitemap.xml`, `/llms.txt`, `/ai`.

---

## 4. Koreografi — `circuit-reveal`

Pita micro. **Tidak menyentuh anggaran §9.5**: ia bukan gerak berkoreografi,
ia perlakuan INTENT pada kontrol baru, dan `docs/MOTION-SPEC.md` §9 sudah
mendefinisikannya.

Chip praktik dan breadcrumb masuk lewat `Reveal` yang sudah ada — nol
mekanisme baru. Pada hover dan `:focus-visible`:

- `transform: translate3d(0, calc(var(--space-4xs) * -1), 0)` — naik satu
  sub-langkah.
- Masuk **200ms** (`--duration-fast`) dengan `--ease-out-quart`; keluar
  **150ms** (`--duration-micro`). Masuk lebih lambat dari keluar, sehingga
  chip terasa punya massa alih-alih berkedip.
- Nol `box-shadow`, nol perubahan `height` — hanya `transform` dan warna.
- **Reduced motion:** perubahan latar dari token saja, nol translasi.

---

## 5. Gerbang

`e2e/site-reach.e2e.ts`, diperluas:

1. **Header membawa ketiga tautan rute** di setiap rute manusia, di kedua
   bahasa, dan menandai yang aktif dengan `aria-current="page"`.
2. **Tiap rute manusia menawarkan ≥3 tautan dalam-situs di `<main>`.**
   Dibuktikan merah dengan tabel §1: proyek 1, studio 1, entri 1.
3. **404 menawarkan ≥3 tujuan manusia** — bukan `/llms.txt` dan
   `/sitemap.xml`.
4. **Tiap rute dicapai dari beranda dalam ≤3 klik** tanpa mundur.
5. **Tiap entri jurnal ada di `sitemap.xml` dan `/llms.txt`.**
6. **Breadcrumb JSON-LD valid** di ketiga halaman dalam, dan `ItemList` ada di
   katalog.

Lantai anti-vakum di tiap asersi.

---

## 6. Risiko

- Header tumbuh dari tiga kontrol jadi enam. `taste-skill` membatasi nav satu
  baris ≤80px, dan `e2e/taste-preflight.e2e.ts` mengukurnya — di 1440 maupun
  di lebar yang lebih sempit, di mana enam item bisa membungkus.
- Menambah tautan menambah `[data-press]`, dan `interaction-grammar.e2e.ts`
  berjalan mengelilingi setiap satu.
- Breadcrumb menambah elemen di atas `h1` pada tiga halaman; `taste-preflight`
  menghitung eyebrow dan tumpukan hero, dan `reveal-coverage` menuntut tiap
  heading punya `[data-reveal]`.
- JSON-LD baru mengubah bentuk graf. `agent-readiness.e2e.ts` dan
  `canonical-sweep.e2e.ts` menjaga permukaan itu.

---

## 7. Hasil

### 7.1 Yang dikirim

| #   | Butir                                                                                | Keadaan                           |
| --- | ------------------------------------------------------------------------------------ | --------------------------------- |
| 1   | Navigasi rute di header setiap halaman, `aria-current="page"`                        | ✅                                |
| 2   | Breadcrumb di `/work/<slug>`, `/practice/<v>`, `/journal/<slug>`                     | ✅                                |
| 2   | `breadcrumbSchema()`, `collectionPageSchema()`, `articleSchema()` akhirnya dipanggil | ✅                                |
| 3   | Chip praktik di halaman proyek → `/practice/<value>`                                 | ✅                                |
| 4   | Entri jurnal → praktik terkait + entri berikutnya                                    | ✅                                |
| 5   | Studio → tiga praktik + katalog                                                      | ✅                                |
| 6   | 404 menawarkan permukaan manusia                                                     | ✅ dengan JavaScript — lihat §7.4 |
| 7   | `/practice/<v>` kosong mendapat jalan keluar                                         | ✅                                |
| 8   | Entri jurnal masuk `sitemap.xml`, `/llms.txt`, `/ai`                                 | ✅                                |

**Tautan keluar di `<main>`, diukur pada build produksi sesudahnya:**

| rute                      | sebelum | sesudah |
| ------------------------- | ------: | ------: |
| `/en`                     |       7 |       7 |
| `/en/work`                |      10 |       9 |
| `/en/work/<slug>`         |   **1** |   **4** |
| `/en/practice/consulting` |       3 |       5 |
| `/en/studio`              |   **1** |   **4** |
| `/en/journal`             |       3 |       3 |
| `/en/journal/<slug>`      |   **1** |   **4** |

`/en/work` turun dari 10 ke 9 karena penghitungnya sekarang membuang duplikat
dan tautan ke halaman itu sendiri; tidak ada tautan yang hilang.

**JSON-LD sesudahnya**, dihitung dari HTML terbangun:

| rute                      | graf                                                           |
| ------------------------- | -------------------------------------------------------------- |
| `/en/work/arus-balik`     | Organization · WebSite · **BreadcrumbList** (3 ListItem)       |
| `/en/practice/consulting` | Organization · WebSite · **BreadcrumbList** (3)                |
| `/en/journal/<slug>`      | Organization · WebSite · **BreadcrumbList** (3) · **Article**  |
| `/en/work`                | Organization · WebSite · **CollectionPage** · **ItemList** (6) |
| `/en/journal`             | Organization · WebSite · **CollectionPage** · **ItemList** (3) |

**Entri jurnal di permukaan mesin:** 6 URL (3 slug × 2 bahasa) di
`sitemap.xml`, 6 di `/llms.txt` dengan judul yang benar per bahasa, 3 di
`/en/ai`. Sebelumnya nol di ketiganya.

### 7.2 Cacat yang ditemukan Tahap ini, dan tidak dicari

**Tautan "Studio" di footer menyajikan CMS, bukan halaman studio.**

Ini bukan bagian dari rencana; ia muncul saat butir 1 dikerjakan, karena
menambahkan `/studio` ke navigasi header berarti menambahkannya ke **setiap**
halaman. Diukur pada build produksi sebelum perbaikan:

```
curl -s localhost:3000/en | grep -o 'href="[^"]*studio[^"]*"'
  href="#studio"
  href="/studio"

curl -s -o /dev/null -w '%{http_code}' localhost:3000/studio   ->  200
curl -s localhost:3000/studio | grep -o '<title>[^<]*</title>'
  <title>Sanity Studio</title>
```

Penyebabnya bukan salah ketik. `lib/i18n/paths.ts` mendaftarkan `/studio`
sebagai rute yang **sengaja** bebas-locale, karena itu base path Sanity
Studio — sehingga `components/ui/link` dengan benar menolak memberinya
prefiks, dan href tanpa prefiks lalu dilayani `app/(chrome)/studio/`.
Aturannya benar di kedua sisi; yang salah adalah dua hal berbeda memakai satu
alamat.

`docs/stages/TAHAP-15.md` §1.3 sudah menuliskannya: _"`/studio` sudah dipakai
Sanity Studio"_ — lalu Tahap 24 membangun halaman studio di `/[locale]/studio`
dan Tahap 22 menautkannya dari footer. Cacat ini tayang selama **empat belas
Tahap** dan tidak ada satu gerbang pun yang melihatnya, termasuk gerbang
Tahap ini sendiri sebelum diperbaiki: asersi header mencocokkan href dengan
`endsWith('/studio')`, yang **lulus** justru saat tautannya salah.

**Perbaikan:** Sanity Studio pindah ke `/cms`. Halaman publik memenangkan URL
publik; CMS adalah alat internal yang tidak ditautkan dari mana pun di situs.
Menyentuh `sanity.config.ts`, `sanity.cli.ts`, `proxy.ts`, `lib/i18n/paths.ts`,
`RESERVED_PATHS`, dua berkas uji unit, dan empat dokumen operasional. Sesudahnya:

```
/studio      -> 307 -> /en/studio    <title>Studio — Arth</title>
/cms         -> 200                  <title>Sanity Studio</title>
```

**Gerbang yang seharusnya menangkapnya**, ditambahkan: setiap tautan internal
yang dirender `header` atau `footer` harus membawa prefiks locale, kecuali
daftar endpoint mesin yang eksplisit. Itu tanda tangan persis dari cacat ini,
apa pun penyebabnya, dan ia berlaku di tiga rute sekaligus alih-alih satu
string.

### 7.3 Uji yang berubah, dan apa yang hilang karenanya

`e2e/not-found.e2e.ts` menguji ketiga tautan pemulihan 404. Ketiganya diganti
(butir 6), jadi asersinya ikut berubah — dan itu **memakan satu setengah
cakupan** yang layak disebut, bukan didiamkan:

Trio lama menguji **dua** paruh aturan prefiks sekaligus, ujung ke ujung:
tautan halaman (`/en/ai`) membawa locale, endpoint statis (`/llms.txt`,
`/sitemap.xml`) tidak. Sesudah Tahap ini **tidak ada halaman yang dirender
menautkan endpoint statis mana pun**, jadi paruh kedua tidak punya rumah e2e
lagi. Ia tetap diuji unit di `components/ui/link/link.test.ts` dan
`proxy.test.ts`.

Paruh pertama justru diuji **lebih luas** dari sebelumnya, lewat gerbang
chrome di §7.2 — yang berlaku pada seluruh header dan footer di tiga rute,
bukan pada tiga tautan di satu halaman.

Satu perubahan kecil lagi: asersi 404 sekarang di-scope ke `#main-content`.
Tanpa itu `getByRole('link', { name: 'Work' })` menemukan **tiga** elemen —
header, main, footer — karena Tahap ini memang menaruh nama yang sama di
ketiganya.

### 7.4 Yang gagal, dan dibatalkan

**404 merender 28 karakter tanpa JavaScript.** Diukur pada build produksi:

| URL                     | karakter | `<h1>` | tautan di `main` |
| ----------------------- | -------: | -----: | ---------------: |
| `/en/no-such-page-here` |   **28** |      0 |                0 |
| `/id/tidak-ada`         |   **30** |      0 |                0 |
| `/no-such-root-page`    |   **28** |      0 |                0 |

28 karakter itu "Skip to main content / Loading". 404 tinggal di
`app/[locale]/[...slug]`, yang `◐`, jadi `notFound()` selesai **di dalam**
lubang dinamis dan UI not-found tiba di potongan streaming yang hanya
JavaScript bisa pasang.

Dua perbaikan dicoba dan **keduanya diukur**:

1. Menghapus `loading.tsx` segmen itu dan mendeklarasikan
   `export const instant = false` — pola yang sudah dipakai
   `app/[locale]/practice/[value]/page.tsx`. Hasil: **28 → 0 karakter**.
   `RouteLoading` ternyata satu-satunya isi statis yang dimiliki shell itu,
   jadi menghapusnya membuat keadaan lebih buruk, bukan lebih baik.
2. Melepas pembacaan `draftMode()` pada rute itu — pola yang sudah dipakai
   `app/[locale]/page.tsx`, dan penyebab yang benar untuk halaman beranda.
   Hasil: **tetap 0**. Rute tetap `◐`.

Keduanya **dibatalkan**. Angka yang diukur memburuk, penyebabnya belum
ditemukan, dan mengirim perubahan spekulatif ke rute yang juga melayani setiap
URL CMS bukan harga yang pantas dibayar untuk tebakan.

Jadi butir 6 dikirim setengah: 404 menawarkan tiga tujuan manusia kepada
pembaca dengan browser, dan **tidak menawarkan apa pun** kepada crawler atau
pembaca tanpa JavaScript. Itu cacat rendering, bukan cacat navigasi, dan ia
tetap terbuka dengan angkanya di atas. `e2e/site-reach.e2e.ts` menuliskan
batas itu di tempat asersinya, supaya ia tidak tak terlihat.

`e2e/no-javascript.e2e.ts` tidak pernah mencakup 404 — itulah kenapa cacat ini
bertahan sampai sekarang tanpa terlihat.

### 7.5 Yang ditinggalkan sengaja

- `components/ui/route-loading` tetap punya konsumen (`loading.tsx` yang
  dikembalikan), jadi tidak jadi kode mati.
- Label `notFound.agentIndex` dan `notFound.sitemap` dihapus dari kedua berkas
  pesan, bukan dibiarkan sebagai kunci mati.
- Riwayat di `docs/stages/TAHAP-2/8/9/15/16/24/35.md` **tidak** ditulis ulang
  untuk `/cms`. Dokumen tahap adalah catatan apa yang benar saat itu; yang
  diselaraskan hanya dokumen yang masih memandu ke depan (`ROADMAP.md` §1,
  `DEPLOYMENT.md`, `MENJALANKAN-LOKAL.md`, `PANDUAN-STUDIO.md`,
  `app/README.md`).

### 7.6 Gerbang

```
bun run build            ✅
bun run check            ✅  oxlint · oxfmt · tsc · 457 unit · manifest · assets
bun run build-storybook  ✅
CI=true bun run test:e2e ✅  488 passed · 16 skipped · 0 failed
```

Dua kegagalan pada jalan pertama, keduanya diperkirakan dan keduanya milik
Tahap ini: `not-found.e2e.ts` menguji tautan yang butir 6 ganti, dan
`storybook-a11y.e2e.ts` menolak Storybook yang lebih tua dari komponen yang
diperiksanya — `components/ui/breadcrumbs/` baru. Keduanya diperbaiki:
uji 404 diperbarui (§7.3), dan `Breadcrumbs` mendapat story-nya sendiri
sebelum Storybook dibangun ulang.
