#!/bin/sh
set -e

if [ -z "$SERVICE_NAME" ]; then
  echo "ERROR: SERVICE_NAME environment variable is not set"
  exit 1
fi

echo "Starting ${SERVICE_NAME} service..."
exec node dist/apps/${SERVICE_NAME}/main.js
