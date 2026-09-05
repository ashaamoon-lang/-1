# Tahap 40 — `project-spine`, dan gerbang epik yang melihat tujuh halaman

> Rencana: Bagian II, Tahap 40. Dial yang dibelanjakan: **MOTION**.
> Prasyarat: Tahap 39 selesai — `c98d540`.

---

## 1. Dua cacat, dan yang satu menyembunyikan yang lain

**D1 — anggaran momen epik hanya pernah mengukur satu halaman.**
`docs/MOTION-SPEC.md` §9.5 menamai momen untuk **tujuh** jenis halaman.
`e2e/interaction-grammar.e2e.ts:419` menjalankan sampler RAF-nya terhadap
`/en` **dan tidak ada yang lain**. Empat dari tujuh halaman di tabel itu tidak
mendeklarasikan `data-epic` sama sekali dan tidak pernah dihitung.

Itu menyembunyikan sesuatu yang konkret: `vault/blocks/project-hero` mengirim
`--reveal-duration: var(--duration-slow)` — **800ms**, di atas ambang 600ms
sampler — dan **tidak punya `data-epic`**. Sampler akan menandainya sebagai
"gerak melewati pita standar yang tidak dimiliki momen bernama mana pun",
kalau saja ia pernah mengunjungi rute itu.

**B5 — halaman proyek: 4,7 layar tanpa satu subjudul pun.** Halaman terpanjang
kedua di situs adalah satu gulungan tak terbedakan. Alatnya sudah ada dan
tidak dipakai di sini: `vault/motion/use-active-in-sequence.ts` (dua konsumen,
diekstrak justru supaya jadi kosakata) dan `components/effects/progress-text`.

---

## 2. Premis rencana ini perlu dikoreksi, lagi, dan alasannya konten

Rencana menulis spine berisi **Brief · Approach · The work · Outcome**.
Bagian itu **tidak ada**: `schemas/project.ts` memberi sebuah proyek satu
`body` Portable Text per locale, dan audit aset mencatatnya —
_"Body proyek = satu blok Portable Text per locale."_ Tidak ada Brief, tidak
ada Approach, tidak ada Outcome untuk diindeks.

Membuat empat judul itu berarti **mengarang konten**, yang Bagian III aturan
10 larang tanpa pengecualian, dan yang akan menaruh empat janji editorial di
halaman yang isinya satu paragraf.

**Jadi spine mengindeks wilayah halaman yang benar-benar ada**, bukan bagian
editorial yang tidak ada:

| Baris    | Menunjuk                                   | Ada karena    |
| -------- | ------------------------------------------ | ------------- |
| Overview | `ProjectHero` — judul, sampul, empat fakta | selalu        |
| Notes    | badan prosa                                | ada `body`    |
| Images   | `ProjectGallery`                           | ada `gallery` |
| Next     | praktik terkait + proyek berikutnya        | Tahap 38      |

Empat wilayah, semuanya nyata, label dari `messages/` — yang memang rumah
untuk teks antarmuka, bukan untuk copy editorial (`schemas/studioSettings.ts`
menarik garis itu dan `lib/content/home-fallback.ts` mengulanginya).

Baris hanya dirender untuk wilayah yang benar-benar dirender. Sebuah proyek
tanpa galeri tidak mendapat baris Images yang menunjuk ke ketiadaan — itu
persis kelas cacat yang Tahap 39 baru saja tutup di sisi filter.

**Konsekuensi yang ditulis, bukan disembunyikan:** kalau studio kelak menulis
`body` dengan heading sungguhan, spine ini harus dibangun ulang dari heading
itu, bukan dari wilayah. Wilayah adalah jawaban yang benar untuk konten yang
ada **hari ini**, dan mengatakannya sekarang lebih murah daripada menemukannya
nanti.

---

## 3. Yang dibangun

### 40a — gerbang lebih dulu, dan ia harus merah

Sampler anggaran epik diperluas dari `/en` ke **ketujuh** halaman tabel §9.5.
Dibuktikan merah, angkanya ditulis di §Hasil. Lalu:

1. `ProjectHero` mendapat `data-epic="project-arrival"` — §9.5 sudah
   menyebutnya "the project's arrival"; ia hanya tidak pernah ditandai di DOM.
2. Halaman lain yang tertangkap ditangani satu per satu: dinamai kalau ia
   memang momen menurut §9.5, atau geraknya dikembalikan ke pita standar kalau
   ia bukan.

### 40b — `project-spine`

