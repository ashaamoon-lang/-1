# Tahap 32 — WebGL di rute kedua, dan satu pass yang harus membuktikan dirinya

> Pendalaman wajib atas `docs/ROADMAP.md` §3.0.
> Fase 6 dari scaffold yang disetujui.

Status: **selesai**. Hasil di §7.

---

## 1. Izin yang sudah tertulis, dan di mana

Tahap 7 pernah menetapkan bahwa lapisan material hidup di **tepat satu** rute.
Aturan itu **sudah dicabut secara eksplisit**, dan bukan oleh tahap ini:
`e2e/route-budget.e2e.ts` membawa paragraf berjudul "Tahap 7's 'exactly one
route' rule is revoked here, on purpose", karena pemilik proyek mengarahkan
WebGL diperluas.

Dan file yang sama sudah menulis undangannya, di baris `/en/work`:

> "It does **not** get three.js — not because a second WebGL route is
> forbidden (that rule is revoked above) but because nothing on this route has
> asked for one yet. **When a stage wants it, it adds `three` here and says
> why.**"

Tahap ini adalah tahap itu. Yang berikut ini adalah "why"-nya.

---

## 2. Kenapa katalog, dan apa harganya

Beranda menampilkan pilihan karya dengan lapisan material; katalog menampilkan
**seluruhnya**, dengan komponen yang sama (`vault/blocks/project-grid`), dan
hari ini plat-platnya diam. Pengunjung yang menekan sebuah plat di beranda
lalu membuka katalog menemukan bahwa hal yang sama berhenti merespons — itu
ketidakkonsistenan yang justru paling terasa di halaman yang paling banyak
dilihat calon klien.

**Harganya diukur lebih dulu, bukan diperkirakan:**

| rute       | sekarang | pustaka      | plafon |
| ---------- | -------- | ------------ | ------ |
| `/en`      | 1899 KB  | three + gsap | 2100   |
| `/en/work` | 880 KB   | gsap         | 900    |

three.js kira-kira seribu kilobyte tak-terkompresi di rute ini, jadi
plafon `/en/work` harus naik ke kisaran plafon beranda. **Itu kenaikan yang
diputuskan, diukur, lalu digerbangi ulang** — persis instruksi pemilik proyek,
dan persis aturan file anggarannya sendiri: daftarnya keputusan, angkanya
cuma plafon.

Yang **tidak** berubah: ponsel dan `prefers-reduced-motion` tetap tidak
mengunduh mesin 3D sama sekali (`e2e/webgl-budget.e2e.ts`), dan jalur
non-WebGL tetap desain yang sama — `<img>` biasa, bukan penampung kosong.

---

## 3. Postprocessing: pass yang harus membuktikan dirinya, bukan dipasang

Scaffold menulis "pasang `lib/webgl/components/postprocessing` — satu pass,
halus". Modulnya memang ada dan nol konsumen. Tapi apa adanya ia
`RenderPass` + `CopyPass`: sebuah komposer yang merender lalu menyalin, dengan
**nol perubahan visual**. Memasangnya seperti itu adalah biaya murni.

Jadi ia butuh efek. Dan ketika saya mencari efek mana yang cocok, kosakata
situs ini sudah menjawab sebagian:

| Di mana                              | Grain-nya                                                             |
| ------------------------------------ | --------------------------------------------------------------------- |
| `vault/webgl/scene-shell/shaders.ts` | film grain pada gradien hero, **dengan alasan**: ia mendither banding |
| `lib/scripts/seed-fixtures.ts`       | grain dikomposit ke dalam plat karyanya sendiri                       |

Jadi situs ini **sudah punya grain, dua kali**, dan keduanya lebih dekat ke
tempat yang membutuhkannya. Sebuah pass grain ketiga di atas komposit akan
menumpuk di atas karya seninya.

