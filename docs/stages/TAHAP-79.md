# Tahap 79 — Halaman yang paling menjual, membawa satu momen

> **Status: spec. Belum ada kode.** Ditulis lebih dulu sesuai `ROADMAP.md` §3.0.
>
> Cabang: `claude/arth-design`. Track ini fokus pada **kedalaman gerak** dan
> **arsitektur informasi** — keputusan pemilik repo, dicatat di rencana track.

---

## 1. Yang diukur, sebelum satu baris kode

### 1.1 Anggaran gerak rute ini, dihitung ulang bukan dikutip

`HANDOFF.md` §4 menyebut `/work/<slug>` membawa **satu** momen terhadap plafon 6.
Angka itu tidak dipercaya begitu saja — ia dihitung ulang dari DOM:

```bash
grep -rhoE 'data-epic="[a-z-]+"' app components vault lib | sort -u
```

Dua belas nama di seluruh repo. Yang duduk di rute ini: **`project-arrival`**,
satu-satunya, di `vault/blocks/project-hero/index.tsx:131`. Angka HANDOFF benar.

```
rute                    momen (nama berbeda)   plafon
/en                              3               12
/practice/<v>                    4               12
/studio                          3               12
/work                            2               12
/journal                         2                6
/work/<slug>                     1                6   <- halaman yang menjual satu karya
/journal/<slug>                  1                3
```

### 1.2 Mesin terbesar rute ini sudah ada, dan dorman

`vault/blocks/project-gallery` punya run horizontal ter-pin (`project-run`,
Tahap 64). `e2e/gallery-run.e2e.ts` mencatat bahwa cabangnya tidak pernah diambil
karena tiap proyek hanya membawa dua plate terhadap `RUN_MINIMUM` empat.

**Komentar test bukan bukti.** Dihitung langsung dari dataset produksi:

```bash
curl -s --get --data-urlencode \
  'query=*[_type=="project"]{"slug":slug.current,"plates":count(gallery)}' \
  https://az53j4l1.api.sanity.io/v2024-01-01/data/query/production
```

```
arus-balik     plates=2      pusat-beban    plates=2
bacaan-mesin   plates=2      takar          plates=2
pelabuhan      plates=2      lantai-dua     plates=2
```

**Enam dari enam, tepat dua.** `RUN_MINIMUM` adalah empat, jadi `project-run`
dorman di **setiap** halaman proyek yang situs ini layani. Pemilik repo memilih
fixture tetap, jadi tahap ini **tidak boleh** bergantung padanya.

### 1.3 Skema punya faktanya, tidak punya busurnya

Yang sudah ada dan **sudah dirender** — `queries.ts:72,82,83,226` mengambilnya,
`project-hero` menyusunnya jadi `<dl>` label/nilai dan menghilangkan yang kosong
alih-alih merender blanko:

```
client   year   practice   engagement ("Retainer, enam bulan")   scope ("3 tim, 14 minggu")
```

Diukur terhadap dataset: **6/6 punya `engagement`, `scope`, `body`; 5/6 punya
`client`** (`pelabuhan` tidak).

Yang **tidak** ada: apa yang berubah karena pekerjaan itu. `body` adalah satu
blok rich-text tunggal yang dirender sebagai prosa. Halaman ini bisa mengatakan
**bentuk** sebuah engagement, tidak bisa mengatakan **akibatnya** — dan pada
agency tiket tinggi, akibat itulah yang dibeli.

---

## 2. Ritual skill — `ROADMAP.md` §2.1, hasilnya ditempel apa adanya

### 2.1 Query yang mengembalikan NOL, dinyatakan terus terang

```bash
python .claude/skills/ui-ux-pro-max/scripts/search.py "Case Study" --domain landing
```

```
**Found:** 0 results
No matches. This is not a match with an empty value -- the query did not hit the database.
```

**Tidak ada pola bernama "Case Study" di database ini.** Dicatat sesuai §2.1
aturan 2, sebelum memakai istilah lain — bukan sesudah.

### 2.2 Query yang kena, dengan kosakata skill-nya sendiri

```bash
python .claude/skills/ui-ux-pro-max/scripts/search.py "Scroll-Triggered Storytelling" --domain landing
```

```
Pattern ID:       scroll-triggered-storytelling
Keywords:         storytelling, scroll, narrative, story, immersive
Section Order:    Intro hook > Chapter 1 (problem) > Chapter 2 (journey)
                  > Chapter 3 (solution) > Climax CTA
Primary CTA:      End of each chapter (mini) + Final climax CTA
Color Strategy:   Progressive reveal. Each chapter has distinct color.
Conversion Opt.:  Keep the narrative understandable without scroll-driven effects.
                  Use progress indicator. Mobile: simplify animations. Keep DOM
                  reading order complete; disable parallax and scroll-scrub under
                  reduced motion. Pause scroll animation when offscreen.
```

