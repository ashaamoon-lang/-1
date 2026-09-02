# TAHAP 13 — Situs ini akhirnya mengatakan apa yang Arth kerjakan

Stage-spec yang diwajibkan `docs/ROADMAP.md` §3.0.

Dua belas tahap membangun situs ini sebagai **studio karya pesanan**: lukisan,
mural, ilustrasi. Sektornya bukan itu. Arth adalah **agency high-ticket** —
**Consulting · AI/Data · Commission**.

Tahap ini menutup jarak itu. Aturannya sama: tiap klaim diukur, tiap perbaikan
datang dengan gate yang dibuktikan merah dulu, dan yang tidak dikerjakan
dinyatakan.

---

## 1. Ini bukan penggantian teks

Kosakata itu **struktural**. Ia adalah nilai tertutup di skema Sanity, segmen
di URL, entri di JSON-LD `services` dan `knowsAbout`, label filter katalog,
dan tiga baris di kolom kanan hero. Selama ia salah, tiap halaman menjanjikan
hal yang tidak dijual perusahaan ini — dan mesin jawaban membaca janji itu
dari `/llms.txt` dan `/ai` dengan patuh, karena kedua permukaan itu memang
dibangun untuk dipercaya.

### 1.1 Terukur — apa yang dijanjikan situs hari ini

Build produksi, dihitung dari yang benar-benar **disajikan**, bukan dari
sumber:

| Permukaan   | Sebutan kosakata seni |
| ----------- | --------------------- |
| `/en`       | **113**               |
| `/en/ai`    | **137**               |
| `/id/ai`    | **109**               |
| `/id`       | **84**                |
| `/en/work`  | **82**                |
| `/llms.txt` | **44**                |

```
meta description  "Arth is a commissioned-artwork studio working in painting,
                   mural and illustration — each piece made to a brief, for the
                   room it will live in."
knowsAbout        ["Commissioned artwork", "Mural painting", "Acrylic painting",
                   "Gouache painting", "Illustration"]   — 5 dari 5
```

### 1.2 Kabar baik, dan ia hasil keputusan lama

Vokabulernya punya **satu sumber kebenaran** — `lib/content/disciplines.ts` —
dengan **sepuluh konsumen**, semuanya mengimpor darinya. Itu keputusan Tahap 8,
dan ia berbuah sekarang: ini penggantian terarah, bukan pencarian dan
penggantian di seluruh repositori.

### 1.3 Dua puluh tujuh berkas menyebutnya, tapi tidak semuanya cacat

Dipisahkan, karena angka mentah akan menyesatkan:

| Jenis                                               | Berkas | Contoh                                                                                                                                                 |
| --------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Menanggung nilai** — dikirim ke pembaca atau agen | 11     | `disciplines.ts`, `site.ts`, `project.ts`, `messages/*.json`, `home-fallback.ts`, `discipline-filter/`, `generate-brand-assets.ts`, dua berkas typegen |
| **Prosa penjelas** — komentar dan URL contoh        | 16     | `components/ui/image` "flashes white in front of a **painting**", `lib/i18n/paths.ts` "`/work/**mural**`"                                              |

Yang pertama adalah cacat. Yang kedua adalah kebersihan: komentar yang
menjelaskan perilaku memakai domain lama sebagai contoh. Keduanya dikerjakan,
tapi hanya yang pertama yang digerbangi — sebuah gate yang memaksa penulisan
ulang komentar ilustratif akan menghukum dokumentasi, bukan melindungi pembaca.

---

## 2. Ritual `ui-ux-pro-max`

`ROADMAP.md` §2.1. Dijalankan, dan hasilnya ditempel **termasuk yang nol**.

```bash
S=.claude/skills/ui-ux-pro-max/scripts/search.py
python3 $S "agency services portfolio"       --domain landing   → 0 hasil
python3 $S "portfolio-grid"                  --domain landing   → 1 (retry)
python3 $S "content clarity scannability"    --domain ux -n 3
python3 $S "labels terminology jargon"       --domain ux -n 3
```

**Query pertama mengembalikan nol.** Skill memerintahkan mengulang dengan
istilah terdekat dan mengatakannya terus terang kalau tetap jatuh ke default.
Diulang dengan `portfolio-grid` → 1 hasil.

