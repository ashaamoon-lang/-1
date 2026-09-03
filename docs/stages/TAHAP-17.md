# Tahap 17 — Audit: situs ini dilihat, bukan hanya dibaca

> Pendalaman wajib atas `docs/ROADMAP.md` §3.0.

Permintaan pemilik: **jangan sampai website terlihat buruk**, terapkan standar
award dan sistem library yang sudah dirancang, lalu mulai audit dan perbaiki
kodenya ke depan.

Kalimat pertamanya menentukan metodenya. "Terlihat buruk" adalah pertanyaan
visual, dan enam belas tahap sebelumnya **tidak pernah sekali pun merender
halaman lalu memandanginya**. Semua gerbang memeriksa DOM, header, ukuran
bundel, dan pelanggaran aturan. Tidak satu pun menanyakan seperti apa
tampilannya.

---

## 1. Metode

Tiga instrumen, dipakai berurutan supaya yang satu mengoreksi yang lain.

1. **Sapuan konformansi** — grep atas hex/px/ms/`cubic-bezier` mentah di
   seluruh sumber terkirim.
2. **Inventaris konsumen** — tiap komponen dihitung berapa berkas mengimpornya.
3. **Render dan pandangi** — sembilan tangkapan layar, `/en` di 1280×800 dan
   390×844, pada lima posisi scroll, lalu **piksel-nya diukur** dengan `sharp`:
   luminansi min/p05/mean/p95/max dan simpangan baku dalam petak 96×96 sebagai
   proksi grain.

Instrumen ketiga itu yang menemukan cacat terbesar, dan dua instrumen pertama
melewatkannya sama sekali.

### 1.1 Instrumen pertama saya salah bentuk, lagi

Sapuan hex pertama saya dipotong `head -10`, dan sepuluh baris pertamanya
kebetulan semuanya komentar di satu berkas yang mendokumentasikan keputusan
kontras. Kesimpulan yang saya tulis: "bersih, nol hex mentah".

**Salah.** Diulang tanpa potongan dan dengan komentar dibuang, hasilnya
**tepat dua baris**, dan keduanya di berkas yang persis jadi pusat seluruh
tahap ini. Kalau angka pertama itu masuk laporan, audit ini akan dibuka dengan
"sistem token dipatuhi sempurna" tepat di atas pelanggarannya.

---

## 2. Temuan

| #   | Temuan                                                                                            | Bukti                                  | Status         |
| --- | ------------------------------------------------------------------------------------------------- | -------------------------------------- | -------------- |
| F1  | Aksen WebGL hero **mengurangi cahaya**: layar pertama lebih gelap dengan canvas daripada tanpanya | mean 4.0/255 vs 15.5/255               | **Diperbaiki** |
| F2  | Dua-satunya hex mentah di seluruh kode terkirim ada di berkas hero itu                            | `#0d0d0d`, `#242527`                   | **Diperbaiki** |
| F3  | Aturan token `CLAUDE.md` #8/#10 **tidak punya gate sama sekali**                                  | ROADMAP §1.5: "ditegakkan saat review" | **Diperbaiki** |
| F4  | Grain dikalibrasi melawan pipeline yang rusak                                                     | sd 21.0/255 setelah F1 diperbaiki      | **Diperbaiki** |
| F5  | Layar pertama 38% (desktop) / **59% (mobile)** kosong                                             | 305px / 502px                          | Berkurang      |
| F6  | Sebelas komponen `components/ui/*` nol pemakai                                                    | inventaris §5                          | Dicatat        |
| F7  | Kartu karya setengah lebar sendirian meninggalkan lubang selebar layar                            | tangkapan `/en` y=800                  | Dicatat        |

---

## 3. F1 — aksen yang mengurangi cahaya

Layar pertama situs ini adalah persegi hitam rata. Diukur pada band antara
header dan headline, di mana tidak ada teks sama sekali:

```
dengan canvas   : mean 4.0/255, rentang gradien (p05–p95) 2.0/255
canvas disembunyikan : mean 15.5/255, rentang 0.0/255
```

**Halaman ini terlihat lebih baik dengan dekorasinya sendiri dimatikan.**

Rantai pengukurannya, karena tiap langkah membunuh satu hipotesis:

1. Canvas ada, 1270×800, `opacity: 1`. Bukan soal mount.
2. `readPixels` di tengah band mengembalikan `[0,0,0,0]` — **instrumen salah**:
   tanpa `preserveDrawingBuffer`, buffer sudah dibersihkan setelah komposit.
   Pembacaan itu tidak memberi tahu apa pun dan hampir membuat saya
   menyimpulkan mesh-nya tidak menggambar.
3. Wash dipaksa `#ffffff` lalu **dibuild ulang**: band jadi mean 166. Jadi
   mesh-nya menggambar, dan pipeline-nya bekerja.
4. Kurvanya yang salah. `#242527` adalah 39, dan
   **`(39/255)^2.2 × 255 = 4.1`** — persis angka yang terukur. Keluarannya
   ditulis linier tanpa konversi.

Sebabnya satu kata, di `lib/webgl/components/canvas/webgl.tsx`:

```tsx
linear // ← warisan fork Satūs
```

Prop `linear` milik R3F menyetel `outputColorSpace` ke linier, yang mematikan
konversi sRGB di sisi keluaran. three tetap mengonversi tiap `new Color(...)`
dari sRGB **ke** linier di sisi masukan. Konversi mati di satu ujung saja, jadi
setiap warna custom-shader mendarat sebagai `authored ^ 2.2`.

Setelah `linear` dicabut dan `#include <colorspace_fragment>` ditambahkan ke
shader hero:

```
dengan canvas   : mean 27.4 → 30.2/255, rentang gradien 10.1 → 13.9/255
canvas disembunyikan : 15.5/255 (tidak berubah)
```

Aksennya sekarang **menambah** cahaya di atas latar, dan gradiennya punya
modulasi tujuh kali lipat dari sebelumnya.

### 3.1 F4 — dan perbaikan itu membuka kalibrasi kedua

Grain hero disetel `0.06`, dan angka itu dipilih **melawan pipeline yang
rusak**: ia ikut tergerus ^2.2 seperti semua yang lain. Dengan kurva yang
benar ia terukur **sd 21.0/255** di petak 96×96 — 77% dari mean band. Itu bukan
film grain, itu statik.

Diturunkan ke `0.014`, terukur **sd 6.45/255**. Terlihat sebagai tekstur, bukan
derau.

Ini konsekuensi yang jujur dan bisa diduga: **setiap nilai yang disetel dengan
mata melawan pipeline yang salah harus disetel ulang setelah pipeline-nya
benar.** Hanya grain yang terpengaruh; plat material lolos karena shader-nya
meneruskan tekstur apa adanya tanpa konversi di kedua ujung —
`e2e/material-layer.e2e.ts` tetap hijau.

---

## 4. F2 dan F3 — sistemnya dilewati persis di tempat terburuknya

Dua-satunya hex mentah di seluruh kode terkirim:

```
vault/webgl/scene-shell/index.tsx:  colorA = '#0d0d0d'
                                    colorB = '#242527'
```

Itu bukan kebetulan yang layak disebut sambil lalu. **Satu-satunya tempat
sistem desain dilewati adalah satu-satunya tempat situs terlihat paling
kosong.** Palet adalah sistem; nilai yang ditulis di luarnya adalah nilai yang
tidak pernah disetel, ditinjau, atau diperiksa kontrasnya oleh siapa pun.

Sekarang keduanya token:

```css
--hero-wash-from: var(--color-primary);
--hero-wash-to: color-mix(
  in oklab,
  var(--color-secondary) 12%,
  var(--color-primary)
);
```

WebGL tidak bisa membaca `color-mix(in oklab, …)`, jadi
`lib/styles/resolve-color.ts` meneruskannya lewat mesin warna browser sendiri:
satu elemen sekali-pakai menyelesaikan cascade (properti kustom **tidak**
dikomputasi kalau dibaca langsung dari `documentElement`), lalu kanvas 1×1
memaksa hasilnya jadi sRGB konkret — `ctx.fillStyle` saja tidak cukup, Chrome
mengembalikan `lab(4.43 0.58 1.35)` apa adanya.

**Dan gate-nya.** ROADMAP §1.5 mencatat aturan token sebagai "ditegakkan saat
review" — cara lain mengatakan ditegakkan oleh siapa pun yang ingat. Tidak ada
yang ingat, selama enam belas tahap. `lib/styles/scripts/motion-rules.test.ts`
sudah menjaga aturan gerak, tapi **ia memindai CSS**, dan warna yang diserahkan
ke WebGL adalah nilai TypeScript.

