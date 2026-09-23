# Tahap 90 — Gerbang kanvas yang memutuskan, bukan menebak dari tenggat

> **Status: terkirim.** Spec ditulis lebih dulu sesuai `ROADMAP.md` §3.0;
> dua temuan ditambahkan saat implementasi (§7.4, §7.5), hasilnya di §7.
>
> Menutup utang `HANDOFF.md` §5.1, yang dicatat sejak Tahap 79 sebagai
> _"pekerjaan yang belum dikerjakan, dicatat di sini supaya ia tidak hilang"_.

---

## 1. Pengukuran

### 1.1 Cacat bersamanya

Lima gerbang memutuskan "rute ini punya kanvas" dengan **menunggu kanvas
muncul**, lalu melewatkan dirinya bila tenggatnya habis:

| gerbang                           | tenggat                     | lalu                                     |
| --------------------------------- | --------------------------- | ---------------------------------------- |
| `visual-substance` `readyPlate()` | 2.5 s + 2.2 s tetap         | skip bila tak ada kanvas atau plat aktif |
| `visual-substance:602` footer     | 6 s                         | skip                                     |
| `material-layer:201`, `:249`      | tidak ada — dihitung sekali | skip                                     |
| `material-shape` (Tahap 86)       | 6 s per plat                | plat dilewati diam-diam                  |

Rute yang memang tanpa kanvas dan rute yang kanvasnya terlambat menghasilkan
jawaban yang sama. `visual-substance:602` sudah menulis kelas cacat ini sendiri
di Tahap 52 — _"a test that skips itself when the thing it measures is merely
late reports success either way"_ — dan perbaikannya waktu itu memperpanjang
tenggat, yang hanya memindahkan titik balapannya.

### 1.2 Keputusan situs itu deterministik

`lib/hooks/use-device-detection.ts`: `isWebGL = supportsWebGL && isDesktop` —
WebGL2 dapat dibuat, dan lebar ≥ 800. Kanvas dipasang bila rute memberi `webgl`
ke `<Wrapper>` dan bukan reduced motion. `vault/webgl/material-image` memakai
syarat yang sama (`isWebGL && !prefersReducedMotion`). **Tidak ada syarat
sentuh**: profil ponsel yang viewport-nya dipaksa 1280 memang dimaksudkan
memasang kanvas. Skip `:603 [mobile] /en/work` di CI run 64 dan di Tahap 85
adalah balapan murni.

### 1.3 Berapa lama kanvas benar-benar datang

Build produksi, laptop ini, tiga sampel per rute:

```
                        kanvas            plat material (setelah digulir ke tengah)
desktop 1280            0.95 – 4.8 s      2.2 – 9.3 s
ponsel dipaksa 1280     1.4 – 12.3 s      3.0 – 14.6 s; di /en 2 dari 3 sampel tidak pernah dalam 40 s
```

- Gerbang footer menunggu 6 s; di profil ponsel kanvas `/en` butuh 8–12 s.
- Anggaran uji 30 s: 12 s kanvas + 2.6 s + 2.2 s + dua screenshot 1280×800 pada
  DPR 2.6 — sebab "Test timeout of 30000ms exceeded" yang flaky di CI Tahap 85.
- `material-shape` menunggu 6 s per plat; desktop dingin butuh 9.3 s — sebab
  Arus Balik `/en` tidak pernah ditanya (`TAHAP-86.md` §7.6).

### 1.4 Kenapa "tidak pernah" belum tentu cacat

Plat material hanya menggambar sesudah teksturnya dimuat. Log server pada
regresi Tahap 86 mencatat `upstream image response timed out` dari
`cdn.sanity.io` untuk hampir setiap sampul. Tanpa tekstur, plat **memang tidak
boleh** menggambar, dan `<img>`-nya tetap tampil — perilaku yang benar.

