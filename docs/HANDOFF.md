# HANDOFF — melanjutkan dari sesi terakhir

> Dokumen ini menjawab satu pertanyaan: **di mana kita berhenti, dan apa yang
> berlaku bagi siapa pun yang melanjutkan.** `DIREKSI.md` menjawab _kenapa_,
> `ROADMAP.md` menjawab _apa dan kapan_, `CLAUDE.md` menjawab _bagaimana_.
> Ini yang menjawab _dari mana_.
>
> Ditulis saat sesi cloud diserahkan ke terminal lokal.

---

## 1. Posisi

```
branch    claude/arth-unbound      ← fork, bercabang dari claude/arth-design di 22136de
induk     claude/arth-design       PR #16, base `main`
```

**Ini fork.** `docs/FORK.md` adalah dokumen pendiriannya dan dibaca lebih dulu:
aturan yang membatasi ekspresi desain dilepas — anggaran, dial, kosakata gaya,
ritual skill, spec-sebelum-kode, gerbang selera e2e — dan yang melindungi
pembaca dipertahankan: axe, kontras terukur, reduced motion, keyboard, jalur
tanpa JS, kebocoran GPU, header/CSP, penjaga token, dan kejujuran. Prinsipnya:
**ukur, jangan veto.** Tidak ada lagi nomor tahap.

Branch induk tidak disentuh dan tetap membawa PR-nya sendiri.

