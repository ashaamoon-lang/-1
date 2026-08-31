# TAHAP 10 — Menutup yang tersisa

Stage-spec yang diwajibkan `docs/ROADMAP.md` §3.0.

Roadmap habis di Tahap 9, tetapi tiga hal ditinggalkan bertanda ⚠️ atau
dinyatakan eksplisit sebagai belum dikerjakan. Tahap ini menutup ketiganya,
lalu menutup yang keempat juga — setelah keputusan awal untuk **tidak**
menutupnya terbukti salah oleh error build, dan dibalik. §1.4 menyimpan
kedua-duanya.

| Yang tersisa                                         | Dari              |
| ---------------------------------------------------- | ----------------- |
| "nol prosa Inggris di `/id`" baru terpenuhi separuh  | Tahap 8 ⚠️        |
| Halaman proyek tidak terbaca tanpa JavaScript        | Tahap 9 §6        |
| Tipe dokumen yang dilihat editor tapi tidak dirender | Audit Tier 4      |
| Bentuk URL filter `/work`                            | **diubah** — §1.4 |

---

## 1. Keputusan, sebelum kodenya

Empat keputusan diambil sendiri karena user memintanya begitu. Masing-masing
dengan alasan yang bisa dibantah, bukan preferensi.

### 1.1 Prosa `SITE` dilokalkan — **ya**

Ini satu-satunya kriteria keluar yang masih ⚠️. `/id/ai` dan `/id/llms.txt`
menyajikan kalimat Inggris di bawah `lang="id-ID"`, dan keduanya ada di
sitemap — jadi mesin jawaban meng-index dua dokumen sebagai dua bahasa
padahal isinya sebagian sama.

Yang **tidak** dilokalkan, dan itu disengaja: nama studio, URL, surel, dan
`sameAs`. Nama diri tidak diterjemahkan; WCAG 3.1.2 mengecualikannya.

### 1.2 Halaman proyek jadi statis — **ya**, dan preview draft dilepas

Ini keputusan yang paling mahal, jadi alasannya harus eksplisit.

`app/[locale]/work/[slug]/page.tsx` membaca `draftMode()`. Konsekuensinya dua,
dan keduanya terukur:

- tanpa JavaScript halamannya menampilkan 28 karakter (Tahap 9 §1);
- header responsnya `no-store` — setiap tampilan memukul origin, di kelas
  halaman yang paling mungkin dibagikan (audit Tier 1 §perf 4).

Komentar di `app/[locale]/page.tsx` membenarkan ini dengan mengatakan rute
proyek "dynamic (◐) by nature and lose nothing". Tahap 9 membuktikan kalimat
itu salah: yang hilang adalah keterbacaan tanpa JS **dan** cache edge.

Yang dibayar: Presentation tidak lagi mem-preview _draft_ halaman proyek.
Yang perlu ditimbang jujur — itu memang guna utama Presentation bagi seorang
editor. Tiga hal membuat timbangannya tetap condong:

1. **`docs/PANDUAN-STUDIO.md` tidak pernah menyebut preview.** Alur yang
   diajarkan ke studio adalah: isi, Publish, situs berubah dalam hitungan
   detik lewat webhook. Fitur yang tidak diajarkan tidak sedang dipakai.
2. **`docs/DEPLOYMENT.md` menandai tokennya "Recommended", bukan "Required".**
   Draft mode sudah diposisikan sebagai opsional sejak awal.
3. **Beranda sudah melakukan trade yang sama di Tahap 3**, dengan alasan yang
   identik. Membiarkan halaman proyek berbeda berarti dua aturan untuk satu
   pertanyaan.

Preview lewat publish tetap ada dan tetap cepat. Preview draft yang hilang.

### 1.3 `article` dan `navigation` dibuang — **ya**; `page` **tetap**

Bukan sapuan rata, karena ketiganya tidak setara:

- **`article`** adalah tipe blog di situs studio karya pesanan. Roadmap §1.1
  tidak pernah merencanakan rute artikel, dan begitu editor membuat satu,
  halamannya terbit beserta entri sitemap yang tidak diminta siapa pun.
  Dibuang, bersama rute `app/[locale]/articles/`.
- **`navigation`** dirender **nol** tempat. Editor mengisinya — judul, tautan
  sosial, logo — dan tidak ada yang berubah. Itu mode kegagalan paling
  membingungkan yang bisa dialami orang non-teknis. Dibuang.
- **`page` tetap.** Ia menopang `[...slug]`, yang juga penangan 404
  in-chrome, dan memberi studio cara menambahkan halaman berdiri sendiri
  (kebijakan privasi, syarat) tanpa deploy. Membuangnya menghapus kemampuan;
  yang salah selama ini bukan keberadaannya melainkan bahwa ia **tidak
  dijelaskan** di panduan. Itu yang diperbaiki.

### 1.4 Bentuk URL filter `/work` — **diubah**, setelah keputusan awal dibalik

Keputusan pertama di dokumen ini adalah **tidak** mengubahnya, dengan tiga
alasan yang ditulis lengkap. Keputusan itu dibalik. Alasannya ditinggalkan di
sini apa adanya, karena cara ia salah lebih berguna daripada kesimpulannya:

