# Tahap 88 — Palet pencarian untuk jari, bukan hanya untuk keyboard

> **Status: terkirim.** Spec ditulis lebih dulu sesuai `ROADMAP.md` §3.0;
> satu temuan ditambahkan saat implementasi (§1.3), hasilnya di §7.
>
> Diminta pemilik repo, dengan screenshot palet pencarian: _"kita juga butuh
> navigasi button tambahan untuk handphone/tab (karena mereka mungkin tidak
> punya tombol panah. Dan hindari untuk membangun scrolling button untuk
> mobile)"_.

---

## 1. Pengukuran

### 1.1 Palet di perangkat sentuh, hari ini

Build produksi, emulasi Playwright `iPhone 13` dan `iPad (gen 7)` (viewport,
DPR, `hasTouch`, `isMobile`), palet dibuka dengan **mengetuk** tombol Search:

```
                        iPhone 390                    iPad 810
hover / pointer         none / coarse                 none / coarse
tombol tutup            "Close search" 1×1, sr-only   sama
kaki palet              "Enter to open, Escape to close." + ↑↓ (iPad)
tinggi baris hasil      101 px                        66 px
ketuk di luar panel     menutup                       menutup
```

Tiga hal terbaca:

1. **Pengguna sentuh yang melihat tidak punya kontrol untuk keluar.** Satu-satunya
   tombol tutup adalah `sr-only` — ada untuk pembaca layar, tak terlihat untuk
   mata. Mengetuk di luar panel memang menutupnya, tetapi tidak ada yang
   memberi tahu itu, dan di ponsel panel menutupi hampir seluruh layar.
2. **Petunjuknya berbicara kepada keyboard yang tidak ada.** "Enter", "Escape",
   dan ↑↓ tampil di ponsel dan tablet. VoiceOver di ponsel juga membacakannya,
   karena petunjuk itu adalah `aria-describedby` kolom pencarian.
3. **iPad 810 px memakai tata letak desktop** (breakpoint 800). Jadi "perangkat
   sentuh" tidak bisa dibaca dari lebar layar; ↑↓ saat ini tampil di iPad
   karena ia diatur per lebar.

Yang **sudah** benar dan tidak disentuh: baris hasil 66–101 px (di atas batas
sentuh 44 px), mengetuk hasil membukanya, dan daftarnya digulir dengan jari.

### 1.2 Keputusan lama yang diubah, dan hanya di tempat yang ia salah

`components/ui/command/palette.tsx` menyembunyikan tombol tutup dengan sengaja:
_"the palette's own frame already reads as dismissible, and a visible ✕ inside
a search field competes with the field's own clear affordance."_

Alasan itu benar untuk mouse dan keyboard — ada Escape, dan kursor menemukan
tepi bingkai. Ia tidak benar untuk jari. Keputusan itu dipertahankan di
perangkat dengan pointer halus, dan diubah hanya di perangkat tanpanya.

### 1.3 Ditemukan dari screenshot tahap ini sendiri: jalur yang menabrak judul

Tangkapan iPad yang diambil untuk memeriksa tombol tutup memperlihatkan hal
lain: di bagian Practices, jalur di kolom kiri tercetak masuk ke judul —
"/practice/consultin**Consulting**".

```
800   "/practice/consulting"  masuk 14 px ke judulnya   "/practice/commission"  14 px
810   keduanya                12 px
1024 ke atas                  bersih
```

Kolom kiri adalah 2/12 lebar lembar, sekitar 105 px di 800, dan kedua jalur itu
tidak punya titik putus sama sekali. `/practice/ai-data` lolos hanya karena
punya tanda hubung. Cacat ini sudah ada sebelum tahap ini, di berkas yang sudah
ada di daftar §3, dan ia persis soal tablet yang tahap ini tangani — jadi
dikerjakan di sini, bukan ditunda.

---

## 2. Rancangan

Dibedakan dengan `usePointerIsFine()` (`lib/hooks/use-sync-external.ts`,
`(hover: hover) and (pointer: fine)`) — hook yang sudah ada untuk pertanyaan
persis ini, dan berlangganan perubahan, jadi tablet yang dipasangi keyboard
beralih sendiri.

|              | pointer halus (mouse, trackpad)   | tanpa pointer halus (jari)                             |
| ------------ | --------------------------------- | ------------------------------------------------------ |
| petunjuk     | "Enter to open, Escape to close." | "Tap a result to open." / "Ketuk hasil untuk membuka." |
| ↑↓           | tampil                            | tidak                                                  |
| tombol tutup | `sr-only`, seperti hari ini       | **terlihat**, di kaki palet, ≥ 44 px                   |

- **Kaki, bukan baris pencarian.** Tempat ibu jari berada, dan jauh dari kolom
  pencarian — jadi alasan lama (_bersaing dengan affordance kolom_) tidak
  terlanggar di mana pun.
- **Selalu tepat satu kontrol tutup** di DOM: yang `sr-only` di pointer halus,
  yang terlihat di jari.
- **Tidak ada tombol gulir naik/turun**, sesuai permintaan. Gulir dengan jari
  sudah bekerja; tombol pengganti panah akan menjadi cara yang lebih lambat
  untuk melakukan hal yang sama.
- Petunjuk dipilih di JavaScript, bukan disembunyikan dengan CSS, karena
  pembaca layar membacanya lewat `aria-describedby`.

---

## 3. Daftar berkas

