# Tahap 55 — Grain yang ternyata sebuah kerudung

> Pemilik repo menyebut tiga cacat. Yang kedua: _"Kamu punya 2 mode warna,
> dan salah satu mode warna malah menyatu dengan latar belakang."_
>
> `docs/stages/TAHAP-54.md` membuka dengan kalimat **"Dua yang pertama sudah
> diperbaiki dan diukur."** Kalimat itu terlalu cepat. Yang diperbaiki Tahap
> 53 adalah **besarnya**, bukan **mekanismenya** — dan mekanismenya masih
> berjalan di setiap piksel dari setiap halaman. Dokumen ini mengukurnya,
> menamainya, dan menutupnya.

## 1. Yang diukur, sebelum satu baris kode disentuh

Build produksi (`bun run build && bun run start`), Chromium 1440×900, satu
petak 180×150 piksel dari **latar kosong** — jauh dari teks, gambar, dan
wash — pada posisi gulir 2600. Petak yang sama diukur dua kali: sekali apa
adanya, sekali dengan lapisan grain di-`display: none` lewat DevTools.
Selisih dua pengukuran itu **adalah** sumbangan grain, bukan taksirannya.

Palet yang dideklarasikan `lib/styles/colors.ts`:
`paper = oklch(0.964 0.006 92)` = **#f4f3ef (244)**,
`ink = oklch(0.17 0.006 66)` = **#110f0d (17)**.

| rute              | tema  | dideklarasikan | grain OFF (mean/sd) | grain ON (mean/sd) | **geseran mean** |
| ----------------- | ----- | -------------: | ------------------- | ------------------ | ---------------: |
| `/en/journal`     | light |            244 | 243,8 / 2,69        | 232,7 / 3,63       |        **−11,1** |
| `/en/studio`      | dark  |             17 | 17,1 / 0,94         | 21,6 / 1,81        |         **+4,5** |
| `/en/work/<slug>` | dark  |             17 | 17,0 / 0,00         | 21,5 / 1,58        |         **+4,5** |

Piksel tunggal, A/B pada koordinat yang persis sama, sebagai pemeriksaan
kedua:

```
light  /en/journal    grain-off #f4f3ef   grain-on #e2e1dd    −18 tingkat
dark   /en/work       grain-off #110f0d   grain-on #171514    +6  tingkat
dark   /en/studio     grain-off #110f0d   grain-on #171514    +6  tingkat
```

## 2. Apa yang sebenarnya dilakukan lapisan itu

`feTurbulence` menghasilkan noise di [0,1]. `feComponentTransfer` mengalikan
tiap kanal dengan `slope = 0.15`, jadi warnanya **turun ke rata-rata 0,075**;
alpha tidak disentuh sama sekali, jadi ia tetap noise dengan rata-rata ~0,5.
Dan karena `color-interpolation-filters` **default-nya `linearRGB`**, 0,075
linear itu keluar ke layar sebagai sRGB ≈ **0,30**, yaitu **#4d4d4d**.

Jadi lapisan ini bukan grain. Ia **satu kerudung abu-abu #4d4d4d pada alpha
efektif ~6–9%**, dengan sedikit struktur di dalamnya.

Konsekuensinya persis kalimat pemilik repo. Kerudung menarik **setiap** latar
menuju satu abu-abu yang sama:

```
paper 244 ──▶ 233        ink 17 ──▶ 22
                    ╲   ╱
                   #4d4d4d
```

Dan perbandingan yang menghakimi seluruh fitur ini:

| tema  | geseran mean (cacat) | sd grain (gunanya) |    rasio |
| ----- | -------------------: | -----------------: | -------: |
| light |                 11,1 |               3,63 | **3,1×** |
| dark  |                  4,5 |               1,81 | **2,5×** |

**Lapisan ini memberi 2,5–3× lebih banyak kerudung daripada tekstur.** Ia
lebih banyak merusak palet daripada memberi permukaan.

