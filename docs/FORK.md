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

**5b — berikutnya.** Tujuh belas yang campuran **disunting
klausa-per-klausa**, karena menghapusnya utuh akan membuang axe,
reduced-motion, jalur tanpa JS dan deteksi kebocoran WebGL: `catalogue-layout`, `continuous-motion`, `exploratory-layer`,
`first-screen`, `gallery-run`, `interaction-grammar`, `media-edge`, `motion`,
`practice-capabilities`, `practice-page`, `project-detail`, `route-budget`,
`scale-continuity`, `site-reach`, `visual-substance`, `vocabulary`,
`command-palette`.

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

---

## 4. Cara kerja, satu paragraf

Bangun, lihat dengan mata, jalankan gerbang yang tersisa, dan katakan apa yang
gagal. Tidak ada spec yang wajib lebih dulu, tidak ada nomor tahap, tidak ada
dokumen yang harus disinkronkan. Kalau sebuah angka diklaim, ia diukur.
