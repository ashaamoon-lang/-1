# Tahap 92 — Tiga peringatan build, dan hanya dua yang salah

> **Status: terkirim.** Spec ditulis lebih dulu sesuai `ROADMAP.md` §3.0;
> **dua dari tiga keputusannya tidak bertahan pada pengukuran**, dan
> dikoreksi di §7 beserta angkanya.
>
> Diminta pemilik repo setelah membaca keluaran `bun run build`: _"saya melihat
> ada build yang tidak berhasil (tidak selesai semua)"_.

---

## 1. Pengukuran

### 1.1 Build-nya berhasil

```
bun run build   EXIT=0 · 115 baris · 0 baris galat
                Compiled successfully in 2.7min
                Generating static pages (73/73)
                tabel rute tercetak lengkap
bun start       ✓ Ready in 1131ms
                /en /id /en/work /en/work/arus-balik /en/studio /en/journal
                /en/practice/consulting /cms /llms.txt /sitemap.xml
                /robots.txt /en.md  — semuanya 200
```

Tidak ada yang gagal. Yang terbaca sebagai "tidak selesai" adalah peringatan.

### 1.2 Tiga peringatan, dan berapa kali

```
⚠ metadataBase … using "http://localhost:3000"     build 4×   runtime 1×
ExperimentalWarning: localStorage is not available  build 5×   runtime 1×
[env] NEXT_PUBLIC_BASE_URL is not set               build 6×   runtime 1×
```

Jumlah di build mengikuti jumlah proses worker (tujuh), jadi ia bergeser antar
build. **Ketiganya juga muncul saat `bun start`** — jadi dua yang pertama bukan
sekadar berisik saat membangun; mereka ikut terpicu saat situs melayani.

### 1.3 `metadataBase`: hanya satu rute yang benar-benar tanpa basis

`metadataBase` sudah diset di kedua root layout dan di `lib/utils/metadata.ts`.
Alih-alih menebak, HTML hasil build dibaca — `og:image` setiap halaman:

```
en.html, id.html, */studio, */journal, */practice/*, */journal/*
    https://localhost:3000/opengraph-image.png      ← APP_BASE_URL, punya basis
*/work/*  https://cdn.sanity.io/images/…            ← absolut dari CMS
cms/[[...tool]].html
    http://localhost:3000/opengraph-image.png?…     ← default Next, tanpa basis
```

**Satu rute**: `/cms`. `app/(chrome)/layout.tsx` sudah mencatat dua percobaan
yang gagal — menambahkan `metadataBase` di root itu dan lagi di layout `/cms`
tidak menggeser hitungan maupun URL-nya, karena gambarnya adalah
`app/opengraph-image.png`, metadata berbasis berkas yang duduk **di atas kedua
root layout**.

### 1.4 `localStorage`: satu modul menyentuh browser di server

`lib/dev/orchestra.ts`:

```ts
storage: createJSONStorage(() => localStorage)
```

`createJSONStorage` memanggil getter itu **seketika** saat store dibuat, dan
modulnya diimpor statis oleh `lib/webgl/components/canvas/index.tsx` — jadi ia
dievaluasi di Node saat prerender dan saat server berjalan. Node 22 menjawab
akses itu dengan peringatan eksperimental.

### 1.5 `[env] NEXT_PUBLIC_BASE_URL`: peringatan yang benar

Ini ditulis repo ini sendiri, dan ia benar: domain belum diset, jadi canonical,
sitemap, dan OG akan menunjuk localhost. Pemilik repo menunda domain (JEDA 2),
dan `TAHAP-82` sudah menolak sekali menyetelnya ke localhost hanya untuk
membungkam peringatan — nilainya dipanggang saat build, jadi itu akan
memanggang localhost sebagai alamat kanonik ke dalam artefak produksi.

**Tidak diubah.** Satu-satunya hal yang menyebut kekurangan itu sebelum deploy.

---

## 2. Rancangan

| peringatan               | tindakan                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `metadataBase` di `/cms` | Studio adalah rute admin ber-`noindex`. Ia tidak perlu gambar sosial sama sekali, jadi rute itu berhenti mengiklankan satu — tidak ada lagi URL relatif untuk di-resolve |
| `localStorage`           | penyimpanan diganti stub bertipe benar ketika tak ada `window`; alat dev tetap memakai `localStorage` di browser                                                         |
| `NEXT_PUBLIC_BASE_URL`   | dibiarkan, dan alasannya ditulis di §1.5                                                                                                                                 |

> **Dua baris pertama tabel ini keliru, dan paragraf yang dulu berdiri di sini
> lebih keliru lagi** — ia berbunyi _"keduanya memperbaiki sebab, bukan
> membungkam gejala"_. Keduanya tidak. `/cms` berhenti menawarkan kartu sosial
> tanpa menghapus peringatannya, dan stub penyimpanan memperbaiki modul yang
> bukan sumbernya. Yang benar-benar dikerjakan ada di §7.1 dan §7.2. Tabelnya
> ditinggalkan utuh, tidak dihapus, karena ia yang menunjukkan apa yang saya
> kira benar sebelum membangun — `§8.4`.

