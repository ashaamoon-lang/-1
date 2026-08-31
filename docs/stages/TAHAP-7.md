# TAHAP 7 — Cacat yang dilihat pengunjung

Stage-spec yang diwajibkan `docs/ROADMAP.md` §3.0. Isinya adalah Tier 1
`docs/AUDIT-2026-08.md` ditambah satu temuan Tier 3 yang menutupinya.

Tahap ini punya bentuk berbeda dari Tahap 1–6. Tahap-tahap itu membangun
sesuatu. Tahap ini **memperbaiki hal yang sudah dinyatakan selesai** — empat
kriteria keluar yang ditandai ✅ dan ternyata tidak benar. Jadi aturan
utamanya bukan "perbaiki", melainkan:

> **Tidak ada perbaikan yang di-commit tanpa gate yang gagal sebelum
> perbaikan itu ada.**

Setiap sub-bagian di bawah menuliskan gate-nya lebih dulu, lalu
perbaikannya — dan kewajiban membuktikan gate itu benar-benar merah dulu.

---

## 0. Kenapa urutannya begini

Auditnya menemukan tiga lubang gate. Salah satunya, **tidak ada viewport
ponsel di seluruh suite e2e**, harus ditutup **pertama** — bukan karena
paling parah, tapi karena §1 tidak bisa diverifikasi tanpanya. Dua lubang
lain (`axe` tanpa tag WCAG 2.2, dan tidak adanya gate byte-per-rute) ditutup
berbarengan dengan cacat yang mereka lewatkan.

Sisa lubang gate — lint CSS dan sapuan header respons — sengaja ditunda ke
Tahap 9. Keduanya menangkap cacat Tier 3/4, bukan Tier 1, dan menumpuknya di
sini akan membuat satu commit yang tidak bisa direview.

---

## 1. Viewport ponsel — prasyarat, bukan fitur

`playwright.config.ts:16-23` mendefinisikan satu project: chromium 1280×720.
Konsekuensinya bukan "cakupan kurang"; konsekuensinya adalah **seluruh kelas
cacat responsif secara struktural tidak terlihat**, dan situs studio komisi
kemungkinan besar menerima mayoritas trafiknya dari ponsel.

**Gate:** project Playwright kedua di 390×844 (dpr 3, `hasTouch`), menjalankan
minimal `route-sweep` dan sapuan axe.

Satu peringatan yang sudah terbukti dan harus ditulis di sini supaya tidak
diulang: **cek `scrollWidth > clientWidth` tidak cukup.** `overflow: clip`
pada hero menyembunyikan luberan dari metrik dokumen — auditnya mengukur
`scrollWidth === clientWidth` **sementara teksnya terpotong**. Gate-nya harus
per-elemen:

```
el.getBoundingClientRect().right > parentnya.right
```

di beberapa lebar × kedua locale.

---

## 2. `<h1>` `/id` terpotong di setiap lebar ≤768px

`overflow-wrap: break-word` **tidak** mengurangi kontribusi min-content sebuah
elemen; hanya `anywhere` yang begitu. Jadi kotak `<h1>` dipaksa selebar kata
terpanjang ("memperhatikan"), melewati tepi viewport, lalu dipotong diam-diam.

Diukur: `/id` luber di 320, 360, 375, 390, 414, 430, dan 768; `/en` aman di
semuanya. Isolasinya satu properti — mengganti ke `anywhere` menghasilkan
`w=356.8` yang pas persis ke kolomnya.

**Perbaikan:** `overflow-wrap: anywhere` di `.headline`.

Komentar di `hero.module.css:87-92` menyebut jaring ini "should never fire".
Kalimat itu harus dikoreksi, bukan dihapus: jaringnya memang tidak pernah bisa
menyala, dan alasannya layak dicatat supaya properti yang benar tidak diganti
balik oleh orang berikutnya.

---

## 3. Lukisan di-upscale di layar retina dan ponsel

