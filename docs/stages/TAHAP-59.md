# Tahap 59 — sebab yang tidak saya temukan kemarin, dan gerbang yang saya tunda

> Tahap 58 memasang **mundur**, bukan perbaikan: material di hero halaman
> proyek dimatikan karena sebabnya tidak ketemu. §3 tahap itu menulisnya
> begitu — "cacatnya di hilir komponen itu dan SAYA BELUM MENEMUKANNYA" — dan
> §5 menunda gerbangnya dengan alasan yang benar: gerbang yang ditulis hari itu
> akan lulus **karena materialnya dimatikan**, bukan karena masalahnya selesai.
>
> Sebabnya ketemu. Tahap ini membatalkan mundur itu dan membayar utang §5.

---

## 1. Sebabnya, dan kenapa empat hipotesis kemarin semuanya meleset

Keempat hipotesis Tahap 58 mencari alasan **mesh-nya tidak melukis**. Probe di
dalam `useFrame` sudah menjawab pertanyaan itu dengan jelas dan saya tidak
mendengarkannya:

```
pos=-413,-312  scale=572x715  size=1430x900  tex=yes  vis=true
```

Mesh-nya **melukis dengan benar**. Ia tertutup.

`lib/webgl/components/canvas/webgl.module.css` menaruh kanvas sebagai satu
lapisan `position: fixed` **di belakang `<main>`**. Jadi sebuah mesh yang
berdiri menggantikan sebuah `<img>` hanya terlihat kalau **tidak ada yang
opak di atas kotaknya**.

`vault/blocks/project-hero/project-hero.module.css`:

```css
.media {
  background-color: var(--surface-2);
}
```

`--surface-2` = `color-mix(in oklab, var(--color-secondary) 8%, var(--color-primary))`.
Di tema gelap rute ini (`theme="dark"`), primary `oklch(0.17 …)` dan secondary
`oklch(0.964 …)`, jadi L ≈ **0.234**. `#201d1b` yang saya ukur kemarin dan saya
tulis sebagai "warna kotak penampung" mengukur L ≈ **0.238**.

Itu memang warna kotak penampung. Kotak penampungnya yang menutupi karyanya.

### 1.1 Yang membuat ini menyakitkan: jawabannya sudah tertulis di repo ini

`vault/blocks/project-card/project-card.module.css` sudah menemukan hal yang
sama persis, dan sudah menuliskannya dalam kalimat lugas:

> While a material is drawing, the plate's box is a hole through to the canvas.
> The WebGL surface is one fixed layer _behind_ `<main>` … so a mesh standing
> in for this image is only visible if nothing opaque sits over its box. The
> placeholder above is exactly that: **measured `oklab(0.23 …)` covering the
> mesh completely, with no error and no failing gate.**

Dan ia memasang penjaganya:

```css
.media:has([data-material]) {
  background-color: transparent;
}
```

Tahap 45 membawa material ke rute kedua — hero halaman proyek — dan
**menyalin opt-in-nya tanpa menyalin penjaganya**. Audit seluruh konsumen
`MaterialImage`, dua-duanya:

| konsumen                    | placeholder `--surface-2` | penjaga `:has([data-material])` |
| --------------------------- | :-----------------------: | :-----------------------------: |
| `vault/blocks/project-card` |            ya             |             **ya**              |
| `vault/blocks/project-hero` |            ya             |            **tidak**            |

Dua konsumen, satu penjaga. Itu seluruh cacatnya.

### 1.2 Kenapa tiap pengukuran kemarin cocok dengan sebab ini

Tidak satu pun pengukuran Tahap 58 yang harus dijelaskan ulang — semuanya
justru diramalkan oleh sebab ini:

| yang diukur Tahap 58                            | diramalkan oleh sebab ini?                             |
| ----------------------------------------------- | ------------------------------------------------------ |
| mesh melapor posisi/skala/tekstur/visible benar | ya — ia memang benar, ia tertutup                      |
| nol piksel berwarna karya di seluruh viewport   | ya — placeholder opak menutup penuh                    |
| tidak berubah setelah pointer/gulir/resize      | ya — ini urutan cat, bukan render                      |
| reduced motion benar (#bb9973)                  | ya — tanpa mesh, `<img>` opacity 1 di atas placeholder |
| `/en/work` benar                                | ya — kartu punya penjaganya                            |
| `simTypes`/Lenis/`ViewTransition` digugurkan    | ya — tak satu pun menyentuh urutan cat                 |

Empat hipotesis itu gugur karena keempatnya bertanya soal render. Cacatnya
soal **komposit**.

---

## 2. Yang dikerjakan

**2a — penjaganya dipasang** di `project-hero.module.css`, bentuk yang sama
persis dengan yang sudah dipegang kartu.

**2b — mundur Tahap 58 dibatalkan.** `material` kembali ke `<ProjectHero>`,
`webgl` + `simTypes={['flowmap']}` kembali ke `Wrapper` rute itu, `three`
kembali ke izin rute itu di `route-budget`. Tahap 45 benar; yang salah cuma
satu baris CSS yang tidak ikut disalin.

**2c — gerbang yang ditunda §5 Tahap 58 ditulis.** Sekarang ia bisa ditulis
jujur, karena materialnya menyala lagi: kalau ia hijau, ia hijau karena
masalahnya selesai.

---

## 3. Gerbangnya: bukan foto, melainkan urutan cat

Rencana awal saya di tahap ini salah, dan saya menuliskannya karena
pembetulannya adalah isi bagian ini.

Saya berencana memotret plate lalu menuntut `tone().range` di atas suatu
lantai — sebuah isian rata melaporkan `range` mendekati nol, sebuah karya
tidak. Preseden angkanya ada (Tahap 17: 2.0 sebelum, 13.9 sesudah).

Lalu saya membaca `e2e/material-layer.e2e.ts`, yang **sudah pernah mencoba
persis itu dan menolaknya**, dengan alasan yang masih berlaku:

> The obvious gate is a pixel comparison: render the plate with the material
> and with `prefers-reduced-motion`, and require the two to carry the same
> spread of colour. That was written, and it does not hold up **as an
> automated gate in this environment**: on a headless software renderer the
> WebGL layer is present in some captures and absent from others, run to run,
> with the page in an identical state. A flaky gate is worse than no gate,
> because it teaches you to re-run.

Dan berkas yang sama juga sudah mengaku bahwa gerbang DOM-nya tidak cukup:

> This test would **not** have caught either original defect on its own.

Jadi dua gerbang yang ada: satu berbentuk DOM dan mengaku buta terhadap cacat
ini, satu berbentuk piksel dan ditolak karena rewel. Celahnya persis di
tengah.

**Yang menutup celah itu: oklusi bukan pertanyaan render, melainkan pertanyaan
urutan cat — dan urutan cat ada di CSSOM, ada GPU atau tidak.**

`e2e/material-occlusion.e2e.ts` karena itu tidak memotret apa pun. Ia berjalan
dari `[data-material-shell]` naik sampai `<main>` dan menuntut tiap
`background-color` di rantai itu tembus pandang. `<main>` adalah batasnya
karena kanvas duduk di belakangnya; ground tema dan `<body>` di bawahnya
memang mengecat halaman, dan itu benar.

Dan ia **menaikkan `data-material` sendiri** alih-alih menunggu sebuah mesh
menaikkannya. Kontrak yang diuji memang bersyarat — _"kalau plate ini
menyerahkan gambarnya, apakah ada lubang ke kanvas?"_ — jadi mengujinya
terhadap atribut yang dipaksa menguji hal yang tepat, dan membuat hasilnya
identik di workstation, di CI, dan di mesin tanpa WebGL sama sekali.

### 3.1 Satu kesalahan di dalam gerbangnya sendiri, yang nyaris lolos

Draf pertama probe-nya menyaring warna dengan regex `rgba?\(…\)`, dan
melaporkan **nol occluder di kedua rute** — termasuk rute yang jelas-jelas
rusak. Sebabnya: proyek ini menulis warna di `oklch()` dan menurunkannya
dengan `color-mix(in oklab, …)` (`CLAUDE.md` #10), jadi
`getComputedStyle().backgroundColor` mengembalikan `oklab(0.23352 …)`, bukan
`rgb()`. Regex-nya tidak cocok, dan "tidak cocok" dibaca sebagai "tembus
pandang".

Gerbang versi jadi karena itu **menganggap opak sampai terbukti sebaliknya**.
Ruang warna yang belum terpikirkan menghasilkan merah palsu, bukan hijau
palsu — arah yang benar untuk sebuah gerbang gagal.

## 4. Kenapa `visual-substance › renders its work` tidak pernah merah

Dicatat lagi karena ini bentuk ketiga dari pelajaran yang sama (Tahap 17,
Tahap 44, sekarang): gerbang itu bertanya "apakah halaman merender karya", dan
halaman itu **memang** merender karya — plate galerinya, di bawah hero. Hero
kosong dan tidak ada yang menanyakannya.

Sebuah gerbang yang bertanya "apakah ada" tidak pernah menangkap "yang ada
tidak kelihatan".

---

## 5. Hasil

### 5.1 Gerbangnya dibuktikan merah lebih dulu

Dengan `material` dikembalikan dan penjaga **belum** dipasang — keadaan persis
yang dilihat pengguna — `e2e/material-occlusion.e2e.ts` melaporkan:

```
1 failed
  [desktop] › /en/work/arus-balik leaves every handed-over plate a hole to the canvas
    - Array []
    + Array [ "div.project-hero-module__M9VJLG__media → oklab(0.23352 0.00222605 0.00552768)" ]
2 passed
```

Merah pada rute yang rusak, hijau pada `/en` dan `/en/work`, dan pesannya
menyebut elemen serta warnanya. Sesudah penjaganya dipasang: **6 lulus** (tiga
rute × dua viewport).

### 5.2 Piksel, sebelum dan sesudah

Sembilan sampel melintasi kotak plate, build produksi, 1440×900:

|                               | plate hero `/en/work/arus-balik`                                          |
| ----------------------------- | ------------------------------------------------------------------------- |
| Tahap 58 (rusak)              | `#201d1b` di **setiap** titik                                             |
| Tahap 59 (sesudah)            | `#987f5e #8d6f50 #473020 #915836 #7b4528 #6f4229 #402d20 #483425 #412f21` |
| karya yang sama di `/en/work` | `#836e52 #785f45 #402b1e #965d39 #7f492a #704329 #483122 #4e3726 #483324` |

Baris kedua dan ketiga adalah karya yang sama lewat permukaan yang sama;
selisihnya adalah warp flowmap dan krop yang sedikit berbeda.

### 5.3 Assertion yang Tahap 58 catat berhenti berjalan, berjalan lagi

Tahap 58 §6.3 mencatat jujur bahwa satu assertion mulai **dilewati** akibat
mundurnya — rutenya kehilangan kanvas, jadi tidak ada yang diuji. Dikembalikan
dan diverifikasi menyala lagi di kedua viewport:

```
✓ 22 [desktop] /en/work/arus-balik keeps its footer out from under the canvas (8.5s)
✓ 57 [mobile]  /en/work/arus-balik keeps its footer out from under the canvas (27.7s)
```

### 5.4 Gerbang

|                                                   | hasil                                             |
| ------------------------------------------------- | ------------------------------------------------- |
| `bun run check`                                   | **421 lulus / 0 gagal** (992 expect, 46 berkas)   |
| `bun run build`                                   | sukses                                            |
| `bun run build-storybook`                         | sukses                                            |
| sepuluh berkas e2e paling terdampak, dua viewport | **143 lulus / 0 gagal / 14 dilewati** (7,3 menit) |
| `material-occlusion` sendiri, dua viewport        | 6 lulus                                           |

Berkas yang dijalankan: `material-occlusion`, `material-layer`,
`visual-substance`, `project-detail`, `route-budget`, `webgl-budget`,
`lightbox`, `continuous-motion`, `palette-integrity`, `journey`.

### 5.5 Yang gagal, dan yang saya perbaiki di tengah jalan

Dua hal, dan keduanya kesalahan saya sendiri:

1. **Probe pertama melaporkan nol occluder di halaman yang jelas rusak** —
   regex `rgba?\(…\)` terhadap nilai `oklab()`. §3.1. Kalau saya berhenti di
   situ, saya akan menyimpulkan hipotesisnya gugur dan mengulang Tahap 58.
2. **`bun run check` merah dua kali** pada berkas gerbang baru —
   `unicorn(prefer-number-properties)` dan format `TAHAP-59.md`. Keduanya
   diperbaiki, bukan dibungkam.

### 5.6 Yang tidak dikerjakan

- **`project-gallery` tidak diaudit ulang untuk ini** karena ia tidak memakai
  `MaterialImage` — audit konsumen di §1.1 menemukan tepat dua, dan gerbangnya
  menjangkau `[data-material-shell]` di mana pun ia muncul, jadi konsumen
  ketiga apa pun otomatis ikut terjaga.
- **Nol klaim FPS atau Lighthouse.** Tidak ada profiler di lingkungan ini
  (`CLAUDE.md` #19).
- **Fixture masih fixture.** Enam karya terbit masih yang skripnya sendiri
  bilang untuk dihapus; hero yang sekarang menampilkan karyanya tetap
  menampilkan karya fixture.
