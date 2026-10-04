# FORK — Arth tanpa lapisan yang menahan

> Dokumen pendiri branch `claude/arth-unbound`, dicabangkan dari
> `claude/arth-design` pada `22136de`.
>
> Ia **menggantikan** tata cara lama. Kalau dokumen ini bertabrakan dengan
> `CLAUDE.md`, `DIREKSI.md`, `DESIGN-SYSTEM.md` atau `ROADMAP.md`, yang berlaku
> dokumen ini.

---

## 0. Prinsip

Permintaan pemilik repo, apa adanya: hapus aturan yang menghalangi AI
berimajinasi; yang paling mengganggu **aturan anggaran**; jangan sentuh aset
yang dikurasi; bangun desainnya lebih baik.

> **Ukur, jangan veto.** Angka tetap dilaporkan supaya keputusan sadar. Tidak
> ada angka yang menolak sebuah gagasan sebelum gagasan itu terlihat.

> **Pembaca dan kejujuran tetap dijaga.** Kontras, reduced-motion, keyboard,
> jalur tanpa JavaScript, kebocoran GPU, header dan CSP, penjaga token, dan
> larangan mengarang konten tidak ikut dilepas — melepasnya bukan membebaskan
> imajinasi, melainkan mengirim barang rusak.

### 0.1 Tiga jawaban, untuk pembaca yang baru datang

Ditambahkan saat serah terima, supaya dokumen ini bisa dibaca tanpa membuka
kode. Rinciannya tetap di bagian yang dirujuk; tidak ada yang dihapus.

**Apa yang dicabut, dan kenapa** — aturan yang menolak gagasan sebelum
gagasan itu terlihat (rinciannya §1–§2):

| keluarga           | yang dicabut                                                                                                        | kenapa                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| kunci pembukuan    | `rule-coverage`, `stage-position`, drift papan skor & design-debt                                                   | memaku dokumen, bukan melindungi pembaca; menghapus satu aturan memerahkan `bun test` |
| anggaran           | plafon KB dan daftar-izin pustaka per rute, plafon aset, plafon momen, "≤1 pin per rute", band durasi               | angka yang menolak gagasan; kini **diukur dan dicetak**, bukan veto                   |
| penegakan gaya     | `token-rules`, `taste-rules`, `scale-rules`; larangan sintaks; 19 rule anti-slop turun dari `error`                 | kosakata gaya dan selera sebagai gerbang                                              |
| doktrin            | dial `DESIGN_VARIANCE`/`MOTION_INTENSITY`/`VISUAL_DENSITY`, larangan masonry, ritual skill wajib, spec-sebelum-kode | selera dari basis data pola menggantikan penilaian                                    |
| gerbang selera e2e | 10 spec dihapus, 17 disunting klausa-per-klausa                                                                     | mempolisikan bentuk komposisi, bukan cacat yang diderita pembaca                      |

**Apa yang dipertahankan** — dan di mana ia dijaga:

| perlindungan    | dijaga oleh                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| axe             | `route-sweep`, `storybook-a11y`, dan axe per fitur (`gallery-run`, `phone-menu`, `command-palette`, …)                                           |
| kontras terukur | `lib/styles/scripts/contrast.test.ts` (kini **lantai**, bukan baseline terpaku), `contrast-situ` (diukur di atas apa yang benar-benar tergambar) |
| reduced motion  | `motion-rules.test.ts` + klausa reduced-motion di tiap gerbang yang bergerak                                                                     |
| keyboard        | `keyboard-focus`, `controls`, `phone-menu`, `lightbox`, `command-palette`                                                                        |
| jalur tanpa JS  | `no-javascript`, `gallery-strip`, `phone-menu`, `catalogue-layout`                                                                               |
| pembersihan GPU | `material-layer` (buffer tak tumbuh), `canvas-survives-navigation`, `webgl-budget` (reduced motion mengunduh nol engine)                         |
| CSP / header    | `response-headers`                                                                                                                               |
| penjaga token   | `lib/env-guard.test.ts` — tak ada token ber-prefix `NEXT_PUBLIC_`                                                                                |
| kejujuran       | `CLAUDE.md` #19–#21; konten hanya dari CMS atau kamus `messages/*.json`; placeholder berlabel                                                    |

**Aset dan pustaka kurasi yang sengaja tidak disentuh** — asal dan
lisensi tiap satunya di `docs/PROVENANCE.md`, yang juga tidak disunting:

- `vault/magic/*` — Magic UI (MIT), vendored dengan transformasinya sendiri;
  pemakainya boleh berubah, berkasnya tidak (lihat veil di §3.2).
- `tools/oxlint/anti-slop/` — plugin MIT-vendored; hanya tingkat rule-nya
  di `oxlint.config.ts` yang diturunkan.
- `.claude/skills/` — taste-skill, ui-ux-pro-max: wewenangnya dicabut,
  isinya tidak.
- font dan lisensinya, `sanity.types.ts` dan tipe ter-generate, `public/`,
  seluruh dependencies.
- `lib/styles/css/tailwind.css` dan `root.css` ter-generate — hanya lewat
  `bun run setup:styles`.

Yang **boleh** disunting karena karya asli proyek ini: `vault/blocks/*`,
`vault/motion/*`, `vault/webgl/material-image/*` (§3.1).

---

## 1. Audit

Diaudit di empat sudut secara paralel, dengan pembacaan berkas. Hasil penuh
diringkas di sini; angkanya dari berkasnya sendiri.

```
gerbang e2e        54 spec  ->  10 murni mempolisikan desain
                                17 campuran (klausa selera di dalam spec
                                   yang memikul perlindungan pembaca)
                                27 murni pembaca/cacat
penegakan gaya     34 asersi ->  18 murni kosakata . 6 melindungi pembaca . 6 campuran
lint anti-slop     27 berkas ->  19 aktif, seluruhnya dari 15 baris oxlint.config.ts
doktrin            CLAUDE.md 21 aturan -> 9 murni correctness
                   plafon ekspresif justru DI LUAR CLAUDE.md
```

### 1.1 Yang paling mengganggu: keluarga anggaran

```
route-budget.e2e.ts   /en /id /work /work/<slug>   2100 KB   izin: three + gsap
                      /practice /studio /journal    900 KB   izin: gsap saja
check-assets.ts       video 2 MB . gambar 1 MB . 2400 px . ikon 48 KB / 512 px
DIREKSI §2.2          momen 12 per rute merek, 6 di /journal & /work/<slug>, 3 di <slug>
interaction-grammar   menghitung plafon momen itu
DIREKSI               pin ScrollTrigger <= 1 per rute
CLAUDE.md #3          "jangan 300 ms; default 400 ms"
```

Dua hal yang membuatnya lebih menjerat daripada terlihat:

1. **Daftar-izin pustaka lebih mengikat daripada plafon KB.** Memakai `three`
   di `/studio` memerahkan uji sampai daftarnya disunting.
2. **Angka yang dijaga bukan angka yang dialami pembaca.** Prefetch dimatikan
   saat mengukur; dengan prefetch hidup `/en/work` 914 KB, bukan 737 KB.

### 1.2 Yang mencabut selera sebagai masukan

`ROADMAP.md` §2.1 mewajibkan tujuh query `search.py` sebelum mendesain UI apa
pun, dan menyatakan tujuannya: hasilnya dicatat _"supaya keputusan desain bisa
ditelusuri, bukan diperdebatkan sebagai selera."_ Sebuah gagasan baru sah hanya
kalau basis data pola sudah memuatnya. Urutan seksi beranda diambil dari satu
baris `landing.csv`.

`DESIGN-SYSTEM.md` §0 menambahkan tiga dial yang menggerbangi **setiap**
keputusan: `DESIGN_VARIANCE 7`, `MOTION_INTENSITY 9`, `VISUAL_DENSITY 3` —
VARIANCE ditahan di bawah 8 **untuk mengecualikan masonry**, DENSITY ditahan di 3. Dokumennya sendiri mengakui angka itu _"intent, not measurement"_.

### 1.3 Kunci mekanis yang menentukan urutan kerja

`rule-coverage.test.ts` memaku `CLAUDE.md`: lebih dari 15 aturan, penomoran
1..n tanpa lubang, aturan pertama wajib memuat `cubic-bezier`, `uncovered()`
tepat `[7,18,19,20,21]`, dan blok ter-generate identik byte-per-byte.

**Akibatnya menghapus, menomori ulang, atau menukar urutan satu aturan
memerahkan `bun test`.** Jadi ia dibongkar lebih dulu.

### 1.4 Kontradiksi yang audit temukan di dalam repo sendiri

| di mana                                               | isinya                                                                                                                                                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `epic-sequence.e2e.ts:11`                             | menyatakan plafon momen per-halaman sudah digantikan aturan tumpang-tindih, _"jumlahnya tidak pernah jadi hal yang layak dilindungi"_ — plafonnya masih hidup di `interaction-grammar.e2e.ts:413` |
| `contrast.test.ts:9-13`                               | gagal ketika kontras **membaik** — baseline terpaku, bukan lantai                                                                                                                                 |
| `contrast.test.ts`                                    | hanya bisa melihat warna di lapisan token, jadi larangan hex adalah satu-satunya penjaga cakupannya                                                                                               |
| `rule-coverage.ts:84-87`                              | mengklaim band durasi #3 "tidak ditegakkan"; `vault/motion/tokens.test.ts:184-196` menegakkannya persis                                                                                           |
| `scale-rules.test.ts:49-70`                           | tangga spasi `DESIGN-SYSTEM.md` §3 dilanggar 192 dari 375 kali, jadi gerbangnya menegakkan "kelipatan 4" — dokumen dan gerbang tidak sepakat                                                      |
| `CLAUDE.md:131-160`                                   | tabelnya sendiri mengakui 5 dari 21 aturan tidak punya apa pun yang bisa menggagalkannya                                                                                                          |
| `anti-slop`                                           | dikecualikan dari aturannya sendiri: 2.114 baris tidak pernah dilint oleh 15 rule yang ia implementasikan                                                                                         |
| `vault/PROVENANCE-NOTE.md` vs `vault/magic/README.md` | yang pertama menyatakan tidak ada sumber pihak ketiga di `vault/`; yang kedua menyatakan seluruh `vault/magic` vendored                                                                           |

Baris terakhir menyangkut **lisensi**, jadi ia tidak saya sentuh. Ia
diserahkan ke pemilik repo.

> **Diputuskan dan diselesaikan (pemilik repo, saat membawa fork ke `main`).**
> `vault/PROVENANCE-NOTE.md` dikoreksi agar sesuai fakta; `vault/magic/*` dan
> `docs/PROVENANCE.md` tidak disunting. Syaratnya diperiksa lebih dulu:
> pemberitahuan lisensi Magic UI ada di `vault/magic/README.md` (MIT, Copyright
> (c) Magic UI, sumber dan cara verifikasinya), dengan catatan per komponen
> apakah kodenya disalin. Koreksi itu menemukan kontradiksi **kedua** yang
> audit tidak lihat: `vault/primitives/icon/` menyalin path data dari Phosphor
> Icons (MIT) — tercatat benar di header berkasnya dan di `docs/PROVENANCE.md`,
> salah hanya di catatan ini. Catatan kini memisahkan asal per direktori:
> karya asli (`blocks`, `motion`, `webgl`, `primitives/cursor`,
> `primitives/magnetic`), dan dua salinan MIT (`magic`, `primitives/icon`).
> Tiga berkas tanpa header provenance dan satu selisih hitungan glyph
> (header ikon menyebut delapan, berkasnya tujuh) dicatat di sana, tidak
> disunting. **Keduanya dibereskan sesudahnya**, di pekerjaan rapi-rapi
> pertama dari `main` (`claude/tidy-after-fork`): ketiga berkas kini membawa
> header, dan header ikon menyebut tujuh, sesuai `paths/`.

---

## 2. Rencana, dalam urutan yang bisa dijalankan

