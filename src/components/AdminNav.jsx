"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  FileCheck,
  LayoutGrid,
  LogOut,
  FolderKanban,
  Users,
} from "lucide-react";

const navItems = [
  { href: "/", label: "TEC Form", icon: LayoutGrid },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/users", label: "Users", icon: Users },
];

export default function AdminNav({ children, currentUser = "Admin" }) {
  const pathname = usePathname();
  const loggedInUser = currentUser;

  return (
    <div className="min-h-screen bg-[#efeeea] text-[#1f2a44]">
      <header className="sticky top-0 z-30 border-b border-[#d8d4cc] bg-[#f7f5f1]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold tracking-[0.3em] text-[#9a2a25] sm:text-sm">
            <Image
              src="/uwi-logo.png"
              alt="University of the West Indies logo"
              width={50}
              height={60}
              className="h-10 w-auto object-contain"
            />
            {/* <p className="text-sm font-semibold text-[#1f2a44]">The University Of The West Indies</p> */}
          </p>
          <div className="flex items-center gap-2 sm:gap-3">            
            <button
              type="button"
              className="hidden rounded-xl border border-[#d6d2ca] bg-white px-3 py-2 text-xs font-semibold text-[#2d3750] shadow-sm sm:inline-flex"
            >
              {loggedInUser}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-[#d6d2ca] bg-white px-3 py-2 text-xs font-semibold text-[#2d3750] shadow-sm transition hover:border-[#9a2a25]"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside className="rounded-2xl border border-[#d9d5cd] bg-[#f5f3ef] p-3 shadow-[0_4px_18px_rgba(24,39,75,0.06)]">
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#991b1e] text-white shadow"
                      : "text-[#546077] hover:bg-[#ece8e2] hover:text-[#991b1e]"
                  }`}
                >
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${
                      isActive
                        ? "bg-[#ad2a2d]/70"
                        : "bg-white text-[#8d98ab] group-hover:text-[#991b1e]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 rounded-xl border border-[#ddd8d1] bg-white px-3 py-3 text-xs text-[#6a7388]">
            <div className="mb-1 inline-flex items-center gap-2 font-semibold text-[#2d3750]">
              <FileCheck className="h-4 w-4 text-[#991b1e]" />
              TEC Assessment
            </div>
            <p>Structured review workflow with persistent draft saving.</p>
          </div>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
