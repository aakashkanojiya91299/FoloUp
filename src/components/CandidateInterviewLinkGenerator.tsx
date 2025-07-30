"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Copy,
  ExternalLink,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Link as LinkIcon,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { CandidateInterviewLink } from "@/services/candidateInterviewLinks.service";

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Interview {
  id: string;
  name: string;
  objective: string;
}

interface CandidateInterviewLinkGeneratorProps {
  candidate: Candidate;
  interview: Interview;
  onLinkCreated?: (link: CandidateInterviewLink) => void;
}

export default function CandidateInterviewLinkGenerator({
  candidate,
  interview,
  onLinkCreated,
}: CandidateInterviewLinkGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expirationType, setExpirationType] = useState<
    "never" | "date" | "hours"
  >("never");
  const [expirationDate, setExpirationDate] = useState("");
  const [expirationHours, setExpirationHours] = useState("24");
  const [notes, setNotes] = useState("");
  const [existingLinks, setExistingLinks] = useState<CandidateInterviewLink[]>(
    [],
  );
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadExistingLinks();
    }
  }, [isOpen, candidate.id]);

  const loadExistingLinks = async () => {
    setIsLoadingLinks(true);
    try {
      const response = await axios.get(
        `/api/generate-candidate-link?candidate_id=${candidate.id}`,
      );
      if (response.data.success) {
        setExistingLinks(response.data.links);
      }
    } catch (error) {
      console.error("Error loading existing links:", error);
    } finally {
      setIsLoadingLinks(false);
    }
  };

  const generateLink = async () => {
    setIsLoading(true);
    try {
      let expiresAt: Date | undefined;

      if (expirationType === "date" && expirationDate) {
        expiresAt = new Date(expirationDate);
      } else if (expirationType === "hours" && expirationHours) {
        expiresAt = new Date(
          Date.now() + parseInt(expirationHours) * 60 * 60 * 1000,
        );
      }

      const response = await axios.post("/api/generate-candidate-link", {
        candidate_id: candidate.id,
        interview_id: interview.id,
        expires_at: expiresAt?.toISOString(),
        notes: notes.trim() || undefined,
      });

      if (response.data.success) {
        toast.success("Interview link generated successfully!");
        setExistingLinks((prev) => [response.data.link, ...prev]);
        onLinkCreated?.(response.data.link);
        setIsOpen(false);
        resetForm();
      } else {
        toast.error("Failed to generate interview link");
      }
    } catch (error: any) {
      console.error("Error generating link:", error);
      toast.error(
        error.response?.data?.error || "Failed to generate interview link",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const deleteLink = async (linkId: string) => {
    try {
      await axios.delete(`/api/generate-candidate-link/${linkId}`);
      setExistingLinks((prev) => prev.filter((link) => link.id !== linkId));
      toast.success("Link deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete link");
    }
  };

  const resetForm = () => {
    setExpirationType("never");
    setExpirationDate("");
    setExpirationHours("24");
    setNotes("");
  };

  const getStatusBadge = (status: string, expiresAt?: Date) => {
    if (status === "completed") {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    } else if (status === "expired") {
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    } else {
      return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
    }
  };

  const formatExpiration = (expiresAt?: Date) => {
    if (!expiresAt) {
      return "After Interview Completion";
    }

    return new Date(expiresAt).toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4" />
          Generate Link
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] md:w-[90vw] overflow-hidden">
        <DialogHeader className="pb-4 flex-shrink-0">
          <DialogTitle className="text-lg">
            Generate Interview Link for {candidate.name}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Create a unique interview link for this candidate.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 p-1">
            {/* Left Column - Candidate Info & Link Settings */}
            <div className="space-y-4">
              {/* Candidate Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Candidate Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium">Name</Label>
                      <p className="text-sm text-gray-600">{candidate.name}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Email</Label>
                      <p className="text-sm text-gray-600">{candidate.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Link Generation Form */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Link Settings</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div>
                    <Label htmlFor="expiration-type" className="text-xs">
                      Expiration
                    </Label>
                    <Select
                      value={expirationType}
                      onValueChange={(value: "never" | "date" | "hours") =>
                        setExpirationType(value)
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">
                          After Interview Completion
                        </SelectItem>
                        <SelectItem value="date">Specific Date</SelectItem>
                        <SelectItem value="hours">Hours from now</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {expirationType === "date" && (
                    <div>
                      <Label htmlFor="expiration-date" className="text-xs">
                        Expiration Date
                      </Label>
                      <Input
                        className="h-8"
                        id="expiration-date"
                        type="datetime-local"
                        value={expirationDate}
                        onChange={(e) => setExpirationDate(e.target.value)}
                      />
                    </div>
                  )}

                  {expirationType === "hours" && (
                    <div>
                      <Label htmlFor="expiration-hours" className="text-xs">
                        Hours from now
                      </Label>
                      <Input
                        className="h-8"
                        id="expiration-hours"
                        max="720"
                        min="1"
                        type="number"
                        value={expirationHours}
                        onChange={(e) => setExpirationHours(e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="notes" className="text-xs">
                      Notes (Optional)
                    </Label>
                    <Textarea
                      className="text-sm"
                      id="notes"
                      placeholder="Add any notes about this interview link..."
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Existing Links */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Existing Links</CardTitle>
                  <CardDescription className="text-xs">
                    Previously generated links for this candidate
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 max-h-[250px] md:max-h-[300px] overflow-y-auto">
                  {isLoadingLinks ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
                    </div>
                  ) : existingLinks.length > 0 ? (
                    <div className="space-y-3">
                      {existingLinks.map((link) => (
                        <div key={link.id} className="border rounded-lg p-2">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(link.status, link.expires_at)}
                              <span className="text-xs text-gray-500">
                                Created:{" "}
                                {(() => {
                                  const date = new Date(link.created_at);
                                  return date.toLocaleDateString();
                                })()}
                              </span>
                            </div>
                            <Button
                              className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteLink(link.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="flex flex-col gap-1 mb-2">
                            <div className="flex items-center gap-1">
                              <Input
                                value={link.link_url}
                                className="text-xs flex-1 h-7 min-w-0"
                                readOnly
                              />
                              <Button
                                className="h-7 w-7 p-0 flex-shrink-0"
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(link.link_url)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                className="h-7 w-7 p-0 flex-shrink-0"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  window.open(link.link_url, "_blank")
                                }
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1 text-xs text-gray-600">
                            <div className="flex items-center gap-1 min-w-0">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                {link.expires_at
                                  ? `Expires: ${formatExpiration(link.expires_at)}`
                                  : "Expires: After Interview Completion"}
                              </span>
                            </div>
                            {link.notes && (
                              <div className="flex items-center gap-1 min-w-0">
                                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{link.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No links generated yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button disabled={isLoading} onClick={generateLink}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Generating...
              </>
            ) : (
              <>
                <LinkIcon className="h-4 w-4 mr-2" />
                Generate Link
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
