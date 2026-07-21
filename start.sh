#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")" && pwd)"
test -f "$root/.env" || { echo 'Missing .env; copy .env.example and set secrets.' >&2; exit 1; }
test -d "$root/server/node_modules" -a -d "$root/client/node_modules" || { echo 'Dependencies absent; run scripts/bootstrap.sh.' >&2; exit 1; }
for port in "${BACKEND_PORT:-3001}" "${FRONTEND_PORT:-3000}"; do ! lsof -ti ":$port" >/dev/null 2>&1 || { echo "Port $port is in use; refusing to terminate it." >&2; exit 1; }; done
(cd "$root/server" && npm start) & server_pid=$!
(cd "$root/client" && npm run dev -- --port "${FRONTEND_PORT:-3000}") & client_pid=$!
cleanup(){ kill "$server_pid" "$client_pid" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
wait "$server_pid" "$client_pid"