Urutannya bukan selera: langkah 1 membuka kunci yang membuat langkah 6 mungkin.

### Langkah 1 — lepas kunci pembukuan

| berkas                                                  | tindakan                                      |
| ------------------------------------------------------- | --------------------------------------------- |
| `lib/scripts/rule-coverage.ts`, `rule-coverage.test.ts` | hapus                                         |
| `lib/scripts/stage-position.test.ts`                    | hapus                                         |
| `lib/scripts/design-scoreboard.test.ts`                 | hapus — **pemindainya tinggal**               |
| `lib/scripts/design-debt.test.ts`                       | hapus — **pemindainya tinggal**               |
| `package.json` `check`                                  | `manifest:check` keluar; generatornya tinggal |

### Langkah 2 — keluarga anggaran

| berkas                           | tindakan                                                                                                          |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `e2e/route-budget.e2e.ts`        | berhenti jadi gerbang: mengukur KB dan pustaka tiap rute lalu **mencetaknya**. Plafon dan daftar-izin hilang      |
| `lib/scripts/check-assets.ts`    | plafon jadi laporan. **Satu** batas keras sangat tinggi disisakan untuk aset tunggal ekstrem, dan disebut terbuka |
| `e2e/interaction-grammar.e2e.ts` | asersi jumlah momen dan band 150–250 ms hilang; sisanya tinggal                                                   |
| `e2e/webgl-budget.e2e.ts`        | plafon byte hilang; _"reduced motion mengunduh nol engine"_ tinggal                                               |

> **Dua baris di tabel ini salah, dan dikoreksi saat langkah 5b.**
> `interaction-grammar`: langkah 2 hanya melepas plafon momen dan kewajiban
> menamai gerakan panjang — tes band 150–250 ms **masih hidup** sampai 5b
> menghapusnya. `webgl-budget`: tidak pernah ada plafon byte di sana.
> `SCAN_FLOOR_BYTES` adalah ambang pemindaian (respons di bawah 50 KB tidak
> diperiksa penanda engine-nya), bukan plafon; audit salah membacanya, dan
> berkas itu tidak disentuh.

### Langkah 3 — penegakan gaya

| berkas                                                                                 | tindakan                                                                                                             |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `lib/styles/scripts/token-rules.test.ts`, `taste-rules.test.ts`, `scale-rules.test.ts` | hapus                                                                                                                |
| `lib/styles/scripts/motion-rules.test.ts`                                              | pangkas: reduced-motion dan "hanya transform/opacity" tinggal                                                        |
| `lib/styles/scripts/vendor-rules.test.ts`                                              | pangkas: provenance header tinggal, larangan sintaks hilang                                                          |
| `lib/styles/scripts/setup-styles.test.ts`                                              | asersi sintaks warna (gerbang keenam yang tersembunyi) hilang                                                        |
| `lib/styles/scripts/contrast.test.ts`                                                  | **diubah, bukan dihapus**: dari baseline terpaku menjadi **lantai** — memperbaiki warna tidak boleh memerahkan build |
| `oxlint.config.ts`                                                                     | 19 rule anti-slop turun dari `error`. Kode plugin **tidak disentuh** — ia MIT-vendored                               |

### Langkah 4 — doktrin

| berkas                                       | tindakan                                                                                                                                                                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLAUDE.md`                                  | menyusut ke aturan correctness: `#5` reduced-motion, `#11` kontras, `#12` `minmax(0,1fr)`, `#15` pembuangan GPU, `#16`–`#18` lisensi, `#19`–`#21` kejujuran, plus satu RAF loop dan pembersihan. Blok ter-generate hilang |
| `DESIGN-SYSTEM.md` §0                        | tiga dial dan larangan masonry hilang                                                                                                                                                                                     |
| `DIREKSI.md` §2.2, §3.2b, §3.3               | plafon momen, wewenang papan skor, dan plafon anggaran hilang. Papan skor tetap **melaporkan**                                                                                                                            |
| `ROADMAP.md` §3.0, §2.1                      | spec-sebelum-kode dan ritual skill wajib hilang. Skill-nya sendiri **tinggal** — ia aset terkurasi, hanya wewenangnya dicabut                                                                                             |
| `AGENTS.md`, `.claude/agents/HOUSE-RULES.md` | diselaraskan                                                                                                                                                                                                              |
| `docs/stages/`                               | arsip; berhenti ditambahi                                                                                                                                                                                                 |

### Langkah 5 — gerbang selera e2e

**5a — dieksekusi.** Sepuluh spec yang murni mempolisikan bentuk **dihapus**,
bersama modul dan uji pendampingnya (14 berkas):
`composition-density`, `first-screen-void` (+ `first-screen-void.ts`,
`.test.ts`), `held-screen`, `grid-rows`, `project-spread`, `spatial-rhythm`,
`header-balance`, `taste-preflight` (termasuk larangan em-dash pada copy, +
`hero-stack.ts`, `.test.ts`), `reveal-coverage`, dan `epic-sequence`. Empat
entri daftar-izin `mobile` di `playwright.config.ts` ikut keluar.

> **Daftar ini dikoreksi dari rencana semula**, yang menyebut
> `reveal-coverage` sebagai "kuota per-rute" dan tidak menyebut `epic-sequence`
> sama sekali. Membaca asersinya mengoreksi keduanya. `reveal-coverage`
> seluruhnya satu mandat — setiap `h1`–`h3` wajib berada di dalam
> `[data-reveal]` — jadi tidak ada klausa pembaca untuk disisakan.
> `epic-sequence` menuntut tiap rute punya momen dan melarang dua momen berbagi
> rentang gulir: aturan komposisi, bukan cacat yang diderita pembaca. Klausa
> varian `exploratory-layer` pindah ke 5b, karena berkasnya memikul a11y.

**Satu klausa diselamatkan**: _label CTA yang terbungkus ke dua baris adalah
tombol rusak_ — kini `e2e/controls.e2e.ts`. Ia **tidak pernah bisa gagal** di
bentuk aslinya: `el.getClientRects()` mengembalikan satu kotak untuk kontrol
`inline-block`/flex, sebanyak apa pun baris labelnya. Versi baru menghitung
puncak baris per text node lewat `Range`, dengan toleransi 3 px. Dibuktikan
merah: CTA beranda dipaksa 48 px → `"See the work" (3 lines)`; sebelum dipaksa 0. Versi pertamanya sendiri keliru — chip filter katalog (label di atas angka,
44 px) terbaca "3 baris" — dan itu dikoreksi sebelum di-commit. `runs one theme`
**tidak** diselamatkan: tema yang berganti di tengah gulir adalah teknik, dan
kontrasnya tetap diukur `contrast-situ`.

Komentar yang masih menyebut gerbang terhapus sebagai penegak aktif dikoreksi
di tempat (28 berkas kode dan dokumen). Yang berupa **sejarah** — "gerbang X
merah di Tahap N" — dibiarkan, karena ia tetap benar.

**5b — dieksekusi.** Tujuh belas yang campuran **disunting
klausa-per-klausa**, karena menghapusnya utuh akan membuang axe,
reduced-motion, jalur tanpa JS dan deteksi kebocoran WebGL: `catalogue-layout`, `continuous-motion`, `exploratory-layer`,
`first-screen`, `gallery-run`, `interaction-grammar`, `media-edge`, `motion`,
`practice-capabilities`, `practice-page`, `project-detail`, `route-budget`,
`scale-continuity`, `site-reach`, `visual-substance`, `vocabulary`,
`command-palette`.

Per berkas, yang **keluar** — dan yang sengaja **tinggal**:

| berkas                  | keluar                                                                                | tinggal, karena melindungi pembaca                                                     |
| ----------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `catalogue-layout`      | satu span kolom di katalog; campuran span di beranda                                  | filter (juga tanpa JS), FLIP tanpa sisa, reduced motion                                |
| `command-palette`       | hierarki ukuran tipe + wajib mono; tiga kolom berjarak ≥100 px                        | keyboard, axe dengan dialog terbuka, keadaan kosong/gagal, tanpa JS                    |
| `continuous-motion`     | lantai ">3 frame berbeda" saat digulir; "tepat satu marquee"                          | prosa tak pernah ikut transform gulir; strip berhenti di reduced motion                |
| `exploratory-layer`     | baris tak boleh sejajar; drift kolom 0,5–60 px                                        | kartu tak pernah menutupi kartu; kursor tak membawa info eksklusif; ikon bernama       |
| `first-screen`          | item pertama wajib di atas 85% viewport                                               | item yang **ada di layar** tak boleh tertahan `opacity: 0` menunggu gulir              |
| `gallery-run`           | semua plat selebar satu trek                                                          | pin punya jarak tempuh, plat terlihat, reduced motion, axe                             |
| `media-edge`            | "maks dua lebar"; trek mengikuti rasio (+ `track-contract.ts` dan ujinya dihapus)     | gambar mengisi kotaknya; sitemap tak mendaftar redirect                                |
| `motion`                | h1 wajib split per baris di enam rute; pin wajib >1 layar                             | h1 yang di-split tetap bernama (kini dicek di semua h1); indeks melaporkan langkahnya  |
| `practice-capabilities` | pin wajib >1 layar                                                                    | satu yang memimpin, set per praktik, reduced motion + tingginya, axe                   |
| `practice-page`         | wajib `[data-practice-statement]` dan `[data-next-practice]`                          | 200, h1, filter menyempit, satu URL kanonik                                            |
| `project-detail`        | daftar fakta wajib memotong lipatan 1280×800                                          | 404, axe, sitemap, locale, spine                                                       |
| `scale-continuity`      | plafon per nilai di 2560 px; jangkar desain dipaku (h1 120 px)                        | lantai 11 px; tanpa tebing saat viewport tumbuh                                        |
| `site-reach`            | tiap rute wajib menaut katalog + tiap praktik; ≥3 tautan lanjut; tujuan header dipaku | header bukan jalan buntu, satu `aria-current`, 404, redirect tebakan, SEO, path Studio |
| `visual-substance`      | tangga amplitudo shader; tiap permukaan wajib bergambar; gutter dua sisi → satu sisi  | gutter (tak mulai di kiri header), aksen tak mengurangi, footer terbaca, alt unik      |
| `vocabulary`            | larangan 13 kata di halaman manusia                                                   | larangan yang sama di `/llms.txt`, sitemap, JSON-LD                                    |
| `interaction-grammar`   | daftar kata benda per rute; band 150–250 ms; tekan wajib ber-transition `transform`   | tekan dijawab, INTENT dari keyboard, reduced motion; momen dicetak                     |
| `route-budget`          | (langkah 2)                                                                           | duplikasi chunk                                                                        |

Sapuan ulang sesudahnya menemukan **tiga pin desain di luar daftar audit**,
dan ketiganya ikut keluar: bar baca wajib `<4 px` (`reading-progress`),
kekuatan grain wajib `sd <12` (`visual-substance`), dan tombol tutup palette
wajib tersembunyi `≤2 px` (`palette-touch`). Klausa pembaca di sebelahnya
tinggal: bar tidak menelan klik, tombol tutup tetap ada untuk pembaca layar.

Yang **sengaja tetap** walau berbentuk angka: `entrance` LCP 2,5 s (ambang
"baik" Core Web Vitals — waktu tunggu pembaca, bukan selera) dan deteksi
tirai macet 10 s.

### Tidak disentuh sama sekali

> **Koreksi, dicatat terbuka:** judul ini tidak sepenuhnya benar untuk
> `vault/`. Fork mengubah **komentar** di sana — direktif `oxlint-disable` yang
> jadi mati ketika rule-nya dimatikan (langkah 3), dan komentar yang menunjuk
> gerbang terhapus (langkah 5). Kode, props, perilaku, dan header provenance
> `vault/` tidak disentuh.
>
> **Dan satu dari komentar itu dikembalikan saat serah terima.** Pemeriksaan
> `git diff 22136de -- vault/magic tools/oxlint/anti-slop .claude/skills public`
> tidak kosong: langkah 5a menyunting komentar di
> `vault/magic/noise-texture/index.tsx` (ia menyebut `token-rules.test.ts`,
> yang fork hapus). `vault/magic/` adalah aset kurasi, jadi berkas itu
> dikembalikan ke byte vendored-nya; komentar yang menyebut uji terhapus
> adalah sejarah yang tak merugikan, berkas kurasi yang disunting melanggar
> batas. Pemeriksaan itu kini kosong.

