# Tahap 22 — Pondasi: footer yang tertelan, dan anggaran yang dinaikkan dengan sengaja

> Pendalaman wajib atas `docs/ROADMAP.md` §3.0.
> Fase 0 dari scaffold yang disetujui — prasyarat, tidak bisa dilewati.

Status: **selesai**. Hasil di §8.

---

## 1. Kenapa tahap ini ada, dan kenapa ia harus pertama

Scaffold yang disetujui menambahkan halaman, animasi, dan berat — termasuk
memperluas WebGL ke rute kedua (Fase 6). **Menambah canvas ke lebih banyak
rute sebelum memperbaiki tahap ini akan menggandakan cacatnya, bukan
memperbaikinya.**

Cacatnya ditemukan bukan lewat gerbang, melainkan lewat **menelusuri situs
sebagai pengunjung**: menggulir ke dasar beranda untuk mencari alamat email,
dan menemukan ruang gelap kosong.

---

## 2. Cacat 1 — footer melukis di bawah canvas

### 2.1 Yang terlihat

Di `/en` desktop, pada gulir maksimum, footer empat kolom (`COMMISSIONS`,
`INDEX`, `ELSEWHERE`, `COLOPHON`, plus baris hak cipta) **tidak terbaca**.
Semua gerbang hijau: DOM benar, `opacity: 1`, tidak ada transform, elemen
lolos hit-test di `elementFromPoint`, axe bersih, `site-reach.e2e.ts` hijau.
Hanya manusianya yang tidak melihat apa pun.

### 2.2 Instrumen pertama saya salah, dan salahnya informatif

Ukuran pertama saya adalah **luminansi rata-rata** pita footer:

|               | rata-rata |
| ------------- | --------- |
| dengan canvas | 23,82     |
| tanpa canvas  | 16,90     |

Rata-ratanya **naik**. Kalau berhenti di sini, kesimpulannya adalah "canvas
menambah cahaya, tidak apa-apa" — kebalikan dari kebenarannya. Wash memang
menambah cahaya; yang ia rusak adalah **jarak antara teks dan latarnya**.

Instrumen yang benar adalah rentang, bukan pusat:

|               | p01 | p99 (puncak teks) | rentang |
| ------------- | --- | ----------------- | ------- |
| dengan canvas | 0   | **39**            | **39**  |
| tanpa canvas  | 15  | **98**            | **83**  |

**44/255 keterbacaan hilang.** Ini catatan kedua di proyek ini bahwa memilih
statistik yang salah menyembunyikan cacat yang persis sedang dicari — yang
pertama Tahap 17.

### 2.3 Sebabnya: urutan lukis CSS, bukan opacity dan bukan z-index

Saudara-saudara `<body>`, diaudit terhadap build produksi:

| elemen                | position     | z-index  | melukis                                     |
| --------------------- | ------------ | -------- | ------------------------------------------- |
| `a` (skip link)       | `absolute`   | auto     | di atas canvas                              |
| `div.page-transition` | `fixed`      | 9998     | di atas                                     |
| `div.cursor`          | `fixed`      | 9999     | di atas                                     |
| `header`              | `fixed`      | 20       | di atas                                     |
| **`div.webgl`**       | **`fixed`**  | **auto** | —                                           |
| `main.relative`       | `relative`   | auto     | di atas (berposisi + setelah canvas di DOM) |
| **`footer`**          | **`static`** | **auto** | **DI BAWAH**                                |

Dalam urutan lukis CSS, blok **non-berposisi** (lapisan 3) dilukis **sebelum**
seluruh keturunan berposisi ber-`z-index: auto` (lapisan 6). `main` sudah
diberi `position: relative`; **`footer` tidak pernah diberi perlakuan yang
sama.** Itu satu-satunya perbedaan di antara keduanya.

Jadi ini bukan bug WebGL, bukan bug reveal, bukan bug opacity. Satu properti
yang hilang.

### 2.4 Perbaikan, sudah diuji di browser sebelum ditulis

`footer { position: relative }` — mengikuti pola yang `main` sudah pakai.
Diukur dengan menyuntikkannya saat runtime:

|                               | p01 | p99    |
| ----------------------------- | --- | ------ |
| sebelum                       | 0   | 39     |
| **`position: relative`**      | 1   | **88** |
| canvas disembunyikan (plafon) | 15  | 82     |

Hasilnya **melampaui** kontrol tanpa-canvas (88 > 82): wash menyumbang cahaya
_di belakang_ teks alih-alih menutupinya, yang justru bentuk yang diinginkan.

