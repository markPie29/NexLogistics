"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuthStore } from "@/lib/store/auth";
import { resetAllDemoData } from "@/lib/store";
import { Settings as SettingsIcon, User as UserIcon, Bell, Lock, Palette, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleReset = () => {
    if (!confirmReset) { setConfirmReset(true); setTimeout(() => setConfirmReset(false), 5000); return; }
    toast.success("Resetting demo data...");
    setTimeout(() => resetAllDemoData(), 500);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your profile, preferences, and demo data" breadcrumbs={[{ label: "Others" }, { label: "Settings" }]} />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile"><UserIcon className="w-4 h-4 mr-1.5" />Profile</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-1.5" />Notifications</TabsTrigger>
          <TabsTrigger value="security"><Lock className="w-4 h-4 mr-1.5" />Security</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="w-4 h-4 mr-1.5" />Appearance</TabsTrigger>
          <TabsTrigger value="demo"><RefreshCw className="w-4 h-4 mr-1.5" />Demo Data</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20"><AvatarImage src={user?.avatarUrl} /><AvatarFallback>{initials(user?.name || "")}</AvatarFallback></Avatar>
                <div>
                  <Button size="sm" variant="outline">Change Photo</Button>
                  <p className="text-xs text-muted-foreground mt-2">JPG, PNG up to 2MB</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Full Name</Label><Input defaultValue={user?.name} /></div>
                <div><Label>Email</Label><Input defaultValue={user?.email} type="email" /></div>
                <div><Label>Phone</Label><Input defaultValue={user?.phone || ""} /></div>
                <div><Label>Role</Label><Input defaultValue={user?.role} disabled /></div>
              </div>
              <div className="flex justify-end"><Button onClick={() => toast.success("Profile saved (demo)")}>Save Changes</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Notification Preferences <Badge variant="preview" className="ml-2">Preview</Badge></CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {["Trip status updates", "Maintenance alerts", "Driver issues", "Daily summary email", "POD captured", "Weekly fleet report"].map((item) => (
                <div key={item} className="flex items-center justify-between p-3 rounded-lg border border-brand-border">
                  <span className="text-sm font-medium">{item}</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-teal" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Security <Badge variant="preview" className="ml-2">Preview</Badge></CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Current Password</Label><Input type="password" placeholder="••••••••" /></div>
              <div><Label>New Password</Label><Input type="password" /></div>
              <div><Label>Confirm New Password</Label><Input type="password" /></div>
              <Button onClick={() => toast.success("Password updated (demo)")}>Update Password</Button>
              <div className="border-t pt-4 mt-4">
                <h4 className="font-bold text-brand-navy mb-2">Two-Factor Authentication <Sparkles className="w-3 h-3 inline text-brand-teal" /></h4>
                <p className="text-sm text-muted-foreground mb-3">Add an extra layer of security to your account.</p>
                <Button variant="outline">Enable 2FA</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Appearance <Badge variant="preview" className="ml-2">Preview</Badge></CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[{ name: "Light", c: "bg-white border-2 border-brand-teal" }, { name: "Dark", c: "bg-brand-navy" }, { name: "System", c: "bg-gradient-to-br from-white to-brand-navy" }].map((t) => (
                  <button key={t.name} className="p-4 rounded-xl border border-brand-border hover:border-brand-teal transition">
                    <div className={`w-full h-20 rounded-lg ${t.c} mb-2`} />
                    <div className="text-sm font-medium">{t.name}</div>
                  </button>
                ))}
              </div>
              <div><Label>Accent Color</Label>
                <div className="flex gap-2 mt-2">
                  {["#66B2B2", "#0EA5E9", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"].map((c) => (
                    <button key={c} className="w-10 h-10 rounded-full border-4 border-white ring-1 ring-brand-border hover:ring-brand-navy" style={{ background: c }} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demo" className="mt-4">
          <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><RefreshCw className="w-5 h-5 text-amber-600" /> Reset Demo Data</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">This will clear all locally stored data (vehicles, drivers, trips, expenses, payroll, POD, etc.) and reload the app with fresh seed data. <strong>This cannot be undone.</strong></p>
              <div className="flex gap-2">
                <Button variant={confirmReset ? "destructive" : "outline"} onClick={handleReset}>
                  {confirmReset ? "Click again to confirm reset" : "Reset Demo Data"}
                </Button>
                {confirmReset && <Button variant="ghost" onClick={() => setConfirmReset(false)}>Cancel</Button>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
