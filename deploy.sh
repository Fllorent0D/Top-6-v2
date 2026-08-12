#!/bin/bash
set -e

# VPS Deployment Script for Top-6
# Usage: ./deploy.sh [user@host]

REMOTE="${1:-}"
PROJECT_DIR="/opt/top-6"
LOG_DIR="/var/log/top-6"

if [ -z "$REMOTE" ]; then
  echo "Usage: $0 user@host"
  echo "Example: $0 root@my-vps.example.com"
  exit 1
fi

echo "Deploying to $REMOTE..."

# Build locally first
echo "Building project..."
npm run build

# Create deployment package
echo "Creating deployment package..."
tar --exclude='node_modules' -czf /tmp/top-6-deploy.tar.gz \
  dist/ \
  config/ \
  run.sh \
  crontab.generated \
  package.json \
  package-lock.json \
  .env \
  firebase_sdk.json

# Deploy to remote
echo "Uploading to $REMOTE..."
ssh "$REMOTE" "mkdir -p $PROJECT_DIR $LOG_DIR"
scp /tmp/top-6-deploy.tar.gz "$REMOTE:/tmp/"

echo "Installing on remote..."
ssh "$REMOTE" bash << EOF
  cd $PROJECT_DIR
  tar -xzf /tmp/top-6-deploy.tar.gz
  chmod +x run.sh

  # Fix credentials path for VPS
  sed -i 's|GOOGLE_SERVICE_ACCOUNT_JSON_CREDENTIALS=.*|GOOGLE_SERVICE_ACCOUNT_JSON_CREDENTIALS=/opt/top-6/firebase_sdk.json|' .env
  sed -i 's|NODE_ENV=.*|NODE_ENV=production|' .env

  npm install --omit=dev --ignore-scripts

  # Install crontab (merge with existing, removing old top-6 entries)
  echo "Installing crontab..."
  crontab -l 2>/dev/null | sed '/^# BEGIN TOP-6 CRONTAB/,/^# END TOP-6 CRONTAB/d' > /tmp/crontab-clean || true
  cat /tmp/crontab-clean $PROJECT_DIR/crontab.generated | crontab -

  echo "Crontab installed. Current top-6 jobs:"
  crontab -l | sed -n '/^# BEGIN TOP-6 CRONTAB/,/^# END TOP-6 CRONTAB/p'

  rm /tmp/top-6-deploy.tar.gz /tmp/crontab-clean
EOF

rm /tmp/top-6-deploy.tar.gz

echo ""
echo "Deployment complete!"
echo "Logs will be written to $LOG_DIR on the remote server"
