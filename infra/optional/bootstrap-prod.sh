#!/usr/bin/env bash
#
# OPTIONAL — a second, production-only machine. NOT part of the current setup.
#
# This was in the plan and was removed rather than deferred: it existed to keep
# a lab experiment from taking down production, and there is no production yet.
# For someone paying out of pocket it doubled the bill to protect nothing.
#
# Bring it back when either is true:
#   - real clients are looking at the site, so an outage costs something
#   - the lab is busy enough that a failed experiment is felt by someone else
#
# When that happens, `infra/deploy.sh` also needs its shipping half back: build
# here, rsync `.next` and `node_modules` across, restart there, and prove the
# site answers 200 before reporting success.
#
# --- original header ---
#
# `arth-prod`. Serves arth.<domain>, and nothing else.
#
#   sudo bash infra/bootstrap-prod.sh arth.example.com ["ssh-ed25519 AAAA... deploy@arth-lab"]
#
# This machine never builds. Box A builds and ships the result here, so the
# agency site is never slow because a build is running, and a runaway
# experiment in the lab cannot take down the page that finds clients.
#
# Idempotent. Holds no secret: NEXT_PUBLIC_SANITY_* are already inlined into
# the client bundle and public by construction; the write token never arrives.

set -euo pipefail

DOMAIN="${1:?usage: bootstrap-prod.sh <domain>   e.g. arth.example.com}"
APP_USER="deploy"
APP_DIR="/srv/arth"

say() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }

say "System packages"
# `unzip` is required by Bun's installer and absent from Ubuntu 24.04 minimal;
# `rsync` is the receiving end of the deploy from Box A.
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq \
  git curl ca-certificates build-essential \
  debian-keyring debian-archive-keyring apt-transport-https \
  unattended-upgrades \
  unzip rsync
dpkg-reconfigure -f noninteractive unattended-upgrades

say "Swap — 2 GB"
# Smaller than the lab's, and for a different reason: this box does not build,
# but `next start` optimises images on the CPU with sharp and that spikes.
# DEPLOYMENT.md section 5 warns about exactly this on a small instance.
if ! swapon --show | grep -q '/swapfile'; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

say "Node 24.x"
if ! command -v node >/dev/null || [ "$(node -v | cut -c2-3)" -lt 24 ]; then
  curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
  apt-get install -y -qq nodejs
fi
node -v

say "Application user: ${APP_USER}"
id -u "$APP_USER" >/dev/null 2>&1 || useradd -m -s /bin/bash "$APP_USER"
install -d -o "$APP_USER" -g "$APP_USER" "$APP_DIR"

say "Bun"
sudo -u "$APP_USER" -H bash -lc '
  set -e
  command -v ~/.bun/bin/bun >/dev/null || curl -fsSL https://bun.sh/install | bash
  grep -q "BUN_INSTALL" ~/.bashrc || {
    echo "export BUN_INSTALL=\"\$HOME/.bun\"" >> ~/.bashrc
    echo "export PATH=\"\$BUN_INSTALL/bin:\$PATH\"" >> ~/.bashrc
  }
'

say "Caddy"
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    > /etc/apt/sources.list.d/caddy-stable.list
  chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  chmod o+r /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq
  apt-get install -y -qq caddy
fi

say "systemd unit"
# Environment lives HERE, in a root-owned unit file — never in a dotfile
# inside the web root, where a path traversal or a misconfigured static
# handler could serve it.
cat > /etc/systemd/system/arth.service <<UNIT
[Unit]
Description=Arth — Next.js production server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${APP_USER}
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=NEXT_PUBLIC_SANITY_PROJECT_ID=az53j4l1
Environment=NEXT_PUBLIC_SANITY_DATASET=production
Environment=NEXT_PUBLIC_SANITY_API_VERSION=2025-03-01
ExecStart=/home/${APP_USER}/.bun/bin/bun run start
Restart=always
RestartSec=3
# The unit restarts on crash; these keep a crash loop from burning the box.
StartLimitBurst=5
StartLimitIntervalSec=60

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable arth

say "Deploy permissions"
# The deploy job restarts this unit and nothing else. A blanket NOPASSWD for
# `deploy` would hand the whole box to anything that can reach the runner; this
# hands it exactly one verb on exactly one unit.
cat > /etc/sudoers.d/arth-deploy <<SUDO
${APP_USER} ALL=(root) NOPASSWD: /usr/bin/systemctl restart arth, /usr/bin/systemctl status arth, /usr/bin/systemctl is-active arth
SUDO
chmod 0440 /etc/sudoers.d/arth-deploy
visudo -cf /etc/sudoers.d/arth-deploy

# Box A's public key, passed as the optional second argument, so the deploy
# job can rsync in over the VPC's internal network. Left empty on a first run
# and added later by re-running with the key — see infra/README.md step 10.
if [ -n "${2:-}" ]; then
  install -d -m 700 -o "$APP_USER" -g "$APP_USER" "/home/${APP_USER}/.ssh"
  touch "/home/${APP_USER}/.ssh/authorized_keys"
  grep -qF "$2" "/home/${APP_USER}/.ssh/authorized_keys" || echo "$2" >> "/home/${APP_USER}/.ssh/authorized_keys"
  chmod 600 "/home/${APP_USER}/.ssh/authorized_keys"
  chown -R "$APP_USER:$APP_USER" "/home/${APP_USER}/.ssh"
  echo "Box A key installed"
fi

say "DNS check — before Caddy, deliberately"
# Caddy asks Let's Encrypt for a certificate the moment it starts. Let's
# Encrypt rate-limits failures, and a domain locked out for hours is a failure
# that heals by *waiting* rather than by fixing anything — the most confusing
# kind there is. So this refuses to continue rather than letting that happen.
#
# The metadata server, not `curl ifconfig.me`: it is authoritative about this
# machine's own address and needs no outbound network.
own_ip=$(curl -H "Metadata-Flavor: Google" -fsS --max-time 5 \
  http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip 2>/dev/null || true)

if [ -z "$own_ip" ]; then
  echo "  not on a GCP instance (no metadata server) — skipping the DNS check"
else
  command -v dig >/dev/null || apt-get install -y -qq dnsutils
  resolved=$(dig +short "$DOMAIN" A | grep -E '^[0-9]+\.' | tail -1 || true)

  if [ "$resolved" != "$own_ip" ]; then
    cat >&2 <<GUARD

  STOP. DNS does not point here, and continuing would burn Let'\''s Encrypt
  attempts against a domain that cannot be validated.

      ${DOMAIN} resolves to : ${resolved:-nothing}
      this machine is at    : ${own_ip}

  Fix the A record at Porkbun (Host \`${DOMAIN%%.*}\`, Answer \`${own_ip}\`,
  TTL 600), wait for:

      dig +short ${DOMAIN}

  to return ${own_ip}, then run this script again. Everything done so far is
  kept — it is idempotent.

GUARD
    exit 1
  fi
  echo "  ${DOMAIN} -> ${own_ip}"
fi

say "Caddy site: ${DOMAIN}"
cat > /etc/caddy/Caddyfile <<CADDY
${DOMAIN} {
	encode zstd gzip
	reverse_proxy 127.0.0.1:3000
}
CADDY
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy || systemctl restart caddy

say "Done"
cat <<NEXT

Box B is provisioned, but has no application yet — Box A ships it here.
Until the first deploy, \`systemctl status arth\` will show a failing unit,
and that is expected rather than broken.

Check DNS resolves here before expecting a certificate:

    dig +short ${DOMAIN}

NEXT
