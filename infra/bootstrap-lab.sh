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
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq \
  git curl ca-certificates build-essential \
  debian-keyring debian-archive-keyring apt-transport-https \
  unattended-upgrades
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

Box A is provisioned. Two things remain, and both need you:

  1. Install Claude Code and log in:
       sudo -u ${APP_USER} -H bash -lc 'curl -fsSL https://claude.ai/install.sh | bash'
       sudo -iu ${APP_USER}
       claude

  2. Register the GitHub Actions runner — infra/README.md step 6. The
     registration token is short-lived and only you can mint it.

Caddy will not obtain a certificate until ${DOMAIN} resolves to this machine's
external IP. Check first:

    dig +short ${DOMAIN}

NEXT
