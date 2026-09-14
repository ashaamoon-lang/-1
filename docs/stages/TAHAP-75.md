# Tahap 75 — Halaman yang memberi subjeknya 600 dari 1440 piksel

> Tahap 74 mengukur lubang **vertikal** di layar pertama dan menutupnya di
> beranda. Sumbu yang satunya tidak pernah diukur sama sekali — dan di sana ada
> satu rute yang memakai **42% lebarnya**.

## 1. Yang diukur, sebelum satu baris kode

> **KOREKSI — Tahap 76.** Setiap persentase di §1.1, §5.1 dan §5.2 diukur
> dengan menjumlahkan **lebar kotak** elemen, bukan tintanya. Sebuah eyebrow
> satu kata di dalam blok selebar kolom karenanya terhitung ~1398px. Angka-angka
> itu dibiarkan berdiri di bawah ini sebagaimana dilaporkan, dengan koreksinya
> di sampingnya; `docs/stages/TAHAP-76.md` §1 menjelaskan instrumennya.
>
> Ringkasnya, diukur sebagai tinta pada 1440×900:
>
> ```
> /practice sebelum diperbaiki   dilaporkan 42%   sebenarnya 45%
> /practice sesudah diperbaiki   dilaporkan 96%   sebenarnya 53%
> "lima rute di 95–97%"                  extent tinta 66–97%
> ```
>
> **Cacatnya nyata dan perbaikannya benar** — keempat kotak nameplate memang
> berhenti di x=616 dari 1440. Yang salah cuma ukuran yang saya laporkan, dan
> lantai 60% yang diturunkan darinya (Tahap 76 menggantinya dengan 50% extent
> tinta).

### 1.1 Lebar yang benar-benar dipakai, tujuh rute, 1440×900

Pita **kolom** kosong terlebar di layar pertama, dihitung dari kotak yang
membawa teks atau gambar:

```
/en/practice/consulting                824px kosong  x 616–1440   lebar terpakai  42%
/en                                    564px         x 394–958                    58%   <- tidak dipakai, §1.3
/en/work                                26px         x 1414–1440                  97%
/en/studio                              26px                                      97%
/en/journal                             26px                                      97%
/en/journal/scope-is-the-deliverable    26px                                      97%
/en/work/arus-balik                     22px                                      95%
```

Lima rute duduk di 95–97%, dan sisa 22–26px itu cuma gutter kanan. Satu rute
duduk di **42%**.

> Semua angka baris ini **lebar kotak**. Tinta yang sebenarnya, Tahap 76:
> `/en` 70%, `/en/work` 97%, `/en/studio` 79%, `/en/journal` 66%,
> `/journal/<slug>` 97%, `/work/<slug>` 89%, `/practice/<v>` 45%. Urutan
> "terburuk"-nya bertahan; jaraknya tidak.

### 1.2 Diverifikasi ke DOM, bukan hanya ke screenshot

```
splitMarkers                 0          (tidak ada SplitText di rute ini)
h1 "Consulting"    x 16 → 616           dan ia memiliki teksnya LANGSUNG
eyebrow "Practice" x 16 → 616
intro              x 16 → 616
count              x 16 → 616
```

Keempat kotak isi hero berhenti di x=616. Sebabnya satu baris:

```css
.hero {
  max-width: 60ch;
} /* = 600px */
```

Komentarnya membela measure nameplate-nya — _"a nameplate that runs the full 12
columns reads as a banner rather than as a subject"_ — dan itu **benar**. Yang
tidak pernah dijawab: apa yang menempati 824px sisanya. `max-width` dipasang di
**kontainer**, jadi ia membatasi keempat anaknya sekaligus dan menyisakan
lebih dari separuh layar pertama tanpa apa pun.

### 1.3 Satu angka dari alat yang sama yang **tidak** dipakai

`/en` terukur 564px / 58%, dan itu **tidak masuk** tahap ini sebagai fakta.
Beranda memakai SplitText, yang memecah `h1` jadi span per kata; filter "elemen
yang memiliki teks secara langsung" lalu mengukur potongan kata, bukan headline.
Angka `/practice` lolos karena `splitMarkers` di sana nol dan `h1`-nya memang
memiliki teksnya — diperiksa, bukan diasumsikan.

Beranda diukur lagi nanti dengan alat yang sadar SplitText. Disebut sekarang
supaya ia tidak hilang.

