# Tahap 35 — Kejujuran

> Status: spec. Kode belum ditulis saat baris ini dibuat (`docs/ROADMAP.md` §3.0).

Tahap paling murah dalam rencana ini, dan satu-satunya yang setiap butirnya
melanggar aturan proyek ini sendiri. Nol konten baru, nol dependensi, nol
gerak.

---

## 1. Kenapa Tahap ini ada

`CLAUDE.md` §Honesty menuntut tiga hal: jangan mengklaim angka yang tidak
diukur, jangan mengklaim aksesibilitas yang tidak diuji, dan **kalau sesuatu
dilewati atau gagal, katakan eksplisit**. Audit kurator yang membuka Tahap 34
menemukan situs ini melanggar semangat ketiganya di permukaan yang terbit —
bukan di kode, di **apa yang situs ini katakan tentang dirinya**.

Empat cacat, semuanya terukur, semuanya kecil, dan tidak satu pun bisa dilihat
gerbang mana pun hari ini.

---

## 2. Cacat 1 — catatan placeholder dibungkam sementara placeholder tayang

`lib/content/home-fallback.ts:135`:

```ts
isPlaceholder: settings === null,
```

Resolusinya **per bidang** — file itu sendiri menjelaskan kenapa, panjang
lebar: "`studioSettings` setengah terisi… adalah keadaan normal saat sebuah
studio onboarding, dan itu tidak boleh mengosongkan seksi yang belum disentuh
editor." Tapi _labelnya_ per dokumen.

Akibatnya terukur: dokumen `studioSettings` fixture **ada**, jadi
`isPlaceholder` bernilai `false` dan catatan "Placeholder copy…" di
`app/[locale]/page.tsx:278` tidak dirender — sementara `content.statement`
bernilai `null`, jadi halaman tetap menayangkan paragraf placeholder.

**Salinan sementara tayang tanpa label.** Di proyek yang menulis aturan
"katakan eksplisit kalau sesuatu dilewati", itu cacat, bukan nit.

**Perbaikan:** label mengikuti bidang, bukan dokumen. `HomeContent` melaporkan
bidang mana yang jatuh ke fallback, dan halaman merender catatan itu ketika
prosa yang _ia tampilkan_ adalah prosa fallback.

---

## 3. Cacat 2 — alamat kontak palsu diterbitkan sebagai fakta organisasi

`studio@arth.example` dan dua domain telanjang (`https://instagram.com/`,
`https://are.na/`) hidup di **tiga tempat terpisah**:

| Tempat                                               | Sifat                                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `lib/content/home-fallback.ts:65` `FALLBACK_CONTACT` | fallback, sadar-CMS                                                                   |
| `components/layout/footer/index.tsx:50-55`           | **hardcode, tidak pernah membaca CMS**                                                |
| `lib/seo/site.ts:169` `SITE.email`                   | **diterbitkan sebagai `email` Organization di JSON-LD**, dan di `/ai` dan `/llms.txt` |

`.example` adalah TLD cadangan RFC 2606 — ia dirancang persis supaya tidak
pernah nyata. Menampilkannya di halaman adalah satu hal; **menerbitkannya
sebagai `schema.org/Organization.email`** adalah menyerahkan fakta palsu ke
mesin yang akan mengindeksnya.

### 3.1 Pemisahannya, dan alasannya

Bukan "hapus semuanya". Halaman tanpa kontak sama sekali adalah artefak yang
lebih buruk untuk dilihat studio, dan `.example` sudah mengumumkan dirinya
sendiri kepada manusia.

- **Permukaan mesin** (JSON-LD `email`, `/ai`, `/llms.txt`): **dihilangkan**.
  Diam bukan kebohongan; alamat cadangan adalah kebohongan.
- **Permukaan manusia** (footer, blok kontak beranda): tetap terlihat,
  **dengan label** — mesin yang sama yang Cacat 1 perbaiki.
- **Tiga salinan jadi satu.** Footer berhenti menghardcode dan membaca sumber
  yang sama dengan beranda. Ini juga yang membuat penyambungan CMS nanti
  menjadi satu suntingan, bukan tiga.

`SITE.email` sudah membawa `// TODO(studio): real address, and remove
`.example`.` Tahap ini menghapus `.example`-nya; TODO tentang alamat asli tetap
milik studio.

