# Tahap 57 — Satu kolom katalog di bawah lantai rentangnya sendiri

> Tahap 56 §7 mengoreksi dirinya sendiri: parallax katalog bukan "terlalu
> kecil" secara seragam. Dua kolomnya sengaja berbeda, dan yang tersisa
> setelah koreksi itu adalah satu temuan yang jauh lebih sempit dan bisa
> ditutup dalam satu angka.

## 1. Temuannya, dengan angkanya

`vault/motion/parallax` menyebut sumbernya sendiri di header berkasnya:
`ui-ux-pro-max --domain gsap`, preset **"Parallax Scroll (Subtle)"**, dengan
`yPercent` **5–15**.

`vault/blocks/project-grid` memberi katalog `COLUMN_DRIFT = [4, 9]`. Kolom
kirinya duduk di **4** — di bawah lantai rentang yang dikutip komponennya
sendiri. Terukur di build produksi, 41 sampel menuruni `/en/work`:

| plate | kolom | perjalanan | % tinggi lapisan |
| ----: | ----- | ---------: | ---------------: |
|     0 | A     |     30,3px |         **3,3%** |
|     2 | A     |     36,6px |         **4,0%** |
|     4 | A     |     36,3px |         **4,0%** |
|     1 | B     |     74,1px |             7,7% |
|     3 | B     |     86,3px |             9,0% |
|     5 | B     |     81,1px |             8,5% |

Kolom B baik-baik saja. Kolom A yang tidak.

## 2. Yang **tidak** diubah, dan kenapa

**Selisih antar kolom tetap 5.** Itu `work-constellation` (Tahap 43), dan
komentar aslinya menjelaskan taruhannya: kedua kolom pernah melaporkan offset
identik sampai tiga belas angka di belakang koma — "dua kolom yang bergerak
dalam kunci yang sama adalah satu kolom yang digambar dua kali".
`e2e/exploratory-layer.e2e.ts` memegang selisih itu di bawah 60px. Menaikkan
kedua kolom dengan jumlah yang sama membuat selisihnya tidak bergerak sama
sekali, yang memang yang diinginkan.

**Ukuran lapisan tidak ditulis ulang di kartu.** Tahap 43 sudah menurunkannya
dari `--card-drift`, satu angka yang di-set `ProjectCard` dari nilai yang sama
yang ia serahkan ke hook — persis karena versi sebelumnya adalah "dua angka
yang seharusnya sepakat dan tidak punya cara untuk itu", dan
`e2e/continuous-motion.e2e.ts` melaporkan 2 plate terekspos di tiga dari empat
posisi gulir ketika keduanya berselisih.

## 3. Yang dibangun

**57a — `COLUMN_DRIFT` 4/9 → 7/12.** Keduanya di dalam 5–15; selisihnya tetap 5. Kolom A kira-kira menggandakan perjalanannya; kolom B naik dari 8,5% ke
sekitar 11%.

**57b — galeri berhenti mengulang cacat yang sudah pernah diperbaiki.**
`vault/blocks/project-gallery` memanggil `useParallax(ref)` tanpa argumen —
jadi jaraknya adalah default hook (6) — sementara stylesheet-nya menulis
`inset-block-start: -4%` dan `block-size: 108%` sebagai angka mati. Itu bentuk
kegagalan yang sama persis dengan yang Tahap 43 hapus dari kartu: dua angka
yang harus sepakat, tanpa cara untuk sepakat. Galeri mendapat `--plate-drift`
dan rumus yang sama, lalu jaraknya dinaikkan ke **10**.

**57c — diukur ulang**, dengan instrumen yang sama, dan hasilnya ditulis di §4
termasuk kalau ia meleset.

## 4. Hasil

### 4.1 Katalog, diukur ulang dengan instrumen yang sama

Build produksi, 1440×900, 41 sampel menuruni `/en/work`:

| plate | kolom |     sebelum |           sesudah | naik |
| ----: | ----- | ----------: | ----------------: | ---: |
|     0 | A     | 30,3px 3,3% |   **54,7px 5,8%** | +80% |
|     2 | A     | 36,6px 4,0% |   **65,9px 7,0%** | +80% |
|     4 | A     | 36,3px 4,0% |   **65,2px 6,9%** | +80% |
|     1 | B     | 74,1px 7,7% | **101,9px 10,4%** | +38% |
|     3 | B     | 86,3px 9,0% | **118,2px 12,0%** | +37% |
|     5 | B     | 81,1px 8,5% | **111,0px 11,3%** | +37% |

**Keenamnya sekarang di dalam 5–15.** Kolom A hampir menggandakan
perjalanannya; kolom B naik dari 8,5% ke 11,3%. Selisih antar kolom tidak
berubah — itu memang yang dijaga.

### 4.2 Galeri

`/en/work/arus-balik`, dua plate:

| plate | tinggi lapisan | perjalanan | % tinggi lapisan |
| ----: | -------------: | ---------: | ---------------: |
|     0 |            731 |     73,1px |        **10,0%** |
|     1 |            855 |     85,5px |        **10,0%** |

Persis `PLATE_DRIFT`, di kedua plate, yang membuktikan bagian §3 57b yang
sebenarnya penting: overshoot-nya sekarang **diturunkan** dari angka yang sama
yang diberikan ke hook. Sebelumnya lapisannya berukuran untuk jarak 6 sementara
hook memakai 6 — kebetulan cocok, tanpa apa pun yang menjaga kecocokan itu.

### 4.3 Gerbang

`bun run check`: **421 lulus, 0 gagal**, manifest dan anggaran aset bersih.

Delapan berkas gerbang yang paling mungkin terganggu oleh perubahan ini —
`continuous-motion`, `exploratory-layer`, `motion`, `journey`,
`project-detail`, `lightbox`, `material-layer`, `palette-integrity`, dua
proyek viewport — **104 lulus, 0 gagal**.

Dua di antaranya adalah alasan perubahan ini aman untuk dilakukan sama sekali:

- `continuous-motion › no plate exposes its own frame` hijau, yang berarti
  overshoot yang diturunkan itu benar-benar menutupi perjalanan yang lebih
  jauh. Inilah gerbang yang pernah melaporkan **2 plate terekspos di tiga dari
  empat posisi gulir** ketika Tahap 43 mengubah satu angka dan bukan yang lain.
- `exploratory-layer › the two columns drift by a readable difference` hijau,
  yang berarti menaikkan kedua kolom dengan jumlah yang sama memang tidak
  menyentuh selisihnya.
