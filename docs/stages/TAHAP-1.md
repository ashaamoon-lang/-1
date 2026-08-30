# TAHAP 1 — Mengunci Sistem Desain

Stage-spec yang diwajibkan `docs/ROADMAP.md` §3.0. Tidak ada kode ditulis
sebelum dokumen ini ada.

**Kenapa tahap ini sekarang, bukan nanti.** `docs/DESIGN-SYSTEM.md` sudah
menetapkan _struktur_ (satu aksen, dua family, 2–3 weight, oklch) tapi
sengaja membiarkan _nilainya_ terbuka. Selama masih terbuka, setiap komponen
yang ditulis berisiko dibongkar ulang. Mengunci sekarang berarti Tahap 2
menulis komponen sekali.

---

## 1. Hasil query skill

Dijalankan sesuai ritual §2.1 roadmap. Hasilnya **dinilai, bukan ditelan** —
`docs/TEARDOWN.md` menang kalau bertentangan, karena itu pengukuran situs
nyata, bukan katalog umum.

### `--domain color`

Skill mengembalikan pola _Portfolio/Personal_: monokrom `#18181B`/`#FAFAFA`
dengan aksen **`#2563EB`**, catatan "Monochrome + blue accent".

**Diambil:** strukturnya — ground monokrom, satu aksen. Itu mengonfirmasi
`TEARDOWN.md` §3 secara independen.

**Ditolak:** warnanya. `#2563EB` adalah biru default yang ada di hampir setiap
UI kit. Tidak satu pun dari sepuluh situs yang diukur memakai biru semacam
itu sebagai aksen. Memakainya berarti mengambil persis ciri "templated" yang
seluruh riset ini ada untuk dihindari.

### `--domain typography`

Tiga pasangan dikembalikan:

| Pasangan                                           | Penilaian                                                                                                  |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Playfair Display + Source Serif 4 + JetBrains Mono | Register salah. Serif editorial/luxury, bukan neo-grotesque yang diukur.                                   |
| Archivo + Space Grotesk                            | Terdekat secara maksud, tapi **tanpa mono** — dan mono terbukti dipakai di 4 dari 10 situs untuk metadata. |
| Libre Bodoni + Public Sans                         | Register majalah. Bukan studio.                                                                            |

**Kesimpulan jujur: tidak ada yang cocok.** Situs yang diukur memakai
neo-grotesque netral (Aeonik, Söhne, Apercu, Geist) berpasangan dengan mono.
Rekomendasi di §2 datang dari `TEARDOWN.md`, bukan dari skill — dan itu
dicatat di sini supaya keputusannya bisa ditelusuri.

---

## 2. Keputusan: typeface

**Geist + Geist Mono.**

Ini bukan selera. `TEARDOWN.md` §4 mencatat basement.studio — agensi pemenang
award — mengirim **Geist + Geist Mono** di produksi. Dari semua typeface di
set pengukuran (Aeonik, Apercu, Söhne, Maisonneue, ABC Arizona, Brier), Geist
adalah **satu-satunya yang open-source dan gratis**.

Terverifikasi tersedia lewat `next/font/google` dengan sumbu `wght` variabel
untuk keduanya, jadi pola `fonts.ts` yang ada (tanpa `weight` eksplisit)
bekerja tanpa perubahan.

**Yang diganti:** `Oswald`. Itu sans _condensed_ — register poster, bukan
studio. Placeholder bawaan Satūs, dan tidak pernah dipilih untuk proyek ini.

**Yang tetap terbuka:** typeface komersial masih celah #1 di
`docs/RESOURCES.md`. Geist membuat situs ini terlihat disengaja dan konsisten
dengan bukti, tapi Aeonik atau Söhne berlisensi tetap upgrade nyata kalau
studio mau membelinya nanti. Menukarnya belakangan hanya menyentuh
`lib/styles/fonts.ts`.

---

## 3. Keputusan yang butuh user: aksen

Struktur sudah pasti — **satu** aksen berkroma tinggi di atas ground
off-black/off-white. Hue-nya keputusan brand, bukan keputusan teknis.

Aksen yang benar-benar diukur (`docs/TEARDOWN.md` §3):

| Situs                | Aksen     | Karakter                          |
| -------------------- | --------- | --------------------------------- |
| basement.studio      | `#ff4d00` | oranye, paling berani             |
| Minh Pham            | `#eb5939` | oranye-merah, lebih hangat/lembut |
| darkroom.engineering | `#e71419` | merah murni                       |
| Lando Norris         | `#d2ff00` | lime asam                         |
| Lusion               | `#c1ff00` | hijau asam                        |
| Iventions            | `#9c93e8` | periwinkle, paling tenang         |

Polanya: **hangat (oranye/merah) atau asam (lime)**. Tidak ada yang memakai
biru default.

Apapun yang dipilih akan ditulis dalam `oklch()` dan diuji `contrast.test.ts`
sebelum dikunci — Satūs menyematkan merahnya di `oklch(0.592 …)` justru karena
hanya di pita sempit itu satu warna lolos WCAG AA di atas hitam _dan_ putih.

---

## 4. Ground: lepas dari hitam/putih murni

`TEARDOWN.md` §3 menemukan situs yang terasa paling dipertimbangkan tidak
memakai `#000`/`#fff` murni: Lando Norris `#111112`/`#f4f4ed`, Minh Pham
`#0d0d0d`, By-Kin `#242527`/`#f4f2ed`.

Saat ini `lib/styles/colors.ts` memakai `oklch(0 0 0)` dan `oklch(1 0 0)` —
hitam dan putih murni. Menggesernya sedikit adalah perubahan kecil dengan
dampak besar pada kesan "disengaja".

---

## 5. File yang disentuh

- `lib/styles/fonts.ts` — Oswald → Geist, Spline Sans Mono → Geist Mono
- `lib/styles/colors.ts` — ground off-black/off-white, aksen terpilih (oklch)
- `lib/styles/typography.ts` — periksa ulang skala terhadap metrik Geist
- `docs/DESIGN-SYSTEM.md` — ganti placeholder dengan nilai yang benar-benar dipilih
- `lib/styles/scripts/contrast-baseline.json` — hanya jika ada baseline sadar

## 6. Kriteria keluar

- `bun test lib/styles/scripts/contrast.test.ts` hijau, **tanpa di-silence**
- `bun run check`, `bun run build`, `CI=true bun run test:e2e` hijau
- Storybook merender palet dan tipografi baru
- `DESIGN-SYSTEM.md` memuat nilai nyata, bukan placeholder
- Nol nilai desain hardcode masuk lewat perubahan ini

## 7. Risiko

Yang paling mungkin gagal: **kontras aksen**. Aksen berkroma tinggi seperti
lime `#d2ff00` sangat terang — kontrasnya bagus di atas hitam dan buruk di
atas putih. Kalau warna terpilih tidak lolos di kedua ground, pilihannya
adalah menyesuaikan lightness-nya di oklch (mengubah warnanya) atau membatasi
pemakaiannya ke satu tema. Itu dilaporkan, bukan diam-diam di-baseline.
