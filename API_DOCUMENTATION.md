# TEC Form API Documentation

## Endpoints

### POST `/api/submissions`
Save or update a form submission.

**Request:**
```json
{
  "email": "user@example.com",
  "formData": {
    "projectName": "New Building",
    "client": "Engineering Department",
    "contactName": "John Doe",
    "date": "2026-05-13",
    "title": "Mr",
    "projectType": "renovation"
  }
}
```

**Response (Success):**
```json
{
  "id": "unique-id-123",
  "email": "user@example.com",
  "formData": {...},
  "status": "draft",
  "createdAt": "2026-05-13T10:00:00Z",
  "updatedAt": "2026-05-13T10:15:00Z"
}
```

**Response (Error):**
```json
{
  "error": "Email is required"
}
```

**Status Codes:**
- `201` - Submission created/updated successfully
- `400` - Bad request (missing email)
- `500` - Server error

---

### GET `/api/submissions?email=user@example.com`
Retrieve the latest form submission for a user.

**Query Parameters:**
- `email` (required) - User's email address

**Response (Success):**
```json
{
  "id": "unique-id-123",
  "email": "user@example.com",
  "formData": {...},
  "status": "draft",
  "createdAt": "2026-05-13T10:00:00Z",
  "updatedAt": "2026-05-13T10:15:00Z"
}
```

**Response (Error):**
```json
{
  "error": "Submission not found"
}
```

**Status Codes:**
- `200` - Submission retrieved successfully
- `400` - Bad request (missing email parameter)
- `404` - No submission found for email
- `500` - Server error

---

## Usage Examples

### JavaScript/Fetch

**Save Form Data:**
```javascript
const saveSubmission = async (email, formData) => {
  const response = await fetch('/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, formData })
  });
  return response.json();
};

// Usage
await saveSubmission('user@example.com', { projectName: 'New Project' });
```

**Load Form Data:**
```javascript
const loadSubmission = async (email) => {
  const response = await fetch(`/api/submissions?email=${encodeURIComponent(email)}`);
  if (response.ok) {
    return response.json();
  }
  return null;
};

// Usage
const submission = await loadSubmission('user@example.com');
```

### cURL

**Save:**
```bash
curl -X POST http://localhost:3000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","formData":{"projectName":"Test"}}'
```

**Retrieve:**
```bash
curl http://localhost:3000/api/submissions?email=user@example.com
```

---

## Form Data Structure

The `formData` field can contain any JSON object. Common fields include:

```javascript
{
  // Personal Information
  email: "user@example.com",
  projectName: "Project Name",
  client: "Department/Unit",
  contactName: "John Doe",
  date: "2026-05-13",
  title: "Mr|Mrs|Ms|Dr|Professor|Other",
  
  // Project Details
  projectType: "renovation|refurbishment|demolition|addition|reinstatement|infrastructure|other",
  
  // Technical Information
  description: "...",
  locationMetrics: "...",
  buildingCoordinates: "GPS coordinates",
  proposedArea: "Area in sq ft",
  siteAnalysis: "...",
  
  // And more fields as per form sections
}
```

---

## Status Field

- `draft` - Form is incomplete/being edited
- `submitted` - Form has been finalized and submitted
- `reviewed` - Form has been reviewed by administration

---

## Error Handling

Always check the response status and error field:

```javascript
try {
  const response = await fetch('/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, formData })
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Error:', error.error);
    return;
  }
  
  const data = await response.json();
  console.log('Success:', data);
} catch (error) {
  console.error('Network error:', error);
}
```

---

## Database Queries

If you need to query the database directly using Prisma:

```javascript
import { prisma } from '@/lib/prisma';

// Get all submissions
const allSubmissions = await prisma.tECSubmission.findMany();

// Get by email
const submission = await prisma.tECSubmission.findFirst({
  where: { email: 'user@example.com' }
});

// Update status
await prisma.tECSubmission.update({
  where: { id: 'submission-id' },
  data: { status: 'submitted' }
});

// Delete
await prisma.tECSubmission.delete({
  where: { id: 'submission-id' }
});
```
