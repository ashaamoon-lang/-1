# TAHAP 11 — Mempercantik: dari benar menjadi indah

Stage-spec yang diwajibkan `docs/ROADMAP.md` §3.0.

Sepuluh tahap sebelumnya membuat situs ini **benar**: terbaca tanpa JavaScript,
cacheable, dua bahasa sampai ke JSON-LD, nol pelanggaran axe, 195 tes e2e.
Tidak satu pun dari itu membuatnya **indah**.

Tahap ini soal yang kedua. Aturannya sama seperti sebelumnya: tiap klaim
diukur, tiap perbaikan datang dengan gate, dan yang tidak dikerjakan
dinyatakan.

---

## 1. Ritual `ui-ux-pro-max`, dan hasilnya sebagai pembanding

`.claude/agents/HOUSE-RULES.md` mewajibkan ritual skill sebelum keputusan UI.
Yang dijalankan:

```
search.py "commissioned artwork studio portfolio gallery minimal" \
  --design-system --variance 6 --motion 6 --density 3 -p "Arth"
search.py "portfolio grid image showcase hover" --domain ux
search.py "page transition route change continuity" --domain gsap
search.py "scroll reveal stagger grid"            --domain gsap
```

**Hasilnya sengaja dipakai sebagai pembanding, bukan sebagai perintah.** Sistem
desain proyek ini sudah dikunci di Tahap 1 setelah dikerjakan dua kali;
mengganti palet atau tipografi karena sebuah pencarian akan membatalkan
pekerjaan itu tanpa alasan baru. Jadi tiga baris di bawah ini adalah tiga
keputusan berbeda, bukan satu:

| Rekomendasi skill                                      | Putusan                                                                                                                                                                                                                                      |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Palet near-black + off-white, **tanpa aksen kromatik** | **Diterima — dan ini konfirmasi.** Persis yang dikunci Tahap 1 (`ink` / `paper`, `red` dibuang). Dua sumber independen sampai ke tempat yang sama.                                                                                           |
| Tipografi **Archivo / Space Grotesk**                  | **Ditolak, dengan alasan.** Syne dipilih karena digambar untuk Synesthésie, sebuah pusat seni — provenance-nya bagian dari argumennya (`DESIGN-SYSTEM.md` §2). Space Grotesk juga ada di daftar "AI-generated design tell" milik proyek ini. |
| Gaya **Motion-Driven** untuk portofolio                | **Diterima.** Ini temuan intinya — lihat §2.4.                                                                                                                                                                                               |
| Anti-pattern: **"Heavy text + Poor image showcase"**   | **Diterima sebagai diagnosis.** Lihat §2.2 dan §2.3.                                                                                                                                                                                         |

Hasil `--design-system` **tidak** di-`--persist`. Menuliskannya ke
`design-system/arth/MASTER.md` akan menciptakan sumber kebenaran kedua yang
menyebut Archivo dan hex yang bukan milik proyek ini, bersaing dengan
`docs/DESIGN-SYSTEM.md`. Yang berguna dari pencarian itu dicatat di sini.

> **`/dataviz` tidak berlaku.** Situs ini tidak punya satu pun bagan, dan
> tidak ada rencana menambahkannya — sebuah studio karya pesanan tidak
> memvisualisasikan data. Disebut supaya jelas ini keputusan, bukan
> kelalaian.

---

## 2. Temuan terukur

Semua angka di bawah dari build produksi di 1440×900, `prefers-reduced-motion:
reduce` (supaya yang dinilai adalah komposisi diam, bukan animasi yang belum
selesai).

### 2.1 Ritme section putus di satu tempat

Jarak antara header section dan isinya, halaman depan:

| Section    | Jarak header → isi |
| ---------- | ------------------ |
| `#work`    | **0px**            |
| `#studio`  | 48px               |
| `#contact` | 48px               |

Dua dari tiga konsisten; satu tidak. Judul "Recent commissions" menempel
langsung ke tepi atas gambar pertama, dan karena gambar itu besar dan gelap,
judulnya terbaca seperti caption gambar, bukan seperti judul section.

> **Catatan metode.** Pengukuran pertama saya salah bentuk: ia membandingkan
> `<h2>` dengan sibling berikutnya, yang di dalam `SectionHeader` adalah label
> "2 pieces" pada baseline yang sama — hasilnya −17px, sebuah angka yang tidak
> berarti apa-apa. Diukur ulang dari `<header>` ke elemen isi. Pelajaran yang
> sama dengan yang terus berulang di proyek ini: pengukuran yang salah bentuk
> lebih berbahaya daripada tidak mengukur.

### 2.2 Tepi kanan halaman detail bergerigi

Lebar elemen di `/en/work/rimbun`, sebagai persen viewport:

```
h1            92%
cover         78%
prosa         45%
galeri 1      65%
galeri 2      78%
next project  32%
```

