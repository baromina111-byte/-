import { Applications } from "@/components/applications"
import { ColorSystem } from "@/components/color-system"
import { Hero } from "@/components/hero"
import { LogoUsage } from "@/components/logo-usage"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Typography } from "@/components/typography"

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <ColorSystem />
        <Typography />
        <LogoUsage />
        <Applications />
      </main>
      <SiteFooter />
    </>
  )
}
