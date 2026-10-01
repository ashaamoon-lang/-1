# Tahap 77 — Aturan situs yang berlaku di dua dari tujuh hero

> `e2e/taste-preflight.e2e.ts` menegakkan _"the hero is a single moment, not a
> feature list"_ dan menjalankannya pada **`/en` dan `/id` saja**. Lima hero
> lain tidak pernah diukur. Tiga tahap berbeda menemukan lubang yang sama dan
> masing-masing menulis komentar untuk menutupinya — **tidak satu pun menulis
> gerbangnya**.

## 1. Yang diukur, sebelum satu baris kode

### 1.1 Instrumennya diperiksa ke sumbernya lebih dulu

Aturan Tahap 70–72 dipakai lagi: angka pertama dari alat baru diperiksa
terhadap sumbernya sebelum ia membenarkan apa pun. "Hero" di sini didefinisikan
seragam — `section`/`header` terluar di dalam `<main>` yang memuat `h1` — dan
hasil pilihannya dicek kotaknya:

```
route                                 hero            box y     tinggi   docH
/en                                   section.hero        0        900   9918
/en/studio                            header.hero       152        780   5500
/en/work                              header.header     152        280   4484
/en/work/arus-balik                   header.hero       262        857   4193
/en/journal                           header.header     152        352   3082
/en/journal/scope-is-the-deliverable  header.header     190        308   3795
/en/practice/consulting               header.hero       110        630   4734
```

Tujuh kotak nyata, 280–900px, semuanya di puncak `<main>`. Bukan seluruh
halaman, bukan pembungkus. Angkanya boleh dipakai.

### 1.2 Tujuh hero, 1440×900

`beats` = `[data-reveal-item]` di dalam hero. `stack` = rumus yang gerbang itu
pakai, `beats + h1`.

```
route                                 beats   h1 sebuah beat?   stack   daun teks
/en                                       3   tidak                 4           6
/en/studio                                7   tidak                 8          18
/en/work                                  2   tidak                 3           2
/en/work/arus-balik                       2   tidak                 3           8
/en/journal                               1   tidak                 2           2
/en/journal/scope-is-the-deliverable      1   tidak                 2           4
/en/practice/consulting                   5   YA                    5          7
```

Yang diukur gerbang: **baris pertama saja** (dan kembarannya `/id`).

### 1.3 Cacat pertama: rumusnya menghitung headline dua kali

```js
const beats = hero.querySelectorAll('[data-reveal-item]').length
const headline = hero.querySelector('h1') ? 1 : 0
return beats + headline
```

Komentarnya menjelaskan kenapa `h1` ditambahkan terpisah: _"the headline, which
reveals through SplitText"_ — di beranda `h1` terbuka lewat SplitText dan **tidak**
membawa penanda beat, jadi ia harus dihitung sendiri.

Asumsi itu benar di **lima** hero dan salah di satu. `PracticeHero` memberi
`data-reveal-item` pada `h1`-nya, jadi rumus ini melaporkan **6** untuk tumpukan
yang isinya **5**. Asumsinya tidak pernah dinyatakan, dan tidak ada yang
memeriksanya — karena gerbangnya tidak pernah jalan di sana.

### 1.4 Cacat kedua, dan ini yang sebenarnya: Tahap 75 melewati plafon tanpa terlihat

`PracticeHero` sebelum Tahap 75: eyebrow, headline, intro, count — **4, tepat di
plafon**. Tahap 75 menambahkan index praktik sebagai anak kelima.

```
/practice/<v>   sebelum Tahap 75   4   (plafon)
                sesudah            5   (lewat)
```

Tidak ada yang merah, karena gerbangnya tidak menjangkau rute itu. Dan di
Tahap 76 **saya sendiri** menulis panjang lebar soal komposisi index itu —
menambatnya ke tepi kanan, mengukur tintanya, memotret hasilnya — **tanpa sekali
pun mengujinya terhadap aturan hero situs ini.**

### 1.5 Tiga komentar menambal satu deklarasi yang tidak ada

| tahap | di mana                            | apa yang ditulis                                                                                                                    |
| ----- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 69    | `app/[locale]/studio/page.tsx:268` | _"that rule is scoped to `[data-epic="hero-arrival"]` and cannot see this header, which makes it guidance here rather than a gate"_ |
| 76    | `docs/stages/TAHAP-76.md` §4       | rumusnya menghitung `h1` dua kali di blok ini; dicatat sebagai utang                                                                |
| 77    | ini                                | —                                                                                                                                   |

Tiga kali menemukan lubang yang sama. Tiga komentar. Nol gerbang. Itu kelas
cacat yang sama persis dengan `[data-epic]` menyebut momen tanpa elemen
(Tahap 50, 52), §7 yang salah dua puluh enam tahap (Tahap 73), dan
`results.incomplete` yang tak pernah dibaca (Tahap 72): **sebuah invarian yang
dinyatakan di prosa dan tidak punya instrumen.**

### 1.6 Kenapa plafon 4 **tidak** boleh dipasang ke tujuh-tujuhnya

Godaan yang jelas adalah memperluas uji itu ke semua rute. Diukur lebih dulu:
yang akan merah adalah `/studio` (8) dan `/practice/<v>` (5).

Keduanya **keputusan yang diambil dengan pengukuran**:

- `/studio` — Tahap 69 memindahkan kapabilitas ke kaki hero karena di tempat
  lamanya mereka duduk di `y=4255` dari 5008px, **160px pada kedalaman 85%**,
  hal paling tidak mungkin dibaca di halaman yang ada untuk mengatakan apa yang
  studio ini kerjakan. Pindahnya mengisi slack yang hero sudah pesan, dan
  **nol tambahan tinggi halaman**.
