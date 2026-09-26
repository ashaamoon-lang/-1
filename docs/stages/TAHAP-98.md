# Tahap 98 — Bukti yang dibuang persis pada kasus yang membutuhkannya

> **Status: terkirim.** Spec ditulis lebih dulu sesuai `ROADMAP.md` §3.0;
> temuan terbesarnya datang saat implementasi dan bukan di lingkup awal — §1.5.
>
> Menutup pertanyaan **kenapa** flaky aksen tidak pernah bisa diatribusikan
> sejak Tahap 91, tanpa mengklaim flaky-nya sendiri tertutup.

---

## 1. Pengukuran

### 1.1 Flaky-nya berulang, dan untuk pertama kalinya ia mengatakan sesuatu

CI `bcf78b0` (Tahap 96): **722 lulus / 1 flaky / 14 dilewati**, total 737 —
naik satu dari 736, persis gerbang baru Tahap 96, sesuai prediksi. Flaky-nya
uji yang sama sejak Tahap 91. Tetapi pesannya baru:

```
Tahap 91→92   Error: /en/practice/consulting declares no accent region   (timeout 30 s)
Tahap 93      Error: page.screenshot                                     (timeout 30 s)
Tahap 96      Error: the accent added no modulation: its own contribution spans 1.9
              Expected: > 3   Received: 1.9278        (uji berjalan 52,2 s, tuntas)
```

**Itu Tahap 94 bekerja.** Dengan anggaran 90 detik yang diturunkan dari
kerjanya, uji yang memakan 52,2 detik tidak lagi mati di tengah jalan; ia
selesai dan melaporkan apa yang benar-benar diukurnya. Tiga tahap
memindahkan pesan itu dari "waktu habis" menjadi sebuah besaran.

Dan besaran itu adalah butir yang `HANDOFF.md` §5 catat sebagai **belum
diatribusikan** sejak Tahap 91: _"added no modulation: 0.9"_.

### 1.2 Di laptop ini angkanya tidak pernah goyah

`added.range` adalah `p95 − p05` dari selisih per-piksel kedua bingkai,
sesudah keduanya diperkecil ke 64×40. Ambangnya 3.

```
penundaan 0 / 150 / 400 / 800 / 1600 / 3200 ms    range 8.00 di setiap titik
muat segar, diukur seketika                        range 8.00
lima run berurutan                                 range 8.00, coverage 100%
```

Jadi aksennya **tidak berkembang seiring waktu** — ia ada sejak bingkai
pertama. Hipotesis pertama saya, bahwa gerbang mengukur sebelum wash sempat
melukis, gugur di sini.

### 1.3 Tiga mekanisme tereliminasi, masing-masing dengan angkanya

Tanda tangan CI sangat spesifik: **coverage di atas 50%, range 1,9**. Setiap
mekanisme yang saya uji menghasilkan bentuk yang **berbeda**:

```
tirai menutup penuh        range  0.00   coverage   0.0%   <- gagal di coverage
tirai terangkat 55%        range 11.93   coverage  15.0%   <- gagal di coverage
gulir 700 px               range 10.21   coverage  10.5%   <- gagal di coverage
gulir 1200 / 2000 px       range  0.00   coverage   0.0%   <- gagal di coverage
gulir 0 / 100 / 200 / 400  range 8.0-10.6 coverage ~100%   <- lulus
```

Tidak satu pun menghasilkan "tertutup penuh tetapi rata". Ketiganya gugur.

### 1.4 Dan "fallback rata" mustahil

```
background-image  linear-gradient(135deg, lab(4.43…), oklab(0.265…))
background-color  rgba(0, 0, 0, 0)
anak elemen       0
```

Region aksen itu **hanya** gradien. Meratakannya (`background-image: none`)
memberi `range 0.00, coverage 0.0%` — menghapus seluruh kontribusi, bukan
memipihkannya. Jadi keadaan CI adalah gradien yang **tercat penuh dengan
kedua ujungnya nyaris sama**, dan laptop ini tidak bisa menghasilkannya.

Itu batas yang jujur: pencarian menyempit drastis, atribusinya belum ada.

### 1.5 Dan di sini sebab sebenarnya kenapa ia tak pernah bisa diatribusikan

`.github/workflows/ci.yml`, sebelum tahap ini:

```yaml
- name: Upload Playwright report
  if: failure() && steps.gate.outputs.run == 'true'
```

**Sebuah uji flaky lulus saat retry.** Job-nya sukses, `failure()` bernilai
salah, dan artefaknya tidak pernah diunggah. Bukti dari percobaan yang gagal
— screenshot, trace, konteks — dihasilkan setiap kali dan dibuang setiap
kali, persis pada satu kasus yang membutuhkannya.

Tujuh tahap mencari sebab sebuah flaky sementara buktinya ada di runner dan
dihapus setelah job selesai.

### 1.6 Ditambah satu lapis lagi: lampiran yang tidak pernah menyentuh disk

Percobaan pertama saya memakai `testInfo.attach(name, { body })`. Diukur:
`test-results/<test>/` **kosong sama sekali** sesudahnya. Lampiran ber-`body`
disimpan di memori dan hanya sampai ke reporter yang men-serialisasinya;
`playwright.config.ts:8` memakai `list`, yang tidak. Jadi mekanisme itu tidak
akan pernah sampai ke siapa pun.

