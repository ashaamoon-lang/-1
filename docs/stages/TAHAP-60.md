# Tahap 60 — Arah baru: batasan tetap alat, plafon animasi dilebarkan

> **Nol perubahan visual.** Tahap ini menetapkan aturannya lebih dulu. Tanpa
> itu, tahap 61–65 masing-masing akan menegosiasikan ulang batasnya sendiri —
> persis cara 51% spasi dan 54 ukuran tipe bocor ke repo ini sebelum Tahap 37.

---

## 1. Kenapa arahnya berubah

Pendekatan **studio karya** dan pendekatan **batasan** adalah perancah untuk
mencapai dua kemampuan, bukan tujuan akhirnya:

1. **Studio karya** → web dan sistem desain di atas **long context** dan
   **compact layout**, dengan nilai estetika lebih tinggi.
2. **Batasan** → **UI/UX yang sangat presisi** dan bisa disesuaikan tema.

Keduanya sekarang ada dan **tetap dipakai**. Yang berubah: **ARTH adalah
agency**. Pekerjaannya sekarang membangun banyak **stunning animation**
sebagai kail pelanggan, plus pendekatan informasi yang kreatif.

Instruksinya tegas: **batasan tetap diadopsi**, dengan dua pengecualian
bernama — **tinggi hero/section tidak berlaku**, dan **batas animasi
dilebarkan sangat luas**.

---

## 2. Dua hal yang diukur sebelum satu baris diubah

### 2.1 Tidak ada gerbang yang membatasi tinggi

Pencarian `svh` / `100vh` / `clientHeight` / `innerHeight` di **39 berkas
e2e** hanya menemukan `media-edge.e2e.ts`, dan itu soal satu elemen media,
bukan section. **"Batasan tinggi tidak berlaku" secara mekanis sudah benar
hari ini.** Yang kurang bukan izin — yang kurang nilainya dinaikkan. Itu
pekerjaan Tahap 61, bukan tahap ini.

### 2.2 Mesin animasinya sudah ada dan kurang dibelanjakan

Jumlah konsumen tiap komponen gerak, dihitung di `app/`, `vault/blocks/`,
`components/`:

| komponen           | konsumen |     | komponen      | konsumen |
| ------------------ | -------: | --- | ------------- | -------: |
| `reveal`           |       11 |     | `counter`     |    **2** |
| `text-reveal`      |        7 |     | `flip`        |    **2** |
| `parallax`         |        5 |     | `magnetic`    |    **1** |
| `reading-progress` |        3 |     | `pixel-image` |    **1** |
| `cursor`           |        3 |     | `curtain`     |    **1** |

Enam mekanisme duduk di satu atau dua konsumen. Kail pelanggan tidak butuh
mekanisme baru lebih dulu; ia butuh yang sudah dibangun dibelanjakan jauh
lebih berani.

---

## 3. Yang tetap, dan kenapa ia bukan rem

| tetap                                                              | alasan                                                                                                                           |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **Disiplin penamaan**: gerakan >600ms wajib di dalam `[data-epic]` | Inilah yang membuat presisi bisa diperiksa. Gerakan tanpa nama tidak bisa didebug, dianggarkan, atau dimatikan di reduced motion |
| Token: nol hex/durasi/easing mentah; `oklch()` + `color-mix`       | Inilah "bisa disesuaikan dengan tema"                                                                                            |
| Satu RAF loop                                                      | Dua loop = jitter                                                                                                                |
| `prefers-reduced-motion`, isi berakhir terlihat penuh              | Aksesibilitas                                                                                                                    |
| axe WCAG 2.2 · keyboard · no-JS · dispose GPU                      | idem                                                                                                                             |
| Hanya `transform` + `opacity`                                      | Inilah yang membuat animasi _banyak_ tetap mulus                                                                                 |
| `taste-preflight` hero ≤ 4 elemen teks                             | **Tetap.** Justru ini yang membuat hero tinggi terasa mahal, bukan penuh                                                         |

---

## 4. Yang dilebarkan

|                                                                      | dari | jadi   |
| -------------------------------------------------------------------- | ---- | ------ |
| `names.length` — `/en`, `/en/work`, `/en/studio`, `/en/practice/<v>` | 3    | **12** |
| `names.length` — `/en/journal`                                       | 2    | **6**  |
| `names.length` — `/en/work/<slug>`                                   | 2    | **6**  |
| `names.length` — `/en/journal/<slug>`                                | 2    | **3**  |

`/journal/<slug>` sengaja paling ketat. Menahan diri di satu tempat membuat
kemewahan di tempat lain terbaca sebagai pilihan, bukan sebagai default.

**Plafon KB sengaja TIDAK dinaikkan di tahap ini** — menyimpang dari rencana,
dan alasannya lebih kuat daripada rencananya. Tahap ini nol perubahan visual,
jadi bobotnya belum ada. Menaikkan plafon sebelum bobotnya datang berarti
gerbangnya berhenti menangkap apa pun selama rentang itu. Tiap kenaikan
dikerjakan di tahap yang benar-benar menambah bobot, **dengan pengukuran tahap
itu** — disiplin yang sudah dipakai repo ini sejak Tahap 22.

**Assertion `unnamed` tidak disentuh.** Itu disiplinnya.

