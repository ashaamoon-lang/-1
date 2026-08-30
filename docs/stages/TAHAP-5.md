# TAHAP 5 — Poles & performa

Stage-spec yang diwajibkan `docs/ROADMAP.md` §3.0. Berbeda dari tahap lain,
dokumen ini ditulis **setelah pengukuran pertama**, bukan sebelumnya: audit
yang rencananya disusun sebelum ada angka hanya akan menebak apa yang perlu
diaudit.

---

## 0. Apa yang benar-benar bisa diukur di sini

Roadmap sudah menyiapkan syarat kejujurannya:

> _"Kalau `chrome-devtools-mcp` belum terpasang, tahap ini menghasilkan
> anggaran dan temuan struktural, bukan angka terukur."_

`chrome-devtools-mcp` memang tidak terpasang — tetapi **Chromium dan Playwright
ada**, dan sudah dipakai sejak Tahap 2 untuk axe dan screenshot. Jadi
posisinya lebih baik daripada yang diperkirakan roadmap, dan batasnya perlu
dinyatakan tepat:

| Bisa diukur di sini                             | Tidak bisa                                    |
| ----------------------------------------------- | --------------------------------------------- |
| LCP, CLS lewat `PerformanceObserver` di halaman | Data lapangan (CrUX), perangkat nyata         |
| Byte per jenis sumber daya, per rute            | Latensi jaringan nyata — server ini localhost |
| Jumlah `<script src>`, isi tiap chunk           | Skor Lighthouse                               |
| Lebar gambar yang diminta vs yang dirender      | Waktu CPU pada ponsel kelas bawah             |
| Urutan fokus keyboard, indikator fokus          |                                               |

**Setiap angka di bawah ini diukur** terhadap `next start` di kontainer ini,
Chromium, viewport 1440×900. Bukan data lapangan, bukan profil perangkat.

---

## 1. Hasil: sebelum dan sesudah

Semua diukur, dua kali, dengan cara yang sama.

| Rute              | Total sebelum | Total sesudah | Script sebelum | Script sesudah |
| ----------------- | ------------- | ------------- | -------------- | -------------- |
| `/en`             | 679 KB        | 675 KB        | 32             | 31             |
| `/en/work/<slug>` | 705 KB        | 649 KB        | 34             | 29             |
| `/en/ai`          | 621 KB        | **327 KB**    | 28             | **21**         |

| Rute              | LCP sebelum | LCP sesudah | CLS sebelum | CLS sesudah |
| ----------------- | ----------- | ----------- | ----------- | ----------- |
| `/en`             | 164 ms      | 144 ms      | 0           | 0           |
| `/en/work/<slug>` | 816 ms      | **216 ms**  | **0.226**   | **0**       |
| `/en/ai`          | 68 ms       | 88 ms       | 0           | 0           |

---

## 2. CLS 0.226 — dan klaim Tahap 4 yang salah

Kriteria keluar Tahap 4 berbunyi _"nol pergeseran layout dari gambar galeri"_
dan saya menandainya ✅. **Itu salah.** Saya menalar tentang kotak yang
dipesan, bukan mengukur CLS. Angkanya 0.226 — gagal Core Web Vitals (baik ≤
0.1).

Satu pergeseran pada 127 ms memindahkan daftar meta, badan teks, galeri, dan
blok proyek-berikutnya sekaligus: tinggi sampul berubah saat gambarnya termuat.

Penyebabnya `max-height` pada elemen tergantikan (`<img>`) dengan `width:
auto`. Peramban memesan kotak setinggi intrinsiknya lebih dulu dan baru
menyusutkan lebarnya setelah berkasnya tiba.

**Dua percobaan perbaikan, keduanya diukur:**

| Percobaan                                       | CLS   |
| ----------------------------------------------- | ----- |
| `max-height` pada gambar saja (keadaan awal)    | 0.226 |
| `aspect-ratio` + `width: fit-content`           | 0.174 |
| `aspect-ratio` + `max-width: calc(cap × ratio)` | **0** |

