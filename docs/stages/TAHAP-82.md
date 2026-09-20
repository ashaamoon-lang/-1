# Tahap 82 — Galeri yang tidak pernah berjalan, dan separuh tahap yang bukan milik saya

> **Status: spec. Belum ada kode.** Ditulis lebih dulu sesuai `ROADMAP.md` §3.0.
>
> Cabang: `claude/arth-design`. Tahap ini **berhenti separuh jalan dengan
> sengaja** — §6 menyatakan di mana dan kenapa, di muka, bukan sebagai alasan
> di akhir.

---

## 1. Yang diukur, sebelum satu baris kode

### 1.1 `Horizontal` tidak pernah merender, dan angkanya satu

```
vault/blocks/project-gallery/index.tsx:375   const RUN_MINIMUM = 4
vault/blocks/project-gallery/index.tsx:376   const travels = run && images.length >= RUN_MINIMUM
```

Dataset memberi **2** gambar galeri per proyek. `2 >= 4` salah, jadi `travels`
selalu `false`, jadi trek horizontal itu **belum pernah merender sekali pun
sejak Tahap 64** — dan `project-run`, momen yang dibangun untuknya, tidak
pernah muncul di `epic-sequence`.

Ini bukan bug. Kodenya benar; datanya yang kurang.

### 1.2 Kolam plat, dan kenapa ia dipakai bersama

`lib/scripts/seed-fixtures.ts` membuat **tiga** plat galeri, dan keenam proyek
menariknya dari kolam yang sama:

| plat           | piksel      | rasio     | `isFullWidth` |
| -------------- | ----------- | --------- | ------------- |
| `plate-wide`   | 2400 × 1350 | **1.778** | penuh         |
| `plate-tall`   | 1200 × 1600 | **0.750** | separuh       |
| `plate-square` | 1600 × 1600 | **1.000** | penuh — batas |

Pemakaian-bersama itu **keputusan yang tertulis**, bukan kemalasan. Tahap 44
mencatatnya: sebelum tahap itu ketiga gambar satu proyek memakai satu
`project.alt` yang sama, jadi pembaca layar mendengar sampulnya dideskripsikan
tiga kali dan dua di antaranya mendeskripsikan hal yang tidak sedang ia lihat.
Perbaikannya memberi deskripsi kepada **platnya**, ditulis sekali — karena
enam parafrase atas dua gambar yang sama adalah enam kebohongan kecil.

**Konsekuensinya mengikat tahap ini:** menaikkan ke 4 plat/proyek **tidak
boleh** dilakukan dengan mengulang plat di dalam satu proyek. Itu akan menaruh
gambar yang sama dua kali di satu halaman, dan `PLATE_ALT` akan membacakan
deskripsi yang sama dua kali berturut-turut. Kolamnya yang harus tumbuh.

### 1.3 `--preview` sudah ada, dan rencana keliru menuliskannya sebagai tugas

`RENCANA` §5 menyebut `T82-2` — _"`--preview` → `.fixtures-preview/`"_ —
sebagai pekerjaan. Ia **sudah ada di disk**:

```
lib/scripts/seed-fixtures.ts:43    const PREVIEW = process.argv.includes('--preview')
lib/scripts/seed-fixtures.ts:867   async function preview() { ... }
```

Ia merender tiap plat ke `.fixtures-preview/`, mencetak rasio dan ukuran
kB-nya, lalu berhenti — tanpa jaringan dan tanpa token, persis seperti yang
dijanjikan. Lingkup tahap ini **mengecil** karena itu, dan pengecilannya
dinyatakan di sini alih-alih dirayakan sebagai pekerjaan yang selesai cepat.

### 1.4 `--clean` sudah aman, juga secara konstruksi

```
seed-fixtures.ts:336   *[_id match "fixture-*"]._id
seed-fixtures.ts:338   *[_type == "sanity.imageAsset" && originalFilename match "fixture-*"]._id
```

Ia mencocokkan **prefiks**, bukan daftar nama. Plat baru ikut terhapus tanpa
satu baris pun ditambahkan — selama penamaannya dipertahankan.

