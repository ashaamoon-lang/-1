# TAHAP 12 — Tata bahasa interaksi: dari indah menjadi hidup

Stage-spec yang diwajibkan `docs/ROADMAP.md` §3.0.

Tahap 11 membuat halaman ini **indah saat diam**: ritme spasial satu token,
tepi media lurus, transisi rute terpasang, morph sampul dari kartu ke halaman
karya. Yang belum ada adalah **apa yang terjadi ketika seseorang menyentuhnya.**

Tahap ini soal itu. Aturannya sama: tiap klaim diukur, tiap perbaikan datang
dengan gate yang dibuktikan merah dulu, dan yang tidak dikerjakan dinyatakan.

---

## 0. Sektor bisnis — koreksi yang mengubah seluruh kalibrasi

Sampai Tahap 11 saya bekerja dengan asumsi bahwa Arth adalah **studio karya
seni pesanan**. Itu keliru. Arth adalah **agency high-ticket**: consulting,
AI/data, dan komisi berbayar.

**Koreksi atas analisis saya sendiri di Tahap 1.** Waktu itu saya menolak palet
v1 dengan alasan korpus `docs/TEARDOWN.md` — Lusion, basement.studio, By-Kin,
darkroom.engineering, Bruno Simon — "diterapkan pada jenis situs yang salah:
situs yang diukur adalah studio kode dan 3D". Dengan sektor yang benar,
kesimpulan itu **terbalik**: kesepuluh situs itu justru agency high-ticket yang
menjual lewat demonstrasi kepiawaian. Korpusnya tepat sasaran sejak awal.

Yang **tidak** berubah karena koreksi ini:

- **Palet dan tipografi tetap.** Alasan Tahap 1 v2 berdiri sendiri: `contrast-baseline.json`
  kosong (turun dari 12 pengecualian), dan Syne dipilih atas provenance. Sebuah
  koreksi sektor tidak membatalkan hasil ukur kontras.
- **Kurva, pita durasi, dan grid tetap.** Semuanya berasal dari korpus yang
  ternyata justru **lebih** relevan sekarang, bukan kurang.

Yang berubah: **standar yang berlaku.** Situs agency high-ticket dinilai dari
apa yang terjadi saat ditekan. Itulah yang belum ada di sini.

> **Dinyatakan terbuka, bukan dikerjakan di tahap ini.** Kosakata konten masih
> studio seni — `messages/*.json`, `lib/content/home-fallback.ts`, dan skema
> `project` (`discipline: painting/mural/illustration`, `medium`, `dimensions`)
> semuanya bicara lukisan dan mural. Menyelaraskannya ke agency adalah
> pekerjaan tersendiri yang butuh keputusan pemilik, bukan keputusan saya.
> Tahap ini menggarap **gerak dan komposisi**, dan komposisi bisa dinilai
> dengan kosakata apa pun.

---

## 1. Ritual `ui-ux-pro-max` — hasil mentah, termasuk yang nol

`.claude/agents/HOUSE-RULES.md` dan `ROADMAP.md` §2.1 mewajibkan ini sebelum
keputusan UI, dan mewajibkan hasilnya ditempel **termasuk kalau nol**.

### 1.1 Query yang dijalankan

```bash
S=.claude/skills/ui-ux-pro-max/scripts/search.py
python3 $S "Portfolio Grid"              --domain landing
python3 $S "Hero-Centric Design"         --domain landing
python3 $S "button press feedback state" --domain ux    -n 5
python3 $S "keyboard navigation focus"   --domain ux    -n 4
python3 $S "page transition"             --domain gsap  -n 5
python3 $S "hover micro interaction"     --domain gsap  -n 5
python3 $S "scroll reveal stagger"       --domain gsap  -n 3
python3 $S "text reveal split"           --domain gsap  -n 2
```

### 1.2 Satu query mengembalikan nol, dan itu dilaporkan

```
python3 $S "hero entrance choreography" --motion 6
→ Domain: landing (auto-detected) | Found: 0 results
→ "No matches. This is not a match with an empty value -- the query did not
   hit the database."
→ Closest known terms: Hero-Centric Design, Portfolio + Hero-Centric, …
```

