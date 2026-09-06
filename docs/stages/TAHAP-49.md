# Tahap 49 — Beranda: hero mengisi layar, lalu `arth-passage`

> Tahap terbesar dalam rencana ini, dan tempat "journey animation yang berat
> dan hebat" benar-benar dibelanjakan. Ia juga tahap yang menabrak **dua**
> keputusan lama yang punya pengukurannya sendiri, jadi keduanya dibuka
> kembali di depan alih-alih dilewati diam-diam.

## 1. Baseline, diukur sebelum satu baris ditulis

Build produksi, `HEAD` sebelum tahap ini:

|             |                1440×900 |                 390×844 |
| ----------- | ----------------------: | ----------------------: |
| Dokumen     | 6703px = **7,45 layar** | 5633px = **6,67 layar** |
| Hero        |  792px = **0,88 layar** |      743px = 0,88 layar |
| `#work`     |                  2852px |                  2156px |
| `#practice` |               **424px** |                   336px |
| `#studio`   |                   852px |                   821px |
| `#contact`  |                       — |                   255px |

Token: `--gap` 16px · `--safe` 16px · `--section-lead` 48px pada 1440.

**Yang paling menonjol bukan heronya.** `#practice` — bagian yang menyebut apa
saja yang dikerjakan studio ini — tingginya **424px, tidak sampai separuh
layar**. Hero 792px dalam viewport 900px bukan sumber rasa "kurang besar";
seksi setengah layar untuk tiga wilayah praktik adalah.

## 2. Dua premis rencana yang salah, dan pengukurannya

### 2.1 "Plate hero tiba lewat `pixel-image`" — **hero tidak punya plate**

Rencana menulis hero mendapat "plate hero yang tiba lewat `pixel-image`
alih-alih fade". Dibaca dari kodenya, `vault/blocks/hero/index.tsx` merender
empat hal: index (kanan atas), headline, subline, action — plus wash WebGL
sebagai latar. **Nol gambar.**

Menambahkan satu berarti mengarang komposisi baru untuk hero yang komposisinya
sudah diukur (`TAHAP-12.md` §3.1: diagonal index-ke-headline, bukan tumpukan
tengah). Jadi `pixel-image` **ditunda ke Tahap 51**, di mana `/work/<slug>`
punya plate proyek yang nyata dan kedatangannya memang sedang dikerjakan.

Ini tahap ketujuh berturut-turut premis rencananya meleset. Polanya sudah jadi
metode: **baca kodenya sebelum menulis apa yang akan diubah.**

### 2.2 Hero 100svh **membatalkan cue gulir yang dua tahap bangun**

`vault/blocks/hero/hero.module.css:32` menulis alasannya sendiri:

> _"88, not 100 — the next section's top edge stays inside the first screen.
> This is the scroll cue, done structurally. Tahap 12 measured that a
> full-viewport hero on a 5749px document said nothing about the rest, and
> answered it with a `Scroll` label; Tahap 34 removed the label because
> `taste-skill` SKILL.md section 14 names it an AI tell, and moved the job
> here."_

Diukur: pada 1440×900 hero 792px menyisakan **108px** bagian berikutnya di
dalam layar pertama. 100svh menghapusnya.

**Keputusannya tetap 100svh, dan harganya ditulis.** Pemilik meminta hero lebih
panjang, keberatan ini sudah diangkat saat perencanaan, dan rencananya
disetujui dengan 100svh di dalamnya. Yang tidak boleh adalah mengirimnya
seolah tidak ada yang hilang.

**Penggantinya, dan saya tidak akan mengklaimnya setara.** Draf spec ini
menjanjikan lapisan ground yang dirender pada pembungkus merentang hero
**dan** passage supaya kisinya terpotong di garis lipat. Yang dikirim lebih
sederhana, dan lebih jujur: kisi 48px yang mengisi hero setinggi 900px
berakhir pada 900/48 = **18,75 petak**, jadi baris terakhirnya memang
terpotong di tengah tanpa pembungkus apa pun. Permukaan yang terpotong
membaca sebagai berlanjut, bukan sebagai panel yang selesai.

