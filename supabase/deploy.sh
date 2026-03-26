#!/bin/bash
set -e

echo "=========================================="
echo "Supabase Deployment Script"
echo "=========================================="

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed"
    echo "Install with: npm install -g supabase"
    exit 1
fi

# Navigate to supabase directory
cd "$(dirname "$0")"

# Check if linked to a project
if [ ! -f "supabase/.temp/project-ref" ]; then
    echo "Error: Not linked to a Supabase project"
    echo "Run: supabase link --project-ref pnmzimtzzvmifqfcvefo"
    exit 1
fi

PROJECT_REF=$(cat supabase/.temp/project-ref)
echo "Deploying to project: $PROJECT_REF"

# Step 1: Deploy database migrations
echo ""
echo "Step 1: Pushing database migrations..."
supabase db push --db-url="postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"

# Step 2: Deploy edge functions
echo ""
echo "Step 2: Deploying edge functions..."
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy shift-reminder --no-verify-jwt
supabase functions deploy send-push-notification --no-verify-jwt
supabase functions deploy on-roster-published --no-verify-jwt

# Step 3: Set secrets for edge functions
echo ""
echo "Step 3: Setting edge function secrets..."
supabase secrets set STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY}"
supabase secrets set STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET}"
supabase secrets set SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

echo ""
echo "=========================================="
echo "Deployment complete!"
echo "=========================================="
echo ""
echo "Don't forget to:"
echo "1. Set up your Stripe webhook to point to:"
echo "   https://${PROJECT_REF}.supabase.co/functions/v1/stripe-webhook"
echo "2. Verify your database migrations ran successfully"
echo "3. Check edge function logs with: supabase functions logs"