---

## 3. Daftar berkas

| berkas                                                | perubahan                                              |
| ----------------------------------------------------- | ------------------------------------------------------ |
| `app/(chrome)/cms/[[...tool]]/page.tsx`               | metadata rute: tanpa gambar sosial                     |
| `app/(chrome)/layout.tsx`                             | catatan "belum terpecahkan" dikoreksi menjadi hasilnya |
| `lib/dev/orchestra.ts`                                | penyimpanan aman di server                             |
| `docs/stages/TAHAP-92.md`, `ROADMAP.md`, `HANDOFF.md` | berkas ini dan posisi                                  |

---

## 4. Kriteria keluar

1. `bun run build` dan `bun start`: **nol** peringatan `metadataBase`, **nol**
   `localStorage`. Diukur dengan menghitung baris, bukan dengan melihat sekilas.
2. Peringatan `[env]` tetap ada, dan tetap benar.
3. `/cms` masih melayani Studio (200) dan tetap `noindex`.
4. Tabel `og:image` §1.3 tidak berubah untuk rute yang diindeks.
5. `bun run check` hijau; `route-sweep` dan `response-headers` hijau.

---

## 5. Risiko

| #   | risiko                                                     | penangkal                                                             |
| --- | ---------------------------------------------------------- | --------------------------------------------------------------------- |
| R1  | Menghapus gambar sosial `/cms` mengubah metadata rute lain | Metadata rute hanya berlaku untuk segmen itu; tabel §1.3 diukur ulang |
| R2  | Stub penyimpanan mematikan panel dev di browser            | Stub hanya dipakai ketika `window` tidak ada                          |

---

## 6. Yang tidak dikerjakan, dinyatakan eksplisit — §9

---

## 7. Hasil, dan dua koreksi atas §2

### 7.1 `metadataBase`: tiga percobaan gagal, lalu artefaknya dibaca

Percobaan ketiga — rancangan §2 — adalah `metadataBase` di **halaman**
`/cms`, karena dua percobaan sebelumnya ada di layout. Ia gagal persis seperti
keduanya: hitungan tetap **4**, URL-nya tetap `http://localhost:3000`.

Tiga kegagalan melewati ambang `T5`, jadi tebakan berhenti dan artefaknya yang
dibaca. **URL-nya sendiri menyebut mekanismenya:**

```
[locale]/**       https://localhost:3000/opengraph-image.png
                  tanpa query -> config, dari lib/utils/metadata.ts
cms, _not-found   http://localhost:3000/opengraph-image.png?opengraph-image.<hash>.png
                  query itu tanda tangan metadata berbasis berkas
```

Gambarnya `app/opengraph-image.png`, menempel pada segmen `app/` — **di atas
setiap layout yang bisa menyetel basis**. Tidak ada `metadataBase` yang ditulis
di bawahnya yang bisa menjangkaunya, dan itu sebabnya tiga percobaan menulis
satu di bawah tidak menggeser apa pun.

Rute keduanya juga bukan "root telanjang yang redirect", seperti catatan lama
di `app/(chrome)/layout.tsx` berbunyi. Terukur ia `_not-found`, dan setiap path
tak dikenal dijawab **307** oleh proxy — jadi `_not-found` tidak pernah
benar-benar dilayani. Catatan itu dikoreksi di tempat.

**Percobaan keempat gagal separuh, dan itu yang mengajarkan sisanya.**
`openGraph.images: []` dan `twitter.images: []` di layout `(chrome)`
**menghapus tag-nya** — `/cms` melayani nol `og:image` dan nol
`twitter:image` — tetapi **tidak menghapus peringatannya**: masih satu per
render. Next me-resolve URL berkas yang diwarisi **sebelum** config yang lebih
dalam membuangnya. Tag hilang; resolusinya tidak.

Maka berkasnya yang pindah: `app/opengraph-image.png` ->
`public/opengraph-image.png`. Bita yang sama, URL yang sama, dan
`next.config.ts:218` menyimpannya berdasarkan **path**, jadi header cache-nya
tidak bergerak. Ia hanya berhenti menjadi metadata yang diwarisi sebuah pohon.

Yang diperiksa **sebelum** memindahkan:

| risiko                                            | bacaan                                                                                                          |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| halaman terindeks bergantung pada konvensi berkas | nol — tak satu pun HTML `[locale]` membawa query itu                                                            |
| `twitter:image` hilang dari halaman terindeks     | tidak — `en.html` memuatnya dari config, tanpa query                                                            |
| dimensi hilang                                    | tidak — `og:image:width/height/alt` datang dari `lib/utils/metadata.ts`                                         |
| header cache berubah                              | tidak — aturan `next.config.ts:218` cocok berdasarkan path                                                      |
| `public/` belum ada di repo ini                   | benar, dan dibuat — `.gitignore:25` sudah menyebut `/public/sw.js`, dan `check-assets` sudah memindai `public/` |

### 7.2 `localStorage`: stub-nya benar, tetapi ia bukan sumber peringatannya

