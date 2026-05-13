# PostgreSQL Database Setup - Quick Reference

## What Has Been Set Up

Your TEC Assessment Form is now connected to PostgreSQL with Prisma ORM!

### Files Created/Modified:

1. **Prisma Configuration**
   - `prisma/schema.prisma` - Database schema definition
   - `src/lib/prisma.js` - Prisma client singleton

2. **API Endpoint**
   - `src/app/api/submissions/route.js` - API to save/retrieve form data

3. **Updated Form Component**
   - `src/components/TECAssessmentForm.jsx` - Form now saves to database

4. **Environment Configuration**
   - `.env.local` - Database connection string (create this file)

5. **Dependencies Added**
   - `@prisma/client` - ORM client
   - `prisma` - Dev tool for migrations

### How It Works

1. **Form submission** → Saves to PostgreSQL via API
2. **Auto-load** → When you enter your email, previous submission loads
3. **Draft saving** → Changes auto-save with each step
4. **Local storage** → Email remembered in browser

## Next Steps

### 1. Install PostgreSQL
Download from: https://www.postgresql.org/download/

### 2. Create Database
```powershell
psql -U postgres
```
Then in psql:
```sql
CREATE DATABASE tec_form;
\q
```

### 3. Configure Connection
Edit `.env.local`:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/tec_form?schema=public"
```

### 4. Install Dependencies
```powershell
npm install
```

### 5. Create Database Tables
```powershell
npx prisma migrate dev --name init
```

### 6. Start Development Server
```powershell
npm run dev
```

## Database Schema

**TECSubmission Table:**
- `id` - Unique identifier (auto-generated)
- `email` - User email (indexed for fast lookups)
- `formData` - JSON object containing all form fields
- `status` - "draft", "submitted", or "reviewed"
- `createdAt` - When submitted was created
- `updatedAt` - When last updated

## Useful Commands

```powershell
# View database in browser UI
npx prisma studio

# Reset database (deletes all data)
npx prisma migrate reset

# View database status
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

## Features

✅ Auto-save after each form step
✅ Load previous submissions by email
✅ Form data persists in database
✅ Draft status tracking
✅ Indexed queries for performance
✅ JSON storage for flexible form data

## Troubleshooting

**"Database connection refused"**
- Make sure PostgreSQL is running
- Verify DATABASE_URL is correct in .env.local

**"Table does not exist"**
- Run `npx prisma migrate dev`

**"Unknown datasource provider"**
- Make sure you have @prisma/client installed
- Run `npm install` again

## Support

For more information, see [POSTGRES_SETUP.md](./POSTGRES_SETUP.md)
