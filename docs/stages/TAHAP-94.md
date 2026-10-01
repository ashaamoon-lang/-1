# Tahap 94 — Anggaran yang diturunkan dari kerjanya, bukan dari kerangka kerja

> **Status: terkirim.** Spec ditulis lebih dulu sesuai `ROADMAP.md` §3.0;
> satu temuan besar datang saat implementasi (§7.3) dan menjadi Tahap 95.
>
> Tahap ini mengoreksi Tahap 93, yang plafonnya saya turunkan dari aritmetika
> token alih-alih dari pengukuran — dan terukur, angka itu terlalu ketat.

---

## 1. Pengukuran

### 1.1 CI sesudah Tahap 93: flaky-nya berulang, tetapi berpindah

```
run 35833489947  (188dd3f)   ci ✓  e2e ✓
                 721 lulus · 1 flaky · 14 dilewati   (20,6 mnt)
```

Uji yang sama, run CI ketiga berturut-turut. **Tetapi pesannya berubah, dan
itu kemajuan yang sebenarnya:**

```
Tahap 91→92   40,1 s   Error: /en/practice/consulting declares no accent region
                       (asersi 5 detik yang tidak pernah kebagian giliran)
Tahap 93      31,7 s   Error: page.screenshot  visual-substance.e2e.ts:268
                       waiting for fonts to load... fonts loaded
```

Menurunkan plafon tirai memindahkan kegagalan sepuluh detik lebih lambat dan
membuat uji itu **menyebut operasi yang benar-benar mahal**. Itu bukan
menutup flaky-nya, dan tidak diklaim begitu; itu membuat kegagalannya bisa
dibaca.

### 1.2 Berapa biaya kerjanya, diukur di perangkat yang sebenarnya

Probe memakai profil persis proyek `mobile` — 390×844, `deviceScaleFactor: 3`,
`hasTouch`, `isMobile` — di laptop senggang, terhadap server produksi:

```
goto          628 / 183 / 160 / 165 ms
entrance     3061 / 2561 / 1979 / 1987 ms
region          17 ms
screenshot     422 / 300 / 306 ms
fonts ready     10 ms
```

Kerja nyata seluruhnya **± 4,7 detik**. Anggaran 30 detik adalah enam kalinya.

### 1.3 Dan di situ derivasi Tahap 93 saya gugur

`TAHAP-93.md` §7.1 menurunkan `ENTRANCE_MS = 6000` dari token tirainya:
`400 + 200 + 400 = 1000 ms`, dikali enam. **Tirai yang sebenarnya selesai di
2,0–3,1 detik**, bukan 1,0 — animasinya tidak mulai saat navigasi, melainkan
sesudah halaman melukis.

Jadi plafon yang saya kirim hanya **1,96–3,0×** nilai terukur di mesin
**senggang**. Di runner yang sibuk ia bisa terlampaui, dan `waitForEntrance`
sengaja **tidak pernah melempar** — ia hanya berhenti menunggu. Gerbangnya
lalu memotret tirainya.

Itu persis cacat yang Tahap 91 perbaiki dan tuliskan angkanya: **238,1 dengan
aksen dan 238,1 tanpa**, dua foto tirai pada pita yang mengukur sekitar 24.
Risiko R1 di `TAHAP-93.md` menamai kemungkinan ini; pengukuran ini
mengubahnya dari kemungkinan menjadi angka.

### 1.4 Akar yang sama di ketiga tahap

Tiga tahap berturut-turut menemukan bentuk yang sama, dan ia layak dinamai
sekali:

> Sebuah tunggu yang plafonnya tidak pernah dihitung terhadap anggaran yang
> melingkupinya, dan sebuah anggaran yang tidak pernah dihitung terhadap kerja
> yang dilingkupinya.

30 000 ms itu bukan anggaran yang diturunkan siapa pun untuk uji ini — ia
default Playwright. Repo ini sudah punya preseden untuk menggantinya dengan
angka yang diturunkan: `WEBGL_TEST_BUDGET_MS = 120_000` di
`e2e/webgl-intent.ts`, yang ada persis karena kerja uji itu melampaui default.

