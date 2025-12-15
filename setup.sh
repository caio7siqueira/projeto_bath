#!/bin/bash
set -e

echo "🚀 Setting up Efizion Bath development environment..."

# Copy env file if not exists
if [ ! -f .env ]; then
  echo "📝 Creating .env from env.example..."
  cp env.example .env
else
  echo "✅ .env already exists"
fi

# Start infrastructure
echo "🐳 Starting Docker containers..."
docker compose up -d postgres redis

# Wait for postgres
echo "⏳ Waiting for PostgreSQL..."
until docker compose exec -T postgres pg_isready -U bath > /dev/null 2>&1; do
  sleep 1
done

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
pnpm db:generate

# Run migrations
echo "🗄️  Running database migrations..."
pnpm db:migrate

# Seed database
echo "🌱 Seeding database..."
pnpm db:seed

echo "✅ Setup complete! Run 'pnpm dev' to start development."
