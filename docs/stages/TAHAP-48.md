# Tahap 48 — `arth-curtain`: entrance yang tidak menunda siapa pun

> Permintaan preloading, dalam bentuk yang tidak melanggar keberatan yang
> sudah tercatat. Rencana lama menolak preloader dengan satu kalimat —
> _"Menunda isi demi animasi memuat"_ — dan keberatan itu benar. Yang salah
> adalah menyimpulkan dari sana bahwa entrance tidak boleh ada.

## 1. Apa yang sebenarnya ditolak, dan apa yang tidak

Keberatannya spesifik: **penghitung persen dan penundaan buatan**. Sebuah
situs prerender selesai dalam ratusan milidetik, jadi progres yang jujur akan
melompat 0 → 100 dan tidak terlihat; supaya terlihat ia harus ditahan, dan
menahan isi supaya animasi muat sempat ditonton adalah menukar waktu pembaca
dengan penampilan.

Yang **tidak** ditolak adalah tirai yang mengangkat isi yang sudah ada di
belakangnya. Bedanya bisa diuji, bukan soal selera:

|                       | Preloader                    | Tirai ini                      |
| --------------------- | ---------------------------- | ------------------------------ |
| Isi dirender kapan    | setelah loader selesai       | **sebelum tirai muncul**       |
| Tanpa JavaScript      | menyandera halaman selamanya | **tidak dirender sama sekali** |
| Kalau font gagal muat | menggantung                  | **ada plafon keras**           |
| Angka progres         | ada, biasanya palsu          | **tidak ada**                  |

## 2. Tiga koreksi terhadap rencana, dan alasannya

### 2.1 Durasi angkat: 800ms → **400ms**

Rencana meminta `--duration-slow` (800ms) dengan `--ease-out-expo`.
Diperiksa terhadap kode yang sudah ada:
`vault/motion/page-transition/page-transition.module.css` menganimasikan
**gerakan yang persis sama** — satu panel setinggi viewport yang
`translateY(-100%)` keluar lewat tepi atas — dan ia memakai `var(--duration)`
(400ms) dengan `--ease-out-expo`.

Mengirim 800ms berarti satu gerakan fisik yang sama punya dua durasi di satu
situs. `CLAUDE.md` menyebut satu standar yang penting, dan itu **restraint
applied consistently**; dua durasi untuk satu gerakan adalah kebalikannya.
Kurvanya tetap `--ease-out-expo`, karena itu memang kurva yang dipakai
saudaranya.

### 2.2 Reduced motion: "tidak dirender" → **tidak pernah dicat**

Rencana menulis tirai "tidak pernah dirender sama sekali" di bawah
`prefers-reduced-motion`. Itu tidak bisa dikerjakan di server: preferensi gerak
tidak ada dalam header permintaan, jadi HTML pertama harus dikirim tanpa
mengetahuinya. Satu-satunya cara "tidak dirender" adalah memutuskannya setelah
hidrasi, yang berarti tirai **berkedip lebih dulu** untuk pembaca yang justru
meminta tidak ada gerak — hasil yang lebih buruk dari yang hendak dihindari.

Jadi node-nya ada di DOM dan `display: none` di bawah `@media
(--reduced-motion)`. Ia tidak pernah dicat, tidak pernah bergerak, dan tidak
pernah menutupi apa pun. Gerbangnya menuntut **tidak terlihat**, bukan tidak
ada, dan perbedaan itu ditulis di gerbangnya supaya tidak terbaca sebagai
kelonggaran.

### 2.3 Akselerator `fonts.ready` **dibuang**, dan ini koreksi terhadap koreksi saya sendiri

Rencana menyerahkan pengangkatan ke JavaScript dengan plafon 900ms. Draf
pertama tahap ini membaliknya jadi "CSS mengangkat, JavaScript mempercepat".
Yang dikirim membuang akseleratornya sama sekali. Tiga alasan, dan yang kedua
adalah cacat nyata bukan preferensi:

