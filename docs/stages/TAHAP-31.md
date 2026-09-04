# Tahap 31 — Galeri yang bisa dipegang

> Pendalaman wajib atas `docs/ROADMAP.md` §3.0.
> Fase 5 dari scaffold yang disetujui.

Status: **selesai**. Hasil di §8.

---

## 1. Dua fakta yang menentukan bentuknya, diukur lebih dulu

**Setiap proyek punya tepat dua gambar galeri.** Diukur pada keenam proyek —
`arus-balik`, `pusat-beban`, `bacaan-mesin`, `takar`, `pelabuhan`,
`lantai-dua`: dua, dua, dua, dua, dua, dua.

> **Koreksi.** Draf pertama spec ini menulis "tiga", dan itu salah. Hitungannya
> mencocokkan `data-span=` di HTML halaman — atribut yang **kartu proyek
> berikutnya juga pakai**, jadi satu dari tiga kecocokan bukan gambar galeri
> sama sekali. Dihitung ulang dengan `data-gallery-trigger`, yang hanya ada
> pada pembuka galeri. Angkanya penting justru karena ia yang memutuskan
> kontrol mana yang pantas ada (§5).

**Rute proyek punya 22 KB sisa.** `/en/work/arus-balik` terukur **878 KB**
terhadap plafon 900. Base UI Dialog sendiri lebih besar dari itu.

Keduanya bukan detail. Yang pertama menentukan **kontrol mana yang pantas
ada**, yang kedua menentukan **bagaimana ia dimuat**, dan keduanya membuat
sebagian daftar belanja scaffold tidak cocok dengan isinya (§5).

---

## 2. Keputusan yang komponennya sendiri sudah tuliskan

`vault/blocks/project-gallery/index.tsx` membawa paragraf berjudul **"No
lightbox, deliberately"**, dan menutupnya begini:

> "If a lightbox is added later it belongs in `components/ui/` beside the
> other Base UI dialogs, not here."

Scaffold Fase 5 membalik keputusan itu, dan komponennya sudah menuliskan ke
mana lightbox-nya harus pergi. Jadi tahap ini **tidak** menaruh dialog ke dalam
`vault/blocks/project-gallery`; ia membangun `components/ui/lightbox/` dan
galeri memanggilnya. Paragraf itu diperbarui, bukan dibiarkan berbohong.

---

## 3. Yang dibangun

| Bagian            | Isinya                                               |
| ----------------- | ---------------------------------------------------- |
| Dialog            | Base UI `Dialog`, dimuat saat pertama dibuka         |
| Navigasi keyboard | `←` / `→` antar gambar, `Esc` menutup                |
| Fokus kembali     | ke **gambar yang membukanya**, bukan ke yang pertama |
| Perbesar + geser  | satu langkah zoom, lalu **seret untuk menggeser**    |
| Sentuh            | usap untuk berpindah gambar                          |
| Penghitung        | `01 / 02` — idiom `step-sequence`, dipakai lagi      |
| Deret kecil       | tiga pratinjau, lompat langsung                      |

**Perbesar-lalu-geser adalah alasan fitur ini ada.** Situs ini menjual karya
pesanan; membesarkan sebuah karya sampai layar penuh lalu bisa memeriksa
detailnya adalah hal yang benar-benar diinginkan calon klien. Menyeret gambar
yang sudah pas di layar tidak berguna — jadi menggeser hanya hidup **setelah**
diperbesar, dan itu yang membuatnya informasi, bukan hiasan.

---

## 4. Bagaimana ia dimuat, dan satu pertanyaan yang diukur bukan diasumsikan

22 KB tidak cukup, jadi lightbox-nya **`import()` di dalam penangan klik**,
persis pola `components/ui/command` yang sudah terbukti.

Lalu pertanyaannya: scaffold menulis "drag-to-pan dengan GSAP `Draggable` +
`Observer`". Tahap 28 mengukur bahwa **modul yang dipakai chunk eager _dan_
chunk async membuat webpack menggandakan seluruh grup chunk-nya** — 43 KB
dikirim dua kali. GSAP **ada di graf eager rute ini** (`TextReveal` pada
`h1`), jadi `Draggable` di chunk async adalah kandidat kuat untuk cacat yang
sama.

Itu **diukur**, bukan ditebak: dibangun dengan Pointer Events lebih dulu,
diukur; lalu satu build percobaan dengan `Draggable` diimpor, diukur; lalu
angkanya ditulis di §8 dan yang lebih ringan yang dikirim. Kalau `Draggable`
ternyata gratis, ia yang dipakai — scaffold menang kalau datanya mengizinkan.

---

## 5. Yang **tidak** dipakai dari daftar scaffold, karena isinya tiga gambar

