# TAHAP 14 — Gerak

Stage-spec yang diwajibkan `docs/ROADMAP.md` §3.0.

Tahap ini lahir dari satu pertanyaan Anda:

> "BISAKAH KAMU MEMBUAT ANIMASINYA SETARA SEPERTI INI
> https://www.melius.com/ ??"

Jawabannya **bisa** — dan jalannya bukan yang saya kira, bukan yang Anda kira,
dan bukan yang tertulis di rencana Tahap 14 sebelum pengukuran dilakukan.
Dokumen ini menyimpan pengukurannya, termasuk dua kali instrumen saya sendiri
salah bentuk.

---

## 1. Pertanyaannya, dan pengukurannya

### 1.1 Metode

Playwright **tidak bisa** menjangkau melius.com dari kontainer ini
(`ERR_CONNECTION_RESET`) — ia menjangkau localhost tapi tidak memakai proxy
HTTPS yang dipakai curl. Jadi situsnya diambil dengan `curl` lewat proxy:
HTML tersaji (324 KB) plus **22 dari 25 chunk JS (1,9 MB)**. Tiga chunk sisanya
gagal unduh dan itu dinyatakan, bukan disembunyikan — tiap hitungan di bawah
berlaku atas 22 chunk, bukan 25.

Yang tidak bisa saya lakukan: menjalankan situsnya dan melihat geraknya. Semua
di bawah ini adalah pembacaan **kode dan markup**, bukan pembacaan **hasil
render**. Itu batas yang nyata dan disebut di muka.

### 1.2 Dua kesalahan instrumen saya sendiri

Ini bagian terpenting dari dokumen ini, karena polanya sudah lima kali muncul
di Tahap 12 dan muncul lagi di sini.

**Kesalahan 1 — `Observer`.** Pembacaan pertama melaporkan plugin GSAP
`Observer` ada di **12 dari 22 chunk**, dan dari situ saya hampir menyimpulkan
melius dibangun di atas interaksi drag/wheel bertenaga Observer. Instrumennya
`grep -l Observer`, yang juga cocok dengan `IntersectionObserver`,
`ResizeObserver`, dan `MutationObserver`.

Hitungan yang benar:

| Instrumen | Hasil |
| --- | --- |
| `grep -l Observer` (salah) | 12 chunk |
| `IntersectionObserver` | 23 kemunculan |
| `ResizeObserver` | 44 kemunculan |
| `MutationObserver` | 6 kemunculan |
| **`\bObserver\b` (plugin GSAP)** | **1 kemunculan** |
| **`Observer.create`** | **0** |

**Kesalahan 2 — `ease:"none"`.** Pembacaan pertama melaporkan **185** tween
dengan `ease:"none"`, dan dari situ saya menyimpulkan gerak melius didominasi
timeline yang di-scrub oleh posisi scroll. Instrumennya sebuah regex yang
mencocokkan `"none"` **di mana pun** — dan `"none"` di JS terminifikasi
hampir selalu `display:"none"` atau `border:"none"`.

Hitungan yang benar:

| Instrumen | Hasil |
| --- | --- |
| `grep -o '"none"'` (salah) | 185 |
| **`ease:"none"`** | **1** |
| **`scrub:`** | **0** |
| **`pin:`** | **0** |

Kesimpulan pertama saya — "melius adalah koreografi scroll-scrub bervolume
tinggi" — **terbalik seluruhnya** setelah instrumennya dibetulkan. melius tidak
melakukan scroll-scrubbing sama sekali.

Pelajarannya sama dengan Tahap 12 §10: **pengukuran yang salah bentuk
menghasilkan angka meyakinkan yang menunjuk perbaikan yang keliru**, dan itu
lebih berbahaya daripada tidak mengukur, karena ia terasa seperti bukti.

### 1.3 Terukur — melius.com lawan Arth

