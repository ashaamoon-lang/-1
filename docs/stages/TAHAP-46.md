# Tahap 46 — Story yang hilang, keputusan Theatre.js, dan pandangan akhir

> Tahap terakhir rencana ini. Dua dari tiga butirnya berubah bentuk setelah
> diukur, dan yang ketiga menemukan satu klaim dokumen yang tidak dijaga apa
> pun.

## 1. "25 komponen tanpa story" — premisnya salah dua kali

Rencana menulis: _"**25 komponen tanpa story** mendapat story, terhadap
gerbang tertulis proyek ini sendiri."_ Dua bagian kalimat itu tidak sesuai
dengan kodenya.

**Pertama, aturannya bukan tentang semua komponen.** `CLAUDE.md` menulis
_"Primitives carry a Storybook story"_, dan `docs/ROADMAP.md` §checklist
menulis _"tiap primitive punya story"_. Diukur:

| `vault/primitives/` | Story |
| ------------------- | ----: |
| `cursor/`           |     1 |
| `icon/`             |     1 |
| `magnetic/`         |     1 |

**Aturan tertulisnya sudah dipenuhi**, dan sudah dipenuhi sebelum tahap ini
dimulai. Yang audit hitung adalah hal yang berbeda — direktori komponen mana
pun tanpa story — lalu menilainya terhadap aturan yang tidak mengatakan itu.

**Kedua, angkanya bukan 25.** Setelah Tahap 45 menghapus sepuluh direktori,
hitungannya **24**. Menghitung ulang sebelum menutup sebuah temuan adalah
yang membedakan menutupnya dari mengarang penutupannya.

### 1.1 Yang tetap dikerjakan, dan yang tidak — dengan alasannya

Aturan terpenuhi bukan alasan untuk tidak menulis story yang berguna. Yang
dinilai per direktori adalah pertanyaan lain: **apakah story-nya menunjukkan
sesuatu yang tidak bisa dilihat di tempat lain?**

**Ditulis** — blok yang merender berdiri sendiri, dan yang statusnya justru
paling sulit dilihat di halaman aslinya:

| Story baru                     | Yang ia tunjukkan                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `vault/blocks/practice-filter` | Keadaan terpilih — yang sebelum Tahap 39 **tidak bisa dicapai sama sekali** — dan cabang "terlalu sedikit untuk jadi filter" |
| `vault/blocks/step-sequence`   | Langkah yang memimpin lawan yang mundur, dengan dua panjang                                                                  |
| `vault/blocks/next-practice`   | Sirkuit yang menutup halaman praktik, di kedua bahasa                                                                        |
| `vault/motion/counter`         | Satu-satunya keadaan yang penting: angka yang **berubah**, bukan yang tiba                                                   |

**Tidak ditulis, dan itu keputusan bukan kelalaian.** Sisanya jatuh ke tiga
kelompok, dan tiap kelompok punya alasan yang sama untuk semua anggotanya:

| Kelompok               | Contoh                                                                            | Kenapa tidak                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Cangkang aplikasi      | `wrapper`, `header`, `footer`, `theme`, `lenis`, `real-viewport`, `route-loading` | Singleton yang butuh router, locale, dan konteks tema. Story-nya akan menguji tiruannya, bukan komponennya                   |
| Butuh data atau kanvas | `sanity-image`, `image`, `lightbox`, `vault/webgl/*`                              | Butuh CMS atau `<Canvas>` hidup; `e2e/visual-substance.e2e.ts` sudah mengukur keduanya pada halaman sungguhan, dengan piksel |
| Hook, bukan komponen   | `vault/motion/flip`, `parallax`, `reveal`, `progress-text`                        | Tidak punya permukaan untuk dirender. Story-nya adalah host yang dikarang untuknya, dan host itu yang akan terdokumentasi    |

