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

_Diisi setelah kode ditulis dan gerbang dijalankan._
