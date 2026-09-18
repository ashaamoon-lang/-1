# Tahap 67 — Komposisi yang tiga dokumen gambarkan, dan halamannya tidak render

> `vault/blocks/hero` menulis: _"The text elements sit on a diagonal: the index
> in the top right, the headline and its action at the bottom left."_
> Prop-nya ada. Markup-nya ada. CSS-nya ada. Labelnya ada di kedua kamus.
> **Halamannya tidak pernah mengoper prop itu**, selama lima puluh lima tahap.

## 1. Baseline, diukur — dan satu instrumen yang saya perbaiki dulu

### 1.1 Instrumen pertama saya berbohong

Sapuan pertama melaporkan **12/12 kolom terisi di setiap rute**, yang jelas
salah begitu dilihat. Penyebabnya: ia menghitung `canvas`, `svg` dan pembungkus
full-bleed — grain, grid pattern, scene shell — yang semuanya membentang selebar
layar dan tidak membawa satu pun informasi.

Diperbaiki jadi menghitung **hanya daun teks dan gambar**, melewati apa pun di
bawah `aria-hidden`. Angka di bawah dari instrumen kedua.

### 1.2 Layar pertama, 1440×900, sebelum

| rute            | kolom konten     |  n/12 | baris konten |
| --------------- | ---------------- | ----: | ------------ |
| **`/`**         | `[####........]` | **4** | **462–836**  |
| `/practice/<v>` | `[#####.......]` |     5 | 48–740       |
| `/work/<slug>`  | `[##...#######]` |     9 | 120–633      |
| `/work`         | `[############]` |    12 | 240–571      |
| `/studio`       | `[############]` |    12 | 152–439      |
| `/journal`      | `[############]` |    12 | 298–900      |

Dan pada 390×844 **semuanya 12/12**: di telepon setiap blok menumpuk selebar
layar. Jadi ini pertanyaan desktop, bukan pertanyaan responsif.

**Koreksi terhadap klaim saya di Tahap 66.** Saya menulis bahwa layar pertama
yang setengah kosong adalah "kebiasaan yang sama di `/work`, `/journal` dan
`/work/<slug>`". **Salah** — ketiganya mengisi lebarnya. Yang sempit hanya dua
rute, dan satu di antaranya (`/practice/<v>`) sudah diukur di Tahap 65 dan ada
di plafon yang tata letaknya izinkan.

Jadi subjeknya satu: beranda.

### 1.3 Beranda, dibedah

```
section .hero            0–900   (100svh)
  .background            0–900   scene-shell + grain 0,45 + grid 0,40  (semua aria-hidden)
  .frame                72–836
    .content           462–836
      h1               462–666   w=1080
      p (subline)      698–758   w= 363
      .action          790–836   w= 178
```

**Tidak ada apa pun di atas 462** — 51% layar pertama hanya ground. Dan tiga
elemen teksnya berukuran 1080, 363, 178: sebuah tangga menuruni tepi kiri.

Itu persis komposisi yang doc prop `index` catat Tahap 12 **hapus**:

> _"the headline ran to 75% of the viewport, the subline to 26% and the action
> to 12% — a staircase down the left edge with nothing at all on the right…
> The emptiness was not a composition, it was `align-items: center` and no
> second element."_

## 2. Penyebabnya: satu prop yang tidak pernah dioper

Semuanya sudah ada, dan tidak satu pun terpakai:

| aset                                           | keadaan                                                         |
| ---------------------------------------------- | --------------------------------------------------------------- |
| `HeroProps.index`                              | ada, bertipe, berdokumen sejak Tahap 12d                        |
| markup `.index` / `.indexLabel` / `.indexList` | ada                                                             |
| CSS `grid-column: 9 / -1` (desktop)            | ada — "the four columns the headline's 9em measure leaves free" |
| `home.heroIndexLabel`                          | **idle** di `en.json` _dan_ `id.json`                           |
| `app/[locale]/page.tsx`                        | **tidak pernah mengoper `index`**                               |

Dan **tiga dokumen menggambarkan hasilnya seolah tayang**: doc blok itu
sendiri, `lib/content/practices.ts` ("the hero's right-hand column has been
labelled `Practice` / `Praktik` since Tahap 12d"), dan kamusnya.

Ini kelas cacat yang sama dengan `[data-epic]` yang menyebut momen tanpa
elemen — yang Tahap 50 dan 52 temukan dua kali di motion. Kali ini di
**komposisi**, dan tidak ada satu gerbang pun yang bisa melihatnya.

## 3. Yang dikirim

### 3a — Prop-nya dioper

Satu prop. Kata-katanya yang halaman ini **sudah** pakai: `home.heroIndexLabel`
untuk labelnya, dan tiga nama praktik dari konstanta `PRACTICES` + label
`workIndex.<practice>` yang sama — sumber yang sama persis yang `PracticeList`
di bawahnya baca. Nol kata karangan.

### 3b — Jarak dari header, yang ditemukan dengan melihatnya

Begitu index-nya tayang, cacat kedua muncul: `.frame` mulai tepat di
`--header-height`, jadi labelnya mendarat di **y=72 terhadap header fixed yang
tepi bawahnya 72** — rapat, dengan pita z-20 header menyentuh tinggi huruf.
Sama di telepon, dan lebih cepat: **58 terhadap 58**.

`padding-block-start` di `.index`, dua sisi media query. Ruangnya diambil dari
baris 2 frame — `minmax(0, 1fr)`, slack yang menyerap 304px pada 1440×900.
Catatan pada `.frame` merekam apa yang terjadi satu kali baris itu **meminta**
ruang alih-alih memberi: CTA jatuh 78px di bawah layar 900px.

Terukur sesudahnya, tiga viewport:

```
1440×900   header↓72   label +24px   h1 462–666   action 790–836   hero 0–900   CTA di atas fold
1280×720   header↓70   label +21px   h1 322–505   action 621–663   hero 0–720   CTA di atas fold
 390×844   header↓58   label +17px   h1 574–640   action 749–794   hero 0–844   CTA di atas fold
```

Hero tetap tepat `100svh` di ketiganya, dan dokumen tetap 9918px — tidak ada
yang di bawahnya bergeser.

### 3c — Story-nya juga tidak pernah mengoper prop itu

`Default` di `hero.stories.tsx` menghilangkan `index` juga, jadi katalog
komponen memperagakan tangga yang sama. Sebuah story yang menghilangkan
argumen yang blok itu dirancang di sekitarnya **mendokumentasikan bloknya
salah**. Diperbaiki bersama halamannya.

## 4. Hasil terukur

```
                 sebelum            sesudah
kolom konten     4/12               8/12
baris konten     462–836 (dari 900) 96–836
telepon          665–794            58–794
```

## 5. Gerbang

Yang mengikat bentuk ini, dan tidak satu pun dinaikkan:

| gerbang                      | menuntut                                                                                                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `e2e/taste-preflight.e2e.ts` | **hero ≤ 4 elemen teks** — baseline merahnya dulu **5** (index, headline, subline, CTA, cue), dan cue-nya yang dihapus. Index-nya kembali sekarang, jadi gerbang ini yang menentukan apakah angkanya masih benar |
| `e2e/no-javascript.e2e.ts`   | beranda merender index-nya server-side                                                                                                                                                                           |
| `e2e/route-budget.e2e.ts`    | `/en` dan `/id` pada plafon 2100 KB                                                                                                                                                                              |
| `e2e/epic-sequence.e2e.ts`   | `hero-arrival` tidak berbagi rentang                                                                                                                                                                             |
| `storybook-a11y`             | story `Default` dengan index-nya                                                                                                                                                                                 |
