# Tahap 18 — Selesaikan pandangan, lalu jadikan gate

> Pendalaman wajib atas `docs/ROADMAP.md` §3.0. Tidak ada kode sebelum dokumen
> ini ada.

Status: **spec**. Hasil diisi di §9.

---

## 1. Kenapa tahap ini

Tahap 17 menemukan bahwa layar pertama situs ini adalah persegi hitam rata, dan
aksennya sendiri yang membuatnya begitu: mean luminansi **4.0/255 dengan canvas
lawan 15.5 tanpanya**. Sebabnya satu kata warisan fork — `linear` pada
`<Canvas>` R3F. Diperbaiki dan terukur: 30.2 mean, rentang gradien 13.9.

Tiga hal tertinggal dari tahap itu, dan ketiganya alasan tahap ini ada.

**1.1 Auditnya sengaja berhenti setengah jalan.** Baru `/en` yang benar-benar
dirender lalu dipandangi. Sisanya baru lewat gerbang otomatis, dan itu
dinyatakan di Tahap 17 §6 justru supaya tidak dianggap selesai.

**1.2 Saya mencabut flag render global dan belum melihat efeknya di luar
beranda.** `linear` memengaruhi **setiap** shader kustom, bukan hanya hero.
`e2e/material-layer.e2e.ts` hijau — tapi hijau bukan "sudah dilihat", dan itu
persis pelajaran yang dibayar tahap kemarin.

**1.3 Tidak satu pun gate di repositori ini pernah melihat piksel.** Itu
sebabnya cacat hero bertahan enam belas tahap dengan semua gerbang hijau.
`e2e/image-resolution.e2e.ts` mendekode bitmap **aset**, bukan halaman
terkomposit. Selama tidak ada yang mengukur apa yang benar-benar tergambar,
cacat kelas ini akan lolos lagi.

---

## 2. Ritual `ui-ux-pro-max` — hasilnya, termasuk yang nol

Dijalankan sesuai §2.1, ditempel apa adanya.

| Query                          | Hasil                                          |
| ------------------------------ | ---------------------------------------------- |
| `"cursor" --domain ux`         | **0 hasil**                                    |
| `"scrollbar" --domain ux`      | **0 hasil** (closest known term: `scroll`)     |
| `"hover feedback" --domain ux` | 3 hasil                                        |
| `"scroll" --domain ux`         | 3 hasil, tak satu pun tentang scrollbar kustom |

**Basis data tidak punya satu baris pun tentang kursor kustom maupun scrollbar
kustom.** Sesuai §2.1 aturan 2, itu dinyatakan terus terang: keputusan §5
**bukan** berbasis basis data skill.

Dan yang ada di sana justru berbicara **melawan** kursor kustom, dua kali:

> **Hover States** · Do: _"Change cursor and add subtle visual change"_
> **Hover vs Tap** · Don't: _"Rely only on hover for important actions"_ —
> severity **High**

Baris pertama memperlakukan kursor sistem sebagai alat afordansi, bukan
permukaan yang boleh diganti. Baris kedua mengikat: apa pun yang dipasang tidak
boleh jadi satu-satunya penanda bahwa sesuatu bisa ditekan. Keduanya masuk
syarat di §5.

---

## 3. Tahap 18a — selesaikan pandangan

Render, ukur, **pandangi**. Ketiganya, bukan salah satunya.

| Rute                     | Perhatian khusus                             |
| ------------------------ | -------------------------------------------- |
| `/en/work`               | Grid katalog, ritme kartu                    |
| `/en/work/<slug>`        | **Plat material setelah `linear` dicabut**   |
| `/en/practice/<3 nilai>` | Hero praktik, scrub `ProgressText`           |
| `/en/ai`                 | Permukaan AEO, nol dekorasi                  |
| `/id`, `/id/work/<slug>` | Kliping headline pernah jadi cacat (Tahap 7) |
| `/en`                    | Verifikasi hero pasca-perbaikan              |

