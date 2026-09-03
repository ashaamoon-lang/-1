# Tahap 20 — Jalan keluar dari rute dalam

> Pendalaman wajib atas `docs/ROADMAP.md` §3.0.

Status: **spec**. Hasil di §8.

---

## 1. Angka lebih dulu, pendapat sesudah

Rencana yang disetujui (§1.3) menuntut hitungan sebelum kesimpulan. Dihitung
di build produksi, dua viewport, memisahkan header, footer dan isi:

| Rute                   | Tautan lanjut nyata di isi         | Header            | Footer     |
| ---------------------- | ---------------------------------- | ----------------- | ---------- |
| `/en`                  | 12                                 | 4 anchor + bahasa | 0 navigasi |
| `/en/work`             | 11 — kartu + **3 chip praktik**    | wordmark + bahasa | 0 navigasi |
| `/en/practice/<value>` | 3 — dua karya + praktik berikutnya | wordmark + bahasa | 0 navigasi |
| **`/en/work/<slug>`**  | **1** — proyek berikutnya          | wordmark + bahasa | 0 navigasi |

Mobile identik, kecuali empat anchor beranda terlipat di balik menu.

**Kesimpulan yang ditarik angka-angka itu, dan ia berbeda dari dugaan
rencana.**

`/en/work` ternyata terhubung baik: chip praktiknya menjangkau ketiga halaman
praktik. Halaman praktik punya sirkuit sendiri. **Yang benar-benar tipis
adalah halaman proyek: satu tautan lanjut.** Dan ia justru halaman yang paling
mungkin jadi halaman pendaratan — dari hasil pencarian atau tautan yang
dibagikan.

Lalu satu hal yang berlaku di **setiap** rute: **footer situs ini tidak
membawa satu pun tautan navigasi.** Hanya alamat surel dan dua akun sosial.
Footer adalah tempat konvensional untuk jalan keluar tingkat-situs, dan yang
ini kosong.

---

## 2. Kenapa footer, bukan header

Rencana §1.3 mengusulkan navigasi tingkat-rute di header. Angka di §1
mengarahkan ke tempat lain, dan itu dicatat sebagai koreksi terhadap rencana
saya sendiri, bukan disembunyikan.

`components/layout/header` **sudah memutuskan dengan sadar** untuk tidak
membawa anchor di rute dalam, dan argumennya sahih: anchor seksi milik beranda
akan jadi tautan mati di sana. Menambahkan navigasi ke header berarti
menegosiasi ulang keputusan yang sudah benar, demi masalah yang footer bisa
selesaikan tanpa menyentuhnya.

Footer lebih tepat karena tiga alasan terukur:

1. **Sudah ter-mount di setiap rute** — nol titik pasang baru.
2. **Semua tautannya rute nyata** (`/work` dan tiga `/practice/<value>`), jadi
   keberatan header tentang anchor mati tidak berlaku di sana sama sekali.
3. **Tidak menambah krom di puncak halaman**, sehingga kesan "karya lebih
   dulu" yang jadi tesis situs ini tidak berubah.

---

## 3. Ritual `ui-ux-pro-max`

| Query                               | Hasil                                                                      |
| ----------------------------------- | -------------------------------------------------------------------------- |
| `"back navigation" --domain ux`     | 5 hasil — dijalankan Tahap 16, tak satu pun tentang navigasi footer        |
| `"navigation" --stack nextjs`       | 2 hasil — `next/link` untuk navigasi internal; sudah dipatuhi              |
| `"Portfolio Grid" --domain landing` | 1 pola: _"Primary CTA Placement: Project Card Hover + **Footer Contact**"_ |

Baris ketiga itu yang relevan dan ia mendukung arah §2: pola yang situs ini
memang pakai menempatkan CTA utamanya di **footer**. Basis data tidak punya
baris spesifik tentang kolom navigasi footer; sesuai §2.1 aturan 2 itu
dinyatakan, dan prinsip universal pola tersebut yang jadi jangkar.

---

## 4. Yang dikerjakan

Satu kolom keempat di footer, berbentuk **identik** dengan kolom "Elsewhere"
yang sudah ada — sebuah `<h2 class="caption">` dan sebuah `<ul>` tautan.

Isinya rute nyata saja:

- **Work** → `/work`
- **tiga praktik** → `practiceTemplate(value)` untuk tiap `PRACTICES`

Diambil dari `lib/content/practices`, yang sejak Tahap 15 adalah satu-satunya
tempat yang memutuskan ke mana sebuah praktik menunjuk. Judulnya dari
`workIndex.<value>`, string yang sudah dipakai chip katalog dan hero praktik —
supaya footer menyebut praktik dengan nama yang sama seperti seluruh situs.

**Nol komponen baru. Nol rute baru. Nol bidang CMS baru.**

Grid kolom footer naik dari `repeat(3, …)` ke `repeat(4, …)` di desktop; di
mobile ia sudah satu kolom bertumpuk dan tidak berubah.

---

## 5. Gerbang

**Asersi:** setiap halaman terlokalisasi harus menawarkan tautan ke indeks
karya **dan** ke setiap halaman praktik.

