# Tahap 64 — Gulir horizontal dalam vertikal: karya yang bergerak sebagai satu tubuh

> **Satu mekanisme baru, dan satu-satunya di rencana ini.** Tahap 63
> menemukan bahwa mesin lama sudah dibelanjakan, jadi yang belum ada memang
> belum ada. Ini yang belum ada.

---

## 1. Dua koreksi terhadap rencana, keduanya dari melihat kodenya

### 1.1 "Sticky stack" sudah ada, dan bentuknya lebih baik

Rencana menyebut dua hal: gulir horizontal **dan** sticky stack. Yang kedua
sudah dibangun di Tahap 24–25 sebagai `vault/blocks/step-sequence` — label
sticky yang menahan sementara langkah-langkahnya lewat, dengan indeks aktif
dari `vault/motion/use-active-in-sequence`. Doc-nya bahkan memuat pengukuran
yang melahirkannya: versi pertama menahan hanya ~200px dari 900px viewport,
"a held note that resolves inside one screen is not held; it is a
coincidence."

Membangun "sticky stack" kedua berarti dua mekanisme untuk satu pekerjaan —
penolakan yang sama yang Tahap 63 terapkan pada `flip`. **Jadi tahap ini
hanya membangun yang horizontal.**

### 1.2 Rutenya bukan `/` dan `/work` — melainkan `/work/<slug>`

Rencana menyebut `/` dan `/work`. Keduanya gugur, dan keduanya karena bukti,
bukan selera.

**`/work` tidak bisa.** `e2e/first-screen.e2e.ts:113` menuntut sampul pertama
mulai di `< 85%` layar **dan** `opacity > 0.99` pada scroll 0. Katalog yang
jadi trek ter-pin melanggar keduanya sekaligus — gerbang **kebenaran**, yang
`DIREKSI.md` §3.1 tahan.

**`/` juga tidak, dan ini yang hampir saya lewatkan.** Bagian karyanya adalah
`ProjectGrid`, dan menggantinya dengan trek akan menghapus setiap
`article[data-span]` dari halaman. `e2e/catalogue-layout.e2e.ts:61` tidak akan
**gagal** — ia akan `test.skip`, karena ia melewati diri sendiri saat tidak ada
variasi span untuk dijaga. Komentarnya sendiri menuliskan kenapa itu buruk:

> "If someone 'simplifies' this by making the uniform layout unconditional,
> the home page loses its composition silently."

Membuat gerbang berhenti mengawasi tanpa memerahkannya justru cara paling
mahal untuk merusak sesuatu. **Grid home tetap.**

**`/work/<slug>` yang mendapatkannya, dan ia memang yang paling cocok:**

| alasan                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------- |
| Rute dengan ruang momen terbanyak — **1 dari 6** terpakai                                                                                 |
| `project-gallery` memang **deretan gambar** — persis isi yang trek horizontal ada untuknya                                                |
| Nol konflik gerbang: `first-screen` mengecualikannya, fold `project-detail` soal `<dl>` di atasnya, `catalogue-layout` tidak menyentuhnya |
| Halaman tempat calon klien benar-benar menilai karyanya, bukan sekadar melihatnya lewat                                                   |

---

## 2. Yang dibangun

`vault/motion/horizontal/` — satu section ter-pin yang gulir vertikalnya
menggerakkan trek horizontal di dalamnya.

**Isinya konten yang sudah ada**: karya unggulan, `ProjectCard` yang sama yang
sudah dipakai grid. Nol entri karangan (`DIREKSI.md` §4, perintah user yang
masih berlaku).

### 2.1 Mengikuti pola `Passage`, bukan menciptakan pola kedua

`vault/blocks/passage` adalah satu-satunya momen ter-pin di repo ini, dan
konvensinya diikuti persis:

| konvensi                                  | kenapa                                                                                                     |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `useGSAP({ dependencies, scope })`        | pembersihan otomatis, `CLAUDE.md` #7                                                                       |
| `matchMedia` **dan** hook-nya             | snapshot server hook adalah `false`; commit pertama salah tanpa ini                                        |
| `if (reduced) return` **sebelum** trigger | nol ScrollTrigger, jadi **nol pin spacer** — halaman kembali ke panjang aslinya                            |
| `scrub: 0.5`                              | angka yang sama dengan `parallax` dan `passage`; dua smoothing berbeda terbaca sebagai dua sistem berdebat |
| `end: '+=N%'`                             | panjang gulir dari trigger, bukan dari tinggi CSS                                                          |
| `pinSpacing: true`                        | footer tetap terjangkau, tombol `End` tetap jujur                                                          |
| `ease: 'none'`                            | scrubbed, jadi easing milik gulirnya                                                                       |
| `scrollTrigger?.kill()` lalu `kill()`     | `CLAUDE.md` #7                                                                                             |

