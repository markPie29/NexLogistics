"use client";

import { useMemo, useState } from "react";
import {
  UserCheck,
  UserX,
  Clock,
  CalendarClock,
  Laptop,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useDriverStore, useHelperStore, useOfficeStaffStore } from "@/lib/store";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────────────
type AttStatus = "present" | "absent" | "late" | "on_leave" | "wfh" | "holiday" | "weekend" | "no_data";
type EmployeeType = "driver" | "helper" | "office";
type ViewMode = "week" | "2weeks" | "month";

interface Employee {
  id: string;
  name: string;
  role: string;
  type: EmployeeType;
  shift: string;
  shiftStart: string;
  shiftEnd: string;
  grace: number;
  workDays: string;
}

interface AttendanceCell {
  employeeId: string;
  date: string; // ISO date string
  status: AttStatus;
  checkIn?: string;
  checkOut?: string;
  lateMinutes?: number;
  hoursWorked?: number;
  otDescription?: string;
}

// ─── Status configuration ───────────────────────────────────────────────────
const STATUS_CONFIG: Record<AttStatus, { label: string; color: string; bg: string; ring?: string }> = {
  present: { label: "Present", color: "bg-emerald-500", bg: "bg-emerald-50" },
  absent: { label: "Absent", color: "bg-red-500", bg: "bg-red-50" },
  late: { label: "Late", color: "bg-amber-500", bg: "bg-amber-50" },
  on_leave: { label: "On Leave", color: "bg-sky-500", bg: "bg-sky-50" },
  wfh: { label: "WFH", color: "bg-purple-500", bg: "bg-purple-50" },
  holiday: { label: "Holiday", color: "bg-purple-200", bg: "bg-purple-50", ring: "ring-2 ring-purple-400" },
  weekend: { label: "Weekend", color: "bg-gray-300", bg: "bg-gray-50" },
  no_data: { label: "No Data", color: "bg-gray-200", bg: "bg-gray-50" },
};

