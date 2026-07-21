import Link from "next/link"

import { Button } from "@/components/ui/button"
import { VoltWordmark } from "@/components/icons"

const NAV_LINKS = [
  { href: "#colors", label: "Colors" },
  { href: "#type", label: "Type" },
  { href: "#logo", label: "Logo" },
  { href: "#applications", label: "Applications" },
] as const

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="#top" aria-label="VOLT — back to top">
          <VoltWordmark />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Button
          size="lg"
          nativeButton={false}
          render={<Link href="#applications" />}
          className="font-semibold uppercase tracking-wide"
        >
          Get the kit
        </Button>
      </div>
    </header>
  )
}
