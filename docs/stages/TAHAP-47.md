# Tahap 47 — `vault/magic/`: pintu masuk Magic UI, dan gerbang yang menjaganya jujur

> Tahap pertama dari rencana kedua (47–53). Ia **tidak mengubah satu piksel
> pun** pada halaman mana pun — ia membangun jalur dan gerbangnya, supaya enam
> Tahap sesudahnya tidak masing-masing menemukan ulang cara memasukkan kode
> pihak ketiga.
>
> Alasannya punya preseden di repo ini: 51% nilai spasi dan 54 ukuran tipe
> bocor masuk selama 36 tahap karena tidak ada gerbang yang melihatnya, dan
> Tahap 37 harus membersihkannya belakangan. Kode pihak ketiga bocor lebih
> cepat daripada kode sendiri, karena ia datang sudah jadi.

## 1. Lisensi — diverifikasi, bukan diasumsikan

`CLAUDE.md` #18 menuntut lisensi dibaca dari `LICENSE` sumbernya sendiri,
bukan dari badge, artikel, atau hasil pencarian. Proyek ini sudah pernah
menangkap satu klaim MIT palsu dengan cara itu (`PROVENANCE.md` §5).

```
$ curl -sS -L https://raw.githubusercontent.com/magicuidesign/magicui/main/LICENSE.md
MIT License

Copyright (c) Magic UI
...
[HTTP 200]

$ curl -sS -L https://raw.githubusercontent.com/magicuidesign/magicui/main/LICENSE
404: Not Found
[HTTP 404]
```

**MIT, terverifikasi.** Menyalin kode diizinkan dengan syarat notice ikut
disalin — yang sudah jadi kebiasaan `vault/` lewat aturan #17.

Catatan yang ditulis supaya tidak menyesatkan orang berikutnya: `LICENSE`
tanpa ekstensi **404**. Seseorang yang memeriksa jalur konvensional akan
menyimpulkan repo itu tanpa lisensi, dan kesimpulan itu salah.

## 2. Premis yang salah, dan pengukuran yang mengoreksinya

Ini tahap ke-enam berturut-turut premis rencananya meleset. Dicatat bukan
untuk gaya — melainkan karena polanya sudah cukup konsisten untuk jadi
metode: **jangan percaya metadata, baca sumbernya.**

### 2.1 Field `dependencies` registry tidak sama dengan `import` di sumbernya

Rencana membagi 78 komponen memakai field `dependencies` di
`registry.json`: 40 tanpa `motion`, 30 dengan. Angka itu diambil dari
metadata. Diukur ulang terhadap **sumber sebenarnya** dari 27 komponen yang
diunduh:

|               | metadata bilang butuh `motion` | sumbernya `import` dari `motion` |
| ------------- | :----------------------------: | :------------------------------: |
| `dot-pattern` |           **tidak**            |              **ya**              |

Satu dari 27 tidak cocok. Berarti **"40 tanpa dependensi" adalah batas atas,
bukan fakta** — dan lima puluh satu komponen sisanya belum diperiksa dari
sumbernya. Angka itu dikoreksi di `vault/magic/README.md` menjadi klaim yang
bisa dipertanggungjawabkan: _dari 27 yang diperiksa dari sumbernya, 26 tidak
memakai `motion`._

### 2.2 `dot-pattern` bukan hanya salah label — implementasinya juga salah untuk kita

Sumbernya merender **satu elemen `<circle>` per titik**, dihitung di
JavaScript dari `getBoundingClientRect()`, dengan listener `resize`, lalu
tiap lingkaran dibungkus `motion.circle`. Pada viewport 1440×900 dengan jarak
16px itu **5.130 node SVG**.

`grid-pattern` — komponen Magic UI yang lain, di repo yang sama — melakukan
pekerjaan yang setara dengan **satu** `<pattern>` dan **satu** `<path>`, dan
browser yang menyusunnya.

Jadi untuk titik kita mengambil **teknik dari `grid-pattern` dan parameter
dari `dot-pattern`**. Berkasnya menjadi karya asli dengan header yang
menyatakan itu apa adanya — _kode disalin: tidak; teknik diadaptasi dari
`grid-pattern`_ — bukan "disalin lalu dimodifikasi", yang akan jadi catatan
provenance yang tidak akurat.

### 2.3 `progressive-blur` dipindah ke Tahap 53, dengan alasan

Rencana menaruhnya di tranche pertama. Sumbernya menumpuk **delapan lapis
`backdrop-filter: blur()`**, masing-masing dengan `mask-image` gradiennya
sendiri.

Dua hal, dan keduanya menentukan:

1. Biayanya **tidak bisa saya ukur di sini** — tidak ada profiler di
   lingkungan ini, dan `CLAUDE.md` #19 melarang mengklaim angka performa yang
   tidak diukur. Memasangnya sambil berkata "ringan kok" adalah persis
   klaim itu.
2. Ia belum punya konsumen sampai Tahap 53. Repo ini sudah membayar harga
   itu sekali: `vault/motion/page-transition` duduk sepuluh tahap dengan dua
   bug yang tidak pernah terlihat, karena **komponen yang tidak dirender di
   mana pun tidak pernah salah** (`TAHAP-11.md` §2.4).

Ia dipasang di Tahap 53 **bersama konsumennya**, di mana biayanya bisa
dilihat pada halaman sungguhan. Tranche pertama jadi tiga, bukan empat.

## 3. `vault/magic/` — lima transformasi wajib

Semua kode asal Magic UI masuk lewat satu direktori dan **tidak boleh
dipanggil langsung dari halaman**. Tiap berkas melewati lima transformasi
sebelum ia dianggap ada:

| #   | Transformasi                                                                        | Aturan      |
| --- | ----------------------------------------------------------------------------------- | ----------- |
| 1   | Header provenance: sumber, lisensi, cara verifikasi, dan **kode disalin: ya/tidak** | #17         |
| 2   | Kelas Tailwind → CSS Module + token                                                 | #8, #9, #10 |
| 3   | `requestAnimationFrame` sendiri → `useTempus` dengan `order` yang ditulis alasannya | #6          |
| 4   | Hanya `transform` dan `opacity` yang dianimasikan                                   | #4          |
| 5   | Blok `prefers-reduced-motion`, dan isi berakhir **terlihat penuh**                  | #5          |

Transformasi #2 bukan pilihan gaya. Ia wajib karena
`lib/styles/css/tailwind.css` me-reset empat namespace ke `initial`:

```css
--breakpoint-*: initial;
--color-*: initial;
--spacing-*: initial;
--font-*: initial;
```

**Skala warna, spasi, tipe dan breakpoint bawaan Tailwind tidak ada di repo
ini.** `bg-white`, `text-neutral-400`, `p-4`, `gap-2`, `md:` — tidak satu pun
eksis. Komponen Magic UI yang ditempel apa adanya **merender tanpa gaya**.
Itu bukan hambatan yang disayangkan; itu fakta yang menentukan bentuk seluruh
tahap ini.

Konsekuensinya untuk perkiraan waktu, dan ini harus dikatakan terus terang
karena permintaannya menyebut "siap pakai": Magic UI tidak mempersingkat
waktu dengan memberi komponen siap tempel di repo ini. Ia mempersingkatnya
dengan memberi **teknik yang sudah jadi** — rantai filter `feTurbulence` yang
sudah ditala, geometri `<pattern>`, matematika mask. Itu tetap penghematan
besar. Ia hanya bukan penghematan yang dibayangkan.

## 4. Gerbang: `lib/styles/scripts/vendor-rules.test.ts`

Bentuknya menyalin `motion-rules.test.ts` dan `taste-rules.test.ts` — memindai
**sumber yang ditulis**, bukan keluaran build, dengan alasan yang sama:
aturan tentang apa yang kita tulis harus memeriksa apa yang kita tulis.

Yang dituntut dari tiap berkas di `vault/magic/`:

| Aturan                                                               | Melanggar apa         |
| -------------------------------------------------------------------- | --------------------- |
| Nol hex mentah                                                       | #8, #10               |
| Nol `rgb()`/`rgba()`/`hsl()`                                         | #10                   |
| Nol durasi literal (`3s`, `300ms`)                                   | #3, #8                |
| Nol `ease`/`ease-in`/`ease-out`/`ease-in-out` telanjang              | #2                    |
| Nol `cubic-bezier()` mentah                                          | #1                    |
| Nol `requestAnimationFrame`                                          | #6                    |
| Nol nilai arbitrer Tailwind (`[...]` di className)                   | #8                    |
| Nol `import` dari `motion`/`framer-motion`                           | #6, keputusan pemilik |
| **Wajib** punya header provenance                                    | #17                   |
| **Wajib** punya blok `prefers-reduced-motion` bila ia menganimasikan | #5                    |

Pengecualiannya memakai bentuk yang sudah dipakai dua gerbang lain:
`vendor-exempt: <alasan>` pada komentar di atas barisnya. Opt-out butuh
alasan, dan alasannya duduk di tempat ia berlaku.

### 4.1 Dibuktikan merah dulu — dengan berkas nyata, bukan tabel

Metodenya spesifik supaya angkanya tidak bisa dikarang: `shimmer-button`
dipasang **tanpa dimodifikasi sama sekali** ke `vault/magic/`, gerbang
dijalankan, hasilnya dicatat, lalu berkasnya dihapus.

