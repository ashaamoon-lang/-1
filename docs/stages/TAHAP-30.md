# Tahap 30 — Menutup yang ditunda, dan menyebut yang bukan penundaan

> Pendalaman wajib atas `docs/ROADMAP.md` §3.0.

Status: **selesai**. Hasil di §6.

---

## 1. Kenapa tahap ini ada

Tahap 28 dan 29 masing-masing berakhir dengan daftar "yang tidak dikerjakan".
Pemilik proyek menolak daftar itu dengan aturan yang jelas: **kalau aman dan
sesuai rencana, kerjakan. Tunda hanya kalau memang menunggu hal lain, dan
kalau hal lain itu tidak berat, kerjakan sekalian.**

Aturannya benar, dan dua dari tiga item yang saya tunda memang tidak punya
alasan yang bertahan. Yang ketiga bukan penundaan sama sekali — ia
pertentangan desain, dan saya menyebutnya begitu di §4 alih-alih menyamarkannya
sebagai kehati-hatian lagi.

---

## 2. Pencocokan yang tidak peduli urutan kata

**Alasan lama:** "fuzzy search berlebihan untuk 17 entri." Itu benar tentang
fuzzy, dan menyembunyikan cacat yang bukan tentang fuzzy.

`matchScore` mencocokkan **substring**. Artinya:

| diketik        | hari ini | seharusnya |
| -------------- | -------- | ---------- |
| `arus balik`   | ketemu   | ketemu     |
| `balik arus`   | **nol**  | ketemu     |
| `macan 2025`   | **nol**  | ketemu     |
| `jurnal scope` | **nol**  | ketemu     |

Nama klien dan tahunnya ada di baris yang sama, dipisah `·`, jadi mengetik
keduanya — hal yang wajar dilakukan orang — tidak menemukan apa pun. Itu
kegagalan pencarian, bukan kekurangan kecanggihan.

**Yang dikerjakan:** kuerinya dipecah jadi kata, dan **setiap kata harus ada**
di baris itu (AND), di mana pun urutannya. Peringkatnya tidak berubah
bentuknya:

| skor | arti                               |
| ---- | ---------------------------------- |
| 3    | judulnya diawali kuerinya **utuh** |
| 2    | judulnya memuat **semua** katanya  |
| 1    | barisnya memuat semua katanya      |
| 0    | bukan hasil                        |

**Yang tetap tidak dikerjakan: fuzzy/Levenshtein.** Pada 17 entri, toleransi
salah ketik lebih mungkin menaikkan jawaban yang salah daripada menemukan yang
benar — dan Tahap 28 sudah menghabiskan satu putaran memperbaiki jawaban yang
salah. Ini keputusan kualitas, bukan penundaan, dan kalau indeksnya tumbuh
`matchScore` tetap satu-satunya tempat yang berubah.

---

## 3. Story Storybook untuk palette

**Alasan lama:** "ia mengambil indeks dari sebuah rute dan membaca konteks
lokal, jadi story-nya memperlihatkan tiruan." Separuhnya benar dan separuhnya
malas. `components/ui/language-switcher` sudah punya story dengan
`NextIntlClientProvider`, jadi bagian lokalnya **sudah ada presedennya**.

Bagian indeksnya diperbaiki dengan mengubah komponennya, bukan dengan memalsu
`fetch`: `CommandPalette` menerima prop `entries` opsional. Kalau diberikan, ia
dipakai; kalau tidak, ia mengambil sendiri seperti sekarang. Itu injeksi
dependensi biasa, dan ia juga membuka pintu yang mungkin dipakai nanti —
menyerahkan indeks dari server tanpa perjalanan jaringan.

Nilainya bukan cuma katalog: `e2e/storybook-a11y.e2e.ts` mengaudit **setiap
story**, jadi sebuah story menambahkan pemeriksaan axe pada palette yang
terbuka, terisolasi dari halaman.

---