`lib/styles/scripts/token-rules.test.ts` menutupnya. Dibuktikan merah dulu
dengan mengembalikan kedua literal itu:

```
error: raw hex colour outside the palette:
  vault/webgl/scene-shell/index.tsx:128  const WASH_FROM = '#0d0d0d'
  vault/webgl/scene-shell/index.tsx:129  const WASH_TO = '#242527'
```

Ditambah: `--hero-wash-to` sekarang masuk daftar token turunan yang diperiksa
`contrast.test.ts`, dan sebuah pasangan baru diukur — **tinta di atas wash
hero**. Headline hero duduk di atas wash itu, jadi mencerahkannya adalah
keputusan kontras. Gate proyek ini sendiri yang menuntut itu: penambahan token
saya langsung membuat `contrast.test.ts` merah karena daftarnya terkunci.

---

## 5. F6 dan F7 — dicatat, tidak dikerjakan

**F6 — sebelas komponen nol pemakai.** `accordion`, `alert-dialog`, `fold`,
`form`, `marquee`, `menu`, `scrollbar`, `select`, `switch`, `tabs`, `tooltip`
— seluruhnya `components/ui/*`, seluruhnya pembungkus Base UI warisan fork
Satūs. `vault/` sebaliknya **habis terpakai** kecuali `primitives/cursor`.

Tidak dihapus di tahap ini, dan alasannya bukan keraguan: menghapus sebelas
komponen adalah keputusan yang tidak bisa dibatalkan dan bukan yang Anda minta.
Yang bisa dikatakan dengan angka: mereka tidak menambah bobot rute mana pun
(tak terimpor berarti ter-tree-shake), tapi mereka menambah ~100 tes story ke
suite a11y dan permukaan yang harus dibaca siapa pun yang masuk ke repositori
ini. Rekomendasi: hapus, di tahapnya sendiri, dengan `/simplify`.

**F7 — kartu setengah lebar sendirian.** Kartu pertama di grid beranda
setengah lebar dan berdiri sendiri, meninggalkan separuh layar kosong di
sebelahnya; dua kartu setengah berikutnya berpasangan dengan benar. `span`
datang dari CMS per proyek, jadi ini interaksi data-dengan-layout, bukan bug
CSS — dan memperbaikinya berarti memutuskan apakah grid boleh menata ulang
urutan kurasi studio. Itu keputusan desain yang butuh tahapnya sendiri.

**F5 — kekosongan hero.** 305px desktop, 502px mobile, terukur. Strukturnya
disengaja: hero tiga-jangkar dengan indeks di atas dan ajakan di bawah. Yang
salah bukan jaraknya, melainkan bahwa tidak ada apa pun di antaranya — dan itu
F1. Dengan wash yang benar-benar terlihat, ruang itu terbaca sebagai ruang
negatif, bukan area yang belum selesai. Satu koreksi atas mata saya sendiri:
saya sempat menulis indeks praktik "melayang salah posisi"; diukur, ia rata
kanan dengan benar pada 24px dari tepi, sama persis dengan header.

---

## 6. Yang **tidak** diklaim

- **Tidak ada angka performa.** Tidak ada profiler di lingkungan ini
  (`CLAUDE.md` #19). Semua angka di dokumen ini adalah luminansi piksel dan
  geometri tata letak.
- **Belum semua halaman dipandangi.** Yang dirender dan diperiksa dengan mata:
  `/en` dua viewport pada lima posisi scroll. `/en/work`, detail proyek,
  halaman praktik dan `/id` baru lewat gerbang otomatis, belum lewat mata.
  Disebut karena "audit visual" yang setengah jalan lebih berbahaya kalau
  dilaporkan sebagai selesai.
- **Kredensial tidak dirotasi**, sesuai permintaan Anda.

---

## 7. Angka

```
bun run check      exit 0    (401 unit test — satu gate baru)
CI=true test:e2e   275 lulus, 0 gagal
```

| Ukuran                      | Sebelum | Sesudah |
| --------------------------- | ------- | ------- |
| Band hero, mean luminansi   | 4.0     | 30.2    |
| Band hero, rentang gradien  | 2.0     | 13.9    |
| Grain (sd, petak 96×96)     | 21.0    | 6.45    |
| Hex mentah di kode terkirim | 2       | 0       |
| Gate untuk aturan token     | 0       | 1       |