- `/practice/<v>` — Tahap 75 menambahkan index karena `max-width: 60ch` di
  kontainer meninggalkan 824px kosong; Tahap 76 mengukur ulang tintanya (45%
  sebelum, 97% sesudah).

Memerahkan keduanya atas nama sebuah angka akan **membatalkan dua keputusan
terukur dengan selera** — kebalikan persis dari kesalahan Tahap 75 yang baru
saja Tahap 76 koreksi. Plafon 4 itu angka **hero kedatangan**, dari
`ui-ux-pro-max`, dan kalimat aturannya sendiri ("bukan daftar fitur") bukan
sesuatu yang satu bilangan bisa ungkapkan di tujuh hero dengan tugas berbeda.

## 2. Yang dikerjakan

### 77a — rumusnya berhenti menghitung dua kali

Headline ditambahkan hanya kalau ia **bukan** sudah sebuah beat. Satu baris,
dan asumsi SplitText yang selama ini tersirat jadi tertulis.

### 77b — cakupan aturan jadi data, bukan sifat diam-diam

Preseden `STORY_EXEMPT` (Tahap 73) dan `VOID_EXEMPT` (Tahap 74): daftar
ter-alasan, satu `because` per entri, bukan komentar yang tersebar di tiga
berkas. Hero kedatangan diatur plafonnya; lima lainnya dikecualikan **berikut
alasan terukurnya**, yang kalimatnya diambil dari tahap yang memutuskannya.

### 77c — gerbang kelengkapan: tidak ada hero yang lolos diam-diam

Ini bagian yang membuat lubangnya tidak bisa terulang. Sapuan atas setiap rute
mencari hero-nya, lalu menuntut **setiap** hero itu terhitung — diatur atau
dikecualikan-dengan-alasan. Hero baru yang muncul tanpa diklasifikasikan
memerahkan gerbangnya, alih-alih menunggu tahap keempat menemukannya lagi dan
menulis komentar keempat.

### 77d — dokumen

Komentar Tahap 69 di `studio/page.tsx` menunjuk ke datanya alih-alih menjelaskan
sendiri lubang yang sudah tidak ada. `TAHAP-76.md` §4 utangnya ditutup dan
ditandai. `ROADMAP.md` dapat entri dan baris status.

## 3. Yang **tidak** dikerjakan

| butir                                         | kenapa tidak                                                                                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Memasang plafon 4 ke tujuh hero               | §1.6 — akan membatalkan Tahap 69 dan 75 dengan selera, bukan dengan pengukuran                                                             |
| Mengarang plafon kedua untuk hero-dalam       | Pelajaran Tahap 76: tidak ada tebing di angkanya, dan ambang yang mengaku lebih dari yang bisa ia katakan adalah selera berbaju pengukuran |
| Mengubah komposisi `/studio` atau `/practice` | Keduanya dibela pengukuran. Yang hilang gerbangnya, bukan desainnya                                                                        |
| Menyentuh token, palet, atau motion           | Nol                                                                                                                                        |

## 4. Gerbang

| gerbang                           | menuntut                                                                                                                                                               |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **baru** `e2e/hero-stack.test.ts` | matematikanya tanpa browser: headline dihitung sekali, kedua bentuk tumpukan yang sama menghasilkan angka yang sama, tiap pengecualian membawa alasan **dan** angkanya |
| **baru** sapuan kelengkapan       | setiap hero di delapan rute: diatur atau dikecualikan-ber-alasan; dan tiap pengecualian masih punya hero                                                               |
| `taste-preflight` plafon tumpukan | `/en` dan `/id` tetap ≤ 4, sekarang lewat `stackFaults`                                                                                                                |
| `first-screen-void`               | tidak berubah — nol perubahan komposisi                                                                                                                                |
| `route-sweep`, `contrast-situ`    | tidak berubah — nol markup, nol token disentuh                                                                                                                         |

### 4.1 Dibuktikan merah lebih dulu

Entri `/en/studio` dihapus sementara dari `STACK_EXEMPT`, lalu sapuannya
dijalankan:

```
Array [
+   "/en/studio: hero is neither governed by the stack ceiling nor listed in
+    STACK_EXEMPT with a reason — classify it in e2e/hero-stack.ts",
]
  1 failed
```

Dikembalikan, lalu ketiga uji hero hijau. Gerbang yang tidak pernah dilihat
merah adalah gerbang yang belum diketahui bisa gagal — pelajaran yang Tahap 76
baru saja bayar untuk sumbu horizontal.

## 5. Hasil

### 5.1 Yang berubah, tepatnya

```
rumus        beats + h1                 ->  beats + (h1 kalau ia belum sebuah beat)
cakupan      2 rute, tersirat           ->  2 diatur + 6 dikecualikan, sebagai data ber-alasan
kelengkapan  tidak ada                  ->  hero tak terklasifikasi = merah
unit         513                        ->  534 lulus, 0 gagal
```

### 5.2 Yang jujur dikatakan

- **Nol perubahan pada halaman.** Tidak satu piksel bergerak: tahap ini
  seluruhnya instrumen dan dokumen. `/studio` dan `/practice/<v>` tetap seperti
  adanya, karena keduanya dibela pengukuran dan yang hilang gerbangnya.
- **Plafon 4 tetap berlaku di dua rute saja** — sekarang karena itu tertulis
  sebagai keputusan, bukan karena tidak ada yang memeriksanya.
- Enam pengecualian adalah enam klaim yang bisa salah. Masing-masing membawa
  angka terukurnya supaya tahap berikutnya bisa membantahnya dengan pengukuran,
  bukan dengan selera.
