# Tahap 68 — Gerbang yang seharusnya menangkap Tahap 67, dan empat versinya yang salah

> Tahap 67 menemukan prop yang dibangun lengkap dan **tidak pernah dioper
> selama lima puluh lima tahap**, dan tidak satu pun dari delapan puluh delapan
> berkas gerbang repo ini — 42 e2e dan 46 unit — bisa melihatnya. Tahap ini
> membangun yang bisa, dan sebagian besar isinya adalah catatan tentang empat
> kali saya membangunnya salah.

## 1. Kenapa tidak ada gerbang yang bisa melihatnya

Setiap gerbang di repo ini mengukur apa yang halaman **lakukan**: kontras,
gerak, bobot rute, axe, komposisi yang tergambar. Tidak satu pun bisa melihat
kapabilitas yang tidak pernah diminta, karena **elemen yang tidak dirender
tidak bisa dibedakan dari desain yang memang tidak menginginkannya**.

Itu sebabnya `Hero.index` bertahan: prop-nya bertipe, markup-nya ada, CSS-nya
ada, labelnya ada di kedua kamus, dan tiga dokumen menggambarkan hasilnya —
dan halamannya hanya tidak memanggilnya. Semua hijau, selamanya.

Pertanyaan "apakah prop yang dideklarasikan punya pemanggil" bukan soal selera,
tidak butuh browser, dan **persis hal yang salah**.

## 2. Empat versi yang salah, dan masing-masing hijau di atas cacat yang nyata

Ini bagian terpenting dokumen ini. Empat kali saya menulis detektor, menjalankan,
melihat hijau, dan menyimpulkan bersih. Setiap kali cacatnya masih ada.

| versi | mekanisme                         | kenapa hijau padahal cacatnya ada                                                                                                                       |
| ----- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | cari nama prop di seluruh repo    | `project-gallery` mengoper `index={index}` ke lightbox — prop bernama `index` apa pun tampak terpakai                                                   |
| 2     | + dikecualikan modul pendeklarasi | melewatkan `{...(x && { portraitAlt })}`, bentuk spread-kondisional yang repo ini pakai di mana-mana. Melaporkan prop yang **selalu** dioper            |
| 3     | + bentuk spread                   | melewatkan `<ProjectHero material` yang diikuti komentar — boolean shorthand. Melaporkan prop yang Tahap 58 dan 59 habiskan dua tahap untuknya          |
| 4     | + pemindai kurung sadar-kutip     | prosa. `"the headline's 9em measure"` membuka kutip yang tidak pernah tutup; satu `<Hero` menghasilkan region **5700 karakter** dan menelan sisa berkas |

Dan satu lagi di luar tabel: versi 4 memindai **berkas uji ini sendiri**, yang
ada di bawah `vault/` dan yang contoh-contohnya berisi tag `<X …>`. Ia menjamin
prop yang seharusnya ia awasi.

**Pelajarannya bukan "hati-hati".** Ia: sebuah gerbang yang tidak bisa gagal
pada cacat yang melahirkannya lebih buruk daripada tidak ada gerbang, karena ia
mengubah pertanyaan terbuka jadi jawaban palsu. Empat kali saya hampir
mengirimkannya.

## 3. Versi kelima bertanya ke parser

`oxc-parser` — mesin yang sama yang `oxlint` jalankan, jadi AST-nya adalah AST
yang langkah lint sudah percayai. Boolean shorthand, spread, dan JSX di dalam
ekspresi jadi simpul biasa, bukan kasus khusus.

`typescript` **tidak bisa** dipakai untuk ini: versi 7.0.2 di repo ini adalah
port Go, dan `exports["."]`-nya menunjuk `lib/version.cjs` — compiler API yang
klasik tidak ada di sana.

`oxc-parser` sebelumnya transitif lewat `oxlint`. Dideklarasikan eksplisit di
`devDependencies` (0.127.0), karena gerbang yang bergantung pada tepi transitif
akan rusak diam-diam saat tepi itu berubah.

**Dibuktikan merah pada keadaan pra-Tahap-67 yang persis** — `index` dihapus
dari halaman **dan** dari story-nya, yang memang keadaan sebenarnya saat itu:

```
vault/blocks/hero/index.tsx declares `index` and no <Hero> passes it
10 lulus, 1 gagal
```

Dikembalikan: 11 lulus.

### 3.1 Dua jalan tersisa untuk kembali diam, dan keduanya ditutup

**Yang pertama: pohon terpotong.** `oxc-parser` **toleran terhadap galat**:
sumber yang tidak bisa ia baca menghasilkan pohon terpotong plus daftar galat,
bukan lemparan. Titik panggil di balik potongan itu lalu terbaca "tidak
mengoper apa pun" — dan gerbangnya mulai mengarang cacat pada prop yang
sebenarnya dioper. Persis kegagalan empat versi pertama, kembali dengan parser
di depannya.

Diukur hari ini: 147 berkas di bawah `app/`, `vault/` dan `components/`
menyambung jadi **773.939 karakter** dan parse dengan **nol galat**. Jadi
penjagaannya gratis hari ini, dan baru berarti di hari itu berhenti benar —
saat itu pesannya menyebut parser-nya, bukan menyalahkan sebuah halaman.