Dua viewport: 1280×800 dan 390×844. Instrumen sama seperti Tahap 17 — `sharp`,
min/p05/mean/p95/max, plus simpangan baku petak 96×96 sebagai proksi grain.
`sharp` **sudah terdeklarasi di `package.json`**; tidak ada dependensi baru.

---

## 4. Tahap 18b — jadikan melihat sebuah gate

`e2e/visual-substance.e2e.ts`. **Dua asersi, keduanya kontrak, bukan
heuristik.** Heuristik "tiap halaman harus punya kontras" akan rapuh dan gagal
pada seksi yang memang sengaja rata — dan gate yang gagal pada desain yang
benar akan dimatikan orang, yang lebih buruk daripada tidak ada gate.

**4.1 Dekorasi tidak boleh menggelapkan.** Untuk tiap wilayah beraksen yang
dideklarasikan: luminansi rata-rata **dengan** canvas ≥ **tanpa** canvas. Itu
persis cacat yang terkirim, ditulis sebagai invarian. Karena ia membandingkan
halaman dengan dirinya sendiri, ia tidak bisa rapuh lintas mesin atau lintas
GPU.

**4.2 Wilayah yang dijanjikan bertone harus punya tone.** Ditandai atribut,
mengikuti idiom `data-material-shell` dari Tahap 14a: identitas terpisah dari
keadaan, supaya penanda tidak hilang justru ketika ia bekerja. Rentang
luminansi p05–p95 di atas ambang, dan ambangnya diturunkan dari angka terukur
lalu **ditulis di gate-nya**: 2.0 sebelum perbaikan, 13.9 sesudah.

Dibuktikan merah dengan mengembalikan `linear` sementara. Dua viewport.

---

## 5. Tahap 18c — pasang yang memang layak

Sebelas komponen `components/ui/*` nol pemakai. Dinilai satu per satu.

**5.1 `vault/primitives/cursor`.** Bukan spekulasi: `data-cursor` **sudah
dideklarasikan di tiga tempat** — `vault/blocks/next-project`,
`next-practice`, dan `project-card`. Kosakatanya dibangun, komponennya tidak
pernah dipasang.

Satu hambatan nyata dan terukur: ia mengimpor `gsap` dan `@gsap/react`,
sementara `e2e/route-budget.e2e.ts` hanya mengizinkan GSAP di `/en` dan
`/en/practice/*`; `/en/work`, `/en/work/[slug]` dan `/en/ai` mengizinkan
**nol**. Memasangnya apa adanya membuat gate itu merah di tiga rute.

Jalan keluarnya bukan menaikkan anggaran: **pindahkan geraknya ke loop RAF
Tempus yang sudah ada.** Kursor hanya butuh lerp menuju pointer dan satu tulis
`transform`, dan `CLAUDE.md` #6 memang menuntut satu loop RAF, bukan dua. Itu
menghapus GSAP dari jalurnya sekaligus membuatnya **lebih** patuh daripada
versi sekarang.

**5.2 `components/ui/scrollbar`.** Memakai `useLenis` dan `hamo`, keduanya
sudah ada di tiap rute ber-`<Wrapper>`. Kemungkinan besar gratis — diverifikasi
terhadap `route-budget.e2e.ts`, bukan diasumsikan.

**5.3 Sembilan sisanya.** `accordion`, `alert-dialog`, `fold`, `form`, `menu`,
`select`, `switch`, `tabs`, `tooltip` — kontrol formulir Base UI. Dinilai lalu
dilaporkan dengan alasannya; tidak dipasang, tidak dihapus.

**5.4 Syarat yang mengikat, dan boleh membatalkan pemasangan.** Keduanya klise
situs award, dan basis data skill justru berbicara melawan yang pertama (§2).
Masing-masing harus lolos semuanya:

- hilang sepenuhnya di bawah `prefers-reduced-motion`;
- tidak pernah jadi satu-satunya penanda bahwa sesuatu bisa ditekan
  (`"Rely only on hover"`, severity High);