Jadi gerbang tidak cukup mengganti skip dengan gagal: itu menukar flaky-skip
dengan flaky-gagal setiap kali jaringan lambat.

---

## 2. Rancangan: tiga keadaan, bukan dua

| keadaan                           | ditentukan oleh                                                              | gerbang                                       |
| --------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------- |
| **tidak dimaksudkan**             | rute tanpa `data-webgl-root`, tanpa WebGL2, lebar < 800, atau reduced motion | skip, dengan alasan yang menyebut syarat mana |
| **dimaksudkan, gambarnya gagal**  | `<img>` plat sudah selesai tetapi `naturalWidth` 0                           | plat itu dilewati, dengan alasan tertulis     |
| **dimaksudkan, dan tidak datang** | niat terpenuhi, gambar ada, kanvas/plat tidak muncul dalam anggaran          | **gagal**                                     |

- **Niat diumumkan situs**, bukan ditebak gerbang: `<Wrapper webgl>` merender
  `data-webgl-root` pada `<main>` di HTML server. Syarat perangkatnya dibaca
  gerbang dengan pertanyaan yang sama yang diajukan situs.
- **Anggaran diukur**: kanvas 30 s dan plat 30 s — sekitar 2.5× dan 3× angka
  terburuk yang terukur untuk konfigurasi yang dimaksudkan menggambar. Gerbang
  footer mendapat anggaran uji 120 s, karena ia menunggu kanvas di profil ponsel
  dan mengambil dua screenshot besar.
- **Satu modul bantu**, `e2e/webgl-intent.ts`, dipakai kelima titik. Pola yang
  sama dengan `contrast-situ.ts` dan `track-contract.ts`: logika bersama
  diangkat, bukan disalin.

---

## 3. Daftar berkas

| berkas                                                                  | perubahan                                         |
| ----------------------------------------------------------------------- | ------------------------------------------------- |
| `components/layout/wrapper/index.tsx`                                   | `data-webgl-root` pada `<main>` bila `webgl`      |
| `e2e/webgl-intent.ts`                                                   | **baru** — niat, tunggu kanvas, tunggu plat       |
| `e2e/visual-substance.e2e.ts`                                           | `readyPlate()` dan gerbang footer                 |
| `e2e/material-layer.e2e.ts`                                             | dua titik skip                                    |
| `e2e/material-shape.e2e.ts`                                             | plat yang terlambat tidak lagi dilewati diam-diam |
| `docs/HANDOFF.md`                                                       | §5.1 ditutup, dengan angkanya                     |
| `docs/stages/TAHAP-90.md`, `ROADMAP.md`, `docs/stages/TAHAP-89.md` (CI) | posisi dan catatan                                |
| `e2e/vocabulary.e2e.ts`                                                 | **ditambahkan saat implementasi** — §7.5          |
| `docs/stages/TAHAP-89.md` §6.5                                          | koreksi atas sapuan tahap itu — §7.5              |

---

## 4. Kriteria keluar

1. **Bukti merah yang benar-benar menguji perubahan**: dengan chunk three.js
   diblokir di jaringan — kanvas yang dimaksudkan tidak pernah datang — gerbang
   lama **melewatkan dirinya** (melaporkan sukses) dan gerbang baru **gagal**.
2. Pada build yang sehat, gerbang yang dulu melewatkan dirinya kini **berjalan
   dan lulus** di kedua proyek; jumlah skip turun, dan setiap skip yang tersisa
   membawa alasan niat.
3. Skip yang sah tetap: rute tanpa WebGL (jurnal) dan pembatasan material ke
   desktop (TAHAP-21 §6.3).
4. `bun run check` hijau; build hijau.

---

## 5. Risiko

