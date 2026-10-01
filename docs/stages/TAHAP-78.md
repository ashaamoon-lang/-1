# Tahap 78 — Konstitusi yang tidak bisa gagal

> `CLAUDE.md` membuka aturan kerasnya dengan: _"These are not preferences.
> Violating one is a defect."_ Ada **21**. Aturan **#1** — yang pertama —
> berlaku di **satu dari enam pohon sumber**, dan saya membuktikannya dengan
> menaruh pelanggaran di komponen yang tayang lalu menjalankan seluruh
> `bun run check`. **Exit 0.**

## 1. Yang diukur, sebelum satu baris kode

### 1.1 Aturan #1, dibuktikan buta

`CLAUDE.md` #1: _"Never write a raw `cubic-bezier()` in a component. Use an
`--ease-*` token."_

Probe: satu token easing ditukar jadi bezier mentah di komponen yang tayang,
**tanpa mengubah apa pun yang lain**.

```css
/* vault/primitives/cursor/cursor.module.css:49 */
-  scale var(--duration-fast) var(--ease-out-quart),
+  scale var(--duration-fast) cubic-bezier(0.25, 0.1, 0.25, 1),
```

```
bun test lib/styles/scripts/   60 lulus, 0 gagal
bun run check                  534 lulus, 0 gagal, exit 0
```

Satu-satunya yang menegakkan #1 adalah `vendor-rules.test.ts`, dan glob-nya:

```js
const VENDOR_GLOBS = ['vault/magic/**/*.ts', 'vault/magic/**/*.tsx']
const VENDOR_STYLE_GLOB = 'vault/magic/**/*.css'
```

Ukuran paparannya:

```
stylesheet yang ditulis tangan   65
tercakup vendor-rules             4   (vault/magic)
DI LUAR jangkauan aturan #1      61
```

`motion-rules.test.ts` menyapu seluruh repo dan menegakkan #2, #4, #8 dan
reduced-motion — **tapi tidak pernah menyebut `cubic-bezier`.**

### 1.2 Probe pertama saya salah, dan itu ditulis di sini

Probe pertama **memang** merah — tapi karena aturan yang salah. Saya menambahkan
blok baru yang membawa durasi literal `400ms` dan tanpa penjaga reduced-motion,
jadi yang menyala adalah #8 dan #5:

```
(fail) motion rules (CLAUDE.md #1-#4, #8) > #8: durations come from tokens
(fail) the reduced-motion contract reaches every stylesheet
```

Bezier-nya sendiri lolos, tertutup dua kegagalan lain. Aturan Tahap 70–72
dipakai lagi — periksa angka pertama terhadap sumbernya — dan probe-nya ditulis
ulang supaya **hanya satu variabel** yang berubah. Baru itu buktinya berdiri.

### 1.3 Dua kesalahan instrumen lain, sebelum peta ini boleh dipercaya

| instrumen                                    | salahnya                                                                                                                                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| grep `#N` untuk menemukan aturan yang dijaga | **Kurang hitung.** #5 dijaga `motion-rules` ("every stylesheet that animates also stands down") dan #12 oleh `scale-rules` ("no grid track is a bare 1fr") — keduanya **tanpa menyebut nomornya** |
| grep `kill()`/`revert()` untuk #7            | **Dua positif palsu.** "Tidak ada cleanup" di `work/[slug]/page.tsx` dan `components/effects/gsap.tsx` ternyata prosa di dalam komentar, bukan pembuatan ScrollTrigger                            |

Keduanya ketahuan karena berkasnya dibaca, bukan karena grep-nya diulang.

### 1.4 Peta lengkap, 21 aturan

