# Tahap 81 — Yang langka itu tahan, bukan momen

> **Status: spec. Belum ada kode.** Ditulis lebih dulu sesuai `ROADMAP.md` §3.0.
>
> Cabang: `claude/arth-design`. Tahap ini membelanjakan sistem bidang yang
> Tahap 80 bangun, dan menolak menambah _hold_ di rute yang sudah penuh.

---

## 1. Yang diukur, sebelum satu baris kode

### 1.1 Papan skor Tahap 80 salah hitung, dan dikoreksi lebih dulu

Papan skor itu dikirim kemarin melaporkan **2** section tertahan, menghitung
hanya `pin: true`. Itu kurang hitung, dan ketahuan sehari sesudahnya:
`MOTION-SPEC.md` §9.5 menyebut `practice-capabilities` sebagai _"this route's
first pin"_, dan `capability-set.module.css` mewujudkannya dengan
`position: sticky` — komentar tepat di atas deklarasi itu berbunyi **"The pin."**

Repo ini punya **dua mekanisme menahan**, dan anggaran yang skill peringatkan
tidak peduli API mana yang menahannya. Papan skor sekarang melihat keduanya:

```
section ter-pin (ScrollTrigger)       2    passage · horizontal
section tertahan (position: sticky)   4    studio · capability-set
                                           project-spine · step-sequence
```

**Tidak dijumlahkan**, dan itu disengaja: pemindai tidak bisa membedakan momen
yang ditahan dari kerangka yang kebetulan sticky — `project-spine` adalah rel
navigasi, bukan ketukan berkoreografi.

Koreksi kedua di perbaikan yang sama: pindaian pertama hanya membaca `.ts`/`.tsx`,
jadi `capability-set` hanya tertangkap karena ia **kebetulan** menyebut sticky di
komentar `index.tsx`, sementara `project-spine` yang mendeklarasikannya di CSS
saja terlewat. Hitungan yang bergantung pada kebetulan bukan hitungan.
Stylesheet kini ikut dipindai, dan hasilnya di-dedup ke direktori blok karena
satu blok menahan lewat dua berkas.

### 1.2 Anggaran tahan per rute — hampir habis

Dipetakan dari rute mana merender blok mana:

| rute              | tertahan | oleh                      |
| ----------------- | -------- | ------------------------- |
| `/en`             | 1        | `passage` (ScrollTrigger) |
| `/practice/<v>`   | 1        | `capability-set` (sticky) |
| `/studio`         | 1        | `step-sequence` (sticky)  |
| `/work`           | **0**    | —                         |
| `/work/<slug>`    | 0 aktif  | dua dibangun, dua dorman  |
| `/journal`        | **0**    | —                         |
| `/journal/<slug>` | **0**    | —                         |

### 1.3 Tiga nol itu tidak sama, dan bedanya menentukan tahap ini

**`/work` tidak boleh menerima hold, dan itu sudah diukur.**
`docs/stages/TAHAP-64.md` §1.2 mencatatnya: `e2e/first-screen.e2e.ts:113`
menuntut sampul pertama mulai di `< 85%` layar **dan** `opacity > 0.99` pada
scroll 0, dan katalog yang jadi trek ter-pin melanggar keduanya sekaligus. Itu
gerbang **kebenaran**, yang `DIREKSI.md` §3.1 tahan. Tidak dibuka lagi di sini.

**`/work/<slug>` sudah punya dua hold, keduanya dorman.** `horizontal` menunggu
≥4 gambar galeri (`RUN_MINIMUM`), `step-sequence` menunggu isi `chapters`.
Keduanya konten, bukan kode — Tahap 82 yang memilikinya.

**`/journal/<slug>` sengaja paling tenang.** `DIREKSI.md` §2.3 menyatakannya,
dan plafonnya 3 melawan 12 di rute merek lain. Ketenangan itu yang membuat
belanja di tempat lain terbaca sebagai pilihan.