1. **Rusak tanpa JavaScript.** Tirai yang diangkat skrip, di peramban tanpa
   skrip, adalah halaman yang tidak pernah muncul. Ini kegagalan paling mahal
   yang mungkin dari komponen ini, dan karenanya asersi pertama di gerbangnya.

2. **Membatalkan animasi yang sedang berjalan bisa menyentak.** Kalau
   `fonts.ready` selesai _setelah_ animasi CSS sudah mengangkat panel,
   mengganti `animation` dengan `transition` mengembalikan panel ke posisi
   awalnya lalu mengangkatnya untuk kedua kalinya. Panel jatuh, lalu naik
   lagi. Menukar cacat itu dengan beberapa ratus milidetik bukan tukaran yang
   masuk akal.

3. **Entrance yang panjangnya berubah-ubah memberi tahu pembaca bahwa situs
   ini lambat hari ini.** Itu kebalikan dari gunanya. Tirai yang cepat di
   koneksi bagus dan lambat di koneksi buruk adalah progress bar yang menyamar.

Jadi seluruhnya CSS dengan waktu tetap:

```css
animation: curtain-lift var(--duration) var(--ease-out-expo)
  calc(var(--duration) + var(--duration-fast)) forwards;
```

Nol JavaScript di jalur visual. `<noscript><style>` menyembunyikannya
sepenuhnya kalau skrip mati — pola yang `components/ui/command/index.tsx:106`
sudah pakai untuk masalah yang sama, dan lebih andal daripada
`@media (scripting: none)` yang belum universal.

**Node-nya juga dilepas tanpa JavaScript.** Keyframe terakhir menyetel
`visibility: hidden`, ditahan `visible` sampai 99% supaya flip diskritnya
jatuh di ujung dan bukan di tengah penerbangan. Itu menjatuhkan lapisan
compositor tanpa satu baris kode klien untuk menghapus elemennya.

## 3. Koreografi, konkret

| Beat            | Gerak                        | Durasi                                           | Kurva              |
| --------------- | ---------------------------- | ------------------------------------------------ | ------------------ |
| Tahan           | —                            | `--duration` (400ms)                             | —                  |
| Wordmark keluar | `transform` naik keluar mask | `--duration-fast` (200ms)                        | `--ease-out-quart` |
| Panel naik      | `translate3d(0,-100%,0)`     | `--duration` (400ms), tertunda `--duration-fast` | `--ease-out-expo`  |

**Tetap 1000ms, setiap kali.** Bukan plafon terburuk — angka pastinya, karena
tidak ada jalur cepat (§2.3). Determinisme itu fiturnya, bukan kompromi.

> **Dikoreksi di Tahap 49.** Baris ini semula `opacity` 1 → 0, dan itu cacat
> nyata: `color-contrast` axe membaca teks yang **dirender**, jadi sapuan yang
> mendarat di dalam jendela fade 200ms mengukur tipe setengah transparan di
> atas panel dan melaporkan pelanggaran serius. Terukur pada 404: 150ms
> bersih, **250ms kotor**, 400ms bersih. Ia muncul sebagai satu kegagalan
> intermiten — bentuk cacat yang paling buruk, karena suite yang gagal
> sesekali mengajari orang untuk menjalankannya ulang. Transform tidak punya
> jendela itu sama sekali. `docs/stages/TAHAP-49.md` §6.

**Wordmark pergi lebih dulu, dan itu seluruh isinya.** Panel mengangkat ruang
kosong, bukan mengangkat logo. Sebuah `<div>` hitam yang naik membawa tulisan
di tengahnya terbaca sebagai elemen yang bergeser; panel yang sudah kosong
saat mulai naik terbaca sebagai tirai. Selisih 200ms itu satu-satunya hal yang
membedakan keduanya.

**Nol penghitung, nol penundaan buatan.** Isi sudah dicat di belakangnya
sebelum tirai muncul, dan tirai pergi apa pun yang terjadi pada font, jaringan,
atau JavaScript.

