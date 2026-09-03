# Tahap 25 — Koreografi halaman Studio, diuji ulang lalu dinaikkan

> Pendalaman wajib atas `docs/ROADMAP.md` §3.0.

Status: **selesai**. Hasil di §7.

---

## 1. Mandat

Pemilik proyek: _"uji ulang fase 2 dan kembangkan koreografinya. Saya ingin
untuk animasi jangan khawatirkan soal budget, selama cukup layak untuk boost
estetika maka mulai menerapkannya."_

Jadi anggaran rute **tidak lagi mengikat gerak**. Yang tetap mengikat, dan
tidak dicabut karena ia aturan desain bukan aturan berat:

- `MOTION-SPEC.md` §9.5 — **maksimal dua gerak berkoreografi per halaman, dan
  keduanya diberi nama.**
- `CLAUDE.md` #4 hanya `transform`/`opacity`, #5 reduced motion berakhir
  terlihat penuh, #6 satu loop RAF, #7 selalu bersihkan.

---

## 2. Uji ulang Fase 2 — dua temuan

### 2.1 Kolom menempel: bekerja, tapi terlalu kecil untuk terasa

Diukur, posisi viewport label saat digulir:

| scrollY     | 900 | 1100    | 1300 | 1500 | 1700 |
| ----------- | --- | ------- | ---- | ---- | ---- |
| `top` label | 146 | **146** | 16   | −184 | −287 |

Bacaan pertama saya: "sticky-nya rusak". **Salah.** Ia terpaku tepat di
offset-nya (146 = tinggi header + section-lead) selama 900→1100, lalu keluar
bersama blok penampungnya. Itu perilaku `sticky` yang benar.

Yang sebenarnya salah: bagiannya **580px** di viewport **900px** — label 14px
di area 580px. Pin-nya berlangsung sekitar 200px gulir, lalu selesai. Efeknya
ada dan **tidak cukup besar untuk dirasakan**, kelas cacat yang sama dengan
Tahap 21 (material yang bergerak tapi tak pernah ditemui).

Tidak ada leluhur yang mematahkan sticky — transform, overflow, dan `contain`
semuanya bersih. Diperiksa, bukan diasumsikan.

### 2.2 Scrub pernyataan selesai sebelum dibaca

Opacity kata minimum saat digulir:

| scrollY | 0        | 200  | 400      | 600  |
| ------- | -------- | ---- | -------- | ---- |
| min     | **0,33** | 0,53 | **1,00** | 1,00 |

Dua masalah dalam satu tabel. Saat halaman **dibuka**, efeknya sudah 1/3
selesai — pembaca mendarat di tengah gerakan. Dan seluruhnya beres pada 400px,
jauh sebelum ia selesai membaca 90 kata.

---

## 3. Yang dikerjakan

### 3.1 `studio-process` — indeks yang ditahan

Momen berkoreografi **kedua** halaman ini, dan ia yang membuat kolom menempel
di §2.1 berarti.

Label yang menempel berhenti jadi kata mati dan menjadi **indeks hidup**: ia
melaporkan langkah yang sedang dibaca (`01 / 04` dan namanya), berganti saat
pembaca melewatinya. Langkah yang tidak aktif meredup; yang aktif penuh.

Itu bukan dekorasi — ia menjawab "saya di mana dalam urutan ini", yang adalah
satu-satunya pertanyaan yang punya jawaban di bagian berurutan. Dan ia
memberi kolom menempel itu pekerjaan, alih-alih sekadar tidak bergerak.

Konsekuensi tata letak yang **harus** ikut: bagiannya dibuat lebih tinggi.
Sebuah indeks yang ditahan hanya terasa kalau ia ditahan lebih lama daripada
satu layar — §2.1 mengukur bahwa 580px tidak cukup.

Dikirim sebagai `vault/blocks/step-sequence`, bukan kode di dalam halaman:
ia pola yang berulang (urutan apa pun dengan label yang menahan), dan
`vault/` adalah tempat pola tinggal di proyek ini.

### 3.2 Scrub diberi jarak baca

