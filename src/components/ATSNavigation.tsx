"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight } from "lucide-react";

export default function ATSNavigation() {
  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">ATS Resume Matcher</h3>
            <p className="text-sm text-gray-600">
              AI-powered resume to job description matching
            </p>
          </div>
        </div>
        <Link href="/ats">
          <Button className="flex items-center gap-2">
            Try ATS Matcher
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
