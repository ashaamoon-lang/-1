# Tahap 27 — Indeks jurnal yang membaca balik, dan satu kosakata dipakai dua kali

> Pendalaman wajib atas `docs/ROADMAP.md` §3.0.

Status: **selesai**. Hasil di §7.

---

## 1. Uji ulang Fase 3 — apa yang diukur

|                                     | indeks                                | entri               |
| ----------------------------------- | ------------------------------------- | ------------------- |
| tinggi dokumen                      | 1534px (**1,7 layar**)                | 1671px (1,86 layar) |
| item `Reveal`                       | 4                                     | 7                   |
| item di **bawah lipatan** saat muat | **0**                                 | 2                   |
| item tersembunyi saat muat          | **0**                                 | 2                   |
| opacity baris saat digulir          | `1.00 1.00 1.00` di **setiap** posisi | —                   |

**Indeks jurnal sepenuhnya statis sesudah muat.** Keempat item reveal-nya ada
di atas lipatan, jadi kontainer memicu sekali di frame pertama dan sesudah itu
tidak ada yang berubah — diukur pada empat posisi gulir, ketiga barisnya tetap
`1.00`.

Halaman itu isinya **tiga judul**. Kalau tiga judul tiba bersamaan lalu diam,
itu seluruh pengalaman halamannya.

Halaman entri baik-baik saja: dua item memang masuk saat digulir, dan `h1`-nya
terpisah dua baris. Ia tidak butuh apa-apa, dan §5 menyebut kenapa.

---

## 2. Yang dikerjakan — dan ia **bukan** kosakata baru

Tahap 25 membangun satu hal baru: urutan yang tahu langkah mana yang sedang
dibaca, dengan yang lain mundur. Tahap 26 sengaja tidak menambah apa pun.

Tahap ini **memakai yang sudah ada untuk kedua kalinya**, dan itu justru
argumennya. Yang membedakan situs kompeten dari situs award, menurut
`CLAUDE.md` sendiri, adalah **pengendalian diri yang diterapkan konsisten** —
dan sebuah mekanisme yang hanya hidup di satu halaman bukan kosakata, ia
pengecualian. Tahap 23 membuat argumen yang sama tentang kosakata masuk.

Jadi:

1. **Logika "mana yang sedang dibaca" diekstrak** dari
   `vault/blocks/step-sequence` menjadi satu hook yang keduanya pakai. Satu
   perilaku, satu tempat ia ditulis.
2. **Indeks jurnal memakainya**: baris yang berada di garis baca memimpin,
   yang lain mundur. Digerakkan **gulir**, bukan pointer — jadi ia ada di
   ponsel juga, tidak seperti lapisan material yang desktop-saja.
3. **Barisnya diberi tinggi**, karena §1 mengukur bahwa tanpa itu tidak ada
   jarak gulir untuk apa pun terjadi.

Namanya `journal-index`, dan ia momen berkoreografi **pertama dan satu-satunya**
halaman itu. §9.5 mengizinkan dua.

---

## 3. Kontras, lebih dulu bukan belakangan

Tahap 25 mengirim dua nilai peredupan yang gagal WCAG dan harus mengukurnya
setelah gerbang merah: 0,55 memberi 3,70:1, dan `dimOpacity: 0.33` memberi
2,78:1 selama sepuluh tahap.

Di sini nilainya **diukur lebih dulu** dengan cara yang sama — disapu terhadap
axe pada halaman yang sudah dirender — dan yang dikirim adalah satu langkah di
atas lantai terukurnya. Judul entri berukuran display, jadi ambangnya mungkin
3:1 (teks besar) alih-alih 4,5, dan itu **diukur, bukan diasumsikan**.

---

## 4. Gerbang

1. **Barisnya bergerak saat digulir** — dibuktikan merah terhadap
   `1.00 1.00 1.00` hari ini.
2. **Baris yang aktif berpindah** — setidaknya dua baris berbeda pernah aktif
   selama menggulir indeks.
3. **axe bersih dan digulir** — pelajaran Tahap 25 §7.5, kali ini diterapkan
   sebelum cacatnya ada, bukan sesudah.
4. **Reduced motion** — nol yang mundur, semua baris `opacity: 1`, dijamin
   stylesheet bukan state komponen.
5. **Tanpa JavaScript** — ketiga baris terbaca.

---

## 5. Yang **tidak** dikerjakan

**Halaman entri tidak diberi momen.** Ia halaman baca panjang, dan tempat
situs semacam ini paling sering jadi lebih buruk adalah dengan menaruh efek di
atas prosa. Ia sudah punya `TextReveal` pada judul dan `Reveal` pada bloknya,
dan pengukuran §1 menunjukkan dua di antaranya memang masuk saat digulir. Ia
tidak kekurangan apa pun.