`start`/`end` diatur ulang supaya (a) saat halaman dibuka efeknya **belum
mulai**, dan (b) ia selesai kira-kira saat pembaca sampai ke akhir paragraf.
Angkanya ditetapkan dengan **mengukur**, sama seperti halaman praktik
menetapkan angkanya — dan pengukurannya dicatat.

### 3.3 Anggaran

`route-budget.e2e.ts` tetap menjadi hakim tentang **library mana** yang boleh
di rute mana — itu keputusan arsitektur, bukan berat. Plafon byte `/en/studio`
dinaikkan kalau pengukuran menuntutnya, dengan angkanya dicatat, sesuai
arahan pemilik proyek.

---

## 4. Gerbang

1. **Indeks ikut berpindah** — digulir melewati keempat langkah, indeks yang
   dilaporkan berubah 1 → 4. Dibuktikan merah dulu (hari ini label statis).
2. **Pin bertahan lebih lama dari satu layar** — jarak gulir tempat label
   terpaku diukur, dan harus melebihi tinggi viewport. Hari ini ~200px.
3. **Scrub belum mulai saat halaman dibuka** — min opacity pada `scrollY 0`
   harus sama dengan nilai redupnya, bukan 0,33.
4. **Reduced motion** — tidak ada yang meredup, indeks tidak berpindah, semua
   langkah berakhir **terlihat penuh**.
5. **Tanpa JavaScript** — keempat langkah terbaca.
6. **axe bersih**, dua viewport dua bahasa. Indeks hidup itu wilayah `aria-live`
   yang salah kalau dipasang sembarangan: ia **dekoratif**, jadi ia
   `aria-hidden`, karena daftar bernomor sudah membawa urutannya untuk
   teknologi bantu.

---

## 5. Risiko

**5.1 Meredupkan teks adalah masalah kontras.** Nilai redupnya harus tetap
lolos WCAG untuk teks yang masih terlihat — atau langkah non-aktif harus tetap
di atas ambang. Diukur, bukan dikira.

**5.2 Empat ScrollTrigger baru per halaman.** Dibersihkan di unmount seperti
yang lain; `e2e/motion.e2e.ts` sudah punya gerbang kebocoran.

**5.3 Bagian yang lebih tinggi berarti halaman lebih panjang.** Itu memang
harganya, dan ia disengaja: sebuah urutan yang dibaca butuh jarak untuk
dibaca.

---

## 6. Yang **tidak** dikerjakan

- **Momen ketiga.** §9.5 membatasi dua, dan halaman ini akan punya dua.
  Anggaran dibebaskan; aturan komposisi tidak.
- **Parallax pada karya** — masih ditolak dengan alasan Tahap 23 §8.4.

---

## 7. Hasil

**Selesai.** Anggaran dibebaskan dan **tidak terpakai** — rute studio berakhir
di 835 KB dari plafon 900 yang sudah ada. Yang mahal ternyata bukan berat,
melainkan **kontras**: dua nilai peredupan diukur gagal WCAG, dan salah satunya
sudah terkirim sejak Tahap 15.

### 7.1 Terkirim

`vault/blocks/step-sequence` — label yang menahan, melaporkan langkah yang
sedang dibaca, dengan langkah lain yang mundur. Dipasang di halaman studio
sebagai momen berkoreografi kedua, `studio-process`.

Terukur, sebelum dan sesudah:

|                           | sebelum    | sesudah                          |
| ------------------------- | ---------- | -------------------------------- |
| pin bertahan              | ~200px     | **1500px** (viewport 900)        |
| indeks                    | statis     | **01 → 02 → 03 → 04**, nama ikut |
| scrub saat halaman dibuka | sudah 0,33 | belum mulai                      |
| scrub selesai pada        | 400px      | **~1000px**                      |
| tinggi dokumen            | 2261       | 4644                             |

Dokumen dua kali lebih panjang, dan itu **harganya yang disengaja**: sebuah
urutan yang dibaca butuh jarak untuk dibaca.

### 7.2 Bacaan pertama saya salah, dan koreksinya penting

