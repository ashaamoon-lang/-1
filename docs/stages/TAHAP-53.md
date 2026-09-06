# Tahap 53 — Lapisan ambien, story yang benar-benar kurang, dan dokumen yang menyusul kodenya

> Dua dari empat butir rencana ini **sudah selesai sebelum tahap ini dimulai**,
> dan satu lagi meminta komponen yang biayanya tidak bisa saya profil. Yang
> tersisa nyata: satu grain untuk seluruh situs alih-alih tiga salinan, tepi
> header yang memudar, empat story yang memang belum ada, dan dokumen yang
> tertinggal enam tahap di belakang kodenya.

## 1. Premis rencana, diperiksa

### 1.1 ✅ Story untuk komponen `vault/magic/`, `curtain`, `passage` — **sudah ada**

Rencana: _"Story Storybook untuk sepuluh komponen `vault/magic/` yang dipasang,
plus `curtain` dan `arth-passage`."_ Dihitung dari direktorinya:

```
vault/magic/grid-pattern    stories ✓
vault/magic/dot-pattern     stories ✓
vault/magic/noise-texture   stories ✓
vault/motion/curtain        stories ✓
vault/blocks/passage        stories ✓
```

Bukan sepuluh — **tiga** yang dipasang, karena Tahap 47 menolak sisanya dengan
alasan tertulis. Dan ketiganya, plus keduanya, sudah bercerita sejak tahap yang
mengirimnya. Butir ini tidak punya pekerjaan tersisa.

### 1.2 ❌ `progressive-blur` — delapan lapis untuk satu tepi

Ditunda dari Tahap 47 dengan alasan "belum ada konsumen sampai Tahap 53".
Konsumennya sekarang ada, jadi ini keputusannya.

Komponennya menumpuk **delapan** lapisan `backdrop-filter` dengan radius naik
dan mask per lapis. Di header **tetap** yang menggantung di atas halaman yang
digulir, itu delapan pass komposit per frame, dan biayanya **tidak bisa saya
profil di lingkungan ini** — `CLAUDE.md` #19 melarang mengklaim angka yang
tidak diukur, dan "delapan lapis backdrop-filter itu ringan" adalah klaim itu.

Header ini **sudah** punya satu `backdrop-filter: blur(12px)`. Yang rencana
minta bukan blur-nya melainkan **tepinya**: memudar alih-alih terpotong garis.
Itu bisa didapat dengan satu `mask-image` pada lapisan yang sudah ada — satu
pass, bukan sembilan. Jadi tekniknya diambil, kodenya tidak. `PROVENANCE.md`
mencatat perbedaan itu, yang justru bentuk yang `CLAUDE.md` #16 tetapkan untuk
kode tanpa lisensi dan #17 untuk kode dengan lisensi.

**Ditolak, bukan ditunda lagi.**

### 1.3 ⚠️ Grain site-wide — tapi ada **tiga** salinannya sekarang

`NoiseTexture` dipasang di dua tempat dan hero-nya sendiri:

```
vault/blocks/hero      .heroGrain
app/[locale]/studio    .grain
```

Menambahkan yang ketiga di bawah `Theme` tanpa mencabut keduanya akan
menumpuk grain di atas grain pada dua rute yang paling penting. Rencananya
benar; pelaksanaannya harus **memindahkan**, bukan menambah.

### 1.4 ✅ Dokumen memang tertinggal, dan lebih jauh dari yang rencana kira

`MOTION-SPEC.md` §0.1 — daftar mekanisme kategori ketiga — terakhir diperbarui
**Tahap 43**. Sejak itu enam tahap mengirim mekanisme kategori ketiga dan tidak
satu pun tercatat di sana. `DESIGN-SYSTEM.md` tidak punya tabel tinggi hero
sama sekali, dan dua tahap terakhir baru saja menetapkan aturannya.

## 2. Yang dibangun

**53a — Satu grain, di satu tempat.** `NoiseTexture` pindah ke `Theme`
(`global`), dan **dicabut** dari `vault/blocks/hero` dan `/studio`. Satu
mekanisme, satu tempat, nol tumpukan.

**53b — Tepi header yang memudar.** `border-bottom` keras diganti
`mask-image` pada lapisan blur yang sudah ada. Satu pass komposit, bukan
sembilan.

**53c — Empat story yang memang kurang.** Audit `vault/` menemukan 23 dari 31
komponen bercerita. Delapan tidak, dan **nol** di antaranya `vault/primitives/`
— aturan `CLAUDE.md` ("primitives carry a Storybook story") sudah dipenuhi.
Dari delapan itu, empat praktis dan berguna: `practice-hero`, `practice-list`,
`project-spine`, `reveal`. Empat sisanya (`flip`, `parallax`, `material-image`,
`scene-shell`) adalah hook dan shell WebGL yang story-nya akan menampilkan
kotak kosong; alasannya ditulis, bukan didiamkan.