Yang bergerak: `xPercent` pada trek. **Hanya `transform`** (`CLAUDE.md` #4).

---

## 3. Dua hal yang paling mungkin salah, dan cara membuktikannya

### 3.1 Reduced motion tidak boleh menyembunyikan karya

Trek horizontal yang tidak pernah bergulir adalah **karya yang tidak bisa
dilihat**. `if (reduced) return` saja tidak cukup di sini — berbeda dengan
`Passage`, yang isinya tetap terbaca tanpa animasi.

Jadi stylesheet-nya yang harus berjanji, bukan skripnya: di
`@media (--reduced-motion)` trek berhenti jadi trek dan jadi tata letak
membungkus yang biasa. Persis pola yang `use-active-in-sequence` doc-nya
tuntut dari konsumennya — _"the stylesheet has to promise it"_.

**Dibuktikan dengan mengukur**: di reduced motion, setiap kartu punya
`getBoundingClientRect()` di dalam dokumen dan `opacity: 1`, dan halaman tidak
punya pin spacer.

### 3.2 Keyboard tidak boleh melawan pin-nya

Ini bagian tersulit, dan alasan `DIREKSI.md` §4 menuntut buktinya:
`Tab` ke kartu yang berada di luar layar membuat browser menggulirkan
kontainer secara native — melawan transform yang dikendalikan pin, sehingga
posisinya berkelahi.

**Dibuktikan dengan keyboard saja**: `Tab` melintasi setiap kartu di trek,
lalu verifikasi (a) setiap kartu yang menerima fokus benar-benar terlihat,
(b) `scrollLeft` kontainernya tetap 0 — gulir native tidak pernah menang,
(c) urutan fokus keluar dari section ke elemen berikutnya, tidak terjebak.

Pin + scrub **bukan** scroll hijacking, dan bedanya dibuktikan di sini, bukan
diklaim.

---

## 3.5 Yang ditemukan saat merencanakan penyambungannya

Dicatat sebelum 64b dikerjakan, karena ia menentukan bentuk penyambungannya.

**`useReveal({ perItem: true })` adalah mekanisme yang salah di dalam pin.**
`ProjectGallery` memakainya, dan Tahap 56 menambahkannya dengan alasan yang
terukur: tengah `/en/work/<slug>` mati — dua dari dua belas langkah gulir
menghasilkan kedatangan. Satu `useReveal` di `<ul>` adalah satu peristiwa untuk
setiap plat di bawahnya.

Tapi `useReveal` adalah IntersectionObserver, dan **di dalam section ter-pin
item tidak pernah bergerak secara vertikal.** Semuanya berada di dalam pita
viewport yang sama sepanjang pin. Jadi per-item reveal akan menyala untuk
semuanya sekaligus — persis defek yang Tahap 56 perbaiki, kembali lewat pintu
lain.

Jawabannya bukan menambal observer-nya: **perjalanan horizontal ITU
kedatangannya.** Sebuah plat tiba saat ia masuk layar dari kanan, digerakkan
oleh gulir pembaca. Itu peristiwa per-item yang sesungguhnya, dan ia tidak
butuh observer sama sekali.

Jadi 64b: `perItem` dilepas di mode run, `useReveal` pindah ke section-nya
sebagai satu kedatangan untuk run itu, dan **alasan Tahap 56 tetap dipenuhi —
oleh mekanisme yang berbeda, bukan dengan membatalkan temuannya.**

Konsekuensi kedua, lebih kecil: `useParallax` di `.parallax` menghitung dari
posisi vertikal item, yang di dalam pin tidak pernah berubah. Ia tidak
_berkonflik_ dengan transform trek — elemennya berbeda — ia hanya jadi mati.
Dilepas karena kode mati yang terlihat hidup lebih buruk daripada kode yang
tidak ada.

---

## 4. Gerbang

| gerbang                     | yang dituntut                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| `epic-sequence`             | momen ini punya rentang gulirnya sendiri; tidak berbagi dengan `arth-passage` atau `hero-arrival` |
| `interaction-grammar`       | `unnamed` — gerakan >600ms wajib di dalam `[data-epic]` bernama                                   |
| `route-budget`              | plafon KB dinaikkan **di tahap ini**, dengan pengukuran tahap ini                                 |
| `first-screen`              | tidak tersentuh — `/` bukan rute katalog                                                          |
| `reveal-coverage`, `motion` | reduced motion, isi berakhir terlihat penuh                                                       |
| axe WCAG 2.2                | trek yang bisa digulir butuh nama dan peran yang benar                                            |
| **keyboard saja**           | §3.2                                                                                              |

Ditambah garis dasar Tahap 61 §6 sebagai pembanding: **90 long task di `/en`,
terpanjang 173ms**. Tahap ini menambah satu ScrollTrigger ter-pin ke halaman
itu; kalau angkanya naik tajam, itu temuan yang harus ditulis, bukan diabaikan.

---

## 5. Hasil

_Diisi sesudah dikerjakan._
