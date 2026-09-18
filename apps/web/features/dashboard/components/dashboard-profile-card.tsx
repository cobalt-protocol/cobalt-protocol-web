import Link from "next/link"
import {
  CircleUserRound,
  GraduationCap,
  LockKeyhole,
  UserRound,
} from "lucide-react"
import { routes } from "@/lib/routes"
import type { DashboardProfile } from "../types"
export function DashboardProfileCard({
  profile,
  active,
  claimableUsd,
}: {
  profile: DashboardProfile
  active: number
  claimableUsd: number
}) {
  const claimable = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  })
    .format(claimableUsd)
    .toLowerCase()
  return (
    <section
      aria-label="Builder overview"
      className="grid items-center gap-6 rounded-2xl border border-white bg-linear-to-br from-white to-[#f8f9ff] p-6 shadow-xs lg:grid-cols-[1.1fr_1.45fr_.85fr]"
    >
      <div className="flex items-center gap-4 lg:min-h-40 lg:border-r lg:border-border/60 lg:pr-5">
        <div className="relative shrink-0">
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-slate-800 via-blue-900 to-teal-900 text-blue-100">
            <UserRound
              size={46}
              strokeWidth={1.2}
              aria-label="Profile avatar placeholder"
            />
          </div>
          <span className="absolute -right-1 -bottom-1 size-4 rounded-full border-2 border-white bg-teal-700" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight">{profile.name}</h2>
          <p className="mt-1 truncate text-xs">@{profile.username}</p>
          <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-[#e5edff] px-2 py-1 text-[10px] text-slate-600">
            <GraduationCap size={13} className="text-[#0051d5]" />
            {profile.institution}
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <h3 className="text-[10px] font-bold tracking-wide text-slate-600 uppercase">
          Key Specializations
        </h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {profile.skills.map((skill) => (
            <span
              key={skill}
              className="rounded bg-[#e5edff] px-2 py-1 text-[10px] font-semibold"
            >
              {skill}
            </span>
          ))}
        </div>
        <p className="mt-8 line-clamp-2 text-xs leading-6 text-slate-600">
          {profile.pitch}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
          <LockKeyhole size={14} className="text-teal-700" />
          <span>Escrow Vault:</span>
          <code className="rounded bg-[#e5edff] px-2 py-0.5 font-bold tracking-wide">
            {profile.vaultAddress}
          </code>
          <span className="text-teal-700">● {profile.network}</span>
        </div>
      </div>
      <div className="rounded-xl bg-[#eef2ff] p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <strong className="text-xl font-extrabold text-[#0051d5]">
              {active}
            </strong>
            <p className="mt-1 text-[9px] text-slate-600 uppercase">Active</p>
          </div>
          <div>
            <strong className="text-xl font-extrabold text-teal-700">
              {claimable}
            </strong>
            <p className="mt-1 text-[9px] text-slate-600 uppercase">
              Claimable
            </p>
          </div>
          <div>
            <strong className="text-xl font-extrabold">
              {profile.firstPlaceFinishes}×
            </strong>
            <p className="mt-1 text-[9px] text-slate-600 uppercase">
              1st Podiums
            </p>
          </div>
        </div>
        <Link
          href={routes.profile}
          className="mt-3 flex min-h-9 items-center justify-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-bold shadow-xs"
        >
          <CircleUserRound size={15} />
          View Public Profile
        </Link>
      </div>
    </section>
  )
}
