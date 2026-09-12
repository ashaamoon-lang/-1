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

## 2. Provision — di Cloud Shell

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
  sebelum menyentuh apa pun. Anda sudah pernah mencoba; yang selamat dipakai
  ulang, bukan dibuat ganda.
- **Tidak pernah menghapus apa pun.** Kalau ada VM dengan spek berbeda, ia
  berhenti dan menyebutkan bedanya — bukan diam-diam memakai mesin yang salah.
- **Memperingatkan IP statis menganggur**, yang tetap ditagih.
- **Menerjemahkan dua galat GCP** yang kata-katanya tidak memberi tahu apa yang
  harus dilakukan: kuota, dan tipe mesin yang tidak tersedia di zona itu.

Aman di-Ctrl-C kapan saja dan dijalankan ulang — ia melewati yang sudah selesai.

---

## 3. DNS di Porkbun

`provision.sh` mencetak barisnya persis. Bentuknya:

| Type | Host  | Answer          | TTL   |
| ---- | ----- | --------------- | ----- |
| `A`  | `lab` | IP yang dicetak | `600` |

Porkbun memasang record parkir bawaan — **periksa tidak ada record lain di host
yang sama**, karena dua record di satu host resolve tak terduga.

Setelah Anda menyimpannya, `provision.sh` **menunggu sampai DNS itu benar**
sebelum mencetak perintah berikutnya. Anda tidak bisa maju ke bootstrap dengan
DNS yang salah, dan itu disengaja: Caddy meminta sertifikat begitu menyala,
Let's Encrypt membatasi kegagalan, dan domain yang terkunci berjam-jam adalah
kegagalan yang sembuhnya dengan menunggu — bukan dengan memperbaiki sesuatu.

---

## 4. Bootstrap — di VM

`provision.sh` mencetak perintah lengkapnya. Bentuknya:

```bash
gcloud compute ssh arth-lab --zone=asia-southeast1-b --tunnel-through-iap
```

lalu di dalam VM:

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

## 6. Deploy otomatis — sudah terpasang

Bootstrap sudah memasang timer-nya. Tidak ada yang perlu didaftarkan, tidak ada
token, tidak ada port masuk.

```bash
systemctl list-timers arth-deploy       # kapan cek berikutnya
journalctl -u arth-deploy -n 40         # apa yang terjadi terakhir kali
sudo systemctl start arth-deploy        # paksa satu kali sekarang
```

Tiap lima menit Box A mengambil branch. **Tidak ada commit baru → keluar tanpa
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

## 7. Box B — produksi

Kerjakan setelah §7 berhasil. Tidak ada gunanya menyalakan produksi sebelum
ada yang mengirim aplikasi ke sana.

```bash
gcloud compute instances create arth-prod \
  --machine-type=e2-custom-2-4096 \
  --image-family=ubuntu-2404-lts-amd64 --image-project=ubuntu-os-cloud \
  --boot-disk-size=50GB --boot-disk-type=pd-balanced \
  --address=arth-prod-ip --network-tier=STANDARD \
  --tags=http-server,https-server \
  --metadata=enable-oslogin=TRUE \
  --scopes=https://www.googleapis.com/auth/logging.write \
  --maintenance-policy=MIGRATE

gcloud compute ssh arth-prod --tunnel-through-iap
```

Di dalam VM:

```bash
sudo apt-get update -qq && sudo apt-get install -y -qq git
git clone --branch claude/satus-award-website-foundation-r6o5cf \
  https://github.com/ashaamoon-lang/-1.git /tmp/arth-infra
sudo bash /tmp/arth-infra/infra/bootstrap-prod.sh arth.<domain>
```

`systemctl status arth` akan **gagal** sampai deploy pertama. Itu yang
diharapkan, bukan kerusakan: mesin ini tidak membangun apa pun sendiri.

### 7.1 Snapshot harian untuk produksi

```bash
gcloud compute resource-policies create snapshot-schedule arth-prod-daily \
  --region=asia-southeast1 --max-retention-days=7 \
  --daily-schedule --start-time=18:00

gcloud compute disks add-resource-policies arth-prod \
  --resource-policies=arth-prod-daily --zone=asia-southeast1-b
```

Box A tidak perlu snapshot — isinya bisa dibangun ulang dari repo.

---

## 8. Sambungkan Box A → Box B

Deploy job di Box A mengirim hasil build ke Box B lewat **jaringan internal
VPC** — bukan lewat IAP, dan bukan lewat `gcloud`. Alasannya konkret: kedua
instance dibuat dengan access scope minimal dengan sengaja, jadi
`gcloud compute ssh` dari dalam Box A memang akan ditolak. VM-ke-VM di satu
VPC tidak butuh keduanya.

**8.1 Izinkan SSH internal**

