# Tahap 83 — Ruang yang tidak ada yang isi, dan alat untuk melihatnya

> **Status: terkirim.** Spec ditulis lebih dulu sesuai `ROADMAP.md` §3.0; hasil
> dan gerbangnya di §7.
>
> Cabang: `claude/arth-design`. Tahap ini **menggantikan** T-83 versi rencana
> ("ekspansi material"), yang gugur pada pengukuran di ketiga rutenya — §1.1.

---

## 1. Yang diukur, sebelum satu baris kode

### 1.1 Tiga tahap berturut-turut gugur pada premis rute, dan itu polanya

| tahap | yang rencana janjikan         | yang disk katakan                                                                      |
| ----- | ----------------------------- | -------------------------------------------------------------------------------------- |
| T-81  | bidang `ground` ke lima rute  | nol ornamen di dua · `position: fixed` di dua · `MOTION-SPEC` §0.1 menolak yang kelima |
| T-82  | empat plat untuk tiap proyek  | `RUN_MINIMUM` **mengganti** tata letak, tidak menambahnya                              |
| T-83  | lapisan material ke tiga rute | tak satu pun dari ketiganya kekurangan material                                        |

Dan hari yang sama, saya salah mengukur `/studio` **dua kali**: melaporkan nol
gambar ketika ada tiga (grep memeriksa berkas, bukan halaman), lalu hampir
melaporkan blok kosong yang ternyata `ProgressText` tertangkap di awal
scrub-nya oleh screenshot full-page.

Empat kekeliruan, satu sebab: **tidak ada yang mengukur komposisi**, jadi
rencana menamai rute dari ingatan dan saya memeriksanya dengan `grep`.

### 1.2 Yang ditemukan begitu halamannya benar-benar dilihat

Diukur di 1440×900, server produksi, angka dari `getBoundingClientRect()`:

**`/en/journal`** — tiga baris, ketiganya identik:

```
tinggi baris          629px
teks berakhir di      125px  (judul + dua baris subline)
sampul                422px  tinggi, tepi kanan di 354px
void di kanan sampul  1061 x 457 px  =  ~485.000 px^2 per baris
tiga baris                          =  ~1,45 juta px^2
```

**`/en/practice/<v>`** — empat kapabilitas:

```
tinggi blok per item  414px
tinggi teks di dalam   43px
kosong per item       371px
rasio isi             10,4%
runway kosong total   1.484px
```

### 1.3 Angka ini lebih besar daripada cacat yang membenarkan `project-spread`

`vault/blocks/project-gallery` mencatat cacat Tahap 44 yang melahirkan
`data-spread`:

> _"A portrait sat with 836px of empty page beside it… Roughly **860 thousand
> square pixels** of empty page, on the one route that exists to sell a piece
> of work."_

`/journal` membawa **1,45 juta** px² dan tidak ada gerbang yang menyebutnya.
`/work` punya `project-spread.e2e.ts` karena seseorang pernah melihat, menghitung,
lalu membangun alat ukurnya. Rute lain tidak pernah dilihat.

### 1.4 Isinya memang tidak ada, dan itu batasnya

`capability-set` menerima `items: readonly string[]` — **nama saja**, nol
deskripsi, dan `lib/content/practices.ts` mengarang item dari satu baris
teks per praktik. Tidak ada badan teks yang tersembunyi untuk mengisi 371px itu.

Jadi tahap ini **tidak boleh** menutup void dengan menulis deskripsi
kapabilitas agensi. Aturan kerja pemilik repo mengikat: _"Konten tidak
diciptakan."_ Yang boleh diubah adalah **ruangnya**, bukan kebenarannya.

---

## 2. Ritual skill — `ROADMAP.md` §2.1, dan ia mengembalikan NOL

```bash
PY=python
S=.claude/skills/ui-ux-pro-max/scripts/search.py
$PY $S "whitespace density empty space" --domain ux -n 3
$PY $S "editorial list layout rhythm" --domain ux -n 3
```

**Dua query, dua hasil yang tidak menyentuh pertanyaannya.** Yang pertama
mengembalikan "Empty States" (pesan saat _tidak ada data_, bukan ruang kosong
di sekitar data yang ada) dan "Chip Collection Reflow". Yang kedua
mengembalikan "Fixed Positioning" dan "Stacking Context".

