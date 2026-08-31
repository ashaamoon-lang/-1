# TAHAP 6 — Deploy & handoff

Stage-spec yang diwajibkan `docs/ROADMAP.md` §3.0. Ditulis setelah satu
build produksi terhadap domain nyata, karena tahap ini bukan tahap fitur:
yang dinilai adalah **artefak yang benar-benar terkirim**, dan itu hanya
kelihatan setelah dibangun.

Roadmap menuliskan tahap ini dalam tiga baris:

> **Kerja:** Vercel, env produksi (`NEXT_PUBLIC_BASE_URL`), `PROD-README.md`,
> akses Sanity Studio untuk studio, jalur ke VPS kalau nanti pindah.
>
> **Keluar:** preview deploy hijau · sitemap & robots benar di domain nyata ·
> studio bisa menambah karya tanpa bantuan saya.

Satu dari tiga kriteria keluar itu **tidak bisa dipenuhi dari kontainer ini**,
dan itu dinyatakan di §9 — bukan dibulatkan jadi hijau.

---

## 0. Batas yang jujur: preview deploy tidak bisa dijalankan di sini

Kontainer ini tidak punya kredensial Vercel, dan tidak akan pernah punya:
menautkan proyek butuh login interaktif ke akun pemilik. Jadi kriteria
**"preview deploy hijau" tidak diverifikasi** — yang bisa dilakukan adalah
memastikan setiap hal yang membuat preview deploy gagal atau salah sudah
benar sebelum tombolnya ditekan:

| Yang gagal di preview deploy  | Cara memastikannya di sini                             |
| ----------------------------- | ------------------------------------------------------ |
| Build error                   | `bun run build` — jalur yang sama persis               |
| Canonical/sitemap `localhost` | Build ulang dengan `NEXT_PUBLIC_BASE_URL` domain nyata |
| Env var kurang                | `lib/env.ts` (Zod) menolak build, bukan diam           |
| Studio putih setelah deploy   | CORS — dijelaskan di `docs/DEPLOYMENT.md` §2           |
| Kartu share salah             | Baca HTML hasil build, bukan asumsi                    |

Yang tersisa dan hanya bisa dilakukan pemilik akun ditulis sebagai daftar
langkah yang bisa diikuti tanpa saya (§7).

---

## 1. Apa yang ditemukan build domain nyata

Build dijalankan dengan `NEXT_PUBLIC_BASE_URL=https://arth.studio`, lalu HTML
hasilnya dibaca. Domainnya benar di semua permukaan:

- `robots.txt` → `Sitemap: https://arth.studio/sitemap.xml`
- `sitemap.xml` → `<loc>https://arth.studio/en</loc>`, `/id`, dan tiap karya
- canonical `https://arth.studio/id/work/rimbun`
- hreflang `en-US`, `id-ID`, `x-default`, semuanya di domain nyata

Peringatan `metadataBase` yang muncul saat build sudah ditelusuri dan **alarm
palsu**: `metadataBase` memang di-set (`lib/utils/metadata.ts` dan
`app/[locale]/layout.tsx`), dan URL tiap halaman resolve dengan benar.

### Koreksi: memeriksa empat halaman tidak sama dengan memeriksa situs

Daftar di atas ditulis setelah memeriksa beberapa halaman satu per satu, dan
sempat saya nyatakan sebagai "semuanya benar". Itu terlalu jauh. Setelah
pemeriksaan diubah jadi skrip — ambil `sitemap.xml`, buka **setiap** URL di
dalamnya, bandingkan dengan canonical dan `og:url` halaman itu sendiri —
**2 dari 10 rute gagal**, dan keduanya tidak ada dalam sampel yang saya
periksa manual (§4 dan §5).

Itu pelajarannya, bukan angkanya: pemeriksaan manual mengukur ketelitian
pemeriksanya, bukan situsnya. Sweep-nya sekarang jadi test permanen
(`e2e/canonical-sweep.e2e.ts`).

Membaca HTML juga memunculkan cacat yang tidak satu pun gate bisa lihat. Ini
pola yang sama dengan Tahap 3, 4 dan 5: **gate hanya menjaga apa yang diminta
menjaganya.**

---

## 2. Cacat A — situs ini masih memperkenalkan dirinya sebagai Satūs

Bukan satu string. Enam permukaan, satu akar.

