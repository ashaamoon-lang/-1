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
kerja baru   main                   ← mulai dari sini, di branch baru
fork         claude/arth-unbound    ← digabung ke claude/arth-design lewat PR #17
induk        claude/arth-design     ← digabung ke main lewat PR #16
```

**Fork ini dibawa ke `main` atas keputusan pemilik repo**: PR #17
(`claude/arth-unbound` → `claude/arth-design`), lalu PR #16
(`claude/arth-design` → `main`), keduanya dengan **merge commit** — bukan
squash, bukan rebase, karena `docs/FORK.md` merujuk hash commit-nya. Kedua
branch **tidak dihapus**; riwayatnya tetap bisa dibaca di sana. Pekerjaan baru
dimulai dari `main`, di branch baru, lewat PR ke `main`.

`docs/FORK.md` tetap dokumen pendirinya dan dibaca lebih dulu: aturan yang
membatasi ekspresi desain dilepas — anggaran, dial, kosakata gaya, ritual
skill, spec-sebelum-kode, gerbang selera e2e — dan yang melindungi pembaca
dipertahankan: axe, kontras terukur, reduced motion, keyboard, jalur tanpa JS,
kebocoran GPU, header/CSP, penjaga token, dan kejujuran. Prinsipnya: **ukur,
jangan veto.** Tidak ada lagi nomor tahap. §0.1 di sana menjawab apa yang
dicabut, apa yang dipertahankan, dan aset kurasi mana yang tidak disentuh.

**Satu hal tentang repo ini yang mudah terlewat:** default branch-nya di
GitHub **bukan** `main`, melainkan `claude/satus-award-website-foundation-r6o5cf`
(PR #9). Menggabungkan ke `main` tidak mengubahnya; mengganti default branch
adalah keputusan pemilik repo.

Dua track berjalan paralel di repo ini dan keduanya nyata.
`claude/satus-award-website-foundation-r6o5cf` (PR #9) membawa portabilitas
gerbang Windows dan penjaga token; ia sudah **digabungkan ke** branch di atas,
yang kini jadi tempat kerja berjalan. Yang lama tidak dihapus — PR-nya punya
riwayatnya sendiri.

**Commit dan nomor run CI sengaja tidak ditulis di sini.** Tanyakan, jangan
percaya dokumen:

```bash
git rev-parse --short origin/main
git log --oneline 22136de..origin/claude/arth-unbound   # apa yang fork lakukan
gh run list --branch main --limit 5
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
gh run list --branch main --limit 5  # angka CI yang mengikat
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
git checkout main && git pull
git checkout -b <branch-baru>   # pekerjaan baru: branch baru, PR ke main
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

**Kalau `bun run build` gagal berulang pada byte yang sama dengan
`Failed to parsed response body as JSON: Bad control character …`, periksa
`.next/cache/fetch-cache` sebelum menyalahkan Sanity.** Terjadi 29 September
2026: satu entri cache fetch tertulis rusak (base64 yang tergeser) di tengah
sebuah build, lalu setiap build berikutnya membacanya kembali dan gagal di
posisi 2471 — sementara setiap query aplikasi, langsung ke Sanity lewat
`@sanity/client`, lulus bersih. Temukan entrinya dengan men-decode tiap
`data.body` dan mencoba `JSON.parse`; hapus satu file itu saja (cache, dibuat
ulang). Penyebab tulisan rusaknya tidak diketahui. CI tidak terdampak: ia
membangun tanpa cache ini.

**Jebakan lingkungan lain di mesin ini**, masing-masing sudah memakan waktu
sekali:

- **Jangan `bun run build` selagi suite e2e berjalan**, dan bangun Storybook
  **sebelum** suite — `storybook-a11y` memerahkan katalog yang lebih tua dari
  komponennya.
- **Hentikan server lewat PID**, bukan pola nama:
  `Get-NetTCPConnection -LocalPort 3000 -State Listen` → `Stop-Process -Id`.
  **Jangan pernah** `pgrep -f` / `pkill -f`; sebuah sesi pernah menggantung
  101 menit pada satu pola.
- **Jangan `git stash` / `git stash pop` polos**: stack stash dipakai bersama
  beberapa worktree dan sesi lain. Sisihkan pekerjaan dengan commit WIP.
- **Skrip Playwright ad-hoc dijalankan dengan `node`, bukan `bun`** — di bawah
  bun ia menggantung sampai timeout. Di Git Bash, argumen seperti `/en` perlu
  `MSYS_NO_PATHCONV=1`. Skrip scratch di dalam repo dihapus sebelum commit.
