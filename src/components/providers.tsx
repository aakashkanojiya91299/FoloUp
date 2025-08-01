"use client";

import React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import compose from "@/lib/compose";
import { InterviewerProvider } from "@/contexts/interviewers.context";
import { InterviewProvider } from "@/contexts/interviews.context";
import { ResponseProvider } from "@/contexts/responses.context";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ClientProvider } from "@/contexts/clients.context";

const queryClient = new QueryClient();

function providers({ children }: ThemeProviderProps) {
  const Provider = compose([
    InterviewProvider,
    InterviewerProvider,
    ResponseProvider,
    ClientProvider,
  ]);

  return (
    <NextThemesProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <Provider>{children}</Provider>
      </QueryClientProvider>
    </NextThemesProvider>
  );
}

// Simplified providers for user routes (no Clerk dependencies)
function UserProviders({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <ResponseProvider>
          {children}
        </ResponseProvider>
      </QueryClientProvider>
    </NextThemesProvider>
  );
}

export default providers;
export { UserProviders };
