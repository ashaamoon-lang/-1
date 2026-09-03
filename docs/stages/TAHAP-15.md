# TAHAP 15 — Halaman per topik, dan gerak yang mengikutinya

Stage-spec yang diwajibkan `docs/ROADMAP.md` §3.0.

Dari dua permintaan pemilik:

> "kita bisa membangun skema routing page yang otonom" → **halaman terpisah
> untuk setiap topiknya**
>
> "pastikan animasinya menjadi lebih baik … pastikan berada di level award,
> kemudian **menggunakan library dan sumber daya yang telah ada di repository
> ini**"

Yang kedua adalah batasan paling ketat di tahap ini, dan yang paling berguna:
**nol dependensi baru**. Semua gerak di bawah datang dari perkakas yang sudah
terpasang — dan sebagian besar dari yang terpasang lalu tidak pernah dipakai.

---

## 1. Yang diminta, dan apa yang itu ubah

### 1.1 Ini membatalkan sebuah keputusan roadmap, dan itu dinyatakan

`ROADMAP.md` §1.2 memilih **single page** untuk beranda, dan menuliskan
konsekuensinya sendiri:

> "Navigasi adalah anchor dalam halaman (`#work`, `#studio`, `#contact`) plus
> pengalih bahasa. Karena satu halaman panjang, **koreografi scroll harus
> kuat** — itu konsekuensi yang diterima saat memilih opsi single-page."

Membangun halaman per topik mengubah itu. Bukan diam-diam: keputusan lama
dibuat saat situs ini masih studio karya pesanan dengan nol karya terbit;
sekarang ada enam penugasan, tiga praktik yang jadi kosakata struktural sejak
Tahap 13, dan pemilik memintanya. Roadmap diperbarui, bukan dilanggar.

Beranda **tetap** satu halaman panjang. Yang bertambah adalah tujuan untuk
pergi — bukan pemecahan beranda.

### 1.2 Terukur — rute hari ini

|                                         | Jumlah                                                                                           |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Halaman (`page.tsx`)                    | 6                                                                                                |
| Rute API/dokumen                        | 4                                                                                                |
| Tempat `<Wrapper>` dikawat tangan       | **6**, masing-masing mendeklarasikan `theme`, `lenis`, `webgl`, `gsap`, `simTypes`, `sections`   |
| Yang `lib/seo/route-catalog.ts` ketahui | `path`, `label`, `description`, `changeFrequency`, `priority` — **7 konsumen**                   |
| Perlakuan transisi                      | **2**: satu sapuan panel generik untuk tiap navigasi, dan **satu** pasang morph (kartu → detail) |

Tiga praktik — Consulting, AI & Data, Commission — adalah kosakata tertutup
sejak Tahap 13: nilai skema, segmen URL, entri JSON-LD, chip filter, tiga baris
di kolom kanan hero, dan sejak Tahap 14b sebuah `<details>` di beranda. Yang
**tidak** mereka punya adalah halaman.

### 1.3 `/studio` sudah dipakai, dan itu membatasi penamaan

`app/(chrome)/studio/[[...tool]]` adalah Sanity Studio. Halaman apa pun tentang
studio tidak bisa memakai path itu. Tahap ini karenanya **tidak** membangun
halaman "tentang" — `#studio` tetap seksi beranda — dan topik yang dapat
halaman adalah tiga praktik, yang memang kosakata situs ini.

---

## 2. Ritual `ui-ux-pro-max`

`ROADMAP.md` §2.1. Dijalankan, hasil ditempel termasuk yang tipis.

```bash
S=.claude/skills/ui-ux-pro-max/scripts/search.py
python3 $S "page transition"      --domain gsap   -n 4  → 3 hasil
python3 $S "navigation feedback"  --domain ux     -n 3  → 3 hasil (tak relevan)
python3 $S "routing"              --stack nextjs  -n 4  → 1 hasil (generik)
```

