# MCP — server yang dipakai repo ini, dan yang sengaja tidak

> `.mcp.json` di akar repo adalah konfigurasinya. Berkas ini menjawab **kenapa**
> tiap server ada di sana, apa yang ia buka, dan apa yang ditolak beserta
> alasannya — supaya daftar itu bisa diperdebatkan, bukan sekadar diwarisi.

Semua nama paket dan versi di bawah **diverifikasi ke registry npm**, bukan
diingat. Aturannya `CLAUDE.md` #18: baca sumbernya, jangan badge-nya.

---

## 1. Menyambungkannya

```bash
# Dari akar repo. Claude Code membaca .mcp.json di sini.
/mcp            # di dalam sesi — menampilkan status & menjalankan otorisasi
```

Tiga server jalan tanpa kredensial apa pun. Dua butuh langkah Anda:

| server     | yang Anda lakukan                                                     |
| ---------- | --------------------------------------------------------------------- |
| `sanity`   | Otorisasi sekali lewat `/mcp` — login akun Sanity Anda                |
| `context7` | Set `CONTEXT7_API_KEY` di lingkungan Anda (free tier di context7.com) |

`CONTEXT7_API_KEY` **tidak** ditulis di `.mcp.json` — berkas itu ter-commit,
jadi ia hanya merujuk variabel lingkungan. Aturan yang sama seperti token mana
pun di repo ini: rahasia tinggal di lingkungan, bukan di berkas yang ter-track.

---

## 2. Yang dipasang, dan apa yang ia buka di sini

### `chrome-devtools` — `chrome-devtools-mcp` (Apache-2.0, gratis)

**Yang paling penting dari kelimanya.** `docs/ROADMAP.md` §1.5 menuliskannya
harfiah:

> Sampai `chrome-devtools-mcp` tersedia, semua angka performa disebut
> **anggaran**, bukan hasil ukur. Ini aturan keras `CLAUDE.md` #19.

Jadi server ini bukan kemudahan — ia satu-satunya yang mengubah status setiap
angka performa di repo ini dari klaim jadi pengukuran.

**Satu peringatan jujur yang harus ikut setiap angka yang ia hasilkan.**
`CLAUDE.md` #19 mencatat kontainer lama merender lewat SwiftShader tanpa GPU,
jadi frame time di rute WebGL adalah lantai perangkat lunak. Mesin
pengembangan sekarang punya GPU nyata — tapi kelas bawah. Itu lantai yang
**berbeda**, bukan angka yang dialami pengguna. Angka main-thread (long task,
script time, FCP) dan perbandingan setara antar-rute tetap yang boleh dikutip.

### `playwright` — `@playwright/mcp` (Apache-2.0, gratis)

Mata interaktif: snapshot pohon aksesibilitas, screenshot dua viewport,
klik/gulir ad-hoc. **Bukan pengganti** `bun run test:e2e` — suite itu tetap
sinyal yang menentukan. Ini untuk "lihat dengan mata", yang `HOUSE-RULES.md` §2
tuntut justru karena gerbang tidak bisa melihat cacat visual.

### `sanity` — `https://mcp.sanity.io` (gratis dengan akun)

Baca/tulis konten CMS, semai fixture, periksa skema tanpa keluar sesi.
Repo ini **sudah** punya skripnya sejak lama: `bun run sanity:mcp` mencetak
deeplink Cursor, dan URL di `.mcp.json` di-decode dari deeplink itu.

### `shadcn` — `shadcn@latest mcp` (MIT, gratis)

Menelusuri registry komponen. **Bukan jalan pintas memasang komponen.**
`vault/magic/README.md` menuliskan kenapa: `lib/styles/css/tailwind.css`
me-reset `--color-*`, `--spacing-*`, `--font-*` dan `--breakpoint-*` ke
`initial`, jadi komponen yang ditempel apa adanya merender **tanpa gaya**. Yang
ditawarkan sumber semacam ini adalah **tekniknya**, dan tiap berkas tetap harus
lewat lima transformasi di direktori itu — digerbangi `vendor-rules.test.ts`.

### `context7` — `@upstash/context7-mcp` (MIT, free tier)

Dokumentasi versi-benar untuk GSAP/ScrollTrigger, R3F, drei, Next 16,
Tailwind v4. Ia menjaga masalah yang `AGENTS.md` sebut tentang dirinya sendiri:

> **This is NOT the Next.js you know.** This version has breaking changes —
> APIs, conventions, and file structure may all differ from your training data.

---

## 3. Yang sengaja TIDAK dipasang

Daftar ini ada supaya penolakannya bisa ditinjau ulang, bukan ditemukan lagi
dari nol.

| server                         | kenapa tidak                                                                                                                                                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Figma** (resmi)              | Praktis berbayar: seat Starter/View dibatasi **6 tool call per bulan**; desktop server menuntut Dev/Full seat berbayar. Alternatif gratis `GLips/Figma-Context-MCP` (MIT) ada kalau memang dibutuhkan                                                              |
| **Figma** (alasan nyata)       | Bukan biaya. Repo ini **code-first** — token lahir di `lib/styles/colors.ts` dan CSS-nya di-_generate_. Figma menjadikannya **sumber kebenaran kedua**, dan dua sumber kebenaran selalu hanyut                                                                     |
| **GitHub MCP**                 | `gh` CLI sudah menutup PR, run CI, dan log — tanpa memakan context window                                                                                                                                                                                          |
| **21st.dev Magic**             | Keluarannya tetap harus lewat lima transformasi `vault/magic/`. Ia tidak menghemat bagian yang mahal                                                                                                                                                               |
| **Mobbin**                     | Berlangganan. `docs/TEARDOWN.md` sudah memuat pengukuran sepuluh situs award yang lebih relevan untuk register ini                                                                                                                                                 |
| **Chromatic / Percy**          | Berbayar; Playwright sudah punya perbandingan screenshot bawaan                                                                                                                                                                                                    |
| **MCP aset** (Unsplash/Pexels) | Tekstur dan grain boleh. Foto yang menyiratkan klien, karya, atau tim **melanggar** aturan nol konten karangan — itu klaim tentang entitas nyata                                                                                                                   |
| **Google Stitch**              | Paketnya `@_davideast/stitch-mcp` (scope personal, pra-1.0), **bukan** `@google/stitch-mcp` yang banyak disebut — npm menjawab `{"error":"Not found"}` untuk yang itu. Berguna untuk ideasi tata letak; keluarannya HTML/Tailwind yang merender tanpa gaya di sini |

**Batas konteks, dan kenapa daftarnya pendek.** Tiap server memuat definisi
tool ke context window setiap sesi. Skill `context-budget` ada persis untuk
masalah itu. Lima adalah batas yang dipilih sadar; di atas itu, konteks yang
hilang lebih mahal daripada kemampuan yang didapat.

---

## 4. Server yang butuh otorisasi di sesi non-interaktif

Sesi headless tidak bisa menjalankan alur OAuth. Kalau sebuah server melapor
belum terotorisasi, sambungkan dari sesi interaktif (`claude mcp` atau `/mcp`)
lebih dulu — kemampuannya tidak tersedia sampai itu dilakukan.
