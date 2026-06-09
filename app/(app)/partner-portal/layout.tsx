export default function PartnerPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-[#0B1220] tracking-tight">Partner Portal</h1>
        <p className="text-sm text-muted-foreground mt-1">View trips, submit requests, track earnings, and manage your company profile.</p>
      </div>
      {children}
    </div>
  );
}
