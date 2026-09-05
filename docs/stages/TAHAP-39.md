# Tahap 39 — Filter yang benar-benar memfilter, lalu `catalogue-sift`

> Rencana: Bagian II, Tahap 39. Dial yang dibelanjakan: **MOTION**.
> Prasyarat: Tahap 38 (navigasi) selesai — `e696788`.

---

## 0. Cacat A4, dan apa yang sebenarnya salah

Audit kurator §A4 menemukan empat hal di `/work`, dan keempatnya benar:

1. `vault/blocks/practice-filter` merender "All" + tiga chip yang **terlihat
   seperti filter** — sebuah `<nav>` berisi pil, dengan chip "All" dan
   `aria-current`.
2. Prop `active` **selalu `null`**, karena satu-satunya pemanggil
   (`app/[locale]/work/page.tsx`) menghardcode `practice={null}`. Jadi "All"
   permanen aktif dan **tidak ada chip yang pernah tampak terpilih**.
3. Menekan chip **meninggalkan katalog** menuju `/practice/<value>` — jenis
   halaman lain, dengan hero dan pernyataannya sendiri.
4. Cabang katalog terfilter di `catalogue.tsx` — `key={practice ?? 'all'}`,
   `t(\`${practice}Title\`)`, dan blok empty-state — adalah **kode mati**.

Sebuah kontrol yang tampak seperti filter, berperilaku seperti navigasi, dan
tidak pernah menunjukkan keadaan terpilih adalah kegagalan usability. Itu 30%
dari penilaian, dan lebih penting: ia berbohong kepada pembacanya.

---

## 1. Premis rencana ini salah, dan repo sudah mencatat alasannya dua kali

Rencana Tahap 39a menulis: _"`/work` memfilter di tempat… URL tetap dapat
di-bookmark (`?practice=` atau segmen)"_. Repo ini sudah menolak `?practice=`
**dua kali**, dengan pengukuran, dan saya menemukan keduanya baru saat menulis
spec ini — bukan saat menulis rencananya.

**Penolakan pertama, Tahap 10** (`app/[locale]/work/catalogue.tsx` baris
38–63). Dua galat build yang keduanya reproducible:

- `searchParams` di luar `<Suspense>` menggagalkan build di bawah
  `cacheComponents` — _"Next.js encountered uncached or runtime data during
  prerendering"_.
- `export const dynamic = 'force-dynamic'` juga ditolak — _"Route segment
  config \"dynamic\" is not compatible with `nextConfig.cacheComponents`"_.

Konsekuensinya: konten harus di belakang Suspense, dan konten di belakang
Suspense di-swap oleh skrip inline. Diukur waktu itu: **`/en/work` tanpa
JavaScript merender judulnya dan kata _Loading_, dan nol proyek.**

**Penolakan kedua, `e2e/response-headers.e2e.ts`** — dan ini bukan sekadar
catatan, ini gerbang, dengan komentarnya sendiri:

> _"The catalogue and its filter views. These were `no-store` until the route
> shape changed in Tahap 10 — the index because it read `searchParams`, so
> **listing them here is the assertion that the query string does not come
> back**."_

Jadi repo ini secara sadar memasang gerbang terhadap persis apa yang rencana
Tahap 39a minta saya bangun.

---

## 2. Pengukuran yang mengubah separuh jawabannya

Penolakan pertama berasal dari Tahap 10. Sejak itu Next 16.3 memperkenalkan
`export const instant = false` — mekanisme yang **berbeda** dari
`dynamic = 'force-dynamic'`, dan yang sudah dipakai proyek ini di
`app/[locale]/practice/[value]/page.tsx`. Mekanisme itu tidak ada saat Tahap 10
mengukur.

Jadi diukur ulang, bukan diasumsikan. `app/[locale]/work/page.tsx` diberi
`searchParams` + `instant = false`, dibangun produksi, dan dibaca dengan
JavaScript **dimatikan**:

| URL                            | karakter | `<h1>`           | tautan proyek |
| ------------------------------ | -------: | ---------------- | ------------: |
| `/en/work`                     |      813 | `Work`           |             6 |
| `/en/work?practice=consulting` |  **612** | **`Consulting`** |         **2** |
| `/en/work?practice=nonsense`   |      813 | `Work`           |             6 |

**Build lulus. Nol galat. Nol Suspense. Nol kata _Loading_.** Kegagalan
Tahap 10 **tidak reproduce** di bawah `instant = false`; cabang terfilter yang
selama ini kode mati merender dengan benar, termasuk judul dan pengantar
per-praktiknya, dan nilai tak dikenal jatuh ke katalog penuh alih-alih 404.

Penolakan **kedua** tetap berlaku sepenuhnya, dan juga diukur:

```
Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate
```

Rute pindah dari `○` (static) ke `ƒ` (dynamic). `s-maxage=31536000` hilang.

Percobaan ini **dibatalkan** setelah diukur; tidak ada satu barisnya yang
tersisa di pohon kerja. Yang tersisa adalah angkanya.

---

## 3. Keputusan, dan harganya ditulis di depan

**Dibangun: `?practice=` di `/work`, dengan `instant = false`.** Itu yang
rencana minta, dan satu-satunya keberatan historis yang masih berdiri sekarang
adalah header cache — bukan keterbacaan, yang sudah terbukti aman.

**Yang hilang, dikatakan terus terang, bukan dibungkus:** dua URL — `/en/work`
dan `/id/work` — berhenti bisa di-cache CDN. Setiap kunjungan merender di
server. Fetch Sanity-nya **tetap** `'use cache'`, jadi yang berulang adalah
render React-nya, bukan permintaan jaringannya.

**Yang tidak hilang:** ketiga `/practice/<value>` **tetap** halaman topik `○`
statis dengan hero, pernyataan, canonical, dan entri sitemap sendiri. Argumen
indexability Tahap 10 tidak tersentuh — halaman-halaman itu bukan permutasi
filter dan tidak pernah jadi permutasi filter.

**Gerbang `response-headers` tidak dibungkam, ia dipindahkan dengan alasan.**
`/en/work` dan `/id/work` keluar dari daftar "statically prerendered pages are
cacheable" dan masuk ke asersi barunya sendiri: rute itu boleh dinamis, tapi
**wajib** merender katalog lengkapnya tanpa JavaScript, terfilter maupun tidak.
Itu properti yang sebenarnya dijaga Tahap 10 — dan menguji properti itu
langsung lebih kuat daripada menguji proksi cache-nya.

**Ini keputusan yang bisa Anda batalkan.** Kalau dua URL yang tidak ter-cache
CDN terlalu mahal, bentuk alternatifnya ada dan lebih murah: chip berhenti
berpura-pura jadi filter dan dirender apa adanya — daftar tautan ke tiga
halaman topik, tanpa pil "All", tanpa `aria-current` — lalu `catalogue-sift`
dibangun sebagai koreografi kedatangan `<ViewTransition>` antar-tampilan
katalog alih-alih FLIP di tempat. Cacat A4 tetap tertutup; yang hilang hanya
penyaringan di tempat. Katakan dan saya kerjakan yang itu.

---

## 4. Yang dibangun

### 4a — filternya jadi filter

1. `/work` membaca `?practice=`, `instant = false`, tanpa `<Suspense>`.
2. Nilai tak dikenal → katalog penuh, bukan 404. `?practice=nonsense` bukan
   halaman yang hilang; ia permintaan yang tidak bisa dipenuhi, dan katalog
   penuh adalah jawaban yang benar (sudah terukur berperilaku begini di §2).
3. Chip menunjuk `/work?practice=<value>`; chip "All" menunjuk `/work`.
   Chip terpilih benar-benar `aria-current` — untuk pertama kalinya.