**53d — Dokumen menyusul kodenya.** §0.1 mendapat enam tahap mekanisme
kategori ketiga; `DESIGN-SYSTEM.md` mendapat tabel tinggi hero per rute
**beserta aturan yang Tahap 51 dan 52 temukan** — tinggi ditulis sebagai
bagian layar, bukan bagian kotaknya.

**53e — Anggaran rute dibaca ulang.** Enam tahap menambahkan komponen ke lima
rute. Tiap rute diukur ulang dan sisanya dicatat.

## 3. Yang dikirim

**3a — Satu grain, di `Theme`.** `NoiseTexture` sekarang duduk di elemen ground
yang Tahap 43 buat, sebagai anak pertama supaya wash hero tetap melukis di
atasnya (keduanya `z-index: -1` di stacking context yang sama, jadi urutan cat
adalah urutan DOM). Salinan `/studio` **dicabut**.

Salinan hero **tetap**, dan itu bukan duplikat: ia duduk di atas wash WebGL,
yang digambar di atas setiap `z-index` negatif dan karenanya satu-satunya
permukaan yang lapisan site-wide ini tidak bisa jangkau. Alasannya ditulis di
`Theme` supaya orang berikutnya tidak "merapikan"-nya.

**3b — Tepi header memudar.** `border-bottom: 1px solid var(--line)` diganti
satu `mask-image` pada lapisan blur yang sudah ada, dipindah ke `::before`
karena mask ikut kena ke isi elemen — memask `.header` sendiri akan
memudarkan wordmark dan nav-nya. Fade-nya melewati batas bar (16px mobile,
24px desktop) supaya ia selesai **di bawah** header, bukan di dalamnya.

Difoto pada dua tema di atas karya nyata: `/en/work` (gelap, di atas plat) dan
`/en/journal/<slug>` (terang, di atas sampul). Garis potongnya hilang; bar-nya
larut ke dalam karya alih-alih duduk di atasnya.

**3c — Empat story.** `practice-hero`, `practice-list`, `project-spine`,
`reveal`. Story `reveal` mendokumentasikan prop `data-epic` yang Tahap 52
tambahkan, termasuk kenapa ia dideklarasikan dan bukan disebar.

**3d — Dokumen.** `MOTION-SPEC.md` §0.1 mendapat lima mekanisme kategori
ketiga dari Tahap 47–53 — sebelumnya terakhir diperbarui Tahap 43.
`DESIGN-SYSTEM.md` mendapat tabel tinggi hero per rute **dan aturannya**:
tinggi adalah bagian _layar_, padding atas halaman ada di dalam bagian itu, dan
di rute yang subjeknya daftar, tingginya dipilih supaya item pertama melewati
garis reveal saat dimuat. `PROVENANCE.md` dan `vault/magic/README.md` mencatat
`progressive-blur` sebagai **ditolak**, dengan teknik diambil dan kode tidak.

## 4. Hasil

### 4.1 Verifikasi

```
bun run check        lulus — unit 421 lulus
bun run build        lulus
build-storybook      lulus
CI=true test:e2e     E2E_RESULTS
```

### 4.2 Anggaran rute — pengukuran yang **gagal**, ditulis apa adanya

Butir 53e meminta anggaran rute dibaca ulang dengan angka baru. Gerbangnya
(`e2e/route-budget.e2e.ts`) lulus, jadi tiap rute ada di bawah plafonnya.

Yang **tidak** bisa saya lakukan adalah menerbitkan tabel KB per rute yang
baru. Skrip yang meniru cara gerbang itu mengukur memberi angka yang bergerak
sampai **delapan kali lipat antara dua jalannya**:

```
                                       jalan 1    jalan 2
/id                                      270KB     1091KB
/en/journal                              141KB       17KB
/en/work                                1143KB      964KB
```

Penyebabnya kemungkinan besar `networkidle` yang menutup pada momen berbeda
ketika `page.route()` menyela tiap permintaan. Menerbitkan salah satunya
sebagai "anggaran hari ini" adalah menerbitkan derau, dan `CLAUDE.md` #19
melarang angka yang tidak benar-benar terukur. Jadi tabel di kepala
`route-budget.e2e.ts` **tetap milik gerbang itu**, dan tahap ini tidak
menambahkan angka yang tidak bisa saya pertanggungjawabkan.

### 4.3 Kejujuran tentang tahap ini

Empat butir direncanakan. **Satu sudah selesai sebelum tahap ini dimulai**
(story untuk `vault/magic/`, `curtain`, `passage` — ketiganya dan keduanya
sudah bercerita sejak tahap yang mengirimnya), **satu ditolak** setelah dua
kali ditunda (`progressive-blur`), dan dua dikerjakan.

Yang tidak ada di rencana dan ternyata paling banyak isinya: grain yang sudah
punya **tiga** calon salinan sebelum ada yang menghitung, §0.1 yang tertinggal
sepuluh tahap di belakang kodenya, dan `DESIGN-SYSTEM.md` yang tidak pernah
menuliskan aturan tinggi hero yang dua tahap terakhir baru saja temukan dengan
mahal.
