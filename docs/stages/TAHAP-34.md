# Tahap 34 — Selera diberi angka

> Status: spec. Kode belum ditulis saat baris ini dibuat (`docs/ROADMAP.md` §3.0).

Tahap ini tidak mengubah satu piksel pun secara langsung. Ia mengubah **atas
dasar apa** sebelas Tahap sesudahnya dinilai — dan sambil menyetelnya, ia
menemukan lima cacat terukur yang selama 33 Tahap tidak ada gerbang yang bisa
melihatnya.

---

## 1. Kenapa Tahap ini ada

Pemilik proyek menyampaikan keluhan yang sama tiga kali: situsnya **"kurang
animatif, kurang kreatif, kurang eksploratif"**. Tiga Tahap terakhir menjawab
dengan menambah gerak, dan jawabannya tetap sama.

Diagnosisnya bukan kurangnya efek. Diagnosisnya adalah **tidak ada angka yang
bisa diperdebatkan**. "Lebih eksploratif" adalah perasaan, dan perasaan tidak
bisa digerbangi, tidak bisa dibuktikan merah, dan tidak bisa dicatat di §Hasil.
Proyek ini punya angka untuk durasi, kontras, luminansi, dan berat rute — dan
nol angka untuk **komposisi**.

`taste-skill` (`github.com/Leonxlnx/taste-skill`) menyediakan angka itu, dan
menyediakannya dalam bentuk yang cocok dengan cara kerja repo ini: aturan
mekanis yang bisa dihitung, bukan selera yang harus disepakati.

---

## 2. Lisensi, diverifikasi bukan diasumsikan

`CLAUDE.md` #18 menuntut lisensi diverifikasi dengan **membaca `LICENSE`
sumbernya sendiri**, bukan badge, artikel, atau hasil pencarian. Proyek ini
sudah pernah menangkap satu klaim MIT palsu dengan cara itu
(`docs/PROVENANCE.md` §5).

Dilakukan: `LICENSE` repo itu diambil langsung dan dibaca.

- **MIT License**
- **Copyright (c) 2026 Leonxlnx**
- Teks standar MIT, lengkap dengan klausa "provided as is".

