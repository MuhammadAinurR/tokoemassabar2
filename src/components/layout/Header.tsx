import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAppMode, AppMode } from "@/context/AppModeContext";

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { mode, setMode } = useAppMode();

  const handleLogout = async () => {
    logout();
    router.push("/login");
  };

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
  };

  const getModeDisplayName = (mode: AppMode) => {
    return mode === "emas_muda" ? "Emas Muda" : "Emas Tua";
  };
  return (
    <header className="px-4 sticky top-0 z-50 w-full border-b bg-[#0A0A0A] shadow-sm">
      <div className="flex h-14 items-center w-full">
        <div className="mr-4">
          <Link className="mr-6 flex items-center space-x-2" href="/dashboard">
            <Image
              src="/images/main_logo.avif"
              alt="User"
              width={44}
              height={44}
              className="rounded-full"
            />

            <div className="flex flex-col">
              <p className="font-bold sm:inline-block text-gray-300">
                Toko Emas Sabar 2
              </p>
              <p className="font-bold sm:inline-block text-gray-300">
                -- -- --
              </p>
            </div>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2 md:justify-end">
          {/* Application Mode Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 bg-gray-800 border-gray-600 hover:bg-gray-700 text-white"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden md:inline">
                  {getModeDisplayName(mode)}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto">
              <DropdownMenuItem
                onSelect={() => handleModeChange("emas_tua")}
                className={mode === "emas_tua" ? "bg-gray-100" : ""}
              >
                Emas Tua
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => handleModeChange("emas_muda")}
                className={mode === "emas_muda" ? "bg-gray-100" : ""}
              >
                Emas Muda
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            {" "}
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                className="gap-2 md:flex bg-gray-700 hover:bg-gray-600"
              >
                <Image
                  src="/images/profile.avif"
                  alt="User"
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                <p className="text-white">{user?.username}</p>
                <span className="hidden md:inline-flex text-gray-300">
                  {user?.name}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto">
              <DropdownMenuItem onSelect={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
