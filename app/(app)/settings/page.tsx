"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuthStore } from "@/lib/store/auth";
import { resetAllDemoData, useUiStore } from "@/lib/store";
import {
  Settings as SettingsIcon,
  User as UserIcon,
  Bell,
  Lock,
  Palette,
  RefreshCw,
  Sun,
  Moon,
  Monitor,
  Shield,
  Users,
  UserPlus,
  Pencil,
  UserX,
  Save,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { seedUsers } from "@/lib/data/users";
import type { Role } from "@/lib/types";

// ---------- RBAC Data ----------

const roleBadgeColors: Record<Role, string> = {
  super_admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  company_admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  dispatcher: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  driver: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  helper: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  accounting: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  client: "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300",
  partner: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  employee: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
};

const roleLabels: Record<Role, string> = {
  super_admin: "Super Admin",
  company_admin: "Company Admin",
  dispatcher: "Dispatcher",
  driver: "Driver",
  helper: "Helper",
  accounting: "Accounting",
  client: "Client",
  partner: "Partner",
  employee: "Employee",
};

const allRoles: Role[] = [
  "super_admin",
  "company_admin",
  "dispatcher",
  "driver",
  "helper",
  "accounting",
  "client",
  "partner",
  "employee",
];

const permissionAreas = [
  "Dashboard",
  "Fleet Management",
  "Driver Management",
  "Helper Management",
  "Trip & Dispatch",
  "Trip Approvals",
  "Payroll",
  "Expenses",
  "Attendance",
  "Billing",
  "Reports",
  "AI Insights",
  "Documents",
  "Warehouse",
  "Settings",
  "Profit Center",
] as const;

type PermissionArea = (typeof permissionAreas)[number];

// Default permissions matrix
const defaultPermissions: Record<Role, Record<PermissionArea, boolean>> = {
  super_admin: {
    Dashboard: true,
    "Fleet Management": true,
    "Driver Management": true,
    "Helper Management": true,
    "Trip & Dispatch": true,
    "Trip Approvals": true,
    Payroll: true,
    Expenses: true,
    Attendance: true,
    Billing: true,
    Reports: true,
    "AI Insights": true,
    Documents: true,
    Warehouse: true,
    Settings: true,
    "Profit Center": true,
  },
  company_admin: {
    Dashboard: true,
    "Fleet Management": true,
    "Driver Management": true,
    "Helper Management": true,
    "Trip & Dispatch": true,
    "Trip Approvals": true,
    Payroll: true,
    Expenses: true,
    Attendance: true,
    Billing: true,
    Reports: true,
    "AI Insights": true,
    Documents: true,
    Warehouse: true,
    Settings: false,
    "Profit Center": true,
  },
  dispatcher: {
    Dashboard: true,
    "Fleet Management": true,
    "Driver Management": true,
    "Helper Management": true,
    "Trip & Dispatch": true,
    "Trip Approvals": true,
    Payroll: false,
    Expenses: false,
    Attendance: false,
    Billing: false,
    Reports: false,
    "AI Insights": false,
    Documents: true,
    Warehouse: false,
    Settings: false,
    "Profit Center": false,
  },
  driver: {
    Dashboard: true,
    "Fleet Management": false,
    "Driver Management": false,
    "Helper Management": false,
    "Trip & Dispatch": false,
    "Trip Approvals": false,
    Payroll: false,
    Expenses: false,
    Attendance: false,
    Billing: false,
    Reports: false,
    "AI Insights": false,
    Documents: false,
    Warehouse: false,
    Settings: false,
    "Profit Center": false,
  },
  helper: {
    Dashboard: true,
    "Fleet Management": false,
    "Driver Management": false,
    "Helper Management": false,
    "Trip & Dispatch": false,
    "Trip Approvals": false,
    Payroll: false,
    Expenses: false,
    Attendance: false,
    Billing: false,
    Reports: false,
    "AI Insights": false,
    Documents: false,
    Warehouse: false,
    Settings: false,
    "Profit Center": false,
  },
  accounting: {
    Dashboard: true,
    "Fleet Management": false,
    "Driver Management": false,
    "Helper Management": false,
    "Trip & Dispatch": false,
    "Trip Approvals": false,
    Payroll: true,
    Expenses: true,
    Attendance: true,
    Billing: true,
    Reports: true,
    "AI Insights": false,
    Documents: false,
    Warehouse: false,
    Settings: false,
    "Profit Center": true,
  },
  client: {
    Dashboard: true,
    "Fleet Management": false,
    "Driver Management": false,
    "Helper Management": false,
    "Trip & Dispatch": false,
    "Trip Approvals": false,
    Payroll: false,
    Expenses: false,
    Attendance: false,
    Billing: false,
    Reports: false,
    "AI Insights": false,
    Documents: true,
    Warehouse: false,
    Settings: false,
    "Profit Center": false,
  },
  partner: {
    Dashboard: true,
    "Fleet Management": false,
    "Driver Management": false,
    "Helper Management": false,
    "Trip & Dispatch": false,
    "Trip Approvals": false,
    Payroll: false,
    Expenses: false,
    Attendance: false,
    Billing: false,
    Reports: false,
    "AI Insights": false,
    Documents: false,
    Warehouse: false,
    Settings: false,
    "Profit Center": false,
  },
  employee: {
    Dashboard: true,
    "Fleet Management": false,
    "Driver Management": false,
    "Helper Management": false,
    "Trip & Dispatch": false,
    "Trip Approvals": false,
    Payroll: false,
    Expenses: false,
    Attendance: false,
    Billing: false,
    Reports: false,
    "AI Insights": false,
    Documents: false,
    Warehouse: false,
    Settings: false,
    "Profit Center": false,
  },
};

// Simulated last login dates
const lastLogins: Record<string, string> = {
  "u-001": "2025-01-15 09:32",
  "u-002": "2025-01-15 08:15",
  "u-003": "2025-01-14 17:45",
  "u-004": "2025-01-15 06:00",
  "u-005": "2025-01-13 14:20",
  "u-006": "2025-01-12 10:30",
  "u-007": "2025-01-14 07:00",
  "u-008": "2025-01-10 11:55",
  "u-999": "2025-01-15 10:00",
};

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const darkMode = useUiStore((s) => s.darkMode);
  const toggleDarkMode = useUiStore((s) => s.toggleDarkMode);
  const [confirmReset, setConfirmReset] = useState(false);

  // Users & Roles state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: Role;
    phone: string;
  } | null>(null);
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    role: "driver" as Role,
  });
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "driver" as Role,
    phone: "",
  });

  // Permissions matrix state (editable)
  const [permissions, setPermissions] = useState<
    Record<Role, Record<PermissionArea, boolean>>
  >(defaultPermissions);

  const handleTogglePermission = (role: Role, area: PermissionArea) => {
    setPermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [area]: !prev[role][area],
      },
    }));
  };

  const handleSavePermissions = () => {
    toast.success("Permissions saved successfully");
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 5000);
      return;
    }
    toast.success("Resetting demo data...");
    setTimeout(() => resetAllDemoData(), 500);
  };

  const handleInvite = () => {
    if (!inviteForm.name || !inviteForm.email) {
      toast.error("Name and Email are required");
      return;
    }
    toast.success(`Invite sent to ${inviteForm.email}`);
    setInviteForm({ name: "", email: "", role: "driver" });
    setInviteOpen(false);
  };

  const handleEditOpen = (u: (typeof seedUsers)[number]) => {
    setEditUser({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone || "",
    });
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone || "",
    });
    setEditOpen(true);
  };

  const handleEditSave = () => {
    toast.success(`User "${editForm.name}" updated successfully`);
    setEditOpen(false);
  };

  const handleRoleChange = (userId: string, userName: string, newRole: Role) => {
    toast.success(
      `Role for "${userName}" changed to ${roleLabels[newRole]}`
    );
  };

  // Filter out platform owner from visible users
  const visibleUsers = seedUsers.filter((u) => !u.isPlatformOwner);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your profile, users, roles, and system preferences"
        breadcrumbs={[{ label: "Administration" }, { label: "Settings" }]}
      />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <UserIcon className="w-4 h-4 mr-1.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="users-roles">
            <Shield className="w-4 h-4 mr-1.5" />
            Users &amp; Roles
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-1.5" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="w-4 h-4 mr-1.5" />
            Security
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="w-4 h-4 mr-1.5" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="demo">
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Demo Data
          </TabsTrigger>
        </TabsList>

        {/* ========== PROFILE TAB ========== */}
        <TabsContent value="profile" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={user?.avatarUrl} />
                  <AvatarFallback>
                    {initials(user?.name || "")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button size="sm" variant="outline">
                    Change Photo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    JPG, PNG up to 2MB
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input defaultValue={user?.name} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input defaultValue={user?.email} type="email" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input defaultValue={user?.phone || ""} />
                </div>
                <div>
                  <Label>Role</Label>
                  <Input defaultValue={user?.role} disabled />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => toast.success("Profile saved successfully")}
                >
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Company Name</Label>
                  <Input defaultValue="NEX Logistics Inc." disabled />
                </div>
                <div>
                  <Label>Company ID</Label>
                  <Input defaultValue="NEX-2024-001" disabled />
                </div>
                <div>
                  <Label>Plan</Label>
                  <Input defaultValue="Enterprise" disabled />
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== USERS & ROLES TAB ========== */}
        <TabsContent value="users-roles" className="mt-4 space-y-6">
          {/* Header with Invite Button */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-brand-navy dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-teal" /> User Management
              </h3>
              <p className="text-sm text-muted-foreground">
                {visibleUsers.length} users registered in the system
              </p>
            </div>
            <Button onClick={() => setInviteOpen(true)} className="gap-2">
              <UserPlus className="w-4 h-4" /> Invite User
            </Button>
          </div>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border bg-gray-50/50 dark:bg-white/5">
                      <th className="text-left px-4 py-3 font-medium text-brand-gray">
                        Name
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-brand-gray">
                        Email
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-brand-gray">
                        Role
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-brand-gray">
                        Phone
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-brand-gray">
                        Status
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-brand-gray">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-brand-border last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-xs bg-brand-teal/10 text-brand-teal font-semibold">
                                {initials(u.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-brand-navy dark:text-white">
                              {u.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-brand-gray">
                          {u.email}
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            defaultValue={u.role}
                            onValueChange={(v) =>
                              handleRoleChange(u.id, u.name, v as Role)
                            }
                          >
                            <SelectTrigger className="w-[150px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {allRoles.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {roleLabels[r]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3 text-brand-gray">
                          {u.phone || "\u2014"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            Active
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEditOpen(u)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              onClick={() =>
                                toast.info(`${u.name} deactivated (demo)`)
                              }
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Role Permissions Matrix */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-teal" /> Role
                Permissions Matrix
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Configure which roles have access to each system area. Changes
                are applied when you click Save Permissions.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-brand-border bg-gray-50 dark:bg-white/5">
                      <th className="text-left px-4 py-3 font-medium text-brand-gray min-w-[180px]">
                        Permission Area
                      </th>
                      {allRoles.map((role) => (
                        <th
                          key={role}
                          className="text-center px-2 py-3 font-medium text-brand-gray min-w-[100px]"
                        >
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleBadgeColors[role]}`}
                          >
                            {roleLabels[role]}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {permissionAreas.map((area) => (
                      <tr
                        key={area}
                        className="border-b border-brand-border last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-brand-navy dark:text-white">
                          {area}
                        </td>
                        {allRoles.map((role) => (
                          <td key={role} className="text-center px-2 py-3">
                            <Checkbox
                              checked={permissions[role][area]}
                              onCheckedChange={() =>
                                handleTogglePermission(role, area)
                              }
                              className="mx-auto"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end p-4 border-t border-brand-border">
                <Button onClick={handleSavePermissions} className="gap-2">
                  <Save className="w-4 h-4" /> Save Permissions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== NOTIFICATIONS TAB ========== */}
        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Trip status updates",
                "Maintenance alerts",
                "Driver issues",
                "Daily summary email",
                "POD captured",
                "Weekly fleet report",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between p-3 rounded-lg border border-brand-border"
                >
                  <span className="text-sm font-medium">{item}</span>
                  <Checkbox defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== SECURITY TAB ========== */}
        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Current Password</Label>
                <Input type="password" placeholder="Enter current password" />
              </div>
              <div>
                <Label>New Password</Label>
                <Input type="password" />
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <Input type="password" />
              </div>
              <Button
                onClick={() => toast.success("Password updated successfully")}
              >
                Update Password
              </Button>
              <div className="border-t pt-4 mt-4">
                <h4 className="font-bold text-brand-navy dark:text-white mb-2 flex items-center gap-2">
                  Two-Factor Authentication
                  <ShieldCheck className="w-4 h-4 text-brand-teal" />
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Add an extra layer of security to your account.
                </p>
                <Button variant="outline">Enable 2FA</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== APPEARANCE TAB ========== */}
        <TabsContent value="appearance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-semibold text-brand-navy dark:text-white mb-3 block">
                  Theme
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => darkMode && toggleDarkMode()}
                    className={`p-4 rounded-xl border-2 transition ${!darkMode ? "border-brand-teal shadow-sm" : "border-brand-border hover:border-brand-teal/60"}`}
                  >
                    <div className="w-full h-20 rounded-lg bg-white border border-gray-200 mb-2 flex items-center justify-center">
                      <Sun className="w-6 h-6 text-brand-teal" />
                    </div>
                    <div className="text-sm font-semibold text-brand-navy dark:text-white">
                      Light
                    </div>
                    {!darkMode && (
                      <div className="text-xs text-brand-teal mt-0.5 font-medium">
                        Active
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => !darkMode && toggleDarkMode()}
                    className={`p-4 rounded-xl border-2 transition ${darkMode ? "border-brand-teal shadow-sm" : "border-brand-border hover:border-brand-teal/60"}`}
                  >
                    <div className="w-full h-20 rounded-lg bg-brand-navy mb-2 flex items-center justify-center">
                      <Moon className="w-6 h-6 text-brand-teal" />
                    </div>
                    <div className="text-sm font-semibold text-brand-navy dark:text-white">
                      Dark
                    </div>
                    {darkMode && (
                      <div className="text-xs text-brand-teal mt-0.5 font-medium">
                        Active
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() =>
                      toast.info("System theme syncing coming soon")
                    }
                    className="p-4 rounded-xl border-2 border-brand-border hover:border-brand-teal/60 transition"
                  >
                    <div className="w-full h-20 rounded-lg bg-gradient-to-br from-white to-brand-navy mb-2 flex items-center justify-center">
                      <Monitor className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-sm font-semibold text-brand-navy dark:text-white">
                      System
                    </div>
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold text-brand-navy dark:text-white mb-3 block">
                  Accent Color
                </Label>
                <div className="flex gap-2 mt-2">
                  {[
                    "#66B2B2",
                    "#0EA5E9",
                    "#10B981",
                    "#F59E0B",
                    "#8B5CF6",
                    "#EC4899",
                  ].map((c) => (
                    <button
                      key={c}
                      onClick={() =>
                        toast.info(`Accent ${c} - override coming soon`)
                      }
                      className="w-10 h-10 rounded-full border-4 border-white ring-1 ring-brand-border hover:ring-brand-navy transition"
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== DEMO DATA TAB ========== */}
        <TabsContent value="demo" className="mt-4">
          <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-amber-600" /> Reset Demo
                Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will clear all locally stored data (vehicles, drivers,
                trips, expenses, payroll, POD, etc.) and reload the app with
                fresh seed data.{" "}
                <strong>This action cannot be undone.</strong>
              </p>
              <div className="flex gap-2">
                <Button
                  variant={confirmReset ? "destructive" : "outline"}
                  onClick={handleReset}
                >
                  {confirmReset
                    ? "Click again to confirm reset"
                    : "Reset Demo Data"}
                </Button>
                {confirmReset && (
                  <Button
                    variant="ghost"
                    onClick={() => setConfirmReset(false)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ========== INVITE USER DIALOG ========== */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={inviteForm.name}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, name: e.target.value })
                }
                placeholder="Full name"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, email: e.target.value })
                }
                placeholder="user@company.com"
                type="email"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(v) =>
                  setInviteForm({ ...inviteForm, role: v as Role })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {roleLabels[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite}>Send Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== EDIT USER DIALOG ========== */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
                type="email"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) =>
                  setEditForm({ ...editForm, role: v as Role })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {roleLabels[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
