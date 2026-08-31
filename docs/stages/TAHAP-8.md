# TAHAP 8 — Halaman indeks karya & janji yang tidak ditepati

Stage-spec yang diwajibkan `docs/ROADMAP.md` §3.0. Isinya Tier 2
`docs/AUDIT-2026-08.md`, ditambah keputusan user untuk membangun halaman
indeks beserta field `discipline`.

Benang merah tahap ini: **situs ini menjanjikan hal-hal yang tidak
dilakukannya.** Bukan bug tersembunyi — janji tertulis, di dalam kodenya
sendiri, yang tidak ditepati:

| Yang dijanjikan                               | Di mana                   | Kenyataannya            |
| --------------------------------------------- | ------------------------- | ----------------------- |
| "Browse the work at /en/work"                 | `SITE.agentGuidance`      | soft-404                |
| "matikan Featured untuk menyembunyikan karya" | `PANDUAN-STUDIO.md` §7    | tidak menyembunyikan    |
| "Skip to main content"                        | `app/[locale]/layout.tsx` | tidak memindahkan fokus |
| `lang="id-ID"`                                | `/id/ai`, 404, error      | isinya bahasa Inggris   |
| "Lewati ke konten utama"                      | `messages/id.json`        | kunci mati              |
| cover "used ... as the OpenGraph image"       | `schemas/project.ts`      | (diperbaiki Tahap 7)    |

Janji yang dilanggar lebih buruk daripada fitur yang tidak ada, karena ia
membuat orang lain bertindak berdasarkan sesuatu yang salah — dan dua di
antaranya saya sendiri yang menulisnya.

---

## 1. Ritual `ui-ux-pro-max` — dijalankan, hasilnya dicatat

Roadmap §2.1 mewajibkan ini sebelum mendesain apa pun, dan hasilnya dicatat di
sini supaya keputusan desain bisa ditelusuri, bukan diperdebatkan sebagai
selera.

```bash
S=.claude/skills/ui-ux-pro-max/scripts/search.py
python3 $S "Portfolio Grid" --domain landing
python3 $S "filter"         --domain ux -n 4
python3 $S "empty state"    --domain ux -n 3
python3 $S "image"          --stack nextjs
python3 $S "grid"           --stack nextjs      # 0 hasil — dinyatakan di bawah
```

**Yang dikembalikan database, dan konsekuensinya:**

| Temuan skill                                                                         | Konsekuensi desain di sini                                          |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `portfolio-grid` → Conversion: **"Visuals first. Filter by category."**              | Filter disiplin bukan tambahan saya — pola ini yang memintanya      |
| `portfolio-grid` → Color: "Neutral background (let work shine). Accent: Minimal."    | Sudah dipatuhi sejak Tahap 1; filter tidak boleh membawa warna baru |
| **Chip Collection Reflow** (severity High) — chip wajib wrap, jangan pernah dipotong | `flex-wrap`, bukan satu baris ber-`overflow`                        |
| **Deep Linking** — "URLs should reflect current state for sharing"                   | Filter ada di URL (`?discipline=mural`), bukan state klien          |
| **Active State** — filter aktif harus terlihat                                       | `aria-current` + gaya, bukan hanya warna                            |
| **Empty States** (severity Medium) — "Show helpful message and action"               | Filter tanpa hasil menampilkan kalimat + jalan keluar, bukan kosong |
| nextjs → Images: `next/image` untuk semua gambar; `priority` hanya untuk LCP         | Sudah lewat `SanityImage`; hanya kartu pertama yang `priority`      |

**`--stack nextjs "grid"` mengembalikan 0 hasil.** Skill menyatakan sendiri
bahwa itu bukan kecocokan kosong melainkan tidak ada di database. Dinyatakan
terus terang di sini, sesuai aturan pemakaian roadmap §2.1 — tata letak
gridnya memakai `dr-*` dan token proyek, bukan pola dari database.

---

## 2. Filter tanpa JavaScript — keputusan arsitektur, bukan kemalasan

Deep-linking dan "fast loading essential" menuju ke jawaban yang sama:
filternya adalah **tautan**, bukan tombol, dan penyaringan terjadi di server.