> 1. Empat halaman nyaris duplikat masing-masing butuh canonical dan hreflang
>    sendiri, dan mengencerkan satu halaman katalog kanonik di pencarian.
> 2. Query string adalah bentuk konvensional untuk filter; guideline Deep
>    Linking skill sudah terpenuhi oleh keduanya.
> 3. Tiap karya sudah terdaftar sendiri di `sitemap.xml`, jadi tidak ada yang
>    hilang dari penemuan — hanya halaman indeksnya yang butuh JS.

Yang membalikkannya adalah dua **error build**, bukan pendapat:

```
Error: Route "/[locale]/work": Next.js encountered uncached or runtime data
during prerendering. `searchParams` accessed outside of <Suspense> prevents
the route from being prerendered.

Error: Route segment config "dynamic" is not compatible with
nextConfig.cacheComponents. Please remove it.
```

Jadi di bawah `cacheComponents`, rute yang membaca query string **wajib**
menaruh isinya di balik `<Suspense>`, dan isi di balik Suspense hanya sampai
ke pembaca lewat skrip inline. Yang terukur di situs terbangun:

```
/en/work  (JS mati)  ->  judul, paragraf, kata "Loading". Nol tautan karya.
```

Kalimat ketiga di kutipan di atas — "hanya halaman indeksnya yang butuh JS" —
ternyata menggambarkan kerusakan, bukan meremehkannya. `lib/seo/site.ts`
menyuruh setiap agen membuka `/en/work`; mesin jawaban yang mengambilnya lewat
HTTP biasa menemukan katalog kosong. Itu persis cacat yang dicatat
`docs/AUDIT-2026-08.md` §2.1 dan yang seharusnya ditutup Tahap 8.

Alasan pertama juga tidak bertahan: `/work/discipline/mural` bukan duplikat
`/work` — ia punya `<h1>`, deskripsi, dan canonical sendiri, dan justru
halaman yang pantas muncul untuk pencarian "mural pesanan". Tiga halaman
indeks tambahan per bahasa adalah **aset**, bukan pengenceran.

Yang dibayar: satu slug jadi terlarang. `/work/discipline/<value>` dan
`/work/<slug>` berbagi induk, dan Next mencocokkan segmen statis lebih dulu —
jadi karya ber-slug `discipline` tidak akan pernah bisa dibuka, tanpa error di
mana pun. Tiga tempat menegakkan larangannya supaya tidak bergantung pada
ingatan: validasi slug di `schemas/project.ts` (ditolak saat Publish),
`generateStaticParams` di `work/[slug]`, dan `notFound()` di rute yang sama.
`docs/PANDUAN-STUDIO.md` §6b menjelaskannya untuk studio.

---

## 2. Bentuk lokalisasi `SiteFacts`

Field prosa berubah dari `string` menjadi `Record<Locale, string>`, dibaca
lewat satu helper. Yang menentukan bentuknya: **`SITE` dibaca dari tempat yang
tidak punya locale.**

`app/manifest.ts` adalah rute tunggal tanpa prefix locale, dan `/llms.txt`
adalah path tak berlokal secara konvensi — justru konvensi itulah gunanya.
Jadi `siteFacts()` menerima locale opsional dan jatuh ke
`routing.defaultLocale`, bukan melemparkan error: permukaan yang tidak
berlokal itu sah.

Satu permukaan yang semula direncanakan ikut memakai default ternyata tidak
perlu: `lib/seo/markdown-document.ts` **menurunkan** locale-nya dari path yang
diminta (`localeFromPath`). Permintaan ke `/id/work.md` sudah menyatakan
bahasanya di URL; jatuh ke default di situ akan menyajikan dokumen Inggris
untuk alamat Indonesia.

Yang juga ikut dilokalkan, dan tidak ada di rencana awal: `label` dan
`description` di `lib/seo/route-catalog.ts`. Tanpa itu `/id/ai` jadi halaman
Indonesia yang mendaftar deskripsi berbahasa Inggris untuk halamannya
sendiri — separuh masalah yang sama, satu lapis lebih dalam. Tiap tautan di
sana sekarang juga membawa `hrefLang`, jadi agen yang mengambil `/id/ai` tetap
menemukan katalog Inggris dan tahu itu bahasa apa.

---

## 3. Gate

Tiap perbaikan datang dengan gate, dan tiap gate **dibuktikan merah dulu**
terhadap kode lama sebelum perbaikannya masuk.

| Gate                                                   | Bukti merah                                                           |
| ------------------------------------------------------ | --------------------------------------------------------------------- |
| `e2e/no-javascript.e2e.ts` — katalog + halaman proyek  | 6 gagal pada bentuk rute lama; halaman proyek terbaca **28 karakter** |
| `e2e/response-headers.e2e.ts` — proyek wajib cacheable | `no-store` sebelum `draftMode()` dilepas                              |
| `e2e/promises.e2e.ts` — prosa entitas per bahasa       | 2 gagal saat `siteFacts()` dibuat mengabaikan locale                  |
| `schemas/schema-coverage.test.ts` — tipe tanpa query   | gagal saat tipe dokumen tanpa query didaftarkan ulang                 |