| berkas                                                | perubahan                                          |
| ----------------------------------------------------- | -------------------------------------------------- |
| `components/ui/command/palette.tsx`                   | petunjuk dan kontrol tutup per jenis pointer       |
| `components/ui/command/command.module.css`            | tombol tutup kaki; ↑↓ per pointer, bukan per lebar |
| `messages/en.json`, `messages/id.json`                | `search.hintTouch`                                 |
| `e2e/palette-touch.e2e.ts`                            | **baru** — gerbang                                 |
| `docs/stages/TAHAP-88.md`, `ROADMAP.md`, `HANDOFF.md` | berkas ini dan posisi                              |
| `docs/stages/TAHAP-87.md`                             | §7.8: perbandingan CI tahap sebelumnya             |

---

## 4. Kriteria keluar

1. Di emulasi iPhone dan iPad: tombol tutup **terlihat**, ≥ 44 × 44 px, dan
   mengetuknya menutup palet.
2. Di keduanya: kaki palet tidak menyebut Enter, Escape, atau ↑↓.
3. Di keduanya: tidak ada tombol selain tombol tutup di dalam palet — tidak ada
   tombol gulir.
4. Di desktop dengan mouse: petunjuk keyboard dan ↑↓ tetap; tombol tutup tetap
   `sr-only`.
5. Gerbang terbukti **merah lebih dulu** terhadap kode hari ini.
6. `command-palette.e2e.ts` dan `route-sweep` (axe) tetap hijau.

---

## 5. Risiko

| #   | risiko                            | penangkal                                                                                                                   |
| --- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| R1  | Emulasi Chromium bukan Safari iOS | Yang diuji adalah media query `hover`/`pointer`, yang keduanya laporkan sama untuk sentuh; dinyatakan, bukan diklaim setara |
| R2  | Laptop layar sentuh dengan mouse  | `(hover: hover) and (pointer: fine)` membaca pointer utama; ia tetap mendapat versi keyboard                                |

---

## 6. Yang tidak dikerjakan, dinyatakan eksplisit

- **Tidak ada tombol gulir** — permintaan eksplisit.
- **Tidak ada chip kategori** (Halaman / Praktik / Karya / Jurnal). Tidak
  diminta, dan akan menjadi cara kedua untuk menavigasi daftar yang sudah bisa
  diketik dan digulir.
- **Nol angka performa diklaim** — `CLAUDE.md` #19.

---

## 7. Hasil

### 7.1 Tombol tutup dan petunjuk: merah dulu, lalu hijau

`e2e/palette-touch.e2e.ts` terhadap palet sebelum tahap ini:

```
iPhone: the palette offers no visible button — [{"label":"Close search","width":1,"height":1}]
iPad:   sama
mouse:  lulus — versi keyboard tidak berubah, seperti seharusnya
```

Sesudahnya: tombol **"Close search" / "Tutup pencarian"** terlihat di kaki
palet, ≥ 44 × 44 px, dan mengetuknya menutup palet; petunjuknya "Tap a result
to open." / "Ketuk hasil untuk membuka."; tidak ada ↑↓ dan tidak ada tombol lain.
Dengan mouse: petunjuk keyboard, ↑↓, dan tombol tutup `sr-only` tetap.

Satu catatan jujur tentang bukti-merah: pemeriksaan teks kaki membaca
`[data-palette-foot]`, atribut yang ditambahkan tahap ini, jadi ia tidak bisa
dijalankan terhadap build lama. Yang terbukti merah di build lama adalah
asersi tombol yang terlihat, yang gagal lebih dulu.

### 7.2 Jalur yang menabrak: gerbang saya lulus padahal seharusnya merah

Versi pertama pemeriksaan kolom kiri **lulus terhadap build yang meluber.** Ia
mengukur segera setelah palet terlihat, sebelum font mono termuat, dalam font
fallback yang cukup sempit untuk muat. Probe yang menemukan cacatnya menunggu
700 ms. Pemeriksaannya kini menunggu `document.fonts.ready` dan entrance palet,
lalu **merah** di tempat yang benar:

```
800  "/practice/consulting" reaches 14px into its title
     "/practice/commission" reaches 14px into its title
810  12px
```

Angka 30 px dari probe pertama adalah 14 px ditambah celah kolom 16 px — dua
instrumen, satu pengukuran.

Perbaikannya dua lapis: `<wbr>` sesudah setiap `/`, sehingga jalur membungkus
di batas segmennya (`/practice/` + `consulting`), dan `overflow-wrap: anywhere`
sebagai jaring untuk segmen yang lebih panjang dari kolom. `/practice/ai-data`
memilih putus di tanda hubungnya sendiri (`/practice/ai-` + `data`) — titik
putus yang sah, tidak menabrak, dan dibiarkan: memaksanya mengorbankan jaring
pengaman.

### 7.3 Gerbang

```
bun run check    597 lulus, 0 gagal
bun run build    hijau
palette-touch + command-palette + header-balance   27/27
```

Dilihat dengan mata di emulasi iPhone (`/id`) dan iPad (`/en`).

### 7.4 Log perpindahan mode

```
E->R  T6  pemeriksaan kolom kiri lulus terhadap build yang meluber
R->E  sebab: diukur sebelum font mono termuat; menunggu fonts.ready; merah lalu hijau
```

### 7.5 Yang tidak dikerjakan, dinyatakan eksplisit

- **Tidak ada tombol gulir** dan **tidak ada chip kategori** — §6.
- **Bukan uji iOS Safari.** Emulasi Chromium; yang diuji adalah media query
  yang dipakai keputusan ini — R1.
- **Nol angka performa diklaim** — `CLAUDE.md` #19.
