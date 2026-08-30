# TAHAP 4 — Detail proyek

Stage-spec yang diwajibkan `docs/ROADMAP.md` §3.0. Tidak ada kode ditulis
sebelum dokumen ini ada.

**Prasyarat:** Tahap 3 selesai — home single page, `ProjectCard`/`ProjectGrid`
sudah ada dan sudah pada skala tipografi terkunci, `sections` sudah menjadi
prop `Wrapper`.

---

## 0. Kriteria keluarnya menuntut data yang tidak ada

Roadmap menetapkan tiga kriteria keluar, dan **dua di antaranya mustahil
dipenuhi dengan dataset kosong**:

> _"e2e untuk slug nyata di kedua bahasa · sitemap memuat semua proyek × 2
> locale · 404 benar untuk slug tak dikenal."_

Dataset produksi hari ini: **0 proyek** (diukur di `TAHAP-3.md` §0, diperiksa
ulang di awal tahap ini). Tanpa satu pun proyek terbit, tidak ada slug nyata
untuk diuji dan tidak ada baris proyek di sitemap untuk diperiksa.

Tahap 3 menolak mengisi CMS asli studio dengan karya karangan, dan penolakan
itu tetap berlaku. Yang berubah adalah **apa yang bisa dilakukan sebagai
gantinya**, karena Tahap 4 butuh verifikasi yang lebih kuat daripada Tahap 3:

| Pendekatan                                         | Putusan                                                                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Terbitkan karya karangan ke `production`, permanen | **Ditolak.** Sama seperti Tahap 3 — itu perpustakaan konten asli studio.                                           |
| Buat dataset `test` terpisah                       | **Ditolak untuk sekarang.** Menambah dataset adalah perubahan pada akun Sanity user yang tidak diminta.            |
| Fixture sementara: terbitkan → verifikasi → hapus  | **Dipilih.** Sudah dipakai sekali di sesi ini untuk membuktikan lokalisasi, dan CMS kembali persis seperti semula. |

Fixture-nya:

- ditulis oleh skrip yang bisa dijalankan ulang (`lib/scripts/seed-fixtures.ts`),
  bukan dengan tangan;
- memakai `_id` berawalan `fixture.` sehingga bisa dihapus semuanya dengan satu
  perintah, tanpa menyentuh dokumen lain;
- **dihapus di akhir**, termasuk aset gambarnya, sehingga `production` kembali
  ke 0 dokumen.

**Konsekuensi yang harus dinyatakan, bukan disembunyikan:** e2e detail proyek
yang di-commit **skip dengan pesan** ketika tidak ada proyek terbit — pola yang
sama dengan gate axe Storybook di Tahap 2. CI yang berjalan atas dataset kosong
akan melaporkan skip, bukan hijau palsu. Kriteria "e2e untuk slug nyata"
dipenuhi **di sesi ini, terhadap fixture nyata**, dan itu dicatat apa adanya.

---

## 1. Rute dan bentuk halaman

Sesuai roadmap §1.3:

```
Hero gambar sampul → Meta (klien, tahun, medium, dimensi)
                   → Deskripsi → Galeri → Proyek berikutnya
```

Rute: `app/[locale]/work/[slug]/page.tsx`.

**Kenapa `/work/` dan bukan catch-all `[...slug]`.** Catch-all yang ada
melayani dokumen `page`, dan slug proyek berbagi ruang nama yang sama dengan
slug halaman. Namespace sendiri berarti sebuah karya berjudul "About" tidak
pernah bisa menabrak halaman `/about` — kesalahan yang baru muncul berbulan-
bulan kemudian, saat editor kebetulan memilih nama yang salah.

`generateStaticParams` membaca `projectSlugsQuery`, yang **sengaja tidak
diparameterkan locale**: slug dipakai bersama kedua bahasa, jadi satu daftar
menghasilkan rute untuk keduanya.

---

## 2. Yang belum ada dan harus dibangun

| Kebutuhan                      | Status hari ini                                                         |
| ------------------------------ | ----------------------------------------------------------------------- |
| Rute `/work/[slug]`            | belum ada                                                               |
| Blok galeri                    | belum ada                                                               |
| Navigasi "proyek berikutnya"   | belum ada                                                               |
| `project` di sitemap           | **belum** — `routableContentQuery` hanya memuat `page` dan `article`    |
| `project` di `urlForReference` | **belum** — `resolveDocumentUrl` mengembalikan `#` dan mencatat warning |
| Metadata + hreflang per proyek | `routeAlternates()` sudah ada dan tinggal dipakai                       |
| OG image per proyek            | belum ada                                                               |