`vault/` dan header provenance-nya, `tools/oxlint/anti-slop/` (MIT-vendored),
`.claude/skills/` (taste-skill, ui-ux-pro-max — wewenangnya dicabut, isinya
tidak), font dan lisensinya, `docs/PROVENANCE.md`, `sanity.types.ts` dan tipe
ter-generate, `public/`, seluruh dependencies.

---

## 3. Sesudahnya: desainnya

Menghapus plafon bukan tujuan, ia prasyarat. Yang terbuka begitu anggaran
hilang, dan selama ini tertutup oleh daftar bukan oleh desain:

- **`three` boleh dipakai di rute mana pun**, bukan hanya empat yang
  mendaftarkannya. `/studio` dan `/practice/<v>` tertutup oleh daftar-izin.
- **Momen tidak dibatasi 12 per rute, pin tidak dibatasi satu.** Papan skor
  menyebut 13 momen di seluruh situs; itu lantai.
- **Masonry tidak lagi dilarang**, dan `VISUAL_DENSITY` tidak lagi ditahan di 3.
- **Aset boleh melewati 1 MB** ketika sebuah gagasan menuntutnya.

Apa yang dibangun ditulis saat gagasannya ada — menjadwalkannya di muka justru
salah satu tata cara yang fork ini lepas.

### 3.1 Batas yang dipegang saat mendesain

Pekerjaan desain menyunting blok **milik proyek ini sendiri** —
`vault/blocks/*` dan `vault/motion/*` yang header provenance-nya berbunyi
_"original work for this project"_. Itulah situsnya; tidak ada cara membangun
desain yang lebih baik tanpa menyentuhnya. Yang **tetap tidak disentuh** adalah
aset kurasi pihak ketiga: `vault/magic/*` (Magic UI, MIT), `tools/oxlint/anti-slop/`,
`.claude/skills/`, font, dan dependencies. Konten tetap tidak dikarang: yang
ditampilkan berasal dari CMS atau kamus yang sudah ada.

### 3.2 Yang dibangun

**Beranda — Passage menjadi reel karya.** Dilihat frame demi frame di
1440×900, Passage Tahap 49 adalah 2,5 layar gulir berisi layar gelap dan satu
pita tick. Grid yang menjadi seluruh narasinya diposisikan `inset: 0` di dalam
stage setinggi judul, jadi hanya ±100px yang pernah tergambar. Sesudah pin
lepas, kartu pertama datang 500px kemudian.

Kini: grid studio membentang di seluruh layar ter-pin; sampul keempat karya
(dari CMS) disapu naik satu per satu ke dalam bingkai sementara gambar di
dalamnya bergerak berlawanan dan mengendap dari `scale 1.2`; indeks `01–04` dan
keterangan (judul + fakta) bergulir seirama; lalu judul seksi naik dan pin
lepas **langsung** ke grid karya yang sama. Reel `aria-hidden` dan tanpa
target fokus — setiap plat adalah duplikat kartu yang menyusul, yang membawa
tautan dan alt aslinya. Tanpa JS ia diam di plat pertama; di reduced motion ia
tidak digambar dan Passage hanya setinggi judulnya.

Dua cacat tertangkap dengan melihat, bukan dengan gerbang: build pertama
menampilkan sampul pertama di keempat indeks (transform CSS resting dibaca GSAP
sebagai `y` piksel, dan tween `yPercent` menumpuk di atasnya), dan di ponsel
sampul landscape dimuat 390px lalu ditarik ke ±630px (`sizes` mengikuti
viewport, bukan bingkai potret).

**`/studio` dan halaman proyek — `step-sequence` memakai lebarnya.** Tiap
langkah dulu judul 36px + tiga baris isi dalam satu kolom: sepertiga kanan dan
sebagian besar 62svh-nya kosong. Kini nomor, judul berskala display, dan isi
`p-big` di kolom kanan, sebaris dengan judulnya.

**`/practice/<v>` — pernyataan kapabilitas berskala display.** Dua atau tiga
kata dalam 46svh; kini lead/recede-nya adalah gerak tipografi selebar layar.

**Beranda — alamat email selebar layar.** Satu-satunya aksi konversi situs
agensi ini duduk di `h2`, sepertiga lebar, dengan sisa baris kosong. Kini ia
membentang dari tepi ke tepi, dan ukurannya **dihitung** dari jumlah
karakternya (`100cqi / (chars × 0.58)`, dari 0,55em/karakter yang terukur)
supaya tetap satu baris — label CTA yang terbungkus adalah tombol rusak
(`e2e/controls.e2e.ts`). Terukur satu baris tanpa luapan di 390, 800, 1440 dan
2560px, mengisi 94% wadahnya.

**`/work` dan beranda (desktop, WebGL) — plat material kembali di dalam
bingkainya, dengan parallax dan hover.** Ditemukan oleh workflow kritik desain
(`fork-design-critique`, usulan peringkat 1) dan dilihat sendiri di layar:
mesh diukur dari pembungkusnya sendiri, yang berada di dalam lapisan parallax —
lebih tinggi dari bingkai dan tertranslasi — jadi plat diskalakan ke lapisan
itu, dibekukan di offset saat diukur, dan tak terpotong apa pun. Plat meluap
40–90px melewati bingkai dan duduk **di bawah keterangannya sendiri**. Dan
karena gambar DOM disembunyikan selama material hidup, parallax kartu dan
`:hover`-nya menggerakkan sesuatu yang tak terlihat siapa pun: di desktop,
sampul tidak punya kedalaman dan tidak menjawab hover.

Kini mesh diukur terhadap bingkai (`[data-plate-frame]`, `ignoreTransform`),
dan parallax serta INTENT digambar di shader dengan geometri yang sama dengan
lapisan DOM. Gerbang baru `e2e/material-frame.e2e.ts` memotret strip tipis di
luar bingkai dengan dan tanpa kanvas — dibuktikan merah di build lama (46,4
lawan 14,4) setelah versi pertamanya merah **karena alasan yang salah** (ia
mencari penanda yang baru ditambahkan perbaikannya sendiri). Arah parallax
terukur sama dengan DOM (horizon −2px mesh, −5px DOM untuk 200px gulir;
besarnya identik menurut penurunan, selisihnya derau drift ambien). Hover dan
fokus keyboard mengubah plat 5–6× di atas derau diam.

**`/work`, `/studio`, `/journal`, `/practice/<v>` — papan nama.** Keempatnya
membuka dengan komposisi yang sama (eyebrow mono, satu kata `h1` di sepertiga
kiri, udara di sekitarnya) — satu templat diisi empat kali (usulan peringkat 2).
Nama kini di-_fit_ ke wadahnya dengan alat email kontak yang sama:
`100cqi / (karakter × 0,72)`, dibatasi `34svh` (`28svh` di `/work` supaya kartu
pertama tetap di layar pertama), dan tak pernah lebih kecil dari kurva `h1`.
0,72 adalah lebar per karakter **terlebar yang terukur** di antara semua string
papan nama di kedua bahasa ("Work" 0,707 … "Konsultasi" 0,523), jadi tak ada
nama yang meluap. Terukur: 48 dari 48 papan nama satu baris, tanpa luapan, di
6 rute × 2 bahasa × 1440/1280/390/320; "Studio" 306px di 1440 mengisi rongga
yang dulu kosong. Instrumen pertama salah — ia menghitung div baris SplitText
sebagai baris kedua — dan dikoreksi sebelum hasilnya dipercaya.

Menyertainya: garis reveal −25% → −8% (`use-reveal.ts`), karena konten yang
diam di seperempat bawah layar tertahan di `opacity: 0` sampai pembaca
menggulir — dan garis 75% itulah yang membatasi tinggi masthead; chip filter
2×2 di ponsel (3 + 1 menyisakan "Commission" sendirian); judul kartu pada satu
kurva kontinu 20→30px, bukan `p-big` 16px di ponsel — usulan kritikus untuk
h3 hanya di ponsel ditolak karena menciptakan tebing turun di 800px; dan eyebrow
"Catalogue", satu-satunya yang bertinta penuh, kini bersuara sama dengan yang
lain.

**Prosa di ukuran baca** (usulan peringkat 3). Token `p` 12/14px → 16/18px
dengan line-height 150/145% (tetap ≤ `p-big`, jadi urutan keduanya bertahan);
`RichText` mendapat `paragraphClassName`, dan catatan studi kasus serta
pernyataan beranda memakai `p-big`; kelas `h4`–`h6` yang ternyata tidak ada
di skala dipetakan ke `h3`. Di halaman proyek bersampul potret, **catatan
mengisi kolom yang dikosongkan fakta** — rongga 487px yang Tahap 66 tolak isi
dengan spasi kini diisi isi — dan satu fungsi `coverSpanOf` (modul murni,
karena hero `'use client'` sementara halaman server) memutuskan untuk keduanya,
jadi catatan dirender tepat sekali. Di artikel journal, paragraf pertama naik
dari ±2300px ke 605px: esai enam kolom, gambar pembuka di sampingnya.

Dua cacat saya sendiri, tertangkap dengan melihat, bukan oleh gerbang: grid
artikel pertama hanya menempatkan empat dari lima anaknya — breadcrumbs
terjepit di satu kolom dan judul terdorong ke bawah esai; dan gambar _sticky_,
dibatasi seluruh artikel (bukan area grid-nya seperti yang saya kira), menutupi
tautan "Next entry". Keduanya diperbaiki (baris eksplisit; wadah `.reading`
sendiri untuk gambar dan esai) dan diukur ulang: tanpa tumpang tindih di tiga
posisi gulir, dua ukuran layar.

**Satu penutup di setiap rute** (usulan peringkat 4). Setiap halaman berakhir
dengan dua garis tipis dan ±97px kosong di antaranya (border dan padding atas
footer menumpuk di atas garis strip wordmark); kini garis wordmark satu-satunya.
Strip itu sendiri tak pernah penuh — `repeat={4}` meninggalkan 210–480px kosong;
ia butuh `ceil(strip/salinan) + 1` salinan (7 di 2560px), jadi 8, **terukur penuh
pada offset terburuk di 390/800/1440/1920/2560px** (probe pertamanya salah baca
struktur DOM Marquee dan melaporkan "1 salinan" — dikoreksi sebelum dipercaya).
Tautan lanjut kini berskala display: sampul proyek berikutnya tujuh kolom 3:2
dengan nama 120px yang dibatasi supaya kata terpanjangnya muat (bukan
`overflow-wrap: anywhere`, yang akan memotong "Pelabuhan" di tengah kata);
"next practice" `h1`; journal memakai komponen yang sama pada `h2`, markup
lokalnya dibuang. Footer di ponsel: dua kolom, target sentuh 44px — email
sempat terukur 36px dan diperbaiki — dan alamat di-_fit_ satu baris.

