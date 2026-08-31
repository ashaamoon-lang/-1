# TAHAP 9 — Gate yang bisa gagal

Stage-spec yang diwajibkan `docs/ROADMAP.md` §3.0. Isinya Tier 3 dan Tier 4
`docs/AUDIT-2026-08.md`.

Tahap-tahap sebelumnya memperbaiki cacat lalu menambahkan gate yang
menangkapnya. Tahap ini membalik urutannya: **memasang kelas gate yang belum
pernah ada sama sekali**, lalu memperbaiki apa pun yang mereka temukan.

Empat kelas, dan tiap-tiapnya buta terhadap sesuatu yang berbeda:

| Kelas gate             | Yang tidak pernah dilihat siapa pun sebelumnya         |
| ---------------------- | ------------------------------------------------------ |
| CSS yang kita tulis    | aturan motion #1–#4 dan #8 — nol penegakan otomatis    |
| Header respons         | `Cache-Control` di kelas rute mana pun                 |
| Tanpa JavaScript       | apa yang dilihat crawler yang tidak mengeksekusi skrip |
| Anggaran byte per rute | pustaka yang masuk lewat `import()` setelah hidrasi    |

---

## 1. Temuan terbesar tahap ini bukan di daftar audit

`docs/AUDIT-2026-08.md` §2.6 mencatat `/en` dan `/en/work/*` hanya menampilkan
"Loading" tanpa JavaScript. Diukur ulang di sini, cakupannya lebih luas:
**setiap** halaman yang lewat `<Wrapper>` — header dan footernya sekalian.

```
js=true   /en             chars=1073   js=false  /en             chars=28
js=true   /en/work        chars= 513   js=false  /en/work        chars=28
js=true   /en/work/rimbun chars= 498   js=false  /en/work/rimbun chars=28
js=true   /en/ai          chars=1763   js=false  /en/ai          chars=1763
```

`/en/ai` selamat karena ia satu-satunya rute yang tidak memakai `<Wrapper>`.

**Penyebabnya satu file di tempat yang salah.** `app/[locale]/loading.tsx`
memasang Suspense boundary pada **seluruh** segmen `[locale]`, termasuk rute
yang tidak membaca data request sama sekali. Isinya ada di HTML, di dalam
`<div hidden>` yang hanya bisa ditukar oleh skrip inline `$RC`.

Dibuktikan dengan menghapusnya: build gagal, dan pesannya menunjuk persis rute
yang memang butuh — `/[locale]/work`, yang membaca `searchParams`. Jadi
boundary-nya diturunkan ke empat segmen yang benar-benar memerlukannya
(`work`, `work/[slug]`, `articles/[slug]`, `[...slug]`), dan `RouteLoading`
jadi satu komponen bersama alih-alih empat salinan.

Hasilnya beranda **28 → 1073 karakter**, identik dengan versi ber-JS. Itu
kriteria keluar roadmap §1.5 yang selama ini lolos hanya karena datasetnya
kosong.

**Yang tetap tidak terbaca tanpa JS, dan kenapa:** `/[locale]/work` membaca
`searchParams` dan halaman proyek membaca `draftMode()`. Keduanya data request
menurut definisi, jadi keduanya tetap memerlukan boundary. Tidak ada yang
hilang dari penemuan: tiap karya terdaftar sendiri di `sitemap.xml`. Opsi
menghapus batasan ini sepenuhnya dibahas di §6.

---

## 2. Gate CSS — 14 file melanggar, dan bentuk pertamanya salah

Aturan motion `CLAUDE.md` #1–#4 dan #8 tidak pernah punya penegak. `bun run
check` menjalankan oxlint, oxfmt, tsc, unit test, dan manifest; tidak satu pun
membaca CSS. Roadmap §1.5 bahkan menuliskan aturan token sebagai
"(ditegakkan saat review)" — cara lain untuk mengatakan: ditegakkan oleh
siapa pun yang ingat.

Tidak ada yang ingat. Jalan pertama gate ini menemukan pelanggaran di **14
file**: `ease` telanjang pada CTA 404, literal `150ms`/`200ms` di sepuluh
pembungkus Base UI, dan tiga transisi yang menganimasikan properti layout.
Audit hanya menemukan dua, karena ia membaca CSS **terkirim** — dan sebagian
besar komponen itu belum dipakai rute mana pun.

**Bentuk pertama gate-nya salah, dan itu bagian dari catatannya.** Memindai
`.next/static/chunks/*.css` menandai 7 pelanggaran milik Sanity Studio — 170
KB CSS pihak ketiga dengan konvensinya sendiri, yang bukan wewenang kita.
Aturan tentang apa yang **kita tulis** harus memeriksa apa yang kita tulis.

**Pintu keluarnya eksplisit.** Sebuah deklarasi yang didahului
`/* motion-exempt: <alasan> */` diloloskan — bentuk yang sama dengan komentar
`// cache-exempt:` di `lib/integrations/cache-invariant.test.ts`. Satu-satunya
yang memakainya: `height` pada accordion (perilaku sebuah disclosure widget
memang perubahan tinggi) dan `transition-duration: 0.01ms` pada kill switch
reduced-motion (token justru akan merusaknya).

