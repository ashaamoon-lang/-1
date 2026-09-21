# Tahap 87 — Header yang tidak pernah diletakkan

> **Status: terkirim.** Spec ditulis lebih dulu sesuai `ROADMAP.md` §3.0;
> hasilnya, termasuk satu risiko yang terbukti nyata, di §7.
>
> Dilaporkan pemilik repo dengan screenshot `/studio`: _"Pada bagian Section
> Navbar posisinya tidak simetris dan cenderung bertabrakan (tidak di tepatkan
> pada posisi yang benar)"_.

---

## 1. Pengukuran

### 1.1 Posisi tiap item, enam lebar, dua bahasa

`components/layout/header` adalah `display: flex; justify-content:
space-between` dengan empat anak terlihat di desktop: merek, nav, search,
bahasa. Diukur di build produksi:

```
          nav              pusat nav   pusat header   awal nav   jarak antar-item
/en  800  163–350            257          395          c4        109 / 110 / 109
/en 1024  236–426            331          507          c4+16     182 / 183 / 183
/en 1280  320–515            418          635          c4+36     265 / 265 / 265
/en 1440  372–575            474          715          c4+48     312 / 312 / 312
/en 1600  424–635            530          795          c5−56     359 / 359 / 359
/en 1920  528–755            642          955          c5−59     453 / 452 / 453
/id       bergeser 5–9 px dari /en di setiap lebar — label berbeda panjang
```

Tiga hal terbaca dari tabel itu:

1. **Nav tidak pernah di tengah.** Ia melenceng 138 px di 800 dan 313 px di
   1920, selalu ke kiri.
2. **Ia tidak jatuh di kolom mana pun.** Awalnya berpindah dari c4 ke c5 dan
   meleset dari kolom mana pun hingga 59 px, bergantung lebar layar.
3. **Satu-satunya aturannya "jarak sama rata"**, dan jarak itu hasil pembagian
   sisa ruang — jadi posisi setiap item bergantung pada lebar teks item lain.
   Label Bahasa Indonesia menggeser nav.

Tidak ada dokumen desain di repo yang pernah memutuskan tata letak header.
Ia tidak dirancang; ia dibiarkan `space-between`.

### 1.2 "Bertabrakan" — diukur, dan bukan tumpang-tindih

- Jarak antar-item terkecil di mana pun: **109 px** (800 px). Tidak ada item
  header yang menyentuh item lain.
- `/en/studio` pada gulir 0: header berakhir di **74**, teks pertama ("Studio")
  di **163** — 89 px bersih.

Label "STUDIO" di y≈102 pada screenshot pemilik repo berarti halaman sudah
tergulir sekitar 60 px, dan konten sedang lewat di bawah latar header yang
buram. Itu perilaku header `fixed`, dan tidak diubah di tahap ini (§6).

Yang tersisa dari kata "bertabrakan" adalah kesan visualnya: Search yang
mengambang di x≈994 berdiri di atas kolom fakta `/studio` yang mulai di x≈944 —
dua tepi yang hampir sejajar tetapi tidak. Tepi yang **hampir** sejajar dibaca
mata sebagai tabrakan, bukan sebagai jarak.

---

## 2. Keputusan: tiga zona, nav di tengah

```
[ merek ............ | nav | ............ search  EN ID ]
  1fr, rata kiri      auto    1fr, rata kanan
```

- `grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr)` — dua zona luar
  selalu sama lebar, jadi nav **tepat di tengah header** di lebar apa pun dan
  dalam bahasa apa pun. Pusat header adalah pusat grid 12 kolom halaman,
  karena keduanya memakai `--safe` yang sama di kedua sisi.
- Merek rata tepi kiri, search dan bahasa **dikelompokkan** rata tepi kanan —
  cermin satu sama lain di tepi `--safe` yang sama dengan konten.
- Jarak di dalam kelompok kanan memakai irama yang sama dengan antar-tautan nav
  (`desktop-vw(28px)`), bukan angka baru.

### 2.1 Kenapa tidak diletakkan di kolom 12

Diperiksa lebih dulu, dan ditolak dengan angka: di 800 px satu kolom **33 px**,
sementara pengalih bahasa **88 px** dan nav **187 px**. Kolom 5–8 di 800 hanya
180 px — nav tidak muat. Grid tiga zona memberikan kesimetrisan yang dimaksud
tanpa memaksa isi ke dalam kolom yang lebih sempit darinya.

