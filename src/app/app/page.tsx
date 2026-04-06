import { Metadata } from "next";
import { NextIntlClientProvider } from "@/i18n/compat/client";
import { ReactNode } from "react";
import { getMessages, getTranslations } from "@/i18n/compat/server";
import Document from "@/components/Document";
import { getUserLocale } from "@/i18n/db";

type Props = {
  children: ReactNode;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getUserLocale();
  const t = await getTranslations({ locale, namespace: "common" });
  return {
    title: t("title"),
  };
}
export default async function LocaleLayout({ children }: Props) {
  const locale = await getUserLocale();
  const messages = await getMessages({ locale });

  return (
    <Document locale={locale}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </Document>
  );
}

export const runtime = "edge";