Dan prefiksnya bukan yang tertulis: konstanta berbunyi `'fixture-'`, sementara komentar berkas itu sendiri menulis `fixture.` sejak Tahap 4. Kode yang benar; doc-nya dikoreksi di tempat, dan uji baru memakukan keduanya supaya selisih itu tidak bisa kembali. `T82-6` karena
itu bukan pekerjaan, melainkan **invarian yang diuji**, dan §5 menuliskannya
sebagai gerbang.

---

## 2. Ritual skill — `ROADMAP.md` §2.1, hasilnya ditempel apa adanya

```bash
PY=python   # Windows; python3 di Linux/macOS
S=.claude/skills/ui-ux-pro-max/scripts/search.py
$PY $S "Horizontal Scroll" --domain gsap
$PY $S "image gallery grid layout" --domain ux -n 3
$PY $S "horizontal scroll keyboard accessibility" --domain ux -n 3
```

### 2.1 Satu query mengembalikan NOL yang dicari, dan itu ditulis

`"Horizontal Scroll" --domain gsap` mengembalikan tiga hasil dan **tak satu pun
tentang gulir horizontal**: dua Scroll Reveal dan satu Parallax Scroll.
Database gerak skill ini tidak punya entri horizontal-scroll. Dicatat terus
terang, mengikuti preseden `TAHAP-79.md` — sebuah ritual yang hanya dilaporkan
ketika ia membantu adalah ritual yang tidak bisa dipercaya.

### 2.2 Dan satu hasil MELAWAN rencana ini

```
Category: Responsive · Issue: Horizontal Scroll · Severity: High
Description: Avoid horizontal scrolling
Do:    Ensure content fits viewport width
Don't: Content wider than viewport
```

Tahap ini menyalakan trek horizontal, dan skill menandai gulir horizontal
sebagai **severity High**. Itu tidak dilewati.

**Ia berlaku, dan trek ini tidak melanggarnya** — dan bedanya bisa dibaca dari
kodenya, bukan dari niat. Panduan itu tentang **konten yang lebih lebar dari
viewport**, yaitu scrollbar horizontal di halaman. `vault/motion/horizontal`
tidak menghasilkan itu: viewport-nya `overflow: clip`, dan trek digerakkan oleh
gulir **vertikal** lewat ScrollTrigger. Halaman tidak pernah punya sumbu kedua.

Yang tetap mengikat dari entri itu adalah pasangannya:

```
Category: Accessibility · Issue: Motion Sensitivity · Severity: High
Do: Honor prefers-reduced-motion and present the final readable state
```

dan yang sudah dikutip di Tahap 81:

```
Don't pin more than 1-2 sections per page
```

`/work/<slug>` akan naik ke **satu** pin aktif — dari nol — jadi ia masuk
anggaran, tidak melewatinya.

### 2.3 Yang mengikat soal aset

```
Category: Performance · Issue: Image Optimization · Severity: High
Don't: Unoptimized full-size images   ("4000px image for 400px display")
```

Menggandakan plat per proyek menggandakan berat yang diunduh halaman proyek.
`check:assets` dan `route-budget` keduanya jadi gerbang yang relevan, dan §5
menuntut angkanya ditempel.

---

## 3. Inventaris — dipakai ulang, bukan ditulis ulang

| kebutuhan             | yang sudah ada                                         |
| --------------------- | ------------------------------------------------------ |
| Trek horizontal       | `vault/motion/horizontal` — lengkap, dorman sejak T-64 |
| Aturan lebar plat     | `isFullWidth()` — teruji unit di tiap hitungan         |
| Baris tak separuh     | `loneHalves()` — diekspor dan teruji                   |
| Generator plat        | `makePlate()` — `sharp`, deterministik                 |
| Pratinjau tanpa token | `--preview` (§1.3)                                     |
| Siklus bersih         | `--clean` per prefiks (§1.4)                           |
| Wasit rentang gulir   | `e2e/epic-sequence.e2e.ts`                             |
| Penjaga tepi bidang   | `e2e/plane-edge.e2e.ts` — **baru di Tahap 81**         |

