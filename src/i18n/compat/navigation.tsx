"use client";

import NextLink from "next/link";
import { usePathname as useNextPathname } from "next/navigation";
import { ComponentProps } from "react";
import { Locale } from "@/i18n/config";
import { replacePathLocale } from "@/i18n/runtime";

export function defineRouting<T extends Record<string, unknown>>(config: T) {
  return config;
}

export function createNavigation(_routing: {
  locales: readonly Locale[];
  defaultLocale: Locale;
}) {
  function Link({
    href,
    locale,
    ...rest
  }: Omit<ComponentProps<typeof NextLink>, "href"> & {
    href: string;
    locale?: Locale;
  }) {
    const nextHref = locale ? replacePathLocale(href, locale) : href;
    return <NextLink href={nextHref} {...rest} />;
  }

  function usePathname() {
    return useNextPathname();
  }

  return {
    Link,
    usePathname
  };
}
