// app/layout.js
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from './components/toast';
import { UserProvider } from "./context/UserContext";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = { title: "My ERP", description: "ERP app" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ToastProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </ToastProvider>
      </body>
    </html>
  );
}