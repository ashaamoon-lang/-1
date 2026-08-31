# TAHAP 11 — Mempercantik: dari benar menjadi indah

Stage-spec yang diwajibkan `docs/ROADMAP.md` §3.0.

Sepuluh tahap sebelumnya membuat situs ini **benar**: terbaca tanpa JavaScript,
cacheable, dua bahasa sampai ke JSON-LD, nol pelanggaran axe, 195 tes e2e.
Tidak satu pun dari itu membuatnya **indah**.

Tahap ini soal yang kedua. Aturannya sama seperti sebelumnya: tiap klaim
diukur, tiap perbaikan datang dengan gate, dan yang tidak dikerjakan
dinyatakan.

---

## 1. Ritual `ui-ux-pro-max`, dan hasilnya sebagai pembanding

`.claude/agents/HOUSE-RULES.md` mewajibkan ritual skill sebelum keputusan UI.
Yang dijalankan:

```
search.py "commissioned artwork studio portfolio gallery minimal" \
  --design-system --variance 6 --motion 6 --density 3 -p "Arth"
search.py "portfolio grid image showcase hover" --domain ux
search.py "page transition route change continuity" --domain gsap
search.py "scroll reveal stagger grid"            --domain gsap
```

**Hasilnya sengaja dipakai sebagai pembanding, bukan sebagai perintah.** Sistem
desain proyek ini sudah dikunci di Tahap 1 setelah dikerjakan dua kali;
mengganti palet atau tipografi karena sebuah pencarian akan membatalkan
pekerjaan itu tanpa alasan baru. Jadi tiga baris di bawah ini adalah tiga
keputusan berbeda, bukan satu:

| Rekomendasi skill                                      | Putusan                                                                                                                                                                                                                                      |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Palet near-black + off-white, **tanpa aksen kromatik** | **Diterima — dan ini konfirmasi.** Persis yang dikunci Tahap 1 (`ink` / `paper`, `red` dibuang). Dua sumber independen sampai ke tempat yang sama.                                                                                           |
| Tipografi **Archivo / Space Grotesk**                  | **Ditolak, dengan alasan.** Syne dipilih karena digambar untuk Synesthésie, sebuah pusat seni — provenance-nya bagian dari argumennya (`DESIGN-SYSTEM.md` §2). Space Grotesk juga ada di daftar "AI-generated design tell" milik proyek ini. |
| Gaya **Motion-Driven** untuk portofolio                | **Diterima.** Ini temuan intinya — lihat §2.4.                                                                                                                                                                                               |
| Anti-pattern: **"Heavy text + Poor image showcase"**   | **Diterima sebagai diagnosis.** Lihat §2.2 dan §2.3.                                                                                                                                                                                         |

Hasil `--design-system` **tidak** di-`--persist`. Menuliskannya ke
`design-system/arth/MASTER.md` akan menciptakan sumber kebenaran kedua yang
menyebut Archivo dan hex yang bukan milik proyek ini, bersaing dengan
`docs/DESIGN-SYSTEM.md`. Yang berguna dari pencarian itu dicatat di sini.

> **`/dataviz` tidak berlaku.** Situs ini tidak punya satu pun bagan, dan
> tidak ada rencana menambahkannya — sebuah studio karya pesanan tidak
> memvisualisasikan data. Disebut supaya jelas ini keputusan, bukan
> kelalaian.

---

## 2. Temuan terukur

Semua angka di bawah dari build produksi di 1440×900, `prefers-reduced-motion:
reduce` (supaya yang dinilai adalah komposisi diam, bukan animasi yang belum
selesai).

### 2.1 Ritme section putus di satu tempat

Jarak antara header section dan isinya, halaman depan:

| Section    | Jarak header → isi |
| ---------- | ------------------ |
| `#work`    | **0px**            |
| `#studio`  | 48px               |
| `#contact` | 48px               |

Dua dari tiga konsisten; satu tidak. Judul "Recent commissions" menempel
langsung ke tepi atas gambar pertama, dan karena gambar itu besar dan gelap,
judulnya terbaca seperti caption gambar, bukan seperti judul section.

> **Catatan metode.** Pengukuran pertama saya salah bentuk: ia membandingkan
> `<h2>` dengan sibling berikutnya, yang di dalam `SectionHeader` adalah label
> "2 pieces" pada baseline yang sama — hasilnya −17px, sebuah angka yang tidak
> berarti apa-apa. Diukur ulang dari `<header>` ke elemen isi. Pelajaran yang
> sama dengan yang terus berulang di proyek ini: pengukuran yang salah bentuk
> lebih berbahaya daripada tidak mengukur.

