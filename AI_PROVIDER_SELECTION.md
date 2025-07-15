# AI Provider Selection in Create Interview

## Overview

The Create Interview page now includes an AI provider selector that allows users to choose between OpenAI and Google Gemini before generating interview questions.

## Features

### 🎯 **Provider Selection**

- **OpenAI GPT-4**: High-quality responses with GPT-4 (higher cost)
- **Google Gemini**: Cost-effective responses with Gemini (lower cost)
- Visual indicators showing which provider is currently active
- Real-time switching between providers

### 🔄 **Automatic Fallback**

- If the selected provider fails (e.g., quota exceeded), the system automatically tries the other provider
- Users are notified when fallback occurs
- No interruption to the user experience

### 📊 **Usage Tracking**

- Shows which provider was used for the last successful generation
- Visual feedback during provider switching
- Toast notifications for successful switches

## How to Use

### 1. **Access the Feature**

- Go to the Create Interview page
- Fill in the interview details (name, objective, etc.)
- Scroll down to find the "AI Provider for Question Generation" section

### 2. **Select Your Provider**

- **OpenAI Button**: Click to use OpenAI GPT-4 (green indicator)
- **Gemini Button**: Click to use Google Gemini (blue indicator)
- The active provider shows an "Active" badge

### 3. **Generate Questions**

- Click "Generate Questions" to create interview questions using the selected provider
- The system will use your chosen provider or automatically fallback if needed

## Visual Indicators

### **Provider Status**

- 🟢 **Green dot**: OpenAI GPT-4
- 🔵 **Blue dot**: Google Gemini
- **"Active" badge**: Currently selected provider
- **Loading spinner**: Switching in progress

### **Usage History**

- **"Last used: OPENAI"**: Shows which provider was used for the last successful generation
- **Green text**: Indicates successful usage

## Cost Comparison

| Provider | Model          | Input Cost       | Output Cost      | Best For                    |
| -------- | -------------- | ---------------- | ---------------- | --------------------------- |
| OpenAI   | GPT-4          | $30.00/1M tokens | $60.00/1M tokens | High-quality, complex tasks |
| Gemini   | Gemini 1.5 Pro | $3.50/1M tokens  | $10.50/1M tokens | Cost-effective, most tasks  |

## Error Handling

### **Quota Exceeded**

- System automatically tries the alternative provider
- User is notified of the fallback
- No action required from the user

### **Authentication Failed**

- Clear error message explaining the issue
- Guidance to check API key configuration

### **Service Unavailable**

- Automatic retry with alternative provider
- User notification of the issue

## Technical Details

### **API Endpoints Used**

- `GET /api/ai-provider`: Get current provider
- `POST /api/ai-provider`: Switch provider
- `POST /api/generate-interview-questions`: Generate questions

### **State Management**

- `selectedAIProvider`: Currently selected provider
- `isSwitchingProvider`: Loading state during switch
- `lastUsedProvider`: Tracks which provider was last used successfully

### **Environment Variables**

```bash
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
AI_PROVIDER=openai  # or "gemini"
```

## Best Practices

### **For Development**

- Use Gemini for testing (lower cost)
- Set up both API keys for fallback testing

### **For Production**

- Use OpenAI for high-quality requirements
- Keep Gemini as fallback for reliability
- Monitor usage on both platforms

### **For Users**

- Choose based on your budget and quality needs
- Gemini is great for most use cases
- OpenAI is best for complex or critical interviews

## Troubleshooting

### **Provider Not Switching**

1. Check browser console for errors
2. Verify API keys are configured
3. Check network connectivity

### **Questions Not Generating**

1. Ensure at least one API key is set
2. Check provider status pages
3. Try switching to the other provider

### **High Costs**

1. Switch to Gemini for cost savings
2. Monitor usage on provider dashboards
3. Set up billing alerts

## Future Enhancements

- [ ] Provider performance metrics
- [ ] Cost estimation before generation
- [ ] Custom model selection
- [ ] Batch processing options
- [ ] Usage analytics dashboard
