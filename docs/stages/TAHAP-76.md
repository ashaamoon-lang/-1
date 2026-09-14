# Tahap 76 — Sumbu yang saya ukur dengan penggaris yang salah

> Tahap 75 mengirim perbaikan yang benar dan **gerbang yang tidak menggigit**,
> lalu membenarkan ambangnya dengan angka yang tidak mengukur apa yang saya
> katakan ia ukur. Tahap ini mengoreksi instrumennya, angkanya, dan dokumennya.

## 1. Yang salah, tepatnya

`widthProfile()` menjumlahkan lebar **kotak** elemen. Di `/en/journal`:

```
<p class="caption">Journal</p>     kotak x 16 → 1414   (1398px)
                                   tintanya ~60px
```

Sebuah eyebrow satu kata di dalam blok selebar kolom terhitung **1398px lebar
terpakai**. Itu bukan kesalahan kecil pada satu rute — itu membuat hampir setiap
angka yang Tahap 75 laporkan salah.

### 1.1 Kotak lawan tinta, tujuh rute, 1440×900

Tinta diukur dari `Range.getClientRects()` pada simpul teksnya — teknik yang
sama yang Tahap 72 pakai untuk kotak glif.

```
route                                 KOTAK   tinta:coverage   tinta:extent
/en                                    58%         30%             70%
/en/work                               97%         96%             97%
/en/studio                             97%         65%             79%
/en/journal                            97%         66%             66%
/en/practice/consulting                96%         53%             53%
/en/work/arus-balik                    95%         62%             89%
/en/journal/scope-is-the-deliverable   97%         97%             97%
```

Dan pada 390×844 semuanya **83–89%**: di telepon setiap blok menumpuk selebar
layar, jadi ini pertanyaan desktop, bukan pertanyaan responsif.

### 1.2 Tiga klaim Tahap 75 yang karena itu salah

| klaim Tahap 75                          | sebenarnya                                                    |
| --------------------------------------- | ------------------------------------------------------------- |
| "lima rute duduk di 95–97%"             | itu lebar kotak. Tinta: **30–97%**, sebaran yang jauh berbeda |
| ambang 60% "diturunkan dari pengukuran" | diturunkan dari angka kotak — jadi **dari angka yang salah**  |
| `/practice` "824px → 26px kosong"       | itu kotak. Dalam tinta: **824px → 665px**                     |

Yang **tetap benar**: `/practice` memang memberi subjeknya 600px dari 1440px,
keempat kotak isinya memang berhenti di x=616, dan screenshot sebelum-sesudah
memang menunjukkan komposisi yang lebih baik. **Perbaikannya nyata; ukurannya
yang saya laporkan terlalu besar.**

### 1.3 Gerbangnya nyaris tidak menggigit, dan itu yang paling serius

Dengan lebar kotak, setiap rute melaporkan ≥95%. Gerbang Tahap 75 menangkap
`/practice` **hanya karena** `max-width: 60ch` kebetulan membatasi kotaknya
juga. Rute mana pun dengan kotak lebar dan tinta sempit lolos begitu saja.

Itu persis kelas kegagalan yang Tahap 68, 70 dan 72 masing-masing catat: sebuah
gerbang yang tidak bisa gagal pada defek yang melahirkannya.

### 1.4 Sumbu vertikal diperiksa, dan ia sehat

Sebelum menyalahkan seluruh berkas, sumbu satunya diukur dengan kedua cara:

```
route                                 lubang interior: KOTAK   TINTA
/en                                       12px                 10px
/en/work                                 134px                134px
/en/studio                               364px                363px
/en/journal                              142px                141px
/en/practice/consulting                  376px                375px
/en/work/arus-balik                      128px                126px
/en/journal/scope-is-the-deliverable      48px                 48px
```

Beda 1–2px di setiap rute — untuk teks, tinggi kotak memang tinggi tinta.
**Tahap 74 berdiri utuh.** Yang cacat cuma sumbu horizontal.

## 2. Yang dikerjakan

### 76a — instrumen pindah ke tinta, dan melaporkan dua angka

Coverage (berapa banyak lebar yang terisi) dan **extent** (dari tinta paling
kiri ke paling kanan). Keduanya perlu, karena keduanya menjawab pertanyaan
berbeda: beranda punya coverage 30% dan extent 70% — dua massa dengan jarak di
antaranya, yang **komposisi, bukan cacat**, dan hanya extent yang tahu bedanya.

### 76b — ambangnya diturunkan ulang, dan dipersempit jadi satu klaim

Extent, bukan coverage, dan **50%**, dengan angkanya ditulis — dan semuanya
diukur ulang sebagai tinta, karena mengutip angka kotak di tabel tinta persis
kesalahan yang tahap ini koreksi:

```
/practice sebelum Tahap 75 memperbaikinya   45%   akan gagal
lantai                                      50%
rute terendah yang lulus                    66%   (/journal)
berikutnya                                  70%   (/en)
```

