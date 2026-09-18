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
branch    claude/satus-award-website-foundation-r6o5cf
commit    9ee7922
CI        run 63 — job `ci` dan `e2e` keduanya hijau
PR        #9, mergeable_state clean, base `main`
```

> **Dikoreksi saat serah-terima ke terminal lokal.** Blok ini dulu berbunyi
> `af1f499` dan `CI run 62`, karena ia ditulis sebelum commit-nya sendiri ada —
> dokumen yang menyebut posisi selalu punya masalah ini. Angka di atas
> diverifikasi ke GitHub API, bukan diingat: `gh pr view 9` mengembalikan
> `headRefOid 9ee7922…` dengan `mergeStateStatus CLEAN`, dan
> `gh run view 35045507292` mengembalikan run **63** dengan job `ci` dan `e2e`
> keduanya `success`.

Terverifikasi di commit itu:

| gerbang                   | hasil                                |
| ------------------------- | ------------------------------------ |
| `bun run check`           | **554 lulus / 0 gagal**              |
| `bun run test:e2e`        | **716 lulus / 0 gagal**, 14 dilewati |
| `bun run build`           | hijau                                |
| `bun run build-storybook` | hijau                                |

Tahap terakhir yang dikerjakan: **78**. Entri per tahap ada di `ROADMAP.md`,
spec-nya di `docs/stages/`.

## 2. Menyalakannya kembali

`docs/MENJALANKAN-LOKAL.md` §4 memandu `.env.local` langkah demi langkah,
termasuk tiga nilai publiknya. **Nilai rahasia tidak ada di repo ini dan tidak
boleh masuk** — ambil dari dashboard Sanity.

```bash
git checkout claude/satus-award-website-foundation-r6o5cf
bun install
# buat .env.local — lihat MENJALANKAN-LOKAL.md §4
bun run check        # harus 554 lulus
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