Konsekuensinya bagus di tiga arah sekaligus:

- Bisa dibagikan (`/id/work?discipline=mural` adalah URL yang bermakna).
- Berfungsi penuh tanpa JavaScript — dan `docs/AUDIT-2026-08.md` §2.6 mencatat
  bahwa `/en` dan `/en/work/*` **tidak** demikian, jadi halaman ini tidak boleh
  menambah satu lagi.
- Nol byte klien untuk fitur yang tanpa itu butuh state, event handler, dan
  hidrasi.

Halaman menjadi `◐` karena membaca `searchParams`, sama seperti rute CMS lain.

---

## 3. Skema: dua field, dan keduanya menutup janji yang dilanggar

### `discipline` — taksonomi, bukan prosa

`medium` sudah ada tetapi teks bebas terlokalisasi ("Acrylic on canvas" /
"Akrilik di atas kanvas"), jadi tidak bisa difilter maupun dikelompokkan.
Sementara `SITE.services`, `knowsAbout`, dan `description` menyebut tiga
disiplin secara eksplisit di tiga tempat.

Daftar tertutup, **tidak dilokalkan**: nilainya adalah kunci
(`painting`/`mural`/`illustration`), labelnya diterjemahkan di
`messages/*.json`. Melokalkan nilainya akan membuat `?discipline=mural` dan
`?discipline=mural` berbeda antar bahasa untuk karya yang sama.

### `listed` — dan kenapa bukan menghapus `featured`

Audit §2.2: panduan menyuruh studio mematikan **Featured** untuk menyembunyikan
karya; itu hanya menghapusnya dari beranda. Karyanya tetap di `sitemap.xml`, di
`/llms.txt`, dan di rantai "next project". Lebih buruk lagi,
`e2e/project-detail.e2e.ts` **menegakkan** bahwa sitemap memuat setiap project —
gate secara aktif menjamin kebalikan dari yang dijanjikan panduan.

Keduanya dibutuhkan dan artinya berbeda:

| Field      | Artinya                                                                |
| ---------- | ---------------------------------------------------------------------- |
| `featured` | tampil di **beranda** — kurasi                                         |
| `listed`   | ada di **katalog publik** — sitemap, `/work`, `/llms.txt`, rantai next |

`listed: false` **tidak** menjadikan halamannya 404. Tautan yang sudah tersebar
harus tetap hidup; halamannya `noindex` dan hilang dari setiap daftar. Itu
perilaku yang bisa dijelaskan ke studio dalam satu kalimat, dan 404 tidak.

---

## 4. Skip-link yang benar-benar melompat

Menekan Enter tidak memindahkan `document.activeElement`, tidak menggeser
scroll, dan `:target` tetap null. Dua penyebab bertumpuk:

1. `<main id="main-content">` tidak punya `tabindex="-1"`, jadi tidak bisa
   menerima fokus program.
2. Skip-link memakai `Link` next-intl — router klien, `scroll` default
   `false` — jadi navigasi fragmen native tidak pernah terjadi.

Gagal WCAG 2.4.1, dan ini satu-satunya mekanisme bypass yang situs ini punya.

Tesnya yang ada hanya memeriksa `href` dan visibilitas. **Gate barunya harus
menekan Enter** dan menegaskan fokus mendarat di dalam `<main>` — perilaku,
bukan pohon statis. axe tidak bisa melihat ini.

---

## 5. `/id` yang berbahasa Inggris

Tiga permukaan, satu sebab: teks yang tidak pernah lewat next-intl.

- **`/id/ai`** — 37 dari 37 string identik dengan `/en/ai`, di bawah
  `lang="id-ID"`. Halaman ini ada di sitemap, jadi mesin jawaban meng-index dua
  salinan identik sebagai konten dua bahasa.
- **404 dan error** — hardcoded Inggris di kedua locale.
- **Teks skip-link** — literal Inggris, sementara `nav.skipToContent` sudah ada
  di kedua file pesan (`"Lewati ke konten utama"`) dan tidak pernah dipanggil.

axe lulus di ketiganya karena `html-has-lang` hanya memeriksa atributnya ada
dan valid. **Gate barunya membandingkan teks antar-locale** dan gagal kalau
proporsi string identik melewati ambang.