**Tanpa `z-index`.** `position: relative` saja sudah cukup karena footer
berada setelah canvas dalam urutan DOM; menambahkan `z-index` berarti ikut
masuk perlombaan angka (header 20, transition 9998, cursor 9999) tanpa alasan.

### 2.5 Yang **tidak** dilakukan

Memberi `z-index: -1` pada pembungkus canvas juga akan memperbaiki footer,
dan **ditolak**: itu perubahan global yang mendorong canvas ke belakang
_seluruh_ konten, termasuk plat `material-image` yang justru harus terlihat
menggantikan `<img>` yang di-`opacity: 0`. Memperbaiki satu halaman dengan
mempertaruhkan lapisan material adalah tukar-tambah yang buruk.

---

## 3. Cacat 2 — soft-404: **premis saya salah, dan ini koreksinya**

Saat menelusuri sebagai pengunjung saya melaporkan bahwa `/en/studio`,
`/en/contact`, dan `/en/nonsense-xyz` mengembalikan **HTTP 200** dengan
halaman "Page not found", dan menyebutnya cacat SEO.

**Itu sudah diketahui, sudah diputuskan, dan sudah dimitigasi.** Membaca
sumbernya:

- `app/[locale]/[...slug]/page.tsx` menuliskannya di komentar: _"Cache
  Components force this to answer 200"_.
- `e2e/not-found.e2e.ts` **menegaskan** `expect(response?.status()).toBe(200)`
  berikut delapan baris alasan: PPR melepas status shell statis sebelum bagian
  dinamis tahu ini 404.
- Mitigasinya sudah terpasang: `noindex` (yang justru sinyal yang dibaca
  perayap) plus judul jujur `"Page not found — Arth"`, yang ditambahkan
  persis karena setiap URL tak dikenal dulu ber-`<title>Arth</title>`.

Jadi tahap ini **tidak** "memperbaiki" status itu. Mengubahnya berarti melawan
arsitektur render yang dipilih sadar, demi sinyal yang sudah ditangani cara
lain.

**Yang tersisa dan memang layak** adalah masalah manusia, bukan perayap: label
nav berbunyi `STUDIO` dan `CONTACT`, jadi menebak `/en/studio` dan
`/en/contact` itu wajar, dan keduanya mendarat di halaman 404.

- `/en/contact` → pengalihan **308** ke `/en#contact`. Dilakukan di
  `proxy.ts`, yang berjalan **sebelum** render sehingga status nyata memang
  mungkin di sana.
- `/en/studio` dibiarkan 404 **di tahap ini** dan menjadi rute nyata di Fase 2
  (Tahap 24). Menambal sekarang lalu membongkarnya dua tahap lagi adalah kerja
  yang dibuang.

Padanan Indonesianya (`/id/kontak`, `/id/studio`) mengikuti peta lokalisasi
yang sudah ada di `lib/i18n/`.

---

## 4. Cacat 3 — anggaran rute dinaikkan dengan sengaja

Keadaan sekarang di `e2e/route-budget.e2e.ts`:

| rute                      | izin            | anggaran |
| ------------------------- | --------------- | -------- |
| `/en`                     | `three`, `gsap` | 2100 KB  |
| `/en/work`                | —               | 900 KB   |
| `/en/work/arus-balik`     | —               | 900 KB   |
| `/en/practice/consulting` | `gsap`          | 900 KB   |
| `/en/ai`                  | —               | 850 KB   |

Scaffold Fase 6 akan menaruh lapisan material di rute kedua. Berkas ini
menulis bahwa itu **melanggar keputusan Tahap 7**, jadi keputusan itu harus
**dicabut secara eksplisit di sini**, bukan dilanggar diam-diam nanti.

Yang dikerjakan di tahap ini:

1. **Ukur ulang** kelima rute terhadap build hari ini, catat angkanya.
2. Tulis ulang komentar berkas: siapa yang sekarang boleh membawa `three`,
   dan **kenapa** keputusan Tahap 7 dicabut (perintah pemilik proyek, tercatat
   di `docs/ROADMAP.md`).
3. Tetapkan anggaran baru = **terukur + margin yang dinyatakan**, bukan angka
   bulat yang enak dilihat. Rute yang belum membawa WebGL tetap di
   anggarannya yang sekarang — kenaikan hanya diberikan kepada rute yang
   memang akan membawanya.

**Anggaran naik karena diputuskan, dan tetap menjadi hakim.** Yang tidak
berubah: berkas ini tetap gagal kalau sebuah rute membawa library yang tidak
ada dalam daftar izinnya.

