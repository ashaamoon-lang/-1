# Tahap 26 — Journal: rute, dan nol kosakata gerak baru

> Pendalaman wajib atas `docs/ROADMAP.md` §3.0.
> Fase 3 dari scaffold yang disetujui.

Status: **selesai**. Hasil di §8.

---

## 1. Di mana entrinya tinggal, dan kenapa bukan di CMS Anda

Scaffold menulis "skema `journalEntry` baru". Skemanya memang dibuat — itu
arsitektur yang benar untuk publikasi berjalan, dan ia tidak menulis apa pun.

Yang **tidak** dilakukan: menaruh entri contoh ke dalam dataset. Datasetnya
bernama `production` dan seeding menulis ke sana dengan
`SANITY_API_WRITE_TOKEN`. Itu perubahan pada pustaka konten hidup Anda, dan
bukan sesuatu yang saya lakukan tanpa diminta.

**Proyek ini sudah memutuskan kasus ini, dan keputusannya berlaku persis di
sini.** `lib/content/home-fallback.ts`, kata demi kata:

> "Alternatifnya lebih buruk: mengirim halaman kosong, atau **menulis
> penugasan karangan ke dalam pustaka konten agensi yang nyata**."

Jadi entri jurnal mengikuti kontrak yang sama: perancah ada di kode,
**setiap entri kalah dari CMS**, dan begitu studio menerbitkan satu entri
sungguhan, perancahnya berhenti dirender. Tidak ada satu byte pun yang ditulis
ke dataset Anda.

---

## 2. Isi

Tiga entri, dua bahasa, panjang realistis (~180-260 kata) supaya tata letaknya
diuji oleh bentuk yang akan benar-benar dipakai.

Topiknya **metode, bukan klien**: tulisan opini tentang cara kerja, bukan
studi kasus. Itu memungkinkan perancah yang terbaca sungguhan tanpa mengarang
satu pun penugasan, nama klien, atau hasil.

---

## 3. Desain

### 3.1 Indeks — `/[locale]/journal`

Daftar tipografis, bukan kartu. Tiap baris: tanggal (mono), judul (display),
ringkasan (prosa), dan praktik terkait. Dibaca sebagai indeks terbitan, yang
persis bentuk yang halaman ini adalah.

### 3.2 Entri — `/[locale]/journal/[slug]`

Kolom baca tunggal dengan ukuran yang benar (~65 karakter), tanggal dan
praktik sebagai fakta di atas judul, lalu prosa. Di bawahnya, entri
berikutnya — sirkuit yang sama dengan `next-project` dan `next-practice`.

---

## 4. Gerak — **nol kosakata baru, dan itu keputusan**

Tahap 25 baru saja menghabiskan satu tahap untuk mengukur dua peredupan yang
gagal WCAG, dan salah satunya berumur sepuluh tahap. Menambahkan gerak keenam
di tahap berikutnya adalah cara persis situs ini kehilangan koherensi yang
baru saja dibayar mahal.

Jadi yang dipakai hanya yang sudah ada:

| Elemen              | Mekanisme                                                              |
| ------------------- | ---------------------------------------------------------------------- |
| `h1`                | `TextReveal` — kosakata masuk situs                                    |
| Baris indeks        | `Reveal` + `data-reveal-item`, staggered                               |
| Baris saat disentuh | tata bahasa INTENT/COMMIT yang sudah ada (`data-press`, `data-intent`) |

**Nol momen berkoreografi** di kedua halaman. `MOTION-SPEC.md` §9.5
mengizinkan dua; memakai nol di halaman yang isinya adalah teks panjang adalah
pengendalian diri, dan ringkasan yang di-scrub akan melanggar aturan preset
yang dikurasi sendiri (_"Don't parallax body copy"_ — dan sebuah scrub pada
prosa panjang adalah kesalahan sekelas itu).

Ringkasan **tidak** disembunyikan di balik hover. Ia selalu terbaca; hover dan
fokus hanya menambahkan pengakuan yang sudah jadi tata bahasa situs. Sebuah
indeks yang isinya hanya muncul saat ditunjuk tidak bisa dipakai dengan
keyboard dan tidak bisa dibaca dengan sentuh.

---

## 5. Yang ikut berubah karena sebuah rute lahir

Sama seperti Tahap 24, dan daftarnya sudah terbukti:

1. `messages/*.json` — kunci `journal`.
2. `lib/integrations/sanity/schemas/journalEntry.ts` + `schemas/index.ts`;
   `schema-coverage.test.ts` akan menuntut kelengkapannya.
3. `lib/seo/route-catalog.ts` — sitemap, `/llms.txt`, `/agent-content`, `/ai`.
4. `components/layout/footer` — kolom Index.
5. `lib/i18n/guessed-paths.ts` — `journal` masuk `REAL_SEGMENTS`.
6. Gerbang: `route-budget`, `visual-substance` (gutter), `motion`
   (kosakata masuk), `site-reach`.

---

## 6. Gerbang

1. Rute indeks dan entri hidup, dua bahasa.
2. `h1` keduanya displit seperti rute lain.
3. Gutter sesuai chrome.
4. axe bersih **dan digulir** — pelajaran Tahap 25 §7.5: tiga cacat lolos
   karena axe mengaudit pada `scrollY 0`. Indeks jurnal cukup panjang untuk
   punya baris di bawah lipatan.
5. Reduced motion — isi berakhir terlihat penuh.
6. Tanpa JavaScript — terbaca.
7. Anggaran — rute baru dengan izin `gsap` dan plafon dari pengukuran.

---

## 7. Risiko

**7.1 Dua sumber isi.** Perancah kode dan CMS. Dimitigasi dengan kontrak yang
sama dengan `home-fallback`: CMS selalu menang, dan itu **diuji unit**, bukan
diniatkan.

