# Tahap 93 — Tunggu yang sebesar anggarannya sendiri

> **Status: terkirim.** Spec ditulis lebih dulu sesuai `ROADMAP.md` §3.0;
> satu kriteria keluarnya dikoreksi sesudah diukur (§7.2).
>
> Tahap ini mengoreksi Tahap 91, yang saya kirim dengan klaim bahwa flaky CI
> itu tertutup. CI mengatakan tidak.

---

## 1. Pengukuran

### 1.1 Bacaan CI sesudah Tahap 91 dan 92

```
run 35828423114  (bfc172f)   ci ✓   e2e ✓
                 721 lulus · 1 flaky · 14 dilewati   (24,2 mnt)
```

Angkanya **identik** dengan garis dasar Tahap 90 — 721/1/14. Dan flaky-nya
adalah uji yang sama persis:

```
[mobile] › visual-substance.e2e.ts:187 › a declared accent carries tone
          › /en/practice/consulting at mobile      ✘ 40.1s → ✓ retry 5.7s
```

**Jadi Tahap 91 tidak menutupnya.** Itu dinyatakan lebih dulu, sebelum apa pun
yang lain di berkas ini.

### 1.2 Tetapi bentuk kegagalannya berubah, dan itu petunjuknya

```
Test timeout of 30000ms exceeded.
Error: /en/practice/consulting declares no accent region
expect(locator).toBeAttached() failed
  - ... with timeout 5000ms
  - waiting for locator('[data-accent-region]').first()
```

Sebelum Tahap 91 ia mati di dalam `page.goto` yang menunggu `load`. Sekarang ia
tidak lagi mati di sana — ia kehabisan anggaran **sebelum sampai** ke asersi
yang gagal itu, lalu asersi 5 detik itu yang tercetak sebagai sebab. Pesan yang
tercetak bukan pesan yang berguna.

### 1.3 Aritmetiknya, dan ia pasti

```
playwright.config.ts   tidak ada `timeout` tingkat atas
                       → setiap uji memakai default Playwright: 30 000 ms
playwright.config.ts:137  timeout: CI ? 300_000 : 120_000
                       → ini milik blok `webServer`, yakni batas menyalakan
                         server, BUKAN anggaran uji

e2e/page-settled.ts:22  const ENTRANCE_MS = 30_000
                       → satu tunggu yang boleh memakan SELURUH anggaran
```

Tirai masuknya sendiri berhenti jauh sebelum itu: `vault/motion/curtain`
beranimasi `var(--duration)` dengan penundaan `var(--duration) +
var(--duration-fast)`, dan catatan di `page-settled.ts` sudah menuliskan
plafonnya **1200 ms**. Jadi 30 000 ms bukan margin — ia angka yang tidak
pernah dihitung terhadap anggaran yang melingkupinya.

### 1.4 Dan saya sudah menangkap kesalahan ini sekali, di tahap yang sama

`TAHAP-91.md` §1.4 dan `e2e/webgl-intent.ts` mencatatnya dengan kata-kata saya
sendiri: sebuah tunggu 30 detik di dalam anggaran 30 detik membuat timeout uji
menyala lebih dulu, sehingga pesan yang berguna tidak pernah tercetak. Di sana
saya memperbaikinya dengan `WEBGL_TEST_BUDGET_MS`. Lalu di berkas **baru** pada
tahap yang sama saya menulis ulang cacat yang persis sama.

Itu bukan kebetulan yang layak dilewatkan: aturannya ada, tertulis, dan tetap
tidak saya terapkan pada berkas kedua karena berkas kedua terasa sepele.

---

## 2. Rancangan

| #   | tindakan                                                                                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `ENTRANCE_MS` diturunkan ke sebuah angka yang **diturunkan dari tirainya**, bukan dari perasaan: plafon 1200 ms × margin, jauh di bawah anggaran 30 detik |
| 2   | Alasannya ditulis di tempat, menyebut anggaran yang melingkupinya — supaya tunggu berikutnya yang ditambahkan orang lain punya pembanding                 |
| 3   | `TAHAP-91.md` dikoreksi: klaim "flaky ini tertutup" diganti dengan bacaan CI-nya                                                                          |
| 4   | `HANDOFF.md` mencatat butir ini **terbuka sejak 23 September 2026**, dengan bacaan CI-nya                                                                 |