```
#1   cubic-bezier mentah          vendor-rules — HANYA vault/magic      <- buta di 61 stylesheet
#2   bare ease                    motion-rules #2, seluruh repo
#3   default 300ms                motion-rules #8 (token); band 150-250/300-600/800-1200: TIDAK
#4   transform & opacity saja     motion-rules #4
#5   prefers-reduced-motion       motion-rules "stands down" — tanpa menyebut nomor
#6   satu RAF loop                taste-rules
#7   selalu cleanup               TIDAK ADA
#8   nol nilai hardcoded          motion-rules #8, token-rules, scale-rules
#9   token semantik, bukan literal TIDAK ADA — token-rules hanya menolak hex mentah
#10  oklch()                      token-rules, vendor-rules
#11  jangan bungkam contrast.test TIDAK ADA
#12  minmax(0, 1fr)               scale-rules — tanpa menyebut nomor
#13  3D di balik feature flag     webgl-budget
#14  jalur non-WebGL              webgl-budget
#15  dispose GPU                  material-layer (runtime, satu jalur)
#16  tanpa LICENSE jangan salin   vendor-rules (provenance)
#17  header provenance vault/     vendor-rules #17
#18  verifikasi lisensi           proses, bukan kode
#19  nol angka performa tanpa profiler  TIDAK BISA DIMEKANISKAN
#20  nol klaim a11y tanpa axe           TIDAK BISA DIMEKANISKAN
#21  katakan yang dilewati              TIDAK BISA DIMEKANISKAN
```

**Kepatuhan hari ini 100% untuk #1, #7 dan #9** — diukur, bukan diasumsikan.
Yang hilang gerbangnya, bukan disiplinnya.

## 2. Yang dikerjakan

### 78a — aturan #1 berlaku di mana ia mengaku berlaku

`motion-rules` — yang sudah menyapu 65 stylesheet — mendapat pemeriksaan
`cubic-bezier`, di samping #2/#4/#8 yang sudah ia pegang.

**Dan `vendor-rules` TETAP memegang salinannya.** Draf pertama catatan ini
menulis bahwa salinan itu dihapus karena "duplikasi"; **itu salah**, dan
ketahuan saat berkasnya dibaca sebelum dihapus. Keduanya menutupi permukaan
berbeda dan tidak ada yang memuat yang lain:

```
motion-rules   deklarasi transition/animation   di 65 stylesheet seluruh repo
vendor-rules   setiap baris sumber vault/magic  TERMASUK TypeScript
```

Sebuah kurva bisa bersembunyi di string TypeScript yang tidak pernah sampai ke
stylesheet. Menghapus salah satunya membuka lubang.

**Dialek kedua, yang juga tidak terjaga.** Situs ini menganimasi dalam dua
bahasa, dan `vault/motion/tokens.ts` mengatakannya sendiri: _"GSAP speaks named
eases like `power3.out`"_. Tween yang ditulis di TypeScript tidak pernah sampai
ke CSS, jadi seluruh pemeriksaan di atas buta terhadapnya. Diukur dulu:

```
string ease GSAP mentah di luar lapisan token     0
ter-token (easing.*.gsap)                         3
ease: 'none'                                     10   linear, untuk scrub
```

Gerbangnya ditambahkan, dan `'none'` diizinkan berikut alasannya: ScrollTrigger
yang di-scrub **harus** linear — posisi gulir itulah easing-nya, dan
melengkungkannya dua kali justru cacatnya.

### 78b — #9 dan #11 dapat instrumennya

`#9`: nol `var(--color-ink)` / `var(--color-paper)` di luar lapisan token —
cermin dari "no raw hex" yang `token-rules` sudah punya. `#11`: `contrast.test.ts`
tidak boleh punya uji yang di-skip, dan tiap entri baseline wajib membawa
alasannya.

Keduanya **hijau di hari pertama**, dan itu dikatakan apa adanya: nilainya bukan
menemukan cacat hari ini, melainkan bahwa besok ia bisa gagal.

### 78c — petanya jadi data, dan tidak boleh bolong

Preseden `STACK_EXEMPT` (Tahap 77), `STORY_EXEMPT` (73), `VOID_EXEMPT` (74):
tiap aturan diklasifikasikan — instrumen apa yang menjaganya, atau kenapa ia
tidak bisa dimekaniskan. Aturan tanpa keduanya **memerahkan gerbang**. Aturan
ke-22 yang ditambahkan besok tidak bisa menyelinap tanpa keputusan.

### 78d — dokumen

Tabel §1.4 jadi blok ter-generate di `CLAUDE.md` dengan uji yang menuntut isinya
sama dengan datanya — pola `design-debt.ts` Tahap 73, yang ada justru karena §7
salah selama dua puluh enam tahap.

## 3. Yang **tidak** dikerjakan