**Jadi tersisa satu rute yang punya ruang dan nol penghalang: `/journal`.**

---

## 2. Ritual skill — `ROADMAP.md` §2.1, hasilnya ditempel apa adanya

```bash
PY=python   # Windows; python3 di Linux/macOS
S=.claude/skills/ui-ux-pro-max/scripts/search.py
$PY $S "Stagger List" --domain gsap
$PY $S "Scroll Reveal" --domain gsap
$PY $S "Page Transition" --domain gsap
$PY $S "parallax motion sickness accessibility" --domain ux -n 4
```

### 2.1 Yang membentuk tahap ini

| temuan skill                                                                                   | konsekuensi                                                                                                                                       |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| _"Don't pin more than 1-2 sections per page"_                                                  | **Yang langka adalah hold, bukan momen.** §1.2 memetakannya; tiga rute sudah di anggaran                                                          |
| _"Animate 1-2 key elements per view maximum"_ (severity High)                                  | Per **view**, bukan per halaman — sama persis dengan invarian `epic-sequence`                                                                     |
| _"Keep per-item stagger delay small (0.02-0.04s) for lists longer than 10 items"_              | Token `--stagger-items: 40ms` duduk di ujung atas band itu; daftar panjang memakai yang ini                                                       |
| _"Don't stagger by more than 0.1s per item on long lists; total reveal time becomes sluggish"_ | `--stagger-hero: 120ms` **melampauinya** — dan itu bukan konflik: hero tiga baris, bukan daftar panjang. Dicatat supaya tidak dipakai pada daftar |
| _"Revert SplitText on unmount (split.revert()) to restore original text nodes"_                | Kontrak aksesibilitas, bukan kebersihan. Diperiksa pada tiap konsumen `SplitText`                                                                 |
| _"Don't split-animate long paragraphs; reserve for short headlines (under ~8 words)"_          | Membatasi di mana `TextReveal` boleh dipakai                                                                                                      |

### 2.2 Yang DITOLAK, dan preseden penolakannya sudah ada

Preset **Stagger List / Standard** menyarankan `ease: 'back.out(1.4)'`.
Ditolak — dan bukan oleh saya: `MOTION-SPEC.md` §9.3 sudah menolaknya secara
tertulis, dengan dua alasan yang masing-masing berdiri sendiri. Ia kurva mentah,
yang aturan #1 larang di komponen; dan bounce adalah register yang salah untuk
situs ini, ditolak dengan alasan sama di Tahap 11c. Penyelesaian gerak di sini
lewat `--ease-out-expo`.

Dikutip, bukan diputuskan ulang. `TAHAP-34.md` §6 mencatat lima penolakan
serupa; ini yang keenam dan ia sudah berumur.

---

## 3. Inventaris — dipakai ulang, bukan ditulis ulang

| kebutuhan              | yang sudah ada                                            |
| ---------------------- | --------------------------------------------------------- |
| Bidang kedalaman       | `vault/motion/parallax` — `plane` sejak Tahap 80          |
| Reveal + stagger       | `useReveal`, `data-reveal-item`, token `--stagger-*`      |
| Headline berbelah      | `vault/motion/text-reveal` (SplitText)                    |
| Transisi antar-rute    | `vault/motion/page-transition`                            |
| Penjaga reduced-motion | `usePreferredReducedMotion` + `@media (--reduced-motion)` |
| Wasit rentang gulir    | `e2e/epic-sequence.e2e.ts`                                |

**Nol blok baru.** Tahap ini membelanjakan mesin yang sudah ada di rute yang
belum menerimanya — itu pekerjaan yang Tahap 80 §4.3 tunda dengan sengaja
("satu rute per commit").

---

## 4. Yang akan dikerjakan

### 4.1 Bidang kedalaman masuk ke rute — satu rute per commit

