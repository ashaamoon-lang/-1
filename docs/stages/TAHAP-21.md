# Tahap 21 — Satu momen milik sendiri: material yang bisa ditemui

> Pendalaman wajib atas `docs/ROADMAP.md` §3.0.

Status: **selesai**. Hasil di §8.

---

## 1. Rencana meminta satu hal; pengukuran menemukan yang lain

Rencana §1.2 mengusulkan: naikkan lapisan material "dari aksen jadi tanda
tangan", dengan amplitudo diputuskan lewat angka.

**Amplitudonya tidak boleh dinaikkan, dan proyek ini sudah mengatakannya lebih
dulu.** `vault/motion/tokens.ts` membawa argumen lengkap untuk nilai yang ia
punya, plus gerbang:

> `MAX_DISPLACEMENT` **ada karena ini satu-satunya nilai di proyek yang
> menggoda untuk dinaikkan: angka lebih besar lebih jelas "melakukan sesuatu",
> dan itu persis bagaimana sebuah material menjadi efek.**

Ditambah `CLAUDE.md` #13: 3D adalah **aksen**. Jadi jalur "lebih keras"
tertutup, dan menutupnya adalah jawaban yang benar.

Pertanyaan yang tersisa berbeda, dan ternyata itu yang penting: **apakah
pembaca biasa pernah menemuinya sama sekali?**

---

## 2. Yang diukur — dan koreksi atas §2 versi pertama

> **§2 versi pertama salah, dan koreksinya adalah isi tahap ini.** Yang
> tertulis di sana: _"sapuan pointer menggerakkan 2,6% piksel plat; menggulir
> menggerakkan 0%"_ — kesimpulannya "efeknya bekerja, ia hanya tidak dipicu
> oleh membaca". Kesimpulan itu **tidak benar**. Lihat §2.1.

Amplitudo terdeklarasi: `displacement: 0.008` UV, `drift: 0.002`,
`driftPeriod: 12` detik. Pada plat 614px itu puncak **~4,9px**.

Diukur di build produksi, 1280x800, satu plat 614x767, dua mesh hidup, jendela
tetap 400x500 di atas plat, **dengan kursor kustom disembunyikan**:

| Kondisi                               | piksel bergerak | mean \|Δ\| | maks |
| ------------------------------------- | --------------- | ---------- | ---- |
| hanyut ambien (tak ada input)         | **0,00%**       | 0,00       | 0    |
| sapuan pointer, frame di tengah gerak | **0,00%**       | 0,00       | 0    |
| menggulir, offset identik (1062)      | **0,00%**       | 0,00       | 0    |

**Nol di ketiganya.** Lapisan material tidak bergerak sama sekali — bukan
"tidak dipicu oleh gulir", tapi **beku sejak ia dikirim di Tahap 14**.

### 2.1 Angka 2,6% itu adalah cincin kursor, bukan platnya

Pengukuran pertama membandingkan tangkapan layar sebelum dan sesudah sapuan
tetikus. Yang berubah di jendela itu **bukan** platnya: yang berubah adalah
kursor kustom (`vault/primitives/cursor`), sebuah lapisan DOM `position: fixed`
yang memang ikut pointer melintasi jendela ukur.

Kontrolnya sederhana dan seharusnya ada sejak awal — sembunyikan kursornya,
sapukan lagi. Hasilnya 0,00%. Instrumen itu tidak pernah mengukur material.

Kontrol pertama untuk itu pun **masih salah**: ia menyembunyikan semua elemen
`position: fixed; pointer-events: none`, yang ikut menangkap **pembungkus
canvas**. Kedua lengan lalu nol menurut konstruksi. Kontrol yang benar
menyembunyikan kursor lewat kelasnya sendiri, lalu **membuktikan canvas masih
`visible`** — dan gerbang di §5 sekarang menegaskan keduanya.

### 2.2 Rantai bukti sampai ke akar

Nol tidak cukup untuk menuduh. Ini urutan yang memaksanya:

1. **Panggilan gambar berjalan** — ~72 `drawArrays`/detik. Canvas merender.
2. **Menyembunyikan canvas mengosongkan halaman** — jadi plat itu memang mesh,
   bukan `<img>` DOM (yang di-`opacity: 0` oleh `[data-material]`).
3. **Uniform di sisi JS bergerak** — instance yang tergambar melaporkan
   `uTime` 6,38 → 6,82 → 7,23 setiap frame.
4. **Uniform di sisi GPU tidak** — `uniform1f` untuk `uTime`, `uShear`,
   `uDisplacement`, `uDrift`, `uDriftPeriod` milik program material terpanggil
   **tepat satu kali masing-masing**, seumur halaman.