**Galeri ter-pin sebagai film strip, dan terbaca tanpa JavaScript** (usulan
peringkat 5). Trek memberi setiap plat satu lebar (34vw), jadi tingginya
mengikuti gambar: di `/en/work/pusat-beban` 1440×900 tepi bawahnya berakhir di
765/612/388/504px dan sepertiga bawah layar ter-pin kosong. Kini di desktop
semua plat berbagi **satu tinggi** dan lebarnya mengikuti rasionya sendiri
(`Horizontal` menerima `ratios`): terukur 421/550/998/702 × 562px, satu garis
atas, satu garis bawah, satu garis keterangan `01 / 04`, 11,8% layar kosong di
bawah. Tingginya yang lebih kecil dari dua anggaran — layar di bawah header,
atau yang membuat plat **terlebar** mengambil 86% bingkai (`STRIP_SHARE`,
satu angka yang juga dibaca `sizes`). Fokus keyboard tetap membawa tiap plat
utuh ke dalam bingkai, yang selebar 998px pun. Di ponsel satu tinggi bersama
ditolak dengan angka: sebuah 16:9 dalam set akan menahan **semua** plat di
173px pada layar 390×844 — lebih kecil dari plat yang digantikannya. Ponsel
menampilkan satu plat sekaligus, jadi ia tetap satu lebar, dan plat kini duduk
di satu garis tengah pada bagian layar yang terlihat alih-alih menggantung dari
puncak plat tertinggi.

Tanpa JavaScript, rencananya menyebut satu cacat dan melihat menemukan dua lagi.
Yang disebut: kotak tetap `100svh` dengan `overflow: clip`, jadi plat 3–4
(desktop) dan 2–4 (ponsel) berada di luar jangkauan apa pun — kini
`<noscript><style>` mengulang pembukaan trek reduced-motion, idiom yang sudah
dipakai `command` dan `curtain`. Yang ditemukan: **pembukaan itu sendiri tak
pernah membuka** — trek sebagai item flex menyusut ke isinya; diukur di katalog
yang dibangun sebelum perubahan ini, trek 208px di kotak 1430px, enam plat
bertumpuk selebar 176px. Pembaca reduced-motion selama ini mendapat satu kolom
sempit. Kini keduanya mendapat **baris berjustifikasi**: tiap baris satu
tinggi, lebar dari rasio, tak ada baris lebih tinggi dari layar, satu plat per
baris di ponsel — terukur dua baris penuh (482+630 dan 653+459). Dan yang kedua:
**setiap gambar tertutup veil mosaik** — 24 ubin opak per plat, karena ubin
hanya larut saat `useReveal` menandai plat `visible`, dan tanpa skrip tak ada
yang melakukannya. Plat lulus cek "terlihat" sambil tidak menampilkan apa pun.
Perbaikan pertama saya mengikat veil ke atribut reveal
(`.pixels:not([data-reveal] *)`), dan review menangkap harganya bagi pembaca
**yang** memakai skrip: atribut itu ditulis saat hidrasi, jadi halaman hasil
server menampilkan gambar lalu veil muncul kembali di atasnya, opak dan tanpa
transisi, setiap kali muat ulang memulihkan posisi gulir. Kini aturannya
`<noscript>` — hanya menjangkau halaman yang tak akan disentuh skrip — di tiga
pemakai (`project-gallery`, `next-project`, `studio-note`), bukan di
`vault/magic/` yang tetap dikurasi.

Strip hanya menyala bila setidaknya satu bentuk diketahui: tanpa satu pun,
tak ada yang perlu disamakan, dan story `Run` (gambar tanpa aset) menjadi
persegi 531px di tempat satu lebar memberi 435 — `gallery-run.e2e.ts`
menangkapnya sebagai plat keempat yang tak pernah tiba.

Gerbang baru `e2e/gallery-strip.e2e.ts` di kedua proyek Playwright: satu
tinggi/garis bawah/garis keterangan dan plat terlebar muat bingkai di desktop,
satu garis tengah di ponsel, dan dengan skrip mati maupun reduced motion tiap
plat punya kotak, tak terpotong, tak transparan, tak tertutup — dan baris
bukaannya selebar bingkai, satu tinggi per baris, satu baris mengisi garisnya.
Angka 173px di ponsel diukur dengan memaksakan aturan strip di 390×844
(130/170/308/216 × 173, lawan 304px lebar yang dikirim). Semuanya dibuktikan merah di build
lama — kecuali reduced motion yang memang sudah terbuka — dan satu instrumen
salah dulu: garis tengah ponsel **lulus** di layout lama karena `stretch`
membuat setiap `<li>` setinggi yang tertinggi, jadi ia kini membaca figure di
dalamnya. `RUN_WORK` diekspor sejak Tahap 82 dan tak dipakai satu gerbang pun;
kini ia juga dikunjungi `image-resolution`, karena `sizes` plat strip ditulis
per plat.

**Menu ponsel — kata besar, dan bekerja tanpa JavaScript** (usulan yang
ditunda nomor 9, "kandidat terkuat berikutnya"). MENU adalah toggle state
React di atas dropdown tiga tautan mono 11px; tanpa skrip tombolnya tak
berbuat apa-apa dan nav tetap `display: none`, jadi header ponsel tidak
membawa satu pun tautan rute. Kini **nav itu sendiri** adalah
`popover="auto"` dan MENU `popovertarget`-nya: peramban yang membuka, menutup
dengan Escape atau ketukan di luar, dan mengembalikan fokus ke tombol — tanpa
skrip. Di desktop elemen yang sama tetap baris header; di ponsel ia sheet yang
mulai **di bawah** bar, jadi header tetap di tempatnya dan MENU (kini
"Close"/"Tutup") tetap jalan keluarnya. Isinya tiga rute pada ukuran display
yang di-_fit_ ke label terpanjang dalam bahasanya (71px "Journal", 83px
"Jurnal" di 390px; baris ketuk 76px); halaman yang sedang dibuka bertinta
penuh **dan bergaris bawah**. MENU pindah ke tepi kanan di markup, jadi urutan
fokus sama dengan urutan di layar dan `order: 1` yang menambalnya dibuang.

**Versi pertamanya salah bentuk, dan itu dikatakan.** Ia merender nav
**kedua** khusus sheet, berisi rute plus tiga tautan praktik. Suite penuh
merah di sana karena desainnya, bukan karena flaky: salinan tersembunyi setiap
tautan ada di halaman desktop, dan `interaction-grammar`, `journey`, `motion`
dan `navigation-landing` masing-masing mengambil "tautan pertama ke …" atau
"setiap `[data-press]`" yang ternyata tak terlihat siapa pun; review juga
menemukan dua `aria-current` di header (`site-reach`). Jawabannya satu elemen,
bukan menyunting lima gerbang. Tautan praktik keluar dari menu karena alasan
yang `ROUTE_LINKS` sudah tulis: nav ini menjawab "halaman apa yang situs ini
punya", dan indeks footer memuat praktik di setiap halaman. Email studio dari
usulan juga **tidak** dimasukkan: ia placeholder berlabel, dan permukaan kedua
akan menyebarkannya.

Yang ditambahkan skrip, masing-masing dari review: fokus yang meninggalkan
sheet menutupnya (Tab melewati tautan terakhir dulu mendarat di konten di
bawah sheet yang opak — WCAG 2.4.11); ⌘K menutup popover apa pun sebelum
palette dibuka (lapisan atas mengecat di atas `z-index` mana pun, jadi palette
terbuka **di bawah** sheet dengan fokus terkunci di kolom yang tak terlihat);
tautan yang bernavigasi menutupnya, karena tiap halaman merender header-nya
sendiri dan Next menyimpan halaman sebelumnya di `<Activity>` tersembunyi —
tanpa itu, Back menampilkan halaman itu dengan sheet masih terbuka; label
"Close" dibaca dari elemen lewat `useSyncExternalStore`, jadi ketukan sebelum
hidrasi pun tercermin; melintasi 800px menutupnya; dan peramban tanpa
`popover` mendapat toggle dengan `aria-expanded` dan Escape. Halaman di
belakang ditahan diam lewat `html:has(#header-nav:popover-open)` — juga
tanpa skrip — karena `overscroll-behavior` tak berbuat apa-apa pada sheet
yang isinya tak meluap.

Gerbang baru `e2e/phone-menu.e2e.ts` menemukan menu seperti pembaca
menemukannya — navigasi terlihat bernama "Primary" — setelah versi pertamanya
merah di build lama **karena alasan yang salah** (id sheet yang baru belum
ada). Satu tes desktop menjaga bentuk yang benar: satu nav, tak ada pressable
tersembunyi, paling banyak satu `aria-current`. Dua perilaku harness dicatat:
tanpa skrip, pemeriksaan "stabil" Playwright tidak selesai pada tautan yang
masih naik, dan palette punya entrance sendiri — keduanya ditunggu, bukan
dilawan, dan cacatnya tetap membuat tes merah karena waktu habis.

**Ditunda, dengan alasan:** morph sampul dari proyek ke proyek berikutnya.
Memberi sampul "berikutnya: C" nama transisi C berarti halaman proyek ke
katalog membentuk **dua** pasangan morph (hero B ↔ kartu B, dan C ↔ kartu C),
padahal satu pasangan per navigasi adalah aturan yang dipertahankan — dan
gerbangnya hanya menguji arah katalog→proyek, jadi ia tak akan menangkapnya.
Yang benar adalah mempersenjatai nama itu hanya saat tautan ditekan (seperti
`released` di kartu), dengan uji navigasi mundur di browser; itu pekerjaan
tersendiri, bukan tambahan diam-diam di sini.

**`/work` — bingkai katalog, dan gerak tumpuan.** Di bawah grid, katalog
tanpa filter kini memuat tabel praktik × tahun. Setiap karya duduk di baknya
(judul + klien, menaut ke proyeknya), dan kepala baris menaut ke halaman
praktiknya. Datanya `projectCardFields` yang sudah di-fetch; bak tanpa karya
dibiarkan kosong. Geraknya primitif baru `vault/motion/bearing`: tiang naik
dan balok membentang, lalu tiap karya mendarat di baloknya, menekan dengan
`--press-scale` milik §9, dan mengendap tanpa melewati titik diam (§9.3) —
CSS lewat `useReveal`, `data-epic="catalogue-frame"`, EN dan ID. **Belum
diverifikasi:** mata — lebar tabel di ponsel dan ritme geraknya belum pernah
dilihat. Build, e2e, dan CI hijau di checkpoint 1 (run 37046629768).

**`/studio` — ukuran karya, dan garis ukur (putaran 2).** Di atas strip "Work
it produced" kini ada ukuran seluruh karya: penugasan dan klien (ICU EN/ID),
direntangkan antara tahun pertama dan terakhir. Datanya `workIndexQuery` tanpa
filter, dipangkas ke `year` dan `client` di fungsi `'use cache'`. Desainnya
primitif baru `vault/motion/dimension`, garis ukur gambar teknik khusus CSS.
Garis saksi turun, lalu garis ukur memanjang dari tengah dan membawa tanda tiap
tahun. Primitif ini tanpa JS baru, dan `data-epic="work-measure"`. **Belum
diverifikasi:** mata. Build, e2e, dan CI hijau di checkpoint 1.

**`/journal/<slug>` — karya praktiknya, dan balok yang mendatar (putaran 3).**
Di bawah esai kini ada indeks karya praktik entri itu: judul yang menaut ke
studi kasus, ditambah baris meta yang sama dengan kartunya. Datanya query
sampul yang sudah ada, kini dikembalikan utuh, sehingga pelat di samping esai
akhirnya bernama. Desainnya primitif baru `vault/motion/level`, khusus CSS:
balok kantilever turun satu gutter di ujung bebasnya (`atan2` terhadap
panjangnya sendiri), lalu naik mendatar saat baris-baris tiba, hanya rotasi.
`data-epic="entry-work"`. **Belum diverifikasi:** mata. Build, e2e, dan CI hijau
di checkpoint 1.

**`/practice/<v>` — tulisan praktiknya, dan bekisting yang dibongkar (putaran 4).**
Di bawah karya kini ada entri jurnal yang diarsipkan di praktik itu: tanggal,
judul yang menaut ke entri, dan ringkasan indeks. Entri di-resolve persis
seperti `/journal` (`resolveJournalEntries` atas `journalEntriesQuery`), jadi
keduanya tak bisa berbeda. Desainnya primitif baru `vault/motion/formwork`,
khusus CSS: tiap baris tiba di dalam cetakan putus-putus, lalu cetakannya
dibongkar — memudar dan jatuh setengah gutter. Yang tersisa harus berdiri
sendiri. `data-epic="practice-writing"`. **Belum diverifikasi:** mata.
Build, e2e, dan CI hijau di checkpoint 2.