`lib/dev/orchestra.ts` memang menyentuh penyimpanan browser di server, dan itu
diperbaiki. **Hitungannya tidak bergerak**, dan `--trace-warnings` mengatakan
kenapa:

```
at Object.get (node:internal/webstorage:42:21)
at .next/server/chunks/ssr/node_modules_1xje3ly._.js:2:3638
   b.storage = function(){ try { return localStorage } catch {} }()
```

Itu paket `debug`, build browser-nya, yang masuk lewat `@portabletext/editor`
— dependensi Sanity Studio. Aksesnya sudah di dalam `try/catch`; yang
memancing peringatan adalah **getter**-nya, bukan kegagalannya.

Dan `emitExperimentalWarning` Node menyala **sekali per proses**. Buktinya di
log: tujuh peringatan, tujuh pid berbeda
(`14248 4660 27300 9136 11596 10628 23748`) — satu per worker, bukan satu per
modul. Selama `debug` ikut ter-bundle, memperbaiki modul kita **tidak mungkin**
menurunkan hitungannya.

Perbaikan `orchestra` tetap dikirim atas alasannya sendiri — kode dev tidak
seharusnya membaca penyimpanan browser saat prerender — dan **tidak** diklaim
menghapus peringatan.

### 7.3 Kriteria keluar §4, dinilai apa adanya

| #   | kriteria                                               | hasil                                                                                                         |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 1   | nol `metadataBase`, nol `localStorage`                 | **separuh.** `metadataBase` **0** di build dan runtime; `localStorage` tetap 6/1, sumbernya dependensi (§7.2) |
| 2   | `[env]` tetap ada dan tetap benar                      | ya — 6 di build, 1 di runtime                                                                                 |
| 3   | `/cms` 200 dan tetap `noindex`                         | ya                                                                                                            |
| 4   | tabel `og:image` §1.3 tak berubah untuk rute terindeks | ya — **18 + 12 = 30** rute, identik; yang hilang hanya dua rute tanpa indeks                                  |
| 5   | `check` hijau; `response-headers` hijau                | `response-headers` + `canonical-sweep` **10 lulus**; `check` di §7.5                                          |

Kriteria 1 ditulis sebagai "nol keduanya" sebelum sumber kedua diketahui. Yang
dikoreksi adalah **penilaiannya**, bukan angkanya.

### 7.4 Bangun dan jalankan, dipantau penuh

Ini yang pemilik repo minta dipantau seluruh keluarannya.

```
bun run build   EXIT=0 . 0 baris galat . metadataBase 0 . localStorage 6 . [env] 6
bun start       Ready in 806ms . metadataBase 0 . localStorage 1 . [env] 1
                14 permukaan diprobe, semuanya 200, termasuk /opengraph-image.png
                Cache-Control: public, max-age=86400, stale-while-revalidate=604800
                identik dengan sebelum perpindahan
```

### 7.5 Gerbang

```
response-headers + canonical-sweep   10 lulus, 0 gagal
bun run check                        597 lulus, 0 gagal . 12 rule test
                                     COMPONENTS.md mutakhir . aset dalam anggaran
```

---

## 8. Daftar berkas, diamandemen

`T8` menuntut ini: pekerjaannya menyentuh berkas di luar daftar §3.

| berkas                                                    | perubahan                                            |
| --------------------------------------------------------- | ---------------------------------------------------- |
| `app/opengraph-image.png` -> `public/opengraph-image.png` | dipindah — §7.1                                      |
| `lib/scripts/generate-brand-assets.ts`                    | generator menulis ke rumah barunya                   |
| `lib/scripts/prepare-handoff.ts`                          | daftar periksa mengikuti                             |
| `app/(chrome)/layout.tsx`                                 | catatan dikoreksi, rute kedua diberi nama yang benar |

`app/(chrome)/cms/[[...tool]]/page.tsx` **tidak jadi berubah** — percobaan
ketiga dikembalikan sesudah terukur tidak bekerja.

---

## 9. Yang tidak dikerjakan, dinyatakan eksplisit

- **`NEXT_PUBLIC_BASE_URL` tidak disetel** — §1.5; itu milik JEDA 2.
- **Peringatan `localStorage` tidak hilang** — §7.2, sumbernya dependensi.
- **Nol angka performa diklaim** — `CLAUDE.md` #19.

### 7.6 Satu gerbang merah yang bukan gerbangnya

`test:oxlint-plugin` gagal dua kali berturut-turut sesudah build, lalu lulus
lagi — dan **rule yang gagal berbeda tiap kali** (`no-reflect-apply`, lalu
`no-unknown-type-aliases`). Itu bukan bentuk rule yang rusak. Sebabnya dibaca,
bukan ditebak:

```
RangeError: Array buffer allocation failed
    at new ArrayBuffer (<anonymous>)
    at initBuffer (node_modules/oxlint/dist/plugins-dev.js:106:20)
```

Plafon memori laptop ini, utang yang sudah tercatat di rencana. Dijalankan
sendirian dengan server berhenti: **12 rule test lulus**.