5. **Dua build, shader berbeda, piksel identik byte-per-byte** — satu build
   diberi `gl_FragColor.r += 0.4 * sin(uTime * 2.0)`. Rata-rata kanal di
   jendela ukur: `r 125,76 g 83,66 b 54,95` di **kedua** build. Tint yang
   digerakkan `uTime` tidak muncul karena `uTime` di GPU **nol**.

Kesimpulannya satu-satunya yang muat: **objek uniform yang dimutasi setiap
frame bukan objek yang dipakai three untuk merender.**

Pembandingnya ada di repo ini sendiri. `vault/webgl/scene-shell/scene.tsx`
beranimasi dengan benar, dan satu-satunya beda strukturalnya: ia menulis lewat
`materialRef.current.uniforms`. `material-image` menulis ke objek `useMemo`
miliknya sendiri.

### 2.3 Kenapa tidak ada gerbang yang menangkapnya

Tahap 14 menggerbangi **keberadaan**: ada canvas, ada mesh, teksturnya
terikat, objek GPU tidak bocor saat unmount. Semuanya hijau, dan semuanya
benar. Tidak satu pun menanyakan apakah materialnya **bergerak**.

Itu pola yang sudah dua kali muncul di proyek ini — Tahap 17 (`ada canvas`
vs `canvas menggambar sesuatu yang layak`) dan sekarang ini (`mesh menggambar`
vs `mesh bergerak`). Keduanya lolos karena pertanyaannya berhenti satu langkah
sebelum yang dilihat pembaca.

## 3. Yang dikerjakan

Dua hal, dan yang pertama tidak ada di rencana.

### 3.1 Membuat materialnya hidup — memperbaiki uniform yang tidak sampai

Setiap penulisan uniform per-frame sekarang lewat objek yang **three pakai
untuk merender**, bukan objek `useMemo` milik komponen. Satu helper,
`uniformsOf(materialRef.current, uniforms)`, dipakai oleh loop frame maupun
efek-efeknya, dengan `materialRef` di `<shaderMaterial>` — bentuk yang sama
persis dengan `vault/webgl/scene-shell/scene.tsx` yang memang beranimasi.

Ini bukan tuning. Sebelum perubahan ini lapisan material menggambar frame nol
selamanya: tanpa warp pointer, tanpa hanyut ambien, tanpa apa pun.

### 3.2 Input kedua: kecepatan gulir

Material diberi input kedua — **kecepatan gulir** — pada amplitudo yang sengaja
lebih kecil daripada pointer dan lebih besar daripada hanyut ambien.

Bukan stamp flowmap kedua: sebuah gulir mengganggu seluruh permukaan, bukan
satu titik di bawah kursor. Yang ditambahkan adalah geseran (shear) sumbu-Y
pada seluruh plat, dilipat ke `offset` yang sudah ada sehingga ia **mewarisi
edge falloff** — tepinya tetap diam persis seperti sebelumnya.

**Titik sambungnya sudah membaca nilainya.** `scene.tsx` membaca
`window.scrollY` setiap frame untuk menempatkan mesh; kecepatannya diturunkan
di sana. **Nol pendengar baru, nol dependensi, nol perubahan rute.**
Peluruhannya eksponensial dan tidak bergantung frame rate — bentuk yang sama
dengan follow kursor di Tahap 18c, dan alasan yang sama.

Tangganya menjadi tiga anak tangga, diurutkan menurut seberapa disengaja
gerakan yang memicunya:

| Input          | Token                   | Nilai | Dipicu oleh              |
| -------------- | ----------------------- | ----- | ------------------------ |
| hanyut ambien  | `material.drift`        | 0.002 | tak seorang pun          |
| gulir          | `material.shear`        | 0.005 | seseorang sedang membaca |
| sapuan pointer | `material.displacement` | 0.008 | seseorang menjangkaunya  |

## 4. Batasan yang mengikat tahap ini

Selain batasan rencana §2 (reduced motion, tanpa JS, axe, anggaran rute, nol
dependensi, token, merah dulu, tanpa klaim performa):

1. **`displacement` tidak berubah.** `MAX_DISPLACEMENT` tetap 0.012 dan
   `tokens.test.ts` tetap menjaganya.
2. **Shear harus lebih kecil daripada pointer.** Dinyatakan sebagai token dan
   dijaga uji unit, bukan sekadar dipilih.
3. **Tepi plat tetap diam** — komentar shader-nya sendiri yang menuntut ini:
   _"A commissioned work with a wobbling edge reads as a broken image, not as
   a material."_
4. **Puncak gerak saat menggulir harus terukur di bawah puncak sapuan
   pointer.** Itu gerbangnya, bukan pendapat saya.

---

## 5. Gerbang

Menumpang `e2e/visual-substance.e2e.ts`, memakai instrumen yang sudah terbukti
di §2: tangkapan penuh, dipotong `sharp`, dibandingkan.

Tiga lengan, bukan dua, karena hanyut ambien berjalan tanpa siapa pun:

- **Kontrol** — kursor kustom disembunyikan lewat kelasnya, lalu canvas
  dipastikan masih `visible`. Dua asersi, karena dua versi kontrol sebelumnya
  gagal dengan cara yang berlawanan (§2.1).
- **Menggulir > hanyut ambien** — "bergerak" saja tidak cukup; ia harus
  bergerak **lebih** daripada diam sudah bergerak.
- **Menggulir < sapuan pointer** — menjaga tangga §4.2 tetap benar sesudah
  kode berubah, bukan hanya saat ditulis.

Lengan gulir dipacu `requestAnimationFrame`, bukan satu lompatan: shear adalah
peluruhan eksponensial terhadap kecepatan, jadi satu lompatan hanya satu frame
kecepatan dan nyaris tidak mencapai amplitudonya. Itu sifat instrumen, bukan
sifat desain — dan ia mendarat kembali persis di anchor, yang **diasersikan**.

---

## 6. Risiko

**6.1 Gambar yang bergoyang saat digulir lebih buruk daripada tidak ada
efek.** Risiko utama, dan komentar shader-nya sendiri yang menamainya. Karena
itu amplitudonya lebih kecil, tepinya tetap diam, dan hasilnya **dipandangi**,
bukan hanya diukur. Kalau terbaca sebagai goyangan, dikembalikan dan
dilaporkan.

**6.2 Kerja per frame bertambah di rute yang sudah membawa three.js.** Yang
ditambahkan satu pengurangan dan satu `Math.exp` per plat per frame. Tidak ada
klaim performa yang dibuat; `route-budget` menjaga bobotnya.

**6.3 Ini tetap desktop-only.** WebGL digerbangi `supportsWebGL && isDesktop`.
Tahap ini membuat efeknya bisa ditemui oleh pembaca desktop yang menggulir; ia
**tidak** membuatnya ada di ponsel, dan itu bukan yang diperbaiki di sini.

---

## 7. Yang **tidak** dikerjakan

- **Amplitudo pointer tidak dinaikkan** (§1).
- **Material tidak disebar ke rute lain.** `route-budget` mengizinkan three.js
  di tepat satu rute, dan itu tetap.
- **Sim fluid tetap nol pemakai.** Terpasang bukan alasan untuk dipakai.

---

## 8. Hasil

**Selesai.** Rencana meminta satu momen dinaikkan menjadi tanda tangan;
pengukurannya menemukan bahwa momen itu tidak pernah bergerak sama sekali.

### 8.1 Cacat yang ditemukan (dan tidak dicari)

Lapisan material — satu-satunya hal orisinal di situs ini — **beku sejak Tahap
14**. Ia menggambar, teksturnya benar, objek GPU-nya tidak bocor, dan seluruh
gerbangnya hijau. Ia hanya tidak pernah bergerak, karena setiap uniform
per-frame ditulis ke objek yang bukan objek render three.

Terukur, dengan kursor dikecualikan dan canvas tetap tampil:

| Kondisi                   | sebelum   | sesudah         |
| ------------------------- | --------- | --------------- |
| diam (hanyut ambien saja) | **0,00%** | 0,66-2,99%      |
| sapuan pointer (puncak)   | **0,00%** | 3,75-6,80%      |
| menggulir                 | **0,00%** | 1,48-2,45%      |
| `uShear` sampai ke GPU    | **0,000** | 0,005 (= token) |

`uniform1f` untuk `uTime` milik program material terpanggil **satu kali, dengan
nilai 0**, seumur halaman. Sesudah perbaikan, `uTime` menunjukkan **dua deret
berselang-seling** (4,97 / 6,22 / 5,03 / 6,28) — wash dan material, keduanya
maju.

### 8.2 Yang dikirim

1. `vault/webgl/material-image/scene.tsx` — `uniformsOf()`, `materialRef`, dan
   seluruh tulisan uniform (frame maupun efek) lewat material.
2. `vault/motion/tokens.ts` — `shear`, `shearVelocity`, `shearTau`, plus
   tangga tiga input yang dijelaskan sebagai keputusan desain.
3. `vault/webgl/material-image/shaders.ts` — `uShear`, dilipat ke `offset`
   sehingga mewarisi edge falloff.
4. `vault/motion/tokens.test.ts` — tiga uji baru, termasuk plafon
   `MAX_DISPLACEMENT` yang **selama ini diklaim dijaga dan ternyata tidak**
   (`tokens.ts` menulis _"the ceiling `tokens.test.ts` enforces"_; file itu
   tidak pernah membaca `material` sama sekali).
5. `e2e/visual-substance.e2e.ts` — dua gerbang baru, keduanya dibuktikan merah.

### 8.3 Gerbang, dan kenapa bentuknya berubah