## 4. Yang **bukan** penundaan: hasil dua kolom

Saya menyebutnya "tidak ditukar dengan estetika", dan itu terdengar seperti
kehati-hatian. Alasan sebenarnya lebih sederhana dan lebih kuat: **ia
bertentangan dengan tata letak yang baru saja diukur lebih baik.**

Baris palette sekarang tiga pita — fakta · nama · janji — `2 / 4 / 6` dari dua
belas kolom pada lembar 1398px. Dipecah dua kolom, tiap kolom jadi ~690px, dan
ketiga pitanya jadi 115 / 230 / **345px**. Deskripsi 16px dalam 345px kira-kira
**24 karakter per baris**. Itu bukan kolom baca; itu parit.

Jadi dua kolom bukan tambahan, ia **penggantian**: lebih banyak hasil terlihat,
dengan menghapus kolom deskripsi. Itu pertukaran nyata dan pemilik proyek yang
memutuskannya — bukan sesuatu yang saya putuskan diam-diam di catatan kaki.
Angkanya ada di sini supaya keputusannya bisa diambil dengan data.

`Autocomplete.Row` milik Base UI menangani panah kiri/kanan dengan benar, jadi
aksesibilitasnya **bukan** penghalang; itu alasan yang saya berikan sebelumnya
dan itu keliru.

---

## 5. Gerbang

Yang sudah ada dan tidak boleh bergerak: lima belas gerbang palette, anggaran
rute, dan `storybook-a11y`.

Yang baru:

1. **`balik arus` menemukan Arus Balik** — dibuktikan merah terhadap
   pencocokan substring hari ini.
2. **`macan 2025` menemukan proyeknya** — dua fakta dari rel yang sama.
3. **Urutan kata tidak mengubah peringkat** — kueri yang sama diacak
   urutannya memberi hasil teratas yang sama.
4. **Story palette lulus axe** lewat sapuan `storybook-a11y` yang sudah ada.

---

## 6. Hasil

**Selesai.** Dua dari tiga item yang ditunda dikerjakan, yang ketiga dijelaskan
dengan angka alih-alih dengan kehati-hatian. Dan satu kesalahan saya sendiri
ketahuan karena gerbangnya dijalankan terhadap data sungguhan (§6.4).

### 6.1 Pencocokan kata — dibuktikan merah, lalu diperbaiki

Terhadap indeks sungguhan, sebelum perubahan:

| diketik             | sebelum    | sesudah                  |
| ------------------- | ---------- | ------------------------ |
| `arus balik`        | Arus Balik | Arus Balik               |
| `balik arus`        | **nol**    | Arus Balik               |
| `tanjung 2025`      | **nol**    | Arus Balik               |
| `scope deliverable` | **nol**    | Scope is the deliverable |
| `deliverable scope` | **nol**    | Scope is the deliverable |

Baris keempat yang paling tajam: itu **kata-kata judulnya sendiri, dalam
urutannya sendiri**, hanya tanpa kata sambung yang tidak akan diketik siapa
pun. Dan `tanjung 2025` adalah dua fakta dari satu baris rel yang sama,
dipisah `·` — mengetik keduanya adalah hal yang wajar dilakukan orang.

Perbaikannya AND, bukan OR: setiap kata harus ada, jadi **menambah kata selalu
mempersempit**. OR akan melakukan kebalikannya — kata kedua justru melebarkan
hasil — dan itu perilaku yang membuat pencarian terasa rusak. Enam uji unit
baru, termasuk satu yang membuktikan penyempitan itu.

Peringkatnya tidak berubah bentuknya: kueri utuh sebagai awalan judul tetap
skor 3, jadi mengetik pembuka sebuah judul tetap membuka judul itu.

### 6.2 Story Storybook, dan komponen yang berubah untuk mendapatkannya

`CommandPalette` sekarang menerima `entries` opsional. Diberikan → dipakai;
tidak → mengambil sendiri seperti sebelumnya. Story-nya karena itu merender
**palette yang sebenarnya**, bukan tiruan `fetch`.

