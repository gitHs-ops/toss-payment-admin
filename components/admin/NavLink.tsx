"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  href: string;
  icon: React.ReactNode;
  label: string;
}

export default function NavLink({ href, icon, label }: Props) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive
          ? "bg-blue-50 text-blue-700 font-semibold"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <span className={`transition-colors ${isActive ? "text-blue-600" : "text-gray-400"}`}>
        {icon}
      </span>
      {label}
    </Link>
  );
}