| Hasil                                                                                                                                                                  | Putusan                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| _Page Transition / Complex_: **"Don't use shared-element transitions across more than one element pair per navigation; compounding Flips are hard to time correctly"** | **Diterima, dan jadi aturan.** Tiap navigasi baru di tahap ini memorf **satu** pasang, tidak lebih.                                                |
| _Page Transition / Subtle_: **"Exit animation should always resolve faster than entrance (asymmetric timing) so back/forward feels snappy"**                           | **Sudah dipenuhi** — `page-transition.module.css` sudah asimetris (`--duration-fast` keluar, `--duration` masuk). Diverifikasi, bukan diasumsikan. |
| _Page Transition / Subtle_: "Don't block navigation on animation; cap exit at ~250ms"                                                                                  | Diterima; sapuan yang ada 200ms.                                                                                                                   |
| _Page Transition / Standard_: overlay di root layout                                                                                                                   | Sudah begitu (`app/[locale]/layout.tsx:242`).                                                                                                      |
| **`routing --stack nextjs` hanya 1 hasil, dan generik** ("use file-based routing")                                                                                     | **Dinyatakan: database skill tidak punya panduan arsitektur rute.** Keputusan §5 di bawah bukan berbasis database, dan disebut begitu.             |

---

## 3. Batasan keras

1. **Nol dependensi baru.** Permintaan pemilik, dan batasan yang paling
   membentuk tahap ini.
2. **three.js hanya di beranda.** `e2e/route-budget.e2e.ts` mengizinkan `three`
   di satu rute. Halaman praktik **tidak** membawa material — ia mewarisi
   disiplin Tahap 7 yang sama dengan `/en/work`.
3. **Maksimal satu pasang shared-element per navigasi** (§2).
4. **Dua momen band-choreographed per halaman**, `MOTION-SPEC.md` §9.5.
5. **Terbaca tanpa JavaScript**, dua bahasa, dan `route-catalog` tetap satu
   sumber untuk sitemap, `/llms.txt`, `/ai`, dan alternates.

---

## 4. Inventaris — yang menganggur, dan yang akhirnya dipakai

`ROADMAP.md` §3.0 langkah 3. Diukur, bukan diingat:

| Perkakas                                             | Konsumen nyata hari ini | Dipakai tahap ini                                                                                              |
| ---------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| `components/effects/progress-text` (scrub ke scroll) | **0**                   | **Ya** — pernyataan tiap halaman praktik                                                                       |
| Plugin GSAP `Flip`                                   | **0**                   | Tidak — `<ViewTransition share="morph">` sudah melakukan pekerjaan itu di sini dan sudah terbukti              |
| Plugin GSAP `Observer`                               | **0**                   | Tidak — tidak ada interaksi di tahap ini yang membutuhkannya; memaksanya masuk adalah kebalikan dari restraint |
| `components/ui/tabs`, `accordion`                    | 0                       | Tidak — Tahap 14b sudah memutuskan `<details>` native untuk disclosure                                         |
| `lib/webgl/utils/fluid`                              | 0                       | Tidak — lebih mahal dari flowmap tanpa alasan visual                                                           |
| `vault/primitives/magnetic`                          | 1 (CTA hero)            | Tidak diperluas                                                                                                |
| `vault/motion/reveal` (Tahap 14b)                    | 4                       | **Ya**                                                                                                         |
| `vault/blocks/project-grid` `layout="catalogue"`     | 1                       | **Ya**                                                                                                         |
| `<ViewTransition share="morph">`                     | 1 pasang                | **Ya** — pasang kedua                                                                                          |

**Satu perkakas menganggur dipakai, tiga sengaja tidak.** Menyebut yang tidak
dipakai sama pentingnya: "sudah terpasang" bukan alasan untuk memakai.

---

## 5. Tahap 15a — halaman praktik

### 5.1 Satu URL per topik

`/practice/<value>` menjadi **halaman topik itu**, dan menyerap katalog
tersaring yang sekarang ada di `/work/practice/<value>`.

Dua URL untuk satu topik memecah SEO dan memaksa pembaca memilih tanpa
alasan. Yang lama **dialihkan permanen** ke yang baru. `route-catalog` adalah
satu sumber, jadi sitemap, `/llms.txt`, `/ai`, dan alternates ikut dari satu
suntingan — keputusan Tahap 8 yang berbuah lagi.

