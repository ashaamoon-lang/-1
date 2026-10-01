# Tahap 62 — Vercel, domain Porkbun, dan `lab` yang dipesan lebih dulu

> **Nol perubahan visual, dan lebih kecil dari yang saya rencanakan.** Saya
> menulis di rencana bahwa tahap ini membuat "bagian Vercel" di
> `DEPLOYMENT.md`. Bagian itu **sudah ada** (§0–§4) dan sudah benar. Yang
> benar-benar hilang adalah satu hal: **domainnya**.

---

## 1. Apa yang sebenarnya kurang

Anda sudah membeli domain di Porkbun. Dokumen deployment tidak menyebut
domain sama sekali di luar variabel `NEXT_PUBLIC_BASE_URL` — ia melompat dari
"Deploy" langsung ke "Cek deploy-nya benar". Jadi langkah antara keduanya,
yang justru langkah Anda, tidak tertulis.

Yang **tidak** perlu dikerjakan, diperiksa satu per satu:

| sudah ada                                 | di mana                                                  |
| ----------------------------------------- | -------------------------------------------------------- |
| Preset, build, output                     | `vercel.json` + `next.config.ts`; tidak ada yang disetel |
| Daftar env var, dan mana yang publik      | `DEPLOYMENT.md` §1                                       |
| Token Viewer, dan larangan `NEXT_PUBLIC_` | §0 — bagian pertama dokumen, dengan sengaja              |
| CORS Sanity sesudah deploy pertama        | §2 "Immediately after the first deploy"                  |
| Webhook publish                           | §4                                                       |
| Checklist pra-tayang, rotasi kredensial   | §6 — sudah tercatat, tanpa mengungkit                    |
| `@vercel/analytics`                       | `app/[locale]/layout.tsx`, no-op di luar Vercel          |

Tidak ada `output: 'standalone'` di `next.config.ts`, dan itu benar: itu mode
untuk VPS, dan Vercel tidak memakainya.

---

## 2. Nilai DNS tidak saya tulis sebagai fakta

Vercel pernah mengubah nilai A record-nya, dan panduan pihak ketiga yang
menyalin nilai lama adalah cara paling umum sebuah domain menunjuk ke tempat
yang salah selama berjam-jam.

Jadi §2.1 yang baru menulis **bentuk** recordnya (mana yang A, mana yang
CNAME, untuk host mana) dan menyatakan bahwa **layar Domains di Vercel adalah
sumber nilainya** — termasuk terhadap dokumen ini sendiri. Itu penerapan
`CLAUDE.md` #19 pada sesuatu yang bukan angka performa: jangan menuliskan
nilai yang tidak bisa saya verifikasi dari sumbernya.

---

## 3. `lab.<domain>` dipesan, belum dibangun

`DIREKSI.md` §5 menetapkan dua permukaan: `arth.<domain>` untuk situs agency,
`lab.<domain>` untuk sandbox efek. Rute `/lab` **belum ada** — ia pekerjaan
Tahap 67.

Keputusannya diambil sekarang karena ia menentukan DNS yang Anda setel hari
ini, bukan karena kodenya siap:

> **Satu proyek Vercel, dua domain.** `lab.<domain>` ditambahkan sebagai
> domain kedua pada proyek yang sama, dan `proxy.ts` yang memetakannya ke
> `/lab` saat rute itu ada.

Alasannya, dan konsekuensinya dinyatakan:

- **Proyek Vercel kedua** berarti dua build, dua set env var, dua deployment
  untuk satu commit — dan `vault/` dibagi keduanya, jadi tiap perubahan
  primitive harus naik dua kali.
- **Satu proyek** berarti eksperimen lab ikut naik bersama situs utama. Itu
  risiko yang nyata, dan gerbang kebenaran `DIREKSI.md` §3.1 berlaku penuh di
  `/lab` justru untuk itu — yang tidak berlaku di sana cuma gerbang selera.
