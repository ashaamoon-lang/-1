# Tahap 72 — teks di atas gambar, dan gerbang yang tidak bisa melihatnya

> Tujuh rute "axe bersih". Dan di antara keduanya, 185 node kontras yang
> **tidak pernah dinilai oleh siapa pun** — karena axe mengembalikannya sebagai
> `incomplete`, dan tidak ada satu pun berkas e2e yang membaca `incomplete`.
> Di dalam lubang itu ada defek yang terlihat dengan mata.

## 1. Yang diukur, sebelum satu baris kode

### 1.1 Lubangnya, dihitung

```
11 pemanggilan `new AxeBuilder` di 10 berkas e2e
11 membaca  results.violations
 0 membaca  results.incomplete
```

`grep -rn "incomplete" e2e/*.ts` mengembalikan **nol baris**. Dan `incomplete`
di situs ini tidak kosong:

| rute                                   | violations | incomplete |
| -------------------------------------- | ---------- | ---------- |
| `/en`                                  | 0          | 16 node    |
| `/en/work`                             | 0          | 23         |
| `/en/work/arus-balik`                  | 0          | 25         |
| `/en/studio`                           | 0          | 24         |
| `/en/journal`                          | 0          | 15         |
| `/en/journal/scope-is-the-deliverable` | 0          | 15         |
| `/en/practice/consulting`              | 0          | 67         |
| **total**                              | **0**      | **185**    |

Semuanya satu rule — `color-contrast`, impact **serious** — dan semuanya satu
alasan: _"Element's background color could not be determined due to a pseudo
element."_

`contrast.test.ts` tidak menutup lubang ini. Ia mengukur **pasangan token
secara terpisah**: `--text-muted` di atas `--surface` lulus, dan itu benar. Yang
tidak bisa ia lihat adalah apakah teks itu benar-benar duduk di atas
`--surface` di halaman nyata.

### 1.2 Alatnya salah dua kali sebelum benar, dan itu ditulis di sini

Aturan yang diadopsi di Tahap 70 dan 71 — _angka pertama dari alat baru
diperiksa terhadap sumbernya sebelum ia membenarkan satu tahap_ — dipakai, dan
ia menahan dua kesalahan saya berturut-turut.

**Versi 1 melaporkan `worst=Infinity:1` di setiap rute.** Sebabnya bukan situs:
situs menulis warna dalam `oklch()`, dan Chrome mengembalikan
`getComputedStyle().color` di ruang warna yang diauthor —
`lab(95.8578 -0.0834167 2.28812)`, `oklab(0.963999 … / 0.75)`. Regex `rgb()`
saya **tidak pernah cocok satu kali pun**, jadi setiap item di-`continue` dan
akumulator terburuknya tidak pernah terisi. Perbaikannya: resolusi lewat
canvas 1×1 — apa pun string-nya, itulah sRGB yang akan dikomposit.

**Versi 2 melaporkan `/en` "See the work" pada 1,00:1.** Rasio 1,00 berarti
tinta dan latarnya identik, yang untuk sebuah CTA beranda akan jadi defek
besar. Dicek ke sumbernya lewat screenshot sebelum ditulis ke mana pun:

```
tombol bergaris terang di atas tanah gelap, glif terang di dalamnya — terbaca sempurna
```

Saya menyampel **kotak border** elemen. Garis tombol itu tinta juga, dan tidak
ada satu glif pun yang duduk di atasnya. Perbaikannya: sampel hanya **kotak
baris glif** lewat `Range.getClientRects()`, dengan inset kecil supaya tepi
baris — tempat sebuah border atau rule mendarat — tidak ikut terhitung.

**Versi 3 memerahkan KEDELAPAN rute, dengan sangat meyakinkan.** Ini yang
paling berbahaya dari ketiganya, karena merahnya terlihat persis seperti
temuan: puluhan pelanggaran, tersebar, dengan label dan angka yang masuk akal.

Yang membongkarnya satu baris yang tidak mungkin benar:

```
1,00:1 — <P> 16px/400 "So we treat scope as a deliverable rather" pada /en/journal/scope
```

Itu prosa isi jurnal. Diperiksa ke sumbernya: warnanya `lab(4.43 …)` — nyaris
hitam — di atas latar terukur `rgb(248, 248, 243)` — nyaris putih. Rasio
sebenarnya sekitar 19:1. Sebuah alat yang melaporkan 1,00:1 untuk itu sedang
menyampel tempat lain.

