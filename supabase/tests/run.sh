#!/usr/bin/env bash
# Runs the migrations and supabase/tests/*.test.sql on a throwaway Postgres 16 cluster
# with stand-in auth, storage and realtime schemas (stubs.sql). Needs Postgres 16 installed.
#   bash supabase/tests/run.sh
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"
DIR="$(mktemp -d)"
RUN=()
if [ "$(id -u)" = 0 ]; then chown postgres "$DIR"; RUN=(runuser -u postgres --); fi
"${RUN[@]}" "$BIN/initdb" -D "$DIR/data" -A trust -U postgres >/dev/null
"${RUN[@]}" "$BIN/pg_ctl" -D "$DIR/data" -o "-p 54329 -k $DIR -c listen_addresses=''" -l "$DIR/log" -w start >/dev/null
trap '"${RUN[@]}" "$BIN/pg_ctl" -D "$DIR/data" -m immediate stop >/dev/null; rm -rf "$DIR"' EXIT
PSQL=("${RUN[@]}" env PGOPTIONS="-c client_min_messages=warning" psql -X -q -v ON_ERROR_STOP=1 -h "$DIR" -p 54329 -U postgres -d postgres)
"${PSQL[@]}" -f "$HERE/stubs.sql" >/dev/null
# Twice: every migration must be safe to run again.
for pass in 1 2; do for m in "$HERE"/../migrations/*.sql; do "${PSQL[@]}" -f "$m" >/dev/null; done; done
for t in "$HERE"/*.test.sql; do "${PSQL[@]}" -f "$t"; done