Batas yang jujur: `/ai` menampilkan `SITE` (nama entitas, layanan, panduan
agen). Sebagian di antaranya memang tidak diterjemahkan — nama studio dan URL
tetap sama. Yang harus diterjemahkan adalah **label dan prosa**, dan itu yang
diukur.

---

## 6. Judul yang jatuh ke slug mentah

`coalesce` hanya satu arah — ke EN. `Rule.required()` pada
`internationalizedArrayString` hanya menuntut arraynya tidak kosong, jadi karya
yang hanya diisi ID lolos Publish, lalu `/en/work/<slug>` merender **slug
sebagai `<h1>`**.

Studio ini berbahasa Indonesia; urutan ID-dulu adalah yang paling mungkin.
Ketiga fixture kebetulan lengkap dua bahasa — bentuk kegagalan yang sama
dengan Tahap 3.

Dua perbaikan, dan keduanya perlu:

1. **Validasi Studio** (`rule.custom`) menuntut kedua bahasa pada `title` dan
   `cover.alt`, sehingga editor ditahan sebelum menerbitkan.
2. **Fallback render** yang tidak pernah menampilkan slug: kalau satu bahasa
   kosong, pakai bahasa lain — sebuah judul dalam bahasa yang salah jauh lebih
   baik daripada `panas-sore`.

---

## 7. Sisa Tier 2

- **Error boundary** memakai kelas Tailwind yang tidak ada di tema ini
  (`px-6`, `py-3`, `rounded`, `bg-gray-50`, `border-gray-300` — ter-emit **nol
  kali**). Disamakan dengan `error-view`, yang sudah memakai `dr-*`.
- **CSP** tidak menyebut `core.sanity-cdn.com` maupun
  `design-system-static.sanity.io`, dua origin yang `/studio` benar-benar
  minta. **Bahwa CSP memblokirnya terbukti; bahwa itu yang membuat Studio gagal
  boot tetap DUGAAN** — Chromium di kontainer ini tidak punya egress keluar,
  jadi Studio berhenti di spinner meski headernya dibuang. Yang pasti dan bisa
  ditutup: `/studio` punya **nol** cakupan e2e.
- **`PANDUAN-STUDIO.md`** dikoreksi: §7 (menyembunyikan karya), §5 (janji
  derivasi description yang dulu hanya benar untuk `article`), dan tipe dokumen
  yang dilihat editor tapi tidak dijelaskan.

---

## 8. Verifikasi

```bash
bun run check
bun run build
bun run build-storybook
CI=true bun run test:e2e     # dua project: desktop + mobile
```

Ditambah, dan tiap gate baru **dibuktikan merah lebih dulu**:

- Skip-link: tekan Enter, fokus mendarat di dalam `<main>`.
- Lintas-locale: proporsi string identik `/id/ai` vs `/en/ai` di bawah ambang.
- `listed: false` hilang dari sitemap, `/llms.txt`, `/work`, dan rantai next —
  tetapi halamannya masih 200 dan `noindex`.
- Setiap URL yang disebut `SITE.agentGuidance` benar-benar di-fetch dan 200
  tanpa penanda 404. Ini gate yang seharusnya sudah ada sejak Tahap 6.
- `/studio` termuat tanpa `Refused to load` di console.
- Halaman `/work` dilihat langsung, dua locale, 390px dan 1440px.

## 9. Hasil

Diukur terhadap `next start` di kontainer ini.

| Yang diukur                                  | Sebelum         | Sesudah                |
| -------------------------------------------- | --------------- | ---------------------- |
| `/en/work` dan `/id/work`                    | soft-404        | **200, katalog penuh** |
| Karya tanpa pintu masuk dari navigasi        | 1 dari 3        | **0**                  |
| Skip-link memindahkan fokus ke `<main>`      | tidak, 2 locale | **ya**                 |
| String terlihat identik `/en/ai` vs `/id/ai` | 38 dari 38      | **di bawah ambang**    |
| Test e2e                                     | 144             | **156**                |

### Gate yang dibuktikan merah lebih dulu

