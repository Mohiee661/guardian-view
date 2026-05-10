import { Search } from "lucide-react";
import { useLocation } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

const titleMap: Record<string, string> = {
  "/": "Dashboard",
  "/threats": "Threat Feed",
  "/lookup": "Domain Lookup",
  "/analytics": "Analytics",
  "/alerts": "Alerts",
  "/reports": "Reports",
  "/settings": "Settings",
};

export function TopBar() {
  const { pathname } = useLocation();
  const title = titleMap[pathname] ?? "DarkShield";

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-border bg-background/80 px-3 backdrop-blur">
      <SidebarTrigger className="h-7 w-7" />
      <div className="h-4 w-px bg-border" />
      <h1 className="text-sm font-medium tracking-tight">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search findings, domains, indicators…"
            className="h-8 w-72 pl-8 text-xs"
          />
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bell className="h-4 w-4" />
        </Button>
        <Avatar className="h-7 w-7 border border-border">
          <AvatarFallback className="bg-muted text-[10px] font-medium">SA</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
