claude.md — HotDoc‑Alternate MVP Plan (React + AWS Serverless)

**Purpose:** This document instructs Claude Code to build an MVP in phased increments for a HotDoc‑like product. It includes scope, milestones, repo layout, Infrastructure as Code (IaC), API contracts, data models, test plans, and agent-ready tasks/prompts. The stack is **React (Vite) + AWS Serverless** (API Gateway, Lambda, Cognito, DynamoDB, EventBridge, SQS, SNS/Pinpoint, Step Functions, Amazon Connect) with **AWS SAM** for IaC. All technical choices and deliverables are explicit and actionable for each MVP phase.

⸻

0) Non‑functional Guardrails (Read First)
	•	**Compliance (AU context):** Adhere to Australian Privacy Act 1988 (APPs). No clinical notes or pathology in MVP; store only booking metadata and basic demographics. All PII is encrypted at rest using AWS KMS and in transit using TLS 1.2+.
	•	**Security:** Use AWS Cognito User Pools for patients and practice admins. Use Cognito Identity Pools (optional) for pre‑signed S3 uploads. Enforce principle of least privilege via IAM roles and policies. Store all secrets in AWS SSM Parameter Store.
	•	**Observability:** Use AWS CloudWatch for logs and metrics, AWS X-Ray for distributed tracing, structured JSON logs, and propagate app-level request IDs in all logs and API responses.
	•	**Tenancy model:** Use a single DynamoDB table per entity with tenant partition key (tenantId) for multi-tenancy. All APIs require tenantId scoping for data access and isolation.
	•	**Region:** ap-southeast-2 (Sydney) for all AWS resources. Store all timestamps in UTC; convert to practice’s local timezone on display.

⸻

1) Phased Roadmap (Milestones)

**Phase 1 — Foundations & Practice Onboarding (Week 1–2)**

**Goals:** Multi-tenant scaffolding, practice/admin onboarding, practitioner profiles, appointment type catalog.
	•	Implement AWS Cognito User Pools for patients and practice-admins.
	•	Build a practice onboarding wizard (address, ABN, billing policy, hours, services, geo pin) in the admin React app.
	•	Enable GP onboarding: profile (name, specialties, languages, gender), session rules.
	•	Define DynamoDB data models and build initial admin dashboard.

**AWS Services Used:** Cognito, DynamoDB, API Gateway, Lambda, SSM Parameter Store, CloudWatch, KMS.

**Actionable Deliverables:**
	•	Deployed backend (API Gateway + Lambda) and admin React app sections.
	•	DynamoDB tables created and populated with at least one practice and provider.
	•	Smoke tests for onboarding flows (practice, provider).
	•	Validation errors shown inline in UI.

---

**Phase 2 — Patient Discovery & Booking with Map (Week 3–4)**

**Goals:** Postcode search with map, real‑time availability, booking flow, confirmation.
	•	Implement geosearch by postcode and distance; use **Mapbox** for mapping (recommended for MVP due to developer experience and cost).
	•	Build appointment search surface (read model).
	•	Implement booking creation with idempotency and confirmation email.

**AWS Services Used:** API Gateway, Lambda, DynamoDB, SES (email), SSM Parameter Store, CloudWatch, KMS.

**Actionable Deliverables:**
	•	Public React site with search → details → slots → book flow.
	•	Emails sent via SES on booking confirmation.
	•	Practices shown on map using Mapbox GL JS.
	•	At least three nearby practices shown for a sample postcode.

---

**Phase 3 — Reminders & Recalls (Week 5)**

**Goals:** Automated appointment reminders (SMS/Email) and GP‑initiated recalls.
	•	Schedule reminders using EventBridge rules and Step Functions.
	•	Deliver via Pinpoint (SMS) and SES (Email).
	•	Implement recall workflow: create recall, choose cohort/criteria, send now or schedule.

**AWS Services Used:** EventBridge, Step Functions, Lambda, Pinpoint, SES, DynamoDB, SQS, CloudWatch.

**Actionable Deliverables:**
	•	Reminder templates defined and stored.
	•	Recall UI in admin app.
	•	Delivery dashboards showing sent, delivered, failed messages.
	•	Opt-out mechanism implemented and respected.

---

**Phase 4 — PMS Integration Adapter (Week 6+)**