Enam elemen, enam lebar berbeda. Tidak ada satu pun garis vertikal yang bisa
diikuti mata dari atas ke bawah. Gambar-gambarnya mempertahankan rasio
aslinya terhadap tinggi maksimum, jadi lebarnya jadi akibat dari rasio foto —
bukan keputusan.

Ini persis "Poor image showcase" yang ditandai skill: di situs yang seluruh
isinya karya rupa, **gambarnya adalah tata letaknya**, dan saat ini gambar
justru yang paling tidak tertata.

### 2.3 Prosa 45% di samping gambar 78%

Ukuran teks badan pada halaman detail benar secara tipografi (65 karakter,
`p` 14px) tetapi salah secara komposisi: kolom teks berhenti di 45% lebar
sementara gambar di atas dan di bawahnya berjalan sampai 78%. Teksnya jadi
terlihat seperti sisa, bukan seperti bagian.

### 2.4 `page-transition` dibangun lalu tidak pernah dipasang

> **Koreksi.** Versi pertama bagian ini menulis bahwa **seluruh**
> `vault/motion/` tidak terpakai — `text-reveal` dan `tokens.ts` ikut
> didaftar. Itu salah, dan salahnya karena inventarisnya salah bentuk: ia
> hanya memindai impor dari `app/` dan `components/`, sementara `text-reveal`
> diimpor oleh `vault/blocks/hero` (impor vault→vault) dan `tokens.ts` oleh
> `text-reveal`, `magnetic`, serta `cursor`. Sekali lagi: pengukuran yang
> salah bentuk lebih berbahaya daripada tidak mengukur.

Inventaris yang benar — impor dari mana pun:

| Modul                          | Status                                             |
| ------------------------------ | -------------------------------------------------- |
| `vault/motion/page-transition` | **tidak dipakai** — inilah temuannya               |
| `vault/motion/text-reveal`     | dipakai, lewat `vault/blocks/hero`                 |
| `vault/motion/tokens.ts`       | dipakai, lewat `text-reveal`, `magnetic`, `cursor` |

Temuannya jadi lebih sempit tapi lebih tajam: satu komponen dibangun di Phase
C lengkap dengan story dan penanganan reduced-motion, lalu **tidak pernah
dipasang** — dan karena tidak pernah dirender, dua bug di dalamnya tidak
pernah terlihat. Keduanya dicatat di §3b.

Yang tetap benar dari temuan awal, dan diukur ulang: **berpindah halaman
terasa seperti memuat dokumen**, dan di luar beranda hampir tidak ada yang
beranimasi masuk — `useReveal` hanya terpasang di `project-grid`, `hero`, dan
`studio-note`. Halaman katalog dan halaman karya, dua dari tiga kelas halaman
di situs ini, tidak menganimasikan apa pun.

Untuk situs portofolio itu bukan kekurangan efek: perpindahan halaman adalah
sebagian besar pengalamannya. Skill menandai product type ini sebagai
Motion-Driven; situsnya belum.

### 2.5 Yang diperiksa dan ternyata **bukan** cacat

Dicatat supaya tidak diperiksa ulang, dan supaya daftar di atas tidak dibaca
lebih panjang dari yang sebenarnya:

- **`<h1>` halaman detail tidak terpotong.** Terlihat mepet di screenshot, jadi
  saya ukur: `overflow: visible`, kotak h1 mulai persis di kotak induknya,
  `font-size: 120px` dalam `line-height: 102px`. Kerapatan itu adalah leading
  85% yang memang disengaja (`DESIGN-SYSTEM.md` §2) — tanda tipografi yang
  dipikirkan, bukan bug.
- **Chip filter di mobile** membungkus ke baris kedua dengan benar, target
  sentuh terpenuhi, `aria-current` mendarat di chip yang tepat.
- **Kartu di katalog** sudah satu ritme sejak commit sebelumnya.

---

## 3. Rencana kerja

Empat sub-tahap, diurutkan dari yang paling murah dan paling pasti ke yang
paling mahal. Tiap satu berdiri sendiri dan bisa dihentikan tanpa
meninggalkan situs setengah jadi.

### 11a. Menegakkan ritme spasial (murah, pasti)

Satu keputusan: jarak header→isi adalah satu token, dipakai semua section.

- `--space-section-lead` di skala spasi, bukan angka di satu modul CSS.
- `#work` ikut 48px seperti dua saudaranya.
- Sapu semua section di semua rute untuk jarak yang menyimpang.

**Gate:** tes yang membaca jarak header→isi tiap section di tiap rute dan
menuntut **satu nilai**, sama seperti `catalogue-layout.e2e.ts` menuntut satu
span. Dibuktikan merah dulu terhadap `#work` yang sekarang 0px.

### 11b. Menegakkan tepi (murah, pasti)

Gambar berhenti menentukan lebarnya sendiri. Dua lebar saja, keduanya token:

- **penuh** — kolom konten, 78%;
- **inset** — 65%, dipakai untuk gambar yang memang layak diberi jeda.

