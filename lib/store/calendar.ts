"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CalendarEvent, CalendarDepartment } from "@/lib/types";
import { seedCalendarEvents } from "@/lib/data/calendar";

interface CalendarState {
  events: CalendarEvent[];
  visibleDepartments: CalendarDepartment[];
  addEvent: (e: Omit<CalendarEvent, "id" | "createdAt">) => CalendarEvent;
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  toggleDepartment: (d: CalendarDepartment) => void;
  setVisibleDepartments: (deps: CalendarDepartment[]) => void;
  reset: () => void;
}

const ALL_DEPS: CalendarDepartment[] = ["admin", "hr", "operation", "accounting", "sales", "subcon"];

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      events: seedCalendarEvents,
      visibleDepartments: ALL_DEPS,
      addEvent: (e) => {
        const ne: CalendarEvent = {
          ...e,
          id: `cal-${Date.now().toString(36)}`,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ events: [ne, ...s.events] }));
        return ne;
      },
      updateEvent: (id, patch) =>
        set((s) => ({
          events: s.events.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deleteEvent: (id) =>
        set((s) => ({ events: s.events.filter((x) => x.id !== id) })),
      toggleDepartment: (d) => {
        const cur = get().visibleDepartments;
        const next = cur.includes(d)
          ? cur.filter((x) => x !== d)
          : [...cur, d];
        set({ visibleDepartments: next });
      },
      setVisibleDepartments: (deps) => set({ visibleDepartments: deps }),
      reset: () =>
        set({ events: seedCalendarEvents, visibleDepartments: ALL_DEPS }),
    }),
    { name: "nex-calendar" }
  )
);
