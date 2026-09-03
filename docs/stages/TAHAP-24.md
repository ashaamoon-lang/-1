# Tahap 24 — Halaman Studio: desain dan gerak, teks sebagai perancah

> Pendalaman wajib atas `docs/ROADMAP.md` §3.0.
> Fase 2 dari scaffold yang disetujui.

Status: **selesai**. Hasil di §8.

---

## 1. Mandat yang berubah, dan itu yang membuka tahap ini

Saat scaffold disusun, pemilik proyek melarang konten fiktif. Larangan itu
**dicabut untuk tahap ini**, dengan arahan eksplisit:

> "tulis konten fiktif dari sisi konteks. Namun perhatikan layoutnya. Nanti
> kita akan rubah seluruh konteks teks dari web. Fokus pada DESAIN dan animasi
> saja."

Jadi teks di halaman ini adalah **perancah tata letak**, bukan pernyataan
studio. Konsekuensinya pada cara menulisnya, dan ini yang penting: panjangnya
harus **realistis**, karena tata letak yang diuji dengan satu kalimat pendek
akan patah begitu kalimat aslinya masuk. Judul dua baris, paragraf pembuka
tiga baris, pernyataan panjang 90-110 kata — supaya yang diuji adalah bentuk
yang akan benar-benar dipakai.

Yang **tidak** dikarang: kolofon. Bagian itu berisi fakta yang memang benar
tentang situs ini, dan dibiarkan benar supaya ada satu bagian yang tidak perlu
ditulis ulang nanti.

---

## 2. Kenapa halaman ini, dan kenapa sekarang

Label `STUDIO` ada di header sejak awal dan menunjuk **anchor** `#studio` di
beranda. Tahap 22 mengukur akibatnya: `/en/studio` mengembalikan halaman
"Page not found", dan itu satu-satunya label nav yang sengaja **tidak** saya
alihkan — dengan alasan tertulis bahwa ia jadi rute nyata di sini.

Jadi tahap ini menutup janji yang sudah dicatat dua tahap lalu.

---

## 3. Desain

### 3.1 Struktur, dan kenapa urutannya begitu

| #   | Bagian                                             | Menjawab                                          |
| --- | -------------------------------------------------- | ------------------------------------------------- |
| 1   | Hero: eyebrow, `h1`, kalimat pembuka, `<dl>` fakta | siapa ini, dan fakta dasarnya **sebelum digulir** |
| 2   | Pernyataan panjang                                 | bagaimana studio ini berpikir                     |
| 3   | Cara kerja — urutan bernomor                       | apa yang terjadi kalau saya menyewa mereka        |
| 4   | Kapabilitas per praktik                            | apa persisnya yang bisa dikerjakan                |
| 5   | Kolofon                                            | dengan apa situs ini dibuat (**fakta nyata**)     |
| 6   | Penutup                                            | ke mana selanjutnya                               |

Hero-nya sengaja **meniru disiplin halaman proyek** (Tahap 19): fakta dalam
`<dl>` di layar pertama, bukan di bawah lipatan.

`h1`-nya satu kata — **"Studio"** — persis seperti katalog memakai **"Work"**
dengan eyebrow yang membingkainya. Itu bukan kekurangan imajinasi; itu pola
yang halaman katalog sudah tetapkan, dan menyimpang darinya di halaman ketiga
akan jadi kosakata ketiga.

### 3.2 Penomoran hanya dipakai karena ia memang urutan

`Cara kerja` diberi nomor 01-04 karena ia benar-benar **berurutan** — apa yang
terjadi lebih dulu menentukan yang berikutnya. Penanda bernomor pada daftar
yang bukan urutan adalah dekorasi generik; di sini ia membawa informasi.

### 3.3 Kolom yang menempel — desain, bukan animasi

Label bagian "Cara kerja" **menempel** (`position: sticky`) sementara
langkah-langkahnya lewat di sebelahnya. Ia memberi kesan koreografi tanpa satu
baris JavaScript pun, tanpa satu kilobyte pun, dan tanpa masuk hitungan
`MOTION-SPEC.md` §9.5 — karena ia bukan animasi, ia tata letak.

---

## 4. Gerak

Yang dipakai semuanya **sudah ada di situs ini**. Tidak ada primitif baru,
dan itu disengaja: Tahap 23 baru saja menghabiskan satu tahap untuk
menyatukan kosakata, dan halaman baru yang memperkenalkan gerak keenam akan
membatalkannya.