| | melius.com (22 chunk + HTML tersaji) | Arth (sumber, `70546f7`) |
| --- | --- | --- |
| **three.js** | **nol.** `WebGLRenderer`, `PerspectiveCamera`, `ShaderMaterial`, `BufferGeometry`, `new THREE` — kelimanya 0/22 chunk | terpasang; dipakai hanya untuk gradient hero |
| **WebGL** | ada, kecil: satu canvas gradient `minigl` buatan sendiri di hero (`getContext("webgl2") ?? getContext("webgl") ?? …`) + satu canvas 2D (`roundRect`) untuk graf showcase | satu canvas gradient R3F di hero (`uTime` + grain) + fallback DOM gradient |
| **Mesin animasi** | **Motion / framer-motion**: `useMotionValue` 5 chunk · `whileHover` 4 · `AnimatePresence` 3 · `whileInView` 3 · `useTransform` 3 · `projection` 3 · `useScroll` 2 · `layoutId` 1 | React `<ViewTransition share="morph">` · CSS `[data-reveal]` · GSAP |
| **GSAP** | ada, nyaris tak dipakai: `gsap.registerPlugin(SplitText)` ×2 · `gsap.timeline` ×1 · `gsap.to` ×2 · `gsap.set` ×1. `ScrollTrigger`/`ScrollSmoother`/`Flip` hanya muncul sebagai string pustaka | `TextReveal` (SplitText, `<h1>` hero) |
| **Scroll-scrub / pin** | `scrub:` **0** · `pin:` **0** · `Observer.create` **0** | 0 (`ProgressText` punya `scrub: true` tapi nol pemakai) |
| **Smooth scroll** | Lenis | Lenis |
| **Easing** | tertoken: `ease-sin-in-out` ×29 · `ease-quart-in-out` ×12 · `ease-standard` ×7 · `ease-cubic-in-out` ×5. Literal dominan `cubic-bezier(0.23,1,0.32,1)` ×26 | tertoken: `--ease-out-quart` ≈50 · `--ease-out-expo` ≈10 · `--ease-gleasing` ×4 · `--ease-in-out-cubic` ×1 |
| **Durasi** | `duration-200` ×41 · `duration-500` ×27 · `duration-450` ×12 · `duration-300` ×9 | 150 / 200 / 400 / 800 / 1200, tertoken |
| **Permukaan hover** | 61 varian `hover:` + 4 `group-hover:` · `transition-colors` ×17 · `transition-transform` ×14 | 104 `:hover` · 73 `:focus-visible` · 11 `:active`, di 36 berkas |
| **Imagery bergerak** | **6 `<video>` `.webm`** (`muted loop playsInline preload=metadata object-cover`), 17 rujukan `.webm` | **nol** |
| **Volume halaman** | 11 `<section>` · 1 `h1` · 4 `h2` · **27 `h3`** · 28 `<img>` · 43 `<svg>` | 4 seksi di beranda |
| **Reduced motion** | `prefers-reduced-motion` di 7 chunk | wajib, digerbang di setiap jalur |

### 1.4 Tiga temuan yang menentukan tahap ini

**Pertama: tata bahasa gerak Arth sudah lebih ketat dari melius.**
Kurva dominan melius adalah varian `in-out` (`ease-sin-in-out` ×29,
`ease-quart-in-out` ×12) — persis yang `CLAUDE.md` #2 batasi ke "gerak yang
pergi *dan kembali*". Default kita `outQuart`. melius juga memakai
`duration-300` ×9; `CLAUDE.md` #3 melarangnya sebagai default generik. Kita
tidak perlu belajar disiplin dari situs ini; kita sudah punya.

**Kedua: gradient WebGL di hero kita adalah benda yang sama dengan milik
mereka.** `minigl` mereka dan `GradientScene` kita sama-sama satu quad,
satu shader `uTime`, satu fallback. Beda pustakanya, sama perannya. "Lapisan
material WebGL" yang dipilih untuk tahap ini sebagian **sudah terkirim** sejak
Tahap 4.

**Ketiga: jaraknya tiga hal, dan tak satu pun three.js.**

1. **Imagery bergerak** — enam klip loop lawan sepuluh plate statis. Ini tuas
   perseptual terbesar: gerak di dalam **konten** mengalahkan gerak di
   **kerangka**.
2. **Volume** — 27 blok setingkat `h3` yang masing-masing reveal saat masuk
   viewport dan menjawab hover, lawan ~6 blok reveal di beranda kita.