Yang dipilih adalah keputusan editor lewat field, bukan akibat rasio foto.
Rasio dijaga dengan `aspect-ratio` + `object-fit`, bukan dengan membiarkan
lebar melar. Prosa naik dari 45% ke lebar yang sejajar dengan salah satu dari
dua lebar itu, supaya ada garis vertikal yang bisa diikuti.

**Gate:** tes yang mengumpulkan lebar tiap elemen media di halaman detail dan
menuntut himpunannya **berukuran ≤ 2**. Merah sekarang (6 lebar berbeda).

### 11c. Memasang motion yang sudah dibangun (sedang)

`vault/motion/page-transition` dan `text-reveal` dipasang, dengan tier yang
dipilih sadar dari hasil skill:

| Gerakan             | Tier     | Durasi    | Kenapa tier itu                                                                             |
| ------------------- | -------- | --------- | ------------------------------------------------------------------------------------------- |
| Perpindahan rute    | Subtle   | 200–300ms | Skill: "exit harus selesai lebih cepat dari entrance" supaya back/forward terasa responsif. |
| Judul halaman masuk | Standard | 400ms     | Default proyek (aturan keras #3), tepat di tengah band standard.                            |
| Kartu grid muncul   | Subtle   | 250–350ms | Sudah ada lewat `useReveal`; yang diubah hanya durasinya agar sejajar dengan token.         |

Yang **tidak** diambil dari skill: easing `back.out(1.4)`. Itu overshoot, dan
aturan keras #1 melarang cubic-bezier mentah di komponen — easing harus dari
token `--ease-*`. Overshoot juga salah nada untuk situs galeri: karya rupa
tidak memantul.

Yang ditunda ke 11d: **shared-element transition (GSAP Flip)** dari kartu ke
halaman karya. Itu gerakan yang paling mengubah kesan situs ini, dan juga
yang paling mahal.

**Gate:** `route-budget.e2e.ts` sudah ada dan menjaga byte per rute — motion
baru tidak boleh menembusnya. Ditambah: tiap gerakan wajib punya keadaan akhir
yang benar di bawah `prefers-reduced-motion` (aturan keras #5), diperiksa
dengan render reduced-motion, bukan dengan membaca kode.

### 11d. Shared-element card → detail (mahal, opsional)

Sampul di kartu katalog dan sampul di halaman karya adalah gambar yang sama.
GSAP Flip bisa membuatnya bergerak, bukan berkedip.

Diletakkan terakhir dan ditandai opsional karena tiga alasan jujur:

1. Butuh plugin Flip, dan `Flip.from` **diam-diam tidak melakukan apa-apa**
   kalau elemennya tidak ada di kedua state — mode kegagalan yang tidak
   berbunyi.
2. Halaman karya sekarang `○` statis; transisi bersama menuntut kedua sisi
   ada di DOM pada saat yang sama, dan itu bersinggungan dengan cara Cache
   Components mengalirkan halaman.
3. Skill sendiri memperingatkan: jangan lebih dari satu pasang elemen per
   navigasi, dan uji di perangkat lemah karena Flip menghitung ulang layout.

Kalau (2) ternyata mahal, ini dibatalkan dan dinyatakan dibatalkan — bukan
dikerjakan setengah.

---

## 4. Yang tidak akan disentuh

Ditulis supaya tidak ada agen berikutnya yang "memperbaiki" ini:

- **Palet.** Dua netral hangat, tanpa aksen. Sudah dikonfirmasi ulang §1.
- **Tipografi.** Syne + Geist Mono, tiga bobot. Skala di `typography.ts`
  sudah diukur ulang sampai dua kali.
- **Leading di bawah 100%** pada display. Itu tanda tangannya, bukan bug.
- **`caption` 11px di mobile.** Pernah 8px dengan catatan mengakui itu terlalu
  kecil; catatan bukan perbaikan.
- **WebGL.** Tetap di balik feature flag, tetap aksen. Aturan keras #13.

---

## 5. Kriteria keluar

| Kriteria                                                      | Cara membuktikan                                |
| ------------------------------------------------------------- | ----------------------------------------------- |
| Jarak header→isi satu nilai di semua section, semua rute      | gate spasial, merah dulu terhadap `#work`       |
| Elemen media halaman detail ≤ 2 lebar berbeda                 | gate tepi, merah dulu terhadap 6 lebar sekarang |
| `vault/motion` terpasang atau dihapus — tidak menganggur      | inventaris impor, sama seperti §2.4             |
| Tiap gerakan punya keadaan akhir benar di reduced-motion      | render reduced-motion, bukan pembacaan kode     |
| `bun run check`, `build`, `test:e2e`, `build-storybook` hijau | seperti tiap tahap                              |
| Tiap halaman **dilihat**, dua bahasa, dua viewport            | screenshot, bukan hanya gerbang hijau           |

Kriteria terakhir ada karena tahap sebelumnya baru saja membuktikan kenapa:
katalog lolos axe, lolos tanpa-JS, lolos header, dan tetap salah bentuk sampai
seseorang melihat gambarnya.