Tahap 80 membangun kontraknya dan **tidak** menerapkannya. Di sinilah ia
dibelanjakan. Ini momen **tak-ter-pin**, jadi ia tidak menyentuh anggaran §1.2
sama sekali — dan itu yang membuat "banyak hook" tetap mungkin setelah §1.3.

Urutannya mengikuti belanja terendah lebih dulu:

```
/journal            ground + subject
/journal/<slug>     ground saja — rute paling tenang
/studio             ground + mid
/practice/<v>       ground + mid
/work               ground   (tanpa hold — §1.3)
```

`/en` dan `/work/<slug>` sudah membawa parallax lewat `project-card` dan
`project-gallery`; keduanya tidak disentuh, karena angkanya sudah diukur
terhadap tata letaknya sendiri.

### 4.2 Satu hold, di satu-satunya rute yang punya ruang

`/journal` menerima **satu** section tertahan. Bukan dua, dan bukan karena
plafonnya 6 — karena skill menaruh batasnya di 1–2 per halaman dan rute ini
sekarang di nol.

Mekanismenya `step-sequence` yang sudah ada, bukan yang baru.

### 4.3 Berkas yang disentuh

```
app/[locale]/journal/page.tsx           bidang + satu hold
app/[locale]/journal/[slug]/page.tsx    bidang (ground)
app/[locale]/studio/page.tsx            bidang
app/[locale]/practice/[value]/page.tsx  bidang
app/[locale]/work/page.tsx              bidang, tanpa hold
docs/MOTION-SPEC.md §9.5                momen baru didaftarkan saat dikirim
```

---

## 5. Kriteria keluar — bisa dijalankan, bukan dirasakan

| gerbang                        | tuntutan                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------- |
| `bun run check`                | 577+ lulus, 0 gagal                                                          |
| `design-scoreboard`            | konsumen parallax **2 → 7**; baris sticky naik **paling banyak satu**        |
| `e2e/epic-sequence.e2e.ts`     | nol momen berbagi rentang gulir, di **dua** viewport                         |
| `e2e/first-screen.e2e.ts:113`  | `/work` dan `/journal` **tetap** membuka pada subjeknya — tidak dibuka ulang |
| `e2e/continuous-motion.e2e.ts` | prosa tetap tidak mengambil transform ter-scroll                             |
| `e2e/exploratory-layer.e2e.ts` | nol tumpang tindih kartu di dua belas posisi gulir                           |
| `e2e/no-javascript.e2e.ts`     | tiap rute tetap terbaca penuh tanpa JS                                       |
| reduced motion                 | parallax mati, hold jadi statis, isi berakhir **terlihat penuh**             |
| keyboard saja                  | hold `/journal` bisa dilewati Tab — bukti ini bukan scroll hijacking         |

---

## 6. Risiko — yang paling mungkin gagal

1. **Menambah hold di rute yang sudah penuh.** Godaannya nyata karena plafon
   _momen_ masih longgar sementara plafon _hold_ tidak. Mitigasi: §1.2 adalah
   tabel, bukan ingatan, dan papan skor akan melaporkan barisnya naik.
2. **`/work` dibuka ulang karena plafonnya tampak kosong.** Ia kosong karena
   gerbang kebenaran menahannya, bukan karena belum sempat. Tahap 64 sudah
   membayar pelajaran itu.
3. **Bidang diterapkan ke prosa.** Itu persis yang `continuous-motion` larang
   dan yang preset sebut sebagai cara parallax rusak. Bidang hanya untuk media
   dan ornamen.
4. **Stagger dipakai di daftar panjang dengan token hero.** `--stagger-hero`
   120ms melampaui batas 0.1s/item yang skill sebut untuk daftar panjang.
   Daftar memakai `--stagger-items`.
5. **K10 masih tidak bisa diukur.** `chrome-devtools-mcp` belum tersambung,
   jadi **nol angka performa diklaim** — semuanya tetap anggaran, `CLAUDE.md`
   #19. Dinyatakan di muka.