**7.2 Halaman lain lagi yang seluruhnya tipografi.** Sesudah Studio, ini yang
kedua. Ritme vertikalnya **dipandangi**, dan indeksnya sengaja berbeda bentuk
dari daftar praktik supaya situs tidak jadi satu template yang diulang.

---

## 8. Hasil

**Selesai.** Empat rute baru (indeks dan entri, dua bahasa), skema CMS
terdaftar, dan **nol byte ditulis ke dataset Anda**.

### 8.1 Terkirim

|          |                                                          |
| -------- | -------------------------------------------------------- |
| Rute     | `/[locale]/journal` dan `/[locale]/journal/[slug]`       |
| Skema    | `journalEntry`, terdaftar, dengan tiga query GROQ        |
| Perancah | `lib/content/journal-fallback.ts` — 3 entri × 2 bahasa   |
| Kontrak  | CMS menang seluruhnya, **diuji unit** (7 uji, 31 asersi) |
| Gerak    | **nol kosakata baru**                                    |

Terverifikasi hidup: `/en/journal` → "Journal", `/id/journal` → "Jurnal",
`/id/journal/evaluation-before-pipeline` → "Evaluasi sebelum pipeline". Slug
tak dikenal jatuh ke halaman tidak-ditemukan.

### 8.2 Di mana entrinya tinggal — keputusan yang tidak saya buat sendiri

Datasetnya `production`, dan seeding menulis ke sana. Saya tidak menulis
apa pun. Proyek ini sudah menghadapi kasus persis ini di `home-fallback.ts`
dan sudah memutuskan: perancah di kode, CMS menang, jangan pernah menaruh
karangan ke pustaka konten yang nyata.

Kontraknya **diuji**, bukan diniatkan — `journal-fallback.test.ts`
membuktikan bahwa satu dokumen terbit membuat ketiga entri perancah berhenti
dirender seluruhnya. Menggabungkan keduanya akan menaruh artikel karangan di
sebelah tulisan sungguhan studio tanpa apa pun di halaman yang membedakannya.

### 8.3 Sebuah pintu yang Tahap 10 tutup, dibuka lagi — dan itu disebut

Starter Satūs mengirim tipe `article` dengan rutenya sendiri, dan Tahap 10
menghapusnya: _"blog lengkap di situs studio karya pesanan yang tidak
menulis"_, tidak pernah disebut di `PANDUAN-STUDIO.md`, dan orang yang
seharusnya memakainya tidak pernah diberi tahu.

`journalEntry` membuka permukaan itu lagi. Tiga hal berbeda, dan ketiganya
ditulis di dalam skemanya: ia **diminta**, ia punya **rute, query, dan
halaman yang dirender** di hari ia dikirim, dan ia **didokumentasikan**. Kalau
ketiganya berhenti benar, tipe ini harus pergi seperti `article` pergi.

### 8.4 Gerak: nol, dan itu keputusan

Tahap 25 baru saja menghabiskan satu tahap mengukur dua peredupan yang gagal
WCAG. Menambahkan kosakata gerak keenam di tahap berikutnya adalah cara
persis koherensi yang baru dibayar mahal itu hilang.

Jadi kedua halaman memakai apa yang sudah ada: `TextReveal` pada `h1`,
`Reveal` pada blok, dan tata bahasa INTENT yang sudah ada saat baris
disentuh. `MOTION-SPEC.md` §9.5 mengizinkan dua momen berkoreografi per
halaman; keduanya memakai **nol**.

Ringkasan **tidak** disembunyikan di balik hover. Indeks yang isinya hanya
muncul saat ditunjuk tidak bisa dipakai dengan keyboard dan tidak terbaca
dengan sentuh.

### 8.5 Dua penolakan lint, keduanya diperbaiki dengan mengubah bentuk

`require-safety-comment-for-type-assertion` menolak `document.practice as
Practice`. Diganti dengan type guard `PRACTICES.some(...)` — **nol assertion**,
narrowing-nya diperoleh dari pemeriksaannya alih-alih ditegaskan di atasnya.

`no-known-value-widening` menolak anotasi `Record<Locale, …>` pada tabel
entri. Diganti `satisfies`, yang mempertahankan bukti bahwa kedua bahasa
membawa tiga slug yang sama.

### 8.6 Yang dipandangi, dan satu yang diperbaiki karenanya

Indeks dan entri dipandangi di 1440×900 (EN) dan 390×844 (ID). Satu cacat
ditemukan dengan mata: tanggal dan praktik menyatu jadi satu string
("February 11, 2026 CONSULTING"). Diberi pemisah `·` — konvensi yang
`vault/blocks/project-card` sudah punya, jadi ini memakai ulang keputusan
alih-alih membuat yang baru.

### 8.7 Verifikasi

- `bun run check` — exit 0, **417 uji unit** (dari 410).
- `CI=true bun run test:e2e` — **351 lulus, 0 gagal**, 18 dilewati.
- Ponsel 390×844: nol overflow horizontal.
- Anggaran: kedua rute di bawah 900 KB, izin `gsap` saja.
- Tidak ada klaim performa (`CLAUDE.md` #19).

### 8.8 Satu celah yang disengaja, dan disebut

`app/[locale]/journal/[slug]` membaca perancah saja, belum CMS. Datasetnya
tidak punya satu pun `journalEntry`, jadi cabang CMS-nya akan ditulis buta
terhadap bentuk yang belum pernah diambil dokumen mana pun — termasuk
Portable Text-nya, yang butuh `RichText` dan bukan paragraf polos. Indeksnya
**sudah** punya cabang itu. Menyelesaikannya adalah pekerjaan kecil untuk hari
studio menerbitkan entri pertama, dan disebut di sini alih-alih dibiarkan
ditemukan.
