# Tahap 19 — Halaman proyek: apa yang ia jawab sebelum digulir

> Pendalaman wajib atas `docs/ROADMAP.md` §3.0.

Status: **spec**. Hasil di §8.

---

## 1. Kenapa halaman ini, dan kenapa sekarang

Rencana yang disetujui menjangkarkan prioritas pada kriteria penilaian
awwwards yang dipublikasikan — **Design 40% · Usability 30% · Creativity 20% ·
Content 10%**. Halaman proyek adalah halaman yang paling dinilai di sebuah
portofolio, dan pandangan Tahap 18 menemukannya sebagai yang paling lemah.

Terukur di `/en/work/arus-balik`, 1280×800:

| Elemen                        | Posisi         |
| ----------------------------- | -------------- |
| `h1` "Arus Balik"             | 130 → 220      |
| sampul (setengah lebar)       | 256 → **1023** |
| `<dl>` klien/tahun/engagement | mulai **1059** |

Lipatan ada di 800. **Setiap fakta tentang karya itu dimulai 259px di bawah
lipatan**, sementara separuh kanan layar kosong sepanjang 767px tinggi
sampulnya. Layar pertama sebuah halaman proyek berisi sebuah nama dan setengah
gambar, tidak lebih.

**Dan ini khusus desktop.** Diukur di 390×844: `<dl>` mulai di 611, fakta di
628 dan 678 — semuanya di atas lipatan. Susunan bertumpuk mobile sudah benar
dan tidak disentuh.

---

## 2. Ritual `ui-ux-pro-max` — hasilnya, termasuk yang nol

| Query                               | Hasil                                          |
| ----------------------------------- | ---------------------------------------------- |
| `"case study" --domain landing`     | **0 hasil**                                    |
| `"above the fold" --domain ux`      | **0 hasil**                                    |
| `"visual hierarchy" --domain ux`    | 3 hasil, tak satu pun tentang hierarki halaman |
| `"Portfolio Grid" --domain landing` | 1 pola — yang situs ini memang pakai           |

Basis data **tidak punya baris tentang anatomi halaman proyek**. Sesuai §2.1
aturan 2 itu dinyatakan, dan sesuai koreksi pemilik di Tahap 18 §9.1 ia bukan
alasan berhenti: prinsip universal pola yang dipakai situs ini yang jadi
jangkar.

Pola `Portfolio Grid` berbunyi **"Visuals first"** dan _"Neutral background
(let work shine)"_. Itu mengikat arah perbaikannya: **sampulnya tidak
dikecilkan dan tidak digeser turun.** Yang dipakai adalah ruang kosong di
sebelahnya.

---

## 3. Yang dikerjakan

Pada desktop, ketika sampul berukuran setengah (`data-span='half'`), letakkan
daftar fakta **di kolom kanan yang selama ini kosong**, sejajar puncak sampul.
Sampul tetap enam dari dua belas kolom, tidak berubah satu piksel.

Ketika sampulnya penuh (`data-span='full'`) tidak ada kolom kanan, jadi
perilakunya tetap seperti sekarang: fakta di bawah sampul.

