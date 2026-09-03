# Tahap 16 — Perjalanan

> Pendalaman wajib atas `docs/ROADMAP.md` §3.0. Tidak ada kode sebelum dokumen
> ini ada.

Status: **spec**. Hasil diisi di §11 saat tiap sub-tahap selesai.

---

## 1. Kenapa tahap ini, dan bukan halaman baru

Permintaan berdiri pemilik masih sama: kembangkan situsnya dari sisi-sisi lain,
buat animasinya lebih baik, dan bangun skema routing yang otonom. Tahap 15
menjawab bagian pertamanya — tiga praktik mendapat halamannya.

**Menambah halaman lagi akan memperburuk situs ini, bukan memperbaikinya.**
Peta rute §1.1 sudah lengkap: beranda, katalog, detail karya, tiga halaman
praktik, `/ai`, `sitemap.xml`, `robots.txt`, `llms.txt`, `/studio`. Yang tidak
lengkap adalah **isinya** — Tahap 13 §9 masih terbuka, pernyataan praktik masih
placeholder yang halaman itu sendiri akui. Halaman keempat yang isinya karangan
menambah permukaan, bukan situs.

Yang belum pernah diperiksa sekali pun dalam enam belas tahap adalah **apa yang
terjadi di antara halaman**.

### 1.1 Bukti bahwa ini titik butanya

Tahap 15b menemukan bahwa setiap navigasi internal mendaratkan pembaca di
offset scroll halaman **sebelumnya** — beranda ke halaman praktik membuka
halaman itu di 1522, maksimumnya sendiri, dengan `<h1>` 1136px di atas layar.
Cacat itu bertahan enam belas tahap dengan semua gerbang hijau.

Sebabnya struktural, dan masih berlaku: **setiap gate di repositori ini menguji
halaman dengan `page.goto`**, yang selalu mulai dari nol, sendirian, tanpa
sejarah. Tidak ada satu pun yang menguji seorang pembaca yang _bergerak_.
Kelas cacat yang hanya muncul saat berpindah karena itu mustahil terlihat.

Tahap ini menutup kelas itu, bukan satu contohnya.

---

## 2. Ritual `ui-ux-pro-max` — hasilnya, termasuk yang nol

Dijalankan sesuai §2.1. Ditempel apa adanya supaya bisa ditelusuri.

### 2.1 `"page transition" --domain gsap`

Tiga hasil, dan satu di antaranya satu-satunya baris di seluruh basis data yang
menyebut back/forward:

| Tier     | Durasi    | Easing         | Catatan yang dipakai                                                                                             |
| -------- | --------- | -------------- | ---------------------------------------------------------------------------------------------------------------- |
| Subtle   | 200–300ms | `power1.inOut` | **"Exit animation should always resolve faster than entrance (asymmetric timing) so back/forward feels snappy"** |
| Standard | 400–600ms | `power2.inOut` | Overlay tetap ter-mount di root layout, di luar komponen halaman                                                 |
| Complex  | 500–800ms | `expo.inOut`   | Satu pasang shared-element per navigasi; "compounding Flips are hard to time correctly"                          |

Baris Subtle itu yang mengikat §5: perlakuan mundur harus **lebih cepat**
daripada maju. Bukan selera — itu satu-satunya panduan terukur yang basis data
punya tentang arah balik.

### 2.2 `"navigation" --stack nextjs`

Dua hasil. Yang kedua terbaca seolah bertentangan dengan Tahap 15b, dan itu
harus disebut daripada disembunyikan:

> **Do:** `scroll={false}` for tabs pagination · **Don't:** Always scroll to top

Kontradiksinya semu. Barisnya bicara tentang **tab dan paginasi** — kontrol
yang menukar isi _di dalam_ halaman yang sama, di mana melompat ke puncak
memang salah. Tahap 15b bicara tentang **perpindahan halaman**, di mana
membawa offset halaman sebelumnya membuat pembaca mendarat di ujung bawah
halaman yang baru saja mereka minta. Situs ini tidak punya tab maupun paginasi.
Kalau nanti punya, baris itu yang berlaku di sana, dan `scroll` memang sebuah
prop justru supaya kasus itu bisa memilih.

### 2.3 `"back navigation"` dan `"scroll restoration" --domain ux`

Lima dan tiga hasil, **tidak satu pun tentang gerak saat mundur**. Yang ada:
tombol back harus memakai `history.pushState` (sudah), nav sticky tidak boleh
menutupi konten, dan anchor harus menggulir halus (`anchors: true` milik Lenis
sudah menanganinya — terukur, `#work` ke 660).

