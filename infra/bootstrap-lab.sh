#!/usr/bin/env bash
#
# Box A — `arth-lab`. Build, CI runner, Playwright, and lab.<domain>.
#
# Run ONCE on a fresh Ubuntu 24.04 LTS instance, as a sudo-capable user:
#
#   sudo bash infra/bootstrap-lab.sh lab.example.com
#
# Idempotent: safe to re-run. Every step checks before it acts, because the
# most likely reason to run this a second time is that the first run failed
# halfway and re-running must not double a swapfile or a repo entry.
#
# What it deliberately does NOT do:
#   - install `ufw`. The GCP VPC firewall already governs ingress, and two
#     places to get a firewall wrong is one too many.
#   - hold any secret. Sanity's write token never reaches this machine.
#   - register the GitHub Actions runner. That needs a short-lived token only
#     you can mint — see infra/README.md step 6.

set -euo pipefail

DOMAIN="${1:?usage: bootstrap-lab.sh <lab-domain>   e.g. lab.example.com}"
APP_USER="deploy"
APP_DIR="/srv/arth"
REPO="https://github.com/ashaamoon-lang/-1.git"
BRANCH="claude/satus-award-website-foundation-r6o5cf"

say() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }

say "System packages"
# `unzip` and `rsync` are not incidental:
#   unzip — Bun's installer requires it and Ubuntu 24.04 minimal does not ship
#           it. Its absence is what stopped this script on its first real run.
#   rsync — how `deploy.sh` ships a build to Box B.
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq \
  git curl ca-certificates build-essential \
  debian-keyring debian-archive-keyring apt-transport-https \
  unattended-upgrades \
  unzip rsync
# Security patches without a human in the loop. A build box that drifts is a
# build box nobody trusts.
dpkg-reconfigure -f noninteractive unattended-upgrades

say "Swap — 4 GB"
# `next build` spikes. 16 GB without swap risks an OOM kill mid-build, which
# reads as a mysterious CI failure rather than as memory pressure.
if ! swapon --show | grep -q '/swapfile'; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
else
  echo "swapfile already active, skipping"
fi

say "Node 24.x"
# Not optional and not interchangeable with Bun: `bun run check` shells out to
# `node` directly on .ts ruletest files and relies on native type stripping,
# which is unflagged from 24. package.json pins engines >= 24.20.0.
if ! command -v node >/dev/null || [ "$(node -v | cut -c2-3)" -lt 24 ]; then
  curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
  apt-get install -y -qq nodejs
fi
node -v

say "Application user: ${APP_USER}"
id -u "$APP_USER" >/dev/null 2>&1 || useradd -m -s /bin/bash "$APP_USER"
install -d -o "$APP_USER" -g "$APP_USER" "$APP_DIR"

say "Bun (as ${APP_USER})"
sudo -u "$APP_USER" -H bash -lc '
  set -e
  if ! command -v ~/.bun/bin/bun >/dev/null; then
    curl -fsSL https://bun.sh/install | bash
  fi
  grep -q "BUN_INSTALL" ~/.bashrc || {
    echo "export BUN_INSTALL=\"\$HOME/.bun\"" >> ~/.bashrc
    echo "export PATH=\"\$BUN_INSTALL/bin:\$PATH\"" >> ~/.bashrc
  }
  ~/.bun/bin/bun --version
'

say "Caddy"
# Verbatim from caddyserver.com/docs/install, stable channel.
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
caddy version

say "Clone ${BRANCH}"
if [ ! -d "${APP_DIR}/.git" ]; then
  sudo -u "$APP_USER" git clone --branch "$BRANCH" "$REPO" "$APP_DIR"
else
  echo "repo already present, leaving it alone"
fi

say "Dependencies and Playwright browsers"
sudo -u "$APP_USER" -H bash -lc "
  set -e
  cd '$APP_DIR'
  export PATH=\"\$HOME/.bun/bin:\$PATH\"
  bun install --frozen-lockfile
