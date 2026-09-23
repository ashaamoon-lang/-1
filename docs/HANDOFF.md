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
branch    claude/arth-design
PR        #16, base `main`
```

Dua track berjalan paralel di repo ini dan keduanya nyata.
`claude/satus-award-website-foundation-r6o5cf` (PR #9) membawa portabilitas
gerbang Windows dan penjaga token; ia sudah **digabungkan ke** branch di atas,
yang kini jadi tempat kerja berjalan. Yang lama tidak dihapus — PR-nya punya
riwayatnya sendiri.

**Commit dan nomor run CI sengaja tidak ditulis di sini.** Tanyakan, jangan
percaya dokumen:

```bash
git rev-parse --short HEAD
gh pr view 16 --json headRefOid,state,mergeStateStatus
gh run list --branch claude/arth-design --limit 5
```

> **Kenapa dihapus, bukan diperbarui.** Blok ini pernah berbunyi `af1f499` /
> `CI run 62` sementara posisi sebenarnya `9ee7922` / run 63, dan itu **bukan
> kelalaian — itu struktural**: sebuah dokumen yang menuliskan hash commit-nya
> sendiri ditulis _sebelum_ commit itu ada, jadi ia salah pada saat lahir dan
> akan salah lagi setiap kali. Fakta yang tidak bisa benar saat ditulis tidak
> ditulis; yang ditulis adalah perintah yang menjawabnya.
>
> Bandingkan dengan dua dokumen di repo ini yang **memverifikasi dirinya
> sendiri** — blok `rule-coverage` di `CLAUDE.md` dan blok design-debt di
> `DESIGN-SYSTEM.md` §7 — keduanya di-generate dan diuji agar tidak hanyut.
> Nomor tahap di bawah kini ikut dijaga begitu, oleh
> `lib/scripts/stage-position.test.ts`.

Gerbang, sebagaimana terukur di CI (Linux, 4 vCPU / 16 GB):

| gerbang                   | hasil                                         |
| ------------------------- | --------------------------------------------- |
| `bun run check`           | **565 lulus / 0 gagal**, 55 berkas            |
| `bun run test:e2e`        | **713 lulus / 0 gagal**, 2 flaky, 15 dilewati |
| `bun run build`           | hijau                                         |
| `bun run build-storybook` | hijau                                         |

`check` naik 554 → 565 karena sebelas uji baru, bukan karena uji lama berubah.
`test:e2e` bergerak 716/0/14 → 713/2/15 pada **total yang sama, 730** — tiga uji
pindah kolom, semuanya gerbang kanvas WebGL, dan semuanya balapan yang §5.1
uraikan. Nol kegagalan di keduanya.

**Angka gerbang milik mesin yang menjalankannya.** Diukur di laptop Windows
4-core / 7,79 GB, suite e2e memakan **41,4 menit** melawan **18,5 menit** di
CI, dan delapan uji jatuh pada `Test timeout of 30000ms` tanpa satu pun cacat
halaman. Sebelum menyimpulkan regresi dari angka yang berbeda, bandingkan ke
log CI run yang sama — bukan ke tabel ini.

Tahap terakhir yang dikerjakan: **94**. Entri per tahap ada di `ROADMAP.md`,
spec-nya di `docs/stages/`.

Diukur di laptop itu pada **19 September 2026**, di worktree `arth-design`:
`check` **579 lulus / 0 gagal**, e2e **714 lulus / 7 gagal / 14 dilewati**
dalam 29,4 menit. Ketujuhnya dibongkar di `docs/stages/TAHAP-81.md` §7.2 —
empat lulus di isolasi, dua adalah pasangan yang §5.1 di bawah sudah namai,
satu gagal 1 dari 2. **Nol berasal dari tahap itu**, dan CI membuktikannya:
run 35439317243 melaporkan **722 lulus / 1 flaky / 14 dilewati** dari 737 tes
dalam 22,4 menit. Ketujuh merah lokal lulus di sana, dilewatinya identik, dan
satu-satunya flaky adalah utang §5.1 di bawah.

Suite itu dijalankan **tanpa `CI=1`**, terhadap server produksi yang dibangun
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
git checkout claude/arth-design
bun install
# buat .env.local — lihat MENJALANKAN-LOKAL.md §4
bun run check        # harus 579 lulus
bun dev
```

## 3. Cara kerja yang berlaku

Bukan aturan teknis — itu ada di `CLAUDE.md` dan `AGENTS.md`. Ini **cara
menjalankan pekerjaannya**, diminta pemilik repo dan masih berlaku:

| aturan                               | maksudnya                                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **Satu tahap penuh, sampai tuntas**  | Spec dulu (`ROADMAP.md` §3.0), lalu kode, lalu **semua** gerbang, lalu commit dan push                     |
| **Jangan menunggu persetujuan**      | Lanjut ke tahap berikutnya sendiri. Berhenti hanya kalau ada keputusan yang benar-benar milik pemilik repo |
| **Nol konten karangan**              | Tidak ada nama klien, entri, atau angka yang tidak berasal dari sumber yang sudah ada                      |
| **Katakan yang gagal atau dilewati** | `CLAUDE.md` #21. Mempersempit ruang lingkup diam-diam lebih buruk daripada gagal terbuka                   |
| **Kerjakan sendiri**                 | Pemilik repo meminta pekerjaan dilakukan agen utama, bukan didelegasikan ke sub-agen                       |

### 3.1 Dua aturan yang tahap-tahap terakhir bayar mahal untuk pelajari

**Periksa angka pertama dari alat baru terhadap sumbernya, sebelum ia
membenarkan satu baris kode pun.** Aturan ini menahan lima kesalahan instrumen
di Tahap 76–78 saja: probe terkontaminasi, grep yang kurang hitung, dua positif
palsu, dan satu klaim "duplikasi" yang nyaris menghapus cakupan nyata.

**Buktikan gerbangnya merah dulu.** Gerbang yang tidak pernah dilihat gagal
adalah gerbang yang belum diketahui bisa gagal. Kalau ia hijau di hari pertama,
**katakan begitu** alih-alih membingkainya sebagai cacat yang ditemukan.

## 4. Yang berikutnya: Tahap 79, sudah diukur

Diukur di sesi terakhir, **belum pernah ditulis jadi spec**. Ini datanya supaya
tidak perlu diukur ulang.

`DIREKSI.md` §2.2 menaikkan plafon momen berkoreografi 3 → 12 di rute merek pada
Tahap 60. Delapan belas tahap kemudian, kapasitas itu sebagian besar **belum
dibelanjakan**:

```
rute                                  terpakai  plafon  sisa
/en                                        6       12      6
/en/work                                   7       12      5
/en/work/arus-balik                        1        6      5
/en/practice/consulting                    5       12      7
/en/studio                                 5       12      7
/en/journal                                4        6      2
/en/journal/scope-is-the-deliverable       1        3      2
TOTAL                                     29       63     34   (46%)
```

**Angka mentah itu menyanjung.** Ia menghitung **elemen**, bukan momen —
`work-transport` muncul 4× di `/en` dan 6× di `/work` karena menandai tiap
kartu. Dihitung sebagai **nama momen yang berbeda**:

```
/en 3   /work 2   /work/<slug> 1   /practice 4   /studio 3   /journal 2   /journal/<slug> 1
```

**Dua belas momen berbeda di seluruh situs, terhadap plafon berjumlah 63.**
`/work/<slug>` — halaman yang dipakai agency untuk menunjukkan karyanya —
membawa **satu**.

### 4.1 Jebakan yang harus dihindari di Tahap 79

`DIREKSI.md` §2.1 sudah memperingatkan bentuk kesalahannya: _"hero lebih tinggi
dengan isi yang sama bukan lebih memukau, melainkan lebih kosong"_. Logika yang
sama berlaku untuk momen — **menambah momen demi membelanjakan anggaran adalah
alasan yang salah.**

§2.3 menyebut idiom yang benar: **informasi yang berubah bentuk** — kapabilitas
sebagai sekuens ter-pin alih-alih daftar, angka yang membangun dirinya, prose
yang terungkap mengikuti gulir. Bukan "lebih banyak efek".

Kandidat paling kuat: `/work/<slug>` — belanja terendah, bobot komersial
tertinggi, dan mesin pinned-run dari Tahap 64 sudah ada di galerinya.

## 5. Utang yang dibawa — keputusan pemilik repo

| butir                                   | status                                                                                                    |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Menyemai dataset Sanity                 | `bun --env-file .env.local lib/scripts/seed-fixtures.ts` — tulisan ke CMS Anda                            |
| Rotasi kredensial Sanity                | **ditunda atas permintaan pemilik repo.** Tetap jadi butir checklist pra-luncur; jangan diungkit berulang |
| `/lab` + hosting                        | terblokir menunggu domain                                                                                 |
| Merge PR #9                             | keputusan pemilik repo                                                                                    |
| Mayor `three` 0.186, `@sanity/client` 8 | belum dinaikkan                                                                                           |
| `epic-sequence` untuk halaman run       | tidak bisa diverifikasi tanpa data ter-semai                                                              |
| Plafon aturan #3 (band durasi)          | tidak ditegakkan — lihat `lib/scripts/rule-coverage.ts`, tercatat ber-alasan                              |
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
