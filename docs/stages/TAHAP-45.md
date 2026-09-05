# Tahap 45 — Material rute kedua, pipeline warna, dan pembersihan

> Dial yang dibelanjakan: **MOTION** (permukaan material mencapai rute ketiga).
> Tiga bagian yang tidak saling bergantung, dikerjakan berurutan karena hasil
> §2 menentukan apakah sebuah dependensi ikut dihapus di §3.

## 1. 45a — Material mencapai rute ketiga

`/en` menampilkan **pilihan** karya lewat permukaan material dan `/en/work`
menampilkan **semuanya** lewat permukaan yang sama. Halaman yang menampilkan
**satu** karya, pada ukuran terbesarnya, dan menahan pembaca paling lama,
justru punya versi paling datar dari material milik situs ini sendiri. Itu
terbalik.

**Kenapa morph kedatangannya aman tanpa kabel baru.** `vault/blocks/
project-card` menaikkan `released` pada COMMIT supaya kartu yang berangkat
menyerahkan pikselnya sebelum `<ViewTransition>` memotretnya. Ujung yang
**tiba** tidak butuh padanannya, dan itu properti `MaterialImage` bukan
keberuntungan: ia menyembunyikan gambar DOM hanya setelah `drew` benar —
laporan mesh sendiri bahwa ia sudah melukis. Pada saat view transition
memotret halaman ini, chunk scene-nya belum diambil, jadi `drew` masih salah,
plat polos terlihat, dan morph-nya mendarat di piksel nyata.

**Diverifikasi, bukan diasumsikan** — pola yang sama yang catatan
`MaterialImage` sendiri sebut sebagai sebab kegagalan Tahap 14:

| Keadaan        | `[data-material-shell]` | mesh hidup | `<canvas>` | opacity handover |
| -------------- | ----------------------: | ---------: | ---------: | ---------------: |
| normal         |                       1 |     **ya** |          1 |            **0** |
| reduced motion |                       1 |      tidak |      **0** |                1 |

Pengukuran pertama saya membaca `opacity` **elemen yang salah** — `<img>`,
yang memang 1 — dan sempat terbaca seperti gambar ganda. Handover-nya ada di
`.root`, yang stylesheet-nya sendiri jelaskan alasannya. Diukur ulang pada
elemen yang benar: `0`.

**Plafon anggaran dinaikkan dengan sengaja**, dan angkanya dipilih dengan
alasan: `/en/work/arus-balik` menjadi `allow: ['three', 'gsap']` pada 2100KB —
**angka yang sama** dengan dua rute yang sudah membawa permukaan ini, bukan
angka yang dipaskan ke rute ini. Tiga rute yang menggambar permukaan yang sama
dengan mesin yang sama harus menjawab satu angka, atau angkanya berhenti
berarti "berapa ongkos permukaan ini" dan mulai berarti "berapa berat halaman
ini pada hari ia diukur". `e2e/webgl-budget.e2e.ts` — nol mesin untuk ponsel
dan pembaca reduced-motion — tidak bergerak.

## 2. 45b — Pipeline warna diputuskan, dan jawabannya membalik dua tahap

Rencana: percobaan ketiga **hanya sah** kalau ia menyerang penyebabnya, dan
kalau gagal lagi, pass-nya dibuang beserta dependensinya.

**Hipotesis rencana itu sendiri saya koreksi lebih dulu.** Ia mengusulkan
mematikan `flat` R3F. `flat` adalah _tone mapping_, bukan ruang warna:
mematikannya **menambah** kurva fotografis dan akan mengubah warna lebih
jauh, bukan lebih dekat. Bacaan bukti yang benar menunjuk ke rantai
composer — `RenderPass` + `CopyPass`, dan `CopyPass` tidak melakukan konversi
keluaran sama sekali.

**Lalu pengukurannya membalik seluruh premis.** Diukur pada pita hero `/en`,
1440×900, halaman diam, selisih mutlak rata-rata per kanal terhadap halaman
yang sama tanpa composer:

| Percobaan        | Konfigurasi                           | Selisih saat diam |
| ---------------- | ------------------------------------- | ----------------: |
| Tahap 32         | grain, `HalfFloatType`                |          55,8/255 |
| Tahap 33         | dispersi, buffer default              |          58,7/255 |
| **Tahap 45**     | `RenderPass` + `CopyPass` apa adanya  |       **0,6/255** |
| Tahap 45 (ulang) | sama                                  |       **0,7/255** |
| Tahap 45         | `RenderPass` + `EffectPass` identitas |       **0,7/255** |

**Konfliknya tidak reproduce.**

