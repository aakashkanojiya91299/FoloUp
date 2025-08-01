"use client";

import { useEffect, useState } from "react";
import Call from "@/components/call";
import Image from "next/image";
import { ArrowUpRightSquareIcon } from "lucide-react";
import { Interview } from "@/types/interview";
import LoaderWithText from "@/components/loaders/loader-with-text/loaderWithText";
import { useSearchParams } from "next/navigation";
import { InterviewService } from "@/services/interviews.service";
import {
  CandidateInterviewLink,
  CandidateInterviewLinkApiService,
} from "@/services/candidateInterviewLinks.api";

type Props = {
  params: {
    interviewId: string;
  };
};

type PopupProps = {
  title: string;
  description: string;
  image: string;
};

function PopupLoader() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 max-w-4xl w-full h-[80vh] overflow-hidden">
        <div className="h-full flex flex-col items-center justify-center p-8">
          <div className="mb-8">
            <LoaderWithText />
          </div>
          <div className="text-center text-gray-600 text-sm">
            Preparing your interview experience...
          </div>
        </div>
        <div className="border-t border-gray-100 bg-gray-50/50 p-4">
          <a
            className="flex flex-row justify-center items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
            href="https://stspl.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="text-center text-sm font-medium">
              Powered by{" "}
              <span className="font-bold flex items-center gap-1">
                <Image
                  src="/sts-logo.svg"
                  alt="STS Logo"
                  width={60}
                  height={20}
                  className="h-4 w-auto"
                />
              </span>
            </div>
            <ArrowUpRightSquareIcon className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
          </a>
        </div>
      </div>
    </div>
  );
}

function PopUpMessage({ title, description, image }: PopupProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 max-w-4xl w-full h-[80vh] overflow-hidden">
        <div className="h-full flex flex-col items-center justify-center p-8">
          <div className="mb-8 transform hover:scale-105 transition-transform duration-300">
            <Image
              src={image}
              alt="Graphic"
              width={200}
              height={200}
              className="drop-shadow-lg"
            />
          </div>
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">{title}</h1>
            <p className="text-gray-600 text-lg leading-relaxed max-w-md">
              {description}
            </p>
          </div>
        </div>
        <div className="border-t border-gray-100 bg-gray-50/50 p-4">
          <a
            className="flex flex-row justify-center items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
            href="https://stspl.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="text-center text-sm font-medium">
              Powered by{" "}
              <span className="font-bold flex items-center gap-1">
                <Image
                  src="/sts-logo.svg"
                  alt="STS Logo"
                  width={60}
                  height={20}
                  className="h-4 w-auto"
                />
              </span>
            </div>
            <ArrowUpRightSquareIcon className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
          </a>
        </div>
      </div>
    </div>
  );
}

function InterviewInterface({ params }: Props) {
  const [interview, setInterview] = useState<Interview>();
  const [isActive, setIsActive] = useState(true);
  const [interviewNotFound, setInterviewNotFound] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isValidatingLink, setIsValidatingLink] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const searchParams = useSearchParams();
  const uniqueLinkId = searchParams.get("link");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (interview) {
      setIsActive(interview?.is_active === true);
    }
  }, [interview, params.interviewId]);

  // Validate link if uniqueLinkId is present
  useEffect(() => {
    if (isClient && uniqueLinkId) {
      validateLink();
    }
  }, [isClient, uniqueLinkId]);

  const validateLink = async () => {
    try {
      setIsValidatingLink(true);
      setLinkError(null);

      if (!uniqueLinkId) {
        setLinkError(
          "Invalid interview link. Please check the URL and try again.",
        );

        return;
      }

      // Get the link by unique ID
      const linkData =
        await CandidateInterviewLinkApiService.getLinkByUniqueId(uniqueLinkId);

      if (!linkData) {
        setLinkError(
          "Invalid interview link. Please check the URL and try again.",
        );

        return;
      }

      // Check if link is expired (status-based or time-based)
      if (linkData.status === "expired") {
        setLinkError(
          "This interview link has expired. Please contact the interviewer for a new link.",
        );

        return;
      }

      // Check for time-based expiration
      if (linkData.expires_at) {
        const expiresAt = new Date(linkData.expires_at);
        const now = new Date();
        if (expiresAt < now) {
          setLinkError(
            "This interview link has passed its expiration date. Please contact the interviewer for a new link.",
          );

          return;
        }
      }

      // Check if interview is already completed
      if (linkData.status === "completed") {
        setLinkError("This interview has already been completed.");

        return;
      }

      // Verify the link matches the current interview
      if (linkData.interview_id !== params.interviewId) {
        setLinkError("This interview link is not valid for this interview.");

        return;
      }
    } catch (error) {
      console.error("Error validating link:", error);
      setLinkError(
        "An error occurred while validating the interview link. Please try again.",
      );
    } finally {
      setIsValidatingLink(false);
    }
  };

  useEffect(() => {
    const fetchinterview = async () => {
      try {
        const response = await InterviewService.getInterviewById(params.interviewId);
        if (response) {
          setInterview(response);
          document.title = response.name;
        } else {
          setInterviewNotFound(true);
        }
      } catch (error) {
        console.error(error);
        setInterviewNotFound(true);
      }
    };

    fetchinterview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <LoaderWithText />
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            {isValidatingLink ? (
              <PopupLoader />
            ) : linkError ? (
              <PopUpMessage
                title="Invalid Link"
                description={linkError}
                image="/invalid-url.png"
              />
            ) : !interview ? (
              interviewNotFound ? (
                <PopUpMessage
                  title="Invalid URL"
                  description="The interview link you're trying to access is invalid. Please check the URL and try again."
                  image="/invalid-url.png"
                />
              ) : (
                <PopupLoader />
              )
            ) : !isActive ? (
              <PopUpMessage
                title="Interview Is Unavailable"
                description="We are not currently accepting responses. Please contact the sender for more information."
                image="/closed.png"
              />
            ) : (
              <div>
                <Call interview={interview} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden min-h-screen flex flex-col items-center justify-center p-6">
        {isValidatingLink ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 max-w-sm w-full text-center">
            <div className="mb-6">
              <LoaderWithText />
            </div>
            <p className="text-gray-600 text-sm">
              Validating interview link...
            </p>
          </div>
        ) : linkError ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 max-w-sm w-full text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Invalid Link
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                {linkError}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 max-w-sm w-full text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {interview?.name || "Interview"}
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Please use a desktop computer to respond to this interview. This
                ensures the best experience with all features available.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center text-sm text-gray-500">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Secure & Professional
              </div>
              <div className="flex items-center justify-center text-sm text-gray-500">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Optimized for Desktop
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center items-center">
          <a
            href="https://stspl.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-all duration-300 px-4 py-2 rounded-xl hover:bg-white/80 hover:shadow-lg border border-transparent hover:border-gray-200"
          >
            <span className="text-sm font-medium">Powered by</span>
            <Image
              src="/sts-logo.svg"
              alt="STS Logo"
              width={60}
              height={20}
              className="h-5 w-auto"
            />
            <ArrowUpRightSquareIcon className="h-4 w-4 transition-all duration-300 hover:scale-110 hover:rotate-12" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default InterviewInterface;