Dua baris bertanda **belum** adalah cacat nyata yang sudah ada sekarang, bukan
pekerjaan baru: sebuah link CMS yang menunjuk ke dokumen `project` hari ini
menghasilkan `#`. Diperbaiki di tahap ini karena tahap ini yang membuat rutenya
ada.

---

## 3. Proyek berikutnya — keputusan yang gampang salah

"Proyek berikutnya" harus **melingkar** dan mengikuti urutan kurasi yang sama
dengan grid (`order asc, publishedAt desc`), bukan urutan abjad dan bukan
urutan acak. Proyek terakhir menunjuk kembali ke yang pertama, sehingga tidak
ada jalan buntu.

Kalau hanya ada satu proyek, blok itu **tidak dirender**. Tautan "berikutnya"
yang menunjuk ke halaman yang sedang dibaca adalah jalan buntu yang menyamar.

Diuji sebagai unit test, tanpa jaringan.

---

## 4. Galeri

Gambar diam, jadi `SanityImage` + kotak ter-reserve sudah cukup — tidak ada
pipeline video, sesuai roadmap §1.3.

- Setiap gambar membawa `alt` terlokalisasi dari CMS (`gallery[].alt` sudah ada
  di skema dan sudah diproyeksikan di `projectQuery`).
- Tidak ada lightbox di tahap ini. Lightbox adalah dialog, fokus-trap, dan
  keyboard handling — itu pekerjaan tersendiri, dan galeri tanpa lightbox tetap
  berfungsi penuh.

---

## 5. Metadata, hreflang, OG

- `routeAlternates()` yang sudah ada dipakai apa adanya; ia sudah memancarkan
  `languages` + `x-default`.
- Canonical setiap halaman **harus identik** dengan URL yang disubmit sitemap —
  invarian yang ditegaskan `lib/seo/alternates.ts`. Karena `localePrefix`
  'always', bentuknya satu: `/en/work/<slug>`.
- OG image: `opengraph-image.tsx` per rute, memakai sampul proyek. Kalau proyek
  tidak punya sampul, jatuh ke gambar situs — bukan gambar kosong.

---

## 6. Urutan eksekusi

1. `resolveDocumentUrl` mengenal `project`; `routableContentQuery` memuatnya.
   **Unit test dulu**, karena keduanya memengaruhi sitemap dan `/llms.txt`.
2. Blok `project-gallery` + `next-project` di `vault/blocks/`, dengan story.
3. Rute `/[locale]/work/[slug]` — page, `generateStaticParams`, metadata, OG.
4. e2e: 404 untuk slug tak dikenal (bisa diuji tanpa data), plus spec detail
   yang skip ketika tidak ada proyek.
5. Skrip fixture: seed → verifikasi → screenshot → hapus.
6. Verifikasi penuh, lalu **lihat halamannya** — Tahap 3 §11 menunjukkan kenapa
   itu langkah tersendiri.

---

## 7. Kriteria keluar — status

| Kriteria                                      | Status                                          |
| --------------------------------------------- | ----------------------------------------------- |
| `bun run check`                               | ✅ 369 test lulus                               |
| `bun run build` · `build-storybook`           | ✅                                              |
| `CI=true bun run test:e2e`                    | ✅ 112 lulus                                    |
| 404 untuk slug tak dikenal, kedua locale      | ⚠️ **soft-404** — lihat §9.1                    |
| Sitemap memuat setiap proyek × 2 locale       | ✅ 6 entri terverifikasi terhadap fixture nyata |
| Detail dirender di kedua bahasa, gambar nyata | ✅ dilihat langsung pada 390px dan 1440px       |
| Nol pergeseran layout dari gambar galeri      | ❌ **klaim ini salah** — koreksi di bawah       |
| Nol nilai desain hardcode                     | ✅                                              |