| Hasil                                                                                                                             | Putusan                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `portfolio-grid`: urutan `Hero > Project Grid > About > Contact`, "Neutral background (let work shine)", **"Filter by category"** | **Diterima — dan ia justru menguatkan tahap ini.** Polanya menuntut filter kategori; kita punya filternya, kategorinya saja yang salah. |
| UX `Heading Clarity`, `Truncation`                                                                                                | Sudah dipenuhi tipografi Tahap 1 dan `text-wrap: balance`.                                                                              |
| UX `Form Labels`, `ARIA Labels` (severity High ×2)                                                                                | **Tidak berlaku di tahap ini** — belum ada form. Dicatat untuk tahap intake, bukan dilewatkan diam-diam.                                |

**Tidak ada pola "agency services" di database skill ini.** Struktur layanan
yang saya pilih di bawah bukan berbasis database, dan disebut begitu.

---

## 3. Kosakata baru

| Kunci        | EN         | ID         |
| ------------ | ---------- | ---------- |
| `consulting` | Consulting | Konsultasi |
| `ai-data`    | AI & Data  | AI & Data  |
| `commission` | Commission | Pesanan    |

Kata-katanya milik Anda, dikutip apa adanya dari keputusan Anda: _"AGENCY HIGH
TICKET (dengan CONSULTING, AI/DATA, serta COMMISION PAID)"_.

`lib/content/disciplines.ts` → **`lib/content/practices.ts`**, bentuk modul
dipertahankan persis — daftar tertutup, guard, konstanta segmen, helper
template — supaya kesepuluh konsumen berubah hanya pada **nama**, bukan pada
cara pakainya.

**Segmen rute `discipline` → `practice`**, sehingga `/work/practice/ai-data`.
"Discipline" adalah kata seni rupa. `practice` sudah menjadi kata situs ini
sendiri: `home.heroIndexLabel` yang ditambahkan Tahap 12d berbunyi "Practice" /
"Praktik".

---

## 4. Skema: tiga field, bukan satu

| Sekarang                      | Menjadi                               | Alasan                                                                     |
| ----------------------------- | ------------------------------------- | -------------------------------------------------------------------------- |
| `discipline`                  | `practice`                            | daftar tertutup, tidak dilokalkan — nilainya kunci, labelnya di `messages` |
| `medium` — "Acrylic on linen" | `engagement` — "Retainer, enam bulan" | bentuk keterlibatan; prosa bebas, terlokalkan                              |
| `dimensions` — "120 × 90 cm"  | `scope` — "3 tim · 14 minggu"         | skala pekerjaan; tak terlokalkan, seperti sebelumnya                       |

**Field di-rename, bukan sekadar diberi judul baru.** Sebuah field bernama
`medium` yang berisi "Retainer, enam bulan" adalah pergeseran yang proyek ini
justru ada untuk memperbaiki — nama yang berbohong tentang isinya adalah cacat
yang tidak pernah gagal di gate mana pun.

**Migrasi.** Seluruh isi dataset adalah fixture (`fixture-*`), jadi migrasinya
adalah `--clean` lalu semai ulang. Untuk dataset nyata ini butuh skrip migrasi
Sanity; dicatat di `docs/DEPLOYMENT.md`, tidak didiamkan.

---

## 5. Berkas yang disentuh

**Kosakata & rute** — `lib/content/practices.ts` ·
`app/[locale]/work/practice/[value]/page.tsx` · `work/{catalogue,hrefs}` ·
`work/[slug]/page.tsx` · `app/[locale]/page.tsx` · `lib/seo/route-catalog.ts`

**Skema & query** — `schemas/project.ts` · `queries.ts` · lalu
`sanity:extract` + `sanity:typegen`

**Identitas & prosa** — `lib/seo/site.ts` · `lib/content/home-fallback.ts` ·
`messages/{en,id}.json`

**Blok** — `discipline-filter/` → `practice-filter/` · `project-card` dan
`project-hero` (nama field metadata) · `*.stories.tsx`

**Aset** — `seed-fixtures.ts` (enam penugasan agency, dua per praktik; palet
pelatnya tetap, ia abstrak) · `generate-brand-assets.ts` lalu `brand:assets`

---

## 6. Gate — dibuktikan merah dulu