### 2.2 Tepi kanan halaman detail bergerigi

Lebar elemen di `/en/work/rimbun`, sebagai persen viewport:

```
h1            92%
cover         78%
prosa         45%
galeri 1      65%
galeri 2      78%
next project  32%
```

Enam elemen, enam lebar berbeda. Tidak ada satu pun garis vertikal yang bisa
diikuti mata dari atas ke bawah. Gambar-gambarnya mempertahankan rasio
aslinya terhadap tinggi maksimum, jadi lebarnya jadi akibat dari rasio foto —
bukan keputusan.

Ini persis "Poor image showcase" yang ditandai skill: di situs yang seluruh
isinya karya rupa, **gambarnya adalah tata letaknya**, dan saat ini gambar
justru yang paling tidak tertata.

### 2.3 Prosa 45% di samping gambar 78%

Ukuran teks badan pada halaman detail benar secara tipografi (65 karakter,
`p` 14px) tetapi salah secara komposisi: kolom teks berhenti di 45% lebar
sementara gambar di atas dan di bawahnya berjalan sampai 78%. Teksnya jadi
terlihat seperti sisa, bukan seperti bagian.

### 2.4 `page-transition` dibangun lalu tidak pernah dipasang

> **Koreksi.** Versi pertama bagian ini menulis bahwa **seluruh**
> `vault/motion/` tidak terpakai — `text-reveal` dan `tokens.ts` ikut
> didaftar. Itu salah, dan salahnya karena inventarisnya salah bentuk: ia
> hanya memindai impor dari `app/` dan `components/`, sementara `text-reveal`
> diimpor oleh `vault/blocks/hero` (impor vault→vault) dan `tokens.ts` oleh
> `text-reveal`, `magnetic`, serta `cursor`. Sekali lagi: pengukuran yang
> salah bentuk lebih berbahaya daripada tidak mengukur.

Inventaris yang benar — impor dari mana pun:

| Modul                          | Status                                             |
| ------------------------------ | -------------------------------------------------- |
| `vault/motion/page-transition` | **tidak dipakai** — inilah temuannya               |
| `vault/motion/text-reveal`     | dipakai, lewat `vault/blocks/hero`                 |
| `vault/motion/tokens.ts`       | dipakai, lewat `text-reveal`, `magnetic`, `cursor` |

Temuannya jadi lebih sempit tapi lebih tajam: satu komponen dibangun di Phase
C lengkap dengan story dan penanganan reduced-motion, lalu **tidak pernah
dipasang** — dan karena tidak pernah dirender, dua bug di dalamnya tidak
pernah terlihat. Keduanya dicatat di §3b.

Yang tetap benar dari temuan awal, dan diukur ulang: **berpindah halaman
terasa seperti memuat dokumen**, dan di luar beranda hampir tidak ada yang
beranimasi masuk — `useReveal` hanya terpasang di `project-grid`, `hero`, dan
`studio-note`. Halaman katalog dan halaman karya, dua dari tiga kelas halaman
di situs ini, tidak menganimasikan apa pun.

Untuk situs portofolio itu bukan kekurangan efek: perpindahan halaman adalah
sebagian besar pengalamannya. Skill menandai product type ini sebagai
Motion-Driven; situsnya belum.

### 2.5 Yang diperiksa dan ternyata **bukan** cacat

Dicatat supaya tidak diperiksa ulang, dan supaya daftar di atas tidak dibaca
lebih panjang dari yang sebenarnya:

- **`<h1>` halaman detail tidak terpotong.** Terlihat mepet di screenshot, jadi
  saya ukur: `overflow: visible`, kotak h1 mulai persis di kotak induknya,
  `font-size: 120px` dalam `line-height: 102px`. Kerapatan itu adalah leading
  85% yang memang disengaja (`DESIGN-SYSTEM.md` §2) — tanda tipografi yang
  dipikirkan, bukan bug.
- **Chip filter di mobile** membungkus ke baris kedua dengan benar, target
  sentuh terpenuhi, `aria-current` mendarat di chip yang tepat.
- **Kartu di katalog** sudah satu ritme sejak commit sebelumnya.

---

## 3. Rencana kerja