| #   | risiko                                                   | penangkal                                                                                  |
| --- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| R1  | Kegagalan jaringan ke CDN Sanity menjadi merah           | Keadaan kedua §2: gambar yang gagal dilewati dengan alasan, bukan digagalkan               |
| R2  | Profil ponsel dipaksa 1280 terlalu lambat untuk anggaran | Anggaran 120 s untuk gerbang footer; diukur di mesin ini, yang lebih lambat dari runner CI |
| R3  | Atribut baru mengubah markup yang digerbangi             | Satu atribut data pada `<main>`; tidak ada gaya yang membacanya                            |

---

## 6. Yang tidak dikerjakan, dinyatakan eksplisit

- **Kenapa plat `/en` di profil ponsel tidak menggambar dalam 40 s di 2 dari 3
  sampel** tidak dibuktikan; §1.4 adalah kandidat yang didukung log server,
  bukan hasil pengukuran langsung atas sampel itu.
- **Profil ponsel yang dipaksa 1280 dipertahankan.** Ia mendekati tablet
  lanskap nyata (lebar desktop, sentuh, DPR tinggi), jadi ia tidak dihapus demi
  kecepatan suite.
- **Nol angka performa diklaim** — `CLAUDE.md` #19.

---

## 7. Hasil

### 7.1 Bukti merah: kanvas yang dimaksudkan, tidak pernah datang

Chunk three.js (`3z--vd5cxp520.js`, 858 KB) digagalkan lewat `page.route` di
salinan sementara berkas gerbang yang asli. WebGL2 tetap tersedia, jadi niatnya
utuh; hanya kedatangannya yang hilang.

```
                                 gerbang lama       gerbang baru
/en footer                       skip               GAGAL  "WebGL was intended here … no canvas arrived in 30s"
the plate is not frozen          skip               GAGAL  sama
the keyboard reaches COMMIT      —                  GAGAL  sama
COMMIT hands the plate back      —                  GAGAL  sama
/en/journal footer               —                  skip   "this route mounts no WebGL root"
```

### 7.2 Build sehat: dari skip tersembunyi ke lulus

Tiga spec — `visual-substance`, `material-layer`, `material-shape` —
`--workers=1`:

```
gerbang lama, desktop            28 lulus · 4 gagal · 7 skip
gerbang baru, desktop + mobile   57 lulus · 2 gagal · 14 skip   (0 timeout di log server)
```

- **Skip tersembunyi di build sehat**: gerbang lama melewatkan
  `material-layer` "the keyboard reaches COMMIT too" di desktop. Gerbang baru
  menjalankannya, dan ia **lulus**.
- Keempat belas skip yang tersisa semuanya membawa alasan niat: rute tanpa
  WebGL (jurnal, studio, tiga praktik) di kedua proyek, dan pembatasan material
  ke desktop di proyek mobile (TAHAP-21 §6.3).
- Dua yang gagal dibaca di §7.4 — keduanya bukan kanvas.

### 7.3 Dua kesalahan rancangan saya, ditemukan oleh run pertama

1. **Tunggu di dalam anggaran yang lebih pendek darinya.** `waitForPlate`
   menunggu hingga 30 s di dalam uji ber-anggaran 30 s, sehingga batas waktu
   uji yang terpicu, dan pesan yang jelas tidak pernah tampil. Kini setiap uji
   yang menunggu memakai `WEBGL_TEST_BUDGET_MS` (120 s), dipasang di dalam
   helper supaya tidak ada pemanggil yang lupa. Bukti merah dijalankan ulang:
   keempatnya gagal dengan pesan niat, bukan "Test timeout".
2. **Gambar yang masih dimuat diperlakukan sebagai plat yang tak menggambar.**
   Plat hanya menggambar dari tekstur yang sudah didekode; gambar yang belum
   selesai setelah 30 s adalah keadaan jaringan. Kini `image-pending`, dengan
   alasannya sendiri.

Dan satu dari Tahap 86, yang run garis dasar ungkap: `material-shape` memberi
`sharp` apa pun yang diunduhnya, dan mati pada _"Input buffer contains
unsupported image format"_ ketika optimizer gambar kehabisan waktu ke CDN.
Sumber yang gagal diunduh kini dilaporkan dan tidak ditanya.

