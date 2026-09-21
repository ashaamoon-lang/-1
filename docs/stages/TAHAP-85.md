# Tahap 85 — Kanvas yang mati diam-diam, dan halaman yang memutih karenanya

> **Status: terkirim.** Spec ditulis lebih dulu sesuai `ROADMAP.md` §3.0;
> hasil dan gerbangnya di §7.
>
> Dilaporkan pemilik repo: _"Terkadang Page Berubah Memutih seperti ini, ketika
> saya sudah melakukan navigasi. INI adalah masalah berat."_

---

## 1. Pengukuran — apa yang sebenarnya terjadi

Semua angka di bawah diukur terhadap `bun run start` di `localhost:3000`,
Chromium 1234, 1440×900, dengan menekan tautan sungguhan — bukan `page.goto`,
karena overlay transisi hanya dipicu `onNavigate` dari `<Link>`.

### 1.1 Gejalanya nyata dan terulang

Luminansi rata-rata viewport. Rute yang sama, posisi gulir yang sama, elemen
yang sama persis di tengah layar:

```
/en muat segar                  L =  34.8
/en setelah pergi lalu kembali  L = 143.2      <- empat kali lebih terang
```

Terulang di hop 3 (`/en/work` → `/en`) dan hop 9 (`/en/journal` → `/en`) dalam
satu sapuan sepuluh navigasi. Tidak terulang di hop 7
(`/en/practice/consulting` → `/en`), dan **kenapa sebagian navigasi lolos belum
terjawab** — §6.1.

### 1.2 Empat tersangka yang gugur, masing-masing dengan angkanya

Ini pantas dicatat: keempatnya masuk akal, dan keempatnya salah.

| tersangka                   | yang diukur                                | hasil                                                 |
| --------------------------- | ------------------------------------------ | ----------------------------------------------------- |
| Overlay transisi tersangkut | `data-state`, `transform`                  | `idle`, `translateY(720px)` — terparkir di luar layar |
| Tirai masuk terulang        | `display`, `visibility`                    | `grid`, `hidden` — sudah selesai                      |
| `data-theme` basi           | atribut di `<html>` dan di ground          | keduanya `dark`, benar                                |
| Wash jatuh ke palet terang  | `resolveColorToHex` lewat ground vs `body` | **keduanya `rgb(17,15,13)`** — identik, benar         |

Tersangka keempat milik saya sendiri, dan saya sempat yakin: komentar
`lib/styles/resolve-color.ts` merekam cacat Tahap 54 yang bentuknya persis sama
— palet terang di rute gelap, luminansi 194. Diukur, ground **ditemukan** pada
navigasi kembali dan kedua kaskade memberi warna yang sama. Teorinya gugur
sebelum satu baris kode ditulis, yang memang gunanya mengukur lebih dulu.

### 1.3 Dump DOM lengkap: identik

Setiap elemen berukuran >200.000 px², dengan `z-index`, `opacity`,
`background-color`, `background-image`, `mix-blend-mode` dan `visibility`,
segar vs kembali: **tidak ada satu pun perbedaan.** Kanvas dilaporkan hidup
1270×720 di keduanya.

Itu sendiri temuannya — gejala yang tidak muncul sama sekali di DOM.

### 1.4 Yang melihatnya hanya piksel

Mematikan lapisan satu per satu pada keadaan rusak:

```
/en kembali                     L = 143.2
  sembunyikan root webgl #0     L =  28.9     <- abu-abunya hilang seluruhnya
  sembunyikan root webgl #1     L = 143.2     <- tanpa efek
  sembunyikan keduanya          L =  28.9
```

Dan keadaan kedua root itu:

```
root#0  1270x720  position:fixed  pointer-events:none  visible       lost=TRUE
root#1     0x0    position:fixed  pointer-events:none  display:none  lost=true
```

`pointer-events: none` adalah sebabnya `document.elementsFromPoint` tidak
pernah melaporkannya, dan `getComputedStyle` tidak tahu apa pun tentang konteks
GL yang mati. **Kanvas berkonteks mati dikomposit sebagai abu-abu rata**, dan
ia menutup seluruh viewport.

### 1.5 Garis waktu, terinstrumentasi

`document.createElement` dibungkus untuk menandai tiap kanvas saat lahir, lalu
`webglcontextlost` / `webglcontextrestored` didengarkan pada masing-masing:

```
1374  created c3  di /en
3746  created c4  di /en/work        <- konteks kedua, c3 masih hidup
4246  LOST    c3  di /en/work        <- konteks /en mati sesudah pohonnya disembunyikan
6706  LOST    c4  di /en             <- dan kebalikannya, saat kembali
      (tidak pernah ada RESTORED)
```