**Nol komponen baru.** Yang kurang adalah **data**, dan satu-satunya kode baru
adalah plat tambahan di generator fixture.

---

## 4. Yang akan dikerjakan — dan siapa pemiliknya

**Keputusan pemilik repo, tercatat:** saya membangun generator dan
pratinjaunya; **pemilik repo yang menyemai dataset**. Menulis ke dataset adalah
tindakan yang menghadap keluar (`RENCANA` §3.4 J4), jadi ia bukan keputusan
saya untuk diambil sendiri.

### 4.1 Milik saya

| ID      | tugas                                                                   |
| ------- | ----------------------------------------------------------------------- |
| `T82-1` | Kolam plat galeri **3 → 6**, tiap plat dengan rasio yang punya alasan   |
| `T82-2` | `PLATE_ALT` untuk tiap plat baru, **dua bahasa**, deskripsi platnya     |
| `T82-3` | Tiap proyek mengambil **4 plat berbeda**, nol pengulangan di dalam satu |
| `T82-4` | Jalankan `--preview`, **nilai dengan mata**, tempel rasio & kB-nya      |
| `T82-5` | Uji unit: tiap proyek punya 4, dan keenamnya tanpa duplikat internal    |

Rasio plat baru dipilih untuk **melatih `isFullWidth` di kedua cabang dan di
batasnya**, bukan untuk variasi visual semata. Kolam sekarang punya satu di
bawah 1 (0.75) dan dua di atas-atau-sama (1.0, 1.778); tiga plat baru mengisi
yang belum pernah dirender: sebuah potret yang lebih ekstrem, sebuah lanskap
mendekati batas dari atas, dan satu lagi di bawah batas dari dekat.

### 4.2 Milik pemilik repo — ▌JEDA▐

Satu perintah, yang saya serahkan jadi:

```bash
bun --env-file .env.local lib/scripts/seed-fixtures.ts
```

### 4.3 Milik saya, **sesudah** jeda itu

| ID      | tugas                                                              |
| ------- | ------------------------------------------------------------------ |
| `T82-6` | Verifikasi `Horizontal` benar-benar merender; `project-run` muncul |
| `T82-7` | `epic-sequence` melihat **dua** momen di `/work/<slug>`            |
| `T82-8` | Keyboard berjalan melewati trek ter-pin tanpa viewport melawan     |

### 4.4 Berkas yang disentuh

```
lib/scripts/seed-fixtures.ts             kolam plat, PLATE_ALT, daftar gallery
lib/scripts/seed-fixtures.test.ts        uji 4-per-proyek + nol duplikat internal
docs/stages/TAHAP-82.md                  berkas ini
```

Nol berkas `vault/` dan nol `app/`. Kalau tahap ini menyentuh salah satunya,
pemahamannya salah — itu pemicu **T8**.

---

## 5. Kriteria keluar

### 5.1 Yang bisa saya penuhi sendiri

| gerbang                   | tuntutan                                                      |
| ------------------------- | ------------------------------------------------------------- |
| `bun run check`           | 579+ lulus, 0 gagal                                           |
| uji baru                  | tiap proyek **4** plat galeri, **nol** duplikat di dalam satu |
| `--preview`               | 6+ plat ter-render, rasio & kB **ditempel di §7**             |
| `--clean` (invarian §1.4) | uji menuntut tiap nama plat berawalan prefiks                 |
| `check:assets`            | hijau — plat baru di dalam anggaran                           |
| `bun run build`           | hijau                                                         |
| `e2e/plane-edge.e2e.ts`   | tetap hijau — plat baru masuk frame ber-klip yang sama        |

### 5.2 Yang **tidak** bisa, sampai dataset disemai

| gerbang                          | kenapa terhalang                                     |
| -------------------------------- | ---------------------------------------------------- |
| `Horizontal` merender            | `RUN_MINIMUM` membaca dataset, bukan generator       |
| `project-run` di `epic-sequence` | momen itu tidak ada di DOM sampai trek merender      |
| `route-budget` `/work/<slug>`    | berat nyata baru terukur setelah aset ada di CDN     |
| `media-edge`, `project-spread`   | keduanya mengukur halaman yang dirender dari dataset |

