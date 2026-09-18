# Tahap 63 — Mesin yang menganggur, dan empat yang ternyata tidak

> **Tahap ini lebih kecil dari rencananya, dan alasannya adalah kesalahan
> pengukuran saya sendiri.** Rencana menyebut "enam mekanisme duduk di satu
> atau dua konsumen". Angka itu salah: saya menghitung `app/` dan
> `vault/blocks/` dan **tidak menghitung `components/`**. Empat dari enam
> ternyata sudah dibelanjakan.

---

## 1. Hitungan yang benar

Konsumen nyata, dihitung di `app/`, `vault/blocks/`, `components/`, `lib/`,
dengan berkas story dikecualikan:

| modul                 | klaim Tahap 60 | sebenarnya | yang saya lewatkan                   |
| --------------------- | -------------: | ---------: | ------------------------------------ |
| `primitives/icon`     |          **0** |      **3** | `breadcrumbs`, `command`, `lightbox` |
| `magic/noise-texture` |          **1** |      **3** | `components/layout/theme`            |
| `motion/counter`      |          **2** |      **2** | —                                    |
| `magic/pixel-image`   |          **1** |      **1** | —                                    |
| `primitives/magnetic` |          **1** |      **1** | —                                    |
| `motion/flip`         |          **1** |      **1** | —                                    |
| `motion/curtain`      |          **1** |      **1** | —                                    |

Jadi **tiga** modul benar-benar duduk di satu konsumen, bukan enam. Dan dari
ketiganya, dua punya rumah kedua yang jujur; satu tidak.

Konsekuensi yang lebih besar dari angkanya: argumen di rencana bahwa "kail
tertahan karena mesin lama belum dibelanjakan" **lebih lemah dari yang saya
nyatakan**. Kail itu memang tidak ada di sini. Ia ada di Tahap 64 dan 65.

---

## 2. Yang TIDAK dibelanjakan, dan kenapa itu keputusan

Menambahkan penempatan hanya supaya hitungannya naik adalah persis dekorasi
yang `MOTION-SPEC.md` §0 menamai kategori ketiga untuk dihentikan.

### 2.1 `motion/counter` — sudah benar di dua

Modulnya **beranimasi saat berubah, tidak pernah saat tiba**, dan doc-nya
menuliskan alasannya: angka yang merangkak dari 0 ke 6 saat halaman dimuat
tidak mengatakan apa pun yang "6" statis tidak katakan. Yang sah adalah
transisi keadaan — 6 jadi 2 saat pembaca memfilter.

Satu-satunya angka di situs ini yang berubah karena aksi pembaca adalah
hitungan katalog, dan ia sudah memakainya. Tahun di `/journal` dan fakta di
`/studio` tidak pernah berubah, jadi tidak ada yang bisa dihitung di antaranya.
**Tidak ada rumah ketiga. Benar apa adanya.**

### 2.2 `motion/flip` — rumah kedua berarti dua mekanisme untuk satu pekerjaan

`flip` melayani `catalogue-sift`. Kandidat yang jelas adalah baris indeks
`/journal` — tapi baris itu sudah memakai view transition lewat
`journal-transport`, yang **mengerjakan pekerjaan yang sama dengan mekanisme
berbeda**. Menambahkan FLIP di sana berarti situs ini punya dua cara
memindahkan hal yang sama, dan itu kebalikan dari standar yang dokumennya
sendiri sebut: keterkekangan yang diterapkan secara konsisten.

### 2.3 404 tidak dapat `Magnetic`

Halaman 404 tidak memasang `<Wrapper gsap>`, dan `Magnetic` adalah
`gsap.quickTo`. Menambah GSAP ke satu-satunya halaman yang dilihat pengunjung
yang tersesat, demi satu tautan yang menarik pointer, adalah menukar bobot
dengan hiasan di tempat yang paling tidak mampu membayarnya.

---

## 3. Yang dibelanjakan — dua modul, empat penempatan

### 3.1 `magic/pixel-image` → dua permukaan gambar tanpa material

Aturan yang menentukan tempatnya, dan yang membuatnya bukan sekadar "pakai di
lebih banyak tempat":

> Tirai ini milik gambar yang **tidak** punya lapisan material WebGL.

Setiap sampul di `/`, `/work`, `/practice/<v>` dan hero proyek sudah
menjalankan `MaterialImage`. Menumpuk tirai mosaik di atasnya adalah dua
reveal yang berebut satu objek. Disisir, tinggal dua permukaan gambar yang
bersih:

| tempat                      | kenapa ia cocok                                                        |
| --------------------------- | ---------------------------------------------------------------------- |
| `vault/blocks/next-project` | sampul karya berikutnya; hal terakhir sebelum pembaca pergi            |
| `vault/blocks/studio-note`  | potret studio — satu-satunya gambar yang diminta dilihat, bukan diklik |

Keduanya sudah punya `.media` ber-`position: relative` dan `--surface-2`, dan
keduanya sudah punya leluhur `[data-reveal-item]` — jadi tirainya berjalan
**di dalam entrance blok itu**, bukan sebagai entrance kedua yang bersaing.

### 3.2 `primitives/magnetic` → dua aksi utama

Aturannya, supaya ia tetap aturan:

> **Satu per permukaan, pada aksi yang permukaan itu ada untuk menawarkannya.**

Menyebar tarikan pointer ke setiap tautan adalah cara ia berhenti berarti apa
pun.

| tempat                       | aksinya                                                                 |
| ---------------------------- | ----------------------------------------------------------------------- |
| `/studio` closing action     | komentarnya sudah menyebut ini "the page's one forward action"          |
| `vault/blocks/contact-block` | alamat email — satu-satunya hal yang seluruh kunjungan bermuara padanya |

Tidak ada biaya baru: `<Wrapper gsap>` sudah terpasang di setiap rute nyata
untuk `TextReveal`.

Disiplin penanda tetap: `data-press` di noun, `data-reveal-item` di container,
`Magnetic` membungkus tanpa mengklaim keduanya — jadi pita COMMIT 150ms tidak
tersentuh.

---

## 4. Diukur, bukan diasumsikan

Pelajaran Tahap 58 dan 59: gerbang hijau bukan situs yang benar. Jadi tirainya
diukur di browser nyata, bukan dipercaya.

**Opacity tile, produksi, 1440×900:**

| momen                         | `next-project`                           | `studio-note`                            |
| ----------------------------- | ---------------------------------------- | ---------------------------------------- |
| sebelum digulir ke dalam view | 24 tile, semua **1,0**                   | 24 tile, semua **1,0**                   |
| +400ms sesudah masuk view     | maks 1,0 · min 0,33 · **21 masih pekat** | maks 1,0 · min 0,43 · **21 masih pekat** |
| +1300ms                       | maks 0,22 · **0 pekat**                  | maks 0,31 · **0 pekat**                  |
| mengendap                     | **0**                                    | **0**                                    |

Itu stagger yang benar-benar berjalan — bukan tirai yang lahir transparan
(yang akan lolos "tidak ada yang tertutup" tanpa pernah jadi efek).

**Reduced motion**, tanpa gulir sama sekali: `veilMax 0`, `opaqueTiles 0`,
`imageOpacity 1`, gambar terlihat. `CLAUDE.md` #5 terpenuhi — isinya berakhir
terlihat penuh, bukan terdampar.

---

## 5. Gerbang keluar

| harus                                                                           |
| ------------------------------------------------------------------------------- |
| `bun run check` hijau                                                           |
| `bun run test:e2e` hijau                                                        |
| `route-budget`, `interaction-grammar`, `epic-sequence`, `reveal-coverage` hijau |
| Tirai terukur pekat sebelum, bertahap saat, nol sesudah                         |
| Reduced motion: nol tile pekat, gambar penuh                                    |
| Klaim hitungan Tahap 60 dikoreksi di specnya dan di `ROADMAP.md`                |

---

## 6. Hasil

| gerbang                                                                      | hasil                               |
| ---------------------------------------------------------------------------- | ----------------------------------- |
| `bun run check`                                                              | **424 lulus / 0 gagal**             |
| `bun run test:e2e` (`CI=1`)                                                  | **641 lulus / 14 dilewati**, 15,4 m |
| `route-budget` · `interaction-grammar` · `epic-sequence` · `reveal-coverage` | **37 lulus**                        |
| `bun run build` · `build-storybook`                                          | hijau                               |
| Tirai terukur: pekat → bertahap → nol                                        | §4                                  |
| Reduced motion: nol tile pekat, gambar penuh                                 | §4                                  |

### 6.1 Satu gerbang memerah, dan ia benar

`storybook-a11y.e2e.ts:218` — _"the built Storybook is not older than the
components it checks"_ — gagal, dan itu **bukan** cacat tahap ini. Saya
menyunting `vault/blocks/*` sesudah membangun Storybook, jadi
`storybook-static` memang lebih tua dari komponen yang diperiksanya. Penjaga
kebasian itu persis untuk itu.

`bun run build-storybook` lalu berkas itu dijalankan ulang: **116 lulus**.

Catatan untuk tahap berikutnya: **bangun ulang Storybook sesudah menyunting
`vault/`, sebelum menjalankan suite**, bukan sesudah suite memberitahu.
