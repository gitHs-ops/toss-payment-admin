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
      title={label}
      className={`flex items-center justify-center md:justify-start gap-2.5 px-2 md:px-3 py-2.5 md:py-2 rounded-lg text-sm transition-colors ${
        isActive
          ? "bg-blue-50 text-blue-700 font-semibold"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <span className={`shrink-0 transition-colors ${isActive ? "text-blue-600" : "text-gray-400"}`}>
        {icon}
      </span>
      <span className="hidden md:block">{label}</span>
    </Link>
  );
}