3. **Perubahan konten di tempat** — `AnimatePresence` + tabs/accordion Radix:
   personas, toggle harga, FAQ. Konten yang menyusun ulang dirinya di bawah
   kursor terbaca "hidup" dengan cara yang tak bisa ditiru halaman statis. Kita
   mengirim primitif `accordion` dan `tabs`; **nol halaman memakainya**.

Karena itu Tahap 14 sebagai "kerja shader three.js" akan menghabiskan satu
tahap penuh di satu-satunya sumbu tempat kita sudah unggul. Bentuk yang
dipilih — dan disetujui — adalah dua sub-tahap berurutan yang menyerang ketiga
jarak di atas, dengan **lapisan material dipakai untuk menggerakkan plate yang
sudah ada**, bukan untuk membangun adegan 3D.

---

## 2. Ritual `ui-ux-pro-max`

`ROADMAP.md` §2.1. Dijalankan, dan hasilnya ditempel **termasuk yang nol**.

```bash
S=.claude/skills/ui-ux-pro-max/scripts/search.py
python3 $S "image displacement hover"      --domain gsap  -n 5   → 4 hasil
python3 $S "scroll reveal stagger"         --domain gsap  -n 5   → 5 hasil
python3 $S "texture shader performance"    --stack threejs -n 5  → 5 hasil
python3 $S "accordion disclosure"          --domain ux    -n 4   → 0 hasil
python3 $S "disclose"                      --domain ux    -n 4   → 1 (retry)
python3 $S "image optimization"            --stack nextjs -n 3   → 3 hasil
```

**Query keempat mengembalikan nol.** Skill memerintahkan mengulang dengan
istilah terdekat yang ia sebutkan sendiri (`disclose`) dan menyatakannya terus
terang kalau tetap jatuh ke default. Diulang → 1 hasil, dan hasil itu tentang
overflow label chip, **bukan** tentang pola disclosure. Jadi dinyatakan di
sini: **tidak ada pola accordion/disclosure di database skill ini.** Keputusan
`<details>`/`<summary>` di §6.2 bukan berbasis database, dan disebut begitu.

| Hasil | Putusan |
| --- | --- |
| GSAP *Hover Micro-interaction / Subtle*: **"Keep displacement under 2px so it reads as feedback not motion"**, 150–200 ms, `power1.out` | **Diterima, dan ini yang mengunci amplitudo §5.2.** Angka 2px itu untuk displacement DOM; padanan kita adalah offset UV, tapi prinsipnya sama — material, bukan efek. |
| GSAP *Hover / Complex*: `elastic.out(1,0.4)`, magnetic pull | **Ditolak, di rekaman.** Kurva mentah dilarang `CLAUDE.md` #1, dan pantulan sudah ditolak untuk situs ini di Tahap 11c dan 12b. |
| GSAP *Scroll Reveal / Subtle*: **"Don't reveal below-the-fold content needed for SEO/crawlers as invisible-by-default without a no-JS fallback"** | **Diterima, dan jadi gate.** Ini persis risiko §6.1: memperluas cakupan reveal ke tiap blok berarti memperluas permukaan yang bisa terjebak `opacity: 0` tanpa JS. |
| GSAP *Scroll Reveal / Complex*: `scrub: 1, pin: true` | **Ditolak.** melius sendiri tidak memakainya (`scrub:` ×0, `pin:` ×0), dan tidak ada teks di situs ini yang membutuhkannya. |
| three.js *Geometry / dispose on Scene Removal* — **Severity: Critical** | **Diterima.** Sudah jadi `CLAUDE.md` #15; di sini ia jadi gate yang dijalankan, bukan aturan yang dipercaya. |
| three.js *Materials / Dispose Textures Explicitly* — Severity: High | **Diterima dengan satu pengecualian yang harus ditulis:** tekstur dari cache `useTexture` drei **tidak dimiliki** komponen kita dan membuangnya merusak konsumen lain. `lib/webgl/components/image/webgl.tsx` sudah mendokumentasikan ini. Panduan skill benar untuk three.js polos, salah untuk drei. |
| Next.js *Images / priority for LCP* | Sudah dipenuhi Tahap 9 (`fetchpriority` + `preloadCount`). |

---

## 3. Batasan keras — terukur dari kode yang ada

Empat. Semuanya membentuk desain, bukan sekadar mewarnainya.