---

## 2. Rancangan

Setiap tunggu dibatasi **di bawah** anggaran yang melingkupinya, dan anggaran
itu diturunkan dari kerja yang diukur di §1.2 — bukan dari kerangka kerja, dan
bukan dari keinginan agar merah hilang.

| #   | tindakan                                                                | angka dan asalnya                                                                              |
| --- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1   | `ENTRANCE_MS` dinaikkan ke nilai yang diturunkan dari tirai **terukur** | 3,1 s terburuk senggang × 5 = **15 s**                                                         |
| 2   | Gerbang aksen diberi anggaran eksplisit                                 | kerja 4,7 s; tunggu terbesar 15 s; margin runner sibuk × ~6 → **90 s**, sejajar preseden 120 s |
| 3   | Setiap `page.screenshot` diberi tenggatnya sendiri                      | 0,42 s terukur × ~35 → **15 s**; jauh di bawah anggaran, jadi kegagalannya menyebut dirinya    |

**Yang tetap TIDAK dilakukan: menaikkan anggaran untuk menyembunyikan merah.**
Bedanya bisa diperiksa: anggaran lama tidak pernah diturunkan dari apa pun,
sementara ketiga angka di atas punya asal yang tertulis dan sebuah pengukuran
di belakangnya. Dan karena tiap tunggu kini punya tenggat sendiri yang jauh
lebih kecil, sebuah operasi yang benar-benar **menggantung** akan menyebut
namanya dalam 15 detik alih-alih menghabiskan anggaran.

---

## 3. Daftar berkas

| berkas                                                | perubahan                                                      |
| ----------------------------------------------------- | -------------------------------------------------------------- |
| `e2e/page-settled.ts`                                 | plafon diturunkan dari tirai terukur, derivasi lama dikoreksi  |
| `e2e/visual-substance.e2e.ts`                         | anggaran eksplisit untuk gerbang aksen; tenggat per-screenshot |
| `docs/stages/TAHAP-93.md`                             | derivasi yang gugur dikoreksi di tempat                        |
| `docs/stages/TAHAP-94.md`, `ROADMAP.md`, `HANDOFF.md` | berkas ini dan posisi                                          |

---

## 4. Kriteria keluar

1. **Merah lebih dulu, atas mekanismenya.** Dengan tirai dipaku terlihat,
   `waitForEntrance` harus berhenti di plafon barunya, dan gerbangnya harus
   gagal dengan pesan yang menyebut apa yang berhenti — bukan dengan timeout
   uji.
2. Sebuah screenshot yang digantung harus gagal dengan pesan yang menyebut
   screenshot, di bawah anggaran uji.
3. `visual-substance` lulus saat diisolasi di laptop ini, di kedua profil.
4. `bun test` hijau; tahap `check` dijalankan satu per satu (`TAHAP-93.md`
   §7.5 menjelaskan kenapa tarikan tunggal tidak andal di sini).
5. **Tidak ada klaim bahwa flaky CI tertutup.** Itu hanya bisa dinyatakan oleh
   beberapa run CI berturut-turut tanpa flaky.

---

## 5. Risiko

| #   | risiko                                                                  | penangkal                                                                                                                  |
| --- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| R1  | Anggaran 90 detik menyembunyikan kegantungan yang sebenarnya            | Tiap tunggu di dalamnya punya tenggat 15 detik sendiri, jadi yang menggantung menyebut namanya jauh sebelum anggaran habis |
| R2  | Suite jadi lebih lambat karena anggaran lebih besar                     | Anggaran bukan durasi — uji yang lulus tetap selesai dalam ~6 detik. Ia hanya mengubah kapan Playwright menyerah           |
| R3  | Sebab 31,7 detik di CI ternyata bukan kelambatan, melainkan kegantungan | Justru itu yang §2.3 buat terbaca; kalau benar, run CI berikutnya akan mengatakannya dengan nama operasinya                |