### Kenapa Tahap 53 tidak menyelesaikannya

Tahap 53 menyapu `opacity` dari 0,75 ke 0,18 karena
`e2e/visual-substance.e2e.ts` merah. Sapuan itu benar dan angkanya nyata,
tapi `opacity` menskalakan **kerudung dan tekstur secara bersamaan**. Rasio
2,5–3× di atas tidak berubah sedikit pun oleh sapuan itu; hanya kedua sisinya
yang mengecil bersama. Menurunkan opacity lebih jauh akan menghapus grain
sebelum menghapus kerudungnya.

## 3. Yang dibangun

Satu perubahan, pada mekanismenya.

**55a — Grain rata-rata nol.** Rantai filter ditulis ulang supaya noise
ditambahkan **di sekitar warna latar itu sendiri**, bukan dilapiskan sebagai
warna asing:

- `color-interpolation-filters="sRGB"` — dinyatakan, bukan diwarisi. Nilai
  desain proyek ini hidup di sRGB; membiarkan `linearRGB` adalah alasan
  #4d4d4d itu ada sejak awal.
- `<rect>` diisi `var(--color-primary)` — lapisan ini sekarang **berwarna
  latar**, jadi rata-ratanya sama dengan yang ada di bawahnya.
- `feFuncA` memaksa alpha ke 1, sehingga noise-nya ada di **warna**, bukan
  di transparansi.
- `feComposite operator="arithmetic" k2="1" k3="1" k4={-slope/2}` menambahkan
  noise dan **mengurangi rata-ratanya kembali**. `mean(fractalNoise) = 0,5`,
  jadi `mean(grain) = slope/2`, dan `k4` menghapusnya persis.

Hasilnya: `mean(lapisan) = --color-primary`. Geseran mean menjadi nol
**secara konstruksi**, pada `opacity` berapa pun — sehingga `opacity`
akhirnya hanya menyetel kekuatan tekstur, yang memang satu-satunya
pekerjaannya.

**55b — `opacity` ditala ulang terhadap sd, bukan terhadap selera.** Karena
kerudungnya hilang, angka lama 0,18/0,12 tidak lagi berarti apa-apa.
Keduanya disapu sampai sd grain di petak yang sama menyamai sd hari ini
(3,6 light / 1,8 dark), supaya permukaannya terasa sama sementara palet-nya
kembali benar. Angka sapuan ditulis di §4.

**55c — Gerbang.** `e2e/palette-integrity.e2e.ts`: untuk tiap tema, latar
kosong yang benar-benar dicat harus berada dalam **±2 tingkat** dari token
yang dideklarasikan, dan grain harus tetap terukur (sd > 0,8) — supaya
"perbaikan" dengan cara mematikan grain tidak lolos.

## 4. Hasil

### 4.1 Gerbang dibuktikan merah lebih dulu

`e2e/palette-integrity.e2e.ts` dijalankan pada build **pra-perbaikan** — rantai
filter lama dikembalikan lewat `git checkout HEAD --`, hanya atribut
`data-noise-texture` yang dipertahankan supaya gerbangnya masih menemukan
lapisannya. Lima rute, lima merah:

| rute                      | tema  | `shift.mean` | ambang |
| ------------------------- | ----- | -----------: | -----: |
| `/en/journal`             | light |    **11,57** |    < 2 |
| `/id/journal`             | light |    **11,61** |    < 2 |
| `/en/studio`              | dark  |     **4,38** |    < 2 |
| `/en/practice/consulting` | dark  |     **4,81** |    < 2 |
| `/en/work/arus-balik`     | dark  |     **4,34** |    < 2 |

Separuh keduanya — _"masih ada grain di atasnya"_ — **hijau di kedua build**,
dan itu memang seharusnya. Kerudung yang lama membawa grain di dalamnya. Yang
membuat pasangan ini berguna adalah bahwa tidak satu pun dari keduanya bisa
dilewati sendirian: assertion pertama lolos kalau lapisannya dihapus, yang
kedua lolos pada cacat yang justru memicu tahap ini.

