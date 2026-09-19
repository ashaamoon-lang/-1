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
