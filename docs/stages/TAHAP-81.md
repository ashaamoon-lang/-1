# Tahap 81 — Yang langka itu tahan, bukan momen

> **Status: terkirim.** Spec ditulis lebih dulu sesuai `ROADMAP.md` §3.0; hasil
> dan gerbangnya di §7.
>
> Cabang: `claude/arth-design`. Tahap ini membelanjakan sistem bidang yang
> Tahap 80 bangun, menolak menambah _hold_ di rute yang sudah penuh, dan
> menolak lima dari enam penerapan yang §4.1 versi pertama janjikan — §4.1a.

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

> **§4.1 di bawah adalah amandemen.** Versi pertama bagian ini menamai lima
> rute untuk menerima bidang `ground`. Pengukuran sebelum baris kode pertama
> membatalkan kelimanya — bukan satu per satu, melainkan karena satu premis
> yang salah. Yang keliru dan kenapa ditulis utuh di §4.1a, tidak dihapus
> (aturan kerja §8.4).

### 4.1a Yang keliru di versi pertama, dan sebabnya satu

Versi pertama menulis:

```
/journal            ground + subject
/journal/<slug>     ground saja — rute paling tenang
/studio             ground + mid
/practice/<v>       ground + mid
/work               ground   (tanpa hold — §1.3)
```

Lima baris, dan **kelimanya salah karena satu premis**: saya memperlakukan
"rute punya ornamen ground" sebagai "rute punya lapisan yang bisa didalamkan".
Diukur dari sumbernya, tak satu pun benar:

| baris             | yang sebenarnya ada di disk                                           |
| ----------------- | --------------------------------------------------------------------- |
| `/journal`        | **tidak punya ornamen ground sama sekali** — nol `.ground` di CSS-nya |
| `/journal/<slug>` | idem, nol ornamen                                                     |
| `/studio`         | `.ground` adalah `position: fixed; inset: 0` (`page.module.css:249`)  |
| `/practice/<v>`   | pola yang sama, `DotPattern` fixed                                    |
| `/work`           | `.ground` hanya `z-index: -1; opacity: 0.6` — ia **memang** bergulir  |

Dua kesimpulan, dan yang kedua lebih mahal daripada yang pertama.

**`position: fixed` adalah bidang kelima, dan lajunya nol.** Ia lebih lambat
daripada `ground` bisa. Memasangkan `ground` ke ornamen fixed tidak
mendalamkannya — ia membuat latar yang sekarang **diam** mulai bergerak, dan
karena `inset: 0` menyamakannya persis dengan viewport, `yPercent` berapa pun
menyeret tepinya masuk ke pandangan. Ini sekarang tertulis di kontrak bidang
(`vault/motion/parallax/index.tsx`), supaya orang berikutnya tidak menurunkan
ulang kekeliruan yang sama.

**Dan `/work` — satu-satunya yang benar-benar bergulir — ditolak oleh dokumen
yang lebih tinggi.** `MOTION-SPEC.md` §0.1 mencatat `grid-pattern` di masthead
`/work` sebagai respons-kontinu, dengan alasan yang dinyatakan dalam satu
kalimat: _"they are surfaces, and the reason they belong in this category is
that they never move, **not that their movement was reclassified**"_. Kalimat
itu ditulis untuk menolak persis langkah yang §4.1 usulkan. Bukan gerbang yang
menahannya — `vendor-rules.test.ts` hanya memindai isi `vault/magic/`, dan
transform ini akan hidup di rute — jadi ia akan lolos hijau. Itu justru
alasannya harus ditolak di sini: keputusan desain tertulis yang tidak dijaga
gerbang hanya sekuat pembacaan berikutnya.

### 4.1 Bidang kedalaman masuk — satu tempat, dan itu yang tersisa

Sesudah kelima baris di atas gugur, pertanyaannya berubah dari "rute mana yang
punya ground" menjadi pertanyaan yang kontrak bidang sendiri ajukan: **lapisan
mana yang berupa media, ikut bergulir, dan belum punya kedalaman?**

Dipetakan atas seluruh rute merek:

