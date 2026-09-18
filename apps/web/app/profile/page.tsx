import { ProfilePage } from "@/features/profile/components/profile-page"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Builder Profile | Cobalt Protocol" }
export default function Page() {
  return <ProfilePage />
}
