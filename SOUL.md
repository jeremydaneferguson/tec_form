# SOUL.md — TEC Assessment Form

This document captures the identity, purpose, and working knowledge for the TEC Assessment Form project. It serves as a guide for developers and AI agents maintaining or extending this system.

## 1. Project Identity

**Project Name:** TEC Assessment Form

**Purpose:** A web-based form application that streamlines the Technical and Environmental Committee (TEC) proposal assessment process by providing a structured, multi-step form for evaluating proposals across technical, financial, safety, and documentation dimensions.

**Intended Users:**
- TEC committee members and proposal reviewers
- Proposal submitters preparing detailed assessments
- Project managers tracking proposal evaluations

**Problem Being Addressed:**
- Proposal assessment was previously manual and error-prone
- Assessors had no way to save drafts and return later
- Form data was lost if the browser was closed or the session expired
- No centralized record of assessments existed

**Value of the System:**
- **Efficiency:** Reduces manual form handling and transcription errors
- **Persistence:** Users can save progress and return later without losing work
- **Data Integrity:** Centralizes assessment data in a database for auditing and reporting
- **User Experience:** Clear multi-step progression with visual feedback on save status

---

## 2. Project Vision

This project aims to become a reliable, user-friendly assessment platform that:

- **Enables efficient evaluation workflows** by guiding users through structured assessment steps with clear progress indication
- **Preserves user work** through automatic and manual save functionality, ensuring no data loss
- **Maintains data quality** by storing all assessments in a central PostgreSQL database with proper indexing and audit trails
- **Provides a foundation for future features** such as reviewer assignments, reporting dashboards, and workflow integrations

As the project grows, it should:
- Remain focused on the assessment workflow (not become a general-purpose form builder)
- Maintain backwards compatibility with existing assessment data
- Keep the form structure and database schema simple enough for non-technical users to understand
- Support additions like review workflows, approvals, and analytics without major refactoring

---

## 3. Core Objectives

1. **Enable Draft Saving**
   - Users must be able to save incomplete assessments and return later
   - Why: Assessments are lengthy (17 steps); forcing completion in one session is unrealistic

2. **Ensure Data Persistence**
   - All form data must be stored durably in PostgreSQL
   - Auto-save on each step progression minimizes data loss risk
   - Why: Assessment data is valuable for historical record-keeping and auditing

3. **Provide User-Friendly Progress Tracking**
   - Users can see which step they're on and how many remain
   - Save status feedback shows success or error states
   - Why: Long forms can feel overwhelming; clear progress reduces abandonment

4. **Maintain Form Submission Integrity**
   - Form submissions are tied to user email for identity and draft recovery
   - Status field tracks submission lifecycle (draft, submitted, reviewed)
   - Why: Email provides a natural user identifier without requiring authentication

5. **Support Multi-Step Assessment Structure**
   - 17 distinct steps covering all dimensions of proposal evaluation
   - Each step collects specific data in a logically organized manner
   - Why: TEC assessments have established review categories; structure mirrors institutional process

---

## 4. Key Users and Stakeholders

### Primary Users: Assessment Reviewers
- **What they care about:** Ability to complete assessments without losing work, clear next steps, knowing when data was last saved
- **Interaction pattern:** Access form via browser, fill in fields for their assigned section, save and close, return later to continue

### Secondary Users: Proposal Submitters
- **What they care about:** Feedback on form progress, confirmation that their submission was received
- **Interaction pattern:** May use form for initial proposal submission or resubmission of assessments

### Technical Stakeholders: System Administrators
- **What they care about:** Database reliability, backup/recovery procedures, ability to debug issues
- **Responsibilities:** PostgreSQL setup, environment configuration, monitoring database health

### Business Stakeholders: TEC Leadership
- **What they care about:** Data integrity, ability to retrieve historical assessments, audit trails
- **Future needs:** Analytics on assessment patterns, integration with other institutional systems

