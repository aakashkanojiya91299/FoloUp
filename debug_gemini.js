// Debug script to test AI service configuration
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function debugGemini() {
  try {
    console.log("🔍 Debugging Gemini Configuration...");
    
    // Check environment variables
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const aiProvider = process.env.AI_PROVIDER;
    
    console.log("📋 Environment Check:");
    console.log("- GEMINI_API_KEY:", geminiKey ? "✅ Set" : "❌ Missing");
    console.log("- OPENAI_API_KEY:", openaiKey ? "✅ Set" : "❌ Missing");
    console.log("- AI_PROVIDER:", aiProvider || "openai (default)");
    
    if (!geminiKey) {
      console.error("❌ GEMINI_API_KEY is missing!");
      return;
    }
    
    // Test Gemini initialization (same as AI service)
    console.log("\n🧪 Testing Gemini Initialization...");
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    console.log("✅ Gemini model created successfully");
    
    // Test with the same prompt format used in ATS
    console.log("\n🧪 Testing ATS-style prompt...");
    const testPrompt = `
    Analyze this resume for the following job position:
    
    Job Title: Software Engineer
    Job Description: We are looking for a skilled software engineer...
    
    Resume Content: Sample resume content for testing...
    
    Please provide a comprehensive ATS analysis including:
    1. Overall match score (0-100)
    2. Skills match score (0-100)
    3. Experience match score (0-100)
    4. Education match score (0-100)
    5. Technical skills found
    6. Soft skills identified
    7. Experience summary
    8. Education summary
    9. Specific recommendations for improvement
    
    Format your response as JSON with the following structure:
    {
      "overall_score": 85,
      "skills_match": 90,
      "experience_match": 80,
      "education_match": 75,
      "technical_skills": ["JavaScript", "React", "Node.js"],
      "soft_skills": ["Communication", "Teamwork", "Problem Solving"],
      "experience_summary": "5+ years of software development experience",
      "education_summary": "Bachelor's in Computer Science",
      "recommendations": [
        "Highlight relevant project experience",
        "Add more specific technical skills",
        "Include certifications if available"
      ]
    }
    `;
    
    const result = await model.generateContent(testPrompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("✅ ATS Analysis Test Response:");
    console.log(text.substring(0, 200) + "...");
    
    console.log("\n🎉 All tests passed! Gemini is working correctly.");
    
  } catch (error) {
    console.error("\n❌ Error Details:");
    console.error("- Message:", error.message);
    console.error("- Type:", error.constructor.name);
    
    if (error.message.includes("API key")) {
      console.log("\n💡 Solution: Check your GEMINI_API_KEY in .env file");
    } else if (error.message.includes("quota")) {
      console.log("\n💡 Solution: Check your Gemini API quota at https://makersuite.google.com/app/apikey");
    } else if (error.message.includes("model")) {
      console.log("\n💡 Solution: The model might not be available in your region");
    } else if (error.message.includes("network")) {
      console.log("\n💡 Solution: Check your internet connection");
    } else {
      console.log("\n💡 Solution: This might be a temporary service issue");
    }
  }
}

debugGemini(); 