**`/work/<slug>` — tulisan praktiknya, terhadap tahun penugasan (putaran 5).** Di
`#onward`, sebelum proyek berikutnya, kini ada entri jurnal praktik karya itu,
disusun terhadap datum tahun penugasannya: yang ditulis sesudahnya di atas garis,
yang setahun atau sebelumnya di bawah. Pembacaan datanya kini dipakai bersama
halaman praktik (`lib/content/practice-writing`, dipindah dari putaran 4 tanpa
mengubah perilaku). Desainnya primitif baru `vault/motion/datum`, khusus CSS: garis
level diam, dan baris menjauhinya saat tiba. Tanpa `data-region`, jadi spine tetap.
`data-epic="engagement-writing"`. **Belum diverifikasi:** mata.
Build, e2e, dan CI hijau di checkpoint 2.

**`/` — tulisan terbaru di beranda, dan pelat yang dipaku (putaran 6).** Beranda
kini menampilkan entri jurnal terbaru di antara "How we work" dan kontak: tanggal,
praktik, judul yang menaut ke entri, ringkasan, dan tautan ke semua tulisan. Entri
"terbaru" di-resolve sama seperti di `/journal`. Modul `lib/content/practice-writing`
kini memakai satu pembaca untuk putaran 4–6. Desainnya primitif baru
`vault/motion/fixings`, khusus CSS: entri tiba sebagai pelat, lalu dipaku di keempat
sudutnya searah jarum jam. Tanpa JS klien baru; `data-epic="latest-writing"`.
**Belum diverifikasi:** mata. Checkpoint 2 menangkap lift reveal-nya yang
membawa tautan keluar dari bawah pointer; kini memudar di tempat (`72c0646`), lalu hijau.

**`/journal` — jurnal menurut praktik, dan turus yang dihitung (putaran 7).** Indeks
jurnal kini ditutup dengan tabel Tulisan | Praktik | Karya. Tiap praktik menaut ke
halamannya, sehingga indeks punya jalan lanjut. Hitungannya diambil dari data yang
sudah ada di halaman, entri dan karya untuk sampul, tanpa fetch baru (`tally.ts`, satu
tes). Desainnya primitif baru `vault/motion/tally`, khusus CSS: tiap hitungan berupa
coretan turus berkelompok lima, dihitung keluar dari praktik dalam satu ketukan
lambat. Hanya `opacity` yang berubah; baris memudar di tempat (pelajaran checkpoint
2). `data-epic="practice-tally"`. **Belum diverifikasi:** mata.

**`/studio` — bentuk penugasan, dan unting-unting (putaran 8).** Sesudah empat langkah
proses kini ada jadwal bentuk penugasan: tiap karya dengan nama penugasannya ditulis
apa adanya, misalnya "Retainer, six months". Karyanya menaut ke studi kasus, disertai
klien dan tahun. Datanya query yang sudah dibaca putaran 2, kini menyimpan juga judul,
slug, dan penugasan. Desainnya primitif baru `vault/motion/plumb`, satu-satunya yang
digerakkan scroll: CSS view timeline tanpa JS, dengan `@supports` sebagai pengaman.
Garis unting-unting turun di samping jadwal seiring jadwal naik ke layar.
`data-epic="engagement-shapes"`. **Belum diverifikasi:** mata (fix axe: `70f0d8f`).

**`/work/<slug>` — penugasan sepraktik, dan rangka yang diperkaku (putaran 9).** Di
`#onward`, sebelum tulisan, kini ada semua penugasan praktik karya itu, termasuk yang
ini. Penugasan ini tidak menaut, ditandai "this engagement" dan `aria-current`, sehingga
pembaca membandingkan bentuknya dengan yang lain. Datanya katalog yang sudah dimuat untuk
proyek berikutnya, tanpa query baru. Desainnya primitif baru `vault/motion/brace`: satu
petak per penugasan, tiba miring (`skewX`), lalu diperkaku diagonal hingga siku. Sudut
dan panjangnya dihitung dengan `atan2` dan `hypot`. Tanpa `data-region`.
`data-epic="practice-engagements"`. **Belum diverifikasi:** mata (fix axe: `1012b58`).

**`/work/<slug>` — "Bahas penugasan serupa".** Kepala `#onward` studi kasus kini
memuat satu tautan `mailto:` ke studio. Subjeknya menyebut kasusnya; isinya
menyebut kasus dan bentuk penugasannya, lalu tiga baris kosong: organisasi, yang
perlu diputuskan, tenggat. Alamatnya di-resolve seperti blok kontak beranda
(`lib/content/studio-contact.ts` → `resolveHomeContent`). Href dibangun di
`enquiry.ts` (satu tes). Tanpa form, JS, layanan, atau secret. Tautannya berdiri
sendiri di luar blok teks dan tidak bergerak. **Belum diverifikasi:** mata (CI
hijau, run 37101359980).

**`/work/<slug>` — sampul proyek berikutnya ikut pindah.** Menekan NextProject kini
memorf sampulnya menjadi hero proyek berikutnya, lewat kelas `morph` yang sama
dengan kartu → hero. Namanya dipasang saat ditekan, bukan saat render
(`vault/blocks/next-project/link.tsx`), dan dilepas saat blur atau saat pointer
batal atau keluar. Klik bermodifier tidak memasangnya. Karena itu proyek → katalog
tetap hanya membawa hero halaman ini, cacat yang dulu menahannya di _Ditunda_.
Diuji dua arah di `e2e/next-project-morph.e2e.ts`. **Belum diverifikasi:** mata (CI
hijau, run 37101359980).

**`/practice/<v>` — mulai penugasan, dalam kop gambar (siklus 2, putaran 1).** Halaman
praktik kini ditutup, sebelum praktik berikutnya, dengan kop gambar: praktik,
studio, dan alamatnya dalam sel bergaris, lalu tautan "Discuss an engagement in
{practice}" yang membuka surel berisi subjek dan brief praktik itu. Alamatnya dari
`lib/content/studio-contact` dan href-nya dari `enquiryHref`, keduanya dari
`claude/case-continuity`. Primitif barunya `vault/blocks/title-block`: diam, tanpa
gerak, sehingga tautannya tidak pernah bergeser. `data-epic="practice-enquiry"`.
**Belum diverifikasi:** mata. Build, e2e, dan CI hijau di checkpoint 1 siklus 2.

**`/journal/<slug>` — balasan untuk esai (siklus 2, putaran 2).** Tepat di bawah esai,
sebelum karya praktiknya, kini ada slip balasan: tepi berperforasi, label "Reply",
subjek surel yang akan terkirim ("Re: {judul}"), lalu tautan "Talk to the studio about
this" yang membuka surel berisi judul entri. Alamatnya dari `studio-contact`. Primitif
baru `vault/blocks/reply-slip`, konvensi slip balasan majalah: diam, tidak bergerak,
sejajar kolom esai di desktop. `data-epic="entry-reply"`. **Belum diverifikasi:**
mata. Build, e2e, dan CI hijau di checkpoint 1 siklus 2.

**`/work` — kunci bingkai katalog, dan sambungan (siklus 2, putaran 3).** Di bawah
bingkai praktik × tahun kini ada kuncinya: tiap praktik yang tampil di bingkai
beserta kalimat yang sudah dipakai situs untuk menjelaskannya
(`workIndex.<praktik>Intro`). Tidak ada teks baru selain judul "Key"/"Keterangan".
Primitif baru `vault/motion/splice`, khusus CSS: dua paruh batang dipasang dari
ujungnya masing-masing, bertemu di sambungan, lalu pelat dipasang. Istilah dan
artinya tidak bergerak; baris memudar di tempat. `data-epic="catalogue-key"`.
**Belum diverifikasi:** mata. Build, e2e, dan CI hijau di checkpoint 1 siklus 2.

**`/studio` — klaim praktik dengan karya buktinya (siklus 2, putaran 4).** Di pita
kapabilitas kepala halaman, di bawah apa yang dicakup tiap praktik, kini ada "Seen
in"/"Terlihat dalam": setiap karya terdaftar praktik itu, urut katalog, menaut ke studi
kasusnya beserta tahunnya. Datanya kueri katalog yang sudah dibaca halaman ini
(`casesByPractice`, satu tes); praktik tanpa karya tidak diberi baris. Primitif baru
`vault/motion/leader`, khusus CSS: garis turun dari catatan, berbelok ke karya pertama,
lalu titiknya mendarat. Pita kini memudar di tempat. `data-epic="capability-evidence"`.
**Belum diverifikasi:** mata. Build, e2e, dan CI hijau di checkpoint penutup siklus 2.

**`/` — alamat studio bisa disalin (sekali jalan).** Tautan `mailto:` di blok kontak tidak
membuka apa pun bagi pembaca webmail, dan tidak memberi tanda gagal. Kini di bawahnya ada
"Copy address"/"Salin alamat" (`vault/blocks/copy-address`): alamat yang sama, disalin,
dengan hasilnya di `role="status"`. Tanpa JS atau tanpa clipboard asinkron, tombol tidak
dirender; alamatnya tetap. Barisnya diposisikan agar alamat yang ditarik `Magnetic` tidak
menutupnya, dan blok kontak kini memudar di tempat. Diuji di `e2e/address-copy.e2e.ts`.
**Belum diverifikasi:** mata. Build, e2e, dan CI hijau (run 37113202080).

**`/` — stempel saat alamat tersalin (sekali jalan).** Setiap salinan yang berhasil kini
distempel: primitif baru `vault/motion/stamp`, khusus CSS, diputar sekali saat dipasang.
Bingkai bergaris turun setengah gutter ke kertas dengan `--ease-in-quart` dan berhenti mati
tanpa pantulan; katanya baru muncul saat bingkai menyentuh, jadi teks tidak pernah bergerak.
Total 350 ms. Salinan kedua menstempel lagi (`key` baru), dan stempel ada di `role="status"`
sehingga dibacakan. Reduced motion: stempel langsung ada. `data-epic="address-copy"`.
**Belum diverifikasi:** mata. Build, e2e, dan CI hijau (run 37113202080).

**404 — mungkin yang Anda cari (Orientasi, tahap 1).** Alamat mati jarang acak: slug
yang diketik dari ingatan, tautan di dek lama. Kini 404 mencocokkan alamat itu dengan
indeks pencarian yang sudah dipakai ⌘K (`/{locale}/search.json`) dan menawarkan sampai
tiga tujuan yang mirip ejaan slugnya atau sama kata judulnya (`suggest.ts`, satu tes).
Halaman umum tidak ditawarkan; tawaran Work/Studio/Journal sudah ada. Tanpa JS, tanpa
kecocokan, atau fetch gagal: tidak ada yang dirender. Diuji di `e2e/wayfinding.e2e.ts`.
**Belum diverifikasi:** mata (CI hijau, run 37125290502).

**404 — penunjuk arah (Orientasi, tahap 1).** Setiap set gambar membawa penunjuk utara,
agar pembaca yang tersesat di lembar bisa mengorientasikan diri. Di 404 jarumnya melakukan
itu secara harfiah (`vault/motion/north-arrow`): diam menunjuk tebakan terbaik, lalu
berputar ke saran yang dihover atau difokus. Satu sudut dihitung per hover/fokus
(`bearing.ts`, `atan2`, satu tes), jarum berputar lewat jalan terpendek, berhenti dengan
`--ease-out-expo` tanpa overshoot; hanya `transform`. Reduced motion: langsung menunjuk.
`data-epic="wayfinding"`. **Belum diverifikasi:** mata (CI hijau, run 37125290502).

