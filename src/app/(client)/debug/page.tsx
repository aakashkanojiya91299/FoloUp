import { AIDebug } from "@/components/ui/ai-debug";

export default function DebugPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">AI Service Debug</h1>
      <AIDebug />
    </div>
  );
}
