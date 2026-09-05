# Tahap 41 — `journal-transport`

> Rencana: Bagian II, Tahap 41. Dial yang dibelanjakan: **MOTION**.
> Prasyarat: Tahap 40 selesai — `9955283`.

---

## 1. Cacat

`/work` → `/work/<slug>` punya morph kelas atas, diuji ujung ke ujung sejak
Tahap 11d dan diperbaiki lagi di 15b. `/journal` → `/journal/<slug>` **tidak
punya apa-apa**: menekan sebuah judul memicu overlay rute, layar tertutup, dan
halaman lain muncul. Dua permukaan baca di situs yang sama, satu diperlakukan
sebagai peristiwa dan satu sebagai muat ulang.

Mesinnya sudah ada dan sudah teruji. Yang belum ada hanyalah pemakaiannya.

---

## 2. Tiga koreksi terhadap rencana, semuanya dengan bukti di repo

### 2.1 Durasi morph tetap 400ms, bukan 1200ms

Rencana meminta **1200ms** supaya `--duration-choreographed` — token yang
Tahap 34 §D3 hitung punya **nol** konsumen — akhirnya mendapat satu.

`lib/styles/css/global.css:458` sudah menyetel:

```css
::view-transition-group(.morph) {
  animation-duration: var(--duration); /* 400ms */
  animation-timing-function: var(--ease-out-expo);
}
```

Itu berlaku untuk **setiap** morph di situs — sampul karya dan nama praktik —
dan komentarnya mencatat alasannya: 400ms adalah default proyek dan juga
tempat panduan morph `ui-ux-pro-max` mendarat, _"slow enough to register but
fast enough to feel direct"_.

Membuat jurnal tiga kali lebih lambat dari dua morph lain di situs yang sama
merusak satu-satunya hal yang `CLAUDE.md` sebut sebagai standar yang penting —
**restraint applied consistently** — dan menukarnya dengan konsumen untuk
sebuah token. Pembaca menekan sebuah judul; menahannya 1,2 detik bukan
kemewahan, itu keterlambatan.

**`--duration-choreographed` tetap nol konsumen, dan itu ditulis sebagai
keputusan, bukan dibiarkan sebagai kelalaian.** Token tanpa rumah yang tepat
bukan cacat; memaksanya masuk ke satu-satunya tempat yang muat adalah cara
kosakata berubah jadi kebisingan.

**Momennya tetap berkoreografi lewat rentang totalnya, bukan lewat satu
angka:** morph 400ms, lalu SETTLE 400ms per blok dengan stagger 40ms. Yang
§9.5 hitung adalah gerak yang mulai, selesai, dan berakhir — dan rentang itu
lewat 800ms dengan mudah.

### 2.2 Judul entri berhenti jadi `TextReveal`

`<ViewTransition>` memotret DOM nyata; SplitText mengambil alih node teks
elemen yang dipotretnya. Tahap 23 §3.2 sudah membuat panggilan yang sama
persis untuk heading halaman praktik, dan `vault/blocks/practice-hero` adalah
bentuk yang disalin — `<h1>` polos di dalam `<ViewTransition ... share="morph"
default="none">`.

Ini pertukaran, dan arahnya benar: entri mendapat morph dan kehilangan
kedatangan kedua yang bersaing dengannya. **Morph adalah kedatangannya.**

Efek sampingnya bagus: Tahap 40 baru saja mengukur bahwa reveal `<h1>` di
halaman ini bergerak 702–766ms tanpa momen bernama. Setelah tahap ini elemen
itu tidak lagi di-split sama sekali.

### 2.3 COMMIT ditulis di CSS, bukan di state klien

Rencana menggambarkan baris lain mundur ke `opacity: 0,35` saat sebuah baris
ditekan. §9 sudah menetapkan caranya — _"Write COMMIT in CSS, with
`:active`"_ — dan resesi saudara bisa dinyatakan seluruhnya di selektor:

```css
.list:has(.row:active) .row:not(:has(:active)) { … }
```

Nol state baru, nol kode klien baru, dan `:active` menyala untuk Enter — jadi
keyboard mendapat COMMIT yang sama, yang §9.4 aturan 2 tuntut.

---

## 3. Koreografi, konkret

- **COMMIT** — baris yang ditekan tetap penuh; baris lain turun ke
  `opacity: 0,35`, **200ms** (`--duration-fast`), `--ease-out-quart`. Daftar
  mundur; yang dipilih tinggal.
