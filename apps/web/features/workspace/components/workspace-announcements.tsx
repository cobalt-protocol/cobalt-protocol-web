"use client"
import { useEffect, useState } from "react"
import { CheckCircle2, FileBadge, LockKeyhole } from "lucide-react"
import { useAccount, useChainId, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi"
import { BaseError, decodeErrorResult, getAddress, isAddress, keccak256, stringToHex } from "viem"
import { Badge, Panel, SectionHeading } from "@/components/ui/page-primitives"
import { useSiteActions } from "@/components/layout/site-actions"
import CompetitionManagerABI from "@/abi/CompetitionManager.json"
import { fetchParticipantCertificateSignature, fetchWinnerCertificateSignature, fetchMyParticipantMinted } from "@/lib/competitions-api"
import { getCompetitionContractAddress } from "@/lib/contracts"
import { useToast } from "@/hooks/use-toast"

const KNOWN_CERT_ERRORS = [
  "AmountZero","CertificateAlreadyClaimed","CertificateNonTransferable","CompetitionDoesNotExist","CompetitionNotEnded",
  "ECDSAInvalidSignature","ECDSAInvalidSignatureLength","ECDSAInvalidSignatureS","FeeOptionNotFound","IncorrectFeeAmount",
  "IncorrectNativeAmount","InsufficientCompetitionPrize","InsufficientPrizeBalance","InvalidEndTime","InvalidFormation",
  "InvalidRecipient","InvalidSignature","InvalidTeamId","MustHaveWinner","NativeFromMismatch","NotOrganization",
  "TokenAlreadyDeactivated","TokenAlreadyListed","TokenNotActive","TokenNotListed","TransferFailed","TreasuryDoesNotExist",
  "WinnerAlreadyClaimed","WinnerDoesNotExist","WinnerMismatch",
] as const

function extractHexData(err: any): string[] {
  const out: string[] = []
  const seen = new Set<any>()
  const queue: any[] = [err]
  let depth = 0
  while (queue.length && depth < 50) {
    const cur = queue.shift()
    depth++
    if (!cur || seen.has(cur)) continue
    seen.add(cur)
    if (typeof cur === "string") {
      const m = cur.match(/0x[0-9a-fA-F]{8,}/g)
      if (m) out.push(...m)
      continue
    }
    if (typeof cur === "object") {
      try {
        if (cur instanceof BaseError) {
          const walked: any = (cur as any).walk?.((e: any) => (e as any)?.data || (e as any)?.cause?.data)
          if (walked?.data && typeof walked.data === "string" && walked.data.startsWith("0x")) out.push(walked.data)
        }
      } catch {}
      for (const k of ["data","cause","error","details","message","shortMessage","metaMessages","args","reason"]) {
        const v = (cur as any)[k]
        if (!v) continue
        if (typeof v === "string" && v.startsWith("0x") && v.length >= 10) out.push(v)
        else if (typeof v === "string") {
          const m = v.match(/0x[0-9a-fA-F]{8,}/g)
          if (m) out.push(...m)
        } else if (Array.isArray(v)) queue.push(...v)
        else if (typeof v === "object") queue.push(v)
      }
      try {
        const s = String((cur as any).message || (cur as any).shortMessage || "")
        const m2 = s.match(/0x[0-9a-fA-F]{8,}/g)
        if (m2) out.push(...m2)
      } catch {}
    }
  }
  return [...new Set(out)].sort((a, b) => b.length - a.length)
}

function decodeCertificateErrorName(err: any): string | null {
  const hexes = extractHexData(err)
  for (const hex of hexes) {
    try {
      const decoded: any = decodeErrorResult({ abi: CompetitionManagerABI as any, data: hex as `0x${string}` })
      if (decoded?.errorName) return decoded.errorName as string
    } catch {}
  }
  const msg = String(err?.shortMessage || err?.message || err?.cause?.message || err?.cause?.cause?.message || err?.details || "")
  for (const n of KNOWN_CERT_ERRORS) if (msg.includes(n)) return n
  if (/user rejected|user denied|rejected the request/i.test(msg)) return "UserRejected"
  if (/insufficient funds/i.test(msg)) return "InsufficientFunds"
  return null
}

function friendlyCertificateError(name: string | null, fallback: string): string {
  const cleanFallback = fallback.replace(/0x[0-9a-fA-F]{10,}/g, "[custom error]").slice(0, 700)
  switch (name) {
    case "UserRejected": return "Transaksi dibatalkan — kamu menutup / menolak popup MetaMask."
    case "InsufficientFunds": return "Saldo tidak cukup untuk gas / fee."
    case "CertificateAlreadyClaimed": return "Sertifikat sudah di-mint untuk wallet/team/CID ini. Kamu sudah claim — tidak bisa mint dua kali (soulbound)."
    case "WinnerAlreadyClaimed": return "Hadiah/sertifikat winner sudah di-claim untuk wallet ini."
    case "CompetitionNotEnded": return "Kompetisi belum berakhir on-chain. Mint baru dibuka setelah waktu prizeCertificateClaim tercapai."
    case "CompetitionDoesNotExist": return "Kompetisi tidak ditemukan on-chain. Cek onchainCompetitionId dan alamat NEXT_PUBLIC_COMPETITION_CONTRACT di .env."
    case "InvalidTeamId": return "Team ID tidak valid (0). Pastikan team sudah benar."
    case "InvalidSignature": return "Signature tidak valid — signer API tidak cocok dengan signerAddress di kontrak. Pastikan wallet yang mint sama dengan wallet yang minta signature, dan onchainCompetitionId / teamId / CID persis sama dengan yang di-hash API (CID raw tanpa ipfs://)."
    case "ECDSAInvalidSignature":
    case "ECDSAInvalidSignatureLength":
    case "ECDSAInvalidSignatureS": return "Recovery ECDSA gagal — signature tidak cocok dengan signer. Cek chainId (968), alamat kontrak, CID, dan wallet."
    case "CertificateNonTransferable": return "Sertifikat soulbound — tidak bisa ditransfer."
    case "WinnerDoesNotExist": return "Winner tidak ditemukan."
    case "WinnerMismatch": return "Winner tidak cocok dengan kompetisi ini."
    case "InsufficientPrizeBalance": return "Saldo prize di treasury tidak cukup."
    case "InvalidRecipient": return "Alamat penerima tidak valid."
    default: return cleanFallback || "Transaksi gagal. Cek console untuk detail."
  }
}

/**
 * Must stay in sync with:
 * - API: cobalt-protocol-api/src/common/utils/certificate-signature.util.ts -> deriveNumericTeamId
 *         + hashParticipantCertificate(address(this), msg.sender, _competitionId, _teamId, _cid)
 * - Contract: CompetitionManager.safeMintCertificateParticipant verifies
 *   keccak256(abi.encodePacked(address(this), msg.sender, _competitionId, _teamId, _cid))
 *   where _cid is raw CID (no ipfs://) — contract does IPFSHelper.toIPFSURI(_cid) internally.
 *   See apps/web/abi/CompetitionManager.json:
 *     safeMintCertificateParticipant(uint256 _competitionId, uint256 _teamId, bytes _signature, string _cid)
 *     safeMintCertificateParticipantWinner(uint256 _winnerId, bytes signature, string _cid)
 *
 * CRITICAL: _cid for mint MUST come from the signature response
 *   fetchParticipantCertificateSignature(...) -> data.cid | data.certificate_cid | data.uri (strip ipfs://)
 *   — NOT from competition.certificate_cid / props certificateCid.
 *   competition.certificate_cid (passed as certificateCid prop from page.tsx via
 *   CompetitionWorkspace) is display-only. Using it as _cid will fail ECDSA recovery
 *   (ECDSAInvalidSignature) because the signed hash was computed over the signature-bound CID.
 *   page.tsx (Server Component) only forwards onchainCompetitionId + display CID;
 *   actual mint CID is fetched client-side inside handleMint* handlers below.
 */
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
  const [winnerMintError, setWinnerMintError] = useState<string | null>(null)
  const [participantMintError, setParticipantMintError] = useState<string | null>(null)
  const [isMintedBackend, setIsMintedBackend] = useState(false)
  const { toast } = useToast()
  const { connected } = useSiteActions()
  const { writeContractAsync, data: mintTxHash, isPending: isMintPending } =
    useWriteContract()
  const { isLoading: isMintConfirming, isSuccess: isMinted } =
    useWaitForTransactionReceipt({ hash: mintTxHash })
  const { writeContractAsync: writeWinnerAsync, data: winnerTxHash, isPending: isWinnerPending } =
    useWriteContract()
  const { isLoading: isWinnerConfirming, isSuccess: isWinnerMinted } =
    useWaitForTransactionReceipt({ hash: winnerTxHash })

  const chainId = useChainId()
  const { address: connectedAddress } = useAccount()
  const publicClient = usePublicClient()
  const effectiveChainId = chainId && chainId > 0 ? chainId : 968

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (teamId && mounted && connectedAddress) {
      fetchMyParticipantMinted(teamId)
        .then((res) => {
          if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
            setIsMintedBackend(true)
          } else if (res?.data && !Array.isArray(res.data) && Object.keys(res.data).length > 0) {
            setIsMintedBackend(true)
          } else if (Array.isArray(res) && res.length > 0) {
            setIsMintedBackend(true)
          } else {
            setIsMintedBackend(false)
          }
        })
        .catch(() => {
          setIsMintedBackend(false)
        })
    }
  }, [teamId, mounted, connectedAddress])

  if (!mounted || !connected) return null

  const isAvailable = Boolean(
    pirzeCertificateClaim && new Date() >= new Date(pirzeCertificateClaim)
  )
  const isMinting = isMintPending || isMintConfirming
  const isWinnerMinting = isWinnerPending || isWinnerConfirming
  const competitionContractAddress = getCompetitionContractAddress()

  const handleMintParticipantCertificate = async () => {
    setParticipantMintError(null)
    try {
      if (!teamId) {
        throw new Error("Team ID is required to mint a participant certificate — join or create a team first.")
      }
      if (!connectedAddress) {
        throw new Error("Wallet belum connect. Hubungkan wallet dulu.")
      }
      const signatureResponse: any = await fetchParticipantCertificateSignature(effectiveChainId, competitionId, teamId)
      const data = signatureResponse?.data
      const signature = data?.signature as string | undefined
      const cid: string | null = (data?.cid as string | null) ?? (data?.certificate_cid as string | null) ?? (data?.uri ? String(data.uri).replace(/^ipfs:\/\//, "") : null)
      if (!signature || !cid) {
        throw new Error(data?.message || signatureResponse?.message || "Participant certificate signature or CID was not returned by the API.")
      }
      if (!onchainCompetitionId || !/^\d+$/.test(onchainCompetitionId)) {
        throw new Error("The competition does not have a valid on-chain competition ID.")
      }
      console.debug("[mintParticipant] chainId", effectiveChainId, "contract", competitionContractAddress, "connectedAddress", connectedAddress, "onchainCompetitionId", onchainCompetitionId, "teamId", teamId, "cid", cid, "sig", signature?.slice(0, 20) + "…")

      // Pre-simulate biar custom error 0x ke-decode SEBELUM popup MetaMask.
      // Kalau simulate revert, kita tampilkan pesan jelas tanpa trigger MM 0x.
      if (publicClient && connectedAddress) {
        try {
          await publicClient.simulateContract({
            address: competitionContractAddress,
            abi: CompetitionManagerABI as any,
            functionName: "safeMintCertificateParticipant",
            args: [BigInt(onchainCompetitionId), String(teamId), signature as `0x${string}`, cid as string],
            account: connectedAddress as `0x${string}`,
          })
        } catch (simErr: any) {
          const name = decodeCertificateErrorName(simErr)
          const raw = simErr?.shortMessage || simErr?.cause?.shortMessage || simErr?.message || "Simulate failed"
          const msg = friendlyCertificateError(name, raw)
          console.error("[mintParticipant][simulate] revert", name, simErr)
          const full = `${name ? name + ": " : ""}${msg}`
          setParticipantMintError(full)
          toast({ variant: "destructive", title: "Mint gagal (pre-check)", description: full })
          return
        }
      }

      await writeContractAsync({
        address: competitionContractAddress,
        abi: CompetitionManagerABI as any,
        functionName: "safeMintCertificateParticipant",
        args: [BigInt(onchainCompetitionId), String(teamId), signature as `0x${string}`, cid as string],
      })
    } catch (error: any) {
      const status: number | undefined =
        error?.status ?? error?.cause?.status ?? error?.cause?.cause?.status
      if (status === 400) {
        const m = "Please upload your project first."
        setParticipantMintError(m)
        toast({ variant: "destructive", title: "Failed to mint certificate", description: m })
        return
      }
      const raw = error?.cause?.message || error?.shortMessage || error?.message || "Failed to mint participant certificate."
      const name = decodeCertificateErrorName(error)
      const msg = friendlyCertificateError(name, raw)
      console.error("[mintParticipant] revert", name, error)
      const full = `${name ? name + ": " : ""}${msg}`
      setParticipantMintError(full)
      toast({ variant: "destructive", title: "Failed to mint certificate", description: full })
    }
  }

  const handleMintWinnerCertificate = async () => {
    setWinnerMintError(null)
    try {
      if (!connectedAddress) throw new Error("Wallet belum connect.")
      const resp: any = await fetchWinnerCertificateSignature(effectiveChainId, competitionId)
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
      if (publicClient && connectedAddress) {
        try {
          await publicClient.simulateContract({
            address: competitionContractAddress,
            abi: CompetitionManagerABI as any,
            functionName: "safeMintCertificateParticipantWinner",
            args: [BigInt(winnerId), signature as `0x${string}`, cid as string],
            account: connectedAddress as `0x${string}`,
          })
        } catch (simErr: any) {
          const name = decodeCertificateErrorName(simErr)
          const raw = simErr?.shortMessage || simErr?.cause?.shortMessage || simErr?.message || "Simulate failed"
          const msg = friendlyCertificateError(name, raw)
          console.error("[mintWinner][simulate] revert", name, simErr)
          const full = `${name ? name + ": " : ""}${msg}`
          setWinnerMintError(full)
          toast({ variant: "destructive", title: "Mint gagal (pre-check)", description: full })
          return
        }
      }
      await writeWinnerAsync({
        address: competitionContractAddress,
        abi: CompetitionManagerABI as any,
        functionName: "safeMintCertificateParticipantWinner",
        args: [BigInt(winnerId), signature as `0x${string}`, cid as string],
      })
    } catch (error: any) {
      const raw = error?.cause?.message || error?.shortMessage || error?.message || "Failed to mint winner certificate."
      const name = decodeCertificateErrorName(error)
      const msg = friendlyCertificateError(name, raw)
      console.error("[mintWinner] revert", name, error)
      const full = `${name ? name + ": " : ""}${msg}`
      setWinnerMintError(full)
      toast({ variant: "destructive", title: "Failed to mint certificate", description: full })
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
            disabled={!isAvailable || isMinting || isMinted || isMintedBackend}
            onClick={handleMintParticipantCertificate}
            className={`mt-5 rounded-lg px-3 py-3 text-xs ${
              isAvailable && !isMinting && !isMinted && !isMintedBackend
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "bg-slate-200/70 text-slate-500 cursor-not-allowed"
            }`}
          >
            {isMinted || isMintedBackend ? "Participant Certificate Minted" : isMinting ? "Minting Participant Certificate..." : "Mint Participant Certificate NFT"}
          </button>
          {participantMintError ? (<p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 px-2 py-2 text-[11px] leading-4 text-red-700">{participantMintError}</p>) : null}
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