**Sekali per sesi.** Skrip inline sebelum panel membaca `sessionStorage` dan
menandai `<html>` sebelum cat pertama — pola no-flash yang biasa. `script-src`
proyek ini membawa `'unsafe-inline'` sebagai kebijakan dasar tertulis
(`lib/integrations/csp.ts`), jadi ini tidak menambah lubang baru.

**Nol tumpang tindih dengan `page-transition`.** Tirai hanya pada pemuatan
penuh; navigasi antar rute tetap milik overlay yang sudah ada. Digerbangi,
bukan diasumsikan.

## 4. Gerbang: `e2e/entrance.e2e.ts`

| Asersi                                                           | Kenapa ia ada                                                         |
| ---------------------------------------------------------------- | --------------------------------------------------------------------- |
| Tanpa JavaScript, nol elemen menutupi `<h1>`                     | Kegagalan paling mahal dari fitur ini                                 |
| Di bawah reduced motion tirai tidak terlihat                     | §2.2                                                                  |
| Tirai lepas dari viewport dalam ≤1200ms                          | Plafon §3, diukur bukan diasumsikan                                   |
| **LCP tidak mundur** terhadap baseline yang diukur di tahap ini  | Lihat di bawah                                                        |
| Nol frame di mana tirai dan `page-transition` sama-sama terlihat | §3                                                                    |
| Wordmark tirai lulus kontras                                     | Ia teks yang benar-benar terlihat; `aria-hidden` tidak membebaskannya |

**LCP diukur, bukan diperkirakan.** `CLAUDE.md` #19 melarang mengklaim angka
performa yang tidak diukur — dan `PerformanceObserver` di dalam Chromium yang
Playwright jalankan **adalah** pengukuran, bukan perkiraan. Baseline diambil
dari `HEAD` sebelum tahap ini, di build produksi, dan ditulis di §Hasil.

**Dibuktikan merah dulu, dan hasilnya bukan yang saya duga.** Dugaan saya
"empat dari enam tidak punya subjek". Diukur terhadap build sebelum tirai ada:
**2 gagal, 3 lulus** dari lima asersi.

Ketiga yang lulus lulus karena situs hari ini memang tidak melanggarnya — nol
elemen menutupi `<h1>` tanpa JavaScript, LCP jauh di bawah plafon, dan tidak
ada tirai untuk tumpang tindih dengan overlay. Itu membuatnya **penjaga
regresi, bukan pendeteksi fitur**, dan itu justru pekerjaan yang lebih
berharga: ketiganya harus tetap hijau setelah tirai ada, dan ketiganya persis
yang akan merah kalau tirai dibangun salah.

Asersi kontras wordmark tidak ditulis sebagai tes terpisah: `contrast.test.ts`
sudah mengukur pasangan `primary`/`secondary` di kedua tema, dan itu pasangan
yang dipakai panel ini. Menulis asersi keenam yang mengukur ulang hal yang
sama adalah menambah angka hijau, bukan menambah jaminan.

## 5. Hasil

### 5.1 Gerbang dibuktikan merah, dan dugaan saya salah

Dugaan di §4: "empat dari enam asersi tidak punya subjek". Diukur terhadap
build sebelum tirai ada — **2 gagal, 3 lulus** dari lima.

```
✘ reduced motion leaves no curtain visible        no curtain element to check at all
✘ the curtain leaves the viewport inside ceiling  no curtain element to time
✓ without JavaScript nothing covers the headline
✓ the content still paints early
✓ curtain and route overlay never both on screen
```

Ketiga yang lulus itu **penjaga regresi, bukan pendeteksi fitur**, dan itu
pekerjaan yang lebih berharga: ketiganya persis yang akan merah kalau tirai
dibangun salah. Setelah tirai dipasang: **5 lulus, 0 gagal.**

### 5.2 LCP — diukur dua kali, dan dibaca hati-hati

Median dari 5 jalan per rute, build produksi, Chromium yang Playwright
jalankan, `PerformanceObserver` entri `largest-contentful-paint`.

