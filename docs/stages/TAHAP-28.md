# Tahap 28 — Pencarian: satu permukaan yang menjangkau ke dalam halaman

> Pendalaman wajib atas `docs/ROADMAP.md` §3.0.
> Fase 4 dari scaffold yang disetujui.

Status: **selesai**. Hasil di §9.

---

## 1. Ketegangan yang harus saya sebut lebih dulu

**Sebuah command palette ⌘K di situs studio 13 rute adalah fitur yang paling
mudah jadi hiasan.** Itu bukan alasan untuk tidak mengerjakannya — Anda sudah
memutuskan — tapi ia menentukan bentuknya, karena ada dua versi fitur ini dan
hanya satu yang pantas dikirim.

**Versi hiasan:** disembunyikan di balik pintasan yang hanya diketahui
developer, mengulang isi nav header, mencari enam tautan. Di situs yang
pengunjungnya calon klien dan bukan developer, pintasan tanpa tombol adalah
fitur yang tak seorang pun temukan — dan fitur yang tak ditemukan tetap
membebani setiap rute.

**Versi yang pantas dikirim**, dan yang akan dibangun:

1. **Ia menjangkau ke dalam halaman, bukan cuma ke halaman.** Nav header
   punya empat tautan. Indeks ini membawa setiap **proyek** (klien, tahun,
   bentuk keterlibatan), setiap **praktik**, dan setiap **entri jurnal** —
   hal-hal yang hari ini hanya bisa ditemukan dengan menggulir katalog.
2. **Ia punya tombol yang terlihat.** Pintasannya percepatan, bukan satu-satunya
   pintu. Sebuah ⌘K tanpa tombol adalah keputusan desain yang menguntungkan
   satu jenis pengunjung dan tidak terlihat oleh semua yang lain.
3. **Ia gratis sampai dibuka.** §3.

Kalau ketiganya tidak benar, fitur ini seharusnya tidak ada.

---

## 2. Apa yang dicari — nol konten baru

Semua sumbernya **sudah ada dan sudah dua bahasa**. Tidak ada satu kalimat pun
yang dikarang untuk tahap ini:

| Sumber                                                 | Sudah ada di                              | Yang dipakai                                 |
| ------------------------------------------------------ | ----------------------------------------- | -------------------------------------------- |
| Halaman statis (beranda, karya, studio, jurnal, `/ai`) | `lib/seo/route-catalog.ts`                | label + deskripsi, keduanya sudah dilokalkan |
| Praktik                                                | `lib/content/practices.ts` + katalog rute | label + deskripsi                            |
| Proyek                                                 | GROQ yang sama dengan katalog karya       | judul, klien, tahun, keterlibatan            |
| Entri jurnal                                           | `lib/content/journal-fallback.ts` / CMS   | judul, tanggal, ringkasan                    |

Katalog rute **sudah** membawa label dan deskripsi dua bahasa, dan komentarnya
menjelaskan kenapa: string-string itu dibaca manusia **dan** mesin, dan sudah
dipakai `/llms.txt`, `/[locale]/ai`, dan sitemap. Indeks pencarian jadi
konsumen keempat dari fakta yang sama — bukan salinan kelima yang bisa
menyimpang.

Aturan isi yang sudah berlaku di seluruh proyek berlaku di sini tanpa
perubahan: **CMS menang, perancah mengisi ketiadaannya**, dan nol byte ditulis
ke dataset.

---

## 3. Bagaimana ia dimuat — dan kenapa ini bagian yang paling menentukan

`e2e/route-budget.e2e.ts` mengukur `/en/practice/consulting` di **874 KB dari
plafon 900**. Sisanya **26 KB**, dan file itu sendiri menyebut angka itu
sebagai "yang harus diawasi".

Base UI `Dialog` + `Autocomplete` + `ScrollArea` tidak muat di 26 KB. Jadi
strateginya bukan menaikkan plafon — Anda memang memberi izin menaikkan
anggaran, tapi menaikkan anggaran untuk sesuatu yang **tidak perlu dimuat**
adalah membayar untuk kemalasan:

1. **Yang dikirim ke setiap rute** hanya `components/ui/command/trigger.tsx`:
   satu tombol dan satu pendengar `keydown`. Nol impor Base UI. Ratusan byte,
   bukan puluhan kilobyte.
2. **Palette-nya `next/dynamic`, `ssr: false`**, diimpor saat **pertama kali
   dibuka** — lewat tombol atau ⌘K.
3. **Indeksnya diambil sekali** dari `app/[locale]/search.json/route.ts`,
   dengan `'use cache'` pada pembangun bodinya — pola yang persis dipakai
   `app/llms.txt/route.ts`, dan komentarnya menjelaskan kenapa `'use cache'`
   tidak boleh membungkus handler-nya (`Response` bukan objek biasa).

Konsekuensinya bisa diperiksa: `route-budget` mengukur setelah `networkidle`
**tanpa** interaksi, jadi angka setiap rute tidak boleh bergerak sama sekali.
Kalau bergerak, strateginya gagal dan gerbangnya yang memberitahu.

**Nol dependensi baru.** `@base-ui/react` sudah terpasang; `dialog`,
`autocomplete`, dan `scroll-area` adalah tiga dari komponen yang scaffold §1
catat sebagai "terpasang, nol impor".

---

## 4. Aksesibilitas — di sinilah tahap ini pantas ada atau tidak sama sekali

Sebuah palette adalah salah satu pola yang paling sering dikirim rusak: fokus
tidak pernah masuk, `aria-activedescendant` tidak pernah menunjuk, Escape
menutup tapi fokus tidak kembali, dan pembaca layar mengumumkan "nothing".

Base UI menangani semantiknya. **Menangani bukan berarti terbukti**, dan
proyek ini sudah tiga kali menemukan cacat yang lolos karena diasumsikan
benar. Jadi lima hal diukur, bukan dipercaya:

1. ⌘K / Ctrl-K membuka; fokus **masuk** ke input.
2. `ArrowDown` menggerakkan `aria-activedescendant` ke id yang **ada di DOM**.
3. `Enter` menavigasi ke href item yang disorot.
4. `Escape` menutup **dan fokus kembali ke tombol pemicunya** — bukan ke
   `<body>`, yang membuang tempat pembaca keyboard berada.
5. axe bersih **pada palette yang terbuka**.

Poin 5 adalah pelajaran Tahap 25 §7.5 dalam bentuk baru, dan layak disebut
sebagai aturan: **axe hanya mengaudit yang dirender.** Tiga cacat lolos karena
elemennya di bawah lipatan; sebuah dialog yang tertutup bahkan tidak ada di
DOM. Rute mana pun bisa "bersih axe" selamanya sambil membawa palette rusak.

---

## 5. Tanpa JavaScript — tombol yang tidak berbohong

Palette tidak bisa ada tanpa JavaScript. Yang **tidak boleh** terjadi adalah
tombol yang dirender di HTML server lalu diam saat diklik.

Header adalah komponen klien, jadi markup tombolnya **ikut** ter-SSR — artinya
tanpa JS ia akan tampil dan mati. Jadi tombolnya disembunyikan oleh
`<noscript>` sampai JavaScript ada: nol biaya runtime, berlaku sebelum
hidrasi, dan tanpa kedipan tata letak yang ditimbulkan pola "render setelah
mount". Tanpa JS situs tetap seperti sekarang — nav header, katalog, dan
setiap tautan bekerja — dan tidak ada kontrol mati di mana pun.

`e2e/no-javascript.e2e.ts` tetap hijau tanpa perubahan, dan satu asersi
ditambahkan: tanpa JS, pemicunya **tidak terlihat**.

---

## 6. Gerak