- **"the plate is not frozen"** — piksel. Dua tangkapan berjarak 1,5 detik
  tanpa siapa pun menyentuh apa pun. Merah: `0,00%`. Hijau: 0,66-2,99%. Ini
  persis cacat yang terkirim, dinyatakan sebagai angka.
- **"scrolling reaches the shader, and stays quieter than the pointer"** —
  uniform, lewat kail `gl.uniform1f` dari sisi tes. Merah:
  `idle 0.00e+0 | scrolling 0.00000`. Hijau: `scrolling` mencapai token dan
  tetap di bawah `displacement`.

Gerbang kedua **awalnya berbasis piksel dan itu dibatalkan setelah diukur**,
bukan karena selera: shear meluruh pada tetapan waktu 133ms sementara
tangkapan CDP mendarat 50-150ms setelah gulir berhenti, jadi rana hanya
menangkap sepertiga amplitudo. Terhadap kontribusi hanyut ambien pada rentang
yang sama, urutannya **terbalik antar-jalan** (jalan ke-3: diam 2,99% vs gulir
2,45%). Gerbang yang kadang merah lebih buruk daripada tidak ada gerbang.
`gl.uniform1f` tidak berisik, dan ia justru lapisan tempat cacatnya hidup.

### 8.4 Instrumen yang salah di tahap ini — sepuluh, dicatat semua

1. `page.screenshot({ clip })` tidak mengkomposit WebGL (perangkap yang sudah
   ditulis Tahap 14 dan saya masuki lagi).
2. Menangkap sesudah sapuan selesai: flowmap sudah meluruh.
3. Baseline pointer 2,6% **adalah cincin kursor**, bukan platnya.
4. Kontrol pertama untuk itu menyembunyikan semua elemen `fixed` +
   `pointer-events: none` — ikut menyembunyikan pembungkus canvas, jadi kedua
   lengan nol menurut konstruksi.
5. Jendela ukur tetap dalam piksel CSS dibandingkan tangkapan dalam piksel
   perangkat: pada `deviceScaleFactor: 3` ia menunjuk header, bukan plat, dan
   melaporkan 22,75% untuk **diam**.
6. Jendela ukur mencakup tepi plat — bagian yang edge falloff memang tahan
   supaya tidak bergerak.
7. Kontrol "diam 1500ms" vs "gulir 250ms": lengan yang menunggu lebih lama
   mengumpulkan lebih banyak hanyut dan "menang".
8. Ramp berbasis frame (300px / 15 frame): headless berjalan ~18fps, jadi itu
   ~360px/s terhadap `shearVelocity` 1000 — shear tidak pernah lebih dari
   sepertiga amplitudo.
9. `probeId` berbasis potongan `src` — dua instance bertabrakan kunci, dan
   selama beberapa putaran saya membaca keadaan plat yang salah.
10. Kunci kursor `toBeGreaterThan(0)` pada profil sentuh: kursor memang tidak
    dirender di sana, dan itu benar, bukan kegagalan.

Nomor 3 yang paling mahal dan paling berguna: ia yang membuat §2 versi pertama
menyimpulkan hal yang salah dengan penuh percaya diri.

### 8.5 Yang dipandangi

Frame di tengah gulir 1500px/s dipandangi pada 1280x800: komposisinya tidak
berubah, tepi atas plat tetap satu garis lurus pada perbesaran 2x, dan tidak
ada goyangan. Risiko §6.1 tidak terjadi. Kalau terjadi, rencananya adalah
mengembalikannya — itu tidak perlu dipakai.

### 8.6 Yang gagal atau dilewati, disebut apa adanya

- **Tidak ada klaim performa.** Tidak ada profiler di lingkungan ini
  (`CLAUDE.md` #19). Yang ditambahkan per plat per frame adalah satu
  pengurangan dan satu `Math.exp`; itu deskripsi kode, bukan pengukuran.
- **Gerbang ini desktop-only**, dinyatakan di dalam tesnya sendiri. Profil
  mobile Playwright adalah emulasi sentuh pada `deviceScaleFactor: 3`; dipaksa
  selebar desktop supaya canvas mount, ia menghasilkan konfigurasi yang tidak
  dimiliki pembaca mana pun — grain permukaan saja mengubah 34% piksel
  perangkat antar-frame.
- **Ponsel tetap tidak melihat material sama sekali.** Itu keputusan `lib/webgl`
  yang lebih tua dan bukan yang diperbaiki di sini (§6.3).
- **Kredensial Sanity tidak dirotasi**, sesuai permintaan; tetap butir daftar
  periksa pra-luncur.

### 8.7 Verifikasi

```
bun run check          exit 0   (404 uji unit, 44 berkas)
CI=true test:e2e       307 lulus, 2 dilewati (mobile, dengan alasan tertulis)
bun run build-storybook  ok, 92 uji storybook lulus
```
