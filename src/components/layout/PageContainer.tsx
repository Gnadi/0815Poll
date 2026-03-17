import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export default function PageContainer({
  children,
  className = "",
}: PageContainerProps) {
  return (
    <main
      className={`mx-auto max-w-lg px-4 py-6 pb-24 lg:max-w-2xl ${className}`.trim()}
    >
      {children}
    </main>
  );
}
