#!/usr/bin/env bash
#
# Provision Box A (arth-lab) on Google Cloud. Run this in **Cloud Shell**,
# not on the VM:
#
#   bash infra/provision.sh lab.example.com
#
# It replaces the twenty-three `gcloud` commands the runbook used to ask you to
# type by hand. That count was the problem: a setup that needs twenty-three
# commands right in a row is not testing your care, it is blaming you for its
# own shape.
#
# ## What it will not do
#
# It never deletes anything. A previous half-finished attempt leaves real
# resources behind, and the safe move is to reuse what is already correct and
# *report* what is not — deleting on your behalf is how someone loses a machine
# they were still using.
#
# It also refuses to print the bootstrap command until DNS actually resolves to
# this machine. Caddy asks Let's Encrypt for a certificate the moment it
# starts, Let's Encrypt rate-limits failures, and a domain locked out for hours
# is a failure that heals by waiting rather than by fixing — the most
# confusing kind there is.

set -euo pipefail

DOMAIN="${1:-}"
if [ -z "$DOMAIN" ]; then
  echo "usage: bash infra/provision.sh <lab-domain>    e.g. lab.example.com" >&2
  exit 64
fi

REGION="${REGION:-asia-southeast1}"
ZONE="${ZONE:-asia-southeast1-b}"
VM="${VM:-arth-lab}"
IP_NAME="${IP_NAME:-arth-lab-ip}"
MACHINE="${MACHINE:-e2-custom-4-16384}"
DISK_GB="${DISK_GB:-150}"