Kolom kiri 2 dari 12, sticky, berisi indeks wilayah plus rail 1px. Di bawah
800px runtuh jadi satu baris label sticky di bawah header — bukan hilang,
karena di ponsel halaman ini justru terasa paling panjang.

Memakai ulang `useActiveInSequence` apa adanya. Nol mekanisme baru.

**Koreografi, konkret:**

- **Pemicu:** satu ScrollTrigger per wilayah, `start: 'top 60%'`,
  `end: 'bottom 40%'` — pita baca yang hook itu sudah punya. Nol scrub pada
  baris.
- **Baris masuk aktif:** `opacity` 0,45 → 1 dan
  `translate3d(var(--space-3xs), 0, 0)`, **400ms** (`--duration-base`,
  default proyek), `--ease-out-quart`.
- **Baris keluar aktif:** kembali dalam **200ms** (`--duration-fast`). Keluar
  lebih cepat dari masuk supaya perpindahan terbaca sebagai **satu** benda
  yang berpindah, bukan dua yang berkedip.
- **Rail:** `scaleY()` 0 → 1, `transform-origin: top`, terikat pada indeks
  aktif. Hanya `transform`; tidak pernah `height`.
- **Stagger:** nol. Indeks bukan daftar yang tiba; ia benda yang sudah di sana.
- **Reduced motion:** rail langsung `scaleY(1)`; semua baris `opacity: 1`;
  penanda aktif non-gerak dari token. Indeksnya berfungsi penuh —
  `useActiveInSequence` mengembalikan 0 dan **tidak** membuat trigger, jadi
  stylesheet yang harus menjanjikan keterbacaan, persis seperti dua konsumen
  lain yang sudah melakukannya.
- **Pembersihan:** `useGSAP` scope milik hook itu sudah `revert()`.
- **Larangan:** rail dan baris **tidak boleh** di dalam elemen yang difoto
  `<ViewTransition>` untuk morph kedatangan — pelajaran Tahap 33: transform
  pada elemen yang sedang di-morph membuat browser mengukur satu kotak dan
  menganimasikan kotak lain. Spine hidup sebagai saudara `ProjectHero`, bukan
  di dalamnya.

**Uji `taste-skill`** — _apa yang dikomunikasikan gerak ini?_ **Hierarki dan
navigasi.** Di mana pembaca berada dalam dokumen sepanjang 4,7 layar, dan apa
lagi yang ada. Bukan "kelihatan keren".

**Bukan momen §9.5.** Spine tidak punya awal dan akhir — ia respons
berkelanjutan terhadap posisi baca, kategori yang Tahap 42 akan namai. Halaman
proyek sudah punya satu momen (`project-arrival`, dinamai di 40a) dan
anggarannya masih punya sisa satu; spine tidak memakainya.

---

## 4. Gerbang

1. **Sampler epik berjalan di tujuh halaman** — merah dulu, angkanya ditulis.
2. **Spine menandai wilayah yang dibaca**, dan tepat satu, di tiap posisi
   gulir yang diukur.
3. **Baris hanya ada untuk wilayah yang ada** — proyek tanpa galeri tidak
   punya baris Images.
4. **Reduced motion:** nol transform ter-scrub, semua baris `opacity: 1`,
   indeks tetap terbaca penuh.
5. **Tanpa JavaScript:** spine tetap terbaca; tautannya tetap tautan.
6. **Nol prosa yang di-parallax** — `motion.e2e.ts` sudah menjaga ini dan
   harus tetap hijau.

---

## 5. Risiko

- Halaman proyek berpindah dari satu kolom ke dua. `spatial-rhythm.e2e.ts`,
  `media-edge.e2e.ts` dan `responsive.e2e.ts` semuanya mengukur halaman ini.
- Spine adalah elemen sticky di halaman yang punya header sticky.
  `taste-preflight` menghitung tumpukan sticky.
- `reveal-coverage.e2e.ts` menuntut tiap heading punya `[data-reveal]`.
- Menandai `project-arrival` mengubah apa yang sampler hitung di `/en` juga,
  karena `ProjectGrid` merender kartu di sana.

---

## 6. Hasil

### 6.1 40a — memperluas sampler dari satu halaman ke tujuh

Dibuktikan merah. Rencana memperkirakan **satu** halaman akan tertangkap.
Yang tertangkap **lima**, dan semuanya elemen yang sama:

