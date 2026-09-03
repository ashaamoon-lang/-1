# Tahap 23 — Satu kosakata masuk, diucapkan di setiap halaman

> Pendalaman wajib atas `docs/ROADMAP.md` §3.0.
> Fase 1 dari scaffold yang disetujui.

Status: **selesai**. Hasil di §8.

---

## 1. Dua premis scaffold-nya salah, dan ini koreksinya lebih dulu

Scaffold Fase 1 menulis bahwa `vault/motion/text-reveal` dan
`vault/primitives/magnetic` punya **nol konsumen** dan tinggal "dikirim".
Memeriksanya dengan benar:

| modul                       | klaim scaffold | kenyataan                                     |
| --------------------------- | -------------- | --------------------------------------------- |
| `vault/motion/text-reveal`  | nol konsumen   | **terkirim** — `vault/blocks/hero:142`        |
| `vault/primitives/magnetic` | nol konsumen   | **terkirim** — `vault/blocks/hero:154`        |
| `components/ui/marquee`     | tidak disebut  | **nol konsumen — yang sebenarnya menganggur** |

Pemindaian saya sebelumnya menghitung `app/lib` dan `vault` terpisah, lalu
saya membaca "vault: 1" sebagai "cuma story". Keduanya sebenarnya dipakai
`vault/blocks/hero`, yang render di `/en` dan `/id`.

Jadi pekerjaan tahap ini **bukan** "kirim yang menganggur". Ia sesuatu yang
lebih berguna, dan baru kelihatan setelah premisnya diperbaiki.

---

## 2. Yang sebenarnya salah: situs ini punya **dua** kosakata masuk

Judul halaman — `h1`, satu per halaman, hal pertama yang dibaca — masuk dengan
dua cara berbeda tergantung rutenya:

| rute               | `h1`                | cara masuk                                  |
| ------------------ | ------------------- | ------------------------------------------- |
| `/en`, `/id`       | `vault/blocks/hero` | **`TextReveal`** — baris naik di balik mask |
| `/en/work`         | `catalogue.tsx:125` | `<h1 data-reveal-item>` — blok CSS          |
| `/en/work/<slug>`  | `project-hero:108`  | `<h1 data-reveal-item>` — blok CSS          |
| `/en/practice/<v>` | `practice-hero:66`  | `<h1 data-reveal-item>` — blok CSS          |

Beranda mendapat gerakan yang mahal; setiap halaman lain mendapat yang generik.
Itu persis kebalikan dari standar yang `CLAUDE.md` tutup dengan:

> "Perbedaan terukur antara situs kompeten dan situs award bukan jumlah
> komponen atau kebaruan efek. Ia **pengendalian diri yang diterapkan secara
> konsisten**."

Satu kosakata yang diucapkan di satu halaman saja bukan kosakata; ia
pengecualian.

---

## 3. Yang dikerjakan

### 3.1 `TextReveal` ke `h1` katalog dan proyek

`app/[locale]/work/catalogue.tsx` dan `vault/blocks/project-hero`. Keduanya
merender judul sebagai string biasa, yang memang bentuk yang `TextReveal`
tuntut (`children: string` — SplitText mengambil alih node teksnya, jadi React
tidak boleh memperbaruinya di tempat).

### 3.2 `h1` halaman praktik **tidak** disentuh, dan ini alasannya

`vault/blocks/practice-hero:61-69` membungkus `h1`-nya dalam
`<ViewTransition share="morph">`. Itu seluruh hasil Tahap 15b: nama praktik
berpindah dari daftar ke halamannya. SplitText mencacah teks jadi span
per-baris — mengganti persis node yang morph itu potret.

Jadi halaman praktik menyimpan bentuknya, dan **itu bukan lubang melainkan
keputusan**: ia sudah punya momen masuknya sendiri, yang lebih mahal daripada
sebuah reveal. Dua gerak berkoreografi di satu halaman adalah batas
`MOTION-SPEC.md` §9.5; morph itu salah satunya.

### 3.3 `Magnetic` ke aksi utama yang lain

Saat ini hanya CTA hero. Diperluas ke aksi utama tiap halaman —
diidentifikasi saat implementasi dengan membaca halamannya, bukan ditebak di
spec. Aturannya tetap milik komponen itu sendiri: pointer-only, mati di
`prefers-reduced-motion` dan di pointer kasar, dan ia dekorasi **di atas**
kontrol yang aksesibel, bukan penggantinya.

