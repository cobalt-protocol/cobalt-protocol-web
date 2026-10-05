"use client"
import { useEffect, useState } from "react"
import { CheckCircle2, FileBadge, LockKeyhole } from "lucide-react"
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi"
import { keccak256, stringToHex } from "viem"
import { Badge, Panel, SectionHeading } from "@/components/ui/page-primitives"
import { useSiteActions } from "@/components/layout/site-actions"
import CompetitionManagerABI from "@/abi/CompetitionManager.json"
import { fetchParticipantCertificateSignature, fetchWinnerCertificateSignature } from "@/lib/competitions-api"

function deriveNumericTeamId(teamId: string): bigint {
  try {
    const n = BigInt(teamId)
    if (n > 0n) return n
    throw new Error("non-positive")
  } catch {
    const hash = keccak256(stringToHex(teamId))
    const n = BigInt(hash)
    return n === 0n ? 1n : n
  }
}

export function WorkspaceAnnouncements({
  competitionId,
  onchainCompetitionId,
  certificateCid,
  pirzeCertificateClaim,
  teamId,
}: {
  competitionId: string
  onchainCompetitionId?: string | null
  certificateCid?: string | null
  pirzeCertificateClaim?: string | null
  teamId?: string | null
}) {
  const [mounted, setMounted] = useState(false)
  const [mintError, setMintError] = useState<string | null>(null)
  const [winnerMintError, setWinnerMintError] = useState<string | null>(null)
  const { connected } = useSiteActions()
  const { writeContractAsync, data: mintTxHash, isPending: isMintPending } =
    useWriteContract()
  const { isLoading: isMintConfirming, isSuccess: isMinted } =
    useWaitForTransactionReceipt({ hash: mintTxHash })
  const { writeContractAsync: writeWinnerAsync, data: winnerTxHash, isPending: isWinnerPending } =
    useWriteContract()
  const { isLoading: isWinnerConfirming, isSuccess: isWinnerMinted } =
    useWaitForTransactionReceipt({ hash: winnerTxHash })

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !connected) return null

  const isAvailable = Boolean(
    pirzeCertificateClaim && new Date() >= new Date(pirzeCertificateClaim)
  )
  const isMinting = isMintPending || isMintConfirming
  const isWinnerMinting = isWinnerPending || isWinnerConfirming
  const competitionContractAddress = (process.env.NEXT_PUBLIC_COMPETITION_CONTRACT ||
    process.env.COMPETITION_CONTRACT ||
    "0xb82F97deF35a9fe438ceB41f4fB5145514b18069") as `0x${string}`

  const handleMintParticipantCertificate = async () => {
    setMintError(null)
    try {
      if (!teamId) {
        throw new Error("Team ID is required to mint a participant certificate — join or create a team first.")
      }
      const signatureResponse: any = await fetchParticipantCertificateSignature(competitionId, teamId)
      const data = signatureResponse?.data
      const signature = data?.signature as string | undefined
      const cid: string | null = (data?.cid as string | null) ?? (data?.certificate_cid as string | null) ?? (data?.uri ? String(data.uri).replace(/^ipfs:\/\//, "") : null)
      if (!signature || !cid) {
        throw new Error(data?.message || signatureResponse?.message || "Participant certificate signature or CID was not returned by the API.")
      }
      if (!onchainCompetitionId || !/^\d+$/.test(onchainCompetitionId)) {
        throw new Error("The competition does not have a valid on-chain competition ID.")
      }
      await writeContractAsync({
        address: competitionContractAddress,
        abi: CompetitionManagerABI as any,
        functionName: "safeMintCertificateParticipant",
        args: [BigInt(onchainCompetitionId), deriveNumericTeamId(teamId), signature as `0x${string}`, cid as string],
      })
    } catch (error: any) {
      const msg = error?.cause?.message || error?.shortMessage || error?.message || "Failed to mint participant certificate."
      setMintError(msg)
    }
  }

  const handleMintWinnerCertificate = async () => {
    setWinnerMintError(null)
    try {
      const resp: any = await fetchWinnerCertificateSignature(competitionId)
      const data = resp?.data
      const signature = data?.signature as string | undefined
      const winnerId = data?.winner_id as string | undefined
      const cid: string | null =
        (data?.cid as string | null) ??
        (data?.certificate_cid as string | null) ??
        (data?.uri ? String(data.uri).replace(/^ipfs:\/\//, "") : null)
      if (!signature || !winnerId || !cid) {
        throw new Error(resp?.message || data?.message || "Winner certificate signature/CID not available — you may not be a winner for this competition.")
      }
      await writeWinnerAsync({
        address: competitionContractAddress,
        abi: CompetitionManagerABI as any,
        functionName: "safeMintCertificateParticipantWinner",
        args: [BigInt(winnerId), signature as `0x${string}`, cid as string],
      })
    } catch (error: any) {
      const msg = error?.cause?.message || error?.shortMessage || error?.message || "Failed to mint winner certificate."
      setWinnerMintError(msg)
    }
  }

  return (
    <Panel>
      <SectionHeading
        title="Announcements & Credentials"
        description="Competition notifications, jury updates, and credential certificates."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col rounded-xl border border-border/60 bg-slate-50 p-5">
          <div className="flex items-center gap-2">
            <FileBadge size={23} className="text-slate-400" />
            <h3 className="text-sm font-bold">Participant Certificate</h3>
            <span className="ml-auto">
              {isAvailable ? (
                <Badge tone="green">
                  <CheckCircle2 size={10} />
                  Available
                </Badge>
              ) : (
                <Badge tone="neutral">
                  <LockKeyhole size={10} />
                  Locked
                </Badge>
              )}
            </span>
          </div>
          <button
            disabled={!isAvailable || isMinting || isMinted}
            onClick={handleMintParticipantCertificate}
            className={`mt-5 rounded-lg px-3 py-3 text-xs ${
              isAvailable && !isMinting && !isMinted
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "bg-slate-200/70 text-slate-500 cursor-not-allowed"
            }`}
          >
            {isMinted ? "Participant Certificate Minted" : isMinting ? "Minting Participant Certificate..." : "Mint Participant Certificate NFT"}
          </button>
          {mintError ? (<p role="alert" className="mt-3 text-[10px] leading-5 text-red-600">{mintError}</p>) : null}
          {certificateCid ? (<p className="mt-3 text-[10px] leading-5 text-muted-foreground">Certificate CID: <span className="font-mono break-all">{certificateCid}</span></p>) : (<p className="mt-3 text-[10px] leading-5 text-muted-foreground">Available after judging and results are finalized.</p>)}
        </div>
        <div className="flex flex-col rounded-xl border border-border/60 bg-slate-50 p-5">
          <div className="flex items-center gap-2">
            <FileBadge size={23} className="text-slate-400" />
            <h3 className="text-sm font-bold">Winner Certificate</h3>
            <span className="ml-auto">
              {isAvailable ? (<Badge tone="green"><CheckCircle2 size={10} />Available</Badge>) : (<Badge tone="neutral"><LockKeyhole size={10} />Locked</Badge>)}
            </span>
          </div>
          <button
            disabled={!isAvailable || isWinnerMinting || isWinnerMinted}
            onClick={handleMintWinnerCertificate}
            className={`mt-5 rounded-lg px-3 py-3 text-xs ${
              isAvailable && !isWinnerMinting && !isWinnerMinted ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-200/70 text-slate-500 cursor-not-allowed"
            }`}
          >
            {isWinnerMinted ? "Winner Certificate Minted" : isWinnerMinting ? "Minting Winner Certificate..." : "Mint Winner Certificate NFT"}
          </button>
          {winnerMintError ? (<p role="alert" className="mt-3 text-[10px] leading-5 text-red-600">{winnerMintError}</p>) : null}
          <p className="mt-3 text-[10px] leading-5 text-muted-foreground">Available after final judging and prize settlement.</p>
        </div>
      </div>
    </Panel>
  )
}