`SanityImage` memanggil `urlForImage(image).width(maxWidth)` **dan**
`sizes: (max-width: ${maxWidth}px) 100vw, ${maxWidth}px` dari nilai yang sama.
Satu angka memikul dua peran yang berbeda: plafon piksel yang di-fetch dari
Sanity, dan lebar layout yang diumumkan ke browser.

Akibatnya di DPR ≥ 2 browser meminta kandidat `w=1920`/`w=2560` tetapi hanya
menerima 704/1440 px — 0,51–0,66× piksel yang dibutuhkan. Plafonnya nyata:
`w=1920`, `w=2048`, dan `w=2560` semuanya mentok di 1440×900, jadi srcset di
atas itu palsu.

Situs yang seluruh proposisinya adalah reproduksi lukisan menampilkan lukisan
itu di setengah resolusi pada MacBook, iPad, dan setiap ponsel modern.

**Perbaikan:** pisahkan dua konsepnya. `.width(maxWidth * MAX_DPR)` untuk
fetch Sanity; `maxWidth` tetap untuk `sizes`.

**Gate — dan bentuknya adalah inti tahap ini.** Metode Tahap 5 memakai
`naturalWidth`, yang pada `<img>` ber-srcset deskriptor `w` adalah nilai
_density-corrected_:

```
naturalWidth = piksel_asli × lebar_sizes ÷ deskriptor
```

Ia mengukur `sizes` terhadap dirinya sendiri dan **selalu** melaporkan "pas".
Diverifikasi: gambar yang sama melaporkan `naturalWidth` 1036 di viewport 1440
dan 921 di 1280, sementara bitmap-nya 1440×900 di keduanya.

Gate barunya harus mengambil piksel asli, bukan nilai terkoreksi:

```js
const bmp = await createImageBitmap(await (await fetch(img.currentSrc)).blob())
bmp.width  vs  rect.width * devicePixelRatio
```

dijalankan di dpr 1 **dan** 2/3. Ini juga alasan kenapa gate lama tidak boleh
sekadar "diperluas": bentuknya salah, bukan cakupannya.

---

## 4. Halaman karya tanpa description, dengan kartu OG generik

`/en/work/rimbun` dikirim tanpa `meta description`, tanpa `og:description`,
dan `og:image`-nya kartu wordmark Arth — bukan lukisannya. Padahal
`schemas/project.ts:68` memberi tahu editor bahwa cover "used in the work grid
**and as the OpenGraph image**".

Penyebabnya: `generateSanityMetadata` menurunkan description dari
`document.excerpt`, dan `excerpt` hanya ada pada `article` — bukan `project`.
`lib/utils/metadata.ts:266-268` juga mengakui sendiri bahwa gambar tidak
diturunkan dari CMS.

**Perbaikan:** proyeksikan teks body dan URL aset cover di `projectQuery`,
lalu teruskan keduanya ke `generateSanityMetadata`. Description diturunkan
dari body dengan `truncateDescription` yang sudah ada.

**Gate:** perluas `e2e/canonical-sweep.e2e.ts` — untuk tiap URL karya di
sitemap, `og:image` harus **bukan** kartu default, dan `og:description` harus
ada. Tahap 6 memperbaiki canonical/`og:url`/`og:locale` di file itu lalu
berhenti; dua tag ini tetangga langsungnya.

---

## 5. three.js dikirim ke setiap pengunjung `/en`

245,6 KB gzip / 931 KB raw sebagai `<script async>` di HTML awal — 47% byte
skrip halaman itu. Diukur: chunk-nya terunduh pada ponsel dan di bawah
`prefers-reduced-motion`, di mana `<canvas>` sama sekali tidak dirender.

Yang dibeli 245 KB itu adalah gradien dua warna plus grain. Jalur
non-WebGL-nya adalah `linear-gradient(135deg, #0d0d0d, #242527)` — desain yang
sama, nol byte — dan itulah yang benar-benar terkirim di HTML SSR.

