# CrewCircle

<p align="center">
  <strong>Australian Workforce Management Solution</strong><br>
  Roster scheduling, time tracking, and team management for shift-based businesses
</p>

<p align="center">
  <a href="https://crewcircle.co">Website</a> •
  <a href="https://crewcircle.co/demo">Live Demo</a> •
  <a href="docs/wiki">Documentation</a>
</p>

[![Deploy by Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)

---

## What is CrewCircle?

CrewCircle is a **workforce management platform** built for Australian small and medium businesses. It helps you:

- 📅 **Create rosters** in minutes with drag-and-drop scheduling
- ⏰ **Track time** with GPS-verified clock in/out
- 👥 **Manage teams** with role-based access control
- 📊 **Generate reports** for payroll and compliance
- 🔔 **Notify employees** instantly when rosters change

> **Data hosted in Sydney (AWS ap-southeast-2)** for AU compliance and fast performance.

---

## Architecture

```
crewcircle/
├── apps/
│   ├── web/                    # Next.js 16 web application
│   │   └── src/
│   │       ├── app/           # Next.js App Router pages
│   │       ├── components/    # Shared React components
│   │       ├── features/      # Feature modules (roster, timesheets, team)
│   │       ├── lib/           # Libraries
│   │       │   ├── clerk/     # Clerk authentication + user service
│   │       │   └── neon/      # NeonDB PostgreSQL client
│   │       └── store/        # Zustand state management
│   └── mobile/                # React Native mobile app (Expo)
├── packages/
│   └── validators/            # Zod validation schemas
└── docs/                       # Documentation and wiki
```

### Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend (Web) | Next.js 16, React 19, TypeScript |
| Mobile App | React Native, Expo |
| Database | NeonDB (PostgreSQL) |
| Authentication | Clerk |
| Styling | Tailwind CSS v4 |
| Payments | Stripe |
| Deployment | Vercel (Web), EAS (Mobile) |

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm package manager
- NeonDB account (PostgreSQL)
- Clerk account (authentication)
- Stripe account (payments)

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your credentials
```

### Environment Variables

```bash
# NeonDB (PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/roster
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/roster

# Stripe Payments
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_PRICE_ID=price_xxx

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Development

```bash
# Start web app
pnpm --filter web dev

# Open http://localhost:3000
```

### Demo Mode

Visit `/demo` to try the app without signing up. Select a demo user role to explore features.

---

## Features

### 📅 Roster Management
- Drag-and-drop scheduling with visual calendar
- Automatic conflict detection
- Copy previous week's roster
- Publish rosters with one click

### ⏰ Time Tracking
- GPS-verified clock in/out
- Track actual hours vs rostered
- Break tracking

### 👥 Team Management
- Employee invitation via email
- Role-based access (Owner, Manager, Employee)
- ABN validation for Australian businesses

### 📊 Timesheets
- Automatic timesheet generation
- CSV export for payroll
- Labour cost tracking

### 💳 Billing
- Free tier (up to 5 employees)
- Starter plan ($4 + GST / employee / month)
- Stripe-powered payments

---

## Deployment

### Web (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Add environment variables in Vercel dashboard.

### Database (NeonDB)

1. Create project at [neondb.tech](https://neondb.tech)
2. Copy connection string
3. Run migrations (schema in `docs/`)

---

## Testing

```bash
cd apps/web

# Run E2E tests
npx playwright test

# Run with UI
npx playwright test --ui
```

---

## Documentation

See [docs/README.md](docs/README.md) for the full documentation index.

---

## License

Proprietary - All rights reserved by CrewCircle

---

Built with ❤️ in Australia