Keadaan akhir pohon halaman:

```
ground#0  theme=dark  1270x8520  display:flex  webglRoots=1   <- pohon hidup, kanvas MATI
ground#1  theme=dark       0x0   display:none  webglRoots=1   <- pohon /en/work, disimpan Next
```

### 1.6 Sebabnya, di kode

`components/layout/wrapper/index.tsx:165` merender `<Canvas root={webgl}>`
**di dalam `<Theme global>`**, dan `<Wrapper>` dirender per halaman. Jadi
setiap rute memasang root WebGL-nya sendiri.

Next 16 `cachedNavigations` menyimpan pohon halaman sebelumnya dalam keadaan
tersembunyi. React menjalankan **cleanup efek** untuk pohon yang disembunyikan
sambil **mempertahankan DOM-nya**. R3F membongkar root-nya dari sebuah
`useEffect` ber-deps `[]`, jadi cleanup itu membuang renderer — sementara
elemen `<canvas>` tetap terpasang. Ketika pohon ditampilkan kembali, efek
berjalan lagi, tetapi setup ber-deps `[]` itu tidak membangun apa pun kembali.

Sisanya adalah kanvas `fixed` seukuran viewport dengan konteks mati, di atas
seluruh halaman.

### 1.7 Kenapa `ContextLossHandler` tidak menolongnya

`lib/webgl/components/canvas/webgl.tsx:20` sudah mengantisipasi kehilangan
konteks: `preventDefault()` pada `webglcontextlost`, `bumpContextGeneration()`
pada `webglcontextrestored`. Dua hal membuatnya tidak berlaku di sini:

1. Ia hidup **di dalam** root R3F. Ketika root itu dibongkar, komponennya ikut
   hilang — jadi tidak ada yang mendengarkan kehilangan yang menyusul.
2. `bumpContextGeneration` hanya dikonsumsi `lib/webgl/utils/fluid` dan
   `lib/webgl/utils/flowmaps`, untuk membangun ulang FBO. **Tidak ada yang
   memasang ulang kanvasnya.** Diverifikasi dengan mencari seluruh konsumennya.

Jadi mekanisme pemulihannya ada, lengkap, dan tidak terpasang ke jalur yang
sebenarnya terjadi.

---

## 2. Yang diperbaiki, dan kenapa bentuk ini

**Bukan** memindahkan kanvas ke layout. Itu jawaban arsitektural yang benar di
atas kertas — satu konteks seumur sesi — tetapi
`components/layout/theme/theme.module.css` menulis panjang kenapa `.ground`
adalah konteks penumpukan: tiga wash duduk di `z-index: -1` **di dalamnya**,
dan memindahkan kanvas keluar mengubah urutan cat sehingga ia jatuh di atas
seluruh teks. Itu tahapnya sendiri, dengan pengukuran urutan catnya sendiri.

Yang diperbaiki adalah yang gejalanya tuntut: **pohon yang ditampilkan kembali
tidak boleh memegang kanvas mati.** Ketika efek pemasangan berjalan lagi
sesudah pernah dibongkar, root R3F dipasang ulang lewat `key`, sehingga elemen
kanvas baru dan konteks baru lahir bersamanya.

Ini juga menutup kehilangan konteks yang sebenarnya — reset driver GPU, tab
yang lama di latar — yang `ContextLossHandler` memang sudah antisipasi tetapi
tidak bisa jangkau.

---

## 3. Daftar berkas