**Dan sebelum angka itu dipercaya, rantainya dibuktikan hidup.** Sebuah probe
inversi dipasang sebagai efek: **74,1/255, 92,7% kanal bergerak**. Jadi
composer-nya benar-benar menggambar wilayah yang diukur — 0,6 bukan hasil
mengukur composer yang tidak jalan, yang merupakan cara paling mudah untuk
salah di sini.

**Yang tidak bisa saya klaim.** `postprocessing` dan `three` **tidak pernah
dinaikkan versinya** sejak fork (`git log -S` pada `package.json`: satu commit,
vendoring Satūs). Jadi saya tidak tahu mengapa angka Tahap 32/33 berbeda, dan
saya tidak mengukur kode itu — ia sudah tidak ada. Yang bisa dikatakan, dan
hanya itu: **pada konfigurasi yang berdiri hari ini, dengan rantai terbukti
hidup, komposit berada dalam 0,7/255 dari halaman tanpa composer.** Vonis
lama — "manajemen warna composer bertentangan dengan renderer ini" — tidak
berlaku untuk konfigurasi ini.

**Keputusannya.** Keberatan **teknis** hilang, jadi `postprocessing` tetap
ada dan komentar modulnya ditulis ulang dengan pengukuran baru menggantikan
vonis yang sudah basi. Yang **tidak** dilakukan: mengirim efek hanya karena
sekarang bisa. Rantai identitas adalah satu pass layar-penuh tiap frame untuk
nol perubahan, dan uji `taste-skill` — gerak harus punya motivasi — tidak
dipenuhi oleh "pipeline-nya ternyata bersih". Kosakata respons berkelanjutan
situs ini sudah berisi empat mekanisme setelah Tahap 43.

Nol rute menyalakannya, jadi pembaca mengunduh nol byte darinya. Yang tersisa
adalah pilihan **editorial** — efek apa yang pantas dapat satu pass
layar-penuh — dan itu milik studio, bukan milik saya.

## 3. 45c — Pembersihan, setelah daftarnya diukur ulang

Daftar Bagian F audit berumur sebelas tahap. Ia diukur ulang lebih dulu, dan
**ia sudah salah di beberapa tempat** — Tahap 42 memberi `marquee` rumah,
sehingga "sepuluh direktori mati" bukan lagi sepuluh.

**Dihapus** (nol konsumen, kode produk):

| Yang dihapus                                                               | Bukti                                                                            |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `alert-dialog`, `fold`, `menu`, `scrollbar`, `select`, `switch`, `tooltip` | 0 konsumen di luar direktorinya sendiri                                          |
| Seluruh tumpukan `components/ui/form` + `checkbox`                         | Nol `<form>` di situs; `checkbox` hanya dipakai `form/fields`                    |
| `lib/types/form.ts`, `lib/utils/form-action.ts` (+ tesnya)                 | Konsumen tunggalnya tumpukan di atas                                             |
| `parseFormData` dan `zodToValidator` di `validation.ts` (+ tesnya)         | Tiga konsumen, semuanya di dalam `components/ui/form`                            |
| `components/ui/toast` + pasangannya di layout                              | `ToastProvider` dipasang di **setiap** rute; `useToast()` dipanggil **nol** kali |
| `lib/hooks/use-prefetch.ts`                                                | Hanya di-re-export oleh `lib/hooks/index.ts`                                     |
| `lib/webgl/utils/blend.ts`                                                 | 0 referensi                                                                      |
| `components/ui/darkroom.svg`                                               | Wordmark perusahaan lain, sisa starter, 0 referensi JSX                          |
| `public/config/Satus-R3f.json`                                             | Sheet Theatre.js sisa starter                                                    |

**Dipertahankan, dan alasannya dicatat** — karena daftar audit menyebutnya
mati dan pengukuran ulang mengatakan tidak:

| Yang tetap                                 | Kenapa                                                                                                                                                                                                                |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/webgl/utils/fluid/`                   | Punya konsumen: `flowmap-provider` mengimpor `useFluidSim`                                                                                                                                                            |
| `columns()`                                | Dipakai `vault/blocks/project-spine` sejak Tahap 40                                                                                                                                                                   |
| `mobile-vh()` / `desktop-vh()` / `dr-grid` | Utilitas layer styling dengan dokumentasi **dan** tes regresi untuk bug nyata; membuangnya mengubah kontrak CSS tergenerasi tanpa manfaat bagi pembaca                                                                |
| `Draggable`                                | **Tidak ada yang bisa dihapus.** Nol impor; ia hanya muncul di komentar `components/ui/lightbox` yang menjelaskan mengapa ia _tidak_ dipakai. Keputusan jujur yang audit minta sudah tertulis di sana sejak Tahap 31. |

**Slug fixture basi.** Dua berkas story merender karya yang tidak ada
(`senja-ungu`, `lipat`) — diganti dengan `bacaan-mesin` dan `pelabuhan`.
Kemunculan `panas-sore`/`rimbun` lainnya adalah **contoh string URL** di
komentar dan unit test yang tidak menyentuh CMS; mengubahnya tidak
memperbaiki apa pun dan dicatat di sini alih-alih disentuh diam-diam. Komentar
`seed-fixtures.ts` yang menunjuk plat `ambang` diperbaiki: perannya pindah ke
`bacaan-mesin` di Tahap 13 dan komentarnya tidak ikut.

**Dokumen yang berbohong tentang kodenya.**

- `docs/ROADMAP.md` baris 3 berbunyi _"disetujui, belum dieksekusi. Tahap 0
  adalah pekerjaan berikutnya"_ — **empat puluh lima tahap** setelah itu
  berhenti benar.
- `lib/features/README.md` dan `components/layout/wrapper` keduanya masih
  mendokumentasikan strategi canvas-bersama dan menginstruksikan pembaca
  **jangan** mengoper `webgl` ke `Wrapper` — yang justru apa yang tiga rute
  lakukan, dengan benar.
- `vault/webgl/scene-shell` menulis peringatannya dalam bentuk perintah untuk
  masa depan padahal keputusannya sudah diambil di Tahap 21.

Ketiganya diperbaiki dengan menyebut strategi yang **benar-benar berlaku**,
dan mempertahankan aturan yang membuat pilihan itu ("satu strategi, jangan
dua") sebagai alasan, bukan sebagai instruksi yang bertentangan dengan kode.

## 4. Hasil

### 4.1 Gerbang

```
bun run build            ✅
bun run build-storybook  ✅  (exit 0)
bun run check            ✅  oxlint · oxfmt · tsc · unit 410 lulus, 0 gagal ·
                             plugin anti-slop · manifest · assets
CI=true bun run test:e2e ✅  530 lulus, 0 gagal, 0 flaky, 14 dilewati (12,4 menit)
```

**Kedua angka itu turun, dan penurunannya terhitung habis.**

_Unit 458 → 410 (−48)._ Semuanya tes untuk kode yang dihapus:
`parseFormData`, `zodToValidator`, dan `form-action`.

_e2e 547 lulus + 16 dilewati = 563 → 530 lulus + 14 dilewati = 544, jadi −19
total._ Storybook a11y menghitung per story, dan enam berkas story hilang
bersama direktorinya: **99 story → 80**. Sembilan belas tepat; dua di antaranya
memang sudah dalam daftar "dilewati", yang menjelaskan mengapa yang lulus turun
17 dan yang dilewati turun 2.

Nol gerbang dilonggarkan atau dilewati. Satu plafon **dinaikkan dengan
sengaja**, di §1, dengan angka dan alasannya di berkas gerbangnya sendiri.

### 4.2 Yang tidak berjalan seperti yang saya kira

- **Hipotesis rencana untuk §2 salah**, dan saya mengoreksinya sebelum
  mengukur: `flat` adalah tone mapping, bukan ruang warna.
- **Lalu pengukurannya membalik premisnya sendiri.** Konflik warna yang dua
  tahap catat tidak reproduce: **0,6/255** terhadap 55,8 dan 58,7.
- **Pengukuran pertama saya untuk §1 membaca elemen yang salah** dan sempat
  terbaca seperti gambar ganda. Handover ada di `.root`, bukan `<img>`.
- **Daftar Bagian F audit sudah salah di beberapa tempat**, dan mengukurnya
  ulang lebih dulu adalah yang mencegah tiga penghapusan yang keliru:
  `fluid/`, `columns()`, dan `dr-grid`/`mobile-vh()` semuanya masih punya
  alasan untuk ada.
- **`Draggable` tidak butuh keputusan.** Audit memintanya; ia sudah tertulis
  di `components/ui/lightbox` sejak Tahap 31, lengkap dengan pengukurannya.

### 4.3 Yang tidak diukur, dan dikatakan

Tidak ada profiler browser di lingkungan ini, jadi **tidak ada klaim biaya
frame** untuk permukaan material di rute ketiga. Yang diukur: apakah mesh
benar-benar melukis (`[data-material]` + opacity handover), apakah jalur
reduced-motion tetap nol mesin dan nol kanvas, berat rute lewat gerbang
anggarannya sendiri, dan selisih warna composer lewat instrumen yang sama
yang dipakai Tahap 32 dan 33.

### 4.4 Yang tetap terbuka

- **Efek untuk composer-nya** — pilihan editorial, bukan teknis lagi. §2.
- 404 tanpa JavaScript masih merender 28 karakter (`TAHAP-38.md` §7.4).
- Story untuk `vault/motion/flip`, `vault/blocks/project-spine`, dan bentuk
  baru `vault/primitives/cursor` — Tahap 46.