Scaffold menulis Base UI `scroll-area` untuk daftar mini dan `slider` untuk
indikator posisi. Keduanya ditulis sebelum jumlah gambarnya diketahui.

- **`scroll-area`**: dua pratinjau muat di viewport mana pun. Wadah gulir
  yang tidak pernah menggulir adalah kontrol tanpa pekerjaan. Deret-nya tetap
  dibangun — hanya sebagai baris flex. Kalau sebuah proyek nanti mengirim
  delapan gambar, `scroll-area` adalah tepat yang dipasang di sana, dan
  barisnya satu.
- **`slider`**: penggeser menyiratkan pencarian kontinu; dua gambar diskret
  dilayani lebih baik oleh penghitung, panah, dan deret. Sebuah penggeser
  untuk dua item adalah kontrol yang mencari pekerjaan.

Ini keputusan tentang kecocokan kontrol dengan isi, bukan tentang kesulitan.

---

## 6. Aksesibilitas — yang harus benar sebelum apa pun yang lain

1. Dialog membawa nama; gambarnya membawa `alt` dari CMS yang skema wajibkan.
2. Fokus **masuk** saat dibuka dan **kembali ke pemicunya** saat ditutup —
   pemicu di sini adalah gambar yang diklik, bukan gambar pertama.
3. `←` / `→` / `Esc` bekerja tanpa tetikus.
4. Kontrol perbesar punya nama yang terucap, dan keadaannya terumumkan.
5. **axe bersih pada lightbox yang terbuka** — pelajaran Tahap 28 §9.2:
   dialog yang tertutup tidak ada di DOM, jadi rute bisa hijau selamanya
   sambil membawa lightbox rusak.
6. `prefers-reduced-motion`: transisinya jadi **potong**, bukan hilang; isi
   berakhir terlihat penuh.

---

## 7. Gerbang

Yang sudah ada dan tidak boleh bergerak: `route-budget` (rute ini **22 KB**
sisanya — gerbang inilah yang membuktikan §4 benar), `keyboard-focus`,
`no-javascript`, `project-detail`.

Yang baru, di `e2e/lightbox.e2e.ts`:

1. Mengklik gambar galeri membuka lightbox dengan gambar **itu**, bukan yang pertama.
2. `←` / `→` berpindah, dan penghitungnya ikut.
3. `Esc` menutup dan fokus kembali ke gambar yang membukanya.
4. axe bersih **pada lightbox terbuka**, dua bahasa.
5. Menggeser hanya mungkin **setelah** diperbesar.
6. Reduced motion: nol transform tersisa.
7. Tanpa JavaScript: galerinya tetap terbaca dan tidak ada kontrol mati.

---

## 8. Hasil

**Selesai.** Galeri proyek sekarang bisa dibuka layar penuh, dijelajahi dengan
keyboard, diperbesar, dan digeser. **Empat cacat** ditemukan dengan
menjalankannya — bukan dengan membacanya — dan salah satunya adalah angka di
spec ini sendiri.

### 8.1 Terkirim

| Berkas                                   | Isinya                                          |
| ---------------------------------------- | ----------------------------------------------- |
| `components/ui/lightbox/`                | Dialog, keyboard, perbesar, geser, usap, deret  |
| `vault/blocks/project-gallery/index.tsx` | Tiap figur jadi tombol; indeks dimiliki di sini |
| `e2e/lightbox.e2e.ts`                    | 10 gerbang                                      |
| `messages/*.json`                        | Namespace `lightbox`, dua bahasa                |

Paragraf **"No lightbox, deliberately"** di galeri ditulis ulang, tidak
dibiarkan berbohong. Argumennya tetap berlaku — dan justru itu alasan
dialognya **tidak** di file itu: paragraf lamanya sudah menunjuk ke
`components/ui/`, dan di sanalah ia dibangun.

### 8.2 Anggaran: pemisahan async bekerja

`/en/work/arus-balik` **878 → 879 KB** terhadap plafon 900. Base UI Dialog
tetap di luar graf eager; yang bertambah satu kilobyte adalah kabel pemicunya.

### 8.3 `Draggable` diukur, dan dugaan saya meleset

Spec §4 menduga `Draggable` akan mengulang cacat Tahap 28 — modul yang dipakai
chunk eager **dan** async membuat webpack menggandakan grup chunk-nya. Diukur
dengan satu build percobaan yang benar-benar mengimpornya:

| build                  | `/en/work/arus-balik` |
| ---------------------- | --------------------- |
| Pointer Events         | 879 KB                |
| **dengan `Draggable`** | **879 KB**            |

