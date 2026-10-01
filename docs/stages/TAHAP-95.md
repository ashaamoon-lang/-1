# Tahap 95 — Lebar desktop pada rasio piksel telepon

> **Status: DIBATALKAN sebelum satu baris kode ditulis.** Premisnya diukur
> ulang terhadap CI dan gugur — §7. Spec-nya ditinggalkan utuh, tidak
> dihapus, karena ia yang menunjukkan apa yang saya kira benar dan apa yang
> membatalkannya (`§8.4` rencana).
>
> Melanjutkan temuan `TAHAP-94.md` §7.3, yang mengukur biayanya tetapi sengaja
> tidak memutuskannya: ini keputusan **cakupan**, bukan tenggat.

---

## 1. Pengukuran

### 1.1 Biaya yang terukur

Durasi per varian gerbang aksen, `--workers=1`, laptop yang sama, server yang
sama:

```
proyek desktop    9,1 s    9,4 s    3,6 s   3,3 s
proyek mobile    46,0 s   GAGAL     9,1 s   6,5 s
                  ^^^^^^^^^^^^^^
                  varian "at desktop"
```

Sebabnya aritmetika piksel, bukan kelambatan yang misterius:

| proyek    | viewport yang disetel uji | DPR proyek | piksel per screenshot |
| --------- | ------------------------- | ---------- | --------------------- |
| `desktop` | 1280×800                  | 1          | 1 024 000             |
| `mobile`  | 1280×800                  | **3**      | **9 216 000**         |

Sembilan kali lipat, dua screenshot per uji.

### 1.2 Dan itu perangkat yang tidak ada

`playwright.config.ts` menuliskan maksud proyek `mobile` dengan jujur —
_"iPhone 13 metrics... this is a viewport, a pixel ratio, and touch"_. iPhone 13
adalah **390 px pada DPR 3**. Sebuah viewport 1280 px pada DPR 3 adalah layar
3840 px: tidak ada telepon seperti itu, dan tidak ada desktop yang melaporkan
DPR 3 pada 1280.

Lebih penting: varian itu **menduplikasi** `[desktop] … at desktop`. Keduanya
mengukur lebar yang sama, pada halaman yang sama, dan yang diukur gerbang ini
adalah **rerata tone sebuah pita** — besaran yang tidak berubah oleh rasio
piksel.

### 1.3 Dua gerbang, bukan satu

Dipindai di seluruh daftar-izin proyek `mobile` — dua puluh berkas — hanya dua
yang memaksa viewport selebar desktop:

```
visual-substance.e2e.ts   4 tempat   7 panggilan screenshot
project-detail.e2e.ts     2 tempat   0 panggilan screenshot
```

`project-detail` berbagi bentuknya tanpa biayanya: ia mengukur lewat
`page.evaluate`, tidak pernah memotret. **Dibiarkan**, dan alasannya ditulis.

Di dalam `visual-substance`, yang memotret pada lebar desktop ada dua:

| gerbang         | viewport                         | screenshot             |
| --------------- | -------------------------------- | ---------------------- |
| aksen (`:212`)  | dari loop: 1280×800 atau 390×844 | dua, **terpotong**     |
| footer (`:713`) | selalu 1280×800                  | dua, **bingkai penuh** |

Gerbang footer yang lebih mahal, dan ia yang meledakkan anggaran 120 detik di
laptop ini (`TAHAP-93.md` §7.2). Ia memaksa lebar desktop karena memang harus:
`lib/hooks/use-device-detection` menggerbangi WebGL pada `width >= 800`, jadi
tanpa itu tidak ada kanvas untuk diukur. Artinya di proyek `mobile` ia
mengukur tata letak desktop pada DPR telepon — duplikat yang sama.

Dua gerbang lain yang memaksa lebar desktop (`:877`, `:908`) **tidak**
memotret; mereka tidak terdampak.

### 1.4 Kenapa berkas ini ada di daftar-izin `mobile`

Alasannya tertulis di `playwright.config.ts`, dan ia menyebut gerbang yang
**berbeda**:

> _"The gutter defect it caught existed at both widths — `h1` at 0 against the
> header's 14 on desktop and 17 on mobile — so checking one width would have
> found half of it."_

Itu gerbang "the page starts where its own chrome starts", yang memakai
viewport asli proyeknya dan tidak memotret. Jadi berkas ini masuk daftar-izin
untuk satu gerbang, dan menyeret dua gerbang mahal bersamanya. Daftar-izin
bekerja pada **berkas**; yang dibutuhkan di sini granularitas **uji**.

---

## 2. Rancangan

Satu penjaga bersama, dipakai oleh kedua gerbang yang memotret pada lebar
desktop:

```
Sebuah pengukuran selebar desktop dilewati ketika proyeknya sudah memasok
rasio piksel telepon — karena proyek `desktop` sudah mengukur lebar itu, dan
yang tersisa hanyalah biayanya.
```

Dibaca dari `test.info().project.use.deviceScaleFactor`, bukan dari nama
proyek: yang penting rasionya, dan sebuah proyek baru dengan DPR tinggi akan
ikut terjaga tanpa ada yang perlu mengingat berkas ini.

**Alasan lewatnya ditulis ke pesan skip**, bukan disembunyikan. Aturan repo ini
sudah jelas soal skip yang diam: Tahap 49 kehilangan dua asersi selama
berturut-turut karena sebuah `test.skip` yang tidak pernah menjelaskan dirinya.

### 2.1 Yang TIDAK dilakukan

- **`project-detail` tidak disentuh** — §1.3, ia tidak memotret.
- **Gerbang "the page starts where its own chrome starts" tidak disentuh** —
  ia justru alasan berkas ini ada di daftar-izin.
- **Varian "at mobile" di proyek `desktop` tetap jalan** — 390×844 pada DPR 1
  berukuran 0,33 MP, murah, dan mewakili jendela peramban yang sempit.

---

## 3. Daftar berkas

| berkas                                                | perubahan                                                 |
| ----------------------------------------------------- | --------------------------------------------------------- |
| `e2e/visual-substance.e2e.ts`                         | penjaga bersama; dipakai gerbang aksen dan gerbang footer |
| `docs/stages/TAHAP-95.md`, `ROADMAP.md`, `HANDOFF.md` | berkas ini dan posisi                                     |

---

## 4. Kriteria keluar

1. Di proyek `mobile`, varian aksen "at desktop" dan gerbang footer **dilewati
   dengan alasan yang terbaca**, bukan hilang diam-diam.
2. Di proyek `desktop`, **tidak ada** yang berubah: jumlah dan hasilnya sama.
3. Durasi run `mobile` untuk berkas ini turun, dan **angkanya ditulis**
   sebelum dan sesudah.
4. Tally CI diprediksi **di muka** di §7 dan dibandingkan sesudahnya: uji yang
   lulus berkurang, dilewati bertambah dengan jumlah yang sama, total tetap.
5. **Flaky CI hanya dinyatakan tertutup oleh beberapa run berturut-turut**, dan
   tahap ini pun tidak menyatakannya.

---

## 5. Risiko

| #   | risiko                                                                                 | penangkal                                                                                                                                                                                                                                                  |
| --- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Melewatkan uji adalah cara paling mudah membuat merah hilang tanpa memperbaiki apa pun | Yang dilewati adalah **duplikat terukur** — lebar yang sama, halaman yang sama, besaran yang tidak bergantung DPR — dan proyek `desktop` tetap menjalankannya. Kalau argumen itu salah, ia salah karena duplikasinya tidak nyata; itu yang diperiksa di §7 |
| R2  | Jumlah skip naik, dan skip yang naik adalah bagaimana cakupan menguap                  | Persis kenapa §4.1 menuntut alasan yang terbaca dan §4.4 menuntut prediksi tally tertulis                                                                                                                                                                  |
| R3  | Flaky-nya ternyata bukan varian itu                                                    | Mungkin. Kalau run CI berikutnya masih flaky pada varian `at mobile`, tahap ini terbukti salah sasaran dan itu akan ditulis                                                                                                                                |

---

