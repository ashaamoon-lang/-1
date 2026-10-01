# Tahap 91 — Gerbang yang menunggu gambar yang tidak diukurnya

> **KOREKSI, 23 September 2026 — klaim utama tahap ini gugur.** CI pada
> `bfc172f` melaporkan **721 lulus / 1 flaky / 14 dilewati**, dan flaky-nya
> adalah uji yang sama persis yang tahap ini ditulis untuk menutupnya:
> `[mobile] visual-substance.e2e.ts:187 /en/practice/consulting`, 40,1 detik.
> Angkanya identik dengan garis dasar Tahap 90. Mekanisme yang diperbaiki di
> sini nyata dan terukur — gerbangnya memang berhenti menunggu gambar —
> tetapi ia **bukan** sebab flaky itu, atau bukan satu-satunya. Lanjutannya
> `docs/stages/TAHAP-93.md`, yang juga menemukan bahwa helper baru tahap ini
> memasang tunggu 30 detik di dalam anggaran 30 detik.
>
> **Status: terkirim.** Spec ditulis lebih dulu sesuai `ROADMAP.md` §3.0;
> satu temuan ditambahkan saat implementasi (§7.3), hasilnya di §7.
>
> Menutup butir yang Tahap 90 atribusikan ulang di `HANDOFF.md` §5.1:
> anggaran muat halaman di profil ponsel.

---

## 1. Pengukuran

### 1.1 Satu-satunya flaky yang muncul di hampir setiap run CI

Sejak Tahap 84, satu flaky muncul di run CI hampir setiap tahap:
`visual-substance:178` "a declared accent carries tone" — `/en/practice/consulting`,
proyek mobile. Durasi percobaan pertamanya di CI Tahap 85: **40.1 s**, bentuk
yang cocok dengan anggaran uji 30 s yang habis.

`HANDOFF.md` §5.1 menggolongkannya sebagai kanvas yang terlambat. Tahap 90
membuktikan itu salah: halaman praktik tidak memasang WebGL, dan region aksennya
ada di HTML server.

### 1.2 Gerbangnya stabil — di mesin yang tenang

Kontribusi aksen diukur dengan `contribution()` yang sama yang dipakai gerbang,
di konteks segar, pada 1, 2.8 dan 5 s sesudah `domcontentloaded`:

```
                     domcontentloaded   load      kontribusi (1 s / 2.8 s / 5 s)
desktop 1280x800     150–493 ms         182–1523  12.0 / 12.0 / 12.0
ponsel 390x844       285–402 ms         294–1390   8.1 /  8.1 /  8.1
ponsel 1280x800      229–296 ms         316–340   12.2 / 12.2 / 12.2
```

Cocok dengan tabel yang gerbang itu rekam sendiri (12.1, 8.9). Satu region di
DOM, tanpa animasi — `linear-gradient` statis. Jadi yang goyah bukan wash-nya.

### 1.3 Apa yang ditunggu gerbang itu, dan apa yang diukurnya

```ts
await page.goto(route) // menunggu event `load`: setiap gambar
await page.waitForTimeout(2800)
```

`goto` bawaan menunggu `load`, artinya **setiap gambar di halaman**, di profil
ponsel pada DPR 2.6. Gerbang ini mengukur pita atas wash — tidak ada gambar di
sana. Di bawah beban, atau ketika optimizer gambar menunggu `cdn.sanity.io`
(dua belas timeout di satu log server lokal), `load` tidak datang dalam 30 s dan
gerbang mati di `goto`, sebelum mengukur apa pun.

`visual-substance:771` "renders its work" punya bentuk yang sama lewat
`networkidle`, padahal ia hanya menghitung `<img>` yang punya ukuran — sesuatu
yang sudah benar sebelum satu byte gambar tiba, karena kotaknya diatur rasio
CSS.

### 1.4 Dan satu keputusan-lewat-tenggat di gerbang yang sama

