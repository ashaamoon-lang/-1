# Tahap 29 — Palette itu halaman situs ini, bukan kotak gelap milik tool mana pun

> Pendalaman wajib atas `docs/ROADMAP.md` §3.0.

Status: **selesai**. Hasil di §8.

---

## 1. Apa yang salah, dilihat bukan diukur

Tahap 28 mengirim palette yang **lulus setiap gerbang** dan tampak seperti
command palette mana pun: kotak gelap di tengah layar, ikon kaca pembesar,
baris-baris rata kiri, satu ukuran huruf untuk judul dan deskripsi.

Ia bekerja. Ia juga **tidak menyerupai situs ini sama sekali**. Situs ini punya
bahasa tata letak yang sudah dibayar mahal selama dua puluh delapan tahap —
rel mono di kiri, kolom baca di kanan, penanda bagian huruf kapital berjarak,
indeks yang tahu di mana pembacanya — dan palette-nya tidak memakai satu pun.

Tiga cacat konkret, dan ketiganya masalah desain bukan bug:

1. **Nol hierarki tipografi.** Judul dan deskripsi berukuran sama, jadi tidak
   ada yang bisa dipindai. Pencarian `ui-ux-pro-max --domain ux` mengembalikan
   ini persis: _"Consistent type hierarchy aids scanning"_.
2. **Nol asimetri.** Satu kolom rata. Indeks jurnal situs ini justru dibangun
   dari asimetri — tanggal di rel kiri, isi di kolom baca — dan itu yang
   membuatnya terbaca sebagai indeks terbitan.
3. **Jalan buntu tanpa jalan keluar.** "Nothing matches that." Pedoman yang
   sama menyebut: _"Show 'No results' with suggestions"_, jangan hanya
   menegasikan.

---

## 2. Ritual desain — kueri yang benar-benar dijalankan

| Kueri                                               | Yang dipakai                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------- |
| `"editorial typographic asymmetric" --domain style` | **editorial-grid-magazine**: grid asimetris, penanda bagian, tipografi cetak  |
| `"modal overlay entrance stagger" --domain gsap`    | Stagger List: `y 8, duration 0.3, stagger 0.03`, `power1.out`                 |
| `"search results scanning hierarchy" --domain ux`   | skala tipe konsisten; "no results" wajib membawa saran                        |
| `"exit faster than enter easing" --domain ux`       | deselerasi saat tiba, akselerasi saat pergi; jangan `ease-in-out` untuk semua |

Nilai numerik preset **diterjemahkan ke token proyek**, tidak disalin mentah:
`--duration`, `--duration-fast`, `--ease-out-expo`, `--ease-out-quart`,
`--stagger-*`. Aturan `CLAUDE.md` #1, #3 dan #8 berlaku penuh.

---

## 3. Tesisnya: palette adalah indeks terbitan, bukan menu perintah

Bukan gaya baru. **Bahasa yang sudah dipakai indeks jurnal, diucapkan ketiga
kalinya** — argumen yang sama dengan Tahap 23 (satu kosakata masuk) dan
Tahap 27 (satu kosakata "sedang dibaca"). Sebuah situs award berbeda dari
situs kompeten karena pengendalian diri yang **konsisten**, dan komponen yang
memakai bahasanya sendiri adalah pengecualian.

Jadi:

1. **Lembar, bukan kotak.** Ia turun dari bawah header selebar pelipir halaman
   (`--safe`) alih-alih melayang di tengah. Ia jadi permukaan situs, bukan
   widget yang menumpang di atasnya.
2. **Rel mono di kiri.** Tiap baris membawa faktanya di rel — klien · tahun,
   tanggal, atau jenisnya — dan judul serta deskripsinya di kolom baca. Persis
   grid indeks jurnal.
3. **Penanda bagian, bukan judul kelompok.** Huruf kapital berjarak di rel,
   dengan garis rambut — penanda bagian majalah, yang memang sudah kosakata
   situs ini.
4. **Tiga ukuran, dari skala yang sudah ada.** Judul `p-big`, deskripsi
   normal-muted, rel `caption` mono. Nol ukuran baru.
5. **Penghitung `03 / 17`** di kepala lembar — idiom `01 / 04` milik
   `step-sequence`, dipakai lagi. Ia menjawab pertanyaan nyata: seberapa
   banyak yang sedang saya lihat.