Database itu berisi panduan tingkat **komponen**. Kepadatan komposisi — berapa
banyak halaman yang dipakai sejumlah isi tertentu — tidak ada di dalamnya.
Dicatat terus terang, seperti `TAHAP-79.md` dan `TAHAP-82.md` §2.1: ritual yang
hanya dilaporkan ketika ia membantu adalah ritual yang tidak bisa dipercaya.

Yang memandu tahap ini karena itu datang dari repo sendiri, dan lebih tajam:

> `DIREKSI.md` §2.1 — _"hero lebih tinggi dengan isi yang sama bukan lebih
> memukau, melainkan lebih kosong."_

> `app/[locale]/studio/page.tsx` — _"Adding motion to a page that was short of
> **content** would only have made the emptiness move."_

Kalimat kedua itu ditulis di repo ini, tentang halaman ini, dan ia adalah
alasan T-83 versi lama salah: ia mengusulkan menambah gerak ke rute yang
kekurangan isi.

---

## 3. Inventaris — dipakai ulang, bukan ditulis ulang

| kebutuhan              | yang sudah ada                                        |
| ---------------------- | ----------------------------------------------------- |
| Preseden mengukur void | `e2e/project-spread.e2e.ts` — baris, span, catatan    |
| Pemilih yang mengisi   | `loneHalves()` — sudah diekspor dan teruji            |
| Pola blok ter-generate | `rule-coverage` · `design-debt` · `design-scoreboard` |
| Papan skor desain      | `DIREKSI.md` §3.2b — tinggal ditambah barisnya        |
| Wasit rentang gulir    | `e2e/epic-sequence.e2e.ts`                            |

**Nol blok baru, nol komponen baru.** Yang kurang adalah **alat ukur**.

---

## 4. Yang akan dikerjakan

### 4.1 Alat ukurnya dulu — preseden Tahap 80, dan alasannya sama

Tahap 80 membangun papan skor **sebelum** pekerjaan desain besar, karena angka
yang tidak bisa dibuat ulang adalah angka yang hanyut. Di sini alasannya lebih
keras: tiga tahap gugur justru karena **tidak ada** alat yang bisa menjawab
"berapa kosong halaman ini".

`e2e/composition-density.e2e.ts` mengukur, per rute dan per viewport:

- tinggi blok yang dirender terhadap tinggi isi yang benar-benar dicat;
- petak kosong terbesar yang bersebelahan di dalam sebuah baris.

Ia **melaporkan** di tiap rute merek dan **menegakkan ambang** hanya di tempat
angkanya sudah dibela — persis seperti `project-spread` menegakkan baris hanya
di galeri, bukan di seluruh situs.

**Dibuktikan merah lebih dulu** (§3.3 aturan kerja): `/journal` hari ini harus
membuatnya merah pada angka yang §1.2 sebutkan, atau alatnya yang salah.

### 4.2 `/journal` — void 1061 × 457, dan dua jalan menutupnya

Barisnya adalah dua kolom: rel (tanggal, sampul) dan kolom baca (judul,
subline). Keduanya mulai di atas yang sama; kolom baca berakhir di 125px dan
rel berjalan sampai 422px. Void ada **di kanan sampul, di bawah teks**.

Dua mekanisme, dan keduanya sudah ada preseden di repo:

| jalan                                             | preseden                                                                       | biaya                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| **A.** Teks mengisi ruang di samping sampul       | `data-spread` Tahap 44 — separuh yang sendirian mendapat catatan di sampingnya | nol konten baru; tata letak saja                  |
| **B.** Sampul mengecil sampai baris setinggi teks | —                                                                              | gambar satu-satunya di rute baca jadi lebih kecil |

**Direkomendasikan A**, karena ia yang sudah terbukti di repo ini dan karena B
menukar void dengan gambar yang lebih lemah di rute yang cuma punya satu.
Keputusan finalnya dibuat **dengan mata** sesudah keduanya dirender, bukan di
spec ini.

### 4.3 `/practice/<v>` — rasio isi 10,4%

371px kosong per item untuk teks 43px. Tidak ada isi untuk menambalnya (§1.4),
jadi yang diperbaiki **runway**-nya: `capability-set` sticky, dan label
tertahannya butuh jarak gulir — tapi 414px per nama adalah anggaran yang tidak
pernah dihitung, hanya diwarisi.

Ambangnya ditetapkan dari pengukuran di tahap ini, bukan dari selera.

### 4.4 Yang DITOLAK di muka

