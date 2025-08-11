# HotDoc-Alternate MVP

A modern healthcare booking platform built with React and AWS Serverless technologies.

## 🏗️ Architecture

- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: AWS Lambda + API Gateway + DynamoDB
- **Auth**: AWS Cognito User Pools
- **Infrastructure**: AWS SAM (Serverless Application Model)
- **Monorepo**: pnpm workspaces

## 📁 Project Structure

```
├── infra/                  # AWS SAM infrastructure templates
│   ├── template.yaml       # Root SAM template
│   └── stacks/            # Nested CloudFormation stacks
├── services/              # Backend services
│   ├── core-api/          # Main API Lambda functions
│   ├── scheduler/         # Reminder & scheduling service
│   ├── pms-adapter/       # Practice Management System integration
│   └── notifications/     # Email/SMS/voice notifications
├── web/                   # Frontend applications  
│   ├── admin/            # Practice admin dashboard
│   └── public/           # Patient booking portal
├── shared/               # Shared packages
│   ├── models/           # TypeScript types & Zod schemas
│   └── lib/              # Utilities & API client
└── docs/                 # Documentation & diagrams
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- AWS CLI configured
- AWS SAM CLI

### Installation

```bash
# Clone the repository
git clone https://github.com/onesphereai/hotdoc-alternate.git
cd hotdoc-alternate

# Install dependencies
pnpm install

# Build shared packages
pnpm build
```

### Development

```bash
# Start admin dashboard
pnpm --filter @hotdoc-alt/admin dev

# Start public site
pnpm --filter @hotdoc-alt/public dev

# Build all packages
pnpm build

# Run tests
pnpm test
```

## 🏥 Features

### Phase 1 - Foundation ✅
- [x] Multi-tenant architecture
- [x] Cognito authentication (admin & patient pools)  
- [x] Practice onboarding wizard
- [x] Provider management
- [x] API with DynamoDB integration
- [x] Admin dashboard

### Phase 2 - Patient Booking 🚧
- [ ] Postcode-based practice search with map
- [ ] Real-time slot availability
- [ ] Online booking with confirmation
- [ ] Email notifications

### Phase 3 - Automation 📋
- [ ] SMS/Email reminders (EventBridge + Step Functions)
- [ ] GP-initiated patient recalls
- [ ] Automated delivery tracking

### Phase 4 - Integration 📋  
- [ ] PMS adapter interface
- [ ] Mock PMS synchronization

### Phase 5 - Voice 📋
- [ ] Outbound reminder calls via Amazon Connect
- [ ] IVR confirmation/cancellation

## 🌐 Deployment

### Infrastructure

```bash
cd infra

# Build the SAM application
sam build

# Deploy to development
sam deploy --guided --parameter-overrides Environment=dev

# Deploy to production
sam deploy --config-env prod
```

### Frontend Apps

The React apps are deployed as static sites and configured to use the API Gateway endpoints.

## 🔑 Environment Variables

### Admin App (`web/admin/.env`)
```bash
VITE_API_URL=https://your-api-gateway-url
VITE_USER_POOL_ID=ap-southeast-2_XXXXXXXXX
VITE_USER_POOL_CLIENT_ID=your-admin-client-id
VITE_AWS_REGION=ap-southeast-2
```

### Public App (`web/public/.env`)  
```bash
VITE_API_URL=https://your-api-gateway-url
VITE_MAPBOX_ACCESS_TOKEN=your-mapbox-token
VITE_AWS_REGION=ap-southeast-2
```

## 📊 Data Models

Key entities following Australian healthcare standards:

- **Practice**: ABN, address, services, operating hours
- **Provider**: Healthcare professionals, specialties, languages  
- **Patient**: Demographics, contact preferences, consent
- **Booking**: Appointment details, confirmation codes, status
- **Session**: Provider availability, slot generation
- **Recall**: GP-initiated patient outreach campaigns

## 🔒 Security & Compliance

- **Australian Privacy Act 1988** compliance
- **Encryption**: All PII encrypted at rest (KMS) and in transit (TLS 1.2+)
- **Multi-tenancy**: Isolated data per practice
- **Authentication**: Cognito User Pools with MFA for admins
- **Authorization**: Role-based access control

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests  
pnpm test:e2e

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

## 📈 API Documentation

The API follows REST conventions with OpenAPI specifications:

- `GET /v1/practices` - Search practices by postcode
- `GET /v1/practices/{id}` - Practice details
- `GET /v1/providers/{id}` - Provider details  
- `GET /v1/slots` - Available appointment slots
- `POST /v1/bookings` - Create booking (idempotent)
- `GET /v1/bookings/{id}` - Booking status
- `POST /v1/bookings/{id}/confirm` - Confirm booking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Run `pnpm build` and `pnpm test`
5. Submit a pull request

## 📜 License

Copyright (c) 2024 OneSphere AI. All rights reserved.

## 🆘 Support

For technical support or questions:
- Create an issue in this repository
- Contact: dev@onesphere.ai

---

**Built with ❤️ for Australian Healthcare**