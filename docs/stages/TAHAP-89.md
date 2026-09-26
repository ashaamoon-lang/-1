# Tahap 89 — Yang Tahap 84 tinggalkan, dan klaim saya bahwa ia bersih

> **Status: terkirim.** Spec ditulis lebih dulu sesuai `ROADMAP.md` §3.0;
> hasilnya di §6.
>
> Bukan permintaan baru. Ditemukan sendiri saat memeriksa screenshot palet
> pencarian pemilik repo, yang masih menampilkan "Agent index".

---

## 1. Bagaimana ini ditemukan

Screenshot palet pencarian dari pemilik repo menampilkan `/ai` "Agent index" —
halaman yang Tahap 84 hapus. Dua hal diperiksa:

1. **Asal entri itu: build lain.** `D:\HELLO Project\arth\.next` masih berisi
   `server/app/en/ai.html` — build 18 September, branch
   `claude/satus-award-website-foundation-r6o5cf`, tanpa Tahap 79–88. Build di
   `arth-design` tidak lagi punya halaman itu, dan palet di build ini menampilkan
   16 entri, bukan 17. Kode palet benar.
2. **Tetapi pencarian yang sama menemukan sisa yang nyata.** `TAHAP-84.md` §7.1
   mengklaim sitemap, `/llms.txt` dan 404 markdown bersih — benar — dan §7.3
   mencatat "tiga hal yang nyaris hilang". Yang tidak ia catat: klaim perilaku
   saat ini yang masih menyebut `/ai` di sembilan berkas kode, satu keluaran yang dihasilkan
   skrip, dan dua panduan yang menyuruh orang membuka halaman yang sudah tidak
   ada.

Kesalahannya milik saya dan bentuknya spesifik: Tahap 84 memilah **63 berkas
dari `grep`**, dan pemilahan itu memperlakukan komentar berbentuk kalimat masa
kini sebagai riwayat bila ia kebetulan juga menyebut tahap lama. Dokumen di
luar `docs/stages/` juga tidak pernah diperiksa sebagai kelas tersendiri.

---

## 2. Pemilahan ulang

### 2.1 Keluaran hidup — yang paling berat

| berkas                                          | apa yang salah                                                                                            |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `lib/scripts/templates/deployment-checklist.ts` | **menghasilkan** butir `` `/llms.txt` and `/ai` reviewed for placeholder copy`` di checklist serah-terima |
| `lib/scripts/templates/templates.test.ts`       | mengasersi butir itu                                                                                      |
| `docs/MENJALANKAN-LOKAL.md` §6                  | menyuruh membuka `/en/ai` (soft-404) dan `/en/work/practice/ai-data` (308 ke `/en/practice/ai-data`)      |
| `PROD-README.md`                                | mendaftar `/ai` di antara permukaan yang harus memancarkan bentuk berprefiks                              |
| `AGENTS.md`                                     | tabel modul menyebut `/ai` sebagai isi `lib/seo/README.md`                                                |

Diukur, bukan diasumsikan:

```
/en/work/practice/ai-data   308 -> /en/practice/ai-data
/en/practice/ai-data        200  "AI & Data — Arth"
/en/ai                      200  "Page not found — Arth"   (soft-404)
```

### 2.2 Klaim perilaku saat ini di komentar

