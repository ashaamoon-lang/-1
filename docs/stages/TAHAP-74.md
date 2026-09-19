# Tahap 74 — Index yang tidak pernah duduk di samping apa pun

> Beranda membuka dengan lubang **516px menembus tengahnya** — 57% layar
> pertama pada 1440×900, dan **66%** pada 390×844. Sebabnya bukan konten yang
> kurang: sebuah elemen yang CSS-nya sendiri katakan duduk _di samping_
> headline, dipasang di baris **di atasnya**.

## 1. Yang diukur, sebelum satu baris kode

### 1.1 Pita kosong terbesar di layar pertama, tujuh rute, dua viewport

Hanya kotak yang benar-benar membawa **teks atau gambar** yang dihitung — grain,
hairline dan grid pattern adalah tanah, bukan isi. §1.2 menjelaskan kenapa
pembedaan itu bukan detail.

Dan angkanya dipisah antara **udara di tepi** (perangkat desain: hero
ber-anchor bawah punya udara di atasnya) dan **lubang di antara dua massa isi**
(celah). Keduanya terlihat sama di satu angka, dan tidak sama artinya.

```
1440×900                            leading   INTERIOR      trailing
/en                                    96px    516px (57%)     64px   y 182–698
/en/practice/consulting                48px    449px (50%)    160px   y  62–512
/en/studio                            152px    364px (40%)      6px   y 439–804
/en/journal                           298px    142px (16%)      0px
/en/work                              240px    134px (15%)      0px
/en/work/arus-balik                   120px    128px (14%)      0px
/en/journal/scope-is-the-deliverable  152px     48px ( 5%)      0px

390×844
/en                                    75px    554px (66%)     50px   y 111–665
/en/practice/consulting                32px    472px (56%)    175px   y  46–518
/en/studio                            108px     74px ( 9%)      0px
/en/work                              283px     67px ( 8%)      0px
/en/journal                           351px     67px ( 8%)      0px
/en/work/arus-balik                    91px     92px (11%)      0px
/en/journal/scope-is-the-deliverable  108px     32px ( 4%)     62px
```

Situs ini sendiri menunjukkan seperti apa komposisinya saat bekerja: **4–16%**.
Satu rute berdiri di **57% dan 66%**.

### 1.2 Tiga hal yang hampir masuk dokumen ini sebagai fakta, dan tidak jadi

Aturan Tahap 70–73 — angka pertama dari alat baru diperiksa terhadap sumbernya
— menahan ketiganya. Dicatat karena dua di antaranya akan mengirim tahap ini ke
arah yang salah.

**Alat pertama memberi `/studio` nilai 100%.** Metrik "ink coverage" pada kisi
20px, menghitung sel terisi kalau ada elemen yang mengecat menyentuhnya. Ia
menghitung **tanah sebagai isi**: grain menutupi seluruh layar, jadi halaman
sekosong apa pun mencetak 100%. Dikalibrasi ke rute bernilai tertinggi lebih
dulu — screenshot `/studio` punya pita kosong besar — jadi angkanya dibuang,
bukan dipakai.

**`/practice/<v>` terukur 50% dan **bukan** defek yang sama.** Menyebut keduanya
satu temuan adalah persis kesalahan Tahap 70 yang Tahap 71 koreksi: menyamakan
dua kasus tanpa memeriksa satu per satu. Diperiksa:
`practice-hero.module.css` memakai `min-height: 70svh` + `justify-content:
flex-end` **dengan sengaja**, dan komentarnya membawa pengukurannya sendiri —
nameplate menahan layar supaya scrub pernyataan di bawahnya punya runway;
tanpa itu 46 kata selesai dalam 8% gulir halaman. Jadi 449px-nya adalah **udara
di atas nameplate ber-anchor bawah**, bukan lubang. Yang membuat alat saya
menggolongkannya "interior" cuma breadcrumb setipis 14px di y 48–62.
**Tidak disentuh tahap ini**, dan alasannya ditulis supaya tidak dibuka ulang.

**`/studio` terukur 40% di desktop dan 9% di telepon.** Itu artefak dua kolom —
kolom fakta di kanan berakhir lebih tinggi daripada prosa di kiri, dan di
telepon keduanya menumpuk sehingga lubangnya hilang. Kelas lain, dan jauh lebih
kecil. Disebut, tidak dikerjakan.

Yang tersisa setelah ketiganya: **satu rute.**

### 1.3 Sebabnya, dan CSS-nya sendiri yang menuduh

`vault/blocks/hero/hero.module.css`:

```css
.frame {
  grid-template-rows: auto minmax(0, 1fr) auto;
}
.index {
  grid-row: 1;
  @media (--desktop) {
    grid-column: 9 / -1;
  }
}
.content {
  grid-row: 2 / 4;
  justify-content: end;
}
```

Index dipaku di baris **1** (atas). Konten membentang baris 2–4 dan
**dirapatkan ke bawah**. Di antaranya duduk slack `minmax(0, 1fr)` — dan
komentar `.index` menyebut angkanya sendiri: baris itu **"was absorbing 304px
at 1440×900"**.

Jadi voidnya bukan kelalaian. Ia **hasil konstruksi**: satu elemen dipaku ke
atas, sisanya ke bawah, slack di tengah.

Dan komentar `.index` mengatakan apa yang seharusnya terjadi:

> _"The four columns the headline's 9em measure leaves free."_

**Di samping** headline. Terukur pada 1440×900:

```
.index      y 100–182
h1          y 465–655
```

Ia tidak pernah duduk di samping apa pun. Tahap 67 mengirim prop-nya —
diverifikasi, index-nya memang tayang — dan menaruhnya di **kolom yang benar,
baris yang salah**. Tahap 12d mendokumentasikan komposisi "beside"; empat
puluh tahap kemudian belum ada yang melihat bahwa ia tidak begitu.

### 1.4 Kenapa tak satu pun gerbang melihatnya

| gerbang                   | yang diukurnya                                                   |
| ------------------------- | ---------------------------------------------------------------- |
| `held-screen.e2e.ts`      | **ekor** kotak yang menahan layar (`TAIL_MAX`) — bukan tengahnya |
| `first-screen.e2e.ts`     | **di mana** item pertama mulai (`< 85%`) — index di y=100, lulus |
| `visual-substance.e2e.ts` | tepi kiri sejajar dengan chrome-nya                              |
| `taste-preflight`         | rasio dan token, bukan distribusi vertikal                       |

Tidak ada yang menanyakan: **berapa besar pita kosong di antara isi.** Bentuk
yang sama dengan Tahap 72 — invariannya masuk akal, instrumennya tidak ada.

## 2. Yang dikerjakan

### 74a — index pindah ke baris headline, bukan ke atasnya

Satu perubahan baris grid di desktop. Kolomnya **tidak berubah** — 9/-1 adalah
keputusan Tahap 12d dan masih benar. Yang berubah: index berhenti dipaku ke
atas, dan duduk di pita yang sama dengan headline, seperti yang komentarnya
sudah tuliskan sejak awal.

Konsekuensinya: lubang 516px berubah jadi **udara di tepi atas** — yang
menurut §1.1 justru yang dilakukan seluruh situs ini (96–351px leading), dan
yang `practice-hero` pertahankan dengan pengukuran.

Clearance header di `.index` jadi tidak relevan begitu ia bukan elemen paling
atas lagi. Dihapus di desktop **berikut catatan kenapa** — Tahap 67 menemukan
tabrakan y=72-lawan-72 itu dengan mengukur, dan menghapus perbaikannya tanpa
mencatat sebabnya adalah cara tercepat mengundangnya kembali. Di telepon index
tetap `grid-column: 1 / -1` di baris 1, jadi clearance mobile **tetap**.

### 74b — gerbang yang menanyakan pertanyaannya

`e2e/first-screen-void.e2e.ts` + modul murni `e2e/first-screen-void.ts`,
mengikuti preseden `loneHalves()` (66), `trackFaults()` (71),
`contrastFaults()` (72): keputusannya diangkat, browser hanya menyetor
pengukuran, dan kasus yang dataset hari ini tidak bisa hasilkan diuji sintetis.

Ambangnya **diturunkan dari §1.1, bukan dipilih**: situs ini beroperasi di
4–16%, jadi 16% adalah lantai yang sudah dibayar dan 35% memberi ruang yang
lapang tanpa jadi hiasan. Dibuktikan merah pada `/en` apa adanya.

Pengecualian `/practice/<v>` dibawa sebagai **data berikut alasannya** — pola
Tahap 73 — supaya komposisi sengaja tidak memerahkan gerbang, dan supaya
menambah pengecualian jadi keputusan yang terlihat di diff.

## 3. Yang **tidak** dikerjakan