Dan memang begitu. Proyek `mobile` memakai `deviceScaleFactor: 3` (metrik
iPhone 13), jadi screenshot-nya 1170×2532 piksel perangkat sementara kotak
glifnya dalam piksel CSS 390×844. Membaca koordinat CSS dari bitmap 3×
menyampel **sepersembilan kiri-atas layar**, dan setiap teks dihakimi terhadap
latar milik bagian halaman yang sama sekali lain.

Perbaikannya bukan hanya skala, tapi juga **assertion anti-vakum**: gerbangnya
sekarang menuntut bitmap dan viewport sejajar, dan gagal keras kalau tidak —
supaya kesalahan ini tidak bisa kembali diam-diam.

Ketiganya defek pada alat, bukan pada situs. Kalau angka mana pun dari ketiga
versi itu masuk ke dokumen ini sebagai fakta, tahap ini akan mengejar hantu —
dan versi 3 khususnya akan mengirim saya "memperbaiki" tujuh halaman yang
tidak rusak.

### 1.3 Desktop bersih — dan angka itu yang membuat ambangnya jujur

1280px, tujuh rute, **halaman penuh**, digulir per 0,85 layar sampai habis:

```
759 text run diukur — 0 di bawah AA, bahkan pada piksel TERBURUK-nya
terburuk keseluruhan   6,39:1   (/en, "4 engagements")   terhadap lantai 4,5
```

Itu bukan sekadar kabar baik, itu kalibrasi: margin 1,4× pada konten yang lulus
adalah yang membuat aturan "piksel terburuk" bisa dipakai tanpa jadi rewel
terhadap grain. Situs ini mengecat noise; kalau marginnya tipis, aturan
sekeras itu akan berkedip.

### 1.4 Mobile 390px — empat bacaan di bawah AA, satu rute, satu blok

```
662 text run — 4 di bawah AA, semuanya /en/work/arus-balik @ scrollY 1224
  "Images"    1,48:1     (butuh 4,5)
  "Notes"     1,80:1
  "Next"      2,68:1
  "Overview"  2,84:1
```

Dan pada scrollY 612, **tautan yang sama** membaca 6,79–7,26:1. Jadi yang
berubah bukan tautannya, melainkan apa yang lewat di belakangnya.

Gerbang §72c mengukur ulang pada viewport proyek `mobile` yang sebenarnya
(390×844, bukan 390×720 yang dipakai probe di atas) dan menemukan **defek yang
sama, lebih banyak**: 12 pelanggaran di `/en` dan 13 di `/id`, terburuk
`"Next" 1,90:1` dan `"Berikutnya" 2,08:1`. Angka yang berbeda karena posisi
gulirnya berbeda; blok, sebab dan besarannya identik.

### 1.5 Mekanismenya, dipastikan — bukan ditebak

`vault/blocks/project-spine/project-spine.module.css`:

```css
.spine {
  position: sticky;
  top: calc(var(--header-height) + mobile-vw(8px));
  z-index: 1;
  /* dan tidak ada background sama sekali */
}
```

`elementsFromPoint` di tengah tautan "Images" pada scrollY 1224:

```
A.link → LI.row → OL.list → NAV.spine → IMG.material-image
```

Itu buktinya. Rantainya:

- **Di desktop** (`--desktop` = `width >= 800px`) spine duduk di **kolom 2**,
  konten di kolom 1. Ia tidak pernah bertemu karya — itulah sebabnya 759 run
  desktop bersih, dan itu juga sebabnya defek ini bisa hidup berbulan-bulan.
- **Di bawah 800px** `grid-template-columns` runtuh jadi satu kolom dan spine
  jadi **baris horizontal lengket di atas konten**. Elemen pertama konten
  adalah galeri. Karya bergulir **di bawahnya**.
- Warna tautannya `oklab(0.964 … / 0.75)` — putih 75%. Di atas plat gelap ia
  9:1. Di atas bagian terang sebuah foto ia 1,48:1.

**Dan ia terlihat.** Screenshot 390×720 pada scrollY 1224: "Next" nyaris hilang
di atas cahaya pucat karya, "Overview" dan "Notes" pas-pasan. Dilihat sendiri
sebelum baris ini ditulis.

