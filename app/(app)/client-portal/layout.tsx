export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-[#0B1220] tracking-tight">Client Portal</h1>
        <p className="text-sm text-muted-foreground mt-1">Track shipments, review documents, settle invoices, and manage support requests.</p>
      </div>
      {children}
    </div>
  );
}
