# Tahap 84 — Menghapus `/ai`, dan memisahkan referensi dari riwayat

> **Status: terkirim.** Spec ditulis lebih dulu sesuai `ROADMAP.md` §3.0; hasil
> dan gerbangnya di §7.
>
> Cabang: `claude/arth-design`. Diminta pemilik repo setelah meninjau halaman
> itu: _"Saya meninjau ini tidak dibutuhkan… Kita harus menghilangkannya, baik
> dari navigasi dan juga pagenya secara utuh."_

---

## 1. Yang diukur, sebelum satu baris kode

### 1.1 Enam puluh tiga berkas menyebutnya, dan sebagian besar tidak boleh disentuh

Pencarian pertama mengembalikan **63 berkas**. Angka itu menyesatkan kalau
dibaca sebagai daftar kerja, karena ia mencampur tiga hal yang sangat berbeda:

| kelas                      | contoh                                                                                       | tindakan                |
| -------------------------- | -------------------------------------------------------------------------------------------- | ----------------------- |
| **Referensi hidup**        | `route-catalog.ts` · `markdown-document.ts` · rutenya sendiri                                | dihapus                 |
| **Daftar rute di gerbang** | 14 spec e2e yang memuat `/ai` dalam array                                                    | dikeluarkan dari daftar |
| **Riwayat**                | `docs/stages/TAHAP-13.md`, `TAHAP-14.md`, entri ROADMAP, `AUDIT-2026-08.md`, `PROVENANCE.md` | **tidak disentuh**      |

Kelas ketiga adalah alasan tahap ini ditulis sebagai spec alih-alih dikerjakan
langsung. Spec tahap dan entri ROADMAP mencatat **apa yang pernah diputuskan
dan kenapa**. Menghapus `/ai` dari sana bukan membersihkan — itu memalsukan
catatan, dan repo ini punya aturan tertulis tentangnya (`RENCANA` §8.4:
koreksi di tempat, sebutkan apa yang keliru; jangan hapus jejaknya).

Penghapusan ini justru **menambah** riwayat: sebuah entri baru yang mencatat
bahwa rute itu pernah ada, apa gunanya, dan kenapa ia pergi.

### 1.2 Ia tidak ada di navigasi terlihat

Header situs memuat **WORK · STUDIO · JOURNAL**, tidak lebih. `/ai` tidak
pernah jadi item menu.

Yang pemilik repo lihat di layar adalah **halaman `/ai` itu sendiri**, dan
"navigasi" yang ia maksud adalah tempat rute itu diiklankan:

```
lib/seo/route-catalog.ts   satu-satunya sumber
        |
        +-- app/sitemap.ts        -> sitemap.xml
        +-- app/llms.txt/route.ts -> /llms.txt
        +-- app/[locale]/ai       -> daftar halaman di halaman itu sendiri
```

Satu entri dihapus dari katalog itu, dan ketiganya berhenti menyebutnya
serentak. Itu memang desain katalog tersebut, dan tahap ini adalah pembuktian
pertamanya.

### 1.3 Satu hardcode di luar katalog

```
lib/seo/markdown-document.ts:70   - [Agent index](${absoluteSiteUrl('/ai')})
```

Ia disisipkan ke bagian "Where to look next" pada **setiap** dokumen markdown
yang situs ini sajikan. Katalog tidak menjangkaunya, jadi tanpa perbaikan ini
setiap `.md` akan membawa tautan 404.

### 1.4 `agent-content` BUKAN bagian dari `/ai`, dan tetap tinggal

`app/agent-content/route.ts` adalah handler negosiasi konten: ia menyajikan
versi markdown **rute mana pun** ketika agen meminta `text/markdown`, lewat
rewrite di `proxy.ts`. Ia mekanisme AEO yang berdiri sendiri.

Nama foldernya mirip dan keduanya melayani agen, jadi menghapus keduanya
sekaligus adalah kekeliruan yang paling mungkin terjadi di tahap ini. Ia tidak
disentuh.

### 1.5 `agent-readiness.e2e.ts` juga bukan tentang `/ai`

Namanya menyesatkan. Gerbang itu menjaga **beranda**: isi terstruktur, chrome
di HTML prerender, render tanpa JavaScript, dan penyajian markdown. Ia memuat
empat sebutan `/ai` dalam daftar rute, bukan sebagai subjeknya. Gerbangnya
tinggal; daftarnya yang menyusut.

---

## 2. Ritual skill — `ROADMAP.md` §2.1, dan ia mengembalikan NOL lagi

```bash
python .claude/skills/ui-ux-pro-max/scripts/search.py \
  "removing a page site structure navigation" --domain ux -n 3
```