`dynamic()` di `lib/webgl/components/canvas/index.tsx:27-32` lazy terhadap
**modul**, bukan terhadap `<script>` yang Next emisikan untuk graf klien
halaman. Jadi opt-in per-halaman yang dipasang Tahap 5 memang bekerja untuk
`/en/ai` (yang tidak meminta kanvas sama sekali) tapi tidak untuk `/en`.

**Perbaikan:** `import()` scene-nya hanya **setelah**
`isWebGL && !prefersReducedMotion` terbukti benar di klien.

**Gate:** e2e yang memuat `/en` dengan `reducedMotion: 'reduce'` dan gagal
kalau ada chunk > 100 KB terunduh sementara
`document.querySelectorAll('canvas').length === 0`.

Catatan kejujuran yang harus ikut ke laporan penutup: dampak waktunya **tidak
bisa diukur di kontainer ini** — tidak ada latensi jaringan (TTFB 8–10 ms
adalah localhost) dan tidak ada profiler CPU. Byte-nya terukur; konsekuensi
waktunya adalah penalaran.

---

## 6. `target-size`, dan axe yang tidak pernah menjalankan WCAG 2.2

axe-core 4.13 tidak mengaktifkan aturan WCAG 2.2 secara default. Keempat
pemanggilan di repo ini memakai konfigurasi polos, jadi seluruh level AA 2.2
tidak pernah diuji. Dengan tag lengkap: pengalih bahasa **12,6×14 px**,
severity _serious_, di 10 dari 10 URL, kedua locale, normal maupun `reduce`.

`docs/DESIGN-SYSTEM.md` proyek ini sendiri mensyaratkan ≥44×44 px, jadi ini
melanggar aturan proyek — bukan preferensi.

Yang perlu dinyatakan terus terang: klaim "axe bersih" di roadmap §1.5 **benar
secara harfiah dan menyesatkan secara praktis**. Gate-nya ada dan hijau;
cakupannya yang salah.

**Perbaikan:** `.withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'])`
di keempat call-site, lalu beri `.link` padding blok + `min-height` sehingga
area sentuhnya ≥44×44 px **tanpa membesarkan tipografinya** — ukuran tipenya
adalah keputusan desain Tahap 1 dan tidak diubah di sini.

---

## 7. Verifikasi

Urutan penutup wajib, tanpa dipotong:

```bash
bun run check
bun run build
bun run build-storybook
CI=true bun run test:e2e     # sekarang dua project: desktop + mobile
```

Ditambah yang khusus tahap ini:

- Tiap gate baru dibuktikan **merah dulu** terhadap kode lama, lalu hijau
  setelah perbaikan. Gate yang tidak pernah terlihat gagal tidak diketahui
  bisa gagal — pelajaran `TAHAP-5.md` §6, dan pelajaran `naturalWidth` di §3.
- Screenshot `/en` dan `/id` pada 390×844 dan 1440×900, dilihat langsung.
- Kartu OG sebuah karya dibuka sebagai gambar dan dilihat — bukan hanya dicek
  ada.

## 8. Hasil terukur

Semua diukur di kontainer ini terhadap `next start`, Chromium. Bukan data
lapangan, bukan perangkat nyata, bukan skor Lighthouse.

| Yang diukur                                | Sebelum                    | Sesudah       |
| ------------------------------------------ | -------------------------- | ------------- |
| `<h1>` `/id` luber pada 320–768px          | 7 dari 7 lebar             | **0 dari 7**  |
| Piksel gambar vs yang dibutuhkan (dpr 2–3) | 0,51–0,66×                 | **≥ 1,0×**    |
| `target-size` gagal                        | 10 dari 10 rute × viewport | **0**         |
| three.js diunduh, reduced-motion           | 859,2 KB                   | **0 KB**      |
| three.js diunduh, ponsel 390px             | 859,2 KB                   | **0 KB**      |
| Total chunk `/en`, reduced-motion          | 2038,6 KB                  | **1054,9 KB** |
| Halaman karya dengan `og:image` sendiri    | 0 dari 6                   | **6 dari 6**  |
| Halaman karya dengan description           | 0 dari 6                   | **6 dari 6**  |
| Test e2e                                   | 123                        | **144**       |