---

## 4. Cacat 3 — `/studio` menerbitkan fakta yang tidak ada yang verifikasi

`messages/*.json` `studio.facts`:

```
Founded    2021
Based      Jakarta, working remotely
Team       Four, plus specialists per engagement
Languages  English, Bahasa Indonesia
```

`app/[locale]/studio/page.tsx:32-42` menyatakan sendiri bahwa **seluruh
halaman itu salinan scaffolding**, kecuali kolofonnya. Jadi tiga dari empat
baris di atas adalah angka dan tempat yang dikarang, dan mereka tayang tanpa
kualifikasi apa pun.

Audit membingkainya sebagai "dua sumber tidak sepakat, dan yang dibaca mesin
yang bisu" — `SITE.foundingDate`, `locationName`, `addressCountry` semuanya
kosong. **Arah penyelesaiannya kebalikannya.** Yang salah bukan diamnya
`site.ts`; yang salah adalah `/studio` mengasersikan hal yang tidak diketahui
siapa pun. Menyalin `2021` dan `Jakarta` ke `schema.org` akan **memperbanyak**
karangannya, bukan mendamaikannya.

**Perbaikan:** `/studio` melabeli fakta scaffolding-nya, memakai pola yang
`practice.placeholderNote` sudah pakai di tiga halaman praktik.
`SITE.foundingDate` dan kawan-kawan **tetap kosong** sampai studio memberi
angka yang benar. `languages` bukan karangan (situsnya memang dua bahasa) dan
tetap apa adanya.

---

## 5. Cacat 4 — konjungsi Inggris disuntik ke keluaran Indonesia

`lib/seo/site.ts:281`:

```ts
return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
```

`/[locale]/ai` memanggil `siteFacts(locale)` dan merender `formatList` dua
kali, jadi `/id/ai` mencetak:

> Konsultasi strategi dan arsitektur, Rekayasa AI dan data, **and** Pengerjaan
> pesanan

**Perbaikan:** `formatList` menerima locale dan memakai `dan` untuk `id`.

### 5.1 Yang TIDAK diperbaiki, dan kenapa

Audit menandai `/llms.txt` dan `manifest.webmanifest` sebagai "hanya bahasa
Inggris". **Keduanya sudah punya alasan tertulis dan alasannya benar:**

- `app/llms.txt/route.ts:52-61` — `/llms.txt` adalah path tanpa locale menurut
  konvensi, dan konvensi itu justru intinya; ia tetap mencantumkan `/en/…` dan
  `/id/…` berdampingan sehingga crawler yang hanya mengambil file ini tetap
  tahu situsnya dua bahasa.
- `app/manifest.ts:7-10` — satu manifest per origin, dan spesifikasinya tidak
  punya varian per bahasa.

Mengubah keduanya berarti membatalkan keputusan yang sudah diargumenkan demi
mencentang temuan audit. Tidak dilakukan, dan disebut di sini supaya itu
keputusan.

---

## 6. Cacat 5 — panduan agen menunjuk URL yang mengalihkan

`lib/seo/site.ts:188` dan `:207` menyuruh agen "persempit di
`/en/work/practice/consulting`". Rute itu sekarang **308 permanent redirect**
ke `/en/practice/consulting` (`app/[locale]/work/practice/[value]/page.tsx`).
Panduan yang mengirim agen ke pengalihan adalah panduan yang basi di kedua
bahasa.

---

## 7. Gerbang

`e2e/promises.e2e.ts` diperluas. Tiap asersi **dibuktikan merah** dulu.

1. **Nol `.example`** di permukaan mesin mana pun: JSON-LD tiap rute,
   `/llms.txt`, `/en/ai`, `/id/ai`, `sitemap.xml`.
2. **Halaman yang menayangkan prosa fallback wajib menayangkan labelnya.**
   Diperiksa di `/en` dan `/id`: kalau paragraf statement berasal dari
   fallback, catatan placeholder harus ada di DOM.
3. **Nol URL yang mengalihkan di panduan agen** — tiap path dalam
   `agentGuidance` diambil dan wajib menjawab 200, bukan 3xx.
