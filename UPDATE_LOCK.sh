#!/bin/bash
# Run this in Codespaces to update pnpm-lock.yaml
cd /workspaces/projeto_bath
pnpm install
git add pnpm-lock.yaml
git commit -m "chore: update pnpm-lock.yaml with all dependencies"
git push
