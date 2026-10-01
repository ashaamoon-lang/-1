# Tahap 73 — Tabel utang yang tidak ada yang mengukur

> `DESIGN-SYSTEM.md` §7 ada persis supaya dokumen ini tidak menggambarkan
> sistem yang tidak ada. Kalimat pembukanya sendiri: _"a design document that
> describes a system nobody built is worse than no document."_
>
> Setiap angka di dalamnya salah.

## 1. Yang diukur, sebelum satu baris kode

### 1.1 Kedua barisnya, dihitung ulang

| §7 mengklaim                                 | Terukur hari ini                                       |
| -------------------------------------------- | ------------------------------------------------------ |
| **Tujuh** stylesheet menulis tipenya sendiri | **Satu** — `components/ui/not-configured/*.module.css` |
| **Enam** pengecualian per baris tersisa      | **Sembilan** situs deklarasi di **tujuh** berkas       |
| Ditutup di **Tahap 45c**                     | Tahap 45 dikirim **dua puluh tujuh tahap lalu**        |
| **25** direktori komponen tanpa story        | **15** dari **55**                                     |
| "**termasuk lima vault block**"              | **NOL.** 16 dari 16 `vault/blocks/*` punya story       |
| `parallax`, kedua `vault/webgl/*`, lightbox  | **masih benar** — empat-empatnya memang belum punya    |
| Ditutup di **Tahap 46**                      | Tahap 46 dikirim **dua puluh enam tahap lalu**         |

Baris terakhir tabel itu berbunyi: _"The measurements behind every row are in
the curator audit that opened Tahap 34; none of them is an estimate."_ Itu
benar **saat ditulis**. Yang tidak pernah ada adalah apa pun yang memeriksanya
lagi sesudah itu.

### 1.2 Kenapa ia bisa membusuk tanpa ada yang tahu

```
grep -rl "stories.tsx" e2e/ lib/ tools/ .storybook/   ->  nol berkas
lib/scripts/generate-manifest.ts                       ->  tidak menyebut story sama sekali
```

`manifest:check` menjaga `COMPONENTS.md` tetap mutakhir, dan itu berjalan di
tiap `bun run check`. Tapi ia menghitung komponen, bukan story. **Tidak ada
satu pun gerbang, uji, atau skrip di repo ini yang membaca cakupan story.**

Jadi §6.4 — _"every primitive gets a Storybook story"_ — adalah aturan tanpa
alat ukur, dan §7 adalah catatan utangnya tanpa alat ukur. Dua puluh enam tahap
menulis story, menghapus stylesheet, dan memindahkan komponen; angkanya
bergerak; tabelnya tidak.

Ini bentuk yang sama dengan tiga tahap terakhir, dan itu yang membuatnya layak
satu tahap alih-alih satu commit perbaikan angka:

| tahap  | klaim yang tidak ada pembacanya                                |
| ------ | -------------------------------------------------------------- |
| 68     | prop opsional `vault/` tanpa pemanggil                         |
| 72     | `results.incomplete` milik axe — 185 node, nol pembaca         |
| **73** | **§7 sendiri — tabel yang ada supaya dokumen tidak berbohong** |

### 1.3 Satu angka yang tidak bisa dihitung sampai aturannya ditulis

"Enam pengecualian per baris" tidak bisa diverifikasi, bukan karena repo-nya
kabur, tapi karena **tidak ada yang pernah menyebut cara menghitungnya**:

```
9 situs `scale-exempt:` di 7 berkas
  - 2 di antaranya berbunyi "see the note on the mobile size above" —
    pasangan mobile/desktop dari pengecualian yang SAMA
  - 1 lagi (`vault/motion/horizontal:99`) adalah PROSA TENTANG escape hatch-nya,
    bukan sebuah pengecualian
```

Jadi jawabannya 9, 7, atau 6 tergantung apakah pasangan dihitung sekali dan
apakah prosa ikut tersaring. Itu bukan detail — itu **alasan terkuat** untuk
gerbangnya: sebuah angka yang tidak punya aturan hitung tidak bisa salah, dan
karena itu tidak bisa benar juga.

## 2. Yang dikerjakan

### 73a — angkanya jadi hasil pindai, bukan klaim

`lib/scripts/design-debt.ts`, mengikuti preseden `loneHalves()` (Tahap 66),
`trackFaults()` (Tahap 71) dan `contrastFaults()` (Tahap 72): keputusannya
diangkat jadi fungsi murni, dan aturan hitungnya jadi kode yang bisa dibaca
alih-alih konvensi yang diingat.

`lib/scripts/design-debt.test.ts` menuntut angka di §7 **cocok dengan hasil
pindai**. Tabel itu berhenti jadi prosa.

Dibuktikan merah oleh keadaan hari ini — yang memang merah di kelima angkanya,
dan itu justru bukti terbaiknya.

### 73b — cakupan §6.4 dinyatakan, bukan disiratkan

_"Every primitive gets a Storybook story"_ tidak pernah menyebut apa itu
primitive, jadi selama ini ia terbaca sebagai "setiap direktori komponen" —
yang tidak pernah benar. `layout/lenis` adalah provider RAF; `layout/theme`
menulis atribut ke `<html>`; `ui/real-viewport` mengukur viewport. Tidak satu
pun punya rupa untuk dikatalogkan.

Jadi pengecualiannya jadi **data berikut alasannya** di dalam pemindai, bukan
prosa di dokumen. Konsekuensinya yang penting: pengecualian jadi **bisa
dihitung**, dan menambah satu jadi keputusan yang terlihat di diff.

### 73c — story yang aturannya memang tuntut, ditulis