| rute              | media yang ikut bergulir        | sudah ber-parallax             |
| ----------------- | ------------------------------- | ------------------------------ |
| `/en`             | `project-card` (unggulan)       | ya, sejak Tahap 33             |
| `/work`           | `project-grid` → `project-card` | ya, `constellation-drift` T-43 |
| `/work/<slug>`    | `project-gallery`               | ya, `PLATE_DRIFT` Tahap 56     |
| `/practice/<v>`   | `project-grid` → `project-card` | ya, blok yang sama             |
| `/studio`         | **nol media** — nol gambar      | —                              |
| `/journal`        | sampul per baris                | **tidak**                      |
| `/journal/<slug>` | prosa saja                      | —                              |

Jadi **satu celah**, dan itu `/journal`. Ia memenuhi keempat syarat kontrak
sekaligus: media dan bukan prosa · `position` biasa sehingga ia bergulir ·
duduk di frame ber-`overflow: clip` sehingga overshoot bisa menyembunyikan
tepinya · dan pulau kliennya **sudah** mengimpor `gsap`, `ScrollTrigger`,
`useGSAP`, dan `usePreferredReducedMotion` lewat `useActiveInSequence` — persis
himpunan dependensi `useParallax`, jadi biaya KB-nya marginal di rute yang
plafonnya 900 KB dan pernah menyentuh 901.

Sampul mendapat **`subject`**.

### 4.1b K5 dikoreksi: 7 tidak pernah bisa dicapai

Rencana menargetkan K5 **2 → 7**, dibaca sebagai "tujuh rute merek". Itu
menghitung satuan yang salah: papan skor menghitung **blok yang mengimpor
`useParallax`**, dan situs ini menyusun rute dari blok bersama. Empat rute di
tabel atas dilayani oleh **dua** blok yang sama.

Hanya ada tiga tempat yang memiliki media sama sekali, dan dua di antaranya
sudah terhitung. Angka yang bisa dicapai adalah **3**, bukan 7 — dan itu bukan
target yang diturunkan diam-diam, itu tabel yang diperbaiki (§8.4).

### 4.1c `Plane` — potongan yang Tahap 80 tinggalkan, dan pelajaran Tahap 43

Tahap 80 memberi `useParallax` opsi `plane` lalu berhenti. Akibatnya "pasang
bidang" masih menuntut tiga hal sekaligus di tiap tempat pakai: komponen
klien, sebuah ref, dan elemen pembungkus. Empat baris yang berulang adalah
tempat sebuah sistem berhenti jadi satu sistem.

`vault/motion/parallax/plane.tsx` menjadi batas klien itu, sekali.

Dan ia **wajib membawa overshoot-nya sendiri**, karena repo ini sudah membayar
kekurangan itu: `project-card.module.css` mencatat Tahap 43 — lapisan yang
diukur terhadap jarak default sementara hook menggerakkannya lebih jauh
membuat `continuous-motion.e2e.ts` melaporkan **2 plat menyingkap framenya di
tiga dari empat posisi gulir**. Perbaikannya waktu itu `--card-drift`, disetel
dari angka yang sama yang diberikan ke hook, "supaya keduanya tidak bisa
berselisih".

Sistem bidang bernama memperburuk risiko itu, bukan meringankannya: pemanggil
yang menulis `plane="subject"` justru **tidak tahu** angkanya. Jadi `Plane`
menerbitkan lajunya sendiri sebagai `--plane-travel`, dan stylesheet frame
membaca angka itu alih-alih menebaknya.

### 4.2 Hold di `/journal` — DITOLAK, dan ini pengecilan lingkup yang dinyatakan

Versi pertama memberi `/journal` satu section tertahan lewat `step-sequence`.
Itu tidak dikerjakan, dan aturan kerja §8.3 melarang mengecilkan lingkup
diam-diam — jadi ini dinyatakan, bukan dilewatkan.

Sebabnya: `/journal` **sudah punya** mekanisme tanda tangannya, dan ia bukan
hold. `useActiveInSequence` menggerakkan `--row-recede` sehingga baris yang
sedang dibaca menguat dan yang lain surut. Menahan sebuah section di rute itu
berarti menjalankan dua wasit atas pertanyaan yang sama — "yang mana yang
sedang dibaca" — dan wasit kedua menjawabnya dengan menahan gulir.

`step-sequence` juga tidak cocok bentuknya: ia untuk isi berbab, dan `/journal`
adalah indeks tipografis. Memasangnya berarti menambah momen untuk
membelanjakan anggaran, yang `DIREKSI.md` §2.1 sudah namai sebagai alasan yang
salah.