### 2.4 Yang **tidak** ada di basis data

Sesuai §2.1 aturan 2, disebut terus terang: **tidak ada satu baris pun**
tentang apakah sebuah navigasi mundur harus menjalankan transisi sama sekali,
tentang View Transitions API, atau tentang React `<ViewTransition>`. Keputusan
§5 karena itu **bukan** berbasis basis data skill. Yang berbasis skill hanya
_asimetri waktunya_ (§2.1), dan itu disebut apa adanya.

---

## 3. Inventaris — yang sudah ada dan tidak dibangun ulang

Sesuai §3.0 langkah 3.

| Sudah ada                         | Menutupi                                                                 |
| --------------------------------- | ------------------------------------------------------------------------ |
| `lib/motion/navigation-signal.ts` | Sinyal "navigasi dimulai" + `NavigationIntent` (`cover` \| `morph`)      |
| `vault/motion/page-transition`    | Overlay penutup, ter-mount di root, sadar reduced motion                 |
| `components/ui/link`              | Satu-satunya tempat navigasi internal diumumkan (`onNavigate`)           |
| `lib/motion/transition-name.ts`   | Nama pasangan morph                                                      |
| `vault/motion/tokens.ts`          | Durasi dan easing berpita                                                |
| `e2e/navigation-landing.e2e.ts`   | Pendaratan satu hop (Tahap 15b) — tahap ini memperluasnya jadi rangkaian |

**Tidak ada komponen baru yang dibutuhkan.** Tahap ini menambah satu hook kecil
dan satu berkas gate; sisanya menyambung yang sudah ada.

Yang **tidak** dipakai, dan tetap tidak: GSAP Flip (morph sudah dikerjakan
`<ViewTransition>`, dan dua mekanisme untuk satu pekerjaan adalah utang),
Observer, Tabs, Accordion, sim fluid.

---

## 4. Yang sudah diukur sebelum spec ini ditulis

Semua angka di bawah dari server berjalan, bukan dugaan.

| Pertanyaan                       | Terukur                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Fokus setelah navigasi klien     | `body`; satu Tab berikutnya jatuh ke tautan pertama di puncak                                                 |
| Rute diumumkan ke pembaca layar? | **Ya** — `next-route-announcer`, `aria-live="assertive"`, teks `"Consulting — Arth"`                          |
| Scroll saat mundur               | **Dipulihkan** — kembali ke 3520; maju lagi ke 0                                                              |
| Judul dokumen ikut berubah       | Ya — `Arth` → `Consulting — Arth` → `Arth`                                                                    |
| Transisi saat **mundur**         | **Tidak ada sama sekali** — nol pseudo-element                                                                |
| `params` di luar `<Suspense>`    | Ada di `/[locale]/practice/[value]` **dan** `/[locale]/work/[slug]`; tidak ada di `/en`, `/en/work`, `/en/ai` |

### 4.1 Tiga instrumen salah bentuk, dicatat bukan dibuang

Pertanyaan "apakah rutenya diumumkan" butuh **tiga** percobaan sebelum
jawabannya benar, dan dua jawaban pertama keduanya salah ke arah yang
mengkhawatirkan:

1. `document.querySelectorAll('[aria-live]')` hanya menemukan viewport toast
   yang kosong → kesimpulan "tidak ada announcer sama sekali". **Salah:**
   announcer Next hidup di dalam **shadow root**, yang tidak ditembus
   `querySelectorAll`.
2. Memakai `document.getElementsByName('next-route-announcer')` — persis
   seperti kode Next sendiri — mengembalikan `undefined` → kesimpulan
   "announcer tidak pernah mount". **Salah lagi:** `getElementsByName`
   mencocokkan atribut `name`, bukan nama tag, dan elemen itu dibuat tanpa
   atribut `name`.
3. `document.querySelector('next-route-announcer')` → ketemu, dan teksnya
   benar-benar terisi.

Kalau dua percobaan pertama masuk ke spec ini, tahap ini akan dibuka dengan
"situs ini tidak mengumumkan rute ke pembaca layar" — sebuah cacat aksesibilitas
yang tidak ada, dan perbaikan yang menduplikasi apa yang framework sudah
kerjakan. Ini pengulangan pelajaran Tahap 14: **instrumen yang salah bentuk
menghasilkan angka meyakinkan yang menunjuk ke perbaikan yang salah.**

