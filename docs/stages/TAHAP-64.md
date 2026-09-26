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

## 3.5 Klaim saya sendiri, diuji dan tidak didukung

Bagian ini sebelumnya menyatakan, dengan yakin, bahwa
`useReveal({ perItem: true })` adalah **mekanisme yang salah di dalam pin**:
karena item tidak bergerak vertikal, observernya akan menyala untuk semuanya
sekaligus. Itu ditulis dari penalaran, bukan pengukuran, dan **penalarannya
punya lubang**.

`IntersectionObserver` bekerja dua dimensi. `lib/hooks/use-reveal.ts` memakai
`rootMargin: '0px 0px -25% 0px'` — sisipannya hanya di **bawah**, tepi
kiri-kanan utuh. Sebuah item yang digeser trek ke luar tepi kanan viewport
karena itu memang berada di luar root observernya, dan seharusnya menyala saat
ia masuk. Perjalanan horizontal bisa jadi kedatangan per-item yang sah,
bukan pengganti yang harus ditambal.

### Kenapa ini tetap tidak diselesaikan

Diukur pada build produksi dengan trek yang benar-benar bergerak
(`travel: 1133`, x menempuh −1133..0):

```
y=0     -@x32*         -@x1171*
y=600   visible@x32*   visible@x1171*
y=1800  visible@x-556* visible@x583*
```

Keduanya menyala pada sampel yang sama — tapi itu **tidak membuktikan apa-apa
ke arah mana pun**. Setiap proyek fixture hanya punya dua gambar, dan pada
lebar probe item kedua mulai di `x=1171` di dalam viewport 1440: ia tidak
pernah benar-benar keluar layar, jadi observer yang membedakan posisi
horizontal dan yang tidak akan melaporkan hal yang sama.

**Jadi pertanyaannya terbuka, dan ditulis terbuka.** Ia butuh satu proyek
dengan empat gambar atau lebih untuk dijawab — konten yang belum ada. Yang
berubah dari versi sebelumnya bukan jawabannya melainkan status: dari klaim
yang terdengar pasti jadi pertanyaan yang menyebutkan bukti dan batasnya.

`perItem` **tetap dipakai** sampai ada yang membantahnya. Ia sudah benar untuk
jalur grid, dan tirai `PixelImage` bergantung pada `[data-reveal-item]`-nya di
kedua jalur — melepasnya atas dasar penalaran yang sudah sekali salah akan
menukar satu tebakan dengan tebakan lain.

### Satu konsekuensi yang tetap berlaku

`useParallax` menghitung dari posisi vertikal item, yang di dalam pin tidak
pernah berubah. Ia tidak _berkonflik_ dengan transform trek — elemennya
berbeda — ia hanya jadi mati di jalur run. Itu tidak bergantung pada
pertanyaan di atas.

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

| gerbang                    | hasil                                             |
| -------------------------- | ------------------------------------------------- |
| `bun run check`            | **424 lulus / 0 gagal**                           |
| `bun run build`            | hijau                                             |
| Mekanisme terukur bergerak | §5.1                                              |
| Klaim §3.5 diuji           | tidak didukung; dikoreksi jadi pertanyaan terbuka |

### 5.1 Mekanismenya bekerja, dan konten hari ini tidak cukup untuk memakainya

Dua pengukuran, keduanya pada build produksi 1440×900.

**Pertama — run diaktifkan tanpa syarat, seperti rencananya:**

```
items: 2  trackWidth: 1027  viewportWidth: 1161  travel: -134
TRACK x: 0 .. 0   |  sampel yang bergerak: 0 / 9
```

Treknya **lebih sempit dari kotaknya sendiri**. `travel()` di-clamp ke nol,
dan yang tayang adalah pin yang menahan satu layar penuh lalu tidak
melakukan apa pun. Semua **enam** proyek fixture punya tepat dua gambar, jadi
itu bukan kasus tepi — itu satu-satunya kasus yang ada.

`vault/blocks/step-sequence` sudah menamai kegagalan ini: _"a held note that
resolves inside one screen is not held; it is a coincidence."_ Pin dengan nol
perjalanan adalah cacat yang sama dengan volume dinaikkan.

**Kedua — dengan perjalanan tersedia (ambang dan lebar item diturunkan
sementara, lalu dikembalikan):**

```
items: 2  trackWidth: 2294  viewportWidth: 1161  travel: 1133
TRACK x: -1133 .. 0  |  sampel yang bergerak: 8 / 12
overflow-x: clip     |  pin-spacer: ada
```

Trek menempuh jarak penuhnya, pin bertahan melintasi rentang gulir nyata,
viewport-nya tidak bisa digulir sendiri. **Mekanismenya benar.**

### 5.2 Jadi bentuknya milik konten, bukan rute

`RUN_MINIMUM = 4` di `project-gallery`, dengan angkanya diturunkan dari
pengukuran: pada `34vw` per item, tiga item melewati kotaknya sekitar 320px —
sebuah sentakan; empat sekitar 800px — kira-kira satu layar, yang adalah
ambang di mana perjalanan terbaca sebagai perjalanan.

**Konsekuensi yang dinyatakan, bukan disembunyikan: pada fixture hari ini run
tidak pernah muncul.** Keenam proyek jatuh ke grid, yang memang desain yang
sudah terukur benar. Momennya tiba bersama proyek nyata pertama yang punya
kumpulan gambar sungguhan — dan itu utang konten fixture yang `ROADMAP.md`
sudah bawa, bukan utang baru.

Mengirimkannya aktif tanpa syarat akan mengirim cacat "dibangun dan tidak
pernah dipakai" **dan** cacat "pin yang tidak menahan" sekaligus, di keenam
halaman proyek.