> **Koreksi, ditambahkan di Tahap 5.**
>
> Baris "nol pergeseran layout" ditandai ✅ berdasarkan penalaran tentang kotak
> yang dipesan, bukan pengukuran. Ketika akhirnya diukur, CLS halaman proyek
> adalah **0.226** — gagal Core Web Vitals, yang menuntut ≤ 0.1. `max-height`
> pada elemen tergantikan membiarkan lebarnya tak tentu sampai berkas gambar
> termuat, jadi sampulnya menyusut dan memindahkan daftar meta, badan teks,
> galeri, dan blok proyek-berikutnya sekaligus.
>
> Penyebab dan perbaikannya ada di `TAHAP-5.md` §2. Barisnya dikoreksi di
> tempat alih-alih ditulis ulang seolah tidak pernah salah: kesalahannya ada
> pada **cara memverifikasi**, bukan pada kodenya, dan itu bagian yang perlu
> diingat.

## 8. Risiko

**Yang paling mungkin gagal: `generateStaticParams` + `cacheComponents`.**
Rute ini butuh daftar slug saat build. Dengan dataset kosong daftarnya kosong,
dan Next harus tetap membangun rutenya tanpa error — persis situasi yang
dihadapi hari ini. Kalau build gagal ketika tidak ada proyek, itu bug yang
hanya muncul di repo bersih, dan harus ditangani, bukan dihindari dengan
menaruh fixture permanen.

**Risiko kedua: fixture tertinggal.** Skrip seed harus punya perintah hapus
yang menghapus **dokumen dan asetnya**, dan penghapusan itu dijalankan tanpa
syarat di akhir. Aset gambar yang tertinggal di media library sama saja dengan
menaruh sampah di CMS orang.

---

## 9. Yang ditemukan saat eksekusi

### 9.1 "404 benar" tidak bisa berarti status 404 di arsitektur ini

Diukur: `/en/work/no-such-work` mengembalikan **200**, bukan 404 — dan begitu
juga `[...slug]` dan `articles/[slug]` yang sudah ada sejak lama. Cache
Components mem-flush status shell statis sebelum lubang dinamisnya selesai;
`notFound()` berjalan di dalam lubang itu, jadi baris statusnya sudah terkirim.

Yang benar-benar dibaca crawler tetap ada: penanda
`NEXT_HTTP_ERROR_FALLBACK;404` dan `<meta name="robots" content="noindex">`.
`e2e/not-found.e2e.ts` sudah mengukur dan mendokumentasikan hal yang sama
untuk rute lain; spec baru menegaskannya untuk `/work/[slug]`.

Ini dilaporkan sebagai **⚠️**, bukan ✅, karena kriterianya berbunyi "404
benar" dan yang tersedia adalah soft-404.

### 9.2 `generateStaticParams` tidak bisa hidup dengan dataset kosong

Roadmap memintanya. Next menolak build:

> When using Cache Components, all `generateStaticParams` functions must
> return at least one result.

Dengan nol proyek daftarnya kosong, jadi pilihannya adalah memprerender slug
karangan yang 404, atau mewajibkan CMS terisi sebelum repo bisa di-build.
Keduanya lebih buruk daripada menjadikan rute ini Partial Prerender (`◐`) —
persis seperti `[...slug]` dan `articles/[slug]`, yang keduanya juga tidak
mendeklarasikan static params. Sitemap tetap memuat setiap proyek, dan itu
yang sebenarnya dibutuhkan kriteria keluar.

### 9.3 Prefix locale ganda: setiap kartu karya menuju halaman not-found

`ProjectCard` dan `NextProject` membangun href dengan `localizedPath()`, lalu
`components/ui/link` menambahkan prefix **lagi** — hasilnya
`/en/en/work/panas-sore`. Path itu cocok dengan catch-all CMS, bukan rute
`/work`, jadi setiap kartu di grid menuju halaman not-found **berstatus 200**.
Tidak ada yang gagal: build hijau, test hijau, axe bersih.

Diperbaiki di dua tempat sekaligus, karena satu saja menyisakan jebakannya:
komponen sekarang mengirim template (`/work/<slug>`), dan
`isLocalizableHref()` menolak menambah prefix pada path yang sudah membawa
locale. Dijaga tiga unit test dan satu e2e.

### 9.4 Id berawalan titik membuat dokumen tidak terbit