| Permukaan                    | Nilai terkirim sekarang       | Sumber                    |
| ---------------------------- | ----------------------------- | ------------------------- |
| `og:site_name`               | `@darkroom.engineering/satus` | `package.json` `name`     |
| `applicationName`            | `@darkroom.engineering/satus` | idem                      |
| `manifest.webmanifest` nama  | `@darkroom.engineering/satus` | idem                      |
| `og:image:alt`               | `Satūs`                       | `app/[locale]/layout.tsx` |
| `<title>` default & template | `Satūs` / `%s - Satūs`        | idem                      |
| JSON-LD `Organization`       | `Satūs`, deskripsi starter    | `lib/seo/site.ts`         |

Dan yang paling terlihat oleh manusia, bukan crawler:
**`app/opengraph-image.jpg` masih kartu merah bertuliskan "SATŪS —
NEXT.JS STARTER"**, 1200×630, dan `twitter-image.jpg` adalah salinan
byte-identik dari file yang sama. Setiap kali tautan situs ini dibagikan di
WhatsApp, Instagram DM, Slack, atau X, itulah gambarnya. `app/icon.png` dan
`app/apple-icon.png` juga masih mark merah Satūs — dan merah adalah warna
yang justru **dibuang** di Tahap 1 karena bersaing dengan karya.

Kenapa gate tidak melihatnya: tidak ada test yang membaca `og:site_name`,
dan tidak ada gate yang bisa menilai isi sebuah JPEG. `bun run check`,
`bun run build`, dan Playwright semuanya hijau di atas kartu share yang
salah.

**Kerja:** ganti keenam permukaan itu, lalu **render ulang** kartu OG dan
kedua ikon dari token desain yang sebenarnya (`lib/styles/colors.ts`, Syne),
bukan menggambar file baru dengan tangan. Chromium sudah terpasang di
kontainer ini dan sudah dipakai sejak Tahap 2, jadi asetnya dirender dari
HTML — dan skripnya ikut di-commit supaya studio bisa membuat ulang sendiri
kalau namanya berubah.

`bun run handoff` **tidak dijalankan.** Skrip itu menghapus kredit
darkroom.engineering dari footer, dan kredit itu justru harus tetap ada:
lisensi MIT Satūs meminta notice-nya dipertahankan, dan `messages/*.json`
sudah memuatnya secara sadar (`footer.builtOn`).

---

## 3. Cacat B — `og:url` tidak setuju dengan canonical

Di `/en/work/panas-sore` yang terkirim adalah:

```html
<link rel="canonical" href="https://arth.studio/en/work/panas-sore" />
<meta property="og:url" content="https://arth.studio/work/panas-sore" />
```

Dua URL berbeda untuk satu halaman, dari satu fungsi yang sama.

Akarnya adalah dua kosakata yang sudah didokumentasikan `lib/i18n/paths.ts` —
**template** (bebas locale, `/work/panas-sore`) dan **localized path**
(`/en/work/panas-sore`) — bertabrakan di dalam `generatePageMetadata`.
Opsi `url` dipakai untuk dua hal yang butuh kosakata berbeda:

```ts
const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL   // butuh localized path
alternates: routeAlternates(url ?? '/')                // butuh localized path
locale: LOCALE_TAGS[localeFromPath(url ?? '/') ?? ...] // butuh localized path
```

Ketiganya butuh localized path; keempat pemanggilnya mengirim template.
`app/[locale]/work/[slug]/page.tsx` menutupi sebagian dengan menimpa
`alternates` sesudahnya — yang membuat canonical benar dan justru
menyembunyikan bahwa dua nilai lain masih salah.

Cacat ketiga dari akar yang sama, dan ini yang paling luput: karena
`localeFromPath('/work/x')` mengembalikan `null`, `og:locale` **selalu**
jatuh ke `en_US` — termasuk di seluruh halaman berbahasa Indonesia.

**Kerja:** jadikan kontrak `url` eksplisit sebagai localized path — URL yang
sama persis dengan yang disubmit `app/sitemap.ts`, invarian yang sudah
ditegaskan `lib/seo/alternates.ts` untuk canonical. Empat pemanggil
menghitung path itu (tiga di antaranya sudah punya locale-nya), template
scaffolding `lib/scripts/generate-page.ts` ikut diperbaiki, dan invariannya
dikunci unit test — bukan diperbaiki lalu dibiarkan bisa balik lagi.

---