**Itu afordans yang lemah**, dan menyebutnya pengganti peek 108px akan
melebih-lebihkan. Ia perbedaan nyata tapi kecil, dan tidak digerbangi —
menggerbangi "kisi terpotong di tengah petak" akan mengunci ukuran petak ke
tinggi viewport, yaitu menggerbangi kebetulan.

**Afordans yang sebenarnya kuat datang dari `arth-passage`:** gerakan gulir
pertama menemui rangkaian ter-pin, jadi input pertama pembaca menghasilkan
respons besar dan langsung. Peek 108px memberi tahu ada sesuatu di bawah; pin
memberi tahu bahwa yang di bawah itu sepadan. Yang **digerbangi** adalah
konsekuensi yang bisa merugikan pembaca — pin harus lepas, `End` harus
mencapai footer, keyboard harus melewati seluruh isi.

## 3. `arth-passage` — dibuat dari isi yang sudah ada

**Kendala yang menentukan bentuknya: beranda tidak punya kata cadangan.**
`CLAUDE.md` dan perintah pemilik sama-sama melarang konten karangan. Setiap
kalimat di halaman ini sudah punya tempatnya — pernyataan studio ada di
`StudioNote`, nama praktik ada di `PracticeList`, headline ada di hero.

Jadi passage **bukan blok baru dengan kata-kata baru.** Ia adalah **kedatangan
seksi `#work` itu sendiri, dikoreografikan.** `SectionHeader` yang sudah ada —
judul "Work" dan hitungan karya — pindah ke dalamnya. Nol copy bertambah, dan
passage berhenti jadi sesuatu yang ditempel di antara hero dan karya: ia
menjadi cara karya itu tiba.

### Koreografi, konkret

Satu ScrollTrigger, `pin: true`, `scrub: 0.5`, `ease: 'none'`, `end: '+=250%'`
— **±2,5 layar gulir menggerakkan satu layar isi**, di loop GSAP bersama
(order 10, di belakang Lenis order 5).

| Bagian     | Gerak                                                                         | Properti               |
| ---------- | ----------------------------------------------------------------------------- | ---------------------- |
| 0 → 0,35   | Kisi studio menajam: `scale(1.5)` → `scale(1)`, `opacity` 0 → nilai istirahat | `transform`, `opacity` |
| 0,35 → 0,7 | Judul seksi naik lewat mask: `yPercent` 40 → 0, `opacity` 0 → 1               | `transform`, `opacity` |
| 0,7 → 1    | Ground mengendap dan isinya melayang naik saat pin lepas                      | `transform`, `opacity` |

**Apa yang dikomunikasikan gerak ini** — uji `taste-skill`, dan jawaban sah
hanya hierarki / narasi / umpan balik / transisi status: **narasi.** Kisi 12
kolom yang situs ini pakai untuk menyusun segala sesuatu menjadi terlihat,
menajam ke ritme sebenarnya, lalu judul karya tiba di atasnya. Itu cerita
tentang bagaimana studio ini menyusun sesuatu, diceritakan dengan strukturnya
sendiri. Bukan "kelihatan keren".

**Ini bukan scroll hijacking**, dan bedanya penting karena Bagian IV rencana
menolak hijacking permanen: pembaca menggulir pada kecepatannya sendiri, `End`
tetap sampai footer, `Tab` tetap melewati seluruh isi, dan melepas gulir
menghentikan gerak seketika. Yang di-pin adalah **apa yang terlihat**, bukan
**seberapa cepat gulirnya**. Digerbangi dengan keyboard saja.

**Reduced motion:** nol pin, nol scrub. Tanpa ScrollTrigger tidak ada spacer,
jadi passage runtuh ke tinggi alaminya — pembaca yang meminta tidak ada gerak
**tidak** mendapat 2,5 layar kosong untuk digulir. Judul dan ground pada
keadaan akhirnya, `opacity: 1`.

