# TEC Assessment Form

A React-based form application for Technical and Environmental Committee (TEC) proposal assessments.

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (version 14.0 or higher)
- npm (Node Package Manager) or yarn

## Installation

1. Clone the repository:

```bash
git clone [repository-url]
cd tec-assessment-form
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

## Required Dependencies

The project uses the following key dependencies:

- React
- Tailwind CSS
- shadcn/ui components

## Running the Project

1. Start the development server:

```bash
npm run dev
# or
yarn dev
```

2. Open your browser and navigate to:

```
http://localhost:3000
```

## Project Structure

```
src/
├── app/
│   └── page.tsx
├── components/
│   └── TECAssessmentForm.jsx
└── styles/
    └── globals.css
```

## Features

The TEC Assessment Form includes:

- Multi-step form process
- Form validation
- Progress tracking
- Multiple assessment sections:
  - General Project Background
  - Technical Assessment
  - Documentation Evaluation
  - Safety & Emergency Assessment
  - Financial Evaluation
  - Physical Security Assessment
  - Final Ratings and Comments

## Form Sections

The form is divided into multiple steps:

1. General Project Background
2. Technical Details
3. Assessment & Evaluation
4. Documentation
5. Reviewing Department
6. Final Assessment

## Application version

The portal header and login screen display the version from `package.json`.
`package-lock.json` must contain the same application version.

After a batch of major application changes (new features, workflow changes, or
access-control changes), increment the major version once:

```bash
npm run version:major
```

This advances `1.0.0` to `2.0.0`, then `3.0.0`, and updates both package files
without creating a Git commit or tag. For small fixes, use
`npm version patch --no-git-tag-version`. Rebuild or redeploy to display the new
version. Version increments are based on the changes made, not on each build.

Development output is stored in `.next-dev/`; production builds use `.next/`.
This keeps build checks from overwriting chunks served by `npm run dev`.

Existing Building Area and Proposed Building Area each accept one optional file
(up to 5 MB). Attachments save with the submission, can be downloaded or removed
when editing, and are available in the project summary to authorized viewers.
The current implementation stores attachment contents in the submission's JSON
data, so attachment sizes count toward database and request storage usage.
