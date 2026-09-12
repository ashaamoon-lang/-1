# Menyalakan infrastruktur ARTH

Runbook. Ikuti berurutan — urutannya bukan gaya, ia mencegah dua kegagalan
nyata yang mahal (§0.2).

Semua perintah `gcloud` di sini dirancang untuk dijalankan di **Cloud Shell**
(ikon `>_` di kanan atas console GCP). Cloud Shell gratis, sudah
terautentikasi, dan tidak perlu memasang apa pun di laptop Anda.

---

## 0. Sebelum apa pun

### 0.1 Pasang Budget Alert — lakukan ini pertama

Billing → **Budgets & alerts** → Create budget. Ambang 50% dan 90% dari kredit
Anda.

Alasannya bukan formalitas: instance yang lupa dimatikan adalah cara paling
umum kredit habis tanpa ada yang menyadarinya, dan alert-nya baru berguna
kalau dipasang **sebelum** mesinnya menyala.

### 0.2 Dua urutan yang tidak boleh dibalik

1. **IP statis dicadangkan sebelum VM dibuat.** IP ephemeral berubah setiap
   kali VM di-restart, dan saat itu terjadi DNS Anda menunjuk ke mesin orang
   lain.
2. **DNS diarahkan sebelum bootstrap dijalankan.** Caddy meminta sertifikat ke
   Let's Encrypt begitu ia menyala. Let's Encrypt punya **rate limit**, dan
   percobaan gagal berulang karena DNS belum siap bisa mengunci Anda beberapa
   jam.

---

## 1. Siapkan project

```bash
gcloud config set project <PROJECT_ID>
gcloud services enable compute.googleapis.com
gcloud config set compute/region asia-southeast1
gcloud config set compute/zone   asia-southeast1-b
```

---

## 2. Cadangkan dua IP statis

```bash
gcloud compute addresses create arth-lab-ip  --region=asia-southeast1 --network-tier=STANDARD
gcloud compute addresses create arth-prod-ip --region=asia-southeast1 --network-tier=STANDARD

# Catat keduanya — ini yang masuk ke Porkbun.
gcloud compute addresses list --filter="region:asia-southeast1" \
  --format="table(name, address, status)"
```

---

## 3. Firewall

```bash
# Web, terbuka.
gcloud compute firewall-rules create allow-http \
  --allow=tcp:80  --target-tags=http-server  --source-ranges=0.0.0.0/0
gcloud compute firewall-rules create allow-https \
  --allow=tcp:443 --target-tags=https-server --source-ranges=0.0.0.0/0

# SSH, TIDAK terbuka. 35.235.240.0/20 adalah rentang IAP milik Google —
# artinya hanya sesi yang sudah lolos autentikasi Google yang bisa mencapai
# port 22, dan tidak ada satu pun pemindai internet yang bisa.
gcloud compute firewall-rules create allow-ssh-iap \
  --allow=tcp:22 --source-ranges=35.235.240.0/20
```

---

## 4. Buat Box A — `arth-lab`

```bash
gcloud compute instances create arth-lab \
  --machine-type=e2-custom-4-16384 \
  --image-family=ubuntu-2404-lts-amd64 --image-project=ubuntu-os-cloud \
  --boot-disk-size=150GB --boot-disk-type=pd-balanced \
  --address=arth-lab-ip --network-tier=STANDARD \
  --tags=http-server,https-server \
  --metadata=enable-oslogin=TRUE \
  --scopes=https://www.googleapis.com/auth/logging.write \
  --maintenance-policy=MIGRATE
```

`--scopes` sengaja minimal: mesin ini tidak memanggil API GCP mana pun, jadi
service account-nya tidak diberi kemampuan untuk itu.

---

## 5. DNS di Porkbun — **sebelum** bootstrap

Porkbun → Account → **Domain Management** → domain Anda → **DNS**.

| Type | Host   | Answer                 | TTL   |
| ---- | ------ | ---------------------- | ----- |
| `A`  | `lab`  | IP dari `arth-lab-ip`  | `600` |
| `A`  | `arth` | IP dari `arth-prod-ip` | `600` |

Dua hal yang sering menggigit:

- **Periksa tidak ada record lain di host yang sama.** Porkbun memasang
  record parkir bawaan; dua record di host yang sama membuat resolusi tak
  terduga.
- Anda boleh memakai subdomain lain. Kalau ya, sesuaikan argumen di §6 dan
  §9 — skripnya menerima domain sebagai argumen, tidak ada yang di-hardcode.

Verifikasi sebelum lanjut. **Jangan lewati langkah ini:**

```bash
dig +short lab.<domain>     # harus persis IP arth-lab-ip
dig +short arth.<domain>    # harus persis IP arth-prod-ip
```

Kalau masih kosong, tunggu. TTL 600 berarti biasanya di bawah sepuluh menit.

---

## 6. Bootstrap Box A

```bash
gcloud compute ssh arth-lab --tunnel-through-iap
```

Lalu di dalam VM:

```bash
sudo apt-get update -qq && sudo apt-get install -y -qq git
git clone --branch claude/satus-award-website-foundation-r6o5cf \
  https://github.com/ashaamoon-lang/-1.git /tmp/arth-infra
sudo bash /tmp/arth-infra/infra/bootstrap-lab.sh lab.<domain>
```

Perlu ~10–15 menit — sebagian besar `bun install` dan mengunduh Chromium.

Setelah selesai:

```bash
curl -sSI https://lab.<domain> | head -1     # sertifikat sudah terbit
sudo systemctl status caddy
```

---

## 7. Beri Claude akses — ini tujuan Anda

```bash
sudo -iu deploy
curl -fsSL https://claude.ai/install.sh | bash
claude
```

