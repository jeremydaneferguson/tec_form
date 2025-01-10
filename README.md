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
