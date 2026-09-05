# Tahap 44 — Permukaan buta mendapat mata

> Dial yang dibelanjakan: **VISUAL_DENSITY** (2 → 3, satu-satunya dial yang
> sengaja hampir tidak bergerak — `DESIGN-SYSTEM.md` §Dial).
> **Nol konten karangan** dan **nol koreografi baru**. Keduanya disengaja.

## 1. Cacat B6, diukur

Diukur pada build produksi, HTML server, `<img>` dihitung per rute:

| Rute                     |                                    Gambar |
| ------------------------ | ----------------------------------------: |
| `/en`                    |                                         5 |
| `/en/work`               |                                         6 |
| `/en/work/<slug>`        |                                         4 |
| `/en/practice/<value>`   |                                         2 |
| **`/en/studio`**         |                                     **0** |
| **`/en/journal`**        |                                     **0** |
| **`/en/journal/<slug>`** |                                     **0** |
| `/en/ai`                 | 0 — permukaan mesin, sengaja tanpa gambar |

Tiga dari delapan permukaan manusia buta, dan ketiganya adalah sepertiga
situs yang subjeknya adalah **karya komisi**. Ini bukan permintaan konten
baru: sampul enam proyek sudah ada di CMS dan sudah dipakai di tiga rute
lain. Yang hilang bukan gambarnya, melainkan pemakaiannya.

## 2. Premis rencana yang salah, untuk keempat tahap berturut-turut

Rencana menulis: _"`/journal/<slug>` mendapat satu gambar pembuka **bila
entri menyebut proyek**."_

**Entri jurnal tidak bisa menyebut proyek.** `schemas/journalEntry.ts`
punya `title`, `slug`, `date`, `summary`, `body`, `practice`, `listed` — dan
tidak ada referensi ke `project` sama sekali.

Dua jalan, dan yang pertama ditolak:

- **Menambah field `project`.** Mengubah model konten untuk data yang tidak
  ada di belakangnya: keenam fixture tidak menyetelnya, jadi field baru itu
  akan merender **nol gambar** dan kebutaannya tetap. Menambah kolom kosong
  bukan perbaikan, itu penundaan yang berpakaian.
- **Memakai praktik yang entrinya sudah nyatakan.** Dipilih. Ketiga entri
  membawa praktik nyata (`consulting`, `consulting`, `ai-data`), dan tiap
  praktik punya karya di belakangnya — diukur di Tahap 43 lewat hitungan
  chip: `Consulting 02`, `AI & Data 02`, `Commission 02`. Sebuah esai tentang
  satu praktik yang berdampingan dengan karya dari praktik itu adalah
  hubungan yang **sudah benar di data**, bukan yang dikarang untuk mengisi
  ruang.

Itu juga menjaga aturan tetap #10: nol konten karangan. Tidak ada satu pun
nama, angka, atau relasi baru yang ditulis; yang berubah hanya apa yang
sudah ada ditampilkan.

## 3. Yang dibangun

### 3a — `/studio` mendapat bukti, bukan galeri

Strip sampul karya di bawah pernyataan studio. Halaman studio hari ini
**tidak mengambil konten sama sekali** — ia seluruhnya statis — jadi ini
menambahkan `sanityFetch` pertamanya, di balik `'use cache'` seperti setiap
rute lain.

**Bentuknya diputuskan dengan angka, bukan selera.** `ProjectCard`
menurunkan `maxWidth` dan `sizes` dari `span`: 12 → 1440px, selain itu →
704px. Tiga pilihan dipertimbangkan:

| Bentuk               | Masalahnya                                                                 |
| -------------------- | -------------------------------------------------------------------------- |
| 2 kartu `span 6`     | Memotong empat karya unggulan jadi dua, tanpa aturan yang menjelaskan mana |
| 4 kartu `span 6`     | Dua baris penuh — itu galeri, dan `/work` sudah galeri                     |
| **3 kartu `span 4`** | **Dipilih** — satu baris, satu kartu per praktik                           |

`span 4` berarti `ProjectCard` butuh cabang ketiga untuk `maxWidth` dan
`sizes`. Itu ditambahkan alih-alih dibiarkan meminta 704px untuk kotak
~469px: pelajaran `project-card` sendiri mencatat bahwa default yang
kebesaran **tidak pernah error**, ia hanya mengunduh ~4× byte. `span` di
sini adalah keputusan **tata letak**, bukan nilai skema — sama seperti
`layout="catalogue"` yang sudah menimpa `span` jadi 6.

