# Tahap 97 — Dokumen serah-terima yang tidak bisa berbohong lagi

> **Status: terkirim.** Spec ditulis lebih dulu sesuai `ROADMAP.md` §3.0;
> hitungannya naik dari empat ke **lima** angka salah saat implementasi (§7.2),
> dan aturannya menangkap dirinya sendiri sekali (§7.3).
>
> Diminta pemilik repo, yang akan melanjutkan pekerjaan ini **lewat terminal
> Claude Code**: _"kamu harus menyiapkannya dengan seksama."_ Dokumen yang
> pertama dibaca siapa pun yang melanjutkan adalah `HANDOFF.md`, dan empat
> angka di dalamnya salah.

---

## 1. Pengukuran

### 1.1 Empat pernyataan yang tidak lagi benar

| tempat           | yang tertulis                                    | yang benar hari ini                               |
| ---------------- | ------------------------------------------------ | ------------------------------------------------- |
| §1 tabel gerbang | `bun run check` **565 lulus**, 55 berkas         | **597 lulus**, 59 berkas                          |
| §1 tabel gerbang | `test:e2e` **713 lulus / 2 flaky / 15 dilewati** | CI terakhir **722 lulus / 14 dilewati / 0 flaky** |
| §2 langkah mulai | `bun run check  # harus 579 lulus`               | 597                                               |
| §4 judul bagian  | "Yang berikutnya: **Tahap 79**, sudah diukur"    | Tahap 79–96 sudah terkirim                        |

§4 itu tujuh belas tahap tertinggal. Seorang pembaca yang mempercayainya akan
mengerjakan ulang pekerjaan yang sudah ada di repo.

### 1.2 Dan dokumen itu sudah memuat aturan yang mencegahnya

`HANDOFF.md` §1 menulis, tentang hash commit dan nomor run CI:

> _"Fakta yang tidak bisa benar saat ditulis tidak ditulis; yang ditulis adalah
> perintah yang menjawabnya."_

Aturannya benar. Ia hanya **diterapkan pada satu jenis fakta**. Angka gerbang
punya bentuk yang persis sama — ia benar pada saat ditulis dan salah pada
commit berikutnya — dan tetap ditulis sebagai angka empat kali.

Itu sebabnya tahap ini bukan sekadar memperbarui angkanya. Memperbarui angka
menghasilkan dokumen yang benar hari ini dan salah lagi di Tahap 98.

### 1.3 Yang sudah benar, dan dikatakan apa adanya

Dua hal diperiksa dan **tidak** rusak, jadi tidak ada yang dibingkai sebagai
temuan:

```
perintah `bun run <x>` yang dirujuk dokumen   HANDOFF 4 . MENJALANKAN-LOKAL 5 . ROADMAP 7
yang tidak ada lagi di package.json           nol
```

Dan mekanismenya sudah setengah ada: `lib/scripts/stage-position.test.ts`
memang membaca `HANDOFF.md`, hanya saja ia menjaga **nomor tahap** dan tidak
menyentuh yang lain.

---

## 2. Rancangan

| #   | tindakan                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | §1 dan §2 berhenti memuat tally gerbang; keduanya memuat **perintah** yang menjawabnya, persis seperti blok hash di §1 sudah lakukan                   |
| 2   | §4 diganti: bukan rencana yang disalin tangan, melainkan penunjuk ke `ROADMAP.md` (yang nomor tahapnya sudah dijaga uji) dan ke §5 untuk utang terbuka |
| 3   | `stage-position.test.ts` diperluas: **§1 dan §2 tidak boleh memuat tally yang dipakukan**, dan ujinya menyebut kenapa                                  |
| 4   | Angka bersejarah tetap boleh, **di §5**, karena di sana ia selalu menyebut run atau tanggal asalnya                                                    |

Perbedaan antara angka yang sah dan tidak sah bisa dinyatakan mekanis:

```
§5  "run 35439317243 melaporkan 722 lulus"   <- menyebut asalnya, tetap benar selamanya
§1  "bun run check  565 lulus"               <- tidak menyebut apa pun, salah sejak commit berikutnya
```

### 2.1 Yang TIDAK dilakukan

- **Tidak membuat generator baru.** Menjalankan `bun test` dari dalam sebuah
  uji untuk menghitung ujinya sendiri lambat dan berputar. Aturan §1.2 sudah
  cukup: jangan tulis angkanya, tulis perintahnya.
- **§5 tidak disentuh.** Catatan utangnya menyebut run dan tanggal, dan itu
  yang membuatnya tetap benar.

---

## 3. Daftar berkas

