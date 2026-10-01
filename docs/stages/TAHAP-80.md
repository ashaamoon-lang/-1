# Tahap 80 — Alat ukurnya dulu, baru yang diukur

> **Status: spec. Belum ada kode.** Ditulis lebih dulu sesuai `ROADMAP.md` §3.0.
>
> Cabang: `claude/arth-design`. Tahap ini membangun **papan skor** sebelum
> pekerjaan desain besar, lalu menjadikan parallax sebuah **sistem** alih-alih
> efek yang ditempel per komponen.

---

## 1. Yang diukur, sebelum satu baris kode

### 1.1 Baseline, dihitung ulang di worktree ini

Bukan dikutip dari rencana — rencana itu menyebut `12 / 2 / 2`, dan Tahap 79
sudah menggesernya. Dihitung ulang hari ini:

```bash
git grep -ho 'data-epic="[a-z-]*"' -- app vault | sed 's/.*="//;s/"//' | sort -u
# 13 nama

git grep -l 'import { useParallax }' -- app vault components   # 3, satu story
git grep -c 'pin: true' -- vault app                           # 2
```

| nilai                               | sekarang                                      |
| ----------------------------------- | --------------------------------------------- |
| Nama momen berbeda (K3)             | **13** — `project-chapters` masuk di Tahap 79 |
| Blok mengonsumsi `useParallax` (K5) | **2** — `project-card`, `project-gallery`     |
| Section ter-pin (K6)                | **2** — `passage`, `horizontal`               |

### 1.2 Satu positif palsu, ditangkap sebelum jadi angka

`git grep -l useParallax` pertama mengembalikan **enam** berkas. Tiga di
antaranya bukan konsumen: dua `.module.css`, dan `vault/motion/flip/index.ts`,
yang menyebut parallax **di dalam komentar prosa**:

```
flip/index.ts:192   ScrollTrigger measures positions, and every card's cover
                    is parallaxed (vault/motion/parallax).
```

Persis kelas kesalahan yang `TAHAP-78.md` §1.3 catat — _"dua positif palsu yang
ternyata prosa di dalam komentar"_. Jadi definisi yang dipakai papan skor adalah
**impor**, bukan penyebutan, dan story dikecualikan.

Ini juga alasan angka hari-pertama ditulis di sini: **kalau alat itu melaporkan
selain 13 / 2 / 2, alatnya yang salah**, bukan repo-nya.

---

## 2. Ritual skill — `ROADMAP.md` §2.1, hasilnya ditempel apa adanya

```bash
PY=python   # Windows; python3 di Linux/macOS — lihat ROADMAP §2.1
S=.claude/skills/ui-ux-pro-max/scripts/search.py
$PY $S "Parallax Scroll" --domain gsap
$PY $S "parallax motion sickness accessibility" --domain ux -n 4
```

### 2.1 Yang membentuk desainnya

| temuan skill                                                                                     | konsekuensi                                                                     |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `yPercent: (i + 1) * -8`; _"background slowest, foreground fastest, to sell the depth illusion"_ | Jarak **diturunkan dari indeks bidang**, bukan disetel per komponen             |
| _"Layer count beyond 3-4 has diminishing visual return and multiplies scroll-listener cost"_     | **Plafon 4 bidang.** `ground` / `mid` / `subject` / `foreground` persis di situ |
| _"Batch all layers under one ScrollTrigger container where possible instead of one per layer"_   | Satu ScrollTrigger per kontainer — sejalan `CLAUDE.md` #6                       |
| _"will-change: transform on the parallax layer only; remove it after scroll settles"_            | Masuk kontrak komponen, bukan diserahkan pemanggil                              |

### 2.2 Dua temuan yang menguatkan gerbang repo dari arah berbeda

**_"Don't parallax body copy; it hurts reading comfort and can trigger motion
sickness."_** `e2e/continuous-motion.e2e.ts:74` sudah menegakkan aturan itu —
dan Tahap 79 baru saja memperbaiki instrumennya supaya ia benar-benar mengukur
transform ter-scroll, bukan transform masuk yang sedang meluruh. Dua sumber
terpisah, satu kesimpulan.