### 3.4 Primitif baru: `vault/motion/parallax`

Preset `motion.csv` #13 (Subtle) dan #14 (Standard) — keduanya `scrub`,
`ease: 'none'`, hanya `yPercent`. Yang diambil bukan angkanya melainkan
batasannya, dan preset itu menyatakannya sendiri:

> _"Keep the yPercent delta small (5-15) so foreground and background never
> desync distractingly"_ — dan _"**Don't parallax body copy**; it hurts
> reading comfort and can trigger motion sickness."_

Jadi: media saja, tidak pernah teks; amplitudo jadi token di
`vault/motion/tokens.ts` dengan plafon yang dijaga uji unit, mengikuti pola
`MAX_DISPLACEMENT`; hanya `transform`; ScrollTrigger di-`kill()` saat unmount;
mati total di reduced motion dengan konten berakhir **terlihat penuh**.

### 3.5 `components/ui/marquee` — dinilai, bukan otomatis dikirim

Ia satu-satunya komponen yang benar-benar nol konsumen, dan ia **sudah**
menaut kecepatannya ke `lenis.velocity` (jadi "velocity-marquee" di scaffold
adalah pekerjaan yang sudah ada).

Tapi "terpasang" bukan alasan untuk dipakai — kalimat itu sudah ditulis
Tahap 21 §7 tentang sim fluid. Sebuah marquee di situs galeri yang menahan
diri adalah salah satu klise paling cepat menurunkan kelas. **Diputuskan
dengan memandang, bukan di spec ini**, dan keputusannya dicatat di §8 apa pun
hasilnya.

---

## 4. Anggaran — di sinilah kenaikan yang Anda izinkan dipakai

Baseline Tahap 22:

| rute                      | terukur | `gsap`?   | sisa   |
| ------------------------- | ------- | --------- | ------ |
| `/en/work`                | 751 KB  | **tidak** | 149    |
| `/en/work/arus-balik`     | 746 KB  | **tidak** | 154    |
| `/en/practice/consulting` | 874 KB  | ya        | **26** |

`/en/work` dan `/en/work/<slug>` **tidak membawa GSAP sama sekali** hari ini.
`TextReveal` membawa GSAP + ScrollTrigger + SplitText. Selisih `/en/practice`
(874, dengan gsap) terhadap `/en/work` (751, tanpa) menunjukkan GSAP+ScrollTrigger
berharga sekitar **123 KB**, dan SplitText di atasnya.

**Itu tukar-tambah nyata: ratusan kilobyte untuk satu reveal judul.** Jadi
urutannya: **pasang, ukur, lalu putuskan dengan angka** — bukan menaikkan
anggaran lebih dulu dan membenarkannya belakangan. Kalau biayanya ternyata
tidak sepadan dengan yang didapat, yang benar adalah melaporkannya dan tidak
mengirimnya, dan itu jawaban yang sah.

Anggaran yang dinaikkan ditulis dengan angka terukur plus margin yang
dinyatakan, di `route-budget.e2e.ts`, dengan alasannya.

---

## 5. Gerbang

1. **Satu kosakata masuk** — gerbang baru: setiap rute yang punya `h1`
   non-morph memakai mekanisme masuk yang sama. Dibuktikan merah lebih dulu
   terhadap keadaan hari ini (beranda displit, katalog dan proyek tidak).
2. **Reduced motion** — `e2e/motion.e2e.ts` diperluas ke rute baru: di bawah
   `prefers-reduced-motion`, `h1` tiap halaman berakhir **terlihat penuh**.
   Ini `CLAUDE.md` #5, dan `text-reveal` sendiri mencatat bug persis ini
   pernah terkirim.
3. **Nama aksesibel utuh** — `h1` tetap punya nama yang terbaca setelah
   displit (`aria: 'auto'`). `e2e/instant-navigation.e2e.ts` sudah menangkap
   kelas cacat ini sekali.
4. **Anggaran** — `route-budget.e2e.ts` hijau dengan angka barunya.
5. **Parallax** — amplitudo di bawah plafon token (uji unit), dan mati di
   reduced motion (e2e).

---

## 6. Risiko

**6.1 GSAP masuk ke dua rute yang sekarang bersih.** Risiko utama, dan
diputuskan dengan pengukuran di §4, bukan dengan selera.

