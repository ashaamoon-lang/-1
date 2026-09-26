# Tahap 69 — Hero yang meminta satu layar dan mengisi sepertiganya

> `/studio` menahan layar pertama dengan alasan gerak yang sah dan terdokumentasi,
> lalu meletakkan seluruh isinya di **sepertiga atas** kotak itu. Dan makin besar
> layarnya makin parah — kebalikan dari yang dilakukan hero yang tersusun.

## 1. Yang diukur, sebelum satu baris kode

Build produksi, Chromium nyata, empat ukuran, dua locale.

| viewport      | kotak hero     | isi berakhir |    kosong |  % hero | % layar |
| ------------- | -------------- | -----------: | --------: | ------: | ------: |
| 1728×1117 /en | 172→1161 (989) |          488 | **673px** | **68%** |     60% |
| 1440×900 /en  | 152→ 932 (780) |          439 | **493px** |     63% |     55% |
| 1440×900 /id  | 152→ 932 (780) |          454 |     478px |     61% |     53% |
| 1280×720 /en  | 141→ 746 (605) |          412 |     334px |     55% |     46% |
| 390×844 /en   | 108→ 862 (754) |          595 |     267px |     35% |     32% |

**Makin besar layar makin besar lubangnya.** Itu tandanya: tinggi kotaknya diikat
ke viewport, isinya tidak diikat ke kotaknya. Dua kolomnya berhenti di ketinggian
yang hampir sama (416 dan 439), jadi ini **bukan** diagonal seperti beranda —
ini satu pita isi di atas, lalu tanah kosong.

Kelas yang sama persis dengan yang Tahap 67 perbaiki di beranda (`462→836 dari
900`, 51% atas kosong), dicerminkan: di sini **bawahnya** yang kosong.

### 1.1 Tingginya tidak bisa dikurangi, dan itu sudah diperiksa

`.hero { min-block-size: calc(100svh - var(--header-height) - var(--section-lead)) }`
bukan hiasan. Komentarnya merekam Tahap 25 §2.2: pernyataan di bawahnya **sudah
sepertiga tersingkap pada `scrollY 0`**, dan tidak ada nilai `start` yang bisa
memperbaikinya — scrub pada elemen yang sudah di layar sudah terlanjur berjalan.
Parameternya tidak pernah jadi masalah; tata letaknya.

Diperiksa ulang di sini: hero mulai di 152, dan `statementSection` mulai di
**980** terhadap fold 900 — hanya **80px** di bawahnya. Jadi tinggi 780px itu
membeli margin 80px, dan memangkasnya mengembalikan cacat Tahap 25.

**Tingginya terkunci. Yang bisa berubah adalah apa yang ada di dalamnya.**

## 2. Peta halaman, dan di mana isi paling konkretnya duduk

```
hero              y= 152  h= 780    <- 493px bawahnya kosong
statementSection  y= 980  h= 212    "How we think about it"
evidence          y=1240  h= 687    "Work it produced"
sequence          y=1975  h=2232    "How we work"
capabilities      y=4255  h= 160    "What that covers"   <- 85% kedalaman
colophon          y=4464  h= 190
closing           y=4702  h= 146
```

`capabilities` adalah **dua belas butir yang sama** yang Tahap 65 beri sekuens
ter-pin setinggi layar penuh di `/practice/<value>`. Di sini mereka dapat
**160px pada kedalaman 85%**, di belakang sekuens proses setinggi 2232px.

Jadi ini bukan dua cacat. Ini satu: **pernyataan paling konkret halaman ini ada
di tempat paling tidak terbaca, sementara tempat paling terbaca kosong.**

## 3. Yang dikerjakan

`capabilities` pindah ke dua pertiga bawah hero, sebagai pita tiga kolom di
kakinya. **Nol kata baru** — yang berubah tempatnya.

Konsekuensi yang membuat ini murah, dan ini yang diukur untuk membuktikannya:

- **Nol tinggi baru.** Pita itu mengisi 493px yang sudah ada, jadi kotak hero
  tidak tumbuh dan `statementSection` **tidak bergerak** — margin 80px §1.1
  tetap utuh.
- Halamannya justru **memendek** karena `capabilities` meninggalkan posisi
  lamanya.
- Tiga tautan ke `/practice/<v>` naik dari kedalaman 85% ke layar pertama.