**Yang sengaja TIDAK dilakukan: menaikkan anggaran uji.** `material-layer.e2e.ts`
sudah menuliskan alasannya untuk kasus lain — _"Raising the budget again would
only move the number the next slow runner has to beat."_ Menaikkan 30 detik ke
60 detik akan membuat flaky ini hilang dari log tanpa ada satu pun sebab yang
dipahami.

---

## 3. Daftar berkas

| berkas                                                | perubahan                                                 |
| ----------------------------------------------------- | --------------------------------------------------------- |
| `e2e/page-settled.ts`                                 | plafon tunggu diturunkan dari tirainya, alasannya ditulis |
| `docs/stages/TAHAP-91.md`                             | klaim yang gugur dikoreksi di tempat                      |
| `docs/stages/TAHAP-93.md`, `ROADMAP.md`, `HANDOFF.md` | berkas ini, posisi, dan utang terbuka                     |

---

## 4. Kriteria keluar

1. **Merah lebih dulu, atas mekanismenya.** Dengan tirai ditahan tetap
   terlihat, gerbang lama harus mati dengan pesan yang salah (`declares no
accent region`); gerbang baru harus mati atau lulus dengan pesan yang benar,
   di bawah anggaran.
2. `bun run check` hijau.
3. `visual-substance` hijau di kedua proyek, di laptop ini. **— kriteria ini
   keliru; lihat §7.2.**
4. **Tidak ada klaim bahwa flaky CI tertutup.** Ia hanya bisa dinyatakan
   tertutup oleh beberapa run CI berturut-turut, dan itu milik tahap sesudah
   ini.

---

## 5. Risiko

| #   | risiko                                                                                             | penangkal                                                                                                                              |
| --- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Plafon baru terlalu ketat di runner lambat, sehingga tirai yang sah dianggap selesai terlalu cepat | `waitForEntrance` memang tidak pernah melempar; ia hanya berhenti menunggu. Gerbang tirai yang sebenarnya adalah `e2e/entrance.e2e.ts` |
| R2  | Sebab 40,1 detik itu ternyata bukan tunggu tirainya                                                | Sangat mungkin, dan tidak diklaim. Yang diperbaiki adalah aritmetika yang **pasti** salah; sisanya dinyatakan terbuka                  |

---

## 6. Yang tidak dikerjakan, dinyatakan eksplisit

- **Flaky CI tidak diklaim tertutup** — §4 butir 4.
- **Anggaran uji tidak dinaikkan** — §2.
- **Nol angka performa diklaim** — `CLAUDE.md` #19.

---

## 7. Hasil

### 7.1 Merah lalu hijau, atas mekanismenya

Tirai dipaku tetap terlihat lewat `addInitScript`, lalu `waitForEntrance`
diukur:

```
sebelum   waitForEntrance = 30 033 ms      seluruh anggaran uji
sesudah   waitForEntrance =  6 041 ms      plafon diturunkan dari tirainya
```

> **Dikoreksi di Tahap 94 — plafon 6000 ms itu terlalu ketat, dan
> derivasinya salah.** Ia dihitung dari token (`400 + 200 + 400 = 1000 ms`),
> padahal animasi tirai baru mulai sesudah halaman melukis. Diukur di profil
> `mobile` yang sebenarnya: **1979 / 1987 / 2561 / 3061 ms**. Jadi 6000 hanya
> ± 2× nilai senggang, dan karena `waitForEntrance` tidak pernah melempar,
> runner sibuk akan membuatnya menyerah diam-diam lalu memotret tirai.
> `TAHAP-94.md` §1.3.

Itu yang tahap ini benar-benar perbaiki, dan hanya itu.

### 7.2 Kriteria §4.3 keliru, dan pengukurannya yang menunjukkannya

Kriteria itu menuntut `visual-substance` hijau di kedua proyek **di laptop
ini**. Dijalankan, proyek `mobile` dengan dua worker memberi dua merah:

```
accent  /en/practice/consulting   Test timeout of 30000ms exceeded
footer  /en/work/arus-balik       Test timeout of 120000ms exceeded
                                  page.evaluate menggantung di webgl-intent.ts:63
```

Yang kedua itu yang menjawab. `webglIntent` hanya membaca lebar jendela dan
menanyakan WebGL2 — sebuah `page.evaluate` yang di mesin senggang selesai
dalam milidetik. Ia menggantung melewati **120 detik**. Itu bukan bentuk
gerbang yang salah.

Keduanya sendirian, `--workers=1`, terhadap server yang sama:

```
accent  6,1 s   lulus
footer  40,4 s  lulus   (anggaran 120 s)
```

Jadi laptop ini — 4 core, 0,6 GB bebas — pada proyek `mobile` dengan dua
worker **bukan alat ukur yang sah untuk berkas ini**, dan kriteria yang
menuntut hijau di sana menuntut sesuatu yang tidak bisa dijawab instrumen ini.
`HANDOFF.md` sudah menuliskan bentuk umum aturan itu: _"Angka gerbang milik
mesin yang menjalankannya... bandingkan ke log CI run yang sama."_ Saya
menuliskan kriteria yang melanggarnya.

Yang menggantikannya: **kedua uji lulus saat diisolasi di laptop ini**, dan
angka yang mengikat adalah tally CI.

### 7.3 Yang tidak tertutup, dinyatakan lagi

Perbaikan §7.1 **tidak** mencegah kegagalan accent di bawah dua worker —
terukur, ia tetap melewati 30 detik dengan `ENTRANCE_MS` sudah 6 000. Jadi
tunggu tirai itu bukan sebab tunggalnya, dan mungkin bukan sebabnya sama
sekali. Sisa anggarannya habis di tempat lain, dan tempat itu belum diukur.

Butir ini tetap terbuka di `HANDOFF.md`, bertanggal 23 September 2026.

### 7.4 Gerbang

```
bun test                 597 lulus, 0 gagal
oxlint / lint:types      bersih
tsc --noEmit             bersih
manifest:check           COMPONENTS.md mutakhir
check:assets             semua aset dalam anggaran
test:oxlint-plugin       12 rule test lulus — pada run yang alokasinya berhasil, §7.5
visual-substance         sendirian: accent 6,1 s lulus · footer 40,4 s lulus
```

### 7.5 Dan satu penjelasan saya yang terlalu malas, dikoreksi dengan angkanya

`TAHAP-92.md` §7.6 menyebut kegagalan `test:oxlint-plugin` sebagai "plafon
memori laptop ini". Itu arah yang benar dengan sebab yang kabur, dan ia
menyiratkan beban paralel. Dibaca dari `node_modules/oxlint/dist`:

```
BLOCK_SIZE         = 2 147 483 632
BLOCK_ALIGN        = 4 294 967 296
ARRAY_BUFFER_SIZE  = BLOCK_SIZE + BLOCK_ALIGN = 6 442 450 928 byte ≈ 6,0 GiB
```

RuleTester plugin JS oxlint meminta **satu ArrayBuffer ≈ 6 GiB** di mesin
bertotal 7,98 GB. Jadi ia tidak bergantung pada berapa banyak yang sedang
berjalan, melainkan pada apakah satu reservasi sebesar itu kebetulan muat.

Buktinya ada di nama yang gagal: enam run berturut-turut hari ini memberi tiga
lulus dan tiga gagal, dan rule yang disebut **berbeda hampir setiap kali** —
`no-reflect-apply`, `no-unknown-type-aliases`,
`require-safety-comment-for-type-assertion`, `no-conditional-empty-object-spread`.
Rule yang rusak tidak berpindah nama. Yang gagal adalah alokasinya, dan rule
yang tercetak hanyalah yang kebetulan sedang berjalan.

Konsekuensinya jujur: **`bun run check` satu tarikan tidak akan pernah andal di
laptop ini**, dan itu bukan sinyal tentang repo. CI dengan 16 GB menjalankannya
tanpa masalah — run `bfc172f` hijau.
