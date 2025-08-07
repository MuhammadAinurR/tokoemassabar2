import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";
import { allNavItems } from "@/components/layout/navItems";

interface DecodedToken {
  role: string;
  username: string;
  userId: string;
}

function isPathAllowed(path: string, userRole: string): boolean {
  // Always allow access to dashboard for authenticated users
  if (path === "/dashboard" && userRole === "admin") {
    return true;
  }

  if (path === "/transaksi/lain-lain/history" && userRole === "admin") {
    return true;
  }

  if (path === "/transaksi/operasional/history" && userRole === "admin") {
    return true;
  }

  if (path === "/laporan/stock-barang/lebur-history") {
    return true;
  }

  if (path === "/transaksi/riwayat-cuci") {
    return true;
  }

  // Helper function to check if path matches nav item
  const checkPath = (item: any): boolean => {
    if (item.href === path && item.roles?.includes(userRole)) {
      return true;
    }
    if (item.submenu) {
      return item.submenu.some(
        (subItem: any) =>
          subItem.href === path && subItem.roles?.includes(userRole)
      );
    }
    return false;
  };

  return allNavItems.some(checkPath);
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token");
  const path = request.nextUrl.pathname;
  const isAuthPage = path.startsWith("/login");
  const isHomePage = path === "/";
  const isLoginApi = path === "/api/login";
  const isApiRoute = path.startsWith("/api/");

  // Allow access to login API endpoint and other API routes without path checking
  if (isLoginApi || isApiRoute) {
    return NextResponse.next();
  }

  // If user has token and tries to access login page or home page, redirect to dashboard
  if (token && (isAuthPage || isHomePage)) {
    return NextResponse.redirect(new URL("/transaksi/penjualan", request.url));
  }

  // If user is not logged in and tries to access any protected route, redirect to login
  if (!isAuthPage && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check role-based access for authenticated users
  if (token && !isAuthPage) {
    try {
      const decoded = jwtDecode(token.value) as DecodedToken;
      const userRole = decoded.role;

      if (!isPathAllowed(path, userRole)) {
        // Redirect to dashboard if user doesn't have permission
        return NextResponse.redirect(
          new URL("/transaksi/penjualan", request.url)
        );
      }
    } catch (error) {
      // If token is invalid, redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|_vercel|static|images|favicon.ico|robots.txt).*)",
    "/api/:path*",
  ],
};
