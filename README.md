<div align="center">

[![CrewCircle](https://crewcircle.co/logo.png)](https://crewcircle.co)

# CrewCircle

### Australian Workforce Management Solution

**Roster scheduling, time tracking, and team management for shift-based businesses**

[![Live App](https://img.shields.io/badge/Live_App-00C7B7?style=for-the-badge&logo=vercel&logoColor=white)](https://crewcircle.co)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Sensible-Analytics/crewcircle)

</div>

---

## 🛡️ Security First

> ⚠️ **CRITICAL SECURITY WARNING**
>
> This repository uses **automated secret scanning**. NEVER commit:
> - API keys (OpenAI, Anthropic, database credentials)
> - AI agent tokens
> - Database connection strings
> - Private keys
>
> **Before committing:** Review our [Security Policy](SECURITY.md) and [AI Agent Keys Policy](AI_AGENT_KEYS_POLICY.md)

---

## 🎯 What is CrewCircle?

CrewCircle is a comprehensive **workforce management platform** designed specifically for Australian shift-based businesses. From roster scheduling to GPS-verified time tracking, we help you manage your team efficiently.

### Perfect For

- 🏥 Healthcare facilities (clinics, aged care)
- 🏪 Retail stores and chains
- 🍽️ Hospitality venues
- 🏭 Manufacturing & warehousing
- 🎪 Events & venues

---

## ✨ Features

### 📅 Smart Roster Management

- **Drag-and-Drop Scheduling** — Intuitive interface with conflict detection
- **Multi-Location Support** — Manage teams across multiple sites
- **Template Rosters** — Save and reuse common patterns
- **Publish & Notify** — Instant team notifications
- **Week/Day Views** — Flexible calendar perspectives

### ⏰ GPS Time Clock

- **Geofence Verification** — Clock in/out only at approved locations
- **Offline Support** — Works without internet connection
- **Real-Time Tracking** — Monitor who's on shift
- **Break Management** — Track meal and rest breaks
- **Photo Verification** — Optional photo check-in

### 👥 Team Management

- **Role-Based Access** — Owner, Manager, Employee permissions
- **Employee Onboarding** — Self-service invitation system
- **Availability Management** — Staff submit availability preferences
- **Document Storage** — Store certifications and compliance docs
- **ABN Validation** — Automatic Australian Business Number verification

### 📊 Timesheets & Payroll

- **Automatic Timesheets** — Generated from clock-in/out data
- **CSV Export** — Compatible with Xero, MYOB, QuickBooks
- **Labor Cost Tracking** — Real-time wage calculations
- **Overtime Detection** — Automatic award rate calculations
- **Historical Reports** — Export data for any time period

### 🔔 Communication

- **Push Notifications** — Shift reminders and changes
- **Team Messaging** — In-app communication
- **Shift Swaps** — Request and approve shift exchanges
- **Availability Requests** — Time-off management

---

## 💳 Pricing

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0 | Up to 5 employees, basic scheduling |
| **Starter** | $5/employee/month | Unlimited employees, advanced features |
| **Business** | Custom | Priority support, custom integrations |

[Start Free Trial](https://crewcircle.co)

---

## 🚀 Quick Start

### Web App
Visit **[crewcircle.co](https://crewcircle.co)** to get started immediately.

### Mobile App
Download the CrewCircle mobile app for iOS and Android (coming soon).

### Local Development

```bash
# Clone the repository
git clone https://github.com/Sensible-Analytics/crewcircle.git
cd crewcircle

# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
yarn dev
```

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Web Frontend** | Next.js 16, React 19, TypeScript |
| **Mobile App** | React Native, Expo |
| **Backend** | Supabase (PostgreSQL, Auth, Edge Functions) |
| **Styling** | Tailwind CSS |
| **State Management** | Zustand |
| **Payments** | Stripe |
| **Deployment** | Vercel (Web), EAS (Mobile) |

---

## 📁 Project Structure

```
crewcircle/
├── apps/
│   ├── web/              # Next.js web application
│   └── mobile/           # React Native mobile app
├── packages/
│   ├── supabase/         # Supabase client utilities
│   ├── validators/       # Zod validation schemas
│   └── ui-shared/        # Shared UI components
├── supabase/
│   ├── migrations/       # Database migrations
│   └── functions/        # Edge functions
│       ├── stripe-webhook/
│       ├── shift-reminder/
│       └── send-push-notification/
└── docs/                 # Documentation
```

---

## 🏆 Built for Australian Businesses

CrewCircle is designed with Australian compliance in mind:

- ✅ **Fair Work Act** compliant
- ✅ **Single Touch Payroll** ready
- ✅ **Superannuation** tracking
- ✅ **Award Rates** support
- ✅ **ABN Validation** built-in

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

---

## 🛡️ Security

### 🔒 Automated Protection

This repository includes:
- ✅ **Pre-commit hooks** - Scan for secrets before every commit
- ✅ **GitHub Secret Scanning** - Automatic detection of exposed credentials
- ✅ **Push Protection** - Block commits containing secrets
- ✅ **Dependency scanning** - Detect vulnerable packages

### 🚨 Security Requirements

**Before contributing:**

1. **Install pre-commit hooks:**
   ```bash
   pip install pre-commit
   pre-commit install
   ```

2. **Use environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your keys (NEVER commit this file!)
   ```

3. **Verify .env is ignored:**
   ```bash
   git check-ignore .env  # Should output: .env
   ```

### 🆘 Security Incidents

**If you accidentally commit a secret:**

1. **DO NOT PANIC**
2. **REVOKE the key immediately** via provider dashboard
3. **Contact:** security@sensibleanalytics.co
4. **Follow our [Incident Response Guide](SECURITY.md)**

### 📋 Security Checklist

- [ ] Pre-commit hooks installed
- [ ] .env file created from .env.example
- [ ] .env added to .gitignore
- [ ] No hardcoded API keys in code
- [ ] No console.log of sensitive data

For full details, see our [Security Policy](SECURITY.md) and [AI Agent Keys Policy](AI_AGENT_KEYS_POLICY.md).

---

## 📄 License

MIT License — see [LICENSE](LICENSE)

---

<div align="center">

**Built by [Sensible Analytics](https://www.sensibleanalytics.co)**  
*Sydney, Australia*

[Website](https://crewcircle.co) · [Support](mailto:support@crewcircle.co) · [LinkedIn](https://www.linkedin.com/in/prabhatr/)

</div>