---

## 2. Rancangan

| #   | tindakan                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | Gerbang aksen menulis bukti ke `testInfo.outputPath()` sebagai **berkas**, lalu melampirkannya **by path**               |
| 2   | Syarat menulisnya **mencerminkan asersinya persis**, jadi run yang lulus menulis nol dan run yang gagal menulis semuanya |
| 3   | `ci.yml` menyimpan artefak untuk run yang **flaky**, bukan hanya yang gagal                                              |

Yang ditulis: kedua bingkai yang dibandingkan, dan satu JSON berisi `lit`,
`bare`, `added`, ambangnya, serta bagaimana region itu benar-benar tercat —
`background-image`, `background-color`, `opacity`, `transform`, kotaknya,
`scrollY`, `devicePixelRatio`, dan keadaan tirai.

Itu daftar yang diturunkan dari §1.3–§1.4: tiap baris menjawab satu
mekanisme yang sudah tereliminasi, supaya kejadian berikutnya tidak perlu
mengulang eliminasi yang sama.

---

## 3. Daftar berkas

| berkas                                                | perubahan                                           |
| ----------------------------------------------------- | --------------------------------------------------- |
| `e2e/visual-substance.e2e.ts`                         | penangkap bukti pada gerbang aksen                  |
| `.github/workflows/ci.yml`                            | artefak disimpan untuk run flaky, bukan hanya gagal |
| `docs/stages/TAHAP-98.md`, `ROADMAP.md`, `HANDOFF.md` | berkas ini, posisi, dan utang §5 dipersempit        |

---

## 4. Kriteria keluar

1. Run yang lulus menulis **nol** berkas bukti.
2. Run yang memenuhi syarat menulis ketiganya, dan berkasnya benar-benar ada
   di disk — diverifikasi dengan `ls`, bukan diasumsikan.
3. `bun test` hijau; tahap `check` dijalankan satu per satu.
4. **Flaky-nya tidak diklaim tertutup.** Tahap ini memperbaiki kemampuan
   mendiagnosisnya, bukan cacatnya.

---

## 5. Risiko

| #   | risiko                                                   | penangkal                                                                                                                                                                          |
| --- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Artefak diunggah tiap run dan membengkak                 | Playwright hanya menulis ke `test-results/` untuk uji yang gagal, di-retry, atau melampirkan sesuatu; run bersih mengunggah nol, dan `if-no-files-found: ignore` membuatnya senyap |
| R2  | Syarat penulisan salah kalibrasi dan menangkap run sehat | Terjadi di percobaan pertama — §7.1 — dan ditutup dengan mencerminkan asersinya alih-alih memilih ambang sendiri                                                                   |
| R3  | Bukti tetap tidak cukup menjelaskan sebabnya             | Mungkin. Yang dijamin tahap ini adalah bahwa kejadian berikutnya **punya** bukti; tidak ada janji bahwa bukti itu cukup                                                            |

---

## 6. Yang tidak dikerjakan, dinyatakan eksplisit

- **Flaky-nya tidak diperbaiki dan tidak diklaim tertutup** — §4.4.
- **Sebab `range 1.9` belum diatribusikan** — §1.4; tiga mekanisme gugur,
  yang keempat belum ada.
- **Nol angka performa diklaim** — `CLAUDE.md` #19.

---

## 7. Hasil

### 7.1 Kalibrasi pertama saya salah, dan angkanya yang menunjukkannya

Syarat pertama berbunyi "dekat dengan lantai", yakni `range < ambang × 2`.
Dijalankan, ia menulis bukti pada run yang **lulus**:

```
/en at mobile                    range 4.93 dan 5.00   <- sehat, tetapi di bawah 6
/en/practice/consulting mobile   range 8.00-8.93       <- sehat
kegagalan CI                     range 1.93
```

Ambang apa pun yang saya pilih sendiri akan duduk di antara 5,00 dan 1,93
tanpa alasan. Syaratnya diganti menjadi **cerminan persis kedua asersinya**,
yang tidak membutuhkan ambang sendiri sama sekali.

Diverifikasi: run bersih menulis nol berkas; run yang dipaksa memenuhi syarat
menulis `accent-with.png`, `accent-without.png`, dan `accent-reading.json`.

### 7.2 Dan isinya memang menjawab pertanyaan yang benar

```json
"lit":   { "p05": 18.28, "mean": 22.65, "p95": 27.21, "range": 8.93 }
"bare":  { "p05": 13.28, "mean": 13.77, "p95": 14.28, "range": 1.00 }
"added": { "range": 8.93, "coverage": 1.0 }
```

`bare.range = 1` — tanah tanpa aksen memang rata. Jadi `added.range = 1.9` di
CI berarti bingkai **ber-aksen** hampir serata bingkai tanpa aksen, dan
JSON-nya akan menunjukkan mana dari keduanya yang menyimpang.

### 7.3 Gerbang

```
visual-substance "carries tone", proyek desktop   4 lulus, 0 gagal, 0 berkas bukti
oxlint . lint:types                               bersih
```

Satu merah di proyek `mobile` pada laptop ini (`consulting at desktop`); lulus
sendirian dalam 19,1 detik. Pola beban yang `TAHAP-93.md` §7.2 sudah ukur dan
namai, bukan temuan baru.