Menulis dua puluh empat story untuk membuat sebuah angka hijau — angka yang
proyek ini tidak pernah tetapkan — adalah persis pekerjaan yang budaya repo
ini tolak di tempat lain.

## 2. Theatre.js: klaimnya benar, penjaganya tidak ada

Rencana menulis: _"`@theatre/studio` tidak pernah ikut ke bundel produksi,
**dijaga `route-budget.e2e.ts`**."_ Bagian pertama benar. Bagian kedua tidak:
`MARKERS` di berkas itu berisi tiga entri — `three`, `gsap`, `sanity` — dan
tidak satu pun menyebut Theatre.

Itu bukan detail. `@theatre/core` adalah **dependensi runtime** (bukan dev),
dan `SheetProvider` diimpor oleh `lib/webgl/components/canvas/webgl.tsx`,
yang dipasang setiap rute WebGL. "Dev-only" adalah properti satu cabang
`process.env.NODE_ENV`, dan **tidak ada yang memeriksanya**.

### 2.1 Marker-nya butuh tiga percobaan, dan dua yang pertama salah

Ini kasus tersulit untuk pemindaian string: pembungkusnya **dinamai** seperti
pustakanya dan meniru API-nya, jadi marker yang paling jelas justru cocok
dengan kode yang ada untuk **menghindari** memuatnya.

| Percobaan                       | Hasil                | Yang sebenarnya cocok                                                                                                                                                                                                               |
| ------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/theatrejs\|@theatre\/core/`   | `/en loaded theatre` | Satu chunk 34KB, satu kemunculan: `id === "theatrejs-studio-root"`, pemeriksaan DOM dari reset CSS — plus nama modul di `() => import('@theatre/core')`, yaitu referensi yang webpack butuhkan untuk **tidak** memuatnya lebih awal |
| `/SheetObject\|onValuesChange/` | merah lagi           | Dua chunk 39KB, konteksnya `{ onValuesChange, lazy, deps }` — tas opsi hook **kami sendiri**                                                                                                                                        |
| **`/createRafDriver/`**         | **hijau**            | Ekspor pustakanya sendiri: 4 kemunculan di dist `@theatre/core`, **0** di `lib/dev/theatre`                                                                                                                                         |

### 2.2 Dan gerbangnya dibuktikan bisa merah

Gerbang yang tidak bisa gagal adalah hiasan. `import { createRafDriver }` yang
sungguhan dipasang sementara ke `lib/dev/theatre`, build diulang:
**`/id loaded theatre without opting in`**. Dicabut, build diulang: **9 rute
lulus**.

Jadi yang tercatat sekarang adalah pengukuran, bukan keyakinan: **runtime
`@theatre/core` tidak mencapai produksi di rute mana pun**, dan mulai
sekarang ada yang menjaganya.

### 2.3 Yang tidak dikerjakan, dan kenapa

Rencana juga meminta `lib/dev/theatre` dipakai **mengarang kurva
`project-spine` dan `catalogue-sift` secara visual di dev**, lalu nilainya
dipanggang ke token.

**Itu tidak dikerjakan, dan alasannya bukan waktu.** Mengarang kurva secara
visual berarti seseorang menyeret handle di editor Studio dan menilai
hasilnya dengan mata. Tidak ada browser interaktif di lingkungan ini, dan
"nilai yang dipanggang" yang saya hasilkan tanpa itu hanyalah angka yang saya
tebak lalu tulis seolah diukur — yang `CLAUDE.md` #19 larang secara khusus.
Alatnya tetap ada dan sekarang dijaga; memakainya adalah pekerjaan studio di
depan layar.

## 3. Dokumen akhir

`docs/ROADMAP.md` menerima entri Tahap 46 dan **status di baris 3 sudah
diperbaiki di Tahap 45** — ia berbunyi "belum dieksekusi" selama empat puluh
lima tahap.

Yang **tidak** diklaim selesai: `MOTION-SPEC.md`, `DESIGN-SYSTEM.md` dan
`TEARDOWN.md` diperbarui oleh tahap yang mengubahnya (42 menulis §0, 43
menulis di mana VARIANCE dibelanjakan, 45 menulis vonis warna). Tahap ini
tidak menulis ulang ketiganya sebagai ritual penutup: sebuah dokumen yang
disentuh karena "ini tahap terakhir" adalah dokumen yang diubah tanpa sebab.

## 4. Hasil

### 4.1 Gerbang

```
bun run build            ✅
bun run build-storybook  ✅  (exit 0)
bun run check            ✅  oxlint · oxfmt · tsc · unit 410 lulus, 0 gagal ·
                             plugin anti-slop · manifest · assets