### 3.1 three.js hanya boleh di beranda

`e2e/route-budget.e2e.ts:36` mengizinkan `three` + `gsap` **hanya** di `/en`
(plafon 2100 KB tak terkompresi). `/en/work`, `/en/work/<slug>`, dan `/en/ai`
punya daftar izin kosong. Jadi material ini masuk ke grid `#work`
**di beranda saja** — bukan katalog, bukan halaman detail. Tahap 7 sengaja
membersihkan rute itu dan tahap ini tidak membatalkannya.

### 3.2 Reduced motion harus tetap nol canvas

`e2e/webgl-budget.e2e.ts` menuntut `/en` di bawah `reducedMotion: 'reduce'`
merender **0 `<canvas>`** dan tidak mengunduh satu chunk three.js pun. Itulah
yang memaksa pola `import()` **di dalam effect**, bukan di module scope: dua
static import pernah membocorkan 245,6 KB gzip / 931 KB mentah, dan memperbaiki
salah satunya saja **tidak mengubah apa pun**.

### 3.3 Material tidak boleh mematahkan TRANSPORT

Kartu ikut `<ViewTransition share="morph">` menuju halaman detail (Tahap 11d).
Kalau gambar DOM-nya `opacity: 0` karena diganti mesh, view transition memotret
kotak kosong dan morph itu mati.

Jalan keluarnya bukan tambalan — ia justru **tata bahasa yang sudah kita
tulis**. `MOTION-SPEC.md` §9:

```
REST ─▶ INTENT ─▶ COMMIT ─▶ TRANSPORT ─▶ SETTLE ─▶ REST′
```

Material hidup di **REST** dan **INTENT**. Pada **COMMIT** ia menyerahkan
kembali ke DOM — sebelum navigasi mulai — sehingga **TRANSPORT** memorf piksel
sungguhan. Satu kalimat yang sama, satu noun lagi yang mengucapkannya.

### 3.4 Accordion yang ada tidak selamat tanpa JavaScript

`components/ui/accordion/index.tsx` dibangun di atas Base UI `Collapsible` +
React `Activity` — client-only. Beranda punya kriteria keluar "terbaca penuh
tanpa JS" (Tahap 3, dipertegas Tahap 10). Isi yang tersembunyi di balik
komponen client gagal kriteria itu.

Maka seksi yang berubah di tempat memakai native `<details>`/`<summary>`.
Polanya sudah ada di repo ini — `components/ui/error-view/index.tsx:63`.

---

## 4. Inventaris — yang sudah ada dan tidak dibangun ulang

`ROADMAP.md` §3.0 langkah 3. Tahap ini nyaris tidak menambah kemampuan baru; ia
**memakai yang sudah dibangun dan menganggur**.

| Sudah ada | Pemakai hari ini | Dipakai tahap ini untuk |
| --- | --- | --- |
| `lib/webgl/utils/flowmaps/flowmap-sim.ts` — medan kecepatan GPU, mengekspos `.uniform = { value: Texture }` | **0** | Sumber displacement §5.2 |
| `lib/webgl/utils/flowmaps/index.tsx` — `useFlowmapSim`, sudah tahan context-loss | **0** (hanya lewat `FlowmapProvider`) | idem |
| `lib/webgl/components/flowmap-provider` — `useFlowmap('flowmap')` | **0** | Mengambil ref sim di dalam scene |
| `simTypes` pada `<Canvas root>` (`canvas/index.tsx:131`) | **0** | Menyalakan sim flowmap. **Prop sudah ada dan terdokumentasi; tidak ada API baru.** |
| `lib/webgl/hooks/use-webgl-element.ts` — rect + visibility dalam satu ref | **0** | Mengukur kotak plate dan mematikan mesh di luar layar |
| `lib/webgl/hooks/use-webgl-rect.ts` | **0** | Memetakan rect DOM ke koordinat canvas |
| `vault/webgl/scene-shell/` — pola shell DOM + `import()` di effect + fallback | dipakai `Hero` | **Pola yang disalin persis** oleh `material-image` |
| `lib/hooks/use-reveal.ts` — IntersectionObserver + transisi CSS | 5 blok | Cakupan reveal §6.1 |
| `components/ui/error-view` — `<details>`/`<summary>` bergaya | 1 | Pola disclosure §6.2 |
| `lib/content/practices.ts` — `PRACTICES`, `practiceTemplate` | rute + hero + filter | Isi seksi Practice §6.2 |
| Mekanisme `placeholderNote` (`app/[locale]/page.tsx`) | catatan studio | Menandai prosa penampung §6.2 |

