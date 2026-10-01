# Tahap 99 — Konten yang dilewati pembaca, lalu tidak pernah muncul

> **Status: terkirim.** Spec ditulis lebih dulu sesuai `ROADMAP.md` §3.0.
>
> Cacat produk pertama yang ditemukan **dengan mengikuti bukti** yang mekanisme
> Tahap 98 selamatkan — pada run pertamanya.

---

## 1. Pengukuran

### 1.1 Mekanisme Tahap 98 bekerja, dan langsung membayar

CI `e63b852`: **722 lulus / 1 flaky / 14 dilewati**, dan langkahnya melaporkan
`Upload Playwright report: success` — pada run yang **flaky, bukan gagal**.
Sebelum Tahap 98 artefak itu dibuang. Isinya tiga berkas, semuanya milik uji
yang flaky:

```
motion.e2e.ts-…-strands-no-content-invisible-desktop/error-context.md
motion.e2e.ts-…-strands-no-content-invisible-desktop/test-failed-1.png
motion.e2e.ts-…-strands-no-content-invisible-desktop-retry1/trace.zip
```

Dan `error-context.md` memuat kalimat yang selama ini hilang:

```
Error: /en/work left content at opacity 0
Received: ["P.caption", "P.page-module__4dniIq__intro"]
```

**Flaky-nya juga berpindah** — bukan lagi gerbang aksen, melainkan
`motion.e2e.ts:156`. Dan uji yang sama merah di run lokal laptop ini pada saat
yang sama. Dua instrumen berbeda menunjuk satu uji.

### 1.2 Apa yang tertinggal, dan di mana

```
P.caption                       app/[locale]/work/catalogue.tsx:224
P.page-module__…__intro         intro halaman /en/work
```

Keduanya di **puncak** `/en/work`: `.caption` adalah item pertama di dalam
`<Reveal as="header">` milik katalog — eyebrow yang dibaca lebih dulu — dan
`.intro` kalimat yang menjelaskan daftar itu apa.

### 1.3 Satu pembacaan memisahkan dua sebab, dan ia menjawab telak

Sebuah item reveal yang tertinggal punya dua kemungkinan: transisinya belum
selesai, atau reveal-nya tidak pernah diminta. Keadaan wadahnya menjawabnya.
Diukur terhadap build produksi, meniru persis traversal gerbang itu:

```
run 1  P.caption   opacity 0  container "hidden"  animations 0  delay 0s     dur 0.4s  top -3067
run 1  P.…intro    opacity 0  container "hidden"  animations 0  delay 0.07s  dur 0.4s  top -2932
run 2  keduanya sama
run 3  tidak ada yang tertinggal
```

`data-reveal` masih **`hidden`**, nol animasi, penundaan 0 dan 0,07 detik
terhadap durasi 0,4 detik. Jadi bukan transisi yang belum selesai — **reveal
itu tidak pernah diminta**. Dua dari tiga run.

### 1.4 Sebabnya, dan kenapa ia lolos selama ini

`lib/hooks/use-reveal.ts` mengamati wadah dengan `threshold: 0`,
`rootMargin: '0px 0px -25% 0px'`, `once: true`. Callback pertama sebuah
`IntersectionObserver` **asinkron**. Sebuah blok yang ada di layar saat mount
bergantung pada callback itu tiba sebelum pembaca bergerak.

Di thread utama yang sibuk ia tidak tiba tepat waktu. Saat ia akhirnya
berjalan, blok itu sudah **di atas** viewport (`top: -3067`), jadi:

- `isIntersecting` bernilai salah;
- `unreachable()` bernilai salah juga — jaring itu menanyakan tepi **bawah**,
  untuk blok yang tidak akan pernah terjangkau karena inset -25%;
- tidak ada lagi yang membersihkan `opacity: 0`.

`once` tidak pernah menyala, jadi observer-nya tetap hidup dan menggulir
**kembali ke atas** akan memunculkannya. Tetapi pembaca yang turun dan tidak
kembali tidak pernah melihatnya, dan pada saat ia memandang puncak halaman,
eyebrow dan intro itu memang tidak ada.

