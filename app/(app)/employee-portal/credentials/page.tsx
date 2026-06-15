"use client";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CreditCard, Heart, Upload, QrCode } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { useEmployeeProfileStore, useCredentialStore } from "@/lib/store/employee-portal";
import { Button } from "@/components/ui/button";
import type { CredentialType } from "@/lib/types";
import { toast } from "sonner";

export default function CredentialsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const employees = useEmployeeProfileStore((s) => s.employees);
  const { credentials, upsert } = useCredentialStore();

  const profile = employees.find((e) => e.userId === user?.id);
  const idRef = useRef<HTMLInputElement>(null);
  const hcRef = useRef<HTMLInputElement>(null);

  const myCredentials = credentials.filter((c) => c.employeeId === profile?.id);
  const companyId = myCredentials.find((c) => c.type === "company_id");
  const healthCard = myCredentials.find((c) => c.type === "health_card");

  const handleUpload = (type: CredentialType, file: File | null) => {
    if (!file || !profile) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      upsert(profile.id, type, reader.result as string);
      toast.success(`${type === "company_id" ? "Company ID" : "Health Card"} uploaded successfully.`);
    };
    reader.readAsDataURL(file);
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
            <div className="text-lg font-bold">Virtual Credentials</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Company ID Card */}
        <CredentialCard
          title="Company ID"
          subtitle="Scan or show for company access"
          icon={<CreditCard className="w-5 h-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
          credential={companyId}
          employeeName={user?.name}
          employeeId={profile?.id}
          department={profile?.department}
          position={profile?.position}
          fileRef={idRef}
          onUpload={(f) => handleUpload("company_id", f)}
        />

        {/* Health Card */}
        <CredentialCard
          title="Health Card"
          subtitle="Philippine Health Insurance Card"
          icon={<Heart className="w-5 h-5 text-rose-600" />}
          iconBg="bg-rose-50"
          credential={healthCard}
          employeeName={user?.name}
          employeeId={profile?.id}
          department={profile?.department}
          position={profile?.position}
          fileRef={hcRef}
          onUpload={(f) => handleUpload("health_card", f)}
        />
      </div>
    </div>
  );
}

function CredentialCard({
  title, subtitle, icon, iconBg, credential, employeeName,
  employeeId, department, position, fileRef, onUpload,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  credential?: { fileUrl?: string; uploadedAt?: string };
  employeeName?: string;
  employeeId?: string;
  department?: string;
  position?: string;
  fileRef: React.RefObject<HTMLInputElement>;
  onUpload: (f: File | null) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>{icon}</div>
        <div>
          <div className="text-sm font-bold text-[#0B1220]">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>

      {/* ID visual or upload prompt */}
      {credential?.fileUrl ? (
        <div className="p-4 space-y-3">
          {/* Uploaded image preview */}
          {credential.fileUrl.startsWith("data:image") ? (
            <img
              src={credential.fileUrl}
              alt={title}
              className="w-full rounded-xl border border-gray-100 object-contain max-h-48"
            />
          ) : (
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 text-center">
              <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <div className="text-xs text-muted-foreground">Document uploaded</div>
            </div>
          )}

          {/* Employee info */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1">
            <div className="text-sm font-bold text-[#0B1220]">{employeeName ?? "—"}</div>
            <div className="text-xs text-muted-foreground">{position ?? "—"} · {department ?? "—"}</div>
            <div className="text-[10px] text-muted-foreground">ID: {employeeId ?? "—"}</div>
            {credential.uploadedAt && (
              <div className="text-[10px] text-muted-foreground">
                Uploaded: {new Date(credential.uploadedAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}
              </div>
            )}
          </div>

          {/* Re-upload */}
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 text-xs text-brand-teal font-medium py-2 rounded-xl border border-brand-teal/30 bg-brand-teal/5 active:bg-brand-teal/10"
          >
            <Upload className="w-3.5 h-3.5" /> Re-upload
          </button>
        </div>
      ) : (
        <div className="p-8 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Upload className="w-7 h-7 text-gray-400" />
          </div>
          <div className="text-sm font-medium text-gray-500 text-center">No {title} uploaded yet</div>
          <div className="text-xs text-muted-foreground text-center">Upload a photo or PDF of your {title.toLowerCase()}</div>
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            className="mt-1"
          >
            <Upload className="w-4 h-4 mr-2" /> Upload {title}
          </Button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
