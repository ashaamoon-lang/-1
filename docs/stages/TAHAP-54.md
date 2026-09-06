# Tahap 54 — Halaman panjang yang tidak melakukan apa-apa

> Pemilik repo menjalankan situsnya, melihatnya, dan menyebut tiga hal:
> routing navbar yang rangkap, satu mode warna yang menyatu dengan latarnya,
> dan **animasi yang tidak sebanyak dan seluas yang diharapkan**. Dua yang
> pertama sudah diperbaiki dan diukur. Dokumen ini tentang yang ketiga, dan
> ia dimulai dari sensus alih-alih dari selera.

## 1. Sensus, diukur

Build produksi, 1440×900, tiap rute digulir penuh:

| rute                 | layar | `data-epic` | blok reveal | item reveal |
| -------------------- | ----: | ----------: | ----------: | ----------: |
| `/en`                | 11,02 |           3 |           8 |          18 |
| `/en/studio`         |  6,34 |           3 |           7 |          20 |
| `/en/work/<slug>`    |  5,32 |           1 |       **3** |       **5** |
| `/en/work`           |  4,98 |           2 |       **2** |       **8** |
| `/en/journal/<slug>` |  4,22 |           1 |           4 |           8 |
| `/en/journal`        |  3,42 |           2 |       **2** |       **4** |
| `/en/practice/<v>`   |  3,37 |           3 |           5 |           9 |

## 2. Yang angka ini katakan

**Bukan "kurang efek". Kurang _kejadian_.**

`/en/work` punya **lima layar** dan **dua** blok reveal. Kedua blok itu
melintasi garis reveal dalam satu layar pertama — masthead, lalu kisinya —
dan sesudah itu **tidak ada apa pun yang terjadi selama empat layar**. Kisi
katalognya memang menyusun enam sampulnya secara berundak, tapi seluruh
undakan itu selesai dalam satu kejadian: `vault/blocks/project-grid`
memasang satu `useReveal` pada `<ul>`-nya, dan tiap `<li>` hanyalah
`data-reveal-item` di dalam blok yang sama.

Pola yang sama di `/en/journal` (3,4 layar, 2 blok) dan `/en/work/<slug>`
(5,3 layar, 3 blok).

Bandingkan dengan `/en` — 11 layar, 8 blok — dan perbedaannya bukan jumlah
komponen melainkan **kerapatan kejadian per layar**:

```
/en                   0,73 blok per layar
/en/studio            1,10
/en/practice/<v>      1,48
/en/journal/<slug>    0,95
/en/work/<slug>       0,56
/en/journal           0,58
/en/work              0,40   ← paling sepi, dan paling panjang kedua
```

Rute yang pemilik repo sebut "berat dan besar" justru yang paling sepi.

## 3. Yang dibangun

**54a — Reveal per baris, bukan per blok.** `useReveal` mendapat mode
opt-in di mana **tiap `[data-reveal-item]` diamati sendiri** alih-alih
mewarisi satu kejadian dari kontainernya. Kisi enam sampul di halaman lima
layar berhenti menjadi satu kedatangan dan menjadi enam, masing-masing di
tempat pembaca benar-benar sampai padanya.

Ini bukan efek baru: mekanismenya, CSS-nya, token stagger-nya dan jaminan
reduced-motion-nya sudah ada dan sudah digerbangi. Yang berubah **kapan**
mereka menyala.

**54b — Rute yang sepi memakainya.** `/work` (kisi katalog), `/journal`
(baris entri), `/work/<slug>` (plate proyek).

**54c — Gerbang yang mengukur kerapatan, bukan keberadaan.** Suite ini punya
`reveal-coverage` ("nothing arrives unannounced") yang bertanya apakah tiap
blok **punya** reveal. Tidak ada yang bertanya apakah sebuah halaman lima
layar punya lebih dari dua kejadian. Itu yang membuat cacat ini lolos lima
puluh tahap.

## 4. Hasil

### 4.1 Kerapatan kejadian, sebelum dan sesudah

Sepuluh langkah gulir per halaman, menghitung item reveal yang **baru**
terlihat di tiap langkah:

```
                sebelum                              sesudah
/en/work        8 terlihat saat dimuat, 0 kejadian   4 saat dimuat, +2, +2
/en/journal     4 terlihat saat dimuat, 0 kejadian   2 saat dimuat, +1, +1
/en/work/<slug> 2 saat dimuat, +2, +1                tidak berubah
/en             3 saat dimuat, 5 langkah berbuah     tidak berubah
```

Dua halaman terpanjang situs ini menghabiskan seluruh anggaran animasinya
**sebelum pembaca bergerak**. Itu bukan interpretasi — nol dari sepuluh
langkah menghasilkan satu kedatangan pun.

### 4.2 Verifikasi

```
bun run check     lulus — unit 421 lulus
bun run build     lulus
gerbang terkait   reveal-coverage, catalogue-layout, first-screen, motion
                  85 lulus
```

### 4.3 Dua lubang yang ikut ditutup

**`MutationObserver`.** Daftar yang dirender ulang — `/work` di bawah filter
praktik — mengganti `<li>`-nya, dan yang baru tidak pernah diserahkan ke
observer. Mereka akan duduk di `opacity: 0` selamanya: kegagalan `CLAUDE.md`
#5 yang persis baru saja diajarkan untuk dihindari hook ini. Mode kontainer
tidak punya lubang itu karena kontainernya sudah `visible`.

**Gerbang yang premisnya usang.** `motion › going back mid-transition strands
nothing` mengukur pada scroll 0, yang sah hanya selama semua reveal `/en/work`
menyala sebagai satu kejadian. Ia menggulir dulu sekarang — sama seperti tiga
tes saudaranya — dan itu tidak melemahkannya: item yang benar-benar terdampar
tetap terdampar melewati guliran, karena `once: true` sudah melepas
pengamatannya.

### 4.4 Yang **tidak** dikerjakan di sini, dan kenapa

Butir 54c meminta gerbang yang mengukur **kerapatan**, bukan keberadaan —
"halaman lima layar tidak boleh punya kurang dari N kejadian". Tidak dibangun,
dan alasannya harus ditulis daripada didiamkan: angka N itu tidak punya dasar
terukur. Suite ini punya sejarah gerbang bernilai-ambang yang dikarang
(`TAHAP-51.md` §3 dan plafon §9.5 yang tiga kali salah hitung), dan menambah
satu lagi berdasarkan selera adalah menambah gerbang yang akan dilanggar
diam-diam.

Yang benar-benar melindungi ini sekarang adalah §4.1: sensusnya ada, angkanya
tertulis, dan tahap berikutnya yang membuat sebuah halaman diam lagi akan
terlihat saat sensus itu dijalankan ulang.