**Tanpa JavaScript:** sama. Tween dibuat dengan `gsap.fromTo`, jadi keadaan
istirahat DOM adalah keadaan yang terbaca, dan "from" hanya ada setelah GSAP
menyetelnya.

### Amandemen §9.5, ditulis bukan dilanggar diam-diam

`/` naik dari dua momen ke **tiga**. Ceiling naik **hanya untuk tiga rute** —
`/`, `/studio`, `/work` — dan argumennya berdiri sendiri di
`MOTION-SPEC.md`: sebuah journey bergulir punya awal, klimaks dan akhir, yang
adalah definisi momen berkoreografi. Menyebutnya "respons berkelanjutan"
supaya lolos anggaran adalah persis kecurangan yang §9.5 ada untuk mencegah.

Empat rute lain tetap di ceiling lama. Batas yang naik di mana-mana bukan
batas.

## 4. Seksi yang lebih tinggi dan lebih lebar

- `--section-lead` naik. `e2e/spatial-rhythm.e2e.ts` menuntut **satu** ritme
  per halaman, bukan angka tertentu, jadi menaikkannya seragam aman —
  diperiksa sebelum disentuh.
- `#practice` 424px adalah target sebenarnya (§1), bukan hero.
- **Lebar bukan berarti semuanya melebar.** Yang melebar adalah media; prosa
  tetap di kolom bacanya. Prosa selebar layar tidak terbaca sebagai mewah, ia
  terbaca sebagai tidak ditata.

## 5. Gerbang

| Gerbang                          | Menuntut                                                                                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `e2e/journey.e2e.ts` (diperluas) | Rangkaian ter-pin melepas pin-nya; `End` mencapai footer; keyboard melewati seluruh isi; lapisan ground melewati tepi bawah viewport di layar pertama |
| `e2e/continuous-motion.e2e.ts`   | Di bawah reduced motion nol spacer pin — beranda tidak boleh tumbuh 2,5 layar kosong                                                                  |
| `e2e/interaction-grammar.e2e.ts` | Sampler epik menerima momen ketiga di `/` dan **hanya** di rute yang §9.5 izinkan                                                                     |
| `e2e/route-budget.e2e.ts`        | Kenaikan apa pun dinaikkan sengaja dengan alasan per rute                                                                                             |
| `e2e/taste-preflight.e2e.ts`     | Hero tetap maksimal empat elemen teks setelah tumbuh                                                                                                  |

## 6. Hasil

### 6.1 Geometri, sebelum dan sesudah

|                               | 1440×900 sebelum |          sesudah | 390×844 sebelum |          sesudah |
| ----------------------------- | ---------------: | ---------------: | --------------: | ---------------: |
| Dokumen                       |           6703px |      **10134px** |          5633px |       **8756px** |
| Layar                         |             7,45 |        **11,26** |            6,67 |        **10,37** |
| Hero                          |     792px (0,88) | **900px (1,00)** |    743px (0,88) | **844px (1,00)** |
| `#work` (termasuk spacer pin) |           2852px |       **6031px** |          2156px |       **5093px** |

Halaman tumbuh **51%** di desktop dan **55%** di ponsel, dan ±2,5 layar dari
pertumbuhan itu adalah passage.

### 6.2 Perilaku yang bisa merugikan pembaca, diukur

|                     |  Normal | Reduced motion |
| ------------------- | ------: | -------------: |
| Tinggi dokumen      | 10134px |     **7884px** |
| `.pin-spacer`       |       1 |          **0** |
| Footer tercapai     |      ya |             ya |
| Passage melepas pin |      ya |             ya |

Selisih 2250px **tepat** `2,5 × 900` — panjang pin, dan ia benar-benar tidak
ada di bawah preferensi itu.

### 6.3 Premis saya sendiri salah, dan gerbang yang menangkapnya