Kosakata yang sudah ada, nol yang baru — alasan yang sama dengan Tahap 26.
Backdrop dan popup memakai `data-starting-style` / `data-ending-style` milik
Base UI, dipetakan ke **token** durasi dan easing proyek, dan hanya
`transform` + `opacity` (`CLAUDE.md` #4). Di bawah `prefers-reduced-motion`
transisinya jadi potong — muncul dan hilang, bukan hilang selamanya
(`CLAUDE.md` #5).

Ini **bukan** momen berkoreografi dan tidak masuk daftar `MOTION-SPEC.md`
§9.5. Ia perabot antarmuka, bukan bagian dari alur baca halaman.

---

## 7. Gerbang, dan yang dibuktikan merah lebih dulu

Berkas baru `e2e/command-palette.e2e.ts`:

1. **Terbuka lewat pintasan dan lewat tombol**, dua bahasa.
2. **Pencarian menemukan isi, bukan cuma rute** — mengetik nama sebuah proyek
   memunculkan proyek itu; mengetik kata dari sebuah entri jurnal memunculkan
   entri itu.
3. **Dioperasikan sepenuhnya dengan keyboard** — poin 1–4 di §4, termasuk
   `aria-activedescendant` yang menunjuk elemen nyata.
4. **Fokus kembali ke pemicu** saat ditutup.
5. **axe pada palette terbuka**, dua bahasa, dua viewport.
6. **Tanpa JS pemicunya tidak terlihat** (`no-javascript`).

Ditambah yang sudah ada dan tidak boleh bergerak:

7. **`route-budget` tidak naik satu KB pun** di rute mana pun. Ini gerbang
   terpenting tahap ini: ia yang membuktikan §3 benar.
8. `keyboard-focus` tetap hijau — tombol baru di header adalah perhentian
   fokus baru di setiap rute.

---

## 8. Risiko

**8.1 Permukaan baru di setiap halaman.** Header dipakai semua rute, jadi
kesalahan di sini ada di mana-mana. Dimitigasi dengan ukuran yang kecil
(tombol + pendengar) dan gerbang anggaran yang mengukur setiap rute.

**8.2 Palette yang isinya tipis.** Situs ini punya ~6 proyek, 3 praktik, 3
entri jurnal, 6 halaman statis — sekitar 18 hasil. Itu **cukup** untuk
membuat pencarian berguna dan **terlalu sedikit** untuk membuat pencarian
mengesankan. Saya tidak akan mengarang isi untuk menutupinya; kalau nanti
terasa kosong, jawabannya menerbitkan karya, bukan menambah entri palsu.

**8.3 Indeks yang menyimpang dari situs.** Dimitigasi dengan tidak membuat
sumber baru: setiap entri dibangun dari modul yang sudah dipakai sitemap dan
`/llms.txt`. Diuji unit.

---

## 9. Hasil

**Selesai.** Palette pencarian hidup di setiap rute, mencari 17 entri dari
sumber yang sudah ada, dan **tanpa satu pun plafon anggaran dinaikkan** —
meski gerbangnya sempat merah dan alasannya ternyata bukan yang saya duga.

### 9.1 Terkirim

| Berkas                              | Isinya                                                         |
| ----------------------------------- | -------------------------------------------------------------- |
| `lib/content/search-index.ts`       | Indeks murni + `matchScore`; **nol sumber isi baru**           |
| `lib/content/search-index.test.ts`  | 15 uji, 130 asersi                                             |
| `app/[locale]/search.json/route.ts` | Endpoint, `'use cache'`, dua bahasa, ter-prerender             |
| `components/ui/command/index.tsx`   | Pemicu — tombol + satu pendengar `keydown`                     |
| `components/ui/command/palette.tsx` | Dialog + Autocomplete + ScrollArea, dimuat saat pertama dibuka |
| `e2e/command-palette.e2e.ts`        | 9 gerbang                                                      |

Terverifikasi hidup: `/en/search.json` dan `/id/search.json` masing-masing
17 entri — 5 halaman, 3 praktik, 6 proyek, 3 entri jurnal — dan **seluruhnya
dilokalkan**, termasuk deskripsi keterlibatan proyek dan nama bulan pada
tanggal.

**Nol dependensi baru.** `dialog`, `autocomplete` dan `scroll-area` adalah
tiga komponen Base UI yang scaffold §1 catat sebagai "terpasang, nol impor".

### 9.2 Gerbang anggaran merah — dan penyebabnya bukan palette-nya

§3 menjanjikan angka rute tidak bergerak sama sekali, dan menulis bahwa kalau
janjinya salah, gerbangnya yang memberi tahu. Gerbangnya memberi tahu:

| rute                      | sebelum | dengan palette | plafon |
| ------------------------- | ------- | -------------- | ------ |
| `/en/work`                | 871 KB  | **914 KB**     | 900    |
| `/en/work/arus-balik`     | 866 KB  | 909 KB         | 900    |
| `/en/practice/consulting` | 874 KB  | **917 KB**     | 900    |

Tiga rute lewat plafon, untuk kode yang belum dibuka siapa pun.

Yang saya duga salah dua kali sebelum mengukur benar:

1. **Bukan `next/dynamic`.** Diganti `React.lazy` — angkanya identik.
2. **Bukan Base UI yang bocor.** Diprobe dengan penanda `aria-autocomplete`
   dan `search.json`: kode palette-nya memang **tidak pernah** tiba lebih
   awal. Pemisahannya bekerja sejak awal.

Yang benar, ditemukan dengan membandingkan daftar chunk terhadap build tanpa
pemicu: ada **dua chunk 43 KB yang isinya sama** — keduanya membawa Header,
LanguageSwitcher, Lenis, dan pemicunya. Penyebabnya **satu impor di dalam
palette**: `components/ui/link`, yang juga tinggal di chunk eager milik
header. Sebuah modul yang dipakai chunk eager **dan** chunk async membuat
webpack menggandakan seluruh grup chunk-nya.

Dibuktikan dengan mencabut impor itu saja: 914 → **880 KB**, dan chunk-nya
kembali satu.

Perbaikannya menjaga keduanya: barisnya tetap `<a href>` sungguhan — bisa
diklik-tengah, disalin, dibuka di tab baru — dan navigasi klien dikembalikan
lewat `router.push` milik Next, yang sudah ada di setiap halaman. Yang hilang
dari tidak memakai `components/ui/link`, yaitu prefiks lokal, memang tidak
dibutuhkan: setiap href di indeks sudah membawa lokalnya.

**Plafon tidak dinaikkan satu KB pun**, padahal Anda mengizinkannya. Aturan
file itu sendiri yang berlaku: daftarnya keputusan, angkanya cuma plafon —
dan perbaikan yang benar adalah berhenti mengirim beratnya, bukan
mengizinkannya.

### 9.3 Jawaban yang salah, dibuktikan merah lalu diperbaiki

Palette pertama mengurutkan hasil secara struktural — halaman, praktik,
karya, tulisan — lalu menyorot yang pertama. Diukur:

| diketik      | Enter membuka (sebelum)   | sesudah                        |
| ------------ | ------------------------- | ------------------------------ |
| `scope`      | **Beranda**               | **Scope is the deliverable**   |
| `evaluation` | **AI and data** (praktik) | **Evaluation before pipeline** |
| `arus`       | Arus Balik                | Arus Balik                     |

Mengetik kata pertama dari judul sebuah entri jurnal membuka **beranda**,
karena deskripsi beranda kebetulan memuat kata "scopes".

Mencocokkan seluruh isi baris adalah yang membuat nama klien bisa ditemukan;
ia juga yang membuat sebuah penyebutan sepintas mengalahkan judul. Keduanya
benar sekaligus, jadi perbaikannya bukan mempersempit pencarian melainkan
memberi peringkat: judul-diawali (3) > judul-memuat (2) > baris-memuat (1).
Kueri kosong memberi 1 ke semuanya, jadi urutan istirahatnya tetap urutan
situs. Grup pun ikut diurutkan oleh jawaban terbaiknya, supaya sorotan —
dan karena itu Enter — mendarat di sana.

### 9.4 Aksesibilitas, diukur bukan dipercaya

- ⌘K/Ctrl-K membuka, fokus **masuk** ke input (`role="combobox"`).
- `aria-activedescendant` menunjuk id yang **ada di DOM** — diperiksa, bukan
  diasumsikan dari dokumentasi Base UI.
- Enter membuka hasil yang disorot; navigasi klien, bukan muat ulang.
- Escape menutup **dan fokus kembali ke tombol pemicu**. Kalau palette dibuka
  dengan pintasan saat ada elemen lain terfokus, fokus kembali ke elemen itu
  — perilaku Base UI yang benar; pengembalian ke pemicu hanya dipakai saat
  "sebelumnya" adalah `<body>`, yang akan menelantarkan pembaca keyboard.
- **axe bersih pada palette yang terbuka**, dua bahasa. Ini pelajaran Tahap 25
  §7.5 dalam bentuk baru: dialog yang tertutup tidak ada di DOM, jadi setiap
  rute bisa hijau selamanya sambil membawa palette rusak.

### 9.5 Dua cacat tata letak yang **tidak satu pun gerbang** temukan

Sesudah semua gerbang hijau — axe, keyboard, peringkat, anggaran — palette-nya
**dipandangi**, dan dua hal langsung terlihat:

1. **Daftarnya keluar dari bingkai.** Diukur: viewport-nya 1286px di dalam
   wilayah 617px, jadi barisnya melewati **689px** di bawah popup, menimpa
   baris petunjuk dan lolos dari frame. `overflow: scroll` sudah ada sejak
   awal — tidak ada yang bisa di-overflow, karena `max-block-size: 100%`
   bukan tinggi yang definit. Bentuk yang benar adalah milik Base UI sendiri:
   Root flex yang membatasi tingginya dan memotong, Viewport sebagai anak
   flex yang boleh menyusut.
2. **Kotak "tidak ada hasil" menahan 56px** di bawah kolom isian sementara
   tujuh belas hasil sedang tampil, karena padding-nya dideklarasikan pada
   `Autocomplete.Empty` yang tetap ada di pohon. Padding-nya dipindah ke
   elemen yang hanya ada saat pesannya ada.

Keduanya kesalahan saya, keduanya kasat mata, dan **nol gerbang** menangkapnya.
Ini persis yang `CLAUDE.md` maksud dengan "gerbang hijau bukan situs yang
benar".

### 9.6 Verifikasi

- `bun run check` — exit 0, **432 uji unit** (dari 417).
- `CI=true bun run test:e2e` — **362 lulus, 0 gagal**, 18 dilewati.
- `route-budget` — **9/9 lulus, nol plafon dinaikkan**.
- Storybook dibangun ulang; gerbang kebaruannya lulus.
- Dipandangi di 1440×900 (EN) dan 390×844 (ID): bingkai tertutup, bilah
  petunjuk di dalam, scrollbar hidup, nol overflow horizontal.
- Tidak ada klaim performa (`CLAUDE.md` #19).

### 9.7 Yang tidak dikerjakan, disebut

- **Tidak ada story Storybook.** Palette-nya mengambil indeks dari sebuah rute
  dan membaca konteks lokal next-intl; sebuah story akan memerlukan keduanya
  dipalsukan, dan yang diperlihatkannya adalah tiruan, bukan komponennya.
  Yang menjaganya adalah `e2e/command-palette.e2e.ts` pada situs sungguhan.
- **Tidak ada pencarian fuzzy.** Substring, bukan Levenshtein. Dengan 17 entri
  itu kelebihan; kalau indeksnya tumbuh dan salah ketik jadi masalah,
  `matchScore` adalah satu-satunya tempat yang berubah.
- **Tidak ada riwayat pencarian atau "baru dibuka".** Butuh penyimpanan per
  pembaca, dan tidak ada yang meminta.