4. `/practice/<value>` **tetap ada, tidak berubah**. Ia halaman topik, bukan
   hasil filter — `docs/stages/TAHAP-15.md` §5.1, dan Tahap 38 baru saja
   memberinya breadcrumb dan jalan keluar. Ia mendapat satu tautan tambahan:
   dari chip praktik, ke katalog terfilter yang bersangkutan, supaya kedua
   bentuk itu saling terhubung alih-alih bersaing.
5. Cabang terfilter di `catalogue.tsx` berhenti jadi kode mati.

### 4b — `catalogue-sift`

Teknik FLIP, ditulis tangan dengan **WAAPI** (`element.animate()`): berjalan di
compositor, **tidak** menambah loop RAF (`CLAUDE.md` #6), **tidak** menambah
dependensi. GSAP `Flip` sengaja tidak dipakai — plugin Club, dan repo ini
memang tidak memuatnya.

1. **FIRST** — sebelum state berubah, `getBoundingClientRect()` tiap kartu yang
   bertahan → `Map<id, DOMRect>`.
2. **LAST** — React merender hasil; `useLayoutEffect` mengukur ulang.
3. **INVERT + PLAY** — tiap kartu bertahan dari `translate3d(dx, dy, 0)` ke
   identitas, **800ms** (`--duration-slow`), `--ease-in-out-quart` — kurva
   dengan **nol pemakaian** hari ini, dan satu-satunya kasus di mana `in-out`
   sah menurut `CLAUDE.md` #2: benda yang berangkat **dan** mendarat.
4. **Stagger menurut jarak, bukan indeks DOM** — penundaan =
   `--stagger-cards` × peringkat jarak, **terbalik**: yang bergerak terjauh
   berangkat lebih dulu sehingga seluruh kisi **mendarat bersamaan**. Stagger
   indeks membaca seperti daftar yang di-refresh; stagger jarak membaca seperti
   benda yang ditata ulang.
5. **Kartu keluar** — `opacity` 1→0 + `scale(0.98)`, **200ms**
   (`--duration-fast`) `--ease-out-quart`, mulai pada frame yang sama.
6. **Kartu masuk** — `opacity` 0→1 dengan `translate3d(0, var(--space-2xs), 0)`
   →0, **400ms** `--ease-out-quart`, ditunda sampai pergerakan selesai,
   **maksimal 8** kartu di-stagger (batas yang Tahap 26 ukur).
7. **Reduced motion:** potong. State baru langsung, nol FLIP, semua kartu
   `opacity: 1`, filter berfungsi identik.
8. **Larangan:** nol sentuhan pada `height` grid track. Parallax tiap kartu
   di-`pause()` selama transisi dan di-`refresh()` sesudahnya.
9. `data-epic="catalogue-sift"`; `MOTION-SPEC.md` §9.5 diperbarui — ini momen
   **kedua** `/work`, dan sisa anggarannya memang satu.

**Uji `taste-skill`** — _apa yang dikomunikasikan gerak ini?_ **Transisi
status.** Kisi yang sama, isi yang berbeda, dan gerak yang menunjukkan mana
yang bertahan. Bukan "kelihatan keren".

---

## 5. Gerbang

`e2e/catalogue-layout.e2e.ts`, diperluas — tiap asersi dibuktikan merah dulu:

1. **Chip terpilih benar-benar `aria-current`**, di-scope ke `nav` filter
   (bukan ke pengalih bahasa, yang juga memakainya — ditemukan saat mengukur §2).
2. **Kotak akhir tiap kartu bertahan** sama dengan kotak yang diharapkan
   sesudah transisi.
3. **Jumlah hasil identik** di kedua mode gerak.
4. **Tanpa JavaScript filter tetap bekerja** — `?practice=consulting` merender
   `<h1>Consulting</h1>` dan dua proyek, angka §2 dipaku.
5. **Nol kartu tumpang tindih** di titik mana pun selama transisi.
6. **`response-headers`**: `/work` boleh dinamis, tapi wajib server-rendered
   penuh — asersi baru menggantikan yang dipindahkan, dengan alasannya.

---

## 6. Risiko

- `/work` jadi `ƒ`. `route-budget.e2e.ts` mengukur berat rute, bukan
  cache-nya, jadi ia tidak akan melihat perubahan ini — yang justru sebabnya
  gerbang §5.6 harus ditulis eksplisit.
- WAAPI + `<ViewTransition>` di rute yang sama. Kartu yang sedang di-FLIP tidak
  boleh juga sedang di-morph; pelajaran Tahap 33 berlaku penuh.
- Parallax Tahap 33 mengukur posisi. ScrollTrigger harus `pause()` lalu
  `refresh()`, atau ia mengukur kotak yang sedang bergerak.
- `no-javascript.e2e.ts` menguji `/en/work` merender tautan proyek. Rute
  berubah bentuk; gerbang itu harus tetap hijau **tanpa** dilonggarkan.

---

## 7. Hasil

### 7.1 Keputusan §3 dikonfirmasi

Bentuknya ditanyakan dengan angkanya di depan, dan dipilih: **filter di
tempat, biaya cache diterima.** Alternatif yang lebih murah ditolak secara
sadar, bukan dilewatkan.

### 7.2 Dibuktikan merah, dengan angkanya

Terhadap build produksi sebelum kode ditulis, `/en/work`:

| Asersi                          | Hasil merah                                        |
| ------------------------------- | -------------------------------------------------- |
| Chip mempersempit katalog       | **6 → 6** — query string diabaikan seluruhnya      |
| Chip terpilih menandai dirinya  | Yang `aria-current` adalah **"Work"** — lihat §7.3 |
| Filter bekerja tanpa JavaScript | `<h1>` = `Work`, bukan `Consulting`                |

### 7.3 Cacat instrumen, ditangkap sebelum ia menangkap situs

Asersi "chip mana yang terpilih" ditulis dengan selektor struktural
`nav:has(a[href$="/work"])`. Itu cocok dengan **navigasi rute di header** —
yang baru dipasang Tahap 38, dan yang membawa `aria-current`-nya sendiri di
`/work` — lalu melaporkan chip terpilih sebagai `Work`. Pengalih bahasa juga
membawa `aria-current="true"`.

Gerbang yang lulus pada elemen yang salah lebih buruk daripada gerbang yang
tidak ada. Filter sekarang menandai dirinya `data-practice-filter` dan gerbang
menanyakan itu — alasan yang sama yang sudah dibawa `data-statement` dan
`data-site-facts` di suite ini.

Cacat instrumen **kedua**, ditangkap saat menghijaukan `catalogue-sift`: kartu
yang keluar juga `<li[data-flip-id]>`, dipindah ke lapisan keluar, dan membawa
animasinya sendiri — jadi selektor tanpa scope membaca `scale(1)` sebagai FLIP
yang gagal. Asersinya di-scope ke `ul li[...]`. Merahnya berbunyi
`started from scale(1)`, yang justru animasi keluar yang bekerja benar.

### 7.4 Yang dikirim, diukur pada build produksi

**39a — filternya jadi filter.**

| URL                            | kartu | `<h1>`           | karakter (JS mati) |
| ------------------------------ | ----: | ---------------- | -----------------: |
| `/en/work`                     |     6 | `Work`           |                813 |
| `/en/work?practice=consulting` | **2** | **`Consulting`** |            **612** |
| `/en/work?practice=nonsense`   |     6 | `Work`           |                813 |

Rute `○` → `ƒ`, `Cache-Control: private, no-store` — biaya yang §3 sebutkan di
depan dan yang Anda terima. Ketiga `/practice/<value>` tidak tersentuh.

**39b — `catalogue-sift`.** Diukur dengan membaca `getAnimations()` pada build
produksi, menyaring dari 6 kartu ke 2:

```
survivor fixture-arus-balik   from translate3d(0px, -33.2188px, 0px)  800ms  delay 0
survivor fixture-pusat-beban  from translate3d(0px, -33.2188px, 0px)  800ms  delay 70
easing   cubic-bezier(0.77, 0, 0.175, 1)
ghosts   4 kartu di satu lapisan aria-hidden mid-flight, 0 sesudah mengendap
```

- **800ms** = `--duration-slow`, **70ms** = `--stagger-cards`,
  `cubic-bezier(0.77, 0, 0.175, 1)` = `--ease-in-out-quart`. Ketiganya punya
  **nol konsumen** sebelum tahap ini (`TAHAP-34.md` D3 menghitungnya). Itu
  seluruh maksudnya: membelanjakan kosakata yang sudah dibeli, bukan menambah
  nilai baru.
- `in-out` dipakai sengaja, dan ini satu-satunya kasus yang `CLAUDE.md` #2
  izinkan: benda yang berangkat dari satu tempat dan mendarat di tempat lain.
- Reduced motion: **0** animasi, 2 kartu, `opacity` 1/1, nol ghost. Filternya
  berfungsi identik (`CLAUDE.md` #5).

### 7.5 Dua hal yang diukur dan mengubah rancangan

**Nol `document.startViewTransition`.** Diukur sebelum menulis apa pun: menekan
chip menjalankan **nol** view transition. Jadi tidak ada morph native yang
bersaing dengan FLIP tangan — dan membuatnya justru akan menamai enam kartu
sekaligus, melawan aturan satu-morph-per-navigasi §9.4. Itu yang menyelesaikan
pilihan WAAPI-versus-native, bukan selera.

**Navigasi me-reset gulir 900 → 0.** Kartu pertama ada di viewport `top: -432`
sebelum, `top: 501` sesudah. FLIP di ruang viewport akan membaca itu sebagai
perpindahan 933px dan menganimasikan reset gulir seolah-olah layout. Dua
perbaikan menyusul:

1. Posisi diukur di **koordinat dokumen** (`rect.top + scrollY`), sehingga
   delta menggambarkan yang benar-benar berubah.
2. Chip membawa `scroll={false}`. Argumen Tahap 15b untuk `scroll` default
   adalah tentang **pergi ke halaman lain**; ini halaman yang sama dengan
   daftar lebih pendek, dan chip-nya ada di atas halaman itu.

Ditambah satu lagi: chip membawa `transition="morph"`. Default `cover`
memasang overlay yang, menurut `navigation-signal.ts` sendiri, ada "precisely
to stop them seeing either" — koreografinya akan berjalan penuh di balik
tirai.

### 7.6 Yang ditolak lint, dan diperbaiki bukan dibungkam

`anti-slop/no-chained-type-assertions` menolak `window as unknown as {…}`
untuk menjangkau ScrollTrigger. Benar: `ScrollTrigger` **sudah** ada di graf
modul ini — tiap `ProjectCard` memanggil `useParallax`, yang mengimpornya —
jadi mengimpornya langsung tidak menambah satu byte pun dan menghasilkan tipe
yang nyata. `no-floating-promises` menolak `.then()` tanpa `void`; alasannya
ditulis di tempatnya, bukan di-disable.

### 7.7 Gerbang

```
bun run build            ✅  /[locale]/work sekarang ƒ
bun run check            ✅  oxlint · oxfmt · tsc · 458 unit · manifest · assets
CI=true bun run test:e2e ✅  499 lulus · 17 dilewati · 0 gagal
bun run build-storybook  ✅
```

Satu kegagalan pada jalan pertama, diperkirakan dan milik tahap ini:
`storybook-a11y.e2e.ts` menolak Storybook yang lebih tua dari komponen yang
diperiksanya — `vault/motion/flip/` baru. Dibangun ulang; 98 lulus.

### 7.8 Catatan

`vault/motion/flip/` belum punya story Storybook. Ia hook, bukan primitif yang
dirender, dan gerbang tertulis proyek ini menuntut story untuk **primitif**;
tetap dicatat di sini alih-alih didiamkan, dan masuk daftar Tahap 46.