Tepat, seragam, dan bisa dibuktikan merah sekarang — tidak ada angka ajaib
seperti "minimal tiga tautan".

`/ai` dikecualikan dengan alasan tertulis: `app/[locale]/ai/layout.tsx`
sengaja melewati layout aplikasi karena ia indeks HTML polos untuk perayap,
dan ia tidak punya header maupun footer sama sekali.

---

## 6. Batasan (dari rencana yang disetujui §2)

Reduced motion · tanpa JavaScript · axe dua viewport dua bahasa ·
`route-budget` hijau tanpa anggaran dinaikkan · nol dependensi · token ·
dibuktikan merah dulu · tidak ada klaim performa.

Ditambah dua yang khusus tahap ini:

- **Tidak menyentuh `components/layout/header`.** Keputusannya sudah
  diargumentasikan dan tetap berlaku.
- **`e2e/vocabulary`/sitemap tetap hijau** — menambah tautan tidak boleh
  menciptakan URL yang tidak ada di katalog rute.

---

## 7. Risiko

**7.1 Footer jadi terlalu penuh.** Empat kolom di 1280px berarti tiap kolom
~300px. Kolom praktik berisi tiga baris pendek, jadi muat — tapi diukur, bukan
diasumsikan.

**7.2 Menambah tautan menaikkan bobot rute.** Empat tautan teks tidak
seharusnya, tapi `route-budget.e2e.ts` yang memutuskan, bukan saya.

**7.3 Ini tidak memperbaiki halaman proyek secara mendasar.** Halaman proyek
tetap punya satu tautan lanjut _di isinya_; yang bertambah adalah jalan keluar
tingkat-situs. Apakah halaman proyek pantas punya "lihat semua karya" di
badannya sendiri adalah keputusan komposisi tersendiri, dan **tidak** diambil
di sini.

---

## 8. Hasil

### 8.1 Dibuktikan merah dulu

Gerbang barunya merah di **setiap** rute, dan pesannya menyebut apa yang tiap
halaman benar-benar punya:

```
/en offers no link to the work index; internal links seen: /en /en /id
  /en/work/arus-balik /en/work/pusat-beban /en/work/bacaan-mesin
  /en/work/takar /en/practice/consulting /en/practice/ai-data
  /en/practice/commission

/en/work/arus-balik offers no link to the work index; internal links seen:
  /en /en/work/arus-balik /id/work/arus-balik /en/work/pusat-beban
```

Baris kedua itu seluruh isi sebuah halaman proyek: wordmark, pengalih bahasa,
dan satu proyek berikutnya.

Dan **beranda sendiri pun tidak pernah menautkan ke katalognya.** Ia punya
grid-nya inline, jadi tidak terasa hilang — tapi tidak ada satu pun jalan ke
`/work` dari sana.

### 8.2 Sesudah

Satu kolom keempat di footer. Ketujuh rute kini menjangkau katalog **dan**
ketiga halaman praktik.

Kolomnya terukur rata: `Commissions=300px · Index=300px · Elsewhere=300px ·
Colophon=300px` pada 1280 — risiko §7.1 tidak terjadi, dan itu diukur bukan
diasumsikan.

### 8.3 Koreksi terhadap rencana saya sendiri

Rencana §1.3 mengusulkan navigasi tingkat-rute **di header**. Hitungannya
mengarahkan ke tempat lain, dan itu dicatat sebagai koreksi, bukan
disembunyikan.

Header sudah memutuskan dengan sadar untuk tidak membawa anchor beranda di
rute dalam, dan argumennya sahih. Footer menyelesaikan masalah yang sama
**tanpa menyentuh keputusan itu**, sudah ter-mount di setiap rute, dan setiap
tautannya rute nyata — sehingga keberatan "anchor bisa mati" tidak berlaku di
sana sama sekali.

Basis data skill mendukung arah itu lewat pola yang situs ini memang pakai:
`Portfolio Grid` menempatkan CTA utamanya di **"Project Card Hover + Footer
Contact"**. Footer sudah jadi pintu kedua situs ini; ia hanya belum punya apa
pun untuk dimasuki.

### 8.4 Yang **tidak** dikerjakan

- **Header tidak disentuh sama sekali.**
- **Halaman proyek tetap punya satu tautan lanjut di isinya.** Yang bertambah
  adalah jalan keluar tingkat-situs. Apakah badan halaman proyek pantas punya
  "lihat semua karya" sendiri adalah keputusan komposisi tersendiri, dan
  sengaja tidak diambil di sini (§7.3).
- **Nol string baru untuk nama praktik.** Footer memakai `workIndex.<value>`
  yang sudah dipakai chip katalog dan hero praktik, supaya ia menyebut praktik
  dengan nama yang sama seperti seluruh situs. Hanya satu kunci baru:
  `footer.index`.

### 8.5 Angka

```
bun run check      exit 0    (401 unit test)
CI=true test:e2e   306 lulus, 0 gagal   (dari 299)
route-budget       hijau, nol anggaran dinaikkan
```
