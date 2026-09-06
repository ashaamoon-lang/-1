# Tahap 52 — Permukaan informasi: yang diukur dulu, baru dinaikkan

> Rencana punya empat butir. **Satu premisnya tidak ada di kodenya**, satu
> bertabrakan dengan anggaran yang rencana itu sendiri kunci, dan satu lagi
> bergantung pada fitur CSS yang **bukan Baseline**. Dokumen ini menyelesaikan
> ketiganya dengan angka lebih dulu.

## 1. Baseline, diukur

Build produksi `48svh` (`HEAD` sesudah Tahap 51), 1440×900 dan 390×844:

| rute                 |     dokumen |       layar | `data-epic` di DOM     | §9.5 mendeklarasikan  |
| -------------------- | ----------: | ----------: | ---------------------- | --------------------- |
| `/en/practice/<v>`   | 3030 / 3005 | 3,37 / 3,56 | `work-transport` ×2    | morph + passage (2)   |
| `/en/journal`        | 2937 / 2408 | 3,26 / 2,85 | `journal-transport` ×3 | index + transport (2) |
| `/en/journal/<slug>` | 3795 / 2429 | 4,22 / 2,88 | **nol**                | transport (1)         |
| `/en/work/<slug>`    | 4193 / 3185 | 4,66 / 3,77 | `project-arrival`      | arrival (1)           |

Geometri hero, 1440×900:

```
/en/practice/consulting   hero 630px = 70% layar    h1 di 542–644
/en/journal               hero nol                   h1 di 186–288
/en/journal/<slug>        hero nol                   h1 di 225–429
```

Dan satu dukungan fitur, diperiksa bukan diasumsikan:

```
CSS.supports('animation-timeline: scroll()')   true  (Chromium build ini)
MDN                                            "Limited availability … not
                                               Baseline because it does not work
                                               in some of the most widely-used
                                               browsers"
```

## 2. Premis rencana, diperiksa

### 2.1 ❌ Tidak ada "tiga bagian kapabilitas" di `/practice/<v>`

Rencana: _"tiga bagian kapabilitas berganti dari daftar menjadi
`sticky-stack`"_. Dibaca dari `app/[locale]/practice/[value]/page.tsx`, isi
halamannya utuh adalah:

```
Breadcrumbs → PracticeHero → <section data-practice-statement> (ProgressText)
            → <section> SectionHeader + ProjectGrid → NextPractice
```

**Tidak ada daftar kapabilitas.** Tidak ada tiga bagian. Butir ini bukan
"ditunda" — ia tidak punya subjek. Ditolak.

### 2.2 ⚠️ Hero `/practice/<v>` 70svh → 88svh: yang harus diukur bukan kisinya

Tahap 51 §5.3 sudah mengoreksi bacaan pertamanya: sampul pertama di 132% layar
di rute ini **bukan** cacat, karena subjek layar pertamanya adalah
pernyataannya, bukan kisinya. Jadi yang dipertaruhkan kenaikan hero adalah
posisi **pernyataan**, dan itu yang diukur sebelum dan sesudah.

Hero-nya sudah memakai 630px dari 900 (70%), dan `h1`-nya mendarat di 542–644
— separuh bawah layar pertama, dengan udara di atasnya. Menaikkannya ke 88svh
(792px) mendorong nama praktik ke ~700–780, hampir menempel tepi bawah.

### 2.3 ❌ `/journal` "hero nol → 60svh" — angkanya, sesudah Tahap 51

Premisnya benar: `/journal` memang tidak punya hero. Angkanya yang tidak bisa
dipakai apa adanya. Tahap 51 mengukur bahwa `60svh` sebagai `min-height` duduk
**di atas** padding atas halaman dan **di bawah** apa pun yang menyusul, jadi
ia bukan 60% layar melainkan ~82%. `/journal` adalah permukaan baca yang
subjeknya daftarnya sendiri, jadi bentuk yang dipakai sama dengan `/work`:
tinggi ditulis sebagai bagian **layar**, bukan bagian kotaknya.

### 2.4 ⚠️ Progres baca: fiturnya ada di sini, tapi bukan Baseline