---

## 5. Gerbang

1. **Keterbacaan footer di rute ber-canvas** — baru, di
   `e2e/visual-substance.e2e.ts`. Membandingkan p99 pita footer terhadap
   lengan kontrol dengan canvas disembunyikan, di rute mana pun yang membawa
   canvas. **Dibuktikan merah lebih dulu** terhadap keadaan hari ini
   (`p99 39` vs kontrol `82`).

   Bentuknya sengaja **rentang, bukan rata-rata** — §2.2 menunjukkan
   rata-rata bergerak ke arah yang salah pada cacat ini.

   Ditulis per-rute-ber-canvas, bukan dipatok ke `/en`, supaya ia masih
   berlaku setelah Fase 6.

2. **Pengalihan `/contact`** — di `e2e/site-reach.e2e.ts`: status 308 dan
   tujuan yang benar, dua bahasa.

3. **Anggaran** — `route-budget.e2e.ts` hijau dengan angka barunya.

---

## 6. Risiko

**6.1 `position: relative` pada footer mengubah konteks penumpukan anaknya.**
Footer tidak memuat elemen berposisi selain tautan; diperiksa saat
implementasi, dan gerbang gutter serta axe yang sudah ada akan menangkap
pergeseran tata letak.

**6.2 Pengalihan bisa menutupi rute CMS yang sah.** Sebuah dokumen `page`
Sanity ber-slug `contact` akan menjadi tidak terjangkau. Diperiksa terhadap
dataset lebih dulu; kalau ada, pengalihannya tidak dipasang dan alasannya
dicatat.

**6.3 Menaikkan anggaran menghapus rem.** Karena itu anggaran barunya
**diukur lalu diberi margin yang dinyatakan**, dan hanya rute yang memang akan
membawa WebGL yang naik.

---

## 7. Yang **tidak** dikerjakan

- **Status 404 tidak diubah** (§3) — arsitektural, sudah diputuskan, sudah
  dimitigasi.
- **`/en/studio` tidak ditambal** — jadi rute nyata di Tahap 24.
- **Tidak ada animasi baru.** Tahap ini pondasi; kosakata gerak di Tahap 23.

---

## 8. Hasil

**Selesai.** Tiga hal yang direncanakan dikerjakan; satu di antaranya berubah
bentuk setelah membaca sumbernya, dan dua temuan baru muncul karena memeriksa
lebih luas daripada yang dilaporkan.

### 8.1 Footer — satu properti CSS

Sebabnya persis seperti §2.3: `<footer>` dikirim sebagai `position: static`
sementara saudaranya `<main>` membawa `relative`. Dalam urutan lukis CSS itu
menaruhnya di lapisan 3, di bawah pembungkus WebGL yang `fixed` di lapisan 6.

Perbaikannya `position: relative`, tanpa `z-index`. Terukur di `/en`:

|                      | p01 | p99 (puncak teks) |
| -------------------- | --- | ----------------- |
| sebelum              | 0   | **39**            |
| sesudah              | 1   | **88**            |
| kontrol tanpa canvas | 15  | 82                |

**Gerbangnya menangkap lebih banyak daripada yang saya ukur manual.** Saya
hanya mengukur `/en`; gerbang menemukan `/id` merah juga. Cacatnya di kedua
bahasa, dan ukuran manual satu bahasa akan melewatkannya.

### 8.2 Soft-404 — premis saya salah, dan itu dikoreksi bukan ditambal

Yang saya laporkan sebagai cacat SEO ternyata **keputusan arsitektural yang
sudah didokumentasikan**: Cache Components melepas status shell statis sebelum
bagian dinamis tahu ini 404, `e2e/not-found.e2e.ts` menegaskan 200 berikut
alasannya, dan mitigasinya (`noindex` + judul jujur) sudah terpasang sejak
audit sebelumnya.

Jadi statusnya tidak diubah. Yang dikerjakan adalah masalah manusianya — dan
di sini pemeriksaan yang lebih teliti menemukan **lima**, bukan satu:

| diketik        | sebelum | sesudah                  |
| -------------- | ------- | ------------------------ |
| `/en/contact`  | 404     | **308** → `/en#contact`  |
| `/id/kontak`   | 404     | **308** → `/id#contact`  |
| `/en/practice` | 404     | **308** → `/en#practice` |
| `/id/praktik`  | 404     | **308** → `/id#practice` |
| `/id/karya`    | 404     | **308** → `/id/work`     |