---

## 5. System Overview

### Application Flow

```
User enters email
       ↓
Form loads (checks localStorage for email, fetches last draft from API)
       ↓
User fills in fields across 17 steps
       ↓
On "Next Step" or manual "Save": formData is POSTed to /api/submissions
       ↓
API checks if draft exists for that email:
   - If yes: UPDATE existing draft
   - If no: CREATE new draft
       ↓
User can navigate back/forward through steps
       ↓
On "Submit": Form data stays in database with status tracking
```

### Main Components

- **TECAssessmentForm.jsx** (React Component)
  - Manages 17-step form UI
  - Maintains `formData` state for all form fields
  - Handles auto-save on step progression
  - Loads previous submissions on mount via API

- **API Route: /api/submissions** (Next.js Route Handler)
  - **POST:** Accepts email + formData, creates or updates TECSubmission in database
  - **GET:** Retrieves latest submission by email query parameter
  - Minimal business logic; primarily delegates to Prisma

### Data Flow

```
Frontend (React)
    ↓
fetch() calls to /api/submissions
    ↓
API Route Handler (route.js)
    ↓
Prisma Client (lib/prisma.js)
    ↓
PostgreSQL Database
```

### Key Design Patterns

1. **Singleton Prisma Client** (src/lib/prisma.js)
   - Prevents connection leaks in Next.js development mode
   - Single global instance shared across all API calls
   - Critical for proper database connection pooling

2. **Email-Based User Identification**
   - No authentication system; email serves as form identifier
   - Allows anonymous submissions while maintaining draft recovery
   - Email stored in localStorage for auto-population on return visits

3. **JSON Data Storage**
   - formData stored as PostgreSQL JSON type for flexibility
   - Allows new form fields to be added without schema migrations
   - Trade-off: Less structured queries possible; rely on application logic for validation

4. **Auto-Save with Status Feedback**
   - Every step progression triggers saveFormData()
   - setIsSaving and setSaveStatus provide UI feedback
   - Status message auto-clears after 2 seconds

---

## 6. Technology Stack

### Frontend
- **Next.js** 15.1.7 — React framework with file-based routing
- **React** 19.0.0-rc — UI library with hooks for state management
- **Tailwind CSS** 3.4.1 — Utility-first CSS framework for styling
- **shadcn/ui** 0.0.4 — Headless UI component library (minimal use in current implementation)

### Backend
- **Next.js Route Handlers** — API layer at /app/api/submissions/route.js
- **Node.js** — JavaScript runtime (version per package.json constraints)

### Database & ORM
- **PostgreSQL** — Relational database for persistent storage
- **Prisma** 5.8.0 — ORM and query builder
  - Provides type-safe database access
  - Handles schema migrations
  - Includes built-in connection pooling

### Development Tools
- **ESLint** — Code quality linting (Next.js standard config)
- **PostCSS** — CSS transformations (required for Tailwind)
- **npm** — Package manager

### Build & Deployment
- **npm run build** → Compiles Next.js app
- **npm run dev** → Local development server on port 3000
- **npm run start** → Runs production-built app

### Important Version Notes
- **React 19 RC:** Uses pre-release version; monitor for breaking changes in stable release
- **PostgreSQL 12+:** Supports JSON type and modern features; tested on local Windows installations
- **Prisma 5.8.0:** Uses new generated client structure; migrations use `prisma migrate` commands

---

## 7. Project Structure