## 4. Cacat C — `/en/ai` dan `/id/ai` mengaku sebagai `/ai`

Ini yang ditemukan sweep, bukan mata.

```html
<!-- di /en/ai DAN di /id/ai, sama persis -->
<link rel="canonical" href="https://arth.studio/ai" />
```

`https://arth.studio/ai` bukan rute yang dilayani aplikasi ini —
`localePrefix` adalah 'always', jadi alamat itu hanya redirect. Canonical yang
menunjuk ke URL yang tidak ada lebih buruk daripada tidak ada canonical sama
sekali. `og:url`-nya lebih parah lagi: karena halaman ini tidak menyetel
sendiri, ia mewarisi milik layout, sehingga machine view mengaku **halaman
depan**.

Penyebabnya struktural, bukan salah ketik: `app/[locale]/ai/page.tsx` memakai
`export const metadata` — objek **statis**. Objek statis tidak bisa membaca
locale, jadi rute ini tidak mungkin benar dalam bentuk itu. Diubah jadi
`generateMetadata()` yang membaca `next/root-params`, lalu lewat helper yang
sama seperti rute lain.

---

## 5. Cacat D — dua permukaan mesin mengiklankan URL yang hanya redirect

`/llms.txt` dan `/ai` mendaftar tiap karya sebagai:

```
- [Rimbun](https://arth.studio/work/rimbun)
```

`getCmsRoutes()` mengembalikan **template** bebas-locale, karena satu slug
dipakai kedua bahasa. `app/sitemap.ts` sudah tahu itu dan mengembangkannya per
locale — komentarnya bahkan menyatakan alasannya: _"Emitting the bare template
instead would submit a URL that only ever redirects."_ Dua permukaan
saudaranya tidak ikut diperbaiki saat Tahap 0.

Akibatnya bukan 404 — `/work/rimbun` menjawab 307 ke locale yang cocok dengan
`Accept-Language` peminta. Tapi crawler yang tidak mengikuti redirect, atau
yang mencatat URL sebelum redirect, menyimpan alamat yang tidak ada di sitemap
mana pun dan bukan canonical halaman mana pun — di dua permukaan yang seluruh
tugasnya justru menyerahkan alamat kanonik kepada mesin.

Perbaikannya bukan menyalin ekspansi sitemap ke dua tempat lagi:
`localizedContentRoutes()` diangkat ke `lib/seo/routes.ts` dan ketiganya
memakainya. Tiga surface, satu ekspansi.

---

## 6. Dokumen handoff

`docs/DEPLOYMENT.md` sudah ada dan sudah lengkap (env, Vercel, CORS,
webhook, VPS, checklist pra-luncur). Yang **tidak** ada adalah dokumen untuk
orang yang tidak akan pernah membuka terminal.

Kriteria keluarnya berbunyi: _"studio bisa menambah karya tanpa bantuan
saya."_ Itu bukan kriteria deploy, itu kriteria dokumentasi — dan
`DEPLOYMENT.md` tidak memenuhinya, karena ditulis untuk orang yang men-deploy.

| Dokumen                  | Pembaca              | Bahasa    |
| ------------------------ | -------------------- | --------- |
| `docs/DEPLOYMENT.md`     | yang men-deploy      | Inggris   |
| `PROD-README.md`         | developer berikutnya | Inggris   |
| `docs/PANDUAN-STUDIO.md` | **seniman/studio**   | Indonesia |

`PROD-README.md` sekarang masih literal `# [PROJECT NAME]` — placeholder
starter yang tidak pernah diisi.

`docs/PANDUAN-STUDIO.md` ditulis dari struktur skema yang benar-benar ada di
`lib/integrations/sanity/schemas/`, field demi field, termasuk yang mudah
salah: dua bahasa per field, slug yang tidak boleh diubah setelah terbit,
dan alt text yang wajib.

---

## 7. Yang hanya bisa dilakukan pemilik akun

Ditulis sebagai langkah, bukan sebagai "sudah beres":

1. Vercel: import repo, set env `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_SANITY_PROJECT_ID`,
   `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_WRITE_TOKEN` (role **Viewer**),
   `SANITY_REVALIDATE_SECRET` — untuk Production **dan** Preview.
2. Sanity CORS: tambahkan domain produksi dan domain preview, centang
   _Allow credentials_.