`live = [data-accent-live].count() > 0`, sekali, setelah 2.8 s tetap. Di `/en`
desktop, wash adalah mesh WebGL; bila mesh datang sesudah hitungan itu, gerbang
menyembunyikan lapisan yang salah dan membandingkan halaman dengan dirinya
sendiri. Bentuk yang sama yang Tahap 90 tutup di lima gerbang lain.

### 1.5 Yang terlihat sekali dan belum terjelaskan

Run garis dasar Tahap 90 memberi "added no modulation: 0.9" untuk
`/en/practice/consulting` di **desktop** — cakupan lulus, rentang tidak. Itu
bukan tirai masuk (tirai menggagalkan cakupan lebih dulu). Satu pengamatan,
tidak berulang dalam enam sampel §1.2. Tidak diatribusikan; §6.

### 1.6 Ditemukan saat implementasi: penandanya menjanjikan lebih dari yang ia lakukan

Gerbang yang diperbaiki menunggu `[data-accent-live]`, lalu gagal di `/en`
desktop dengan angka yang tidak masuk akal:

```
the accent made the page darker: 18.6 with it, 18.6 without
```

Identik — menyembunyikan kanvas tidak mengubah apa pun. Diukur terpisah pada
halaman yang sama:

```
hide canvas   tone 27.3 -> 18.6   kontribusi 7.2
hide region   tone 27.3 -> 25.5   kontribusi 2.1
```

Jadi kanvas **memang** pembawa aksennya; yang salah adalah waktunya. Tangkapan
pertama sudah 18.6 — wash belum melukis apa pun saat itu.

`vault/webgl/scene-shell` menaikkan `data-accent-live` begitu ia memilih cabang
mesh, sementara catatan di sebelahnya berbunyi _"says a mesh is drawing it
right now"_. Dua momen yang berbeda. Kode lama lolos karena hitungannya pada
2.8 s sering memberi `false`, sehingga ia mengukur cadangan CSS — benar karena
kebetulan.

`vault/webgl/material-image` sudah memisahkan keduanya sejak Tahap 14 lewat
`onFirstFrame` (`data-material-shell` vs `data-material`). Pola itu dipakai di
sini: scene mengumumkan bingkai pertamanya, shell menaikkan penanda hanya
setelah itu, dan catatannya menjadi benar.

### 1.7 Ditemukan saat implementasi: gerbang ketiga yang memotret, bukan mengukur

`material-layer` — "no plate is ever a blank box" — gagal di laptop ini
dengan pesan yang mustahil dibaca apa adanya:

```
plate 0 is marked active but is not handed over
Expected: "0"   Received: "1"
```

Diukur, enam replika urutan gerbang itu dalam satu peramban:

```
attrSetAt=2328ms  readAt=2546ms  data-material=true  opacity=1   <- gagal
attrSetAt=1562ms  readAt=2544ms  data-material=true  opacity=0
attrSetAt= 323ms  readAt=2612ms  data-material=true  opacity=0   (×4)
```

Satu dari enam. `getAnimations()` pada saat baca yang gagal melaporkan transisi
`opacity` dalam keadaan **`running` di `currentTime: 0`** — dibuat, dan belum
maju satu milidetik pun, karena bingkai pertama mesh sedang memegang thread
utama. Itu sebabnya nilainya selalu persis `"1"` dan tidak pernah nilai antara.

Variabelnya bukan transisi 150 ms itu, melainkan **kapan penyerahan terjadi**:
cache HTTP dingin menyerahkan di 2,3 s, cache hangat di 0,3 s — dan
`waitForTimeout(2500)` gerbang itu duduk persis di atas angka yang dingin.

**Dan perbaikan pertama saya terlalu jauh, terukur.** Saya membuat gerbang
menunggu keputusan **setiap** plat lewat `waitForPlate`. Ia gagal enam dari enam
kali terhadap situs yang berfungsi:

```
plate 0  top    -2  di layar      menyerahkan   (2,5–10 s)
plate 1  top   784  di bawah lipat menyerahkan  (pada 10 s)
plate 2  top  1549  di bawah lipat tidak pernah, pada 32 s, gambar termuat
plate 3  top  1549  di bawah lipat tidak pernah, pada 32 s, gambar termuat
```