```
tec-form/
├── SOUL.md
│   Purpose: This file. Project memory and guide for developers and AI agents.
│
├── README.md
│   Purpose: User-facing installation and feature overview.
│
├── package.json
│   Purpose: Node.js dependencies and npm scripts.
│   Notes: Includes Prisma as dev dependency; @prisma/client as production dependency.
│
├── jsconfig.json
│   Purpose: JavaScript path aliases. Maps @/* to ./src/*.
│   Notes: Enables clean imports like @/components instead of ../../../components.
│
├── next.config.mjs
│   Purpose: Next.js configuration. Currently empty (uses all defaults).
│   Notes: Safe to add middleware, custom webpack config, or experimental features here.
│
├── tailwind.config.js
│   Purpose: Tailwind CSS customization (colors, spacing, plugins).
│   Notes: Current config uses Tailwind defaults; add custom design tokens here if needed.
│
├── postcss.config.mjs
│   Purpose: PostCSS configuration for Tailwind and autoprefixer.
│   Notes: Should not need modification unless adding CSS processing plugins.
│
├── .gitignore
│   Purpose: Git ignore patterns. Excludes node_modules, .next, .env files, etc.
│   Notes: Pay special attention to .env.local (contains sensitive DB credentials).
│   Current Issue Fixed: Changed *.next/ to .next/ so the directory is properly ignored.
│
├── .env.local (NOT in Git)
│   Purpose: Local environment variables for database connection.
│   Content: DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/tec_form?schema=public"
│   Notes: Must be created manually; example: .env.example could be added.
│
├── prisma/
│   ├── schema.prisma
│   │   Purpose: Database schema definition in Prisma DSL.
│   │   Content: Single TECSubmission model with email, formData, status, timestamps.
│   │   Notes: Indexes on email, status, createdAt for performance.
│   │
│   └── migrations/ (auto-generated)
│       Purpose: Version-controlled database migration history.
│       Notes: Created by `prisma migrate dev`; one per schema change.
│
├── src/
│   ├── app/
│   │   ├── page.js
│   │   │   Purpose: Home page route. Renders TECAssessmentForm component.
│   │   │   Content: "use client" directive; minimal wrapper.
│   │   │
│   │   ├── layout.js
│   │   │   Purpose: Root layout for all pages. Sets metadata and applies global fonts.
│   │   │   Notes: Update metadata.title for SEO; add <head> tags if needed.
│   │   │
│   │   ├── globals.css
│   │   │   Purpose: Global styles. Imports Tailwind and sets base styles.
│   │   │   Notes: Keep minimal; prefer Tailwind utility classes in components.
│   │   │
│   │   ├── fonts/
│   │   │   Purpose: Local font files (Geist Sans and Mono).
│   │   │   Notes: Loaded via next/font/local in layout.js.
│   │   │
│   │   └── api/
│   │       └── submissions/
│   │           └── route.js
│   │               Purpose: API endpoint for form data persistence.
│   │               Methods: POST (save/update), GET (retrieve by email)
│   │               Notes: Returns JSON; no authentication. Email is query param on GET.
│   │
│   ├── components/
│   │   └── TECAssessmentForm.jsx
│   │       Purpose: Main form component. Handles 17-step form UI and state.
│   │       Size: Large component (700+ lines). Candidate for refactoring into smaller pieces.
│   │       State: currentStep, formData, email, isSaving, saveStatus.
│   │       Key Functions: loadFormData, saveFormData, updateField.
│   │       Notes: Uses React hooks (useState, useEffect). Client component ("use client").
│   │
│   └── lib/
│       └── prisma.js
│           Purpose: Singleton Prisma client. Prevents connection leaks in dev mode.
│           Pattern: Global instance stored in global object (not exported each time).
│           Notes: CRITICAL for development; always use this pattern.
│
├── public/
│   Purpose: Static assets served at root (favicon.ico, etc.).
│   Notes: Next.js automatically serves from here.
│
├── POSTGRES_SETUP.md
│   Purpose: Detailed PostgreSQL installation and setup guide.
│   Audience: Developers setting up the project locally.
│   Content: Prerequisites, Windows setup steps, migration commands, troubleshooting.
│
├── DATABASE_SETUP_QUICK_REFERENCE.md
│   Purpose: Quick checklists for database setup and useful commands.
│   Audience: Quick reference for recurring tasks.
│
└── API_DOCUMENTATION.md
    Purpose: API endpoint specs, request/response examples, cURL commands, error handling.
    Audience: Developers integrating with the API.
    Notes: Keep in sync with actual API routes.
```

