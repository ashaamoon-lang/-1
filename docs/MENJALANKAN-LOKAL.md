# Menjalankan Arth di komputer Anda

Panduan ini untuk melihat situsnya sendiri — bukan untuk mengembangkannya.
Sekitar sepuluh menit, sekali saja; sesudah itu cukup dua perintah.

---

## 1. Kenapa localhost saya bukan localhost Anda

Selama pengerjaan, saya menjalankan situs ini di `http://localhost:3000` —
tetapi **di dalam kontainer cloud**, bukan di komputer Anda. Portnya hidup di
sana dan mati bersama sesinya. Tidak ada alamat yang bisa saya kirim untuk
Anda buka.

Jadi situsnya dijalankan di mesin Anda. Kodenya sudah ada di GitHub, dan
kontennya sudah ada di Sanity — keduanya tinggal disambungkan.

---

## 2. Yang perlu dipasang lebih dulu

|          | Versi    | Cara                                                                                                                  |
| -------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| **Bun**  | ≥ 1.3.5  | `curl -fsSL https://bun.sh/install \| bash` (macOS/Linux) · `powershell -c "irm bun.sh/install.ps1 \| iex"` (Windows) |
| **Node** | ≥ 24.20  | [nodejs.org](https://nodejs.org) — Bun tetap butuh Node terpasang untuk beberapa peralatan                            |
| **Git**  | apa saja | biasanya sudah ada                                                                                                    |

Cek: `bun --version` dan `node --version`.

---

## 3. Ambil kodenya

```bash
git clone https://github.com/ashaamoon-lang/-1.git arth
cd arth
git checkout claude/satus-award-website-foundation-r6o5cf
bun install
```

Cabang itu penting — seluruh pekerjaan ada di sana, bukan di `main`.

---

## 4. Buat berkas `.env.local`

Di dalam folder `arth`, buat berkas bernama **`.env.local`** berisi empat baris
ini:

```
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SANITY_PROJECT_ID=az53j4l1
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2025-03-01
```

### Anda tidak butuh token apa pun

Keempat nilai di atas **bukan rahasia**, dan tidak ada satu pun token di
antaranya. Dataset `production` bersifat public-read
(`docs/DEPLOYMENT.md` §7), jadi siapa pun yang tahu project ID bisa membaca
konten yang sudah terbit — dan itulah yang situs ini lakukan.

Diuji, bukan diasumsikan: dengan **persis empat baris di atas dan tanpa token
sama sekali**, seluruh delapan halaman merespons `200`, keenam penugasan
muncul di `/en/work`, dan ketiga chip praktik tampil.

`SANITY_API_WRITE_TOKEN` hanya dibutuhkan oleh satu skrip —
`lib/scripts/seed-fixtures.ts`, yang **menulis** ke Sanity. Anda tidak
memerlukannya untuk melihat apa pun. Kalau suatu saat butuh: jangan pernah
di-commit; `.gitignore` sudah menutup `.env*.local`, jadi selama namanya benar
ia tidak akan ikut terkirim.

---

## 5. Menjalankannya

Ada dua cara, dan bedanya nyata.

### Untuk melihat-lihat — cepat

```bash
bun dev
```

Buka `http://localhost:3000`. Perubahan berkas langsung terlihat.

### Untuk melihat yang saya ukur — build produksi

```bash
bun run build
bun run start
```

**Angka-angka di laporan tiap tahap berasal dari sini, bukan dari `bun dev`.**
Cache Components, prarender, dan header cache hanya berperilaku benar di build
produksi — di dev server beberapa halaman yang seharusnya statis menjadi
dinamis, dan header cache-nya berbeda. Kalau Anda ingin memeriksa klaim saya,
periksa yang ini.

---

## 6. Yang layak dibuka

| Alamat                      | Kenapa                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `/en` dan `/id`             | Beranda. Komposisi hero Tahap 12d — index praktik kanan-atas, judul kiri-bawah, isyarat gulir kanan-bawah          |
| `/en/work`                  | Katalog, dengan chip **All · Consulting · AI & Data · Commission**                                                 |
| `/en/work/practice/ai-data` | Rute praktik dari Tahap 13 — filternya berjalan di server, bukan di browser                                        |
| `/en/work/arus-balik`       | Halaman detail. Klik sebuah kartu dari katalog: sampulnya **berpindah** ke halaman ini, tidak sekadar dimuat ulang |
| `/llms.txt` dan `/en/ai`    | Yang dibaca mesin jawaban tentang Arth                                                                             |
| `/cms`                      | Sanity Studio. Butuh login akun Sanity Anda; dari sini kontennya bisa disunting                                    |

---

## 7. Dua hal yang tidak terlihat sambil lalu

### Reduced motion

Sebagian orang mematikan animasi di sistem operasinya. Situs ini wajib tetap
utuh — dan di sinilah cacat terbesar Tahap 12d dulu bersembunyi: dua dari tiga
baris judul beranda **tidak terlihat**, dan sudah begitu sejak Tahap 11c.

Cara menyalakannya:

- **macOS** — System Settings → Accessibility → Display → _Reduce motion_
- **Windows** — Settings → Accessibility → Visual effects → _Animation effects_ (matikan)
- **Tanpa mengubah sistem** — Chrome DevTools → ⌘/Ctrl+Shift+P → ketik
  `Emulate CSS prefers-reduced-motion: reduce`

Muat ulang beranda. Ketiga baris judul harus terbaca penuh.

### Tanpa JavaScript

DevTools → ⌘/Ctrl+Shift+P → `Disable JavaScript`, lalu muat ulang. Halamannya
harus tetap terbaca seluruhnya — teks, gambar, tautan. Itu kriteria keluar
Tahap 10, dan ia mudah rusak tanpa ketahuan.

---

## 8. Kalau tampak aneh

**Kontennya lama padahal Sanity sudah berubah.** Build memakai ulang hasil
cache-nya, jadi bisa menyajikan konten sebelumnya dengan log yang hijau. Hapus
cache-nya lalu build ulang:

```bash
rm -rf .next/cache
bun run build
```

**Halamannya kosong, tanpa pesan kesalahan.** Hampir selalu `.env.local` —
salah nama berkas, salah folder, atau salah ketik project ID. Tiap integrasi di
proyek ini menonaktifkan diri saat env-nya absen, jadi kegagalannya diam.

**Tes e2e terlihat gagal padahal situsnya baik.** Jalankan dengan `CI=true`:

```bash
CI=true bun run test:e2e
```

Tanpa itu, tesnya berjalan di dev server dan kadang gagal karena kompilasi
on-demand berlomba dengan validasi prefetch. `CI=true` menjalankannya lewat
build produksi — itu sinyal yang menentukan.

**Storybook tidak ada di port 3000.** Ia terpisah:

```bash
bun storybook        # http://localhost:6006
```

---

## 9. Kalau ingin mengganti konten dummy

Enam penugasan yang tampil sekarang adalah **fixture** — dibuat untuk menilai
tata letak, bukan pekerjaan nyata. Semuanya berawalan `fixture-` dan bisa
dihapus sekaligus:

```bash
bun --env-file .env.local lib/scripts/seed-fixtures.ts --clean
```

Ini **menghapus dokumen dan gambarnya** dari Sanity, dan butuh
`SANITY_API_WRITE_TOKEN` di `.env.local`. Sesudahnya situs akan tampil dengan
teks cadangan sampai Anda mengisi kontennya sendiri lewat `/cms`.

Untuk sekadar melihat pelatnya tanpa menyentuh Sanity sama sekali:

```bash
bun lib/scripts/seed-fixtures.ts --preview   # menulis ke .fixtures-preview/
```