| berkas                                  | perubahan                               |
| --------------------------------------- | --------------------------------------- |
| `docs/HANDOFF.md`                       | §1, §2, §4                              |
| `lib/scripts/stage-position.test.ts`    | uji baru: §1 dan §2 tanpa tally terpaku |
| `docs/stages/TAHAP-97.md`, `ROADMAP.md` | berkas ini dan posisi                   |

---

## 4. Kriteria keluar

1. **Merah lebih dulu.** Uji baru dijalankan terhadap `HANDOFF.md` yang
   **sekarang** dan harus merah, menyebut baris yang melanggar.
2. Sesudah §1/§2 diperbaiki, uji itu hijau.
3. Nol angka gerbang tersisa di §1 dan §2; §5 tidak berubah.
4. `bun test` hijau; tahap `check` dijalankan satu per satu.
5. Seorang pembaca baru yang mengikuti §2 mendapat perintah yang jalan, dan
   **tidak ada angka yang bisa membuatnya mengira ada regresi**.

---

## 5. Risiko

| #   | risiko                                                       | penangkal                                                                                                                      |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| R1  | Uji pelarang tally memberi positif palsu pada prosa yang sah | Lingkupnya hanya §1 dan §2, dan polanya khusus: angka yang diikuti kata "lulus"/"gagal"/"dilewati". §5 sengaja di luar lingkup |
| R2  | Menghapus angka membuat dokumen kurang informatif            | Yang hilang adalah angka yang salah. Yang menggantikan adalah perintah yang menghasilkan angka benar dalam hitungan detik      |
| R3  | Pembaca tetap butuh gambaran besar                           | §4 yang baru menunjuk ke `ROADMAP.md`, yang memuat satu entri per tahap dengan angkanya masing-masing **beserta tahapnya**     |

---

## 6. Yang tidak dikerjakan, dinyatakan eksplisit

- **Tidak ada generator baru** — §2.1.
- **§5 tidak disentuh** — §2.1.
- **Nol angka performa diklaim** — `CLAUDE.md` #19.

---

## 7. Hasil

### 7.1 Merah lebih dulu, lalu hijau

```
uji baru terhadap HANDOFF.md yang lama    2 gagal
  §1 memaku  565 lulus . 713 lulus . 0 gagal . 2 flaky . 15 dilewati
  §2 memaku  579 lulus
sesudah §1/§2/§4 ditulis ulang            16 lulus, 0 gagal
```

### 7.2 Angka kelima, ditemukan saat implementasi

Spec ini menghitung empat. Yang kelima ada di §4, dan ia jenis yang paling
halus: tabel anggaran momen di sana **disalin tangan** dan menyebut **12**
momen berbeda, sementara `docs/DIREKSI.md` §3.2b memuat blok yang
**men-generate** angka itu dan diuji terhadap hanyut — dan blok itu menyebut
**13**.

Jadi dokumen ini menyalin tangan sebuah angka yang sudah punya sumber yang
menjaga dirinya sendiri. §4 kini menunjuk ke sumber itu alih-alih
menyalinnya, bersama dua sumber lain yang juga ter-generate atau teruji.

### 7.3 Aturannya gagal pada dokumennya sendiri, di percobaan pertama

Regex pertama membaca kalimat **yang memperkenalkan aturan itu** —
_"§1 dan §2 gagal kalau sebuah tally dipaku"_ — sebagai tally "2 gagal".
Risiko R1 menamai kemungkinan ini; percobaan pertama mengubahnya jadi kejadian.

Sebabnya bisa dinyatakan persis: rujukan bagian dan tally punya bentuk yang
sama — angka diikuti kata — dan hanya yang **mendahuluinya** yang
membedakan. Lookbehind `(?<![§\w])` menutupnya, dan kasus itu sendiri kini
jadi uji, supaya koreksinya tidak bisa hilang diam-diam.

### 7.4 Yang sengaja dihapus, bukan dipindahkan

Satu paragraf bertanggal di §1 memuat pengukuran 19 September 2026 beserta
nomor run CI-nya. Ia **sah** menurut aturan tahap ini — ia menyebut asalnya —
tetapi analisisnya sudah ada utuh di `docs/stages/TAHAP-81.md` §7.2, yang
paragraf itu sendiri rujuk. Duplikatnya dihapus, bukan dipindah ke §5.

Yang hilang bersamanya: nomor run itu sebagai satu-satunya salinan di dokumen
ini. Itu dinyatakan, bukan dibulatkan.

### 7.5 Gerbang

```
stage-position       16 lulus, 0 gagal   (12 sebelumnya, 4 uji baru)
oxlint . lint:types  bersih
```