**Akibatnya K6 tidak berubah di tahap ini** (tetap 2 pin + 4 sticky), dan
`/journal` tetap di nol hold. Kalau rute itu kelak butuh hold, ia butuh isi
yang berbentuk seperti hold lebih dulu.

### 4.3 Berkas yang disentuh — daftar yang diamandemen

Daftar pertama menamai lima `page.tsx` rute. Sesudah §4.1a kelimanya gugur, dan
daftar penggantinya menyentuh berkas yang tidak ada di daftar pertama — itu
pemicu **T8**, dan inilah amandemennya alih-alih penyimpangan diam-diam.

```
vault/motion/parallax/plane.tsx          BARU — batas klien + --plane-travel
vault/motion/parallax/index.tsx          doc: bidang kelima yang degeneratif
app/[locale]/journal/index-rows.tsx      sampul dibungkus Plane (pulau yang ada)
app/[locale]/journal/page.module.css     overshoot frame, pola --card-drift
lib/scripts/design-scoreboard.ts         pemindai mengenali Plane, kecuali primitifnya
e2e/plane-edge.e2e.ts                    BARU — gerbang untuk kriteria §5 yang tak punya
docs/MOTION-SPEC.md §0.1                 dicatat di tabel respons-kontinu + 1 penolakan
docs/DIREKSI.md                          blok papan skor di-regenerate
```

**§9.5 tidak disentuh, dan itu diperiksa bukan diasumsikan.** `MOTION-SPEC.md`
§0 menempatkan parallax di **respons kontinu**, yang kolom "Counted by §9.5?"
jawab **no**. Preseden persisnya `constellation-drift` (Tahap 43): parallax
yang sudah ada diberi `distance` berbeda, dicatat di tabel §0.1 dan bukan di
anggaran momen. Bidang bernama adalah hal yang sama sekali lagi.

---

## 5. Kriteria keluar — bisa dijalankan, bukan dirasakan

| gerbang                        | tuntutan                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------- |
| `bun run check`                | 577+ lulus, 0 gagal                                                          |
| `design-scoreboard`            | konsumen parallax **2 → 3** (§4.1b); baris sticky **tidak naik** (§4.2)      |
| `e2e/epic-sequence.e2e.ts`     | nol momen berbagi rentang gulir, di **dua** viewport                         |
| `e2e/first-screen.e2e.ts:113`  | `/work` dan `/journal` **tetap** membuka pada subjeknya — tidak dibuka ulang |
| `e2e/continuous-motion.e2e.ts` | prosa tetap tidak mengambil transform ter-scroll                             |
| `e2e/exploratory-layer.e2e.ts` | nol tumpang tindih kartu di dua belas posisi gulir                           |
| `e2e/no-javascript.e2e.ts`     | tiap rute tetap terbaca penuh tanpa JS                                       |
| `e2e/route-budget.e2e.ts`      | `/en/journal` tetap di bawah **900 KB** — pulaunya pernah menyentuh 901      |
| reduced motion                 | parallax mati, hold jadi statis, isi berakhir **terlihat penuh**             |
| `e2e/plane-edge.e2e.ts`        | **BARU** — nol tepi frame tersingkap di 13 posisi gulir, dua rute            |

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

---

## 7. Hasil

### 7.1 Gerbang

| gerbang                   | hasil                                                        |
| ------------------------- | ------------------------------------------------------------ |
| `bun run check`           | **579 lulus, 0 gagal** (spec menuntut 577+)                  |
| `bun run build`           | hijau                                                        |
| `bun run build-storybook` | hijau, dijalankan **sebelum** suite                          |
| `test:e2e`                | **714 lulus · 7 gagal · 14 dilewati**, 29,4 menit            |
| papan skor                | bidang **2 -> 3** · pin **2** (tetap) · sticky **4** (tetap) |
| `e2e/plane-edge.e2e.ts`   | **BARU**, hijau — dan terbukti merah lebih dulu (§7.3)       |

Papan skor mendarat persis di angka yang §5 tuntut, termasuk yang **tidak**
boleh naik.

`test:oxlint-plugin` gagal pada tarikan tunggal `check` dengan
`RangeError: Array buffer allocation failed`, lalu melaporkan **12 rule test
lulus** saat dijalankan sendiri. Plafon memori laptop ini, bukan uji.