### 3b — `/journal` mendapat sampul per baris

Tiap baris indeks menampilkan satu sampul dari praktik yang barisnya sudah
sebutkan. Sampulnya duduk **di dalam** `.row`, yang berarti ia mewarisi
resesi baca yang sudah ada (`--row-recede`) — jadi ia menguat ketika
barisnya jadi baris yang dibaca, **tanpa satu pun deklarasi gerak baru**.

Itu bukan kebetulan yang beruntung, itu alasan menaruhnya di sana: momen
`journal-index` sudah dihitung §9.5, dan menambahkan gerak kedua ke elemen
baru akan memaksa amandemen anggaran untuk sesuatu yang bisa didapat gratis
dengan pewarisan.

### 3c — `/journal/<slug>` mendapat satu gambar pembuka

Satu sampul dari praktik entri, di bawah judul dan sebelum badan tulisan.
Ketika entri tidak punya praktik, atau praktik itu tidak punya karya:
**ketidakhadiran yang dirancang** — tidak ada placeholder, tidak ada kotak
kosong, tidak ada teks "gambar akan datang".

### 3d — `alt` yang identik diperbaiki

Temuan Tahap 31, masih terbuka, dan ia **sampai ke pembaca**. Diukur pada
`/en/work/arus-balik`:

```
   1 alt=""
   3 alt="Diagram of a system under review, one mass lit from the left"
```

Tiga gambar berbagi satu string. `seed-fixtures.ts:735-739` memberi `cover`
dan **setiap** plat galeri `project.alt` yang sama, jadi pembaca layar
mendengar deskripsi sampul tiga kali per proyek dan dua kali di antaranya
salah — plat galeri bukan sampulnya.

Skripnya diperbaiki: tiap plat mendapat `alt`-nya sendiri, dwibahasa, yang
menjelaskan plat itu.

> **Yang tidak dilakukan tanpa izin Anda:** perbaikan skrip saja **tidak
> mengubah situs**. Proyek dibaca dari Sanity dan tidak punya berkas
> fallback, jadi `alt` yang tayang baru berubah setelah dataset di-seed
> ulang — sebuah **tulisan ke CMS Anda**. Itu tindakan keluar yang tidak
> saya jalankan sendiri; lihat §6.

## 4. Nol koreografi baru, dan itu keputusan

Rencana menyebutnya, dan alasannya bertahan setelah diukur: menambah gerak
ke halaman kosong hanya membuat kekosongannya bergerak. Ketiga permukaan ini
kekurangan **isi**, bukan gerak. Sampul jurnal mewarisi resesi yang ada;
strip studio mewarisi `Reveal` yang sudah membungkus tiap seksi halaman itu;
`ProjectCard` membawa parallax dan `work-transport`-nya sendiri ke mana pun
ia dipasang.

**Anggaran §9.5 tidak disentuh.** Nol momen bernama baru di ketiga rute.

## 5. Gerbang — `e2e/visual-substance.e2e.ts` diperluas

Tiap rute manusia merender **≥1 gambar**, atau lolos pemeriksaan kepadatan
tipografis eksplisit yang menyatakan ia sengaja tanpa gambar (`/ai`, dan 404).
Dibuktikan merah dulu dengan tabel §1: studio 0, jurnal 0, entri 0.

Ditambah: nol proyek yang dua gambar galerinya berbagi `alt` — asersi yang
akan tetap merah sampai dataset di-seed ulang, dan itu **disengaja**, karena
gerbang yang hijau atas cacat yang masih tayang lebih buruk daripada tidak
ada gerbang.

## 6. Hasil

### 6.1 Gerbang dibuktikan merah lebih dulu

`e2e/visual-substance.e2e.ts` dijalankan terhadap situs sebelum satu baris
kode Tahap ini ditulis: **4 gagal, 5 lulus**, dengan pesan yang berisi
angkanya sendiri:

```
/en/studio renders 0 images
/en/journal renders 0 images
/en/journal/scope-is-the-deliverable renders 0 images
3 described images share 1 description(s): Diagram of a system under review…
```

### 6.2 Yang dikirim, diukur pada build produksi

| Rute                 | Sebelum | Sesudah |
| -------------------- | ------: | ------: |
| `/en/studio`         |       0 |   **3** |
| `/en/journal`        |       0 |   **3** |
| `/en/journal/<slug>` |       0 |   **1** |
| `/id/studio`         |       0 |   **3** |
| `/id/journal`        |       0 |   **3** |