**Goals:** Connector façade for Best Practice and future PMS. For MVP, provide a mock adapter + polling sync.
	•	Define PMS adapter interface and implement a mock version.
	•	Scheduled jobs (cron via EventBridge) to reconcile sessions and bookings.

**AWS Services Used:** Lambda, EventBridge, DynamoDB, SQS, CloudWatch.

**Actionable Deliverables:**
	•	PMS adapter interface and mock implementation committed.
	•	Session data populated via scheduled sync.
	•	Sync logs accessible via CloudWatch.

---

**Phase 5 — Bot Calling (Outbound) (Week 7)**

**Goals:** Prototype automated voice reminders.
	•	Implement outbound call campaign using **Amazon Connect** (recommended for MVP).
	•	Trigger calls via Lambda; basic IVR to capture confirmation/cancellation.
	•	Fallback to Twilio Programmable Voice only if Amazon Connect is not feasible.

**AWS Services Used:** Amazon Connect, Lambda, EventBridge, DynamoDB, CloudWatch.

**Actionable Deliverables:**
	•	Configurable call template available in admin app.
	•	Call outcome webhooks captured and update booking status.

⸻

2) Repository Layout

```
/infra              # SAM templates, parameter overrides, buildspecs
/services
  /core-api         # Lambda handlers (TypeScript/Node) via AWS SDK v3
  /scheduler        # Step Functions + workers
  /pms-adapter      # PMS façade + mock implementation
  /notifications    # Email/SMS/voice workers
/web
  /admin            # React (Vite) for practice admin
  /public           # React (Vite) for patient site
/shared
  /models           # TypeScript types & JSON Schemas (zod)
  /lib              # Logging, auth utils, error types
/docs               # ADRs, OpenAPI, diagrams
```


⸻

3) Infrastructure as Code (AWS SAM)

**Stacks**
	•	**networking:** VPC endpoints (optional for private Lambda networking), KMS keys (encryption), S3 buckets (assets, logs).
	•	**identity:** Cognito User Pools & Clients (patients, admins); SES verified identities; Pinpoint app for SMS.
	•	**data:** DynamoDB tables (see below), GSIs; EventBridge event bus; SQS queues (for recalls, notifications); SNS topics (optional for fan-out).
	•	**api:** API Gateway (HTTP API), Lambda functions, Cognito authorizers.
	•	**scheduler:** Step Functions, EventBridge rules (for reminders, sync).
	•	**channels:** Pinpoint SMS, SES templates, Amazon Connect instance (for voice calls).