**Karena itu keputusannya tidak diambil dengan berargumen, tapi dengan
melihat.** Pass-nya dibangun, halaman dipotret dengan dan tanpanya, dan
gambarnya yang memutuskan. Kalau ia memperbaiki, ia dikirim. Kalau tidak,
angkanya dan gambarnya ditulis di §7 dan ia tidak dikirim — itu keputusan
kualitas dengan bukti, bukan kehati-hatian.

---

## 4. Aturan yang tidak berubah

`CLAUDE.md` #13-#15, tanpa pengecualian:

1. **3D tetap aksen.** Tidak ada halaman yang bergantung padanya untuk bisa
   dibaca atau dipakai.
2. **Selalu ada jalur non-WebGL**, dan ia terlihat disengaja.
3. **Geometry, material, texture dibuang saat unmount.**
4. Mesin diambil **di dalam efek**, tidak pernah di module scope.

---

## 5. Gerbang

1. `route-budget` — `/en/work` dengan izin `three` **dan angka barunya**,
   ditulis beserta alasannya di file itu.
2. `webgl-budget` — reduced motion dan ponsel tetap **nol mesin 3D**.
3. `material-layer` — platnya benar-benar tergambar di rute baru, bukan hanya
   ada di DOM (pelajaran Tahap 14a: DOM hijau, empat persegi kosong).
4. axe, `no-javascript`, dan `catalogue-layout` tetap hijau.

---

## 6. Risiko

**6.1 Rute yang paling banyak dilihat jadi yang paling berat.** Itu harga
sebenarnya, dan ia ditulis dalam angka di §7 supaya bisa dibalik kalau
pemilik proyek menilainya terlalu mahal.

**6.2 Dua kanvas berlomba.** `lib/webgl/store.ts` punya konsep kanvas primer,
dan Tahap 12 sudah mencatat bahwa dua akan berebut. Katalog dan beranda adalah
rute berbeda, jadi tidak pernah hidup bersamaan — tapi transisi antar-rute
adalah tempat asumsi itu bisa patah, dan itu **diperiksa**, bukan
diasumsikan.

---

## 7. Hasil

**Separuh dikirim, separuh ditolak dengan bukti.** Lapisan material sekarang
hidup di katalog dengan plafon yang dinaikkan sengaja dan diukur. Pass
postprocessing **dibangun, dipasang, difoto — dan tidak dikirim**, karena
gambarnya menjawab pertanyaannya.

### 7.1 Katalog membawa materialnya

| rute       | sebelum | sesudah     | plafon         | izin             |
| ---------- | ------- | ----------- | -------------- | ---------------- |
| `/en/work` | 880 KB  | **1909 KB** | 900 → **2100** | `three` + `gsap` |

**+1029 KB**, dan itu three.js. Plafonnya dinaikkan ke 2100 — sama dengan
beranda — bukan ke angka yang lebih pas, karena kedua rute sekarang membawa
mesin yang sama untuk alasan yang sama, dan plafon berbeda di masing-masing
akan jadi dua keputusan padahal ada satu. Alasannya ditulis **di dalam**
`e2e/route-budget.e2e.ts`, tempat file itu sendiri memintanya.

**Platnya benar-benar tergambar**, bukan cuma ada di DOM — pelajaran Tahap
14a, yang dulu mengirim empat persegi kosong dengan semua gerbang hijau.
Diukur sambil menggulir:

```
             plat hidup saat digulir
/en          0 → 2 → 4 → 4
/en/work     2 → 4 → 6 → 6
```

Dan kontraknya dipenuhi persis: 4 plat hidup ada di `opacity: 0` (mesh sudah
menggambar dan mengambil alih), 2 yang belum hidup masih menampilkan
`<img>`-nya di `opacity: 1`. Tidak ada render ganda, tidak ada persegi kosong.

**Yang tidak berubah:** ponsel dan `prefers-reduced-motion` tetap mengunduh
**nol** mesin 3D — `webgl-budget` membuktikannya terpisah dan angkanya tidak
bergerak.

Satu efek samping yang menyenangkan: **dua uji yang selama ini dilewati
sekarang berjalan.** "Footer di bawah kanvas masih terbaca" hanya dijalankan
pada rute yang punya kanvas; `/en/work` sekarang punya, jadi jumlah yang
dilewati turun 18 → 16 dan keduanya lulus.