| Rute          | Sebelum | Sesudah | Selisih | Rentang sampelnya sendiri |
| ------------- | ------: | ------: | ------: | ------------------------- |
| `/en`         |     168 |     164 |  **−4** | 152–216 → 148–172         |
| `/id`         |     156 |     184 | **+28** | 144–168 → 164–188         |
| `/en/work`    |     272 |     288 |     +16 | 192–392 → 188–488         |
| `/en/studio`  |     172 |     168 |      −4 | 148–184 → 156–184         |
| `/en/journal` |     208 |     200 |      −8 | 200–216 → 172–232         |

**Empat dari lima bergerak jauh di dalam derau run-to-run mereka sendiri.**
`/en/work` berayun 192–392ms sebelum tahap ini menyentuh apa pun; selisih
median 16ms di dalam rentang 200ms tidak mengukur apa-apa.

**`/id` adalah satu-satunya yang perlu disebut, bukan dibulatkan.** Selisih
28ms sedikit melampaui rentangnya sendiri (24ms), dan rentang sebelum
(144–168) dengan sesudah (164–188) nyaris tidak bertumpang tindih. Dengan n=5
saya **tidak bisa** memisahkannya dari derau dengan yakin. Yang bisa dikatakan:
kalau itu nyata, besarnya 28ms pada baseline 156ms, dan itu bukan regresi yang
berarti — tapi ia juga bukan nol, dan menulisnya sebagai "tidak ada perubahan"
akan jadi klaim yang lebih rapi daripada datanya.

Kesimpulan yang bisa dipertanggungjawabkan: **tirai tidak menggeser LCP secara
terukur pada empat rute, dan pada rute kelima selisihnya di bawah 30ms dan
tidak bisa dipisahkan dari derau.**

### 5.3 Verifikasi

```
bun run check        lulus — unit 421 lulus
bun run build        lulus
build-storybook      lulus — 99 story menjadi 101, tepat +2
CI=true test:e2e     560 lulus, 0 gagal, 0 flaky, 15 dilewati (13,0m)
```

**e2e 548 → 555 → 560, dan tiap loncatannya punya sebabnya.**

| Dari |  Ke | Selisih | Sebab                                                                     |
| ---: | --: | ------: | ------------------------------------------------------------------------- |
|  548 | 555 |      +7 | 5 asersi `entrance.e2e.ts` (desktop) + 2 story `Curtain` masuk sapuan axe |
|  555 | 560 |      +5 | `entrance.e2e.ts` ditambahkan ke proyek **mobile**                        |

Entri mobile itu bukan basa-basi. Asersi pertama gerbang ini membaca tumpukan
elemen **di titik pusat `<h1>`**, dan titik itu ada di tempat lain pada
telepon: header memakan proporsi layar yang lebih besar dan judulnya duduk
lebih rendah. Memeriksa satu lebar berarti memeriksa satu dari dua tempat
komponen ini bisa salah. Tiap entri di daftar putih mobile
`playwright.config.ts` membawa alasan tertulis; ini alasannya.

### 5.4 Yang tidak dikerjakan, dan itu disengaja

- **Akselerator `document.fonts.ready` dibuang** — §2.3. Nol JavaScript di
  jalur visual, dan itu perbaikan bukan pengurangan.
- **Asersi kontras wordmark tidak ditulis.** `contrast.test.ts` sudah mengukur
  pasangan `primary`/`secondary` di kedua tema, dan itu pasangan yang dipakai
  panel ini. Asersi keenam yang mengukur ulang hal yang sama menambah angka
  hijau, bukan jaminan.
- **Nol pengukuran biaya compositor.** Tidak ada profiler di sini
  (`CLAUDE.md` #19). Yang bisa dikatakan hanya bentuknya: satu elemen `fixed`,
  dua keyframe, `visibility: hidden` di ujung supaya lapisannya dijatuhkan
  tanpa kode klien.