Menyalin diizinkan. Header provenance tetap wajib (`CLAUDE.md` #17).

---

## 3. Tiga dial, dan angka Arth

`taste-skill` §1 dan §7 mendefinisikan tiga variabel yang menggerbangi setiap
keputusan layout, gerak, dan kepadatan. Baseline skill itu `8 / 6 / 4`.

### 3.1 Di mana Arth berada hari ini

Dibaca dari kode, bukan dari kesan:

| Dial               | Nilai | Buktinya di repo                                                                                                                                                                                        |
| ------------------ | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DESIGN_VARIANCE`  | **3** | §7 menyebut 1–3 sebagai "Predictable: symmetrical CSS Grid (12-col, equal fr-units)". `project-grid.module.css:32` adalah `repeat(12, minmax(0, 1fr))` persis, dengan satu ritme untuk seluruh katalog. |
| `MOTION_INTENSITY` | **4** | §7 menyebut 4–7 sebagai "Fluid CSS… focus on transform and opacity" — itu tepat apa yang situs ini lakukan: 13 `Reveal` berbasis IntersectionObserver, plus satu parallax yang ditambahkan Tahap 33.    |
| `VISUAL_DENSITY`   | **2** | §7 menyebut 1–3 sebagai "Art Gallery: lots of white space". Benar, dan **disengaja**.                                                                                                                   |

### 3.2 Ke mana Arth menuju, dan kenapa

| Dial               | Dari |    Ke | Alasan                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------ | ---: | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DESIGN_VARIANCE`  |    3 | **7** | §1.B menyebut preset "Portfolio (Designer / studio)" pada 8. Arth mengambil 7, bukan 8: §7 menempatkan masonry dan `padding-left: 20vw` di 8–10, dan kisi 12 kolom yang tetap terbaca sebagai kisi adalah bagian dari bagaimana karya dibandingkan satu sama lain. 7 memberi offset asimetris dan rasio yang bervariasi tanpa kehilangan kisi.                                        |
| `MOTION_INTENSITY` |    4 | **9** | §7 mendefinisikan 8–10 sebagai "complex scroll-triggered reveals, parallax, scroll-driven animation (CSS `animation-timeline` atau GSAP ScrollTrigger)". Itu **persis** arsitektur yang sudah dibangun proyek ini dan hampir tidak dipakai. Preset "Portfolio (Designer / studio)" ada di 7; Arth mengambil 9 karena pemiliknya memintanya secara eksplisit dan pondasinya sudah ada. |
| `VISUAL_DENSITY`   |    2 | **3** | **Satu-satunya dial yang hampir tidak dinaikkan, dan itu keputusan.** §7 menempatkan 8–10 pada "Cockpit: tight paddings, no card boxes, mandatory `font-mono` for all numbers". Untuk situs karya, kepadatan itu membunuh subjeknya. 3 memberi sedikit lebih banyak isi per layar tanpa berhenti terbaca sebagai galeri.                                                              |

**Arth = `7 / 9 / 3`.** Lebih bergerak dari baseline skill itu, sedikit lebih
lapang, sedikit lebih tenang secara komposisi.

### 3.3 Koreksi terhadap draf rencana

Draf rencana pengembangan menyatakan `MOTION_INTENSITY` berhenti di 8 karena
"9–10 di skill itu berarti scroll hijack". **Itu salah.** Membaca §7 dan §5.D
langsung: skill itu tidak pernah menyebut scroll hijacking, dan §5.D justru
**melarang** `window.addEventListener('scroll')` secara keras. Yang ada di
8–10 adalah ScrollTrigger dan scroll-driven animation — yang sudah dipakai di
sini. Tidak ada konflik, dan dialnya naik ke 9.

Penolakan Arth terhadap scroll hijacking tetap berlaku, tapi ia penolakan
Arth sendiri, bukan pengurangan terhadap skill ini.

---

## 4. Design read

Ditulis sekali, dipakai sebagai batu uji tiap Tahap (`taste-skill` §0.B):

> **Membaca ini sebagai:** situs studio karya komisi untuk klien dan kurator,
> berbahasa galeri-monokrom, condong ke sistem sendiri (`vault/` + Base UI)
> ketimbang ke sistem desain pihak ketiga.

`taste-skill` §2 memetakan brief ke sistem desain resmi (Fluent, Carbon,
GOV.UK, shadcn). Tidak satu pun berlaku: §2.B menyebut brief estetis dibangun
dengan CSS native + component library terpelihara, dan itu keputusan yang
sudah diambil dan diukur di Tahap 3.

---

## 5. Aturan yang diadopsi, dan lubang yang ditutupnya

Setiap baris di bawah diadopsi karena ia menutup cacat yang audit kurator
proyek ini temukan **sendiri**, bukan karena ia ada di daftar.

| Aturan `taste-skill`                                                             | Lubang Arth                                                                                                         |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| §4.7 Eyebrow ≤ `ceil(sections/3)`, dihitung mekanis                              | 33 deklarasi `text-transform: uppercase` dengan enam nilai `letter-spacing` berbeda; tidak ada token untuk pola ini |
| §14 Nol scroll cue                                                               | `messages/*.json` `home.scrollCue` dirender di `vault/blocks/hero/index.tsx:168`                                    |
| §4.7 Nav ≤ 80px desktop                                                          | `--header-height` desktop = **98px**                                                                                |
| §4.7 Hero ≤ 4 elemen teks                                                        | Hero beranda punya **5**                                                                                            |
| §9.G Nol em-dash di copy yang tayang                                             | 6 (EN) + 8 (ID) di `messages/`, plus 4 string terbit di `lib/seo/site.ts`                                           |
| §14 Ikon dari pustaka terpelihara, nol SVG buatan tangan                         | Nol ikonografi; satu-satunya SVG di repo adalah logo perusahaan lain                                                |
| §14 Kontras tombol & form pada elemen **yang dirender**                          | `contrast.test.ts` mengukur token, tidak pernah label yang dirender                                                 |
| §14 Label CTA tidak membungkus di desktop                                        | Tidak pernah diperiksa                                                                                              |
| §14 Nol intent CTA duplikat                                                      | Kontak ditawarkan di footer, beranda, dan `/studio`                                                                 |
| §4.11 Satu tema per halaman, seksi tidak membalik                                | Belum tertulis di mana pun; mengikat Tahap 43d                                                                      |
| §14 Satu marquee per halaman                                                     | Mengikat Tahap 42b                                                                                                  |
| §14 "Motion motivated" — hierarki / narasi / umpan balik / transisi status       | Batu uji tiap koreografi Tahap 39–43                                                                                |
| §5.D Nol `window.addEventListener('scroll')`, nol RAF yang menyentuh state React | Arth **sudah** patuh; sekarang tercatat dan digerbangi                                                              |

### 5.1 Em-dash: cakupan yang dipersempit, dengan alasan

§9.G melarang em-dash total. Diadopsi **hanya untuk teks yang dilihat
pengunjung** — `messages/*.json`, `lib/content/*`, string terbit di
`lib/seo/*`. **Tidak** untuk `docs/` dan komentar kode: §9.G beralasan
em-dash adalah AI-tell **di UI**, dan dokumen internal proyek ini bukan UI.
Perbedaan ini ditulis di sini supaya ia keputusan, bukan kelalaian.

---

## 6. Aturan yang ditolak, dan alasannya

1. **§7 `MOTION_INTENSITY` 4–7 mencontohkan `transition: all 0.3s
cubic-bezier(0.16, 1, 0.3, 1)`.** Ditolak tiga kali: `all` melanggar
   `CLAUDE.md` #4, `0.3s` melanggar #3 ("jangan pernah 300ms sebagai
   default"), dan `cubic-bezier()` mentah melanggar #1. Arth memakai token
   `--ease-*` dan `--duration-*`, dan `motion-rules.test.ts` sudah menolak
   ketiganya. Aturan Arth menang.
2. **§4.1 panduan typeface** (Geist / Outfit / Cabinet Grotesk / Satoshi,
   bukan Inter). Itu daftar penghindar-default. Syne + Geist Mono dipilih di
   sini lewat pengukuran (Tahap 1), dan peningkatan sebenarnya adalah face
   berlisensi (`TEARDOWN.md` §4), bukan menukar satu face gratis dengan yang
   lain.
3. **§2 tabel pemilihan design system.** Tidak berlaku: Base UI + `vault/`,
   keputusan Tahap 3.
4. **§4.1 larangan serif dan §4.2 larangan palet premium-consumer.** Tidak
   berlaku: Arth monokrom, nol serif, nol beige-brass-oxblood.
5. **§14 `min-h-[100dvh]`.** Arth memakai `100svh` dengan alasan tertulis
   (`hero.module.css:19`) — lebih ketat, bukan kurang. Dipertahankan, dan
   gerbangnya melarang `100vh` telanjang, bukan menuntut `dvh`.

---

## 7. Gerbang

`e2e/taste-preflight.e2e.ts`. Kotak §14 yang **bisa dimesinkan dan berlaku di
sini**, dijadikan asersi, bukan checklist yang dibaca manusia.

Tiap asersi dibuktikan **merah** dulu, dan angkanya masuk §9.

1. Nol em-dash di seluruh teks yang dirender, di kedua bahasa, di setiap rute.
2. Hitung eyebrow ≤ `ceil(sectionCount / 3)` per halaman.
3. Nol scroll cue.
4. Tinggi header ≤ 80px di desktop, dan nav satu baris.
5. Hero ≤ 4 elemen teks.
6. Satu tema per halaman — nol seksi yang membalik.
7. Satu sistem radius per halaman.
8. Kontras label CTA terhadap latar tombolnya, diukur pada elemen yang
   dirender, WCAG AA 4.5:1.
9. Nol label CTA yang membungkus ke baris kedua di desktop.
10. Nol intent CTA duplikat.
11. Nol `100vh` telanjang.
12. Maksimal satu marquee per halaman.
13. Nol `window.addEventListener('scroll')` di bundel yang dikirim.

**Lantai anti-vakum** di tiap asersi, sesuai kebiasaan repo ini: sebuah
gerbang yang tidak memeriksa apa pun tidak boleh melaporkan sukses.

---

## 8. Risiko

- **Menghapus scroll cue menyentuh `hero-arrival`**, salah satu dari dua momen
  §9.5 beranda. Cue adalah `[data-reveal-item]` kelima; menghapusnya mengubah
  jumlah stagger. `e2e/motion.e2e.ts` dan `interaction-grammar.e2e.ts` harus
  tetap hijau, dan `MOTION-SPEC.md` §9.5 diperiksa ulang.
- **Menurunkan `--header-height` 98 → ≤80** menggerakkan
  `scroll-padding-top`, offset sticky `step-sequence`, dan posisi `.stage`
  lightbox. `e2e/navigation-landing.e2e.ts` dan `spatial-rhythm.e2e.ts` adalah
  gerbang yang paling mungkin ikut merah.
- **Mengganti 18 em-dash di copy dua bahasa** adalah perubahan teks, dan
  `vocabulary.e2e.ts` menjaga kosakata. Penggantinya harus titik, koma, atau
  tanda kurung — bukan tanda hubung yang menggantung.
- Angka dial adalah **niat**, bukan pengukuran. Tidak ada gerbang yang bisa
  membuktikan sebuah halaman "berada di VARIANCE 7". Yang digerbangi adalah
  aturan mekanis di §7; dialnya dipakai untuk berargumen, dan §Hasil tiap
  Tahap menyebut dial mana yang dibelanjakan.

---

## 9. Hasil

### 9.1 Gerbang merah dulu: 21 asersi, dengan angkanya

`e2e/taste-preflight.e2e.ts` dijalankan terhadap situs sebagaimana adanya
(build produksi, 2026-09-04). **21 gagal, 40 lulus.**

| Asersi                     | Terukur sebelum                                                                                                 | Sesudah            |
| -------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------ |
| Nol em-dash                | merah di **8 dari 8** rute                                                                                      | hijau (lihat §9.4) |
| Tinggi nav ≤ 80px          | **98px**                                                                                                        | **72px**           |
| Hero ≤ 4 elemen teks       | **5** (indeks, judul, subline, CTA, cue)                                                                        | **4**              |
| Nol scroll cue             | ada di `/en` dan `/id`                                                                                          | nol                |
| Eyebrow ≤ `ceil(n/3)`      | `/en` **4** dari 5 seksi (plafon 2)<br>`/id` **4** dari 5 (plafon 2)<br>`/practice/<v>` **2** dari 2 (plafon 1) | 2 · 2 · 1          |
| Satu tema per halaman      | hijau                                                                                                           | hijau              |
| Satu intent kontak         | hijau                                                                                                           | hijau              |
| Label CTA tidak membungkus | hijau                                                                                                           | hijau              |
| Maksimal satu marquee      | hijau                                                                                                           | hijau              |

Yang **sudah** hijau sejak awal dicatat juga, karena gerbang yang tidak pernah
merah tetap punya nilai sebagai ratchet — tapi hanya kalau lantai anti-vakumnya
nyata. Semua sembilan asersi punya satu.

### 9.2 Dua cacat yang tidak bisa dilihat dari halaman mana pun

`lib/styles/scripts/taste-rules.test.ts` — pemindai sumber, bukan DOM — merah
pada kedua aturannya di jalan pertama. Saya menduga ia akan jadi ratchet atas
kode yang sudah benar. Ia bukan:

| Aturan                | Ditemukan                                                                                                                                                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nol `vh` telanjang    | `lib/styles/css/global.css:177` — `min-height: 100vh` pada `body`, **site-wide, sejak fork**. Di ponsel `vh` lebih tinggi dari yang terlihat, jadi halaman pendek selalu punya scrollbar yang tidak perlu dan footer 404 jatuh di bawah lipatan |
| Nol listener `scroll` | `lib/webgl/hooks/use-webgl-rect.ts:143` — `window.addEventListener('scroll', handleUpdate, false)`, dan `handleUpdate` memanggil `getBoundingClientRect`                                                                                        |

Keduanya lolos 33 Tahap gerbang karena **tidak satu pun bisa dilihat dari
halaman yang dirender**: cacat `vh` hanya muncul di ponsel yang chrome-nya
menggeser, dan listener itu hanya terpasang kalau sebuah rute memasang WebGL
**tanpa** Lenis — dan `Wrapper` mendefaultkan `lenis` ke `true`, jadi nol rute
terbit mencapainya.

Itu argumen untuk memindai sumber, dan sumbernya sendiri yang mengucapkannya.

Perbaikannya: `100vh` → `100svh` (bukan `dvh`: `dvh` berubah ukuran terus dan
akan menggerakkan footer saat orang menggulir; `svh` adalah lantai yang tidak
pernah bergerak). Listener diganti langganan Tempus pada `order: 5` — loop
yang proyek ini sudah jalankan, dipasang di layout secara terpisah dari Lenis,
jadi tersedia justru ketika Lenis tidak ada. Nol loop RAF kedua
(`CLAUDE.md` #6), dan konfigurasi yang terbit membayar satu pemanggilan fungsi
yang langsung `return` per frame.

### 9.3 Instrumennya salah lima kali, dan semuanya dicatat

Ini bagian yang paling mudah disembunyikan, jadi ditulis lengkap. Tiga kali
instrumennya **mengarang cacat**, dua kali ia **menyembunyikannya**:

1. **`line.split('/*')[0]`** membaca baris lanjutan sebuah blok komentar
   sebagai kode, lalu melaporkan kalimat yang menjelaskan _kenapa_ `100vh`
   ditolak sebagai pelanggaran `100vh`. → `stripBlockComments`.
2. Aturan yang sama, giliran kedua: ia melaporkan komentar dokumentasi yang
   menjelaskan penghapusan listener **sebagai** listener itu.
3. **Komentar XML** (`<!-- -->`) di dalam template literal SVG
   `seed-fixtures.ts` terbaca sebagai copy. → stripper diperluas.
4. **Detektor eyebrow** menghitung `<dt>` di dalam `<dl>` metadata
   (`Client / Year / Engagement / Scope`) dan tombol hero `See the work`.
   Aturan §4.7 berbunyi "label … **di atas judul seksi**", dan versi pertama
   hanya memeriksa separuh pertamanya. → kandidat wajib diikuti heading dalam
   tiga elemen, dan label pada item koleksi (`li`, `article`) tidak dihitung.
   Perubahan kedua itu membuat `/en/journal` merah menjadi hijau, dan itu
   ditulis di berkasnya supaya pembaca bisa menilai sendiri.
5. **Hitungan seksi** memakai `document`, bukan `main` — footer dibangun dari
   empat `<section>`, jadi setiap halaman dapat empat seksi gratis dan plafon
   dua yang tidak ia peroleh.
6. **Cek nav satu baris** membucketkan `top` per 8px dan menuntut satu bucket.
   Ia gagal pada header yang jelas-jelas satu baris (wordmark 26, anchor 28,
   pencarian 20, pengalih bahasa 14 — tinggi berbeda, di-center di bar 72px
   yang sama) dan membaca tombol `Menu` mobile pada `top: 0`, karena elemen
   `display: none` melaporkan rect nol. → hanya kontrol yang terlihat, dan
   rentang vertikalnya tidak boleh melebihi tinggi header.

Enam, bukan lima. Angka di kalimat pembuka salah dan dibiarkan salah akan jadi
persis jenis cacat yang Tahap ini dibangun untuk menangkap, jadi: **enam.**

### 9.4 Satu aturan pindah dari e2e ke pemindai sumber

Aturan em-dash mulai di `e2e/taste-preflight.e2e.ts` dan bekerja: merah di
delapan rute. Lalu ia **tetap merah** pada satu string yang berkas itu tidak
bisa klaim sebagai miliknya — subline beranda disajikan dari Sanity.

Gerbang yang menggagalkan build karena seseorang menulis em-dash di CMS
membuat CI bergantung pada konten eksternal yang bisa berubah, yang menjadi
tanggung jawab studio dan bukan repo ini. Jadi aturannya pindah ke
`lib/styles/scripts/taste-rules.test.ts`, di mana ia **lebih kuat**: ia membaca
setiap string yang repo ini kirim, termasuk copy yang belum mencapai rute mana
pun, tidak butuh server, dan tidak bisa di-flake oleh satu tulisan di CMS.
Itu pembagian sumber-versus-DOM yang sama yang `motion-rules.test.ts` sudah
tarik.

**Yang dilepas nyata dan tidak dihaluskan:** tidak ada lagi yang gagal ketika
copy CMS yang ditulis studio membawa em-dash.

**39 string diperbaiki** di sembilan berkas:

| Berkas                               | Jumlah |
| ------------------------------------ | -----: |
| `lib/seo/route-catalog.ts`           |      8 |
| `messages/id.json`                   |      7 |
| `messages/en.json`                   |      6 |
| `lib/seo/site.ts`                    |      4 |
| `lib/content/home-fallback.ts`       |      4 |
| `lib/content/journal-fallback.ts`    |      4 |
| `lib/scripts/seed-fixtures.ts`       |      4 |
| `lib/seo/markdown-document.ts`       |      1 |
| `vault/blocks/hero/hero.stories.tsx` |      1 |

Penggantinya titik, koma, titik dua, atau tanda kurung. Nol tanda hubung
menggantung.

### 9.5 Dua skill bertabrakan, dan tabrakannya diselesaikan bukan diabaikan

Scroll cue hero ditambahkan di Tahap 12 karena pola `hero-centric-design`
`ui-ux-pro-max`: biarkan hero mendominasi layar pertama **tanpa menyembunyikan
petunjuk isi berikutnya** — hero ini mendominasi 900px dari dokumen 5749px dan
tidak mengatakan apa pun tentang sisanya. `taste-skill` §14 melarang scroll cue
mentah-mentah, sebagai AI tell.

Keduanya benar. Masalah yang Tahap 12 ukur itu nyata, dan **katanya** yang
merupakan tell. Label adalah cara lemah untuk mengatakan "masih ada di bawah";
cara kuatnya adalah benar-benar ada yang terlihat di bawah.

Jadi hero melepas 12svh — `min-height: 100svh` → `88svh` — dan tepi atas seksi
berikutnya sekarang berada di dalam layar pertama. Afordansinya bertahan,
dalam bentuk yang tidak membawa copy, tidak butuh `aria-hidden`, tidak perlu
diterjemahkan, dan tidak menambah elemen ke tumpukan hero yang §4.7 batasi di
empat. Argumennya tertulis di `vault/blocks/hero/index.tsx` dan di
`hero.module.css`, bukan hanya di sini.

### 9.6 Dua eyebrow dihapus, dan alasannya per pasang

Plafon `/en` adalah 2 dan ia memakai 4. Yang dijatuhkan bukan dua yang paling
mudah:

| Eyebrow         | Judul                  | Putusan                                                                                                               |
| --------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `Selected work` | `Recent engagements`   | **Dihapus.** Mengatakan hal yang sama dua kali; hitungan di sebelah judul membawa apa yang eyebrow itu pura-pura bawa |
| `Studio`        | `How we work`          | **Dihapus.** Menduplikasi label anchor header beberapa ratus piksel di atasnya                                        |
| `Practice`      | `What we take on`      | **Tetap.** Menyebut kosakata yang dipakai seluruh situs; judulnya tidak                                               |
| `Commissions`   | `Start a conversation` | **Tetap.** Menyebut percakapan jenis apa; ini juga seksi konversi                                                     |

`practice.workEyebrow` ikut dihapus dengan alasan yang sama, dan itu membawa
`/practice/<v>` dari 2 ke 1. `StudioNote.eyebrow` jadi opsional, mengikuti
alasan yang `components/ui/section-header` sudah tulis untuk propnya sendiri:
eyebrow membawa informasi, atau ia tidak ada.

Tiga kunci pesan mati dihapus dari kedua locale (`home.workEyebrow`,
`home.studioEyebrow`, `practice.workEyebrow`), plus `home.scrollCue`.

### 9.7 Yang dikirim

- `.claude/skills/taste-skill/` — `SKILL.md` v2 (commit `ccbc156`), `LICENSE`,
  dan `references/` (riset upstream tentang keluaran model yang tidak selesai).
  Provenance di `docs/PROVENANCE.md` §3, lisensi diverifikasi dari berkasnya.
- `e2e/taste-preflight.e2e.ts` — 9 asersi × 8 rute, semua berlantai anti-vakum.
- `lib/styles/scripts/taste-rules.test.ts` — 5 aturan sumber.
- `docs/DESIGN-SYSTEM.md` §0 (dial 7/9/3 + design read) dan §7 (**daftar utang**:
  sepuluh tempat dokumen ini dan kodenya masih berbeda, tiap baris menyebut
  Tahap yang menutupnya).
- Empat angka salah di `DESIGN-SYSTEM.md` diperbaiki: `h1` **72→120** menjadi
  **38→120**; "18 pasang terukur" menjadi **11 pasang × 2 tema = 22**;
  kontras terendah **14.22:1** menjadi **9.08:1**; APCA terendah **Lc 86.1**
  menjadi **Lc 60.6**. Empat token turunan disebut, enam ada.

### 9.8 Yang TIDAK selesai, disebut eksplisit

1. **Dokumen fixture `studioSettings` di dataset live masih membawa subline
   lama beserta em-dashnya.** `lib/scripts/seed-fixtures.ts` sudah bersih, tapi
   dataset adalah salinan, bukan sumber. Sampai seseorang menjalankan
   `bun --env-file .env.local lib/scripts/seed-fixtures.ts`, beranda yang
   terbangun masih merender satu em-dash. Tidak dijalankan di sini: menulis ke
   layanan eksternal tidak ada di rencana Tahap ini, dan re-seed juga
   mengunggah ulang sepuluh plate.
2. **Gerbang pre-flight hanya jalan di proyek desktop.** Aturan tinggi nav dan
   pembungkusan CTA memang aturan desktop menurut skill itu, dan asersi lain
   menyetel viewportnya sendiri — tapi tema, intent kontak, dan marquee akan
   punya arti di 390×844 juga. Tidak ditambahkan supaya runtime tidak berlipat
   demi sinyal yang kecil; disebut di sini supaya itu keputusan.
3. **Sistem radius belum digerbangi.** Delapan belas deklarasi `border-radius`
   berbeda dikirim dan belum ada tokennya; memaku sebuah angka sekarang berarti
   memilihnya sembarangan. Ikut lahirnya token radius di Tahap 37.
4. **Sepuluh baris di `DESIGN-SYSTEM.md` §7** adalah utang yang diakui, bukan
   yang dibayar. Tahap 36 dan 37 membayarnya.
5. Dial adalah **niat, bukan pengukuran**. Tidak ada gerbang yang bisa
   membuktikan sebuah halaman berada di VARIANCE 7.

### 9.9 Verifikasi

```
bun run check              hijau — 443 unit test, oxlint, oxfmt, tsc, manifest, assets
CI=true bun run test:e2e   440 lulus, 0 gagal, 16 dilewati, nol flake (10,3 menit)
bun run build-storybook    hijau
```

Halaman yang disentuh dipandangi di 1440×900. Nol klaim performa: tidak ada
profiler di lingkungan ini (`CLAUDE.md` #19).

### 9.10 Satu gerbang lama patah, dan patahnya jujur

Jalan pertama suite penuh: **437 lulus, 3 gagal.** Satu karena Storybook basi
(komponen berubah, `storybook-static/` belum dibangun ulang — dibangun ulang).
Dua lainnya nyata, dan keduanya asersi yang sama:
`visual-substance.e2e.ts` §"a declared accent carries tone".

> `the accent added no modulation: range 92.7 with it, 94.8 without`

Diagnosis, diukur bukan ditebak: pita yang diambil gerbang itu adalah
`y = 0.15h` sampai `0.5h` — di 1280×800, **120px sampai 400px**. Setelah hero
melepas 12svh dan header turun 26px, `h1` yang tadinya di bawah pita pindah ke
**309–491**, jadi **91px huruf putih di atas ground nyaris hitam** masuk ke
dalamnya. `range` pita itu lalu melaporkan kontras sebuah tipografi, bukan
modulasi sebuah wash — pada wash yang **tidak berubah satu piksel pun**
(ia lapisan `fixed` seukuran layar).

Ini invalidasi instrumen, bukan regresi desain, dan itu dibuktikan sebelum
apa pun disentuh.

**Perbaikannya bukan menggeser pita.** Pita yang dipilih agar tidak kena copy
akan patah lagi pada perubahan layout berikutnya. `contribution()` ditambahkan
ke `lib/styles/scripts/luminance.ts`: ia **mengurangkan kedua frame**, sehingga
semua yang identik di keduanya hilang dan yang tersisa persis lapisan yang
disembunyikan di antaranya. Asersinya kini berbunyi seperti maksud aslinya —
"aksen harus _melakukan_ sesuatu, bukan mengangkat pita secara rata" — dan
tidak lagi peduli di mana copy mendarat.

Diukur ulang di hari yang sama:

| Rute                             | Viewport | Rentang kontribusi |
| -------------------------------- | -------- | -----------------: |
| `/en` (wash WebGL)               | 1280×800 |           **15.9** |
| `/en/practice/<v>` (gradien CSS) | 1280×800 |           **12.1** |
| `/en`                            | 390×844  |            **9.7** |
| `/en/practice/<v>`               | 390×844  |            **8.9** |

Ambangnya tetap 3, dan **diperiksa bisa gagal** dengan menaikkannya ke 99 lalu
menonton keempatnya merah — gerbang yang belum pernah dilihat gagal adalah
gerbang yang belum diuji. Mesh mengungguli fallback CSS-nya adalah urutan yang
memang diinginkan desain, dan itu alasan kedua untuk mempercayai angkanya.

Jalan kedua: **440 lulus, 0 gagal, 16 dilewati, nol flake.**
