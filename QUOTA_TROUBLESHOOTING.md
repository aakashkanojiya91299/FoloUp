# AI API Quota Troubleshooting Guide

## Understanding the 429 Error

When you encounter a 429 error with the message "You exceeded your current quota, please check your plan and billing details," it means you've reached your AI API usage limits. This application now supports both OpenAI and Google Gemini, providing you with multiple options.

## Immediate Solutions

### 1. Switch AI Providers

The application automatically includes fallback functionality:

- If OpenAI quota is exceeded, it will automatically try Gemini
- If Gemini quota is exceeded, it will automatically try OpenAI
- You can also manually switch providers using the UI or API

### 2. Check Your AI Provider Billing

#### OpenAI

- Visit [OpenAI's billing page](https://platform.openai.com/account/billing)
- Verify your current usage and limits
- Check if you have sufficient credits or payment method

#### Google Gemini

- Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
- Check your usage in the Google Cloud Console
- Verify your billing account status

### 3. Upgrade Your Plan

- Consider upgrading to a higher tier plan
- Pay-as-you-go plans have higher limits than free tiers
- Enterprise plans offer even higher quotas

### 4. Wait for Reset

- Free tier quotas reset monthly
- Paid tier limits may reset based on your billing cycle
- Check your provider's dashboard for reset dates

## Application-Specific Solutions

### 1. Use Alternative Models

Consider switching to more cost-effective models:

- Use `gpt-3.5-turbo` or `gemini-1.5-flash` for less critical features
- Implement model fallbacks in your code

### 2. Implement Caching

- Cache generated questions and insights
- Store responses to avoid regenerating the same content
- Use Redis or similar for temporary storage

### 3. Rate Limiting

- Implement client-side rate limiting
- Add delays between API calls
- Use exponential backoff for retries

### 4. Batch Processing

- Process multiple requests together when possible
- Queue non-urgent requests for later processing

## Code Implementation

### Error Handling

The application now includes comprehensive error handling for both AI providers:

```typescript
// Example usage in your components
try {
  const response = await axios.post("/api/generate-interview-questions", data);
  // Handle success
} catch (error) {
  if (error.response?.status === 429) {
    // Show user-friendly quota exceeded message
    alert(
      "API quota exceeded. The system will try the alternative AI provider.",
    );
  }
  // Handle other errors
}
```

### Environment Variables

Ensure your `.env.local` file has the correct API keys:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Google Gemini Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Default AI Provider (optional)
AI_PROVIDER=openai
```

### Switching Providers Programmatically

```typescript
// Switch to Gemini
await axios.post("/api/ai-provider", { provider: "gemini" });

// Switch to OpenAI
await axios.post("/api/ai-provider", { provider: "openai" });

// Get current provider
const response = await axios.get("/api/ai-provider");
console.log(response.data.provider); // 'openai' or 'gemini'
```

## Monitoring and Prevention

### 1. Track Usage

- Monitor your usage on both platforms regularly
- Set up alerts for when you approach limits
- Use the provider's usage dashboard

### 2. Implement Usage Limits

- Add usage tracking in your application
- Set daily/monthly limits per user
- Show usage statistics to users

### 3. Cost Optimization

- Use Gemini for development and testing (more cost-effective)
- Use OpenAI for production applications requiring highest quality
- Monitor costs on both platforms

## Cost Comparison

### OpenAI Pricing (as of 2024)

- GPT-4o: $5.00 per 1M input tokens, $15.00 per 1M output tokens
- GPT-4: $30.00 per 1M input tokens, $60.00 per 1M output tokens
- GPT-3.5-turbo: $0.50 per 1M input tokens, $1.50 per 1M output tokens

### Google Gemini Pricing (as of 2024)

- Gemini 1.5 Pro: $3.50 per 1M input tokens, $10.50 per 1M output tokens
- Gemini 1.5 Flash: $0.075 per 1M input tokens, $0.30 per 1M output tokens

## Support

If you continue to experience issues:

1. Check the provider's status page:
   - [OpenAI Status](https://status.openai.com/)
   - [Google Cloud Status](https://status.cloud.google.com/)
2. Review the provider's documentation:
   - [OpenAI API Docs](https://platform.openai.com/docs/guides/error-codes/api-errors)
   - [Google AI Studio Docs](https://ai.google.dev/docs)
3. Contact the provider's support for billing issues
4. Check your application logs for detailed error information

## Best Practices

1. **Always handle API errors gracefully** - Never let quota errors crash your application
2. **Provide clear user feedback** - Users should understand what went wrong and how to fix it
3. **Implement retry logic** - For temporary issues, retry with exponential backoff
4. **Monitor costs** - Keep track of your API usage to avoid unexpected charges
5. **Use appropriate models** - Choose the right model for each use case to optimize costs
6. **Leverage fallback providers** - Use the automatic fallback feature for reliability
7. **Set up multiple API keys** - Have backup keys ready for each provider
