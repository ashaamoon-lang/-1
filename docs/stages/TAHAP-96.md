# Tahap 96 — Berapa biaya pemasangan ulang kanvas, dan apa yang tidak dibeli dengannya

> **Status: terkirim.** Spec ditulis lebih dulu sesuai `ROADMAP.md` §3.0;
> rancangan gerbangnya (§3) diubah saat implementasi karena **dua instrumen
> pertama saya salah** — §7.2.
>
> Menutup dua butir yang `TAHAP-85.md` §6 tinggalkan terbuka dengan namanya
> sendiri: §6.3 (biayanya tidak diukur) dan §6.2 (kanvas tidak dipindahkan ke
> layout — "tahapnya sendiri").

---

## 1. Pengukuran

Semuanya terhadap build produksi yang sedang berjalan, proyek `desktop`,
Playwright. Navigasi memakai klik tautan dan `goBack()`, bukan `goto` — hanya
navigasi klien yang melewati `cachedNavigations`, yang merupakan seluruh
premis Tahap 85.

### 1.1 Pemasangan ulang itu memang terjadi

```
muat pertama      2 konteks webgl2 dibuat
navigasi pergi    0 konteks baru; kanvas tetap 1; pohonnya disembunyikan
kembali (back)    1 konteks baru  <- kanvas dibangun ulang
```

Itu mekanisme Tahap 85, terlihat dari luar untuk pertama kalinya.

### 1.2 Tidak ada kebocoran konteks — enam siklus

```
siklus  dibuat  hilang  kanvas DOM  hidup   celah
0         2       0        1          1       —
1         5       2        1          1     358 ms
2         8       4        1          1     284 ms
3        11       6        1          1     290 ms
4        14       8        1          1     268 ms
5        17      10        1          1     287 ms
6        20      12        1          1     289 ms
```

**Koreksi atas instrumen saya sendiri:** pembacaan status memanggil
`getContext('webgl2')` di tiap kanvas untuk menguji apakah konteksnya hilang,
dan penghitung saya menghitung **panggilan**, bukan pembuatan. Jadi satu dari
tiga konteks per siklus dibuat oleh probe itu sendiri. Dikurangi itu:

```
per siklus   aplikasi membuat 2, melepas 2   -> seimbang
```

Dan dua besaran yang tidak bergantung pada instrumen sama sekali tetap datar di
enam siklus: **kanvas di DOM tetap 1**, dan **kanvas hidup tetap 1**. Kalau
konteks bocor, keduanya akan naik. Tidak.

> **Dikoreksi — §7.2.** Koreksi di atas masih kurang satu lapis: menghitung
> **elemen** kanvas lalu menyelisihkannya dengan **peristiwa**
> `webglcontextlost` bukan besaran yang sah sama sekali, karena satu elemen
> bisa kehilangan dan memulihkan konteksnya berulang kali. Angka "dibuat" dan
> "hilang" di tabel ini tidak boleh dibaca sebagai konteks yang hidup.
> Pengukuran yang benar ada di §7.1, dan kesimpulannya tidak berubah: **tidak
> ada kebocoran**. Dua kolom terakhir tabel ini — kanvas di DOM dan kanvas
> hidup — memang benar, dan itu sebabnya kesimpulannya selamat.

Itu penting melebihi kerapian: peramban membatasi konteks WebGL serentak
(Chrome ~16). Konteks yang bocor pada tiap navigasi-kembali akan mencapai
batas itu dalam belasan navigasi, dan kanvas yang gagal dibuat adalah **halaman
yang kehilangan aksennya** — bentuk yang sama dengan cacat yang Tahap 85
tambal.

### 1.3 Yang dilihat pemirsa, bukan yang dilihat penghitung

Pita 1280×280 di bawah header, rerata luminans — ukuran yang sama dengan
gerbang aksen:

```
sebelum navigasi          27,8
tepat sesudah back        19,1     <- satu bingkai lebih redup
80 ms sesudahnya          28,7
160 / 240 / 320 / 600 ms  28,8
```

Jadi biayanya **satu bingkai pada 19,1 terhadap 27,8**, pulih di bawah 100 ms.
Bukan putih, bukan kosong: cadangan CSS-nya yang terlihat sekejap, yang memang
jalur yang `CLAUDE.md` #14 tuntut tampak disengaja.