4. **`/id/ai` tidak memakai konjungsi Inggris** — nol `and` dalam daftar
   yang dirender di locale `id`.

Lantai anti-vakum di tiap asersi.

---

## 8. Risiko

- Menghapus `SITE.email` mengubah bentuk Organization JSON-LD.
  `e2e/agent-readiness.e2e.ts` dan `canonical-sweep.e2e.ts` menjaga permukaan
  itu dan bisa ikut merah.
- Melabeli fakta `/studio` menambah satu elemen ke halaman yang sudah punya
  dua momen §9.5 dan plafon eyebrow. Gerbang Tahap 34 akan menangkapnya kalau
  labelnya ditulis sebagai eyebrow — jadi ia bukan eyebrow.
- `formatList` dipakai `/llms.txt` juga, yang locale-nya default. Tanda tangan
  barunya harus punya default yang menjaga keluaran itu tidak berubah.

---

## 9. Hasil

### 9.1 Gerbang merah dulu: 8 dari 10

`e2e/promises.e2e.ts` diperluas dan dijalankan terhadap situs sebagaimana
adanya (build produksi, 2026-09-05).

| Asersi                          | Sebelum   | Sesudah |
| ------------------------------- | --------- | ------- |
| `/llms.txt` nol `.example`      | **hijau** | hijau   |
| `/sitemap.xml` nol `.example`   | **hijau** | hijau   |
| `/en/ai` nol `.example`         | merah     | hijau   |
| `/id/ai` nol `.example`         | merah     | hijau   |
| JSON-LD `en` nol `.example`     | merah     | hijau   |
| JSON-LD `id` nol `.example`     | merah     | hijau   |
| `/en` melabeli prosa fallback   | merah     | hijau   |
| `/id` melabeli prosa fallback   | merah     | hijau   |
| Panduan agen nol pengalihan     | merah     | hijau   |
| Konjungsi Indonesia di `/id/ai` | merah     | hijau   |

Dua yang sudah hijau berguna: mereka **mempersempit** cacatnya. Alamat itu
tidak pernah mencapai `/llms.txt` maupun sitemap, jadi permukaan yang
terkontaminasi persis dua — `/ai` di kedua locale, dan graf Organization di
tiap halaman.

### 9.2 Label mengikuti bidang, bukan dokumen

`isPlaceholder: settings === null` diganti `fallbacks`, satu boolean per
bidang, dan sebuah helper `pick()` yang memutuskan **nilai dan asalnya di satu
tempat**. Menurunkan "apakah ini fallback?" dari pemanggilan `usable()` kedua
adalah cara keduanya melenceng, dan melenceng di sini berarti halaman yang
menayangkan scaffolding sambil melaporkan bahwa ia tidak.

Halaman beranda kini menandai prosanya `data-statement="cms" | "fallback"` dan
merender catatannya dari fakta yang sama.

**Satu asersi unit yang ada sebelumnya ternyata cacatnya, ditulis sebagai
tes.** `home-fallback.test.ts` menyatakan:

```ts
// dokumen settings hanya punya `name` dan `headline`
expect(resolved.isPlaceholder).toBe(false)
```

Subline, email, dan seluruh statement pada kasus itu masih kata-kata file ini,
dan tesnya menegaskan bahwa tidak satu pun begitu. Sekarang ia menegaskan yang
sebenarnya: `headline` dari CMS, tiga sisanya fallback.

### 9.3 Diam di permukaan mesin, label di permukaan manusia

`SITE.email` dikosongkan. Kedua konsumennya sudah menjaga ketiadaannya
(`schemas.ts:139`, `ai/page.tsx:118`), jadi bidangnya **dihilangkan**, bukan
diterbitkan kosong.

Beranda tetap menampilkan alamat placeholder, kini dengan catatan di bawahnya,
dirender hanya ketika `fallbacks.email` benar — jadi ia hilang sendiri begitu
studio mengisi CMS.

Tiga salinan alamat itu jadi satu: `FALLBACK_CONTACT` diekspor, dan footer
berhenti menghardcode salinan ketiganya.

### 9.4 `/studio` berhenti mengasersikan yang tidak diketahui

`Founded 2021`, `Jakarta, working remotely`, `Four, plus specialists` adalah
scaffolding — halaman itu sendiri mengatakannya di komentar headernya — dan
tayang tanpa kualifikasi apa pun.