Empat sub-tahap, diurutkan dari yang paling murah dan paling pasti ke yang
paling mahal. Tiap satu berdiri sendiri dan bisa dihentikan tanpa
meninggalkan situs setengah jadi.

### 11a. Menegakkan ritme spasial (murah, pasti)

Satu keputusan: jarak header→isi adalah satu token, dipakai semua section.

- `--space-section-lead` di skala spasi, bukan angka di satu modul CSS.
- `#work` ikut 48px seperti dua saudaranya.
- Sapu semua section di semua rute untuk jarak yang menyimpang.

**Gate:** tes yang membaca jarak header→isi tiap section di tiap rute dan
menuntut **satu nilai**, sama seperti `catalogue-layout.e2e.ts` menuntut satu
span. Dibuktikan merah dulu terhadap `#work` yang sekarang 0px.

### 11b. Menegakkan tepi (murah, pasti)

Gambar berhenti menentukan lebarnya sendiri. Dua lebar saja, keduanya token:

- **penuh** — kolom konten, 78%;
- **inset** — 65%, dipakai untuk gambar yang memang layak diberi jeda.

Yang dipilih adalah keputusan editor lewat field, bukan akibat rasio foto.
Rasio dijaga dengan `aspect-ratio` + `object-fit`, bukan dengan membiarkan
lebar melar. Prosa naik dari 45% ke lebar yang sejajar dengan salah satu dari
dua lebar itu, supaya ada garis vertikal yang bisa diikuti.

**Gate:** tes yang mengumpulkan lebar tiap elemen media di halaman detail dan
menuntut himpunannya **berukuran ≤ 2**. Merah sekarang (6 lebar berbeda).

### 11c. Memasang motion yang sudah dibangun (sedang)

`vault/motion/page-transition` dan `text-reveal` dipasang, dengan tier yang
dipilih sadar dari hasil skill:

| Gerakan             | Tier     | Durasi    | Kenapa tier itu                                                                             |
| ------------------- | -------- | --------- | ------------------------------------------------------------------------------------------- |
| Perpindahan rute    | Subtle   | 200–300ms | Skill: "exit harus selesai lebih cepat dari entrance" supaya back/forward terasa responsif. |
| Judul halaman masuk | Standard | 400ms     | Default proyek (aturan keras #3), tepat di tengah band standard.                            |
| Kartu grid muncul   | Subtle   | 250–350ms | Sudah ada lewat `useReveal`; yang diubah hanya durasinya agar sejajar dengan token.         |

Yang **tidak** diambil dari skill: easing `back.out(1.4)`. Itu overshoot, dan
aturan keras #1 melarang cubic-bezier mentah di komponen — easing harus dari
token `--ease-*`. Overshoot juga salah nada untuk situs galeri: karya rupa
tidak memantul.

Yang ditunda ke 11d: **shared-element transition (GSAP Flip)** dari kartu ke
halaman karya. Itu gerakan yang paling mengubah kesan situs ini, dan juga
yang paling mahal.

**Gate:** `route-budget.e2e.ts` sudah ada dan menjaga byte per rute — motion
baru tidak boleh menembusnya. Ditambah: tiap gerakan wajib punya keadaan akhir
yang benar di bawah `prefers-reduced-motion` (aturan keras #5), diperiksa
dengan render reduced-motion, bukan dengan membaca kode.

### 11d. Shared-element card → detail (mahal, opsional)

Sampul di kartu katalog dan sampul di halaman karya adalah gambar yang sama.
GSAP Flip bisa membuatnya bergerak, bukan berkedip.

Diletakkan terakhir dan ditandai opsional karena tiga alasan jujur:

1. Butuh plugin Flip, dan `Flip.from` **diam-diam tidak melakukan apa-apa**
   kalau elemennya tidak ada di kedua state — mode kegagalan yang tidak
   berbunyi.
2. Halaman karya sekarang `○` statis; transisi bersama menuntut kedua sisi
   ada di DOM pada saat yang sama, dan itu bersinggungan dengan cara Cache
   Components mengalirkan halaman.
3. Skill sendiri memperingatkan: jangan lebih dari satu pasang elemen per
   navigasi, dan uji di perangkat lemah karena Flip menghitung ulang layout.

Kalau (2) ternyata mahal, ini dibatalkan dan dinyatakan dibatalkan — bukan
dikerjakan setengah.

---

## 4. Yang tidak akan disentuh

Ditulis supaya tidak ada agen berikutnya yang "memperbaiki" ini:

- **Palet.** Dua netral hangat, tanpa aksen. Sudah dikonfirmasi ulang §1.
- **Tipografi.** Syne + Geist Mono, tiga bobot. Skala di `typography.ts`
  sudah diukur ulang sampai dua kali.
- **Leading di bawah 100%** pada display. Itu tanda tangannya, bukan bug.
- **`caption` 11px di mobile.** Pernah 8px dengan catatan mengakui itu terlalu
  kecil; catatan bukan perbaikan.
- **WebGL.** Tetap di balik feature flag, tetap aksen. Aturan keras #13.

---

## 5. Yang benar-benar terjadi

### 11a — ritme spasial

`--section-lead` masuk ke `customSizes` (`lib/styles/layout.mjs`), jadi ia
dibangkitkan per breakpoint lewat jalur yang sama dengan `--header-height`.
Angkanya dulu ditulis literal di dalam `StudioNote` dan `ContactBlock`, dan
**tidak ada sama sekali** di section `#work` halaman depan. Tiga salinan dan
satu lubang jadi satu definisi.

Gate `e2e/spatial-rhythm.e2e.ts` menuntut **satu ritme**, bukan 48px — mematok
angkanya akan membuat tes gagal tiap kali studio menyetel ritmenya, dan itu
keputusan desain, bukan urusan tes. Merah dulu, dengan diagnostiknya sendiri:
`sections disagree on the rhythm: work=0px, studio=43px, contact=43px`.

### 11b — tepi media

Tiga sebab terpisah, tak satu pun terlihat di diff:

1. `max-width: calc(78svh * var(--ratio))` membatasi **tinggi** dan membiarkan
   lebar jatuh dari proporsi tiap foto.
2. `ProjectGallery` tidak pernah meneruskan `className` ke `SanityImage`, jadi
   aturan `.image` miliknya **tidak pernah sekali pun berlaku** — `<img>`
   render di lebar intrinsik kandidat srcset, 1324px di dalam kotak 1398px.
   **CSS mati lebih buruk daripada CSS yang tidak ada**: ia terbaca seperti
   masalah yang sudah selesai.
3. `--column-width` diturunkan dari `100vw`, yang **termasuk scrollbar**, jadi
   setengah-track hitungan tangan keluar 696px melawan 691px milik grid. Lima
   piksel: tak terlihat sendirian, dan persis jenis nyaris-meleset yang tahap
   ini ada untuk menghapus.

Span galeri sekarang diturunkan dari bentuk gambarnya (lanskap penuh, potret
setengah), jadi track dan gambar akhirnya sepakat. Hasil: tiap elemen karya
**1398px atau 691px**.

### 11c — animasi yang dibangun lalu tidak dipasang

`page-transition` punya **dua** bug, dan keduanya tidak mungkin terlihat
karena komponennya tidak pernah dirender:

- **Ia berjalan di saat yang salah.** Seluruh urutan dipicu dari perubahan
  `usePathname()` — yaitu saat rute **baru** sudah selesai render. Pembaca
  akan menonton halaman yang mereka minta ditutupi lalu dibuka lagi.
  `lib/motion/navigation-signal.ts` menyediakan momen yang hilang, dari
  `onNavigate` milik Next 16.
- **Ia menagih GSAP untuk pekerjaan yang bisa dilakukan CSS.** GSAP di-opt-in
  per halaman dan hanya beranda mengambilnya, jadi overlay ber-GSAP akan
  beranimasi di tepat satu rute. Sekarang ia translate satu sumbu — aman
  diinterupsi, nol pustaka.

Terukur: `idle → covering (klik) → revealing (rute commit) → idle`.

### 11d — morph, dan yang ditemukannya

Rencananya menyebut GSAP Flip. Yang dipakai **bukan** itu: React
`<ViewTransition>` bekerja di App Router tanpa konfigurasi, jadi morphnya nol
pustaka. Terbukti di browser, bukan diasumsikan — `::view-transition-group(
work-cover-panas-sore)` dengan **kedua** paruh `old` dan `new` hadir, yang
berarti pasangannya benar-benar terbentuk.

**Konflik yang seharusnya saya lihat di rencana:** 11c mengirim penutup satu
layar penuh, dan morph hanya terbaca kalau pembaca **melihat** kedua keadaan.
Keduanya tidak bisa jalan bersama. Jadi `Link` sekarang mengumumkan niat, dan
overlay menyingkir untuk navigasi yang morph.

---

## 6. Cacat yang ditemukan tahap ini, di luar rencananya

Dua, dan keduanya lebih serius daripada apa pun di rencana awal.

### 6a. Teks redup di bawah AA — dan gate warnanya tidak bisa melihatnya

`lib/styles/scripts/contrast.test.ts` mengukur token turunan yang bisa ia
**parse dari `global.css`**. Tujuh komponen masing-masing menulis
`color-mix(… 55%, transparent)` sendiri di dalam modul CSS-nya, di mana gate
itu buta. Terukur di tema terang: **4.11:1** melawan 4.5 yang diminta AA —
axe menaruhnya di 4.07 pada label `<dt>` milik `ProjectHero`.

Tidak pernah muncul di situs karena tiap halaman mengirim `theme="dark"`.
Komponennya mendukung dua tema, jadi "situsnya kebetulan tidak memakai yang
gagal" bukan pembelaan.

Perbaikannya bukan menyunting tujuh persentase melainkan **menjadikannya
token** (`--text-muted`) di tempat yang gate-nya sudah membaca. Nilainya
ditetapkan **APCA, bukan WCAG**:

| mix | WCAG (gelap) | APCA Lc (gelap) |
| --- | ------------ | --------------- |
| 55% | 4.98         | 35.3            |
| 62% | 6.20         | 43.6            |
| 75% | 9.08         | **60.6**        |

62% lolos WCAG dua kali lipat dan tetap terbaca tipis, karena WCAG memodelkan
terang-di-atas-gelap dengan buruk — dan itu persis arah tiap halaman di sini.
Pada ~11px, tabel ukuran APCA meminta Lc 60. **75%**.

### 6b. Suite menguji Storybook yang basi

Cacat di atas hijau selama beberapa tahap karena `bun run test:e2e` **tidak
membangun Storybook**, jadi `storybook-a11y.e2e.ts` memeriksa apa pun isi
`storybook-static/` yang terakhir ada. Gate yang memeriksa artefak basi lebih
buruk daripada tidak ada gate: ia melapor tentang kode yang tidak dikirim.

Sekarang ada tes yang gagal kalau build lebih tua dari komponen yang
diperiksanya — dengan cakupan sempit (bukan `app/`, bukan `lib/styles/scripts`,
bukan file ter-generate), karena pemeriksa basi yang berteriak palsu akan
diabaikan lalu dihapus.

---

## 7. Kriteria keluar

| Kriteria                                           | Status | Bukti                                               |
| -------------------------------------------------- | ------ | --------------------------------------------------- |
| Jarak header→isi satu nilai di semua section       | ✅     | merah dulu di `#work` 0px; sekarang 48px × 3        |
| Elemen media halaman detail ≤ 2 lebar              | ✅     | 6 lebar → 1398px / 691px                            |
| `vault/motion` terpasang, tidak menganggur         | ✅     | `page-transition` terpasang; dua bug diperbaiki     |
| Tiap gerakan berakhir benar di reduced-motion      | ✅     | dirender, bukan dibaca: 0 item terdampar, 0 overlay |
| Morph kartu → halaman karya                        | ✅     | pasangan `old`+`new` terbukti di browser            |
| Tiap halaman **dilihat**, dua bahasa, dua viewport | ✅     | screenshot tiap sub-tahap                           |

**Gate:** `bun run check` (386 unit) · `build` · `build-storybook` ·
`CI=true bun run test:e2e` (**211 lulus**, dari 195).

---

## 8. Yang **tidak** dikerjakan, dinyatakan terbuka

1. **Morph hanya kartu → halaman karya.** Blok `next-project` menampilkan
   sampul karya berikutnya dan bisa dipasangkan juga, tapi panduan skill
   memperingatkan agar tidak lebih dari satu pasang per navigasi. Satu dulu,
   dievaluasi nanti.
2. **Morph bergantung pada rute tujuan yang sudah di-prefetch.** Kalau tujuan
   suspend ke fallback lebih dulu, pasangannya tidak terbentuk dan isinya
   masuk dengan animasi enter biasa. Prefetch di sini digerbangi Network
   Information API, yang tidak ada di tiap browser.
3. **`--text-muted` 75% mengubah tampilan sepuluh komponen.** Itu lebih
   terang dari sebelumnya. Disengaja, dan alasannya di §6a — tapi ini
   keputusan desain yang layak ditinjau studio, bukan sekadar perbaikan
   teknis.
4. **Belum ada profiling browser.** Tidak berubah dari Tahap 10.