Yang berhasil: menghitung kotaknya, bukan mengukurnya dari gambar. Rasio aset
disandikan Sanity di dalam referensinya sendiri
(`image-<hash>-1600x2000-jpg`), jadi `aspectRatioFor()` membacanya tanpa
jaringan, dan `max-width: calc(78svh * var(--ratio))` mengubah batas tinggi
menjadi batas lebar. Kotaknya pasti sebelum satu byte gambar pun tiba.

---

## 3. three.js dikirim ke halaman teks

Diukur pada `/en/ai` — halaman teks statis, tanpa gambar, tanpa interaksi:

```
859 KB  three, react-three-fiber
 72 KB  three (chunk kedua)
 69 KB  gsap
 67 KB  sanity client
```

Sebabnya `lib/features` memasang `<LazyWebGLCanvas root />` **tanpa syarat**,
dan layout memasang `<OptionalFeatures gsap />` — keduanya di layout bersama,
jadi masuk ke graf setiap halaman.

Padahal hanya **satu** bagian dari **satu** halaman memakai keduanya: hero
beranda (`SceneShell` untuk kanvas, `TextReveal` untuk GSAP).

Perbaikannya mengikuti pola yang sudah ada di repo — `gsap` di
`OptionalFeatures` sudah opt-in sejak awal, kanvasnya tidak. Sekarang keduanya
opt-in, dan beranda meminta keduanya lewat `<Wrapper webgl gsap>`.

Hasil: `/en/ai` turun **621 KB → 327 KB** (−47%), chunk terbesarnya dari 226 KB
menjadi 69 KB.

Perbandingan `TEARDOWN.md` §7 (Bruno Simon 2 skrip, Iventions 36): kita di
**21–31**, dari 28–34.

### Yang tersisa, dan kenapa dibiarkan

`/en/work/<slug>` masih memuat chunk three 226 KB — tetapi **setelah**
DOMContentLoaded. Diukur terpisah: biaya halaman itu sendiri **225 KB**, dan
chunk three datang sebagai _prefetch_ rute beranda (wordmark di header
menunjuk ke `/`). `components/ui/link` sudah menggerbangnya di balik
`effectiveType === '4g' && !saveData`. Itu keputusan navigasi-instan yang
disengaja, bukan biaya halaman.

---

## 4. Pipeline gambar: tiga cacat

Diukur dengan membandingkan ukuran render dan ukuran aset yang diminta.

**4.1 Sampul proyek `loading="lazy"`.** Sampul adalah elemen LCP halaman itu,
dan satu-satunya gambar yang tidak boleh menunggu giliran. LCP 816 ms.
Sekarang `preload`. LCP **216 ms**.

**4.2 Tidak ada gambar yang menyetel `fetchpriority`.** Termasuk LCP-nya.

**4.3 Over-fetch hingga 3×.** Gambar galeri yang dirender 562 px lebar meminta
aset 1440 px, karena `SanityImage` menurunkan `sizes` dari `maxWidth` saja —
`(max-width: 1440px) 100vw, 1440px` — dan tidak tahu apa-apa tentang tata letak
yang membatasinya.

Sulitnya: dengan tinggi dibatasi, lebar render bergantung pada rasio aset, jadi
`sizes` dalam vw tidak bisa menyatakannya. Tapi rasionya **diketahui saat
render**, jadi bisa dinyatakan persis:

```
sizes="(max-width: 800px) 100vw, min(92vw, 62.4vh)"
```

`min()` adalah fungsi matematika CSS yang atribut `sizes` terima.
`cappedImageSizes()` menghitungnya, dan diuji unit.

Sesudahnya, setiap gambar mengambil persis piksel yang direndernya:

| Dirender  | Natural   | Diminta |
| --------- | --------- | ------- |
| 562 × 702 | 561 × 701 | w=640   |
| 936 × 702 | 936 × 702 | w=1080  |
| 459 × 344 | 475 × 297 | w=640   |