Celah 268–358 ms di §1.2 diukur sampai penanda `[data-accent-live]` menempel
lagi; pita itu sendiri pulih lebih cepat. Dua ukuran, dan yang lebih relevan
bagi pemirsa adalah yang kedua.

---

## 2. Keputusan: kanvas **tidak** dipindahkan ke layout

`TAHAP-85.md` §2 menyisihkan pemindahan itu sebagai "jawaban arsitektural yang
benar" dan menyerahkannya ke tahapnya sendiri. Tahap ini adalah tahap itu, dan
dengan angkanya di tangan jawabannya **tidak**.

| yang dibeli                                                                                 | yang dibayar                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Menghilangkan satu bingkai pada 19,1 alih-alih 27,8, di bawah 100 ms, pada navigasi-kembali | `components/layout/theme/theme.module.css` menulis panjang kenapa `.ground` duduk di tempatnya; memindahkan kanvas ke layout mengubah urutan cat **di bawah seluruh teks situs** |

Menukar risiko itu untuk satu bingkai adalah harga yang salah. `DIREKSI.md`
§2.1 menolak menambah pekerjaan demi membelanjakan anggaran; ini bentuknya yang
sama, pada sumbu arsitektur.

**Keputusannya bisa dibalik kalau angkanya berubah** — kalau pemasangan ulang
kelak membawa kanvas yang lebih berat, celahnya akan tumbuh dan tabel di atas
harus dihitung ulang. Karena itu §3 menambahkan gerbang, bukan sekadar catatan.

---

## 3. Yang dikerjakan: gerbang untuk invarian yang §1.2 buktikan

Angka di §1.2 benar hari ini dan tidak dijaga apa pun. Yang dijaga:

```
Navigasi bolak-balik berulang tidak menumpuk kanvas maupun konteks WebGL.
```

Diukur tanpa menyentuh `getContext` dari dalam asersi — pelajaran §1.2.

> **Rancangan ini diubah saat implementasi**, dan §7.2 menuliskan kenapa.
> Yang tertulis di sini semula: "konteks yang belum dilepas
> (`dibuat − hilang`)". Besaran itu tidak ada — satu elemen kanvas bisa
> kehilangan lalu memulihkan konteksnya berulang kali, jadi menyelisihkan
> hitungan elemen dengan hitungan peristiwa membandingkan dua hal yang tidak
> sejenis. Yang diasersikan akhirnya: **tidak ada kanvas yang lepas dari
> dokumen sambil konteksnya masih hidup.**

| berkas                                                | perubahan                                          |
| ----------------------------------------------------- | -------------------------------------------------- |
| `e2e/webgl-lifecycle.e2e.ts` (baru)                   | gerbang di atas                                    |
| `docs/stages/TAHAP-96.md`, `ROADMAP.md`, `HANDOFF.md` | berkas ini, posisi, dan dua butir Tahap 85 ditutup |

---

## 4. Kriteria keluar

1. **Merah lebih dulu, atas instrumennya.** Dengan kebocoran disuntikkan ke
   halaman, gerbang harus merah; tanpa suntikan, hijau.
2. Gerbang lulus di laptop ini, proyek `desktop`.
3. `bun test` hijau; tahap `check` dijalankan satu per satu (`TAHAP-93.md`
   §7.5).
4. `TAHAP-85.md` §6.2 dan §6.3 ditutup **di tempat**, menyebut angkanya.
5. **Nol klaim performa tanpa alat yang disebut** — `CLAUDE.md` #19. Alatnya
   Playwright dan `performance.now()` di peramban; keduanya disebut.

---

## 5. Risiko

| #   | risiko                                                                | penangkal                                                                                                   |
| --- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| R1  | Gerbang baru ikut menambah beban suite yang sudah berat di laptop ini | Empat siklus, satu rute, proyek `desktop` saja. Diukur dan angkanya ditulis di §7                           |
| R2  | Asersi "tidak menumpuk" lolos karena mengukur hal yang salah          | Kriteria §4.1: kebocoran disuntikkan lebih dulu dan gerbangnya harus merah                                  |
| R3  | Keputusan §2 dibaca sebagai "kanvas di layout itu ide buruk"          | Ia bukan. Yang ditolak adalah menukar risiko urutan cat untuk satu bingkai; §2 menulis syarat pembalikannya |

---

## 6. Yang tidak dikerjakan, dinyatakan eksplisit

