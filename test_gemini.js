// Simple test script to check Gemini API
require('dotenv').config(); // Load .env file
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
  try {
    // Get API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error("❌ GEMINI_API_KEY not found in environment variables");
      console.log("💡 Make sure your .env file contains: GEMINI_API_KEY=your_key_here");
      return;
    }
    
    console.log("✅ GEMINI_API_KEY found:", apiKey.substring(0, 10) + "...");
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    console.log("✅ Gemini model initialized");
    
    // Test simple completion
    const result = await model.generateContent("Hello, can you respond with 'Gemini is working!'");
    const response = await result.response;
    const text = response.text();
    
    console.log("✅ Gemini API Response:", text);
    console.log("🎉 Gemini is working correctly!");
    
  } catch (error) {
    console.error("❌ Gemini API Error:", error.message);
    
    if (error.message.includes("API key")) {
      console.log("💡 Solution: Check your GEMINI_API_KEY in .env file");
    } else if (error.message.includes("quota")) {
      console.log("💡 Solution: Check your Gemini API quota");
    } else if (error.message.includes("model")) {
      console.log("💡 Solution: The model might not be available in your region");
    } else {
      console.log("💡 Solution: Check your internet connection and try again");
    }
  }
}

// Run the test
testGemini(); 