Plat jauh di bawah lipatan memang tidak diminta menggambar. Gerbang yang tetap
menuntutnya mengukur produk terhadap janji yang tidak pernah dibuatnya —
bentuk kesalahan yang sama dengan yang tahap ini perbaiki, hanya terbalik
arahnya. Yang ditunggu akhirnya adalah plat yang `showWorkGrid` gulirkan ke
layar, pola yang **dua uji lain di berkas yang sama sudah pakai**.

---

## 2. Rancangan

- **Tunggu apa yang diukur, bukan seluruh halaman.** Kedua gerbang memakai
  `waitUntil: 'domcontentloaded'`. Wash dirender server; hitungan gambar
  bergantung pada kotak, bukan byte.
- **Aksen WebGL diputuskan, bukan dihitung.** Bila `webglIntent()` berkata
  kanvas dimaksudkan, gerbang menunggu kanvas lalu `[data-accent-live]` —
  atau gagal. Bila tidak, wash CSS yang diukur. Helper Tahap 90, dipakai ulang.
- **Hitungan gambar di-poll**, bukan dibaca sekali sesudah `networkidle`.
- Jeda 2.8 s untuk tirai masuk dipertahankan — itu yang ia tunggu, dan tirai
  berdurasi tetap (`vault/motion/curtain`).

---

## 3. Daftar berkas

| berkas                                                                  | perubahan                                                              |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `e2e/visual-substance.e2e.ts`                                           | gerbang aksen dan gerbang "renders its work"                           |
| `e2e/material-layer.e2e.ts`                                             | gulir lewat Playwright; gerbang "blank box" membaca yang tenang — §1.7 |
| `e2e/page-settled.ts` (baru)                                            | menunggu tirai masuk selesai, bukan 2800 ms tetap                      |
| `vault/webgl/scene-shell/scene.tsx`, `index.tsx`                        | `onFirstFrame`; penanda dinaikkan setelah menggambar — §1.6            |
| `lib/scripts/design-debt.ts`                                            | satu kalimat yang menyebut perilaku penanda yang lama                  |
| `docs/HANDOFF.md`                                                       | §5.1: butir anggaran muat ditutup                                      |
| `docs/stages/TAHAP-91.md`, `ROADMAP.md`, `docs/stages/TAHAP-90.md` (CI) | posisi dan catatan                                                     |

---

## 4. Kriteria keluar

1. **Bukti merah atas mekanisme yang tepat**: dengan setiap gambar ditunda 35 s
   di jaringan, gerbang lama mati di `goto`/`networkidle`, gerbang baru lulus —
   karena ia tidak lagi menunggu apa yang tidak diukurnya.
2. Tanpa penundaan: kontribusi aksen tetap di angka §1.2 di ketiga profil.
3. `/en` desktop: aksen WebGL diukur sesudah mesh-nya hidup, bukan pada
   hitungan sesudah jeda tetap.
4. `bun run check` hijau.

---

## 5. Risiko

| #   | risiko                                                         | penangkal                                                                                        |
| --- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| R1  | `domcontentloaded` memotret sebelum font termuat               | Jeda 2.8 s dipertahankan; wash diukur sebagai selisih dua bingkai, jadi teks membatalkan dirinya |
| R2  | Menghitung `<img>` sebelum gambar tiba meloloskan gambar rusak | Gerbang itu tidak pernah menguji pemuatan — ia menghitung kotak; ditulis di komentarnya          |

---

## 6. Yang tidak dikerjakan, dinyatakan eksplisit

- **"0.9" desktop sekali-lihat** (§1.5) — tidak diatribusikan, tidak ditambal.
  Bila berulang, ia punya bentuknya sendiri.
- **Nol angka performa diklaim** — `CLAUDE.md` #19.

---

## 7. Hasil

### 7.1 Bukti merah, lalu hijau, atas mekanisme yang tepat

