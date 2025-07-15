# AI Provider Database Integration

## Overview

The AI provider selection is now persisted in the database, ensuring that user preferences are maintained across sessions and server restarts.

## Database Schema

### Table: `ai_provider_preferences`

```sql
CREATE TABLE ai_provider_preferences (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    organization_id TEXT REFERENCES organization(id),
    user_id TEXT REFERENCES "user"(id),
    preferred_provider ai_provider DEFAULT 'openai',
    is_active BOOLEAN DEFAULT true,
    UNIQUE(organization_id, user_id)
);
```

### Enum: `ai_provider`

```sql
CREATE TYPE ai_provider AS ENUM ('openai', 'gemini');
```

## Setup Instructions

### 1. Run the Migration

Execute the migration script in your Supabase SQL editor:

```sql
-- Copy and paste the contents of migrations/add_ai_provider_preferences.sql
```

Or run it via the Supabase CLI:

```bash
supabase db push
```

### 2. Verify the Table

Check that the table was created successfully:

```sql
SELECT * FROM ai_provider_preferences LIMIT 5;
```

## How It Works

### **Priority Order**
1. **Database Preference**: User's saved preference in the database
2. **In-Memory Provider**: Current provider in the AI service
3. **Environment Variable**: `AI_PROVIDER` from `.env.local`

### **API Flow**

#### **GET /api/ai-provider**
1. Check if user is authenticated
2. Look up user's preference in database
3. Return database preference or fallback to in-memory

#### **POST /api/ai-provider**
1. Validate the provider (openai/gemini)
2. Update in-memory provider
3. Save preference to database
4. Return success response

#### **POST /api/generate-interview-questions**
1. Get current provider from database (if available)
2. Fallback to in-memory provider
3. Use the provider for question generation
4. Return which provider was used

## Benefits

### **Persistence**
- ✅ Provider preferences survive server restarts
- ✅ User preferences are maintained across sessions
- ✅ Organization-wide preferences can be set

### **Reliability**
- ✅ Fallback mechanisms ensure the system always works
- ✅ Graceful degradation if database is unavailable
- ✅ No interruption to user experience

### **Scalability**
- ✅ Supports multiple users and organizations
- ✅ Efficient database queries with indexes
- ✅ Soft deletes for data integrity

## Usage Examples

### **Setting a Preference**
```typescript
// This happens automatically when user switches providers
await AIProviderPreferencesService.setPreference(
  "org_123", 
  "user_456", 
  "gemini"
);
```

### **Getting a Preference**
```typescript
const preference = await AIProviderPreferencesService.getPreference(
  "org_123", 
  "user_456"
);
// Returns: { preferred_provider: "gemini", ... }
```

### **Organization Preference**
```typescript
const orgPreference = await AIProviderPreferencesService.getOrganizationPreference(
  "org_123"
);
```

## Error Handling

### **Database Unavailable**
- System falls back to in-memory provider
- User experience is not interrupted
- Errors are logged for monitoring

### **Invalid Provider**
- API returns 400 error
- Clear error message to user
- No database changes made

### **Authentication Issues**
- API returns 401 error
- User must be logged in to save preferences
- Anonymous users can still use the system

## Monitoring

### **Database Queries**
Monitor these queries for performance:

```sql
-- Check user preferences
SELECT * FROM ai_provider_preferences 
WHERE organization_id = 'org_123' 
AND user_id = 'user_456';

-- Check organization usage
SELECT preferred_provider, COUNT(*) 
FROM ai_provider_preferences 
WHERE organization_id = 'org_123' 
GROUP BY preferred_provider;
```

### **Logs to Watch**
- `AI Provider API: Saved preference to database`
- `API: Using DB preference: gemini`
- `Failed to save preference to database`

## Troubleshooting

### **Preference Not Saving**
1. Check user authentication
2. Verify organization ID exists
3. Check database connection
4. Review console logs

### **Wrong Provider Being Used**
1. Check database preference
2. Verify in-memory provider
3. Check environment variables
4. Review API logs

### **Performance Issues**
1. Check database indexes
2. Monitor query performance
3. Consider caching if needed
4. Review connection pooling

## Future Enhancements

- [ ] Provider usage analytics
- [ ] Cost tracking per provider
- [ ] Organization-wide provider policies
- [ ] Provider performance metrics
- [ ] Automatic provider selection based on usage patterns 
