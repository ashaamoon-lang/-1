# Tahap 65 — Subjeknya ada sejak Tahap 24, di halaman yang salah dicari

> `DIREKSI.md` §2.3 meminta tiga hal: kapabilitas sebagai sekuens ter-pin,
> angka yang membangun dirinya, prose yang terungkap mengikuti gulir.
> **Ketiganya sudah punya mekanismenya di repo ini.** Yang belum ada adalah
> subjek untuk yang pertama — dan `docs/stages/TAHAP-52.md` §2.1 menolaknya
> karena tidak menemukannya. Dokumen ini menemukannya.

## 1. Tiga ide, dan siapa yang sudah mengerjakannya

| ide `DIREKSI.md` §2.3           | mekanisme                          | konsumen sebelum tahap ini     |
| ------------------------------- | ---------------------------------- | ------------------------------ |
| kapabilitas sebagai sekuens     | `vault/blocks/step-sequence`       | 1 — `/studio`                  |
| angka yang membangun dirinya    | `vault/motion/counter`             | 2 — `/work`, `/journal`        |
| prose terungkap mengikuti gulir | `components/effects/progress-text` | 2 — `/practice/<v>`, `/studio` |

Jadi tahap ini bukan "bangun tiga mekanisme". Ia pola Tahap 63 sekali lagi:
mesin yang ada dibelanjakan di tempat informasinya masih datar, dengan
penolakan **tertulis** di tempat yang tidak.

## 2. Premis, diperiksa

### 2.1 ✅ Daftar kapabilitas itu ada — di `messages/`, bukan di rute mana pun

`TAHAP-52.md` §2.1 menulis, dan bacaannya atas berkasnya benar:

> _"Tidak ada daftar kapabilitas. Tidak ada tiga bagian. Butir ini bukan
> 'ditunda' — ia tidak punya subjek. Ditolak."_

Yang tidak diperiksa saat itu adalah katalog pesannya. `messages/en.json` dan
`messages/id.json` sudah membawa daftarnya sejak Tahap 24:

```
studio.capabilities.consulting   Architecture review · System mapping · Technical due diligence · Decision records
studio.capabilities.ai-data      Evaluation harnesses · Retrieval pipelines · Data modelling · Production guardrails
studio.capabilities.commission   Design systems · Interface build · Motion and interaction · Handover documentation
```

**Dua belas butir informasi, tersimpan sebagai tiga string**, dan tayang hanya
di `/studio` sebagai tiga baris `caption`. Itu subjek yang §2.1 cari.
Penolakan itu benar tentang `app/[locale]/practice/[value]/page.tsx` dan salah
tentang repo ini — dan bedanya penting, karena yang dikirim tahap ini adalah
**bentuknya, bukan kata-katanya**. Nol entri karangan.

### 2.2 ❌ Restrukturisasi katalog pesan — dicoba, tidak bisa dikompilasi

Bentuk yang jelas lebih rapi adalah empat kunci bernama per praktik
(`capabilities.consulting.review`, `.mapping`, …) supaya `t()` menjangkau tiap
butir langsung. **Ia tidak lolos tipe di tempat yang membutuhkannya.**

Halaman memetakan `PRACTICES`, jadi di titik panggil `practice` adalah seluruh
union, dan ``t(`capabilities.${practice}.${item}`)`` memuai jadi **hasil kali**
tiga praktik × dua belas nama butir — 36 kunci, yang ada 12. TypeScript tidak
bisa mengorelasikan dua paruh itu lewat `.map()`. Bentuk yang tampak lebih
bertipe justru yang butuh cast untuk lolos.

Nama slot seragam (`one`…`four`) lolos tipe dan lebih buruk dua kali: ia tidak
mengatakan apa-apa, dan ia **menomori himpunan tak berurutan** — persis yang
`step-sequence` catat sebagai ditolak proyek ini.

Jadi katalog pesannya **tidak disentuh sama sekali**, dan `capabilityItems()`
di `lib/content/practices.ts` membaca satu barisnya kembali jadi butirnya.
Konsekuensinya lebih baik dari rencananya: `/studio` **terbukti** tidak berubah
karena kodenya tidak berubah, tidak ada regen `en.d.json.ts`, dan jaminannya
pindah ke uji yang menuntut kedua locale pecah jadi jumlah yang sama — sesuatu
yang nama kunci tidak bisa janjikan.

### 2.3 ❌ `StepSequence` tidak dipakai ulang, dan alasannya aturan repo ini sendiri