Setiap gambar ditunda 35 s di jaringan — WebGL2 tetap ada, halaman tetap
dirender; hanya gambar yang lambat:

```
gerbang lama   4 gagal, semuanya "Test timeout of 30000ms exceeded" di page.goto
gerbang baru   4 lulus dalam 19 s
```

Empat itu: aksen `/en/practice/consulting` di dua lebar, dan "renders its work"
untuk `/en` dan `/en/practice/consulting`. Tanda tangannya sama dengan flaky CI
(40.1 s terhadap anggaran 30 s).

### 7.2 Tanpa penundaan

```
aksen, kedua rute, kedua lebar, proyek desktop    4 lulus (22.8 s)
uji yang gagal saat server dingin, sendirian      3 lulus
```

`/en` desktop kini diukur sesudah mesh-nya menggambar — §1.6.

### 7.3 Kesalahan yang saya temukan dengan mempercayai sebuah komentar

§1.6. Perubahan pertama saya membuat gerbang menunggu `[data-accent-live]`,
percaya penanda itu berarti "sedang menggambar". Ia tidak. Yang benar bukan
melemahkan gerbang, melainkan membuat penandanya berkata benar — dan itu
menyentuh kode produk, di luar daftar berkas awal. Daftar §3 diamandemen.

### 7.4 Yang tetap terbuka, dan tidak diklaim selesai

**Butir pertama, ditambahkan sesudah CI: flaky-nya tidak tertutup.** Lihat
kotak koreksi di kepala berkas ini. Yang tahap ini benar-benar hasilkan adalah
tiga gerbang yang berhenti memutuskan lewat tenggat, satu penanda yang berkata
benar, dan — seperti `TAHAP-93.md` §1.4 catat — satu cacat baru yang saya
tulis sendiri di berkas baru tahap ini.

"added no modulation: 0.9" di `/en/practice/consulting` **desktop** muncul dua
kali, keduanya pada server yang baru dinyalakan dan mesin yang sibuk — sekali
di run garis dasar Tahap 90, **dengan gerbang lama**, jadi ia mendahului
perubahan ini. Tidak pernah berulang saat diisolasi: 3 run sendirian, 3 run
replika urutan gerbang, 4 run kelompok — semuanya 12.0, angka yang gerbang itu
rekam sendiri. Tidak diatribusikan.

### 7.5 Gerbang ketiga: merah, lalu hijau

```
gerbang lama     3 run → 1 gagal    (dan 1 dari 6 pada replika urutannya)
perbaikan ke-1   6 run → 6 gagal    menuntut penyerahan dari plat di bawah lipat
gerbang baru     6 run → 6 lulus    11 s per run
material-layer + visual-substance, desktop, --workers=2
                 32 lulus · 0 gagal · 6 dilewati
```

Keenam skip itu sah dan disebut namanya oleh `webglIntent`: rute yang tidak
memasang WebGL sama sekali (jurnal ×2, studio, tiga praktik).

### 7.6 Pengukuran itu dijalankan sebuah agen, dan ia mengoreksi taklimat saya

Pemilik repo mengizinkan agen **untuk mengukur** pada tahap ini. Taklimatnya
menyebut asersi itu membaca opacity `<img>`; agen itu mengukur dan mengoreksi:
yang dibaca adalah **shell**-nya, dan `<img>` berada di `opacity: 1` sepanjang
20 detik setiap probe. Transisi opacity memang sengaja dipasang di pembungkus,
bukan di gambar — `material-image.module.css` menuliskan alasannya sendiri:
`transition` tidak aditif, jadi menaruhnya di `<img>` akan menabrak skala INTENT
milik kartu.

Yang agen itu **tidak** bisa tentukan, dan tidak diklaim: kenapa cache dingin
menyerahkan di 2,3 s sementara hangat di 0,3 s (korelasi kunjungan pertama,
bukan sebab terukur), dan apakah distribusi ini sama di CI.

### 7.7 Gerbang

```
bun run check    597 lulus, 0 gagal · 12 rule test
bun run build    hijau
```