- **TRANSPORT** — `<ViewTransition name={transitionName(\`journal-${slug}\`)}
  share="morph" default="none">`membungkus judul baris;`<h1>`entri membawa
nama yang sama, disusun dari helper yang sama supaya kedua ujungnya tidak
bisa berbeda. Overlay rute stand-down lewat`transition="morph"`pada`Link`. **400ms**, `--ease-out-expo`, dari aturan global.
- **SETTLE** — kontrak `[data-reveal]` yang sudah ada di badan entri, disetel
  mengikuti morph alih-alih bersaing: `--reveal-duration` 400ms,
  `--reveal-stagger` = `--stagger-items` (40ms).
- **Reduced motion** — `global.css` sudah mematikan grup morph ke 0,01ms
  dengan selektor yang cocok (pelajaran yang diukur di sana), dan `Reveal`
  menampilkan isinya langsung. Judul tidak pernah terdampar.
- **Tanpa JavaScript** — baris tetap `<a>` biasa; REST adalah keadaan yang
  dirender (§9.4 aturan 4).
- **Larangan** — nol transform pada elemen yang di-morph selama morph
  (pelajaran Tahap 33 dan komentar `project-card`), dan tetap satu pasangan
  per navigasi.

**Uji `taste-skill`** — _apa yang dikomunikasikan gerak ini?_ **Narasi.**
Judul yang pembaca pilih adalah judul yang mereka dapat; ia membawa dirinya
sendiri ke sana alih-alih digantikan oleh judul yang kebetulan sama bunyinya.

---

## 4. Gerbang

1. **Morph terbentuk** dari `/journal` ke entrinya — pasangan
   `view-transition-group(...)`, kedua paruh `old` dan `new`. Dibuktikan
   **merah** dulu: hari ini nol morph di rute itu.
2. **§9.4 aturan 5 akhirnya diasersikan** — tepat **satu** pasangan per
   navigasi, pada ketiga pasangan yang situs ini punya.
3. **COMMIT terlihat** — baris lain benar-benar mundur saat satu ditekan.
4. **Reduced motion** — nol morph, isi terbaca penuh.
5. **Sampler epik** tetap hijau di tujuh halaman; `/journal/<slug>` naik ke
   satu momen bernama, bukan ke gerak tanpa nama.

---

## 5. Amandemen §9.5, ditulis bukan dilanggar diam-diam

`/journal/<slug>` naik dari **0 → 1**. Alasannya di tabel: kedatangan bukan
gerak pita-gulir dan tidak memperpanjang bacaan — persis alasan yang sudah
dipakai untuk `/work/<slug>`. Keputusan Tahap 26 "nol karena ini bacaan
panjang" berlaku untuk gerak **selama** membaca; ia tidak pernah berarti
halaman itu harus tiba tanpa apa-apa.

`/journal` sendiri tetap di satu (`journal-index`) plus `journal-transport`
yang dibelanjakan saat navigasi, bukan saat muat — sama seperti
`work-transport` di `/work`.

---

## 6. Risiko

- Menghapus `TextReveal` dari `<h1>` entri menyentuh `reveal-coverage`,
  `taste-preflight` dan sampler epik sekaligus.
- Nama morph baru harus unik terhadap `morph-<slug>` milik karya. Slug jurnal
  dan slug karya hidup di ruang yang sama, jadi prefiksnya dibedakan.
- `:has()` di jalur COMMIT — dukungan browser modern penuh, tapi gerbangnya
  harus benar-benar menekan, bukan mengasumsikan.

---

## 7. Hasil

### 7.1 Dibuktikan merah, dengan angkanya

Terhadap build produksi sebelum kode ditulis, `/en/journal` → entrinya:

```
calls: 0        — nol view transition dimulai
pairs: 0        — nol pasangan view-transition-group
```

Perjalanan `/en/work` **lulus** asersi "tepat satu pasangan" pada jalan yang
sama, jadi §9.4 aturan 5 memang sudah berlaku di sana — ia hanya belum pernah
diperiksa.

### 7.2 Yang dikirim, diukur pada build produksi

**COMMIT.** Baris jurnal, opacity, di 1440×900, dengan penekanan ditahan:

| Keadaan                   | Baris                         |
| ------------------------- | ----------------------------- |
| Istirahat                 | `1 · 0,7 · 0,7` (resesi baca) |
| Ditekan                   | **`1 · 0,35 · 0,35`**         |
| Reduced motion, istirahat | `1 · 1 · 1`                   |
| Reduced motion, ditekan   | **`1 · 1 · 1`**               |

