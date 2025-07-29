import { OpenAI } from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import {
  SYSTEM_PROMPT,
  generateQuestionsPrompt,
} from "@/lib/prompts/generate-questions";

export type AIProvider = "openai" | "gemini";

// Global variable to track the current provider across all instances
// Initialize with environment variable, but allow runtime updates
let globalCurrentProvider: AIProvider = "openai"; // Start with default

// Function to initialize the global provider from environment
function initializeGlobalProvider() {
  const envProvider = process.env.AI_PROVIDER as AIProvider;
  if (envProvider && ["openai", "gemini"].includes(envProvider)) {
    globalCurrentProvider = envProvider;
  }
  console.log(
    `Global provider initialized to: ${globalCurrentProvider} (env: ${process.env.AI_PROVIDER})`,
  );
}

// Initialize on module load
initializeGlobalProvider();

// Functions to manage global provider state
export function getGlobalProvider(): AIProvider {
  return globalCurrentProvider;
}

export function setGlobalProvider(provider: AIProvider): void {
  console.log(
    `Global provider changing from ${globalCurrentProvider} to ${provider}`,
  );
  globalCurrentProvider = provider;
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICompletionRequest {
  model: string;
  messages: AIMessage[];
  responseFormat?: { type: "json_object" | "text" };
  temperature?: number;
  maxTokens?: number;
}

export interface AICompletionResponse {
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface InterviewQuestion {
  question: string;
}

export interface InterviewQuestionsResponse {
  questions: InterviewQuestion[];
  description: string;
}

export interface GenerateInterviewQuestionsRequest {
  jobTitle: string;
  jobDescription: string;
  questionCount?: number;
  difficulty?: "easy" | "medium" | "hard";
}

export class AIService {
  private openai: OpenAI | null = null;
  private gemini: GoogleGenerativeAI | null = null;

  constructor() {
    console.log(
      `AI Service initialized with global provider: ${globalCurrentProvider}`,
    );
    console.log(`Environment AI_PROVIDER: ${process.env.AI_PROVIDER}`);
  }

  private initializeOpenAI() {
    if (!this.openai) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY environment variable is not set");
      }
      this.openai = new OpenAI({
        apiKey,
        maxRetries: 5,
        dangerouslyAllowBrowser: true,
      });
    }
    
return this.openai;
  }

  private initializeGemini() {
    if (!this.gemini) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
      }
      this.gemini = new GoogleGenerativeAI(apiKey);
    }
    