- **Kanvas tidak dipindahkan ke layout** — §2, dengan angkanya.
- **`TAHAP-85.md` §6.1 tetap terbuka** — kenapa sebagian navigasi lolos dari
  cacat aslinya belum diukur, dan tahap ini tidak mengukurnya.
- **Nol angka performa di luar yang §1 tulis** — `CLAUDE.md` #19.

---

## 7. Hasil

### 7.1 Invarian yang sebenarnya, terukur

Lima siklus navigasi-klien bolak-balik terhadap build produksi:

```
siklus  adopted  lost  restored  hidup+menempel  hidup+lepas  di DOM
0         1       0      0           1               0          1
1         1       1      0           0               0          1
2         2       1      0           1               0          1
3         3       2      0           1               0          1
4         4       3      0           1               0          1
5         5       4      0           1               0          1
```

Satu elemen kanvas baru per pemasangan ulang, konteks yang lama dilepas,
`restored` **nol** — jadi kanvas tidak dipulihkan melainkan diganti — dan
kolom yang menentukan, **hidup+lepas, nol di setiap siklus**. Tepat satu
konteks hidup sepanjang waktu, satu kanvas di DOM.

**Tidak ada kebocoran.**

### 7.2 Dua instrumen saya salah sebelum yang ketiga benar

| #   | instrumen                                                                         | kenapa gugur                                                                                                                                                                                                            |
| --- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Membungkus `HTMLCanvasElement.prototype.getContext`                               | Butuh rantai asersi tipe untuk menyatakan ulang metode DOM ter-overload — ditolak lint repo ini — dan pemeriksa hidupnya sendiri memanggil `getContext` di tiap kanvas, menggelembungkan hitungannya satu per pembacaan |
| 2   | `elemen kanvas − peristiwa webglcontextlost`                                      | Bukan besaran yang sah: satu elemen bisa kehilangan dan memulihkan konteks berulang kali. Ia **melaporkan kebocoran satu** di tempat §7.1 menunjukkan nol                                                               |
| 3   | Keadaan lost/restored **per kanvas**, lalu tanya: adakah yang hidup sambil lepas? | Yang dikirim                                                                                                                                                                                                            |

Instrumen kedua itu nyaris saya kirim sebagai temuan. Yang menahannya adalah
aturan repo ini sendiri: periksa angka pertama dari alat baru terhadap
sumbernya.

### 7.3 Dan sebelum itu, gerbang yang lulus tanpa mengukur apa pun

Versi pertama memasang `MutationObserver` pada `document.documentElement`.
Sebuah init-script berjalan **sebelum** dokumen punya elemen, jadi `observe`
melempar dan sisa skripnya — termasuk penghitungnya — tidak pernah
terpasang. Hasilnya: `seen: 0` selamanya, dan kedua perbandingan gerbang itu
membandingkan `0` dengan `0`.

**Ia lulus dalam 17 detik dengan mengukur nol.** Yang membongkarnya justru
kebocoran yang saya suntikkan untuk membuktikan ia bisa merah — suntikan itu
pun tidak terlihat, dan dua kebisuan yang sama tidak mungkin kebetulan.

Penjaga anti-vakum kini ada di gerbangnya, dan alasannya ditulis di sana.

### 7.4 Merah lalu hijau

```
cacat disuntikkan   kanvas lepas-dari-dokumen dengan konteks hidup, satu per siklus
                    liveDetached = 3 sesudah 3 siklus   -> gerbang MERAH
tanpa suntikan      liveDetached = 0 sesudah 4 siklus   -> gerbang HIJAU (25,4 s)
```

### 7.5 Gerbang

```
bun run build        EXIT=0 . 0 baris galat . metadataBase 0
                     72 halaman statis (73 -> 72: rute /opengraph-image.png
                     hilang karena berkasnya pindah ke public/ di Tahap 92)
bun start            Ready in 1040ms . /en /cms /opengraph-image.png semuanya 200
oxlint . lint:types  bersih
webgl-lifecycle      1 lulus (25,4 s)
```

### 7.6 Dua butir Tahap 85 ditutup

`TAHAP-85.md` §6.2 (kanvas tidak dipindahkan ke layout) dan §6.3 (biayanya
tidak diukur) ditutup di tempat, menyebut angkanya. §6.1 **tetap terbuka**:
kenapa sebagian navigasi lolos dari cacat aslinya belum diukur, dan tahap ini
tidak mengukurnya.
