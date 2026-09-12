#!/usr/bin/env bash
#
# Pull, never push.
#
# Runs on Box A every five minutes via `arth-deploy.timer`. Fetches the branch,
# and when there is something new: builds, restarts the lab, ships to Box B,
# restarts production, and proves production answers before reporting success.
#
# ## Why this exists instead of a GitHub Actions runner
#
# `ashaamoon-lang/-1` is a **public** repository. A self-hosted runner on a
# public repo is a path for a pull request from a fork to execute code on this
# machine — GitHub says not to do it, and the earlier draft of this
# infrastructure recommended it anyway because nobody had checked the repo's
# visibility. This design has no inbound path at all: no port, no webhook, no
# registration token, no GitHub credential on the box.
#
# The cost is stated plainly: a deploy lands within five minutes rather than
# instantly. That is the price of the attack surface being zero.
#
# Triggering a deploy means pushing a commit. Nothing else can start one.

set -euo pipefail

# ## Why the whole script is one function
#
# This file lives in the repository it deploys, and step one is
# `git reset --hard`. Bash reads a script incrementally as it runs, so a script
# that rewrites itself mid-execution can jump into the middle of the *new*
# bytes — a failure that looks like nonsense and only happens on the runs where
# the file actually changed.
#
# Wrapping everything in a function and invoking it on the last line forces
# bash to parse the entire body before any of it executes. After that the file
# on disk can change freely.
#
# This is also why `ExecStart` points straight at this file in the checkout
# rather than a copy under /usr/local/bin: the copy would go stale the moment
# this script was edited, and nobody would notice until they read a deploy log
# that did not match the code.
main() {

APP_DIR="${APP_DIR:-/srv/arth}"
BRANCH="${BRANCH:-claude/satus-award-website-foundation-r6o5cf}"
# Empty until Box B exists. The ship-and-restart half is skipped while it is,
# and says so — the lab is useful on its own.
PROD_HOST="${PROD_HOST:-}"
PROD_DOMAIN="${PROD_DOMAIN:-}"
STAMP="${APP_DIR}/.last-deploy"

export PATH="/home/deploy/.bun/bin:${PATH}"
export NEXT_PUBLIC_SANITY_PROJECT_ID=az53j4l1
export NEXT_PUBLIC_SANITY_DATASET=production
export NEXT_PUBLIC_SANITY_API_VERSION=2025-03-01

cd "$APP_DIR"

git fetch --quiet origin "$BRANCH"

local_sha=$(git rev-parse HEAD)
remote_sha=$(git rev-parse "origin/${BRANCH}")

if [ "$local_sha" = "$remote_sha" ]; then
  # The overwhelmingly common case. Saying nothing keeps the journal readable,
  # so that the lines which *are* there all mean something happened.
  exit 0
fi

echo "deploying ${local_sha:0:7} -> ${remote_sha:0:7}"

# Reset rather than merge. This checkout is not a place anyone works by hand,
# and a merge that conflicts would leave the timer failing every five minutes
# with no one watching.
git reset --hard "origin/${BRANCH}"

bun install --frozen-lockfile

# If the build fails the script stops here, under `set -e`, and **Box B is
# never touched**. Production keeps serving the last version that worked. This
# is the most important property in the file: a broken commit cannot take the
# site down, it can only fail to replace it.
bun run build

echo "restarting lab"
sudo systemctl restart arth

if [ -z "$PROD_HOST" ]; then
  echo "PROD_HOST is empty — Box B does not exist yet, skipping the ship step"
  echo "$remote_sha" > "$STAMP"
  echo "lab now serving ${remote_sha:0:7}"
  exit 0
fi

echo "shipping to ${PROD_HOST}"
# `--delete` on the build output: a stale chunk left from a previous build gets
# served to a browser whose HTML no longer references it, which is the kind of
# intermittent 404 nobody can reproduce.
#
# `node_modules` ships because this project does not use `output: 'standalone'`
# — `next start` needs the real dependency tree. Turning standalone on would
# shrink this a great deal and is a measured decision, not a free one.
for dir in .next node_modules; do
  rsync -a --delete -e "ssh -o StrictHostKeyChecking=accept-new -o BatchMode=yes" \
    "${dir}/" "deploy@${PROD_HOST}:${APP_DIR}/${dir}/"
done
rsync -a -e "ssh -o StrictHostKeyChecking=accept-new -o BatchMode=yes" \
  package.json bun.lock next.config.ts "deploy@${PROD_HOST}:${APP_DIR}/"

echo "restarting production"
ssh -o StrictHostKeyChecking=accept-new -o BatchMode=yes "deploy@${PROD_HOST}" \
  'sudo systemctl restart arth'

if [ -n "$PROD_DOMAIN" ]; then
  echo "proving production answers"
  # A deploy that reports success while the site is down is worse than one that
  # fails: it moves the discovery of an outage from this journal to a visitor.
  for attempt in $(seq 1 10); do
    code=$(curl -sS -o /dev/null -w '%{http_code}' "https://${PROD_DOMAIN}/en" || true)
    echo "  attempt ${attempt}: ${code}"
    if [ "$code" = "200" ]; then
      echo "$remote_sha" > "$STAMP"
      echo "deployed ${remote_sha:0:7}"
      exit 0
    fi
    sleep 5
  done
  echo "production did not return 200 within 50s — journalctl -u arth -n 80 on ${PROD_HOST}"
  exit 1
fi

echo "$remote_sha" > "$STAMP"
echo "deployed ${remote_sha:0:7} (no PROD_DOMAIN set, answer not verified)"

}

main "$@"
