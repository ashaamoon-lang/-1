# TAHAP 1 — Mengunci Sistem Desain

Stage-spec yang diwajibkan `docs/ROADMAP.md` §3.0. Tidak ada kode ditulis
sebelum dokumen ini ada.

**Dokumen ini adalah versi kedua.** Versi pertama dikerjakan sampai selesai
dan hijau, lalu ditolak. §0 mencatat kenapa — bukan sebagai basa-basi, tapi
karena kesalahannya spesifik dan bisa terulang kalau tidak ditulis.

---

## 0. Kenapa Tahap 1 diulang

Versi pertama mengunci **Geist + Geist Mono** dengan **satu aksen merah
berkroma tinggi** (`oklch(0.592 0.2339 27.95)` ≈ `#e71419`). Alasannya:
sepuluh situs pemenang award yang diukur di `docs/TEARDOWN.md` semuanya
membawa persis satu aksen berkroma tinggi.

Pengukurannya benar. **Penerapannya salah**, dan kesalahannya milik saya.

`TEARDOWN.md` mengukur _studio kreatif dan teknologi_ — basement.studio,
darkroom.engineering, Lusion, Iventions. Isi situs mereka adalah kode, tipe,
dan 3D: material yang tidak berwarna sendiri. Di situs seperti itu aksen
**adalah** identitas, karena tidak ada yang lain yang bisa memegangnya.

Situs ini bukan itu. Arth memajang **karya pesanan** — lukisan, mural,
ilustrasi. Karyanya sendiri yang berwarna. Aksen jenuh di sekitarnya bukan
identitas, melainkan pesaing: setiap gambar di halaman harus berebut perhatian
dengan sebuah merah yang tidak ada hubungannya dengan karya itu.

Dua sumber independen mengatakan hal yang sama, dan keduanya sudah ada di
repo ini sejak Tahap B:

- palet **Museum/Gallery** di `.claude/skills/ui-ux-pro-max` menetapkan
  `Accent` **sama persis** dengan `Primary` (`#18181B`) — galeri tidak punya
  aksen kromatik;
- pola **Portfolio Grid** di skill yang sama menyatakan strateginya terang-
  terangan: _"Neutral background (let work shine). Accent: Minimal."_

Versi pertama menanyakan skill dengan `--domain color` dan mendapat pola
_Portfolio/Personal_. Yang tidak saya lakukan adalah menanyakan pola yang
benar untuk jenis konten ini. Itu bukan kegagalan alat.

### Bukti tambahan yang datang dari kegagalan itu sendiri

Versi pertama meninggalkan **12 pasangan sub-AA** di
`contrast-baseline.json`, semuanya berasal dari aksen merah, dan `axe` menemukan
**3 pelanggaran serius** di halaman 404 yang harus diperbaiki di sumbernya.
Merah itu tidak pernah lolos 4.5:1 sebagai teks di atas ground manapun — bukan
karena lightness-nya salah pilih, tapi karena **tidak ada** lightness dari hue
itu yang bisa: puncaknya 4.19:1 di atas ground proyek ini dan 4.41:1 bahkan di
atas putih murni. Itu dihitung, bukan ditebak.

Sistem warna yang benar untuk konten ini menghapus masalah itu, tidak
menegosiasikannya.

---

## 1. Keputusan: warna

**Dua netral hangat. Nol aksen kromatik.**

| Token   | oklch                   | ≈ hex     | Peran                |
| ------- | ----------------------- | --------- | -------------------- |
| `ink`   | `oklch(0.17 0.006 66)`  | `#110f0d` | ground gelap / teks  |
| `paper` | `oklch(0.964 0.006 92)` | `#f4f3ef` | ground terang / teks |

Dipetakan ke dua tema:

| Tema    | `primary` | `secondary` | `contrast` |
| ------- | --------- | ----------- | ---------- |
| `light` | paper     | ink         | ink        |
| `dark`  | ink       | paper       | paper      |

**Tema `red` dihapus.** Ia mendeskripsikan tema yang tidak pernah dipakai
halaman manapun, dan tanpa aksen kromatik ia tidak mendeskripsikan apa-apa.
Menghapusnya juga membersihkan seluruh baris `red/*` dari baseline kontras.

### Netralnya hangat, dan itu pilihan

