# DIREKSI — arah pengembangan ARTH

> Dokumen ini menjawab satu pertanyaan: **apa yang sedang kita bangun, dan
> batas mana yang berlaku.** `ROADMAP.md` menjawab _kapan_; `MOTION-SPEC.md`
> dan `DESIGN-SYSTEM.md` menjawab _bagaimana_. Ini yang menjawab _kenapa_.
>
> Ditetapkan Tahap 60.

---

## 1. ARTH adalah agency

Selama lima puluh sembilan tahap, repo ini dibangun sebagai situs studio karya
komisi di bawah batasan yang ketat. **Itu perancah, bukan tujuan.** Dua
pendekatan itu ada untuk mencapai dua kemampuan:

| pendekatan       | untuk mencapai                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| **Studio karya** | Web dan sistem desain di atas **long context** dan **compact layout**, dengan nilai estetika lebih tinggi |
| **Batasan**      | **UI/UX yang sangat presisi**, dan bisa disesuaikan dengan tema                                           |

Keduanya sekarang ada, dan **keduanya tetap dipakai**. Yang berubah adalah apa
yang situs ini _untuk_:

> **ARTH adalah agency. Animasi yang memukau adalah kail yang membawa klien
> masuk — bukan kemewahan yang harus dijatah.**

---

## 2. Tiga arah

### 2.1 Hero lebih tinggi

**Tidak ada plafon tinggi.** Diverifikasi Tahap 60 dengan menyisir seluruh 39
berkas e2e: tidak ada satu pun gerbang yang membatasi tinggi hero atau
section. Yang kurang selama ini bukan izin — melainkan nilainya dinaikkan.

Tinggi yang dituju per rute ada di `DESIGN-SYSTEM.md`. Prinsipnya: yang
bertambah adalah **ruang, lapisan, dan gerak** — bukan baris teks. Aturan
"hero maksimal empat elemen teks" **tetap berlaku**, dan justru itulah yang
membuat hero tinggi terbaca mahal alih-alih penuh.

### 2.2 Journey scrolling animation lebih banyak

Plafon momen berkoreografi naik dari **3 ke 12** di empat rute merek, 6 di
`/journal` dan `/work/<slug>`, **3** di `/journal/<slug>`.

Tapi angkanya bukan lagi alat utamanya — lihat §3.2.

### 2.3 Pendekatan informasi yang kreatif

Permukaan informasi paling mudah dikerjakan salah: menambah efek ke halaman
teks hanya membuat teksnya bergerak. Yang dikerjakan sebagai gantinya adalah
**informasi yang berubah bentuk** — kapabilitas sebagai sekuens ter-pin
alih-alih daftar, angka yang membangun dirinya, prose yang terungkap mengikuti
gulir sehingga membaca dan menggulir jadi satu gerakan.

`/journal/<slug>` tetap yang paling tenang, dengan sengaja.

---

## 3. Batas: yang tetap, dan yang dilebarkan

### 3.1 TETAP — ini alat presisi, bukan rem

Tidak satu pun dari daftar ini pernah dilonggarkan, di rute mana pun,
termasuk `/lab`:

- **Disiplin penamaan** — tiap gerakan >600ms wajib berada di dalam
  `[data-epic="<nama>"]`. Gerakan tanpa nama tidak bisa didebug, dianggarkan,
  atau dimatikan di reduced motion.
- **Token** — nol hex mentah, nol durasi telanjang, nol `cubic-bezier`
  mentah. Warna di `oklch()`, turunan lewat `color-mix(in oklab, …)`. Inilah
  yang membuat situs ini bisa disesuaikan tema.
- **Satu RAF loop** — Lenis, GSAP, Tempus berbagi satu. Dua loop = jitter.
- **`prefers-reduced-motion`**, dan isi harus berakhir **terlihat penuh**.
- **axe WCAG 2.2**, keyboard, no-JS.
- **Dispose GPU**, kill ScrollTrigger, revert context.
- **Hanya `transform` dan `opacity`** — inilah yang membuat animasi _banyak_
  tetap mulus.
- **Compact layout dan long context** — kemampuan dari pendekatan studio
  karya. Justru inilah yang membuat halaman panjang terasa padat, bukan
  kosong.

### 3.2 DILEBARKAN — dan instrumennya diganti, bukan cuma angkanya

Plafon "maksimal dua" tidak pernah benar-benar menjaga _jumlah_. Ia menjaga
**"satu hal memukau pada satu waktu"**. Pada halaman pendek, membatasi jumlah
adalah cara kasar mencapainya. Pada halaman 110svh dengan passage 300vh, itu
instrumen yang salah: halaman seperti itu bisa memuat banyak momen **berurutan**
tanpa satu pun bersaing, dan sebuah hitungan tidak bisa membedakannya.

Jadi invariannya pindah ke `e2e/epic-sequence.e2e.ts`:

> Dua momen dengan **nama berbeda**, yang **tidak bersarang** satu sama lain,
> tidak boleh menempati rentang gulir yang sama.

**Lebih ketat soal kualitas, jauh lebih longgar soal kuantitas.** Hitungannya
tetap ada di `interaction-grammar.e2e.ts`, tapi sekarang cuma kawat pemicu
untuk kebablasan.

### 3.3 Plafon KB

Dinaikkan **di tahap yang menambah bobotnya**, dengan pengukuran tahap itu —
bukan dinaikkan di muka. Plafon yang naik sebelum bobotnya datang adalah
gerbang yang berhenti bekerja selama rentang itu.

---

## 4. Yang tetap ditolak

| ditolak                                    | alasan                                                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Konten, klien, atau entri karangan         | Perintah Anda, masih berlaku                                                                           |
| Scroll hijacking                           | Merusak keyboard. **Pin + scrub bukan ini**, dan bedanya dibuktikan dengan menguji pakai keyboard saja |
| Dependensi `motion` / `framer-motion`      | Loop RAF kedua                                                                                         |
| Efek tanpa jalur reduced-motion            | Aksesibilitas, bukan selera. Berlaku di `/lab` juga                                                    |
| Klaim FPS / Lighthouse tanpa profiler      | `CLAUDE.md` #19                                                                                        |
| Menyalin kode tanpa `LICENSE` di sumbernya | `CLAUDE.md` #16, #18                                                                                   |

---

## 5. Permukaan

| permukaan           | isi                                            | gerbang selera                 |
| ------------------- | ---------------------------------------------- | ------------------------------ |
| **`arth.<domain>`** | Situs agency. Tempat animasi memukau itu hidup | berlaku, dengan pelebaran §3.2 |
| **`lab.<domain>`**  | Sandbox mentah: eksperimen UI dan efek         | **tidak berlaku**              |

Gerbang kebenaran (§3.1) berlaku penuh di keduanya.