| berkas                                  | perubahan                                                                                                                                                             |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/webgl/components/canvas/webgl.tsx` | pasang ulang root R3F sesudah pembongkaran, dengan komentar yang menyatakan kenapa                                                                                    |
| `e2e/canvas-survives-navigation.e2e.ts` | **baru** — gerbangnya                                                                                                                                                 |
| `vault/webgl/scene-shell/index.tsx`     | koreksi di tempat: komentarnya menyatakan `OptionalFeatures` merender `<LazyWebGLCanvas root />` **tanpa syarat**; ia dipanggil tanpa prop `webgl`, jadi tidak pernah |
| `docs/stages/TAHAP-85.md`               | berkas ini                                                                                                                                                            |
| `docs/ROADMAP.md`, `docs/HANDOFF.md`    | posisi                                                                                                                                                                |

Apa pun di luar daftar ini adalah pemicu **T8**, dan berarti pemahamannya salah.

---

## 4. Kriteria keluar

1. `/en` sesudah pergi-lalu-kembali berada dalam **±15%** luminansi muat segar.
2. Sesudah navigasi, **nol** kanvas terlihat berkonteks mati.
3. Wash hero benar-benar tergambar setelah kembali — bukan sekadar tidak
   abu-abu, tetapi menambah cahaya seperti pada muat segar.
4. Gerbang terbukti **merah lebih dulu** terhadap kode hari ini, lalu hijau.
5. `bun run check` dan `bun run build` hijau; suite e2e tidak bertambah skip.

---

## 5. Risiko

| #   | risiko                                                                                                           | penangkal                                                                                                 |
| --- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| R1  | Pemasangan ulang menyala di Strict Mode dev pada tiap mount                                                      | Syaratnya "pernah dibongkar **dan** kanvasnya mati", bukan sekadar efek yang berjalan dua kali            |
| R2  | Pemasangan ulang menghapus keadaan scene yang sedang berjalan                                                    | Wash hero tidak punya keadaan berjalan; fluid/flowmap sudah membangun ulang FBO lewat `contextGeneration` |
| R3  | Gerbang baru ikut kelompok gerbang kanvas yang dikenal melewati dirinya sendiri di mesin ini (`HANDOFF.md` §5.1) | Jumlah skip dibandingkan ke log CI — pemicu **T2**                                                        |
| R4  | Kanvas mati di pohon **tersembunyi** tetap tertinggal                                                            | Diterima sadar: `display:none`, 0×0, konteksnya sudah dibuang, tidak menggambar apa pun                   |

---

## 6. Yang tidak dikerjakan, dinyatakan eksplisit

### 6.1 Kenapa sebagian navigasi lolos — belum terjawab

Hop 7 (`/en/practice/consulting` → `/en`) mendarat di L = 33.4, benar. Hop 3
dan hop 9 tidak. Perbedaannya belum diukur, dan menebaknya akan jadi klaim
tanpa angka. Yang dijamin perbaikan ini adalah **kanvas mati tidak pernah
bertahan** — yang menutup kedua cabang tanpa perlu tahu mana yang mengambilnya.

### 6.2 Kanvas tidak dipindahkan ke layout

§2. Itu tahapnya sendiri, dengan pengukuran urutan catnya sendiri.

### 6.3 Nol angka performa diklaim

`CLAUDE.md` #19. Pemasangan ulang membangun `WebGLRenderer` baru dan itu tidak
gratis; biayanya tidak diukur di tahap ini.

### 6.4 Dua kanvas di DOM tetap dua

R4. Yang dijamin adalah bahwa **yang terlihat** hidup.

---

## 7. Hasil

### 7.1 Gerbang baru: merah dulu, lalu hijau

Terhadap kode sebelum perbaikan, `e2e/canvas-survives-navigation.e2e.ts` gagal
di asersi yang tepat — penyebabnya, bukan gejalanya:

```
a visible canvas is holding a lost GL context  ->  Received: ["1270x720"]
```

Sesudah perbaikan: **2/2 lulus**, dua kali, `--workers=1`.

Uji keduanya (_"the wash still draws"_) **lulus terhadap kode yang rusak**, dan
itu dinyatakan, bukan disembunyikan: kanvas abu-abu memang menambah cahaya
(143 > 29). Tugasnya menjaga kegagalan kebalikannya — kanvas yang hidup tapi
tidak menggambar apa pun — yang uji pertama tidak bisa bedakan dari halaman
yang benar. Ia bukan bukti-merah untuk cacat ini, dan tidak diklaim sebagai
itu.

### 7.2 Sapuan sepuluh navigasi yang menemukannya, diulang

```
muat segar /en                                  L =  34.9   kanvas mati 0
hop 1  /en/journal             -> /en           L =  36.0   0
hop 3  /en/work                -> /en           L =  35.6   0    (sebelumnya 143.2)
hop 7  /en/practice/consulting -> /en           L =  33.7   0
hop 9  /en/journal             -> /en           L =  33.4   0    (sebelumnya 143.2)
hop 0, 5, 8  -> /en/journal                     L = 218.9 - 221.9  (tema terang, benar)
```

Setiap kedatangan kembali di `/en` berada dalam 4% dari muat segar. Kriteria
keluar §4 menuntut 15%.

### 7.3 Perbaikannya tidak berputar

Pemasangan ulang yang dipicu dari efek adalah bentuk yang bisa berputar tanpa
henti, jadi jumlah kanvas yang lahir dihitung dari waktu ke waktu:

```
muat segar /en, 1 s / 3 s / 6 s / 10 s     4 / 4 / 4 / 4
tiba di /en/work                           5
kembali ke /en, 1 s / 4 s / 8 s            6 / 6 / 6      <- tepat satu pembangunan ulang
```

Empat kanvas pada muat segar identik dengan garis waktu **sebelum** perbaikan
(c0-c3, §1.5). Pada muat segar cabang pembangunan ulang tidak pernah berjalan —
ia hanya menyala sesudah pohon disembunyikan lalu ditampilkan kembali.

### 7.4 Regresi: 11 merah, dan cara memilahnya

Empat belas spec yang menyentuh kanvas, WebGL, dan navigasi, `--workers=2`:

```
176 lulus · 11 gagal · 14 dilewati    (201, 17.2 mnt)
```

Sebelas merah **termasuk gerbang baru saya sendiri**, yang lulus dua kali saat
sendirian. Itu pemicu T1, dan dua dari kelompoknya jatuh tepat di tiga rute
yang memakai `webgl` — jejak yang sama dengan jejak perubahan ini. Jadi ia
diperlakukan sebagai tersangka, bukan sebagai beban mesin.

| kelompok                                                                                                                           | isolasi `--workers=1`                                                      | putusan             |
| ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------- |
| desktop: 2x `canvas-survives-navigation` (timeout), 3x `motion.e2e.ts:156` strands (`/en`, `/en/work`, `/en/work/arus-balik`)      | **5 lulus**                                                                | beban mesin         |
| mobile: `visual-substance.e2e.ts:602` footer (4 rute), `:178` aksen `/en/practice/consulting`, `journey.e2e.ts:513` reduced motion | 4 lulus · 2 gagal · 6 dilewati                                             | lihat bawah         |
| mobile `:602` `/en` dan `/id`, merah sendirian                                                                                     | anggaran uji dinaikkan ke 150 s: **`/en` lulus**, `/id` melewatkan dirinya | anggaran screenshot |

Dua yang tetap merah sendirian gagal di **`page.screenshot`**, bukan di
asersinya: uji itu memotret 1280x800 pada emulasi ponsel dua kali, dan
tangkapan kedua melampaui anggaran 30 detik. Diberi waktu, asersinya — _kanvas
tidak menimpa footer_ — hijau dengan perbaikan ini. `/id` melewatkan dirinya
karena kanvas terlambat muncul: kelas `HANDOFF.md` §5.1, yang tetap terbuka.

`motion.e2e.ts:156` dan `visual-substance.e2e.ts:602` keduanya memuat halaman
lewat `page.goto` segar, tanpa navigasi sisi-klien. §7.3 mengukur bahwa
perbaikan ini tidak melakukan apa pun pada muat segar.

**Yang tidak diukur, dinyatakan:** waktu screenshot footer mobile tidak
dibandingkan dengan build **sebelum** perbaikan di mesin ini. Putusan "anggaran
screenshot" bersandar pada §7.3 dan pada CI Linux, tempat uji yang sama hijau
di run Tahap 84. Log CI sesudah push adalah pembandingnya (pemicu **T2**).

### 7.5 Log perpindahan mode

```
E->R  T3  komentar resolve-color.ts merekam cacat Tahap 54 berbentuk sama;
          diukur: ground ditemukan, kedua kaskade rgb(17,15,13) — teori gugur
