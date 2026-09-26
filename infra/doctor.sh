#!/usr/bin/env bash
#
# Diagnose a half-built machine.
#
#   bash infra/doctor.sh [domain]
#
# Read-only. Every failing line prints **one command that fixes it**, because
# a red cross that does not say what to do next is just a slower way of being
# stuck.
#
# Exists because a failed bootstrap leaves real, partial state, and "just run
# it again" is only good advice once you know which part broke.

set -uo pipefail   # NOT -e: a failing check is the point, not a crash.

DOMAIN="${1:-}"
APP_DIR="${APP_DIR:-/srv/arth}"
APP_USER="${APP_USER:-deploy}"
BRANCH="claude/satus-award-website-foundation-r6o5cf"

pass=0; fail=0
ok()   { printf '  \033[32m✓\033[0m %-34s %s\n' "$1" "${2:-}"; pass=$((pass+1)); }
bad()  { printf '  \033[31m✗\033[0m %-34s %s\n' "$1" "${2:-}"; fail=$((fail+1)); }
fix()  { printf '      \033[2m→ %s\033[0m\n' "$*"; }
head_() { printf '\n\033[1m%s\033[0m\n' "$*"; }

head_ "Packages"
for pkg in git curl unzip rsync; do
  if command -v "$pkg" >/dev/null; then ok "$pkg"
  else bad "$pkg" "missing"; fix "sudo apt-get install -y $pkg"; fi
done

head_ "Toolchain"
if command -v node >/dev/null; then
  major=$(node -v | sed 's/^v//' | cut -d. -f1)
  if [ "$major" -ge 24 ] 2>/dev/null; then ok "node" "$(node -v)"
  else
    bad "node" "$(node -v), need >= 24"
    # `bun run check` shells out to `node` directly on .ts ruletest files and
    # relies on native type stripping, unflagged from 24.
    fix "curl -fsSL https://deb.nodesource.com/setup_24.x | sudo bash - && sudo apt-get install -y nodejs"
  fi
else bad "node" "missing"; fix "curl -fsSL https://deb.nodesource.com/setup_24.x | sudo bash - && sudo apt-get install -y nodejs"; fi

if sudo -u "$APP_USER" -H bash -lc 'command -v bun' >/dev/null 2>&1; then
  ok "bun" "$(sudo -u "$APP_USER" -H bash -lc 'bun --version' 2>/dev/null)"
else
  bad "bun" "missing or not on PATH for ${APP_USER}"
  # Almost always unzip: Bun's installer requires it and Ubuntu minimal images
  # do not ship it. This was the defect that stopped the first real run.
  fix "sudo apt-get install -y unzip && sudo -u ${APP_USER} -H bash -lc 'curl -fsSL https://bun.sh/install | bash'"
fi

head_ "Checkout"
if [ -d "${APP_DIR}/.git" ]; then
  branch=$(git -C "$APP_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null)
  sha=$(git -C "$APP_DIR" rev-parse --short HEAD 2>/dev/null)
  if [ "$branch" = "$BRANCH" ]; then ok "repository" "${branch} @ ${sha}"
  else bad "repository" "on ${branch}, expected ${BRANCH}"; fix "sudo -u ${APP_USER} git -C ${APP_DIR} checkout ${BRANCH}"; fi
else
  bad "repository" "${APP_DIR} is not a git checkout"
  fix "sudo -u ${APP_USER} git clone --branch ${BRANCH} https://github.com/ashaamoon-lang/-1.git ${APP_DIR}"
fi

if [ -d "${APP_DIR}/node_modules" ]; then ok "node_modules"
else bad "node_modules" "absent"; fix "cd ${APP_DIR} && sudo -u ${APP_USER} -H bash -lc 'bun install --frozen-lockfile'"; fi

if [ -f "${APP_DIR}/.next/BUILD_ID" ]; then ok "build" "$(cat "${APP_DIR}/.next/BUILD_ID" 2>/dev/null)"
else bad "build" "never completed"; fix "cd ${APP_DIR} && sudo -u ${APP_USER} -H bash -lc 'bun run build'"; fi

head_ "Memory"
if swapon --show 2>/dev/null | grep -q .; then
  ok "swap" "$(swapon --show=SIZE --noheadings 2>/dev/null | tr -d ' ' | paste -sd, -)"
else
  # A build killed with no message is almost always the OOM killer, and that
  # reads as a mysterious hang rather than as memory pressure.
  bad "swap" "none — a large build can be OOM-killed with no message"
  fix "sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile"
fi

head_ "Services"
for unit in arth caddy; do
  state=$(systemctl is-active "$unit" 2>/dev/null)
  if [ "$state" = "active" ]; then ok "$unit" "active"
  else bad "$unit" "${state:-not installed}"; fix "sudo journalctl -u ${unit} -n 60 --no-pager"; fi
done

if systemctl list-timers arth-deploy --no-pager 2>/dev/null | grep -q arth-deploy; then
  ok "arth-deploy.timer" "$(systemctl show arth-deploy.timer -p NextElapseUSecRealtime --value 2>/dev/null)"
else bad "arth-deploy.timer" "not scheduled"; fix "sudo systemctl enable --now arth-deploy.timer"; fi

head_ "Network"
own_ip=$(curl -H "Metadata-Flavor: Google" -fsS --max-time 5 \
  http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip 2>/dev/null)
[ -n "$own_ip" ] && ok "external IP" "$own_ip" || bad "external IP" "metadata server unreachable"

if [ -n "$DOMAIN" ]; then
  resolved=$(dig +short "$DOMAIN" A 2>/dev/null | grep -E '^[0-9]+\.' | tail -1)
  if [ -n "$resolved" ] && [ "$resolved" = "$own_ip" ]; then
    ok "DNS" "${DOMAIN} -> ${resolved}"
  else
    # The single most common reason Caddy has no certificate.
    bad "DNS" "${DOMAIN} -> ${resolved:-nothing}, expected ${own_ip}"
    fix "fix the A record at Porkbun, then: dig +short ${DOMAIN}"
  fi

  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "https://${DOMAIN}/lab" 2>/dev/null)
  case "$code" in
    200) ok "https://${DOMAIN}/lab" "200" ;;
    502) bad "https://${DOMAIN}/lab" "502 — Caddy is up, the app is not"; fix "sudo systemctl status arth" ;;
    000|"") bad "https://${DOMAIN}/lab" "no answer — TLS or firewall"; fix "sudo journalctl -u caddy -n 40 --no-pager" ;;
    *)   bad "https://${DOMAIN}/lab" "$code" ;;
  esac
else
  printf '  \033[2m·\033[0m pass the domain to check DNS and TLS: bash infra/doctor.sh lab.example.com\n'
fi

printf '\n\033[1m%d passed, %d failed\033[0m\n' "$pass" "$fail"
[ "$fail" -eq 0 ] || printf '\nRe-running the bootstrap is safe — it is idempotent and will not duplicate\nthe swapfile, the units, or the apt entries.\n'
exit 0
