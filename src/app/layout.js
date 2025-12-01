import {  Nunito } from "next/font/google";
import "./globals.css";


const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
})

export const metadata = {
  title: "Lucky Wheel Games By APLUS",
  description: "demo apps lucky wheel games, for demo purpose.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${nunito.variable} font-nunito antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