return this.gemini;
  }

  async createCompletion(
    request: AICompletionRequest,
    provider?: AIProvider,
  ): Promise<AICompletionResponse> {
    // Use the provided provider or get the current default
    const targetProvider = provider || globalCurrentProvider;
    console.log(
      `AI Service: Using provider ${targetProvider} (requested: ${provider}, default: ${globalCurrentProvider})`,
    );
    
    // Log the original request being passed to the AI service
    console.log('📤 AI Service: Original request received:');
    console.log('📤 AI Service: Model:', request.model);
    console.log('📤 AI Service: Temperature:', request.temperature);
    console.log('📤 AI Service: Max Tokens:', request.maxTokens);
    console.log('📤 AI Service: Response Format:', request.responseFormat);
    console.log('📤 AI Service: Number of messages:', request.messages.length);
    console.log('📤 AI Service: Messages:');
    request.messages.forEach((msg, index) => {
      console.log(`  ${index + 1}. Role: ${msg.role}, Content: ${msg.content.substring(0, 100)}...`);
    });

    try {
      if (targetProvider === "openai") {
        return await this.createOpenAICompletion(request);
      } else if (targetProvider === "gemini") {
        return await this.createGeminiCompletion(request);
      } else {
        throw new Error(`Unsupported AI provider: ${targetProvider}`);
      }
    } catch (error: any) {
      console.error(`❌ AI Service: ${targetProvider} failed with error:`, error.message);
      
      // If the primary provider fails, try the fallback
      if (targetProvider !== globalCurrentProvider) {
        console.log(`❌ AI Service: Already using fallback provider, throwing error`);
        throw error; // Don't retry if we're already using fallback
      }

      const fallbackProvider =
        globalCurrentProvider === "openai" ? "gemini" : "openai";
      console.log(
        `🔄 AI Service: Primary provider ${targetProvider} failed, trying fallback: ${fallbackProvider}`,
      );

      try {
        console.log(`🔄 AI Service: Attempting fallback with ${fallbackProvider}...`);
        return await this.createCompletion(request, fallbackProvider);
      } catch (fallbackError: any) {
        console.error(`❌ AI Service: Fallback ${fallbackProvider} also failed:`, fallbackError.message);

        // If both providers fail, try direct API call as last resort
        console.log(`🔄 AI Service: Both providers failed, trying direct API call...`);
        try {
          return await this.createDirectAPICall(request, fallbackProvider);
        } catch (apiError: any) {
          console.error(`❌ AI Service: Direct API call also failed:`, apiError.message);
          // If all methods fail, throw the original error
          throw error;
        }
      }
    }
  }

  private async createOpenAICompletion(
    request: AICompletionRequest,
  ): Promise<AICompletionResponse> {
    const openai = this.initializeOpenAI();

    const completion = await openai.chat.completions.create({
      model: request.model,
      messages: request.messages,
      response_format: request.responseFormat,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
    });

    const choice = completion.choices[0];
    if (!choice?.message?.content) {
      throw new Error("No content received from OpenAI");
    }

    return {
      content: choice.message.content,
      usage: completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          }
        : undefined,
    };
  }

  private async createGeminiCompletion(
    request: AICompletionRequest,
  ): Promise<AICompletionResponse> {
    console.log('🔍 Gemini Debug: Starting Gemini completion...');
    
    try {
      const gemini = this.initializeGemini();
      console.log('✅ Gemini Debug: Gemini client initialized successfully');

      // Map OpenAI models to Gemini models
      const modelMap: Record<string, string> = {
        "gpt-4o": "gemini-2.5-flash",
        "gpt-4": "gemini-2.5-flash",
        "gpt-3.5-turbo": "gemini-2.5-flash",
        "gpt-4.1": "gemini-2.5-flash",
      };

      const geminiModel = modelMap[request.model] || "gemini-2.5-flash";
      console.log(`🔧 Gemini Debug: Using model: ${geminiModel} (mapped from: ${request.model})`);
      
      const model = gemini.getGenerativeModel({ model: geminiModel });
      console.log('✅ Gemini Debug: Model created successfully');

    // Convert OpenAI messages to Gemini format
    const geminiMessages = request.messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : msg.role,
      parts: [{ text: msg.content }],
    }));

    // Handle system messages (Gemini doesn't have system messages, so we prepend to user message)
    let systemContent = "";
    const userMessages = request.messages.filter(
      (msg) => msg.role !== "system",
    );

    request.messages.forEach((msg) => {
      if (msg.role === "system") {
        systemContent += msg.content + "\n\n";
      }
    });

    // If there's a system message, prepend it to the first user message
    if (
      systemContent &&
      userMessages.length > 0 &&
      userMessages[0].role === "user"
    ) {
      userMessages[0].content = systemContent + userMessages[0].content;
    }

    const geminiUserMessages = userMessages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

      console.log('🔧 Gemini Debug: Converted messages to Gemini format');
      console.log('📝 Gemini Debug: Number of messages:', request.messages.length);
      console.log('📝 Gemini Debug: First message preview:', userMessages[0]?.content?.substring(0, 100) + "...");

      // Log the complete request being sent to Gemini
      const geminiRequest = {
        contents: geminiUserMessages,
        generationConfig: {
          temperature: request.temperature || 0.7,
          maxOutputTokens: request.maxTokens || 2048,
          responseMimeType:
            request.responseFormat?.type === "json_object"
              ? "application/json"
              : "text/plain",
        },
      };
      
      console.log('📤 Gemini Debug: Request being sent to Gemini:');
      console.log(JSON.stringify(geminiRequest, null, 2));

      console.log('🚀 Gemini Debug: Calling model.generateContent...');
      const result = await model.generateContent(geminiRequest);
      console.log('✅ Gemini Debug: Model.generateContent completed successfully');
      
      console.log('🔄 Gemini Debug: Getting response...');
      const response = await result.response;
      console.log('✅ Gemini Debug: Response received');
      
      const text = response.text();
      console.log('📝 Gemini Debug: Response text length:', text.length);
      console.log('📝 Gemini Debug: Response preview:', text.substring(0, 200) + "...");
      
      // Log the complete response from Gemini
      console.log('📥 Gemini Debug: Complete response from Gemini:');
      console.log('📥 Gemini Debug: Raw response text:');
      console.log(text);
      
      // Try to parse as JSON if it looks like JSON
      try {
        if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
          const parsedJson = JSON.parse(text);
          console.log('📥 Gemini Debug: Parsed JSON response:');
          console.log(JSON.stringify(parsedJson, null, 2));
        }
      } catch (jsonError) {
        console.log('📥 Gemini Debug: Response is not valid JSON, treating as plain text');
      }

      if (!text) {
        throw new Error("No content received from Gemini");
      }

      return {
        content: text,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount,
          completionTokens: response.usageMetadata?.candidatesTokenCount,
          totalTokens: response.usageMetadata?.totalTokenCount,
        },
      };
    } catch (error: any) {
      console.error('❌ Gemini Debug: Error in createGeminiCompletion:', error);
      console.error('❌ Gemini Debug: Error message:', error.message);
      console.error('❌ Gemini Debug: Error stack:', error.stack);
      throw error;
    }
  }

  private async createDirectAPICall(
    request: AICompletionRequest,
    provider: AIProvider,
  ): Promise<AICompletionResponse> {
    console.log(`🔄 AI Service: Creating direct API call for ${provider}...`);

    try {
      if (provider === "gemini") {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error("Gemini API key not found");
        }

        // Convert OpenAI format to Gemini format
        const prompt = request.messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');

        const response = await axios.post(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
          {
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          },
          {
            headers: {
              "Content-Type": "application/json",
              "X-goog-api-key": apiKey,
            },
          }
        );

        const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        if (!text) {
          throw new Error("No content returned from Gemini API");
        }

        return {
          content: text,
          usage: {
            promptTokens: response.data.usageMetadata?.promptTokenCount,
            completionTokens: response.data.usageMetadata?.candidatesTokenCount,
            totalTokens: response.data.usageMetadata?.totalTokenCount,
          },
        };
      } else if (provider === "openai") {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          throw new Error("OpenAI API key not found");
        }

        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: request.model,
            messages: request.messages,
            response_format: request.responseFormat,
            temperature: request.temperature,
            max_tokens: request.maxTokens,
          },
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`,
            },
          }
        );

        const choice = response.data.choices[0];
        if (!choice?.message?.content) {
          throw new Error("No content returned from OpenAI API");
        }

        return {
          content: choice.message.content,
          usage: response.data.usage
            ? {
              promptTokens: response.data.usage.prompt_tokens,
              completionTokens: response.data.usage.completion_tokens,
              totalTokens: response.data.usage.total_tokens,
            }
            : undefined,
        };
      } else {
        throw new Error(`Unsupported provider for direct API call: ${provider}`);
      }
    } catch (error: any) {
      console.error(`❌ AI Service: Direct API call failed:`, error.message);
      throw error;
    }
  }

  // Helper method to get the current provider
  getCurrentProvider(): AIProvider {
    console.log(
      `AI Service getCurrentProvider called, returning: ${globalCurrentProvider}`,
    );
    
return globalCurrentProvider;
  }

  // Helper method to set the default provider
  setDefaultProvider(provider: AIProvider): void {
    console.log(
      `AI Service setDefaultProvider: ${globalCurrentProvider} -> ${provider}`,
    );
    globalCurrentProvider = provider;
  }

  // Method to generate interview questions
  async generateInterviewQuestions(
    request: GenerateInterviewQuestionsRequest,
  ): Promise<InterviewQuestion[]> {
    const {
      jobTitle,
      jobDescription,
      questionCount = 10,
      difficulty = "medium",
    } = request;

    // Create the prompt body
    const promptBody = {
      name: jobTitle,
      objective: `Generate ${questionCount} ${difficulty} level interview questions for a ${jobTitle} position`,
      number: questionCount,
      context: `Job Title: ${jobTitle}\nJob Description: ${jobDescription}\nDifficulty Level: ${difficulty}`,
    };

    try {
      const response = await this.createCompletion({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: generateQuestionsPrompt(promptBody),
          },
        ],
        responseFormat: { type: "json_object" },
      });

      const content = response.content;
      const parsed = JSON.parse(content) as InterviewQuestionsResponse;

      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error("Invalid response format from AI service");
      }

      return parsed.questions;
    } catch (error) {
      console.error("Error generating interview questions:", error);
      throw error;
    }
  }
}

// Create a singleton instance
export const aiService = new AIService();