Hasilnya **Breadcrumbs** dan **Active State** — keduanya tentang menunjukkan
posisi pembaca, tak satu pun tentang menghapus rute. Database itu berisi
panduan tingkat komponen; menghapus permukaan bukan pertanyaan yang ia jawab.

Ini nol ketiga berturut-turut (`TAHAP-82` §2.1, `TAHAP-83` §2). Dicatat terus
terang, karena ritual yang hanya dilaporkan ketika ia membantu adalah ritual
yang tidak bisa dipercaya.

---

## 3. Yang akan dikerjakan

### 3.1 Rutenya

```
app/[locale]/ai/page.tsx        dihapus
app/[locale]/ai/layout.tsx      dihapus
app/[locale]/ai/ai.module.css   dihapus
```

### 3.2 Iklannya

```
lib/seo/route-catalog.ts        entri `/ai` dihapus — satu tempat, tiga permukaan
lib/seo/markdown-document.ts    tautan "Agent index" dihapus dari tiap .md
```

### 3.3 Gerbang yang menyebutnya dalam daftar rute

Empat belas spec e2e memuat `/ai` dalam array rute. Masing-masing dikeluarkan,
**bukan dinonaktifkan** — sebuah gerbang yang di-skip karena rutenya hilang
adalah gerbang yang berhenti mengukur tanpa ada yang tahu.

`e2e/route-budget.e2e.ts` kehilangan satu baris anggaran (`/en/ai`, 850 KB).

### 3.4 Komentar yang jadi basi

`/en/ai` dipakai sebagai **contoh** di beberapa doc comment — terutama
`app/[locale]/layout.tsx`, yang menjelaskan kenapa kursor dan GSAP tidak boleh
masuk ke tiap graf halaman. Alasannya masih berlaku; contohnya yang hilang.

Komentar itu **dikoreksi**, bukan dihapus: argumen yang kehilangan contohnya
masih argumen, tapi argumen yang menunjuk rute yang tidak ada adalah dokumen
yang berbohong tentang kodenya sendiri — hal yang `ROADMAP.md` sebut lebih
buruk daripada tidak ada dokumen.

### 3.5 Yang TIDAK disentuh

- `app/agent-content/route.ts` — §1.4
- `e2e/agent-readiness.e2e.ts` sebagai gerbang — §1.5
- `docs/stages/TAHAP-13.md`, `TAHAP-14.md` — riwayat
- Entri ROADMAP lama, `AUDIT-2026-08.md`, `PROVENANCE.md` — riwayat

---

## 4. Kriteria keluar

| gerbang                                              | tuntutan                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| `bun run check`                                      | 589+ lulus, 0 gagal                                                            |
| `bun run build`                                      | hijau; **nol rute `/ai`** di tabel keluaran                                    |
| `sitemap.xml`                                        | tidak lagi memuat `/ai`, dua locale                                            |
| `/llms.txt`                                          | idem                                                                           |
| dokumen `.md` mana pun                               | tidak lagi memuat tautan "Agent index"                                         |
| `e2e/canonical-sweep` · `route-sweep` · `site-reach` | hijau — nol tautan internal menunjuk `/ai`                                     |
| `e2e/not-found.e2e.ts`                               | hijau — `/en/ai` kini **soft-404**, sama dengan jalur yang tak pernah ada (§7) |
| `grep -r "'/ai'" app lib components vault e2e`       | nol **di luar** komentar yang sudah dikoreksi                                  |

---

## 5. Risiko

1. **Menghapus `agent-content` bersamaan.** Risiko terbesar tahap ini, dan
   §1.4 ada supaya ia tertulis sebelum tangan bergerak.
2. **Menyunting riwayat.** Godaannya nyata karena `grep` tidak membedakan
   catatan dari referensi. §1.1 dan §3.5 adalah daftarnya, bukan ingatan.
3. **Gerbang yang di-skip alih-alih dikeluarkan.** Tahap 82 sudah membayar
   bentuk ini: `project-spread` melewatkan diri dan tak ada yang tahu selama
   satu putaran CI. Daftar rute disunting, bukan tes dimatikan.
4. **Permukaan AEO hilang, dan itu memang harganya.** Doc halaman itu
   menyebut dirinya _"the highest-leverage AEO surface a site can ship"_.
   Pemilik repo sudah meninjau dan memutuskan ia tidak dibutuhkan; dicatat
   sekali di sini sebagai harga yang dibayar sadar, bukan sebagai keberatan
   yang diulang. `/llms.txt`, `sitemap.xml`, JSON-LD, dan negosiasi markdown
   lewat `agent-content` semuanya tetap ada — yang hilang adalah indeks
   HTML-polosnya.

