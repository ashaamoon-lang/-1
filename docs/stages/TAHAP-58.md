# Tahap 58 — Halaman yang paling menjual satu karya tidak menampilkan karyanya

> Ditemukan bukan oleh gerbang, melainkan dengan **melihat**. Saya menjalankan
> build produksi dan menjelajahi situsnya sebagai pengunjung; di
> `/en/work/<slug>` kotak besar di kiri — tempat sampul karya seharusnya —
> kosong. Lima puluh delapan tahap, CI hijau, dan gambar terbesar di halaman
> terpenting tidak ada.

## 1. Yang diukur

Build produksi, Chromium 1440×900, `bun run start`.

| tempat                                   | piksel di dalam plate                               |
| ---------------------------------------- | --------------------------------------------------- |
| `/en/work/arus-balik` hero               | **#201d1b** — warna kotak penampung (`--surface-2`) |
| karya **yang sama** di `/en/work`        | **#8d4725** · #6e361d · #4b392b                     |
| hero yang sama, `prefers-reduced-motion` | **#bb9973** — karyanya, benar                       |

Tidak berubah setelah 3,5 detik, tidak berubah setelah plate digulir ke tengah
layar, tidak berubah oleh gerak pointer, gulir, atau resize. Pemindaian
seluruh viewport: **nol piksel berwarna karya** di mana pun.

DOM-nya menjelaskan separuhnya: `data-material` aktif, `opacity` shell **0**,
`opacity` img 1. Yaitu `vault/webgl/material-image` menyembunyikan `<img>`
DOM karena mesh mengumumkan frame pertamanya — persis kontrak yang komponen
itu janjikan — lalu mesh-nya tidak melukis apa pun di tempatnya.

## 2. Empat hipotesis, dibangun dan digugurkan

Tiap satunya diuji dengan build sungguhan, bukan dengan penalaran.

1. **Identitas `simTypes`.** Rute ini satu-satunya yang mengoper
   `simTypes={['flowmap']}` sebagai literal inline; `/en` dan `/en/work`
   memakai konstanta modul, dan `flowmap-provider` mendokumentasikan sendiri
   bahwa default-nya "hoisted so the default is referentially stable across
   renders". Di-hoist → plate tetap **#201d1b**. **Gugur.**
2. **Kanvas tidak pernah menggambar ulang.** Digoyang dengan gerak pointer,
   gulir 120px, gulir balik, dan resize 1px. Kelimanya: **#201d1b**. **Gugur.**