| berkas                                                                 | klaim                                                                                                                                                                                           |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/content/search-index.ts`                                          | "## Why `/ai` is in here — it is a real page, listed in the footer"                                                                                                                             |
| `lib/seo/routes.ts`                                                    | enam: sitemap/`/ai` diiklankan; unfeature menghapus dari `/ai`; slug `ai` bertabrakan dengan rute statis `/ai`; `/ai` harus selalu menjawab; "the three cannot drift"; `locale` ada untuk `/ai` |
| `lib/seo/route-catalog.ts`                                             | tiga: contoh `/ai`, `/en/ai`; "`/llms.txt`, `/ai` and the sitemap"; "the machine view"                                                                                                          |
| `lib/i18n/paths.ts`                                                    | contoh `/ai`, `/id/ai`, `/en/ai -> /ai`                                                                                                                                                         |
| `lib/content/practices.ts`                                             | "**Ten** modules read this — … `/ai` …" — yang benar-benar mengimpornya **delapan**                                                                                                             |
| `app/sitemap.ts`                                                       | "`/llms.txt` and `/ai` do the expansion through the same accessor"                                                                                                                              |
| `app/[locale]/not-found.tsx`, `components/ui/not-found-view/index.tsx` | "`/ai` is in the sitemap itself" — kalimat masa kini                                                                                                                                            |
| `components/ui/not-found-view/not-found-view.stories.tsx`              | menjelaskan tautan pemulihan `/ai`, `/llms.txt`, `/sitemap.xml` yang **sudah dihapus sejak Tahap 38**                                                                                           |

Satu yang layak disebut tersendiri: `routes.ts` menjelaskan penolakan slug
dengan contoh _"a `page` with slug `ai` resolves to `/ai`, which the static
route already serves"_. Rute statis itu tidak ada lagi, jadi slug `ai` kini
**sah**. Kodenya benar — ia membaca katalog — hanya contohnya yang salah.

### 2.3 Riwayat — tidak disentuh

Kalimat masa lampau yang merekam pengukuran atau keputusan: `layout.tsx`
(859KB yang diunduh `/en/ai`), `work/page.tsx`, `features/index.tsx`,
`site.ts:175` ("reached … `/en/ai`"), `routes.ts:279` ("were absent from"),
dan yang sudah diberi penanda "(removed in Tahap 84)". Sama seperti Tahap 84:
riwayat dicatat apa adanya.

---

## 3. Daftar berkas

Semua yang ada di §2.1 dan §2.2, plus `docs/stages/TAHAP-84.md` (§7.8,
koreksi di tempat atas klaimnya sendiri), `docs/stages/TAHAP-88.md` (§7.6,
CI), `docs/stages/TAHAP-89.md`, `docs/ROADMAP.md`, `docs/HANDOFF.md`.

**Tidak ada kode aplikasi yang berubah perilakunya.** Satu-satunya perubahan
yang bukan komentar adalah teks checklist yang dihasilkan skrip.

---

## 4. Kriteria keluar

1. `grep` atas kode, panduan, dan dokumen non-riwayat tidak menemukan klaim
   masa kini tentang `/ai`.
2. Checklist yang dihasilkan tidak lagi menyebut `/ai`; ujinya mengasersi teks
   baru.
3. `bun run check` hijau.

---

## 5. Yang tidak dikerjakan, dinyatakan eksplisit

- **Parameter `locale` di `getAdvertisedRoutes` dibiarkan**, meski sejak
  Tahap 84 tidak ada pemanggil yang mengisinya. Menghapus parameter adalah
  perubahan API, bukan koreksi dokumentasi; komentarnya kini menyatakan bahwa
  tidak ada pemanggil.
- **Deskripsi hero di `MENJALANKAN-LOKAL.md` §6** ("index praktik kanan-atas")
  kemungkinan juga sudah basi — index praktik kini di kanan-bawah. Tidak
  diverifikasi terhadap setiap lebar, jadi tidak diubah; dicatat.
- **Nol angka performa diklaim** — `CLAUDE.md` #19.

---

## 6. Hasil

### 6.1 Yang diubah

29 penggantian di 14 berkas, masing-masing lewat skrip yang berhenti bila teks
lamanya tidak ditemukan **tepat sekali** — plus satu komentar uji yang
tertangkap oleh pencarian sisa (`routes.test.ts:144`, kembaran komentar yang
sama di `routes.ts`).

Dua yang bukan sekadar menghapus kata:

- **`practices.ts` mengklaim "ten modules"** membaca `practiceTemplate`.
  Dihitung: **delapan** mengimpornya langsung. Sitemap, `/llms.txt` dan helper
  alternates menjangkaunya lewat katalog rute, jadi daftarnya ditulis ulang
  dari hitungan itu, bukan dari daftar lama dikurangi `/ai`. Klaim bahwa
  `app/[locale]/work/practice/[value]/page.tsx` adalah pengalihan lama
  diperiksa lebih dulu — ia berkata sendiri _"kept only to redirect"_.
- **Contoh penolakan slug di `routes.ts`** kini memakai `journal`, rute statis
  yang masih ada, dan menyatakan bahwa slug `ai` sekarang sah.

### 6.2 Sisa yang dibiarkan, dengan alasan

Pencarian sisa sesudah 29 penggantian masih menemukan `/ai` di 18 baris. Satu
adalah klaim masa kini (`routes.test.ts:144`) dan diperbaiki. Tujuh belas
sisanya dibaca satu per satu: kalimat masa lampau yang merekam pengukuran
(`layout.tsx`, `page.tsx`, `features/index.tsx`, `site.ts`,
`work/page.tsx`), kalimat yang sudah bertanda "removed in Tahap 84", dan teks
koreksi tahap ini sendiri. Nol klaim masa kini. Data uji `'../ai'` (contoh
path traversal) disaring dari pencarian sejak awal dan tidak termasuk hitungan
itu.

### 6.3 Gerbang

```
bun run check    597 lulus, 0 gagal
```

`templates.test.ts` mengasersi teks checklist yang dihasilkan, jadi lulusnya
adalah bukti bahwa checklist tidak lagi menyebut `/ai`.

Tidak ada build atau e2e dijalankan untuk tahap ini, dan itu sengaja: tidak ada
perubahan yang mencapai apa pun yang dirender. Satu-satunya perubahan non-
komentar adalah teks di skrip generator checklist, yang diuji unit.

### 6.4 CI sesudah push

Ditambahkan di commit Tahap 90.

```
Tahap 88 (d547c53)   723 lulus · 1 flaky · 14 dilewati   738
Tahap 89 (a5e8436)   723 lulus · 1 flaky · 14 dilewati   738
```

Identik, seperti seharusnya untuk tahap tanpa perubahan perilaku.

Push-nya sendiri sempat ditolak GitHub dengan **403**: Git Credential Manager
menyerahkan kredensial yang tidak lagi diterima, sementara akun `gh` yang masuk
punya izin push. Atas keputusan pemilik repo, commit ini dikirim dengan
kredensial `gh` untuk satu perintah itu saja
(`git -c credential.helper= -c "credential.helper=!gh auth git-credential" push`);
konfigurasi git dan Credential Manager tidak diubah.

### 6.5 Koreksi: sapuan ini tidak mencapai `e2e/` — Tahap 90

Kriteria keluar §4.1 berbunyi "`grep` atas kode, panduan, dan dokumen
non-riwayat". Pencariannya mencakup `app`, `lib`, `components`, `vault` dan
dokumen — tidak `e2e/`. Di sana Tahap 90 menemukan **satu entri daftar rute
yang hidup**: `e2e/vocabulary.e2e.ts` masih memeriksa `` `/${locale}/ai` ``.
Karena rute yang dihapus menjawab soft-404 dengan 200, dua uji itu lulus dengan
memindai halaman "Page not found" untuk kosakata lama — tampak menjaga halaman
mesin, sebenarnya menjaga 404. Dihapus di Tahap 90, bersama satu komentar masa
kini di `visual-substance.e2e.ts`.