Audit membingkainya sebagai "dua sumber tidak sepakat, dan yang dibaca mesin
yang bisu". **Penyelesaiannya ke arah sebaliknya.** Menyalin `2021` dan
`Jakarta` ke `schema.org` akan memperbanyak karangannya.
`SITE.foundingDate`, `locationName`, `addressCountry` **tetap kosong**, dan
`/studio` mendapat catatan yang menyebut ketiga baris itu apa adanya —
memakai pola yang `practice.placeholderNote` sudah pakai di tiga halaman.

`languages` tidak ikut dilabeli: situsnya memang dua bahasa, dan itu bisa
diperiksa dengan memuat `/id`.

### 9.5 Instrumennya salah sekali, dan merahnya menyesatkan

Asersi konjungsi memindai **seluruh** `/id/ai` dan tetap merah setelah
perbaikannya mendarat. Merahnya benar tapi alasannya salah: halaman itu
sengaja mencantumkan **setiap rute statis di kedua locale** dengan `hrefLang`,
jadi deskripsi berbahasa Inggris di `/id/ai` memang seharusnya ada. Yang
`formatList` isi cuma satu daftar.

Diperbaiki dengan menamai daftar itu (`data-site-facts`) dan memindai daftar
itu saja — plus asersi kedua bahwa `dan` benar-benar hadir, supaya versi yang
kehilangan daftarnya tidak lulus dengan diam.

Hasilnya, terverifikasi di halaman terbangun:

> Layanan: Konsultasi strategi dan arsitektur, Rekayasa AI dan data, **dan**
> Pengerjaan pesanan

### 9.6 Yang TIDAK diperbaiki, disebut eksplisit

1. **Footer masih tidak bisa tahu.** Ia dirender di dalam `Wrapper` yang
   `'use client'`, jadi ia tidak punya data server sendiri dan tidak bisa
   membaca `studioSettings`. Ia sekarang berbagi konstanta dengan beranda —
   yang menghapus risiko melenceng dan membuat penyambungan CMS nanti satu
   suntingan — tapi placeholder-nya **tidak berlabel**, karena melabelinya
   tanpa syarat akan berbohong ke arah lain begitu studio mengisi alamatnya.
   Perbaikan yang benar adalah satu provider yang dipasang di
   `app/[locale]/layout.tsx` (server) dan dikonsumsi footer. Tidak dikerjakan
   di sini: menambahkan fetch Sanity ke layout menyentuh cerita cache setiap
   rute, dan itu bukan perubahan yang layak diselundupkan ke dalam Tahap
   tentang kejujuran.
2. **`/llms.txt` dan `manifest.webmanifest` sengaja tidak diubah.** Audit
   menandai keduanya "hanya bahasa Inggris"; keduanya sudah punya alasan
   tertulis, dan alasannya benar (§5.1). Mengubahnya berarti membatalkan
   keputusan yang sudah diargumenkan demi mencentang temuan.
3. **`TODO(studio)` untuk alamat asli tetap ada.** Yang dihapus `.example`-nya;
   alamatnya milik studio, dan gerbangnya sekarang mencegahnya kembali.
4. Dokumen fixture di dataset live masih membawa subline Tahap 34. Tidak
   berubah di Tahap ini.

### 9.7 Verifikasi

```
bun run check              hijau — 443 unit test, oxlint, oxfmt, tsc, manifest, assets
CI=true bun run test:e2e   459 lulus, 16 dilewati, nol flake (10,2 menit)
bun run build-storybook    hijau
```

Jalan pertama suite penuh: **459 lulus, 1 gagal** — `storybook-a11y` "the built
Storybook is not older than the components it checks", karena
`vault/blocks/contact-block` berubah dan `storybook-static/` belum dibangun
ulang. Dibangun ulang, asersinya hijau. Itu gerbang yang bekerja persis
sebagaimana mestinya, dan dicatat di sini alih-alih dihilangkan dari hitungan.

Halaman yang disentuh dipandangi di 1440×900: `/en`, `/id`, `/en/studio`,
`/en/ai`, `/id/ai`. Nol klaim performa (`CLAUDE.md` #19).