**4.4 Ditemukan saat memperbaiki 4.3: sampul dipotong.** Karena `.media`
adalah blok dengan `width: auto`, ia memenuhi gutter, rasio memintanya lebih
tinggi dari batas, dan `object-fit: cover` memangkas selisihnya — lukisan
potret ditampilkan pita tengahnya saja, 1398×702 alih-alih 562×702. Potongan
yang tidak pernah dibuat studionya. Diperbaiki oleh solusi §2 yang sama.

---

## 5. State loading merender kotak 0×0

Diukur: tiga bilah skeleton berukuran **0×0**. Yang terlihat hanyalah teks
`sr-only`.

`app/[locale]/loading.tsx` ditulis dengan `gap-3`, `w-40`, `space-y-2`, `h-2`,
`animate-pulse`. Tidak satu pun ada: `tailwind.css` mereset `--spacing-*` dan
`--color-*` ke `initial`, jadi skala bawaan Tailwind tidak pernah ada di
proyek ini, dan tidak ada token animasi yang didefinisikan.

Ini kelas cacat yang sama dengan `error-view` di Tahap 2 §8 — dan lebih mahal:
di bawah Cache Components, fallback inilah yang dilihat pembaca selama halaman
CMS di-stream, **dan satu-satunya hal yang dilihat pengunjung tanpa
JavaScript** (lihat Tahap 4 §9.6). Layar kosong.

Ditulis ulang sebagai CSS module. Sesudahnya bilahnya 160×2, 120×2, 80×2 —
terlihat, dan `animation: none` di bawah reduced motion.

`error-view` dan `not-found-view` juga belum pernah punya story, yang persis
sebabnya cacat serupa bisa bertahan lama di sana. Keduanya sekarang punya, jadi
keduanya lewat gate axe Storybook.

---

## 6. Sapuan fokus keyboard

axe tidak bisa melakukannya: ia memeriksa pohon statis dan tidak mengatakan
apa pun tentang apa yang terjadi saat seseorang menekan Tab.

`e2e/keyboard-focus.e2e.ts` menekan Tab sampai 40 kali di tiap rute dan
menolak tiga kegagalan yang benar-benar menyesatkan pengguna keyboard: fokus
tanpa indikator terlihat, fokus di luar viewport, dan fokus masuk ke kontrol
yang disembunyikan tata letak.

**Diverifikasi bahwa test-nya menggigit:** dengan `outline: none` dipasang
sementara pada `*:focus-visible`, test gagal dan menyebut tiap tautannya.
Test yang tidak bisa gagal adalah hiasan.

Hasil saat ini: bersih di ketiga rute, dan skip link adalah perhentian pertama
serta terlihat begitu difokuskan.

---

## 7. Kriteria keluar — status

| Kriteria                            | Status                                         |
| ----------------------------------- | ---------------------------------------------- |
| Audit pipeline gambar               | ✅ 4 cacat ditemukan dan diperbaiki            |
| Audit jumlah script                 | ✅ 28–34 → 21–31; `/en/ai` −47% byte           |
| Lewati state loading & error        | ✅ loading ditulis ulang; keduanya punya story |
| Cek fokus keyboard menyeluruh       | ✅ e2e baru, diverifikasi bisa gagal           |
| `bun run check`                     | ✅ 373 test                                    |
| `bun run build` · `build-storybook` | ✅                                             |
| `CI=true bun run test:e2e`          | ✅ 120 lulus                                   |

## 8. Yang tidak dikerjakan, dinyatakan eksplisit

- **Tidak ada data lapangan.** Semua angka dari kontainer ini, tanpa latensi
  jaringan, pada satu viewport desktop. LCP 216 ms di sini tidak berarti 216 ms
  di ponsel dengan jaringan 4G.
- **Tidak ada skor Lighthouse.** `bunx @unlighthouse/cli` ada di
  `package.json`, tapi belum dijalankan.
- **Chunk three 226 KB masih di-prefetch** dari halaman proyek. Itu keputusan
  navigasi-instan, bukan kelalaian — tapi kalau nanti diputuskan terlalu mahal,
  matikan `prefetch` pada wordmark header.
- **Fixture masih hidup** di dataset. Hapus dengan
  `bun --env-file .env.local lib/scripts/seed-fixtures.ts --clean`.