`animation-timeline: scroll()` didukung di Chromium build ini dan **tidak** di
Safari — dibaca dari MDN, bukan dari badge (`CLAUDE.md` #18). Jadi rencananya
("dicoba lebih dulu dan diukur; kalau dukungan tidak cukup ia dibuang") tidak
punya jawaban ya/tidak: ia didukung sebagian.

## 3. Cacat akuntansi §9.5, ketiga kalinya

Tahap 50 menemukan `/studio` mendeklarasikan dua momen yang **nol**-nya ada di
DOM, dan satu yang tidak dideklarasikan justru ada. Pola yang sama, dua rute
lagi:

```
/practice/<v>   §9.5: practice-morph, scrubbed passage    DOM: work-transport ×2
/journal        §9.5: journal-index, journal-transport    DOM: journal-transport ×3
/journal/<slug> §9.5: journal-transport                   DOM: (kosong)
```

Tidak satu pun momen yang §9.5 sebut untuk `/practice/<v>` dan
`/journal/<slug>` bisa dihitung gerbangnya, dan `/journal` hanya separuh.
Gerbang yang menghitung nol menghitung nol dengan sukses.

**Dan menandainya memunculkan tabrakan yang nyata.** Kalau ketiganya ditandai,
`/practice/<v>` mendeklarasikan **tiga** nama berbeda — `practice-morph`,
`practice-statement`, `work-transport` — sementara plafonnya dua. Rencana
menulis rute ini tetap dua, dan menulisnya **sebelum ada yang menghitung**.

Keputusan tahap ini, dan alasannya harus berdiri sendiri:

> Plafon rute ini naik ke tiga, dan **kenaikan ini tidak membeli satu gerak pun
> yang baru**. Ketiga momennya sudah dikirim hari ini — kedatangan dari beranda,
> pernyataan yang di-scrub, dan kartu yang membawa dirinya ke halaman proyek.
> Yang berubah hanya apakah anggarannya menggambarkan situs ini atau
> membantahnya. "Batas yang naik di mana-mana bukan batas" tetap berlaku:
> `/journal`, `/journal/<slug>` dan `/work/<slug>` tidak naik, dan tidak ada
> rute yang mendapat momen baru dari tahap ini.

## 4. Yang dikirim, dan yang ditolak

### 4a — Hero `/practice/<v>` **tidak** dinaikkan, dan angkanya alasannya

Rencana: 70svh → 88svh. Diukur pada build produksi lebih dulu:

```
hero            630px = 70% layar   (105/110/78px dari atas, tiga lebar)
h1              542px = 60% layar
pernyataan      788px = 88% layar   data-reveal="hidden"   opacity 0
garis reveal    675px = 75%
```

Pernyataan itu **sudah** melewati garis reveal hari ini. Menaikkan hero ke
88svh mendorongnya ke ~106% — keluar layar sepenuhnya — pada halaman yang
subjeknya justru pernyataan itu. Dan hero-nya sudah memuat empat elemen teks,
yaitu plafon `e2e/taste-preflight.e2e.ts` untuk sebuah hero, jadi tinggi
tambahan hanya membeli **udara**.

Batas yang layout ini izinkan: pernyataan harus mendarat ≤ 675px, dan dengan
jarak 48px antara hero dan pernyataan itu berarti hero ≤ ~70% layar. **Rute
ini sudah persis di plafonnya.** 70svh dipilih di Tahap 15 tanpa alasan ini
dan kebetulan tepat. Ditolak, dengan angkanya.

### 4b — Ground `dot-pattern` di `/practice/<v>`

Kategori ketiga, tidak dihitung §9.5. Titik dan bukan kisi — halaman ini klaim
dalam prosa. Ditempatkan **sebelum** `.wash` di DOM supaya wash satu layar itu
tetap melukis di atasnya. Tanpa `NoiseTexture`: Tahap 53 memasang grain
site-wide di bawah `Theme`, dan menyalin satu di sini sekarang adalah lapisan
yang harus dilepas nanti.

### 4c — `/journal`: hero nol → bagian layar yang diukur

`min-height: 60svh` polos dicoba lebih dulu — bentuk naif yang sama yang Tahap
51 kirim ke `/work` — dan gagal dengan cara yang sama. **Dibuktikan merah,
dua lebar:**

```
1440×900   entri pertama 756px dari 900   84%   opacity 0
1280×720                 635px dari 720   88%   opacity 0
 390×844                 663px dari 844   79%   opacity 0
```

Sebuah indeks bacaan yang tidak membuka pada bacaan apa pun.

Ditulis ulang sebagai bagian layar, `calc(56svh − --header-height − padding)`:

```
1440×900   header 0 → 352px   entri pertama 552px = 61%   visible  1
1280×720   header 0 → 262px                 449px = 62%   visible  1
 390×844   header 0 → 365px                 505px = 60%   visible  1
```

Dokumen 2937 → **3082px**. **56 di sini dan 48 di `/work`, dan itu bukan
inkonsistensi**: di antara masthead `/work` dan sampul pertamanya duduk filter
dan penghitung (194px pada 1440); di antara header ini dan entri pertama duduk
48px. Aturannya satu, aritmetikanya berbeda, dan yang dibandingkan adalah
hasilnya — sampul `/work` di 66%, entri `/journal` di 60–62%. Lebih cepat di
sini, dengan sengaja.

### 4d — Progres baca di tiga halaman panjang

`vault/motion/reading-progress`: garis rambut 2px di bawah header, `scaleX`
saja.

**Dua implementasi satu garis, dan hanya satu pernah jalan.** Primernya CSS —
`animation-timeline: scroll()` menggerakkan `scaleX` di compositor **tanpa
JavaScript sama sekali**, argumen yang sama yang `vault/blocks/project-grid`
pakai untuk memilih reveal CSS di atas tween GSAP. Ia bukan Baseline (MDN,
dibaca bukan diasumsikan), jadi fallback ScrollTrigger dipasang **hanya**
ketika `CSS.supports` bilang timeline-nya tidak ada — di loop Tempus bersama,
jadi ia satu pelanggan, bukan `requestAnimationFrame` kedua (`CLAUDE.md` #6).

Terukur, tiga rute: `scaleX` **0 di atas, 1 di dasar**. Track 2px pada 72px,
`pointer-events: none`, `aria-hidden`. Reduced motion: `display: none` —
dihapus, bukan dibekukan, karena gerak terkait-gulir tetap gerak dan garis ini
tidak membawa apa pun yang scrollbar bawaan tidak sudah katakan.

**Jalur yang browser ini tidak akan pernah ambil, tetap diuji.** Chromium punya
timeline-nya, jadi fallback — yang persis yang didapat pembaca Safari — akan
jadi kode mati di bawah uji. `e2e/reading-progress.e2e.ts` memalsukan
`CSS.supports` sebelum skrip halaman mana pun **dan** membungkam blok
`@supports`-nya (animasi CSS mengalahkan inline style yang GSAP tulis, jadi
tanpa itu jalur CSS akan diam-diam memenuhi asersinya). Fallback-nya lulus.

### 4e — Momen yang sudah ada diberi namanya di DOM

Nol gerak baru. `Reveal` mendapat prop `data-epic` yang dideklarasikan —
komponen itu tidak menyebarkan apa pun, jadi atribut yang dilempar tanpa prop
akan hilang diam-diam dan gerbangnya mengukur markup yang benar sebagai
hilang. Itu persis keadaan tiga rute ini.

```
                sebelum                       sesudah
/practice/<v>   work-transport ×2             practice-morph, practice-statement, work-transport
/journal        journal-transport ×3          journal-index, journal-transport
/journal/<slug> (kosong)                      journal-transport
```

Dan menandainya **membuat gerbangnya merah**, yang memang gunanya:

```
/en/practice/consulting may spend 2 choreographed moments;
it declares 3: practice-morph, practice-statement, work-transport
```

Plafon rute itu dinaikkan ke tiga dengan argumen §3 — dan kenaikan itu tidak
membeli satu gerak pun yang baru. `MOTION-SPEC.md` §9.5 diperbaiki bersamanya,
termasuk kalimatnya sendiri yang menyebut `/journal/<slug>` "keeps its
deliberate zero" di dokumen yang tabelnya memberi rute itu satu dan yang
halaman berikutnya menjelaskan panjang lebar kenapa Tahap 41 menaikkannya dari
nol ke satu.

## 5. Gerbang

| Gerbang                       | Menuntut                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| `e2e/first-screen.e2e.ts`     | `/journal` membuka pada entrinya, dan entri itu terbuka. Diperluas dari katalog                   |
| `e2e/reading-progress.e2e.ts` | nol di atas, penuh di dasar, hairline, hilang di reduced motion, **dan jalur fallback-nya jalan** |
| `e2e/interaction-grammar`     | plafon per rute, `/practice/<v>` di tiga dengan alasan tertulis                                   |
| `contrast.test.ts`            | ground `dot-pattern` tidak menurunkan kontras                                                     |
| `route-budget.e2e.ts`         | tiap kenaikan punya alasan per rute                                                               |

Keduanya yang baru **dibuktikan merah lebih dulu**: `first-screen` dengan
`60svh` polos di `/journal` (angka di §4c), dan `reading-progress` dengan
komponennya di-stub `return null` — **6 dari 9 merah**, sementara ketiga tes
"halaman pendek tidak membawanya" tetap hijau, yang membuktikan mereka
mengukur ketiadaan dan bukan kebetulan.

## 6. Hasil

### 6.1 Verifikasi

```
bun run check        lulus — unit 421 lulus
bun run build        lulus
build-storybook      lulus
CI=true test:e2e     598 lulus, 0 gagal, 14 dilewati (13,5m)
```

### 6.2 Yang dilewati, dan kenapa itu semuanya sah

Seluruh yang dilewati ada di satu berkas, `e2e/visual-substance.e2e.ts`:

- **dua belas** rute tanpa kanvas (`/journal`, `/journal/<slug>`, ketiga
  `/practice/<v>`, `/studio`, dua proyek) — tes "footer di bawah kanvas" tidak
  punya kanvas untuk dilukis di atasnya;
- **dua** yang digerbangi ke desktop dengan alasan tertulis sejak Tahap 21
  §6.3 — lapisan material sengaja tidak dipasang di telepon.

### 6.3 Satu cacat instrumen ditemukan di sela dua jalan penuh

`[mobile] /en/work keeps its footer out from under the canvas` **lulus di jalan
Tahap 51 dan melewati dirinya sendiri di jalan pertama Tahap 52** — rute yang
sama, tanpa satu pun perubahan yang menyentuhnya. Akarnya: gerbangnya membaca
`canvas count() > 0` sekali, sesudah tunggu tetap 2600ms, dan mount-nya cukup
sering lebih lambat dari itu.

Tes yang melewati dirinya sendiri ketika yang diukurnya sekadar terlambat
melaporkan sukses dalam kedua keadaan. Itu bentuk kegagalan yang suite ini
terus temukan ulang — Tahap 49 menemukan bentuk yang sama di
`material-layer`. Diperbaiki dengan menunggu (`waitFor({ state: 'attached' })`,
6 detik), yang mengubah balapan jadi keputusan: ia hanya melewati kalau
kanvasnya memang tidak pernah datang. Sesudahnya `[mobile] /en/work` **berjalan
dan lulus**, dan dilewati turun dari 15 ke 14.

### 6.4 Kejujuran tentang tahap ini

Empat butir direncanakan. **Satu tidak punya subjek di kodenya**
(`sticky-stack` untuk kapabilitas yang tidak ada), **satu ditolak dengan
pengukuran** (hero `/practice/<v>`, yang sudah persis di plafon yang tata
letaknya izinkan), dan dua dikirim.

Yang terbesar dalam tahap ini tidak ada di rencana sama sekali: tiga rute yang
mendeklarasikan momen §9.5 yang tidak pernah ada di DOM — cacat akuntansi yang
sama yang Tahap 50 temukan di `/studio`, ditemukan lagi di dua rute lain, dan
kali ini gerbangnya ikut diperbaiki supaya rute berikutnya tidak bisa diam-diam
masuk keadaan itu.

Nol gerak rusak dikirim. Dua gerbang baru, keduanya dibuktikan merah lebih
dulu, dan satu di antaranya menguji jalur yang browser uji ini tidak akan
pernah ambil.