**Core DynamoDB Tables**
	•	**Tenants** (pk: tenantId, name, domain, address, geo)
	•	**Practices** (pk: tenantId#practiceId, sk: meta)
	•	**Providers** (pk: tenantId#providerId, practiceId, profile)
	•	**AppointmentTypes** (pk: tenantId#practiceId, code, duration, billing)
	•	**Sessions** (pk: tenantId#providerId, date, slots[...])
	•	**Bookings** (pk: tenantId#bookingId, patientId, slotRef, status, commPrefs)
	•	**Patients** (pk: tenantId#patientId, demographics, contact)
	•	**Recalls** (pk: tenantId#recallId, criteria, status)
	•	**Events** (pk: timeuuid, type, payload) (append-only audit)

**Event Bus (EventBridge)**
	•	Events: BookingCreated, BookingConfirmed, ReminderDue, RecallCreated, MessageDelivered, CallOutcome.

**High-level SAM Snippet (illustrative)**

AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: HotDoc-Alt MVP
Globals:
  Function:
    Runtime: nodejs20.x
    Timeout: 15
    Tracing: Active
    MemorySize: 512
    Environment:
      Variables:
        TABLE_BOOKINGS: !Ref Bookings
Resources:
  Api:
    Type: AWS::Serverless::HttpApi
  GetSlots:
    Type: AWS::Serverless::Function
    Properties:
      Handler: dist/handlers/getSlots.handler
      Policies:
        - DynamoDBReadPolicy:
            TableName: !Ref Sessions
      Events:
        ApiEvent:
          Type: HttpApi
          Properties:
            ApiId: !Ref Api
            Path: /v1/slots
            Method: GET
  Bookings:
    Type: AWS::DynamoDB::Table
    Properties:
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: pk
          AttributeType: S
        - AttributeName: sk
          AttributeType: S
      KeySchema:
        - AttributeName: pk
          KeyType: HASH
        - AttributeName: sk
          KeyType: RANGE


⸻

4) API Contracts (OpenAPI Outline)

/v1/practices
	•	POST /v1/practices — Create practice (admin).
	•	GET /v1/practices?postcode=3000&radiusKm=10 — Search by postcode + distance.
	•	GET /v1/practices/{practiceId} — Details.

/v1/providers
	•	POST /v1/providers — Create GP under a practice.
	•	GET /v1/providers/{providerId} — Profile.

/v1/slots
	•	GET /v1/slots?practiceId=...&providerId=...&from=YYYY-MM-DD&to=YYYY-MM-DD — Available slots (read model precomputed from Sessions).

/v1/bookings
	•	POST /v1/bookings — Create booking (idempotency key).
	•	GET /v1/bookings/{bookingId} — Status.
	•	POST /v1/bookings/{bookingId}/confirm — Confirm & emit BookingConfirmed.

/v1/recalls
	•	POST /v1/recalls — Create recall job (criteria: providerId | cohort | patientIds).
	•	POST /v1/recalls/{recallId}/send — Trigger now.
	•	GET /v1/recalls/{recallId} — Job status, delivery stats.

/v1/reminders
	•	POST /v1/reminders/rules — Upsert reminder rules (timing, channel, template).
	•	GET /v1/reminders/pending?window=24h — Operational probe.

Auth: Cognito JWT bearer; x-tenant-id header required for admin endpoints. Public discovery endpoints (search) are unauthenticated.

Common Schemas (zod/JSON Schema)
	•	Address { line1, suburb, state, postcode, country }
	•	Geo { lat, lng }
	•	Practice { practiceId, name, address, geo, services[], hours[] }
	•	Provider { providerId, name, gender?, languages[], specialties[] }
	•	Slot { slotId, providerId, practiceId, start, end, apptTypeCode }
	•	Booking { bookingId, patientId?, contact, slotRef, status: PENDING|CONFIRMED|CANCELLED }
	•	Recall { recallId, name, criteria, channel, templateId, schedule }

⸻

5) Data & Search Strategy (Postcode + Map)
	•	**Geocoding:** Use Mapbox Geocoding API to convert practice addresses to latitude/longitude; store geo coordinates per practice in DynamoDB.
	•	**Search:** Implement DynamoDB GSI (PracticesByGeo, bucketed by rounded geohash) for efficient proximity search. For MVP, do not use OpenSearch Serverless; DynamoDB GSI is sufficient for radius filtering.
	•	**Map UI:** Use Mapbox GL JS in React for map visualization. Show result list and map markers, cluster for dense areas, and provide filters by service/appointment type.

⸻

6) Reminders & Recalls (Design)

**Reminders**
	•	Rule examples: T-48h email, T-24h SMS, T-2h SMS before appointment.
	•	Scheduler: For each confirmed booking, schedule reminder events at computed times using EventBridge and Step Functions Wait states.
	•	Channels: Email (SES templates), SMS (Pinpoint). Record delivery outcomes in MessageDelivered events in DynamoDB.

**Recalls**
	•	Admin UI: Compose recall (template + audience). Optional approval step for compliance.
	•	Recall delivery worker reads cohort, batches via SQS, and sends via Pinpoint (SMS) or SES (email).
	•	Delivery dashboard: Show sent, delivered, failed; export CSV of recall results.

**Bot Calling**
	•	Minimal viable: Outbound call with TTS message (date/time, press 1 to confirm, 2 to cancel), webhook posts CallOutcome event.
	•	**Amazon Connect:** Implement contact flow and Lambda integration for outbound calls (recommended for MVP). Twilio Voice is fallback only.

⸻

7) Frontend (React + Vite)

**Public App (Patients)**
	•	Pages: Home/Search → Practice Detail → Select Provider/Type → Slots → Book → Confirmation.
	•	Components: PostcodeSearch, MapResults, ProviderCard, SlotPicker, BookingForm.
	•	State management: TanStack Query (React Query). Auth is optional for MVP; patient portal is post-MVP.

**Admin App (Practice)**
	•	Pages: Onboarding Wizard, Providers, Appointment Types, Sessions, Reminders, Recalls.
	•	Components: OnboardingWizard, ProviderForm, SessionEditor, ReminderRuleForm, RecallComposer.

**UI System**
	•	Use Headless UI and Tailwind CSS. Form validation with zod and react-hook-form. Internationalization (i18n) ready.

⸻

8) Developer Experience
	•	Monorepo tooling: pnpm workspaces; TypeScript (strict mode); ESLint and Prettier for linting/formatting.
	•	Testing: Vitest (frontend), Jest (backend), Pact (API consumer tests), k6 (performance smoke), Playwright (E2E for minimal flows).
	•	CI/CD: GitHub Actions (recommended for MVP) to build → run unit tests → run `sam validate` → deploy to dev → manual approval → staging → prod.

⸻

9) Claude Code — Task Queue & Prompts

Use the following tasks verbatim with Claude Code. Each task is self‑contained.

Task A — Bootstrap Monorepo

Goal: Create the monorepo with pnpm, Vite apps, shared packages, and basic SAM.

You are Claude Code acting as a full‑stack engineer. Create a pnpm monorepo with the structure shown in Section 2. Use Vite React for `/web/public` and `/web/admin` with TypeScript and Tailwind. Create `/shared/models` with zod schemas for entities in Section 4. Create `/infra` with a root SAM template and nested stacks skeleton as in Section 3. Initialize GitHub Actions to run unit tests and `sam validate` on PRs.

Task B — Identity & Auth

Goal: Cognito pools + React auth wrappers.

Implement Cognito: two user pools (patients, practice-admins) with hosted UI. Add `AuthProvider` in both React apps. Protect admin routes; add login/logout. Wire environment variables. Provide `getIdToken()` helper for API calls.

Task C — Practices & Providers API

Goal: CRUD endpoints + data models.

Implement Lambda handlers for `POST /v1/practices`, `GET /v1/practices`, `GET /v1/practices/{id}`, `POST /v1/providers`, `GET /v1/providers/{id}` using the SAM API stack. Enforce `x-tenant-id` for admin calls. Add zod validation. Store items in DynamoDB with pk/sk pattern from Section 3.

Task D — Sessions & Slots Read Model

Goal: Generate available slots for search.

Create `Sessions` table and a `slot-projection` Lambda that materializes future `Slot` items for each provider/day. Expose `GET /v1/slots` reading from the projection. Include appointment type duration rules.

Task E — Patient Search + Map UI

Goal: Postcode search with mapping.

In `/web/public`, build `PostcodeSearch` with Mapbox GL JS. Query `/v1/practices?postcode&radiusKm`. Show markers + list; clicking a result shows providers and available appointment types; proceed to `/slots` page with date picker.

Task F — Booking Flow

Goal: Create booking with idempotency + confirmation.

Implement `POST /v1/bookings` with idempotency key header. Reserve slot atomically (conditional write). Send confirmation email via SES using templated message. Add `/confirmation` page in public app.

Task G — Reminder Engine

Goal: Automated reminders via EventBridge + Step Functions.

Create a Step Function `reminder-orchestrator` that receives `BookingConfirmed` events and schedules notifications at T-48h, T-24h, T-2h. Use Wait states, then invoke `notifications` Lambda to send SMS (Pinpoint) or Email (SES). Record `MessageDelivered` / `MessageFailed` events.

Task H — Recalls

Goal: Admin-driven recall creation and send.

Add admin UI to create a Recall with name, template, channel, audience (providerId or CSV upload of patientIds). Store Recall entity; when user clicks Send, fan out to SQS for batched delivery. Track delivery stats.

Task I — PMS Adapter (Mock)

Goal: Adapter interface + mock data sync.

Define `PmsAdapter` interface (listProviders, listSessions, pushBooking). Create a `mock` implementation with scheduled sync (EventBridge rule) populating Sessions. Log discrepancies. Later replace with on‑prem connector for Best Practice.

Task J — Bot Calling Prototype

Goal: Outbound calls and outcome capture.

Add an abstract `VoiceChannel` with methods `placeCall(to, template, data)`. Implement Amazon Connect (or Twilio) version that plays TTS reminder and captures keypad input. Webhook posts `CallOutcome` event which updates Booking status or notes.

Task K — Observability & Ops

Goal: Logging, tracing, dashboards.

Add structured logging with requestId to all Lambdas. Enable X-Ray. Create CloudWatch dashboards for booking rate, reminder sends, delivery outcomes, error rates.


⸻

10) Acceptance Criteria (Per Phase)