Yang diperiksa gate no-JS bukan panjang teks saja melainkan **tautan karya**:
sebuah fallback Suspense yang kebetulan panjang akan lolos pemeriksaan
panjang sambil tetap tidak menampilkan satu karya pun. Untuk halaman
disiplin, yang diperiksa adalah `aria-current` pada chip yang benar — bukti
bahwa keadaan filter datang dari rute, bukan dari efek di klien.

### 3b. Yang berubah di gate lama, dan kenapa

Dua tes lama gagal setelah perubahan ini. Keduanya gagal karena **perilakunya
membaik**, dan keduanya diperbarui, bukan dilonggarkan:

- `canonical-sweep` menyaring URL dengan `path.includes('/work/')`, yang
  sekarang ikut menangkap `/work/discipline/mural`. Halaman disiplin memang
  memakai kartu OG situs — ia tidak punya sampul sendiri — jadi saringannya
  yang diperbaiki.
- `project-detail` mendokumentasikan slug tak dikenal sebagai **200 +
  noindex**, karena dulu memang selalu begitu. Sekarang tidak lagi selalu.
  Terukur pada `next start` yang bersih:

  | Permintaan                       | Status |
  | -------------------------------- | ------ |
  | slug yang belum pernah diminta   | `200`  |
  | slug yang sama, sesudah di-cache | `404`  |

  Shell statis di-flush sebelum lookup selesai, jadi permintaan pertama
  tetap 200; sesudah entri miss tersimpan, rutenya tahu jawabannya sebelum
  menjawab. Tesnya sekarang menuntut **keduanya**: `noindex` selalu ada, dan
  URL-nya harus **mengendap** jadi 404 (dipoll, karena penulisan cache-nya
  asinkron dan dua project Playwright meminta URL yang sama bersamaan).
  Sebelum Tahap 10 assertion kedua ini tidak akan pernah lulus.

## 4. Kriteria keluar

| Kriteria                                             | Status | Bukti                                                                |
| ---------------------------------------------------- | ------ | -------------------------------------------------------------------- |
| Nol prosa Inggris di rute `/id`                      | ✅     | `description`, `knowsAbout`, `areaServed`, panduan agen, label rute  |
| Halaman proyek terbaca tanpa JavaScript              | ✅     | 28 → 498 karakter; identik dengan render ber-JS                      |
| Katalog `/work` terbaca tanpa JavaScript             | ✅     | "Loading" tanpa karya → 513 karakter + 6 tautan karya                |
| Halaman proyek cacheable, bukan `no-store`           | ✅     | `s-maxage=31536000` di `/work`, `/work/discipline/*`, `/work/[slug]` |
| Tiap tipe dokumen di Studio dirender di suatu tempat | ✅     | `article` + `navigation` dibuang; gate menahan yang berikutnya       |

### Angka sebelum → sesudah

| Ukuran                          | Sebelum                   | Sesudah               |
| ------------------------------- | ------------------------- | --------------------- |
| `/en/work/rimbun` tanpa JS      | 28 karakter               | 498 karakter          |
| `/en/work` tanpa JS             | judul + "Loading"         | 513 karakter, 6 karya |
| `Cache-Control` halaman proyek  | `no-store`                | `s-maxage=31536000`   |
| `Cache-Control` `/en/work`      | `no-store`                | `s-maxage=31536000`   |
| Halaman indeks dapat di-index   | 2 (`/en/work`,`/id/work`) | 8                     |
| Tipe dokumen tanpa jalur render | 2                         | 0                     |
| Tes e2e                         | 174                       | 189                   |
| Tes unit                        | 384                       | 385                   |

## 5. Yang **tidak** dikerjakan, dinyatakan terbuka

1. **Permintaan pertama ke slug tak dikenal tetap `200`.** Ini batas model
   streaming Cache Components, bukan sesuatu yang bisa ditutup di kode rute.
   Yang dibaca crawler — `noindex` — selalu ada, dan permintaan berikutnya
   `404`. Diukur, bukan diasumsikan (§3b).
2. **Build sekarang bergantung pada Sanity yang bisa dihubungi.** Delapan
   rute diprerender dari CMS, jadi kegagalan jaringan sesaat menggagalkan
   seluruh build — terjadi sekali selama tahap ini (`HTTP 503 DNS resolution
failed`) dan lulus saat diulang. Ini konsekuensi langsung dari membuat
   halaman-halaman itu statis, dan trade yang disengaja.
3. **Belum ada profiling browser.** Tidak ada angka performa di dokumen ini
   yang berasal dari profiler; yang ada adalah header, ukuran bundel, dan
   jumlah karakter — semuanya terukur, tapi bukan Core Web Vitals.
4. **Kredensial Sanity belum dirotasi**, atas permintaan eksplisit user.
   Tetap tercatat di checklist pra-luncur `docs/DEPLOYMENT.md`.
