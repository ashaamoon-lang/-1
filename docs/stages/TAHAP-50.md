# Tahap 50 — `/studio`: anggarannya dibuat jujur dulu, lalu pernyataannya diberi ruang

> Tahap ini tidak membangun apa yang rencananya minta, dan itu bukan
> pengurangan cakupan. Ketiga sub-itemnya punya premis yang salah, dan yang
> ketiga menyembunyikan cacat akuntansi yang sudah berjalan 26 tahap.

## 1. Baseline, diukur

Build produksi, `HEAD` sesudah Tahap 49:

|                                 |                1440×900 |                 390×844 |
| ------------------------------- | ----------------------: | ----------------------: |
| Dokumen                         | 5708px = **6,34 layar** | 5421px = **6,42 layar** |
| Hero                            |  780px = **0,87 layar** |      754px = 0,89 layar |
| Seksi pernyataan                |               **212px** |                   247px |
| `data-epic` yang dideklarasikan |     `work-transport` ×3 |                    sama |

## 2. Tiga premis rencana, ketiganya salah

### 2.1 "Hero `nol` → 100svh" — hero **sudah** menahan layar pertama

`app/[locale]/studio/page.module.css` menyetel hero ke `calc(100svh - header)`
dan menulis alasannya, yang bukan alasan komposisi melainkan **alasan gerak**:

> _"Measured in Tahap 25 §2.2: the statement below was already a third
> revealed at `scrollY 0`, and no `start` value can fix that — a scroll-linked
> reveal on an element that is already on screen has already begun. The
> parameter was never the problem; the layout was."_

Terukur 780px dari 900px, yaitu tepat viewport dikurangi header 72px + padding.
Rencana ini menghitungnya sebagai **nol** karena `grep min-height` di Tahap 49
hanya menemukan `min-height: 44px` — target sentuh sebuah tombol, di baris 329.
**Tabel §0.6 rencana itu salah untuk `/studio`, dan salahnya milik saya.**

Hero tidak diubah. Menaikkannya ke `100svh` penuh akan mendorongnya 72px di
bawah lipatan, yang justru merusak properti yang membuat scrub di bawahnya
bekerja.

### 2.2 `sticky-stack` sudah ditolak, dengan argumen, di Tahap 42

`docs/stages/TAHAP-42.md` §2.2 menolaknya dan menulis sebabnya:
`step-sequence` **sudah** punya kolom tersemat plus indeks yang ditahan —
"versi yang sudah dipertimbangkan dari ide yang sama".

Satu dari dua alasan penolakan itu memang **sudah tidak berlaku**: waktu itu
`/studio` di plafon §9.5 dengan dua momen, dan Tahap 49 menaikkan plafonnya ke
tiga. Alasan yang lain tidak berubah, dan itu yang menentukan — menumpuk di
atas mekanisme yang sudah melakukan pekerjaan itu adalah **menumpuk demi
menumpuk**, yang Bagian IV rencana ini sendiri tolak sebagai "efek baru di
halaman yang belum punya isi".

Ditolak lagi, dengan rujukan ke penolakan pertama supaya tahap berikutnya
tidak menemukannya ketiga kali.

### 2.3 `/studio` tidak pernah menamai satu pun momen yang §9.5 klaim untuknya

Ini yang menentukan seluruh bentuk tahap ini.

`MOTION-SPEC.md` §9.5 mencantumkan dua momen untuk `/studio` sejak Tahap 24–25:
`studio-statement` (passage yang di-scrub) dan `studio-process` (indeks yang
ditahan). Dipindai seluruh repo:

```
$ grep -rn "data-epic" app components vault --include="*.tsx"
… app/[locale]/studio/page.tsx  →  data-epic`.        (hanya di dalam komentar)
```

**Nol penanda.** Dokumen mengklaim dua momen bernama pada rute yang DOM-nya
tidak pernah menamai satu pun — persis kelas cacat yang Tahap 40 temukan untuk
`project-arrival` dan Tahap 46 untuk klaim Theatre.

Dan yang **benar-benar** dideklarasikan bukan salah satu dari keduanya:

```
epics: ["work-transport", "work-transport", "work-transport"]
```

Ketiganya datang dari `ProjectCard` di strip bukti yang Tahap 44 tambahkan.
Kartu itu membawa penandanya ke mana pun ia dirender, dan §9.5 tidak pernah
diperbarui.

## 3. Konsekuensinya: `/studio` sudah penuh, jadi `studio-manifesto` tidak dibangun

Setelah ketiganya dinamai dengan jujur, `/studio` berada di **tiga**:

| Momen              | Apa                                             |
| ------------------ | ----------------------------------------------- |
| `studio-statement` | Passage yang di-scrub — pernyataan studio       |
| `studio-process`   | Indeks yang ditahan — `step-sequence`           |
| `work-transport`   | Kartu bukti yang berpindah ke halaman proyeknya |

Tiga adalah plafon yang Tahap 49 naikkan untuk rute ini. **Ia sudah
dibelanjakan seluruhnya oleh momen yang nyata**, dan `studio-manifesto` akan
jadi yang keempat.

Menaikkan plafon lagi untuk memuatnya akan membuat angka itu berhenti berarti
apa-apa — yang persis alasan Tahap 49 menolak menaikkannya di ketujuh rute.
Jadi jawabannya bukan momen keempat.

**Yang diminta pemilik — "animasi panjang di tempat penting" — sudah ada di
halaman ini, dan itu premis keempat yang salah.**

Diukur, bukan diperkirakan:

| Momen                               | Rentang                                                    |
| ----------------------------------- | ---------------------------------------------------------- |
| `studio-process` (`step-sequence`)  | 4 langkah × 558px = **2232px = 2,48 layar**                |
| `studio-statement` (`ProgressText`) | tinggi elemen + 0,7×viewport = 150 + 630 = **780px gulir** |
| Hero                                | 780px = 0,87 layar                                         |

`studio-process` **sudah** animasi panjang halaman ini: dua setengah layar
indeks yang ditahan untuk empat langkah proses studio. Menambah yang keempat,
atau memanjangkan yang lain, adalah menambah gerak ke halaman yang sudah
paling terkoreografi kedua di situs ini setelah `/`.

## 4. Yang dibangun

**4a — Ketiga momen dinamai di DOM.** `data-epic="studio-statement"` dan
`data-epic="studio-process"`, dan §9.5 mencatat `work-transport` sebagai
penghuni ketiga rute ini. Pertama kalinya anggaran rute ini bisa diukur.

**4b — Pernyataan tidak disentuh, dan itu premis kelima yang salah.**

Draf spec ini merencanakan "beri pernyataan ukur baca dan ruang", dengan alasan
212px untuk sembilan puluh kata berarti ia disetel selebar kolomnya. Diukur
langsung:

```
words 90 · chars 476 · width 720px · height 150px · lines 6
font 20.0064px / line-height 25.008px · max-width 720px (= 60ch)
```

`.statement` **sudah** membawa `max-width: 60ch` dengan alasan tertulis:
_"Wider than the lead because this is the passage the scrub moves through, and
a narrow column would turn ~100 words into a very tall thin block that scrolls
past before the effect resolves."_ Ukurnya sudah keputusan, dan keputusan itu
dibuat dengan pengukuran.

Menaikkan tipenya ke `h3` juga ditolak: `h3` membawa `font-weight: 600`, dan
sembilan puluh kata pada bobot display terbaca sebagai teriakan. Mencampur
ukuran `h3` dengan bobot `p-big` akan menciptakan **gaya tipe keempat di luar
sistem** — persis 54 `font-size` liar yang Tahap 37 harus bersihkan.

Nilai `start`/`end` `ProgressText` juga tidak disentuh: Tahap 25 §2.2
menetapkannya dengan angka.

**4c — Ground halaman.** `dot-pattern` + `noise-texture`, kategori ketiga,
tidak dihitung §9.5. `/studio` adalah permukaan pernyataan, dan `dot-pattern`
adalah ground yang `vault/magic/README.md` sudah tetapkan untuk permukaan baca
— sedangkan kisi menegaskan struktur, yang salah di sini.

## 5. Gerbang

| Gerbang                          | Menuntut                                                        |
| -------------------------------- | --------------------------------------------------------------- |
| `e2e/interaction-grammar.e2e.ts` | `/en/studio` mendeklarasikan **tiga** nama dan tidak lebih      |
| `e2e/reveal-coverage.e2e.ts`     | Judul yang pindah ke dalam momen bernama tetap terumumkan       |
| `contrast.test.ts` + axe         | Ground tidak menurunkan kontras pernyataan                      |
| `e2e/route-budget.e2e.ts`        | `/en/studio` tetap di bawah 900KB, atau dinaikkan dengan alasan |

## 6. Hasil

### 6.1 Lima premis, lima kali salah

Ini rekor untuk satu tahap, dan tiap koreksinya punya angkanya:

| #   | Premis                                  | Kenyataan terukur                                                           |
| --- | --------------------------------------- | --------------------------------------------------------------------------- |
| 1   | Hero `/studio` nol tinggi               | **780px = 0,87 layar** (`100svh − header`), dan itu syarat gerak bukan gaya |
| 2   | `sticky-stack` akhirnya dipakai         | Ditolak di Tahap 42 §2.2 dengan argumen yang masih berlaku                  |
| 3   | `studio-manifesto` sebagai momen ketiga | Rute **sudah** di tiga; yang ketiga (`work-transport`) hanya belum tercatat |
| 4   | `/studio` butuh animasi panjang         | `studio-process` **sudah 2232px = 2,48 layar**                              |
| 5   | Pernyataan butuh ukur baca              | Sudah `max-width: 60ch` dengan alasan tertulis, 6 baris, 720px              |

Pola yang sudah cukup konsisten untuk jadi metode, dan tahap ini adalah
contoh terkuatnya: **halaman ini sudah dikerjakan dengan baik, dan hampir
setiap "perbaikan" yang direncanakan akan merusaknya.**

### 6.2 Cacat akuntansi berumur 26 tahap

`MOTION-SPEC.md` §9.5 mencantumkan dua momen untuk `/studio` sejak Tahap 25.
Diukur sebelum tahap ini:

```
epics: ["work-transport", "work-transport", "work-transport"]
```

**Nol dari dua yang diklaim, dan satu yang tidak diklaim.** Ketiga
`work-transport` datang dari `ProjectCard` di strip bukti Tahap 44 — kartu itu
membawa penandanya ke mana pun ia dirender, dan tabelnya tidak pernah
diperbarui.

Sesudah:

```
epics: ["studio-statement", "work-transport" ×3, "studio-process"]
```

Tiga nama berbeda, tepat di plafon yang Tahap 49 naikkan. §9.5 mencatat
`work-transport`, dan menulis bahwa rute ini **penuh**.

Konsekuensi yang perlu dikatakan terus terang: plafon yang Tahap 49 naikkan
untuk `/studio` **sudah habis terpakai oleh momen yang sudah ada**. Ia tidak
membeli ruang untuk sesuatu yang baru di rute ini; ia hanya membuat yang sudah
ada bisa dihitung.

### 6.3 Yang dibangun

Satu hal saja, di luar penamaan: **ground halaman** — `dot-pattern` +
`noise-texture`, kategori ketiga, tidak dihitung §9.5.

Dots dan bukan kisi, dan itu keputusan yang `vault/magic/README.md` sudah
tetapkan: kisi menegaskan struktur, yang benar di beranda tempat kolom studio
**adalah** ceritanya. Halaman ini klaim dalam prosa, dan titik hanya
mengatakan "ini permukaan".

`position: fixed`, bukan `absolute`. Halaman ini 6,34 layar, dan grain yang
ikut menggulir terbaca sebagai tekstur **yang ditempelkan pada** isi; grain
yang diam terbaca sebagai permukaan yang isinya lewati — yang persis kelakuan
kertas.

### 6.4 Verifikasi

```
bun run check        lulus — unit 421 lulus
bun run build        lulus
build-storybook      lulus — 103 story, tidak berubah
CI=true test:e2e     569 lulus, 0 gagal, 0 flaky, 14 dilewati (12,6m)
```

**Satu tes berpindah dari dilewati ke lulus, dan sebabnya bukan tahap ini.**
568 + 15 dan 569 + 14 sama-sama 583, jadi tidak ada asersi yang datang atau
pergi — satu berpindah kolom:

```
[mobile] visual-substance › /en/work keeps its footer out from under the canvas
```

Tahap ini tidak menyentuh `/work` sama sekali. Tes itu melewati dirinya
sendiri ketika tidak menemukan kanvas, dan pada lebar ponsel kanvas `/en/work`
kadang belum mount saat ia memeriksa. Ia **lulus** ketika berjalan.

Dicatat sebagai **kelemahan instrumen yang terbuka, bukan diperbaiki di
sini**: memperbaikinya berarti menunggu kanvas dengan benar, yang merupakan
perubahan pada gerbang `/work` — wilayah Tahap 51. Sebuah tes yang melewati
dirinya sendiri secara intermiten adalah tes yang kadang tidak mengukur apa
pun, dan itu persis bentuk cacat yang §6.5b Tahap 49 catat.

Dokumen `/studio` tetap 5708px — ground `fixed` tidak menambah tinggi apa pun,
dan tidak ada yang lain berubah strukturnya.

### 6.5 Yang tidak dikerjakan, dan itu seluruh isi tahap ini

- **`studio-manifesto`** — rute penuh (§6.2). Momen keempat akan membuat
  plafon berhenti berarti apa-apa, yang persis alasan Tahap 49 menolak
  menaikkannya di ketujuh rute.
- **`sticky-stack`** — ditolak untuk kedua kalinya, dengan rujukan supaya
  tahap berikutnya tidak menemukannya ketiga kali.
- **Hero tidak disentuh** — sudah menahan layar pertama, dan menaikkannya ke
  `100svh` penuh justru akan mendorongnya 72px di bawah lipatan dan merusak
  properti yang membuat scrub di bawahnya bekerja.
- **Tipe pernyataan tidak dinaikkan** — `h3` membawa bobot 600, dan mencampur
  ukurannya dengan bobot `p-big` akan menciptakan gaya tipe keempat di luar
  sistem.
- **`start`/`end` `ProgressText` tidak disentuh** — Tahap 25 §2.2
  menetapkannya dengan pengukuran.

Tahap yang sebagian besar isinya adalah penolakan bukan tahap yang gagal.
`CLAUDE.md` menutup dengan **do less, and do it more precisely**, dan halaman
yang sudah benar adalah halaman yang paling mudah dirusak dengan niat baik.
