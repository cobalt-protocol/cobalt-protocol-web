import {
  PageContainer,
  Panel,
  primaryLinkClass,
} from "@/components/ui/page-primitives"
import { routes } from "@/lib/routes"
import Link from "next/link"

export default function NotFound() {
  return (
    <PageContainer>
      <Panel className="py-20 text-center">
        <h1 className="text-3xl font-extrabold">Page not found</h1>
        <p className="my-5 text-muted-foreground">
          This competition or page is no longer available.
        </p>
        <Link href={routes.competitions} className={primaryLinkClass}>
          Explore competitions
        </Link>
      </Panel>
    </PageContainer>
  )
}