### 5.2 Susunannya, dan dari mana isinya datang

| #   | Bagian             | Isi                                                        | Nyata atau penampung                     |
| --- | ------------------ | ---------------------------------------------------------- | ---------------------------------------- |
| 1   | Hero praktik       | Nama praktik + kalimat `workIndex.<practice>Intro`         | **Nyata** — ditulis Tahap 13, dua bahasa |
| 2   | Pernyataan         | Paragraf yang tersingkap mengikuti scroll (`ProgressText`) | **Penampung bertanda**                   |
| 3   | Karya              | `ProjectGrid layout="catalogue"`, disaring praktik         | **Nyata** — dari CMS                     |
| 4   | Praktik berikutnya | Tautan ke praktik sesudahnya, melingkar                    | **Nyata** — dari `PRACTICES`             |

Bagian 2 adalah satu-satunya prosa baru, dan ia **ditandai penampung** lewat
mekanisme `placeholderNote` yang sudah dipakai beranda. Tahap 13 §9 tetap
terbuka; tahap ini tidak berpura-pura menutupnya.

### 5.3 `ProgressText` akhirnya mendapat pekerjaannya

Ia dibangun saat fork, punya `scrub: true`, dan **nol pemakai** selama lima
belas tahap. Komentar dokumennya sendiri sudah menyebut untuk apa:

> "Use `ProgressText` for a long passage the reader moves through."

Pernyataan sebuah praktik persis itu. Ini bukan mencari alasan memakai mainan —
ini satu-satunya tempat di situs ini yang cocok dengan deskripsi yang sudah
tertulis lima belas tahap lalu.

Konsekuensinya: halaman praktik mengaktifkan `gsap` di `<Wrapper>` (ScrollTrigger
scrub), **tidak** `webgl`. Anggaran rutenya diukur, dan kalau `gsap` membuatnya
melewati batas, cakupannya yang dikurangi, bukan plafonnya yang dinaikkan.

---

## 6. Tahap 15b — koreografi menuju halaman itu

Satu pasang morph, sesuai §2.

`<details>` praktik di beranda (Tahap 14b) memorf namanya ke hero halaman
praktik, dengan `transitionName()` yang sama yang sudah memasangkan kartu ke
detail. Mesinnya sudah ada, terbukti, dan digerbangi.

Chip filter di `/work` juga menunjuk ke halaman praktik, jadi tiga jalan masuk
— hero, disclosure beranda, chip katalog — semuanya berakhir di satu tempat.

---

## 7. Berkas

**Baru**

| Berkas                                                | Untuk            |
| ----------------------------------------------------- | ---------------- |
| `app/[locale]/practice/[value]/page.tsx`              | Halaman topik    |
| `vault/blocks/practice-hero/{index.tsx,*.module.css}` | Bagian 1         |
| `vault/blocks/next-practice/{index.tsx,*.module.css}` | Bagian 4         |
| `e2e/practice-page.e2e.ts`                            | Gate 15a         |
| `e2e/navigation-landing.e2e.ts`                       | Gate 15b (§11.2) |
| `docs/stages/TAHAP-15.md`                             | dokumen ini      |

**Diubah**

| Berkas                                                    | Perubahan                                                            |
| --------------------------------------------------------- | -------------------------------------------------------------------- |
| `lib/content/practices.ts`                                | `practiceTemplate()` menunjuk `/practice/<value>`                    |
| `app/[locale]/work/practice/[value]/page.tsx`             | Jadi redirect permanen                                               |
| `vault/blocks/practice-list/index.tsx`                    | Nama praktik jadi pasangan morph                                     |
| `messages/{en,id}.json`                                   | String halaman praktik, dua bahasa                                   |
| `lib/motion/transition-name.ts`                           | Prefiks `work-cover-` → `morph-`; ia berbohong untuk pasangan baru   |
| `components/ui/link/index.tsx`                            | `scroll` kembali ke `true` — sebab akar §11.2                        |
| `playwright.config.ts`                                    | Gate pendaratan ikut berjalan di viewport mobile                     |
| `e2e/motion.e2e.ts`                                       | Menyusun `transitionName` alih-alih mengetik prefiks; dua morph baru |
| `e2e/media-edge.e2e.ts`                                   | Lookahead `(?!practice/)` mati diganti asersi eksplisit              |
| `e2e/{no-javascript,reveal-coverage,route-budget}.e2e.ts` | Rute baru masuk cakupan                                              |
| `docs/MOTION-SPEC.md`                                     | §9.4 aturan 6 — syarat viewport untuk morph                          |
| `docs/ROADMAP.md`                                         | §1.2 dikoreksi — keputusan single-page diperluas                     |

