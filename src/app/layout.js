import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import ClientLayout from "@/components/ClientLayout";
import { ToastProvider } from "@/components/ui/Toast";
import ErrorBoundary from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Dilitech Solutions — Premium Electronics & Smart Technology",
  description:
    "Discover cutting-edge electronics and smart solutions at Dilitech Solutions. Premium quality, innovative technology, and exceptional service.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <AuthProvider>
            <ToastProvider>
              <ClientLayout>
                {children}
              </ClientLayout>
            </ToastProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