Blok itu tetangga terdekatnya — label tertahan, butir yang mundur, hook yang
sama di bawahnya — dan memakainya ulang cukup satu import. Ia memasang
penghitung `01 / 04`, dan doc comment-nya sendiri menulis aturan yang membuat
penghitung itu benar di sana dan salah di sini: penanda bernomor milik daftar
yang urutannya membawa informasi. Proses studio berurutan — menentukan scope
membatasi apa yang bisa diputuskan. "Architecture review" dan "Decision
records" bukan urutan.

Yang **dipakai ulang** adalah mekanismenya: `vault/motion/use-active-in-sequence`,
hook yang sama, karena "yang mana yang sedang dibaca" adalah pertanyaan yang
proyek ini jawab di satu tempat.

### 2.4 ⚠️ Tinggi hero: tidak dijanjikan, diukur

Rencana produksi menulis `/practice/<v>` naik 70% → 100svh "karena lapisannya
masuk". `TAHAP-52.md` §4a sudah menolaknya dengan angka. §4c di bawah mengukur
ulang sesudah lapisannya benar-benar masuk, dan melaporkan hasilnya apa adanya.

## 3. Baseline, diukur sebelum satu baris kode

Build produksi, `HEAD` sesudah Tahap 64. Angkanya **mereproduksi `TAHAP-52.md`
§4a persis**, yang berarti rute ini tidak bergerak sejak tahap itu:

```
1440×900   doc 3030px (3,37 layar)   hero 110–740 = 630px = 70%   h1 542–644 (60%)   pernyataan atas 788 = 88%   garis reveal 675
 390×844   doc 2992px (3,55 layar)   hero  78–669 = 591px = 70%   h1 549–582 (65%)   pernyataan atas 701 = 83%   garis reveal 633
[data-epic] practice-morph, practice-statement, work-transport ×2
```

## 4. Yang dikirim

### 4a — `capabilityItems()`, dan uji yang menjaganya

`lib/content/practices.ts` mendapat `CAPABILITY_SEPARATOR` dan
`capabilityItems()`. `lib/content/practices.test.ts` mendapat dua uji:
tiap praktik punya barisnya di kedua locale, dan kedua katalog pecah jadi
**jumlah yang sama**.

**Dibuktikan merah lebih dulu**, dua bentuk kegagalan yang berbeda:

```
satu butir dihapus dari id.json      → "the two dictionaries disagree"  [4,4,4] vs [3,4,4]
satu praktik dihapus dari id.json    → dua uji merah sekaligus
dikembalikan                          → 8 lulus
```

`/studio` tidak disentuh. Itu bukan kelalaian melainkan hasil dari §2.2: ia
tetap menampilkan barisnya utuh sebagai ringkasan, dan halaman praktik
menampilkan butirnya sebagai pernyataan. Satu konten, dua bentuk — yang memang
tesis tahap ini.

### 4b — `vault/blocks/capability-set`, dan satu cacat cascade yang ditemukan dengan mengukurnya

Blok baru: label tertahan (`position: sticky`), empat kapabilitas sebagai tipe
terbesar di layar, yang sedang dibaca penuh dan sisanya mundur ke 0,7.

**Proporsinya dibalik dari `step-sequence`, dan itu keputusan.** Sebuah step di
sana membawa judul _dan_ paragraf; sebuah kapabilitas dua-tiga kata. Dengan
tata letak step, empat butir jadi empat layar yang hampir kosong. Jadi butirnya
yang jadi tipe display, dan kolom ter-pin yang jadi cetakan kecil. Tingginya
46svh per butir, bukan 62svh — lebih pendek dengan sengaja, yang justru
mengharuskan pin-nya **diukur** alih-alih diasumsikan.

**Cacat yang ditemukan karena diukur.** Pemasangan pertama melewatkan
`className={s.section}` ke blok itu. `.section` halaman ini adalah
`display: flex; flex-direction: column`; `.set` blok itu jadi grid di dalam
`@media (--desktop)`. Media query tidak menambah spesifisitas, jadi deklarasi
halaman menang dan blok itu tata letaknya jadi flex column. Pembungkus
ter-pin-nya lalu menyusut ke kontennya — persis kegagalan containing block yang
`step-sequence` catat: elemen sticky yang containing block-nya setinggi dirinya
sendiri tidak punya rentang sama sekali.

```
dengan className={s.section}    kolom: 200 → -1357 di seluruh bagian   held   0px
tanpa                            kolom: 115 tetap di 11 perhentian      held 1349px
```

`/studio` memberi `StepSequence` nol class untuk alasan yang sama. Blok yang
membawa tata letaknya sendiri tidak diberi pendapat kedua tentangnya.

### 4c — Terukur di browser nyata, build produksi

Pin dan lead, 1280×800, tiga belas perhentian melintasi bagian itu:

```
bagian atas 973   tinggi 1472px (1,84 layar)
kolom ter-pin     115px, tetap di 11 perhentian berturut-turut   held 1349px   (ambang >800)
lead              4 nilai berbeda (0,1,2,3)                                    (ambang ≥3)
yang memimpin     tepat 1 di setiap perhentian, tanpa kecuali
opacity           mundur 0,70 · memimpin 1,00
```

Reduced motion, viewport yang sama:

```
                 bagian    dokumen   kolom     opacity keempat butir   tergambar
no-preference    1472px     4272     sticky    1,00 0,70 0,70 0,70     ya
reduce            396px     3196     static    1,00 1,00 1,00 1,00     ya
```

Isinya berakhir **terlihat penuh**, dan tingginya ikut hilang. Bagian kedua itu
yang `step-sequence` tidak lakukan, dan bedanya kontennya: step-nya membawa
paragraf, jadi panjangnya tetap permukaan baca dengan gerak dimatikan. Empat
pernyataan dua kata pada 46svh, tanpa apa pun yang memimpin di antaranya,
adalah dua layar halaman kosong yang dibeli efek yang tidak berjalan.

**Geometri hero sesudah lapisannya masuk — dan §2.4 dijawab:**

```
1440×900   doc 3030 → 4734px (3,37 → 5,26 layar)   hero 630 = 70%   h1 542–644   pernyataan atas 788
 390×844   doc 2992 → 3442px (3,55 → 4,08 layar)   hero 591 = 70%   h1 549–582   pernyataan atas 701
```

**Hero, `h1` dan pernyataan tidak bergerak satu piksel pun**, karena lapisan
yang ditambahkan duduk di bawah ketiganya. Maka batas `TAHAP-52.md` §4a tetap
berlaku persis seperti adanya: pernyataan harus mendarat ≤675px, dan dengan
jarak 48px antara hero dan pernyataan itu berarti hero ≤ ~70% layar.

**Tinggi hero tidak dinaikkan, kedua kalinya, dan sekarang dengan lapisannya
benar-benar terpasang.** `DIREKSI.md` §2.1 menulis tinggi naik "sebagai akibat
di tahap yang memasukkan lapisannya" — tahap ini memasukkan lapisannya, dan
akibatnya tidak datang. Rute ini sudah di plafon yang tata letaknya izinkan,
dan yang ditambahkan bukan udara di atas melainkan dua layar yang dibaca.

## 5. Gerbang

| Gerbang                            | Menuntut                                                                                                                            |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `e2e/practice-capabilities.e2e.ts` | **baru** — pin bertahan >800px, lead ≥3 nilai, tepat satu memimpin, reduced motion penuh dan lebih pendek, axe dari dalam bagiannya |
| `lib/content/practices.test.ts`    | dua belas butir ada di kedua locale, dan pecah jadi jumlah yang sama                                                                |
| `e2e/epic-sequence.e2e.ts`         | `practice-capabilities` tidak berbagi rentang dengan momen bernama lain                                                             |
| `e2e/interaction-grammar.e2e.ts`   | rute ini 3 → 4 dari plafon 12. **Plafon tidak dinaikkan**                                                                           |
| `e2e/no-javascript.e2e.ts`         | ketiga `/practice/<v>` merender keempat butirnya server-side                                                                        |
| `e2e/route-budget.e2e.ts`          | rute ini `maxKb: 900`                                                                                                               |
| `e2e/navigation-landing.e2e.ts`    | `h1` tetap mendarat di layar pertama                                                                                                |

Gerbang barunya **dibuktikan merah lebih dulu**, dan dengan cacat yang nyata
alih-alih stub: `className={s.section}` dikembalikan, dibuild ulang, dan
dijalankan.

```
1 gagal — "the column held for 0px against an 800px viewport"
5 lulus  — lead, satu-yang-memimpin, ketiga rute × dua bahasa, reduced motion, axe
```

Lima yang tetap hijau mengukur klaim yang berbeda dan memang tidak rusak oleh
cacat itu; yang merah adalah tepat klaim yang dilanggar. Gerbang yang merah
di semua hal saat satu hal rusak tidak memberi tahu apa yang rusak.

## 6. Hasil

### 6.1 Verifikasi

```
bun run check        lulus — unit 427 lulus, 0 gagal (424 → 427)
bun run build        lulus
build-storybook      lulus
CI=1 test:e2e        652 lulus, 0 gagal, 14 dilewati (19,0m)   [644 → 652]
```

Storybook dibangun ulang **sesudah** menyentuh `vault/` dan **sebelum**
menjalankan suite — `storybook-a11y.e2e.ts:218` menangkap urutan yang salah itu
di Tahap 63, dan kali ini tidak perlu menangkapnya.

### 6.2 Keyboard, diukur bukan diargumentasikan