### 4.2 Sesudah perbaikan

Instrumen yang sama, build produksi, petak yang sama:

| rute                  | tema  | dideklarasikan | geseran mean | sd grain |
| --------------------- | ----- | -------------: | -----------: | -------: |
| `/en/journal`         | light |            244 |     **−0,2** |     3,57 |
| `/en/studio`          | dark  |             17 |     **−1,0** |     1,86 |
| `/en/work/arus-balik` | dark  |             17 |     **−1,0** |     1,62 |

Dibandingkan §1:

```
                geseran mean            sd grain
          sebelum → sesudah      sebelum → sesudah
light        −11,1 → −0,2           3,63 → 3,57      (56× lebih kecil)
dark          +4,5 → −1,0           1,81 → 1,86      (4,5× lebih kecil)
```

Teksturnya dipertahankan dalam 2% dari yang situs ini kirim sebelumnya; yang
berubah hanya palet di bawahnya.

### 4.3 Sisa −1,0 pada tema gelap, dan kenapa ia tidak dikejar sampai nol

Ia nyata dan asalnya diketahui. Ink duduk di sRGB 0,066, sementara ekskursi
grain-nya ±`slope/2` = ±0,075, jadi separuh bawahnya terpotong di 0 — dan
kompositing 8-bit membulatkan. Sapuan `opacity` menunjukkan sifatnya:
geserannya **tidak** membesar dengan opacity (−1,35 pada 0,12; −0,35 pada
1,00), yang membuktikan ia bukan rata-rata lapisannya melainkan pemotongan di
ujung skala. Menghilangkannya berarti mengecilkan `slope` sampai grain-nya
tidak lagi terlihat pada ink. Ambang gerbangnya ditulis di 2, bukan di 1,
karena angka itu; ia masih memisahkan keadaan sehat dari cacat dengan faktor
lebih dari empat.

### 4.4 Hero: satu properti baru, dan alasannya

`vault/blocks/hero` menaruh grain di atas wash `SceneShell`, bukan di atas
latar halaman — jadi "isi dengan warna latar" adalah jawaban yang salah persis
di satu tempat. `NoiseTexture` mendapat `--noise-base` (default
`var(--color-primary)`), dan hero mengarahkannya ke `--hero-wash-mid`, token
baru di `global.css` yang menandai titik tengah wash. Galat terbesarnya
menjadi separuh amplitudo wash alih-alih seluruhnya. `heroGrain` juga turun
dari 0,5 ke 0,45 supaya permukaan hero dan permukaan halaman adalah material
yang sama.

### 4.5 Yang **tidak** dikerjakan, dan kenapa

- **`--surface` pada tema gelap.** Sapuan token mengukur `--surface` di
  **+7** tingkat dari latar gelap melawan **−10** pada latar terang — asimetri
  nyata, karena mix OKLab dengan persentase tetap menghasilkan lebih sedikit
  tingkat 8-bit di dekat hitam. Tidak diperbaiki di tahap ini karena sapuan
  DOM di enam rute menemukan **nol** elemen yang mengecat latar dan cukup
  besar untuk terlihat: situs ini hampir seluruhnya tipografi di atas ground
  dan gambar. Cacatnya ada di tokennya, bukan di halamannya. Dicatat di sini
  supaya konsumen `--surface` berikutnya tidak menemukannya lagi dari nol.
- **Kontras.** `@axe-core/playwright` dijalankan dengan `color-contrast` dan
  `color-contrast-enhanced` pada tujuh rute: **nol pelanggaran AA**. Yang
  muncul adalah 95 pelanggaran **AAA** di `/en/studio`, seluruhnya kata-kata
  `progress-text` dalam keadaan redupnya yang di-scrub — keadaan sementara
  yang memang dirancang. Tidak diubah.