Saya melaporkan "sticky-nya rusak". Diukur lagi: ia terpaku **tepat** di
offsetnya (146px) dan bertahan, lalu keluar bersama blok penampungnya —
perilaku `sticky` yang benar. Yang salah adalah **skalanya**, bukan
mekanismenya.

Lalu saya mematahkannya sendiri: membungkus elemen menempel dalam `.column`
memindahkan blok penampungnya dari _grid area_ (setinggi baris) ke _kotak
elemen_ (14px), dan pin-nya hilang sama sekali — "held for 0px". Diperbaiki
dengan `align-self: stretch` pada pembungkusnya.

### 7.3 Premis gerbang saya juga salah

Gerbang "scrub belum mulai saat halaman dibuka" tidak bisa dipenuhi dengan
mengubah `start`: **sebuah efek terkait-gulir pada elemen yang sudah di layar
sudah dimulai.** Parameternya tidak pernah jadi masalahnya; tata letaknya yang
jadi masalah. Hero diberi tinggi satu layar, dan pernyataannya turun ke bawah
lipatan.

### 7.4 Dua kegagalan kontras, dan yang kedua berumur sepuluh tahap

**Peredupan langkah.** Ditulis 0,55, diukur axe: `#6f6d6a` di `#110f0d` =
**3,70:1**, di bawah 4,5, pada 6 node. Disapu terhadap axe — 0,65 nilai
pertama yang lolos; dipakai **0,7** dengan margin.

**`ProgressText.dimOpacity`.** Sesudah itu route-sweep gagal dengan **89 node**
kontras di `scrollY 0`. Sumbernya sembilan puluh kata redup pada **0,33** =
**2,78:1** — bukan cacat baru, melainkan default komponen sejak Tahap 15.

Kenapa baru sekarang terlihat, dan ini pola yang ketiga kalinya: di halaman
praktik pernyataannya di bawah lipatan, jadi split belum jalan dan tidak ada
kata redup di DOM untuk diperiksa. Halaman studio menaruh satu dekat atas
**dan** §7.3 membuat scrub-nya belum mulai saat dibuka — yang menaruh
kesembilan puluh kata pada nilai redup sekaligus.

Disapu: 0,45 memberi 4,21; **0,5 yang pertama lolos**; default jadi **0,55**.
Perbaikannya ikut menutup cacat yang sama di ketiga halaman praktik.

### 7.5 Gerbang baru, dan kenapa ia digulir

Tiga kali sekarang cacat lolos karena **axe mengaudit pada `scrollY 0`** dan
elemen yang membawanya ada di bawah lipatan. Jadi gerbang baru di
`e2e/motion.e2e.ts` menggulir **masuk ke dalam** urutan, memastikan setidaknya
satu langkah sudah mundur, lalu menjalankan axe di sana — dua bahasa.

Ditambah dua gerbang koreografi, keduanya dibuktikan merah lebih dulu:
`held for 0px` dan `the brightest word is already at 1.00`.

### 7.6 Verifikasi

- `bun run check` — exit 0, 410 uji unit.
- `CI=true bun run test:e2e` — **337 lulus, 0 gagal**, 14 dilewati.
- **Reduced motion**: langkah `[1, 1, 1, 1]`, nol meredup, indeks statis,
  kata-kata penuh. `CLAUDE.md` #5 terpenuhi, dan dijamin oleh **stylesheet**
  bukan oleh state komponen.
- **Anggaran**: `/en/studio` 835 KB dari 900. Tidak dinaikkan.
- Halaman **dipandangi** di 1440×900, termasuk di tengah urutan.
- Tidak ada klaim performa (`CLAUDE.md` #19).

### 7.7 Yang tidak dikerjakan

Tidak ada story Storybook untuk `step-sequence`. `CLAUDE.md` menuntutnya untuk
**primitif**, dan `manifest:check` tidak memintanya untuk blok — tapi alasan
sebenarnya lebih baik disebut: komponen ini seluruhnya terkait-gulir, dan di
dalam iframe Storybook tanpa jarak gulir ia tidak akan menunjukkan apa pun
yang bisa dinilai. Cakupan a11y-nya datang dari gerbang tergulir di §7.5,
yang justru mengujinya di keadaan yang penting.