**Tidak perlu diubah, dan itu buktinya sumber tunggal bekerja.**
`lib/seo/route-catalog.ts` dan `app/[locale]/work/hrefs.ts` sudah menyusun
`practiceTemplate()`, jadi memindahkan rute di satu berkas ikut memindahkan
sitemap, `llms.txt`, `/ai`, `alternates` dan chip katalog tanpa satu pun
suntingan di sini. Spec ini semula mendaftarkan keduanya sebagai "diubah";
ternyata tidak.

---

## 8. Gate — dibuktikan merah dulu

| Gate                                | Membuktikan                                                                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **baru** `e2e/practice-page.e2e.ts` | Tiap `PRACTICES` punya halaman yang merender: hero, pernyataan, karya yang benar-benar tersaring, tautan praktik berikutnya |
| **baru** — kanonikalitas            | `/work/practice/<value>` mengalihkan permanen; tidak ada dua URL untuk satu topik                                           |
| `e2e/route-budget.e2e.ts`           | Halaman praktik **nol `three`**; `/en` tetap di bawah plafon                                                                |
| `e2e/no-javascript.e2e.ts`          | Halaman praktik terbaca penuh tanpa JS                                                                                      |
| `e2e/reveal-coverage.e2e.ts`        | Rute baru masuk daftar, dengan lantai per rute                                                                              |
| `e2e/route-sweep.e2e.ts` + axe      | Rute baru, dua viewport, dua bahasa                                                                                         |
| `e2e/motion.e2e.ts`                 | Morph pasangan kedua benar-benar berjalan                                                                                   |
| `bun run check`                     | Termasuk `practices.test.ts` dan `manifest:check`                                                                           |

---

## 9. Risiko

**9.1 Prosa penampung di sebuah halaman lebih terlihat daripada di seksi.**
Bagian 2 adalah satu-satunya, dan halaman itu sebagian besar isi **nyata**
(kalimat Tahap 13, karya dari CMS). Kalau tetap terasa kosong, bagian 2
dicabut, bukan diisi lebih banyak prosa saya.

**9.2 Anggaran.** `gsap` masuk ke rute yang sebelumnya nol pustaka berat.
Diukur; kalau tembus, `ProgressText` yang dilepas.

**9.3 Redirect memutus tautan lama.** Sitemap dan `/llms.txt` dibangun dari
`route-catalog`, jadi keduanya ikut satu suntingan — tapi mesin jawaban yang
sudah meng-crawl URL lama bergantung pada redirect itu benar. Digerbangi.

**9.4 `ProgressText` belum pernah dipakai sekali pun.** Nol pemakai berarti
nol bukti ia bekerja di halaman nyata. Diperlakukan sebagai kode yang belum
terbukti: dibuktikan merah dulu, dan diukur di halaman tersaji.

---

## 10. Yang **tidak** dikerjakan

- **Tidak ada dependensi baru.** Permintaan pemilik.
- **Tidak ada halaman "tentang".** `/studio` dipakai Sanity (§1.3); `#studio`
  tetap seksi beranda.
- **Beranda tidak dipecah.** Ia tetap satu halaman panjang.
- **Observer, Flip, Tabs, Accordion, sim fluid tetap nol pemakai.** Terpasang
  bukan alasan untuk dipakai (§4).
