"use client";

import Nav from "./nav";
import Footer from "./footer";

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#13322b] text-white">
      <Nav />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
