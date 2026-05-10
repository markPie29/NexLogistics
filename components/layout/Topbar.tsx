"use client";
import { useRouter } from "next/navigation";
import { Bell, Inbox, Maximize2, Search, ChevronDown, LogOut, User, Settings as SettingsIcon } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { useUiStore } from "@/lib/store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

export function Topbar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const company = useAuthStore((s) => s.company);
  const logout = useAuthStore((s) => s.logout);
  const notifications = useUiStore((s) => s.notifications);
  const markAllRead = useUiStore((s) => s.markAllRead);
  const unread = notifications.filter((n) => !n.read).length;

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
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-brand-border flex items-center px-6 gap-4">
      {/* Welcome */}
      <div className="hidden md:block min-w-0">
        <div className="text-xs text-muted-foreground">Welcome back,</div>
        <div className="text-base font-bold text-brand-navy flex items-center gap-1">
          {user.name.split(" ")[0]} <span>👋</span>
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xl mx-auto">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search anything..."
            className="w-full h-10 pl-11 pr-4 rounded-full bg-gray-50 border border-transparent hover:border-brand-border focus:border-brand-teal focus:bg-white text-sm outline-none transition"
          />
          <kbd className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white border border-brand-border text-muted-foreground">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition">
              <Bell className="w-5 h-5 text-brand-gray" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-status-danger text-white text-[10px] font-bold flex items-center justify-center">
                  {unread}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-96 p-0 max-h-[480px] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between p-4 border-b border-brand-border">
              <div className="font-semibold text-brand-navy">Notifications</div>
              <button onClick={markAllRead} className="text-xs text-brand-teal hover:underline">
                Mark all read
              </button>
            </div>
            <div className="divide-y divide-brand-border/60">
              {notifications.slice(0, 8).map((n) => (
                <div key={n.id} className="p-3 hover:bg-gray-50 flex gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                      n.type === "danger" ? "bg-status-danger" : n.type === "warning" ? "bg-status-warning" : n.type === "success" ? "bg-status-success" : "bg-status-info"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-brand-navy">{n.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{n.message}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <button className="relative w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition">
          <Inbox className="w-5 h-5 text-brand-gray" />
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-teal text-white text-[10px] font-bold flex items-center justify-center">
            5
          </span>
        </button>

        <button onClick={onFullscreen} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition">
          <Maximize2 className="w-4 h-4 text-brand-gray" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 pl-2 pr-3 h-12 rounded-xl hover:bg-gray-100 transition">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-brand-navy text-white">{initials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="text-sm font-semibold text-brand-navy leading-tight">{user.name}</div>
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
            <DropdownMenuItem destructive onClick={onLogout}>
              <LogOut className="w-4 h-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