Skill itu sendiri memerintahkan: ulangi dengan istilah terdekat sebelum jatuh
ke default umum, dan **katakan terus terang** kalau tetap nol. Diulang dengan
`"Hero-Centric Design"` → 1 hasil, dipakai di §4.1. **Tidak ada** pola
"koreografi kedatangan hero" di database skill ini; apa pun yang saya rancang
untuk kedatangan hero bukan berbasis database, dan disebut begitu.

### 1.3 Yang dipakai, yang ditolak

| Hasil skill                                                                                                               | Putusan                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `portfolio-grid` — urutan `Hero > Project Grid > About > Contact`; "Neutral background (let work shine)"; "Visuals first" | **Diterima — konfirmasi.** Persis susunan `app/[locale]/page.tsx` hari ini.                                                                                                                                          |
| `hero-centric-design` — "Let the hero dominate the initial viewport **without hiding the next content cue**"              | **Diterima sebagai diagnosis.** Hero kita mendominasi dan **tidak** punya cue. Lihat §3.1.                                                                                                                           |
| UX `Active States`: "Show immediate feedback on press/click · Do: add pressed/active state · Severity: Medium"            | **Diterima, dan ini temuan intinya.** Lihat §3.4 — proyek ini punya **nol**.                                                                                                                                         |
| UX `Back Button`: "Users expect back to work predictably · Severity: High"                                                | **Diterima sebagai gate.** Menjadi gate interupsi, §6.2.                                                                                                                                                             |
| UX `Keyboard Navigation` + `Focus States`, severity **High** ×2                                                           | **Diterima sebagai aturan mengikat** §5.2b.                                                                                                                                                                          |
| GSAP `Page Transition / Complex` — Flip, `expo.inOut`, 500–800ms, "verify the shared element exists in both DOM states"   | **Sudah dikerjakan, dengan cara lain.** Tahap 11d memakai React `<ViewTransition>` — nol pustaka, geometri diurus browser. Peringatan "jangan lebih dari satu pasang per navigasi" **diadopsi** sebagai aturan §5.2. |
| GSAP `Hover / Complex` — magnetic, `elastic.out(1,0.4)`, "jangan lebih dari 1–2 elemen fokal per layar"                   | **Kurvanya ditolak, batasannya diterima.** `elastic` adalah kurva mentah dan pantulan salah nada — sudah ditolak dengan alasan yang sama di 11c. `Magnetic` sudah dibatasi ke CTA hero saja.                         |
| GSAP `Hover / Standard` — `boxShadow: '0 12px 24px …'`                                                                    | **Ditolak.** `CLAUDE.md` #4 melarang menganimasikan `box-shadow`. Ini rekomendasi yang melanggar aturan keras proyek.                                                                                                |
| GSAP `Hover / Standard` — `gsap.quickTo()` untuk daftar dengan 20+ target                                                 | **Dicatat, belum berlaku.** Katalog terbesar hari ini 3 kartu. Kalau menembus ~20, ini jalannya.                                                                                                                     |
| GSAP `Stagger / Complex` — `stagger: 0.015` chars, `expo.out`, "revert SplitText on unmount"                              | **Sudah dikerjakan.** `vault/motion/text-reveal` melakukan keduanya.                                                                                                                                                 |
| GSAP `Scroll Reveal / Subtle` — "y offset kecil 8–16px", "jangan sembunyikan konten SEO tanpa fallback no-JS"             | **Sudah dikerjakan.** `[data-reveal]` default `translateY(16px)`, dan seluruh kontrak scoped di bawah `[data-reveal]` sehingga tanpa JS konten tampil.                                                               |

Sekali lagi hasil `--design-system` **tidak** di-`--persist`, alasan sama
seperti Tahap 11 §1: itu akan menciptakan sumber kebenaran kedua yang bersaing
dengan `docs/DESIGN-SYSTEM.md`.

---

## 2. Inventaris — apa yang sudah ada sebelum menulis apa pun

`ROADMAP.md` §3.0 butir 3. Komponen baru **hanya** untuk yang benar-benar belum
ada.

### 2.1 Perkakas animasi: lengkap, dan sebagian besar menganggur

GSAP 3.15 membawa seluruh plugin klubnya secara gratis, dan proyek ini sudah
memasangnya.