### 7.2 Tujuh merah, dibongkar sampai nol tersisa tak terjelaskan

Nol di antaranya berasal dari tahap ini. Dibuktikan, bukan disimpulkan:

| #   | spec                                                 | bukti                                 |
| --- | ---------------------------------------------------- | ------------------------------------- |
| 1   | `catalogue-layout.e2e.ts:374` (desktop)              | lulus sendirian, **15,9 detik**       |
| 2   | `motion.e2e.ts:156` `/en/work` (desktop)             | lulus sendirian, dalam run yang sama  |
| 3   | `visual-substance.e2e.ts:179` `/practice/consulting` | **sudah tercatat flaky di CI run 64** |
| 4   | `visual-substance.e2e.ts:603` `/en`                  | **sudah tercatat flaky di CI run 64** |
| 5   | `:603` `/en/work`                                    | lulus di isolasi                      |
| 6   | `:603` `/en/work/arus-balik`                         | lulus di isolasi                      |
| 7   | `:603` `/id`                                         | gagal 1 dari 2 isolasi                |

**#3 dan #4 adalah pasangan yang `HANDOFF.md` §5.1 sudah namai**, per berkas,
per baris, dan per rute: _"dua jadi flaky (`:179` `/en/practice/consulting at
mobile`, `:603` `/en`)"_ - ditulis dua tahap sebelum tahap ini ada.

Kenapa di sini ia terbaca lebih buruk daripada di CI dijawab satu baris config:

```ts
playwright.config.ts:9   retries: process.env.CI ? 1 : 0
```

CI mencoba ulang sekali dan menghitungnya **flaky**. Run ini berjalan tanpa
`CI` - karena `CI=1` memicu build kedua yang melewati timeout 300 detik di
mesin ini - jadi nol retry, dan tes yang sama dihitung **gagal**. Tes yang
sama, rute yang sama, akuntansi yang berbeda. Itu satu-satunya perilaku yang
hilang tanpa `CI`, dan sudah diperiksa lebih dulu: **nol** spec e2e bercabang
pada `process.env.CI`.

**CI menutupnya, dan angkanya rekonsiliasi persis.** Run 35439317243 atas
commit ini: **722 lulus · 1 flaky · 14 dilewati** dalam 22,4 menit, atas **737**
tes — dua lebih banyak daripada 735 lokal, yaitu `plane-edge.e2e.ts` yang belum
ada saat suite lokal dijalankan.

```
CI     722 lulus + 1 flaky            = 723 yang akhirnya lulus, dari 737
lokal  714 lulus + 7 gagal            = 721 yang dijalankan, dari 735
        723 - 714 = 9 = 7 kegagalan lokal + 2 tes baru
