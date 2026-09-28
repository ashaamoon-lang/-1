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

**Ditunda, dengan alasan:** morph sampul dari proyek ke proyek berikutnya.
Memberi sampul "berikutnya: C" nama transisi C berarti halaman proyek ke
katalog membentuk **dua** pasangan morph (hero B ↔ kartu B, dan C ↔ kartu C),
padahal satu pasangan per navigasi adalah aturan yang dipertahankan — dan
gerbangnya hanya menguji arah katalog→proyek, jadi ia tak akan menangkapnya.
Yang benar adalah mempersenjatai nama itu hanya saat tautan ditekan (seperti
`released` di kartu), dengan uji navigasi mundur di browser; itu pekerjaan
tersendiri, bukan tambahan diam-diam di sini.

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

---

## 4. Cara kerja, satu paragraf

Bangun, lihat dengan mata, jalankan gerbang yang tersisa, dan katakan apa yang
gagal. Tidak ada spec yang wajib lebih dulu, tidak ada nomor tahap, tidak ada
dokumen yang harus disinkronkan. Kalau sebuah angka diklaim, ia diukur.