**`/work` — bingkai yang bisa dijelajah (Orientasi, tahap 2).** Bingkai praktik × tahun
kini dibaca seperti grid gambar. Tombol panah berpindah antarkarya: kiri-kanan menyusuri
baris praktik, atas-bawah menuruni tahun, bay kosong dilewati (`navigate.ts`, satu tes);
Tab tetap mengunjungi semuanya. Karya yang di-hover atau difokus menandai tahunnya di tepi
atas bingkai. Pendengarnya didelegasikan pada tabel yang tetap dirender server
(`reader.tsx`); petunjuk tombol terhubung lewat `aria-describedby`.
**Belum diverifikasi:** mata (CI hijau, run 37125290502).

**`/work` — garis bidik (Orientasi, tahap 2).** Grid gambar dibaca dari tepinya: sebuah titik
adalah "baris C, kolom 4" karena ada garis dari tiap sumbu ke sana. Primitif baru
`vault/motion/crosshair` melakukan itu untuk karya yang di-hover atau difokus: satu garis rambut
menyusuri baris praktiknya dari tepi kiri bingkai, satu menuruni kolom tahunnya dari tepi atas,
dan keduanya meluncur ke karya berikutnya alih-alih melompat. Hanya `transform` dan
`opacity`, `--duration-fast`. Reduced motion: garis langsung di tempat.
`data-epic="frame-crosshair"`. **Belum diverifikasi:** mata (CI hijau, run 37125290502).

**`/work/<slug>` — tautan ke bagian (Orientasi, tahap 3).** Studi kasus dibaca lebih dari satu
orang sebelum ada yang memesan, dan yang ingin ditunjukkan ke rekan biasanya satu bagian.
Spine kini diakhiri "Copy section link"/"Salin tautan bagian" (`copy-link.tsx`): alamat
halaman ini plus bagian yang sedang dibaca (`#outcome`), dihitung saat ditekan, dikonfirmasi
stempel. `useClipboard` diekstrak dari `CopyAddress` dan dipakai keduanya. Di luar baris
spine, jadi baris tetap sama dengan region; hanya desktop. `data-epic="section-link"`.
**Belum diverifikasi:** mata (CI hijau, run 37125290502).

**`/work/<slug>` — tanda masuk (Orientasi, tahap 3).** Denah menandai pintu masuk dengan panah.
Pembaca yang tiba lewat tautan berbagian, yang disalin dan dikirim rekannya, kini mendapati
baris bagian itu di spine diberi panah masuk (`vault/motion/entry-arrow`, khusus CSS): meluncur
dari luar baris ke tepinya lalu tinggal, jadi "Anda masuk di sini" tetap terlihat saat ia
membaca terus. Bagian dibaca dari alamat saat hidrasi dan `hashchange`. Hanya `transform` dan
`opacity`; reduced motion: langsung ada. `data-epic="section-entry"`.
**Belum diverifikasi:** mata (CI hijau, run 37125290502).

**Header — ganti bahasa tanpa kehilangan tempat (Orientasi, tahap 4).** Pembaca di tengah
studi kasus yang beralih ke Bahasa Indonesia, sering untuk diteruskan ke rekan, dulu
mendarat kembali di atas. Kini pengalih bahasa membawa bagian yang sedang dibaca: bagian
terakhir yang atasnya sudah melewati garis baca 35% layar (`section.ts`, satu tes), dibuka
di bahasa lain pada id yang sama. `href` yang dirender tidak berubah, jadi tanpa JS, tab
baru, atau di puncak halaman, ia tetap tautan biasa. Diuji di `e2e/locale-place.e2e.ts`.
**Belum diverifikasi:** mata (CI hijau, run 37125290502).

**Header — geser lembar (Orientasi, tahap 4).** Ganti bahasa dulu satu-satunya navigasi tanpa
transisi sama sekali. Kini ia diumumkan sebagai intent `'sheet'` (`lib/motion/navigation-signal`),
dan panel `vault/motion/page-transition` menyeberang ke samping: masuk dari kanan, keluar ke
kiri, seperti lembar berikutnya dari satu set gambar. Halamannya sama, lembarnya lain. Pakai
keyframe, bukan transisi, karena panel parkir di bawah layar. Ketukannya sama dengan cover,
hanya `transform`; reduced motion: overlay tidak dirender. `data-epic="locale-sheet"`.
**Belum diverifikasi:** mata (CI hijau, run 37125290502).

**`/journal/<slug>` — esai yang rapi di kertas (Tata & Gerak, tahap 1).** Esai satu-satunya
halaman yang mungkin dicetak atau disimpan sebagai PDF untuk dibawa rapat. Lembar `print`
kini menyisakan esai saja: meta, judul, ringkasan, lalu teks satu kolom urut baca di lebar
kertas berapa pun. Header, footer, panel transisi, tirai, bilah baca, grain, dan kursor
disembunyikan; butir yang belum ter-reveal dicetak terlihat, karena printer tidak menggulir.
Diuji di `e2e/print-essay.e2e.ts` dan dilihat di tangkapan layar 390/1440.
**Belum diverifikasi:** mata (CI hijau, run 37177613961).

**Semua rute — tipografi seimbang (Tata & Gerak, tahap 1).** Judul yang terbungkus kini
seimbang (`text-wrap: balance` pada h1–h4, kecuali nameplate yang memang diukur memenuhi
barisnya): "Evaluation before / pipeline" di ponsel menjadi "Evaluation / before pipeline".
Jumlah baris tidak berubah, jadi tak ada yang bergeser. Paragraf dan ringkasan esai memakai
`pretty`, sehingga tidak berakhir dengan satu kata. Keduanya di dalam `@supports`; peramban
lama membungkus seperti biasa. Dilihat di tangkapan layar sebelum/sesudah 390 px.
**Belum diverifikasi:** mata (CI hijau, run 37177613961).

**`/journal/<slug>` — waktu baca dan sisanya (Tata & Gerak, tahap 2).** Meta esai kini
menyebut lamanya ("1 min read"/"1 menit baca"), dihitung dari isinya (`lib/content/reading-time`,
230 kata/menit, satu tes). Begitu esai dimulai dan header sudah lewat, label kecil di bawah
header kanan (`vault/blocks/reading-left`) menyebut sisanya ("4 min left"), dihitung ulang
tiap kali paragraf melewati garis baca lewat `IntersectionObserver`, dan hilang saat akhir
esai terlihat. Posisinya hasil cek ponsel: di pojok bawah ia menutupi baris berikutnya.
Diuji di `e2e/reading-time.e2e.ts`. **Belum diverifikasi:** mata (CI hijau, run 37177613961).

**Header — penanda rute meluncur (Tata & Gerak, tahap 2).** Rute yang sedang dibuka dulu
dibedakan oleh tinta saja, dan tinta itu terukur ±1,8:1 terhadap kata lain. Kini satu garis
rambut bertinta sama berdiri di bawahnya (`vault/motion/route-marker`). Tekan rute lain, dan
garis meluncur ke kata itu serta mengambil lebarnya sebelum halaman berganti. Ia hanya
meluncur saat ditekan: tiap halaman merender header-nya sendiri, dan luncuran saat tiba akan
terjadi di bawah panel transisi. Hanya `transform`; reduced motion: langsung di tempat; tanpa
JS tak ada garis, tinta tetap. Desktop saja, karena kata aktif di ponsel sudah bergaris bawah.
Diuji di `e2e/route-marker.e2e.ts`. **Belum diverifikasi:** mata (CI hijau, run 37177613961).

**`/work` — sampul di bingkai (Tata & Gerak, tahap 3).** Bingkai katalog membaca karya sebagai
tabel nama, sedangkan sampulnya satu layar di atas. Kini karya yang dihover atau difokus
menampilkan sampulnya di pelat 4:5 (`vault/motion/cover-preview`) di ujung kosong bay-nya.
Pelat meluncur bersama garis bidik dan gambarnya berganti silang. Ia ditambatkan ke karya,
bukan ke pointer, supaya keyboard dan pointer sama. Tak muncul kalau bay terlalu sempit,
dan tak pernah keluar dari bingkai. Sampul baru dimuat saat karya pertama kali disentuh.
Diuji di `e2e/cover-preview.e2e.ts`. **Belum diverifikasi:** mata (CI hijau, run 37177613961).

**Kartu karya — tanda potong (Tata & Gerak, tahap 3).** Saat kartu dihover atau difokus,
tanda potong lembar cetak (`vault/motion/crop-marks`) merapat ke keempat sudut pelatnya,
bergiliran searah jarum jam. Karya itu terbaca sebagai yang sedang dipotong dari lembar.
Tanda berada di luar pelat dan di luar elemen yang dipotret morph, jadi tidak ikut ke halaman
kasus. Panjangnya 9,2 px, di bawah celah tersempit antara pelat dan judul (10,24 px, di 800).
CSS saja, jadi berlaku tanpa JS; hanya `transform`/`opacity`; reduced motion: langsung tampil.
Diuji di `e2e/card-crop.e2e.ts`. **Belum diverifikasi:** mata (CI hijau, run 37177613961).

**`/work/<slug>` — fakta yang ikut (Tata & Gerak, tahap 4).** Di tengah halaman kasus
sepanjang 4,7 layar, tak ada yang menyebut karya mana yang sedang dibaca. Kini, begitu `h1`
hero keluar layar, spine desktop menyebut nama dan tahun kasus ("Arus Balik 2025") di tempat
labelnya. Label terangkat pergi saat nama naik masuk, di sel yang sama, jadi baris di bawahnya
tak bergeser. Dideteksi `IntersectionObserver` pada `h1`, jadi benar juga saat tiba di tengah
halaman. `aria-hidden` karena mengulang `h1`; tanpa JS label tetap. `data-epic="following-facts"`.
Diuji di `e2e/following-facts.e2e.ts`. **Belum diverifikasi:** mata (CI hijau, run 37177613961).

**`/work/<slug>` — spine satu baris di ponsel (Tata & Gerak, tahap 4).** Strip spine di ponsel
menempel di atas bacaan, jadi tiap baris tambahan menutupi satu baris kasus. Kini barisnya tak
pernah membungkus. Bila tak muat (kasus dengan bab dan hasil punya enam baris), strip bergeser
ke samping dan baris aktif dibawa ke tengah; yang bergulir hanya strip, bukan halaman. Baris aktif
ditandai garis header (`vault/motion/route-marker`, kini bisa mengikuti item aktif) yang meluncur
di tepi bawah strip; dorongan 4 px di ponsel dilepas karena membuat jarak antarkata timpang. Kini
keenam kasus muat satu baris bahkan di 320 px; geser dicek dengan strip dipersempit.
Diuji di `e2e/spine-strip.e2e.ts`. **Belum diverifikasi:** mata (CI hijau, run 37177613961).

**Halaman panjang — kembali ke atas (Tata & Gerak, tahap 5).** Beranda 13 layar dan kasus
hampir 5, tapi jalan pulang ke atas hanya roda gulir atau wordmark, yang meninggalkan halaman.
Kini chip kecil di pojok kanan bawah (`vault/blocks/back-to-top`) muncul setelah dua layar,
menggulir ke atas lewat Lenis (lompat di reduced motion), lalu memindah fokus ke awal `main`.
Ia tak dirender sebelum dua layar, jadi bukan perhentian ekstra bagi keyboard; letaknya setelah
footer, jadi urutan kontrol lain tak bergeser. Di ujung halaman tak menutupi teks (EN/ID, 390/1440).
Diuji di `e2e/back-to-top.e2e.ts`. **Belum diverifikasi:** mata (CI hijau, run 37177613961).

**Semua rute — kisi bawah (Tata & Gerak, tahap 5).** Situs ini berargumen bahwa struktur di
balik karya ikut dibeli klien, tapi kisi 12 kolom halamannya sendiri tak pernah terlihat. Kini
tombol "Show the grid"/"Tampilkan kisi" di kolofon footer (`aria-pressed`), atau tombol `g` di
luar kolom isian, menggambar kisi itu di atas halaman (`vault/motion/grid-underlay`): kolom
turun dari atas bergiliran `--stagger-items`. Geometrinya kisi halaman sendiri (`--columns`,
`--gap`, `--safe`; 4 kolom di ponsel). Status hanya untuk kunjungan, tanpa penyimpanan.
Diuji di `e2e/grid-underlay.e2e.ts`. **Belum diverifikasi:** mata (CI hijau, run 37177613961).

