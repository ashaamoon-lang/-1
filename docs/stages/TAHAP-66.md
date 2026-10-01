# Tahap 66 — Baris yang tidak pernah terisi, di halaman yang paling menjual

> Tiga tahap memperbaiki **trek** galeri ini. Tidak satu pun memperbaiki
> **barisnya**. Dokumen ini menutup sisa itu, mengoreksi satu pengukuran saya
> sendiri, dan mencatat dua penolakan — salah satunya perubahan yang sudah
> ditulis, dibangun, diukur, lalu dikembalikan.

## 1. Baseline, diukur

Build produksi, Chromium nyata, 1440×900, lima rute.

### 1.1 `/work/<slug>` adalah rute paling kurang dibelanjakan

`[data-epic]` yang benar-benar ada di DOM, terhadap plafon `interaction-grammar`:

| rute               | nama berbeda | plafon | terpakai |
| ------------------ | -----------: | -----: | -------- |
| `/`                |            3 |     12 | 25%      |
| `/work`            |            2 |     12 | 17%      |
| `/practice/<v>`    |            4 |     12 | 33%      |
| `/studio`          |            3 |     12 | 25%      |
| `/journal`         |            2 |      6 | 33%      |
| **`/work/<slug>`** |        **1** |  **6** | **17%**  |

Satu momen, `project-arrival`, di satu-satunya halaman tempat sebuah agency
benar-benar menjual satu pekerjaan.

### 1.2 Galerinya meninggalkan satu lubang selebar setengah layar

`/en/work/arus-balik`, 1440×900:

```
div  span=half   x=16  w= 572  top= 404   h=715    <- sampul project-hero
li   span=full   x=16  w=1161  top=1234   h=675
li   span=half   x=16  w= 572  top=1957   h=786    <- sendirian di barisnya
```

Galerinya berjalan `full, half`. `half`-nya membuka baris yang tidak bisa
dimasuki apa pun, dan **572px tanah kosong duduk di sebelah gambarnya** —
sekitar 450 ribu piksel² halaman mati.

Dan ini bukan kegagalan baru bagi repo ini. `vault/blocks/project-gallery`
menuliskannya sebagai alasan aturan Tahap 44 ada:

> _"A portrait sat with 836px of empty page beside it. Position decided a track
> the picture then ignored."_

Aturan itu memperbaiki pertengkaran kotak-vs-trek dan menurunkan 836 → 572. Ia
**tidak** menghapus lubangnya. Yang tersisa barisnya, bukan treknya.

### 1.3 ❌ Koreksi terhadap pembacaan pertama saya

Bacaan pertama saya atas dump di atas menghitung **dua** lubang dan menyebut
"860 ribu piksel²". Itu salah: `half` yang pertama adalah **sampul
`project-hero`**, bukan plat galeri, dan barisnya **sudah terisi** — daftar
fakta duduk di sebelahnya sejak Tahap 51.

Keduanya memakai atribut `data-span` yang sama, dan itu yang menipu saya. Yang
membedakannya tag-nya: galeri sebuah `<ul>`, jadi platnya `li[data-span]`;
hero bukan. Gerbang di §4 memakai selektor itu, dengan alasannya ditulis di
dalamnya — sebuah gerbang yang menyapu atribut telanjang akan menuntut spread
pada sampul dan memerahkan baris yang sudah benar.

### 1.4 Kolom fakta hero memakai sepertiga tingginya

```
sampul  404→1120  (715px)
fakta   404→ 633  (228px)   → 487px kolom kosong
```

## 2. Yang dikirim

### 2a — `half` yang sendirian mendapat pendamping, bukan trek yang lebih lebar

Enam kolom kosong di sebelah potret diisi teks yang **sudah ada di halaman
itu**: deskripsi plat tersebut, yang Tahap 44 tulis per plat justru supaya
"the gallery plates are not the cover", dan yang sampai hari ini hanya
terdengar oleh pembaca layar.

Nol kata baru. Yang berubah tempat dan bentuknya.

**Platnya tidak melebar, dan aritmetikanya yang menjaganya.** Item mengambil
dua belas kolom lalu memecahnya kembali jadi dua trek dengan `--gap` yang sama
— `(1161 − 17) ÷ 2 = 572`, persis lebar `half` sebelumnya. Terukur sesudahnya:

```
li  span=half  data-spread  liW=1161   imgW=572   noteX=604  noteW=353
```

`imgW` tidak bergerak. `e2e/media-edge.e2e.ts` menuntut artwork duduk di
**paling banyak dua lebar** dan treknya mengikuti bentuk gambarnya; sebuah
spread yang meregangkan potret akan lolos "tidak ada yang sendirian" sambil
melanggar keduanya.

**Dua suara, ditugaskan seperti sisa situs ini menugaskannya.** Mono membawa
yang dipindai — `02 / 02` tetap di bawah gambar — dan wajah display membawa
yang dibaca. Pada `caption` kolom ini mengukur 245px teks mono 11px di dalam
trek 572px, di sebelah gambar setinggi 786px: sebuah catatan kaki. Pada
`p-big` (Syne 20px) ia jadi baris katalog.

**Plat tanpa deskripsi tidak mendapat spread.** Skema mengizinkan `alt` kosong,
dan kolom kosong di sebelah gambar adalah cacat yang bagian ini ada untuk
menghapusnya — bukan versi kecilnya yang layak dikirim.