"
# --with-deps pulls the system libraries Chromium needs. It must run as root,
# which is why it is not inside the sudo -u block above.
sudo -u "$APP_USER" -H bash -lc "cd '$APP_DIR' && export PATH=\"\$HOME/.bun/bin:\$PATH\" && bunx playwright install chromium"
(cd "$APP_DIR" && npx --yes playwright install-deps chromium)

say "Build, so the lab has something to serve"
sudo -u "$APP_USER" -H bash -lc "
  set -e
  cd '$APP_DIR'
  export PATH=\"\$HOME/.bun/bin:\$PATH\"
  export NEXT_PUBLIC_SANITY_PROJECT_ID=az53j4l1
  export NEXT_PUBLIC_SANITY_DATASET=production
  export NEXT_PUBLIC_SANITY_API_VERSION=2025-03-01
  bun run build
"

say "systemd unit"
# Box A serves too — Caddy below proxies to :3000, and without this unit there
# is nothing listening there and `lab.<domain>` answers 502. The first draft of
# this script wrote a unit for Box B and forgot that Box A is also a host.
#
# Environment lives HERE, in a root-owned unit, never in a dotfile inside the
# web root. These three are public by construction: the NEXT_PUBLIC_ prefix
# means Next inlines them into the client bundle already.
cat > /etc/systemd/system/arth.service <<UNIT
[Unit]
Description=Arth — Next.js server (lab)
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
StartLimitBurst=5
StartLimitIntervalSec=60

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now arth

say "Deploy permissions"
# BEFORE the timer is enabled, not after: `OnBootSec=2min` may already have
# elapsed on a machine that has been up a while, so the first run can fire the
# moment the timer is enabled. Without this file that run fails on its very
# first `sudo systemctl restart arth`.
#
# `deploy` restarts its own unit and nothing else. A blanket NOPASSWD would
# hand the whole box to anything that can write to the repository.
cat > /etc/sudoers.d/arth-deploy <<SUDO
${APP_USER} ALL=(root) NOPASSWD: /usr/bin/systemctl restart arth, /usr/bin/systemctl status arth, /usr/bin/systemctl is-active arth
SUDO
chmod 0440 /etc/sudoers.d/arth-deploy
visudo -cf /etc/sudoers.d/arth-deploy

say "Deploy timer"
# Pull, never push. See infra/README.md section 8.1 for why a self-hosted
# GitHub Actions runner was rejected outright on a public repository.
#
# The units are copied; `deploy.sh` is NOT — the service runs it straight out
# of the checkout so that editing it in a commit takes effect on the next run.
# A unit file changing is rare enough that re-running this script (idempotent)
# is the right way to pick it up.
install -m 644 "${APP_DIR}/infra/arth-deploy.service" /etc/systemd/system/
install -m 644 "${APP_DIR}/infra/arth-deploy.timer"   /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now arth-deploy.timer

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
# The lab is one path prefix inside the same Next app, so the subdomain is a
# rewrite rather than a second deployment. See the plan, Bagian VIII.
cat > /etc/caddy/Caddyfile <<CADDY
${DOMAIN} {
	encode zstd gzip
	rewrite * /lab{uri}
	reverse_proxy 127.0.0.1:3000
}
CADDY
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy || systemctl restart caddy

say "Done"
cat <<NEXT

Box A is provisioned and serving. One thing remains, and it needs you:

  Install Claude Code and log in:
      sudo -u ${APP_USER} -H bash -lc 'curl -fsSL https://claude.ai/install.sh | bash'
      sudo -iu ${APP_USER}
      claude

Deploys are already running on a timer — nothing to register, no token, no
inbound port. Check it with:

    systemctl list-timers arth-deploy
    journalctl -u arth-deploy -n 40

Caddy will not obtain a certificate until ${DOMAIN} resolves to this machine's
external IP. Check first:

    dig +short ${DOMAIN}

NEXT
