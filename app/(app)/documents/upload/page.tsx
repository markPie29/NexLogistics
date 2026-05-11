"use client";
import { useState } from "react";
import {
  CloudUpload, Folder, HelpCircle, CheckCircle2, Trash2, Calendar
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useDocumentStore } from "@/lib/store/documents";
import { useRouter } from "next/navigation";

export default function UploadDocumentPage() {
  const router = useRouter();
  const addDocument = useDocumentStore(s => s.addDocument);

  const [name, setName] = useState("Rate Agreement - ABC Construction");
  const [category, setCategory] = useState("Contracts");
  const [type, setType] = useState("PDF");
  const [owner, setOwner] = useState("ABC Construction Inc.");
  const [relatedTo, setRelatedTo] = useState("Customer");
  const [description, setDescription] = useState("Rate agreement for dedicated logistics services with ABC Construction Inc.");
  const [accessLevel, setAccessLevel] = useState<"public" | "internal" | "private">("public");
  
  const [effectiveDate, setEffectiveDate] = useState("2024-05-31");
  const [expiryDate, setExpiryDate] = useState("2025-05-31");
  const [version, setVersion] = useState("1.0");
  const [folder, setFolder] = useState("Contracts / 2024");

  const [files, setFiles] = useState([
    { name: "Rate Agreement - ABC Construction.pdf", type: "PDF", size: "1.24 MB" },
    { name: "Insurance Certificate - Truck 105.docx", type: "DOCX", size: "513 KB" }
  ]);

  const handleUpload = () => {
    addDocument({
      id: `doc-${Date.now()}`,
      name: name || files[0]?.name || "New Document",
      category,
      type,
      sizeMB: 1.24,
      ownerId: "client1",
      relatedToType: relatedTo,
      tags: ["Contract", "Customer"],
      description,
      accessLevel,
      effectiveDate,
      expiryDate,
      version,
      folder,
      status: "active"
    });
    toast.success("Document uploaded successfully");
    router.push("/documents");
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B1220] tracking-tight">Upload Document</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload and organize documents securely in the system.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.back()} className="h-9 px-4 text-xs font-semibold">Cancel</Button>
          <Button onClick={handleUpload} className="bg-[#008A56] hover:bg-[#007045] text-white h-9 px-4 text-xs font-semibold">
            <CloudUpload className="w-4 h-4 mr-2" /> Upload Document
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1 */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-gray-800">1. Upload Files</h2>
            <Card className="border-gray-200 border-dashed bg-gray-50/50">
              <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                <CloudUpload className="w-12 h-12 text-blue-500 mb-4" />
                <div className="text-base font-semibold text-gray-800 mb-1">
                  Drag and drop files here <span className="font-normal text-gray-500">or</span> <span className="text-blue-600 cursor-pointer hover:underline">click to browse</span>
                </div>
                <p className="text-xs text-gray-500 mb-6">Supports PDF, DOC, DOCX, XLS, XLSX, JPG, PNG and ZIP<br/>Maximum file size: 50 MB per file</p>
                <Button variant="outline" className="h-9 bg-white text-blue-600 border-blue-200 hover:bg-blue-50 font-semibold text-xs px-6">
                  <Folder className="w-4 h-4 mr-2" /> Browse Files
                </Button>
              </CardContent>
            </Card>

            <div className="pt-2">
              <h3 className="text-xs font-bold text-gray-600 mb-3">Uploaded Files ({files.length})</h3>
              <div className="space-y-3">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold text-white ${file.type === "PDF" ? "bg-red-500" : "bg-blue-500"}`}>
                        {file.type}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{file.name}</div>
                        <div className="text-xs text-gray-500">{file.type} • {file.size}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center text-xs font-semibold text-[#008A56]">
                        Completed <CheckCircle2 className="w-4 h-4 ml-1.5" />
                      </div>
                      <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-3 pt-4">
            <h2 className="text-sm font-bold text-gray-800">2. Document Details</h2>
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="p-5 space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Document Name <span className="text-red-500">*</span></label>
                    <Input value={name} onChange={e => setName(e.target.value)} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Category <span className="text-red-500">*</span></label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full h-9 px-3 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-teal">
                      <option>Contracts</option>
                      <option>Invoices</option>
                      <option>Insurance</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Document Type <span className="text-red-500">*</span></label>
                    <select value={type} onChange={e => setType(e.target.value)} className="w-full h-9 px-3 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-teal">
                      <option>PDF</option>
                      <option>DOCX</option>
                      <option>XLSX</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Owner <span className="text-red-500">*</span></label>
                    <select value={owner} onChange={e => setOwner(e.target.value)} className="w-full h-9 px-3 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-teal">
                      <option>ABC Construction Inc.</option>
                      <option>Internal User</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Related To</label>
                    <select value={relatedTo} onChange={e => setRelatedTo(e.target.value)} className="w-full h-9 px-3 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-teal">
                      <option>Customer</option>
                      <option>Vendor</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Tags</label>
                    <div className="h-9 px-2 border border-gray-200 rounded-md flex items-center gap-1.5 bg-gray-50/50">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-semibold">Contract</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-semibold">Customer</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Description</label>
                  <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    className="w-full h-20 p-3 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-teal resize-none"
                  />
                  <div className="text-right text-[10px] text-gray-400">74 / 500</div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    Access Level <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                  </label>
                  <div className="flex gap-6">
                    <label className="flex items-start gap-2 cursor-pointer group">
                      <input type="radio" checked={accessLevel === "public"} onChange={() => setAccessLevel("public")} className="mt-0.5 accent-[#008A56] w-4 h-4" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-[#008A56] transition-colors">Public</div>
                        <div className="text-xs text-gray-500">All users with the link can view</div>
                      </div>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer group">
                      <input type="radio" checked={accessLevel === "internal"} onChange={() => setAccessLevel("internal")} className="mt-0.5 accent-[#008A56] w-4 h-4" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-[#008A56] transition-colors">Internal</div>
                        <div className="text-xs text-gray-500">Only logged-in users can view</div>
                      </div>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer group">
                      <input type="radio" checked={accessLevel === "private"} onChange={() => setAccessLevel("private")} className="mt-0.5 accent-[#008A56] w-4 h-4" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-[#008A56] transition-colors">Private</div>
                        <div className="text-xs text-gray-500">Only selected users can view</div>
                      </div>
                    </label>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-gray-800">3. Additional Information</h2>
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="p-5 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Effective Date</label>
                  <div className="relative">
                    <Input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} className="h-9 text-xs pl-3" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Expiry Date (Optional)</label>
                  <div className="relative">
                    <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="h-9 text-xs pl-3" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Version</label>
                  <Input value={version} onChange={e => setVersion(e.target.value)} className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-gray-700">Select Folder (Optional)</label>
                  <select value={folder} onChange={e => setFolder(e.target.value)} className="w-full h-9 px-3 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-teal">
                    <option>Contracts / 2024</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-blue-50/50 border-blue-100 shadow-sm">
            <CardContent className="p-5 flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-gray-800 mb-1">Supported File Types</h4>
                <p className="text-xs text-gray-600 mb-2">PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, ZIP</p>
                <p className="text-xs text-gray-600">Maximum file size: 50 MB per file</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-100 bg-amber-50/30 shadow-sm">
            <CardContent className="p-5">
              <h4 className="text-xs font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-amber-500">💡</span> Tips
              </h4>
              <ul className="space-y-2 text-xs text-gray-700">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#008A56] shrink-0 mt-0.5" /> Ensure documents are clear and legible</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#008A56] shrink-0 mt-0.5" /> Use relevant categories and tags for easy search</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#008A56] shrink-0 mt-0.5" /> Add expiry dates for time-sensitive documents</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#008A56] shrink-0 mt-0.5" /> Private documents are only visible to selected users</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <h4 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-gray-400" /> Need Help?
              </h4>
              <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                If you have any questions or need assistance, please contact our support team.
              </p>
              <Button variant="outline" className="w-full text-xs font-semibold h-9">
                Contact Support <CloudUpload className="w-3.5 h-3.5 ml-2 rotate-45" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
