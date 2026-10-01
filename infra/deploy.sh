#!/usr/bin/env bash
#
# Pull, never push.
#
# Runs every five minutes via `arth-deploy.timer`. Fetches the branch, and when
# there is something new: builds, then restarts the server.
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

# If the build fails the script stops here, under `set -e`, and **the running
# server is never restarted**. It keeps serving the last version that built.
# This is the most important property in the file: a broken commit cannot take
# the site down, it can only fail to replace it.
bun run build

echo "restarting"
sudo systemctl restart arth

# One box, so there is nothing to ship anywhere. A second machine — a
# production box that the lab could never take down — was in an earlier draft
# of this infrastructure and has been removed rather than deferred: it existed
# to protect a production surface that does not exist yet, and it doubled the
# bill of someone paying out of pocket.
#
# When it comes back (real clients on the site, or a lab busy enough that a
# failed experiment is felt by someone else), the shipping half of this script
# comes back with it — see infra/optional/bootstrap-prod.sh.

echo "$remote_sha" > "$STAMP"
echo "deployed ${remote_sha:0:7}"

}

main "$@"
