"use client";
import { FileText } from "lucide-react";
import { PreviewPage } from "@/components/layout/PreviewPage";

export default function DocumentsPage() {
  return (
    <PreviewPage
      title="Document Management"
      subtitle="Centralized vault for vehicle registrations, insurance, driver licenses, and compliance documents."
      icon={FileText}
      breadcrumbs={[{ label: "Others" }, { label: "Documents" }]}
      features={[
        { title: "Expiry Reminders", description: "Auto-alerts 30/60/90 days before LTO registration, OR/CR, insurance lapse." },
        { title: "OCR Document Scanning", description: "Upload via mobile camera, AI extracts plate, expiry, owner name." },
        { title: "Driver License Vault", description: "Track restrictions, classes, and renewal dates for every driver." },
        { title: "Insurance & TPL", description: "Compulsory insurance, comprehensive coverage tracking with claim history." },
        { title: "Compliance Audit Trail", description: "DOLE, LTFRB, and DTI documents organized for instant audit retrieval." },
        { title: "E-Signature Integration", description: "Sign contracts, waivers, and agreements digitally with timestamping." },
      ]}
    />
  );
}
