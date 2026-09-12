# Menyalakan infrastruktur ARTH

**Lima langkah.** Versi sebelumnya menuntut 43 perintah manual, 23 di antaranya
`gcloud` — dan sebuah setup yang butuh 43 langkah benar berturut-turut tidak
menguji kecermatan siapa pun, ia menyalahkan orang atas bentuknya sendiri.
Yang tersisa di sini adalah yang benar-benar butuh keputusan manusia.

Langkah manualnya tidak dibuang; ia turun ke [§Lampiran](#lampiran--langkah-manual),
untuk saat sesuatu perlu dikerjakan dengan tangan atau saat Anda ingin tahu
persis apa yang dilakukan skripnya. Skrip yang isinya tidak bisa dibaca adalah
skrip yang tidak bisa dipercaya.

---

## 1. Budget Alert

Billing → **Budgets & alerts** → Create budget. Ambang 50% dan 90% dari kredit.

Satu-satunya langkah yang sengaja **tidak** diskripkan: ia menyentuh billing,
dan itu bukan tempat untuk otomatisasi. Pasang lebih dulu — instance yang lupa
dimatikan adalah cara paling umum kredit habis tanpa ada yang sadar, dan alert
baru berguna kalau sudah ada sebelum mesinnya menyala.

---

## 2. Membuat mesinnya

Dua jalur, hasilnya sama. **Pilih satu.**

- **[Jalur A — console (klik)](#2a-jalur-console)** — kalau Anda lebih tenang
  melihat formulir berlabel. Console juga menghapus pekerjaan yang nyata: dua
  centang firewall membuat aturannya **sekaligus** memasang network tag-nya.
- **[Jalur B — Cloud Shell (skrip)](#2b-jalur-cloud-shell)** — kalau Anda
  ingin satu perintah dan hasil yang bisa diulang persis.

---

### 2a. Jalur console

Compute Engine → **VM instances** → **Create instance**.

**Tabel nilai di bawah ini yang mengikat, bukan nama bagiannya.** Saya tidak
bisa melihat console Anda, dan GCP mengubah tata letaknya cukup sering —
dokumentasi resminya pun tidak memuat label UI-nya. Kalau sebuah bagian tidak
ada di tempat yang tertulis di sini, itu bukan Anda melewatkan sesuatu:
kirimkan tangkapan layarnya.

| pengaturan           | nilai                                                      | kalau salah                                                                                                                                            |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Name                 | `arth-lab`                                                 | hanya nama; aman diganti asal konsisten                                                                                                                |
| Region               | `asia-southeast1` (Singapore)                              | latensi, dan harga                                                                                                                                     |
| Zone                 | `asia-southeast1-b`                                        | kapasitas penuh → coba `-a` atau `-c`                                                                                                                  |
| Machine family       | General purpose · **E2**                                   |                                                                                                                                                        |
| Machine type         | **Custom** → **2 vCPU**, **6 GB**                          | diukur, §7. Kalau Custom bermasalah, `e2-medium` (2 vCPU / 4 GB) masih cukup dengan swap — `e2-small` (2 GB) tidak                                     |
| Boot disk — OS       | **Ubuntu**                                                 |                                                                                                                                                        |
| Boot disk — version  | **Ubuntu 24.04 LTS** (x86/64)                              | Playwright resmi mendukung 22.04/24.04                                                                                                                 |
| Boot disk — type     | **Balanced persistent disk**                               |                                                                                                                                                        |
| Boot disk — size     | **30 GB**                                                  | diukur, §7: aplikasinya **1,97 GB**. Disk GCP bisa **dibesarkan hidup-hidup, tidak pernah dikecilkan** — jadi kecil adalah arah yang benar untuk salah |
| Firewall             | centang **Allow HTTP traffic** dan **Allow HTTPS traffic** | tanpa ini Caddy tidak bisa mengambil sertifikat                                                                                                        |
| External IPv4        | **buat IP statis baru**, namai `arth-lab-ip`               | **paling mudah terlewat.** Bawaannya _Ephemeral_, dan itu berubah tiap VM restart — DNS Anda lalu menunjuk mesin orang lain                            |
| Network Service Tier | **Standard**                                               | Premium tidak perlu, dan lebih mahal                                                                                                                   |

**Dua baris terakhir ada di sub-layar.** Buka **Networking → Network
interfaces → `default`**; External IPv4 dan Network Service Tier ada di
dalamnya. Itu sebabnya keduanya sering terlewat — bukan karena tersembunyi,
tapi karena bagian utamanya terlihat sudah lengkap tanpa membukanya.

Dua hal lagi:

- **Machine type Custom** adalah pilihan **di dalam dropdown** machine type,
  bukan tab tersendiri. Memilihnya memunculkan slider vCPU dan memory.
- **Data protection** → matikan snapshot otomatis untuk mesin ini. Isinya bisa
  dibangun ulang dari repo, dan snapshot menagih penyimpanan. Box B nanti
  berbeda — di sana snapshot masuk akal.

Panel biaya di kanan bergerak sambil Anda mengisi. **Perhatikan angkanya
sebelum menekan Create.** Versi pertama dokumen ini menuntut 4 vCPU / 16 GB /
150 GB dan sampai di **Rp 2 juta/bulan** — spesifikasi yang ditebak, bukan
diukur. §7 memuat pengukurannya dan kenapa mesin ini jauh lebih kecil.

Kalau angka yang Anda lihat masih terasa terlalu tinggi, katakan. Masih ada
satu langkah lagi yang belum dipakai — build pindah sepenuhnya ke GitHub
Actions dan mesin ini hanya menyajikan — dan ia menambah pipa, jadi saya tidak
memakainya sampai Anda memang membutuhkannya.

Setelah Create: **catat External IP**-nya dari daftar VM instances. Itu yang
masuk ke Porkbun di langkah 3.

Jadwal mati otomatis dipasang setelah situsnya hidup — §7.2.

---

### 2b. Jalur Cloud Shell

Buka **Cloud Shell** (ikon `>_` di kanan atas console). Gratis, sudah
terautentikasi, tidak perlu memasang apa pun di laptop.

```bash
gcloud config set project <PROJECT_ID>

git clone --branch claude/satus-award-website-foundation-r6o5cf \
  https://github.com/ashaamoon-lang/-1.git ~/arth-infra
bash ~/arth-infra/infra/provision.sh lab.<domain>
```

Skripnya:

- **Mensurvei dulu** — mencetak VM, IP, dan aturan firewall yang sudah ada
  sebelum menyentuh apa pun. Yang selamat dari percobaan sebelumnya dipakai
  ulang, bukan dibuat ganda.
- **Tidak pernah menghapus apa pun.** VM dengan spek berbeda membuatnya
  berhenti dan menyebutkan bedanya, bukan diam-diam memakai mesin yang salah.
- **Memperingatkan IP statis menganggur**, yang tetap ditagih.
- **Menerjemahkan dua galat GCP** yang kata-katanya tidak memberi tahu apa yang
  harus dilakukan: kuota, dan tipe mesin yang tidak tersedia di zona itu.
- **Menunggu DNS resolve** sebelum mencetak perintah bootstrap.

Aman di-Ctrl-C kapan saja dan dijalankan ulang — ia melewati yang sudah
selesai.

---

## 3. DNS di Porkbun

Jalur Cloud Shell mencetak barisnya persis. Jalur console: pakai **External
IP** yang Anda catat di langkah 2a. Bentuknya:

| Type | Host  | Answer          | TTL   |
| ---- | ----- | --------------- | ----- |
| `A`  | `lab` | IP yang dicetak | `600` |

Porkbun memasang record parkir bawaan — **periksa tidak ada record lain di host
yang sama**, karena dua record di satu host resolve tak terduga.

Lalu **tunggu sampai DNS benar sebelum lanjut**:

```bash
dig +short lab.<domain>      # harus mengembalikan IP itu persis
```

Jalur Cloud Shell menunggu ini untuk Anda. Jalur console tidak — tapi bootstrap
di langkah 4 **menolak jalan** kalau DNS belum cocok, jadi keduanya terlindung.
Itu disengaja: Caddy meminta sertifikat begitu menyala,
Let's Encrypt membatasi kegagalan, dan domain yang terkunci berjam-jam adalah
kegagalan yang sembuhnya dengan menunggu — bukan dengan memperbaiki sesuatu.

---

## 4. Bootstrap — di VM

Masuk ke mesinnya — **tombol SSH** di baris VM pada daftar VM instances
(jalur console), atau:

```bash
gcloud compute ssh arth-lab --zone=asia-southeast1-b
```

Lalu di dalam VM:

```bash
sudo rm -rf /tmp/arth-infra
sudo apt-get update -qq && sudo apt-get install -y -qq git
git clone --branch claude/satus-award-website-foundation-r6o5cf \
  https://github.com/ashaamoon-lang/-1.git /tmp/arth-infra
sudo bash /tmp/arth-infra/infra/bootstrap-lab.sh lab.<domain>
```

`rm -rf /tmp/arth-infra` di depan memastikan Anda memakai skrip terbaru, bukan
salinan dari percobaan sebelumnya. Butuh 12–18 menit.

Bootstrap **memeriksa DNS lagi sebelum menyentuh Caddy** dan menolak lanjut
kalau tidak cocok — sabuk pengaman kedua untuk hal yang sama, karena ini
kegagalan yang paling mahal untuk dibiarkan terjadi.

Setelah selesai:

```bash
bash /tmp/arth-infra/infra/doctor.sh lab.<domain>
```

`doctor.sh` hanya membaca, memeriksa enam belas hal, dan **tiap baris yang gagal
mencetak satu perintah untuk memperbaikinya** — tanda silang yang tidak
mengatakan langkah berikutnya hanyalah cara lebih lambat untuk tersangkut.

---

## 5. Beri Claude akses

```bash
sudo -iu deploy
curl -fsSL https://claude.ai/install.sh | bash
claude
```

Sesi yang berjalan **di mesin itu** punya shell asli. Sesi saya yang di tempat
lain hanya punya egress HTTPS lewat policy proxy — saya tidak bisa SSH ke mesin
Anda dari sana, jadi ini jalur langsungnya.

Deploy otomatis sudah hidup sejak bootstrap; tidak ada yang perlu didaftarkan.
Lihat [§6](#6-deploy-otomatis--sudah-terpasang).

---

### 5.1 Perketat SSH — setelah situsnya hidup, bukan sebelum

**Koreksi terhadap versi sebelumnya dari dokumen ini.** Ia membuat aturan
`allow-ssh-iap` dan menyiratkan bahwa SSH Anda karenanya hanya lewat IAP. Itu
tidak benar: **VPC bawaan GCP sudah berisi `default-allow-ssh`** yang
mengizinkan tcp:22 dari `0.0.0.0/0`, dan menambahkan aturan baru **tidak
menghapus** yang lama. Firewall GCP bersifat izin — aturan paling permisif yang
menang.

Jadi apa pun jalur yang Anda pakai, **port 22 Anda terbuka ke internet sampai
Anda mengubah aturan itu.**

Yang menahannya sementara ini bukan ketiadaan: GCP mematikan autentikasi
password sepenuhnya pada image-nya, jadi hanya kunci yang diterima. Itu sebabnya
konfigurasi ini yang dijalankan hampir semua orang tanpa kejadian. Tapi Anda
berhak tahu bahwa itu keadaannya, bukan mengira ia sudah tertutup.

**Menutupnya, satu layar:**

VPC network → **Firewall** → `default-allow-ssh` → **Edit** → **Source IPv4
ranges**: ganti `0.0.0.0/0` menjadi `35.235.240.0/20` → Save.

`35.235.240.0/20` adalah rentang IAP milik Google. Sesudahnya tombol **SSH** di
console tetap bekerja — ia lewat IAP — tapi tidak ada pemindai internet yang
bisa menyentuh port 22 Anda.

**Kenapa sesudah, bukan sebelum.** Kalau langkah ini salah dan Anda terkunci
dari mesin yang belum menyajikan apa pun, Anda kehilangan dua hal sekaligus.
Kalau salah setelah situsnya hidup, situsnya tetap hidup dan Anda punya waktu
memperbaikinya. Urutan yang aman bukan yang paling ketat lebih dulu — melainkan
yang menjaga jalan kembali tetap terbuka.

> Terkunci? `gcloud compute firewall-rules update default-allow-ssh
--source-ranges=0.0.0.0/0` dari Cloud Shell mengembalikannya. Cloud Shell
> tidak melewati firewall VPC Anda, jadi ia selalu bisa dipakai.

---

## 6. Deploy otomatis — sudah terpasang

Bootstrap sudah memasang timer-nya. Tidak ada yang perlu didaftarkan, tidak ada
token, tidak ada port masuk.

```bash
systemctl list-timers arth-deploy       # kapan cek berikutnya
journalctl -u arth-deploy -n 40         # apa yang terjadi terakhir kali
sudo systemctl start arth-deploy        # paksa satu kali sekarang
```

Tiap lima menit mesinnya mengambil branch. **Tidak ada commit baru → keluar tanpa
melakukan apa pun**, jadi jurnalnya hanya berisi baris yang benar-benar
berarti. Ada commit baru → build, restart lab, kirim ke Box B, restart
produksi, lalu **buktikan produksi menjawab 200** sebelum melapor sukses.

Kalau build gagal, skripnya berhenti dan **Box B tidak disentuh** — produksi
tetap menyajikan versi terakhir yang bekerja. Commit rusak tidak bisa
menjatuhkan situs, ia hanya gagal menggantikannya.

Memicu deploy = mendorong commit. Tidak ada cara lain memulainya.

### 6.1 Kenapa BUKAN self-hosted GitHub Actions runner

Rancangan pertama infrastruktur ini memakai runner, dan itu **salah**.

`ashaamoon-lang/-1` adalah repo **publik** — diperiksa lewat API:
`visibility: public`, dan sudah ada satu fork. Self-hosted runner di repo publik
adalah jalur bagi pull request dari fork untuk **menjalankan kode di mesin
Anda**. GitHub sendiri menyarankan untuk tidak pernah melakukannya.

Peringatan itu sempat tertulis di runbook ini sebagai kondisi hipotetis ("kalau
repo dipublikkan nanti") padahal reponya sudah publik sejak awal. Dicatat apa
adanya supaya pembaca berikutnya tidak memasangnya kembali karena kelihatan
lebih cepat.

Yang dibayar sebagai gantinya: deploy mendarat dalam ≤5 menit, bukan seketika.
Itu harga dari permukaan serang nol.

---

## 7. Biaya, dan apa yang bisa dimatikan

Mesin ini diukur, bukan ditebak. `bun run build` dengan `.next` kosong, di
container 4 vCPU / 15 GB, 2026-09-12:

|                      | 4 vCPU     | 2 vCPU         |
| -------------------- | ---------- | -------------- |
| waktu dinding        | 74,9 detik | **83,2 detik** |
| puncak RSS           | 3,35 GB    | 3,30 GB        |
| rata-rata core aktif | 3,00       | 1,95           |

Di disk sesudahnya: `.next` **548 MB**, `node_modules` **1,8 GB** — total
**1,97 GB**.

Tiga kesimpulan, dan ketiganya mengecilkan mesin:

- **2 vCPU, bukan 4.** Core ketiga dan keempat membeli sebelas detik.
- **6 GB, bukan 16.** Puncaknya 3,3 GB. Versi pertama dokumen ini menyebut
  16 GB karena container pengembangan kebetulan punya 15 dan build-nya muat —
  itu pengamatan, bukan pengukuran.
- **30 GB, bukan 150.** Aplikasinya 2 GB, Playwright menambah ~0,5, Ubuntu ~3.

30 GB juga arah yang benar untuk salah: **disk GCP bisa dibesarkan hidup-hidup
tanpa downtime, dan tidak pernah bisa dikecilkan.**

### 7.1 Yang berhenti ditagih, dan yang tidak

| komponen     | saat instance di-stop                                                           |
| ------------ | ------------------------------------------------------------------------------- |
| vCPU dan RAM | **berhenti ditagih** — ini bagian terbesarnya                                   |
| Boot disk    | **tetap ditagih 24 jam**                                                        |
| IP statis    | **tetap ditagih** — IP yang dicadangkan tapi tidak dipakai justru dikenai biaya |

Karena itu ukuran disk adalah angka yang paling harus jujur: ia satu-satunya
yang tidak bisa Anda matikan.

### 7.2 Jadwal mati otomatis

Compute Engine → **Instance schedules** → Create. Klik, bukan skrip.

Buat satu jadwal start/stop yang cocok dengan jam kerja Anda, lalu pasangkan
ke instance-nya. Jamnya milik Anda — saya tidak tahu kapan Anda bekerja, dan
menebaknya akan jadi kesalahan yang sama seperti menebak RAM.

Mesin yang menyala 8 jam sehari membayar sepertiga biaya vCPU dan RAM-nya.
Disk dan IP tidak berubah.

### 7.3 Jalan keluar, dan ia sah

Kalau sebulan lagi lab tidak dikunjungi siapa pun dan pengukuran performa sudah
selesai: **hapus instance-nya, simpan snapshot disk.** Snapshot menagih jauh
lebih murah daripada disk hidup, dan memulihkannya butuh beberapa menit.

Tidak ada yang hilang selain biaya bulanan — dan itu justru intinya.

### 7.4 Mesin kedua untuk produksi

**Tidak ada dalam setup ini, dan itu disengaja.** Versi sebelumnya
merancangnya: satu mesin lab dan satu mesin produksi, supaya eksperimen yang
kebablasan tidak bisa menjatuhkan situs yang mencari klien. Prinsipnya benar;
waktunya yang salah. Belum ada produksi, dan ia melipatduakan tagihan untuk
melindungi sesuatu yang belum ada.

Konsekuensi yang harus dikatakan terus terang: **dengan satu mesin, eksperimen
lab yang jatuh menjatuhkan `lab.<domain>` juga.** Dengan nol pengunjung, itu
risiko yang benar untuk diambil.

Ia kembali saat salah satu benar: klien nyata melihat situsnya, atau lab cukup
ramai sehingga eksperimen yang gagal terasa oleh orang lain. Skripnya menunggu
di `infra/optional/bootstrap-prod.sh` dengan catatan lengkap tentang apa lagi
yang harus ikut kembali.

---

## Lampiran — langkah manual

Yang `provision.sh` lakukan, kalau Anda ingin menjalankannya sendiri atau
memeriksa apa yang sebenarnya terjadi.

```bash
gcloud services enable compute.googleapis.com

gcloud compute addresses create arth-lab-ip \
  --region=asia-southeast1 --network-tier=STANDARD
gcloud compute addresses list --format="table(name,address)"

gcloud compute firewall-rules create allow-http \
  --allow=tcp:80  --target-tags=http-server  --source-ranges=0.0.0.0/0
gcloud compute firewall-rules create allow-https \
  --allow=tcp:443 --target-tags=https-server --source-ranges=0.0.0.0/0
# 35.235.240.0/20 adalah rentang IAP milik Google.
#
# PERHATIKAN: menambahkan aturan ini TIDAK menutup SSH. VPC bawaan sudah
# berisi `default-allow-ssh` (0.0.0.0/0 -> tcp:22), dan firewall GCP bersifat
# izin — aturan paling permisif yang menang. Untuk benar-benar menutupnya,
# sunting `default-allow-ssh` seperti di §5.1.
gcloud compute firewall-rules create allow-ssh-iap \
  --allow=tcp:22 --source-ranges=35.235.240.0/20

gcloud compute instances create arth-lab \
  --zone=asia-southeast1-b \
  --machine-type=e2-custom-2-6144 \
  --image-family=ubuntu-2404-lts-amd64 --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB --boot-disk-type=pd-balanced \
  --address=arth-lab-ip --network-tier=STANDARD \
  --tags=http-server,https-server \
  --metadata=enable-oslogin=TRUE \
  --scopes=https://www.googleapis.com/auth/logging.write \
  --maintenance-policy=MIGRATE
```

Variabel yang diterima `provision.sh`, untuk menyimpang dari bawaan tanpa
menyunting skripnya:

| variabel         | bawaan                     | untuk                                                                                               |
| ---------------- | -------------------------- | --------------------------------------------------------------------------------------------------- |
| `MACHINE`        | `e2-custom-2-6144`         | `e2-medium` kalau custom tidak tersedia (4 GB, cukup dengan swap)                                   |
| `ZONE`           | `asia-southeast1-b`        | zona lain kalau kapasitasnya penuh                                                                  |
| `REGION`         | `asia-southeast1`          | region lain                                                                                         |
| `DISK_GB`        | `30`                       | lebih besar kalau Anda menyimpan banyak checkout. Bisa dibesarkan kapan saja; tidak bisa dikecilkan |
| `VM` · `IP_NAME` | `arth-lab` · `arth-lab-ip` | nama lain                                                                                           |

---

## Ketika ada yang salah

| gejala                       | periksa                                                          |
| ---------------------------- | ---------------------------------------------------------------- |
| `https://...` tidak menjawab | `sudo systemctl status caddy` · `sudo journalctl -u caddy -n 50` |
| Sertifikat tidak terbit      | `dig +short <domain>` cocok dengan IP mesin? Port 80 terbuka?    |
| Situs 502                    | `sudo systemctl status arth` · `sudo journalctl -u arth -n 80`   |
| Build mati tanpa pesan       | `free -h` — swap aktif? `dmesg                                   | grep -i oom` |
| `bun install` sangat lambat  | ukuran boot disk; IOPS naik mengikuti ukuran                     |