**Angka 45% itu diukur, bukan diwarisi.** Tahap 75 melaporkan keadaan yang sama
sebagai "42%" — itu extent _kotak_-nya. Disimulasikan di Chromium dengan index
disembunyikan dan `max-width: 60ch` dikembalikan ke kontainer:

```
pra-75  (tanpa index, kontainer 60ch)   coverage 45%   extent 45%   tinta x 16–668
75      (index, rata kiri)              coverage 53%   extent 53%   tinta x 16–775
76      (index, ditambat ke kanan)      coverage 55%   extent 97%   tinta x 16–1414
```

Ini juga yang **membenarkan lantainya**: keadaan pra-75 ada di 45%, di bawah
lantai, jadi gerbang ini memang bisa gagal pada defek yang melahirkannya —
syarat yang §1.3 catat tidak dipenuhi versi Tahap 75.

Dan ia dinyatakan sebagai apa adanya: **lantai terhadap konfinemen** — "isi
sebuah layar pertama tidak boleh terkurung di satu kolom sempit sementara
kisinya menawarkan dua belas" — **bukan** ukuran mutu komposisi. Tidak ada
ambang yang bisa memisahkan komposisi yang bagus dari yang jelek di sini;
angkanya kontinum (53, 66, 70, 79, 89, 97, 97) tanpa tebing. Mengaku lebih dari
itu adalah selera berbaju pengukuran, yang persis kesalahan Tahap 75.

Kontinum itu sebelum 76c: **53, 66, 70, 79, 89, 97, 97**. Sesudahnya:
**66, 70, 79, 89, 97, 97, 97** — rute terendah yang lulus jadi `/journal`, dan
jarak ke lantai melebar dari tiga poin ke enam belas. Lantainya **tidak**
digeser untuk menyesuaikan.

### 76c — `/practice` menahan kedua tepi

**Komposisi, bukan kepatuhan, dan bedanya ditulis di sini supaya tidak
tertukar.** Pada 53% rute ini **lulus** lantai 50%; tidak ada yang merah.
Alasannya dari screenshot, bukan dari angka: index-nya duduk di kolom kedua
grid tapi tintanya berhenti di x=775 sementara rule-nya berlari ke 1414 — teks
rata kiri di bawah rule selebar kolom terbaca seperti daftar yang kehilangan
sisi kanannya. Ditambat ke tepi kanan kolomnya, hero itu memegang kedua margin:
headline di kiri-bawah, index di kanan-bawah — diagonal yang sama yang
`vault/blocks/hero` pakai untuk beranda.

Extent-nya naik 53% → 97% sebagai efek samping, **bukan sebagai alasannya**.

#### Dua hal yang hanya ketahuan karena dilihat, bukan diukur

1. `text-align: end` memindahkan labelnya ke kanan dan **meninggalkan
   item-itemnya di kiri**: perbaikan `target-size` Tahap 75 menjadikan tiap
   `li` sebuah flex container, dan anak flex menjawab `justify-content`, bukan
   `text-align`. Angkanya sudah 97% saat komposisinya justru lebih buruk —
   label di satu tepi, daftarnya di tepi lain. Diperbaiki dengan
   `justify-content: flex-end`.

2. Komentar `align-self: end` di `.index` menjanjikan index itu duduk "level
   with the foot of the nameplate". **Tidak pernah.** Auto-placement menaruh
   nav ini di baris terakhir bersama `.count`, dan pada 87px ia yang lebih
   tinggi — jadi ia yang _menentukan_ tinggi baris itu dan tidak punya slack
   untuk didorong. Terukur: tinta nameplate berhenti di y=668, daftar ini di
   y=737.

   Membuatnya benar-benar rata bawah dicoba — baris eksplisit ditambah
   `grid-row` yang membentang — dan **ditolak dengan pengukuran**:

   ```
   dikirim         tinta headline berhenti 592, rule di 653   +61px lega
   rata bawah      tinta headline berhenti 665, rule di 653   −12px, terpotong
   ```

   Rule-nya memotong ekor "g" pada _Consulting_. Deklarasinya dihapus dan
   komentarnya diganti dengan yang terukur — kelas cacat yang sama dengan
   `.index` beranda di Tahap 67: sebuah invarian yang ditulis di komentar
   komponennya sendiri tanpa satu instrumen pun yang bisa melihatnya.

### 76d — angka palsu di dokumen dikoreksi

Enam tempat membawa klaim yang sama, dan dua di antaranya **saling
bertentangan** (42% di CSS dan story, 57% di `index.tsx`) — tanda sendiri bahwa
tidak ada yang mengukur ulang. Semuanya diperbaiki di tempatnya, dengan catatan
bahwa angkanya dikoreksi dan kenapa:

| berkas                                     | klaim lama                      |
| ------------------------------------------ | ------------------------------- |
| `e2e/first-screen-void.ts`                 | lantai diturunkan dari "42%"    |
| `vault/blocks/practice-hero/index.tsx`     | "57% … against 95-97%"          |
| `vault/blocks/practice-hero/*.module.css`  | "42% … against 95–97%"          |
| `vault/blocks/practice-hero/*.stories.tsx` | "42% … against 95–97%"          |
| `docs/stages/TAHAP-75.md` §1.1, §5.1–5.2   | "lima rute duduk di 95–97%"     |
| `docs/ROADMAP.md` entri Tahap 75           | "Lima rute lain memakai 95–97%" |

## 3. Yang **tidak** dikerjakan

| butir                                        | kenapa tidak                                                                                                                                                                                                                                  |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Membatalkan perbaikan `/practice`            | Ia nyata dan terlihat di screenshot. Yang salah laporannya, bukan desainnya                                                                                                                                                                   |
| Menyentuh sumbu vertikal                     | §1.4 — diperiksa dan sehat                                                                                                                                                                                                                    |
| Mengecualikan `/en` dari horizontal          | Tidak perlu lagi: dengan tinta ia 70% extent dan lulus apa adanya. Pengecualian SplitText Tahap 75 dihapus                                                                                                                                    |
| Menyentuh token atau palet                   | Nol                                                                                                                                                                                                                                           |
| Memperluas `taste-preflight` ke hero praktik | Rumusnya menghitung `h1` dua kali di blok ini (§4). Memperbaikinya butuh keputusan selera sendiri, dan menumpangkannya di sini akan mengulang kesalahan Tahap 75: ambang yang diturunkan dari angka yang tidak mengukur apa yang dikatakannya |

## 4. Gerbang

| gerbang                                    | menuntut                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------- |
| **ditulis ulang** `first-screen-void.ts`   | profil horizontal diukur dari tinta, melaporkan `coveragePct` dan `extentPct`         |
| **ditulis ulang** `first-screen-void.test` | matematikanya tanpa browser; `widthProfile` dan `widthFaults` diuji di tiap cabangnya |
| `first-screen-void.e2e.ts`                 | delapan rute × dua viewport, lantai 50% extent tinta                                  |
| `storybook-a11y.e2e.ts`                    | story `WithIndex` tetap disapu axe sesudah `text-align` berubah                       |
| `route-sweep.e2e.ts`                       | `target-size` tetap hijau di `/en` dan `/id` `practice/consulting`                    |
| `contrast.test.ts`, `contrast-situ`        | **tidak berubah** — nol token disentuh                                                |

**Satu gerbang yang saya kira menutupi ini dan ternyata tidak.** Saya sempat
menulis di tabel ini bahwa `taste-preflight` menjaga hero `/practice/<v>` di
≤ 4 elemen teks. **Salah** — uji "hero holds at most four text elements" itu
melakukan loop atas `['/en', '/id']` saja, dan mencari
`[data-epic="hero-arrival"]`; hero praktik membawa `practice-morph`, jadi rute
ini tidak pernah diukur olehnya. Dihapus dari tabel alih-alih dibiarkan berdiri.

Rumusnya pun tidak bisa dipinjam apa adanya ke sini: ia menjumlahkan
`[data-reveal-item]` **plus** `h1` karena di beranda headline-nya terbuka lewat
SplitText dan tidak membawa penanda beat. Di `PracticeHero` `h1`-nya membawa
`data-reveal-item`, jadi rumus itu akan menghitungnya dua kali. Dicatat sebagai
utang, bukan ditambal dengan angka yang salah — persis kesalahan yang tahap ini
koreksi.
| `css-rules` | `text-align` dan `justify-content` bukan properti beranimasi; nol `cubic-bezier` baru |

## 5. Hasil

### 5.1 Sumbu horizontal, sesudah — 1440×900, tinta

```
route                                  coverage   extent
/en                                       30%       70%
/en/work                                  96%       97%
/en/studio                                65%       79%
/en/journal                               66%       66%
/en/practice/consulting                   55%       97%   <- 53%/53% sebelum 76c
/en/work/arus-balik                       62%       89%
/en/journal/scope-is-the-deliverable      97%       97%
```

Hanya `/practice` yang bergerak. Enam rute lain tidak disentuh, dan angkanya
sama persis dengan §1.1.

### 5.2 Yang jujur dikatakan tentang tahap ini

- Perubahan CSS-nya **satu rute, dua deklarasi** (`text-align: end` pada
  `.index`, `justify-content: flex-end` pada `.indexItem`) ditambah satu
  deklarasi **dihapus** (`align-self: end`). Sisanya instrumen dan dokumen.
- `/practice` **tidak pernah merah**. Kalau tahap ini diukur dari "gerbang yang
  diperbaiki", hasilnya nol; nilainya ada di instrumen yang sekarang bisa gagal
  dan di enam dokumen yang berhenti berbohong.
- Nol angka performa diklaim (`CLAUDE.md` #19). Nol klaim aksesibilitas di luar
  apa yang axe jalankan (#20).