### 1.4 Kelas baru, bukan pengulangan Tahap 74

|         | Tahap 74                                    | Tahap 75                     |
| ------- | ------------------------------------------- | ---------------------------- |
| sumbu   | vertikal                                    | **horizontal**               |
| sebab   | `grid-row: 1` lawan konten ber-anchor bawah | `max-width` di kontainer     |
| rute    | `/en`                                       | `/practice/<v>`              |
| gerbang | `first-screen-void` mengukurnya             | **tidak diukur sama sekali** |

`/practice/<v>` bahkan **dikecualikan** dari gerbang Tahap 74 — dengan alasan
yang masih berlaku: emptiness vertikalnya dibela pengukuran Tahap 52/65
(nameplate menahan layar supaya scrub pernyataan punya runway). Emptiness
**horizontal**-nya tidak dibela di mana pun.

## 2. Yang dikerjakan

### 75a — kolom kanan hero mendapat index praktik yang sudah ada

Sumber yang sama persis yang hero beranda pakai, dan yang Tahap 74 baru saja
buat terbaca: `PRACTICES` + label `workIndex.<practice>` + label
`home.heroIndexLabel`. **Nol kata karangan.**

Di halaman praktik ia mengerjakan sesuatu yang beranda tidak: praktik
saudaranya jadi terjangkau dari **atas** halaman, bukan hanya dari
`NextPractice` di paling bawah. Praktik yang sedang dibuka ditandai, jadi daftar
itu juga menjawab "saya di mana".

Nameplate **tetap** di measure-nya: `60ch` pindah dari kontainer ke kolom
pertama sebuah grid dua kolom di desktop, jadi keputusan Tahap 15 soal measure
berdiri utuh sementara 824px sisanya berhenti kosong. Di telepon susunannya
menumpuk seperti sekarang.

### 75b — gerbang belajar sumbu kedua

`e2e/first-screen-void.ts` dapat profil horizontal di samping yang vertikal,
dan `first-screen-void.e2e.ts` menegakkan keduanya. Ambangnya **diturunkan dari
§1.1**: lima rute duduk di 95–97%, jadi lantai 60% lebar terpakai lapang dan
tetap menggigit pada 42%.

> **KOREKSI — Tahap 76.** Lantai itu diturunkan dari angka kotak, jadi dari
> angka yang salah — dan lebih buruk: dengan lebar kotak **setiap** rute
> melaporkan ≥95%, sehingga gerbang ini menangkap `/practice` hanya karena
> `max-width: 60ch` kebetulan membatasi kotaknya juga. Rute mana pun dengan
> kotak lebar dan tinta sempit lolos begitu saja. Diganti dengan lantai **50%
> extent tinta**.

Rute ber-SplitText dikecualikan dari sumbu horizontal **berikut alasannya**
(§1.3) — pola pengecualian-sebagai-data Tahap 73, supaya alat yang belum bisa
mengukur sesuatu mengatakannya alih-alih diam-diam salah.

## 3. Yang **tidak** dikerjakan

| butir                                 | kenapa tidak                                                                      |
| ------------------------------------- | --------------------------------------------------------------------------------- |
| Memindahkan kapabilitas ke hero       | Tahap 65 mengukur sekuens ter-pin itu. Membatalkannya = jebakan yang sama         |
| Memindahkan proyek ke hero            | `ProjectGrid` punya komposisinya sendiri di bawah, dan `epic-sequence` menjaganya |
| Mengubah `min-height: 70svh`          | Dibela pengukuran Tahap 52: tanpanya 46 kata pernyataan selesai dalam 8% gulir    |
| Memperbaiki `/en` di sumbu horizontal | Alatnya belum bisa mengukurnya dengan benar. §1.3                                 |
| Menyentuh token atau palet            | Nol                                                                               |

## 4. Gerbang

| gerbang                             | menuntut                                                        |
| ----------------------------------- | --------------------------------------------------------------- |
| **diperluas** `first-screen-void`   | sumbu horizontal di samping vertikal; lantai 60% lebar terpakai |
| `navigation-landing.e2e.ts`         | `h1` tetap mendarat di layar pertama sesudah navigasi           |
| `epic-sequence.e2e.ts`              | `practice-morph` tidak berubah rentang gulirnya                 |
| `storybook-a11y.e2e.ts`             | story `WithIndex` ikut disapu axe                               |
| `contrast.test.ts`, `contrast-situ` | **tidak berubah** — nol token disentuh                          |

