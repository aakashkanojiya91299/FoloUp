# User Authentication Guide

## Overview

The user routes (`/interview/*` and `/call/*`) are **completely public** and work without any authentication. This allows candidates to access interview links directly from links generated in the dashboard.

## Flow

### 1. Dashboard Flow (Authenticated)
1. **Client logs into dashboard** (`/dashboard`)
2. **Goes to ATS Candidates** (`/dashboard/ats-candidates`)
3. **Generates unique interview link** for a candidate
4. **Shares the link** with the candidate
5. **Views interview details** at `/dashboard/interviews/[interviewId]`

### 2. Candidate Flow (Public - No Authentication)
1. **Candidate receives link** from client
2. **Clicks the link** → Goes to `/interview/[uniqueLinkId]`
3. **Views interview details** and clicks "Start Interview"
4. **Redirects to call interface** → `/call/[interviewId]?link=[uniqueLinkId]`
5. **Completes interview** without any login
6. **Submits feedback** and results are stored

## Changes Made

### 1. Middleware Configuration
- **Public**: `/interview(.*)` routes are completely public
- **Public**: `/call(.*)` routes are completely public
- **Protected**: Only `/dashboard(.*)` routes require authentication
- **Result**: User routes work without any authentication

### 2. Route Structure
- **Dashboard Routes**: `/dashboard/interviews/[interviewId]` - Interview management (protected)
- **User Routes**: `/interview/[uniqueLinkId]` - Candidate landing page (public)
- **Call Routes**: `/call/[interviewId]?link=[uniqueLinkId]` - Interview interface (public)

### 3. User Layout Configuration
- **No Clerk Authentication**: User layout doesn't include ClerkProvider
- **Simplified Providers**: Only includes ResponseProvider for basic functionality
- **Public Access**: No authentication barriers for user routes

### 4. Route Access Levels

#### Public Routes (No Authentication Required)
- **URL**: `/interview/[uniqueLinkId]`
- **Purpose**: Interview landing page for candidates
- **Access**: Completely public - no login required
- **Features**: 
  - Validates unique interview links
  - Shows interview information
  - Redirects to call interface

- **URL**: `/call/[interviewId]?link=[uniqueLinkId]`
- **Purpose**: Main interview interface for candidates
- **Access**: Completely public - no login required
- **Features**:
  - Voice call functionality
  - Real-time transcription
  - Feedback collection
  - No authentication required

#### Protected Routes (Require Authentication)
- **URL**: `/dashboard/*`
- **Purpose**: Admin dashboard for managing interviews
- **Access**: Requires authentication
- **Features**:
  - Create and manage interviews
  - Generate unique links
  - View candidate responses
  - Manage organization settings
  - **Interview Details**: `/dashboard/interviews/[interviewId]`

### 5. API Routes Used by User Functionality

The following API routes are used by user pages and are configured as public:

- `/api/register-call` - Starts voice calls
- `/api/get-call` - Retrieves call data and analytics
- `/api/analyze-communication` - Analyzes communication skills

### 6. Database Operations

User functionality uses Supabase directly without authentication:
- **ResponseService**: Creates and manages interview responses
- **FeedbackService**: Handles feedback submission
- **CandidateInterviewLinkApiService**: Manages unique interview links

## How It Works

### 1. Unique Link System
- Each candidate gets a unique interview link
- Links are validated by unique ID, not user authentication
- Links can have expiration dates and status tracking

### 2. Complete Interview Flow
1. **Dashboard**: Client generates unique link for candidate
2. **Candidate**: Receives link and clicks it
3. **Interview Page**: `/interview/[uniqueLinkId]` - Shows interview details
4. **Start Interview**: Candidate clicks "Start Interview"
5. **Call Interface**: `/call/[interviewId]?link=[uniqueLinkId]` - Voice interview
6. **Complete**: Candidate completes interview without any login
7. **Results**: Stored in database and available to client
8. **Management**: Client views results at `/dashboard/interviews/[interviewId]`

### 3. Data Storage
- All candidate data is stored in Supabase
- Responses are linked to interviews via unique IDs
- No user authentication required for data operations
- Interview management requires authentication (dashboard only)

## Environment Variables Required

For user functionality to work, you need:

```bash
# Database (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Services (Required for analytics)
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key

# Voice Calls (Required)
RETELL_API_KEY=your_retell_key

# App Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Authentication (Required for dashboard only)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

## Security Considerations

### What's Protected
- **Dashboard routes** (`/dashboard/*`) require authentication
- **Admin functionality** requires organization membership
- **Interview creation and management** requires authentication
- **Interview detail pages** (`/dashboard/interviews/[interviewId]`) require authentication

### What's Public
- **Interview pages** (`/interview/*`) are completely public
- **Call interface** (`/call/*`) is completely public
- **Feedback submission** is public
- **Candidate data storage** is public

### Data Isolation
- User data is isolated by unique interview links
- No cross-contamination between different interviews
- Each candidate can only access their specific interview
- Interview management is restricted to authenticated users (dashboard)

## Testing User Routes

### 1. Test Dashboard (Authenticated)
1. Log in to dashboard
2. Go to `/dashboard/ats-candidates`
3. Generate a unique link for a candidate
4. Copy the generated link
5. View interview details at `/dashboard/interviews/[interviewId]`

### 2. Test Candidate Access (No Auth)
1. Use the generated link: `/interview/[uniqueLinkId]`
2. Verify interview details are displayed
3. Click "Start Interview"
4. Complete the interview process
5. Submit feedback

### 3. Verify Data Storage
1. Check Supabase for new response records
2. Verify analytics are generated
3. Confirm feedback is stored

## Troubleshooting

### Common Issues

1. **"Invalid interview link" error**
   - Check if the unique link ID exists in database
   - Verify link hasn't expired
   - Ensure link status is "active"

2. **Call registration fails**
   - Verify `RETELL_API_KEY` is set
   - Check if interviewer agent exists
   - Ensure interview is active

3. **Analytics not generated**
   - Check AI API keys (OpenAI/Gemini)
   - Verify transcript is available
   - Check server logs for errors

4. **Dashboard access issues**
   - Ensure you're logged in
   - Check if you have access to the organization
   - Verify Clerk authentication is working

### Debug Steps
1. Check browser console for errors
2. Verify environment variables are set
3. Test API endpoints directly
4. Check Supabase logs for database errors
5. Verify authentication status for dashboard

## Benefits of This Configuration

1. **Simplified User Experience**: No sign-up required for candidates
2. **Higher Completion Rates**: Reduces friction for candidates
3. **Easy Sharing**: Direct links work immediately
4. **Mobile Friendly**: Works on any device
5. **Scalable**: No user management overhead for candidates
6. **Secure Management**: Dashboard remains protected
7. **Flexible Flow**: Dashboard → Generate Link → Candidate Access
8. **Organized Structure**: Interview management inside dashboard

## Future Considerations

- Consider rate limiting for public routes
- Implement link expiration policies
- Add analytics for user engagement
- Consider optional user registration for follow-up
- Add interview preview functionality in dashboard 