**Tahap 82 tidak boleh disebut selesai sebelum baris pertama tabel ini hijau.**
`TAHAP-79.md` §8 sudah mengikat itu dan tahap ini tidak membatalkannya.

---

## 6. Di mana tahap ini berhenti, dinyatakan di muka

Bukan di akhir sebagai alasan. `RENCANA` §8.3: kerjakan penuh yang tidak
terhalang, sebutkan persis yang ditinggalkan.

Yang selesai tanpa siapa pun: generator, deskripsi, uji, pratinjau yang bisa
dinilai dengan mata. Yang menunggu satu perintah: semuanya yang menuntut
halaman dirender dari dataset nyata.

Konsekuensi jujurnya: **`CLAUDE.md` #21 berlaku penuh di sini.** Halaman proyek
akan merender persis seperti hari ini sampai dataset berubah, dan itu
dinyatakan sebagai belum terverifikasi terhadap data nyata — bukan dibulatkan
jadi selesai karena generatornya benar.

---

## 7. Risiko

1. **Plat diulang di dalam satu proyek untuk mengejar angka 4.** Itu memberi
   K8 = 4 dan memberi pembaca gambar kembar plus deskripsi kembar — persis
   cacat yang Tahap 44 tutup. Uji di `T82-5` ada untuk menolaknya secara
   mekanis, bukan lewat ingatan.
2. **Berat aset naik diam-diam.** Enam proyek × dua plat tambahan. `check:assets`
   dan `route-budget` keduanya dijalankan, angkanya ditempel (**R6**).
3. **Trek horizontal menabrak anggaran pin.** `/work/<slug>` naik 0 → 1 pin
   aktif. Skill membatasi 1–2 per halaman, jadi ini di dalam anggaran — tapi
   papan skor akan melaporkan barisnya naik, dan itu **diharapkan**, bukan
   kejutan.
4. **Keyboard melawan viewport ter-pin.** `horizontal/index.tsx` sudah menulis
   kontraknya — viewport `overflow: clip`, `focusin` memetakan balik ke posisi
   gulir halaman — tapi kontrak itu **belum pernah dijalankan pada halaman
   nyata**. `T82-8` adalah pertama kalinya, dan itu dinyatakan sebagai
   pembacaan pertama sebuah mekanisme (**T6**).