`alt` pada halaman proyek, diukur pada halaman yang dirender:

```
sebelum:  1 alt=""   3 alt="Diagram of a system under review…"
sesudah:  1 alt=""   1 "Diagram of a system under review…"
                     1 "A low horizon in warm brown…"
                     1 "An upright green field…"
```

`alt=""` yang tersisa **bukan cacat dan tidak disentuh**:
`vault/blocks/next-project` sudah menuliskan alasannya — gambar itu mengulang
judul yang duduk di sebelahnya, jadi ia dekorasi, dan memberinya deskripsi
akan membuat tautannya diumumkan sebagai "Panas Sore, lukisan akrilik tiga
figur, Panas Sore". Gerbangnya mengabaikan `alt` kosong justru karena itu.

**Bahasa `alt` ikut bahasa halaman**, diverifikasi terpisah karena inilah
satu-satunya string di halaman yang dibaca **alih-alih** dilihat:
`/id/journal` mengirim "Diagram sistem yang sedang ditinjau, satu massa
disinari dari kiri".

### 6.3 Empat koreksi terhadap rencana, semuanya dengan bukti

1. **"Entri yang menyebut proyek" tidak bisa ada.** §2 — tidak ada field-nya.
   Praktik dipakai sebagai gantinya; nol konten dikarang.
2. **Satu sampul per praktik menghasilkan gambar kembar.** Diukur pada
   `/en/journal`: dua dari tiga entri berpraktik `consulting`, jadi dua baris
   membawa **gambar yang sama** — tiga gambar, dua deskripsi. Gambar berulang
   di sebuah indeks tidak terbaca sebagai "keduanya sepraktik", ia terbaca
   sebagai bug. Diperbaiki: tiap praktik menyimpan daftarnya dan baris
   mengambil bergiliran. Sesudahnya: tiga baris, **tiga deskripsi berbeda**.
3. **`$locale` wajib, dan `'en'` yang di-hardcode adalah cacat.** Build gagal
   pertama kali dengan `param $locale referenced, but not provided`; versi
   pertama `coverForPractice` menambal itu dengan `locale: 'en'`, yang akan
   mendeskripsikan plat setiap halaman Indonesia dalam bahasa Inggris.
   Ketiganya sekarang menerima locale pembaca.
4. **`alt` galeri milik platnya, bukan proyeknya.** Keenam karya mengambil dua
   plat yang **sama** (`plate-wide`, `plate-tall`), jadi deskripsi yang jujur
   ditulis sekali per plat — bukan enam parafrase dari dua gambar yang sama.

### 6.4 Dataset di-seed ulang, dengan izin Anda

Perbaikan `seed-fixtures.ts` saja tidak mengubah situs: proyek dibaca dari
Sanity dan tidak punya berkas fallback. Seed ulang adalah **tulisan ke CMS**,
jadi ia ditanyakan lebih dulu dan bukan dijalankan diam-diam. Anda memilih
menjalankannya; `createOrReplace` pada enam dokumen ber-id `fixture-` plus
sepuluh aset plat, nol dokumen non-fixture disentuh.

**Dan satu jebakan pengukuran tertangkap di sini.** Setelah seed sukses,
halaman masih menampilkan `alt` lama. Dataset diperiksa langsung — sudah
benar — lalu `apicdn` diperiksa — juga sudah benar. Yang basi adalah cache
`'use cache'` Next yang bertahan karena server lama masih berjalan saat build
diulang. Dibunuh dan dibangun ulang bersih, `alt`-nya benar. Kalau saya
berhenti pada pengukuran pertama, saya akan melaporkan seed yang gagal
padahal yang gagal adalah caranya diukur.

### 6.5 Nol koreografi baru, dan nol amandemen §9.5

Sampul jurnal duduk **di dalam** `.row`, jadi ia mewarisi `--row-recede` yang
sudah ada dan menguat bersama barisnya tanpa satu pun deklarasi gerak baru.
Strip studio dan plat pembuka memakai `Reveal` yang sudah membungkus setiap
seksi kedua halaman itu. Nol `data-epic` baru; anggaran momen tidak disentuh
di ketiga rute.

### 6.5b Dua rute melewati plafon anggarannya, dan nol plafon dinaikkan