3. **Opsi Lenis.** `/en/work` adalah satu-satunya rute bermaterial yang tidak
   mengoper opsi Lenis, dan `useWebGLRect` memang membaca `lenis.scroll`.
   Tapi `/en` mengoper `lenis={{ anchors: true }}` yang sama **dan bekerja**
   (#70391c, #2b5e49). **Gugur.**
4. **`<ViewTransition>`.** Satu-satunya perbedaan struktural yang tersisa.
   Dilepas sementara, dibangun ulang → plate tetap **#201d1b**. **Gugur.**

## 3. Yang mesh-nya sendiri laporkan

Probe sementara di dalam `useFrame` milik `vault/webgl/material-image/scene.tsx`:

```
pos=-413,-312  scale=572x715  size=1430x900  scroll=0  tex=yes  vis=true
```

Semuanya **benar**. Kamera ortografis dalam satuan piksel: posisi itu jatuh di
layar pada 302×762, persis titik tengah plate (16+286, 404+357). Skalanya sama
persis dengan kotaknya. Teksturnya termuat. `visible` true.

**Jadi cacatnya ada di hilir komponen ini, dan saya belum menemukannya.**
Saya menuliskannya begitu alih-alih mengarang sebab, karena tahap berikutnya
yang membacanya akan menghemat lima build kalau tahu apa yang sudah gugur.

## 4. Yang dikerjakan — dan ini mundur, bukan menang

Material di hero halaman proyek **dimatikan**, mengembalikan opt-in Tahap 45.

Alasannya sederhana dan tidak nyaman: pembaca yang melihat karyanya
mengalahkan efek hover pada plate yang bahkan bukan tautan. Jalur
reduced-motion sudah membuktikan gambarnya benar (#bb9973) begitu material
keluar dari jalur.

Ikutannya, karena kanvas kehilangan satu-satunya konsumennya di rute itu:

- `webgl` dan `simTypes` dicabut dari `Wrapper` halaman proyek — membiarkannya
  berarti memuat three.js, satu render pass tiap frame, dan satu listener
  pointer untuk mesh yang tidak diminta siapa pun;
- `e2e/route-budget.e2e.ts` mencabut `three` dari izin rute itu, dengan
  alasannya ditulis ulang. Plafon tetap 2100 — entri itu tentang _apa yang
  boleh dimuat_, dan menurunkannya sekarang hanya berarti menaikkannya lagi
  saat materialnya kembali.
- `simTypes` tetap di-hoist di dua rute lain; hoist di rute ini ikut hilang
  bersama konsumennya.

Satu kata mengembalikannya begitu sebabnya ketemu.

## 5. Yang gerbangnya tidak lihat, dan kenapa

`e2e/visual-substance.e2e.ts › /en/work/arus-balik renders its work` **hijau**
selama cacat ini hidup. Gerbang itu bertanya "apakah halaman ini merender
karya", dan halaman itu memang merender karya — **plate galerinya**. Hero-nya
kosong dan tidak ada yang menanyakannya.

Ini pengulangan pelajaran Tahap 17 dalam bentuk baru: _"apakah ada kanvas"_
dan _"apakah kanvas itu menggambar sesuatu"_ adalah dua pertanyaan berbeda,
dan sekarang ada yang ketiga — **"apakah gambar terbesar di halaman ini
terlihat"**. Gerbang untuk itu belum ada, dan tidak dibuat di tahap ini:
menulisnya sekarang berarti menulis gerbang yang lulus karena materialnya
dimatikan, bukan karena masalahnya selesai. Ia dicatat di sini sebagai utang.

## 6. Hasil

### 6.1 Plate-nya kembali

Instrumen yang sama, build produksi sesudah perbaikan:

|                                    | sebelum | sesudah     |
| ---------------------------------- | ------- | ----------- |
| `/en/work/arus-balik` hero, normal | #201d1b | **#bb9973** |
| hero yang sama, reduced motion     | #bb9973 | **#bb9973** |
| jumlah kanvas di rute itu          | 1       | **0**       |
| `data-material-shell` di rute itu  | 1       | **0**       |

Kontrol, yang tidak boleh bergerak dan tidak bergerak: `/en/work` tetap enam
shell bermaterial dengan piksel karya yang sama (#713a1d · #2a5e48 · #c5bdae ·
#452f53).

### 6.2 Gerbang

`bun run check`: **421 lulus, 0 gagal**. `build-storybook` sukses.

Tujuh berkas yang paling mungkin terganggu — `route-budget`, `webgl-budget`,
`visual-substance`, `project-detail`, `material-layer`, `journey`, `motion`,
dua viewport: **142 lulus, 0 gagal, 16 dilewati** (8,2 menit).

### 6.3 Satu assertion berhenti berjalan, dan itu harus ditulis

Di antara 16 yang dilewati ada
`visual-substance › a footer under a canvas is still readable ›
/en/work/arus-balik keeps its footer out from under the canvas`.

Ia dilewati **karena perubahan ini**: rute itu tidak lagi punya kanvas, dan
gerbang itu melewati dirinya sendiri kalau tidak ada kanvas. Itu perilaku yang
benar, tapi hasilnya satu assertion yang kemarin berjalan hari ini tidak —
dan repo ini punya sejarah dengan tepat bentuk kegagalan itu (`TAHAP-14` §11.5,
`material-layer` yang melewati dirinya sendiri sambil melaporkan hijau).

Dicatat, bukan didiamkan. Ia kembali berjalan sendiri begitu materialnya
kembali.