### 7.2 Postprocessing: dibangun, difoto, ditolak

§3 berjanji keputusannya diambil dengan melihat, bukan berargumen. Pass-nya
dibangun — `RenderPass` + `EffectPass` dengan grain amplitudo rendah, yaitu
kosakata situs ini sendiri — dipasang, dan halaman yang sama difoto dengan dan
tanpanya.

**Ia mengangkat seluruh kanvas.** Terukur antara kedua frame:

| ukuran                 | nilai        |
| ---------------------- | ------------ |
| beda absolut rata-rata | **55,8/255** |
| beda absolut maksimum  | 148/255      |
| kanal yang bergerak >2 | **93,5%**    |

Melihatnya mengatakan hal yang sama lebih keras: rust dalam pada "Arus Balik"
jadi aprikot susu, hijau hutan "Pusat Beban" jadi mint, violetnya jadi
lavender. Buffer `HalfFloatType` milik komposer mengeluarkan render dari
penanganan ruang warna milik renderer, dan semuanya kembali pucat.

**Di situs yang subjeknya adalah karya seni, itu bukan pass halus — itu color
grade yang tidak diminta siapa pun.**

Itu bisa diperbaiki: satu output pass mengembalikan encoding-nya, dan
grain-nya turun dari 0,06 ke sekitar 0,015. **Tidak dikejar**, karena yang
tersisa sesudahnya: situs ini **sudah** memakai grain **dua kali** — di
`vault/webgl/scene-shell/shaders.ts`, di mana ia punya pekerjaan nyata
(mendither banding gradien), dan dikomposit ke dalam plat karyanya sendiri
oleh `lib/scripts/seed-fixtures.ts`. Lapisan ketiga di atas komposit akan
duduk **di atas** karyanya alih-alih melayaninya, seharga +19 KB dan satu pass
layar-penuh setiap frame.

Alasannya ditulis **di dalam modulnya**, bukan di pesan commit, supaya tahap
berikutnya yang meraihnya mulai dari pengukuran ini alih-alih dari satu baris
di scaffold.

### 7.3 Verifikasi

- `bun run check` — exit 0, **438 uji unit**.
- `CI=true bun run test:e2e` — **384 lulus, 0 gagal**, 16 dilewati (dari 18),
  nol flake.
- `route-budget` — lulus di plafon barunya, dengan alasannya tertulis.
- `webgl-budget` — reduced motion tetap **nol mesin 3D, nol kanvas**.
- Dipandangi di 1440×900: platnya penuh, warnanya utuh, nol persegi kosong.
- Tidak ada klaim performa (`CLAUDE.md` #19) — tidak ada profiler di sini,
  jadi biaya frame pass itu **tidak** saya klaim, hanya beratnya yang saya
  ukur.

### 7.4 Yang harus Anda putuskan, bukan saya

**1909 KB pada rute katalog adalah angka terbesar kedua di situs ini**, dan
katalog adalah halaman yang calon klien paling lama buka. Saya mengirimnya
karena Anda mengarahkan WebGL diperluas dan mengizinkan anggaran dinaikkan
sengaja — tapi angkanya ada di sini, di gerbangnya, dan di ROADMAP, supaya
membalikkannya adalah satu baris kalau Anda menilainya terlalu mahal.

Yang akan hilang kalau dibalik: konsistensi plat antara beranda dan katalog.
Yang akan kembali: seribu kilobyte.

### 7.5 Yang tidak dikerjakan

- **Rute WebGL ketiga.** Halaman proyek tidak memintanya; platnya di sana
  adalah galeri, dan galeri baru saja mendapat lightbox-nya sendiri di Tahap 31.
- **`lib/webgl/utils/blend.ts`** tetap nol konsumen. Ia GLSL pembantu untuk
  menulis efek kustom, dan tahap ini justru menyimpulkan bahwa efeknya belum
  punya pekerjaan.