Abu-abu murni terbaca sebagai tidak dipertimbangkan. Kedua netral ini membawa
bias hangat kecil (hue ~66° dan ~92° pada kroma sangat rendah), yang terbaca
sebagai kertas dan pigmen alih-alih layar. Pergeserannya cukup halus sehingga
tidak ada gambar di atasnya yang tertular cast warna.

Ground tetap lepas dari `#000`/`#fff` murni sesuai `TEARDOWN.md` §3 — itu
temuan yang tetap berlaku dan tidak ikut dibatalkan.

### Kenapa `contrast` bukan warna ketiga

Komponen memakai `--color-contrast` untuk state interaktif: focus ring,
checkbox tercentang, isian switch, error form. Mengisinya dengan ink itu
sendiri memberi focus ring **17.24:1** terhadap ground-nya — jauh di atas
4.32:1 yang dicapai merah, dan WCAG 2.2 hanya meminta 3:1 untuk indikator
non-teks. Token-nya tetap ada supaya warna brand di masa depan bisa masuk di
satu tempat tanpa menyentuh setiap komponen.

### Hasil terukur

Seluruh 18 pasangan yang diukur `contrast.test.ts` lolos WCAG AA. Yang
terendah adalah `secondary on surface-2` di **14.22:1** terhadap minimum 4.5.
APCA terendah |Lc| **86.1** terhadap ambang 60.

`contrast-baseline.json` sekarang **kosong**: `{ "accepted": {},
"apcaAccepted": {} }`. Tidak ada satu pun pengecualian sadar yang tersisa,
turun dari 12.

---

## 2. Keputusan: typeface

**Syne (display) + Geist Mono (mono).**

`Syne` digambar untuk **Synesthésie**, sebuah pusat seni di Prancis, dan
dipakai luas di konteks seni kontemporer. Provenance itu justru intinya: situs
ini duduk di sekitar karya seni, dan huruf dari dunia seni terbaca sebagai
milik tempat itu dengan cara yang tidak bisa dicapai sans UI serba-guna.

**Yang diganti: Geist.** Geist huruf yang bagus dan basement.studio memang
mengirimkannya. Tapi ia sans teknologi yang netral — dan netralitas persis
yang tidak bisa dibayar situs ini begitu palet melepas aksennya. Kalau warna
tidak lagi memegang identitas, tipografi yang harus.

**Geist Mono tetap.** Setiap situs yang diukur di `TEARDOWN.md` §4
memasangkan display face-nya dengan mono yang membawa label, caption, dan
metadata. Pembagian kerja itulah yang membuat portofolio terbaca sebagai
direkayasa, bukan sekadar dihias.

Keduanya tersedia lewat `next/font/google` dengan sumbu `wght` variabel (Syne
400–800, Geist Mono 100–900), jadi pola `fonts.ts` tanpa `weight` eksplisit
bekerja tanpa perubahan — satu file per family, bukan satu file per weight.

### Skala yang ikut berubah

Mengganti display face mengubah metrik, jadi skalanya disetel ulang, bukan
diwarisi:

| Style     | v1                    | v2                      | Alasan                                            |
| --------- | --------------------- | ----------------------- | ------------------------------------------------- |
| `h1`      | lh 80%, track −0.05em | lh **85%**, **−0.04em** | Syne berbadan lebih tinggi; 80% menabrakkan baris |
| `h2`      | w700, lh 80%          | **w600**, lh **90%**    | sama, pada ukuran lebih kecil                     |
| `p-big`   | mono                  | **display**             | prosa dibaca, bukan dipindai                      |
| `p`       | mono                  | **display**             | idem                                              |
| `caption` | 8 → 10px              | **11 → 12px**           | 8px di bawah lantai keterbacaan manapun           |

Baris `caption` menutup cacat yang v1 **tandai tapi tidak perbaiki**:
dokumen lama memuat "Flag for review: `caption` at 8px mobile is below the
12px minimum". Menandai bukan memperbaiki.

---

## 3. Konsekuensi di komponen

Menghapus `--color-black`, `--color-white`, `--color-green`, `--color-blue`
dan `--color-red` membuat setiap komponen yang memakai literal itu berhenti
bekerja secara diam-diam — utility Tailwind-nya tidak lagi punya nilai.
Semuanya adalah pelanggaran aturan keras #9 (`CLAUDE.md`: _"Semantic tokens,
not literals"_) yang sudah ada sebelum tahap ini, dan sekarang terlihat:

| File                                       | Sebelum                              | Sesudah                                       |
| ------------------------------------------ | ------------------------------------ | --------------------------------------------- |
| `app/[locale]/layout.tsx` (skip link)      | `bg-black text-white ring-white`     | `bg-secondary text-primary ring-contrast`     |
| `components/ui/form/form.module.css`       | fill hijau/putih untuk sukses/error  | netral + outline; label yang menandakan state |
| `components/ui/error-view/index.tsx`       | `bg-black text-white`, `gray-*` mati | token semantik + utility `dr-*`               |
| `components/ui/accordion/*.stories.tsx`    | `border-white/20`                    | `border-secondary/20`                         |
| `.../sanity/components/disable-draft-mode` | `bg-red`                             | `bg-contrast`                                 |
| `components/ui/not-configured/*.css`       | override merah lokal                 | `var(--color-contrast)`                       |
| `components/ui/not-found-view/*.css`       | referensi aksen basi                 | isian terbalik + `color-mix`                  |

Catatan jujur soal `error-view`: utility `px-6`, `mb-4`, `text-4xl`,
`bg-gray-100` di file itu **sudah mati sebelum tahap ini** — `tailwind.css`
mereset `--spacing-*` dan `--color-*` ke `initial`, jadi skala bawaan Tailwind
tidak pernah ada di proyek ini. Diperbaiki sekalian karena membiarkan padding
yang tidak berfungsi di sebelah warna yang baru dibetulkan bukan pilihan.

State sukses/error pada form sekarang **tidak disandikan warna sama sekali**.
Label tombol sudah berganti ke `successText`/`errorText` dan pesan error
dirender di `.messages`, jadi tidak ada informasi yang hilang — dan tidak ada
lagi state yang hanya bisa dibedakan lewat warna.

---

## 4. File yang disentuh

- `lib/styles/colors.ts` — dua netral, dua tema, tema `red` dihapus
- `lib/styles/fonts.ts` — Geist → Syne; Geist Mono tetap
- `lib/styles/typography.ts` — skala disetel ke metrik Syne; prosa ke display
- `lib/styles/css/tailwind.css` — regenerasi (`bun run setup:styles`)
- `lib/styles/scripts/contrast-baseline.json` — dikosongkan
- `app/[locale]/layout.tsx`, `app/manifest.ts` — `themes.red` → `themes.dark`
- komponen di tabel §3
- `docs/DESIGN-SYSTEM.md` — §1 dan §2 ditulis ulang

## 5. Kriteria keluar — status

| Kriteria                                            | Status                               |
| --------------------------------------------------- | ------------------------------------ |
| `contrast.test.ts` hijau **tanpa di-silence**       | ✅ baseline kosong, bukan diterima   |
| `bun run check`                                     | ✅ 328 test lulus                    |
| `bun run build`                                     | ✅ `/en` dan `/id` tetap `○ Static`  |
| `bun run build-storybook`                           | ✅                                   |
| `CI=true bun run test:e2e` (termasuk axe)           | ✅ 19 lulus                          |
| Nol nilai desain hardcode masuk lewat perubahan ini | ✅ satu `oklch(0 0 0 / .25)` dihapus |

## 6. Yang belum terverifikasi, dinyatakan eksplisit

- **Tidak ada profiling browser.** Tidak ada angka performa di tahap ini, dan
  tidak ada yang diklaim. Batasan lingkungan ini tercatat di
  `docs/TEARDOWN.md` dan `docs/RESOURCES.md`.
- **Sistem ini belum diuji di atas karya nyata.** Seluruh argumen "netral
  supaya karya yang berwarna" masuk akal secara desain dan didukung dua sumber,
  tapi belum ada satu pun gambar karya di dataset. Penilaian sebenarnya baru
  bisa dilakukan setelah Tahap 4.
- **Typeface komersial masih celah #1** di `docs/RESOURCES.md`. Syne adalah
  pilihan open-source terbaik untuk register ini, bukan pilihan terbaik secara
  mutlak. Menukarnya nanti hanya menyentuh `lib/styles/fonts.ts`.