Hook itu sudah punya separuh jaringnya sejak lama. Yang hilang separuh lagi.

---

## 2. Rancangan

Satu predikat, disusun persis seperti `unreachable` — dari `entry.rootBounds`
milik observer itu sendiri, bukan dari menurunkan ulang 25% dari string opsi:

```
passed(entry) := entry.boundingClientRect.bottom <= entry.rootBounds.top
```

Blok yang seluruhnya sudah di atas root **dimunculkan**. Alasannya sama dengan
alasan `unreachable` memunculkan yang tidak terjangkau: entrance yang ia
tunggu tidak mungkin terjadi lagi, dan menyembunyikannya tidak membeli apa
pun. `CLAUDE.md` #5 — konten berakhir terlihat penuh, atau itu cacat.

### 2.1 Yang diperiksa sebelum mengubah

Mode `once: false` akan berperilaku beda (blok yang terlewat tidak lagi
di-hide ulang). Dipindai seluruh repo: **nol** pemanggil memakai `once: false`.
Cabang itu tidak tersentuh dalam praktik.

---

## 3. Daftar berkas

| berkas                                                | perubahan                                         |
| ----------------------------------------------------- | ------------------------------------------------- |
| `lib/hooks/use-reveal.ts`                             | predikat `passed`, dan alasannya beserta angkanya |
| `docs/stages/TAHAP-99.md`, `ROADMAP.md`, `HANDOFF.md` | berkas ini dan posisi                             |

---

## 4. Kriteria keluar

1. Probe yang sama: **nol** item tertinggal, berulang.
2. `e2e/motion.e2e.ts` hijau, dijalankan lebih dari sekali.
3. `bun run build` hijau; tahap `check` satu per satu.
4. Tidak ada klaim bahwa flaky CI lain ikut tertutup.

---

## 5. Risiko

| #   | risiko                                                      | penangkal                                                                                                               |
| --- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| R1  | Blok kini muncul tanpa animasi saat pembaca menggulir cepat | Memang, dan itu yang diinginkan: pilihannya bukan "animasi atau tidak", melainkan "terlihat atau tidak pernah terlihat" |
| R2  | Mode `once: false` berubah perilaku                         | §2.1 — nol pemanggil                                                                                                    |
| R3  | Sebab di CI ternyata berbeda dari yang terukur di sini      | Mungkin; yang dijamin adalah keadaan terukur di §1.3 tidak lagi terjadi. Run CI berikutnya yang menjawab sisanya        |

---

## 6. Yang tidak dikerjakan, dinyatakan eksplisit

- **Flaky aksen `/en/practice/consulting` tidak disentuh** — ia terbuka, dan
  kejadian berikutnya kini membawa buktinya (`TAHAP-98.md`).
- **Nol angka performa diklaim** — `CLAUDE.md` #19.

---

## 7. Hasil

### 7.1 Merah lalu hijau, atas mekanismenya

```
sebelum   2 dari 3 run: dua item pada opacity 0, container "hidden"
sesudah   3 dari 3 run: nol item tertinggal
motion.e2e.ts, desktop, --repeat-each=3   96 lulus, 0 gagal (9,0 mnt)
```

### 7.2 Rantai yang membawanya ke sini

Tiga tahap, masing-masing hanya memperbaiki keterbacaan, dan cacat produknya
jatuh di ujungnya:

```
Tahap 94  anggaran diturunkan dari kerjanya   -> uji lambat melapor, bukan mati
Tahap 98  artefak disimpan untuk run flaky    -> buktinya selamat dari CI
Tahap 99  bukti dibaca                        -> cacat produk yang nyata
```

Tidak satu pun dari ketiganya dimulai dengan mencari cacat ini.

### 7.3 Gerbang

```
bun run build   EXIT=0 . 0 baris galat . metadataBase 0 . Compiled in 37.6s
oxlint . lint:types . tsc   bersih
motion.e2e.ts x3            96 lulus
```
