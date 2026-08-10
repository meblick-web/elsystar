"use client";

import { usePathname, useSearchParams } from "next/navigation";

function withSearch(path: string, query: string) {
  return query ? `${path}?${query}` : path;
}

export function LanguageSwitch() {
  const pathname = usePathname() || "/";
  const search = useSearchParams().toString();
  const english = pathname === "/en" || pathname.startsWith("/en/");
  const ruPath = pathname === "/en" ? "/" : pathname.startsWith("/en/") ? pathname.slice(3) : pathname;
  const enPath = english ? pathname : pathname === "/" ? "/en" : `/en${pathname}`;

  return (
    <nav className="languageSwitch" aria-label="Language">
      <a className={!english ? "active" : ""} href={withSearch(ruPath, search)} lang="ru" hrefLang="ru">RU</a>
      <span aria-hidden="true">/</span>
      <a className={english ? "active" : ""} href={withSearch(enPath, search)} lang="en" hrefLang="en">EN</a>
    </nav>
  );
}
