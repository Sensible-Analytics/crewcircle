<p align="center">
  <img src="https://crewcircle.co/logo.png" alt="CrewCircle" width="200"/>
</p>

<h1 align="center">CrewCircle</h1>

<p align="center">
  <strong>Australian Workforce Management Solution</strong><br>
  Roster scheduling, time tracking, and team management for shift-based businesses
</p>

<p align="center">
  <a href="https://crewcircle.co">Website</a> •
  <a href="https://crewcircle.vercel.app">Live Demo</a> •
  <a href="https://docs.crewcircle.co">Documentation</a>
</p>

---

## Features

### 📅 Roster Management
- Drag-and-drop scheduling with conflict detection
- Publish rosters instantly to your team
- Support for multiple work locations
- Week-at-a-glance and day views

### ⏰ Time Clock with GPS
- Geofence-verified clock in/out
- Track actual hours worked
- Offline support for time clock
- Multiple location support

### 👥 Team Management
- Employee invitation system
- Role-based access (Owner, Manager, Employee)
- Availability management
- ABN validation for Australian businesses

### 📊 Timesheets & Reports
- Automatic timesheet generation
- CSV export for payroll
- Labor cost tracking
- Export historical data

### 🔔 Real-time Updates
- Push notifications for shift changes
- Clock in/out alerts
- Team messaging
- Live roster updates

### 💳 Simple Billing
- Free tier (up to 5 employees)
- Starter plan for growing teams
- Stripe-powered payments
- Automatic subscription management

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend (Web) | Next.js 16, React 19, TypeScript |
| Mobile App | React Native, Expo |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions) |
| Styling | Tailwind CSS |
| Payments | Stripe |
| Deployment | Vercel (Web), EAS (Mobile) |

---

## Project Structure

```
crewcircle/
├── apps/
│   ├── web/              # Next.js web application
│   │   ├── src/
│   │   │   ├── app/      # Next.js App Router pages
│   │   │   ├── features/ # Feature modules
│   │   │   ├── packages/# Shared packages (local)
│   │   │   └── store/    # Zustand state management
│   │   └── public/       # Static assets
│   └── mobile/           # React Native mobile app
│       ├── app/          # Expo Router pages
│       ├── lib/          # Utility libraries
│       └── context/      # React contexts
├── packages/
│   ├── supabase/         # Supabase client utilities
│   ├── validators/        # Zod validation schemas
│   └── ui-shared/         # Shared UI components
├── supabase/
│   ├── migrations/        # Database migrations
│   └── supabase/
│       └── functions/     # Edge functions
│           ├── stripe-webhook/
│           ├── shift-reminder/
│           └── send-push-notification/
└── docs/                  # Documentation
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Yarn package manager
- Supabase account
- Stripe account (for billing)

### Installation

```bash
# Clone the repository
git clone https://github.com/Sensible-Analytics/crewcircle.git
cd crewcircle

# Install dependencies
yarn install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and Stripe keys

# Start development server
yarn dev
```

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-publishable-key

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Deployment

### Web Application (Vercel)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Mobile App (EAS)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS Build
eas build:configure

# Build for Android
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android --latest
```

### Supabase

```bash
cd supabase

# Link to your project
supabase link --project-ref your-project-ref

# Deploy migrations
supabase db push

# Deploy edge functions
supabase functions deploy
```

---

## Documentation

For full documentation, visit [docs.crewcircle.co](https://docs.crewcircle.co)

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

Proprietary - All rights reserved by Sensible Analytics

---

## Support

- **Email**: support@crewcircle.co
- **Website**: https://crewcircle.co
- **Documentation**: https://docs.crewcircle.co

---

<p align="center">
  Built with ❤️ in Australia by <a href="https://sensible-analytics.com">Sensible Analytics</a>
</p>