- Menambahkan domain sekarang, sebelum rutenya ada, **tidak memecahkan apa
  pun**: `lab.<domain>` menyajikan situs yang sama sampai `proxy.ts`
  memisahkannya. Ia hanya membuat DNS jadi pekerjaan sekali.

---

## 4. `infra/` dibekukan, bukan dihapus

Tujuh berkas skrip GCP dibangun di sesi ini dan **tidak jadi dipakai** — VPS
dibatalkan setelah pengukuran menunjukkan biayanya tidak dibenarkan oleh apa
pun yang ada hari ini. Berkasnya tetap di repo dengan catatan di kepala
`infra/README.md`.

Alasannya menyimpan: pengukuran build di dalamnya (74,9s / puncak RSS 3,35 GB
/ `.next` 548 MB + `node_modules` 1,8 GB) nyata dan tetap berguna, dan
`DEPLOYMENT.md` §5 memang menjanjikan jalur VPS. Yang berubah adalah statusnya
dari "rencana" jadi "kalau nanti perlu".

---

## 5. Yang dikerjakan siapa

| langkah                                   | siapa    |
| ----------------------------------------- | -------- |
| Import repo di Vercel, isi env var        | **Anda** |
| Tambah `arth.<domain>` dan `lab.<domain>` | **Anda** |
| Salin record dari layar Vercel ke Porkbun | **Anda** |
| Tambah domain ke CORS Sanity              | **Anda** |
| Dokumen, keputusan, dan gerbang           | saya     |

Saya tidak punya akses ke akun Vercel atau Porkbun Anda, dan **tidak akan
mengklaim situsnya tayang sampai Anda bilang tayang.**

---

## 6. Gerbang keluar

| harus                                                                    |
| ------------------------------------------------------------------------ |
| `DEPLOYMENT.md` memuat langkah domain, dari Porkbun ke Vercel            |
| Nilai DNS disebut sebagai **bentuk**, dengan layar Vercel sebagai sumber |
| Keputusan `lab` tertulis beserta konsekuensinya                          |
| `infra/README.md` menyatakan statusnya di kepalanya                      |
| `bun run check` hijau                                                    |

---

## 7. Hasil

| gerbang                                | hasil                                                           |
| -------------------------------------- | --------------------------------------------------------------- |
| `DEPLOYMENT.md` §2.1 langkah domain    | ditulis — Vercel dulu, Porkbun sesudahnya, dengan alasannya     |
| Nilai DNS sebagai bentuk, bukan angka  | ditulis, dengan layar Vercel dinyatakan menang atas dokumen ini |
| Keputusan `lab` + konsekuensinya       | `DEPLOYMENT.md` §2.2                                            |
| `infra/README.md` menyatakan statusnya | kepala berkas, dengan angka pengukurannya                       |
| `bun run check`                        | **424 lulus / 0 gagal**                                         |

### 7.1 Satu konsekuensi yang sengaja ditulis sebelum terlihat

`NEXT_PUBLIC_BASE_URL` satu nilai dan dipanggang saat build, jadi halaman yang
disajikan di `lab.<domain>` akan membawa canonical, `hreflang`, dan `og:url`
yang menunjuk domain utama. **Itu jawaban yang benar** selama keduanya
menyajikan isi yang sama — satu canonical, tidak ada pemecahan konten ganda —
dan itulah kenapa `e2e/canonical-sweep.e2e.ts` tetap hijau.

Ia jadi salah pada hari `/lab` punya isi sendiri. Ditulis sekarang supaya ia
tidak ditemukan sebagai "bug" nanti, dan Tahap 67 yang memperbaikinya.

### 7.2 Yang menunggu Anda

Tahap ini tidak bisa dinyatakan tayang oleh saya. Saya tidak punya akses ke
akun Vercel atau Porkbun, dan **tidak akan mengklaim situsnya hidup sampai
Anda bilang hidup.** Lima langkah di §5 milik Anda; sesudah itu
`DEPLOYMENT.md` §3 punya perintah `curl` untuk membuktikan deploy-nya benar,
dan §6 punya checklist pra-tayangnya.