- **Tidak ada material WebGL di rute baru** (§3.2).
- **Tidak ada angka performa yang tidak diukur** (`CLAUDE.md` #19).
- **Kredensial tidak dirotasi**, sesuai permintaan Anda.

---

## 11. Hasil

### 11.1 Tahap 15a — halaman praktik

Selesai seperti dispesifikasikan. Tiga halaman di `/[locale]/practice/<value>`,
dua bahasa; `/work/practice/<value>` jadi 308 permanen; `practiceTemplate()`
satu-satunya tempat yang memutuskan tujuannya, jadi sitemap, `llms.txt`, `/ai`,
`alternates` dan chip katalog ikut lewat satu suntingan.

`ProgressText` akhirnya dipakai — dan pemakaian pertamanya hampir tidak
mengerjakan apa pun. Diukur sebelum diperbaiki: **46 kata membalik serentak**,
`min` opacity sama dengan `max` di setiap posisi scroll. Nilai bawaan
komponen (`top top` → `bottom bottom`) mengandaikan paragraf yang lebih tinggi
dari layar; pernyataan tiga baris membuat kedua posisi itu berjarak beberapa
piksel dan seluruh scrub selesai dalam satu frame. `start="top 80%"`
`end="bottom 40%"` plus `min-height: 70svh` pada hero memberi jarak scroll yang
nyata. Tanpa pengukuran itu ia akan dikirim sebagai "ProgressText akhirnya
dipakai" sambil diam.

Dua instrumen salah bentuk lagi, dicatat bukan diperbaiki diam-diam:

- `SectionHeader title=""` akan memancarkan `<h2>` kosong — `empty-heading`
  bagi axe. Seksi yang labelnya hanya eyebrow tidak butuh heading.
- `ProgressText` **membuang props yang tidak dikenalnya** (ia merender `span`
  dengan `ref`, `className`, `style` saja). Penanda `data-practice-statement`
  yang dipasang padanya akan hilang tanpa suara dan gate akan gagal terhadap
  markup yang benar. Penanda pindah ke `<section>`.

### 11.2 Tahap 15b — morph, dan cacat yang ia ungkap

Mekanismenya terpasang dalam beberapa menit. Gate-nya merah, dan **merahnya
benar**: `::view-transition-old(morph-practice-consulting)` ada, tanpa `group`
dan tanpa `new`. Separuh yang masuk tidak pernah diberi nama.

Enam eksperimen, di server dev supaya murah:

| Dugaan                                             | Hasil                                      |
| -------------------------------------------------- | ------------------------------------------ |
| `practice-hero` harus Client Component             | Salah — tetap gagal                        |
| Chunk WebGL beranda mengganggu                     | Salah — diblokir, tetap gagal              |
| Prefetch belum selesai (link di dalam `<details>`) | Salah — tunggu 4 detik, sama               |
| Navigasi lebih dalam dua tingkat                   | Salah — `/practice` → `/work` **berhasil** |
| Nama tidak cocok di kedua ujung                    | Salah — HTML tersaji cocok                 |
| Beranda-nya yang khusus                            | **Benar**, tapi bukan karena isinya        |

Yang membedakan bukan halamannya. Yang membedakan **seberapa jauh pembaca
sudah menggulir**.

React hanya memberi `view-transition-name` pada elemen yang **berada di dalam
viewport** saat commit: `applyViewTransitionToHostInstancesRecursive`
mengembalikan apakah ada host instance yang terlihat, dan ketika tidak,
pemanggilnya memanggil `restoreViewTransitionOnHostInstances` dan mencabut
nama itu lagi. Dibaca langsung di
`node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js`,
bukan diduga.

Dan tujuannya selalu di luar viewport, karena **`components/ui/link` memakai
`scroll={false}` sejak fork**, dengan komentar "prevent scroll restoration
warnings with fixed/sticky elements". Peringatan itu tidak pernah muncul sekali
pun dalam pengukuran ini. Harganya, diukur pada build produksi:

| Navigasi                                    | Mendarat di                 | `<h1>`               |
| ------------------------------------------- | --------------------------- | -------------------- |
| beranda (y=3520) → `/practice/consulting`   | **1522** — maksimum halaman | 1136px di atas layar |
| beranda → `/work/arus-balik`                | **1047**                    | 917px di atas layar  |
| `/work` → `/work/arus-balik`                | **394**                     | 264px di atas layar  |
| `/practice/consulting` → praktik berikutnya | **1480**                    | di luar layar        |

Pembaca yang meminta sebuah halaman **mendarat di ujung bawahnya.** Enam belas
tahap gate hijau melewatkan ini karena tidak satu pun gate menanyakan ke mana
sebuah navigasi _berakhir_ — semuanya memakai `page.goto`, yang selalu mulai
dari nol.

Itu juga menjelaskan kenapa gate morph lama hijau: `/work` menaruh grid-nya
dekat puncak, jadi offset yang terbawa cukup kecil untuk menyisakan sampul
tujuan di dalam viewport. Gate itu hanya pernah menguji jalur yang pendek.

**Perbaikannya satu baris** — `scroll` kembali ke `true`, bawaan Next sendiri —
dan ia memperbaiki keduanya sekaligus: pendaratan dan morph. Diverifikasi tidak
mengubah apa pun yang lain: `#work` tetap menggulir ke 660 (Lenis `anchors:
true` yang memilikinya, bukan prop ini), tombol back tidak berubah, dan tidak
ada peringatan konsol baru.

### 11.3 Gate

Enam asersi baru, semuanya dibuktikan merah dulu dengan angkanya:

| Gate                                          | Merah sebelum                                                  |
| --------------------------------------------- | -------------------------------------------------------------- |
| **baru** `e2e/navigation-landing.e2e.ts` (×4) | mendarat 1522 / 1047 / 394 / 1480px ke bawah                   |
| `e2e/motion.e2e.ts` — morph nama praktik      | `no morph pair formed`, hanya `old(morph-practice-consulting)` |
| `e2e/motion.e2e.ts` — sampul dari beranda     | `no morph pair formed`, hanya `old(morph-arus-balik)`          |

Gate pendaratan juga berjalan di viewport mobile: halaman yang lebih pendek
dari offset yang terbawa akan terpotong ke maksimumnya sendiri, jadi jarak
terdamparnya berbeda per lebar layar.

### 11.4 Yang **tidak** diperbaiki, dan kenapa

**Shell instan pada rute dinamis.** Konsol dev melaporkan, pada
`/[locale]/practice/[value]`:

```
Route "/[locale]/practice/[value]": Next.js encountered URL data during
prerendering or a navigation. `params` … accessed outside of `<Suspense>`
```

Diukur: `/en/work/arus-balik` melaporkan hal yang sama; `/en`, `/en/work` dan
`/en/ai` tidak. Jadi ini pola yang sudah ada pada **setiap** rute dinamis, bukan
sesuatu yang Tahap 15a bawa. Memperbaikinya berarti menaruh `<Suspense>` di
sekitar bagian yang membaca `params` pada dua rute — dan Tahap 9 justru
**mencabut** batas Suspense dari rute-rute ini supaya halaman terbaca tanpa
JavaScript (`e2e/no-javascript.e2e.ts` mendokumentasikan 28 karakter yang jadi
1073). Kedua tuntutan itu tarik-menarik, dan itu tahap tersendiri, bukan
sisipan diam-diam ke 15b. Dicatat, tidak dibungkam.

**Tidak ada angka performa.** Tidak ada profiler yang berjalan di lingkungan
ini; tidak ada klaim FPS atau waktu frame di mana pun dalam tahap ini
(`CLAUDE.md` #19).

### 11.5 Angka akhir

```
bun run check      exit 0    (oxlint, oxfmt, tsc, 400 unit test, manifest, assets)
CI=true test:e2e   267 lulus, 0 gagal   (dari 257 sebelum tahap ini)
```

Build produksi bersih (`rm -rf .next`), Storybook dibangun ulang — gate
kebasiannya menolak build lama setelah `components/ui/link` berubah, dan itu
memang tugasnya.