Fixture pertama dibuat dengan `_id: "fixture.panas-sore"`. Sanity membaca id
bertitik sebagai `<namespace>.<id>` — bentuk yang sama dengan `drafts.<id>` —
dan memperlakukannya sebagai versi belum terbit. Hasilnya: dokumen terlihat
oleh permintaan bertoken dan tidak terlihat oleh siapa pun, jadi situs
merender 404 untuk proyek yang di Studio tampak terbit. Prefix diganti
`fixture-`.

### 9.5 Judul terlokalisasi menghapus setiap proyek dari sitemap

`routableContentQuery` memproyeksikan `title` mentah, dan `title` sebuah
`project` adalah `internationalizedArray`, bukan string. Skema zod-nya gagal,
dan karena entri di-skip satu per satu (memang disengaja), **semua** proyek
hilang dari sitemap dan `/llms.txt` tanpa satu pun error. Query sekarang
me-resolve judulnya dengan `select()`.

### 9.6 Halaman CMS tidak terbaca tanpa JavaScript — dan itu bukan baru

Ini temuan terbesar tahap ini.

Diukur dengan skrip dimatikan:

```
/en/ai              1659 karakter terlihat   (tanpa fetch CMS)
/en                   28 karakter terlihat   (fetch CMS)
/en/work/<slug>        7 karakter terlihat   (fetch CMS)
```

`<h1>` ada di DOM tapi tersembunyi. Penyebabnya bukan kode proyek ini:
`defineLive` milik `next-sanity` membaca `draftMode()`, yang di bawah Cache
Components adalah akses waktu-permintaan — jadi apa pun yang menunggunya
dirender di dalam boundary Suspense milik `loading.tsx`. React mengirim
kontennya di `<div hidden>` plus skrip pemindah; tanpa skrip, pemindahan itu
tidak pernah terjadi.

**Bukan regresi Tahap 4.** Diverifikasi dengan `git stash`: kode Tahap 3 apa
adanya, terhadap dataset yang sama, menghasilkan angka yang identik. Kriteria
keluar "tanpa JS home tetap terbaca" di Tahap 3 lulus **hanya karena
datasetnya kosong** — halamannya tidak punya apa pun untuk disembunyikan.

Tiga upaya perbaikan, semuanya dicoba dan diukur:

| Upaya                                      | Hasil                                                    |
| ------------------------------------------ | -------------------------------------------------------- |
| Hapus `draftMode()` dari call site home    | Tidak berubah — `defineLive` memanggilnya sendiri        |
| Pakai `createPublishedFetch` (tanpa draft) | Tidak berubah, dan kehilangan preview draft — dibatalkan |
| Hapus `loading.tsx`                        | **Build gagal** — `[...slug]` butuh boundary itu         |

Yang tersisa jujur untuk dilakukan adalah menuliskannya. `e2e/agent-readiness.e2e.ts`
sekarang berisi _characterization test_: ia menegaskan konten lengkap ada di
**byte respons** (yang dibaca crawler dan agen), dan bahwa peramban tanpa skrip
melihat keadaan loading. Kalau suatu saat perilakunya membaik, test itu gagal
dan memaksa dokumen ini diperbarui.

Yang **tidak** terdampak: crawler yang menjalankan JavaScript (Google, Bing),
dan seluruh permukaan agen yang memang dirancang repo ini — `/llms.txt`,
`/ai`, negosiasi Markdown.

Yang terdampak: orang yang menjelajah dengan skrip dimatikan. Itu penurunan
nyata, dan itulah sebabnya ditulis alih-alih diam-diam dihapus.

---

## 10. Fixture: dibiarkan hidup, bukan dihapus

§0 merencanakan seed → verifikasi → **hapus**. Yang dilakukan berbeda, dan
alasannya perlu dinyatakan: user meminta situsnya berjalan supaya bisa
diperiksa, dan menghapus fixture-nya membuat situs itu kosong lagi.

Jadi fixture-nya dibiarkan, dan keputusan menghapusnya diserahkan ke user
dengan satu perintah:

```bash
bun --env-file .env.local lib/scripts/seed-fixtures.ts --clean
```

Perintah itu menghapus **dokumen dan aset gambarnya** — media library kembali
kosong, bukan hanya daftar dokumennya. Isinya: 3 proyek dan 1 `studioSettings`,
semuanya ber-`_id` awalan `fixture-`.