| Terpasang                                                                   | Dipakai untuk apa hari ini                            |
| --------------------------------------------------------------------------- | ----------------------------------------------------- |
| ScrollTrigger, SplitText                                                    | ya — `text-reveal`, reveal seksi                      |
| Flip, Observer                                                              | **nol**                                               |
| MorphSVG, DrawSVG, MotionPath, CustomEase, Inertia, Draggable, ScrambleText | **nol**                                               |
| three.js + R3F + drei + `postprocessing`                                    | hanya aksen latar hero (`SceneShell`)                 |
| `lib/webgl/components/image/webgl.tsx`                                      | pipeline gambar WebGL — **menganggur untuk transisi** |
| Theatre.js (`lib/dev/theatre/`)                                             | alat dev, bukan koreografi terkirim                   |

**Kesimpulan: tahap ini tidak boleh memasang satu pustaka pun.** Yang kurang
bukan perkakas.

### 2.2 Yang sudah ada dan akan dipakai ulang, bukan dibangun ulang

| Sudah ada                                                           | Menutupi kebutuhan                                                                      |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `lib/hooks/use-reveal.ts` + kontrak `[data-reveal]` di `global.css` | reveal masuk-viewport, stagger via `--reveal-index`, aman tanpa JS, aman reduced-motion |
| `vault/motion/tokens.ts`                                            | jembatan CSS↔GSAP: `easing`, `duration`, `stagger`                                      |
| `vault/motion/text-reveal/`                                         | reveal headline per baris/kata/karakter                                                 |
| `vault/motion/page-transition/`                                     | penutup rute + `maxWait` + `data-state`                                                 |
| `lib/motion/navigation-signal.ts`                                   | niat navigasi `cover` \| `morph`                                                        |
| `lib/motion/transition-name.ts`                                     | nama `<ViewTransition>` per slug                                                        |
| `vault/primitives/magnetic/`, `cursor/`                             | tarikan pointer, kursor kustom                                                          |
| `lib/scripts/seed-fixtures.ts`                                      | **generator + pengunggah aset dummy, lengkap dengan `--clean`**                         |
| `lib/scripts/generate-brand-assets.ts`                              | preseden render Playwright → PNG                                                        |

**Temuan inventaris paling berharga:** rencana tahap ini menyebut "prasyarat:
aset dummy — generate sendiri, unggah ke Sanity, bisa dihapus satu perintah."
Itu **sudah ada seluruhnya** di `seed-fixtures.ts`: ia membuat gambar dengan
`sharp`, mengunggahnya lewat `curl` (dengan alasan transport yang tertulis),
memberi awalan `fixture-` pada tiap dokumen, dan `--clean` menghapus dokumen
**dan** asetnya. Menulis skrip aset baru akan menjadi duplikasi. **Tahap 12a
memperluas skrip itu, tidak menggantinya.**

### 2.3 Yang benar-benar hilang: dokumen yang mengikat

`docs/MOTION-SPEC.md` (214 baris) mendefinisikan **material** — kurva, tiga pita
durasi, stagger, apa yang boleh dianimasikan, reduced motion, anggaran
performa, checklist. Ia **tidak punya satu pun model state interaksi**: tidak
ada `press`, tidak ada `commit`, tidak ada `interrupt`.

Ia memberi tahu bagaimana sebuah tween boleh **terlihat**. Ia tidak memberi
tahu sebuah **momen** tersusun dari apa.

Itulah sebabnya animasinya berhenti di "gulir yang nyaman".

---

## 3. Temuan terukur

Semua angka dari **build produksi**, Chromium 1440×900, `prefers-reduced-motion:
reduce` — supaya yang dinilai komposisi diam, bukan animasi yang belum ada.
Dataset: tiga fixture (`bun --env-file .env.local lib/scripts/seed-fixtures.ts`).

### 3.1 Hero memakai layar tanpa mengisinya

```
tinggi hero            900px  (100svh)
tinggi header           98px
tinta pertama (h1)     y=239
tinta terakhir (CTA)   y=695
```

Konten menempati **456px dari 900px — 51%**. Sisanya: 141px kosong antara
header dan judul, 205px kosong di bawah CTA. Keduanya akibat `align-items:
center`, bukan keputusan.

