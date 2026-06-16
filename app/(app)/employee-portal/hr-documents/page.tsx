"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Briefcase, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { useEmployeeProfileStore, useHRDocumentStore } from "@/lib/store/employee-portal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { HRDocument, HRDocumentType } from "@/lib/types";
import { toast } from "sonner";

const DOC_LABELS: Record<HRDocumentType, string> = {
  incident_report: "Incident Report",
  notice_to_explain: "Notice to Explain (NTE)",
  notice_of_decision: "Notice of Decision",
  written_warning: "Written Warning",
  suspension_notice: "Suspension Notice",
  termination_notice: "Termination Notice",
};

const DOC_COLORS: Record<HRDocumentType, string> = {
  incident_report: "bg-amber-100 text-amber-700",
  notice_to_explain: "bg-red-100 text-red-700",
  notice_of_decision: "bg-blue-100 text-blue-700",
  written_warning: "bg-orange-100 text-orange-700",
  suspension_notice: "bg-red-200 text-red-800",
  termination_notice: "bg-gray-800 text-white",
};

export default function HRDocumentsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const employees = useEmployeeProfileStore((s) => s.employees);
  const { documents, submitNTEResponse } = useHRDocumentStore();
  const profile = employees.find((e) => e.userId === user?.id);

  const [openDoc, setOpenDoc] = useState<HRDocument | null>(null);
  const [nteReply, setNteReply] = useState("");

  const myDocs = documents
    .filter((d) => d.employeeId === profile?.id)
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

  const handleNTESubmit = () => {
    if (!openDoc || nteReply.trim().length < 10) {
      toast.error("Please write a proper response (min 10 characters).");
      return;
    }
    submitNTEResponse(openDoc.id, nteReply.trim());
    toast.success("Your response has been submitted.");
    setOpenDoc(null);
    setNteReply("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0B1220] text-white px-4 pt-10 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-xs text-white/60">Employee Portal</div>
            <div className="text-lg font-bold">HR Documents</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {myDocs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <div className="text-sm font-medium text-gray-500">No HR documents</div>
            <div className="text-xs text-muted-foreground mt-1">Documents issued to you by HR will appear here.</div>
          </div>
        ) : (
          myDocs.map((doc) => {
            const needsResponse = doc.type === "notice_to_explain" && !doc.employeeResponse;
            return (
              <button
                key={doc.id}
                onClick={() => { setOpenDoc(doc); setNteReply(doc.employeeResponse ?? ""); }}
                className="w-full bg-white rounded-2xl border border-gray-100 px-4 py-4 text-left active:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DOC_COLORS[doc.type]}`}>
                        {DOC_LABELS[doc.type]}
                      </span>
                      {needsResponse && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Response Required
                        </span>
                      )}
                      {doc.employeeResponse && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Responded
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-[#0B1220] truncate">{doc.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      Issued by {doc.issuedBy} · {new Date(doc.issuedAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Document view dialog */}
      <Dialog open={!!openDoc} onOpenChange={() => setOpenDoc(null)}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          {openDoc && (
            <>
              <DialogHeader>
                <DialogTitle>{openDoc.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DOC_COLORS[openDoc.type]}`}>
                    {DOC_LABELS[openDoc.type]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(openDoc.issuedAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}
                  </span>
                </div>

                <div className="text-xs font-semibold text-muted-foreground">Issued by</div>
                <div className="text-sm font-medium">{openDoc.issuedBy}</div>

                <div className="text-xs font-semibold text-muted-foreground">Content</div>
                <div className="text-sm leading-relaxed bg-brand-navy-light rounded-xl p-3 border text-white">
                  {openDoc.body}
                </div>

                {openDoc.type === "notice_to_explain" && (
                  <>
                    <div className="text-xs font-semibold text-muted-foreground mt-2">
                      Your Written Response {openDoc.employeeResponse ? "(Submitted)" : "(Required)"}
                    </div>
                    {openDoc.employeeResponse ? (
                      <div className="text-sm bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-emerald-800">
                        {openDoc.employeeResponse}
                        <div className="text-[10px] text-emerald-600 mt-1">
                          Submitted on {openDoc.respondedAt ? new Date(openDoc.respondedAt).toLocaleDateString("en-PH", { dateStyle: "medium" }) : "—"}
                        </div>
                      </div>
                    ) : (
                      <textarea
                        value={nteReply}
                        onChange={(e) => setNteReply(e.target.value)}
                        placeholder="Write your explanation here..."
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/40 h-32 resize-none text-brand-navy"
                      />
                    )}
                  </>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenDoc(null)}>Close</Button>
                {openDoc.type === "notice_to_explain" && !openDoc.employeeResponse && (
                  <Button variant="primary" onClick={handleNTESubmit} className = "bg-brand-teal hover:bg-brand-teal/80">
                    Submit Response
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
