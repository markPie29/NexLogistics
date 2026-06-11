"use client";

import { useState, useMemo } from "react";
import { Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useClientDocuments } from "@/lib/hooks/client-portal";
import {
  DOCUMENT_CATEGORIES,
  isDocumentNew,
  type DocumentCategory,
} from "@/lib/utils/client-portal";
import { toast } from "sonner";

const CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All Categories" },
  { value: "Delivery", label: "Delivery" },
  { value: "Compliance", label: "Compliance" },
  { value: "Financial", label: "Financial" },
  { value: "Rate", label: "Rate" },
];

const TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All Types" },
  { value: "PDF", label: "PDF" },
  { value: "DOCX", label: "DOCX" },
  { value: "XLSX", label: "XLSX" },
];

export default function ClientPortalDocumentsPage() {
  const { documents } = useClientDocuments();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDocuments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return documents.filter((doc) => {
      const matchesCategory =
        categoryFilter === "all" || doc.category === categoryFilter;
      const matchesType = typeFilter === "all" || doc.type === typeFilter;
      const matchesSearch =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.uploadedBy.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q);
      return matchesCategory && matchesType && matchesSearch;
    });
  }, [documents, categoryFilter, typeFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="pl-9 h-10 text-sm focus-visible:ring-2 focus-visible:ring-brand-teal"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px] focus-visible:ring-2 focus-visible:ring-brand-teal">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px] focus-visible:ring-2 focus-visible:ring-brand-teal">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Documents Table */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No documents found
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="px-4 py-3 text-xs">Document Name</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-xs">Category</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-xs">Type</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-xs">Uploaded By</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-xs">Upload Date</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-xs">Size</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-xs text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.map((doc) => (
              <TableRow key={doc.id} className="h-12 hover:bg-brand-teal-light">
                <TableCell className="px-4 py-3 text-sm font-medium text-brand-navy">
                  <div className="flex items-center gap-2">
                    {doc.name}
                    {isDocumentNew(doc.uploadedAt) && (
                      <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0">
                        New
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  <Badge
                    variant="outline"
                    className="text-xs font-normal"
                  >
                    {doc.category}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-xs">{doc.type}</TableCell>
                <TableCell className="px-4 py-3 text-sm">{doc.uploadedBy}</TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  {new Date(doc.uploadedAt).toLocaleDateString("en-PH")}
                </TableCell>
                <TableCell className="px-4 py-3 text-xs">{doc.sizeKb} KB</TableCell>
                <TableCell className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 focus-visible:ring-2 focus-visible:ring-brand-teal"
                    aria-label={`Download ${doc.name}`}
                    onClick={() =>
                      toast.success(`Download started for ${doc.name}`)
                    }
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
