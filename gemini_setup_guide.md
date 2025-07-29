# Gemini API Setup & Troubleshooting Guide

## 🚨 **Most Common Issues & Solutions**

### **1. Missing API Key**

**Problem:** `GEMINI_API_KEY` environment variable is not set.

**Solution:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)
5. Add to your `.env.local` file:

```bash
# Add this to your .env.local file
GEMINI_API_KEY=AIzaSyC...your_actual_key_here
```

### **2. Invalid API Key**

**Problem:** API key is incorrect or expired.

**Solution:**
1. Check your API key format (should start with `AIza`)
2. Verify the key is active in Google AI Studio
3. Create a new key if needed

### **3. Quota Exceeded**

**Problem:** You've reached your Gemini API limits.

**Solution:**
1. Check your usage in [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Upgrade your plan if needed
3. Wait for quota reset (usually monthly)

### **4. Model Not Available**

**Problem:** The Gemini model specified doesn't exist.

**Solution:**
The code automatically maps to correct models:
- `gpt-4o` → `gemini-2.0-flash`
- `gpt-4` → `gemini-2.0-flash`
- `gpt-3.5-turbo` → `gemini-2.0-flash`

### **5. Network/Region Issues**

**Problem:** API calls failing due to network or region restrictions.

**Solution:**
1. Check your internet connection
2. Try using a VPN if you're in a restricted region
3. Verify Google AI Studio is accessible in your region

## 🔧 **Step-by-Step Setup**

### **Step 1: Get Gemini API Key**

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

### **Step 2: Add to Environment**

Add to your `.env.local` file:

```bash
# Gemini Configuration
GEMINI_API_KEY=AIzaSyC...your_actual_key_here

# Optional: Set Gemini as default
AI_PROVIDER=gemini
```

### **Step 3: Restart Your Application**

```bash
# Stop your development server (Ctrl+C)
# Then restart
npm run dev
# or
yarn dev
```

### **Step 4: Test the Setup**

Try switching to Gemini in your application:
1. Go to the interview creation page
2. Switch to "Google Gemini" provider
3. Try generating questions

## 🐛 **Debugging Steps**

### **Check Environment Variables**

```bash
# Check if GEMINI_API_KEY is set
echo $GEMINI_API_KEY

# Check your .env.local file
cat .env.local | grep GEMINI
```

### **Test API Key Manually**

```bash
# Test with curl (replace YOUR_API_KEY)
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello, how are you?"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=YOUR_API_KEY"
```

### **Check Application Logs**

Look for these error messages in your console:
- `"GEMINI_API_KEY environment variable is not set"`
- `"Invalid API key"`
- `"Quota exceeded"`

## 🔄 **Fallback Behavior**

The application includes automatic fallback:
1. If Gemini fails, it automatically tries OpenAI
2. If both fail, you'll get an error message
3. You can manually switch providers in the UI

## 💰 **Cost & Quotas**

### **Free Tier Limits**
- **Gemini 1.5 Pro**: 15 requests per minute
- **Gemini 1.5 Flash**: 60 requests per minute
- **Monthly quota**: Varies by region

### **Pricing (as of 2024)**
- **Gemini 1.5 Pro**: $3.50 per 1M input tokens, $10.50 per 1M output tokens
- **Gemini 1.5 Flash**: $0.075 per 1M input tokens, $0.30 per 1M output tokens

## 🆘 **Still Having Issues?**

### **1. Check Google AI Studio Status**
Visit [Google AI Studio Status](https://status.ai.google.dev/) for any service issues.

### **2. Verify API Key Permissions**
Make sure your API key has the necessary permissions for Gemini models.

### **3. Try Different Model**
The application automatically uses `gemini-2.0-flash`. If that fails, try manually specifying a different model.

### **4. Contact Support**
If none of the above work, the issue might be:
- Account-specific restrictions
- Region-specific limitations
- Temporary service issues

## 📞 **Quick Fix Checklist**

- [ ] API key is set in `.env.local`
- [ ] API key starts with `AIza`
- [ ] API key is active in Google AI Studio
- [ ] Application has been restarted
- [ ] No quota exceeded errors
- [ ] Internet connection is stable 