Komponen benar-benar baru di tahap ini: **satu** (`vault/webgl/material-image/`).
Sisanya pengawatan.

---

## 5. Tahap 14a — Lapisan material

### 5.1 Kontrak komponen

`vault/webgl/material-image/`, meniru `vault/webgl/scene-shell/` baris per
baris karena polanya sudah dibuktikan oleh dua gate yang berjalan.

```ts
interface MaterialImageProps {
  /** Sumber, alt, sizes — diteruskan apa adanya ke <Image>. */
  image: SanityImageSource
  alt: string
  sizes?: string | undefined
  /** Diteruskan ke <Image priority>. Grid sudah punya preloadCount. */
  preload?: boolean | undefined
  /**
   * Amplitudo displacement, 0–1. Nilai kecil saja — ini material, bukan
   * efek. Default dari token, bukan angka mentah di komponen.
   */
  strength?: number | undefined
  /**
   * Melepas material dan mengembalikan gambar DOM ke opacity 1.
   * Dinaikkan oleh kartu pada COMMIT — lihat §3.3.
   */
  released?: boolean | undefined
  className?: string | undefined
}
```

Empat berkas:

| Berkas | Isi |
| --- | --- |
| `index.tsx` | Shell DOM. Merender `<Image>` biasa; mesh hanya menggantikannya setelah tekstur siap **dan** gerbangnya lolos. |
| `scene.tsx` | Sisi R3F. Di-`import()` di dalam effect, tak pernah di module scope (§3.2). |
| `shaders.ts` | Vertex + fragment. Tidak ada nilai desain mentah. |
| `material-image.module.css` | Kotak posisi saja. |

Kontrak yang tidak boleh dilanggar, semuanya sudah tertulis di `SceneShell`:

- Gerbang `isWebGL && !prefersReducedMotion`. Reduced motion, perangkat tanpa
  WebGL, dan chunk yang gagal diunduh **semuanya** jatuh ke plate statis —
  yaitu persis yang tampil hari ini. Fallback ini tidak perlu dibuktikan
  "terlihat sengaja" (`CLAUDE.md` #14) karena ia **adalah produknya sekarang**.
- Portal lewat `<WebGLTunnel>` ke satu-satunya root canvas. Tak pernah
  `<Canvas>` kedua — `lib/webgl/store.ts` akan membuat keduanya balapan klaim
  primary, dan itu sudah pernah memerahkan `e2e/not-found.e2e.ts`.
- Buang geometry dan material **miliknya sendiri** saat unmount. **Jangan**
  buang tekstur dari cache `useTexture` drei (§2, baris three.js).

### 5.2 Shader

`Flowmap` mengekspos `.uniform = { value: Texture }` — medan kecepatan yang
di-swap tiap frame (`flowmap-sim.ts:145` dan `:199`). Fragment shader membaca
`.rg`-nya sebagai offset UV:

```glsl
vec3 flow = texture(tFlow, vUv).rgb;
vec2 uv   = vUv + flow.rg * uStrength;
```

Ditambah drift `uTime` amplitudo sangat rendah supaya plate tetap hidup saat
kursor diam — melius mendapatkan kualitas itu dari klip yang berputar; kita
mendapatkannya dari sini.

**Amplitudo ditentukan dengan melihat, bukan menebak**, dan angka finalnya
dicatat di §11. Panduan skill ("di bawah 2px supaya terbaca sebagai umpan
balik, bukan gerak") adalah patokan awalnya.

### 5.3 Pengawatan

- `simTypes={['flowmap']}` diteruskan `<Wrapper webgl>` → `<Canvas root>`.
- `vault/blocks/project-card` memakai `MaterialImage` menggantikan `Image`, dan
  menaikkan `released` pada `pointerdown` (COMMIT) — §3.3.
- **Beranda saja.** `/en/work` dan halaman detail tidak disentuh (§3.1).

---

## 6. Tahap 14b — Volume dan cakupan

### 6.1 Cakupan reveal

Audit tiap blok di `/en`, `/en/work`, `/en/work/<slug>`. Apa pun yang masuk
viewport tanpa reveal diberi reveal lewat `useReveal` yang sudah ada —
IntersectionObserver + transisi CSS pada `transform`/`opacity`, nol GSAP
tambahan. `vault/blocks/project-grid/index.tsx:14` sudah menjelaskan kenapa CSS
dan bukan timeline di sini: hasil pikselnya sama, ongkosnya ~43 KB berbeda.

**Risiko yang skill sebutkan dan gate harus tangkap:** memperluas cakupan
reveal memperluas permukaan yang bisa terjebak `opacity: 0` tanpa JavaScript.
Gate no-JS yang ada harus tetap hijau **setelah** perluasan, bukan sebelum.

### 6.2 Perubahan konten di tempat — seksi Practice

Celah ketiga melius, dan kita punya primitifnya dengan nol pemakai.

Pemakaian yang jujur di situs ini: satu seksi **Practice** di beranda —
Consulting · AI/Data · Commission — di mana tiap praktik membuka isi
sebenarnya. Kosakatanya sudah ditetapkan Tahap 13 (`lib/content/practices.ts`),
sudah jadi rute (`/work/practice/<value>`), dan sudah tampil di kolom kanan
hero. Tidak ada kosakata baru yang diperkenalkan.

Dibangun dengan native `<details>`/`<summary>` (§3.4). Tinggi dianimasikan
dengan token `--duration` + `--ease-out-expo`; di bawah reduced motion ia
membuka seketika dengan isi **terlihat penuh** (`CLAUDE.md` #5 — cacat judul
Tahap 12d persis kelas ini).

**Dinyatakan sekarang, bukan nanti:** prosa untuk tiga praktik itu belum ada.
`docs/stages/TAHAP-3.md` §1 sengaja tidak membangun seksi Process karena tidak
ada konten nyata, dan roadmap menyatakan seksi kosong lebih merusak daripada
seksi yang absen. Jadi prosa yang saya tulis **ditandai sebagai penampung**
lewat mekanisme `placeholderNote` yang sudah dipakai halaman ini, dan Tahap 13
§9 ("prosa ini milik saya, bukan milik studio") **tetap terbuka**. Ia tidak
akan disajikan seolah kata-kata studio.

---

## 7. Berkas yang disentuh

**Baru**

| Berkas | Untuk |
| --- | --- |
| `vault/webgl/material-image/{index.tsx,scene.tsx,shaders.ts,material-image.module.css}` | 14a |
| `vault/webgl/material-image/material-image.stories.tsx` | Storybook (aturan `vault/`) |
| `vault/blocks/practice-list/{index.tsx,practice-list.module.css,practice-list.stories.tsx}` | 14b §6.2 |
| `e2e/material-handoff.e2e.ts` | Gate 14a |
| `e2e/reveal-coverage.e2e.ts` | Gate 14b |
| `docs/stages/TAHAP-14.md` | dokumen ini |

**Diubah**

| Berkas | Perubahan |
| --- | --- |
| `vault/blocks/project-card/index.tsx` + `.module.css` | Pakai `MaterialImage`; lepas pada COMMIT |
| `app/[locale]/page.tsx` | `simTypes`; seksi Practice; anchor nav |
| `messages/en.json`, `messages/id.json` | String seksi Practice, dua locale |
| `lib/webgl/components/canvas/index.tsx` → `<Wrapper>` | Teruskan `simTypes` (prop sudah ada) |
| Blok yang kurang reveal (hasil audit §6.1) | `useReveal` |
| `docs/MOTION-SPEC.md` | §11 lapisan material + aturan serah-terima COMMIT |
| `docs/TEARDOWN.md` | melius sebagai situs terukur |
| `docs/ROADMAP.md` | Tahap 14 |
| `vault/webgl/scene-shell/index.tsx` | Perbaiki komentar usang — lihat §9.4 |

---

## 8. Gate — tiap satu dibuktikan merah dulu

| Gate | Membuktikan | Cara dibuat merah |
| --- | --- | --- |
| `e2e/webgl-budget.e2e.ts` (ada) | Reduced motion: 0 canvas, 0 chunk three | Static-import `./scene` sementara |
| `e2e/route-budget.e2e.ts` (ada) | `/en` < 2100 KB; tiga rute lain nol `three` | Pakai `MaterialImage` di `/en/work` sementara |
| **baru** `e2e/material-handoff.e2e.ts` | Setelah `pointerdown`, opacity gambar DOM kembali 1 **sebelum** navigasi; morph `.morph` tetap berjalan | Lepas serah-terimanya |
| **baru** probe kebocoran | Navigasi keluar-masuk beranda 3×, `renderer.info.memory.geometries` tidak tumbuh. **Uji pertumbuhan, bukan angka absolut** — dinyatakan begitu | Hapus `dispose()` |
| **baru** `e2e/reveal-coverage.e2e.ts` | Tiap `<section>` / `h2` / `h3` di tiga rute punya leluhur `[data-reveal]` atau opt-out eksplisit | Akan merah apa adanya (~6 blok hari ini) |
| Gate no-JS (ada) | Isi tiap `<details>` terbaca tanpa JavaScript | Pakai `components/ui/accordion` |
| `@axe-core/playwright` | Seksi baru lolos WCAG 2.2; `<summary>` bisa dicapai keyboard | — |
| Reduced motion | Buka/tutup seketika, isi berakhir **terlihat penuh** | — |
| `bun run check` | Seluruh suite CI | — |

---

## 9. Risiko

**9.1 Displacement terlihat murah.** Ini risiko terbesar dan tidak ada gate
yang bisa menangkapnya. Angka hijau tidak membuktikan sebuah plate terbaca
mahal. Mitigasi: amplitudo ditentukan dengan melihat tangkapan berdampingan,
dan kalau versi bergerak tidak terbaca lebih mahal daripada yang statis,
**materialnya dicabut**, bukan dipertahankan karena sudah ditulis.

**9.2 Serah-terima COMMIT balapan dengan navigasi.** `pointerdown` → lepas
material → React re-render → `<ViewTransition>` memotret. Kalau potretnya
terjadi sebelum re-render, morph memotret kotak kosong. Ini yang diuji gate
`material-handoff`, dan kalau balapannya nyata, jalan mundurnya adalah
melepaskan material pada `pointerenter` (INTENT) — lebih awal, sedikit lebih
boros, tapi deterministik.

**9.3 Anggaran `/en` menembus 2100 KB.** Material menambah chunk scene kedua.
Kalau tembus, yang dinaikkan **bukan** plafonnya — cakupannya yang dikurangi.

**9.4 Komentar usang yang sudah ditemukan.**
`vault/webgl/scene-shell/index.tsx` menyatakan root canvas dipasang site-wide
oleh `lib/features` dan memerintahkan **jangan** meneruskan `webgl` ke
`<Wrapper>`. Kode tidak lagi begitu: `lib/features/index.tsx:89` memasang
canvas hanya kalau di-opt-in, dan `app/[locale]/page.tsx` **memang**
meneruskan `webgl`. Komentarnya salah, bukan kodenya. Diperbaiki di tahap ini
karena tahap ini menyuruh orang berikutnya menyalin pola itu.

---

## 10. Yang **tidak** dikerjakan, dinyatakan di muka

- **Tidak ada `.webm` dibuat.** Anda memilih shader; tidak ada aset video masuk
  repo.
- **Tidak ada material di `/en/work` atau halaman detail** (§3.1).
- **Tidak ada scroll-scrub, tidak ada pin.** melius sendiri tidak memakainya,
  dan `ProgressText` tetap nol pemakai sampai ada teks yang benar-benar
  membutuhkannya.
- **Tidak ada Motion/framer-motion ditambahkan.** Ia mesin melius, tapi
  `<ViewTransition>` + reveal CSS sudah menutupi peran yang sama tanpa
  dependensi baru.
- **Tidak ada angka performa yang tidak diukur** (`CLAUDE.md` #19).
- **Prosa Practice adalah penampung bertanda**, bukan kata-kata studio (§6.2).
- **Kredensial tidak dirotasi**, sesuai permintaan Anda.

---

## 11. Hasil

_Diisi saat sub-tahap dikerjakan._