Empat yang §7 sebut dan masih benar. Yang tidak bisa dikerjakan disebut
eksplisit beserta alasannya (`CLAUDE.md` #21), bukan diam-diam dipersempit.

### 73d — §7 diganti angka terukur

Dan aturan hitungnya ditulis, supaya angkanya bisa direproduksi oleh siapa pun
tanpa menebak apa yang saya maksud.

## 3. Yang **tidak** dikerjakan

| butir                                   | kenapa tidak                                                                                              |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Menghapus `scale-exempt-file:` terakhir | `not-configured` punya nol konsumen dan dijadwalkan hapus. Menghapusnya tahap ini mencampur dua keputusan |
| Menulis story untuk cangkang aplikasi   | `header`/`footer` butuh routing + data; provider tidak punya rupa. §73b menyebut alasannya per komponen   |
| Menyentuh token, palet, atau motion     | Nol. Tahap ini dokumen + katalog + gerbang                                                                |
| Menyemai dataset Sanity                 | Tulisan ke CMS pemilik — tetap miliknya                                                                   |
| Rotasi kredensial Sanity                | Ditunda oleh pemilik. Tercatat, tidak diungkit                                                            |

## 4. Gerbang

| gerbang                             | menuntut                                                                          |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| **baru** `design-debt.test.ts`      | angka §7 sama dengan hasil pindai; tiap pengecualian punya alasan dan masih benar |
| `manifest:check`                    | tetap hijau — `COMPONENTS.md` tidak disentuh                                      |
| `storybook-a11y.e2e.ts`             | story baru ikut disapu axe                                                        |
| `contrast.test.ts`, `contrast-situ` | **tidak berubah** — nol token, nol CSS situs disentuh                             |

## 5. Hasil

### 5.1 Gerbangnya merah lebih dulu, pada §7 apa adanya

```
SEBELUM   2 gagal — dokumen tidak punya penanda, jadi tidak ada yang bisa dibaca
SESUDAH   9 lulus / 0 gagal
```

### 5.2 Angkanya, sebelum dan sesudah

|                             | §7 dulu | terukur                           |
| --------------------------- | ------- | --------------------------------- |
| `scale-exempt-file`         | 7       | **1**                             |
| `scale-exempt` per baris    | 6       | **7** (9 situs, 2 rujukan silang) |
| direktori tanpa story       | 25      | **15**, lalu **0** setelah §5.3   |
| "termasuk lima vault block" | 5       | **0** — 16 dari 16 sudah punya    |

### 5.3 Empat yang §7 sebut: dua dikirim, dua **tidak bisa**, dan itu diukur

| komponen                     | hasil                                                                                                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vault/motion/parallax`      | **story dikirim** — 3 story; demo hook, preseden `reveal`                                                                                                   |
| `components/ui/lightbox`     | **story dikirim** — 3 story; dialog terbuka di indeks 2, label "Work 3 of 5", fokus masuk                                                                   |
| `vault/webgl/material-image` | **dikecualikan.** Substansinya material WebGL di atas tekstur Sanity. Tanpa aset, `SanityImage` mengembalikan `null` dan story mendokumentasikan div kosong |
| `vault/webgl/scene-shell`    | **dikecualikan.** Diukur, bukan diasumsikan — lihat §5.4                                                                                                    |

Story yang **tidak** ditulis disebut di sini beserta alasannya, bukan diam-diam
dihapus dari cakupan (`CLAUDE.md` #21).

### 5.4 `scene-shell`: story ditulis, dijalankan, lalu ditarik

Story-nya ditulis dan lolos setiap gerbang — build hijau, nol error konsol, nol
page error, node ada di DOM. Lalu saya melihat screenshot-nya: **persegi rata,
tanpa gradien sama sekali.**

Tebakan pertama saya salah, dan dicatat karena itu bagian dari pelajarannya:
saya menyalahkan dekorator sendiri (`min-height` terhadap `.shell { height: 100% }`,
yang memang resolve ke nol) dan memperbaikinya. **Masih rata.** Baru setelah
mengukur DOM-nya:

```
webglAvailable  true          (SwiftShader di kontainer ini)
elemen          ._shell_      data-accent-live=""
canvas di dokumen             0
```

`.shell` memang **tidak mengecat apa pun sendiri** — ia mem-portal ke kanvas
bersama yang disediakan `Wrapper` situs, dan katalog tidak punya penyedia itu.
Jadi story-nya mengambil jalur WebGL, menandai dirinya hidup, dan menggambar
nol piksel.

Satu catatan, dan saya menyebutnya sebagai catatan **bukan** defek terkirim:
`data-accent-live` menyala walau tidak ada kanvas. Di situs, `Wrapper` selalu
menyediakan kanvasnya, jadi kondisi ini tidak pernah terjadi di halaman mana
pun. Ia hanya muncul tanpa penyedia. Saya tidak mengklaim lebih dari itu.

### 5.5 Satu alasan pengecualian yang saya tulis dan ternyata palsu

Draf pertama daftar pengecualian membenarkan `components/ui/sanity-image`
dengan: _"`vault/webgl/material-image` documents the same pipeline with a
fixture."_ Saat mengukur `material-image` sendiri, kalimat itu ternyata
**tidak benar** — ia tidak punya fixture dan tidak bisa punya. Dikoreksi
sebelum commit.

Itu persis bentuk kegagalan yang tahap ini soal: sebuah alasan yang terdengar
benar, tidak diperiksa terhadap apa pun, dan menua jadi klaim palsu di dokumen.
Bedanya kali ini ada yang memeriksanya dalam hitungan menit, bukan dua puluh
enam tahap.