| Elemen                 | Mekanisme                                           | Sudah dipakai di         |
| ---------------------- | --------------------------------------------------- | ------------------------ |
| `h1`                   | `TextReveal` — baris naik di balik mask             | beranda, katalog, proyek |
| Blok masuk             | `Reveal` + `data-reveal-item`                       | 8 tempat                 |
| **Pernyataan panjang** | **`ProgressText`** — opacity kata di-scrub ke gulir | halaman praktik          |
| Kolom menempel         | CSS `position: sticky`                              | baru, tapi bukan animasi |

**Satu momen berkoreografi, dan ia diberi nama: `studio-statement`.** Itu
scrub `ProgressText`. `MOTION-SPEC.md` §9.5 mengizinkan dua per halaman;
memakai satu adalah pengendalian diri, bukan kekurangan.

`ProgressText` dipilih karena dokumentasinya sendiri menetapkan kasus ini:
_"Use `ProgressText` for a long passage the reader moves through"_. Sampai
sekarang ia hidup di satu tipe rute saja — memperluasnya adalah argumen "satu
kosakata" yang sama dengan Tahap 23.

---

## 5. Yang harus ikut berubah kalau sebuah rute lahir

Sebuah rute baru bukan satu berkas. Yang ikut:

1. `messages/en.json` + `messages/id.json` — kunci `studio`.
2. `lib/seo/route-catalog.ts` — `STATIC_ROUTE_TEMPLATES`, supaya sitemap,
   `/llms.txt`, `/agent-content`, dan `/ai` ikut mengetahuinya.
3. `components/layout/header` — `STUDIO` berhenti jadi anchor, jadi tautan
   rute.
4. `lib/i18n/guessed-paths.ts` — `studio` masuk `REAL_SEGMENTS`; berkas itu
   sudah menulis bahwa ia bergabung "di Tahap 24".
5. Gerbang: `route-budget`, `visual-substance` (gutter + footer), `motion`
   (kosakata masuk), `site-reach` (jalan masuk & keluar).

---

## 6. Gerbang

1. **Rutenya ada, dua bahasa** — dan `/en/studio` berhenti 404.
2. **Kosakata masuk** — `h1`-nya displit seperti rute lain
   (`SPLIT_HEADING_ROUTES` bertambah).
3. **Gutter** — konten mulai di tempat chrome mulai (`GUTTER_ROUTES`).
4. **Footer tidak tertelan** — otomatis ikut, karena gerbang Tahap 22 ditulis
   per-rute.
5. **Anggaran** — rute baru dengan izin `gsap` (ia membawa TextReveal +
   ProgressText) dan plafon dari pengukuran.
6. **axe bersih**, WCAG 2.2, dua viewport, dua bahasa.
7. **Reduced motion** — isi berakhir terlihat penuh.
8. **Tanpa JavaScript** — terbaca.

---

## 7. Risiko

**7.1 `ProgressText` men-scrub opacity, dan reduced motion harus meninggalkan
teksnya terbaca penuh.** Ini `CLAUDE.md` #5 dan komponennya sudah
menanganinya di halaman praktik; diverifikasi ulang di sini, tidak
diasumsikan.

**7.2 Halaman panjang tanpa media.** Halaman ini hampir seluruhnya tipografi.
Kalau ritme vertikalnya salah ia akan terbaca seperti dokumen, bukan seperti
situs. Karena itu ia **dipandangi** di dua viewport dua bahasa, bukan hanya
diukur.

**7.3 Anchor `#studio` di beranda tetap ada.** Header berhenti menunjuk ke
sana, tapi bagian beranda-nya tidak dihapus di tahap ini — menghapusnya
mengubah komposisi beranda, dan itu keputusan lain.

---

## 8. Hasil

**Selesai.** Rutenya hidup di dua bahasa, dan tahap ini menemukan **satu cacat
aksesibilitas serius yang sudah terkirim sejak Tahap 15** — bukan di halaman
baru ini, melainkan di komponen yang ia pakai ulang.

### 8.1 Yang dikirim

`/[locale]/studio` — hero dengan `<dl>` fakta di layar pertama, pernyataan
panjang yang di-scrub, urutan kerja bernomor dengan label yang menempel,
kapabilitas per praktik, kolofon, penutup. Terdaftar di `route-catalog`
(sitemap, `/llms.txt`, `/agent-content`, `/ai` ikut otomatis), di kolom Index
footer, dan di `REAL_SEGMENTS`.

Nol primitif gerak baru: `TextReveal`, `Reveal`, dan `ProgressText` semuanya
sudah ada. Satu momen berkoreografi, dinamai `studio-statement`.