Dua yang tidak diberi pengecualian melainkan diperbaiki:

- **Indikator tab** `left`/`width` → `translate`/`scale`, memakai
  `--active-tab-left`/`--active-tab-width` yang sudah diterbitkan Base UI.
- **Ring kursor** `width`/`height` → `scale`, dengan `@property --ring-scale`
  supaya lebar bordernya ikut ter-interpolasi dan garisnya tetap setipis satu
  piksel di setiap ukuran.

Token yang hilang ditambahkan: `--duration-micro`, `--stagger-words`,
`--stagger-cards`, `--reveal-duration`.

---

## 3. Header respons — tidak pernah dibaca satu gate pun

`e2e/response-headers.e2e.ts` menegaskan per **kelas rute**, bukan per URL,
karena kelasnyalah keputusannya: halaman prerender boleh di-cache keras,
halaman yang membaca data request tidak boleh, dan aset ber-hash konten
bersifat immutable menurut konstruksinya.

Yang ditemukan: `/icon.png` dan `/opengraph-image.png` dikirim
`max-age=0, must-revalidate` — satu round trip penuh per navigasi untuk berkas
yang byte-nya hanya berubah saat build berubah. Diperbaiki dengan
`max-age=86400, stale-while-revalidate=604800`; **bukan** `immutable`, karena
URL-nya stabil antar-build dan `bun run brand:assets` memang menulis ulang
berkas yang sama.

---

## 4. Anggaran byte — dan kenapa prefetch harus diblokir

Tahap 5 menganggarkan dengan menghitung tag `<script src>` di HTML. Dua pustaka
tiba **setelah** hidrasi lewat `import()` dan tidak terlihat oleh metode itu.

Gate barunya menunggu jaringan tenang lalu menimbang apa yang datang — dan
memblokir prefetch, karena Next menghangatkan rute tertaut. Selisihnya nyata
dan terukur:

```
/en/work   prefetch aktif  914 KB  (gsap terdeteksi)
/en/work   prefetch blokir 737 KB  (bersih)
```

Tanpa pemblokiran itu setiap rute akan terlihat seberat rute terberat yang
ditautkannya, dan gate-nya jadi tidak bermakna.

**Asersinya adalah daftar pustaka, bukan hanya angka.** Ambang byte bisa
dinaikkan; keputusan yang layak dijaga adalah _rute mana_ yang membayar
three.js, GSAP, dan klien Sanity. Dua di antaranya sudah diam-diam berhenti
berlaku:

- `<Wrapper>` meneruskan `syncScrollTrigger` tanpa syarat, jadi GSAP core
  (26,8 KB gzip) sampai ke `/en/work/*` yang tidak meng-opt-in ke `gsap`
  maupun `webgl` — bertentangan dengan doc comment `lib/features/index.tsx`
  sendiri.
- `<SanityLive>` mount setiap kali Sanity terkonfigurasi, jadi
  `@sanity/client` (21,7 KB) sampai ke `/en/ai`, rute yang komentarnya sendiri
  menyatakan "server-only end to end".

Keduanya sekarang mengikuti opt-in. `SanityLive` hanya di draft mode — dan
trade-nya dinyatakan di tempatnya: perubahan yang diterbitkan tidak lagi muncul
di tab yang sudah terbuka sampai navigasi berikutnya. Kesegaran sisi server
datang dari webhook yang memanggil `revalidateTag`, mekanisme yang berbeda dan
tetap bekerja.

`LenisScrollTriggerSync` juga masih memakai `next/dynamic` di module scope —
pola yang sama persis dengan cacat three.js Tahap 7, dan memerlukan perbaikan
yang sama: `import()` di dalam effect.

---

## 5. Sisa Tier 4

- **Blur placeholder akhirnya berupa karyanya.** `toImageSource` membangun
  ulang objeknya field demi field, jadi `lqip` yang sudah diambil query
  dibuang satu pemanggilan sebelum dibutuhkan. Sekarang 12 dari 12 gambar di
  halaman karya memakai `data:image/jpeg` asli, nol shimmer SVG generik —
  yang sebelumnya berkedip **putih** di depan lukisan pada ground nyaris
  hitam, dan animasinya terbukti tidak menganimasikan apa pun.
- **`fetchPriority="high"`** pada elemen LCP. Tahap 5 menambahkan `preload`
  dan komentarnya menyiratkan keduanya beres; terukur hanya `loading` yang
  berubah.