Tahap ini merencanakan seksi yang lebih lapang atas dasar "seksi hanya
dipisahkan 48px". **Angka itu salah, dan salahnya milik saya.** Ia datang dari
membaca `gap: var(--section-lead)` di aturan `.section` dan mengiranya jarak
antar-seksi. `page.module.css` punya **dua** aturan dengan blok
`display:flex; flex-direction:column; gap: var(--section-lead)` — `.sections`
(kontainer) dan `.section` (tiap seksi) — dan penggantian saya kena yang
salah.

Akibatnya dua-duanya keliru sekaligus:

1. Jarak antar-seksi **sudah** `desktop-vw(160px)` / `mobile-vw(96px)`.
   Tidak ada yang perlu dilonggarkan.
2. Yang saya ubah justru **ritme header-ke-badan** — hal yang §4 spec ini
   secara eksplisit berjanji tidak akan disentuh.

`e2e/spatial-rhythm.e2e.ts` menangkapnya dalam satu jalan, dengan angkanya:

```
sections disagree on the rhythm: practice=46px, studio=107px, contact=107px
spread 61.078125 (toleransi 1.5)
```

Selisih 61,08px persis `desktop-vw(120px) − --section-lead` pada 1280.
Diperbaiki dengan membatalkan edit itu sepenuhnya. **Seksi tidak jadi lebih
tinggi di tahap ini, dan itu karena tidak perlu** — halaman tetap tumbuh 51%
dari hero dan passage saja.

### 6.4 Satu cacat Tahap 48 ditemukan di sini, dan bentuknya yang paling buruk

Sapuan penuh melaporkan **satu** kegagalan `not-found`: `serious:
color-contrast (1 node)`. Dijalankan ulang sendirian, ia lulus — bentuk cacat
yang paling berbahaya, karena suite yang gagal sesekali mengajari orang untuk
menjalankannya ulang.

Dikejar, bukan dianggap flake. Diukur dengan menjalankan axe pada 404 di lima
titik waktu:

```
 150 ms → clean
 250 ms → <span class="… wordmark">Arth</span>   ← serious: color-contrast
 400 ms → clean
 700 ms → clean
1400 ms → clean
```

**Wordmark tirai memudar `opacity` 1 → 0 selama 200ms, dan axe membaca teks
yang dirender.** Sapuan yang mendarat di dalam jendela itu mengukur tipe
setengah transparan di atas panel. `aria-hidden` tidak akan menolong — Tahap
43 sudah menetapkan bahwa aturan kontras tidak membebaskan teks tersembunyi.

Diperbaiki dengan membuat wordmark **pergi lewat `transform`** keluar dari
mask, bukan memudar. Itu menghapus jendelanya sama sekali alih-alih
mempersempitnya, dan terbaca lebih baik: wordmark **pergi**, sedangkan fade
melarutkannya. Diverifikasi bersih di kelima titik waktu.

### 6.5 Gerbang yang harus belajar, dan satu yang dibuktikan bisa menangkap

| Gerbang               | Perubahan                                                                                                                                                                                                                                                                                                             |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `interaction-grammar` | Ceiling §9.5 jadi **tabel per rute** (3 untuk `/`, `/studio`, `/work`; 2 sisanya), bukan konstanta. Ditambah asersi anti-vakum yang bentuk lamanya tidak bisa ungkapkan: `not.toHaveLength(3)` lolos untuk halaman dengan **nol** momen                                                                               |
| `reveal-coverage`     | Passage membawa `data-reveal-exempt` — jalan keluar eksplisit yang gerbang itu sendiri sediakan, karena judulnya diumumkan oleh momen bernama, bukan oleh kontrak reveal                                                                                                                                              |
| `journey` (keyboard)  | 60 tekan Tab lulus di desktop dan **gagal di mobile** — bukan karena fokus terjebak, tapi karena tata letak ponsel punya lebih banyak elemen sebelum footer. Hitungan tetap mengukur tata letak, bukan jebakan. Diganti loop sampai fokus masuk footer, batas 200, dan pesan gagalnya menyebut di mana fokus berhenti |