- **Gerbang yang gagal di suite penuh belum tentu cacat.** Suite dua worker di
  laptop 8 GB menjatuhkan beberapa uji yang lulus saat dijalankan sendirian;
  yang lulus sendirian boleh disebut beban mesin, **yang lain tidak**. Tapi
  periksa dulu apakah kegagalannya berbagi satu sebab — di fork, lima gerbang
  merah sekaligus ternyata satu cacat desain (`FORK.md` §3.2, menu ponsel).

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

**Membuktikan gerbang merah, di CI.** `.github/workflows/red-proof.yml`
membangun app di sebuah commit lama, melapiskan spec terkini di atasnya,
menjalankannya tanpa retry, dan menilai hasilnya terhadap prediksi di
`e2e/red-proof/cases.json`; hasil pertamanya ada di `docs/FORK.md` §3.4. Untuk
membuktikan sebuah gerbang merah, tambahkan kasus ke `cases.json` di PR: ref
commit-nya, lalu untuk tiap tes harapannya, alasannya, dan pola error
pertamanya. Prediksi di-commit **sebelum** run pertama, dan workflow terpicu
oleh perubahan di `e2e/red-proof/**`. Ada dua batas. Spec yang dijalankan masih
tertulis di workflow (`e2e/phone-menu.e2e.ts`), jadi gerbang lain berarti
mengubah langkah itu juga. Dan `workflow_dispatch` hanya bisa dipakai bila
workflow ada di default branch, yang di repo ini bukan `main` (§1).

### 4.1 Pekerjaan desain yang terkirim di fork, dan yang berikutnya

Yang terkirim tercatat di `docs/FORK.md` §3.2 — satu entri per pekerjaan,
dengan angka terukurnya dan cacat yang ditemukan di jalan. Daftar pendek
workflow kritik desain (peringkat 1–5) sudah habis, ditambah menu ponsel
(usulan yang ditunda nomor 9).

**Ditunda, masing-masing dengan alasannya** — pilih dari sini, bukan dari
ingatan:

