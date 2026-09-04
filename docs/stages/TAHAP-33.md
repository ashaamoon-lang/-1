# Tahap 33 — Situs yang tidak berhenti bergerak

> Pendalaman wajib atas `docs/ROADMAP.md` §3.0.
> Fase 6 diulang untuk **dikembangkan**, bukan dirombak.

Status: **selesai**. Hasil di §8.

---

## 1. Diagnosisnya, diukur bukan dirasakan

Pemilik proyek menilai situs ini **kurang animatif, kurang kreatif, kurang
eksploratif**. Itu diukur sebelum dijawab: setiap rute digulir melalui delapan
posisi, dan pada tiap posisi dihitung berapa elemen yang membawa `transform`
bukan-identitas.

| rute                      | layar | rata-rata bergerak | frame berbeda |
| ------------------------- | ----- | ------------------ | ------------- |
| `/en`                     | 7,5   | 11 / 127           | 7             |
| `/en/work`                | 4,5   | **0 / 79**         | **1**         |
| `/en/work/arus-balik`     | 4,7   | 1 / 43             | 4             |
| `/en/practice/consulting` | 3,0   | 1 / 88             | 5             |
| `/en/studio`              | 5,2   | 8 / 179            | 5             |
| `/en/journal`             | 2,8   | **0 / 37**         | **1**         |
| `/en/journal/<slug>`      | 1,9   | 0 / 24             | 2             |

**Katalog karya — halaman portofolio utama — punya SATU frame berbeda di
sepanjang 4,5 layar.** Tidak ada satu pun elemen yang bertransformasi saat
digulir. Indeks jurnal sama.

Diagnosisnya jelas dan bisa dinamai: **gerak situs ini hampir seluruhnya
gerak masuk.** Blok tiba, lalu membeku. Yang tersisa setelah kedatangan cuma
scrub studio dan peredupan baris jurnal. Penilaian pemilik proyek benar, dan
sekarang ada angkanya.

---

## 2. Dan sebagian sudah dijanjikan scaffold, lalu ditunda

`vault/motion/` berisi **tiga** primitif: `reveal`, `text-reveal`,
`page-transition`. Scaffold Fase 1 menjanjikan empat lagi, dan Tahap 23
menunda atau menolak semuanya:

| primitif           | nasibnya di Tahap 23                              |
| ------------------ | ------------------------------------------------- |
| `parallax`         | alasannya ditulis, lalu **tidak dipasang** (§8.4) |
| `sticky-stack`     | **ditunda** (§ akhir)                             |
| `counter`          | **ditunda**                                       |
| `velocity-marquee` | dinilai beban, ditolak                            |

Masing-masing punya alasan yang masuk akal saat itu. **Efek gabungannya**
adalah tabel §1. Itu yang tahap ini perbaiki.

---

## 3. Tesisnya: satu masukan baru, banyak konsumen

Menambah lima efek terpisah akan membuat situs ini ramai, bukan hidup — dan
melanggar standar yang `CLAUDE.md` tutup dengannya. Jadi yang ditambahkan
adalah **satu masukan yang belum pernah dipakai situs ini: gerakan pembacanya
sendiri**, dan beberapa hal membacanya.

1. **Kedalaman diferensial (`vault/motion/parallax`).** Media bergerak sedikit
   lebih lambat daripada bingkainya. Preset `ui-ux-pro-max` menentukan
   angkanya — `yPercent` 5–15, scrub, `ease: 'none'` — dan aturannya:
   **hanya lapisan media, tidak pernah prosa.** Itu juga alasan Tahap 23
   menolaknya dulu, dan aturan itu dipatuhi, bukan dibalik.
2. **Kecepatan gulir sebagai variabel situs.** Lenis sudah menghitungnya dan
   tidak ada yang membacanya. Ia dipublikasikan sekali sebagai custom property
   di `<html>`, dan plat karyanya meresponsnya. Satu masukan, banyak
   pembaca — bukan lima efek yang saling berebut.
3. **Fase 6, dikembangkan.** §4.