**_"Animate 1-2 key elements per view maximum"_** (severity High). Ini tampak
melawan plafon 12 momen `DIREKSI.md` §2.2 — dan tidak, karena kata kuncinya
**per view**. `e2e/epic-sequence.e2e.ts` sudah menyatakan hal yang sama dalam
bahasa repo ini: dua momen bernama beda, tak bersarang, tidak boleh menempati
rentang gulir yang sama.

**Banyak momen berurutan: boleh. Banyak momen serentak: tidak.** Itu bukan
kompromi terhadap permintaan "banyak animasi" — itu syarat yang membuatnya
mungkin tanpa membuat pembaca mual.

### 2.3 Yang DITOLAK dari hasil ritual

_"Parallax/Scroll-jacking causes nausea"_, dengan `ScrollTrigger.create()`
sebagai contoh buruknya. Yang ditolak adalah generalisasinya, bukan aturannya:
ScrollTrigger tanpa penjaga memang cacat, tapi `DIREKSI.md` §4 sudah membedakan
**pin + scrub** dari scroll hijacking dan membuktikan bedanya dengan menguji
pakai keyboard saja. Yang diadopsi: reduced-motion adalah jalur kelas satu,
bukan renungan belakangan.

---

## 3. Inventaris — dipakai ulang, bukan ditulis ulang

| kebutuhan                       | yang sudah ada                                                |
| ------------------------------- | ------------------------------------------------------------- |
| Hook parallax                   | `vault/motion/parallax` — `useParallax(ref, { distance })`    |
| Loop RAF bersama                | `tempus` lewat `components/effects/gsap.tsx`                  |
| Penjaga reduced-motion          | `usePreferredReducedMotion`                                   |
| Blok ter-generate **dan diuji** | `lib/scripts/rule-coverage.ts` + `.test.ts`; `design-debt.ts` |
| Bidang `ground`                 | `vault/magic/noise-texture`, `dot-pattern`, `grid-pattern`    |
| Bidang `mid`                    | `vault/webgl/material-image`, `scene-shell`                   |
| Bidang `foreground`             | `vault/primitives/cursor`, `magnetic`, `reading-progress`     |

**Nol komponen baru untuk papan skor.** Ia meniru `rule-coverage.ts` baris demi
baris; menulis mekanisme blok-ter-generate yang kedua berarti dua mekanisme
untuk satu pekerjaan — penolakan yang sama yang Tahap 63 terapkan pada `flip`.

---

## 4. Yang akan dikerjakan

### 4.1 Papan skor — lebih dulu, sebelum kode desain apa pun

```
lib/scripts/design-scoreboard.ts        pemindai + renderer + --write
lib/scripts/design-scoreboard.test.ts   drift + anti-vakum + uji parser
docs/DIREKSI.md                         blok <!-- design-scoreboard:start/end -->
```

Yang ia lihat, **statis dari sumber**, tanpa browser:

```
nama momen berbeda     atribut data-epic di app + vault
konsumen parallax      impor useParallax, story dikecualikan
section ter-pin        pin: true
```

Yang ia **tidak** bisa lihat, dan bloknya wajib mengatakannya sendiri:

- **momen per rute** — butuh merender; itu pekerjaan `epic-sequence.e2e.ts`;
- **kualitas** — sebuah hitungan tidak bisa membedakan momen yang perlu dari
  momen yang ditambahkan untuk membelanjakan anggaran.

Alat yang menyembunyikan batas penglihatannya adalah cacat yang
`DESIGN-SYSTEM.md` §7 bayar **dua puluh enam tahap**. Blok `rule-coverage` di
`CLAUDE.md` menutup dengan menyebut lima aturan yang tak punya gerbang; blok ini
menutup dengan cara yang sama.

### 4.2 Parallax sebagai bidang kedalaman

`vault/motion/parallax` menerima **nama bidang**, bukan angka:

```
ground → mid → subject → foreground
```

**Dikoreksi saat dikerjakan: bentuknya dari skill, angkanya dari situs ini.**
Kalimat di sini semula berbunyi "jarak diturunkan dari indeks bidang mengikuti
`yPercent: (i + 1) * -8`". Itu akan memberi 8 / 16 / 24 / 32 — dan default hook
ini **6**, ujung bawah band 5–15 milik preset itu sendiri, karena sebuah plat
sudah jadi hal paling keras di halaman. Mengadopsi angka absolut skill berarti
mengambil register yang proyek ini tolak dengan sengaja.