### 3.3 Gerbang kontras melihat lebih banyak — ditemukan dengan melihat

Chip "All" di `/work` tampil tanpa angka: angka hitungannya (`aria-hidden`)
dipaku ke tinta terang dan chip aktif berisi terang — **1,00:1**. Tidak ada
gerbang yang melihatnya, karena `contrast-situ` melewati semua teks
`aria-hidden` tanpa alasan tertulis. Pengecualian itu juga menyembunyikan
**setiap h1 yang di-split per baris** (SplitText menaruh glyph yang terlihat
dalam mask `aria-hidden`). Fork mencabutnya — gerbang pelindung pembaca yang
diperkuat, bukan dilonggarkan — dan dibuktikan merah pada angka chip itu.

Mencabutnya langsung membuka dua celah lain, dan keduanya ditutup:

- **Clip.** Keterangan reel yang sudah bergulir keluar mask terukur 4,28:1
  terhadap sampul di belakangnya — teks yang tak terlihat siapa pun. Kotak teks
  kini dipotong oleh setiap ancestor yang memotong overflow. Run yang terpotong
  habis **dihitung** dan dilaporkan, dan rute yang memotong lebih banyak
  daripada yang diukur dinyatakan rusak — supaya `overflow` di `body` kelak
  tidak menjadi cara teks lolos dari pengukuran. Hitungan pertamanya salah:
  irisan baris di tepi bawah viewport ikut terhitung "terpotong"; dipisahkan.
- **Opasitas.** Gerbang hanya membaca opasitas elemen itu sendiri, dan hanya
  untuk melewatinya. Kata ProgressText di 0,55 terukur ±15:1 padahal pembaca
  mendapat ±5:1; langkah yang meredup lewat induknya tidak pernah diredupkan.
  Kini opasitas efektif (hasil kali sampai akar) masuk ke rasio.

Penilaian keduanya dipindah ke fungsi murni di `e2e/contrast-situ.ts`
(`paintedBoxes`, `inkAlpha`) dengan uji unit bernilai hitung-tangan —
dibuktikan merah (7 gagal) dengan clip dan opasitas diabaikan.

### 3.4 Review adversarial — yang diperbaiki, dan yang sengaja tidak

Tiga peninjau baca-saja dan satu verifikator (workflow `fork-design-review`)
menemukan 25 hal; verifikator mengonfirmasi 2 cacat, menolak 2, sisanya risiko
atau nit. Diperbaiki:

- **Chip aktif di bawah fokus keyboard** jadi pil kosong (`:focus-visible`
  memberi tinta sewarna isian) — cacat lama, bukan dari fork. Juga transisi
  warna chip yang sempat terang-di-atas-terang.
- **Passage tanpa reel** masih mem-pin strip setinggi judul 2,5 layar — cacat
  saya. Kini tanpa reel, tanpa pin.
- `revertOnUpdate` pada pin; reel dibatasi 6 plat; bingkai pas di layar pendek;
  indeks dan keterangan tiba bersama bingkainya; `will-change` permanen dibuang;
  breakpoint `sizes` disamakan dengan tata letak; judul display tidak meluap.

Sengaja **tidak** diperbaiki, dengan alasannya:

- Clip dihitung lewat rantai induk DOM, bukan rantai containing block
  (`position: fixed` di dalam kotak ber-`overflow`) — tidak ada kasusnya di
  situs hari ini; dicatat di sini supaya yang pertama menulisnya tahu.
- Hanya `overflow` yang dimodelkan (bukan `clip-path`, `mask`, `contain`) —
  tidak ada teks di situs yang dipotong dengan cara itu hari ini.
- Logotip "Arth" (salinan marquee) kini ikut diukur AA meski WCAG
  membebaskan logotip — ia lulus, jadi pengecualian belum dibutuhkan.
- Lambat-muat sampul reel dan sedikit over-fetch di ponsel — tidak bisa
  diverifikasi tanpa jaringan nyata; bukan cacat yang teramati.
- Opasitas 0,7 langkah yang meredup belum pernah dipakai di tema terang;
  kalau kelak dipakai, gerbang kontras yang kini membaca opasitas akan
  menangkapnya.

**Review kedua — film strip** (workflow `review-gallery-strip`, tiga peninjau
baca-saja dan satu verifikator yang diminta membantah): 16 temuan, 8
terkonfirmasi (dua pasang duplikat), 8 ditolak dengan alasan tertulis.
Diperbaiki:

- **Veil muncul kembali di atas gambar yang sudah tergambar** bagi pembaca
  dengan skrip — cacat saya, dari perbaikan no-JS pertama. Kini `<noscript>`.
- **`sizes` hanya menggambarkan strip ter-pin**; baris bukaan (reduced motion,
  tanpa skrip) menggambar plat lebih lebar dari yang dinyatakan — 0,84–0,91
  piksel yang dibutuhkan dalam skenario peninjau. Kini `sizes` punya entri
  untuk ketiga tata letak, breakpoint-nya mencerminkan stylesheet (mobile
  default, desktop mulai `800px` — `799px` meninggalkan celah pecahan), dan
  setiap lebar dikali overscan parallax.
- **Gerbang buta pada dua hal**: plat tanpa kotak sama sekali lulus ketiga
  cek, dan kasus reduced motion hijau pada kolom sempit yang diganti fork
  ini. Kini keduanya diukur; asersi geometri dibuktikan merah dengan
  menyuntikkan kembali bukaan lama (trek 276px di bingkai 1027px).

Sengaja **tidak** diperbaiki di sini, dengan alasannya:

- **Plat galeri digambar 12% lebih lebar dari kotaknya** (lapisan parallax
  lebih tinggi dari bingkai, `object-fit: cover`), dan `sizes` grid serta
  `needed` di `image-resolution.e2e.ts` sama-sama membaca lebar elemen, bukan
  lebar yang digambar. Strip baru sudah memperhitungkannya; grid dan
  gerbangnya **tidak**, dan itu ada sebelum fork. Memperbaikinya mengubah
  byte di setiap halaman proyek dan ambang sebuah gerbang — pekerjaan
  tersendiri yang diukur, bukan tambahan diam-diam di sini.

**Review ketiga — menu ponsel** (tiga peninjau baca-saja: a11y/popover,
CSS/runtime, validitas gerbang; lalu verifikator yang diminta membantah).
Sesi berakhir saat verifikator berjalan, dan kode sudah ditulis ulang sebelum
ia bisa diulang, jadi yang ia periksa adalah **perbaikannya**, bukan temuan
aslinya: dari 21 temuan, 17 diperbaiki, 1 gugur karena desainnya berubah, 4
masih terbuka. Peninjau segar atas kode baru menambah 6. Yang terbuka dan yang
baru, semuanya diperbaiki sesudahnya:

- **Fokus di bawah sheet lewat jalur yang tak melewati sheet** — Shift+Tab
  dari MENU ke pencarian, tautan lompat-ke-konten. Kini `focusin` di dokumen
  menutup sheet, dan `main`/`footer` `inert` selama tertutup sheet — juga
  bagi kursor pembaca layar, yang dulu membaca halaman di bawahnya.
- **Tombol pencarian lewat keyboard** membuka palette di bawah sheet; hanya
  ⌘K yang sempat diperbaiki. Kini tombolnya juga memberi jalan.
- **Dua `#header-nav` dalam satu dokumen** sesudah navigasi klien, karena Next
  menyimpan halaman sebelumnya di `<Activity>` tersembunyi — diukur. MENU kini
  menunjuk nav-nya sendiri lewat `popoverTargetElement`; id tetap untuk halaman
  tanpa skrip, yang hanya pernah punya satu.
- **Fallback tanpa `popover`**: fokus kini dikembalikan ke MENU, ketukan di
  luar menutupnya.
- **Ukuran cadangan `12vw` tak pernah berlaku** — deklarasi ber-`var()` tak
  pernah dibuang saat parse. Kini di balik `@supports`.
- **Dua uji yang tak bisa merah**: hitungan tautan desktop yang pecah di
  `next dev` (tautan Storybook keempat), dan uji ⌘K yang bisa mengukur MENU
  sebelum palette ada.

Satu temuan **tidak terulang saat diukur**: "Back dengan sheet terbuka
membekukan gulir halaman tujuan". Di Chromium, popover halaman yang
disembunyikan tertutup sendiri dan halamannya bergulir. Penutupan saat header
dilepas tetap ditambahkan — murah, dan mesin lain tak wajib berlaku sama.

Satu gerbang lain memerah karena perubahan ini, dan instrumennya yang
dikoreksi: `scale-continuity` membaca ukuran caption dari `.caption`
**pertama** di dokumen — dulu tombol MENU, kini tautan nav yang di ponsel
menjadi kata display. Ukuran kelasnya kini dibaca dari probe tersendiri,
seperti token lain di fungsi yang sama.

Sengaja **tidak** diperbaiki, dengan alasannya:

- **Tanpa skrip, melintasi 800px dengan sheet terbuka** (iPad diputar)
  meninggalkan baris desktop di lapisan atas, tergambar di pojok kiri atas,
  sampai ketukan berikutnya. Penutup saat melintas butuh skrip; di tanpa-skrip
  satu ketukan membereskannya. Dicatat supaya yang pertama melihatnya tahu.
- **Tab melewati tautan terakhir kini meninggalkan halaman** ke kontrol
  peramban, bukan menutup sheet: yang di bawah sheet `inert`, jadi tidak ada
  lagi yang bisa difokus di sana. Itu memenuhi WCAG 2.4.11; uji dan judulnya
  dikoreksi ke klaim itu, bukan ke "sheet tertutup" yang lebih keras.
- **Tanpa skrip, `inert` tidak ada**: pembaca keyboard tanpa JavaScript yang
  menekan Tab melewati tautan terakhir masih bisa mendarat di konten di bawah
  sheet. Menutupnya butuh `<dialog>` modal yang dibuka secara deklaratif
  (invoker commands), yang belum cukup luas didukung; sampai itu, Escape dan
  MENU tetap menutupnya tanpa skrip.

**Pembuktian merah `phone-menu.e2e.ts` — diukur di CI.** Aturan fork: gerbang
baru dibuktikan merah di build lama, karena perilaku. Sampai PR #19 aturan itu
hanya terpenuhi sebagian untuk gerbang ini, dan tujuh tesnya tercatat di sini
sebagai "tidak dibuktikan merah": build dan suite lokal dihentikan atas
permintaan pemilik repo, karena RAM bebas laptop tinggal ~0,75 GB. PR #19
membayarnya di GitHub Actions. `.github/workflows/red-proof.yml` membangun app
di sebuah commit lama, melapiskan spec terkini di atasnya (hanya spec, modul
yang ia impor, dan config-nya), lalu menjalankannya dengan `--retries=0`.
`e2e/red-proof/classify.ts` menilai laporannya terhadap prediksi di
`e2e/red-proof/cases.json`, yang di-commit **sebelum** run pertama (`7f728e1`).
Merah dihitung hanya bila error **pertamanya** yang diprediksi, dan pesannya
dibaca tanpa cuplikan kode yang Playwright tempelkan: cuplikan itu bisa memuat
pesan asersi tetangga. Ini diukur pada run Playwright mini tanpa browser, di
mana pesan utuh cocok dengan asersi yang salah.

