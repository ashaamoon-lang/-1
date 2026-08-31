# Panduan Studio — mengelola isi situs Arth

Dokumen ini untuk **studio**, bukan untuk programmer. Tidak ada terminal, tidak
ada kode. Kalau Anda bisa mengisi formulir, Anda bisa mengelola situs ini.

Semua teks di situs punya **dua bahasa**: Inggris (EN) dan Indonesia (ID).
Pengunjung dari Indonesia melihat versi ID, pengunjung lain melihat EN.

---

## 1. Masuk ke Studio

Studio adalah ruang admin situs. Alamatnya:

```
https://<domain-situs>/studio
```

Login memakai akun Google atau email yang sudah diundang. Kalau belum diundang,
mintalah undangan lewat **manage.sanity.io → Project → Members → Invite**.

> Kalau halaman Studio terbuka lalu semua isinya gagal dimuat, hampir selalu
> penyebabnya satu: domain situs belum didaftarkan di daftar CORS Sanity.
> Itu urusan sekali seumur hidup dan ada di `docs/DEPLOYMENT.md` §2.

---

## 2. Menambah satu karya

Di kolom kiri pilih **Project → +** (tanda tambah).

Isi dari atas ke bawah. Yang bertanda **wajib** akan menolak disimpan kalau
kosong.

| Field               | Wajib | Isi apa                                                                |
| ------------------- | ----- | ---------------------------------------------------------------------- |
| **Title**           | ✅    | Judul karya. Ada **dua kotak**: EN dan ID.                             |
| **Slug**            | ✅    | Alamat karya. Klik **Generate** — jangan diketik manual.               |
| **Cover image**     | ✅    | Foto utama. Ini yang muncul di grid dan saat dibagikan.                |
| **Alt text**        | ✅    | Deskripsi gambar, dua bahasa. Lihat §4 — ini penting.                  |
| **Gallery**         |       | Foto tambahan. Tiap foto juga butuh alt text.                          |
| **Client**          |       | Nama pemesan. Satu bahasa saja — nama tidak diterjemahkan.             |
| **Year**            |       | Tahun, angka saja: `2026`.                                             |
| **Discipline**      | ✅    | Lukisan / Mural / Ilustrasi. Ini yang dipakai filter di halaman Karya. |
| **Medium**          |       | Contoh: `Acrylic on canvas` / `Akrilik di atas kanvas`.                |
| **Dimensions**      |       | Contoh: `120 × 90 cm`. Satu bahasa — satuan sama di mana pun.          |
| **Description**     |       | Cerita karyanya. Dua bahasa.                                           |
| **Order**           |       | Angka kecil tampil lebih dulu. Default `100`.                          |
| **Featured**        |       | Nyalakan supaya muncul di **halaman depan**.                           |
| **Listed publicly** |       | Nyalakan = tampil di katalog publik. Lihat §7.                         |
| **Grid span**       |       | `Half` = setengah lebar, `Full` = selebar layar.                       |
| **Published at**    |       | Terisi otomatis. Biarkan saja.                                         |
| **SEO & Metadata**  |       | Boleh dikosongkan — lihat §5.                                          |

Setelah selesai, tekan **Publish** (tombol hijau, kanan bawah). Situs akan
memperbarui dirinya sendiri dalam beberapa detik. **Tidak perlu memanggil siapa
pun.**

> **Judul dan Alt text wajib diisi dalam KEDUA bahasa.** Studio menolak Publish
> kalau salah satunya kosong, dan itu disengaja: kalau judul bahasa Inggris
> kosong, halaman versi Inggris dulu menampilkan alamat URL-nya sendiri sebagai
> judul.

Selama belum ditekan Publish, karya itu masih _draft_: tersimpan, tapi belum
terlihat pengunjung.

---

## 3. Tentang Slug — satu aturan yang tidak boleh dilanggar

Slug adalah alamat karya di internet:

```
Slug "rimbun"  →  arth.studio/en/work/rimbun
                  arth.studio/id/work/rimbun
```

Satu slug dipakai untuk kedua bahasa. Itu disengaja: satu karya, satu alamat.

**Setelah sebuah karya terbit, jangan mengubah slug-nya.** Semua tautan yang
sudah tersebar — di Instagram, di pesan ke klien, di hasil pencarian Google —
akan mati. Kalau memang harus berubah, beri tahu yang mengelola deploy dulu.