Ketika kanvas memang dirender (desktop, motion aktif), three.js tetap diunduh
859 KB — itu benar, dan bukan yang diperbaiki tahap ini.

### Ukuran `h1` mobile: 42 → 38

Diukur ulang untuk **kedua** bahasa, karena aturan yang sudah tertulis di
`typography.ts` hanya pernah diterapkan pada bahasa Inggris:

```
Commissioned    7,97em          memperhatikan   8,59em
kolom @320px    282,7px         plafon token    282,7 / (8,59 × 0,853) = 38,6
```

### Dua temuan yang muncul karena gate-nya diperbaiki

1. **Trigger accordion tidak punya gaya sama sekali.** `index.tsx` merujuk
   `s.button`, dan `.button` tidak pernah didefinisikan di modul CSS-nya —
   jadi `s.button` bernilai `undefined`. Kelas cacat yang sama persis dengan
   `app/[locale]/error.tsx` (audit §2.7): className yang resolve ke nihil,
   dan tidak ada yang gagal.
2. **`transition: height 600ms`** pada body accordion melanggar `CLAUDE.md` #4
   (hanya `transform`/`opacity`). **Sengaja dibiarkan** — primitive ini tidak
   terkirim ke rute mana pun hari ini, dan perbaikannya adalah penulisan ulang
   ke `grid-template-rows`, yaitu perubahan komponen, bukan pekerjaan gate.
   Dicatat di tempatnya dan di audit §Tier 4.

---

## 9. Kriteria keluar

| Kriteria                                                    | Status                                              |
| ----------------------------------------------------------- | --------------------------------------------------- |
| `<h1>` `/id` tidak luber di 320–768px                       | ✅ `e2e/responsive.e2e.ts`, kedua locale, 7 lebar   |
| Gambar ≥ 1,0× piksel yang dibutuhkan di dpr 1 dan 2/3       | ✅ `e2e/image-resolution.e2e.ts`, bitmap asli       |
| Tiap halaman karya punya `og:image` dan description sendiri | ✅ `e2e/canonical-sweep.e2e.ts`, digerakkan sitemap |
| `/en` reduced-motion tidak mengunduh chunk three            | ✅ `e2e/webgl-budget.e2e.ts`, deteksi isi chunk     |
| axe dengan tag WCAG 2.2 bersih di dua viewport              | ✅ 10 rute × 2 viewport, nol pelanggaran            |

Kelima gate **dibuktikan merah lebih dulu** terhadap kode sebelum perbaikan,
lalu hijau sesudahnya. Itu syarat yang ditetapkan §0, dan dua di antaranya
sempat gagal dalam bentuk pertamanya:

- gate luberan dokumen (`scrollWidth`) lolos padahal teksnya terpotong —
  diganti jadi per-elemen;
- gate WebGL berbasis ukuran menandai chunk React dan Next yang sah —
  diganti jadi deteksi isi (`THREE.`/`WebGLRenderer`).

Gate yang bentuknya salah menghasilkan ✅, dan itu lebih berbahaya daripada
tidak ada gate. Tahap ini menemukan dua di antaranya di dalam dirinya sendiri.

---

## 10. Yang tidak dikerjakan, dinyatakan eksplisit

1. **Dampak waktu dari 859 KB yang dihemat tidak diukur.** Kontainer ini tidak
   punya latensi jaringan (TTFB 8–10 ms) maupun profiler CPU. Byte-nya
   terukur; konsekuensi waktunya adalah penalaran.
2. **`fetchpriority="high"` pada elemen LCP** — audit §Tier 4, ditunda ke
   Tahap 9 bersama sisa hygiene performa.
3. **`transition: height` pada accordion** — lihat §8.
4. **Lint CSS dan sapuan header respons** — dua lubang gate yang tersisa,
   ditunda ke Tahap 9 sesuai §0.
5. **Halaman indeks `/work` dan field `discipline`** — keputusan user, masuk
   Tahap 8.
