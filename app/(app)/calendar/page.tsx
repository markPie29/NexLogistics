"use client";
import { useState, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalIcon,
  Trash2, Save, Filter,
} from "lucide-react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, format, isSameMonth, isSameDay, parseISO, isWithinInterval, startOfDay, endOfDay,
} from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useCalendarStore } from "@/lib/store";
import { useAuthStore } from "@/lib/store/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { toast } from "sonner";
import {
  CALENDAR_DEPARTMENT_COLORS,
  CALENDAR_DEPARTMENT_LABELS,
  type CalendarDepartment, type CalendarEvent,
} from "@/lib/types";

const ALL_DEPS: CalendarDepartment[] = ["admin", "hr", "operation", "accounting", "sales", "subcon"];

export default function CalendarPage() {
  const events = useCalendarStore((s) => s.events);
  const visibleDepartments = useCalendarStore((s) => s.visibleDepartments);
  const toggleDepartment = useCalendarStore((s) => s.toggleDepartment);
  const addEvent = useCalendarStore((s) => s.addEvent);
  const updateEvent = useCalendarStore((s) => s.updateEvent);
  const deleteEvent = useCalendarStore((s) => s.deleteEvent);
  const user = useAuthStore((s) => s.user);

  const [cursor, setCursor] = useState(new Date());
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [creatingDate, setCreatingDate] = useState<Date | null>(null);
  const [draft, setDraft] = useState({
    title: "", department: "operation" as CalendarDepartment,
    start: "", end: "", allDay: false, location: "", notes: "",
  });

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  // Build 6-week grid
  const days = useMemo(() => {
    const arr: Date[] = [];
    let d = gridStart;
    while (d <= gridEnd) { arr.push(d); d = addDays(d, 1); }
    return arr;
  }, [gridStart, gridEnd]);

  const visibleEvents = useMemo(
    () => events.filter((e) => visibleDepartments.includes(e.department)),
    [events, visibleDepartments]
  );

  const eventsForDay = (day: Date) =>
    visibleEvents.filter((e) => {
      const s = parseISO(e.start);
      const en = parseISO(e.end);
      return isWithinInterval(day, { start: startOfDay(s), end: endOfDay(en) });
    });

  const openCreate = (day: Date) => {
    const s = format(day, "yyyy-MM-dd'T'09:00");
    const e = format(day, "yyyy-MM-dd'T'10:00");
    setCreatingDate(day);
    setDraft({ title: "", department: "operation", start: s, end: e, allDay: false, location: "", notes: "" });
    setEditing(null);
  };

  const openEdit = (ev: CalendarEvent) => {
    setEditing(ev);
    setCreatingDate(null);
    setDraft({
      title: ev.title,
      department: ev.department,
      start: format(parseISO(ev.start), "yyyy-MM-dd'T'HH:mm"),
      end: format(parseISO(ev.end), "yyyy-MM-dd'T'HH:mm"),
      allDay: !!ev.allDay,
      location: ev.location || "",
      notes: ev.notes || "",
    });
  };

  const close = () => { setEditing(null); setCreatingDate(null); };

  const save = () => {
    if (!draft.title.trim()) { toast.error("Title is required"); return; }
    if (!draft.start || !draft.end) { toast.error("Start and end are required"); return; }
    const payload = {
      title: draft.title.trim(),
      department: draft.department,
      start: new Date(draft.start).toISOString(),
      end: new Date(draft.end).toISOString(),
      allDay: draft.allDay,
      location: draft.location.trim() || undefined,
      notes: draft.notes.trim() || undefined,
    };
    if (editing) {
      updateEvent(editing.id, payload);
      toast.success("Event updated");
    } else {
      addEvent({ ...payload, createdBy: user?.name || "User" });
      toast.success("Event added");
    }
    close();
  };

  const remove = () => {
    if (!editing) return;
    deleteEvent(editing.id);
    toast.success("Event deleted");
    close();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Calendar"
        subtitle="Schedule events across Admin, HR, Operation, Accounting, Sales, and Subcon"
        breadcrumbs={[{ label: "Workspace" }, { label: "Calendar" }]}
        actions={
          <Button size="sm" onClick={() => openCreate(new Date())}><Plus className="w-4 h-4" /> New Event</Button>
        }
      />

      {/* Toolbar */}
      <Card><CardContent className="p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => setCursor(subMonths(cursor, 1))}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Today</Button>
          <Button variant="outline" size="icon" onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight className="w-4 h-4" /></Button>
        </div>
        <div className="text-lg font-bold text-brand-navy flex items-center gap-2">
          <CalIcon className="w-5 h-5 text-brand-teal" /> {format(cursor, "MMMM yyyy")}
        </div>

        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Filter className="w-3 h-3" /> Departments:</span>
          {ALL_DEPS.map((d) => {
            const on = visibleDepartments.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggleDepartment(d)}
                className={`text-xs font-medium px-2.5 py-1 rounded-full border transition ${
                  on ? "border-transparent text-white" : "border-brand-border/60 text-muted-foreground bg-white"
                }`}
                style={on ? { backgroundColor: CALENDAR_DEPARTMENT_COLORS[d] } : undefined}
              >
                {CALENDAR_DEPARTMENT_LABELS[d]}
              </button>
            );
          })}
        </div>
      </CardContent></Card>

      {/* Month grid */}
      <Card><CardContent className="p-0">
        <div className="grid grid-cols-7 border-b border-brand-border bg-gray-50/60">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
            <div key={d} className="py-2 text-center text-xs uppercase tracking-wide text-muted-foreground font-semibold">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const inMonth = isSameMonth(day, cursor);
            const today = isSameDay(day, new Date());
            const dayEvents = eventsForDay(day);
            return (
              <div
                key={i}
                onClick={() => openCreate(day)}
                className={`min-h-[110px] border-b border-r border-brand-border/60 p-1.5 cursor-pointer hover:bg-brand-teal/5 transition ${
                  inMonth ? "bg-white" : "bg-gray-50/40"
                }`}
              >
                <div className={`text-xs font-semibold mb-1 inline-flex items-center justify-center w-6 h-6 rounded-full ${
                  today ? "bg-brand-teal text-white" : inMonth ? "text-brand-navy" : "text-muted-foreground"
                }`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openEdit(ev); }}
                      className="w-full text-left text-[10px] font-medium text-white px-1.5 py-0.5 rounded truncate hover:opacity-90"
                      style={{ backgroundColor: CALENDAR_DEPARTMENT_COLORS[ev.department] }}
                      title={`${ev.title} · ${CALENDAR_DEPARTMENT_LABELS[ev.department]}`}
                    >
                      {ev.allDay ? "" : `${format(parseISO(ev.start), "HH:mm")} `}{ev.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-muted-foreground font-medium px-1">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent></Card>

      {/* Legend */}
      <Card><CardContent className="p-4 flex flex-wrap gap-3 text-xs">
        {ALL_DEPS.map((d) => (
          <div key={d} className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: CALENDAR_DEPARTMENT_COLORS[d] }} />
            <span className="text-muted-foreground">{CALENDAR_DEPARTMENT_LABELS[d]}</span>
            <Badge variant="neutral" className="text-[10px]">{events.filter((e) => e.department === d).length}</Badge>
          </div>
        ))}
      </CardContent></Card>

      {/* Create / Edit Dialog */}
      <Dialog open={!!(editing || creatingDate)} onOpenChange={(v) => { if (!v) close(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Event" : "New Event"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Quarterly Board Meeting" /></div>
            <div>
              <Label>Department *</Label>
              <Select value={draft.department} onValueChange={(v) => setDraft({ ...draft, department: v as CalendarDepartment })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_DEPS.map((d) => <SelectItem key={d} value={d}>{CALENDAR_DEPARTMENT_LABELS[d]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start</Label><Input type="datetime-local" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} /></div>
              <div><Label>End</Label><Input type="datetime-local" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} /></div>
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.allDay} onChange={(e) => setDraft({ ...draft, allDay: e.target.checked })} className="rounded border-brand-border" />
              All-day event
            </label>
            <div><Label>Location</Label><Input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} placeholder="optional" /></div>
            <div><Label>Notes</Label><Textarea rows={2} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></div>
          </div>
          <DialogFooter className="gap-2">
            {editing && (
              <Button variant="outline" onClick={remove} className="mr-auto"><Trash2 className="w-4 h-4 text-status-danger" /> Delete</Button>
            )}
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button onClick={save}><Save className="w-4 h-4" /> {editing ? "Save Changes" : "Add Event"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