```

Jadi **ketujuh merah lokal lulus di CI**, dilewati yang sama persis (14 = 14),
dan satu-satunya flaky CI adalah utang `visual-substance` yang §5.1 sudah namai.
Prediksi §7.2 diperiksa terhadap sumbernya, bukan dibiarkan sebagai argumen.

**Jalur dari tahap ini ke `/work` diperiksa, bukan diandaikan.** Satu-satunya
berkas bersama adalah `vault/motion/parallax/index.tsx`, dan `git diff` yang
menyaring komentar mengembalikan **kosong**: 17 baris, seluruhnya doc. Area itu
terakhir disentuh Tahap 51.

### 7.3 Cacat yang ditemukan aritmetika, bukan gerbang

Kriteria keluar "nol tepi frame tersingkap" tidak punya gerbang - tidak ada
yang mengukurnya - jadi ia dihitung dengan tangan, dan rumus overshoot yang
diwarisi dari `project-card` **patah di ujung atas ladder**.

`yPercent` adalah persentase tinggi **elemen itu sendiri**, dan overshoot baru
saja membuat tinggi itu lebih besar dari framenya - jadi memperlebar margin
ikut memperpanjang perjalanan yang harus ia serap. Dengan konstanta `k`:

```
(t + k) / 2  >=  (t / 2) * (100 + t + k) / 100
```

Pada `k = 2` syarat itu berlaku sampai **t = 13,2**, dan `foreground` adalah
**14** - margin **negatif 0,12%**, tepi tersingkap. `project-card` tidak pernah
menabraknya karena drift terukur terbesarnya 9.

Diperbaiki ke `k = 4`, yang melewatkan keempat anak tangga dengan margin
positif: 1,84% · 1,70% · 1,30% · 0,74%. Turunannya ditulis di
`plane.tsx`, bukan angkanya saja, supaya yang berikutnya punya rumusnya.

Ini **latent**: `/journal` memakai `subject` (10), yang aman di `k = 2` juga.
Yang diperbaiki adalah perangkap untuk pemakai `foreground` pertama.

**Dan aritmetika yang tidak ada yang menjalankan ulang adalah klaim**, jadi ia
diberi gerbang: `e2e/plane-edge.e2e.ts`. Ia mencari frame lewat sifat yang
membuatnya frame — `overflow: clip|hidden` dengan tepat satu anak
`position: absolute` — bukan lewat nama kelas, jadi ia tidak basi saat hash
modul berubah, dan ia menutupi `project-card` sekaligus karena invariannya soal
geometri bukan soal properti mana yang menghasilkannya.

Dibuktikan **merah lebih dulu** (§3.3): overshoot disempitkan ke nol, dibangun
ulang, dan gerbang itu melaporkan `top +1.86px` di paruh pertama lintasan yang
berbalik jadi `bottom +1.86px` di paruh kedua — lapisan menggeser melewati
framenya di kedua ujung, bentuk kegagalan Tahap 43 persis. `/en/work` tetap
lulus di run yang sama, jadi gerbangnya spesifik dan bukan pukul rata. Konstanta
dipulihkan, dibangun ulang, hijau.

Ia **desktop saja**, dan itu keputusan yang ditulis di berkasnya: overshoot
seluruhnya dinyatakan dalam persentase, jadi rasio perjalanan terhadap tinggi
frame identik di tiap lebar. Menambahkannya ke allowlist mobile hanya membeli
run kedua atas aritmetika yang sama.

### 7.4 Log perpindahan mode (§3.7)

```
E->R  T3  spec §4.1 menamai lima rute untuk ground; disk bilang lain
R->E  sebab: premis "punya ornamen ground" != "punya lapisan yang bisa didalamkan".
          Nol .ground di /journal; fixed di /studio + /practice; /work ditolak
          MOTION-SPEC §0.1. Diamandemen di tempat sebagai §4.1a.
E->R  T8  daftar berkas §4.3 tidak memuat plane.tsx maupun index-rows.tsx
R->E  sebab: pembungkus klien adalah potongan yang Tahap 80 tinggalkan;
          daftar diamandemen, bukan disimpangi.
E->R  T6  papan skor akan melaporkan 3 dengan menghitung primitifnya sendiri
R->E  sebab: plane.tsx mengimpor useParallax karena ia pembungkusnya. Pemindai
          kini mengecualikan direktori primitif dan mengenali impor Plane.
E->R  T1  suite 7 merah
R->E  sebab: 4 beban (lulus di isolasi), 2 tercatat HANDOFF §5.1 dari CI run 64,
          1 flaky 1-dari-2. retries: CI ? 1 : 0 menjelaskan flaky -> gagal.
```

### 7.5 Yang tidak dikerjakan, dinyatakan eksplisit

- **Lima penerapan `ground` yang §4.1 janjikan.** Semuanya ditolak dengan
  sebabnya di §4.1a. Nol dikerjakan diam-diam, nol dilupakan.
- **Satu hold di `/journal` (§4.2).** Ditolak. K6 tidak berubah, dan papan skor
  melaporkannya: sticky tetap 4.
- **Story untuk `Plane`.** Katalog sudah membawa delapan story parallax
  termasuk `PlaneLadder`, dan pelajaran overshoot sudah tertulis di docs story
  yang ada. Yang kesembilan akan jadi inflasi katalog - bentuk yang §2.1 namai.
- **Nol angka performa diklaim.** `chrome-devtools-mcp` belum tersambung karena
  `CONTEXT7_API_KEY` belum diset. K10 tetap **belum terukur**, bukan ditaksir
  (`CLAUDE.md` #19).
- **Klaim a11y:** axe dijalankan lewat `storybook-a11y.e2e.ts` dan sapuan rute
  di dalam suite di atas; tidak ada klaim a11y di luar apa yang dijalankan itu
  (`CLAUDE.md` #20).
