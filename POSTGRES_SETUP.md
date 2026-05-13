# PostgreSQL Setup Guide for TEC Form

## Prerequisites

1. **Install PostgreSQL** (if not already installed)
   - Download from: https://www.postgresql.org/download/windows/
   - During installation, remember the password you set for the `postgres` user

## Setup Steps

### 1. Create Database
Open PowerShell or Command Prompt and run:

```powershell
# Connect to PostgreSQL (you'll be prompted for password)
psql -U postgres

# In psql prompt, create the database:
CREATE DATABASE tec_form;

# Exit psql:
\q
```

### 2. Update Environment Variables
Edit `.env.local` with your PostgreSQL credentials:

```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/tec_form?schema=public"
```

Replace `YOUR_PASSWORD` with the password you set during PostgreSQL installation.

### 3. Install Dependencies
```powershell
npm install
```

### 4. Initialize Prisma (Create Migration)
```powershell
# Generate Prisma client
npx prisma generate

# Create initial migration
npx prisma migrate dev --name init
```

### 5. Start Development Server
```powershell
npm run dev
```

Visit `http://localhost:3000` - your form is now connected to PostgreSQL!

## Useful Prisma Commands

```powershell
# View database in browser UI
npx prisma studio

# Reset database (removes all data)
npx prisma migrate reset

# Check database status
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

## Troubleshooting

**"Error: connect ECONNREFUSED"**
- Make sure PostgreSQL is running
- Verify DATABASE_URL in .env.local is correct
- Check postgres user password

**"Database does not exist"**
- Follow step 1 to create the database

**"Error: relation does not exist"**
- Run `npx prisma migrate dev` to create tables

## Data Structure

The form submission is stored with:
- `id`: Unique identifier
- `email`: User's email (indexed for fast lookup)
- `formData`: JSON object containing all form fields
- `status`: draft, submitted, or reviewed
- `createdAt`: When the submission was created
- `updatedAt`: Last updated timestamp
