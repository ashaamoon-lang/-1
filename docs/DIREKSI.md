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

**Tidak ada plafon selera atas tinggi** — tapi klaim "tidak ada satu pun
gerbang yang membatasinya", yang berdiri di sini sejak Tahap 60, **salah**.
Penyisiran 39 berkas e2e itu menemukan lebih banyak dari yang dibacanya. Tiga
gerbang membatasi tinggi, hanya tidak memakai kata "tinggi" (dikoreksi Tahap
61, lihat `docs/stages/TAHAP-61.md` §4.1):

| gerbang                            | menahan                         | yang dituntut                                             |
| ---------------------------------- | ------------------------------- | --------------------------------------------------------- |
| `e2e/first-screen.e2e.ts:113`      | `/work`, `/journal`             | item pertama mulai `< 85%` layar **dan** `opacity > 0.99` |
| `e2e/project-detail.e2e.ts:100`    | `/work/<slug>`                  | `<dl>` fakta memotong fold **800px** di viewport 1280×800 |
| `e2e/navigation-landing.e2e.ts:95` | `/practice/<v>`, `/work/<slug>` | `h1` mendarat di layar pertama sesudah navigasi           |

Dua yang pertama **gerbang kebenaran, bukan selera**, jadi menurut §3.1 di
bawah keduanya TETAP. `first-screen.e2e.ts` menuliskan alasannya dengan angka:
`60svh` di `/work` menaruh sampul pertama di **886px dari 900 (98%)**, lewat
garis 75% milik `useReveal`, sehingga setiap sampul tinggal di `opacity: 0` dan
`catalogue-sift` bermain di tempat yang tidak bisa dilihat siapa pun.

Ruang tinggi yang benar-benar tersisa, terukur 1440×900:

| rute              | sekarang | tersisa                                   |
| ----------------- | -------- | ----------------------------------------- |
| `/`               | 100svh   | nol — sudah penuh layar                   |
| `/studio`         | 87%      | kecil                                     |
| `/practice/<v>`   | 70%      | **nol** — diukur Tahap 65, lihat di bawah |
| `/work/<slug>`    | 95%      | **nol** — fold 800px                      |
| `/journal/<slug>` | —        | nyata                                     |
| `/work`           | 31%      | **nol** — `first-screen`                  |
| `/journal`        | 39%      | **nol** — `first-screen`                  |

**Dikoreksi Tahap 65: kolom `/practice/<v>` di tabel ini dulu berbunyi
"nyata — satu-satunya rute merek yang tidak ditahan", dan itu salah.** Tidak
ada _gerbang_ yang menahannya, tapi tata letaknya menahan: pernyataan halaman
itu harus mendarat di atas garis reveal 75% (675px pada 1440×900), dan dengan
jarak 48px dari hero itu berarti hero ≤ ~70% layar — persis di mana ia sudah
berada. `TAHAP-52.md` §4a mengukurnya lebih dulu; Tahap 65 mengukurnya lagi
**sesudah lapisannya benar-benar masuk** dan angkanya tidak bergerak satu
piksel pun, karena lapisan itu duduk di bawah pernyataan. Kalimat di bawah
tentang "tahap yang memasukkan lapisannya" tetap benar sebagai prinsip; di rute
ini akibatnya sudah diuji dan tidak datang.

Jadi menaikkan tinggi menyentuh **dua rute, bukan tiga dan bukan tujuh** — dan
itu pun bukan pekerjaan yang berarti sendirian. Prinsipnya tidak berubah, dan justru
prinsipnya yang penting: yang bertambah adalah **ruang, lapisan, dan gerak** —
bukan baris teks. Konsekuensi jujurnya, **hero lebih tinggi dengan isi yang
sama bukan lebih memukau, melainkan lebih kosong**; jadi tinggi naik sebagai
akibat di tahap yang memasukkan lapisannya, bukan sebagai tahap tersendiri.

Aturan "hero maksimal empat elemen teks" **tetap berlaku**, dan justru itulah
yang membuat hero tinggi terbaca mahal alih-alih penuh.

### 2.2 Journey scrolling animation lebih banyak

**Tidak ada lagi plafon momen** — fork (`docs/FORK.md`). Plafonnya pernah
naik dari 3 ke 12 di empat rute merek, 6 di `/journal` dan `/work/<slug>`, 3 di
`/journal/<slug>`, dan ditegakkan oleh `interaction-grammar.e2e.ts`. Kini
jumlahnya **dilaporkan** per rute pada setiap run, tidak dibatasi. Arah §2.2
tetap: lebih banyak journey, bukan lebih sedikit.

### 2.3 Pendekatan informasi yang kreatif

Permukaan informasi paling mudah dikerjakan salah: menambah efek ke halaman
teks hanya membuat teksnya bergerak. Yang dikerjakan sebagai gantinya adalah
**informasi yang berubah bentuk** — kapabilitas sebagai sekuens ter-pin
alih-alih daftar, angka yang membangun dirinya, prose yang terungkap mengikuti
gulir sehingga membaca dan menggulir jadi satu gerakan.