| Rute                                   | Yang bergerak                              |      ms |
| -------------------------------------- | ------------------------------------------ | ------: |
| `/en/work`                             | `div "Work"`                               | 662–686 |
| `/en/work/arus-balik`                  | `div "Arus Balik"`                         | 726–747 |
| `/en/studio`                           | `div "Studio"`                             | 668–688 |
| `/en/journal`                          | `div "Journal"`                            | 693–694 |
| `/en/journal/scope-is-the-deliverable` | `div "Scope is the"` + `div "deliverable"` | 702–766 |

Setiap `div` itu adalah mask baris SplitText milik `<h1>` halaman tersebut.
`/en` dan `/en/practice/consulting` lulus, karena keduanya sudah punya momen
bernama yang membungkusnya.

**Diagnosis.** `vault/motion/text-reveal` memakai `duration.slow` — **800ms**,
pita berkoreografi — tanpa syarat. Tiap halaman memakai komponen itu untuk
`<h1>`-nya. Jadi tiap halaman membelanjakan gerak pita-berkoreografi untuk
judulnya muncul, dan §9.5 tidak pernah melihatnya karena sampler hanya pernah
mengunjungi satu dari tujuh rute yang ia atur.

**Perbaikan, dan yang tidak dilakukan.** Menamai lima "momen epik" baru akan
membuat `/work` dan `/studio` berada di **tiga**, melewati plafon §9.5, dan
membuat `/journal/<slug>` membatalkan keputusan "nol, sengaja" yang Tahap 26
catat. Lebih penting: gerak yang terjadi identik di tujuh halaman adalah
**default**, bukan momen — dan §9.5 dibuka justru dengan poin itu.

Jadi `TextReveal` mendapat prop `pace`:

- `arrival` — **400ms** (`duration.base`), pita standar. Default, dan yang
  didapat setiap masthead.
- `epic` — **800ms**. Dibelanjakan hanya di dua tempat yang §9.5 **sudah**
  namai: hero beranda (`hero-arrival`) dan hero proyek (`project-arrival`).
  Keduanya pernyataan satu layar penuh; keduanya di dalam `data-epic`.

`ProjectHero` juga akhirnya mendapat `data-epic="project-arrival"`. Namanya
ada di §9.5 sejak Tahap 11d; hanya atributnya yang tidak pernah ada.

**Sesudahnya: tujuh dari tujuh lulus.**

### 6.2 40b — `project-spine`

Diukur pada build produksi, 1440×900, `/en/work/arus-balik`:

| gulir | baris aktif | rail `scaleY` |
| ----: | ----------- | ------------: |
|     0 | Overview    |          0,25 |
|  1200 | Images      |          0,75 |
|  2600 | Next        |          1,00 |
|  4200 | Next        |          1,00 |

Tepat satu baris aktif di tiap posisi; opacity 1 untuk yang aktif, 0,7 untuk
sisanya. Empat baris, empat wilayah, id-nya cocok satu-satu.

**Reduced motion:** semua baris `opacity: 1`, nol transform, rail `scaleY(1)`,
indeks terbaca penuh. `useActiveInSequence` tidak membuat trigger sama sekali
dan mengembalikan 0 selamanya — jadi stylesheet yang harus menjanjikan
keterbacaan, dan itu yang diuji.

### 6.3 Gerbang menangkap dua cacat nyata, dan salah satunya komentar saya sendiri

axe melaporkan dua pelanggaran **serius** pada spine versi pertama:

**`color-contrast` (3 node).** Rencana menulis recede 0,45; saya
mengirimkannya; dan komentar yang saya tulis tepat di atasnya mengklaim 0,45
adalah _"recede yang sama yang dipakai `step-sequence`, ditetapkan Tahap 25
lewat sapuan kontras axe"_. **Klaim itu salah.**
`step-sequence.module.css` menyetel `--step-recede: 0.7`, dengan catatannya
sendiri: 0,7 adalah satu langkah di atas lantai kontras, supaya penyesuaian
palet nanti tidak diam-diam melewatinya. 0,45 jauh di bawahnya.

Komentar yang berbohong tentang kodenya sendiri persis kelas cacat yang
Tahap 37 §C5 hitung sebelas kali di `DESIGN-SYSTEM.md`. Ia ditulis ulang
dengan angka yang benar dan dengan kesalahannya disebutkan, bukan dihapus.

**`target-size` (3 node).** Tautan seukuran caption adalah target ~14px, di
bawah minimum WCAG 2.2. Barisnya sekarang `min-block-size:
calc(var(--tap-target) / 2)`, aturan yang sudah diikuti nav header.

Keduanya lolos dari `bun run check`, dari typecheck, dan dari lima gerbang
lain. Yang menangkapnya adalah axe pada halaman yang benar-benar dirender —
lagi-lagi bukti bahwa gerbang hijau bukan halaman yang benar.

