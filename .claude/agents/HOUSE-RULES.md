# House rules — dibaca setiap agen sebelum bekerja

Bukan ringkasan `CLAUDE.md`. Ini **cara kerja** yang berlaku untuk agen mana
pun di repo ini; aturan teknisnya sendiri tetap di `CLAUDE.md` dan `AGENTS.md`,
dan keduanya menang kalau ada perbedaan.

## 1. Bukti, bukan pembacaan

Proyek ini sudah tiga kali kena pola yang sama: sebuah klaim lolos karena
diperiksa dengan mata, bukan dengan skrip.

- Tahap 4 menandai "nol pergeseran layout" ✅. Tahap 5 mengukurnya: CLS 0.226.
- Tahap 3 lulus kriteria "terbaca tanpa JS" — hanya karena datasetnya kosong.
- Tahap 6 menyatakan canonical "semuanya benar" setelah memeriksa beberapa
  halaman. Skrip yang membuka **setiap** URL sitemap menemukan 2 dari 10 salah.

Maka: **satu temuan tanpa perintah yang bisa diulang bukan temuan.** Sertakan
perintah dan keluarannya, atau tandai eksplisit sebagai dugaan.

## 2. Gate hanya menjaga apa yang diminta menjaganya

`bun run check` hijau tidak berarti benar. Yang tidak dilihat gate mana pun:
isi sebuah gambar, warna yang salah tapi kontras cukup, teks yang benar secara
tipe tetapi salah maknanya, URL yang mengembalikan 307 alih-alih 200.

Kalau sebuah temuan hanya bisa dilihat manusia, katakan begitu — dan jelaskan
gate apa yang seharusnya bisa menangkapnya lain kali.

## 3. Kejujuran adalah aturan keras, bukan gaya

`CLAUDE.md` #19–21. Jangan sebut angka performa yang tidak diukur. Jangan
klaim aksesibilitas yang tidak dites. Kalau sesuatu gagal atau dilewati,
sebutkan eksplisit beserta alasannya — jangan diam-diam dipersempit.

Kata "sepertinya", "kemungkinan", "biasanya" adalah sinyal bahwa sesuatu belum
diverifikasi. Boleh dipakai — asal ditandai sebagai belum terverifikasi.

## 4. Restraint

Standar yang membedakan situs kompeten dari situs award bukan jumlah komponen
atau kebaruan efek, melainkan **restraint yang diterapkan konsisten**. Dua
typeface, tiga bobot, satu aksen, tiga durasi, empat kurva easing.

Berlaku juga untuk temuan: 6 temuan yang benar-benar penting lebih berguna
daripada 30 yang dicampur nit.

## 5. Perintah yang dipakai

```bash
bun run check              # oxlint, oxfmt, type-aware, tsc, unit, manifest, aset
bun run build              # build produksi
CI=true bun run test:e2e   # Playwright + axe — sinyal yang menentukan
bun run build-storybook
bun run brand:assets       # render ulang kartu OG + ikon dari token
```

`CI=true` wajib untuk e2e. Tanpa itu Playwright memakai dev server dan
`not-found.e2e.ts` flake karena kompilasi on-demand berlomba dengan validasi
prefetch Next.

## 6. Dokumentasi ikut, bukan menyusul

Tiap tahap menghasilkan `docs/stages/TAHAP-<n>.md` **sebelum** kodenya ditulis
(roadmap §3.0), lalu dikoreksi di tempat kalau ternyata salah — bukan ditulis
ulang seolah tidak pernah keliru.