Dibuktikan merah dengan cara yang sama: penjagaan dilepas, uji ke-12 gagal
(11 lulus, 1 gagal); dikembalikan, 12 lulus.

**Yang kedua: modul yang tidak terlihat sama sekali.** Sisi deklarasi masih
regex — ia membaca `interface …Props { … }`. Sebuah modul yang menulis
`type HeroProps = { … }`, atau mengetik propnya inline di tanda tangannya,
menyumbang **nol** prop. Dan **prop yang tidak pernah terkumpul tidak akan
pernah bisa dilaporkan hilang**: gerbangnya tinggal hijau di atas persis cacat
yang melahirkannya. Itu versi kelima dari kesalahan yang sama.

Diukur: **30 dari 30** modul di bawah `ROOTS` yang mengekspor komponen
mendeklarasikan `*Props` sebagai interface, dan nol memakai alias tipe. Jadi
uji ini menegakkan konvensi yang repo ini **sudah** pegang, bukan memaksakan
yang baru — dan di hari seseorang keluar darinya, pesannya menyebut modulnya
dan apa yang harus dilakukan, alih-alih sapuannya diam-diam menyusut.

Dibuktikan merah dengan mengubah `HeroProps` jadi alias tipe: **2 gagal** dari
13 — penjagaan barunya, dan smoke test-nya ikut menangkap, yang memang
tugasnya. Dikembalikan: 13 lulus.

## 4. Dua puluh satu prop tanpa pemanggil, dan keduapuluhsatunya sah

Daftar `DELIBERATE` adalah inti gerbangnya, bukan lubang di dalamnya: knob
dengan default yang bekerja adalah hal yang berbeda dari kapabilitas yang tidak
pernah disambungkan, dan satu-satunya cara membedakannya adalah seseorang
mengatakannya di sana.

| prop                                                                                                                                         | kenapa tidak dioper                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `noise-texture:frequency/octaves/slope`, `grid-pattern:squares/strokeDasharray/x/y`, `dot-pattern:cr/cx/cy/x/y`, `pixel-image:grid` — **13** | permukaan API Magic UI yang di-vendor; default-nya yang dipakai situs ini     |
| `page-transition:maxWait`                                                                                                                    | plafon pengaman, bukan fitur                                                  |
| `project-grid:preloadCount`                                                                                                                  | default performa yang disetel di dalam bloknya                                |
| `magnetic:radius/strength`                                                                                                                   | rasa magnet disetel sekali di primitifnya, bukan per titik panggil            |
| `text-reveal:once`                                                                                                                           | default **adalah** gaya rumah; replay tiap masuk viewport justru tanda amatir |
| `text-reveal:start`                                                                                                                          | pita default; `ProgressText` yang punya versi kustomnya                       |
| `icon:title`                                                                                                                                 | `aria-hidden` benar di sini — tiap ikon punya induk berlabel                  |
| `studio-note:eyebrow`                                                                                                                        | sengaja dihilangkan di `/`, alasannya ada di titik panggilnya                 |

Tiga belas dari dua puluh satu adalah permukaan Magic UI yang di-vendor, dan **delapan** sisanya keputusan proyek ini sendiri.

**Nol cacat baru.** Tahap 67 sudah memperbaiki satu-satunya yang nyata, dan
gerbang ini nilainya ke depan, bukan panen hari ini. Mengatakannya begitu lebih
jujur daripada mengarang temuan supaya tahapnya terasa penuh.

## 5. Dua namespace yang tidak pernah dimuat

Sapuan kunci kamus menemukan `work.*` dan `meta.*` tanpa satu pun
`getTranslations('work')` atau `('meta')`. **Tapi bentuk bertitik hampir
menipu saya lagi**: `app/[locale]/layout.tsx:288` memanggil
`t('work.viewProject')` dari namespace induk, yang pemeriksaan namespace saya
tidak lihat.

Diperiksa satu per satu, keenam kunci:

```
work.sectionTitle  0     work.viewProject  2     work.nextProject  0
meta.client        0     meta.year         0     meta.medium       0
```

Lima dihapus dari kedua kamus; `work.viewProject` tinggal. `project.client`,
`project.year` dan `project.nextProject` adalah yang menggantikan `meta.*` dan
memang terpakai.

## 6. Gerbang

`vault/vault-api.test.ts`, berjalan di `bun test` dan karenanya di
`bun run check`:

| menuntut                                                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------------- |
| tiap prop opsional di `vault/**/index.tsx` punya `<Component prop=…>` di suatu tempat, atau baris di `DELIBERATE` dengan alasannya |
| parser-nya masih melihat `Hero.index` — smoke test agar parser rusak tidak lulus diam-diam                                         |
| enam bentuk oper prop yang repo ini tulis, masing-masing satu uji                                                                  |
| spread buram (`{...rest}`) dihitung memasok apa pun — invented defect lebih mahal daripada yang dicari                             |
| sapuan konsumen yang tidak parse utuh **menolak menjawab** alih-alih melapor dari pohon terpotong                                  |
| tiap modul `vault/` yang mengekspor komponen mendeklarasikan `interface …Props`, agar tidak ada modul yang tak terlihat            |
