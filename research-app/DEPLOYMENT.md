# BTK Institute Authentication - Deployment Guide

## Overview

This application implements single-user authentication for the Beyond the Keys Institute research system.

**IMPORTANT:** This is a private, single-user system. There is NO signup, password reset, or user management.

## Canonical User Credentials

```
Email: yotam_ricas@btk.institute
Password: [See FULL EXECUTION BRIEF or environment variable]
```

## Environment Variables

Set the following environment variables in your Netlify deployment:

```bash
# Required - Turso Database
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token-here

# Required - Session Secret (generate a random 64-char string)
SESSION_SECRET=your-random-64-char-secret-key-here

# Optional - Claude AI Integration (v5.2 excludes AI)
# CLAUDE_API_KEY=your-anthropic-api-key-here
```

## Database Setup

### 1. Create Tables

Run the schema creation script:

```bash
# From the research-app directory
turso db shell <your-db-name> < db/schema.sql
```

### 2. Seed the Database

The canonical user must be seeded into the database. You have two options:

#### Option A: Using the seed script (Recommended)

```bash
# Set environment variables first
export TURSO_DATABASE_URL="libsql://your-db.turso.io"
export TURSO_AUTH_TOKEN="your-turso-auth-token-here"

# Install dependencies if needed
npm install

# Run the seed script
npm run seed
```

This script will:
- Create the canonical user with email `yotam_ricas@btk.institute`
- Hash the canonical password securely using bcrypt
- Create the initial document
- Create sample sources for development

#### Option B: Manual SQL seeding

1. Generate a bcrypt hash of the canonical password:

```javascript
// Run this in Node.js REPL
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('Btk!Yotam_Institute#2025', 10);
console.log(hash);
```

2. Replace `{{PASSWORD_HASH_PLACEHOLDER}}` in `db/seed.sql` with the generated hash

3. Run the seed script:

```bash
turso db shell <your-db-name> < db/seed.sql
```

## Deployment Steps

1. **Push to GitHub**
   - Ensure all changes are committed and pushed to your repository

2. **Configure Netlify**
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Set functions directory: `netlify/functions`

3. **Set Environment Variables**
   - In Netlify dashboard, go to Site Settings → Environment Variables
   - Add all required environment variables listed above

4. **Seed the Database**
   - Run the seed script locally (with Turso credentials) OR
   - Manually seed using the SQL method above

5. **Deploy**
   - Trigger a deployment in Netlify
   - Wait for build to complete

## Authentication Flow

### Login
1. User navigates to `/login`
2. Enters email and password
3. Backend validates credentials
4. Returns JWT token (30-day expiry)
5. Token stored in localStorage
6. Redirects to Research Work Screen

### Session Persistence
- Token stored in localStorage survives page refresh and browser close
- Token automatically included in Authorization header for all API requests
- Token validated on server for all protected routes

### Logout
1. User clicks "Logout" button in header
2. Token cleared from localStorage
3. Redirects to Login Screen
4. Document state and content preserved (logout does NOT modify data)

## Security Notes

1. **Password Storage**
   - Password hashed using bcrypt (10 rounds)
   - NEVER store plaintext password

2. **Token Management**
   - JWT tokens signed with SESSION_SECRET
   - 30-day expiration
   - Tokens validated on every request

3. **No Credentials in Code**
   - Canonical password NOT stored in repository
   - Only referenced in deployment documentation
   - Stored as environment variable or used in seed script

4. **Single User System**
   - No signup endpoint
   - No password reset
   - No email verification
   - No user management UI

## Testing

After deployment, test the authentication flow:

1. Navigate to your deployed URL
2. You should be redirected to `/login`
3. Enter the canonical credentials
4. Should redirect to Research Work Screen
5. Refresh page - should remain logged in
6. Close browser and reopen - should remain logged in
7. Click Logout - should return to Login Screen
8. Try to access `/` without logging in - should redirect to `/login`

## Troubleshooting

### Login fails with "Invalid credentials"
- Verify the database was seeded correctly
- Check that email matches exactly: `yotam_ricas@btk.institute`
- Verify password is correct

### Token validation fails
- Check SESSION_SECRET is set in environment variables
- Ensure SESSION_SECRET is the same value used to sign tokens

### Database connection errors
- Verify TURSO_DATABASE_URL is correct
- Verify TURSO_AUTH_TOKEN is valid and has write permissions

### 401 Unauthorized on API requests
- Check token is being stored in localStorage
- Check Authorization header is being sent
- Verify token is not expired