## 6. Yang tidak dikerjakan, dinyatakan eksplisit

- **Flaky CI tidak diklaim tertutup** — §4.5.
- **`project-detail.e2e.ts` tidak disentuh** — §1.3.
- **Nol angka performa diklaim** — `CLAUDE.md` #19.

---

## 7. Kenapa tahap ini dibatalkan

### 7.1 CI menjawab lebih dulu, dan jawabannya bukan yang saya duga

Run `f45d6d3` (Tahap 94) adalah **722 lulus / 14 dilewati / nol flaky** —
run bersih pertama sesudah empat run berturut-turut yang flaky. Durasi per
varian, dua run CI berturut-turut:

```
                                  ci 188dd3f   ci f45d6d3   piksel/screenshot
[desktop] /en at desktop               4,3 s        3,6 s     1,02 MP
[desktop] consulting at desktop        3,4 s        3,4 s     1,02 MP
[desktop] /en at mobile                3,2 s        4,2 s     0,33 MP
[desktop] consulting at mobile         2,9 s        3,0 s     0,33 MP
[mobile]  /en at desktop              12,8 s       12,2 s     9,22 MP
[mobile]  consulting at desktop        9,0 s        8,5 s     9,22 MP
[mobile]  /en at mobile                5,8 s        5,4 s     0,99 MP
[mobile]  consulting at mobile        31,7 s       22,5 s     0,99 MP   <- yang flaky
```

Piksel menjelaskan jarak **antar-proyek** — 12,2 s melawan 3,6 s pada lebar
yang sama — dan itu bagian yang benar dari §1.1. Tetapi ia **tidak**
menjelaskan pencilannya: varian yang gagal adalah yang **paling murah** di
proyek itu, 0,99 MP, dan ia memakan dua sampai empat kali lipat varian
9,22 MP.

Jadi sasaran yang spec ini pilih — "lebar desktop pada rasio piksel telepon"
— bukan sasaran yang gagal. Melewatkannya akan membuang cakupan nyata dan
meninggalkan flaky-nya di tempat.

### 7.2 Dan laptop ini mengatakan yang sebaliknya

Pengukuran §1.1 diambil di laptop ini, yang di sana varian `at desktop` di
proyek `mobile` memakan **46 detik** sementara `at mobile` memakan 6,5 detik.
CI memberi urutan terbalik. Dua instrumen, dua urutan — yang berarti
**tidak satu pun dari keduanya cukup untuk menyimpulkan sebab**, dan saya
menulis §1.1 seolah satu di antaranya cukup.

`HANDOFF.md` sudah menuliskan aturannya: _"Angka gerbang milik mesin yang
menjalankannya... bandingkan ke log CI run yang sama."_ Saya membandingkannya
sesudah menulis spec, bukan sebelum.

### 7.3 Cerita yang cocok dengan kedua run CI

```
consulting at mobile, proyek mobile, di CI:  31,7 s lalu 22,5 s
anggaran sebelum Tahap 94:                   30 s (default Playwright)
anggaran sesudah Tahap 94:                   90 s (diturunkan dari kerja)
```

Uji itu memang berbiaya 22–32 detik di CI, dan anggaran lamanya 30 detik.
Sebuah uji yang biayanya sebesar anggarannya adalah flaky menurut definisi.
Tahap 94 tidak membuat apa pun lebih cepat — ia memberi uji itu anggaran yang
diturunkan dari kerjanya, dan run berikutnya bersih.

Itu **satu** run bersih. `TAHAP-94.md` §7.5 menolak mengklaim penutupan, dan
penolakan itu tetap berlaku.

### 7.4 Yang tersisa sebagai pertanyaan, bukan sebagai tahap

Kenapa `/en/practice/consulting` pada 390 px di proyek `mobile` memakan 22–32
detik sementara `/en` pada viewport dan proyek yang sama memakan 5,4 detik?
Belum terjawab, dan **tidak bisa dijawab dari laptop ini** — di sini urutannya
terbalik. Ia pertanyaan performa, bukan flaky, dan ia dicatat di `HANDOFF.md`
sebagai terbuka.