bold() { printf '\n\033[1m%s\033[0m\n' "$*"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*"; }
die()  { printf '\n\033[31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

# ---------------------------------------------------------------- preconditions

PROJECT=$(gcloud config get-value project 2>/dev/null || true)
[ -n "$PROJECT" ] && [ "$PROJECT" != "(unset)" ] \
  || die "no project set. Run: gcloud config set project <PROJECT_ID>"

bold "Project"
ok "$PROJECT · ${REGION} / ${ZONE}"

# ---------------------------------------------------------------------- survey

bold "What already exists"
# Printed before anything is created, because you have run this before and the
# first thing worth knowing is what survived.
gcloud compute instances list --format="table(name,zone.basename(),machineType.basename(),status)" 2>/dev/null || true
gcloud compute addresses list --format="table(name,address,region.basename(),status)" 2>/dev/null || true

idle=$(gcloud compute addresses list --filter="status!=IN_USE" --format="value(name)" 2>/dev/null || true)
if [ -n "$idle" ]; then
  warn "reserved but unused static IPs — these are billed while idle:"
  echo "$idle" | sed 's/^/      /'
  warn "release one with: gcloud compute addresses delete <name> --region=${REGION}"
fi

# ------------------------------------------------------------------------- API

bold "Compute Engine API"
if gcloud services list --enabled --filter="config.name=compute.googleapis.com" --format="value(config.name)" 2>/dev/null | grep -q compute; then
  ok "already enabled"
else
  gcloud services enable compute.googleapis.com
  ok "enabled"
fi

# ------------------------------------------------------------------- static IP

bold "Static IP: ${IP_NAME}"
if gcloud compute addresses describe "$IP_NAME" --region="$REGION" >/dev/null 2>&1; then
  ok "already reserved"
else
  gcloud compute addresses create "$IP_NAME" --region="$REGION" --network-tier=STANDARD
  ok "reserved"
fi
IP=$(gcloud compute addresses describe "$IP_NAME" --region="$REGION" --format="value(address)")
ok "address: ${IP}"

# -------------------------------------------------------------------- firewall

bold "Firewall"
ensure_rule() {
  local name="$1"; shift
  if gcloud compute firewall-rules describe "$name" >/dev/null 2>&1; then
    ok "${name} already present"
  else
    gcloud compute firewall-rules create "$name" "$@" >/dev/null
    ok "${name} created"
  fi
}
ensure_rule allow-http  --allow=tcp:80  --target-tags=http-server  --source-ranges=0.0.0.0/0
ensure_rule allow-https --allow=tcp:443 --target-tags=https-server --source-ranges=0.0.0.0/0
# 35.235.240.0/20 is Google's IAP range. SSH is reachable only through an
# authenticated Google session — never from the open internet.
ensure_rule allow-ssh-iap --allow=tcp:22 --source-ranges=35.235.240.0/20

# -------------------------------------------------------------------------- VM

bold "Instance: ${VM}"
if gcloud compute instances describe "$VM" --zone="$ZONE" >/dev/null 2>&1; then
  have=$(gcloud compute instances describe "$VM" --zone="$ZONE" --format="value(machineType.basename())")
  if [ "$have" = "$MACHINE" ]; then
    ok "already exists with the expected machine type (${have})"
  else
    # Stopping here rather than carrying on: silently bootstrapping a machine
    # with the wrong shape produces a site that is slow or that fails to build,
    # and the cause is three steps behind by the time anyone notices.
    die "instance ${VM} exists but is ${have}, expected ${MACHINE}.
   Either keep it and re-run with  MACHINE=${have} bash infra/provision.sh ${DOMAIN}
   or delete it:  gcloud compute instances delete ${VM} --zone=${ZONE}"
  fi
else
  echo "  creating (this takes about a minute)…"
  if ! gcloud compute instances create "$VM" \
      --zone="$ZONE" \
      --machine-type="$MACHINE" \
      --image-family=ubuntu-2404-lts-amd64 --image-project=ubuntu-os-cloud \
      --boot-disk-size="${DISK_GB}GB" --boot-disk-type=pd-balanced \
      --address="$IP_NAME" --network-tier=STANDARD \
      --tags=http-server,https-server \
      --metadata=enable-oslogin=TRUE \
      --scopes=https://www.googleapis.com/auth/logging.write \
      --maintenance-policy=MIGRATE 2>/tmp/provision-err; then
    cat /tmp/provision-err >&2
    # The two failures worth translating, because GCP's wording does not say
    # what to do about them.
    if grep -qi "quota" /tmp/provision-err; then
      die "quota. Ask for more CPU in ${REGION} at
   IAM & Admin → Quotas, or retry with a smaller machine:
   MACHINE=e2-standard-2 bash infra/provision.sh ${DOMAIN}"
    fi
    if grep -qiE "does not exist|not available|ZONE_RESOURCE_POOL" /tmp/provision-err; then
      die "${MACHINE} is not available in ${ZONE}. Two ways out:
   another zone:  ZONE=${REGION}-a bash infra/provision.sh ${DOMAIN}
   a stock type:  MACHINE=e2-standard-4 bash infra/provision.sh ${DOMAIN}
                  (4 vCPU / 16 GB — identical shape, wider availability)"
    fi
    die "instance creation failed; the error is above"
  fi
  ok "created"
fi

# ------------------------------------------------------------------------- DNS

bold "DNS — this part is yours"
cat <<DNS

  Porkbun → Account → Domain Management → your domain → DNS → Add record:

      Type    A
      Host    ${DOMAIN%%.*}
      Answer  ${IP}
      TTL     600

  Check there is no other record on the same host — Porkbun adds a parking
  record by default, and two records on one host resolve unpredictably.

DNS

resolve() {
  # dig where available, getent otherwise. Cloud Shell has dig; a stripped
  # container might not, and failing on a missing tool here would be absurd.
  if command -v dig >/dev/null; then
    dig +short "$1" A | grep -E '^[0-9]+\.' | tail -1
  else
    getent ahostsv4 "$1" 2>/dev/null | awk '{print $1; exit}'
  fi
}

echo "  Waiting for ${DOMAIN} to resolve to ${IP}. Ctrl-C is safe — nothing is"
echo "  half-done, and re-running this script picks up exactly here."
echo

for attempt in $(seq 1 120); do
  got=$(resolve "$DOMAIN" || true)
  if [ "$got" = "$IP" ]; then
    echo
    ok "${DOMAIN} → ${IP}"
    break
  fi
  printf '\r  attempt %3d/120 — resolves to: %-18s' "$attempt" "${got:-nothing yet}"
  sleep 10
done

got=$(resolve "$DOMAIN" || true)
if [ "$got" != "$IP" ]; then
  echo
  die "${DOMAIN} still resolves to '${got:-nothing}', expected ${IP}.
   Fix the record, then run this script again — it will skip everything
   already done and come straight back to this check."
fi

# ------------------------------------------------------------------------ next

bold "Next"
cat <<NEXT

  DNS is correct, so bootstrap is safe to run. Connect:

      gcloud compute ssh ${VM} --zone=${ZONE} --tunnel-through-iap

  then, inside the VM:

      sudo rm -rf /tmp/arth-infra
      sudo apt-get update -qq && sudo apt-get install -y -qq git
      git clone --branch claude/satus-award-website-foundation-r6o5cf \\
        https://github.com/ashaamoon-lang/-1.git /tmp/arth-infra
      sudo bash /tmp/arth-infra/infra/bootstrap-lab.sh ${DOMAIN}

  That takes 12–18 minutes. When it finishes:

      bash /tmp/arth-infra/infra/doctor.sh

NEXT
