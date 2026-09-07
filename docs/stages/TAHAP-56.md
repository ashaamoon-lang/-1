# Tahap 56 — Lima layar yang tidak melakukan apa-apa di antara dua kedatangan

> Cacat ketiga yang disebut pemilik repo, dan satu-satunya yang belum selesai:
> _"animasinya juga tidak sebanyak dan seluas yang saya harapkan… saya harap
> kamu membuat ANIMASI scroll yang nyaman dilakukan menggunakan **Magic UI**"_,
> khususnya pada **folder routing yang berat dan besar**.
>
> Tahap 54 sudah menjawab separuhnya — `useReveal` mendapat mode `perItem`,
> jadi enam sampul katalog berhenti menjadi satu kedatangan. Dokumen ini
> mengukur apa yang tersisa sesudah itu, dan ternyata masalahnya bergeser:
> bukan lagi "kedatangannya terlalu sedikit" melainkan **"di antara dua
> kedatangan tidak ada apa-apa"**.

## 1. Sensus, sesudah Tahap 54

Build produksi, 1440×900, dua belas langkah gulir per rute, menghitung
`[data-reveal-item="visible"]` yang bertambah di tiap langkah:

| rute                 | layar | blok | item | terlihat saat dimuat | langkah dengan kedatangan | kedatangan |
| -------------------- | ----: | ---: | ---: | -------------------: | ------------------------: | ---------: |
| `/en`                |  11,0 |    8 |   18 |                    1 |                  **4**/12 |          6 |
| `/en/studio`         |   6,3 |    7 |   20 |                    2 |                  **5**/12 |          5 |
| `/en/work`           |   5,0 |    2 |    8 |                    3 |                  **2**/12 |          4 |
| `/en/work/<slug>`    |   4,7 |    3 |    5 |                    1 |                  **2**/12 |          2 |
| `/en/journal`        |   3,4 |    2 |    4 |                    2 |                  **2**/12 |          2 |
| `/en/journal/<slug>` |   4,2 |    4 |    8 |                    2 |                  **2**/12 |          2 |
| `/en/practice/<v>`   |   3,4 |    5 |    9 |                    1 |                  **4**/12 |          5 |

Dua rute yang pemilik repo sebut "berat dan besar" — `/en/work` (lima layar)
dan `/en/work/<slug>` (4,7 layar) — punya kedatangan hanya di **dua dari dua
belas** langkah. Sepuluh langkah sisanya adalah gulir mati.

## 2. Kenapa menambah kedatangan bukan jawabannya

`/en/work` punya delapan hal yang bisa datang: masthead, kontrol filter, dan
enam sampul. Itu saja isinya. Menaruh lebih banyak pemicu pada delapan benda
yang sama tidak membuat lima layar hidup; ia hanya membuat delapan benda
berkedip lebih sering.

Yang kurang adalah **perilaku yang berlangsung selama benda itu melintas**,
bukan satu kejadian saat ia masuk. Sampul di katalog ini sudah punya parallax
±3% (`vault/motion/parallax`) dan regangan `--scroll-velocity` — keduanya
kategori ketiga (`MOTION-SPEC.md` §0), keduanya benar, dan keduanya terlalu
kecil untuk terbaca sebagai gerakan.

## 3. Magic UI: `pixel-image`, dibaca dari sumbernya

Diunduh dari `https://magicui.design/r/pixel-image.json` (HTTP 200) dan
dibaca, bukan diingat.

**Tekniknya berharga dan mengejutkan sederhana**: N buah `<div>` bertumpuk,
masing-masing membawa salinan `<img>` yang sama dan satu `clip-path` polygon
**statis** untuk satu sel kisi. Yang dianimasikan hanya `opacity`, ditunda
per sel. Jadi ia **tidak** melanggar `CLAUDE.md` #4 — `clip-path`-nya tidak
pernah bergerak.

**Yang harus diperbaiki sebelum ia boleh ada di sini**, dan tiap satunya
adalah aturan keras:

| di sumbernya                                | kenapa tidak boleh                                               |
| ------------------------------------------- | ---------------------------------------------------------------- |
| `transition-all`                            | #4 — mentransisikan properti apa pun yang berubah                |
| `ease-out` telanjang                        | #2 — kurva bawaan, bukan token                                   |
| `1000` / `1200` / `1300` ms                 | #3/#8 — durasi literal                                           |
| `Math.random()` untuk delay                 | SSR: server dan klien menghasilkan angka berbeda → hidrasi pecah |
| `rounded-[2.5rem]`, `h-72 w-72 md:h-96`     | #8 + §0.5 — nilai arbitrer, dan skala Tailwind tidak ada di sini |
| `alt="Pixel image piece N"` × 24            | 24 gambar bernama di pohon aksesibilitas untuk satu gambar       |
| `grayscaleAnimation` (`filter: grayscale`)  | #4 — `filter` bukan properti yang boleh dianimasikan             |
| `useEffect` + `setTimeout`, main saat mount | tidak ada jalur reduced-motion; isi bisa terdampar               |

Jadi: **kode disalin, lalu delapan hal diubah.** `vault/magic/README.md`
mencatat pembedaannya, seperti yang sudah ia lakukan untuk `noise-texture`.

## 4. Yang dibangun

**56a — `vault/magic/pixel-image`, dengan lapisannya dibalik.**

Yang diambil dari Magic UI adalah gagasannya: kisi ubin yang `clip-path`-nya
**statis**, sehingga hanya `opacity` yang bergerak. Yang tidak ikut adalah
bentuknya. Upstream menumpuk satu salinan `<img>` per ubin — 24 gambar
bernama di pohon aksesibilitas untuk satu foto, dan 24 `srcset` terpisah
kalau dipasang di `next/image`.

Jadi di sini lapisannya dibalik: gambar aslinya dirender **sekali**, normal,
dengan `alt`-nya sendiri, dan yang komponen ini render adalah **kerudung ubin
berwarna latar di atasnya** — kedatangannya adalah ubin-ubin itu pergi. Efek
yang sama, satu gambar, satu `alt`, nol duplikasi. Itu membuat baris
provenance-nya **"kode disalin: tidak"**, sama seperti `dot-pattern`.

Pemicunya kontrak reveal milik situs ini sendiri (`lib/hooks/use-reveal.ts`),
bukan `setTimeout`: nol observer baru, nol timer, nol loop frame. Di bawah
`prefers-reduced-motion` kerudungnya **tidak dirender sama sekali** — bukan
"dibuka seketika": tidak ada.

**56b — dipasang di `vault/blocks/project-gallery`, bukan di hero.**

Ini keputusan yang perlu ditulis alasannya. Plate hero di `/work/<slug>`
adalah **ujung pendaratan morph `work-transport`**. Kalau ia tertutup ubin
pada saat `<ViewTransition>` memotret halaman baru, morph-nya mendarat di
sepetak warna latar alih-alih di gambar — merusak satu momen bernama yang
punya gerbangnya sendiri. Galeri di bawahnya tidak punya view transition,
dan justru di sanalah sensus menemukan gulir matinya.

**56c — galeri mendapat `perItem`.** Satu `useReveal` pada `<ul>`-nya berarti
satu kejadian untuk semua plate di bawahnya, jadi seluruh galeri sudah tiba
sebelum pembaca sampai ke gambar kedua. `perItem` adalah mode yang Tahap 54
bangun persis untuk bentuk ini.

## 5. Hasil

### 5.1 Sensus sesudah

| rute              | langkah dengan kedatangan | sebelum |
| ----------------- | ------------------------: | ------: |
| `/en/work/<slug>` |                  **3**/12 |    2/12 |

**Dan itu jujurnya sedikit.** Penyebabnya bukan mekanismenya melainkan
isinya: proyek fixture `arus-balik` hanya punya **dua** plate galeri (diukur:
48 ubin = 2 × 24). Satu kedatangan per plate berarti dua kedatangan, dan
angka sensusnya tidak bisa naik lebih tinggi dari jumlah bendanya.

