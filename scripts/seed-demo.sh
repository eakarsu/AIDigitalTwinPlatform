#!/usr/bin/env bash
set -euo pipefail
test "${CONFIRM_DEMO_SEED:-}" = YES -a "${NODE_ENV:-development}" != production || { echo 'Requires CONFIRM_DEMO_SEED=YES and non-production.' >&2; exit 1; }
cd "$(dirname "$0")/../server"; node seed.js
