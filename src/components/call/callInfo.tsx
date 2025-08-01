"use client";

import React, { useEffect, useState } from "react";
import { Analytics, CallData } from "@/types/response";
import axios from "axios";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import ReactAudioPlayer from "react-audio-player";
import { DownloadIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ResponseService } from "@/services/responses.service";
import { useRouter } from "next/navigation";
import LoaderWithText from "@/components/loaders/loader-with-text/loaderWithText";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { CircularProgress } from "@nextui-org/react";
import QuestionAnswerCard from "@/components/dashboard/interview/questionAnswerCard";
import { marked } from "marked";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CandidateStatus } from "@/lib/enum";
import { ArrowLeft } from "lucide-react";

type CallProps = {
  call_id: string;
  onDeleteResponse: (deletedCallId: string) => void;
  onCandidateStatusChange: (callId: string, newStatus: string) => void;
};

function CallInfo({
  call_id,
  onDeleteResponse,
  onCandidateStatusChange,
}: CallProps) {
  const [call, setCall] = useState<CallData>();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [isClicked, setIsClicked] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [candidateStatus, setCandidateStatus] = useState<string>("");
  const [interviewId, setInterviewId] = useState<string>("");
  const [tabSwitchCount, setTabSwitchCount] = useState<number>();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);
  const [aiTestResult, setAiTestResult] = useState<any>(null);

  const testAIService = async () => {
    try {
      const response = await fetch('/api/test-ai');
      const result = await response.json();
      setAiTestResult(result);
      console.log('AI Test Result:', result);
    } catch (error: any) {
      console.error('AI Test failed:', error);
      setAiTestResult({ success: false, error: error.message });
    }
  };

  const fetchResponses = async () => {
    setIsLoading(true);
    setCall(undefined);
    setEmail("");
    setName("");
    setAnalyticsLoading(true);

    try {
      const response = await axios.post("/api/get-call", { id: call_id });
      console.log("API Response:", response.data);
      setCall(response.data.callResponse);
      setAnalytics(response.data.analytics);
      setDebugInfo(response.data);
      setAnalyticsLoading(false);

      // Log analytics data for debugging
      if (response.data.analytics) {
        console.log("Analytics data received:", response.data.analytics);
        console.log("Overall score:", response.data.analytics.overallScore);
      } else {
        console.log("No analytics data received");
      }

      // Log any error from the API
      if (response.data.error) {
        console.error("Analytics generation error:", response.data.error);
      }
    } catch (error: any) {
      console.error("Error fetching call data:", error);
      setAnalyticsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call_id]);

  useEffect(() => {
    const fetchEmail = async () => {
      setIsLoading(true);
      try {
        const response = await ResponseService.getResponseByCallId(call_id);
        setEmail(response.email);
        setName(response.name);
        setCandidateStatus(response.candidate_status);
        setInterviewId(response.interview_id);
        setTabSwitchCount(response.tab_switch_count);
      } catch (error: any) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call_id]);

  useEffect(() => {
    const replaceAgentAndUser = (transcript: string, name: string): string => {
      const agentReplacement = "**AI interviewer:**";
      const userReplacement = `**${name}:**`;

      // Replace "Agent:" with "AI interviewer:" and "User:" with the variable `${name}:`
      let updatedTranscript = transcript
        .replace(/Agent:/g, agentReplacement)
        .replace(/User:/g, userReplacement);

      // Add space between the dialogues
      updatedTranscript = updatedTranscript.replace(/(?:\r\n|\r|\n)/g, "\n\n");

      return updatedTranscript;
    };

    if (call && name) {
      setTranscript(replaceAgentAndUser(call?.transcript as string, name));
    }
  }, [call, name]);

  const onDeleteResponseClick = async () => {
    try {
      const response = await ResponseService.getResponseByCallId(call_id);

      if (response) {
        const interview_id = response.interview_id;

        await ResponseService.deleteResponse(call_id);

        router.push(`/interviews/${interview_id}`);

        onDeleteResponse(call_id);
      }

      toast.success("Response deleted successfully.", {
        position: "bottom-right",

        duration: 3000,
      });
    } catch (error: any) {
      console.error("Error deleting response:", error);

      toast.error("Failed to delete the response.", {
        position: "bottom-right",

        duration: 3000,
      });
    }
  };

  return (
    <div className="h-screen z-[10] mx-2 mb-[100px] overflow-y-scroll">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-[75%] w-full">
          <LoaderWithText />
        </div>
      ) : (
        <>
          <div className="bg-slate-200 rounded-2xl min-h-[120px] p-4 px-5 y-3">
            <div className="flex flex-col justify-between bt-2">
              {/* <p className="font-semibold my-2 ml-2">
                Response Analysis and Insights
              </p> */}
              <div>
                <div className="flex justify-between items-center pb-4 pr-2">
                  <div
                    className=" inline-flex items-center text-[#06546e] hover:cursor-pointer"
                    onClick={() => {
                      router.push(`/interviews/${interviewId}`);
                    }}
                  >
                    <ArrowLeft className="mr-2" />
                    <p className="text-sm font-semibold">Back to Summary</p>
                  </div>
                  {tabSwitchCount && tabSwitchCount > 0 && (
                    <p className="text-sm font-semibold text-red-500 bg-red-200 rounded-sm px-2 py-1">
                      Tab Switching Detected
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col justify-between gap-3 w-full">
                <div className="flex flex-row justify-between">
                  <div className="flex flex-row gap-3">
                    <Avatar>
                      <AvatarFallback>{name ? name[0] : "A"}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      {name && (
                        <p className="text-sm font-semibold px-2">{name}</p>
                      )}
                      {email && <p className="text-sm px-2">{email}</p>}
                    </div>
                  </div>
                  <div className="flex flex-row mr-2 items-center gap-3">
                    <Select
                      value={candidateStatus}
                      onValueChange={async (newValue: string) => {
                        setCandidateStatus(newValue);
                        await ResponseService.updateResponse(
                          { candidate_status: newValue },
                          call_id,
                        );
                        onCandidateStatusChange(call_id, newValue);
                      }}
                    >
                      <SelectTrigger className="w-[180px]  bg-slate-50 rounded-2xl">
                        <SelectValue placeholder="Not Selected" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CandidateStatus.NO_STATUS}>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-gray-400 rounded-full mr-2" />
                            No Status
                          </div>
                        </SelectItem>
                        <SelectItem value={CandidateStatus.NOT_SELECTED}>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                            Not Selected
                          </div>
                        </SelectItem>
                        <SelectItem value={CandidateStatus.POTENTIAL}>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2" />
                            Potential
                          </div>
                        </SelectItem>
                        <SelectItem value={CandidateStatus.SELECTED}>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                            Selected
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <AlertDialog>
                      <AlertDialogTrigger>
                        <Button
                          disabled={isClicked}
                          className="bg-red-500 hover:bg-red-600 p-2"
                        >
                          <TrashIcon size={16} className="" />
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>

                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete this response.
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>

                          <AlertDialogAction
                            className="bg-[#06546e] hover:bg-[#06546e]/80"
                            onClick={async () => {
                              await onDeleteResponseClick();
                            }}
                          >
                            Continue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="flex flex-col mt-3">
                  <p className="font-semibold">Interview Recording</p>
                  <div className="flex flex-row gap-3 mt-2">
                    {call?.recording_url && (
                      <ReactAudioPlayer src={call?.recording_url} controls />
                    )}
                    <a
                      className="my-auto"
                      href={call?.recording_url}
                      download=""
                      aria-label="Download"
                    >
                      <DownloadIcon size={20} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
            {/* <div>{call.}</div> */}
          </div>
          <div className="bg-slate-200 rounded-2xl min-h-[120px] p-4 px-5 my-3">
            <p className="font-semibold my-2">General Summary</p>

            <div className="grid grid-cols-3 gap-4 my-2 mt-4 ">
              {analytics?.overallScore !== undefined && (
                <div className="flex flex-col gap-3 text-sm p-4 rounded-2xl bg-slate-50">
                  <div className="flex flex-row gap-2 align-middle">
                    <CircularProgress
                      classNames={{
                        svg: "w-28 h-28 drop-shadow-md",
                        indicator: "stroke-[#06546e]",
                        track: "stroke-[#06546e]/10",
                        value: "text-3xl font-semibold text-[#06546e]",
                      }}
                      value={analytics?.overallScore}
                      strokeWidth={4}
                      showValueLabel={true}
                      formatOptions={{ signDisplay: "never" }}
                    />
                    <p className="font-medium my-auto text-xl">
                      Overall Hiring Score
                    </p>
                  </div>
                  <div className="">
                    <div className="font-medium ">
                      <span className="font-normal">Feedback: </span>
                      {analytics?.overallFeedback === undefined ? (
                        <Skeleton className="w-[200px] h-[20px]" />
                      ) : (
                        analytics?.overallFeedback
                      )}
                    </div>
                  </div>
                </div>
              )}

                {/* Loading state for Overall Hiring Score */}
                {analyticsLoading && !analytics?.overallScore && (
                  <div className="flex flex-col gap-3 text-sm p-4 rounded-2xl bg-slate-50">
                    <div className="flex flex-row gap-2 align-middle">
                      <div className="w-28 h-28 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#06546e]"></div>
                      </div>
                      <p className="font-medium my-auto text-xl">
                        Generating Score...
                      </p>
                    </div>
                    <div className="">
                      <div className="font-medium">
                        <span className="font-normal">Status: </span>
                        <Skeleton className="w-[200px] h-[20px] inline-block" />
                      </div>
                    </div>
                  </div>
                )}

                {!analytics?.overallScore && !analyticsLoading && (
                  <div className="flex flex-col gap-3 text-sm p-4 rounded-2xl bg-red-50 border border-red-200">
                    <div className="flex flex-row gap-2 align-middle">
                      <div className="w-28 h-28 flex items-center justify-center">
                        <span className="text-red-500 text-2xl">⚠️</span>
                      </div>
                      <p className="font-medium my-auto text-xl text-red-700">
                        Analytics Unavailable
                      </p>
                    </div>
                    <div className="">
                      <div className="font-medium text-red-600">
                        <span className="font-normal">Reason: </span>
                        AI analysis failed. Please check your API configuration or try again later.
                      </div>
                      <button
                        onClick={() => {
                          setAnalyticsLoading(true);
                          fetchResponses();
                        }}
                        className="mt-2 px-4 py-2 bg-[#06546e] text-white rounded-lg hover:bg-[#054a5e] transition-colors"
                      >
                        Retry Analysis
                      </button>
                    </div>
                  </div>
                )}

                {/* Loading state for Communication Score */}
                {analyticsLoading && !analytics?.communication && (
                  <div className="flex flex-col gap-3 text-sm p-4 rounded-2xl bg-slate-50">
                    <div className="flex flex-row gap-2 align-middle">
                      <div className="w-28 h-28 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#06546e]"></div>
                      </div>
                      <p className="font-medium my-auto text-xl">
                        Analyzing Communication...
                      </p>
                    </div>
                    <div className="">
                      <div className="font-medium">
                        <span className="font-normal">Status: </span>
                        <Skeleton className="w-[200px] h-[20px] inline-block" />
                      </div>
                    </div>
                  </div>
                )}

              {analytics?.communication && (
                <div className="flex flex-col gap-3 text-sm p-4 rounded-2xl bg-slate-50">
                  <div className="flex flex-row gap-2 align-middle">
                    <CircularProgress
                      classNames={{
                        svg: "w-28 h-28 drop-shadow-md",
                        indicator: "stroke-[#06546e]",
                        track: "stroke-[#06546e]/10",
                        value: "text-3xl font-semibold text-[#06546e]",
                      }}
                      value={analytics?.communication.score}
                      maxValue={10}
                      minValue={0}
                      strokeWidth={4}
                      showValueLabel={true}
                      valueLabel={
                        <div className="flex items-baseline">
                          {analytics?.communication.score ?? 0}
                          <span className="text-xl ml-0.5">/10</span>
                        </div>
                      }
                      formatOptions={{ signDisplay: "never" }}
                    />
                    <p className="font-medium my-auto text-xl">Communication</p>
                  </div>
                  <div className="">
                    <div className="font-medium ">
                      <span className="font-normal">Feedback: </span>
                      {analytics?.communication.feedback === undefined ? (
                        <Skeleton className="w-[200px] h-[20px]" />
                      ) : (
                        analytics?.communication.feedback
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-3 text-sm p-4 rounded-2xl bg-slate-50">
                <div className="flex flex-row gap-2  align-middle">
                  <p className="my-auto">User Sentiment: </p>
                  <p className="font-medium my-auto">
                    {call?.call_analysis?.user_sentiment === undefined ? (
                      <Skeleton className="w-[200px] h-[20px]" />
                    ) : (
                      call?.call_analysis?.user_sentiment
                    )}
                  </p>

                  <div
                    className={`${
                      call?.call_analysis?.user_sentiment == "Neutral"
                        ? "text-yellow-500"
                        : call?.call_analysis?.user_sentiment == "Negative"
                          ? "text-red-500"
                          : call?.call_analysis?.user_sentiment == "Positive"
                            ? "text-green-500"
                            : "text-transparent"
                    } text-xl`}
                  >
                    ●
                  </div>
                </div>
                <div className="">
                  <div className="font-medium  ">
                    <span className="font-normal">Call Summary: </span>
                    {call?.call_analysis?.call_summary === undefined ? (
                      <Skeleton className="w-[200px] h-[20px]" />
                    ) : (
                      call?.call_analysis?.call_summary
                    )}
                  </div>
                </div>
                <p className="font-medium ">
                  {call?.call_analysis?.call_completion_rating_reason}
                </p>
              </div>
            </div>
          </div>
          {analytics &&
            analytics.questionSummaries &&
            analytics.questionSummaries.length > 0 && (
              <div className="bg-slate-200 rounded-2xl min-h-[120px] p-4 px-5 my-3">
                <p className="font-semibold my-2 mb-4">Question Summary</p>
                <ScrollArea className="rounded-md h-72 text-sm mt-3 py-3 leading-6 overflow-y-scroll whitespace-pre-line px-2">
                  {analytics?.questionSummaries.map((qs, index) => (
                    <QuestionAnswerCard
                      key={qs.question}
                      questionNumber={index + 1}
                      question={qs.question}
                      answer={qs.summary}
                    />
                  ))}
                </ScrollArea>
              </div>
            )}
          <div className="bg-slate-200 rounded-2xl min-h-[150px] max-h-[500px] p-4 px-5 mb-[150px]">
            <p className="font-semibold my-2 mb-4">Transcript</p>
            <ScrollArea className="rounded-2xl text-sm h-96  overflow-y-auto whitespace-pre-line px-2">
              <div
                className="text-sm p-4 rounded-2xl leading-5 bg-slate-50"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: marked(transcript) }}
              />
            </ScrollArea>
          </div>

            {/* Debug Section - Only show in development */}
            {process.env.NODE_ENV === 'development' && debugInfo && (
              <div className="bg-yellow-100 rounded-2xl min-h-[120px] p-4 px-5 mb-[150px] border border-yellow-300">
                <p className="font-semibold my-2 mb-4 text-yellow-800">Debug Information</p>
                <div className="text-sm space-y-2">
                  <div>
                    <strong>Analytics Object:</strong> {analytics ? 'Present' : 'Missing'}
                  </div>
                  <div>
                    <strong>Overall Score:</strong> {analytics?.overallScore ?? 'undefined'}
                  </div>
                  <div>
                    <strong>Is Analysed:</strong> {debugInfo.is_analysed ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>API Error:</strong> {debugInfo.error || 'None'}
                  </div>
                  <div>
                    <strong>Call ID:</strong> {call_id}
                  </div>
                  <div>
                    <strong>Analytics Keys:</strong> {analytics ? Object.keys(analytics).join(', ') : 'No analytics'}
                  </div>
                  <div>
                    <strong>AI Test Result:</strong> {JSON.stringify(aiTestResult)}
                  </div>
                </div>
              </div>
            )}
        </>
      )}
    </div>
  );
}

export default CallInfo;