### 8.2 Cacat 1 — halaman merender di bawah header

Terukur, sebelum ada perbaikannya:

| rute                      | tepi bawah header | `h1`   | terpotong |
| ------------------------- | ----------------- | ------ | --------- |
| **`/en/studio`**          | 98                | **86** | **ya**    |
| `/en/work`                | 98                | 208    | tidak     |
| `/en/work/arus-balik`     | 98                | 146    | tidak     |
| `/en/practice/consulting` | 98                | 480    | tidak     |

Judul dan fakta pertama tertutup chrome. Sebabnya `padding-block:
var(--section-lead)` saja, sementara pola situs ini
`calc(var(--header-height) + …)` — token yang sudah ada, bukan angka baru.
Sesudah: `h1` di **216**.

**Ditemukan dengan memandang, bukan oleh gerbang.** Tidak ada gerbang yang
menanyakan "apakah konten mulai di bawah header".

### 8.3 Cacat 2 — nama kapabilitas merender kunci mentah

Halaman menampilkan `work.consulting`, `work.ai-data`, `work.commission`
sebagai judul. Label praktik ada di namespace `workIndex` (yang chip filter
dan footer sudah pakai), bukan `work`. Juga ditemukan dengan memandang.

### 8.4 Cacat 3 — `aria-prohibited-attr`, dan ini yang paling penting

`route-sweep.e2e.ts` menangkap rute baru secara otomatis — bukti pendaftaran
di §5 benar — lalu **gagal**:

```
serious: aria-prohibited-attr (1 node(s))
aria-label attribute cannot be used on a span with no valid role attribute.
```

Sumbernya bukan halaman ini. `components/effects/progress-text` merender
`<span>` dan menyuruh SplitText menulis teks aslinya ke `aria-label` di sana
(`aria: 'auto'`). `aria-label` **dilarang** pada elemen yang role-nya tidak
mendukung penamaan — termasuk `generic` (span/div polos) dan `paragraph`
(`<p>`), jadi tidak ada tag yang akan membuatnya sah.

**Cacat ini ada di setiap halaman praktik juga**, diverifikasi dengan
menjalankan axe langsung ke keempat rute. Gerbangnya hijau selama sembilan
tahap **karena keberuntungan posisi**: pernyataan di halaman praktik ada di
bawah lipatan, jadi SplitText belum jalan saat axe mengaudit. Halaman Studio
menaruh satu dekat atas, dan cacat laten itu muncul.

Perbaikannya mempertahankan niat aslinya — jangan pernah dibacakan
kata-per-kata — tapi memakai pola yang **bisa dibuktikan benar** alih-alih
yang bergantung pada bagaimana sebuah screen reader memperlakukan span inline:
salinan visualnya disembunyikan penuh dari teknologi bantu, dan teks lengkapnya
diletakkan di sebelahnya dalam elemen `sr-only`.

Sesudah: keempat rute **bersih**, dan salinan aksesibelnya ada di kedua bahasa.

### 8.5 Yang diperiksa, ternyata bukan cacat

Bagian penutup tampak kosong di satu tangkapan layar — hanya garisnya yang
terlihat. Diperiksa alih-alih diasumsikan: `opacity: 1`, teks ada, CTA ada. Ia
hanya belum tercapai pada posisi gulir itu. Melaporkannya sebagai cacat akan
salah.

### 8.6 Verifikasi

- `bun run check` — **exit 0**, 410 uji unit.
- `CI=true bun run test:e2e` — **333 lulus**, 0 gagal, 14 dilewati (dari 328
  lulus + 5 gagal sebelum perbaikan §8.4).
- **axe langsung** ke `/en/studio`, `/id/studio`, dan dua halaman praktik:
  keempatnya bersih.
- **Reduced motion**, dua bahasa: 47 elemen teks, `minOpacity: 1`, **nol**
  tersembunyi. `CLAUDE.md` #5 terpenuhi.
- **Ponsel 390×844**: nol overflow horizontal, ritme vertikal dipandangi.
- Halaman **dipandangi** di 1440×900 (EN) dan 390×844 (ID).
- Tidak ada klaim performa (`CLAUDE.md` #19).

### 8.7 Catatan tentang teksnya

Seluruh salinan di halaman ini adalah **perancah tata letak** dan akan
diganti, kecuali kolofon, yang faktual dan dibiarkan benar. Panjangnya ditulis
realistis supaya tata letaknya teruji oleh bentuk yang akan benar-benar
dipakai.
