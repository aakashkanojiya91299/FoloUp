"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axios from "axios";

export function AIDebug() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [testData, setTestData] = useState(JSON.stringify({
    name: "Test Interview",
    objective: "Test objective for debugging",
    number: 3,
    context: "Test context for debugging"
  }, null, 2));

  const testGenerateQuestions = async () => {
    setIsLoading(true);
    setResult("");
    
    try {
      const data = JSON.parse(testData);
      const response = await axios.post("/api/generate-interview-questions", data);
      
      setResult(JSON.stringify(response.data, null, 2));
      toast.success("Test completed successfully!");
    } catch (error: any) {
      console.error("Test failed:", error);
      setResult(JSON.stringify({
        error: error.response?.data || error.message,
        status: error.response?.status
      }, null, 2));
      toast.error("Test failed. Check the result for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const testProviderSwitch = async (provider: "openai" | "gemini") => {
    try {
      const response = await axios.post("/api/ai-provider", { provider });
      toast.success(`Switched to ${provider.toUpperCase()}`);
      setResult(JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      console.error("Provider switch failed:", error);
      toast.error("Failed to switch provider");
      setResult(JSON.stringify({
        error: error.response?.data || error.message,
        status: error.response?.status
      }, null, 2));
    }
  };

  const getCurrentProvider = async () => {
    try {
      const response = await axios.get("/api/ai-provider");
      setResult(JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      console.error("Failed to get provider:", error);
      setResult(JSON.stringify({
        error: error.response?.data || error.message,
        status: error.response?.status
      }, null, 2));
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>AI Service Debug</CardTitle>
        <CardDescription>
          Test the AI service and diagnose issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={getCurrentProvider} variant="outline">
            Get Current Provider
          </Button>
          <Button onClick={() => testProviderSwitch("openai")} variant="outline">
            Switch to OpenAI
          </Button>
          <Button onClick={() => testProviderSwitch("gemini")} variant="outline">
            Switch to Gemini
          </Button>
        </div>

        <div>
          <label className="text-sm font-medium">Test Data (JSON):</label>
          <Textarea
            value={testData}
            onChange={(e) => setTestData(e.target.value)}
            placeholder="Enter test data..."
            className="mt-1"
            rows={6}
          />
        </div>

        <Button 
          onClick={testGenerateQuestions} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Testing..." : "Test Generate Questions"}
        </Button>

        {result && (
          <div>
            <label className="text-sm font-medium">Result:</label>
            <pre className="mt-1 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-96">
              {result}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