// ─── Date utilities ─────────────────────────────────────────────────────────
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ─── Seed attendance data ───────────────────────────────────────────────────
function generateSeedAttendance(employees: Employee[], weekStart: Date): AttendanceCell[] {
  const cells: AttendanceCell[] = [];
  const today = formatDate(new Date(2026, 5, 11)); // Wed Jun 11, 2026

  employees.forEach((emp, empIdx) => {
    for (let dayOffset = 0; dayOffset < 28; dayOffset++) {
      const date = addDays(weekStart, dayOffset - 14); // 2 weeks before + 2 weeks after
      const dateStr = formatDate(date);
      const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat

      // Weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        cells.push({ employeeId: emp.id, date: dateStr, status: "weekend" });
        continue;
      }

      // Future dates get no_data
      if (dateStr > today) {
        cells.push({ employeeId: emp.id, date: dateStr, status: "no_data" });
        continue;
      }

      // Deterministic seed based on employee index and day
      const seed = (empIdx * 7 + dayOffset * 13) % 20;
      let status: AttStatus;
      let checkIn = "08:00";
      let checkOut = "17:00";
      let lateMinutes = 0;

      if (seed === 0) {
        status = "absent";
        checkIn = "";
        checkOut = "";
      } else if (seed === 1 || seed === 7) {
        status = "late";
        const lateMins = 15 + (empIdx * 5) % 30;
        lateMinutes = lateMins;
        const h = 8 + Math.floor(lateMins / 60);
        const m = (lateMins % 60) + (emp.grace || 0);
        checkIn = `${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
        checkOut = "17:30";
      } else if (seed === 3) {
        status = "on_leave";
        checkIn = "";
        checkOut = "";
      } else if (seed === 5 && emp.type === "office") {
        status = "wfh";
        checkIn = "08:30";
        checkOut = "17:30";
      } else {
        status = "present";
      }

      const hoursWorked = checkIn && checkOut
        ? Math.round(((parseInt(checkOut.split(":")[0]) * 60 + parseInt(checkOut.split(":")[1])) -
          (parseInt(checkIn.split(":")[0]) * 60 + parseInt(checkIn.split(":")[1]))) / 60 * 10) / 10
        : 0;

      cells.push({
        employeeId: emp.id,
        date: dateStr,
        status,
        checkIn: checkIn || undefined,
        checkOut: checkOut || undefined,
        lateMinutes: lateMinutes || undefined,
        hoursWorked: hoursWorked || undefined,
      });
    }
  });

  return cells;
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function AttendancePage() {
  const drivers = useDriverStore((s) => s.drivers);
  const helpers = useHelperStore((s) => s.helpers);
  const officeStaff = useOfficeStaffStore((s) => s.employees);

  // Build unified employee list
  const employees: Employee[] = useMemo(() => {
    const list: Employee[] = [];

    // 5 drivers
    drivers.slice(0, 5).forEach((d) => {
      list.push({
        id: d.id,
        name: d.name,
        role: "Driver",
        type: "driver",
        shift: "Morning Shift",
        shiftStart: "06:00",
        shiftEnd: "18:00",
        grace: 15,
        workDays: "Mon – Sat",
      });
    });

    // 2 active helpers
    helpers
      .filter((h) => h.status === "active")
      .slice(0, 2)
      .forEach((h) => {
        list.push({
          id: h.id,
          name: h.name,
          role: "Helper",
          type: "helper",
          shift: "Morning Shift",
          shiftStart: "06:00",
          shiftEnd: "18:00",
          grace: 15,
          workDays: "Mon – Sat",
        });
      });

    // 5 active office staff
    officeStaff
      .filter((e) => e.status === "active")
      .slice(0, 5)
      .forEach((e) => {
        list.push({
          id: e.id,
          name: e.name,
          role: e.position ?? "Office Staff",
          type: "office",
          shift: "Morning Shift",
          shiftStart: "08:00",
          shiftEnd: "17:00",
          grace: 10,
          workDays: "Mon – Fri",
        });
      });

    return list;
  }, [drivers, helpers, officeStaff]);

  // State
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | EmployeeType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AttStatus>("all");
  const [weekOffset, setWeekOffset] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{ employee: Employee; date: string } | null>(null);
  const [editStatus, setEditStatus] = useState<AttStatus>("present");
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editCheckOut, setEditCheckOut] = useState("");
  const [editOtDesc, setEditOtDesc] = useState("");

  // Attendance data (local state so edits persist within session)
  const baseWeekStart = getWeekStart(new Date(2026, 5, 11)); // Jun 8, 2026 (Mon)
  const currentWeekStart = addDays(baseWeekStart, weekOffset * 7);

  const [attendanceData, setAttendanceData] = useState<AttendanceCell[]>(() =>
    generateSeedAttendance(employees, baseWeekStart)
  );

  // Number of days to show based on view mode
  const daysToShow = viewMode === "week" ? 7 : viewMode === "2weeks" ? 14 : 28;

  // Generate day columns
  const dayColumns = useMemo(() => {
    const cols: { date: Date; label: string; dayNum: number; isToday: boolean }[] = [];
    for (let i = 0; i < daysToShow; i++) {
      const d = addDays(currentWeekStart, i);
      const isToday = formatDate(d) === "2026-06-11"; // Wed Jun 11
      cols.push({
        date: d,
        label: DAY_NAMES[i % 7],
        dayNum: d.getDate(),
        isToday,
      });
    }
    return cols;
  }, [currentWeekStart, daysToShow]);

  // Date range display
  const dateRangeLabel = useMemo(() => {
    const start = formatShortDate(currentWeekStart);
    const end = formatShortDate(addDays(currentWeekStart, daysToShow - 1));
    const year = currentWeekStart.getFullYear();
    return `${start} – ${end}, ${year}`;
  }, [currentWeekStart, daysToShow]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    let list = employees;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q));
    }
    if (typeFilter !== "all") {
      list = list.filter((e) => e.type === typeFilter);
    }
    if (statusFilter !== "all") {
      // Filter by today's status
      list = list.filter((e) => {
        const cell = attendanceData.find(
          (c) => c.employeeId === e.id && c.date === "2026-06-11"
        );
        return cell?.status === statusFilter;
      });
    }
    return list;
  }, [employees, searchQuery, typeFilter, statusFilter, attendanceData]);

  // KPI calculations based on today
  const todayCells = useMemo(
    () => attendanceData.filter((c) => c.date === "2026-06-11"),
    [attendanceData]
  );
  const kpis = useMemo(() => ({
    present: todayCells.filter((c) => c.status === "present").length,
    absent: todayCells.filter((c) => c.status === "absent").length,
    late: todayCells.filter((c) => c.status === "late").length,
    onLeave: todayCells.filter((c) => c.status === "on_leave").length,
    wfh: todayCells.filter((c) => c.status === "wfh").length,
  }), [todayCells]);

  // Get attendance for a cell
  function getCell(employeeId: string, dateStr: string): AttendanceCell | undefined {
    return attendanceData.find((c) => c.employeeId === employeeId && c.date === dateStr);
  }

  // Open modal
  function openEditModal(employee: Employee, dateStr: string) {
    const cell = getCell(employee.id, dateStr);
    setEditingCell({ employee, date: dateStr });
    setEditStatus(cell?.status || "no_data");
    setEditCheckIn(cell?.checkIn || "");
    setEditCheckOut(cell?.checkOut || "");
    setEditOtDesc(cell?.otDescription || "");
    setModalOpen(true);
  }

  // Compute late minutes and hours worked from edit fields
  const computedLateMinutes = useMemo(() => {
    if (!editingCell || !editCheckIn) return 0;
    const emp = editingCell.employee;
    const [sh, sm] = emp.shiftStart.split(":").map(Number);
    const [ch, cm] = editCheckIn.split(":").map(Number);
    const shiftMinutes = sh * 60 + sm + emp.grace;
    const checkInMinutes = ch * 60 + cm;
    return Math.max(0, checkInMinutes - shiftMinutes);
  }, [editingCell, editCheckIn]);

  const computedHoursWorked = useMemo(() => {
    if (!editCheckIn || !editCheckOut) return 0;
    const [ih, im] = editCheckIn.split(":").map(Number);
    const [oh, om] = editCheckOut.split(":").map(Number);
    const mins = (oh * 60 + om) - (ih * 60 + im);
    return Math.max(0, Math.round(mins / 6) / 10); // round to 1 decimal
  }, [editCheckIn, editCheckOut]);

  // Save
  function handleSave() {
    if (!editingCell) return;
    const { employee, date } = editingCell;

    setAttendanceData((prev) => {
      const idx = prev.findIndex((c) => c.employeeId === employee.id && c.date === date);
      const updated: AttendanceCell = {
        employeeId: employee.id,
        date,
        status: editStatus,
        checkIn: editCheckIn || undefined,
        checkOut: editCheckOut || undefined,
        lateMinutes: computedLateMinutes || undefined,
        hoursWorked: computedHoursWorked || undefined,
        otDescription: editOtDesc || undefined,
      };
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [...prev, updated];
    });

    toast.success(`Attendance updated for ${employee.name}`);
    setModalOpen(false);
    setEditingCell(null);
  }

  // Navigate
  function goToday() { setWeekOffset(0); }
  function goPrev() { setWeekOffset((o) => o - 1); }
  function goNext() { setWeekOffset((o) => o + 1); }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Attendance & Time Tracking"
        subtitle="Monitor daily attendance, clock-in/out times, and leave records across all employees"
        breadcrumbs={[{ label: "Finance & HR" }, { label: "Attendance" }]}
        actions={
          <Button size="sm" variant="outline" onClick={() => toast.success("Attendance report exported")}>
            <Download className="w-4 h-4 mr-1.5" /> Export Report
          </Button>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 lg:gap-4">
        <KpiCard label="Present Today" value={kpis.present} icon={UserCheck} iconColor="text-emerald-600" iconBg="bg-emerald-50" footerLabel="On duty" />
        <KpiCard label="Absent" value={kpis.absent} icon={UserX} iconColor="text-red-500" iconBg="bg-red-50" footerLabel="Unexcused" />
        <KpiCard label="Late" value={kpis.late} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" footerLabel="Clocked in late" />
        <KpiCard label="On Leave" value={kpis.onLeave} icon={CalendarClock} iconColor="text-sky-600" iconBg="bg-sky-50" footerLabel="Approved leave" />
        <KpiCard label="WFH" value={kpis.wfh} icon={Laptop} iconColor="text-purple-600" iconBg="bg-purple-50" footerLabel="Work from home" />
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-lg w-fit">
        {(["week", "2weeks", "month"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === mode
                ? "bg-white dark:bg-white/10 text-brand-navy dark:text-white shadow-sm"
                : "text-muted-foreground hover:text-brand-navy dark:hover:text-white"
            }`}
          >
            {mode === "week" ? "Week" : mode === "2weeks" ? "2 Weeks" : "Month"}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <Card className="border-brand-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search employee…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Employee Type */}
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Employee Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="driver">Drivers</SelectItem>
                <SelectItem value="helper">Helpers</SelectItem>
                <SelectItem value="office">Office Staff</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="wfh">WFH</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Navigation */}
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={goPrev} className="h-9 w-9 p-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToday} className="h-9 px-3">
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goNext} className="h-9 w-9 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-brand-navy dark:text-white ml-2 hidden sm:inline">
                {dateRangeLabel}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend Row */}
      <div className="flex flex-wrap items-center gap-4 px-1">
        {(Object.entries(STATUS_CONFIG) as [AttStatus, typeof STATUS_CONFIG[AttStatus]][]).map(([key, cfg]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`w-3 h-3 rounded-full ${cfg.color} ${cfg.ring || ""}`} />
            {cfg.label}
          </span>
        ))}
      </div>

      {/* Weekly Grid Table */}
      <Card className="border-brand-border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-[200px] sticky left-0 bg-white dark:bg-card z-10">
                    Employee
                  </th>
                  {dayColumns.map((col) => (
                    <th
                      key={formatDate(col.date)}
                      className={`text-center px-2 py-3 text-xs font-semibold min-w-[80px] ${
                        col.isToday
                          ? "bg-brand-teal/5 text-brand-teal"
                          : "text-muted-foreground"
                      }`}
                    >
                      <div>{col.label}</div>
                      <div className={`text-[11px] mt-0.5 ${col.isToday ? "font-bold" : "font-normal"}`}>
                        {col.dayNum}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 sticky left-0 bg-white dark:bg-card z-10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-navy text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {emp.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-brand-navy dark:text-white truncate">
                            {emp.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {emp.role}
                          </div>
                        </div>
                      </div>
                    </td>
                    {dayColumns.map((col) => {
                      const dateStr = formatDate(col.date);
                      const cell = getCell(emp.id, dateStr);
                      const status = cell?.status || "no_data";
                      const cfg = STATUS_CONFIG[status];
                      const isClickable = status !== "weekend";

                      return (
                        <td
                          key={dateStr}
                          className={`text-center px-2 py-2 ${
                            col.isToday ? "bg-brand-teal/5" : ""
                          }`}
                        >
                          <button
                            onClick={() => isClickable && openEditModal(emp, dateStr)}
                            disabled={!isClickable}
                            className={`inline-flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${
                              isClickable
                                ? "hover:bg-gray-100 dark:hover:bg-white/10 hover:shadow-sm cursor-pointer"
                                : "cursor-default opacity-60"
                            }`}
                            title={`${emp.name} · ${cfg.label} · ${new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full ${cfg.color} ${cfg.ring || ""} block`}
                            />
                            <span className="text-[10px] text-muted-foreground leading-none">
                              {cfg.label}
                            </span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={daysToShow + 1} className="text-center py-12 text-muted-foreground text-sm">
                      No employees found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Update Attendance Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-teal" />
              <DialogTitle>Update Attendance</DialogTitle>
            </div>
            <DialogDescription>
              Modify attendance record for this employee.
            </DialogDescription>
          </DialogHeader>

          {editingCell && (
            <div className="space-y-5">
              {/* Employee Info */}
              <div className="rounded-xl bg-gray-50 dark:bg-white/[0.04] p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-navy text-white text-[10px] font-bold flex items-center justify-center">
                    {editingCell.employee.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-brand-navy dark:text-white">
                      {editingCell.employee.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {editingCell.employee.role} · {new Date(editingCell.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-gray-200 dark:border-white/10">
                  <span className="font-medium">{editingCell.employee.shift}</span>
                  {" · "}
                  {editingCell.employee.shiftStart} – {editingCell.employee.shiftEnd}
                  {" (grace: "}{editingCell.employee.grace}{"min)"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Work days: {editingCell.employee.workDays}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-navy dark:text-white">Status</label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as AttStatus)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="wfh">WFH</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Time inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-navy dark:text-white">Check In</label>
                  <Input
                    type="time"
                    value={editCheckIn}
                    onChange={(e) => setEditCheckIn(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-navy dark:text-white">Check Out</label>
                  <Input
                    type="time"
                    value={editCheckOut}
                    onChange={(e) => setEditCheckOut(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Computed fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Late Minutes</label>
                  <div className="h-9 flex items-center px-3 rounded-lg border border-brand-border dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-sm font-medium text-brand-navy dark:text-white">
                    {computedLateMinutes} min
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Hours Worked</label>
                  <div className="h-9 flex items-center px-3 rounded-lg border border-brand-border dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-sm font-medium text-brand-navy dark:text-white">
                    {computedHoursWorked} hrs
                  </div>
                </div>
              </div>

              {/* OT Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-navy dark:text-white">OT Description (optional)</label>
                <Input
                  placeholder="e.g., Extended delivery to Pampanga"
                  value={editOtDesc}
                  onChange={(e) => setEditOtDesc(e.target.value)}
                  className="h-9"
                />
              </div>

              {/* Footer note */}
              <p className="text-[11px] text-muted-foreground italic border-t border-gray-100 dark:border-white/10 pt-3">
                This change will be logged for audit purposes.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-brand-teal hover:bg-brand-teal/90 text-white">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
