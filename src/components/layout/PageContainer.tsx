import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";

interface PageContainerProps {
  children: ReactNode;
  /** Extra bottom padding to clear a fixed bottom action bar. */
  withBottomBarSpacing?: boolean;
}

/**
 * Full-bleed page shell: SiteHeader and Footer span the full viewport width,
 * while each page's own content wrapper sets its comfortable max-width
 * and centers itself within this shell.
 */
export function PageContainer({ children, withBottomBarSpacing = false }: PageContainerProps) {
  return (
    <div className={["flex min-h-screen w-full flex-col bg-ink-50", withBottomBarSpacing ? "pb-32 lg:pb-6" : "pb-6"].join(" ")}>
      <SiteHeader />
      {children}
    </div>
  );
}