Hanya yang pertama ada di spec. Empat sisanya ditemukan karena memeriksa
**setiap** label nav di kedua bahasa, bukan hanya yang dilaporkan.
`/id/karya` yang paling tajam: label Indonesianya "Karya", tapi rutenya
`/id/work`, jadi pembaca Indonesia yang mengetik apa yang ia baca **selalu**
salah.

`/en/studio` sengaja dibiarkan 404 — ia jadi rute nyata di Tahap 24.

### 8.3 Anggaran — dicabut aturannya, dan **tidak** dinaikkan angkanya

Aturan Tahap 7 ("WebGL di tepat satu rute") dicabut secara eksplisit di dalam
`route-budget.e2e.ts`, karena Fase 6 akan melanggarnya dan melanggar diam-diam
lebih buruk daripada mencabut terbuka.

**Tidak ada plafon yang dinaikkan.** Menaikkan anggaran untuk berat yang belum
ada adalah cara sebuah anggaran berhenti bermakna; Fase 6 menaikkan rute yang
benar-benar memuatnya, dengan pengukuran yang membenarkannya. Baseline hari
ini dicatat di dalam berkasnya.

**Temuan baru: `/id` tidak pernah diukur sama sekali.** Seluruh daftar berisi
rute `/en`. Halaman beranda Indonesia membawa 1899 KB dan dua library yang
sama persis, dan regresi di sana tidak akan tertangkap siapa pun. Sekarang
ada di daftar.

Yang perlu diperhatikan tahap berikutnya: `/en/practice/consulting` hanya
menyisakan **26 KB**, dan Fase 1 menambahkan primitif gerak justru ke sana.

### 8.4 Instrumen yang salah di tahap ini — dua, dicatat

1. **Luminansi rata-rata adalah statistik yang salah untuk keterbacaan.**
   Rata-rata pita footer **naik** melintasi cacat ini (16,90 → 23,82) karena
   wash memang menambah cahaya. Membacanya akan menyimpulkan canvas membantu.
   Yang hancur adalah jarak teks ke latarnya: p99 jatuh 98 → 39. Ini kedua
   kalinya di proyek ini statistik yang salah menyembunyikan cacat yang persis
   sedang dicari (Tahap 17 yang pertama). `legibility()` ditambahkan ke
   `lib/styles/scripts/luminance.ts` dengan alasan itu ditulis di dalamnya.

2. **Asersi status pengalihan saya pertama kali tidak bisa gagal.** Bentuknya
   `hop ? (await hop.response())?.status() : 308` — kalau tidak ada pengalihan
   sama sekali, ia menyubstitusi nilai yang diharapkan dan **lulus paling
   kuat justru ketika fiturnya hilang**. Diperbaiki jadi "buktikan hop-nya
   ada, baru baca statusnya", lalu **dibuktikan bisa merah** dengan
   mengarahkan satu baris ke `/en/work`:
   `Error: /en/work produced no redirect at all`.

### 8.5 Yang dikirim

1. `components/layout/footer/footer.module.css` — `position: relative`.
2. `lib/styles/scripts/luminance.ts` — `legibility()`, resolusi penuh, p01/p99.
3. `e2e/visual-substance.e2e.ts` — gerbang keterbacaan footer, ditulis
   per-rute-ber-canvas (bukan dipatok ke `/en`) supaya masih menjaga setelah
   Fase 6. Dibuktikan merah: 39,28 melawan ambang 104,55.
4. `lib/i18n/guessed-paths.ts` + `guessed-paths.test.ts` — tabel dan alasannya.
5. `proxy.ts` — pengalihan 308, dipasang sebelum negosiasi konten.
6. `e2e/site-reach.e2e.ts` — gerbang pengalihan, dibuktikan bisa merah.
7. `e2e/route-budget.e2e.ts` — pencabutan aturan Tahap 7, baseline terukur,
   dan `/id` yang selama ini hilang.

### 8.6 Verifikasi

- `bun run check` — **exit 0**, 410 uji unit lulus.
- `CI=true bun run test:e2e` — **319 lulus**, 12 di-skip. Satu kegagalan awal
  (`storybook-a11y`: "built Storybook is not older than the components it
  checks") adalah penjaga kebasian yang bekerja benar; `bun run
build-storybook` lalu 92 lulus.
- Footer **dipandangi** di 1440×900 setelah perbaikan: empat kolom plus baris
  hak cipta terbaca penuh.
- Tidak ada klaim performa. Tidak ada profiler di lingkungan ini
  (`CLAUDE.md` #19).