### 6.4 Premis rencana dikoreksi: wilayah, bukan bab

Rencana menamai baris **Brief · Approach · The work · Outcome**. Bagian itu
tidak ada — sebuah proyek punya satu `body` Portable Text per locale — jadi
menulisnya berarti mengarang konten, yang Bagian III aturan 10 larang.

Spine mengindeks **wilayah yang benar-benar dirender**: Overview, Notes,
Images, Next. Baris hanya muncul untuk wilayah yang ada, jadi proyek tanpa
galeri tidak mendapat baris Images yang menunjuk ke ketiadaan. Konsekuensinya
ditulis di komponen: kalau studio kelak menulis heading sungguhan ke dalam
`body`, spine harus dibangun ulang dari heading itu.

### 6.5 Satu token yang tidak pernah ada

Menulis CSS spine mengungkap bahwa `vault/motion/flip` (Tahap 39) membaca
`--space-2xs` — **token yang tidak ada**. Tahap 37 membuat token radius,
bayangan dan stagger, tapi tidak skala spasi, karena tangga spasi diekspresikan
lewat `mobile-vw()`/`desktop-vw()` pada waktu tulis, yang tidak bisa dijangkau
`getPropertyValue` saat runtime. Jadi pencariannya selalu mengembalikan `''`
dan nilainya selalu fallback.

Menamai token yang tidak ada lebih buruk daripada angka: ia terbaca sebagai
ter-tokenisasi dan berperilaku sebagai hardcoded. Diganti dengan 8px yang
ditulis apa adanya, dengan alasannya. `--duration-base` juga tidak ada
(namanya `--duration`); diperbaiki di dua tempat.

### 6.6 Dua gerbang lain merah, dan keduanya benar

Suite penuh menangkap dua hal yang gerbang spine sendiri tidak bisa lihat.
Keduanya ada di §5 sebagai risiko, dan keduanya ternyata cacat nyata.

**`visual-substance`: "`/en/work/arus-balik` keeps its gutter" — merah.**
Spine mulanya di kolom **kiri**, yang tempat paling jelas untuknya. Dua kolom
sebelum konten mendorong `<h1>` masuk sejauh itu, jadi judul halaman proyek
berhenti dimulai di tempat wordmark di atasnya dimulai. Tiap halaman lain di
situs menyejajarkan dua tepi itu.

Yang **tidak** dilakukan: melonggarkan gerbangnya. "Halaman dimulai di tempat
chrome-nya dimulai" adalah aturan yang berlaku di seluruh situs dan lebih
berharga daripada sisi mana indeks duduk. Spine pindah ke **kanan**: kolom
konten mempertahankan gutter yang selalu dimilikinya, judulnya sejajar lagi,
dan indeksnya justru berada di tempat mata pembaca tidak. Urutan DOM tetap
spine-dulu — ia `<nav>` untuk halaman ini, jadi keyboard mencapainya sebelum
isi yang diindeksnya, dan ponsel menampilkannya di atas.

**`continuous-motion`: "prose never acquires a scroll-linked transform" —
merah**, melaporkan `Images` sebagai prosa yang digerakkan.

`Images` adalah label baris spine. Selektor gerbangnya `main p, main li`, dan
baris spine adalah `<li>`. Aturan yang dinyatakan komentarnya sendiri adalah
tentang **prosa** — _"a paragraph that drifts against its own column hurts
reading comfort"_ — dan `main li` adalah proksi untuk itu yang kelewat luas.

Selektornya dipersempit ke `:not(nav *)`, dan penyempitannya ditulis dengan
alasannya: baris di dalam `<nav>` bernama adalah kontrol, bukan kolom teks;
tidak ada yang membacanya seperti yang aturan ini lindungi. Tiap paragraf dan
tiap butir daftar yang benar-benar konten tetap dalam cakupan. Ini
memperbaiki instrumen supaya ia mengukur apa yang komentarnya sudah klaim —
bukan melonggarkannya supaya kode saya lewat.

### 6.7 Gerbang

```
bun run build            ✅
bun run check            ✅  oxlint · oxfmt · tsc · 458 unit · manifest · assets
bun run build-storybook  ✅
CI=true bun run test:e2e ✅  512 lulus · 16 dilewati · 0 gagal
```

### 6.8 Catatan

`vault/blocks/project-spine` belum punya story Storybook, seperti
`vault/motion/flip`. Keduanya masuk daftar Tahap 46 alih-alih didiamkan.