Yang diambil adalah **hubungannya** — background paling lambat, foreground
paling cepat — dan nilainya diambil dari yang sudah terukur di situs ini:

```
ground      4   kolom lambat work-constellation   (Tahap 43)
mid         6   default hook ini sendiri          (Tahap 33)
subject    10   PLATE_DRIFT project-gallery       (Tahap 56)
foreground 14   satu-satunya yang baru — ujung atas band 5-15 milik preset
```

Tiga dari empat sudah tayang dan sudah diukur, jadi sistemnya **menamai yang
sudah ada** alih-alih memaksakan yang baru. Plafon empat, karena skill mengukur
nilai visualnya berhenti bertambah di sana.

**Yang tidak berubah:** `distance` numerik tetap didukung. Dua konsumen yang ada
sudah disetel dan diukur (`project-card` 4 dan 9, `project-gallery` `PLATE_DRIFT`);
memaksa mereka pindah adalah perubahan desain yang tahap ini tidak minta izinnya.

### 4.3 Berkas yang disentuh

```
lib/scripts/design-scoreboard.ts             baru
lib/scripts/design-scoreboard.test.ts        baru
docs/DIREKSI.md                              blok ter-generate
vault/motion/parallax/index.tsx              kontrak bidang
vault/motion/parallax/parallax.stories.tsx   story per bidang
```

Rute-rute menerima bidangnya **satu rute per commit**, dan bukan di tahap ini —
`DIREKSI.md` §3.3: plafon dan bobot naik bersama, tidak di muka.

---

## 5. Kriteria keluar — bisa dijalankan, bukan dirasakan

| gerbang                     | tuntutan                                                           |
| --------------------------- | ------------------------------------------------------------------ |
| `bun run check`             | 569+ lulus, 0 gagal                                                |
| `design-scoreboard --write` | blok tersisip; dijalankan dua kali, diff kosong                    |
| `design-scoreboard.test.ts` | memerah kalau blok hanyut **dan** kalau ia memindai nol momen      |
| Hari pertama                | alat melaporkan **13 / 2 / 2**; selain itu, **alatnya** yang salah |
| Blok itu sendiri            | memuat kalimat yang menyebut apa yang tidak bisa ia lihat          |
| `continuous-motion.e2e.ts`  | prosa tetap tidak mengambil transform ter-scroll                   |
| `exploratory-layer.e2e.ts`  | nol tumpang tindih kartu di dua belas posisi gulir                 |
| reduced motion              | parallax mati, isi berakhir **terlihat penuh**                     |
| `bun run build-storybook`   | story per bidang, termasuk state reduced-motion                    |

---

## 6. Risiko — yang paling mungkin gagal

1. **Papan skor memperbesar godaan yang ia ukur.** Yang dihitung cenderung
   dikejar, dan `DIREKSI.md` §2.1 sudah menamai bentuk kesalahannya — _"hero
   lebih tinggi dengan isi yang sama bukan lebih memukau, melainkan lebih
   kosong"_. Mitigasinya bukan niat baik: bloknya **wajib** menyatakan ia tidak
   bisa melihat kualitas, dan pin dibatasi satu per rute sehingga jalan termurah
   untuk menaikkan angka tertutup.
2. **Pemindai statis salah hitung.** Sudah hampir terjadi di §1.2. Mitigasi:
   definisinya impor bukan penyebutan; anti-vakum memerah kalau hasilnya nol;
   dan angka hari pertama ditulis di §1.1 supaya alat yang salah ketahuan pada
   hari ia lahir.
3. **Kontrak bidang memaksa konsumen yang sudah disetel.** Mitigasi: `distance`
   numerik tetap didukung, dan migrasi bukan bagian tahap ini.
4. **K10 tidak bisa diukur.** `chrome-devtools-mcp` belum tersambung, jadi
   **nol angka performa diklaim di tahap ini** — semuanya tetap disebut
   anggaran, `CLAUDE.md` #19. Dinyatakan di muka, bukan ditemukan di akhir.