Yang berubah banyak adalah **kualitas** kedatangannya, bukan jumlahnya, dan
itu terlihat: plate menyusun dirinya dari blok alih-alih memudar. Tangkapan
layar mid-dissolve dan sesudahnya ada di §5.2.

Ini juga menegaskan batas yang sudah tercatat di rencana: **karya fixture
tetap karya fixture.** Halaman proyek dengan enam plate akan memberi enam
kedatangan dari mekanisme yang sama, tanpa satu baris kode tambahan.

### 5.2 Diverifikasi dengan mata, bukan hanya dengan gerbang

Build produksi, 1440×900, `/en/work/arus-balik` digulir sampai plate pertama
melewati garis reveal:

- **Mid-dissolve** — kisi 6×4 terbaca jelas, ubin pada opacity berbeda-beda,
  gambar menembus di antaranya. Tidak ada satu pun ubin yang "menempel".
- **Sesudah** — plate utuh, **nol jahitan sisa**, nol ubin tertinggal.

### 5.3 Gerbang

`vendor-rules`, `motion-rules`, `token-rules`, `taste-rules`, `scale-rules`:
**60 lulus, 0 gagal**. `typecheck`, `oxlint --max-warnings=0`, dan
`manifest:check` bersih.

## 6. CI, dan dua gerbang yang menuntut jaringan sunyi

Run 18 di GitHub: **613 lulus, 1 gagal, 3 flaky, 15 dilewati** (19,0 menit).

Satu kegagalan kerasnya bukan dari kode tahap ini:
`material-layer › repeated mounts do not grow GPU memory`, **timeout 90 detik**
pada `page.goto('/en', { waitUntil: 'networkidle' })`, dua kali. Tes yang sama,
dengan anggaran yang sama, **lulus di run 17** pada commit sebelumnya — dan
tahap ini tidak menyentuh `/en`. Jadi ia bukan cacat melainkan runner yang
lebih lambat, dan menaikkan anggarannya lagi hanya memindahkan angka yang harus
dikalahkan runner berikutnya.

Sebabnya nyata: tes itu mengunjungi `/en` — sebelas layar, satu kanvas WebGL,
seluruh sampul katalog — **empat kali dalam satu tes**, dan menunggu jaringan
sunyi tiap kali. `networkidle` dibayar sekali per tes sekarang (kunjungan
pertama, yang memanaskan cache tekstur); tiga kunjungan berikutnya memakai
`load`, dan langkah `/en/ai` di antaranya — halaman teks yang tugasnya hanya
menurunkan kanvas dari layar — memakai `domcontentloaded`. Diukur setelah
perubahan: tes itu selesai dalam **13,0 detik**.

Tiga yang flaky lulus di percobaan ulang, tapi satu di antaranya membawa cacat
pengukuran yang nyata dan diperbaiki:
`lightbox › the picture fits the stage` melaporkan
`Expected: < 0.02  Received: NaN`. `naturalWidth / naturalHeight` adalah
`0 / 0` pada gambar yang belum ter-decode, jadi assertion letterbox-nya
mengukur bentuk gambar yang belum punya bentuk. Sekarang ia menunggu
`img.complete && img.naturalWidth > 0` lebih dulu.

## 7. Yang diukur untuk tahap berikutnya, dan belum dikerjakan

`/en/work` tetap 2/12. Lapisan kontinu yang seharusnya menghidupkan lima
layarnya **ada dan bekerja** — dan terlalu kecil untuk terlihat. Diukur, 25
sampel menuruni halaman, `translateY` lapisan parallax pada sampul pertama:

```
12,0  9,1  6,0  3,0  0,0  -2,9  -6,0  -9,0  -12,0  -15,0
```

**Total perjalanan 30,31px** — sekitar 3px per 90px gulir, pada plate setinggi
~700px. Itu 1,7% dari perjalanan plate itu sendiri, jauh di bawah ambang
seseorang menyadarinya. Menaikkannya bukan mengubah satu angka:
`vault/motion/parallax` bawaannya ±3% dan `.parallax` diberi ukuran 106%
justru untuk menutupi perjalanan itu, jadi keduanya harus naik bersama atau
tepi frame akan menunjukkan latar di ujung-ujungnya.