| butir                                  | kenapa tidak                                                                                                    |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Memekaniskan #19–#21                   | Ketiganya mengatur **perilaku saya**, bukan kode. Gerbang yang mengaku mengukurnya akan berbohong               |
| Menegakkan band durasi #3              | "150–250 / 300–600 / 800–1200" perlu tahu maksud tiap animasi. Dicatat sebagai celah ber-alasan, bukan ditambal |
| Mengubah satu piksel                   | Nol. Kepatuhan sudah 100%; yang ditambah kemampuan gagal                                                        |
| Menyentuh token, palet, atau komposisi | Nol                                                                                                             |

## 4. Gerbang

| gerbang                           | menuntut                                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| **baru** `motion-rules` #1 (CSS)  | nol `cubic-bezier()` mentah di deklarasi transition/animation, 65 stylesheet                        |
| **baru** `motion-rules` #1 (GSAP) | tween mengambil easing dari `easing.*.gsap`; `vault/motion/tokens.ts` dikecualikan **sebagai data** |
| **baru** `token-rules` #9         | nol `var(--color-ink)` / `var(--color-paper)` di komponen                                           |
| **baru** `token-rules` #11        | `contrast.test.ts` tidak punya uji yang di-`skip`/`only`/`todo`                                     |
| **baru** `rule-coverage.test.ts`  | tiap aturan yang `CLAUDE.md` sebut terklasifikasi, dan tiap entri masih punya aturannya             |
| `vendor-rules`                    | **tidak berubah** — permukaannya berbeda (§2 78a)                                                   |
| sisanya                           | tidak berubah — nol piksel bergerak                                                                 |

### 4.1 Dibuktikan merah lebih dulu, empat kali

Tiap gerbang baru diberi pelanggarannya sendiri, lalu dikembalikan:

```
#1 CSS    vault/primitives/cursor/cursor.module.css:49
          var(--ease-out-quart) -> cubic-bezier(0.25, 0.1, 0.25, 1)
          SEBELUM 78a: bun run check exit 0, 534 lulus   <- buktinya
          SESUDAH:    (fail) #1: no raw cubic-bezier()

#1 GSAP   vault/primitives/magnetic/index.tsx:93
          easing.outQuart.gsap -> 'power3.out'
          (fail) #1: tweens take their easing from easing.*.gsap

#9        vault/blocks/hero/hero.module.css  color: var(--color-ink)
          (fail) #9: components reach for semantic tokens

#11       contrast.test.ts  describe( -> describe.skip(
          (fail) #11: the contrast gate is not skipped, only baselined
```

Probe pertama untuk #1 **terkontaminasi** dan itu dicatat di §1.2: ia membawa
durasi literal, jadi yang menyala #8 dan #5, bukan #1. Ditulis ulang supaya
hanya satu variabel berubah.

## 5. Hasil

```
aturan dengan gerbang yang bisa gagal    12  ->  16
tanpa gerbang                             9  ->   5   (#7, #18, #19, #20, #21)
terjaga sebagian, dinyatakan              0  ->   3   (#3, #11, #15)
stylesheet dalam jangkauan aturan #1      4  ->  65
unit                                    534  -> 554 lulus, 0 gagal
```

### 5.1 Yang jujur dikatakan

- **Nol piksel bergerak.** Tidak ada komponen, token, atau komposisi disentuh.
- **Tiga gerbang baru hijau di hari pertama** (#1 GSAP, #9, #11) — kepatuhannya
  sudah 100% sebelum ditulis. Nilainya bukan cacat yang ditemukan hari ini.
  Yang **memang** menemukan cacat nyata adalah #1 CSS: 61 dari 65 stylesheet
  berada di luar jangkauan aturan pertama konstitusi ini.
- **Lima aturan tetap tanpa gerbang, dan itu bukan kelalaian.** #19–#21
  mengatur apa yang **saya** tulis, bukan apa yang pohon ini muat; gerbang yang
  mengaku mengukurnya akan jadi klaim tak terukur, persis yang #19 larang.
  #18 menuntut sebuah **tindakan** (membaca `LICENSE` sumbernya). #7 bisa
  digerbangi dan sengaja tidak — `useGSAP` sudah membalikkan semuanya, dan
  gerbang yang cuma mengulang itu menambah berkas tanpa menambah keamanan.
  Kelimanya tercatat di data, jadi tahap berikutnya menimbangnya dengan mata
  terbuka, bukan menemukannya lagi.
- Tiga kesalahan instrumen saya sendiri dicatat di §1.2–§1.3 dan di 78a:
  probe terkontaminasi, grep `#N` yang kurang hitung, dan klaim "duplikasi"
  yang salah.
