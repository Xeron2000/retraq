#!/bin/sh
set -e
cd /app/backend
mkdir -p /data
uv run python import_data.py
exec "$@"