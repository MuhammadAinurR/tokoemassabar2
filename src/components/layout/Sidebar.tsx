import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown } from "lucide-react";
import { getFilteredNavItems } from "./navItems";
import { useUserRole } from "@/hooks/useUserRole";

interface SidebarProps {
  className?: string;
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
  openMenus: string[];
  toggleSubmenu: (title: string) => void;
}

export function Sidebar({ className, isExpanded, setIsExpanded, openMenus, toggleSubmenu }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const userRole = useUserRole();
  const filteredNavItems = getFilteredNavItems(userRole);

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {filteredNavItems.map((item, index) => (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        variant={pathname.startsWith(item.href) ? "secondary" : "ghost"}
                        className={cn("w-full justify-start", isExpanded ? "" : "px-2")}
                        onClick={() => {
                          if (!isExpanded) {
                            setIsExpanded(true);
                          } else if (item.submenu) {
                            toggleSubmenu(item.title);
                          } else {
                            router.push(item.href);
                          }
                        }}
                      >
                        {item.icon}
                        {isExpanded && <span className="ml-2">{item.title}</span>}
                        {isExpanded && item.submenu && (
                          <ChevronDown
                            className={cn(
                              "ml-auto h-4 w-4 transition-transform",
                              openMenus.includes(item.title) ? "rotate-180" : ""
                            )}
                          />
                        )}
                      </Button>
                      {item.submenu && openMenus.includes(item.title) && isExpanded && (
                        <div className="mt-1 space-y-1">
                          {item.submenu.map((subItem, subIndex) => (
                            <Button
                              key={subIndex}
                              variant={pathname === subItem.href ? "secondary" : "ghost"}
                              className="w-full justify-start pl-8 text-gray-500"
                              asChild
                            >
                              <Link href={subItem.href}>
                                {subItem.icon}
                                <span className="ml-2">{subItem.title}</span>
                              </Link>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className={cn(isExpanded ? "hidden" : "block")}>
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