Nol state klien, nol handler: seluruhnya
`.list:has(.row:active) .row:not(:has(:active))`.

**TRANSPORT.** Enam uji morph lulus, termasuk dua yang baru. Pasangan
`view-transition-group(morph-journal-scope-is-the-deliverable)` terbentuk
dengan kedua paruh `old` dan `new`.

**Judul entri.** Sesudah mendarat: `h1Split: **0**` — nol span SplitText.
Elemen itu tidak lagi di-split sama sekali, `opacity: 1`, dan blok badan
semuanya `opacity: 1`.

**§9.4 aturan 5 akhirnya diasersikan**, pada **kedua** pasangan yang situs ini
punya, bukan hanya yang baru: tepat satu `view-transition-group` bernama per
navigasi. Grup `root` dikecualikan dengan alasan tertulis — ia pasangan
seluruh-halaman milik browser, bukan elemen berbagi yang situs deklarasikan.

### 7.3 Satu gerbang merah yang benar, dan pengecualian yang sudah ada rumahnya

`motion.e2e.ts` → `every page enters the same way` menuntut tiap `<h1>`
di-reveal baris demi baris, dan `/en/journal/<slug>` ada di daftarnya. Melepas
`TextReveal` dari sana membuatnya merah — persis risiko §6.

Gerbang itu **sudah** punya pengecualian yang identik, ditulis lengkap dengan
alasannya: rute praktik tidak ada di daftar karena `practice-hero` membungkus
`h1`-nya dalam `<ViewTransition share="morph">`, dan SplitText mengganti node
teks yang morph potret. Entri jurnal bergabung dengan pengecualian itu, lewat
mekanisme yang sama persis, dan komentarnya diperluas untuk menyebut keduanya.

**Bukan pelonggaran.** Uji baru `a journal row morphs into its entry` adalah
yang menahan rute itu supaya tidak berakhir tanpa kedatangan sama sekali —
pengecualian ditukar dengan asersi, bukan dengan ketiadaan.

### 7.4 Satu token yang tidak ada, lagi

SETTLE minta `--stagger-items`. Token itu **tidak ada di CSS**:
`vault/motion/tokens.ts` punya `stagger.items = 0.04` sejak Tahap 12b, dan
`lib/styles/css/global.css` hanya punya `--stagger-words`, `--stagger-cards`
dan `--stagger-hero`.

Ini kelas cacat yang sama persis dengan `--space-2xs` yang Tahap 40 temukan di
`vault/motion/flip` — nama yang terbaca ter-tokenisasi dan berperilaku sebagai
fallback diam-diam. Bedanya di sini pasangannya **memang seharusnya ada**:
`global.css` sendiri mencatat bahwa `--stagger-*` ditambahkan justru untuk
menutup celah "ada di TypeScript, tidak bisa dibaca CSS".

Jadi `--stagger-items: 40ms` ditambahkan, dan `vault/motion/tokens.test.ts`
diperluas untuk memasangkannya — gerbang yang sudah menjaga `words` dan
`cards` sekarang menjaga tiga.

### 7.5 Yang tidak dilakukan, dan alasannya

**Morph tetap 400ms.** Rencana meminta 1200ms supaya
`--duration-choreographed` mendapat konsumen pertamanya. Ditolak: `global.css`
menyetel setiap `.morph` di situs ke `var(--duration)` dengan alasan tertulis,
dan membuat jurnal tiga kali lebih lambat dari dua morph lain menukar
konsistensi — satu-satunya standar yang `CLAUDE.md` sebut penting — dengan
sebuah centang. Momennya tetap berkoreografi lewat rentangnya.

`--duration-choreographed` tetap nol konsumen. Itu tercatat sebagai keputusan
di sini dan di §9.5, bukan dibiarkan sebagai kelalaian.

### 7.6 Gerbang

```
bun run build            ✅
bun run check            ✅  oxlint · oxfmt · tsc · 458 unit · manifest · assets
CI=true bun run test:e2e ✅  515 lulus · 16 dilewati · 0 gagal
bun run build-storybook  ✅
```

Satu kegagalan pada jalan pertama, diperkirakan: `storybook-a11y` menolak
Storybook yang lebih tua dari komponen yang diperiksanya. Dibangun ulang;
98 lulus.

### 7.7 Catatan

Daftar yang masih terbuka tidak bertambah di tahap ini. `vault/motion/flip` dan
`vault/blocks/project-spine` masih tanpa story (Tahap 46); 404 tanpa
JavaScript masih 28 karakter (`TAHAP-38.md` §7.4).
