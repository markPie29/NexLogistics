"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Maximize2,
  Search,
  ChevronDown,
  LogOut,
  User,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Zap,
  Plus,
  Truck,
  Route,
  Users,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { useUiStore } from "@/lib/store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AnimatedDropdown from "@/components/ui/animated-dropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ROLE_LABEL } from "@/lib/auth/roles";
import { initials } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { SessionTimeoutSettings } from "@/components/auth/SessionTimeoutSettings";

export function Topbar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const company = useAuthStore((s) => s.company);
  const logout = useAuthStore((s) => s.logout);
  const notifications = useUiStore((s) => s.notifications);
  const markAllRead = useUiStore((s) => s.markAllRead);
  const darkMode = useUiStore((s) => s.darkMode);
  const toggleDarkMode = useUiStore((s) => s.toggleDarkMode);
  const unread = notifications.filter((n) => !n.read).length;

  const [notificationSearch, setNotificationSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const notificationFilters = [
    { value: "all", label: "All Notifications" },
    { value: "unread", label: "Unread" },
    { value: "trips", label: "Trip Alerts" },
    { value: "maintenance", label: "Vehicle & Maintenance" },
    { value: "payroll", label: "Payroll" },
    { value: "documents", label: "Documents" },
    { value: "route", label: "Route & Delays" },
  ] as const;

  const filterLabel = notificationFilters.find((option) => option.value === activeFilter)?.label ?? "Filter";

  const filteredNotifications = useMemo(() => {
    const normalizedSearch = notificationSearch.trim().toLowerCase();

    return notifications.filter((notification) => {
      const content = `${notification.title} ${notification.message}`.toLowerCase();
      const matchesSearch = normalizedSearch ? content.includes(normalizedSearch) : true;
      if (!matchesSearch) return false;

      if (activeFilter === "all") return true;
      if (activeFilter === "unread") return !notification.read;
      if (activeFilter === "trips") return /trip|trp|delivery|assigned|completed|delay|route/.test(content);
      if (activeFilter === "maintenance") return /pms|oil|insurance|vehicle|license|maintenance|fuel|engine/.test(content);
      if (activeFilter === "payroll") return /payroll|salary|pay|period/.test(content);
      if (activeFilter === "documents") return /document|pod|uploaded|proof of delivery/.test(content);
      if (activeFilter === "route") return /route|delay|traffic|on-time|on time|streak/.test(content);

      return true;
    });
  }, [activeFilter, notifications, notificationSearch]);

  const onLogout = () => {
    logout();
    router.push("/login");
  };

  const onFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-20 h-16 bg-white dark:bg-brand-navy border-b border-brand-border dark:border-white/10 flex items-center px-6 gap-4">
      {/* Welcome */}
      <div className="hidden md:block min-w-0">
        <div className="text-xs text-muted-foreground">Welcome back,</div>
        <div className="text-base font-bold text-brand-navy dark:text-white flex items-center gap-1">
          {user.name.split(" ")[0]} <span>👋</span>
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xl mx-auto">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search anything..."
            className="w-full h-10 pl-11 pr-4 rounded-full bg-gray-50 dark:bg-white/5 border border-transparent hover:border-brand-border dark:hover:border-white/20 focus:border-brand-teal focus:bg-white dark:focus:bg-white/10 text-sm outline-none transition dark:text-white dark:placeholder:text-white/40"
          />
          <kbd className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white dark:bg-white/10 border border-brand-border dark:border-white/20 text-muted-foreground">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {/* Quick Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center transition" aria-label="Quick actions">
              <Zap className="w-5 h-5 text-brand-teal" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/fleet")}>
              <Truck className="w-4 h-4" /> Add Vehicle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/drivers")}>
              <Users className="w-4 h-4" /> Add Driver
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/trips/new")}>
              <Route className="w-4 h-4" /> Create Trip
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/trips/dispatch")}>
              <Plus className="w-4 h-4" /> Open Dispatch Board
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center transition"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-brand-gray dark:text-white/70" />
          )}
        </button>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center transition">
              <Bell className="w-5 h-5 text-brand-gray dark:text-white/70" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-status-danger text-white text-[10px] font-bold flex items-center justify-center">
                  {unread}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[calc(100vw-2rem)] sm:w-[40rem] p-0 min-h-0 sm:min-h-[560px] max-h-[calc(100vh-120px)] sm:max-h-[560px] overflow-y-auto scrollbar-thin">
            <div className="flex flex-col gap-3 p-4 border-b border-brand-border">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-brand-navy dark:text-white">Notifications</div>
                <button onClick={markAllRead} className="text-xs text-brand-teal hover:underline">
                  Mark all read
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  {/* Search Input Container */}
                  <div className="relative flex-1">
                    {/* Search Icon */}
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />

                    {/* Input */}
                    <input
                      value={notificationSearch}
                      onChange={(event) => setNotificationSearch(event.target.value)}
                      placeholder="Search notifications"
                      className="
                        w-full h-10 pl-10 pr-4 sm:pr-36
                        rounded-lg
                        bg-gray-50 dark:bg-white/5
                        border border-transparent
                        hover:border-brand-border dark:hover:border-white/20
                        focus:border-brand-teal focus:bg-white dark:focus:bg-white/10
                        text-sm outline-none
                        text-brand-navy dark:text-white
                        placeholder:text-muted-foreground
                        transition
                      "
                    />

                    {/* Divider (only visible on sm and up) */}
                    <div className="hidden sm:block absolute right-28 top-1/2 -translate-y-1/2 h-5 w-px bg-brand-border dark:bg-white/10" />

                    {/* Animated Dropdown INSIDE input on sm and up */}
                    <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2">
                      <AnimatedDropdown
                        text={filterLabel}
                        items={notificationFilters.map((option) => ({
                          name: option.label,
                          value: option.value,
                        }))}
                        onSelect={(value) => setActiveFilter(value)}
                        className="w-40"
                      />
                    </div>
                  </div>

                  {/* Animated Dropdown OUTSIDE input on mobile screens (less than sm) */}
                  <div className="block sm:hidden w-full">
                    <AnimatedDropdown
                      text={filterLabel}
                      items={notificationFilters.map((option) => ({
                        name: option.label,
                        value: option.value,
                      }))}
                      onSelect={(value) => setActiveFilter(value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
            {filteredNotifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No matching notifications. Try a different search term or filter.
              </div>
            ) : (
              <div className="divide-y divide-brand-border/60">
                {filteredNotifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-gray-50 dark:hover:bg-white/5 flex gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.type === "danger" ? "bg-status-danger" : n.type === "warning" ? "bg-status-warning" : n.type === "success" ? "bg-status-success" : "bg-status-info"
                        }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-brand-navy dark:text-white">{n.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{n.message}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>

        <button onClick={onFullscreen} className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center transition">
          <Maximize2 className="w-4 h-4 text-brand-gray dark:text-white/70" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 pl-2 pr-3 h-12 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-brand-navy text-white dark:bg-brand-teal dark:text-brand-navy">{initials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="text-sm font-semibold text-brand-navy dark:text-white leading-tight">{user.name}</div>
                <div className="text-[10px] text-muted-foreground leading-tight">{ROLE_LABEL[user.role]}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{company.name}</DropdownMenuLabel>
            <DropdownMenuItem><User className="w-4 h-4" /> My Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}><SettingsIcon className="w-4 h-4" /> Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <SessionTimeoutSettings />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={onLogout}>
              <LogOut className="w-4 h-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