Jalur run horizontal Tahap 64 tidak tersentuh: `lone` hanya dihitung di cabang
kisi, dan `figure`-nya tetap byte-identical seperti yang catatan tahap itu
tuntut.

### 2b — `loneHalves()`, dan kenapa ia mensimulasikan alirannya

"Sebuah `half` berpasangan kalau tetangganya `half`" **salah** pada tiga `half`
berturut-turut: dua yang pertama mengisi satu baris dan yang ketiga membuka
barisnya sendiri. Satu-satunya jawaban yang benar untuk setiap urutan adalah
yang browser hitung — telusuri itemnya, isi baris sampai dua belas kolom, dan
laporkan baris mana yang hanya memuat satu `half`.

Dibuktikan merah dengan aturan tetangga naif yang terpasang menggantikannya:
**1 gagal dari 11**, dan yang gagal persis kasus tiga-`half` itu. Sepuluh yang
tetap hijau mengukur urutan yang aturan naif kebetulan benar — yang justru
bukti bahwa uji ini membedakan keduanya alih-alih memerahkan semuanya.

## 3. Dua penolakan

### 3a — Kolom fakta hero: dicoba, dibangun, diukur, dikembalikan

Lubang 487px di §1.4 spesies yang sama dengan lubang galeri, jadi ia layak
dicoba. `align-self: stretch` + `align-content: space-between` dipasang,
dibuild, diukur:

```
sebelum   baris di 425, 482, 539, 596    daftar 404→ 633
sesudah   baris di 425, 645, 864, 1083   daftar 404→1120
```

**Lubangnya tertutup dan bloknya jadi lebih buruk.** Empat fakta satu baris
melintasi 715px duduk ~183px terpisah — lebih jauh daripada tinggi salah satu
di antaranya. Mereka berhenti terbaca sebagai daftar dan jadi empat label tak
berhubungan, dan kolomnya terasa **lebih kosong** daripada saat void-nya utuh
di bawah.

Jadi void-nya tetap. Itu ongkos jujur dari empat fakta pendek di sebelah
potret tinggi. Yang galeri butuhkan adalah pendamping yang punya sesuatu untuk
dikatakan; kolom ini sudah tidak punya, dan **jarak bukan konten**.
Dikembalikan dengan angkanya, bukan dikirim karena terlanjur ditulis. Alasannya
tinggal di dalam `project-hero.module.css`, di tempat penulis berikutnya akan
menemukannya sebelum mencoba hal yang sama.

### 3b — Rute ini tetap 1 dari 6 momen, dan itu keputusan

Plafonnya enam dan terpakai satu, jadi menambah momen itu murah. Tidak
dilakukan, karena `MOTION-SPEC.md` §9.5 ada persis untuk mencegah itu:
membelanjakan anggaran karena anggarannya tersedia adalah kebalikan dari
menganggarkan.

Dan keputusan itu sudah diambil sekali, terukur: `project-gallery.module.css`
menyetel galeri ke pita standar dengan alasannya tertulis — _"The detail page's
two choreographed moments are the cover's arrival and the next-project
transport, not the gallery filling in behind them."_ Membalikkannya untuk
mengisi tabel akan membuang pengukuran itu.

Yang rute ini butuhkan bukan momen ketiga melainkan baris yang ia biarkan
kosong, dan itu yang dikirim.

## 4. Gerbang

`e2e/project-spread.e2e.ts`, baru:

| Menuntut                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tiap plat `half` berbagi barisnya, atau membawa `data-spread` **dan** note-nya duduk di sebelah gambar (bukan di bawahnya)                                                                  |
| mengisi baris **tidak melebarkan gambar** — semua `half` satu lebar, toleransi 1,5px, `media-edge` diasersi dari sisi mekanismenya                                                          |
| reduced motion: note berakhir `opacity: 1` dan tidak kosong                                                                                                                                 |
| axe dijalankan **dari dalam galeri**, dua locale — note-nya teks muted di atas ground halaman, jadi kontrasnya pertanyaan nyata, dan `route-sweep` melihat halaman ini hanya di `scrollY 0` |

Ditambah yang sudah ada dan mengikat bentuk ini: `media-edge` (dua lebar,
trek mengikuti bentuk), `project-detail` (fakta memotong fold 800px),
`epic-sequence`, `interaction-grammar` (**plafon tidak dinaikkan**),
`route-budget`, `catalogue-layout`, `reveal-coverage`, `storybook-a11y`.

## 5. Palet: tidak berubah

Monokrom ketat tetap, dikunci Tahap 1 dan **ditegaskan ulang oleh pemilik di
tahap ini**. Nol perubahan token, nol perubahan `contrast.test.ts`.

Satu hal diperbaiki, dan ia dokumen bukan kode. `DESIGN-SYSTEM.md` §1 dan
`TEARDOWN.md` §3 membenarkan penolakan aksen dengan kalimat _"This site shows
commissioned artwork"_. Sektornya berubah di Tahap 60 — ARTH agency sekarang,
dan ketujuh situs yang `TEARDOWN.md` §3 ukur kategori yang sama, semuanya
mengirim tepat satu aksen. Jadi **alasan yang tertulis kedaluwarsa meski
keputusannya tidak**.

Dicatat dengan alasan yang berlaku hari ini: karya tetap membawa warnanya
sendiri di setiap plat, dan aksen di sebelahnya bersaing dengan setiap gambar
di halaman. Tujuannya satu — supaya pembaca berikutnya tidak membuka ulang
keputusan ini hanya karena premis lamanya sudah tidak benar.
