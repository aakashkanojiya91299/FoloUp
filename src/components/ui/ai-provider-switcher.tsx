"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";

type AIProvider = "openai" | "gemini";

export function AIProviderSwitcher() {
  const [currentProvider, setCurrentProvider] = useState<AIProvider>("openai");
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    fetchCurrentProvider();
  }, []);

  const fetchCurrentProvider = async () => {
    try {
      const response = await axios.get("/api/ai-provider");
      setCurrentProvider(response.data.provider);
    } catch (error) {
      console.error("Failed to fetch current AI provider:", error);
    }
  };

  const switchProvider = async (provider: AIProvider) => {
    if (provider === currentProvider) {return;}

    setIsLoading(true);
    try {
      const response = await axios.post("/api/ai-provider", { provider });
      setCurrentProvider(response.data.provider);
      toast.success(`Switched to ${provider.toUpperCase()}`);
    } catch (error: any) {
      console.error("Failed to switch AI provider:", error);
      toast.error(
        error.response?.data?.error || "Failed to switch AI provider",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderInfo = (provider: AIProvider) => {
    switch (provider) {
      case "openai":
        return {
          name: "OpenAI",
          description: "GPT-4 and GPT-3.5 models",
          color: "bg-green-500",
          features: [
            "High quality responses",
            "Wide model selection",
            "JSON output support",
          ],
        };
      case "gemini":
        return {
          name: "Google Gemini",
          description: "Gemini 1.5 Pro and Flash models",
          color: "bg-blue-500",
          features: ["Cost effective", "Fast responses", "Good for most tasks"],
        };
      default:
        return {
          name: "Unknown",
          description: "",
          color: "bg-gray-500",
          features: [],
        };
    }
  };

  const currentInfo = getProviderInfo(currentProvider);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          AI Provider
          <Badge
            variant={currentProvider === "openai" ? "default" : "secondary"}
          >
            {currentProvider.toUpperCase()}
          </Badge>
        </CardTitle>
        <CardDescription>
          Choose your preferred AI provider for generating interview questions
          and insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="ai-enabled"
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
          <Label htmlFor="ai-enabled">Enable AI features</Label>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${currentInfo.color}`} />
              <div>
                <p className="font-medium">{currentInfo.name}</p>
                <p className="text-sm text-gray-500">
                  {currentInfo.description}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={isLoading || !isEnabled}
              onClick={() =>
                switchProvider(
                  currentProvider === "openai" ? "gemini" : "openai",
                )
              }
            >
              {isLoading ? "Switching..." : "Switch"}
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Features:</p>
            <ul className="list-disc list-inside space-y-1">
              {currentInfo.features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <p>
            <strong>Note:</strong> Switching providers may affect response
            quality and cost. Make sure you have valid API keys configured in
            your environment variables.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
