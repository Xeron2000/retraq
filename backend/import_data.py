#!/usr/bin/env python3
"""Ensure DB migrated; no duplicate xlsx import (handled in migrate.ensure_database)."""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from migrate import ensure_database


def main():
    ensure_database()
    print("✅ Database ready (profiles + migration applied)")


if __name__ == "__main__":
    main()