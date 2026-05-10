"use client";
import { useMemo, useState } from "react";
import { CalendarClock, UserCheck, UserX, Clock, Calendar, ChevronLeft, ChevronRight as ChevRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useDriverStore } from "@/lib/store";
import { toast } from "sonner";

type AttStatus = "present" | "absent" | "late" | "on_leave" | "off_duty";

const ATT_VARIANT: Record<AttStatus, any> = {
  present: "success",
  absent: "danger",
  late: "warning",
  on_leave: "info",
  off_duty: "neutral",
};

// Seed deterministic attendance data for each driver
function seedAttendance(drivers: { id: string; name: string; status: string }[]) {
  const statuses: AttStatus[] = ["present", "present", "present", "late", "absent", "present", "on_leave"];
  return drivers.map((d, i) => ({
    driverId: d.id,
    name: d.name,
    today: d.status === "active" ? statuses[i % statuses.length] : d.status === "off_duty" ? "off_duty" : "on_leave" as AttStatus,
    clockIn: d.status === "active" ? (i % 3 === 0 ? "08:32 AM" : "08:00 AM") : "—",
    clockOut: d.status === "active" && i % 2 === 0 ? "05:00 PM" : "—",
    hoursWorked: d.status === "active" ? (i % 3 === 0 ? 8.5 : 9.0) : 0,
    monthPresent: 18 + (i % 4),
    monthAbsent: i % 3,
    monthLate: i % 2,
  }));
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AttendancePage() {
  const drivers = useDriverStore((s) => s.drivers);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [month, setMonth] = useState(4); // May (0-indexed)

  const attendance = useMemo(() => seedAttendance(drivers), [drivers]);

  const totalPresent = attendance.filter((a) => a.today === "present").length;
  const totalAbsent = attendance.filter((a) => a.today === "absent").length;
  const totalLate = attendance.filter((a) => a.today === "late").length;
  const totalLeave = attendance.filter((a) => a.today === "on_leave").length;

  const selected = attendance.find((a) => a.driverId === selectedDriver);

  // Simple calendar grid for current month
  const daysInMonth = new Date(2026, month + 1, 0).getDate();
  const firstDay = new Date(2026, month, 1).getDay(); // 0=Sun
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance & Time Tracking"
        subtitle="Monitor daily driver attendance, clock-in/out times, and leave records"
        breadcrumbs={[{ label: "Finance & HR" }, { label: "Attendance" }]}
        actions={
          <Button size="sm" variant="outline" onClick={() => toast.success("Attendance report exported")}>
            <Calendar className="w-4 h-4" /> Export Report
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard label="Present Today" value={totalPresent} icon={UserCheck} iconColor="text-emerald-600" iconBg="bg-emerald-50" footerLabel="On duty" />
        <KpiCard label="Absent" value={totalAbsent} icon={UserX} iconColor="text-red-500" iconBg="bg-red-50" footerLabel="Unexcused" />
        <KpiCard label="Late" value={totalLate} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" footerLabel="Clocked in late" />
        <KpiCard label="On Leave" value={totalLeave} icon={CalendarClock} iconColor="text-sky-600" iconBg="bg-sky-50" footerLabel="Approved leave" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Driver Attendance List */}
        <Card className="lg:col-span-2 border-brand-border shadow-sm">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="text-xl font-bold text-brand-navy">Today's Attendance</CardTitle>
            <p className="text-sm text-muted-foreground">May 10, 2026</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {attendance.map((a) => (
                <button
                  key={a.driverId}
                  onClick={() => setSelectedDriver(a.driverId === selectedDriver ? null : a.driverId)}
                  className={`w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left ${selectedDriver === a.driverId ? "bg-brand-teal-light/30 border-l-2 border-brand-teal" : ""}`}
                >
                  <div className="w-10 h-10 rounded-full bg-brand-navy text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {a.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-brand-navy">{a.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                      <span>In: {a.clockIn}</span>
                      {a.clockOut !== "—" && <span>Out: {a.clockOut}</span>}
                      {a.hoursWorked > 0 && <span>{a.hoursWorked}h worked</span>}
                    </div>
                  </div>
                  <Badge variant={ATT_VARIANT[a.today]}>{a.today.replace("_", " ")}</Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detail Panel */}
        <div className="space-y-4">
          {/* Monthly Calendar */}
          <Card className="border-brand-border shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-brand-navy">
                  {selected ? `${selected.name.split(" ")[0]}'s Calendar` : "Monthly Calendar"}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <button onClick={() => setMonth((m) => Math.max(0, m - 1))} className="p-1 rounded hover:bg-gray-100 transition">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-semibold text-brand-navy w-10 text-center">{MONTHS[month]}</span>
                  <button onClick={() => setMonth((m) => Math.min(11, m + 1))} className="p-1 rounded hover:bg-gray-100 transition">
                    <ChevRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS.map((d) => (
                  <div key={d} className="text-[10px] font-semibold text-muted-foreground text-center py-1">{d}</div>
                ))}
              </div>
              {/* Date cells */}
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: startOffset }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isToday = month === 4 && day === 10;
                  const isWeekend = (startOffset + i) % 7 >= 5;
                  const hasEvent = !isWeekend && selected && day <= 10;
                  const eventType = hasEvent ? (day % 7 === 0 ? "absent" : day % 5 === 0 ? "late" : "present") : null;
                  return (
                    <div
                      key={day}
                      className={`h-8 flex items-center justify-center text-xs rounded-lg transition-colors
                        ${isToday ? "bg-brand-teal text-white font-bold" : ""}
                        ${isWeekend && !isToday ? "text-gray-300" : ""}
                        ${eventType === "present" && !isToday ? "bg-emerald-50 text-emerald-700 font-medium" : ""}
                        ${eventType === "absent" && !isToday ? "bg-red-50 text-red-600 font-medium" : ""}
                        ${eventType === "late" && !isToday ? "bg-amber-50 text-amber-600 font-medium" : ""}
                        ${!hasEvent && !isToday && !isWeekend ? "text-brand-navy hover:bg-gray-50" : ""}
                      `}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                {[["bg-emerald-100", "Present"], ["bg-amber-100", "Late"], ["bg-red-100", "Absent"]].map(([cls, label]) => (
                  <span key={label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className={`w-3 h-3 rounded ${cls}`} />{label}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected Driver Stats */}
          {selected && (
            <Card className="border-brand-border shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-base font-bold text-brand-navy">Monthly Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {[
                  { label: "Days Present", value: selected.monthPresent, color: "text-emerald-600" },
                  { label: "Days Absent", value: selected.monthAbsent, color: "text-red-500" },
                  { label: "Days Late", value: selected.monthLate, color: "text-amber-600" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-brand-navy">Attendance Rate</span>
                    <span className="text-sm font-extrabold text-brand-teal">
                      {Math.round((selected.monthPresent / (selected.monthPresent + selected.monthAbsent)) * 100)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-brand-teal rounded-full"
                      style={{ width: `${Math.round((selected.monthPresent / (selected.monthPresent + selected.monthAbsent)) * 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!selected && (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-muted-foreground text-sm">
              <UserCheck className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              Click a driver to view their monthly summary
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