**Bukan digerakkan pointer.** Sebuah indeks yang hanya menjawab tetikus tidak
ada di ponsel, dan indeks jurnal justru yang paling mungkin dibaca di sana.

---

## 6. Risiko

**6.1 Baris yang lebih tinggi memanjangkan halaman.** Sama seperti Tahap 25,
dan harganya sama-sama disengaja.

**6.2 Ekstraksi menyentuh komponen yang sudah terkirim.** `step-sequence` ada
di halaman studio dan gerbangnya sudah ada; kalau ekstraksi memecahkannya,
gerbang Tahap 25 yang menangkapnya, bukan saya.

---

## 7. Hasil

**Selesai.** Indeks jurnal membaca balik, kosakata "mana yang sedang dibaca"
dipakai dua halaman dari satu file, dan **satu cacat baru ditemukan di ponsel**
yang pengukuran desktop tidak bisa melihat.

### 7.1 Sebelum dan sesudah

Desktop 1280×800, `/en/journal`:

|                        | Tahap 26           | sekarang                |
| ---------------------- | ------------------ | ----------------------- |
| tinggi dokumen         | 1534px (1,7 layar) | **2228px** (2,79 layar) |
| opacity baris di `y=0` | `1.00 1.00 1.00`   | `1.00 0.70 0.70`        |
| di `y=500`             | `1.00 1.00 1.00`   | `0.70 1.00 0.70`        |
| di `y=1000`            | `1.00 1.00 1.00`   | `0.70 0.70 1.00`        |
| jarak judul→ringkasan  | ~215px             | **27px**                |
| overflow horizontal    | tidak              | tidak                   |

Yang memimpin ikut berganti isinya, bukan cuma angkanya: "Scope is the
deliverable" → "A decision you can defend six months later" → "Evaluation
before pipeline".

### 7.2 Yang dikirim

| Berkas                                   | Isinya                                                              |
| ---------------------------------------- | ------------------------------------------------------------------- |
| `vault/motion/use-active-in-sequence.ts` | **baru** — logika yang diekstrak, dipakai dua konsumen              |
| `vault/blocks/step-sequence/index.tsx`   | −57 baris; sekarang memanggil hook itu                              |
| `app/[locale]/journal/index-rows.tsx`    | **baru** — pulau klien, halamannya tetap Server Component           |
| `app/[locale]/journal/page.module.css`   | peredupan, tinggi baris (dua viewport), `@media (--reduced-motion)` |
| `e2e/motion.e2e.ts`                      | tiga gerbang `journal-index`                                        |

Risiko §6.2 — "ekstraksi menyentuh komponen yang sudah terkirim" — terjawab
seperti yang ditulis di sana: gerbang Tahap 25 (`01 → 02 → 03 → 04`, pin, axe
tergulir) lulus tanpa disentuh.

### 7.3 Sapuan kontras, kali ini benar-benar lebih dulu

Disapu terhadap axe pada halaman yang sudah dirender, di posisi gulir yang
membuat **dua baris benar-benar mundur** (kalau tidak, sapuannya tidak
membuktikan apa pun — pemeriksaan itu ada di dalam skripnya):

| `--row-recede` | node gagal | rasio terukur                             |
| -------------- | ---------- | ----------------------------------------- |
| 0,30           | 8          | 1,91:1 — dan **judulnya** 2,49:1          |
| 0,55           | 6          | 3,70:1                                    |
| 0,60           | 6          | 4,21:1                                    |
| **0,65**       | **0**      | lantai                                    |
| 0,70           | 0          | **dikirim** — satu langkah di atas lantai |

Dua hal yang layak dicatat:

1. **0,55 memberi 3,70:1 lagi** — angka yang persis sama dengan peredupan
   langkah Tahap 25, karena token dan latar yang sama pada opacity yang sama
   memang harus memberi rasio yang sama. Lantainya pun sama: 0,65.
2. **Ambang judulnya memang 3:1, dan itu terukur.** §3 menduga judul berukuran
   display dinilai sebagai teks besar; axe mengonfirmasinya — pada 0,30
   judulnya gagal terhadap 3:1, bukan 4,5:1. Yang mengikat justru tanggal dan
   ringkasan yang bertoken redup, terhadap 4,5:1.

### 7.4 Tiga kesalahan saya sendiri

**7.4.1 `Reveal` dan peredupan berebut `opacity`.** Keduanya dideklarasikan di
elemen yang sama, dan `Reveal` menang lewat urutan sumber: setiap baris
melaporkan `1.00` di setiap posisi gulir sementara `--row-recede` duduk di
stylesheet tanpa efek. Dipisah jadi dua elemen — `<article>` memegang masuknya,
`<div>` di dalamnya memegang kepemimpinannya — dan `data-journal-entry`
dipindah ke elemen yang opacity-nya memang ingin dibaca gerbang.