Suite penuh setelah kode pertama: **542 lulus, 4 gagal, 1 flaky**. Keempatnya
satu sebab:

```
/en/studio  is 902KB, budget 900KB
/en/journal is 901KB, budget 900KB
```

Isi baru memang punya berat, dan rencana Tahap ini — tidak seperti Tahap 43 —
**tidak** mengizinkan menaikkan plafon. `route-budget.e2e.ts` sendiri sudah
dua kali mencatat aturannya: perbaikannya adalah berhenti mengirim beratnya.
Diikuti, dua kali:

**`/en/journal`, 870 → 901 → kembali di bawah plafon.** Barisnya adalah
pulau klien, jadi mengimpor `SanityImage` ke dalamnya memasukkan komponen itu
**dan seluruh dependensinya** ke bundel pulau tersebut — untuk sebuah gambar
yang datanya sudah diketahui server. Sampulnya sekarang **dirender di
`page.tsx`** dan diserahkan ke pulau sebagai `ReactNode`. Sebuah elemen
adalah nilai, jadi ia menyeberangi batas RSC tanpa membawa implementasinya;
aturan yang dilanggarnya bukan itu melainkan yang dipelajari
`vault/motion/counter` di Tahap 42 — sebuah **fungsi** tidak bisa
menyeberang, keluarannya bisa.

**`/en/studio`, 856 → 902 → kembali di bawah plafon.** `ProjectGrid`
memanggil `useFlipGrid`, karena katalog perlu menganimasikan kartu yang
bertahan ketika filter mengubah daftarnya. Tidak ada apa pun di halaman
studio yang pernah mengubah daftar ini, jadi modul FLIP dan impor
ScrollTrigger-nya adalah berat yang dikirim untuk menjalankan **nol**.
Halaman studio sekarang merender `ProjectCard` langsung ke dalam `<ul>`-nya
sendiri: enam baris CSS menggantikan 46KB JavaScript. Kartunya tetap dipakai
ulang — ia harus benda yang sama dengan yang situs ini tunjukkan di tempat
lain; yang tidak dipakai ulang adalah host grid, yang ada untuk perilaku yang
halaman ini tidak punya.

Sesudahnya: **sembilan rute lulus, nol plafon disentuh.**

Satu tes flaky di ronde itu (`lightbox` "the picture fits the stage") lulus
saat diulang dan tidak muncul lagi setelah perbaikan di atas — dicatat di
sini karena tahap ini tidak menyentuh lightbox, dan sebuah flake yang tidak
dijelaskan tetap sebuah flake.

### 6.6 Gerbang

Dijalankan terhadap build produksi segar, suite penuh — Tahap ini menyentuh
tiga rute dan satu query bersama, dan dua kegagalan anggarannya hidup di
berkas yang tidak satu pun perubahannya sebut.

```
bun run build            ✅
bun run build-storybook  ✅  (exit 0)
bun run check            ✅  oxlint · oxfmt · tsc · unit 458 lulus, 0 gagal ·
                             plugin anti-slop · manifest · assets
CI=true bun run test:e2e ✅  547 lulus, 0 gagal, 0 flaky, 16 dilewati (12,1 menit)
```

**529 → 547, dan kedelapan belasnya terhitung:** sembilan asersi baru di
`e2e/visual-substance.e2e.ts` — tujuh rute manusia, satu untuk permukaan
mesin yang sengaja tanpa gambar, satu untuk `alt` yang berulang — dijalankan
di **kedua** proyek Playwright, desktop dan mobile. Sisa 529 adalah angka
Tahap 43, tidak berubah: nol gerbang lama dilonggarkan, dan **nol plafon
anggaran dinaikkan** meski dua rute sempat melewatinya.

**Yang tidak diukur, dan dikatakan di sini alih-alih didiamkan:** tidak ada
profiler di lingkungan ini, jadi tidak ada klaim biaya render untuk gambar
yang baru ditambahkan. Yang diukur adalah jumlah (`<img>` per rute di HTML
server), deskripsi (`alt` yang dirender, di kedua bahasa), dan berat (byte
`/_next/static/*.js` lewat gerbang anggarannya sendiri).

**Yang tetap terbuka dan bukan bagian Tahap ini:** 404 tanpa JavaScript masih
merender 28 karakter (`TAHAP-38.md` §7.4); story untuk `flip`,
`project-spine` dan bentuk baru `cursor` masuk Tahap 46.