Slug juga **tidak boleh memuat titik** (`.`). Studio akan menolaknya, dan itu
memang disengaja: alamat bertitik dianggap sebagai berkas, bukan halaman, lalu
hilang diam-diam dari sitemap dan dari pencarian.

---

## 4. Alt text — kenapa wajib, dan bagaimana menulisnya

Alt text dibaca oleh pembaca layar (pengunjung tunanetra) dan oleh mesin
pencari. Untuk situs yang isinya gambar, ini bukan formalitas.

Tulis **apa yang terlihat**, bukan perannya di halaman:

| ❌ Jangan       | ✅ Begini                                            |
| --------------- | ---------------------------------------------------- |
| `gambar proyek` | `mural tiga sosok dengan warna oker di dinding kafe` |
| `foto 1`        | `lukisan akrilik, dua burung di atas latar biru tua` |
| `karya Arth`    | `detail sapuan kuas pada bagian bawah kanvas`        |

Satu kalimat sudah cukup. Isi keduanya, EN dan ID.

---

## 5. Kapan mengisi SEO & Metadata

Kosongkan saja, kecuali ada alasan khusus.

Kalau dibiarkan kosong, situs otomatis memakai judul karya, kalimat pertama
**Description**-nya, dan **Cover image** sebagai gambar yang muncul saat
tautannya dibagikan. Itu biasanya lebih baik daripada tulisan pemasaran.

> Versi sebelumnya dari panduan ini menjanjikan hal yang sama padahal belum
> berlaku untuk karya: deskripsinya kosong, dan kartu bagikannya memakai logo
> Arth alih-alih lukisannya. Sudah diperbaiki.

Isi hanya kalau:

- judul yang muncul di Google perlu berbeda dari judul karya, atau
- Anda ingin satu karya **tidak** muncul di pencarian → centang **No index**.

---

## 6. Teks halaman depan dan kontak

Semua teks halaman depan ada di satu dokumen: **Studio** (bukan Project).

| Field                | Isi apa                                                     |
| -------------------- | ----------------------------------------------------------- |
| **Studio name**      | Nama yang muncul di footer dan tombol kontak.               |
| **Hero headline**    | Kalimat besar paling atas. Dua bahasa.                      |
| **Hero subline**     | Satu kalimat di bawahnya. **Satu kalimat**, bukan paragraf. |
| **Studio statement** | Bagian "tentang". Boleh beberapa paragraf.                  |
| **Portrait**         | Foto studio atau potret. Butuh alt text.                    |
| **Contact email**    | Alamat email yang bisa diklik pengunjung.                   |
| **Social links**     | Label + URL lengkap (`https://instagram.com/namaanda`).     |

Sebelum ini diisi, situs menampilkan **teks contoh** beserta catatan kecil yang
mengatakan bahwa itu teks sementara. Begitu Anda menekan Publish di dokumen
Studio, teks contoh itu hilang, field demi field.

### Yang masih ditunggu dari studio

Nilai-nilai berikut masih placeholder di dalam kode dan **harus diganti sebelum
peluncuran** (mintalah ke yang mengelola deploy, ini bukan lewat Studio):

- alamat email asli — sekarang `studio@arth.example`, alamat yang sengaja tidak
  bisa menerima surat
- tautan profil Instagram / Are.na yang sebenarnya
- domain final situs

---

## 6b. Halaman Karya dan filternya

Semua karya yang **Listed publicly** tampil di halaman katalog, dan pengunjung
bisa menyaringnya per disiplin. Alamatnya bisa dibagikan langsung:

```
/id/work                              semua karya
/id/work/discipline/mural             hanya mural
/id/work/discipline/painting          hanya lukisan
/id/work/discipline/illustration      hanya ilustrasi
```

Yang menentukan sebuah karya masuk kelompok mana adalah field **Discipline** —
bukan **Medium**. Medium adalah kalimat bebas ("Akrilik di atas kanvas");
Discipline adalah satu dari tiga pilihan tetap. Sebuah disiplin hanya muncul
sebagai tombol filter kalau ada karya di dalamnya.