Tiga kasus: **A** `67af568`, dropdown React sebelum sheet; **B** `ec398eb`,
sheet popover yang `inert` dan pendengar fokusnya menunggu event `toggle`
(sebelum PR #18); **C**, head PR sebagai kontrol. Dua run, keduanya dengan
pembacaan `overflow` sekali yang lama (lihat temuan di bawah). Run
37001647550: attempt 1 menjalankan ketiga kasus, attempt 2 dan 3 mengulang job
B. Run 37005977774, dipicu commit dokumen: attempt 1 dan 3 menjalankan ketiga
kasus, attempt 2 mengulang B dan C.

| tes                                            | A `67af568`                                                              | B `ec398eb`                                                                                                                        | C kontrol                                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| tanpa skrip, MENU membuka rute                 | **merah**, perilaku — `toBeVisible`: element(s) not found                | hijau                                                                                                                              | hijau                                                                                   |
| sheet mengisi layar di bawah bar               | **merah**, perilaku — _the sheet stops short of the screen_              | hijau                                                                                                                              | hijau                                                                                   |
| Escape menutup, fokus kembali ke MENU          | **merah**, perilaku — `toBeHidden`: Received: visible                    | hijau                                                                                                                              | hijau                                                                                   |
| Tab dari MENU masuk ke menu                    | hijau (diprediksi _either_)                                              | hijau                                                                                                                              | hijau                                                                                   |
| Tab melewati tautan terakhir                   | **merah**, perilaku — _content under the open sheet can take focus_      | hijau 6 dari 7; **merah** sekali (37005977774 attempt 1) — _content under the open sheet can take focus_; kini diprediksi _either_ | hijau                                                                                   |
| ⌘K membuka palette di atas sheet               | hijau — tak bisa dibuktikan terhadap commit                              | hijau                                                                                                                              | hijau                                                                                   |
| fokus keluar + pencarian (satu-task)           | **merah**, instrumen — _MENU did not open the sheet_, lalu _…not inert…_ | **merah**, perilaku — _…not inert the moment it opened_, lalu _focus left the sheet and the sheet stayed open_                     | hijau                                                                                   |
| navigasi klien                                 | hijau                                                                    | hijau                                                                                                                              | hijau                                                                                   |
| tautan bernavigasi, menu tertutup saat kembali | hijau                                                                    | hijau                                                                                                                              | hijau                                                                                   |
| halaman di belakang diam                       | **merah**, perilaku — _the document can still scroll_                    | **merah** 6 dari 7 — _the document can still scroll_; cacat instrumen (temuan di bawah)                                            | **merah** 2 dari 4 di red-proof, hijau di 5 run suite penuh — cacat instrumen yang sama |
| reduced motion                                 | **merah**, instrumen — _no entrance ran without the preference_          | hijau                                                                                                                              | hijau                                                                                   |
| axe                                            | hijau                                                                    | hijau                                                                                                                              | hijau                                                                                   |
| desktop: satu nav, tanpa salinan tersembunyi   | hijau — tak bisa dibuktikan terhadap commit                              | hijau                                                                                                                              | hijau                                                                                   |

Sel tanpa hitungan sama di setiap attempt kedua run. CI biasa: run
37001647456 (head `7f728e1`) dan 37005977732 (head `89af2c3`), masing-masing
`e2e` 580 lulus, 0 gagal, 0 flaky, 29 dilewati. Tes satu-task, dengan tiga
ceknya kini `expect.soft`, hijau di keduanya.

**Utang yang lunas:**

- **Merah karena perilaku di `67af568`:** tanpa skrip, geometri sheet, Escape,
  Tab melewati tautan terakhir, dan halaman di belakang diam. Masing-masing
  gagal pada asersi yang menjaga cacatnya, bukan pada locator yang tak
  mengenali markup lama: locator yang sama menemukan nav lama begitu skrip
  menampilkannya (navigasi klien dan pulang-balik hijau di sana).
- **Merah karena instrumen di `67af568`:** reduced motion dan tes satu-task.
  Merah jenis ini membuktikan tesnya menolak lulus secara buta, bukan bahwa ia
  menangkap perilakunya. Kontrol reduced motion tidak menemukan entrance untuk
  dikendalikan, karena dropdown lama memang tak punya; `:popover-open` tidak
  bisa melihat menu yang bukan popover.
- **Tes satu-task merah di `ec398eb`, di kedua separuhnya:** yang tertutup
  sheet tidak `inert`, dan sheet tetap terbuka sesudah fokus pindah keluar. Ini
  terjadi di keenam attempt kedua run, dengan kedua pesan itu sebagai error
  pertama dan kedua. Kalimat "diturunkan dari kode, tidak dijalankan" di bawah
  kini terukur.

**Tidak bisa dibuktikan terhadap commit — dan tidak dipaksakan:**

- **⌘K.** Cacat yang ia jaga, palette terbuka di bawah sheet, butuh sheet di
  top layer, dan tidak ada commit yang pernah memilikinya tanpa perbaikan: versi
  popover pertama yang punya cacat itu di-review sebelum di-commit, dan
  `f9bdb29` membawa popover beserta semua perbaikan review dalam satu commit.
  Di dropdown lama tesnya lulus karena dua hal, dan keduanya tidak melibatkan
  menu yang menutup. Palette adalah Base UI Dialog modal, yang memberi
  `aria-hidden` pada semua elemen di luarnya (`markOthers`), sehingga locator
  role tidak menemukan nav dan `toBeHidden` lulus. Popup palette juga
  ber-z-index 101, di atas header yang 20, sehingga hit-test lulus. Di `main`,
  yang benar-benar menjaga cacat itu adalah hit-test-nya, bukan `toBeHidden`.
  Rencana awal memprediksinya merah; prediksi itu dikoreksi sebelum run.
- **Tes desktop.** Salinan tersembunyi setiap tautan hanya ada di versi popover
  pertama, yang merender nav kedua dan diganti sebelum di-commit. Bukti tidak
  langsungnya tetap seperti sebelumnya: pada versi itu, lima gerbang lain merah
  persis karena cacat ini.

Membuat commit rekaan yang memuat cacat itu akan "membuktikan" keduanya, dan
justru karena itu tidak dilakukan.

**Temuan: kontrol yang memerah karena instrumen, bukan karena halaman
bergulir.** "Halaman di belakang diam" membaca `overflowY` root **satu
kali**, tepat sesudah sheet terlihat. Dengan pembacaan itu ia merah di
`ec398eb` 6 dari 7 sampel (hijau hanya di run 36729688290, suite penuh di CI
biasa), dan di kode `main` 2 dari 4 sampel red-proof (run 37005977774 attempt
1 dan 3), sementara di suite penuh ia hijau di kelima run yang dibaca
(37001647456, 37005977732, 36821922226, 36820339810, 36818584855). Setiap
merahnya diawali _the document can still scroll_.

Sebabnya bukan pengkabelan header. Lenis berjalan dengan `autoToggle: true`
(`components/layout/lenis/index.tsx:151`), yang memasang kelas
`lenis-autoToggle` di `<html>`, dan `lenis.css` yang diimpor app memberi
kelas itu transisi diskret 1 ms pada `overflow`
(`node_modules/lenis/dist/lenis.css:22-26`) — dengan transisi itulah Lenis
mendengar kunci gulir lalu berhenti sendiri, lewat `transitionend`. Pembacaan
yang jatuh di dalam transisi itu melihat nilai lama, `visible`, padahal
`html:has(#header-nav:popover-open)` sudah cocok. Ini diukur di halaman
statis dengan CSS yang sama (Chromium 151, probe lokal yang tidak di-commit):
dengan transisi itu `overflowY` terbaca `visible` 8 dari 8 kali, dengan dua
transisi `overflow` sedang berjalan; tanpa transisi itu `hidden` 8 dari 8.

Asersi perilakunya — halaman tidak bergeser sesudah wheel — dievaluasi
sesudah asersi `overflow`, jadi di setiap sampel merah ia tak pernah dinilai.
Setiap kali ia dinilai di kode `main`, ia lulus: 7 dari 7. Jadi ini cacat
instrumen, bukan cacat produk. Commit ini memperbaikinya: `overflow` kini
di-_poll_ dengan pesan dan harapan yang sama, sebelum wheel, sehingga asersi
gulir selalu dinilai pada halaman yang sudah terkunci. Prediksinya kembali
hijau di B dan C atas keputusan pemilik repo; hasil dengan _poll_ diukur oleh
run red-proof yang dipicu commit ini dan dicatat di PR #19. Commit `89af2c3`
mencatat temuan ini sebagai khas `ec398eb` dengan mekanisme yang belum
diketahui; commit ini mengoreksinya.

**Temuan yang lebih kecil, di `ec398eb`:** "Tab melewati tautan terakhir"
merah 1 dari 7 (run 37005977774 attempt 1, `main` dan `footer` terbaca belum
`inert`). Ini konsisten dengan pengkabelan lama, yang memasang `inert` hanya
lewat efek sesudah event `toggle` yang diantrikan — disimpulkan dari kode,
tidak diukur. Prediksi awalnya hijau, karena pemeriksaan `inert`-nya berjalan
sesudah sheet ditunggu terlihat; ternyata sesekali ia mendahului efek itu.
Prediksinya kini _either_.

**Yang tersisa:** Tab dari MENU ke menu tetap _either_ di `67af568`. Merahnya
(Enter yang mendahului hidrasi, sekali teramati di build lokal) tidak muncul
di kedua run ini, jadi ia belum terbukti bisa merah karena perilaku.

**Satu dari tujuh itu kemudian merah sendiri — di CI, dalam perjalanan ke
`main`.** "Fokus keluar + pencarian" flaky di CI PR #16: sekali gagal, lulus
saat retry, dan sheet tetap terbuka lima detik sesudah Shift+Tab. Sebabnya di
kode produk, bukan di tesnya: pendengar `focusin` dan `inert` dipasang oleh
efek React yang berjalan sesudah `open` berubah, dan `open` mengikuti event
`toggle` popover, yang peramban **antrikan**. Shift+Tab di celah itu tidak
menemukan pendengar. Aturan fork menyebut kegagalan akibat perubahan fork
diperbaiki, bukan dilabeli — jadi ia diperbaiki sebelum merge ke `main`, lewat
branch sendiri dan PR ke `claude/arth-design`: pendengar kini dipasang sejak
mount dan membaca keadaan popover dari elemennya, dan `inert` diterapkan di
`beforetoggle`, yang dikirim sinkron sebelum sheet tampil.

**Dan klaim pertama saya tentang tesnya salah, dikoreksi di sini.** Perbaikan
awal "menajamkan" tes keyboard — menekan Shift+Tab tanpa menunggu sheet
terlihat — dan catatan ini menyebutnya mendarat "tepat di celah yang dulu
kosong". Review baca-saja menunjukkan itu tidak benar: penantian yang dibuang
hanya satu pemeriksaan sekali-jalan, sebiaya `page.evaluate` yang
menggantikannya, jadi jaraknya tak berubah dan pengkabelan lama tetap lulus
hampir setiap kali. Kini tesnya membuka sheet dan memindahkan fokus keluar
**dalam satu task**, lalu membaca dua hal: apakah yang tertutup sudah `inert`,
dan apakah sheet masih terbuka. Pengkabelan yang menunggu `toggle` tak punya
celah untuk lolos di situ — merah setiap kali (tidak `inert`, sheet tetap
terbuka) — dan pengkabelan kini hijau. Kemerahan itu waktu itu **diturunkan
dari kode oleh review, tidak dijalankan** di build lama, karena build lokal
dihentikan, dan ditulis di sini sebagai utang. **Utang itu kini terukur:** di
`ec398eb`, pada keenam attempt run red-proof 37001647550 dan 37005977774,
tesnya merah persis di kedua separuh itu (tabel di atas). Jalur keyboardnya
tetap diuji di sampingnya, sebagai jalan yang diambil pembaca.

---

## 4. Cara kerja, satu paragraf

Bangun, lihat dengan mata, jalankan gerbang yang tersisa, dan katakan apa yang
gagal. Tidak ada spec yang wajib lebih dulu, tidak ada nomor tahap, tidak ada
dokumen yang harus disinkronkan. Kalau sebuah angka diklaim, ia diukur.