- **Menulis deskripsi kapabilitas.** Konten tidak diciptakan.
- **Menambah gerak ke rute yang kosong.** Repo ini sudah menulis kenapa:
  _"would only have made the emptiness move."_
- **Lapisan material WebGL.** Premis T-83 lama; ia menambah 1.200 KB ke
  halaman yang masalahnya ruang, bukan tekstur.

### 4.5 Berkas yang disentuh

```
e2e/composition-density.e2e.ts        BARU — alat ukurnya
app/[locale]/journal/index-rows.tsx   void di kanan sampul
app/[locale]/journal/page.module.css  idem
vault/blocks/capability-set/*         runway per item
docs/stages/TAHAP-83.md               berkas ini
```

---

## 5. Kriteria keluar

| gerbang                      | tuntutan                                                     |
| ---------------------------- | ------------------------------------------------------------ |
| `bun run check`              | 588+ lulus, 0 gagal                                          |
| `composition-density` (baru) | **terbukti merah** pada `/journal` hari ini, lalu hijau      |
| `/journal` void terbesar     | turun dari **485.000 px²** per baris                         |
| `/practice/<v>` rasio isi    | naik dari **10,4%**                                          |
| `e2e/first-screen.e2e.ts`    | `/journal` tetap membuka pada entrinya                       |
| `e2e/plane-edge.e2e.ts`      | sampul tetap tidak menyingkap framenya                       |
| `e2e/epic-sequence.e2e.ts`   | nol momen berbagi rentang gulir, dua viewport                |
| `e2e/route-budget.e2e.ts`    | `/en/journal` tetap di bawah **900 KB** — nol KB ditambahkan |
| reduced motion               | isi berakhir terlihat penuh                                  |
| **mata**                     | kedua rute dilihat di dua viewport, sebelum dan sesudah      |

---

## 6. Risiko

1. **Menutup void dengan mengecilkan isi.** Sebuah baris setinggi teks yang
   mencapainya dengan memangkas gambar bukan perbaikan, itu penyerahan. §4.2
   menamai itu sebagai jalan B dan tidak merekomendasikannya.
2. **Alat ukur yang menegakkan selera.** Kepadatan bukan kebenaran; ambang yang
   dipaksakan ke seluruh situs akan menghukum `/journal/<slug>` yang sengaja
   paling tenang. Karena itu ia **melapor** di mana-mana dan **menegakkan** di
   tempat angkanya dibela.
3. **Ia mengukur hal yang salah.** Cacat paling mungkin di alat baru adalah ia
   menghitung petak kosong yang sebenarnya ditempati elemen transparan atau
   ter-transform. Karena itu §4.1 menuntut bukti merah pada angka yang sudah
   diukur tangan di §1.2 — kalau ia melaporkan angka lain, alatnya yang salah
   (pemicu **T6**).