- tidak pernah menutupi target tekan, dan tidak muncul di perangkat sentuh;
- axe hijau di dua viewport dua bahasa;
- `route-budget.e2e.ts` hijau **tanpa anggarannya dinaikkan**.

Kalau salah satu tidak terpenuhi, komponennya tidak dipasang dan alasannya
ditulis di §9.

---

## 6. Berkas

**Baru**

| Berkas                            | Untuk                   |
| --------------------------------- | ----------------------- |
| `e2e/visual-substance.e2e.ts`     | Gate 18b                |
| `lib/styles/scripts/luminance.ts` | Pengukur piksel bersama |
| `docs/stages/TAHAP-18.md`         | dokumen ini             |

**Diubah (bergantung temuan)**

| Berkas                            | Perubahan                                   |
| --------------------------------- | ------------------------------------------- |
| `vault/webgl/scene-shell/`        | Penanda wilayah beraksen untuk gate         |
| `vault/primitives/cursor/`        | Gerak pindah ke Tempus, GSAP dicabut        |
| `app/[locale]/layout.tsx`         | Pemasangan kursor/scrollbar, kalau lolos §5 |
| `playwright.config.ts`            | Gate baru ikut di viewport mobile           |
| `docs/{DESIGN-SYSTEM,ROADMAP}.md` | Hasil                                       |

---

## 7. Kriteria keluar

```bash
rm -rf .next && bun run build && bun run start
CI=true bun run test:e2e     # 275 + gate baru
bun run check
bun run build-storybook
```

Ditambah:

- tiap asersi baru **dibuktikan merah dulu**, angkanya ditulis;
- `route-budget.e2e.ts` hijau tanpa anggaran dinaikkan;
- plat karya **dipandangi**, bukan hanya lulus.

---

## 8. Risiko

**8.1 Gate berbasis screenshot bisa rapuh lintas mesin.** Mitigasinya ada di
rancangan: §4.1 membandingkan halaman dengan dirinya sendiri, §4.2 memakai
ambang longgar yang diturunkan dari angka terukur.

**8.2 Kursor kustom adalah risiko aksesibilitas, bukan selera.** Ia mengganti
afordansi tingkat OS. Syarat §5.4 mengikat.

**8.3 Menulis ulang gerak kursor tanpa GSAP bisa terasa lebih kasar.** Diukur —
jarak per frame dan kelambatan terhadap pointer — bukan dinilai dengan mata.

