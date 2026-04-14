# Roamly

A collaborative trip planning mobile app built with React Native and AWS. Plan trips with friends, build itineraries, save places, and use AI to parse travel notes into structured plans.

## Features

- Create and manage trips with multiple collaborators (owner / editor / viewer roles)
- Build day-by-day itineraries with time-aware scheduling in the trip's local timezone
- Save and organize places using Google Maps search
- Invite friends and share trips
- AI-powered parsing — paste in travel notes, emails, or itineraries and Claude extracts places and itinerary items automatically

## Tech Stack

**Frontend**
- React Native 0.83.4 + Expo 55 (Expo Router for file-based navigation)
- TypeScript
- TanStack React Query (server state), Zustand (client state)
- AWS Amplify (auth + REST API client)
- `date-fns` / `date-fns-tz` (timezone-aware date handling)
- `react-native-maps` (Google Maps)

**Backend**
- AWS CDK 2 (infrastructure as code)
- API Gateway v2 (HTTP API) + AWS Lambda (Node.js 20)
- PostgreSQL 16 on RDS
- AWS Cognito (authentication)
- Anthropic Claude API (AI parsing)
- Google Places + Timezone APIs

## Project Structure

```
├── app/                    # Expo Router screens
│   ├── (auth)/             # Login / sign-up
│   └── (tabs)/             # Main navigation (Trips, Places, Friends, Profile)
│       └── trips/[tripId]/ # Trip detail screens (places, itinerary)
├── src/
│   ├── api/                # Axios API clients
│   ├── components/         # UI components (itinerary, places, trips, ai, ui)
│   ├── hooks/              # React Query hooks
│   ├── types/              # TypeScript models
│   ├── theme/              # Colors, fonts, spacing
│   └── utils/              # Notifications, helpers
└── backend/
    ├── lib/stacks/         # CDK stacks (Auth, Database, Api)
    ├── lib/lambdas/        # Lambda handlers per domain
    └── migrations/         # SQL migration files
```

## Getting Started

See [SETUP.md](./SETUP.md) for full setup instructions including AWS account configuration, CDK deployment, and database migrations.

### Prerequisites

- Node.js 20+
- Xcode (iOS development)
- AWS CLI configured with an IAM user
- AWS CDK (`npm install -g aws-cdk`)

### Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```
EXPO_PUBLIC_API_URL=                    # API Gateway URL (output after CDK deploy)
EXPO_PUBLIC_COGNITO_USER_POOL_ID=       # Cognito User Pool ID
EXPO_PUBLIC_COGNITO_CLIENT_ID=          # Cognito App Client ID
EXPO_PUBLIC_AWS_REGION=us-east-1
GOOGLE_MAPS_API_KEY=                    # Injected into native build only (not bundled)
```

Backend Lambda environment variables (set in CDK or `.env` in `backend/`):

```
ANTHROPIC_API_KEY=                      # Claude API key (server-side only)
GOOGLE_MAPS_API_KEY=                    # Used for Places + Timezone API proxy
```

### Run the App

```bash
npm install
npx expo start --ios
```

### Deploy the Backend

```bash
cd backend
npm install
npm run build
cdk bootstrap   # first time only
cdk deploy --all
```

After deploying, run the SQL migrations in `backend/migrations/` against the RDS instance using the RDS Query Editor in the AWS console.

## AWS Cost Estimate

~$50–55/month in us-east-1:
- RDS t3.micro (PostgreSQL): ~$13
- NAT Gateway: ~$35
- API Gateway + Lambda: ~$1–5