---

## 5. Gerbang baru: `e2e/epic-sequence.e2e.ts`

Plafon "maksimal dua" tidak pernah benar-benar menjaga _jumlah_; ia menjaga
**"satu hal memukau pada satu waktu"**. Pada halaman pendek, membatasi jumlah
adalah cara kasar mencapainya. Pada halaman 110svh + 300vh, cara yang benar
adalah mengukur **tumpang tindihnya**.

> Dua momen dengan **nama berbeda**, yang **tidak bersarang** satu sama lain,
> tidak boleh menempati rentang gulir yang sama.

Gerbang ini **lebih ketat soal kualitas** sekaligus **jauh lebih longgar soal
kuantitas** — persis yang diminta.

### 5.1 Dua pengecualian, dan keduanya datang dari pengukuran

Aturan naif "nol tumpang tindih antar `[data-epic]`" **merah di lima dari
tujuh rute**, dan semuanya sah. Diukur, 1440×900:

```
/en/work    catalogue-sift   594..3624
            work-transport   594..1514  NESTED   ∩ 920px
/en         work-transport  6132..7051
            work-transport  6132..7051           ∩ 919px
```

1. **Nama sama** — `work-transport` muncul sekali per kartu. Enam instance
   yang tumpang tindih adalah **satu momen dirender enam kali**, bukan enam
   momen bertabrakan.
2. **Bersarang** — `work-transport` di dalam `catalogue-sift`,
   `journal-transport` di dalam `journal-index`. Momen per-item di dalam momen
   tingkat-daftar adalah komposisi yang benar, bukan tabrakan.

Dengan dua pengecualian itu, aturannya **hijau di ketujuh rute hari ini** —
gerbang yang menggambarkan situs apa adanya, lalu menangkap yang berikutnya.

### 5.2 Rentang gulir ≠ kotak elemen

Momen ter-pin memiliki rentang gulir jauh lebih besar dari kotaknya. Diukur
di `/en`:

```
arth-passage   kotak elemen   1109..2009  (900px)
               pin-spacer     1109..4259  (3150px)   ← yang sebenarnya dimiliki
work-transport berikutnya     4339..
```

Mengukur kotak elemen saja akan menyimpulkan passage berakhir di 2009 dan
menganggap 2009–4259 kosong. Jadi rentang sebuah momen adalah **kotak
`.pin-spacer` terdekat kalau ada, kotak elemennya sendiri kalau tidak**.
Jarak sebenarnya antara passage dan kartu pertama: **80px**.

### 5.3 Dibuktikan merah lebih dulu

Dua instance `work-transport` di `/en` berbagi rentang 6132..7051 persis
(dua kartu satu baris). Salah satunya diberi nama berbeda sementara — dua
nama berbeda, tidak bersarang, tumpang tindih 919px. Angkanya dicatat di §7,
lalu dikembalikan.

---

## 6. Yang TIDAK dikerjakan di tahap ini

- **Nol perubahan visual.** Tinggi hero (Tahap 61), `arth-overture`
  (62), mesin yang menganggur (63) — semuanya menunggu aturannya berdiri.
- **Nol konten karangan.** Copy agency tetap milik Anda.
- **Infrastruktur** menunggu Tahap 66.

---

## 7. Hasil

### 7.1 Gerbangnya dibuktikan merah lebih dulu

Satu kartu diberi nama berbeda sementara (`work-transport-${slug}`), build
produksi penuh, lalu gerbangnya dijalankan:

```
5 failed   /en · /en/studio · /en/practice/{consulting,ai-data,commission}
4 passed   /en/work · /en/work/arus-balik · /en/journal · /en/journal/<slug>

  "work-transport-pelabuhan"  (1008..1824)
  "work-transport-lantai-dua" (1051..1867)   berbagi 773px
```

Dua hal yang dibuktikan sekaligus, dan yang kedua tidak saya duga akan
sekuat itu:

1. Gerbangnya **menangkap** tabrakan, menyebut nama dan angkanya.
2. `/en/work` **lulus** meski keenam kartunya kini bernama berbeda — karena
   semuanya bersarang di `catalogue-sift`. **Pengecualian bersarang terbukti
   bekerja pada kasus nyata**, bukan cuma pada niat.

Sesudah dikembalikan: **33 lulus** (`epic-sequence` sembilan rute × dua
viewport, plus `interaction-grammar` dengan plafon baru).

### 7.2 Gerbang

|                                   | hasil                                              |
| --------------------------------- | -------------------------------------------------- |
| `bun run check`                   | **421 lulus / 0 gagal** (992 expect, 46 berkas)    |
| `bun run build`                   | sukses                                             |
| `bun run build-storybook`         | sukses                                             |
| **suite e2e penuh, dua viewport** | **642 lulus / 0 gagal / 14 dilewati** (16,6 menit) |

### 7.3 Yang tidak dikerjakan, dan kenapa

- **Plafon KB tidak dinaikkan.** §4 — menyimpang dari rencana dengan alasan
  yang lebih kuat daripada rencananya.
- **Nol perubahan visual.** Itu memang isi tahap ini.
- **`route-budget` tidak disentuh sama sekali**, jadi tidak ada gerbang yang
  melemah di tahap yang tidak menambah bobot apa pun.
