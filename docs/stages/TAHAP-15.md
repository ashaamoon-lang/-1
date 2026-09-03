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

| Berkas                                                | Untuk         |
| ----------------------------------------------------- | ------------- |
| `app/[locale]/practice/[value]/page.tsx`              | Halaman topik |
| `vault/blocks/practice-hero/{index.tsx,*.module.css}` | Bagian 1      |
| `vault/blocks/next-practice/{index.tsx,*.module.css}` | Bagian 4      |
| `e2e/practice-page.e2e.ts`                            | Gate 15a      |
| `docs/stages/TAHAP-15.md`                             | dokumen ini   |

**Diubah**

| Berkas                                        | Perubahan                                         |
| --------------------------------------------- | ------------------------------------------------- |
| `lib/content/practices.ts`                    | `practiceTemplate()` menunjuk `/practice/<value>` |
| `lib/seo/route-catalog.ts`                    | Entri praktik pindah; sitemap/llms/ai ikut        |
| `app/[locale]/work/practice/[value]/page.tsx` | Jadi redirect permanen                            |
| `app/[locale]/work/hrefs.ts`                  | Chip menunjuk halaman baru                        |
| `vault/blocks/practice-list/index.tsx`        | Nama praktik jadi pasangan morph                  |
| `messages/{en,id}.json`                       | String halaman praktik, dua bahasa                |
| `docs/ROADMAP.md`                             | §1.2 dikoreksi — keputusan single-page diperluas  |

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

_Diisi saat sub-tahap dikerjakan._
