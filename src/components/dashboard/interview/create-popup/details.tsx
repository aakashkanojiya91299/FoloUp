import React, { useState, useEffect } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { useInterviewers } from "@/contexts/interviewers.context";
import { InterviewBase, Question } from "@/types/interview";
import { ChevronRight, ChevronLeft, Info } from "lucide-react";
import Image from "next/image";
import { CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import FileUpload from "../fileUpload";
import Modal from "@/components/dashboard/Modal";
import InterviewerDetailsModal from "@/components/dashboard/interviewer/interviewerDetailsModal";
import { Interviewer } from "@/types/interviewer";
import { useClerk, useOrganization } from "@clerk/nextjs";

interface Props {
  open: boolean;
  setLoading: (loading: boolean) => void;
  interviewData: InterviewBase;
  setInterviewData: (interviewData: InterviewBase) => void;
  isUploaded: boolean;
  setIsUploaded: (isUploaded: boolean) => void;
  fileName: string;
  setFileName: (fileName: string) => void;
}

function DetailsPopup({
  open,
  setLoading,
  interviewData,
  setInterviewData,
  isUploaded,
  setIsUploaded,
  fileName,
  setFileName,
}: Props) {
  const { interviewers } = useInterviewers();
  const { user } = useClerk();
  const { organization } = useOrganization();
  const [isClicked, setIsClicked] = useState(false);
  const [openInterviewerDetails, setOpenInterviewerDetails] = useState(false);
  const [interviewerDetails, setInterviewerDetails] = useState<Interviewer>();
  const [selectedAIProvider, setSelectedAIProvider] = useState<
    "openai" | "gemini"
  >("openai");
  const [isSwitchingProvider, setIsSwitchingProvider] = useState(false);
  const [lastUsedProvider, setLastUsedProvider] = useState<
    "openai" | "gemini" | null
  >(null);

  const [name, setName] = useState(interviewData.name);
  const [selectedInterviewer, setSelectedInterviewer] = useState(
    interviewData.interviewer_id,
  );
  const [objective, setObjective] = useState(interviewData.objective);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(
    interviewData.is_anonymous,
  );
  const [numQuestions, setNumQuestions] = useState(
    interviewData.question_count == 0
      ? ""
      : String(interviewData.question_count),
  );
  const [duration, setDuration] = useState(interviewData.time_duration);
  const [uploadedDocumentContext, setUploadedDocumentContext] = useState("");

  const slideLeft = (id: string, value: number) => {
    var slider = document.getElementById(`${id}`);
    if (slider) {
      slider.scrollLeft = slider.scrollLeft - value;
    }
  };

  const slideRight = (id: string, value: number) => {
    var slider = document.getElementById(`${id}`);
    if (slider) {
      slider.scrollLeft = slider.scrollLeft + value;
    }
  };

  const switchAIProvider = async (provider: "openai" | "gemini") => {
    if (provider === selectedAIProvider) {return;}

    setIsSwitchingProvider(true);
    try {
      console.log(`Switching from ${selectedAIProvider} to ${provider}`);
      await axios.post("/api/ai-provider", {
        provider,
        organizationId: organization?.id,
        userId: user?.id,
      });
      setSelectedAIProvider(provider);
      console.log(`Successfully switched to ${provider}`);
      toast.success(`Switched to ${provider} provider successfully!`);
    } catch (error) {
      console.error("Failed to switch AI provider:", error);
      toast.error(
        `Failed to switch to ${provider} provider. Please try again.`,
      );
    } finally {
      setIsSwitchingProvider(false);
    }
  };

  const getCurrentProvider = async () => {
    try {
      const response = await axios.get("/api/ai-provider", {
        params: {
          organizationId: organization?.id,
          userId: user?.id,
        },
      });
      const provider = response.data.provider;
      console.log(`Current provider from API: ${provider}`);
      setSelectedAIProvider(provider);
    } catch (error) {
      console.error("Failed to get current provider:", error);
    }
  };

  useEffect(() => {
    getCurrentProvider();
  }, []);

  const onGenrateQuestions = async () => {
    setLoading(true);
    setIsClicked(true);

    const data = {
      jobTitle: name.trim(),
      jobDescription: objective.trim(),
      questionCount: numQuestions,
      context: uploadedDocumentContext,
      provider: selectedAIProvider,
      organizationId: organization?.id,
      userId: user?.id,
    };

    let providersToTry =
      selectedAIProvider === "openai"
        ? ["openai", "gemini"]
        : ["gemini", "openai"];
    let success = false;
    let lastError = null;

    for (const provider of providersToTry) {
      try {
        const res = await axios.post("/api/generate-interview-questions", {
          ...data,
          provider,
        });

        let generatedQuestionsResponse;
        if (res?.data?.response) {
          try {
            generatedQuestionsResponse = JSON.parse(res.data.response);
          } catch (parseErr) {
            throw new Error("Invalid JSON response from AI provider");
          }
        } else if (res?.data?.questions) {
          generatedQuestionsResponse = {
            questions: res.data.questions,
            description: res.data.description || "",
          };
        } else {
          throw new Error("No valid response from AI provider");
        }

        const updatedQuestions = generatedQuestionsResponse.questions.map(
          (question: Question) => ({
            id: uuidv4(),
            question: question.question.trim(),
            follow_up_count: 1,
          }),
        );

        const updatedInterviewData = {
          ...interviewData,
          name: name.trim(),
          objective: objective.trim(),
          questions: updatedQuestions,
          interviewer_id: selectedInterviewer,
          question_count: Number(numQuestions),
          time_duration: duration,
          description: generatedQuestionsResponse.description,
          job_description: uploadedDocumentContext,
          is_anonymous: isAnonymous,
        };
        setInterviewData(updatedInterviewData);
        setLastUsedProvider(provider as "openai" | "gemini");
        toast.success(
          `Questions generated successfully using ${provider.toUpperCase()}!`,
        );
        success = true;
        break;
      } catch (error) {
        lastError = error;
        console.error(`Error with provider ${provider}:`, error);
      }
    }

    if (!success) {
      toast.error(
        "Failed to generate questions with all AI providers. Please try again later.",
      );
      setLoading(false);
      setIsClicked(false);
    }
  };

  const onManual = () => {
    setLoading(true);

    const updatedInterviewData = {
      ...interviewData,
      name: name.trim(),
      objective: objective.trim(),
      questions: [{ id: uuidv4(), question: "", follow_up_count: 1 }],
      interviewer_id: selectedInterviewer,
      question_count: Number(numQuestions),
      time_duration: String(duration),
      description: "",
      job_description: uploadedDocumentContext,
      is_anonymous: isAnonymous,
    };
    setInterviewData(updatedInterviewData);
  };

  useEffect(() => {
    if (!open) {
      setName("");
      setSelectedInterviewer(BigInt(0));
      setObjective("");
      setIsAnonymous(false);
      setNumQuestions("");
      setDuration("");
      setIsClicked(false);
    }
  }, [open]);

  useEffect(() => {
    getCurrentProvider();
  }, [getCurrentProvider]);

  return (
    <>
      <div className="text-center w-[38rem]">
        <h1 className="text-xl font-semibold">Create an Interview</h1>
        <div className="flex flex-col justify-center items-start mt-4 ml-10 mr-8">
          <div className="flex flex-row justify-center items-center">
            <h3 className="text-sm font-medium">Interview Name:</h3>
            <input
              type="text"
              className="border-b-2 focus:outline-none border-gray-500 px-2 w-96 py-0.5 ml-3"
              placeholder="e.g. Name of the Interview"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={(e) => setName(e.target.value.trim())}
            />
          </div>
          <h3 className="text-sm mt-3 font-medium">Select an Interviewer:</h3>
          <div className="relative flex items-center mt-1">
            <div
              id="slider-3"
              className=" h-36 pt-1 overflow-x-scroll scroll whitespace-nowrap scroll-smooth scrollbar-hide w-[27.5rem]"
            >
              {interviewers.map((item, key) => (
                <div
                  className=" p-0 inline-block cursor-pointer ml-1 mr-5 rounded-xl shrink-0 overflow-hidden"
                  key={item.id}
                >
                  <button
                    className="absolute ml-9"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInterviewerDetails(item);
                      setOpenInterviewerDetails(true);
                    }}
                  >
                    <Info size={18} color="#4f46e5" strokeWidth={2.2} />
                  </button>
                  <div
                    className={`w-[96px] overflow-hidden rounded-full ${
                      selectedInterviewer === item.id
                        ? "border-4 border-[#06546e]"
                        : ""
                    }`}
                    onClick={() => setSelectedInterviewer(item.id)}
                  >
                    <Image
                      src={item.image}
                      alt="Picture of the interviewer"
                      width={70}
                      height={70}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardTitle className="mt-0 text-xs text-center">
                    {item.name}
                  </CardTitle>
                </div>
              ))}
            </div>
            {interviewers.length > 4 ? (
              <div className="flex-row justify-center ml-3 mb-1 items-center space-y-6">
                <ChevronRight
                  className="opacity-50 cursor-pointer hover:opacity-100"
                  size={27}
                  onClick={() => slideRight("slider-3", 115)}
                />
                <ChevronLeft
                  className="opacity-50 cursor-pointer hover:opacity-100"
                  size={27}
                  onClick={() => slideLeft("slider-3", 115)}
                />
              </div>
            ) : (
              <></>
            )}
          </div>
          <h3 className="text-sm font-medium">Objective:</h3>
          <Textarea
            value={objective}
            className="h-24 mt-2 border-2 border-gray-500 w-[33.2rem]"
            placeholder="e.g. Find best candidates based on their technical skills and previous projects."
            onChange={(e) => setObjective(e.target.value)}
            onBlur={(e) => setObjective(e.target.value.trim())}
          />
          <h3 className="text-sm font-medium mt-2">
            Upload any documents related to the interview.
          </h3>
          <FileUpload
            isUploaded={isUploaded}
            setIsUploaded={setIsUploaded}
            fileName={fileName}
            setFileName={setFileName}
            setUploadedDocumentContext={setUploadedDocumentContext}
          />
          <label className="flex-col mt-7 w-full">
            <div className="flex items-center cursor-pointer">
              <span className="text-sm font-medium">
                Do you prefer the interviewees&apos; responses to be anonymous?
              </span>
              <Switch
                checked={isAnonymous}
                className={`ml-4 mt-1 ${
                  isAnonymous ? "bg-[#06546e]" : "bg-[#E6E7EB]"
                }`}
                onCheckedChange={(checked) => setIsAnonymous(checked)}
              />
            </div>
            <span
              style={{ fontSize: "0.7rem", lineHeight: "0.66rem" }}
              className="font-light text-xs italic w-full text-left block"
            >
              Note: If not anonymous, the interviewee&apos;s email and name will
              be collected.
            </span>
          </label>
          <div className="flex flex-row gap-3 justify-between w-full mt-3">
            <div className="flex flex-row justify-center items-center ">
              <h3 className="text-sm font-medium ">Number of Questions:</h3>
              <input
                type="number"
                step="1"
                max="5"
                min="1"
                className="border-b-2 text-center focus:outline-none  border-gray-500 w-14 px-2 py-0.5 ml-3"
                value={numQuestions}
                onChange={(e) => {
                  let value = e.target.value;
                  if (
                    value === "" ||
                    (Number.isInteger(Number(value)) && Number(value) > 0)
                  ) {
                    if (Number(value) > 5) {
                      value = "5";
                    }
                    setNumQuestions(value);
                  }
                }}
              />
            </div>
            <div className="flex flex-row justify-center items-center">
              <h3 className="text-sm font-medium ">Duration (mins):</h3>
              <input
                type="number"
                step="1"
                max="10"
                min="1"
                className="border-b-2 text-center focus:outline-none  border-gray-500 w-14 px-2 py-0.5 ml-3"
                value={duration}
                onChange={(e) => {
                  let value = e.target.value;
                  if (
                    value === "" ||
                    (Number.isInteger(Number(value)) && Number(value) > 0)
                  ) {
                    if (Number(value) > 10) {
                      value = "10";
                    }
                    setDuration(value);
                  }
                }}
              />
            </div>
          </div>

          {/* AI Provider Selection */}
          <div className="mt-4 w-full">
            <h3 className="text-sm font-medium mb-2">
              AI Provider for Question Generation:
            </h3>
            <div className="flex gap-2">
              <Button
                variant={
                  selectedAIProvider === "openai" ? "default" : "outline"
                }
                size="sm"
                disabled={isSwitchingProvider}
                className="flex-1"
                onClick={() => switchAIProvider("openai")}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  OpenAI GPT-4
                  {selectedAIProvider === "openai" && (
                    <Badge variant="secondary" className="ml-1">
                      Active
                    </Badge>
                  )}
                  {isSwitchingProvider && selectedAIProvider !== "openai" && (
                    <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin ml-1" />
                  )}
                </div>
              </Button>
              <Button
                variant={
                  selectedAIProvider === "gemini" ? "default" : "outline"
                }
                size="sm"
                disabled={isSwitchingProvider}
                className="flex-1"
                onClick={() => switchAIProvider("gemini")}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Google Gemini
                  {selectedAIProvider === "gemini" && (
                    <Badge variant="secondary" className="ml-1">
                      Active
                    </Badge>
                  )}
                  {isSwitchingProvider && selectedAIProvider !== "gemini" && (
                    <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin ml-1" />
                  )}
                </div>
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {selectedAIProvider === "openai"
                ? "High-quality responses with GPT-4 (higher cost)"
                : "Cost-effective responses with Gemini (lower cost)"}
              {isSwitchingProvider && " • Switching..."}
              {lastUsedProvider && (
                <span className="ml-2 text-green-600">
                  • Last used: {lastUsedProvider.toUpperCase()}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-row w-full justify-center items-center space-x-24 mt-5">
            <Button
              disabled={
                (name &&
                objective &&
                numQuestions &&
                duration &&
                selectedInterviewer != BigInt(0)
                  ? false
                  : true) || isClicked
              }
              className="bg-[#06546e] hover:bg-[#06546e]/80  w-40"
              onClick={() => {
                setIsClicked(true);
                onGenrateQuestions();
              }}
            >
              Generate Questions
            </Button>
            <Button
              disabled={
                (name &&
                objective &&
                numQuestions &&
                duration &&
                selectedInterviewer != BigInt(0)
                  ? false
                  : true) || isClicked
              }
              className="bg-[#06546e] w-40 hover:bg-[#06546e]/80"
              onClick={() => {
                setIsClicked(true);
                onManual();
              }}
            >
              I&apos;ll do it myself
            </Button>
          </div>
        </div>
      </div>
      <Modal
        open={openInterviewerDetails}
        closeOnOutsideClick={true}
        onClose={() => {
          setOpenInterviewerDetails(false);
        }}
      >
        <InterviewerDetailsModal interviewer={interviewerDetails} />
      </Modal>
    </>
  );
}

export default DetailsPopup;