## 5. Hasil

### 5.1 Terukur, sebelum dan sesudah

```
SEBELUM  /en/practice/consulting  824px kosong  x 616–1440   lebar terpakai 42%
SESUDAH  /en/practice/consulting   26px kosong  x 1414–1440  lebar terpakai 96%
```

26px itu gutter kanan — persis yang lima rute lain sisakan. Tidak satu pun
rute lain bergerak.

> **KOREKSI — Tahap 76.** Kedua angka itu lebar kotak. Sebagai tinta, diukur
> ulang di Chromium:
>
> ```
> SEBELUM  extent 45%   tinta x 16–668
> SESUDAH  extent 53%   tinta x 16–775
> ```
>
> Index-nya memang mengisi kolom keduanya, tapi tintanya berhenti di x=775
> sementara rule-nya berlari ke 1414 — sesuatu yang laporan berbasis kotak
> tidak bisa tunjukkan. Tahap 76c menambatnya ke tepi kanan dan extent-nya
> jadi 97%.

### 5.2 Gerbangnya, dua sumbu, dua viewport

`first-screen-void` sekarang 16 uji (delapan rute × dua viewport), masing-masing
menegakkan lubang interior **dan** lebar terpakai. Semuanya lulus.

> **KOREKSI — Tahap 76.** "Semuanya lulus" benar dan **tidak berarti banyak**:
> sumbu horizontalnya saat itu tidak bisa gagal pada apa pun kecuali kebetulan.
> Sumbu vertikalnya sehat dan tidak disentuh (TAHAP-76 §1.4).

`bun test` 506 → **512 lulus**, 0 gagal.

### 5.3 Dilihat sendiri

Desktop: nameplate di kiri pada measure-nya, "RELATED PRACTICE / AI & Data /
Commission" di kanan dengan hairline yang membawa lebarnya. Telepon: index
menumpuk di bawah count, dua praktik dalam satu baris, rule di atasnya.

### 5.4 Satu pengecualian yang **untuk alatnya, bukan untuk halamannya**

`/en` dan `/id` dikecualikan dari sumbu horizontal, dan itu dicatat sebagai
keterbatasan instrumen: SplitText memecah headline jadi span per kata, jadi
pengumpulnya mengukur potongan kata dan membaca spasi di antaranya sebagai
kolom kosong. Angka 58% itu bukan fakta tentang halamannya.

Ditinggalkan sebagai data ber-alasan alih-alih dilewati diam-diam, supaya
keterbatasannya bisa dihitung — dan supaya hari ketika pengumpulnya diajari
soal SplitText, rute yang menunggunya bisa ditemukan.

### 5.5 Regresi aksesibilitas yang saya kirim, ditangkap suite, diperbaiki

Commit pertama tahap ini (`149f979`) **mengirim pelanggaran axe nyata**, dan
suite penuh menangkapnya sesudah push:

```
practice-capabilities.e2e.ts:255   /en dan /id practice/consulting
  violations: ["target-size"]
```

WCAG 2.2 §2.5.8. Dua `<Link>` baru di index itu berukuran caption — sekitar
14px tinggi — tanpa tinggi minimum, jadi target sentuhnya di bawah 24×24.

Dan repo ini **sudah membayar ini dua kali**: `project-spine` kena persis
begini di Tahap 40, dan doc `axe-tags.ts` mencatat pengalih bahasa melakukannya
di 12,6×14px sebelum itu. Perbaikannya karena itu bukan penemuan — ia preseden
repo ini sendiri: `min-block-size: calc(var(--tap-target) / 2)` pada item dan
pada anchor-nya, token dan nilai yang sama yang header nav dan page index pakai.

Dua hal yang jujur disebut di sini:

1. **Saya menambahkan tautan baru ke sebuah blok tanpa memeriksa target-size**,
   padahal aturan itu punya dua preseden tertulis di repo ini. Gerbangnya
   bekerja; saya yang tidak memeriksanya lebih dulu.
2. Pesan commit `149f979` menyatakan suite sedang berjalan dan bahwa perbaikan
   akan jadi commit berikutnya kalau merah. Ia merah, dan ini commit itu.