4. **Nol angka performa diklaim.** K10 masih menunggu `CONTEXT7_API_KEY`
   (`CLAUDE.md` #19).

---

## 7. Hasil

### 7.1 Alat ukurnya, dan pembacaan pertamanya diperiksa ke tangan

`e2e/composition-density.e2e.ts` membagi tiap blok jadi grid 32×32, menandai
sel yang ditutupi **daun tercat** (elemen yang membawa teksnya sendiri, atau
gambar/kanvas/SVG — bukan pembungkus, bukan ornamen `position: fixed`), lalu
mencari persegi kosong terbesar lewat metode histogram.

Pembacaan pertamanya dibandingkan ke pengukuran tangan §1.2 (**T6**):

```
/journal    tangan 485k px²   alat 516k px²   selisih 6%, membulat ke luar — cocok
/practice   tangan 10,4% (1-D) alat 8% (2-D)    cocok
```

**Dan pembacaan pertama itu menangkap cacat selektor, bukan cacat halaman.**
`main li` di `/practice` mencocokkan **sebelas** elemen — baris nav dan daftar
sub-label ikut — melaporkan fill 44%. Alat yang tidak setuju dengan tangan
adalah alat yang sedang memberi tahu Anda sesuatu.

### 7.2 Peta kepadatan seluruh situs, dan tesisnya terbaca sebagai data

```
/en                     6 seksi      fill 36%   lubang 50% =  644k px²
/en/work               10 kartu      fill 99%   lubang  3% =   21k px²
/en/work/<grid>         3 plat       fill 100%  lubang  0% =    0k px²
/en/work/<trek>         4 plat       fill 74%   lubang 53% =  176k px²
/en/studio              6 seksi      fill 41%   lubang 72% =  147k px²
/en/journal             3 baris      fill 30%   lubang 59% =  516k px²
/en/practice/<v>        4 blok       fill  8%   lubang 81% =  351k px²
```

**Dua rute terpadat adalah dua rute yang punya gerbang.** `/work` dan
`/work/<slug>` diukur `project-spread` sejak Tahap 44; sisanya hanya pernah
dibaca. Itu seluruh argumen berkas ini, dan ia muncul sebagai angka.

### 7.3 `/journal` — lubang turun 61%

Strukturnya diukur, bukan ditebak:

```
p.caption   [16,585   338x14 ]  kolom 1
h2          [370,585  1045x43]  kolom 2
p.summary   [370,639  564x38 ]  kolom 2
div.cover   [16,711   338x422]  kolom 1   <- sampul di rel sempit
```

Kolom baca yang lebar berhenti di y=677; rel berjalan sampai y=1133. Sampulnya
duduk di kolom sempit sementara kolom lebar dibiarkan kosong.

Sampul dipindah ke kolom baca dan melebar bersamanya — `grid-column: 2`,
rasio `12 / 5`, **hanya di desktop**. Di ponsel barisnya satu kolom dan sampul
tetap potret 200px; letterbox di sana akan jadi strip 83px, yaitu bagaimana
perbaikan untuk satu lebar jadi cacat di lebar lain.

```
fill          30%  ->  69%
lubang       59%  ->  23%
              516k ->  204k px²
```

Nol konten ditambahkan, nol KB ditambahkan, dan gambarnya berubah dari
thumbnail 338px jadi gambar editorial 1045px.

### 7.4 `/practice` — ditegakkan selama satu jam, lalu dicabut

Ia angka terkosong di situs ini (81%, 351k px²) dan saya menahannya atas dasar
angka itu saja. Lalu aturan yang menghasilkannya dibaca:

```
capability-set.module.css   min-block-size: 46svh
```

dengan pengukurannya sendiri menempel: _"long past the ~200px Tahap 24 proved
no reader perceives as holding — and **exactly two statements share the
screen**"_, dan tepat di atas padding-nya: _"the extra height is meant to be
space **after** an item."_

Ruang itu **bukan tak bertuan**. Ia kadens sebuah rangkaian sticky, dibantah
di Tahap 24 dan diukur ulang di Tahap 25. Gerbang yang menggagalkannya adalah
metrik yang membatalkan keputusan karena keputusan itu mahal dinyatakan sebagai
angka.

Kegagalan itu **ditulis di §6.2 spec ini, sebelum daftar penegakannya ditulis**.
Menuliskan risikonya tidak mencegahnya; membaca CSS-nya yang mencegah.

Jadi alatnya tetap melaporkan `/practice` dan berhenti menghakiminya. Blok yang
kosong adalah **pertanyaan, bukan vonis** — dan satu-satunya cara membedakan
ruang yang disengaja dari ruang yang tak bertuan adalah pergi membaca kenapa
ruang itu ada.

### 7.5 Gerbang

| gerbang                                                                                      | hasil                                        |
| -------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `bun run check`                                                                              | **588 lulus, 0 gagal**                       |
| `composition-density` (baru)                                                                 | **terbukti merah** di `/journal`, lalu hijau |
| first-screen · plane-edge · route-budget · epic-sequence · no-javascript · continuous-motion | **76 lulus, 0 gagal**, dua viewport          |

### 7.6 Yang tidak dikerjakan, dinyatakan eksplisit

- **`/practice/<v>` tidak diubah.** §7.4 — ruangnya sudah dibela.
- **`/en` dan `/studio` tidak ditegakkan.** Keduanya melewati ambang, dan tak
  satu tahap pun pernah mengukur apa yang seharusnya blok mereka bawa.
  Melaporkan, tidak menghakimi, sampai sebuah tahap membantahnya.
- **Nol konten diciptakan.** `capability-set` hanya menerima nama; tidak ada
  deskripsi kapabilitas yang ditulis.
- **Nol angka performa diklaim.** K10 masih menunggu `CONTEXT7_API_KEY`
  (`CLAUDE.md` #19).
- **Klaim a11y:** nol — tahap ini tidak menjalankan axe di luar suite yang ada.