Dua story: keadaan istirahat (kelima jenis rel: path, klien·tahun, tanggal)
dan jalan buntu. Keduanya lulus sapuan axe `e2e/storybook-a11y.e2e.ts` — yang
berarti palette sekarang diaudit **terisolasi dari halaman**, termasuk keadaan
yang gerbang tingkat-halaman hanya bisa capai dengan mematahkan jaringan.

Prop-nya juga membuka jalan yang mungkin dipakai nanti: menyerahkan indeks
dari server tanpa perjalanan jaringan.

### 6.3 Dua kolom: pertentangan, bukan penundaan

Alasan lama saya ("tidak ditukar dengan estetika") terdengar seperti
kehati-hatian dan pemilik proyek benar menolaknya. Alasan sebenarnya, dengan
angka:

Baris palette adalah tiga pita `2 / 4 / 6` dari dua belas kolom pada lembar
1398px — terukur **210 / 436 / 662px**. Dipecah dua kolom, tiap kolom ~690px
dan pitanya jadi **115 / 230 / 345px**. Deskripsi 16px dalam 345px ≈ **24
karakter per baris**.

Jadi dua kolom bukan tambahan, ia **penggantian**: lebih banyak hasil terlihat
sekaligus, dengan membuang kolom deskripsi. Itu pertukaran yang pemilik proyek
putuskan, bukan saya di catatan kaki. `Autocomplete.Row` menangani panah
kiri/kanan dengan benar, jadi **aksesibilitas bukan penghalangnya** — itu
alasan yang saya berikan sebelumnya dan itu keliru.

### 6.4 Nama klien yang saya karang, dan gerbang yang menangkapnya

Uji unit dan story pertama saya memakai **"Museum MACAN"** sebagai klien
Arus Balik. Klien sebenarnya di dataset adalah **"Rumah Tanjung"**.

Itu ketahuan karena gerbang e2e dijalankan terhadap situs sungguhan dan
`macan 2025` mengembalikan kosong — fixture-nya lulus, situsnya tidak. Dan
memang seharusnya begitu: proyek ini melarang mengarang nama klien, dan sebuah
story Storybook adalah **katalog yang bisa dijelajahi**, bukan test double
pribadi. Ketiga tempat sekarang memakai nilai yang benar-benar disajikan
`/en/search.json`.

### 6.5 Verifikasi

- `bun run check` — exit 0, **438 uji unit** (dari 432).
- `CI=true bun run test:e2e` — **372 lulus, 0 gagal**, 18 dilewati, nol flake.
- `e2e/command-palette.e2e.ts` — **16/16**, dua proyek.
- `storybook-a11y` — 94 lulus, termasuk dua story palette yang baru.
- Anggaran rute tidak disentuh; tidak ada yang ditambahkan ke graf eager.

### 6.6 Yang tetap tidak dikerjakan, dengan alasan yang bertahan

- **Fuzzy / Levenshtein.** Pada 17 entri, toleransi salah ketik lebih mungkin
  menaikkan jawaban yang salah daripada menemukan yang benar — dan Tahap 28
  sudah menghabiskan satu putaran memperbaiki jawaban yang salah. Keputusan
  kualitas; `matchScore` tetap satu-satunya tempat yang berubah kalau
  indeksnya tumbuh.
- **Riwayat pencarian.** Butuh penyimpanan per pembaca, dan tidak ada yang
  memintanya.
- **Pratinjau gambar di baris.** Alasan Tahap 29 §5 tidak berubah: palette
  adalah teks yang dipindai.
- **Cabang CMS rute entri jurnal.** Ini **memang** menunggu hal lain, dan hal
  itu berat: dokumen `journalEntry` pertama yang benar-benar diterbitkan.
  Menulisnya sekarang berarti menulis buta terhadap bentuk Portable Text yang
  belum pernah diambil.
