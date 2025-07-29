import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, MessageSquare, ArrowRight, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            FoloUp
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            AI-powered interview platform with integrated ATS resume matching and candidate management
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/ats">
              <Button size="lg" className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Try ATS Matcher
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* ATS Feature */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>ATS Resume Matcher</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                AI-powered resume to job description matching with detailed analysis and feedback.
              </CardDescription>
              <Link href="/dashboard/ats-candidates">
                <Button className="w-full flex items-center gap-2">
                  Manage Candidates
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Interview Feature */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>AI Interviews</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Conduct intelligent interviews with AI-powered questioning and response analysis.
              </CardDescription>
              <Link href="/dashboard">
                <Button className="w-full flex items-center gap-2">
                  Start Interview
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Analytics Feature */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Smart Analytics</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Get insights and analytics on candidate performance and interview outcomes.
              </CardDescription>
              <Link href="/dashboard">
                <Button className="w-full flex items-center gap-2">
                  View Analytics
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Section */}
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-6">Quick Access</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">ATS Candidate Management</h3>
              <p className="text-gray-600 mb-4">
                Upload resumes and analyze candidates against interview job descriptions
              </p>
              <Link href="/dashboard/ats-candidates">
                <Button className="flex items-center gap-2 mx-auto">
                  <FileText className="h-4 w-4" />
                  Manage Candidates
                </Button>
              </Link>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Interview Dashboard</h3>
              <p className="text-gray-600 mb-4">
                Manage interviews and view candidate responses
              </p>
              <Link href="/dashboard">
                <Button variant="outline" className="flex items-center gap-2 mx-auto">
                  <Users className="h-4 w-4" />
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
