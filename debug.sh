#!/usr/bin/env bash

# =========================================
# DEPLOYMENT DEBUG SCRIPT (VERBOSE)
# Author: stop-guessing-start-debugging
# =========================================

set -euo pipefail

DEBUG_DIR="__deploy_debug__"
LOG_FILE="$DEBUG_DIR/debug.log"

mkdir -p "$DEBUG_DIR"

exec > >(tee "$LOG_FILE") 2>&1

echo "========================================="
echo " DEPLOYMENT DEBUG REPORT"
echo " Generated at: $(date)"
echo "========================================="

# ---------- SYSTEM INFO ----------
echo
echo "===== SYSTEM INFO ====="
uname -a || true
echo
echo "OS Release:"
cat /etc/os-release 2>/dev/null || sw_vers || true

# ---------- NODE / PACKAGE MANAGERS ----------
echo
echo "===== NODE / PACKAGE MANAGERS ====="
command -v node && node -v || echo "Node NOT installed"
command -v npm && npm -v || echo "npm NOT installed"
command -v yarn && yarn -v || echo "yarn NOT installed"
command -v pnpm && pnpm -v || echo "pnpm NOT installed"

# ---------- PROJECT STRUCTURE ----------
echo
echo "===== PROJECT ROOT STRUCTURE ====="
ls -la

echo
echo "===== IMPORTANT FILE CHECK ====="
for f in package.json package-lock.json yarn.lock pnpm-lock.yaml vite.config.js vite.config.ts next.config.js vercel.json netlify.toml dockerfile Dockerfile; do
  if [ -f "$f" ]; then
    echo "FOUND: $f"
  else
    echo "MISSING: $f"
  fi
done

# ---------- PACKAGE.JSON ----------
if [ -f package.json ]; then
  echo
  echo "===== PACKAGE.JSON ====="
  cat package.json
else
  echo
  echo "ERROR: package.json NOT FOUND"
fi

# ---------- ENV FILES ----------
echo
echo "===== ENV FILES (NAMES ONLY, NO VALUES) ====="
ls -la | grep -E "\.env" || echo "No .env files found"

# ---------- GIT STATUS ----------
echo
echo "===== GIT INFO ====="
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git status
  echo
  git remote -v
  echo
  git branch -a
else
  echo "NOT A GIT REPOSITORY"
fi

# ---------- INSTALL DEPENDENCIES ----------
echo
echo "===== INSTALL DEPENDENCIES ====="
if [ -f pnpm-lock.yaml ]; then
  echo "Using pnpm"
  pnpm install
elif [ -f yarn.lock ]; then
  echo "Using yarn"
  yarn install
else
  echo "Using npm"
  npm install
fi

# ---------- BUILD ----------
echo
echo "===== BUILD STEP ====="
if npm run | grep -q "build"; then
  npm run build
else
  echo "NO build script found in package.json"
fi

# ---------- START / PREVIEW ----------
echo
echo "===== START / PREVIEW SCRIPTS ====="
npm run | grep -E "start|preview|dev" || echo "No start/preview scripts"

# ---------- OUTPUT FOLDERS ----------
echo
echo "===== COMMON BUILD OUTPUT CHECK ====="
for d in dist build out .next; do
  if [ -d "$d" ]; then
    echo "FOUND BUILD OUTPUT: $d"
    du -sh "$d"
  fi
done

# ---------- PORT USAGE ----------
echo
echo "===== PORT CHECK ====="
lsof -i -P -n | grep LISTEN || echo "No listening ports"

# ---------- DISK / MEMORY ----------
echo
echo "===== SYSTEM RESOURCES ====="
df -h
echo
free -h || vm_stat || true

# ---------- SUMMARY ----------
echo
echo "========================================="
echo " DEBUG COMPLETE"
echo " LOG FILE: $LOG_FILE"
echo " ZIP THIS DIRECTORY BEFORE SHARING"
echo "========================================="