**6.2 SplitText dan `ViewTransition` bertabrakan.** Dihindari dengan tidak
menyentuh halaman praktik (§3.2). Kalau ada morph lain yang belum saya lihat,
gerbang `journey.e2e.ts` yang sudah ada akan menangkapnya.

**6.3 Parallax adalah efek yang paling mudah berlebihan.** Karena itu ia
bertoken, berplafon, media-saja, dan **dipandangi**.

**6.4 `h1` katalog berubah saat filter praktik dipilih** (`t(`${practice}Title`)`).
`TextReveal` menuntut remount lewat `key` saat teksnya berubah; kalau tidak,
React memperbarui node yang sudah diambil alih SplitText. Ditangani saat
implementasi dan diverifikasi dengan mengganti filter.

---

## 7. Yang **tidak** dikerjakan

- **`h1` halaman praktik** (§3.2) — sudah punya momennya sendiri.
- **Parallax pada teks** — preset yang dikurasi melarangnya eksplisit.
- **`sticky-stack`** yang disebut scaffold: ditunda. Ia mengubah komposisi
  grid karya, dan komposisi adalah keputusan yang sudah dua kali ditunda
  secara sadar di proyek ini; menyelipkannya ke tahap kosakata gerak akan
  mencampur dua keputusan berbeda dalam satu diff.
- **`counter`** yang disebut scaffold: ditunda ke tahap yang sama, karena
  satu-satunya tempatnya (`N engagements`) berada di blok yang `sticky-stack`
  akan susun ulang.

---

## 8. Hasil

**Selesai, dengan satu pengiriman dan dua penolakan berbukti.** Penolakannya
bukan cakupan yang diam-diam dikecilkan — keduanya diputuskan oleh pengukuran
yang dilakukan setelah spec ini ditulis, dan angkanya ada di bawah.

### 8.1 Terkirim: satu kosakata masuk

`TextReveal` sekarang membawa `h1` katalog dan `h1` halaman proyek, sama
seperti hero beranda. `h1` halaman praktik sengaja tetap utuh (§3.2).

Gerbangnya menarik: ia **merah di dua rute dan hijau di dua rute** pada
langkah pembuktian —

```
✓ /en    reveals its h1 line by line
✓ /id    reveals its h1 line by line
✘ /en/work                 the h1 has no masked lines
✘ /en/work/arus-balik      the h1 has no masked lines
```

Hijau di tempat kosakatanya sudah ada sekaligus membuktikan **probenya benar**,
bukan sekadar gagal di mana-mana. Penanda yang dipakai adalah anak
`aria-hidden` ber-`overflow: clip` milik SplitText — dan itu `div`, bukan
`span`; probe yang ditulis untuk span melaporkan nol pada judul yang **sudah**
terpisah dengan benar, yang akan terbaca sebagai fiturnya tidak ada.

### 8.2 Ongkosnya, dan anggaran yang ternyata tidak perlu dinaikkan

| rute                      | sebelum | sesudah    | selisih  | plafon |
| ------------------------- | ------- | ---------- | -------- | ------ |
| `/en/work`                | 751 KB  | **871 KB** | **+120** | 900    |
| `/en/work/arus-balik`     | 746 KB  | **866 KB** | **+120** | 900    |
| `/en/practice/consulting` | 874 KB  | 874 KB     | 0        | 900    |
| `/en`, `/id`              | 1899 KB | 1899 KB    | 0        | 2100   |

Anda mengizinkan menaikkan anggaran. **Tidak dipakai:** kedua rute tetap di
bawah 900 yang sudah mereka punya, dengan sisa ~30 KB. Yang berubah cuma
daftar `allow` — dan itu memang keputusan yang berkas itu jaga, bukan
angkanya.

### 8.3 Ditolak: `Magnetic` tidak diperluas

Spec §3.3 merencanakan `Magnetic` ke aksi utama tiap halaman. Geometri ketiga
kandidatnya diukur lebih dulu:

| aksi                         | display | lebar (1440 / 390) | tinggi  |
| ---------------------------- | ------- | ------------------ | ------- |
| `data-press="email"`         | `block` | 504 / 347          | 43      |
| `data-press="next"`          | `flex`  | 1398 / 347         | **440** |
| `data-press="next-practice"` | `flex`  | 1398 / 347         | 114     |