### 7.4 Temuan: §5.1 salah mengatribusikan satu flaky-nya

`visual-substance:179` `/en/practice/consulting at mobile` tercatat di §5.1
sebagai kanvas yang terlambat. Halaman praktik tidak memasang WebGL
(`data-webgl-root` nol, terukur), dan region aksennya ada di HTML server (dua
kali). Konteks galatnya: _"Test timeout of 30000ms exceeded"_ di `page.goto`,
yang menunggu event `load` — semua gambar, di profil ponsel DPR 2.6.
`visual-substance:771` gagal dengan bentuk yang sama lewat `networkidle`.

Dicatat dengan sebab yang benar di `HANDOFF.md` §5.1 sebagai butir terbuka
tersendiri — anggaran muat halaman, bukan kanvas — dan tidak diperbaiki di
sini: mengubah apa yang ditunggu gerbang-gerbang itu adalah tahapnya sendiri.

### 7.5 Temuan: Tahap 89 tidak menyapu `e2e/`

`e2e/vocabulary.e2e.ts` masih memuat `` `/${locale}/ai` `` di daftar
permukaannya. Rute yang dihapus menjawab soft-404 dengan 200, jadi dua uji
lulus dengan memeriksa halaman 404. Entri dihapus; `vocabulary` tetap hijau.
Satu komentar masa kini tentang `/en/ai` di `visual-substance.e2e.ts` ikut
dikoreksi. `TAHAP-89.md` §6.5 mencatatnya di tempat klaimnya.

Konsekuensi yang harus terlihat di CI berikutnya: jumlah uji **turun dua** di
proyek yang menjalankan `vocabulary`.

### 7.6 Gerbang

```
bun run check    597 lulus, 0 gagal
bun run build    hijau
```

### 7.7 Log perpindahan mode

```
E->R  T1  run sehat pertama: 5 merah, termasuk dua dari helper baru
R->E  sebab: tunggu di dalam anggaran yang lebih pendek; gambar tertunda bukan
          kegagalan material; tiga sisanya macet lingkungan (goto timeout)
E->R  T3  §5.1 menyebut :179 kanvas terlambat; halamannya tidak memasang WebGL
R->E  sebab: anggaran muat halaman di profil ponsel; dicatat terbuka
```

### 7.8 Yang tidak dikerjakan, dinyatakan eksplisit

- **Anggaran muat halaman di profil ponsel** (§7.4) — terbuka di `HANDOFF.md`
  §5.1.
- **Kenapa plat `/en` di profil ponsel tidak menggambar dalam 40 s** di dua
  sampel pengukuran awal — tetap tidak dibuktikan (§6).
- **Nol angka performa diklaim** — `CLAUDE.md` #19.

### 7.9 CI sesudah push

Ditambahkan di commit Tahap 91.

```
Tahap 89 (a5e8436)   723 lulus · 1 flaky · 14 dilewati   738
Tahap 90 (d908fcc)   721 lulus · 1 flaky · 14 dilewati   736   (−2: entri `/ai` di vocabulary)
```

Selisih −2 persis dua uji yang §7.5 hapus. **Komposisi skip identik** antara
kedua run — hanya nomor barisnya bergeser — dan keempat belasnya sah: rute
tanpa WebGL (jurnal ×2, studio, tiga praktik) di kedua proyek, plus dua uji
material yang memang desktop-only di proyek mobile.

Itu juga menyatakan batas tahap ini dengan jujur: di runner CI yang cepat tidak
ada skip tersembunyi untuk dihapus. Yang dihapus adalah **kemampuan** gerbang
untuk melewatkan dirinya diam-diam — yang di laptop ini memang terjadi (§7.2).

Flaky-nya sama di kedua run: `visual-substance` aksen `/en/practice/consulting`
di mobile — sasaran Tahap 91.