**8.4 Pandangan penuh bisa menemukan lebih banyak dari yang muat di satu
tahap.** Kalau begitu, temuannya diurutkan dan sisanya dinyatakan terbuka,
bukan diam-diam dipersempit (`CLAUDE.md` #21).

---

## 9. Hasil

### 9.1 Koreksi atas §2 — nol hasil bukan alasan berhenti

Pemilik mengoreksi penekanan §2, dan koreksinya benar: **basis data yang nol
menunjukkan skill bukan satu-satunya jangkar.** Nol dicatat untuk keterlacakan
karena §2.1 menuntutnya — bukan sebagai alasan tidak mengerjakan sesuatu.

Yang dipakai sebagai jangkar di §9.4 karena itu adalah prinsip universal skill
(afordansi hover, "jangan bergantung hanya pada hover") **plus fakta terukur di
repositori ini** — bahwa `data-cursor` sudah dideklarasikan di tiga tempat, dan
bahwa GSAP akan merah-kan tiga anggaran rute. Itu yang memutuskan, bukan
ketiadaan baris di CSV.

### 9.2 Tahap 18a — pandangan selesai, dan menemukan cacat terkirim

Empat puluh dua tangkapan: tujuh rute × dua viewport × beberapa posisi scroll,
diukur lalu dipandangi.

**Temuan: setiap halaman praktik merender isinya menempel ke tepi layar.**

| Rute                 | `h1` kiri (desktop) | (mobile) |
| -------------------- | ------------------- | -------- |
| `/en`                | 14                  | 17       |
| `/en/work`           | 14                  | 17       |
| `/en/work/<slug>`    | 14                  | 17       |
| **`/en/practice/*`** | **0**               | **0**    |

Sementara wordmark header duduk di 14/17. Sebabnya satu baris: `.page` di
`app/[locale]/practice/[value]/page.module.css` punya `padding-block` dan
**tidak punya padding inline sama sekali**, sementara `/en/work` memakai
`var(--safe)`. Tiga rute, dua viewport, dua bahasa — terkirim, dan setiap
gerbang melewatkannya karena tidak ada yang pernah menanyakan **di mana isi
dimulai**.

Diperbaiki dengan token yang sama, bukan angka baru.

**Plat karya setelah `linear` dicabut: benar.** `/en/work` dan detail proyek
dipandangi — warna penuh, tidak tergelapkan. Shader material meneruskan
tekstur tanpa konversi di kedua ujung, jadi ia lolos secara kebetulan dan
tetap benar sesudahnya.

### 9.3 Tahap 18b — melihat jadi gerbang

`e2e/visual-substance.e2e.ts`, dua kelompok asersi, **keduanya selisih halaman
dengan dirinya sendiri** sehingga teks, tata letak dan pipeline tangkapan layar
saling membatalkan.

| Asersi                                 | Merah sebelum                                                |
| -------------------------------------- | ------------------------------------------------------------ |
| Isi dimulai di gutter-nya sendiri (×7) | `heading starts at 0px while the header starts at 14px`      |
| Dekorasi tidak menggelapkan            | `the accent made the page darker: 3.4 with it, 15.5 without` |
| Wilayah beraksen punya modulasi        | rentang di bawah kontrolnya sendiri                          |
| Grain tekstur, bukan statik            | sd < 12/255                                                  |

Bukti merah untuk yang kedua diperoleh dengan **mengembalikan `linear`** dan
membangun ulang — cacat Tahap 17 dihidupkan lagi, dan gerbangnya menangkapnya
dengan angkanya. Lengan mobile lulus di lengan merah itu, dan itu benar:
mobile memakai gradien CSS yang tidak pernah terkena `linear`.

Dua instrumen saya sendiri salah dan dikoreksi sebelum sempat berbohong:

1. Asersi "body copy" memakai `<p>` pertama dalam urutan DOM — di beranda itu
   indeks praktik yang **memang** rata kanan, 851px. Gerbang merah terhadap
   desain yang benar. Asersi itu dicabut; `h1` tidak ambigu.
2. Kontrolnya semula selalu menyembunyikan canvas. Di mobile tidak ada canvas
   (`useDeviceDetection` menggerbangi WebGL pada `supportsWebGL && isDesktop`),
   jadi lengan mobile hanya _skip_ — gerbang yang tidak bisa gagal. Sekarang
   kontrolnya menyesuaikan: mesh hidup → sembunyikan canvas; fallback →
   sembunyikan wilayahnya.

### 9.4 Tahap 18c — yang dipasang, dan yang tidak

**Kursor dipasang.** Alasannya terukur, bukan selera: `data-cursor` sudah
dideklarasikan di `next-project`, `next-practice` dan `project-card` —
kosakatanya dibangun tiga tahap lalu dan komponennya tidak pernah dipasang.

Hambatannya nyata dan diselesaikan seperti rencana: ia mengimpor GSAP,
sementara `route-budget` mengizinkan GSAP di dua rute saja dan **nol** di tiga
lainnya. Geraknya dipindahkan ke loop Tempus yang sudah ada — yang
`CLAUDE.md` #6 memang tuntut — sehingga kursor terkirim ke seluruh situs
dengan **nol biaya pustaka** dan `route-budget` tetap hijau tanpa satu
anggaran pun dinaikkan.

Satu cacat ditemukan saat memasang: state awal `'default'` sementara hanya
`'hidden'` yang menyembunyikan cincin, dan elemennya `position: fixed; top: 0;
left: 0` — jadi sebuah cincin duduk di pojok kiri atas setiap halaman sampai
pembaca menggerakkan tetikus. Persis "tell" yang doc komponennya sendiri
peringatkan. State awal jadi `'hidden'`.

**Scrollbar tidak dipasang, dan itu jawaban §5.4.** Ia tidak punya kosakata
yang menunggunya, dan situs sudah punya Lenis, isyarat "SCROLL" di hero, dan
scrollbar native. Sebuah elemen vertikal permanen di tepi kanan setiap halaman
adalah dekorasi yang bersaing dengan karyanya — melawan _"Neutral background
(let work shine). Accent: Minimal."_ Sembilan sisanya kontrol formulir Base UI
tanpa tempat di situs portofolio.

### 9.5 Wash CSS untuk halaman praktik

Layar pertama halaman praktik terukur rentang tonal **29.9/255** (desktop) —
band hitam rata, kesan yang sama yang Tahap 17 perbaiki di beranda. Tapi ia
tidak bisa diperbaiki dengan cara yang sama: `route-budget` mengizinkan
three.js di tepat satu rute dan ini sengaja bukan rute itu.

Tidak perlu. `scene-shell` sudah merender gradien yang sama sebagai fallback
CSS-nya, dari dua token yang sama, dan gradien tidak berbiaya pustaka di rute
mana pun. Dipasang sebagai lapisan sendiri — bukan `::before` — supaya gerbang
bisa menandai dan menyembunyikannya.

### 9.6 Gerak diverifikasi, bukan diasumsikan

Diminta eksplisit: pastikan animasinya berjalan seperti direncanakan.

**Kurva follow kursor**, disampel per frame setelah lompatan 200 → 1000px:

| waktu     | posisi  | % jarak |
| --------- | ------- | ------- |
| 50ms      | 515     | 39%     |
| 100ms     | 771     | 71%     |
| 150ms     | 861     | 83%     |
| **200ms** | **960** | **95%** |
| 300ms     | 985     | 98%     |

95% pada 200ms — persis `duration.fast`, karena `FOLLOW_TAU = duration.fast / 3`
dan tiga konstanta waktu adalah ~95% jarak. Bentuknya eksponensial, bukan
linier.

Dan hanya **16 frame dalam 600ms (~27fps headless)** — justru itu yang
membuktikan kenapa bentuk eksponensialnya penting: lerp per-frame konstan yang
disetel untuk 60fps akan mendarat jauh dari 95% pada frame rate itu.

**Reduced motion: 1000px pada 50ms** — menempel, nol lag, cincinnya tetap ada.
`MOTION-SPEC.md` §9.4 aturan 3 terpenuhi secara terukur.

**Wash hero benar-benar bergeser**: mean |delta| **1.06/255** dalam 4 detik,
maksimum 3 — di bawah ambang "terbaca sebagai animasi", yang persis yang
komentar shader-nya klaim. Loop RAF memajukan `uTime`; ia hidup, bukan diam.

### 9.7 Yang tetap terbuka

- **Kekosongan hero** (305px desktop / 502px mobile) tetap. Dengan wash yang
  terlihat ia terbaca sebagai ruang negatif, bukan area belum selesai — tapi
  itu keputusan komposisi, bukan cacat, dan tidak diubah.
- **Kartu setengah lebar sendirian** di grid beranda (F7 Tahap 17). `span`
  dari CMS; tahap tersendiri.
- **Header tanpa nav di rute dalam.** Dari `/en/work` atau sebuah halaman
  praktik hanya ada wordmark dan pengalih bahasa — anchor seksi milik beranda
  tidak berlaku di sana. Terlihat saat pandangan; belum diputuskan apakah itu
  kehematan atau jalan buntu. Dicatat, tidak diam-diam diperbaiki.
- **Isi placeholder** (Tahap 13 §9) tetap milik studio.

### 9.8 Angka

```
bun run check      exit 0    (401 unit test)
CI=true test:e2e   297 lulus, 0 gagal   (dari 275)
route-budget       hijau, nol anggaran dinaikkan
```