| butir                                                                                        | kenapa belum                                                                                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Morph sampul ke proyek berikutnya                                                            | **terkirim** di `claude/case-continuity` (`bdcc2d0`), CI hijau di run 37101359980; nama dipasang saat ditekan (`vault/blocks/next-project/link.tsx`), diuji dua arah di `e2e/next-project-morph.e2e.ts`. Menunggu keputusan merge (draft PR #23) |
| Overscan parallax 12% di `sizes` grid galeri, dan di `needed` pada `image-resolution.e2e.ts` | ada sebelum fork; memperbaikinya mengubah byte di setiap halaman proyek dan ambang sebuah gerbang (`FORK.md` §3.4)                                                                                                                               |
| Indeks "What we take on" di beranda                                                          | menulis ulang tiga spec e2e; tiga kata `h1` di bawah `h1` hero (kritik, ditolak no. 3)                                                                                                                                                           |
| Dok ponsel di halaman proyek                                                                 | lapisan tetap di atas konten ponsel (risiko WCAG 2.4.11) dan permukaan navigasi kedua (no. 8)                                                                                                                                                    |
| Material grid di hero                                                                        | perlu GPU nyata untuk dinilai; garis kanvas tak terlihat oleh `contrast-situ` (no. 13)                                                                                                                                                           |
| Tirai transisi halaman                                                                       | menambah hingga ~370 ms sebelum setiap navigasi — perlu pengukuran latensi dulu (no. 15)                                                                                                                                                         |
| Desain ulang 404                                                                             | rute ber-trafik terendah, bergantung pada butir hero di atas (no. 17)                                                                                                                                                                            |

Nomor-nomor di atas merujuk daftar `rejected` workflow kritik desain. Keluaran
workflow itu tidak ada di repo — tabel ini adalah catatannya.

### 4.2 Putaran pengembangan

Buku besar siklus "Work that has to hold up" (rencana yang disetujui pemilik
repo): satu fitur dan satu desain per putaran, dibangun di `claude/load-bearing`
tanpa CI. Setiap tiga putaran diperiksa sekali lewat draft PR permanen dari
`claude/load-bearing-ci`, yang tidak untuk di-merge. Status: `belum CI`,
`CI hijau (run …, tally)`, atau `diperbaiki (commit …)`. Kolom commit memuat
subjek commit sampai checkpoint menggantinya dengan hash.

| N   | rute              | fitur                                               | desain                   | `data-epic`            | commit    | status                                                        |
| --- | ----------------- | --------------------------------------------------- | ------------------------ | ---------------------- | --------- | ------------------------------------------------------------- |
| 1   | `/work`           | bingkai katalog (praktik × tahun)                   | `vault/motion/bearing`   | `catalogue-frame`      | `4926c63` | CI hijau (run 37046629768, 583 lulus · 29 dilewati · 0 gagal) |
| 2   | `/studio`         | ukuran karya (penugasan, klien, rentang tahun)      | `vault/motion/dimension` | `work-measure`         | `4c0067d` | CI hijau (run 37046629768, 583 lulus · 29 dilewati · 0 gagal) |
| 3   | `/journal/<slug>` | indeks karya praktik di bawah esai                  | `vault/motion/level`     | `entry-work`           | `0d65770` | CI hijau (run 37046629768, 583 lulus · 29 dilewati · 0 gagal) |
| 4   | `/practice/<v>`   | tulisan dari praktik ini (entri jurnal per praktik) | `vault/motion/formwork`  | `practice-writing`     | `2540c58` | CI hijau (run 37087828073, 586 lulus · 29 dilewati · 0 gagal) |
| 5   | `/work/<slug>`    | tulisan praktik terhadap tahun penugasan            | `vault/motion/datum`     | `engagement-writing`   | `dee912f` | CI hijau (run 37087828073, 586 lulus · 29 dilewati · 0 gagal) |
| 6   | `/`               | tulisan terbaru dari jurnal di beranda              | `vault/motion/fixings`   | `latest-writing`       | `7fdd0f3` | diperbaiki (commit 72c0646)                                   |
| 7   | `/journal`        | jurnal menurut praktik (tulisan dan karya)          | `vault/motion/tally`     | `practice-tally`       | `1905fac` | CI hijau (run 37099276094, 589 lulus · 29 dilewati · 0 gagal) |
| 8   | `/studio`         | bentuk penugasan (jadwal per karya)                 | `vault/motion/plumb`     | `engagement-shapes`    | `b9834eb` | diperbaiki (commit 70f0d8f)                                   |
| 9   | `/work/<slug>`    | penugasan sepraktik, yang ini ditandai              | `vault/motion/brace`     | `practice-engagements` | `cea5476` | CI hijau (run 37099276094, 589 lulus · 29 dilewati · 0 gagal) |

Checkpoint 1 (putaran 1–3): draft PR #22 dari `claude/load-bearing-ci` pada `0d65770`, run 37046629768. Job `ci` dan `e2e` hijau, 0 flaky. `interaction-grammar` mencatat ketiga momen baru di rutenya.

Checkpoint 2 (putaran 4–6): pada `7fdd0f3` merah di run 37086293717. Satu tes gagal dua kali, `e2e/interaction-grammar.e2e.ts:120` ("nav: the press did not reach the control"): lift reveal putaran 6 di beranda membawa tautan kecilnya keluar dari bawah pointer. Diperbaiki di `72c0646` (`--reveal-transform: none`, harapan tes tidak diubah), lalu hijau di run 37087828073: `ci` dan `e2e`, 586 lulus, 29 dilewati, 0 gagal, 0 flaky.

Checkpoint 3 (putaran 7–9): pada `cea5476` merah di run 37097776306. `e2e/route-sweep.e2e.ts:176` gagal di `/en/studio` dan `/id/studio` (desktop dan mobile): axe tidak bisa memutuskan `link-in-text-block`, karena tautan karya di jadwal putaran 8 sebaris dengan meta-nya di atas latar grain. `material-shape` dilaporkan flaky oleh CI, di luar batch, dan tidak diperbaiki. Diperbaiki di `70f0d8f` (nama dan meta menjadi item flex); pola yang sama di putaran 9 ikut dirapikan di `1012b58`, karena rute itu tidak disapu `route-sweep`. Harapan tes tidak diubah. Hijau di run 37099276094: `ci` dan `e2e`, 589 lulus, 29 dilewati, 0 gagal, 0 flaky; ketiga momen baru tercatat.

### 4.3 Putaran pengembangan — siklus 2

Siklus kedua dengan arah yang sama, dibangun di `claude/value-2` (dari
`claude/case-continuity`, `d27ef1c`) tanpa CI per putaran. Setiap tiga putaran
diperiksa sekali lewat draft PR permanen dari `claude/value-2-ci` (base
`claude/case-continuity`), yang tidak untuk di-merge. Status dan kolom commit
mengikuti §4.2.

| N   | rute              | fitur                                     | desain                     | `data-epic`        | commit    | status                                                        |
| --- | ----------------- | ----------------------------------------- | -------------------------- | ------------------ | --------- | ------------------------------------------------------------- |
| 1   | `/practice/<v>`   | ajakan penugasan per praktik              | `vault/blocks/title-block` | `practice-enquiry` | `8f7df92` | CI hijau (run 37106818554, 594 lulus · 29 dilewati · 0 gagal) |
| 2   | `/journal/<slug>` | balasan untuk esai (surel berkonteks)     | `vault/blocks/reply-slip`  | `entry-reply`      | `c053fb6` | CI hijau (run 37106818554, 594 lulus · 29 dilewati · 0 gagal) |
| 3   | `/work`           | kunci bingkai katalog (arti tiap praktik) | `vault/motion/splice`      | `catalogue-key`    | `3b19c90` | CI hijau (run 37106818554, 594 lulus · 29 dilewati · 0 gagal) |

Checkpoint 1 (putaran 1–3): draft PR #24 dari `claude/value-2-ci` pada `3b19c90`, run 37106818554. Job `ci` dan `e2e` hijau, 0 flaky. `interaction-grammar` mencatat ketiga momen baru di rutenya.

## 5. Utang yang dibawa — keputusan pemilik repo

| butir                                        | status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Merge fork ke `main`                         | **Diputuskan** oleh pemilik repo: PR #17 lalu PR #16, merge commit, branch tidak dihapus (§1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Kontradiksi provenance `vault/`              | **Selesai.** `vault/PROVENANCE-NOTE.md` dikoreksi sesuai fakta; `vault/magic/*` dan `docs/PROVENANCE.md` tidak disunting. Koreksinya juga menemukan salinan kedua yang tercatat benar di tempat lain: path ikon Phosphor (MIT) di `vault/primitives/icon` (`FORK.md` §1.4). Tiga header provenance yang hilang dan hitungan glyph ikon (delapan → tujuh) dibereskan sesudahnya (`claude/tidy-after-fork`)                                                                                                                                                                                                                                                                                                                                                              |
| Tiga token kontras                           | **Diukur**, palet tidak diubah (keputusan pemilik). `hero-wash-mid`: tinta 14,93:1 (terang) / 15,70:1 (gelap), teks muted 8,60 / 8,62 — lulus 4,5:1; teks muted di titik wash paling terang 7,76 / 7,90. `line`/`line-strong`: dikecualikan dari WCAG 1.4.11 per pemakaian, alasannya di `contrast.test.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Thumb scrollbar palette — **temuan terbuka** | Satu-satunya tempat `line`/`line-strong` menjadi satu-satunya visual sebuah kontrol, dan ia **gagal** 3:1: 1,97 / 2,15 di atas track, 2,07 / 2,01 di atas ground (model oklab gerbang; dicat sRGB 1,83–2,34 — kesimpulan sama). Tercatat sebagai lantai di `contrast-baseline.json`; memperbaikinya berarti mengubah palet atau warna thumb, dan itu keputusan pemilik                                                                                                                                                                                                                                                                                                                                                                                                 |
| Rotasi kredensial Sanity                     | **Tetap terbuka** (JEDA 4): **wajib sebelum domain publik**; produksi memakai token role Viewer. Terbuka karena belum ada domain publik. Dicatat sekali, jangan diungkit berulang                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Email kontak placeholder                     | **Tetap terbuka**, atas keputusan pemilik: `studio@arth.example`, berlabel placeholder di markup; `SITE.email` kosong supaya JSON-LD tidak menerbitkannya. Alamat nyata tidak dikarang                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Default branch GitHub                        | `claude/satus-award-website-foundation-r6o5cf`, bukan `main` — keputusan pemilik repo (§1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Pembuktian merah `phone-menu`                | **Sebagian besar lunas** lewat PR #19 (run red-proof 37001647550 dan 37005977774, 2 Oktober 2026). Merah karena perilaku di `67af568`: tanpa skrip, geometri, Escape, Tab-lewat, halaman diam. Merah karena instrumen: reduced motion, satu-task. Satu-task juga merah di `ec398eb`, di kedua separuhnya. **Tidak bisa dibuktikan terhadap commit:** ⌘K, desktop. **Terbuka:** Tab-masuk tetap _either_ di `67af568`; Tab-lewat _either_ di `ec398eb` (merah 1 dari 7, konsisten dengan race lama — disimpulkan dari kode). **Temuan, diketahui dan diperbaiki:** "halaman diam" memerah — juga di kode `main` — karena `overflow` dibaca sekali di dalam transisi `overflow` 1 ms dari Lenis `autoToggle`; cacat instrumen, kini di-_poll_. Rinciannya `FORK.md` §3.4 |
| PR #9                                        | **Merged otomatis oleh GitHub** saat PR #16 masuk `main` (1 Oktober 2026), karena seluruh commit-nya sudah termuat di sana; komentar ditambahkan di PR-nya                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Menyemai dataset Sanity                      | `bun --env-file .env.local lib/scripts/seed-fixtures.ts` — tulisan ke CMS Anda                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `/lab` + hosting                             | terblokir menunggu domain                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Mayor `three` 0.186, `@sanity/client` 8      | belum dinaikkan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Typeface berlisensi                          | biaya pemilik repo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

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