---

## 8. Important Patterns and Conventions

### Form Field Management
- All form fields are stored in a single `formData` object
- Updates via `updateField(fieldName, value)` helper function
- No individual useState for each field (keeps state management clean)

### Database Queries
- Always use Prisma client from `@/lib/prisma`
- Use `prisma.tECSubmission` for database operations (note camelCase normalization)
- Always handle errors with try/catch; return meaningful error messages

### Component Structure
- Client components use "use client" directive at the top
- Server components are default; use for data fetching if possible (currently all in API routes)
- Keep large components focused on single responsibility (form UI is an exception for now)

### Environment Variables
- DATABASE_URL is the only required env var for local development
- All other configuration is hardcoded (can be refactored as needed)
- Never commit .env.local; use .env.example instead (not yet created)

---

## 9. Known Limitations and Future Work

### Current Limitations
1. **No Authentication**
   - Form is publicly accessible
   - Email-based identification is not secure for production
   - Future: Add OAuth or session-based authentication

2. **Monolithic Form Component**
   - TECAssessmentForm.jsx is large (~700 lines)
   - Difficult to test individual steps
   - Future: Split into separate step components or use a form library (react-hook-form, Formik)

3. **No Form Validation**
   - Only HTML5 required attributes; no server-side validation
   - Invalid data can be saved to database
   - Future: Add Zod or Yup for schema validation

4. **Limited Error Handling**
   - API errors show generic messages to user
   - No retry logic for failed saves
   - Future: Implement exponential backoff, offline queue

5. **No Dashboard or Analytics**
   - Assessments are stored but not accessible via UI
   - No way to view, filter, or export submissions
   - Future: Add admin dashboard with query/reporting capabilities

### Possible Future Enhancements
- [ ] Multi-user review workflows with approvals
- [ ] Real-time collaboration (multiple users on same form)
- [ ] Export to PDF or other formats
- [ ] Email notifications on form submission
- [ ] Role-based access control (reviewer, submitter, admin)
- [ ] Form versioning (track changes across edits)
- [ ] Integration with institutional directories or SSO

---

## 10. Development Workflow

### Setting Up Locally

1. Install PostgreSQL (see POSTGRES_SETUP.md)
2. Create tec_form database and user
3. Clone repo and run `npm install`
4. Create `.env.local` with DATABASE_URL
5. Run `npx prisma migrate dev --name init` to create tables
6. Run `npm run dev` to start dev server

### Running Tests

Currently no test suite exists. Future tests should cover:
- Form field updates and save logic
- API endpoint request/response validation
- Database queries via Prisma
- Component lifecycle and data loading

### Code Style

- Use ESLint Next.js config as guide
- Prefer functional components with hooks
- Use Tailwind utility classes; avoid custom CSS when possible
- Keep function names descriptive (saveFormData, not save)

### Debugging

- **Frontend:** Browser DevTools (React DevTools extension helpful)
- **Backend:** Check server logs in terminal running `npm run dev`
- **Database:** Use psql CLI or GUI tool (pgAdmin, DBeaver) to inspect data
- **Prisma:** Use `npx prisma studio` to browse and edit database via web UI

---

## 11. Contact and Context

**Last Updated:** May 13, 2026

**Recent Work:**
- Integrated PostgreSQL + Prisma for form data persistence
- Created API endpoints for save/retrieve operations
- Added auto-save functionality to form component
- Created comprehensive setup and API documentation

**Git Branch:** main-joel (track any ongoing feature branches)

**Questions?**
- Start with README.md for installation overview
- See POSTGRES_SETUP.md for database troubleshooting
- Check API_DOCUMENTATION.md for endpoint details
- Review this SOUL.md for architectural decisions
