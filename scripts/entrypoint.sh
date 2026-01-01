#!/bin/sh
set -e

# Run migrations
echo "Applying database migrations..."
npx prisma migrate deploy

# Run seeding
echo "Seeding initial data..."
node dist/prisma/seed.js 

echo "Starting Server..."
exec "$@"