---

## 7. Hasil

### 7.1 Gerbang

```
bun run check    591 lulus, 0 gagal   (588 + 3 uji formatList baru)
bun run build    hijau · nol rute /ai di tabel keluaran
e2e              121 lulus, 0 gagal   agent-readiness · promises · not-found ·
                                      site-reach · canonical-sweep · response-headers ·
                                      keyboard-focus · no-javascript · route-sweep
```

Diukur langsung terhadap situs yang berjalan:

```
sitemap.xml            0 baris menyebut /ai
/llms.txt              0 baris menyebut /ai
404 markdown           0 tautan "Agent index"
/en.md                 200 — negosiasi markdown utuh (§1.4)
```

### 7.2 Satu kriteria keluar saya yang salah tentang arsitektur situs ini

§4 menuntut `/en/ai` **404**. Ia mengembalikan **200**, dan saya nyaris
melaporkannya sebagai kegagalan penghapusan. Diukur lebih jauh:

```
/en/ai            200  "Page not found — Arth"  <meta robots=noindex>
/en/tidak-ada-xyz 200  "Page not found — Arth"  <meta robots=noindex>
```

Jalur yang **tidak pernah ada** berperilaku identik. Ini **soft-404** yang
disengaja: di bawah Cache Components shell mulai di-stream sebelum
`notFound()` diketahui, jadi statusnya tidak bisa lagi diubah. Repo sudah
tahu dan sudah menggerbanginya — `e2e/not-found.e2e.ts:44` mengasersi
`expect(response?.status()).toBe(200)` dengan komentar yang menjelaskan
kenapa, dan menuntut `noindex` sebagai sinyal yang menggantikan status.

Jadi `/ai` kini berperilaku persis seperti halaman mana pun yang tidak ada di
situs ini. Kriterianya yang dikoreksi, bukan kodenya.

### 7.3 Tiga hal yang nyaris hilang tanpa ada yang tahu

`grep` mengembalikan 63 berkas dan tidak membedakan referensi dari riwayat.
Yang tertangkap karena dibaca satu per satu:

- **`app/sitemap.ts`** menyuruh pengembang menambahkan rute baru ke `PAGES`
  di `app/[locale]/ai/page.tsx` — **instruksi aktif** menuju berkas yang
  dihapus. Dikoreksi jadi "katalog adalah sumber tunggal", yang memang
  sekarang benar.
- **`lib/seo/README.md`** menganjurkan _"Ship a `/ai` machine view"_ sebagai
  praktik. Dokumen yang menganjurkan hal yang situsnya baru saja tolak.
  Diganti catatan bahwa situs ini meninjau dan menghapusnya.
- **Konjungsi Indonesia.** `promises.e2e.ts` menjaga agar daftar fakta situs
  berbahasa Indonesia memakai "dan", bukan "and" — dan catatannya merekam
  bahwa ia pernah menangkap bug nyata. Perbaikannya hidup di `formatList`,
  yang masih ada; `/ai` cuma satu-satunya pemanggilnya dengan `'id'`.
  Invariannya dipindah ke `lib/seo/site.test.ts` alih-alih ikut terhapus.

### 7.4 Yang tidak dikerjakan, dinyatakan eksplisit

- **`app/agent-content/route.ts` tidak disentuh** — §1.4. `/en.md` diverifikasi
  masih 200.
- **Riwayat tidak disunting.** `docs/stages/TAHAP-13.md`, `TAHAP-14.md`, entri
  ROADMAP lama, `AUDIT-2026-08.md`, `PROVENANCE.md` tetap apa adanya. Beberapa
  komentar historis di kode diberi penanda "(removed in Tahap 84)" supaya
  pembaca tidak mencari berkas yang tidak ada — narasinya tidak diubah.
- **Paritas locale permukaan mesin kehilangan gerbangnya.** `promises.e2e.ts`
  membandingkan `/en/ai` dengan `/id/ai` untuk memastikan yang kedua bukan
  salinan yang pertama. Permukaan mesin yang tersisa dan ter-lokalisasi adalah
  `/en.md` / `/id.md`, tapi keduanya hanya membawa nama dan deskripsi dari
  `siteFacts(locale)` — jauh lebih kecil, dengan ambang berbeda. Mengarahkan
  ulang berarti **merancang gerbang baru**, bukan menghapus, jadi ia dicatat
  terbuka di sini alih-alih dikerjakan diam-diam di tahap penghapusan.
- **Nol angka performa diklaim** (`CLAUDE.md` #19).