### 2.2 Ponsel tidak berubah

Search dan bahasa dibungkus satu elemen agar bisa diletakkan sebagai satu
kelompok di desktop. Di bawah breakpoint pembungkus itu `display: contents`,
jadi kedua anaknya tetap menjadi item flex header seperti hari ini — termasuk
`order: 1` bahasa yang menaruhnya sebelum tombol menu. Pembungkusnya `<div>`
tanpa peran, jadi `display: contents` tidak menghapus semantik apa pun.

Urutan DOM — dan karena itu urutan fokus — tidak berubah: merek, tombol menu,
nav, search, bahasa.

---

## 3. Daftar berkas

| berkas                                                | perubahan                                                |
| ----------------------------------------------------- | -------------------------------------------------------- |
| `components/layout/header/index.tsx`                  | pembungkus kelompok kanan                                |
| `components/layout/header/header.module.css`          | grid tiga zona di desktop; `display: contents` di ponsel |
| `e2e/header-balance.e2e.ts`                           | **baru** — gerbang                                       |
| `docs/stages/TAHAP-87.md`, `ROADMAP.md`, `HANDOFF.md` | berkas ini dan posisi                                    |
| `docs/stages/TAHAP-86.md`                             | §7.7: perbandingan CI tahap sebelumnya                   |

---

## 4. Kriteria keluar

1. Di 800, 1024, 1280, 1440, 1600, 1920, untuk `/en` dan `/id`: pusat nav
   dalam **±1 px** dari pusat header.
2. Tepi kiri merek dan tepi kanan pengalih bahasa masing-masing tepat di
   `--safe` dari tepi header — cermin.
3. Tidak ada dua item header yang lebih dekat dari satu `--gap`.
4. Gerbang terbukti **merah lebih dulu** terhadap kode hari ini.
5. Ponsel identik: `responsive`, `keyboard-focus`, `route-sweep` tetap hijau.
6. Dilihat dengan mata di 1600 dan 800.

---

## 5. Risiko

| #   | risiko                                        | penangkal                                                        |
| --- | --------------------------------------------- | ---------------------------------------------------------------- |
| R1  | Di 800 kelompok kanan dan nav saling mendekat | Kriteria 3; diukur di 800 lebih dulu                             |
| R2  | `display: contents` mengubah perilaku ponsel  | Kedua anak tetap item flex; `responsive.e2e.ts` di proyek mobile |
| R3  | Storybook link di nav (dev) melebarkan nav    | Diukur di `bun run dev` juga, bukan hanya build                  |

---

## 6. Yang tidak dikerjakan, dinyatakan eksplisit

- **Latar header dan kontennya yang lewat di bawah saat menggulir tidak
  diubah.** Pada gulir 0 tidak ada tumpang-tindih (§1.2); di bawahnya adalah
  sifat header `fixed` dengan latar buram yang memudar 24 px. Kalau yang
  dimaksud pemilik repo adalah itu, ia keputusan desain terpisah.
- **Nol angka performa diklaim** — `CLAUDE.md` #19.

---

## 7. Hasil

### 7.1 Gerbang: merah dulu, lalu hijau

`e2e/header-balance.e2e.ts` terhadap header `space-between`: merah di setiap
lebar, kedua bahasa.

```
/en 1024  nav centre 331 vs header centre 507  (-176px)
/en 1600  nav centre 529 vs header centre 795  (-266px)
/en 1920  nav centre 641 vs header centre 955  (-314px)
/id       -171 … -309px
```

Sesudahnya: pusat nav dalam 1 px dari pusat header di 800–1920, `/en` dan
`/id`; merek dan pengalih bahasa tepat `--safe` dari kedua tepi.

### 7.2 Risiko R3 terbukti nyata — dan bentuk pertama perbaikan saya kalah olehnya

Spec berjanji mengukur di `next dev`, tempat nav membawa tautan keempat
(Storybook) — tautan yang juga muncul di produksi mana pun yang menyetel
`NEXT_PUBLIC_STORYBOOK_URL`. Diukur dengan bentuk pertama, `minmax(0, 1fr)`:

```
/en 800  links=4  nav 246–544 | search 545–662   -> jarak 1px
/id 800  links=4                                 -> 15px
```

Kelompok search + bahasa (220.5 px) melampaui lintasannya (219 px) dan meluber
ke kiri, memakan celah. Pusatnya tepat; ruang napasnya hilang — persis kesan
"bertabrakan" yang dilaporkan, dalam bentuk yang lain.

Dengan `minmax(max-content, 1fr)`:

```
/en 800   links=4  centre off -14.63px   nav->search 16.0px
/id 800   links=4  centre off  -1.17px   nav->search 16.0px
1024, 1440         centre off   0.00px
```

Celahnya tidak pernah termakan. Harganya dinyatakan: dengan empat tautan di
800, nav bergeser 14.6 px dari tengah karena isinya memang tidak muat
simetris. Dengan tiga tautan — yang dikirim produksi — dan di 1024 ke atas,
pusatnya tepat.

CI tidak menyetel URL Storybook, jadi gerbang itu hanya akan pernah melihat
tiga tautan. Ia karena itu diperluas: di 800 ia menyalin tautan nav terakhir
menjadi tautan keempat dan menuntut setiap celah tetap utuh. Terbukti merah
terhadap build `minmax(0, 1fr)` (**−1.3 px** di `/en`, **12.2 px** di `/id`),
lalu hijau.

Satu komentar saya sendiri dikoreksi sebelum commit: ia masih memuat prediksi
_"the nav moves by a fraction of a pixel"_. Yang terukur 14.6 px.

### 7.3 Regresi

Lima belas spec yang menyentuh header, menu, search, dan pengalih bahasa,
`--workers=2`, pada build `minmax(0, 1fr)`:

```
198 lulus · 1 gagal    (199, 11.5 mnt)
```

Yang merah, `taste-preflight:222`, adalah timeout 30 s saat menunggu halaman
tenang; sendirian **52/52 lulus**. Lalu pada build akhir: `header-balance`,
`responsive`, `keyboard-focus`, `command-palette` — **28/28 lulus**. Saat semua
isi muat, kedua bentuk lintasan menghasilkan geometri yang sama, jadi regresi
pertama tetap berlaku untuk tiga tautan.

### 7.4 Dilihat dengan mata

1600: nav di tengah, search + EN/ID berkelompok di tepi kanan, bercermin dengan
merek. 800 `/id`: label lebih panjang, tetap di tengah. 390: susunan ponsel
sama seperti sebelumnya. Dev 800 dengan empat tautan: rapat, tidak
bertabrakan.

### 7.5 Log perpindahan mode

```
E->R  T6  pembacaan pertama probe dev: TypeError — querySelector(':scope')
          tidak mengembalikan elemen itu sendiri; instrumen saya, diperbaiki
E->R  R3  empat tautan di 800: jarak 1 px
R->E  sebab: lintasan berlantai nol menyusut di bawah isi yang tidak bisa
          membungkus; lantai max-content; gerbang diperluas, merah lalu hijau
E->R  T1  regresi 1 merah
R->E  sebab: timeout menunggu networkidle; 52/52 sendirian
```

### 7.6 Gerbang lain

```
bun run check    597 lulus, 0 gagal
bun run build    hijau
```

### 7.7 Yang tidak dikerjakan, dinyatakan eksplisit

- **Latar header saat konten lewat di bawahnya tidak diubah** — §6.
- **Dengan empat tautan di 800, nav tidak tepat di tengah** (−14.6 px). Pilihan
  sadar: celah lebih penting daripada pusat ketika isinya tidak muat keduanya.
  Menyempitkan jarak antar-tautan untuk memulihkan pusat akan mengubah irama
  nav hanya demi tautan yang tidak dikirim produksi.
- **Nol angka performa diklaim** — `CLAUDE.md` #19.

### 7.8 CI sesudah push

Ditambahkan di commit Tahap 88.

```
Tahap 86 (e366c10)   712 lulus · 1 flaky · 14 dilewati   727
Tahap 87 (a53cc9b)   716 lulus · 1 flaky · 14 dilewati   731   (+4: header-balance)
```

Keempat uji `header-balance` berjalan dan lulus di Linux, termasuk dua kasus
tautan keempat. Flaky dan skip tidak berubah.