### 3.1 Kenapa pita, bukan daftar fitur

`e2e/taste-preflight.e2e.ts:148` menahan **hero ≤ 4 elemen teks**, dengan
alasannya ditulis: _"the hero is a single moment, not a feature list"_. Aturan
itu ber-scope `[data-epic="hero-arrival"]`, yang **hanya beranda** — hero
`/studio` tidak punya penanda itu, jadi aturannya tidak melihatnya.

Itu bukan izin. Aturannya tidak berlaku, alasannya berlaku. Yang membedakan
pita ini dari daftar fitur:

- ia duduk di **kaki** hero sebagai pita, bukan menumpuk jadi beat kelima yang
  bersaing dengan headline;
- ia tiga kolom sejajar, bukan tumpukan terpusat;
- ia **satu** `data-reveal-item` per praktik, bukan dua belas.

Kalau terukur nanti ia justru membuat hero-nya lebih buruk, ia **dikembalikan
dengan angkanya**, seperti regangan kolom fakta di Tahap 66 — lihat §6.

## 4. Yang **tidak** dikerjakan, dan alasannya

| butir                               | kenapa tidak                                                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Memangkas `min-block-size` hero     | §1.1 — mengembalikan cacat scrub Tahap 25 §2.2. Diperiksa, bukan diasumsikan                                   |
| `align-content: space-between`      | Persis yang Tahap 66 ukur dan **tolak** di kolom fakta project-hero. Jarak bukan konten                        |
| Memindahkan dua belas butirnya utuh | Itu daftar fitur di dalam hero, yang §3.1 ada untuk mencegah. Yang pindah bloknya apa adanya, bukan dimekarkan |
| Momen koreografi baru               | `/studio` sudah 3 dari 12. Plafon yang tersedia bukan alasan membelanjakannya — `MOTION-SPEC.md` §9.5          |
| Mengarang isi untuk mengisi lubang  | Aturan pemilik masih berlaku: presentasi berubah, isi tidak                                                    |

## 5. Gerbang

| gerbang                          | menuntut                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| **baru** — hero `/studio` terisi | isi hero mencapai sebagian besar kotaknya di setiap viewport; dibuktikan merah dulu |
| `e2e/first-screen.e2e.ts`        | `/studio` membuka pada subjeknya                                                    |
| `e2e/epic-sequence.e2e.ts`       | `studio-statement` tetap punya rentang gulirnya — pernyataan tetap di bawah fold    |
| `e2e/site-reach.e2e.ts`          | tiga jalan ke depan dari isinya sendiri; tautannya pindah, tidak hilang             |
| `e2e/reveal-coverage.e2e.ts`     | blok yang pindah tetap tersingkap                                                   |
| `e2e/taste-preflight.e2e.ts`     | tetap hijau, termasuk plafon hero beranda yang tidak disentuh                       |
| `e2e/interaction-grammar.e2e.ts` | `/studio` tetap 3 dari 12; plafon tidak dinaikkan                                   |
| `contrast.test.ts`               | **tidak berubah** — nol token warna disentuh                                        |
| `vault/vault-api.test.ts`        | tetap hijau — gerbang Tahap 68                                                      |

## 6. Verifikasi

```bash
bun run check
bun run build
bun run build-storybook
CI=1 bun run test:e2e
```

Ditambah, diukur di Chromium nyata dan angkanya ditulis kembali ke sini:

- Geometri hero **sebelum dan sesudah**, keempat viewport dan kedua locale
- `statementSection` **tidak bergerak** dari y=980 — angkanya, bukan klaimnya
- Tinggi dokumen sebelum/sesudah
- Reduced motion: isi berakhir `opacity: 1` dan tergambar
- Keyboard: tiga tautan praktik terjangkau Tab pada posisi barunya
- axe dari dalam hero
- Screenshot, dan **saya lihat sendiri** sebelum commit