### 1.6 Kenapa tidak ada gerbang yang bisa melihatnya

| gerbang              | kenapa buta                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `contrast.test.ts`   | pasangan token terpisah. `--text-muted` di atas `--surface` memang lulus — tapi teks itu tidak duduk di atas `--surface`, ia duduk di atas sebuah foto |
| axe `color-contrast` | mengembalikan **`incomplete`**, bukan `violation`. Ia memang **tidak bisa** menentukannya, dan ia jujur soal itu                                       |
| 11 pemanggil axe     | tak satu pun membaca `results.incomplete`, jadi kejujuran axe itu dibuang di tempat                                                                    |
| `material-occlusion` | menanyakan yang sebaliknya: apa ada yang **menutupi** plat. Ini teks di **atas** plat, yang justru sah                                                 |
| `storybook-a11y`     | 122 story, tapi spine di Storybook tidak punya foto yang lewat di belakangnya                                                                          |

Ini bukan "gerbang yang lolos". Ini **kelas defek yang tidak punya gerbang** —
dan tiga tahap terakhir masing-masing mencatat satu gerbang yang tidak bisa
gagal pada kasus yang melahirkannya. Yang ini bahkan tidak ada.

## 2. Yang dikerjakan

### 72a — spine lengket mendapat tanahnya sendiri, di mobile saja

Latar `var(--surface)` yang membentang ke tepi halaman dengan hairline
`var(--line)` di bawahnya, **hanya** di `@media not (--desktop)`. Ia lalu
terbaca sebagai lanjutan chrome header, bukan chip melayang di atas karya.

Nol token baru, nol nilai mentah. Dan efek sampingnya yang paling berharga:
teks itu kembali duduk di atas `--surface`, yaitu pasangan yang
**`contrast.test.ts` sudah ukur sejak Tahap 1**. Defeknya bukan karena tokennya
salah; defeknya karena elemennya tidak memakai token apa pun.

Dua alternatif dipertimbangkan dan **ditolak**:

| alternatif                       | kenapa tidak                                                                                                                                                                                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spine berhenti lengket di mobile | Komentar CSS-nya sendiri sudah menolak ini lebih dulu: _"this page feels longest on a phone, which is exactly where knowing what is left matters most."_ Itu keputusan Tahap 40. Membatalkan keputusan desain karena alat pengukur rewel adalah urutan yang terbalik |
| `backdrop-filter: blur()`        | Mekanisme baru, biaya komposit nyata di ponsel, dan ia **tidak menjamin kontras** — ia hanya mengaburkan latar, yang tetap bisa terang                                                                                                                               |

### 72b — matematikanya jadi modul murni, dan diuji tanpa browser

`e2e/contrast-situ.ts`, mengikuti preseden `loneHalves()` (Tahap 66) dan
`trackFaults()` (Tahap 71): angkat keputusannya keluar, biar browser hanya
menyetor pengukuran.

```
compositeOver(fg, bg, alpha)   teks semi-transparan menumpuk pada latarnya
relativeLuminance(rgb)         WCAG 2.x
contrastRatio(a, b)
wcagFloor(sizePx, weight)      24px, atau >= 18.66px dengan weight >= 700 -> 3 ; sisanya 4.5
contrastFaults(runs)           -> string[], bukan throw, supaya semua dilaporkan sekaligus
```

Nilainya nyata dan bukan formalitas: klasifikasi "large text" WCAG adalah salah
satu aturan yang paling sering disalahtulis di seluruh standar, dan di sini ia
jadi bisa diuji terhadap nilai yang diketahui tanpa satu piksel pun.

### 72c — gerbang browser, dan ia merah hari ini

`e2e/contrast-situ.e2e.ts`, berjalan di **kedua** proyek viewport. Ia merah
sekarang, pada defek §1.4 — bukan merah sintetis yang saya bikin sendiri, dan
bukan pula merah yang baru muncul setelah kodenya diubah.

### 72d — `incomplete` berhenti tak terlihat

`route-sweep` membaca `results.incomplete` dan gagal kalau muncul rule
**selain** `color-contrast`.