**Satu gerbang dibuktikan bisa menangkap kegagalannya, bukan hanya hijau.**
Passage dibangun sebelum gerbangnya ditulis — urutan yang terbalik dari
disiplin proyek ini — jadi guard `if (reduced) return` dilepas sengaja,
build dijalankan, dan asersi reduced-motion **merah**. Guard dikembalikan.
Hijau tanpa bukti bahwa ia bisa merah bukan gerbang.

### 6.5b Dua asersi berhenti berjalan sementara suite tetap hijau

Sapuan pertama yang lulus melaporkan **17 dilewati**, naik dari 15. Angka
"dilewati" adalah angka yang paling mudah tidak dibaca, dan dua di antaranya
adalah gerbang yang berhenti mengukur:

```
- material layer › COMMIT hands the plate back to the DOM before navigating
- material layer › the keyboard reaches COMMIT too
```

Penyebabnya konsekuensi langsung dari tahap ini. Helper `showWorkGrid`
menggulir `#work` ke pandangan, dan itu bekerja hanya karena `#work` dimulai
dengan kisinya. Sekarang tidak: `arth-passage` membuka `#work` dengan
rangkaian ter-pin, jadi awal `#work` berada **2,5 layar di atas** sampul
pertama. Material tidak pernah mount, `test.skip` menyala, dan dua asersi
berhenti berjalan — **cara paling senyap sebuah gerbang bisa gagal**, karena
suite tetap melaporkan hijau.

Diperbaiki dengan menggulir ke **subjeknya** (`[data-material-shell]`
pertama) alih-alih ke kontainernya. Itu yang seharusnya dilakukan sejak awal;
jangkar lama adalah indireksi yang kebetulan bertahan. Setelahnya keempat tes
`material-layer` berjalan dan lulus.

Pelajaran yang layak dicatat karena repo ini terus membayarnya: **membaca
"passed" tanpa membaca "skipped" adalah membaca separuh hasil.**

### 6.6 Verifikasi

```
bun run check        lulus — unit 421 lulus
bun run build        lulus
build-storybook      lulus — 101 story menjadi 103, tepat +2
CI=true test:e2e     568 lulus, 0 gagal, 0 flaky, 15 dilewati (12,2m)
```

**Dua angka, dan keduanya dijelaskan.**

`560 → 568` (+8): `journey.e2e.ts` mendapat tiga asersi passage yang berjalan
di **kedua** proyek (+6), dan dua story `Passage` masuk sapuan axe (+2).

`15 → 17 → 15` dilewati: naik dua ketika helper `material-layer` berhenti
menemukan platnya (§6.5b), kembali ke lima belas setelah diperbaiki. Angka
akhirnya sama dengan sebelum tahap ini, yang berarti **nol asersi hilang.**

Perjalanan gerbangnya sendiri layak dicatat: sapuan pertama **7 gagal, 1
flaky** — anggaran §9.5, reveal-coverage, spatial-rhythm ×4, keyboard mobile,
dan satu kontras 404 yang intermiten. Enam dari tujuh adalah gerbang yang
belum tahu tentang perubahan ini; **dua sisanya cacat nyata** (§6.3 milik
saya, §6.4 dari Tahap 48).

### 6.7 Yang tidak dikerjakan

- **`pixel-image` tidak dipasang** — §2.1, hero tidak punya plate. Ke Tahap 51.
- **Seksi tidak dibuat lebih tinggi** — §6.3, premisnya salah dan tidak ada
  yang perlu dilonggarkan.
- **`#practice` tetap 424px.** Itu kepadatan isi, bukan spasi, dan mengisinya
  butuh konten yang situs ini tidak punya. Terbuka, tercatat.
- **Nol pengukuran frame rate.** Tidak ada profiler di sini (`CLAUDE.md` #19).
  Passage dipandangi, tidak diprofil.