CI=true bun run test:e2e ✅  538 lulus, 0 gagal, 0 flaky, 15 dilewati (12,0 menit)
```

**530 → 538, dan kesembilan tambahannya terhitung habis.** Storybook a11y
menghitung per story, dan empat berkas story baru membawa sembilan:
`practice-filter` 3, `step-sequence` 2, `counter` 2, `next-practice` 2 —
**80 story → 89**. Delapan lulus dan satu masuk daftar dilewati, yang
menjelaskan mengapa yang lulus naik 8 sementara totalnya naik 9.

Nol gerbang dilonggarkan, nol plafon disentuh.

### 4.2 Satu gerbang baru, dan ia dibuktikan dua arah

`theatre` masuk ke `MARKERS` di `e2e/route-budget.e2e.ts`:

- **merah** dengan `import { createRafDriver }` yang sungguhan dipasang
  sementara: `/id loaded theatre without opting in`;
- **hijau** setelah dicabut: 9 rute lulus.

Itu satu-satunya bentuk yang membuat baris `MARKERS` berarti sesuatu. Dua
marker sebelumnya lulus uji "merah dulu" secara kebetulan — mereka merah
karena salah, bukan karena menemukan sesuatu, dan §2.1 mencatat keduanya.

### 4.3 Yang berubah dari rencana

- **Premis "25 komponen tanpa story" salah dua kali** — aturan tertulisnya
  tentang primitives (sudah dipenuhi), dan angkanya 24 bukan 25 setelah
  Tahap 45.
- **Empat story ditulis, dua puluh tidak**, dan yang tidak dikelompokkan
  dengan alasan per kelompok di §1.1 alih-alih dihitung sebagai utang.
- **Klaim rencana bahwa Theatre "dijaga `route-budget`" tidak benar** — tiga
  marker, nol di antaranya Theatre. Sekarang benar.
- **Mengarang kurva secara visual dengan Studio tidak dikerjakan**, dan
  alasannya bukan waktu: tidak ada browser interaktif di sini, dan nilai
  "hasil pengukuran" yang saya karang tanpanya adalah persis yang
  `CLAUDE.md` #19 larang. §2.3.

### 4.4 Yang tetap terbuka setelah tahap terakhir

Rencana ini berhenti di sini; ini yang tidak ditutup, dinamai supaya tidak
hilang:

- **404 tanpa JavaScript merender 28 karakter.** Dua perbaikan dicoba,
  diukur, dibatalkan (`TAHAP-38.md` §7.4). Masih terbuka.
- **Efek untuk composer postprocessing** — pipeline-nya bersih sejak Tahap
  45, pilihan efeknya editorial dan milik studio.
- **Kurva yang dikarang di Theatre Studio** — alatnya ada dan dijaga; ia
  butuh seseorang di depan layar.
- **Konten fixture.** Enam karya terbit semuanya fixture yang skripnya
  sendiri bilang untuk dihapus. Itu pilihan sah untuk situs yang belum
  diluncurkan, tapi ia harus pilihan, tercatat.
- **Kredensial Sanity belum dirotasi**, atas permintaan Anda, dan tetap jadi
  butir checklist pra-luncur di `docs/DEPLOYMENT.md`.