R->E  sebab: kanvas mati bertahan di pohon yang ditampilkan kembali (§1.4-1.6)
E->R  T1  regresi 11 merah, termasuk gerbang baru
R->E  sebab: beban mesin (5 desktop hijau sendirian) dan anggaran screenshot
          (footer /en hijau dengan 150 s); nol loop pemasangan ulang (§7.3)
```

Tiga upaya pengukuran di putaran R kedua — batas §3.6 rencana tercapai tepat,
tidak dilewati.

### 7.6 Gerbang lain

```
bun run check    591 lulus, 0 gagal
bun run build    hijau (rm -rf .next/cache lebih dulu)
```

### 7.7 Yang tidak dikerjakan, dinyatakan eksplisit

- **§6.1 tetap terbuka.** Dengan perbaikan ini kesepuluh hop benar, jadi
  pertanyaan kenapa hop 7 lolos **sebelum** perbaikan tidak lagi mengubah apa
  pun — tetapi jawabannya tidak diukur, dan tidak ditebak.
- **`HANDOFF.md` §5.1 tidak disentuh.** Gerbang itu memuat halaman segar lewat
  `goto`; cacat ini hanya muncul pada perjalanan pulang-pergi. Mekanismenya
  berbeda, dan tahap ini tidak mengklaim menutupnya. Sembilan timeout di
  regresi ini adalah data tambahan untuk tahap yang kelak memperbaikinya.
- **Kanvas tetap per halaman** — §2, §6.2.
- **Nol angka performa diklaim** — `CLAUDE.md` #19.