**Nol penggandaan.** Sebabnya: GSAP di rute ini sendiri tiba lewat batas
`dynamic()` di `components/layout/wrapper`, jadi ia **tidak pernah ada di
chunk eager** untuk digandakan _dari_. Aturan Tahap 28 ternyata tentang
keanggotaan grup chunk, bukan tentang kapan sebuah pustaka tiba — dan itu
koreksi yang layak dicatat, karena versi saya sebelumnya akan menolak hal-hal
yang sebenarnya gratis.

Jadi argumen beratnya gugur, dan yang memutuskan adalah perilaku: yang
`Draggable` tambahkan di atas empat puluh baris di bawah adalah inersia saat
dilempar — dan itu butuh `InertiaPlugin`, yang **tidak ada di paket gratis**.
Tanpa itu keduanya melakukan hal yang sama, dan satu di antaranya tidak punya
plugin untuk didaftarkan.

### 8.4 Empat cacat, semuanya ditemukan dengan menjalankannya

**8.4.1 Panah tidak melakukan apa-apa.** Base UI menghentikan tombol panah
merambat — ia memperlakukannya sebagai navigasi komposit miliknya sendiri —
jadi pendengar `document` di fase bubble **tidak pernah jalan**. Diukur:
pendengar fase capture melihat `ArrowLeft`, pendengar identik di fase bubble
tidak melihat apa pun. Diperbaiki dengan mendengarkan di fase capture.

**8.4.2 Menggeser menutup dialognya.** `Dialog.Popup` diberi `display:
contents`, yang **tidak menghasilkan kotak sama sekali** — dan Base UI menilai
"apakah tekanan itu di luar?" dari geometri popup. Tanpa kotak, setiap
pelepasan ada di luar. Terukur: dialog hilang tepat pada `mouseup`. Popup-nya
sekarang grid sungguhan.

**8.4.3 Gambarnya terpotong.** Baris grid implisit `.stage` diukur **oleh
isinya sendiri**, jadi `block-size: 100%` pada frame melingkar dan dibuang:
**786px gambar di dalam panggung 698px**, dengan `overflow: hidden` diam-diam
memotong atas dan bawah sebuah karya. Diberi baris `1fr` yang definit;
sesudahnya **1240×698 di panggung 1430×698**, rasio utuh, tanpa potongan.

**8.4.4 Jumlah gambarnya salah di spec ini.** §1 menulis "tiga per proyek".
Hitungannya mencocokkan `data-span=`, atribut yang **kartu proyek berikutnya
juga pakai**. Sebenarnya **dua**. Koreksinya ada di §1, dan angkanya penting
karena ia yang memutuskan kontrol mana yang pantas ada.

### 8.5 Satu temuan isi, bukan kode

Kedua gambar galeri setiap proyek membawa **`alt` yang identik**. Itu isi CMS,
bukan kode — kodenya membaca `alt` dengan benar. Nama dialognya tetap
membedakan keduanya karena diawali posisi ("Work 1 of 2: …"), jadi pembaca
layar tidak kehilangan orientasi. Tapi dua karya berbeda yang dideskripsikan
dengan kalimat yang sama adalah sesuatu yang studio perlu perbaiki di Studio,
dan disebut di sini alih-alih dibiarkan ditemukan.

### 8.6 Verifikasi

- `bun run check` — exit 0, **438 uji unit**.
- `CI=true bun run test:e2e` — **382 lulus, 0 gagal**, 18 dilewati, nol flake.
- `e2e/lightbox.e2e.ts` — **10/10**, termasuk axe bersih pada lightbox
  **terbuka** di dua bahasa.
- `route-budget` — lulus, **nol plafon dinaikkan**.
- Ponsel 390×844 dan desktop 1440×900: nol overflow horizontal.
- Tanpa JavaScript: galerinya tetap terender dan terbaca.
- Tidak ada klaim performa (`CLAUDE.md` #19).

### 8.7 Yang tidak dikerjakan, dengan alasan yang bertahan

- **`scroll-area` dan `slider`** — §5, dan angkanya sekarang dua, bukan tiga,
  yang menguatkan alasannya. Deret pratinjau tetap dibangun sebagai baris
  flex; `scroll-area` adalah satu baris yang dipasang kalau sebuah proyek
  nanti mengirim cukup banyak gambar untuk meluap.
- **Inersia saat dilempar** — butuh `InertiaPlugin` yang berbayar. Disebut di
  §8.3 sebagai satu-satunya hal yang `Draggable` benar-benar akan tambahkan.
- **Zoom bertingkat / cubit untuk memperbesar.** Satu langkah menjawab
  pertanyaan yang nyata ("perlihatkan bagian itu lebih dekat"); dua jari yang
  mengubah skala kontinu menjadikan penampil sebuah panel kontrol.