**Urutan seksinya adalah busur case study, dan ia datang dari database — bukan
dari saya.** Itu yang membuat keputusan ini bisa ditelusuri alih-alih
diperdebatkan sebagai selera.

```bash
python .claude/skills/ui-ux-pro-max/scripts/search.py "pinned scroll scrub" --domain gsap
```

```
Category:     Scroll Reveal        Intensity Tier: Complex
Trigger:      scroll (continuous scrub)      Easing: none (scrub-driven)
Framework:    Pinning needs the section to have deterministic height;
              recalc ScrollTrigger.refresh() after images/fonts load
Do:           scrub 0.5-1.5, not instant jumps
Don't:        Don't pin more than 1-2 sections per page; excessive pinning
              fights native scroll feel and hurts mobile UX
Performance:  Pinning forces layout reflow; test on mid-tier mobile
```

```bash
python .claude/skills/ui-ux-pro-max/scripts/search.py "scroll narrative progress" --domain ux -n 5
```

```
Feedback / Progress Indicators     (Medium)  step indicator atau progress bar
Accessibility / Motion Sensitivity (High)    honor prefers-reduced-motion,
                                             sajikan final readable state
Responsive / Horizontal Scroll     (High)    konten tidak boleh melebihi viewport
```

### 2.3 Yang DITOLAK dari pola ini, dan alasannya

Sama seperti Tahap 34 §6 menolak contoh easing skill-nya sendiri:

| ditolak dari pola                                        | alasan                                                                                  |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| _"Each chapter has distinct color. Building intensity."_ | Monokrom ketat, dikonfirmasi ulang Tahap 66. Tiap plate karya membawa warnanya sendiri. |
| _"Success green for results"_ (Before-After)             | Sama. Nol aksen kromatik.                                                               |
| _"mini CTA di akhir tiap chapter"_                       | Tiga CTA di satu halaman melawan restraint `HOUSE-RULES.md` §4. **Satu** CTA penutup.   |

---

## 3. Inventaris — dipakai ulang, bukan ditulis ulang

`ROADMAP.md` §3.0 langkah 3. Yang sudah ada dan menutupi kebutuhan tahap ini:

| kebutuhan                     | yang sudah ada                        | catatan                                                                        |
| ----------------------------- | ------------------------------------- | ------------------------------------------------------------------------------ |
| Sekuens ter-pin, indeks aktif | `vault/blocks/step-sequence`          | Menerima `data-epic` sebagai prop bertipe (`index.tsx:98`). Dipakai `/studio`. |
| "Sedang membaca yang mana"    | `vault/motion/use-active-in-sequence` | Sudah dipakai dua tempat; jangan buat yang ketiga.                             |
| Progress indicator            | `vault/motion/reading-progress`       | **Sudah terpasang di halaman ini.** Pola menuntutnya; ia sudah ada.            |
| Angka yang membangun dirinya  | `vault/motion/counter`                | `value`, `labels`.                                                             |
| Reveal per seksi              | `lib/hooks/use-reveal.ts`             | Kontrak CSS, tanpa GSAP, tanpa ScrollTrigger baru.                             |

**Nol komponen baru yang menduplikasi daftar di atas.**

---

## 4. Yang akan dikerjakan

### 4.1 Skema — busur, bukan blok

`body` tetap. Yang ditambah adalah bagian bernama, mengikuti urutan pola:

```
outcome   internationalizedArrayString   apa yang berubah — kalimat, bukan paragraf
chapters  array of { heading, body }     problem / journey / solution
```

Keduanya **opsional**. Sebuah proyek tanpa `chapters` merender persis seperti
hari ini — itu syaratnya, karena dataset adalah fixture dan tahap ini tidak
boleh mengosongkan halaman yang sekarang jalan.

### 4.2 Berkas yang disentuh

```
lib/integrations/sanity/schemas/project.ts    chapters, outcome
lib/integrations/sanity/queries.ts            + bun run sanity:typegen
app/[locale]/work/[slug]/page.tsx             komposisi busur
messages/{en,id}.json                         label seksi, dua bahasa
docs/MOTION-SPEC.md 9.5                       momen baru didaftarkan saat dikirim
```

### 4.3 Momen yang ditambahkan — paling banyak SATU pin

Skill: _"Don't pin more than 1-2 sections per page"_. Rute ini sudah punya satu
pin laten (`project-run`). Jadi tahap ini menambah **satu** momen bernama,
`project-chapters`, lewat `StepSequence` yang sudah ada.

