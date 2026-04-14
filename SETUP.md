# Roamly — Setup Guide

## Prerequisites

- Node.js 20+
- Xcode (for iOS build)
- AWS CLI (`brew install awscli`)
- AWS CDK CLI (`npm install -g aws-cdk`)

---

## Step 1 — AWS Account Setup

1. Go to https://aws.amazon.com and create a free account
2. In the AWS Console → IAM → Users → Create a user with `AdministratorAccess`
3. Generate Access Keys for that user
4. Run: `aws configure`
   - Enter your Access Key ID
   - Enter your Secret Access Key
   - Default region: `us-east-1`
   - Output format: `json`

---

## Step 2 — Add Your API Keys

### Backend (Lambda environment)
Edit `backend/.env`:
```
ANTHROPIC_API_KEY=sk-ant-api03-...   ← your new Anthropic key
GOOGLE_MAPS_API_KEY=AIza...          ← your new Google Maps key
```

### Frontend
Edit `.env` in the root:
```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...   ← same Google key
```
(Cognito values are filled in after Step 3)

---

## Step 3 — Deploy AWS Backend

```bash
cd backend

# First-time only — bootstrap CDK in your AWS account
npx cdk bootstrap

# Deploy all stacks (takes ~10-15 minutes first time — Aurora spins up)
npx cdk deploy --all
```

After deploy, CDK prints outputs like:
```
RoamlyAuthStack.UserPoolId = us-east-1_XXXXXXXXX
RoamlyAuthStack.UserPoolClientId = XXXXXXXXXXXXXXXXXXXXXXXXXX
RoamlyApiStack.ApiUrl = https://XXXX.execute-api.us-east-1.amazonaws.com
RoamlyDbStack.DbProxyEndpoint = roamly...rds.amazonaws.com
```

Copy these into your root `.env`:
```
EXPO_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
EXPO_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_API_URL=https://XXXX.execute-api.us-east-1.amazonaws.com/v1
```

---

## Step 4 — Run Database Migrations

You need to run the SQL migrations against Aurora. The easiest way during development:

1. In the AWS Console → RDS → your cluster → Query Editor
   (or use the AWS CLI with SSM Session Manager to bastion in)
2. Run each file in `backend/migrations/` in order:
   - 001_create_users.sql
   - 002_create_friendships.sql
   - 003_create_trips.sql
   - 004_create_places.sql
   - 005_create_itinerary.sql
   - 006_create_recommendations_reviews.sql

---

## Step 5 — Run the App

```bash
# From project root
npx expo start --ios
```

Scan the QR code with your iPhone (Expo Go app) or press `i` to open in simulator.

---

## Google Maps API Key Setup

Your key needs these APIs enabled in Google Cloud Console:
- Maps SDK for iOS
- Places API (New)
- Geocoding API

Go to: https://console.cloud.google.com → APIs & Services → Enable APIs

---

## Cost Estimate (AWS, light usage)

| Service | Estimated Monthly Cost |
|---|---|
| RDS PostgreSQL t3.micro | ~$13 |
| API Gateway + Lambda | ~$1–5 |
| Cognito (first 50K users free) | $0 |
| NAT Gateway | ~$35 |
| **Total** | **~$50–55/month** |