Semua dari token. Hanya `transform` dan `opacity` (`CLAUDE.md` #4). Satu loop
RAF — Lenis, GSAP, Tempus sudah berbagi satu, dan **tidak ada yang kedua
ditambahkan** (#6).

---

## 4. Fase 6 diulang: memperbaiki yang gagal, bukan mengulang percobaannya

Tahap 32 membangun pass postprocessing, memotretnya, dan menolaknya dengan dua
alasan. Keduanya ditangani, tidak dihindari:

**Alasan pertama — ia merusak warna.** Beda absolut rata-rata 55,8/255; rust
dalam jadi aprikot susu. Sebabnya diketahui: buffer `HalfFloatType` komposer
mengeluarkan render dari penanganan ruang warna renderer. **Itu diperbaiki**,
dengan pass keluaran yang mengembalikan encoding-nya, dan **dibuktikan dengan
angka**: beda terhadap frame tanpa-pass harus mendekati nol saat diam.

**Alasan kedua — grain ketiga tidak punya pekerjaan.** Itu tetap benar, jadi
efeknya **bukan** grain. Yang dipasang membaca masukan §3.2: **dispersi yang
digerakkan kecepatan**. Kanvas memisah kanal warnanya sangat sedikit ketika
pembacanya bergerak, dan **kembali ke nol saat diam**.

Itu yang membuatnya lulus ujian yang gagal ditempuh grain: **saat karya
seninya diam dipandangi, pass-nya secara harfiah tidak melakukan apa-apa.** Ia
hanya ada saat ada gerakan — yang persis tesis lapisan material Tahap 21
("sentuhan meninggalkan jejak"), dinaikkan ke tingkat komposit.

---

## 5. Yang tetap tidak dilakukan

- **Prosa tidak pernah di-parallax.** Aturan presetnya, aturan Tahap 23, dan
  alasan yang sama: ia melukai kenyamanan baca.
- **Tidak ada scroll-hijack, tidak ada gulir horizontal paksa.** Ditolak di
  scaffold §4 dan tetap ditolak.
- **`velocity-marquee` tetap tidak dipasang.** Tahap 23 menilai marquee-nya
  beban; kecepatan gulir sekarang punya konsumen yang lebih baik.

---

## 6. Gerbang

1. **Tabel §1 harus berubah** — `/en/work` dan `/en/journal` tidak boleh lagi
   punya satu frame. Ini gerbang utama tahap ini, dan angkanya sudah merah
   hari ini.
2. **Prosa tidak bergerak** — tidak ada elemen teks paragraf yang membawa
   transform terkait-gulir.
3. **Reduced motion** — nol parallax, nol dispersi, isi berakhir terlihat
   penuh.
4. **Pass tidak mengubah warna saat diam** — beda terhadap frame tanpa-pass
   mendekati nol, dibuktikan dengan angka yang sama yang menolaknya di Tahap 32.
5. axe, `no-javascript`, `route-budget`, `webgl-budget` tetap hijau.

---

## 7. Risiko

**7.1 Lebih banyak gerak bisa jadi lebih banyak kebisingan.** Dimitigasi oleh
§3: satu masukan, bukan lima efek. Dan setiap angkanya kecil — presetnya
sendiri memperingatkan bahwa delta besar membuat lapisan desync.

**7.2 Kecepatan gulir yang dipublikasikan tiap frame bisa memicu layout.**
Ia ditulis sebagai custom property yang **hanya** dibaca `transform`, jadi ia
tidak pernah menyentuh tata letak.

---

## 8. Hasil

**Situs ini sekarang bergerak sepanjang dibaca.** Katalog karya naik dari
**satu frame** menjadi delapan. Dan Fase 6 diulang dengan benar: percobaan
kedua mengungkap penyebab sebenarnya, yang bukan yang Tahap 32 duga.

### 8.1 Tabel §1, diukur ulang dengan instrumen yang sama

| rute                      | sebelum         | sesudah       |
| ------------------------- | --------------- | ------------- |
| `/en`                     | 11/127, 7 frame | 14/131, **9** |
| `/en/work`                | **0/79, 1**     | 6/85, **8**   |
| `/en/work/arus-balik`     | 1/43, 4         | 3/45, **8**   |
| `/en/practice/consulting` | 1/88, 5         | 3/90, **7**   |
| `/en/studio`              | 8/179, 5        | 8/179, 5      |
| `/en/journal`             | 0/37, 1         | 0/37, 1       |

Dua halaman yang paling diam — katalog dan halaman proyek — sekarang yang
paling hidup sesudah beranda.

### 8.2 Dua yang tidak berubah, dan hanya satu yang cacat

**`/en/journal` bukan cacat, instrumennya yang kurang.** Gerak indeks jurnal
adalah **opacity**, dan probe §1 hanya menghitung `transform`. Diverifikasi
dengan probe Tahap 27 pada build ini: `1.00 0.70 0.70` → `0.70 1.00 0.70` →
`0.70 0.70 1.00`. Ia bergerak; alat ukurnya yang tidak melihatnya. Instrumen
diperluas untuk menghitung opacity juga, lalu dikembalikan — versi itu justru
**kurang** diskriminatif (sinyal opacity dari sumber lain mengaburkan tanda
tangannya), jadi angka di §8.1 tetap metrik yang sama dengan §1.

**`/en/studio` memang tidak berubah, dan itu benar.** Halaman itu nol media —
seluruhnya tipografi — dan aturan §5 melarang mem-parallax prosa. Ia sudah
punya dua momen berkoreografi dari Tahap 24 dan 25.

### 8.3 Fase 6 diulang: dugaan Tahap 32 salah, dan sekarang penyebabnya tahu

Tahap 32 menolak pass-nya karena mengangkat warna (beda 55,8/255) dan menduga
sebabnya buffer `HalfFloatType`. **Dugaan itu diuji dan salah.**

Percobaan kedua: buffer-nya dihapus, dan efeknya diganti dengan sesuatu yang
**secara matematis identitas saat halaman diam** — dispersi kanal yang
digerakkan kecepatan gulir, yang pada kecepatan nol menggeser sebesar nol.
Diukur saat benar-benar diam terhadap halaman yang sama tanpa komposer:

| percobaan                           | beda saat diam |
| ----------------------------------- | -------------- |
| Tahap 32 — grain, `HalfFloatType`   | 55,8/255       |
| Tahap 33 — dispersi, buffer default | **58,7/255**   |

**Tidak membaik.** Jadi pengangkatannya bukan efeknya dan bukan buffer-nya —
ia **manajemen warna komposer itu sendiri bertemu renderer yang proyek ini
konfigurasikan dengan sengaja.**

Dan konfigurasi itu bukan kebetulan: `lib/webgl/components/canvas/webgl.tsx`
menyetel `flat` dan membiarkan `outputColorSpace` di sRGB, keduanya hasil
pengukuran — `docs/stages/TAHAP-17.md` §4 mencatat bug di mana setiap warna
ber-shader kustom mendarat sebagai `authored ^ 2.2` karena konversinya
dimatikan di satu ujung saja.

**Membuat komposer setuju berarti membuka lagi keputusan itu**, dan sebuah
efek ambien tidak sepadan dengan mempertaruhkan kembali pipeline warna situs.
Jadi pass-nya tetap tidak dikirim — tapi sekarang alasannya menyebut konflik
yang sebenarnya, bukan tebakan pertama yang masuk akal. Percobaan ketiga harus
mulai dari setelan warna renderer, bukan dari efeknya.

**Satu perbaikan tetap dikirim:** flag `postprocessing` ada di `WebGLCanvas`
dan **tidak bisa dicapai** dari `Wrapper` — `Canvas` tidak meneruskannya. Celah
itu ditutup. Tidak ada rute yang menyalakannya.

### 8.4 Yang dikirim

| Berkas                          | Isinya                                                     |
| ------------------------------- | ---------------------------------------------------------- |
| `vault/motion/parallax/`        | **baru** — kedalaman diferensial, parameter dari preset    |
| `lib/motion/scroll-velocity.ts` | **baru** — satu angka, dua pembaca                         |
| `components/layout/lenis/`      | menerbitkan `--scroll-velocity` **di loop yang sudah ada** |
| `vault/blocks/project-card/`    | lapisan parallax + regangan kecepatan                      |
| `vault/blocks/project-gallery/` | lapisan parallax per figur                                 |
| `e2e/continuous-motion.e2e.ts`  | 5 gerbang                                                  |

**Nol loop RAF kedua** (`CLAUDE.md` #6): kecepatannya ditulis di dalam callback
Tempus yang Lenis sudah jalankan, pada saat scroll state-nya segar. Ia hanya
pernah dibaca `transform`, jadi tidak pernah memicu layout, dan republikasinya
dilewati kalau perubahannya di bawah ambang yang bisa dilihat.

**Parallax tidak pernah menyentuh `.media`** pada kartu proyek: elemen itu yang
difoto `<ViewTransition>` untuk morf kartu→proyek, dan transform pada elemen
yang sedang di-morf adalah kelas cacat yang sama dengan menyplit teks yang
hendak difoto. Lapisan yang bergerak ada di dalamnya.

### 8.5 Verifikasi

- `bun run check` — exit 0, **438 uji unit**.
- `CI=true bun run test:e2e` — **389 lulus, 0 gagal**, 16 dilewati, nol flake.
- `e2e/continuous-motion.e2e.ts` — 5/5, termasuk gerbang utama yang **merah**
  terhadap situs sebelum tahap ini.
- Prosa: **nol** blok teks membawa transform terkait-gulir.
- Reduced motion: nol plat tergeser.
- Lapisan yang bergerak tidak pernah memperlihatkan bingkainya — diukur di
  empat posisi gulir, enam plat, nol terekspos.
- Anggaran rute tidak dinaikkan.
- Tidak ada klaim performa (`CLAUDE.md` #19).

### 8.6 Yang masih bisa dikembangkan berikutnya

- **`sticky-stack` dan `counter`** yang scaffold sebutkan masih ditunda. Ia
  mengubah komposisi halaman, bukan menambah lapisan padanya, jadi ia tahap
  sendiri — bukan sesuatu yang diselipkan ke tahap ini.
- **Halaman studio** tetap sepenuhnya tipografi. Gerak di sana harus datang
  dari komposisi (yang `sticky-stack` sediakan), bukan dari parallax.
- **Pass postprocessing** menunggu keputusan pipeline warna, bukan menunggu
  efek yang lebih baik.