Belanja rute ini: **1 menjadi 2** dari plafon 6. Bukan 6. `DIREKSI.md` §2.1 —
menambah momen demi membelanjakan anggaran adalah alasan yang salah.

---

## 5. Kriteria keluar — bisa dijalankan, bukan dirasakan

| gerbang                            | tuntutan                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------ |
| `bun run check`                    | 554+ lulus, 0 gagal                                                      |
| `CI=true bun run test:e2e`         | 716+ lulus, 0 gagal                                                      |
| `e2e/project-detail.e2e.ts:100`    | `<dl>` fakta **tetap** memotong fold 800px di 1280x800                   |
| `e2e/navigation-landing.e2e.ts:95` | `h1` tetap mendarat di layar pertama sesudah navigasi                    |
| `e2e/epic-sequence.e2e.ts`         | `project-arrival` dan `project-chapters` **tidak** berbagi rentang gulir |
| `e2e/first-screen-void.e2e.ts`     | pita kosong tidak memburuk                                               |
| `e2e/no-javascript.e2e.ts`         | busur terbaca penuh tanpa JS                                             |
| reduced motion                     | tiap chapter berakhir **terlihat penuh**, pin mati bukan melambat        |
| keyboard saja                      | seluruh busur bisa dilewati Tab — bukti ini bukan scroll hijacking       |
| `bun run build-storybook`          | story untuk tiap komponen yang berubah, termasuk state reduced-motion    |

---

## 6. Risiko — yang paling mungkin gagal

1. **Pin kedua melawan pin pertama.** Kalau `project-run` pernah hidup, dua pin
   di satu halaman adalah persis yang skill larang. Mitigasi: `epic-sequence`
   sudah menjaga tumpang-tindih rentang, dan itu gerbang, bukan niat.
2. **`<dl>` terdorong ke bawah fold 800px.** Busur yang masuk sebelum fakta
   memindahkannya. Gerbangnya sudah ada dan akan memerah — itu gunanya.
3. **Fixture tidak punya isi untuk `chapters`.** Maka **halaman akan merender
   seperti hari ini**, dan itu akan dinyatakan sebagai belum terverifikasi
   terhadap konten nyata — bukan dibulatkan jadi selesai. `CLAUDE.md` #21.
4. **Alat ukur baru salah lebih sering daripada kodenya.** `HANDOFF.md` §3.1 —
   lima kesalahan instrumen di Tahap 76-78 saja. Angka pertama dari alat apa pun
   diperiksa ke sumbernya sebelum membenarkan kode.

---

## 7. Catatan lingkungan — ditemukan saat setup track ini

**Satu gerbang tidak punya margin waktu, dan diagnosis pertama saya salah.**

Push pertama ke `origin` gagal tiga kali berturut-turut. Yang gagal selalu satu
test yang sama:

```
(fail) a declared prop has a caller > has no capability that nothing asks for [6109.00ms]
  ^ this test timed out after 5000ms
```

`vault/vault-api.test.ts` mem-parse seluruh pohon konsumen — 154 berkas di
`app`, `vault`, `components` — untuk menanyakan prop mana yang dideklarasikan
tapi tidak pernah dioper. Biayanya 4–6 detik CPU. Terhadap default generik Bun
5000ms itu **nol margin**, dan bentuk kegagalannya yang paling buruk: lulus saat
mesin senggang, gagal saat sibuk. `git push` mengompres objek di core yang sama,
jadi ia gagal di bawah `git push` dan **lulus** di bawah
`bunx lefthook run pre-push` — sehingga gerbangnya tampak flaky, bukan lambat.

**Diagnosis pertama saya salah, dan dicatat alih-alih dihapus.** Saya mengukur
I/O berurutan di 33ms/berkas (340 berkas, 11.221ms) dan menyalahkannya. Angka
itu artefak cache dingin. Diukur ulang saat hangat:

```
walk + statSync        85ms      walk + withFileTypes   49ms
readFileSync 154 berkas 47ms
```

Empat puluh tujuh milidetik. **Biayanya parsing, bukan membaca** — jadi
memparalelkan read tidak akan memperbaiki apa pun, dan rencana untuk menyentuh
12 tempat di 7 berkas gerbang dibatalkan sebelum menulis satu baris pun.

**`bunfig.toml` tidak bisa membawanya.** Kunci `timeout` di bawah `[test]`
diterima lalu diabaikan — diverifikasi dengan test 6 detik yang tetap mati di
5000ms. Per-test adalah satu-satunya bentuk yang Bun hormati.

Yang dikirim: satu argumen `30_000` pada test itu, dengan alasannya ditulis di
sebelahnya — termasuk diagnosis yang salah, supaya tidak diulang.