| Gate                                          | Berkas                                                         | Yang dijaga                                                                                             | Bukti merah                                                                                                                  |
| --------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Koherensi kosakata** (baru)                 | `lib/content/practices.test.ts`                                | tiap praktik berlabel di **kedua** locale, dan `SITE.services` punya satu entri per praktik per locale  | hari ini `services` dan `DISCIPLINES` adalah **dua daftar terpisah yang kebetulan sepakat**, dan tidak ada yang memeriksanya |
| **Yang disajikan, bukan yang ditulis** (baru) | `e2e/vocabulary.e2e.ts`                                        | nol kosakata seni di meta description, JSON-LD, `/llms.txt`, `/ai`, dan label filter — **kedua locale** | jalankan sebelum tahap ini: 44 · 82 · 84 · 109 · 113 · 137                                                                   |
| Skema dua bahasa                              | `schema-coverage.test.ts`                                      | sudah ada; harus tetap hijau setelah rename                                                             | —                                                                                                                            |
| Rute & sitemap                                | `lib/seo/routes.test.ts`                                       | tiga rute praktik ada, segmen lama hilang                                                               | jalankan sebelum rename                                                                                                      |
| Katalog · no-JS · header                      | `e2e/{catalogue-layout,no-javascript,response-headers}.e2e.ts` | ketiganya iterasi vokabuler; ikut otomatis                                                              | —                                                                                                                            |
| Seluruh gate Tahap 12                         | —                                                              | 229 tes tidak boleh turun                                                                               | —                                                                                                                            |

Gate kedua sengaja mengukur **HTTP yang disajikan**, bukan sumber. Sebuah grep
sumber bisa dipuaskan dengan menyunting komentar; ini tidak bisa.

---

## 7. Verifikasi

```bash
bun run check
bun run sanity:extract && bun run sanity:typegen
bun --env-file .env.local lib/scripts/seed-fixtures.ts --clean
bun --env-file .env.local lib/scripts/seed-fixtures.ts
rm -rf .next/cache && bun run build     # §10.4 Tahap 12: build memakai ulang cache
bun run brand:assets
bun run build-storybook
bunx playwright test
```

Ditambah: **`/llms.txt`, `/ai`, dan JSON-LD dibaca**, bukan hanya diuji ·
halaman **dilihat** dua bahasa × dua viewport · **kartu OG dilihat**, bukan
sekadar dibuat ulang.

---

## 8. Risiko

1. **Rename field mengorbankan data.** Fixture saja, jadi `--clean` cukup —
   tapi dataset nyata butuh migrasi, dan itu dicatat.
2. **URL berubah.** `/work/discipline/*` → `/work/practice/*`. Belum ada yang
   terbit, jadi belum ada tautan yang patah; setelah terbit ini tidak bisa
   diulang tanpa redirect.
3. **Typegen harus dijalankan ulang.** `bun run check` menjalankan
   `ensure:typegen`, yang hanya memeriksa **keberadaan** berkas, bukan
   kesegarannya — jadi ia tidak akan menyelamatkan saya di sini.
4. **Build cache.** Setelah semai ulang, `.next/cache` wajib dihapus. Cacat
   "hijau sambil salah" dari Tahap 12a §10.4.
5. **Prosa penggantinya milik saya, bukan milik Anda.** Copy fallback dan
   deskripsi fixture ditulis agar koheren dan bisa dinilai, dan tetap
   **ditandai sementara di halaman** lewat `home.placeholderNote` yang sudah
   ada. Kata-kata final tetap keputusan studio.

---

## 9. Yang **tidak** dikerjakan, dan alasannya

1. **Intake klien** — form, unggah, NDA. Ia menunggu tahap ini justru karena
   field formnya mewarisi kosakata ini. `components/ui/form` sudah lengkap
   (fields, hook, `runFormAction`); yang belum ada adalah API route dan
   penanganan unggahan. Komentar di `vault/blocks/contact-block` yang menolak
   form beralasan untuk studio seni dan **terbalik** untuk agency — itu
   ditandai untuk ditinjau, bukan diam-diam dibiarkan.
2. **Lapisan material WebGL** — tetap ditunda (`TAHAP-12.md` §9.1).
3. **Profiling nyata** — kini layak. `docs/RESOURCES.md` menyatakannya mustahil
   karena browser di lingkungan ini tak bisa menjangkau jaringan; **itu tidak
   lagi benar** — sepanjang Tahap 12 Chromium dijalankan terhadap build
   produksi di `localhost`, yang persis yang dibutuhkan profiling. Catatannya
   diperbaiki di tahap ini agar tidak menyesatkan tahap berikutnya; profilingnya
   sendiri bukan pekerjaan tahap ini.
4. **Kredensial Sanity tidak dirotasi**, sesuai permintaan Anda.