**Phase 1**
	•	Admin user can create a new practice and at least one provider via the admin app.
	•	Validation errors are displayed inline in the UI.
	•	Practice and provider data are persisted in DynamoDB and visible in the admin dashboard.
	•	Smoke tests for onboarding flows pass.

**Phase 2**
	•	Patient can search by postcode, see at least three nearby practices on a Mapbox map, view provider and appointment type details, and book an available slot.
	•	Confirmation email is received via SES within 2 minutes of booking.
	•	Slot is reserved atomically (no double-booking).

**Phase 3**
	•	Reminders are sent at configured offsets (T-48h, T-24h, T-2h) for confirmed bookings.
	•	Delivery outcomes are logged and visible in the audit trail/dashboard.
	•	Opt-out requests (STOP) via SMS/email are processed and respected within 24 hours.

**Phase 4**
	•	Session data is populated in DynamoDB by the PMS mock adapter via scheduled sync.
	•	Booking push to PMS adapter is acknowledged (mock implementation logs the event).
	•	Sync logs are accessible in CloudWatch.

**Phase 5**
	•	Automated outbound call is placed via Amazon Connect for at least one test booking.
	•	DTMF response (confirm/cancel) updates the booking status in DynamoDB within 2 minutes.
	•	Call outcome is logged and visible in the admin dashboard.

