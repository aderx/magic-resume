import { ReactNode } from "react";
import { Metadata } from "next";
import { NextIntlClientProvider } from "@/i18n/compat/client";
import { getMessages, getTranslations } from "@/i18n/compat/server";
import Document from "@/components/Document";
import { Providers } from "@/app/providers";
import { Toaster } from "@/components/ui/sonner";
import { getUserLocale } from "@/i18n/db";

type Props = {
  children: ReactNode;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getUserLocale();
  const t = await getTranslations({ locale, namespace: "common" });
  return {
    title: t("title") + " - " + t("dashboard")
  };
}

export default async function LocaleLayout({ children }: Props) {
  const locale = await getUserLocale();
  const messages = await getMessages({ locale });

  return (
    <Document
      locale={locale}
      bodyClassName="overflow-y-hidden w-full"
    >
      <NextIntlClientProvider locale={locale} messages={messages}>
        <Providers>{children}</Providers>
        <Toaster position="top-center" richColors />
      </NextIntlClientProvider>
    </Document>
  );
}