Hitungan yang diharapkan dari sumbernya (`registry/magicui/shimmer-button.tsx`):

| Pelanggaran                                         |    Jumlah |
| --------------------------------------------------- | --------: |
| Hex mentah (`#ffffff`, `#ffffff1f`, `#ffffff3f` ×2) |         4 |
| `rgba(0, 0, 0, 1)`                                  |         1 |
| Durasi literal (`3s`)                               |         1 |
| `ease-in-out` telanjang                             |         2 |
| Nilai arbitrer Tailwind                             |       ≥12 |
| Header provenance                                   | tidak ada |
| Blok `prefers-reduced-motion`                       | tidak ada |

Ditambah dua yang ditangkap aturan lama: `transition-all` menganimasikan
**segalanya** (#4), dan `shadow-[inset_…]` pada `:hover`/`:active`
menganimasikan `box-shadow` (#4).

Angka yang benar-benar terukur ditulis di §Hasil.

## 5. Tranche pertama

| Berkas                       | Asal                                                     |                                       Kode disalin                                        | Pekerjaan                                                                |
| ---------------------------- | -------------------------------------------------------- | :---------------------------------------------------------------------------------------: | ------------------------------------------------------------------------ |
| `vault/magic/grid-pattern/`  | Magic UI `grid-pattern`                                  |                        **ya** — struktur `<pattern>` dan `d` path                         | Kelas warna → `currentColor` + token opacity; className → CSS Module     |
| `vault/magic/noise-texture/` | Magic UI `noise-texture`                                 | **ya** — rantai filter `feTurbulence`/`feColorMatrix`/`feComponentTransfer` dan tuningnya | `opacity-50 dark:opacity-[0.75]` → token sadar-tema lewat `[data-theme]` |
| `vault/magic/dot-pattern/`   | teknik dari `grid-pattern`, parameter dari `dot-pattern` |                                         **tidak**                                         | Ditulis ulang sebagai satu `<pattern>`, nol `motion`, nol listener       |

Ketiganya statis — nol animasi, jadi nol blok reduced-motion yang diperlukan,
dan gerbang harus tahu bedanya antara "tidak menganimasikan" dan "lupa
mendaftar".

Ketiganya juga `aria-hidden` dan `pointer-events: none`: ini ground, bukan
konten. Tidak satu pun boleh membawa informasi — pelajaran yang
`e2e/exploratory-layer.e2e.ts` sudah tegakkan untuk kursor.

## 6. Yang tidak dikerjakan di tahap ini

- **Nol halaman disentuh.** Ketiga komponen mendapat story Storybook dan
  tidak dipasang di rute mana pun. Itu bertentangan dengan pelajaran
  §2.3 di atas, dan ketegangannya nyata — tapi tranche ini ada untuk
  membuktikan **pipeline**-nya, dan Tahap 49 memakainya dua tahap kemudian,
  bukan sepuluh.
- **Nol amandemen §9.5.** Itu Tahap 49.
- **Nol kenaikan anggaran rute.** Tidak ada rute yang berubah beratnya.

## 7. Hasil

### 7.1 Gerbang dibuktikan merah — angka nyata, bukan tabel

`shimmer-button` dipasang ke `vault/magic/shimmer-button/index.tsx` **tanpa
satu karakter pun diubah**, gerbang dijalankan, lalu berkasnya dihapus.

```
6 fail · 5 pass
```

| Asersi                        |   Hasil   | Yang ditemukan                                                         |
| ----------------------------- | :-------: | ---------------------------------------------------------------------- |
| Nol hex mentah                | **merah** | 4 baris — `#ffffff:21`, `#ffffff1f:72`, `#ffffff3f:78`, `#ffffff3f:81` |
| Nol `rgb()`/`hsl()`           | **merah** | 1 baris — `rgba(0, 0, 0, 1):25`                                        |
| Nol durasi literal            | **merah** | 1 baris — `"3s":23`                                                    |
| Nol `ease` telanjang          | **merah** | 2 baris — `ease-in-out:46`, `ease-in-out:75`                           |
| Nol nilai arbitrer Tailwind   | **merah** | 10 baris — 4 bentuk `[properti:nilai]`, 6 bentuk `utilitas-[nilai]`    |
| Header provenance wajib       | **merah** | tidak ada                                                              |
| Nol `cubic-bezier` mentah     |   hijau   | berkas ini memang tidak punya                                          |
| Nol `requestAnimationFrame`   |   hijau   | berkas ini memang tidak punya                                          |
| Nol impor `motion`            |   hijau   | berkas ini memang tidak punya                                          |
| Blok reduced-motion           |   hijau   | berkas ini tidak punya stylesheet                                      |
| Anti-vakum (menemukan berkas) |   hijau   | 1 berkas                                                               |

**Lima yang hijau itu hijau dengan jujur**, dan itu disebut karena penting:
gerbang yang semua asersinya merah pada satu berkas biasanya gerbang yang
terlalu longgar dalam mencocokkan. `shimmer-button` benar-benar tidak
menjalankan RAF, tidak mengarang kurva, dan tidak mengimpor `motion`.

Dua pelanggaran lagi tertangkap gerbang **lama**, bukan yang ini, dan itu
justru bukti pembagian kerjanya benar: `transition-all` menganimasikan
segalanya, dan `shadow-[inset_…]` pada `:hover`/`:active` menganimasikan
`box-shadow` — keduanya #4, wilayah `motion-rules.test.ts`.

Setelah tranche pertama yang sungguhan ditulis: **11 lulus, 0 gagal.**

### 7.2 Yang berubah dari rencana, dan alasannya

| Rencana                        | Yang dikerjakan                              | Kenapa                                                      |
| ------------------------------ | -------------------------------------------- | ----------------------------------------------------------- |
| Tranche pertama 4 komponen     | **3**                                        | `progressive-blur` pindah ke Tahap 53 — §2.3                |
| `dot-pattern` disalin          | **ditulis ulang, kode disalin: tidak**       | Sumbernya mengimpor `motion` dan merender 5.130 node — §2.2 |
| "40 komponen tanpa dependensi" | **26 dari 27 yang diperiksa dari sumbernya** | Metadata registry tidak sama dengan `import` — §2.1         |

### 7.3 Satu catatan `PROVENANCE.md` yang ternyata salah, dan dikoreksi

Tabel §4 dokumen itu sudah mencantumkan `magicuidesign/magicui` dengan
_"Verified from `LICENSE`"_. Berkas itu **tidak ada** — `LICENSE.md` yang ada,
`LICENSE` mengembalikan 404.

Vonisnya benar dan lisensinya nyata, tapi nama berkasnya salah, dan catatan
provenance yang menyebut berkas yang tidak bisa dibuka adalah catatan yang
tidak bisa diperiksa ulang. Siapa pun yang mengikuti §7 aturan 1 ke jalur
konvensional akan menyimpulkan repo itu tanpa lisensi lalu berhenti.
Dikoreksi di commit yang sama, dengan alasan yang sama yang membuat §6 harus
menarik kalimatnya sendiri di Tahap 43.

### 7.4 Verifikasi

```
bun run check        lulus — unit 421 lulus (dari 410; +11 gerbang baru)
bun run build        lulus
build-storybook      lulus — 89 story menjadi 99, tepat +10
CI=true test:e2e     548 lulus, 0 gagal, 0 flaky, 15 dilewati (13,4m)
```

**e2e naik 538 → 548, dan kenaikannya dijelaskan bukan diterima.** Tahap ini
tidak menulis satu pun tes e2e. Yang bertambah adalah sapuan axe di
`e2e/storybook-a11y.e2e.ts`, yang menjalankan satu asersi per story:
kesepuluh story baru masuk ke sapuan itu dan kesepuluhnya lulus.

```
✓ Vault/Magic/DotPattern    › Default · Sparse · Dense
✓ Vault/Magic/GridPattern   › Default · Fine · Lit Cells · Dashed
✓ Vault/Magic/NoiseTexture  › Default · Coarse · Strong
```

Angka yang naik tanpa sebab yang bisa disebut adalah angka yang tidak
mengukur apa pun; ini kebetulan punya sebabnya, dan sebabnya tepat sepuluh.

Nol rute berubah beratnya, nol halaman disentuh, nol anggaran dinaikkan.

### 7.5 Yang tidak dikerjakan, dan itu disengaja

- **Ketiga komponen belum dipasang di rute mana pun.** Itu bertentangan
  dengan pelajaran yang §2.3 pakai untuk menunda `progressive-blur`, dan
  ketegangannya nyata. Bedanya jarak: tranche ini dipakai di Tahap 49, dua
  tahap lagi, sementara `page-transition` menunggu sepuluh. Kalau Tahap 49
  ternyata tidak memakainya, ketiganya dihapus — bukan dibiarkan sebagai
  koleksi.
- **51 dari 78 komponen belum diperiksa dari sumbernya.** Klaim apa pun
  tentang mereka masih metadata. Diperiksa saat dibutuhkan, bukan sebelumnya.
- **Nol pengukuran performa.** Tidak ada profiler di lingkungan ini
  (`CLAUDE.md` #19). Yang bisa dikatakan tentang biaya ketiga komponen ini
  hanya bentuknya: nol JavaScript klien, nol listener, dua sampai tiga elemen
  SVG masing-masing, dirender di server.
