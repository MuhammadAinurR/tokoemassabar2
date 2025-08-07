import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "@/context/AuthContext";
import { AppModeProvider } from "@/context/AppModeContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Toko Emas Sabar 2",
  description: "Sistem Informasi Toko Emas Sabar 2",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen max-w-screen bg-gradient-to-b from-luxury-800 to-luxury-900`}
      >
        <AuthProvider>
          <AppModeProvider>
            <main>{children}</main>
            <ToastContainer />
          </AppModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