5. **Nol angka performa diklaim.** `chrome-devtools-mcp` masih menunggu
   `CONTEXT7_API_KEY`. K10 tetap belum terukur (`CLAUDE.md` #19).

---

## 8. Hasil sejauh ini — separuh yang bisa dikerjakan

> **Status: separuh terkirim.** Yang di bawah selesai dan bergerbang. Yang di
> §5.2 menunggu satu perintah yang bukan milik saya, dan tahap ini **tidak
> disebut selesai** sampai baris pertamanya hijau.

### 8.1 Kolam plat, terukur dari `--preview`

Tanpa jaringan, tanpa token, 13 plat ter-render:

```
plate-wide     2400x1350   1.778   261kB    penuh
plate-broad    2000x1600   1.250   247kB    penuh   <- baru
plate-square   1600x1600   1.000   184kB    penuh, batas
plate-near     1568x1600   0.980   204kB    separuh <- baru, batas dari bawah
plate-tall     1200x1600   0.750   154kB    separuh
plate-column   1120x2000   0.560   173kB    separuh <- baru
```

Tiga plat baru duduk di **173–247 kB**, di dalam rentang yang enam plat lama
sudah tempati (147–261 kB), jadi tidak ada satu aset pun yang jadi outlier.

### 8.2 Enam proyek, empat plat, nol pengulangan

```
arus-balik     wide, tall, column, square     F H H F
pusat-beban    tall, near, wide, broad        H H F F
bacaan-mesin   square, broad, column, near    F F H H
takar          broad, column, tall, wide      F H H F
pelabuhan      near, column, square, wide     H H F F
lantai-dua     wide, broad, tall, near        F F H H
```

Tiap proyek membawa **tepat dua separuh yang bersebelahan** — itu bukan selera,
itu satu-satunya susunan yang `loneHalves` terima pada empat plat dari kolam
tiga-separuh/tiga-penuh.

### 8.3 Gerbang

| gerbang                 | hasil                              |
| ----------------------- | ---------------------------------- |
| `bun run check`         | lihat §8.5                         |
| `seed-fixtures.test.ts` | **8 lulus, 0 gagal**, 68 assertion |
| `--preview`             | 13 plat, nol jaringan, nol token   |
| `check:assets`          | hijau                              |

**Dibuktikan merah lebih dulu**, keduanya (§3.3):

```
gallery: [tall, wide, column, square]   -> "arus-balik strands a half-width plate: half, full, half, full"
gallery: [wide, tall, tall, square]     -> "arus-balik repeats a plate: plate-wide, plate-tall, plate-tall, plate-square"
```

### 8.4 Tiga hal yang ditemukan, bukan dikerjakan

**Meng-`import` berkas itu akan menyemai dataset.** `seed-fixtures.ts`
menjalankan entry point-nya di module scope tanpa penjaga `import.meta.main`.
Pembaca tanpa token diakhiri `process.exit(1)` saat modul dimuat; pembaca
**dengan** token — yaitu semua orang di sini, karena Bun memuat `.env.local`
otomatis — menyemai dataset hanya dengan mengimpornya. Itu sebabnya berkas ini
tidak pernah punya uji: tidak ada bentuk yang bisa diuji. Ditutup lebih dulu,
sebelum satu uji pun ditulis.

**Prefiksnya bukan yang doc-nya janjikan.** Konstanta `'fixture-'`, komentar
pembuka `fixture.` — dan paragraf itulah yang orang baca sebelum mempercayakan
`--clean` pada dataset nyata. Dikoreksi, lalu dipakukan uji.

**Ketiga deskripsi alt saya salah, dan hanya mata yang menangkapnya.** Saya
menulisnya dari nilai heks: menyebut massa `plate-column` "pucat" padahal
massanya biru dan hanya pendarnya yang pucat, dan memberi `plate-broad`
"cakrawala tinggi" padahal `horizon: 0.74` menaruh pita tanah di seperempat
bawah. Nol gerbang bisa menangkap itu. `--preview` lalu **melihatnya** yang
menangkapnya — dan itu persis alasan langkah itu ada di rencana.

### 8.5 Yang tidak dikerjakan, dinyatakan eksplisit

- **Dataset tidak disemai.** Itu milik pemilik repo (§4.2), dan seluruh §5.2
  menunggu di belakangnya.
- **`Horizontal` masih belum pernah merender.** Generator sudah memberi empat
  plat; `RUN_MINIMUM` membaca **dataset**, bukan generator. Halaman proyek
  merender persis seperti hari ini sampai perintah itu dijalankan, dan itu
  dinyatakan sebagai belum terverifikasi terhadap data nyata — bukan dibulatkan
  jadi selesai karena generatornya benar (`CLAUDE.md` #21).
- **Nol entri `## Tahap 82` di `ROADMAP.md`.** Entri ditulis saat tahap
  terkirim; spec boleh berjalan di depan dan `stage-position.test.ts`
  mengizinkannya secara eksplisit. Baris status tetap **81**.
- **Nol angka performa diklaim.** K10 masih menunggu `CONTEXT7_API_KEY`
  (`CLAUDE.md` #19).

---

## 9. Sesudah dataset disemai — dan satu premis lagi yang gugur

### 9.1 Trek itu merender, dan gerbangnya melihatnya

Diukur dari halaman nyata, bukan dari generator:

```
/en/work/arus-balik   data-epic="project-arrival"
                      data-epic="project-run"     <- pertama kali sejak Tahap 64
epic-sequence         18 lulus, dua viewport
```

### 9.2 Dan ia mematikan grid di setiap proyek

`project-spread.e2e.ts` langsung merah, tiga tes, pesannya satu:
**"renders no artwork"**. Bukan cacat baris; gerbang itu mencari plat grid dan
menemukan nol.

Sebabnya tertulis di komponennya sejak Tahap 64, dan saya melewatinya:

> _"on today's fixtures the run never appears. Every project falls back to the
> grid, which is the correct, already-measured design."_

`RUN_MINIMUM` bukan ambang yang **menambah** tata letak — ia **mengganti**-nya.
Menaikkan keenam proyek ke empat plat memindahkan semuanya ke trek dan
menghapus grid dari situs ini sepenuhnya, termasuk dari `FEATURED_WORK`, rute
yang **sepuluh** berkas e2e navigasikan lewat nama dan yang semuanya ditulis
terhadap grid.

### 9.3 Koreksi: dataset berutang satu karya per bentuk

`§4.1` menulis _"tiap proyek mengambil 4 plat berbeda"_. Itu keliru, dan
argumennya sudah ada di repo — `e2e/fixtures.ts` menulisnya untuk sampul
persegi: _"a test that needs a particular shape of work cannot pick one at
random and still mean what it says."_

Situs ini punya **dua** bentuk galeri sejak Tahap 64. Dataset harus membawa
wakil keduanya:

```
FEATURED_WORK  arus-balik    3 plat  -> grid   (sepuluh berkas memakukannya)
RUN_WORK       pusat-beban   4 plat  -> trek   (baru, dinamai di e2e/fixtures.ts)
empat lainnya                4 plat  -> trek
```

`epic-sequence` mendapat rute `RUN_WORK`, jadi trek itu punya pemeriksaan
urutan gulir di rute hidup — bukan hanya di story. Dan trek memang sudah
bergerbang penuh lewat `e2e/gallery-run.e2e.ts` (5 tes, Storybook), yang
**tidak pernah** bergantung pada dataset; itu ditemukan saat mencari, bukan
diasumsikan.

Uji unit dikoreksi bersamaan: ia menuntut "tiap proyek >= 4" dan sekarang
menuntut **minimal satu dari tiap bentuk**. Uji yang menyatakan hal yang salah
dengan percaya diri lebih buruk daripada tidak ada uji.

### 9.4 Menyemai ulang diperlukan, dan `--clean` dulu

Generator berubah; dataset belum. `arus-balik` masih membawa empat plat di
Sanity sampai perintahnya dijalankan lagi.

Dan **`--clean` lebih dulu**, bukan seed langsung: dokumen memakai
`createOrReplace` sehingga idempoten, tapi plat dikomposit dengan noise
gaussian ber-seed acak, jadi byte-nya berbeda tiap render dan Sanity
mengunggahnya sebagai aset **baru** alih-alih men-dedup. Menyemai ulang tanpa
membersihkan menumpuk aset yatim — semuanya ber-prefiks `fixture-`, jadi bisa
dihapus, tapi lebih baik tidak dibuat.

---

## 10. Kebisingan build — disorot dan diukur

Ini di luar lingkup tahap ini dan dikerjakan atas permintaan pemilik repo.

### 10.1 Satu setelan yang hilang mencetak empat belas baris

`lib/env.ts` memperingatkan di module scope. `next build` mengumpulkan data
halaman di **tujuh proses worker**, dan modul itu dievaluasi lebih dari sekali
di dalam tiap proses — jadi satu nilai yang absen mencetak **14 baris**,
berselang-seling dengan progress bar, sehingga log-nya terbaca seperti sesuatu
gagal berulang-ulang.

Itu bukan keluhan kosmetik. `RENCANA` §8.7 sudah membawanya sebagai risiko
**R2**: sesudah sepuluh baris identik tidak ada yang membaca yang kesebelas,
dan yang kesebelas itulah tempat peringatan **lain** bersembunyi.

Diperbaiki dengan latch di `globalThis` — bukan `let` tingkat modul, karena
pengulangannya datang dari modul yang dievaluasi beberapa kali **di dalam satu
proses**, dan hanya global yang dibagi antar salinan itu.

```
sebelum   14
sesudah    7      satu per worker; lintas proses tidak bisa dilatch
```

Peringatannya sendiri **tetap**, dan nilainya masih hilang. `NEXT_PUBLIC_BASE_URL`
dipanggang saat build, jadi menyetelnya tanpa membangun ulang tidak mengubah
apa pun — `docs/DEPLOYMENT.md` §2.1 memilikinya.

### 10.2 Peringatan `metadataBase` — dipahami, TIDAK diperbaiki

Empat baris, dan dua percobaan gagal. Aturan kerja melarang yang ketiga, jadi
ia ditulis apa adanya.

Terukur dari HTML yang dihasilkan:

```
/en/*         og:image = https://localhost:3000/...   <- APP_BASE_URL, punya base
/cms          og:image = http://localhost:3000/...    <- default Next, tanpa base
```

Gambarnya `app/opengraph-image.png` — metadata berbasis berkas yang duduk **di
atas kedua root layout**. Menambahkan `metadataBase` di `app/(chrome)/layout.tsx`
tidak menggeser hitungannya maupun URL itu; menambahkannya lagi di
`cms/layout.tsx` juga tidak, dan yang kedua dikembalikan karena duplikasi yang
tidak berefek lebih buruk daripada tidak ada.

**Radius dampaknya kecil, dan itu diukur bukan ditaksir:** dua rute yang
terpengaruh adalah `/cms`, yang `robots: noindex`, dan root telanjang, yang
redirect. **Setiap halaman terindeks sudah menyelesaikan OG-nya terhadap
`APP_BASE_URL`.** Deklarasi di root `(chrome)` dipertahankan karena ia benar
pada dirinya sendiri, dan komentarnya sekarang menyatakan bahwa ia tidak
membungkam peringatan itu.

---

## 11. Sesudah semai ulang — dan gerbang ketiga yang ikut gugur

### 11.1 Dua bentuk, dua karya, terukur dari halaman

```
dataset   arus-balik 3 · lima lainnya 4          (GROQ ke production)
/en/work/arus-balik     project-arrival           <- grid
/en/work/pusat-beban    project-arrival + project-run   <- trek
```

### 11.2 Build hijau yang menyajikan konten lama

Pemeriksaan pertama sesudah semai ulang **masih** melaporkan `project-run` di
`arus-balik`, padahal dataset sudah 3. Bukan seed yang gagal — build yang basi:
`'use cache'` menyimpan hasil GROQ di `.next/cache`, jadi build kedua
memprerender ulang dari jawaban build pertama dan log-nya tetap hijau.

`docs/MENJALANKAN-LOKAL.md` §8 sudah menulis bentuk ini sebagai butir
pertamanya, dan saya tetap menabraknya. `rm -rf .next/cache` lalu build
menyelesaikannya. Dicatat di sini karena butir dokumen yang dilanggar oleh
penulisnya sendiri adalah bukti bahwa ia perlu lebih keras daripada prosa.

### 11.3 `project-spread` gugur untuk alasan ketiga, dan kali ini gerbangnya

Sesudah dataset benar, gerbang itu masih merah — pada `bacaan-mesin`, bukan
`arus-balik`. Ia membaca **seluruh** slug dari sitemap, jadi tiap karya
ber-trek melaporkan "renders no artwork".

Diukur ke sumbernya: cabang trek meneruskan **hanya `figure`** ke `Horizontal`.
Tidak ada `<ul>`, tidak ada `<li>`, jadi tidak ada `data-span` — dan seluruh
isi tes itu menanyakan plat mana berbagi baris. Jawaban sebuah trek adalah
**tidak ada baris**.

Jadi yang salah bukan datanya dan bukan tata letaknya: asersi
`plates.length > 0` membaca "karya ini merender grid" sambil mengaku membaca
"karya ini merender karya". Karya ber-trek kini dilewati, dan itu **tidak bisa**
jadi lolos-kosong — penjaga `halvesSeen > 0` di ekor tes yang sama gagal kalau
tidak ada satu pun separuh di seluruh dataset. Kondisi lewatnya sempit
(`runs > 0 && plates.length === 0`), jadi karya ber-grid tetap diasersi penuh.

**Tiga premis gugur di tahap ini, dan ketiganya milik saya:** "tiap proyek 4
plat" (§9.3), "deskripsi bisa ditulis dari nilai heks" (§8.4), dan "gerbang
yang hijau kemarin mengukur hal yang sama hari ini" (di sini).