`/journal/<slug>` tetap yang paling tenang, dengan sengaja.

---

## 3. Batas: yang tetap, dan yang dilebarkan

### 3.1 TETAP — karena ia melindungi pembaca

Daftar ini dulu berbunyi _"tidak satu pun pernah dilonggarkan"_. Fork
melonggarkan dua butirnya, dan mengatakannya di sini alih-alih membiarkan
judulnya berbohong:

- ~~**Disiplin penamaan**~~ — gerakan >600 ms tidak lagi **wajib** berada di
  dalam `[data-epic]`. `interaction-grammar.e2e.ts` kini melaporkan gerakan
  panjang tanpa nama, tidak menolaknya. Alasan lamanya bahwa gerakan tanpa nama
  "tidak bisa dimatikan di reduced motion" tidak berlaku: reduced motion
  ditegakkan terpisah, oleh `motion-rules.test.ts` dan `motion.e2e.ts`.
- ~~**Token**~~ — nol hex mentah, nol durasi telanjang, nol `cubic-bezier`
  mentah, warna hanya `oklch()`. Pensiun sebagai aturan (`CLAUDE.md` #1, #2,
  #3, #8, #9, #10). Token tetap idiom default karena itulah yang membuat tema
  bisa berganti; literal kini diizinkan.

Yang **tetap**, di rute mana pun termasuk `/lab`:

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
dulu tetap ada di `interaction-grammar.e2e.ts` sebagai _"kawat pemicu untuk
kebablasan"_ — dan ternyata masih menegakkan plafon, bertentangan dengan
kalimat di atas. Fork mengubahnya jadi laporan. Aturan tumpang-tindih di
`epic-sequence.e2e.ts` ditinjau terpisah (`docs/FORK.md` §2, langkah 5).

### 3.2b Papan skor — angka yang di-generate, bukan diingat

`HANDOFF.md` §4 pernah menghitung belanja momen dengan tangan, dan angka yang
tidak bisa dibuat ulang adalah angka yang hanyut. Blok di bawah ditulis oleh
`lib/scripts/design-scoreboard.ts`. Ia **tidak lagi dijaga uji**: fork menghapus
`design-scoreboard.test.ts` bersama kunci pembukuan lainnya, jadi blok ini
bisa tertinggal dari kode. Ia laporan yang dibuat ulang saat ingin melihat
angkanya — jalankan `bun lib/scripts/design-scoreboard.ts --write` — dan
angka di dalamnya **lantai, bukan plafon**.

<!-- design-scoreboard:start -->

```
momen berkoreografi bernama berbeda   13
  arth-passage
  catalogue-sift
  hero-arrival
  journal-index
  journal-transport
  practice-capabilities
  practice-morph
  practice-statement
  project-arrival
  project-chapters
  studio-process
  studio-statement
  work-transport

blok memakai bidang kedalaman         3
  app/[locale]/journal/index-rows.tsx
  vault/blocks/project-card
  vault/blocks/project-gallery

section ter-pin (ScrollTrigger)       2
  vault/blocks/passage
  vault/motion/horizontal

section tertahan (position: sticky)   4
  app/[locale]/studio
  vault/blocks/capability-set
  vault/blocks/project-spine
  vault/blocks/step-sequence
```

**Yang angka-angka ini TIDAK bisa lihat.** Ia memindai sumber, bukan
halaman yang dirender, jadi ia tidak tahu **berapa momen yang jatuh pada
satu rute** — itu pekerjaan `e2e/epic-sequence.e2e.ts`, yang menuntut dua
momen bernama beda tidak menempati rentang gulir yang sama.

Dua baris terakhir **tidak dijumlahkan**, dan itu disengaja. Keduanya
menahan section saat gulir lewat, jadi keduanya masuk anggaran yang sama —
tapi sebuah pemindai tidak bisa membedakan **momen** yang ditahan dari
kerangka yang kebetulan sticky: `project-spine` adalah rel navigasi, bukan
ketukan berkoreografi. Menjumlahkannya menghasilkan angka yang terbaca
seperti anggaran padahal bukan.

Dan ia sama sekali tidak bisa melihat **kualitas**. Sebuah hitungan tidak
bisa membedakan momen yang halaman ini butuhkan dari momen yang ditambahkan
untuk membelanjakan anggaran — dan §2.1 sudah menamai bentuk kesalahan itu.
Angka naik bukan bukti situsnya membaik.

<!-- design-scoreboard:end -->

### 3.3 Plafon KB — dihapus

Fork menghapus plafon KB per rute dan daftar-izin pustakanya.
`e2e/route-budget.e2e.ts` kini **mencetak** berat dan pustaka tiap rute, dan
hanya gagal pada satu hal yang merupakan cacat, bukan pilihan: **byte yang sama
tiba di bawah dua URL** — bentuk duplikasi chunk yang pernah ditangkap plafon
lama di Tahap 28, kini ditangkap tanpa membatasi berat yang disengaja.

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