Ketiganya elemen **selebar kolom**, sementara `.magnetic` adalah
`inline-block`: membungkusnya akan menciutkannya ke lebar konten. Untuk
tautan email itu lebih buruk lagi — komentar CSS-nya sendiri melindungi
`overflow-wrap: anywhere` supaya alamat panjang membungkus alih-alih
melebarkan halaman, dan `inline-block` justru meniadakannya.

Dan bahkan kalau CSS-nya diakali, magnet pada kartu setinggi 440px adalah
register yang salah: dokumentasi `Magnetic` sendiri menargetkan "primary CTAs
and nav items" — target kecil dan diskret. Menyeret kartu selebar layar
mengikuti kursor adalah "efek kursor berlebihan" yang rencana ini sendiri
tolak.

**Jadi `Magnetic` tetap di CTA hero.** Header dipertimbangkan dan ditolak
juga: ia hadir di setiap rute, jadi memagneti nav akan menyeret GSAP ke
`/en/ai`, yang komentar layout-nya menjanjikan nol komponen klien.

### 8.4 Ditolak: parallax tidak dipasang pada karyanya

`vault/blocks/project-gallery` sudah `overflow: clip` dengan
`object-fit: cover`, jadi secara teknis ia bisa memuat parallax. Tapi
gambarnya mengisi kotaknya **persis**: menggeser isinya menuntut membesarkan
gambar lebih dulu, artinya **memotong karyanya supaya efeknya punya ruang**.

Itu persis argumen yang proyek ini sudah tulis sendiri di
`vault/motion/tokens.ts`: naikkan angkanya dan "sebuah material berubah jadi
efek yang diterapkan pada gambar". Di situs karya pesanan, gambar itu
**adalah** produknya.

Primitifnya juga tidak dikirim ke `vault/` dalam keadaan tanpa pemakai —
tahap ini justru menemukan bahwa satu-satunya modul nol-konsumen yang tersisa
(`components/ui/marquee`) adalah beban, bukan aset (§1). Menambah satu lagi
akan mengulang persis kesalahan itu.

### 8.5 `components/ui/marquee` — dinilai, tidak dikirim

Tetap nol konsumen, dan itu keputusan. Ia sudah menaut ke `lenis.velocity`,
jadi tidak ada yang perlu dibangun; yang tidak ada adalah tempat di situs ini
yang sebuah marquee akan perbaiki. Klise pita bergerak adalah salah satu yang
paling cepat menurunkan kelas sebuah situs galeri.

### 8.6 Instrumen yang salah / premis yang salah — tiga, dicatat

1. **Klaim "nol konsumen" scaffold salah untuk dua modul** (§1). Pemindaian
   saya menghitung `app/lib` dan `vault` terpisah dan saya membaca "vault: 1"
   sebagai "cuma story". Keduanya dipakai `vault/blocks/hero`.
2. **Saya sempat melaporkan cacat yang bukan cacat.** Mengklik chip praktik
   di `/en/work` memberi `masks: 0`, yang saya baca sebagai "TextReveal
   berhenti bekerja setelah filter". Sebenarnya chip itu **bernavigasi ke
   halaman praktik** — `work/practice/[value]/page.tsx` adalah
   `permanentRedirect` — jadi `h1` yang saya ukur adalah practice-hero, yang
   memang sengaja tidak displit. Diverifikasi dengan mencetak URL setelah
   klik.
3. **Komentar yang saya tulis memuat klaim palsu.** Saya menulis bahwa `key`
   pada `TextReveal` katalog "menanggung beban karena memilih filter praktik
   mengganti string ini". Setelah temuan (2), itu tidak benar: satu-satunya
   pemanggil mengoper `practice={null}` dan cabang terfilternya tidak pernah
   render. Komentarnya diperbaiki untuk menyatakan yang sebenarnya, bukan
   dibiarkan.

### 8.7 Verifikasi

- `bun run check` — **exit 0**, 410 uji unit.
- `CI=true bun run test:e2e` — **323 lulus** (dari 319), 12 dilewati.
  `journey.e2e.ts` lulus, jadi split ini tidak mematahkan morph mana pun.
  Satu kegagalan awal adalah penjaga kebasian Storybook; setelah
  `build-storybook`, **92 lulus**.
- **Reduced motion diperiksa langsung** di kelima rute, dua mode: `h1` selalu
  `opacity: 1`, nol transform yang membuang ke luar layar, nama aksesibel
  utuh.
- Halaman katalog dan proyek **dipandangi** di 1440×900.
- Tidak ada klaim performa (`CLAUDE.md` #19).