185 node `color-contrast` itu sendiri **sengaja tidak dijadikan blocking**, dan
alasannya ditulis supaya tidak dibuka ulang: axe memang tidak bisa menentukan
latar di situs yang mengecat grain, wash dan lapisan pseudo-element, dan
memerahkan tujuh rute karena keterbatasan alat bukanlah gerbang, itu kebisingan.
Yang tidak boleh terjadi adalah **jenis kebutaan baru** menyelinap masuk tanpa
ada yang memilihnya.

### 72e — dokumen

`DESIGN-SYSTEM.md` mendapat satu aturan: elemen lengket wajib membawa tanahnya
sendiri.

## 3. Yang **tidak** dikerjakan

| butir                                | kenapa tidak                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------- |
| Menjadikan 185 `incomplete` blocking | Akan memerahkan tujuh rute karena alasan yang **bukan** defek. §72d                         |
| Menaikkan opasitas `.row` dari 0,7   | 0,7 diukur di Tahap 40 dan komentarnya mencatat kenapa. Yang salah tanahnya, bukan tintanya |
| Menyentuh palet atau token warna     | Nol. `contrast.test.ts` dan `contrast-baseline.json` tidak berubah                          |
| Menyemai dataset Sanity              | Tulisan ke CMS pemilik — tetap miliknya                                                     |
| Rotasi kredensial Sanity             | Ditunda oleh pemilik. Tercatat, tidak diungkit                                              |

## 4. Gerbang

| gerbang                            | menuntut                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------- |
| **baru** `contrast-situ.test.ts`   | matematika WCAG-nya benar terhadap nilai yang diketahui, tanpa browser    |
| **baru** `contrast-situ.e2e.ts`    | kontras yang **benar-benar tergambar** >= AA, dua viewport, halaman penuh |
| `route-sweep.e2e.ts`               | `incomplete` dibaca; tidak ada jenis kebutaan baru                        |
| `contrast.test.ts`                 | **tidak berubah** — nol token disentuh                                    |
| `project-detail`, `project-spread` | tetap hijau — spine berubah latarnya, bukan geometrinya                   |
| `media-edge`, `material-occlusion` | tetap hijau                                                               |
| `css-rules`, `elevation`           | hairline lewat `--line`, bukan shadow buatan tangan                       |

## 5. Hasil

### 5.1 Gerbang barunya merah lebih dulu, pada defek nyata — bukan sintetis

Dijalankan terhadap build produksi **sebelum** 72a, proyek `mobile`:

```
✘ /en/work/arus-balik   12 pelanggaran, terburuk 1,90:1
✘ /id/work/arus-balik   13 pelanggaran, terburuk 2,08:1
✓ /en  ✓ /en/work  ✓ /en/studio  ✓ /en/journal  ✓ /en/journal/<slug>  ✓ /en/practice/consulting
7 lulus, 2 gagal
```

**Setiap** pelanggaran adalah tautan `project-spine` — `Overview/Notes/Images/
Next` dan padanan Indonesianya — pada empat posisi gulir, di dua locale. Enam
rute lain hijau. Itu bukan gerbang yang rewel; itu gerbang yang menunjuk satu
blok.

Sesudah 72a, viewport dan locale yang sama: **9 lulus, 0 gagal.**

### 5.2 Suite penuh

```
bun run check       exit 0    477 lulus / 0 gagal  (457 -> 477, +20 contrast-situ)
bun run build       exit 0
build-storybook     exit 0
CI=1 test:e2e       exit 0    692 lulus / 0 gagal / 14 dilewati   (19m 42s)
```

Delapan belas uji `contrast-situ` di dalamnya — sembilan per viewport — dan
`project-detail`'s `project-spine` tetap hijau di kedua proyek, termasuk
"reduced motion keeps the index readable and still".

`contrast.test.ts` dan `contrast-baseline.json` **tidak berubah** — nol token
warna disentuh, yang memang klaimnya sejak §3.

### 5.3 Biaya, diukur dan dikatakan

Proyek `mobile` untuk spec ini: **1 menit 26 detik** dinding, delapan rute
paralel, sekitar 20 detik per rute. Di bawah ambang ~3 menit yang saya sebut
di muka, jadi cakupannya **tidak** dipersempit.

### 5.4 Desktop diperiksa tidak berubah

`::before` pada `.spine` mengembalikan `content: none` di 1280px, dan
`grid-column` tetap `2`. Pita itu mobile saja, diverifikasi di browser dan
bukan disimpulkan dari CSS-nya.