3. Webhook publish → `POST /api/revalidate` dengan secret yang sama.
4. Rotasi token: token yang pernah ditempel di chat harus dicabut sebelum
   luncur. **Atas permintaan eksplisit, ini belum dilakukan** — sesi masih
   berjalan dan token yang sama masih dipakai untuk seed fixture. Tetap
   tercatat sebagai item wajib di checklist pra-luncur.

---

## 8. Verifikasi

Selain empat gate wajib (`check`, `build`, `test:e2e`, `build-storybook`),
tahap ini memeriksa HTML yang benar-benar terkirim:

```bash
NEXT_PUBLIC_BASE_URL=https://arth.studio bun run build
```

lalu, terhadap `next start`:

- `og:url` **identik** dengan `<link rel="canonical">` di `/en` dan `/id`,
  di home maupun halaman karya
- `og:locale` = `id_ID` di rute `/id`, `en_US` di rute `/en`
- `og:site_name`, `<title>` default, `og:image:alt` tidak lagi memuat "Satūs"
- `manifest.webmanifest` `name`/`short_name` = nama studio
- `sitemap.xml`, `robots.txt`, hreflang, canonical semuanya di domain nyata
- kartu OG dibuka sebagai gambar dan **dilihat**, bukan hanya dicek ada

Yang terakhir itu bukan formalitas: ini tahap yang cacat utamanya adalah
sebuah gambar, dan tidak ada gate yang bisa melihat gambar.

---

## 9. Kriteria keluar

| Kriteria roadmap                       | Status                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------- |
| preview deploy hijau                   | ❌ **tidak diverifikasi** — tidak ada kredensial Vercel di kontainer ini. Lihat §0.   |
| sitemap & robots benar di domain nyata | ✅ terverifikasi terhadap build `https://arth.studio`, 10/10 rute (§1)                |
| studio bisa menambah karya tanpa saya  | ⚠️ dokumennya ada dan lengkap; **belum diuji oleh studio** — itu ujiannya, bukan saya |

Kriteria pertama tidak boleh dibaca sebagai "gagal". Yang bisa dikerjakan dari
sini sudah dikerjakan, dan semua yang biasanya membuat preview deploy merah —
build error, env var kurang, canonical `localhost` — sudah diperiksa lewat
jalur yang sama persis. Yang tidak bisa dilakukan adalah menekan tombolnya.

Kriteria ketiga sengaja ditandai kuning. Sebuah panduan hanya terbukti kalau
ada orang yang belum pernah memakai Sanity berhasil mengikutinya sampai
selesai. Sampai itu terjadi, yang jujur dikatakan adalah "dokumennya ada",
bukan "kriterianya terpenuhi".

---

## 10. Yang tidak dikerjakan, dinyatakan eksplisit

1. **Preview deploy Vercel** — §0 dan §9.
2. **Rotasi kredensial Sanity.** Token yang dipakai selama pengembangan
   write-capable dan pernah ditempel di chat. Atas permintaan eksplisit, ini
   **belum** dilakukan karena sesi masih berjalan dan token yang sama masih
   dipakai untuk seed fixture. Sudah masuk checklist pra-luncur
   (`docs/DEPLOYMENT.md` §6) sebagai item wajib, lengkap dengan langkahnya.
3. **`bun run handoff` tidak dijalankan** — §2. Skrip itu menghapus kredit
   darkroom.engineering dari footer, dan lisensi MIT Satūs meminta notice-nya
   dipertahankan.
4. **`setup:lean` / integration-bundles belum diuji ulang.** Path-nya masih
   menunjuk `app/[locale]/` sejak restrukturisasi Tahap 0. Path-nya sudah
   diperbaiki di tahap ini, tetapi operasi AST-nya belum dijalankan terhadap
   layout yang sekarang. Ini tooling starter, bukan permukaan situs — dicatat
   di `PROD-README.md` sebagai tidak dijaga CI.
5. **Fixture masih hidup di dataset.** Tiga karya (`fixture-*`) sengaja
   dibiarkan supaya situsnya bisa dilihat. Hapus dengan
   `bun --env-file .env.local lib/scripts/seed-fixtures.ts --clean`.
6. **`theme_color` manifest memakai `oklch()`.** Valid CSS, tetapi parser
   manifest browser lama mungkin mengabaikannya dan jatuh ke default. Tidak
   diubah: menggantinya berarti menulis hex dengan tangan, yang dilarang
   `CLAUDE.md` #10. Dampaknya kosmetik — warna address bar Android.