6. **Jalan buntu diberi jalan keluar**: sarannya menyebut hal yang benar-benar
   ada di indeks — nama klien, tahun, sebuah praktik.

---

## 4. Koreografi — anggaran dibebaskan, dan dipakai

Empat gerakan, semuanya `transform` dan `opacity` saja (`CLAUDE.md` #4),
semuanya dari token.

| Gerakan             | Kapan          | Durasi                                      | Easing             |
| ------------------- | -------------- | ------------------------------------------- | ------------------ |
| Latar meredup       | buka           | `--duration-fast`                           | `--ease-out-quart` |
| Lembar turun        | buka           | `--duration`                                | `--ease-out-expo`  |
| Baris masuk berurut | sesudah lembar | `--duration-fast`, stagger `--stagger-fast` | `--ease-out-quart` |
| Menutup             | tutup          | `--duration-fast`                           | `--ease-in-quart`  |

Dua keputusan yang perlu disebut:

**Menutup lebih cepat daripada membuka, dan easing-nya terbalik.** Pedoman
yang dicari mengatakannya langsung: deselerasi saat tiba, akselerasi saat
pergi. `ease-in-out` untuk segalanya adalah tanda amatir yang `CLAUDE.md` #2
sudah larang.

**Barisnya menata ulang saat diketik, tapi tidak berurutan.** Stagger penuh
pada setiap ketukan tombol akan membuat mengetik terasa mabuk. Jadi: stagger
hanya saat lembar dibuka; saat kuerinya berubah, daftarnya menyelesaikan diri
dengan satu gerakan pendek tanpa jeda antar-baris.

Ini **bukan** momen berkoreografi dan tidak masuk daftar `MOTION-SPEC.md`
§9.5 — sama seperti Tahap 28. Ia perabot, bukan bagian alur baca halaman.

Di bawah `prefers-reduced-motion`: nol gerak, isi **berakhir terlihat penuh**,
dijamin stylesheet bukan state komponen (`CLAUDE.md` #5).

---

## 5. Yang **tidak** dikerjakan

- **Bukan gaya baru.** Tidak ada warna baru, tidak ada tipografi baru, tidak
  ada radius atau bayangan baru. Kalau tahap ini menambah satu nilai desain
  saja, ia gagal pada tesisnya sendiri.
- **Tidak ada pratinjau gambar di baris hasil.** Palette adalah teks yang
  dipindai; gambar akan memperlambat pemindaian dan menambah permintaan
  jaringan pada permukaan yang harus terasa instan.
- **Tidak ada fuzzy search.** Tetap keputusan Tahap 28 §9.7.

---

## 6. Gerbang

Yang sudah ada dan tidak boleh bergerak:

1. Sembilan gerbang `e2e/command-palette.e2e.ts` — keyboard, `aria-activedescendant`, fokus kembali, axe terbuka, tanpa-JS.
2. `route-budget` — **nol plafon dinaikkan**, dan angkanya tidak boleh bergerak.

Yang baru, dibuktikan merah lebih dulu:

3. **Hierarki tipografi nyata** — judul terukur lebih besar daripada deskripsi.
4. **Rel mono ada dan sejajar** di setiap baris pada desktop.
5. **Penghitung mengikuti kuerinya** — `17 / 17` jadi `03 / 17` saat menyaring.
6. **Reduced motion** — nol transform tersisa, semua baris `opacity: 1`.
7. **Jalan buntu membawa saran**, bukan hanya negasi.

---

## 7. Risiko

**7.1 Lembar selebar halaman memanjangkan baris.** Dimitigasi oleh grid:
kolom bacanya berhenti sebelum tepi kanan, dan deskripsinya dibatasi ukuran
baca. Sisa ruang di kanan adalah asimetri yang disengaja, bukan kelalaian.

**7.2 Gerak pada permukaan yang harus terasa instan.** Membuka palette lalu
menunggu animasi adalah kegagalan. Karena itu latar dan lembar mulai bersamaan
dan barisnya sudah bisa dibaca sebelum staggernya selesai — gerakannya
menemani, tidak menahan.

---

## 8. Hasil

**Selesai.** Palette-nya sekarang halaman situs ini. Dan dalam prosesnya
ditemukan **satu cacat yang Tahap 28 kirim dengan seluruh gerbang hijau**:
selama indeksnya dimuat, palette menjawab pertanyaan yang belum ditanyakan.

### 8.1 Tata letak: sebelum dan sesudah, terukur

|              | Tahap 28                   | sekarang                            |
| ------------ | -------------------------- | ----------------------------------- |
| Bentuk       | kotak 672px di tengah      | **lembar 1398px** selebar pelipir   |
| Baris        | satu kolom rata            | **tiga pita**: fakta · nama · janji |
| Ukuran huruf | judul 16px, deskripsi 16px | **rel 12 · nama 20 · deskripsi 16** |
| Rel          | tidak ada                  | mono, 2 dari 12 kolom, satu tepi    |
| Penghitung   | tidak ada                  | `03 / 17`, mengikuti kueri          |
| Jalan buntu  | "Nothing matches that."    | + saran yang benar-benar ada        |

Jarak antar pita terukur **226px** dan **452px** — nilai yang sama pada tata
letak bertumpuk adalah 7px dan −7px, dan itu yang jadi gerbangnya (§8.4).

Grid-nya bukan grid baru: `2 / 4 / 6` dari dua belas kolom yang sama yang
dipakai setiap halaman di belakangnya, dan rel-nya memakai ekspresi
`calc()` yang sama persis dengan indeks jurnal. **Nol nilai desain baru** —
tidak ada warna, ukuran, radius, atau bayangan yang ditambahkan.

Percobaan pertama salah dan diperbaiki dengan memandanginya: rel tiga kolom
menampung delapan karakter mono dalam 340px, dan deskripsinya berhenti di
ukuran bacanya sehingga **400px kanan lembar kosong**. Membacanya sebagai
daftar isi — folio, judul, satu baris tentangnya — mengisi lebarnya dengan
isi alih-alih dengan margin.

### 8.2 Koreografi, dengan angka terukur

| Gerakan          | Terukur                                                           |
| ---------------- | ----------------------------------------------------------------- |
| Latar meredup    | 200ms `--ease-out-quart`, keluar 150ms `--ease-in-quart`          |
| Lembar turun     | 400ms `expo.out` dari `translateY(-12px)`, keluar 200ms ke dalam  |
| Baris berurut    | jeda `0, 40, 80, 120…ms`, masing-masing 200ms, `--ease-out-quart` |
| Kuerinya berubah | jeda berbeda: **`[0]`** — satu gerakan, tanpa berurutan           |

Angka-angka itu bukan disalin dari preset: `40ms` adalah `stagger.items`,
`200ms` adalah `duration.fast`, dan kurvanya `cubic-bezier(0.165, 0.84, 0.44, 1)`
= `--ease-out-quart`, semuanya dibaca dari `vault/motion/tokens.ts`.

**Menutup memakai kurva masuk, dan lebih cepat.** Itu yang pedoman katakan
(deselerasi saat tiba, akselerasi saat pergi), dan `--ease-in-quart` adalah
token dari `lib/styles/css/easings.css` — yang persis diminta `CLAUDE.md` #1.
Set JS terkurasi tidak membawa kurva "in" karena belum ada yang membutuhkannya
di sisi skrip; tidak ada token baru yang ditambahkan.

**Bukan GSAP, dan itu keputusan yang diukur.** Tahap 28 baru saja menemukan
bahwa modul yang dipakai chunk eager _dan_ async membuat webpack menggandakan
seluruh grup chunk-nya. GSAP ada di graf eager sebagian besar rute di sini,
jadi mengimpornya ke palette berisiko membayarnya dua kali di setiap halaman
— untuk animasi yang belum dibuka siapa pun. `element.animate()` nol biaya
impor, berjalan di compositor (jadi **tidak** menambah loop RAF kedua yang
`CLAUDE.md` #6 larang), dan hasilnya: **880 → 881 KB**, satu kilobyte, nol
penggandaan.

### 8.3 Cacat yang Tahap 28 kirim dengan seluruh gerbang hijau

Indeksnya diambil saat palette pertama kali dibuka. Diukur dengan menahan
respons itu 900ms — yang adalah keadaan sambungan lambat, bukan rekayasa:

```
t=  80ms  "Nothing matches that. Try a client name, a year, or a practice."   00 / 00
t= 250ms  "Nothing matches that. …"                                            00 / 00
t= 600ms  "Nothing matches that. …"                                            00 / 00
t=1100ms  17 hasil                                                             17 / 17
```

**Palette menjawab bahwa kueri kosong tidak menemukan apa pun**, di atas
penghitung `00 / 00`, selama seluruh perjalanan jaringan. Dan permintaan yang
**gagal** mengatakan kalimat yang sama — bukan "tidak ada yang cocok"
melainkan "pencarian rusak", disampaikan seolah itu sebuah hasil.

Sekarang tiga keadaan, karena artinya tiga hal berbeda:

```
t=  80ms  "Menyusun indeks…"                        (tanpa penghitung)
t=1100ms  17 hasil                                   17 / 17
gagal     "Pencarian sedang tidak tersedia. Seluruh halaman tetap bisa
           dicapai dari header dan footer."
```

Tabel `satisfies` alih-alih rantai ternary, jadi kompilator yang membuktikan
setiap keadaan punya sesuatu untuk dikatakan.

### 8.4 Empat gerbang yang saya buang karena hampa

Gerbang "tiga pita" ditulis empat kali. Tiga versi pertama **lulus terhadap
tata letak bertumpuk yang tahap ini gantikan** — artinya mereka tidak
membuktikan apa pun:

| Asersi                       | Kenapa hampa                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------- |
| `nama.left > rel.left`       | lulus dengan inset glif **7px**                                               |
| nama melewati **lebar** rel  | span inline pada baris bertumpuk menyusut ke teksnya                          |
| ketiganya berbagi `top`      | `align-items: baseline` menggeser top **8px** — lebih besar daripada tumpukan |
| **jarak ≥ 100px antar pita** | terukur 226 dan 452 terkirim, 7 dan −7 bertumpuk ✅                           |

Ini kelas cacat yang sama dengan asersi redirect hampa Tahap 22, dan cara
menemukannya sama: menyuntik CSS yang mengembalikan tata letak lama, lalu
memeriksa apakah asersinya benar-benar merah.

### 8.5 axe menangkap koreografinya, dan itu benar

Gerbang axe berubah "flaky" — merah sekali, hijau saat diulang, dengan
`serious: color-contrast (3 node)`. Bukan balapan waktu: baris yang sedang
**setengah memudar memang gagal kontras**, dan axe mengauditnya di tengah
jalan.

Dua hal yang keduanya benar diperbaiki:

1. **Staggernya dibatasi.** Baris ke-17 dulu menunggu `16 × 40ms + 200ms` =
   **840ms** untuk selesai tiba. Sekarang berurutan hanya untuk delapan baris
   pertama — yang muat di satu layar — jadi totalnya **520ms** dan sisanya
   datang bersama yang kedelapan.
2. **Gerbangnya mengaudit keadaan diam.** WCAG bicara tentang keadaan
   istirahat; gerbang yang mencuplik satu frame acak dari animasi melaporkan
   derau, bukan hal yang seharusnya ia jaga. Ia sekarang menunggu
   `animation.finished` semua baris lebih dulu.

### 8.6 Verifikasi

- `bun run check` — exit 0, **432 uji unit**.
- `CI=true bun run test:e2e` — **368 lulus, 0 gagal**, 18 dilewati.
- `e2e/command-palette.e2e.ts` — **15/15, dua proyek, dua kali berturut-turut
  tanpa flake**.
- `route-budget` — **9/9, nol plafon dinaikkan**; `/en/work` 880 → 881 KB.
- Reduced motion: **0** animasi, 0 baris redup, 0 baris tergeser, transisi
  lembar `0s`.
- 320 / 360 / 390px: nol overflow halaman, nol overflow header, jarak
  kolom-isian ke penghitung 10-12px.
- Tidak ada klaim performa (`CLAUDE.md` #19).

### 8.7 Yang tidak dikerjakan, disebut

- **Tidak ada tata letak dua kolom untuk hasil.** Base UI punya
  `Autocomplete.Row` untuk grid, dan sebuah indeks dua kolom memang bentuk
  yang dipakai terbitan cetak — tapi ia mengubah arti panah atas/bawah, dan
  aksesibilitas keyboard palette ini baru saja dibayar penuh di Tahap 28.
  Tidak ditukar dengan estetika.
- **Tidak ada pratinjau gambar di baris.** Alasan §5 tidak berubah.
- **Tidak ada story Storybook.** Alasan Tahap 28 §9.7 tidak berubah; yang
  menjaganya adalah lima belas gerbang pada situs sungguhan.
