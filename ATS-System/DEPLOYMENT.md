# ATS Backend Deployment Guide

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)
Deploy as a separate Vercel project alongside your frontend.

### Option 2: Railway
Good for Node.js applications with file upload support.

### Option 3: Render
Free tier available, good for Node.js apps.

### Option 4: DigitalOcean App Platform
More control, but requires more setup.

---

## 📋 Pre-deployment Checklist

### Environment Variables Required:
```bash
# AI Services
GEMINI_API_KEY=your_gemini_api_key

# Server Configuration
PORT=4000
NODE_ENV=production

# CORS (if needed)
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
```

### File Upload Considerations:
- Vercel has a 4.5MB file size limit for serverless functions
- For larger files, consider using external storage (AWS S3, Cloudinary)
- Current setup uses local storage which won't persist on Vercel

---

## 🚀 Vercel Deployment Steps

### 1. Prepare the Repository
```bash
# Navigate to ATS-System directory
cd ATS-System

# Install dependencies
npm install

# Test build
npm run build
```

### 2. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (first time)
vercel

# For production
vercel --prod
```

### 3. Configure Environment Variables
In Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all required variables

### 4. Update Frontend Configuration
Update your frontend to use the new ATS backend URL:

```typescript
// In your frontend API calls
const ATS_BASE_URL = process.env.NEXT_PUBLIC_ATS_URL || 'https://your-ats-backend.vercel.app';

// Example API call
const response = await fetch(`${ATS_BASE_URL}/api/match`, {
  method: 'POST',
  body: formData
});
```

---

## 🔧 File Upload Optimization

### Current Issue:
Vercel serverless functions have limitations for file uploads.

### Solutions:

#### Option A: Use External Storage
```typescript
// Example with Cloudinary
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload to Cloudinary instead of local storage
const result = await cloudinary.uploader.upload(file.path);
```

#### Option B: Use Vercel Blob Storage
```typescript
import { put } from '@vercel/blob';

// Upload to Vercel Blob
const { url } = await put(file.name, file, {
  access: 'public',
});
```

#### Option C: Use Supabase Storage
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Upload to Supabase Storage
const { data, error } = await supabase.storage
  .from('resumes')
  .upload(`${Date.now()}-${file.name}`, file);
```

---

## 🧪 Testing Deployment

### Health Check
```bash
curl https://your-ats-backend.vercel.app/health
```

### Test File Upload
```bash
curl -X POST \
  -F "resume=@test-resume.pdf" \
  -F "jd=@test-jd.pdf" \
  https://your-ats-backend.vercel.app/api/match
```

---

## 🔍 Monitoring & Debugging

### Vercel Logs
```bash
# View function logs
vercel logs

# View real-time logs
vercel logs --follow
```

### Common Issues:
1. **File size too large**: Use external storage
2. **Timeout errors**: Optimize AI API calls
3. **CORS errors**: Configure allowed origins
4. **Memory limits**: Optimize file processing

---

## 📊 Performance Optimization

### 1. File Processing
```typescript
// Stream large files instead of loading into memory
import { createReadStream } from 'fs';

const stream = createReadStream(filePath);
// Process stream instead of full file
```

### 2. AI API Optimization
```typescript
// Add timeout and retry logic
const response = await axios.post(url, data, {
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});
```

### 3. Caching
```typescript
// Cache processed results
const cacheKey = `${md5(jdText)}-${md5(resumeText)}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

---

## 🔐 Security Considerations

### 1. File Validation
```typescript
// Validate file types and sizes
const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const maxSize = 5 * 1024 * 1024; // 5MB

if (!allowedTypes.includes(file.mimetype) || file.size > maxSize) {
  throw new Error('Invalid file type or size');
}
```

### 2. Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api', limiter);
```

### 3. API Key Security
```typescript
// Validate API keys
if (!process.env.GEMINI_API_KEY) {
  throw new Error('Missing required API key');
}
```

---

## 🚀 Alternative Deployment Options

### Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Render Deployment
1. Connect GitHub repository
2. Set build command: `npm install && npm run build`
3. Set start command: `npm start`
4. Configure environment variables

### DigitalOcean App Platform
1. Create new app from GitHub
2. Select Node.js environment
3. Configure build and run commands
4. Set environment variables

---

## 📞 Support

For deployment issues:
1. Check Vercel logs: `vercel logs`
2. Test locally: `npm run dev`
3. Verify environment variables
4. Check file upload limits 