- **Judul soft-404.** Tiap URL tak dikenal merender `<title>Arth</title>`,
  dan penjaganya `toHaveTitle(/.+/)` — regex yang cocok dengan string tidak
  kosong mana pun dan karenanya tidak bisa gagal. `not-found.tsx` tidak bisa
  mengekspor metadata, jadi judulnya datang dari rute yang memanggil
  `notFound()`.
- **`/api/draft-mode/enable` tanpa rate limit** — menjaga sebuah kredensial,
  dan satu-satunya route handler tanpa pembatas.
- **`RESERVED_PATHS` masih mencadangkan `/sanity`**, rute tutorial yang
  dihapus Phase A, sekaligus **tidak** mencadangkan `/work`. Test-nya pun
  menegakkan aturan yang usang. Keduanya dibalik.
- **`@sanity/language-filter`** di `dependencies` dengan nol impor.
- **16 berkas** masih menunjuk `app/(site)/` atau `(examples)`.

---

## 6. Yang tidak dikerjakan, dinyatakan eksplisit

1. **`/work` dan halaman proyek tetap tidak terbaca tanpa JavaScript.**
   Keduanya membaca data request. Menghilangkannya butuh keputusan bentuk URL
   (`?discipline=` → segmen path) atau melepas preview draft — keduanya
   perubahan produk, bukan pekerjaan gate. Diangkat ke user sebagai opsi.
2. **Prosa `SITE` masih satu bahasa** — sisa Tahap 8, tidak disentuh di sini.
3. **93 export tak dirujuk** belum dibersihkan. Mayoritas adalah tipe hasil
   typegen dan internal skrip; menghapusnya butuh pemilahan satu per satu, dan
   sebuah gate yang salah pilah akan menghapus API publik `vault/`.
4. **`/studio` masih tanpa smoke test.** Sandbox ini tidak punya egress
   keluar, jadi test-nya akan gagal karena lingkungan, bukan karena kode.
5. **Angka performa tetap byte, bukan waktu.** Tidak ada latensi jaringan
   (TTFB 8–10 ms adalah localhost) dan tidak ada profiler CPU di kontainer ini.

## 7. Satu regresi yang menjelaskan tahap ini

Memperbaiki tanpa-JS membuat tiga test gagal, dan ketiganya benar-benar
gagal karena hal yang tepat:

1. **`e2e/agent-readiness.e2e.ts` — test karakterisasi.** Ia mencatat cacat
   28-karakter itu sebagai perilaku yang diketahui, dan menutup dirinya dengan
   instruksi: _"kalau ini mulai gagal karena halamannya render penuh tanpa
   skrip, itu kabar baik — hapus karakterisasinya dan kembalikan asersi
   aslinya."_ Persis itu yang terjadi. Diagnosisnya juga separuh salah — ia
   menyalahkan `defineLive` membaca `draftMode()`, padahal beranda sudah
   berhenti membacanya dua tahap sebelumnya — dan koreksi itu ikut ditulis.
2. **`e2e/not-found.e2e.ts`** — `getByText('Page not found')` kini cocok
   dengan `<title>` _dan_ `<p>`, karena judul soft-404 baru diperbaiki. Diberi
   scope.
3. **`route-sweep` gagal `color-contrast` di `/en` dan `/id`.**

Yang ketiga layak dibaca dua kali. Halaman itu **selalu** lulus sapuan axe —
karena isinya berada di dalam `<div hidden>`, jadi **axe memindai halaman yang
praktis kosong**. Klaim "axe bersih" untuk beranda sama berongganya dengan
klaim "terbaca tanpa JS", dan dari sebab yang sama persis.

Pelanggarannya sendiri transien: `use-reveal` memudarkan item lewat
IntersectionObserver, jadi elemen di bawah lipatan duduk di `opacity: 0` sampai
di-scroll, dan `page.goto` bisa mendarat di tengah fade. `settleReveals()`
sekarang menggulung halaman sampai habis sebelum memindai — yang membuat sapuan
itu untuk pertama kalinya benar-benar memeriksa konten di bawah lipatan.

Memperbaiki satu cacat membuat sebuah gate bermakna dan flaky dalam commit yang
sama. Itu bukan efek samping; itu bukti bahwa gate-nya dulu tidak mengukur
apa-apa.

---

## 8. Kriteria keluar

| Kriteria                                                    | Status                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------ |
| Tiap kelas cacat Tier 3 punya gate yang terbukti bisa merah | ✅ empat kelas: CSS, header, tanpa-JS, anggaran byte         |
| Beranda terbaca tanpa JavaScript                            | ✅ 28 → 1073 karakter, kedua locale                          |
| Nol pelanggaran aturan motion di CSS yang kita tulis        | ✅ 14 file diperbaiki, 2 dikecualikan dengan alasan tertulis |

**Keluar:** `bun run check` (384 test) · `bun run build` · `build-storybook` ·
`CI=true bun run test:e2e` (**174 lulus**, dua project).