```bash
# Rentang subnet default asia-southeast1. Periksa punya Anda:
gcloud compute networks subnets describe default \
  --region=asia-southeast1 --format="value(ipCidrRange)"

gcloud compute firewall-rules create allow-ssh-internal \
  --allow=tcp:22 --source-ranges=<CIDR_DARI_PERINTAH_DI_ATAS>
```

**8.2 Buat kunci di Box A**

```bash
gcloud compute ssh arth-lab --tunnel-through-iap
sudo -u deploy ssh-keygen -t ed25519 -N "" -f /home/deploy/.ssh/id_ed25519
sudo cat /home/deploy/.ssh/id_ed25519.pub      # salin barisnya
```

**8.3 Pasang kunci itu di Box B**

```bash
gcloud compute ssh arth-prod --tunnel-through-iap
sudo bash /tmp/arth-infra/infra/bootstrap-prod.sh arth.<domain> "ssh-ed25519 AAAA... deploy@arth-lab"
```

Skripnya idempoten — menjalankan ulang dengan kunci hanya menambahkan kunci.

**8.4 Beri tahu deploy alamat Box B**

Di **Box A**:

```bash
# IP internal Box B — bukan yang eksternal.
gcloud compute instances describe arth-prod \
  --format="value(networkInterfaces[0].networkIP)"

sudo systemctl edit arth-deploy.service
```

Isi override-nya:

```ini
[Service]
Environment=PROD_HOST=<IP_INTERNAL_BOX_B>
Environment=PROD_DOMAIN=arth.<domain>
```

`systemctl edit` dipakai alih-alih menyunting unit aslinya, supaya nilai ini
tidak hilang saat bootstrap dijalankan ulang.

**8.5 Coba**

```bash
sudo systemctl restart arth-deploy.timer
sudo systemctl start arth-deploy
journalctl -u arth-deploy -n 60 -f
```

Sebelum langkah 8.4, deploy melaporkan **"PROD_HOST is empty — Box B does not
exist yet, skipping the ship step"**. Itu benar, bukan rusak: lab berguna
sendirian.

---

## 9. Menghemat kredit

Box A tidak harus hidup 24 jam. Instance yang di-stop hanya menagih disk-nya.

```bash
gcloud compute instances stop  arth-lab
gcloud compute instances start arth-lab
```

Konsekuensinya jujur: selama mati, `lab.<domain>` tidak bisa diakses dan
**tidak ada deploy yang berjalan** — commit yang Anda dorong menunggu sampai
Box A menyala lagi. `Persistent=true` di timer-nya membuat jadwal yang
terlewat dijalankan saat start berikutnya, jadi tidak ada yang hilang, hanya
tertunda. Produksi tidak terpengaruh sama sekali — itu justru gunanya
dipisah.

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
# 35.235.240.0/20 adalah rentang IAP milik Google. SSH tidak pernah terbuka
# ke internet; hanya sesi yang lolos autentikasi Google yang mencapainya.
gcloud compute firewall-rules create allow-ssh-iap \
  --allow=tcp:22 --source-ranges=35.235.240.0/20

gcloud compute instances create arth-lab \
  --zone=asia-southeast1-b \
  --machine-type=e2-custom-4-16384 \
  --image-family=ubuntu-2404-lts-amd64 --image-project=ubuntu-os-cloud \
  --boot-disk-size=150GB --boot-disk-type=pd-balanced \
  --address=arth-lab-ip --network-tier=STANDARD \
  --tags=http-server,https-server \
  --metadata=enable-oslogin=TRUE \
  --scopes=https://www.googleapis.com/auth/logging.write \
  --maintenance-policy=MIGRATE
```

Variabel yang diterima `provision.sh`, untuk menyimpang dari bawaan tanpa
menyunting skripnya:

| variabel         | bawaan                     | untuk                                       |
| ---------------- | -------------------------- | ------------------------------------------- |
| `MACHINE`        | `e2-custom-4-16384`        | `e2-standard-4` kalau custom tidak tersedia |
| `ZONE`           | `asia-southeast1-b`        | zona lain kalau kapasitasnya penuh          |
| `REGION`         | `asia-southeast1`          | region lain                                 |
| `DISK_GB`        | `150`                      | disk lebih kecil kalau kredit ketat         |
| `VM` · `IP_NAME` | `arth-lab` · `arth-lab-ip` | nama lain                                   |

---

## Ketika ada yang salah

| gejala                       | periksa                                                          |
| ---------------------------- | ---------------------------------------------------------------- |
| `https://...` tidak menjawab | `sudo systemctl status caddy` · `sudo journalctl -u caddy -n 50` |
| Sertifikat tidak terbit      | `dig +short <domain>` cocok dengan IP mesin? Port 80 terbuka?    |
| Situs 502                    | `sudo systemctl status arth` · `sudo journalctl -u arth -n 80`   |
| Build mati tanpa pesan       | `free -h` — swap aktif? `dmesg                                   | grep -i oom` |
| `bun install` sangat lambat  | ukuran boot disk; IOPS naik mengikuti ukuran                     |