> **Satu slug yang tidak boleh dipakai: `discipline`.** Kata itu sudah menjadi
> alamat filter di atas. Kalau sebuah karya diberi slug `discipline`, halaman
> karyanya tidak akan pernah bisa dibuka. Studio akan menolaknya saat Publish,
> jadi ini bukan sesuatu yang perlu diingat-ingat — cukup tahu kenapa
> peringatannya muncul.

---

## 6c. Halaman berdiri sendiri (_Page_)

Selain **Project** dan pengaturan studio, Studio punya satu tipe lagi:
**Page**. Gunanya untuk halaman yang bukan karya — kebijakan privasi, syarat
dan ketentuan, halaman "pameran", apa pun yang perlu alamat sendiri.

Isi judul dan slug, lalu **Publish**. Halamannya langsung terbit di
`/id/<slug>` dan `/en/<slug>`, dan otomatis masuk peta situs. Tidak perlu
menghubungi siapa pun.

Tiga hal yang perlu diketahui:

- **Judul dan isi diisi dua bahasa**, sama seperti karya. Slug-nya satu, dipakai
  bersama kedua bahasa.
- **Slug-nya tidak boleh mengandung titik**, dengan alasan yang sama seperti di
  §3.
- **Halaman ini tidak muncul di menu apa pun secara otomatis.** Menu atas
  ditentukan di kode, bukan di Studio. Kalau sebuah halaman perlu masuk menu,
  itu permintaan ke pengembang — bukan sesuatu yang bisa diatur dari sini.

> **Catatan.** Sampai Agustus 2026 Studio juga menampilkan dua tipe lain,
> **Article** dan **Navigation**. Keduanya sudah dihapus. Article adalah tipe
> blog yang tidak pernah direncanakan untuk situs ini, dan Navigation tidak
> dirender di mana pun — apa pun yang diisi di situ tidak pernah muncul di
> situs. Kalau Anda pernah mengisinya, tidak ada yang hilang: memang tidak
> pernah tampil.

---

## 7. Mengubah dan menghapus

**Mengubah:** buka karyanya, ubah, tekan **Publish** lagi.

**Menghapus:** tombol titik-tiga di kanan atas → **Delete**. Karya langsung
hilang dari situs, dan tautannya mati.

**Menyembunyikan tanpa menghapus:** matikan **Listed publicly**, lalu Publish.
Karyanya hilang dari halaman Karya, dari peta situs, dan dari tautan "karya
berikutnya". Halamannya sendiri tetap terbuka bagi yang sudah punya tautannya —
jadi tautan yang pernah dikirim ke klien tidak mati — tetapi mesin pencari
diberi tahu untuk tidak mengindeksnya lagi.

> **Koreksi.** Panduan ini sebelumnya menyuruh Anda mematikan **Featured**
> untuk menyembunyikan karya. Itu **salah**: Featured hanya mengatur halaman
> depan; karyanya tetap ada di peta situs dan tetap bisa ditemukan. Itulah
> sebabnya **Listed publicly** ditambahkan — dua tombol untuk dua hal yang
> memang berbeda:
>
> - **Featured** — tampil di halaman depan. Pilihan kurasi.
> - **Listed publicly** — ada di katalog publik sama sekali atau tidak.

---

## 8. Kalau ada yang aneh

| Gejala                                      | Kemungkinan penyebab                                                               |
| ------------------------------------------- | ---------------------------------------------------------------------------------- |
| Karya sudah di-Publish tapi belum muncul    | Tunggu ~1 menit lalu muat ulang. Kalau tetap, webhook belum aktif (§4 DEPLOYMENT). |
| Tombol Publish mati/abu-abu                 | Ada field wajib yang kosong. Sanity menandainya merah di atas.                     |
| Judul muncul dalam satu bahasa saja         | Kotak bahasa yang satunya belum diisi.                                             |
| Gambar tampak buram                         | File aslinya kecil. Unggah minimal ~2000 px sisi terpanjang.                       |
| Studio terbuka tapi kosong / error jaringan | Domain belum ada di daftar CORS Sanity.                                            |

Untuk apa pun yang tidak ada di tabel ini, catat **apa yang Anda lakukan** dan
**apa yang muncul di layar**, lalu kirimkan ke yang mengelola deploy. Dua
kalimat itu biasanya sudah cukup untuk menemukan penyebabnya.