Dua track berjalan paralel di repo ini dan keduanya nyata.
`claude/satus-award-website-foundation-r6o5cf` (PR #9) membawa portabilitas
gerbang Windows dan penjaga token; ia sudah **digabungkan ke** branch di atas,
yang kini jadi tempat kerja berjalan. Yang lama tidak dihapus — PR-nya punya
riwayatnya sendiri.

**Commit dan nomor run CI sengaja tidak ditulis di sini.** Tanyakan, jangan
percaya dokumen:

```bash
git rev-parse --short HEAD
git log --oneline 22136de..HEAD      # apa yang fork lakukan sejauh ini
gh run list --branch claude/arth-unbound --limit 5
```

> **Kenapa dihapus, bukan diperbarui.** Blok ini pernah berbunyi `af1f499` /
> `CI run 62` sementara posisi sebenarnya `9ee7922` / run 63, dan itu **bukan
> kelalaian — itu struktural**: sebuah dokumen yang menuliskan hash commit-nya
> sendiri ditulis _sebelum_ commit itu ada, jadi ia salah pada saat lahir dan
> akan salah lagi setiap kali. Fakta yang tidak bisa benar saat ditulis tidak
> ditulis; yang ditulis adalah perintah yang menjawabnya.
>
> Dulu dua dokumen di repo ini **memverifikasi dirinya sendiri** — blok
> `rule-coverage` di `CLAUDE.md` dan blok design-debt di `DESIGN-SYSTEM.md` §7
> — dan nomor tahap dijaga `lib/scripts/stage-position.test.ts`. Fork
> (langkah 1) menghapus ketiga kunci itu: mereka menjaga pembukuan, bukan
> pembaca. Generatornya tinggal sebagai laporan.

**Angka gerbang juga tidak ditulis di sini, dan alasannya sama.** Blok di atas
menuliskan aturannya untuk hash commit; ia berlaku persis sama untuk tally uji,
yang benar pada hari ditulis dan salah pada commit berikutnya. Tahap 97
menemukan **lima** angka di dokumen ini yang sudah tidak benar — dua di tabel
gerbang yang dulu berdiri di sini, satu di §2, dan dua di §4 — lalu
menggantinya dengan perintah, bukan dengan angka baru.

Aturan itu dulu ditegakkan `stage-position.test.ts`; sejak fork ia hanya
kebiasaan baik. Tally yang **menyebut run atau tanggalnya** tetap boleh, dan
tempatnya §5 — di sana ia tetap benar selamanya.

```bash
bun run check              # unit, lint, tipe, aset
bun run build              # produksi
bun run build-storybook    # SEBELUM suite e2e, bukan sesudah
bunx playwright test       # terhadap server produksi yang sudah menyala
gh run list --branch claude/arth-unbound --limit 5  # angka CI yang mengikat
```

Angka per tahap ada di entri `ROADMAP.md` masing-masing, **bersama tahapnya**,
yang membuatnya tetap terbaca sebagai sejarah alih-alih sebagai janji.

**Angka gerbang milik mesin yang menjalankannya.** Diukur di laptop Windows
4-core / 7,79 GB, suite e2e memakan **41,4 menit** melawan **18,5 menit** di
CI, dan delapan uji jatuh pada `Test timeout of 30000ms` tanpa satu pun cacat
halaman. Sebelum menyimpulkan regresi dari angka yang berbeda, bandingkan ke
log CI run yang sama — bukan ke ingatan, dan bukan ke dokumen ini.

Tahap terakhir sebelum fork: **100**. Entri per tahap ada di `ROADMAP.md`,
spec-nya di `docs/stages/` — keduanya kini arsip. Fork tidak menomori tahap;
riwayatnya adalah `git log 22136de..HEAD` dan status eksekusi di
`docs/FORK.md`.

Suite e2e lokal dijalankan **tanpa `CI=1`**, terhadap server produksi yang dibangun
dan dinyalakan lebih dulu. Sebabnya diukur: `CI=1` memicu `bun run build`
kedua di dalam `webServer`, dan build memuncak 3,35 GB RSS di mesin 7,79 GB —
ia melewati timeout 300 detik dan suite mati sebelum tes pertama. Satu-satunya
perilaku yang hilang adalah `retries`, yang `playwright.config.ts:9` ikatkan
ke `CI`; **nol** spec bercabang pada `process.env.CI`, dan itu diperiksa
sebelum dijalankan. `docs/MENJALANKAN-LOKAL.md` §8 menuliskan urutannya.

## 2. Menyalakannya kembali

`docs/MENJALANKAN-LOKAL.md` §4 memandu `.env.local` langkah demi langkah,
termasuk tiga nilai publiknya. **Nilai rahasia tidak ada di repo ini dan tidak
boleh masuk** — ambil dari dashboard Sanity.

```bash
git checkout claude/arth-unbound
bun install
# buat .env.local — lihat MENJALANKAN-LOKAL.md §4
bun run check
bun dev
```

**Kalau `bun run check` gagal pada `test:oxlint-plugin` di mesin dengan RAM
kecil, itu bukan repo ini.** RuleTester plugin JS oxlint meminta satu
`ArrayBuffer` sebesar `2 147 483 632 + 4 294 967 296 = 6 442 450 928` byte
(≈ 6,0 GiB); di laptop 8 GB ia gagal kira-kira separuh waktu dengan
`RangeError: Array buffer allocation failed`, dan **nama rule yang disebut
berbeda hampir setiap kali** — rule yang rusak tidak berpindah nama.
Jalankan tahapnya satu per satu di sana (`bun test`, `bun run lint`,
`bun run lint:types`, `bun run typecheck`, `bun run check:assets`,
`bun run test:oxlint-plugin`) dan percayai CI untuk
tarikan penuhnya. `docs/stages/TAHAP-93.md` §7.5 memuat pengukurannya.

## 3. Cara kerja yang berlaku

Bukan aturan teknis — itu ada di `CLAUDE.md` dan `AGENTS.md`. Ini **cara
menjalankan pekerjaannya**, diminta pemilik repo dan masih berlaku:

| aturan                                  | maksudnya                                                                                                  |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Satu pekerjaan penuh, sampai tuntas** | Kode, lalu **semua** gerbang, lalu commit dan push. Spec-sebelum-kode dilepas fork                         |
| **Jangan menunggu persetujuan**         | Lanjut ke tahap berikutnya sendiri. Berhenti hanya kalau ada keputusan yang benar-benar milik pemilik repo |
| **Nol konten karangan**                 | Tidak ada nama klien, entri, atau angka yang tidak berasal dari sumber yang sudah ada                      |
| **Katakan yang gagal atau dilewati**    | `CLAUDE.md` #21. Mempersempit ruang lingkup diam-diam lebih buruk daripada gagal terbuka                   |
| **Kerjakan sendiri**                    | Pemilik repo meminta pekerjaan dilakukan agen utama, bukan didelegasikan ke sub-agen                       |

### 3.1 Dua aturan yang tahap-tahap terakhir bayar mahal untuk pelajari

**Periksa angka pertama dari alat baru terhadap sumbernya, sebelum ia
membenarkan satu baris kode pun.** Aturan ini menahan lima kesalahan instrumen
di Tahap 76–78 saja: probe terkontaminasi, grep yang kurang hitung, dua positif
palsu, dan satu klaim "duplikasi" yang nyaris menghapus cakupan nyata.

**Buktikan gerbangnya merah dulu.** Gerbang yang tidak pernah dilihat gagal
adalah gerbang yang belum diketahui bisa gagal. Kalau ia hijau di hari pertama,
**katakan begitu** alih-alih membingkainya sebagai cacat yang ditemukan.

## 4. Yang berikutnya

**Bagian ini tidak lagi memuat rencana yang disalin tangan.** Sampai Tahap 97
ia berjudul _"Yang berikutnya: Tahap 79, sudah diukur"_ — tujuh belas tahap
tertinggal — dan memuat tabel anggaran momen yang menyebut **12** momen
berbeda, sementara papan skor yang men-generate angka itu menyebut **13**.
Seorang pembaca yang mempercayainya akan mengerjakan ulang pekerjaan yang sudah
ada di repo.

Yang menggantikannya adalah tiga sumber yang **menjaga dirinya sendiri**:

| pertanyaan                                                | sumber                                | dijaga oleh                               |
| --------------------------------------------------------- | ------------------------------------- | ----------------------------------------- |
| Apa yang sudah terkirim, dan apa isinya                   | `git log`; sebelum fork, `ROADMAP.md` | tidak lagi diuji (fork, langkah 1)        |
| Berapa momen, bidang kedalaman, dan pin yang ada sekarang | blok papan skor di `DIREKSI.md` §3.2b | tidak lagi diuji — regenerate dulu        |
| Utang mana yang masih terbuka, dan sejak kapan            | §5 di bawah                           | dibaca manusia, ditulis dengan tanggalnya |

Urutan kerja tetap seperti §3: kode, lalu semua gerbang, lalu commit dan
push, lalu **baca CI dan tunggu selesai sebelum push berikutnya** — `ci.yml` memakai
`cancel-in-progress`, jadi push kedua membatalkan run yang pertama sebelum
suite e2e-nya selesai.

## 5. Utang yang dibawa — keputusan pemilik repo

| butir                                   | status                                                                                                    |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Menyemai dataset Sanity                 | `bun --env-file .env.local lib/scripts/seed-fixtures.ts` — tulisan ke CMS Anda                            |
| Rotasi kredensial Sanity                | **ditunda atas permintaan pemilik repo.** Tetap jadi butir checklist pra-luncur; jangan diungkit berulang |
| `/lab` + hosting                        | terblokir menunggu domain                                                                                 |
| Merge PR #9                             | keputusan pemilik repo                                                                                    |
| Mayor `three` 0.186, `@sanity/client` 8 | belum dinaikkan                                                                                           |
| Tiga token kontras tak terukur          | `hero-wash-mid`, `line`, `line-strong` — tercatat di `contrast.test.ts`, belum diputuskan                 |
| Kontradiksi provenance `vault/`         | `vault/PROVENANCE-NOTE.md` vs `vault/magic/README.md` — lisensi, keputusan pemilik (`FORK.md` §1.4)       |
| Typeface berlisensi                     | biaya pemilik repo                                                                                        |

### 5.1 Gerbang kanvas yang melewati dirinya sendiri — ditutup di Tahap 90

**Ditutup untuk kanvas.** Lima gerbang memutuskan "rute ini punya kanvas"
dengan menunggu sebentar lalu melewatkan dirinya. Kini rute yang memasang
WebGL mengumumkannya di HTML server (`data-webgl-root` pada `<main>`), dan
`e2e/webgl-intent.ts` membaca syarat yang sama dengan situs. Tiga keadaan:
tidak dimaksudkan → skip dengan alasan; dimaksudkan tetapi gambarnya gagal atau
masih dimuat → plat itu dilewati dengan alasan; dimaksudkan dan tidak datang
→ **gagal**. Dibuktikan dengan three.js diblokir di jaringan: gerbang lama
melaporkan skip, gerbang baru gagal dengan pesan niat. `TAHAP-90.md` §7.

**Butir anggaran muat halaman: ditutup di Tahap 91.** Gerbang aksen dan
gerbang "renders its work" menunggu event `load` — setiap gambar — padahal yang
mereka ukur adalah wash dan kotak `<img>`. Dengan gambar ditunda 35 s, keduanya
mati di `goto`; sesudah diperbaiki, keduanya lulus dalam 19 s. Tahap 91 juga
menemukan bahwa `data-accent-live` dinaikkan saat komponen memilih mesh, bukan
saat mesh menggambar, dan memperbaikinya di sumbernya.

**Yang ternyata salah diatribusikan.** Catatan ini dulu
menggolongkan flaky `visual-substance:179` `/en/practice/consulting at mobile`
sebagai kanvas yang terlambat. Diukur di Tahap 90: halaman praktik **tidak
memasang WebGL**, dan region aksennya ada di HTML server. Yang habis adalah
anggaran 30 s uji itu sendiri, di `page.goto` — yang menunggu event `load`,
artinya semua gambar, di profil ponsel dengan DPR 2.6. `visual-substance:771`
"/en renders its work" mobile gagal dengan bentuk yang sama lewat
`networkidle`. Itu **anggaran muat halaman**, bukan kanvas — dan
Tahap 91 memperbaikinya, satu tahap sesudah catatan ini dikoreksi.

**Dipersempit lagi di Tahap 100, dan bentuknya kini diketahui.** Bingkai
ber-aksen yang gerbang itu potret kadang **kosong** — seragam di sekitar
luminans 242 pada pita yang mengukur 23 — sementara kontrolnya 600 ms kemudian
benar. Itu tangkapan, bukan halaman: gradien region-nya resolusi ke
`lab(4.43481 ...)`, warna yang sama dengan tanahnya. Ditekan lebih keras,
Chromium di konfigurasi proyek `mobile` (DPR 3) **menolak** menangkap sama
sekali — `Protocol error (Page.captureScreenshot)` — jadi jalur itu memang
fallible. Gerbangnya sekarang mengambil ulang sekali dan, kalau tetap, gagal
dengan sebab yang benar. **Belum diatribusikan lebih jauh**, dan riwayat CI di
`TAHAP-100.md` §7.6 menunjukkan kenapa satu run bersih bukan penutupan.

**Dipersempit di Tahap 98, dan sebab ketidakteratribusiannya ditemukan.**
Artefak Playwright diunggah CI `if: failure()`, sementara uji flaky **lulus
saat retry** — jadi buktinya dihasilkan setiap kali dan dibuang setiap kali.
Itu kini `!cancelled()`. Gerbangnya juga menulis bukti ke disk saat asersinya
gagal. Tiga mekanisme sudah tereliminasi dengan angka (`TAHAP-98.md` §1.3),
dan yang tersisa: gradien yang tercat penuh dengan kedua ujungnya nyaris sama.
**Belum diatribusikan**, dan kejadian berikutnya akan membawa buktinya.

**Sisa yang masih terbuka:** "added no modulation: 0.9" di
`/en/practice/consulting` **desktop**, dua kali, keduanya pada server dingin —
sekali dengan gerbang lama, jadi ia bukan akibat perubahan itu. Tidak pernah
berulang saat diisolasi. Belum diatribusikan (`TAHAP-91.md` §7.4).

**`bun run check` satu tarikan tidak andal di laptop ini, dan sebabnya kini
terukur.** RuleTester plugin JS oxlint meminta satu `ArrayBuffer` sebesar
`2 147 483 632 + 4 294 967 296 = 6 442 450 928` byte (≈ 6,0 GiB) pada mesin
bertotal 7,98 GB, jadi `test:oxlint-plugin` gagal `RangeError: Array buffer
allocation failed` kira-kira separuh waktu — enam run berturut-turut memberi
tiga lulus, tiga gagal, dengan **nama rule yang berbeda hampir setiap kali**.
Rule yang rusak tidak berpindah nama; yang gagal alokasinya. Jalankan tahapnya
satu per satu di sini, dan percayai CI (16 GB) untuk tarikan penuhnya
(`TAHAP-93.md` §7.5).

**Terbuka sejak 23 September 2026 — flaky `/en/practice/consulting` di mobile
BELUM tertutup.** Tahap 91 dikirim dengan klaim bahwa ia tertutup; CI pada
`bfc172f` (run 35828423114) melaporkan **721 lulus / 1 flaky / 14 dilewati**,
angka yang identik dengan garis dasar Tahap 90, dan flaky-nya uji yang sama —
40,1 detik terhadap anggaran 30 detik. Bentuk kegagalannya berubah: ia tidak
lagi mati di `page.goto`, melainkan kehabisan anggaran sebelum sampai ke
asersinya, lalu asersi 5 detik berikutnya yang tercetak sebagai sebab
(`/en/practice/consulting declares no accent region`).

**Run bersih pertama sesudah empat run flaky: `f45d6d3`, 722 lulus / 14
dilewati / nol flaky.** Uji yang dulu flaky lulus di 22,5 detik — di bawah
anggaran 90 detik yang Tahap 94 turunkan dari kerjanya, bukan di bawah default
30 detik yang nyaris sama besar dengan biayanya. Itu cerita yang cocok dengan
kedua run: uji berbiaya 22–32 detik dengan anggaran 30 detik adalah flaky
menurut definisi. **Satu run bersih bukan penutupan**; butir ini tetap terbuka
sampai beberapa run berturut-turut bersih.

**Sebuah tahap ditarik sebelum ada kodenya, dan itu disengaja.**
`docs/stages/TAHAP-95.md` hendak melewatkan varian selebar desktop di proyek
`mobile` dengan alasan biaya piksel. CI menggugurkannya: varian yang gagal
justru yang **paling murah** di proyek itu (0,99 MP, 22–32 detik) sementara
varian 9,22 MP memakan 8,5–12,2 detik. Laptop ini memberi urutan terbalik.
Spec-nya ditinggalkan utuh dengan pengukuran yang membatalkannya.

**Pertanyaan terbuka yang tersisa, dan ia performa bukan flaky:** kenapa
`/en/practice/consulting` pada 390 px di proyek `mobile` memakan 22–32 detik
di CI sementara `/en` pada viewport dan proyek yang sama memakan 5,4 detik?
Tidak bisa dijawab dari laptop ini — di sini urutannya terbalik.

Tahap 93 memperbaiki satu aritmetika yang **pasti** salah di jalur itu —
`waitForEntrance` boleh menunggu 30 detik di dalam anggaran 30 detik, terukur
30 033 ms dengan tirai ditahan, kini 6 041 ms — tetapi **tidak** mengklaim itu
sebabnya. Butir ini ditutup hanya oleh beberapa run CI berturut-turut tanpa
flaky, bukan oleh satu perbaikan yang masuk akal.

## 6. Kredensial

**Tidak ada nilai rahasia di repo ini, dan tidak boleh ditambahkan.**

`.env.local` ter-gitignore dan hanya ada di mesin Anda. Kalau sebuah token
pernah masuk git history, `git rm` **tidak** menghapusnya — ia permanen sampai
history ditulis ulang dan token itu dicabut.

Aturan yang berlaku, dari `DEPLOYMENT.md` §1:

- **Jangan pernah** beri token prefix `NEXT_PUBLIC_` — prefix itu meng-inline
  nilainya ke bundel browser.
- Produksi memakai token **Viewer**, bukan yang write-capable.
- Nilai publik (`NEXT_PUBLIC_SANITY_PROJECT_ID`, `_DATASET`, `_API_VERSION`)
  memang publik dan sudah tercatat di `MENJALANKAN-LOKAL.md` §4.