⸻

11) Sample Templates

SES (confirmation)

Subject: Your appointment with {{providerName}}
Body (text): Hi {{firstName}}, your appointment at {{practiceName}} is confirmed for {{dateTimeLocal}}. Reply STOP to opt out.

Pinpoint (SMS reminder)

Hi {{firstName}}, reminder of your appointment at {{practiceName}} on {{dateTimeLocal}}. Reply C to cancel or STOP to opt out.


⸻

12) Risk & Future Work
	•	Best Practice integration requires on‑prem connectivity and vendor APIs: plan for a secure connector agent with outbound‑only HTTPS.
	•	Payments, telehealth, check‑in kiosk, patient portal, and reviews are explicitly out of scope for MVP.
	•	Accessibility: Target WCAG 2.2 AA compliance for all public-facing UI.

⸻

13) Runbook (Local + Deploy)
	•	Local: pnpm i → pnpm -r build → sam build → sam local start-api.
	•	Deploy: sam deploy --guided with env params. Seed mock data via scripts/seed.ts.

⸻

14) Definition of Done (DoD)
	•	Unit, integration, and E2E smoke tests passing.
	•	Security scan (npm audit, cfn‑nag) clean or waivered.
	•	Dashboards show SLOs: booking p95 < 400ms (read), reminder delivery success > 98%.

⸻

End of claude.md
⸻

15) Glossary

**ABN**: Australian Business Number (unique identifier for businesses in Australia)
**API Gateway**: AWS service for creating and managing APIs
**APPs**: Australian Privacy Principles
**Cognito**: AWS managed authentication and user management service
**DTMF**: Dual-tone multi-frequency (telephone keypad tones)
**DynamoDB**: AWS managed NoSQL database
**E2E**: End-to-end (testing)
**EventBridge**: AWS event bus for application integration and scheduling
**GSI**: Global Secondary Index (DynamoDB)
**IaC**: Infrastructure as Code
**IVR**: Interactive Voice Response
**KMS**: AWS Key Management Service (encryption)
**Lambda**: AWS serverless compute service
**MVP**: Minimum Viable Product
**PMS**: Practice Management System (e.g. Best Practice)
**Pinpoint**: AWS service for SMS/email/push notifications
**PII**: Personally Identifiable Information
**SAM**: AWS Serverless Application Model (IaC framework)
**SES**: Simple Email Service (AWS)
**SLO**: Service Level Objective
**SNS**: Simple Notification Service (AWS)
**SQS**: Simple Queue Service (AWS)
**Step Functions**: AWS service for workflows and orchestration
**T-48h, T-24h, T-2h**: Time offsets before appointment (48/24/2 hours)
**VPC**: Virtual Private Cloud (AWS networking)
**WCAG**: Web Content Accessibility Guidelines

---