Masuk dengan akun Anda. Mulai saat itu, sesi yang berjalan **di mesin itu**
punya shell asli: konfigurasi Caddy, jurnal systemd, build, Playwright pada
situs hidup.

> **Kenapa ini perlu:** sesi saya yang sekarang hanya punya egress HTTPS lewat
> policy proxy, dan git SSH pun di-rewrite. Saya **tidak bisa** SSH ke mesin
> Anda dari sini. Claude Code di VM adalah jalur langsungnya.

---

## 8. Runner GitHub Actions — jalur kedua

Ini yang membuat sesi saya **yang sekarang** bisa menjangkau VM Anda: saya
commit workflow dari sini, runner di mesin Anda yang mengeksekusi.

GitHub → repo → **Settings → Actions → Runners → New self-hosted runner →
Linux**. Ikuti perintah yang **ditampilkan halaman itu** — jangan pakai versi
yang saya tulis, karena nomor versinya berubah dan token registrasinya
berumur pendek.

Jalankan sebagai user `deploy`, lalu pasang sebagai service supaya hidup lagi
setelah reboot:

```bash
sudo ./svc.sh install deploy
sudo ./svc.sh start
```

Beri label `arth-lab` saat ditanya. Workflow deploy mencarinya lewat label
itu.

> **Keamanan, eksplisit:** self-hosted runner menjalankan kode dari repo di
> mesin Anda. Untuk repo privat milik Anda sendiri ini wajar. Kalau repo
> dipublikkan nanti, **matikan runner untuk PR dari fork** — itu jalur
> eksekusi kode arbitrer di mesin Anda.

---

## 9. Box B — produksi

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

### 9.1 Snapshot harian untuk produksi

```bash
gcloud compute resource-policies create snapshot-schedule arth-prod-daily \
  --region=asia-southeast1 --max-retention-days=7 \
  --daily-schedule --start-time=18:00

gcloud compute disks add-resource-policies arth-prod \
  --resource-policies=arth-prod-daily --zone=asia-southeast1-b
```

Box A tidak perlu snapshot — isinya bisa dibangun ulang dari repo.

---

## 10. Sambungkan Box A → Box B

Deploy job di Box A mengirim hasil build ke Box B lewat **jaringan internal
VPC** — bukan lewat IAP, dan bukan lewat `gcloud`. Alasannya konkret: kedua
instance dibuat dengan access scope minimal dengan sengaja, jadi
`gcloud compute ssh` dari dalam Box A memang akan ditolak. VM-ke-VM di satu
VPC tidak butuh keduanya.

**10.1 Izinkan SSH internal**

```bash
# Rentang subnet default asia-southeast1. Periksa punya Anda:
gcloud compute networks subnets describe default \
  --region=asia-southeast1 --format="value(ipCidrRange)"

gcloud compute firewall-rules create allow-ssh-internal \
  --allow=tcp:22 --source-ranges=<CIDR_DARI_PERINTAH_DI_ATAS>
```

**10.2 Buat kunci di Box A**

```bash
gcloud compute ssh arth-lab --tunnel-through-iap
sudo -u deploy ssh-keygen -t ed25519 -N "" -f /home/deploy/.ssh/id_ed25519
sudo cat /home/deploy/.ssh/id_ed25519.pub      # salin barisnya
```

**10.3 Pasang kunci itu di Box B**

```bash
gcloud compute ssh arth-prod --tunnel-through-iap
sudo bash /tmp/arth-infra/infra/bootstrap-prod.sh arth.<domain> "ssh-ed25519 AAAA... deploy@arth-lab"
```

Skripnya idempoten — menjalankan ulang dengan kunci hanya menambahkan kunci.

**10.4 Beri tahu workflow alamat Box B**

GitHub → repo → Settings → **Secrets and variables → Actions → Variables**:

| Variable           | Isi                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `PROD_INTERNAL_IP` | IP **internal** Box B — `gcloud compute instances describe arth-prod --format="value(networkInterfaces[0].networkIP)"` |
| `PROD_DOMAIN`      | `arth.<domain>`                                                                                                        |

**10.5 Coba**

Actions → **Deploy** → Run workflow. Job-nya membangun di Box A, mengirim ke
Box B, me-restart, lalu **membuktikan situsnya menjawab 200** sebelum
melaporkan sukses — deploy yang melapor hijau sementara situsnya mati lebih
buruk daripada deploy yang gagal.

Setelah deploy pertama berhasil, tambahkan trigger `push:` ke
`.github/workflows/deploy.yml` supaya tiap push ikut terkirim. Sengaja belum
ada sekarang: workflow yang merah di tiap push karena targetnya belum ada
mengajarkan semua orang mengabaikan tanda merah.

---

## 11. Menghemat kredit

Box A tidak harus hidup 24 jam. Instance yang di-stop hanya menagih disk-nya.

```bash
gcloud compute instances stop  arth-lab
gcloud compute instances start arth-lab
```

Konsekuensinya jujur: selama mati, runner CI tidak menerima job dan
`lab.<domain>` tidak bisa diakses. Produksi tidak terpengaruh sama sekali —
itu justru gunanya dipisah.

---

## Ketika ada yang salah

| gejala                       | periksa                                                          |
| ---------------------------- | ---------------------------------------------------------------- |
| `https://...` tidak menjawab | `sudo systemctl status caddy` · `sudo journalctl -u caddy -n 50` |
| Sertifikat tidak terbit      | `dig +short <domain>` cocok dengan IP mesin? Port 80 terbuka?    |
| Situs 502                    | `sudo systemctl status arth` · `sudo journalctl -u arth -n 80`   |
| Build mati tanpa pesan       | `free -h` — swap aktif? `dmesg                                   | grep -i oom` |
| `bun install` sangat lambat  | ukuran boot disk; IOPS naik mengikuti ukuran                     |