**Urutan DOM tidak berubah** — judul, sampul, `<dl>`. Itu urutan baca yang
sudah diargumentasikan komponennya sendiri ("A reader on a slow connection, a
screen-reader user, and a crawler all meet the `<h1>` first"), dan urutan yang
`--reveal-stagger` sudah ikuti. Yang berubah hanya penempatan.

**Nol bidang CMS baru, nol komponen baru.** `client`, `year`, `engagement` dan
`scope` sudah ada di skema dan sudah dirender.

---

## 4. Kontraknya

`vault/blocks/project-hero` menambah satu atribut pada `<header>`-nya —
`data-cover="half" | "full" | "none"` — karena komponennya **sudah** menghitung
`coverIsFull`. Sebuah atribut eksplisit lebih jujur daripada `:has()` yang
menebak dari anak-anaknya, dan ia juga yang jadi pegangan gerbang.

---

## 5. Gerbang

**Baru**, di `e2e/project-page.e2e.ts` atau menumpang `visual-substance`:
pada desktop, `<dl>` halaman proyek harus **berpotongan dengan lipatan** —
`top < innerHeight`. Dibuktikan merah dulu terhadap keadaan hari ini (1059
lawan 800).

Tidak diasersikan pada mobile: di sana ia sudah benar dan susunannya berbeda
karena alasan yang sah.

---

## 6. Batasan (dari rencana yang disetujui §2)

Reduced motion · tanpa JavaScript · axe dua viewport dua bahasa ·
`route-budget` hijau tanpa anggaran dinaikkan · nol dependensi · token, bukan
nilai keras · tiap asersi dibuktikan merah dulu · tidak ada klaim performa.

Ditambah dua yang khusus tahap ini:

- **`spatial-rhythm.e2e.ts` tetap hijau.** Hero ini punya ritme yang sudah
  digerbangi; mengubah tata letak tidak boleh memecahnya.
- **`media-edge.e2e.ts` tetap hijau.** Tepi media halaman detail adalah
  kontrak Tahap 11b.

---

## 7. Risiko

**7.1 Kolom kanan bisa terasa kosong dengan sedikit fakta.** Sebuah karya
boleh punya dua fakta saja — komponennya memang membuang pasangan yang
kosong. Diukur pada data nyata sebelum diputuskan, bukan dirancang untuk
kasus terbaik.

**7.2 Sampul potret sangat tinggi.** 767px pada rasio ini; rasio lain bisa
lebih. Fakta sejajar puncak, jadi ia tidak ikut memanjang — tapi jaraknya
harus diperiksa pada rasio terpanjang yang ada di fixture.

**7.3 Ini tidak memperbaiki isi.** Karyanya masih dummy (§0 rencana). Tahap
ini memperbaiki **bagaimana** halaman menyajikan faktanya, bukan apakah
faktanya nyata.

---

## 8. Hasil

### 8.1 Dibuktikan merah dulu

```
Error: the facts begin 1059px down, 259px below a fold at 800px
```

### 8.2 Sesudah

| Ukuran (1280×800) | Sebelum | Sesudah |
| ----------------- | ------- | ------- |
| `<dl>` mulai di   | 1059    | **256** |
| Lebar sampul      | 614     | **614** |
| Tepi kanan sampul | 628     | **628** |

Fakta kini mulai **di baris yang sama dengan puncak sampul**, di kolom yang
selama ini kosong. Layar pertama menjawab **apa, untuk siapa, kapan, dan
seberapa besar** — _Arus Balik · Rumah Tanjung · 2025 · Architecture review,
six weeks · 2 teams · 6 weeks_ — tanpa digulir sedikit pun.

**Sampulnya tidak bergerak satu piksel.** Itu bukan kebetulan melainkan
syarat: `Portfolio Grid` meminta _"visuals first"_, dan Tahap 11b menyetel
lebar itu supaya sampul potret dan gambar galeri potret berbagi tepi kanan.
Track grid-nya **mengulang ekspresi lebar yang sama** alih-alih menimpanya,
dan `e2e/media-edge.e2e.ts` yang membuktikan hasilnya identik — bukan komentar
ini.

**Mobile tidak berubah**, terukur: `dl` di 611, lebar 347, sampul 347 —
identik sebelum dan sesudah. Cacatnya memang desktop-only, dan perbaikannya
juga.

### 8.3 Dua aturan proyek ini menolak kode saya, dan keduanya benar

1. `no-nested-ternary` menolak `cover && ratio ? (full ? 'full' : 'half') :
'none'`. Diganti satu nilai turunan dengan `none` sebagai kasus nyata —
   sebuah karya boleh terbit tanpa sampul, dan stylesheet tidak boleh
   menyediakan kolom kosong di sebelah ketiadaan.
2. `no-shape-in-symbol-names` menolak `coverShape`: _"shape describes structure
   rather than ownership"_. Kata domainnya sudah ada di komponen ini —
   `data-span` — jadi `coverSpan`.

### 8.4 Yang **tidak** dikerjakan

- **Kolom kanan tidak diisi apa pun selain fakta.** Empat fakta menempati
  ~200px dari kolom setinggi 767px, dan sisanya dibiarkan kosong. Meregangkan
  empat baris sepanjang itu akan lebih buruk; ruang itu sekarang ruang negatif
  yang disengaja, sejajar dengan puncak gambar.
- **Tidak ada prosa baru.** Karyanya masih dummy (rencana §0). Tahap ini
  memperbaiki **bagaimana** halaman menyajikan faktanya, bukan apakah faktanya
  nyata — dan itu tetap milik studio.

### 8.5 Angka

```
bun run check      exit 0    (401 unit test)
CI=true test:e2e   299 lulus, 0 gagal   (dari 297)
media-edge         hijau — lebar sampul tidak berubah
spatial-rhythm     hijau
```
