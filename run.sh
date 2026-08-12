#!/bin/bash
set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Default to sunday if no argument provided
MODE="${1:-sunday}"

case "$MODE" in
  sunday)
    ENV_FILE="config/sunday.env"
    ;;
  thursday)
    ENV_FILE="config/thursday.env"
    ;;
  *)
    echo "Usage: $0 [sunday|thursday]"
    echo "  sunday   - Preview mode (email only)"
    echo "  thursday - Production mode (Facebook + Firebase)"
    exit 1
    ;;
esac

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: Config file $ENV_FILE not found"
  exit 1
fi

echo "================================================"
echo "Top-6 Run - $(date)"
echo "Mode: $MODE"
echo "Config: $ENV_FILE"
echo "================================================"

# Load base .env file with credentials (if exists)
if [ -f ".env" ]; then
  set -a
  source ".env"
  set +a
fi

# Load mode-specific environment variables (overrides base)
set -a
source "$ENV_FILE"
set +a

# Run the application
node dist/main.js

echo "================================================"
echo "Completed at $(date)"
echo "================================================"