Rencananya menuntut "navigasi keyboard saja melintasi tiap bagian ter-pin".
Dijalankan, 1440×900, 24 kali Tab dari atas halaman:

```
elemen fokusable di dalam bagian ter-pin   0
fokus terperangkap di dalam set             0
fokus terdampar di luar layar               0  (selain body saat membungkus ulang)
Tab dari breadcrumb                         → kartu pertama kisi proyek, scrollY 0 → 2862, y=19
```

Pin ini tidak mencegat keyboard karena dua hal, dan keduanya bisa diperiksa:
bagiannya tidak membawa satu pun kontrol, dan tahanannya CSS `position: sticky`
— bukan GSAP `pin`, yang menulis ulang posisi gulir. Yang tersisa jujur untuk
dikatakan: **pembaca keyboard melompati bagian ini**, karena ia prosa dan bukan
kontrol. Urutan dokumennya benar (`<ul>` duduk antara pernyataan dan kisi), jadi
ia terbaca oleh setiap mekanisme baca yang normal; ia hanya tidak punya
perhentian tab, yang memang benar untuk konten non-interaktif.

### 6.3 Bobot rute

`route-budget` hijau pada plafon **900 KB yang tidak dinaikkan**. Pengukuran
independen saya di container ini — jumlah body respons tanpa kompresi pada muat
dingin 1280×800 — membaca **445 KB** untuk `/en/practice/consulting`. Angka itu
**tidak sebanding** dengan garis dasar 874 KB di doc comment `route-budget`,
yang menghitung dengan cara lain; ia ditulis di sini sebagai pengukuran
terpisah, bukan sebagai klaim bahwa rutenya turun setengah. Yang bisa
dinyatakan: gerbangnya lulus tanpa plafonnya disentuh.

### 6.4 Kejujuran tentang tahap ini

**Penyimpangan dari rencana yang disetujui, dan ia ditemukan dengan mencoba.**
Rencananya menulis restrukturisasi `messages/*.json` jadi empat kunci bernama
per praktik. Itu tidak bisa dikompilasi (§2.2), dan bentuk yang dikirim justru
lebih kecil dan lebih terjaga: katalog pesan nol perubahan, `/studio` nol
perubahan, dan jaminannya di uji alih-alih di nama kunci.

**Satu cacat saya sendiri, ditemukan karena diukur.** `className={s.section}`
mematikan seluruh pin dan **tidak terlihat sebagai rusak** — bagiannya tetap
tergambar, butirnya tetap memimpin bergantian, hanya kolomnya ikut menggulir.
Itu persis bentuk kegagalan yang tahap-tahap ini terus temukan ulang: sesuatu
yang bergerak dengan benar dan tidak pernah ditemui. Yang menangkapnya bukan
mata melainkan angka, dan gerbangnya sekarang menangkapnya untuk yang berikut.

**Satu penolakan, kedua kalinya, dan sekarang tanpa alasan untuk menundanya
lagi.** Tinggi hero `/practice/<v>` tidak dinaikkan. `DIREKSI.md` §2.1
mensyaratkan tinggi naik "di tahap yang memasukkan lapisannya"; tahap ini
memasukkan lapisannya, mengukur, dan akibatnya tidak datang — jadi klaim di
dokumen itu diperbaiki alih-alih dibiarkan menunggu tahap berikutnya
membuktikannya lagi.

**Yang tidak dikerjakan, dan alasannya.**

1. **Fakta studio tidak menghitung dirinya.** `counter` beranimasi saat
   berubah, tidak pernah saat tiba — doc comment-nya sendiri dan entri ROADMAP
   Tahap 63. Dan `studio.factsNote` menyatakan tiga dari empat fakta itu
   perancah; menganimasikan angka karangan adalah menyorot karangannya.
2. **Sticky-stack ditunda.** Rencana Tahap 64 menjanjikannya dan Tahap 64
   tidak mengirimnya — dicatat, bukan didiamkan. Himpunan kartu sebentuk
   satu-satunya yang cocok duduk persis sesudah pin `studio-process` di
   `/studio` (dua pin beruntun di satu halaman), dan daftar di beranda dijaga
   `e2e/no-javascript.e2e.ts` sebagai `<details>` tanpa JavaScript. Syarat yang
   membuatnya benar: sebuah permukaan dengan ≥3 kartu sebentuk, berisi, pada
   halaman yang belum punya pin.
3. **`/journal/<slug>` tetap yang paling tenang**, `DIREKSI.md` §2.3.
4. **Konten fixture** tetap jalur kritis yang Tahap 64 temukan, dan tetap di
   luar tahap ini: menulis ke dataset Sanity nyata butuh izin pemiliknya.