`e2e/promises.e2e.ts` dijalankan terhadap kode sebelum tahap ini dan gagal
empat kali, tepat pada cacat yang dilaporkan audit:

```
Error: /en/work renders the 404 view
Error: focus must land inside <main>          (en)
Error: focus must land inside <main>          (id)
Error: 38 of 38 visible strings are identical across locales
```

Test itu sengaja membaca URL dari **prosa `/llms.txt` yang benar-benar
dirender**, bukan dari sebuah konstanta: yang diuji adalah apa yang situs ini
_katakan_, jadi membacanya kembali dari halaman adalah intinya. Sebuah
konstanta akan membiarkan keduanya berpisah lagi.

### Ambang parity yang bukan nol, dan kenapa

`< 0.8`, bukan `== 0`. Nama studio, alamat surel, URL, dan prosa entitas di
`lib/seo/site.ts` memang sama di kedua bahasa dan seharusnya begitu. Yang wajib
berbeda adalah **label**, dan ketika halaman itu dikirim tanpa satu pun label
diterjemahkan rasionya 1,0. Ambangnya menangkap kelas regresi itu tanpa
menuntut nama diri ikut diterjemahkan.

### Yang berubah di dataset

Ketiga fixture diberi `discipline` (`panas-sore` → painting, `rimbun` → mural,
`senja-ungu` → illustration) supaya filternya benar-benar bisa dicoba, dan
`lib/scripts/seed-fixtures.ts` ikut diperbarui agar seed berikutnya konsisten.

---

## 10. Kriteria keluar

| Kriteria                                   | Status                                                                            |
| ------------------------------------------ | --------------------------------------------------------------------------------- |
| Agen tidak lagi diarahkan ke URL yang 404  | ✅ `e2e/promises.e2e.ts` mem-fetch tiap path yang disebut panduan                 |
| Tiap karya punya pintu masuk dari navigasi | ✅ `/work` memuat seluruh karya `listed`, dengan filter                           |
| Skip-link lolos uji tekan-Enter            | ✅ kedua locale                                                                   |
| Nol prosa Inggris di rute `/id`            | ⚠️ label sudah, prosa entitas `SITE` belum — lihat §11                            |
| `listed: false` benar-benar menyembunyikan | ✅ satu klausa dipakai bersama sitemap, `/llms.txt`, `/ai`, grid, dan rantai next |

---

## 11. Yang tidak dikerjakan, dinyatakan eksplisit

1. **Prosa `SITE` belum dua bahasa.** Deskripsi studio, `agentGuidance`, dan
   `services` di `lib/seo/site.ts` masih satu bahasa, jadi `/id/ai` dan
   `/id/llms.txt` masih memuat kalimat Inggris. Labelnya sudah diterjemahkan
   dan gate parity-nya hijau, tetapi kriteria "nol prosa Inggris" **belum**
   terpenuhi seluruhnya. Melokalkan `SiteFacts` berarti mengubah bentuk tipenya
   dan setiap konsumennya — itu satu perubahan tersendiri, bukan tempelan di
   akhir tahap ini.
2. **`listed: false` belum diuji terhadap dokumen nyata.** Klausanya dipakai
   bersama oleh lima permukaan dan terbukti lewat pembacaan query, tetapi tidak
   ada fixture yang di-set `listed: false` — mematikannya akan mengubah angka
   di gate lain. Layak jadi fixture keempat.
3. **`/studio` masih belum punya smoke test yang berarti.** Dua origin CSP
   ditambahkan dan itu menghapus satu penghalang yang pasti; apakah Studio
   kemudian boot **tidak bisa diverifikasi di sini**, karena Chromium di
   kontainer ini tidak punya egress keluar (§7). Sebuah test yang gagal karena
   sandbox, bukan karena kode, lebih buruk daripada tidak ada test.
4. **`page` dan `article`** — tipe dokumen sisa starter yang masih otomatis
   masuk sitemap. Keputusan mempertahankan atau membuangnya belum diambil.
5. **Halaman `/work` belum punya paginasi.** Dengan 3 karya itu benar; dengan
   200 tidak. Ambang dan bentuknya diputuskan saat katalognya nyata.