**7.4.2 Komentar JSX yang tidak sah.** Sebuah `{/* */}` ditulis sebagai
saudara di dalam panah `map`. Blok render-nya ditulis ulang dengan komentarnya
di atas `return`.

**7.4.3 `min-block-size` pada grid, untuk ketiga kalinya.** Judul 215px dari
ringkasannya sendiri — bug yang **persis sama** dengan yang Tahap 25 perbaiki
di `step-sequence`. Sebuah `min-block-size` meregangkan baris grid-nya, jadi
tinggi tambahannya dibagikan _melalui_ isinya alih-alih sesudahnya.
Pasangannya selalu `align-content: start`, dan itu sekarang ditulis sebagai
aturan di CSS-nya, bukan sebagai perbaikan satu kali. Ia muncul untuk ketiga
kalinya di §7.5, di rule yang sama.

### 7.5 Cacat yang hanya ada di ponsel — dan hanya ketahuan karena diukur di sana

Tinggi barisnya ditulis di dalam `@media (--desktop)`. Di 390×844 baris tetap
setinggi isinya, dan hasilnya diukur:

```
             band baca 338–506
y=  0   [266,463] h198    *[464,692] h228     [693,910] h217
y=200   [ 66,263]         [264,492]          *[493,710]
y=400 … y=800  baris ketiga memimpin, dan tidak pernah berganti lagi
```

Dua baris sudah melewati garis baca di frame pertama, jadi **entri terbaru
tampil redup saat halaman dibuka** dan yang memimpin adalah entri kedua. Pada
200px berikutnya kepemimpinan lompat ke baris ketiga dan menetap di sana untuk
sisa ~1400px. Seluruh koreografinya selesai di dalam seperempat halaman — versi
ponsel dari cacat yang §1 ukur di desktop, dikirim oleh perbaikan yang sama.

Diberi `min-block-size: 40svh` (+ `align-content: start`) di aturan dasarnya.
Terukur sesudahnya:

```
y=  0  *[266,603] h338    [604,942]      [943,1280]
y=200   [ 66,403]        *[404,742]      [743,1080]
y=600   [-334,  3]        [  4,342]     *[343,680]
```

Baris terbaru memimpin saat diam, dan kepemimpinan berjalan `01 → 02 → 03`
berurutan. Tinggi dokumen ponsel 1637 → **2008px** (2,38 layar) — harga yang
sama disengajanya dengan yang desktop bayar.

**Urutan langkah studio diukur untuk cacat yang sama dan tidak punya**
(3540px, `01 → 02 → 03 → 04`, dan `01` memimpin di puncak). Langkahnya membawa
prosa dan cukup tinggi dengan sendirinya; indeks ini isinya tiga judul, jadi
tidak ada yang membuat barisnya tinggi selain baris CSS itu. Karena itu
`step-sequence` **tidak diubah** — memperbaiki yang tidak rusak akan menaikkan
tinggi halaman studio tanpa membeli apa pun.

### 7.6 Verifikasi

- `bun run check` — exit 0, **417 uji unit**, oxfmt/oxlint/tsc bersih.
- `CI=true bun run test:e2e` — **354 lulus, 0 gagal**, 18 dilewati.
- axe pada `/en/journal` dengan satu baris **benar-benar mundur** — nol
  pelanggaran; gerbangnya menolak berjalan kalau tidak ada yang mundur.
- Reduced motion: nol baris di bawah 0,99, dijamin stylesheet.
- Ponsel 390×844, dua bahasa: nol overflow horizontal.
- Tidak ada klaim performa — tidak ada profiler di lingkungan ini
  (`CLAUDE.md` #19).

### 7.7 Yang tidak dikerjakan, disebut

- **Halaman entri tetap tanpa momen berkoreografi**, sesuai §5. Ia diukur di
  §1 dan memang tidak kekurangan apa pun.
- **Celah Tahap 26 §8.8 masih terbuka**: rute entri membaca perancah saja.
  Cabang CMS-nya tetap menunggu dokumen `journalEntry` pertama, karena
  menulisnya sekarang berarti menulis buta terhadap bentuk Portable Text yang
  belum pernah diambil.
- **Tidak ada story Storybook untuk `useActiveInSequence`.** Ia hook yang
  digerakkan gulir; sebuah iframe Storybook tidak menggulir, jadi story-nya
  akan memperlihatkan indeks 0 yang diam dan mengiklankan bahwa ia tidak
  bekerja. Ini alasan yang sama yang dicatat untuk `step-sequence`.