| butir                                | kenapa tidak                                                                             |
| ------------------------------------ | ---------------------------------------------------------------------------------------- |
| Menambah konten ke hero              | Aturan Anda: nol konten karangan. Tahap ini memindahkan yang sudah ada                   |
| Mengubah tinggi hero                 | `100svh` diukur Tahap 49. DIREKSI §2.1: hero lebih tinggi dengan isi sama = lebih kosong |
| Menyentuh `practice-hero`            | §1.2 — komposisi sengaja, dibela pengukurannya sendiri                                   |
| Memperbaiki pita dua kolom `/studio` | §1.2 — kelas lain, 9% di telepon. Disebut, bukan dikerjakan                              |
| Menyentuh token atau palet           | Nol                                                                                      |

## 4. Gerbang

| gerbang                              | menuntut                                                                         |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| **baru** `first-screen-void.test.ts` | profil leading/interior/trailing benar; pengecualian ber-alasan dan ber-viewport |
| **baru** `first-screen-void.e2e.ts`  | delapan rute, dua viewport, lubang interior <= 35%                               |
| `held-screen.e2e.ts`                 | tetap hijau — ekor hero tidak berubah                                            |
| `first-screen.e2e.ts`                | tetap hijau — item pertama masih mulai di atas 85%                               |
| `visual-substance.e2e.ts`            | tepi kiri tetap sejajar chrome-nya                                               |
| `contrast.test.ts`, `contrast-situ`  | **tidak berubah** — nol token disentuh                                           |

## 5. Hasil

### 5.1 Merah lebih dulu, pada defek nyata

`voidFaults()` dijalankan terhadap build produksi **sebelum** 74a, lewat modul
yang sama persis yang gerbangnya pakai:

```
/en   1440×900   516px (57%)   y 182–698
/id   1440×900   516px (57%)
/en   390×844    554px (66%)   y 111–665
/id   390×844    554px (66%)
/en/studio 1440×900  364px (40%)
```

### 5.2 Sesudah

```
/en, /id   1440×900    516px -> 12px  ( 1%)
/en, /id    390×844    554px -> 125px (15%)
voidFaults()  ->  (none)
```

Keduanya masuk pita 4–16% yang situs ini sendiri operasikan. Tidak satu pun
rute lain bergerak satu piksel.

### 5.3 Dilihat sendiri, dua viewport

Desktop: headline kiri-bawah, subline dan aksi di bawahnya, index praktik di
kanan pada pita yang sama. Telepon: index jadi **standfirst** tepat di atas
headline — persis yang komentar `.index` sebut sebagai maksudnya di lebar itu
("stacking it reads as a standfirst"). Udara ada di atas keduanya, sebagai
tepi, bukan sebagai lubang.

Satu hal disebut presisi alih-alih dibulatkan: index sekarang **rata bawah
dengan blok konten**, jadi ia duduk di samping subline dan aksi, bukan di
samping tinggi huruf headline. Itu memenuhi "di pita yang sama", dan bukan
persis "beside the headline" kalau dibaca seketat mungkin.

### 5.4 `/en/studio` dan `/practice/<v>` dikecualikan, bukan diperbaiki

Keduanya memerahkan gerbang pada draf pertama, dan keduanya adalah **komposisi
yang tahap lain sudah ukur**: `practice-hero` membela `70svh` +
`justify-content: flex-end` dengan angkanya sendiri (Tahap 52/65), dan Tahap 69
memindahkan band kapabilitas ke kaki hero `/studio` setelah mengukurnya
terdampar di `opacity: 0`. Membatalkan pengukuran orang lain karena alat baru
saya rewel adalah urutan yang terbalik.

Pengecualiannya **ber-viewport**, bukan ber-rute: `/en/studio` cuma dikecualikan
di 1440×900, karena di 390×844 ia 9% dan mematikan seluruh rute akan mematikan
justru viewport tempat defek tahap ini **paling parah** (66% lawan 57%).

### 5.5 Kontaminasi yang saya buat sendiri, dan dikatakan

Suite e2e Tahap 73 sedang berjalan di port 3000 saat saya menjalankan
`bun run build` untuk Tahap 74 — dua kali. Build menimpa `.next`, yaitu
direktori yang server suite itu sajikan. Sembilan belas uji mobile berubah
merah mulai sekitar uji 570, tepat saat build pertama mendarat.

**Itu bukan regresi Tahap 73.** Verifikasi bersihnya adalah CI run 55 pada
`0c835c7`: `ci` dan `e2e` dua-duanya `success`. Dicatat di sini karena angka
merah yang saya sebabkan sendiri lalu saya diamkan adalah cara tercepat membuat
laporan tahap berikutnya tidak bisa dipercaya.