---

## 5. Tahap 16a — mundur juga dikoreografikan

**Terukur:** maju menjalankan transisi (overlay penutup, atau morph untuk dua
pasangan yang punya nama bersama). Mundur menjalankan **nol** — potongan keras.

Pembaca yang menekan sebuah praktik mendapat gerak yang disusun; pembaca yang
menekan back mendapat jump-cut. Itu bukan pilihan yang pernah dibuat; itu
konsekuensi dari `announceNavigation()` yang hanya dipanggil dari `onNavigate`
sebuah `<Link>` — dan **tombol back tidak menekan tautan apa pun.**

**Perlakuannya, dan alasan tiap angkanya:**

- Mundur mendapat **cover**, bukan morph. Morph butuh dua ujung yang punya nama
  bersama; saat mundur, tujuannya adalah halaman yang scroll-nya dipulihkan ke
  posisi lama, dan elemen pasangannya bisa berada di mana saja termasuk di luar
  viewport — di mana React memang mencabut namanya (`MOTION-SPEC.md` §9.4
  aturan 6). Menjanjikan morph yang diam-diam merosot jadi cross-fade adalah
  persis cacat yang baru diperbaiki Tahap 15b.
- Durasinya **lebih pendek daripada maju**, sesuai satu-satunya panduan basis
  data yang relevan (§2.1): _"exit should always resolve faster than entrance …
  so back/forward feels snappy"_. Angka pastinya diambil dari
  `vault/motion/tokens.ts`, bukan ditulis di komponen (`CLAUDE.md` #8), dan
  tetap di pita 300–600ms (#3).
- **Reduced motion tetap memutus semuanya** (#5). Mundur di bawah preferensi itu
  adalah potongan keras — yang memang keadaannya sekarang, jadi jalur itu tidak
  berubah dan gate-nya membuktikan begitu.

**Mekanismenya:** satu hook yang mendengarkan `popstate` di `window` dan
mengumumkan lewat modul sinyal yang sudah ada. Tidak ada API baru, tidak ada
dependensi, dan `page-transition` tidak perlu tahu dari mana sinyalnya datang.

---

## 6. Tahap 16b — gate perjalanan

Berkas baru `e2e/journey.e2e.ts`: satu pembaca, satu sesi, banyak hop.

```
/en → praktik → karya → back → back → forward → praktik lain
```

Di **setiap** hop, yang diperiksa:

| Invarian                          | Kenapa ia ada                                                        |
| --------------------------------- | -------------------------------------------------------------------- |
| Mendarat di puncak (maju)         | Cacat Tahap 15b, sekarang berantai bukan satu hop                    |
| Scroll dipulihkan (mundur)        | Terukur benar hari ini; tanpa gate ia bisa hilang diam-diam          |
| Tidak ada overlay yang tertinggal | Overlay yang terdampar menutupi halaman dan tak bisa ditutup pembaca |
| Nol `view-transition-name` sisa   | Nama yang bocor mencemari pasangan navigasi berikutnya               |
| Judul dokumen berubah tiap hop    | Announcer Next membacanya; judul basi = pengumuman salah             |
| Nol console error                 | Sudah dijaga per halaman, belum pernah lintas hop                    |

Ditambah satu hal yang tidak bisa diperiksa per halaman: **navigasi keenam
harus berperilaku sama dengan yang pertama.** Kebocoran keadaan menumpuk, dan
hanya rangkaian yang bisa melihatnya.

Berjalan di dua viewport, sebab pendaratan bergantung tinggi layar
(`playwright.config.ts` sudah punya alasannya tertulis untuk gate saudaranya).

---

## 7. Tahap 16c — shell instan, atau alasan kenapa tidak

Konsol dev melaporkan, pada dua rute dinamis:

```
`params` … accessed outside of `<Suspense>` may prevent the navigation from
being instant
```

Terukur ada di `/[locale]/practice/[value]` dan `/[locale]/work/[slug]`; tidak
ada di rute statis. Artinya setiap navigasi ke sebuah karya atau praktik
menunggu shell-nya, alih-alih menyajikan shell lebih dulu.

**Dan ini tarik-menarik dengan Tahap 9.** Gate tanpa-JavaScript ada justru
karena satu `loading.tsx` membungkus setiap rute terlokalisasi dalam batas
Suspense dan membuat beranda merender **28 karakter** bagi perayap. Menambahkan
`<Suspense>` kembali ke rute-rute ini adalah gerakan ke arah yang sama dengan
yang dicabut waktu itu.

Sub-tahap ini karena itu **berbentuk investigasi, bukan janji**:

1. Ukur apakah `<Suspense>` di sekitar pembacaan `params` saja — bukan seluruh
   halaman — bisa memuaskan Next **tanpa** menurunkan HTML tersaji.
   `e2e/no-javascript.e2e.ts` adalah wasitnya, dan ia menghitung karakter serta
   tautan, bukan sekadar status 200.
2. Kalau bisa: kerjakan, dengan gate tanpa-JS dibuktikan tetap hijau.
3. Kalau tidak bisa: **jangan dikerjakan**, dan tulis angkanya di §11 —
   berapa karakter yang hilang, dan di rute mana. `CLAUDE.md` #21.

Tidak ada klaim kecepatan yang keluar dari sub-tahap ini kecuali ada yang benar
-benar terukur; tidak ada profiler di lingkungan ini (#19).

---

## 8. Berkas

**Baru**

| Berkas                                               | Untuk                             |
| ---------------------------------------------------- | --------------------------------- |
| `lib/motion/use-popstate-signal.ts` (nama sementara) | Hook `popstate` → sinyal navigasi |
| `e2e/journey.e2e.ts`                                 | Gate 16b                          |
| `docs/stages/TAHAP-16.md`                            | dokumen ini                       |

**Diubah**

| Berkas                          | Perubahan                                         |
| ------------------------------- | ------------------------------------------------- |
| `vault/motion/page-transition/` | Berlangganan sinyal mundur; durasi mundur sendiri |
| `vault/motion/tokens.ts`        | Token durasi mundur, kalau belum ada yang cocok   |
| `playwright.config.ts`          | `journey.e2e.ts` ikut di viewport mobile          |
| `docs/MOTION-SPEC.md`           | Aturan arah balik, dengan angkanya                |
| `docs/ROADMAP.md`               | Tahap 16 + hasilnya                               |

Rute 16c hanya disentuh kalau §7 langkah 1 berhasil.

---

## 9. Kriteria keluar — bisa dijalankan

```bash
bun run check              # exit 0
bun run build              # produksi bersih
CI=true bun run test:e2e   # 267 + gate baru, 0 gagal
bun run build-storybook    # gate kebasian menuntutnya kalau komponen berubah
```

Ditambah, khusus tahap ini:

- Tiap asersi baru **dibuktikan merah dulu**, dengan angkanya ditulis.
- Mundur di bawah `prefers-reduced-motion` tetap potongan keras, dan itu
  diperiksa, bukan diasumsikan.
- Gate perjalanan lulus di dua viewport.

---

## 10. Risiko

**10.1 `popstate` menembak untuk hal yang bukan perpindahan halaman.** Perubahan
hash (`#work`), dan `history.replaceState` milik pihak lain, bisa memicunya.
Overlay yang menyapu karena pembaca menekan sebuah anchor adalah cacat yang
lebih buruk daripada tidak ada overlay sama sekali. Mitigasi: sinyal hanya
dikirim kalau **pathname** benar-benar berubah, dan gate perjalanan menekan
anchor lalu memastikan overlay tetap `idle`.

**10.2 Overlay mundur bisa menutupi restorasi scroll.** Kalau overlay membuka
sebelum browser memulihkan posisi, pembaca melihat halaman melompat. Diukur,
bukan diduga: gate memeriksa posisi akhir, dan urutannya disamplekan.

**10.3 Dua transisi bertabrakan.** Mundur cepat berkali-kali bisa memulai
overlay kedua di atas yang pertama. `MOTION-SPEC.md` §9.4 aturan 1 menuntut
setiap momen bisa diinterupsi dengan resolusi yang terdefinisi, dan gate
double-click yang sudah ada adalah bentuk maju dari uji yang sama.

**10.4 16c mungkin tidak bisa dikerjakan.** Itu hasil yang sah, bukan kegagalan
— asal angkanya ditulis (§7 langkah 3).

**10.5 Tahap ini tidak menambah satu pun kata untuk pembaca.** Pernyataan
praktik masih placeholder (Tahap 13 §9). Tahap ini memperbaiki bagaimana situs
bergerak, bukan apa yang dikatakannya, dan itu disebut supaya tidak ada yang
mengira isinya sudah beres.

---

## 11. Hasil

_Diisi saat sub-tahap dikerjakan._
