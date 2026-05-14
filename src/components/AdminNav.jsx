"use client";
import Link from "next/link";

export default function AdminNav() {
  return (
    <nav className="bg-gray-900 text-white p-4 flex gap-6 items-center">
      <Link href="/" className="font-bold text-lg hover:underline">
        Home
      </Link>
      <Link href="/projects" className="hover:underline">
        View All Projects
      </Link>
      <Link href="/users" className="hover:underline">
        User Management
      </Link>
    </nav>
  );
}
