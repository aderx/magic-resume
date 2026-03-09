"use client";

import { useRouter } from "@/lib/navigation";

export default function GoDashboard({
  children,
  type = "dashboard",
}: {
  children: React.ReactNode;
  type?: "dashboard" | "templates" | "resumes";
}) {
  const router = useRouter();

  const routeMap = {
    dashboard: "/app/dashboard",
    resumes: "/app/dashboard/resumes",
    templates: "/app/dashboard/templates"
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        router.push(routeMap[type]);
      }}
    >
      {children}
    </form>
  );
}