Nol angka performa tanpa profiler (`CLAUDE.md` #19), nol klaim aksesibilitas
tanpa axe (#20), dan apa pun yang dilewati atau gagal **dikatakan** (#21).

## 6.1 Hasil terukur

Semua di build produksi, Chromium nyata.

**Ekor hero, sebelum → sesudah:**

| viewport      |   sebelum | sesudah |
| ------------- | --------: | ------: |
| 1728×1117 /en | 673px 68% |  **0%** |
| 1440×900 /en  | 493px 63% |  **0%** |
| 1440×900 /id  | 478px 61% |  **0%** |
| 1280×720 /en  | 334px 55% |  **0%** |
| 390×844 /en   | 267px 35% |  **0%** |

**Pernyataan tidak bergerak satu piksel pun** — klaim §1.1, diukur, bukan
diasumsikan:

```
                 sebelum   sesudah
hero             152 h780  152 h780
statementSection y=980     y=980
evidence         y=1240    y=1240
sequence         y=1975    y=1975
```

Margin 80px yang dibutuhkan scrub Tahap 25 utuh. Yang bergerak hanya ekor
halaman, naik: `colophon` 4464 → **4255**, `closing` 4702 → **4494**, dan
dokumennya **5708 → 5500 px** — 208px lebih pendek, bukan lebih panjang.

Reduced motion: keempat butir pita `opacity: 1`, `transform: none`, tergambar.

## 7. Cacat yang saya buat sendiri di tahap ini, dan gerbang yang tidak melihatnya

Ini bagian yang paling layak dibaca, dan polanya sama dengan Tahap 68.

**Pemindahan pertama berhasil secara geometri dan isinya tidak terlihat.**
`useReveal` membuka blok saat puncaknya melewati 75% viewport. Pita itu duduk di
kaki kotak yang menahan layar, jadi puncaknya **764** terhadap garis pemicu
**675** pada layar 900px — garisnya di atasnya, gulir yang akan melewatinya tidak
pernah terjadi. Diukur: `opacity: 0`, `translateY(16px)`, **masih begitu enam
detik setelah muat**. `CLAUDE.md` #5 menyebut isi yang terdampar sebagai cacat,
dan tidak ada yang menulis bug untuk menyebabkannya.

Dan **gerbang saya sendiri hijau di atasnya**. Dua kali:

1. Ia hanya mengukur kotak. Isi yang tidak terlihat mengisi kotak sama baiknya
   dengan isi yang terlihat. Ditambahkan perkalian opacity sampai ke kotaknya.
2. Masih hijau. Filter "daun"-nya mengecualikan elemen yang teksnya sama dengan
   teks **satu** anaknya — yang meloloskan setiap wadah ber-anak-banyak. Jadi
   `<section>` pita itu sendiri (opacity 1, dengan keempat butir terdampar di
   dalamnya) terhitung sebagai tinta yang mencapai lantai kotak. **Gerbangnya
   menjamin isi yang tidak satu pun terlihat.** Diperbaiki: elemen yang punya
   anak bertext adalah wadah, bukan daun.

Setelah keduanya: merah pada keadaan tak-terlihat (3 gagal), hijau setelah
diperbaiki (10 lulus).

Perbaikannya sendiri: `Reveal` tidak pernah meneruskan `rootMargin` milik
hook-nya. Sekarang meneruskannya, dan pita ini mengoper `'0px'`. Gerbang Tahap
68 menuntut prop baru punya pemanggil — dan ia punya, plus story-nya, karena
Tahap 67 lahir dari story yang menghilangkan argumen yang bloknya dirancang di
sekitarnya.

## 8. Koreksi terhadap instrumen saya sendiri

Sapuan pertama tahap ini melaporkan dua hal yang salah, dan keduanya ditulis di
sini karena saya mengatakannya:

1. **`imgNoAlt=1` di `/work/<slug>`.** Bukan cacat. Sampul `next-project`
   memang `alt=""` **dengan sengaja**, dan `NextProjectProps` menuliskan
   alasannya: gambarnya mengulang judul di sebelahnya, jadi ia dekorasi. Yang
   salah pemeriksaan saya — ia mencari `aria-hidden` pada `<img>`, padahal
   pembungkusnya yang membawanya.
2. **`document.querySelector('header')`** mengambil header situs, bukan hero
   `/studio`, dan menghasilkan `KOSONG Infinity px`. Angka di §1 adalah hasil
   setelah diperbaiki.

Ini ketiga kalinya instrumen ukur saya salah lebih dulu (Tahap 66 menghitung
dua lubang padahal satu; Tahap 67 melaporkan 12/12 kolom di setiap rute).
Polanya cukup untuk jadi aturan: **angka pertama dari instrumen baru diperiksa
dulu terhadap DOM-nya, sebelum dipakai membenarkan sebuah tahap.**