Lebarnya adalah tangga menurun tanpa apa pun di sebelah kanannya:

| Elemen  | Lebar  | % viewport |
| ------- | ------ | ---------- |
| `h1`    | 1080px | **75%**    |
| subline | 378px  | **26,3%**  |
| CTA     | 173px  | **12%**    |

Dan — persis anti-pattern yang ditandai skill (`hero-centric-design`: "without
hiding the next content cue") — **tidak ada isyarat apa pun bahwa halaman ini
berlanjut.** Layar pertama habis 900px, dokumennya 4385px, dan tidak ada satu
elemen pun yang mengatakan itu.

### 3.2 Satu section meninggalkan separuh layar kosong

> **Koreksi atas rencana saya sendiri.** Rencana tahap ini menulis "**tiga**
> section memakai kolom kiri sempit — sisi kanan ~55% kosong". Diukur ulang per
> elemen daun (`p, h2, h3, li, a, img`) alih-alih per section, angkanya
> berbeda dan lebih spesifik:

| Section    | Tepi kanan terjauh isi                         | Tepi kanan prosa  |
| ---------- | ---------------------------------------------- | ----------------- |
| `#work`    | 98,2% (kartu span-12)                          | —                 |
| `#studio`  | 98,2% (header)                                 | **46,3%** (666px) |
| `#contact` | 98,2% (daftar sosial, dipatok kanan 1334→1414) | 36,1% (email)     |

Jadi yang benar: **satu** section meninggalkan sisi kanan benar-benar kosong
(`#studio`: prosa berhenti di 666px, header berjalan sampai 1414px — **748px
kolom kosong** di sebelah kolom teks 650px). `#contact` justru **sudah**
memakai kedua tepi dengan sengaja, dan `#work` penuh.

Pelajaran metode yang sama, ketiga kalinya di proyek ini: **pengukuran yang
salah bentuk lebih berbahaya daripada tidak mengukur** — ia menghasilkan angka
yang terdengar meyakinkan dan menuntun ke perbaikan yang salah sasaran.

Penyebabnya terbaca di kode: `studio-note.module.css` memberi `.body` dua kolom
`7fr 5fr` **hanya** di bawah `[data-has-portrait]`, dan fixture tidak punya
portrait. Tanpa portrait, `.body` tetap satu kolom dan `.prose` yang dibatasi
`max-width: 65ch` (benar secara tipografi) menjadi satu-satunya isi.

### 3.3 Beranda memajang dua karya

`/en` menampilkan **2 kartu**; `/en/work` menampilkan **3**. Sebuah seksi
berjudul "Recent commissions" dengan dua isi tidak bisa dinilai sebagai
komposisi grid — dan tidak bisa membuktikan gelombang stagger yang jadi inti
tahap ini.

Rasio sumber gambar di seluruh situs: **dua saja.**

| Aset     | Piksel    | Rasio                                    |
| -------- | --------- | ---------------------------------------- |
| cover ×2 | 1600×2000 | 0,80                                     |
| cover ×1 | 2000×1250 | 1,60                                     |
| galeri   | 2000×1500 | 1,33 (tidak pernah tampil sebagai cover) |

`vault/blocks/project-gallery` bercabang pada orientasi (landscape/persegi =
penuh, potret = separuh). Dengan dua rasio, cabang **persegi** tidak pernah
dilewati sama sekali.

### 3.4 Temuan intinya: state COMMIT tidak ada di mana pun

```bash
grep -rn ":active" --include=*.css app components vault lib | wc -l
→ 0
```

**Nol.** Delapan belas file CSS memakai `:hover`; **tidak satu pun** elemen di
seluruh situs berubah saat ditekan. Satu-satunya `pointerdown` dalam kode
adalah milik scrollbar kustom.

Artinya: antara "saya menyentuh ini" dan "halaman baru muncul", situs ini
**diam total**. Pada koneksi cepat jeda itu pendek dan terasa mahal; pada
koneksi lambat ia terbaca sebagai klik yang tidak diterima. Skill menandai ini
`Severity: Medium`; untuk situs yang menjual kepiawaian interaksi, ia lebih
berat dari itu.

Ini bukan bug satu komponen. Ini **kosakata yang hilang**.

---

## 4. Tata bahasa interaksi — yang akan ditulis sebagai `MOTION-SPEC.md` §10

Memperluas dokumen yang sudah mengikat, **bukan** dokumen baru yang bersaing
dengannya. Alasannya sama dengan alasan tidak mem-`--persist` hasil skill.

### 4.1 Model state

Setiap elemen yang bisa ditekan — kartu, CTA hero, chip disiplin, item nav —
melewati rangkaian yang **sama**. Satu tata bahasa, banyak kata benda. Itulah
pola fleksibel yang diminta: bukan lima efek berbeda, melainkan satu kalimat
yang bisa mengucapkan banyak hal.

```
REST ──▶ INTENT ──▶ COMMIT ──▶ TRANSPORT ──▶ SETTLE ──▶ REST′
         hover/     tekan/      lepas/         tujuan
         focus      Enter       navigasi       terpasang
```

| State         | Pita (`MOTION-SPEC` §2)  | Token easing       | Yang terjadi                                   | Ada hari ini?                |
| ------------- | ------------------------ | ------------------ | ---------------------------------------------- | ---------------------------- |
| **REST**      | —                        | —                  | keadaan terender; ini yang tampil tanpa JS     | ya                           |
| **INTENT**    | micro 150–250ms          | `--ease-out-quart` | elemen menyatakan dirinya hidup                | sebagian (`:hover`, 18 file) |
| **COMMIT**    | micro ~120ms             | `--ease-out-quart` | **antisipasi** — kompresi sesaat sebelum lepas | **tidak** (§3.4)             |
| **TRANSPORT** | standard 400ms           | `--ease-out-expo`  | elemen yang ditekan **menjadi panggung**       | ya (11d morph)               |
| **SETTLE**    | choreographed 800–1200ms | `--ease-out-expo`  | dunia tujuan merakit diri di sekelilingnya     | sebagian                     |

**Antisipasi adalah kuncinya.** Itu yang membedakan animasi game dari transisi
web: ada satu ketukan kompresi sebelum pelepasan. Tanpa itu gerakan terasa
**diumumkan**, bukan **dilakukan**. 120ms berada di dalam pita micro dan tidak
menambah pita baru.

**Overshoot ditolak, dengan alasan.** Data skill menyarankan `back.out(1.4)` dan
`elastic.out(1, 0.4)` untuk tier ini. Keduanya kurva mentah — `CLAUDE.md` #1 —
dan pantulan salah nada untuk situs ini; sudah ditolak dengan alasan yang sama
di Tahap 11c. Pengendapan lewat `--ease-out-expo`, bukan pantulan.

### 4.2 Aturan yang mengikat tiap momen

1. **Bisa diinterupsi, dengan resolusi terdefinisi.** Klik dua kali, tekan Back
   di tengah TRANSPORT — tidak boleh ada layar tersangkut. Ini mode kegagalan
   yang **sudah pernah terjadi** di proyek ini dan sudah sebagian digerbangi
   (`maxWait` di `vault/motion/page-transition`). Skill menandai perilaku Back
   `Severity: High`.
2. **Bisa dicapai keyboard.** `:focus-visible` = INTENT, Enter/Space = COMMIT.
   Kalau sebuah momen hanya bisa dicapai kursor, ia bukan tata bahasa — ia
   dekorasi. Dua entri skill severity **High**.
3. **Reduced-motion mengubah durasi, bukan hasil.** State tetap berganti;
   transisinya jadi seketika. Konten **selalu** berakhir benar. `TEARDOWN.md`
   §6: tujuh dari sepuluh situs referensi tidak mengirim `prefers-reduced-motion`
   sama sekali — di sinilah keunggulan nyata, bukan di efek baru.
4. **REST adalah keadaan terender.** Tanpa JavaScript, REST-lah yang tampil;
   seluruh tata bahasa bersifat **aditif**. Ini yang menjaga gate no-JS Tahap 10
   tetap hijau.
5. **Satu pasang morph per navigasi.** Aturan yang datang dari skill dan sudah
   dipatuhi Tahap 11d.

### 4.3 Anggaran momen epik

Situs award tidak membuat semuanya epik — mereka membuat **satu atau dua** hal
epik dan menjaga sisanya tenang. Restraint yang sudah dipakai proyek ini untuk
warna dan tipografi (dua huruf, tiga bobot, nol aksen kromatik) sekarang
diberlakukan untuk gerak.

**Maksimal dua gerakan pita choreographed per halaman, dan keduanya disebut
namanya.**

Di beranda:

1. **Kedatangan hero** — sekali per muat halaman.
2. **Kartu → halaman karya** — TRANSPORT + SETTLE penuh.

Selain dua itu: micro dan standard saja. Sebuah chip filter tidak berhak
mendapat 1200ms. Ini menjadi **gate yang bisa gagal** (§6.4), bukan niat baik.

---

## 5. Rencana kerja — lima sub-tahap, masing-masing satu commit

### 12a — Aset dummy dengan komposisi nyata dan rasio beragam

Prasyarat, dan alasannya: **komposisi tidak bisa dinilai di atas dua rasio dan
dua kartu.** Gelombang stagger butuh isi untuk beriak.

**Sumber eksternal bukan pilihan, dan ini terukur:**

| Batasan                             | Nilai                      |
| ----------------------------------- | -------------------------- |
| `next.config.ts` `remotePatterns`   | **hanya** `cdn.sanity.io`  |
| `lib/integrations/csp.ts` `img-src` | `'self'`, `data:`, `blob:` |

Picsum/Unsplash ditolak dua kali. Melonggarkan CSP yang baru diberi gigi di
Tahap 9 bukan harga yang sepadan untuk aset sementara. Lisensi juga: aset yang
**di-generate** menghapus seluruh persoalan `PROVENANCE.md` §16–18.

Dan lewat Sanity, bukan `public/` — aset di `public/` melewati pipeline gambar:
tanpa LQIP, tanpa `asset->metadata.dimensions`, sehingga `aspectRatioFor`
mengembalikan `null` dan layout mengambil **cabang berbeda**. Yang teruji jadi
bukan yang dikirim.

**Kerja:** perluas `lib/scripts/seed-fixtures.ts` (bukan skrip baru, §2.2):

- Naik dari 3 ke **6 karya**, cukup untuk grid dua baris dan untuk membedakan
  "beranda menampilkan pilihan" dari "katalog menampilkan semuanya".
- Rasio sengaja beragam: **16:9, 4:3, 1:1, 4:5, 3:2** — supaya ketiga cabang
  `isFullWidth()` benar-benar dilewati, termasuk cabang persegi yang hari ini
  tidak pernah dieksekusi (§3.3).
- Gambar dengan **subjek dan arah cahaya**, bukan gradien rata: gradien tidak
  punya titik fokus, jadi tidak bisa dipakai menilai crop atau keseimbangan.
- Satu fixture **dengan portrait** untuk `studioSettings`, supaya cabang
  `[data-has-portrait]` di `#studio` (§3.2) terlihat sebagaimana dikirim.
- `--clean` tetap menghapus semuanya dalam satu perintah. Ini diuji, bukan
  diasumsikan.

**File:** `lib/scripts/seed-fixtures.ts` · `docs/DEPLOYMENT.md` (catatan hapus).

### 12b — Tata bahasa ditulis, dan diberi token

**File:**

- `docs/MOTION-SPEC.md` → **§10 baru** (isi §4 di atas).
- `vault/motion/tokens.ts` → tambah `interaction`, satu objek yang memetakan
  tiap state ke `{ duration, easing }` dari token yang **sudah ada**. Bukan
  nilai baru — pemetaan.
- `lib/styles/css/global.css` → custom property `--duration-commit` (120ms),
  satu-satunya nilai yang belum punya token.
- `lib/styles/motion.test.ts` (unit, baru) → gate: tiap durasi di
  `interaction` jatuh di dalam pita §2, tiap easing adalah kunci `easing` yang
  ada. Sebuah state yang ditambahkan dengan `duration: 0.3` gagal di sini.

**Kontrak `interaction`:**

```ts
export const interaction = {
  intent: { duration: duration.fast, easing: 'outQuart' },
  commit: { duration: 0.12, easing: 'outQuart' },
  transport: { duration: duration.base, easing: 'outExpo' },
  settle: { duration: duration.slow, easing: 'outExpo' },
} as const
```

### 12c — Tata bahasa dipasang ke tiap kata benda yang bisa ditekan

INTENT sudah ada sebagian; **COMMIT belum ada sama sekali** (§3.4).

**Diterapkan pada, dan hanya pada:** kartu proyek, CTA hero, chip disiplin,
tautan nav, tautan email kontak. Lima kata benda, satu kalimat.

**Caranya: CSS, bukan JS.** `:active` dan `:focus-visible` sudah merupakan mesin
state yang benar, gratis, bekerja tanpa hidrasi, dan otomatis benar untuk
keyboard (`:active` menyala pada Enter/Space di sebuah `<a>`/`<button>`). Sebuah
handler `pointerdown` akan menjadi mesin state kedua yang harus disinkronkan —
kesalahan yang sama bentuknya dengan RAF loop kedua.

**File:** `project-card.module.css` · `app/[locale]/page.module.css` ·
`discipline-filter` · `components/layout/header` · `contact-block.module.css` ·
`global.css` (aturan bersama).

### 12d — Komposisi beranda

Berdasar §3.1 dan §3.2, dan **hanya** itu — tiap perubahan menunjuk ke satu
angka:

1. Hero berhenti memusat dan mulai **berjangkar**: judul di sepertiga atas,
   metadata studio di kolom kanan yang hari ini kosong, dan **cue** ke bawah
   yang hilang menurut diagnosis skill.
2. `#studio` mendapat isi di kolom kanannya — portrait dari 12a — sehingga
   asimetrinya menjadi editorial, bukan akibat cabang CSS yang tidak pernah
   menyala.
3. Tiap section berjangkar ke grid 12 kolom yang sudah ada di `layout.mjs`.

**File:** `app/[locale]/page.tsx` + `page.module.css` · `vault/blocks/hero/` ·
`vault/blocks/studio-note/`.

### 12e — Dua momen epik, dikoreografikan dan dianggarkan

Kedatangan hero dan kartu→halaman karya di pita choreographed penuh; semua
gerakan lain micro/standard. Gate anggaran (§6.4) menegakkannya.

---

## 6. Gate — tiap satu dibuktikan **merah** dulu

Aturan proyek sejak Tahap 7. Sebuah gate yang lahir hijau tidak membuktikan
apa pun kecuali dirinya sendiri.

| Gate                   | File                              | Yang dijaga                                                                                            | Cara dibuktikan merah                                                       |
| ---------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| **6.1 COMMIT ada**     | `e2e/motion.e2e.ts`               | tiap kata benda yang bisa ditekan berubah saat `:active`                                               | jalankan sebelum 12c — nol `:active` di seluruh proyek (§3.4)               |
| **6.2 Interupsi**      | `e2e/motion.e2e.ts`               | klik ganda dan Back di tengah TRANSPORT tidak meninggalkan overlay tersangkut atau konten `opacity: 0` | jalankan dengan `maxWait` dinaikkan sementara                               |
| **6.3 Keyboard**       | `e2e/keyboard-focus.e2e.ts`       | tiap momen tercapai `Tab` + `Enter`, bukan hanya kursor                                                | jalankan sebelum 12c                                                        |
| **6.4 Anggaran epik**  | `e2e/motion.e2e.ts`               | ≤ 2 gerakan pita choreographed per halaman                                                             | tambahkan satu tween 1000ms ketiga sementara                                |
| **6.5 Rasio beragam**  | `e2e/media-edge.e2e.ts`           | ≥ 4 rasio sumber berbeda; cabang persegi dilewati                                                      | jalankan sebelum 12a — 2 rasio (§3.3)                                       |
| **6.6 Reduced-motion** | `e2e/motion.e2e.ts`               | tiap state berakhir benar; nol konten terdampar                                                        | fixture harus **membuktikan emulasinya berlaku** dulu — pelajaran Tahap 11c |
| **6.7 Tanpa JS**       | `e2e/no-javascript.e2e.ts`        | REST tetap keadaan terender                                                                            | sudah ada, tidak boleh turun                                                |
| **6.8 Aturan gerak**   | `lib/styles/motion-rules.test.ts` | nol `cubic-bezier` mentah; hanya `transform`/`opacity`                                                 | sudah ada                                                                   |
| **6.9 Bobot rute**     | `e2e/route-budget.e2e.ts`         | kenaikan bobot `/` harus keputusan tercatat                                                            | sudah ada                                                                   |
| **6.10 WebGL**         | `e2e/webgl-budget.e2e.ts`         | reduced-motion dan mobile tetap nol 3D                                                                 | sudah ada                                                                   |

---

## 7. Verifikasi

```bash
bun run check              # oxlint, oxfmt, type-aware, tsc, unit, manifest, aset
bun run build
bun run build-storybook
CI=true bun run test:e2e   # dua viewport
```

Ditambah, karena hijau bukan bukti:

- **Gerakan direkam, bukan disimpulkan** — posisi/opacity disampel lewat
  `requestAnimationFrame` selama timeline berjalan. Metode yang sama yang
  membuktikan transisi rute dan morph di Tahap 11.
- **Beranda dilihat**, dua bahasa × dua viewport, di build produksi.
- **Reduced-motion diuji dengan merender**, dan fixture-nya membuktikan
  emulasinya berlaku sebelum menegaskan akibatnya.
- **Aset dummy dibuktikan bisa dihapus satu perintah**, bukan diasumsikan.

---

## 8. Risiko — apa yang paling mungkin gagal di tahap ini

1. **`:active` tidak menyala di iOS Safari tanpa `touchstart`.** Ini perilaku
   platform yang terdokumentasi, bukan bug kita. Mitigasi: pastikan COMMIT
   adalah **penguat**, bukan satu-satunya umpan balik — TRANSPORT tetap terjadi
   tanpanya. Kalau tidak bisa diverifikasi di lingkungan ini, dinyatakan belum
   terverifikasi, bukan hijau.
2. **Kompresi COMMIT bertabrakan dengan `Magnetic`.** Keduanya menulis
   `transform` pada elemen yang sama. Mitigasi: COMMIT di elemen **anak**, atau
   variabel transform yang dibagi. Ini persis kelas bug "dua sistem satu
   properti" yang `vault/motion/tokens.ts` ada untuk mencegah.
3. **Gate anggaran epik salah bentuk.** Menghitung "gerakan pita
   choreographed" dari CSS statis akan melewatkan tween GSAP, dan menghitung
   dari runtime akan menangkap transisi yang tidak pernah berjalan. Risiko
   terbesar tahap ini, karena kegagalannya **hijau**. Ia diukur dari gerak yang
   direkam, bukan dari deklarasi.
4. **Enam fixture memperlambat build.** `generateStaticParams` naik dari 3 ke 6
   slug × 2 locale × 2 rute. Diukur, dan kalau signifikan, dicatat.
5. **Belum ada profiling browser.** Tidak berubah sejak Tahap 10. Klaim frame
   rate apa pun di tahap ini adalah **anggaran**, bukan hasil ukur
   (`CLAUDE.md` #19).

---

## 9. Yang **tidak** dikerjakan di tahap ini, dan alasannya

1. **Lapisan material WebGL saat TRANSPORT.** `lib/webgl/components/image/webgl.tsx`
   dan `postprocessing` menganggur, dan displacement berbasis shader adalah
   satu-satunya efek yang benar-benar setara animasi game. Ditunda dengan
   sengaja: aturan keras #13–14 mewajibkan jalur non-WebGL yang terlihat
   disengaja, dan jalur itu adalah TRANSPORT geometris yang harus **selesai dan
   terbukti** lebih dulu. Membangun keduanya sekaligus berarti tidak bisa tahu
   mana yang dinilai.
2. **CustomEase.** Menganggur dan tetap begitu kecuali ditokenkan. Aturan keras
   #1 melarang kurva mentah di komponen; memakainya berarti menambah token,
   bukan menulis kurva di tempat.
3. **Penyelarasan kosakata konten ke agency.** §0.
4. **Aset dummy adalah utang.** Komposisi wajib ditinjau ulang saat materi nyata
   masuk, dan `--clean` ada supaya itu satu perintah.