---

## 6. Yang tidak dikerjakan, dinyatakan eksplisit

- **Flaky CI tidak diklaim tertutup** — §4 butir 5.
- **Sebab kelambatan di CI belum diketahui** — §1.1 hanya memindahkan pesannya
  ke operasi yang benar; kenapa operasi itu memakan puluhan detik di sana
  belum diukur, dan tidak bisa diukur dari laptop ini.
- **Nol angka performa diklaim** — `CLAUDE.md` #19.

---

## 7. Hasil

### 7.1 Kedua mekanisme, terbukti

```
tirai dipaku terlihat   waitForEntrance = 15 034 ms   berhenti di plafonnya,
                                                       bukan di anggaran
screenshot ditenggat 1ms  gagal dalam 7 ms
                          TimeoutError: page.screenshot: Timeout 1ms exceeded
```

Yang kedua itu inti tahap ini: sebuah operasi yang tidak selesai kini
**menyebut namanya sendiri**, alih-alih menghabiskan anggaran dan membiarkan
asersi berikutnya yang disalahkan.

### 7.2 Angka terakhir yang tidak diturunkan dari apa pun, ditutup

Sesudah anggaran berhenti jadi leher botol, yang tercetak adalah
`toBeAttached()` dengan default `expect` **5 detik** — satu-satunya angka di
rantai itu yang masih warisan kerangka kerja. Region-nya ada di HTML yang
dilayani (`curl` mengembalikannya) dan menempel dalam **17 ms** di mesin
senggang, jadi tenggatnya diturunkan dari itu: **20 detik**.

### 7.3 Dan itu membuka sebab biayanya, yang bukan soal anggaran sama sekali

Dengan tenggat 20 detik, uji yang sama tetap gagal — jadi ini bukan angka
yang terlalu ketat. Durasi per varian menjawabnya:

```
proyek desktop   9,1 s   9,4 s   3,6 s   3,3 s
proyek mobile   46,0 s   GAGAL   9,1 s   6,5 s
```

Yang meledak adalah varian **"at desktop" di dalam proyek `mobile`**. Proyek
itu menyetel `deviceScaleFactor: 3`; ujinya lalu menyetel viewport
`1280×720`. Hasilnya setiap screenshot berukuran **3840×2160 — 8,3
megapiksel**, dua kali per uji, terhadap 0,9 megapiksel di proyek desktop.

Itu **kombinasi yang tidak dimiliki perangkat mana pun**: iPhone 13, yang
metriknya ditiru proyek itu, adalah 390 px pada DPR 3. Dan varian itu
menduplikasi `[desktop] ... at desktop` yang sudah ada, berbeda hanya pada DPR
— sementara yang diukur gerbang ini adalah rerata tone sebuah pita, yang
tidak berubah oleh rasio piksel.

Jadi flaky CI yang bertahan empat run bukan gerbang yang salah tulis dan bukan
anggaran yang kurang: ia satu varian yang membayar sembilan kali lipat piksel
untuk cakupan yang sudah dimiliki. **Itu keputusan cakupan, bukan keputusan
tenggat**, jadi ia tidak ditumpangkan ke tahap ini — `docs/stages/TAHAP-95.md`.

### 7.4 Gerbang

```
gerbang aksen sendirian   [mobile] /en/practice/consulting at desktop  14,3 s lulus
gerbang aksen berurutan   7 lulus, 1 gagal — varian §7.3
bun test                  597 lulus, 0 gagal
oxlint · lint:types · tsc  bersih
```

### 7.5 Yang tidak tertutup

Flaky CI **tidak** diklaim tertutup, dan tahap ini memang tidak menutupnya.
Yang ia hasilkan: setiap tunggu di rantai itu kini punya tenggat yang
diturunkan dan lebih kecil dari anggaran yang melingkupinya, kegagalan menyebut
operasinya sendiri, dan sebab biayanya akhirnya terukur.
