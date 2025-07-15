# AI Provider Setup Guide

This application now supports both OpenAI and Google Gemini AI providers. You can switch between them dynamically or set a default provider.

## Environment Variables

Add the following variables to your `.env.local` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Google Gemini Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Default AI Provider (optional)
# Options: "openai" or "gemini"
# Default: "openai"
AI_PROVIDER=openai
```

## Getting API Keys

### OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Go to "API Keys" in the sidebar
4. Click "Create new secret key"
5. Copy the key and add it to your `.env.local` file

### Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your `.env.local` file

## Model Mapping

The application automatically maps OpenAI models to equivalent Gemini models:

| OpenAI Model  | Gemini Model     | Use Case                              |
| ------------- | ---------------- | ------------------------------------- |
| gpt-4o        | gemini-1.5-pro   | High-quality responses, complex tasks |
| gpt-4         | gemini-1.5-pro   | High-quality responses                |
| gpt-3.5-turbo | gemini-1.5-flash | Fast, cost-effective responses        |
| gpt-4.1       | gemini-1.5-pro   | High-quality responses                |

## Switching Providers

### Via API

```bash
# Get current provider
GET /api/ai-provider

# Switch to Gemini
POST /api/ai-provider
{
  "provider": "gemini"
}

# Switch to OpenAI
POST /api/ai-provider
{
  "provider": "openai"
}
```

### Via Environment Variable

Set `AI_PROVIDER=gemini` in your `.env.local` file to use Gemini as the default.

### Via UI Component

Use the `AIProviderSwitcher` component in your application:

```tsx
import { AIProviderSwitcher } from "@/components/ui/ai-provider-switcher";

function SettingsPage() {
  return (
    <div>
      <h1>AI Settings</h1>
      <AIProviderSwitcher />
    </div>
  );
}
```

## Fallback Behavior

The AI service includes automatic fallback functionality:

1. If the primary provider fails (e.g., quota exceeded), it automatically tries the other provider
2. If both providers fail, it returns the original error
3. This ensures your application remains functional even if one provider is unavailable

## Cost Comparison

### OpenAI Pricing (as of 2024)

- GPT-4o: $5.00 per 1M input tokens, $15.00 per 1M output tokens
- GPT-4: $30.00 per 1M input tokens, $60.00 per 1M output tokens
- GPT-3.5-turbo: $0.50 per 1M input tokens, $1.50 per 1M output tokens

### Google Gemini Pricing (as of 2024)

- Gemini 1.5 Pro: $3.50 per 1M input tokens, $10.50 per 1M output tokens
- Gemini 1.5 Flash: $0.075 per 1M input tokens, $0.30 per 1M output tokens

## Best Practices

1. **Start with Gemini** for cost-effective development and testing
2. **Use OpenAI** for production applications requiring the highest quality
3. **Monitor usage** on both platforms to optimize costs
4. **Set up billing alerts** to avoid unexpected charges
5. **Use the fallback feature** to ensure reliability

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Verify your API key is correct
   - Check that the key has the necessary permissions
   - Ensure the key is not expired

2. **"Quota exceeded" error**
   - Check your billing status on the provider's platform
   - Consider upgrading your plan
   - Switch to the other provider temporarily

3. **"Service unavailable" error**
   - Check the provider's status page
   - Try the fallback provider
   - Wait a few minutes and retry

### Getting Help

- OpenAI: [OpenAI Help Center](https://help.openai.com/)
- Google Gemini: [Google AI Studio Help](https://ai.google.dev/docs)
- Application Issues: Check the application logs for detailed error information
