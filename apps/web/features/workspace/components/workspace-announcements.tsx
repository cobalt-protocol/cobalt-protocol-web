"use client"
import { useEffect, useState } from "react"
import { CheckCircle2, FileBadge, LockKeyhole } from "lucide-react"
import { useAccount, useChainId, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi"
import { BaseError, decodeErrorResult, getAddress, isAddress, keccak256, stringToHex } from "viem"
import { Badge, Panel, SectionHeading } from "@/components/ui/page-primitives"
import { useSiteActions } from "@/components/layout/site-actions"
import CompetitionManagerABI from "@/abi/CompetitionManager.json"
import {
  fetchParticipantCertificateSignature,
  fetchWinnerCertificateSignature,
  fetchMyParticipantMinted,
  fetchMyWinnerMinted,
  fetchPrizeWinnersByCompetitionId,
} from "@/lib/competitions-api"
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
  prizeWinners = [],
}: {
  competitionId: string
  onchainCompetitionId?: string | null
  certificateCid?: string | null
  pirzeCertificateClaim?: string | null
  teamId?: string | null
  prizeWinners?: readonly any[]
}) {
  const [mounted, setMounted] = useState(false)
  const [winnerList, setWinnerList] = useState<any[]>(() =>
    Array.isArray(prizeWinners) ? [...prizeWinners] : []
  )
  const [mintedWinnerIds, setMintedWinnerIds] = useState<Record<string, boolean>>({})
  const [mintingWinnerIds, setMintingWinnerIds] = useState<Record<string, boolean>>({})
  const [winnerMintErrors, setWinnerMintErrors] = useState<Record<string, string | null>>({})
  const [participantMintError, setParticipantMintError] = useState<string | null>(null)
  const [isParticipantMinting, setIsParticipantMinting] = useState(false)
  const [isParticipantMintedLocally, setIsParticipantMintedLocally] = useState(false)
  const [isMintedBackend, setIsMintedBackend] = useState(false)
  const { toast } = useToast()
  const { connected } = useSiteActions()
  const { writeContractAsync } = useWriteContract()
  const { writeContractAsync: writeWinnerAsync } = useWriteContract()

  const chainId = useChainId()
  const { address: connectedAddress } = useAccount()
  const publicClient = usePublicClient()
  const effectiveChainId = chainId && chainId > 0 ? chainId : 968

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (Array.isArray(prizeWinners) && prizeWinners.length > 0) {
      setWinnerList([...prizeWinners])
    } else if (competitionId) {
      fetchPrizeWinnersByCompetitionId(effectiveChainId, competitionId)
        .then((res) => {
          if (Array.isArray(res) && res.length > 0) {
            setWinnerList(res)
          }
        })
        .catch(() => {})
    }
  }, [prizeWinners, effectiveChainId, competitionId])

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

  useEffect(() => {
    if (competitionId && mounted && connectedAddress) {
      fetchMyWinnerMinted(effectiveChainId, competitionId)
        .then((res) => {
          const list = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
              ? res
              : []
          if (list.length > 0) {
            const mintedMap: Record<string, boolean> = {}
            for (const item of list) {
              if (item?.winner_id !== undefined && item?.winner_id !== null) {
                mintedMap[String(item.winner_id)] = true
              }
            }
            if (Object.keys(mintedMap).length > 0) {
              setMintedWinnerIds((prev) => ({ ...prev, ...mintedMap }))
            }
          }
        })
        .catch(() => {})
    }
  }, [competitionId, effectiveChainId, mounted, connectedAddress])

  if (!mounted || !connected) return null

  const isAvailable = Boolean(
    pirzeCertificateClaim && new Date() >= new Date(pirzeCertificateClaim)
  )
  const isParticipantDone = isMintedBackend || isParticipantMintedLocally
  const competitionContractAddress = getCompetitionContractAddress()

  const handleMintParticipantCertificate = async () => {
    setParticipantMintError(null)
    setIsParticipantMinting(true)
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
          if (name === "CertificateAlreadyClaimed") {
            setIsParticipantMintedLocally(true)
          }
          toast({ variant: "destructive", title: "Mint gagal (pre-check)", description: full })
          return
        }
      }

      const hash = await writeContractAsync({
        address: competitionContractAddress,
        abi: CompetitionManagerABI as any,
        functionName: "safeMintCertificateParticipant",
        args: [BigInt(onchainCompetitionId), String(teamId), signature as `0x${string}`, cid as string],
      })

      if (publicClient && hash) {
        await publicClient.waitForTransactionReceipt({ hash })
      }
      setIsParticipantMintedLocally(true)
      toast({
        title: "Sertifikat Berhasil Di-mint!",
        description: "Participant Certificate berhasil di-mint sebagai NFT.",
      })
    } catch (error: any) {
      const status: number | undefined =
        error?.status ??
        error?.statusCode ??
        error?.cause?.status ??
        error?.cause?.statusCode ??
        error?.cause?.cause?.status ??
        error?.payload?.statusCode ??
        (typeof error?.message === "string" &&
        (error.message.includes("403") || /forbidden/i.test(error.message))
          ? 403
          : undefined)

      if (status === 403) {
        const m =
          error?.message ||
          "Mint ditolak (403): Anda bukan anggota tim yang terdaftar untuk kompetisi ini."
        console.warn("[mintParticipant] 403 Forbidden - rejected:", m)
        setParticipantMintError(m)
        toast({
          variant: "destructive",
          title: "Mint Ditolak (403)",
          description: m,
        })
        return
      }
      if (status === 400) {
        const m = error?.message || "Please upload your project first."
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
      if (name === "CertificateAlreadyClaimed") {
        setIsParticipantMintedLocally(true)
      }
      toast({ variant: "destructive", title: "Failed to mint certificate", description: full })
    } finally {
      setIsParticipantMinting(false)
    }
  }

  const handleMintWinnerCertificate = async (
    targetWinnerId?: string | null,
    itemTitle?: string
  ) => {
    const key = targetWinnerId ? String(targetWinnerId) : "default"
    setWinnerMintErrors((prev) => ({ ...prev, [key]: null }))
    setMintingWinnerIds((prev) => ({ ...prev, [key]: true }))

    try {
      if (!connectedAddress) throw new Error("Wallet belum connect.")
      const resp: any = await fetchWinnerCertificateSignature(
        effectiveChainId,
        competitionId,
        targetWinnerId || null
      )
      const data = resp?.data
      const signature = data?.signature as string | undefined
      const winnerIdFromApi = data?.winner_id ? String(data.winner_id) : targetWinnerId
      const cid: string | null =
        (data?.cid as string | null) ??
        (data?.certificate_cid as string | null) ??
        (data?.uri ? String(data.uri).replace(/^ipfs:\/\//, "") : null)

      if (!signature || !winnerIdFromApi || !cid) {
        throw new Error(
          resp?.message ||
            data?.message ||
            "Winner certificate signature/CID not available — you may not be a winner for this category."
        )
      }

      const onchainWinnerId = BigInt(winnerIdFromApi)

      if (publicClient && connectedAddress) {
        try {
          await publicClient.simulateContract({
            address: competitionContractAddress,
            abi: CompetitionManagerABI as any,
            functionName: "safeMintCertificateParticipantWinner",
            args: [onchainWinnerId, signature as `0x${string}`, cid as string],
            account: connectedAddress as `0x${string}`,
          })
        } catch (simErr: any) {
          const name = decodeCertificateErrorName(simErr)
          const raw =
            simErr?.shortMessage ||
            simErr?.cause?.shortMessage ||
            simErr?.message ||
            "Simulate failed"
          const msg = friendlyCertificateError(name, raw)
          console.error("[mintWinner][simulate] revert", name, simErr)
          const full = `${name ? name + ": " : ""}${msg}`
          setWinnerMintErrors((prev) => ({ ...prev, [key]: full }))
          if (name === "WinnerAlreadyClaimed" || name === "CertificateAlreadyClaimed") {
            setMintedWinnerIds((prev) => ({ ...prev, [key]: true }))
          }
          toast({
            variant: "destructive",
            title: "Mint gagal (pre-check)",
            description: full,
          })
          return
        }
      }

      const hash = await writeWinnerAsync({
        address: competitionContractAddress,
        abi: CompetitionManagerABI as any,
        functionName: "safeMintCertificateParticipantWinner",
        args: [onchainWinnerId, signature as `0x${string}`, cid as string],
      })

      if (publicClient && hash) {
        await publicClient.waitForTransactionReceipt({ hash })
      }

      setMintedWinnerIds((prev) => ({ ...prev, [key]: true }))
      toast({
        title: "Certificate Minted!",
        description: `Winner Certificate ${itemTitle ? `(${itemTitle}) ` : ""}successfully minted.`,
      })
    } catch (error: any) {
      const status: number | undefined =
        error?.status ??
        error?.statusCode ??
        error?.cause?.status ??
        error?.cause?.statusCode ??
        error?.cause?.cause?.status ??
        error?.payload?.statusCode ??
        (typeof error?.message === "string" &&
        (error.message.includes("403") || /forbidden/i.test(error.message))
          ? 403
          : undefined)

      if (status === 403) {
        const m =
          error?.message ||
          "Mint ditolak (403): Kamu bukan pemenang atau tim kamu tidak terdaftar sebagai pemenang untuk kompetisi/kategori ini."
        console.warn("[mintWinner] 403 Forbidden - rejected:", m)
        setWinnerMintErrors((prev) => ({ ...prev, [key]: m }))
        toast({
          variant: "destructive",
          title: "Mint Ditolak (403)",
          description: m,
        })
        return
      }

      if (status === 400) {
        const m =
          error?.message ||
          "Permintaan mint tidak valid (400) — pastikan project sudah disubmit."
        setWinnerMintErrors((prev) => ({ ...prev, [key]: m }))
        toast({
          variant: "destructive",
          title: "Mint Gagal (400)",
          description: m,
        })
        return
      }

      const raw =
        error?.cause?.message ||
        error?.shortMessage ||
        error?.message ||
        "Failed to mint winner certificate."
      const name = decodeCertificateErrorName(error)
      const msg = friendlyCertificateError(name, raw)
      console.error("[mintWinner] revert", name, error)
      const full = `${name ? name + ": " : ""}${msg}`
      setWinnerMintErrors((prev) => ({ ...prev, [key]: full }))
      if (name === "WinnerAlreadyClaimed" || name === "CertificateAlreadyClaimed") {
        setMintedWinnerIds((prev) => ({ ...prev, [key]: true }))
      }
      toast({
        variant: "destructive",
        title: "Failed to mint certificate",
        description: full,
      })
    } finally {
      setMintingWinnerIds((prev) => ({ ...prev, [key]: false }))
    }
  }

  return (
    <Panel>
      <SectionHeading
        title="Announcements & Credentials"
        description="Competition notifications, jury updates, and credential certificates."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {/* Participant Certificate Card */}
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
            disabled={!isAvailable || isParticipantMinting || isParticipantDone}
            onClick={handleMintParticipantCertificate}
            className={`mt-5 rounded-lg px-3 py-3 text-xs ${
              isAvailable && !isParticipantMinting && !isParticipantDone
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "bg-slate-200/70 text-slate-500 cursor-not-allowed"
            }`}
          >
            {isParticipantDone
              ? "Participant Certificate Minted"
              : isParticipantMinting
                ? "Minting Participant Certificate..."
                : "Mint Participant Certificate NFT"}
          </button>
          {participantMintError ? (
            <p
              role="alert"
              className="mt-3 rounded-md border border-red-200 bg-red-50 px-2 py-2 text-[11px] leading-4 text-red-700"
            >
              {participantMintError}
            </p>
          ) : null}
          {certificateCid ? (
            <p className="mt-3 text-[10px] leading-5 text-muted-foreground">
              Certificate CID:{" "}
              <span className="font-mono break-all">{certificateCid}</span>
            </p>
          ) : (
            <p className="mt-3 text-[10px] leading-5 text-muted-foreground">
              Available after judging and results are finalized.
            </p>
          )}
        </div>

        {/* Winner Certificate Cards */}
        {winnerList.length > 0 ? (
          winnerList.map((winner, idx) => {
            const targetWinnerId = winner.winner_id
              ? String(winner.winner_id)
              : winner.id
                ? String(winner.id)
                : String(idx + 1)
            const title =
              winner.category ||
              winner.title ||
              `Winner Certificate #${idx + 1}`
            const winCid = winner.certificate_cid || certificateCid
            const isWinnerMintingItem = Boolean(mintingWinnerIds[targetWinnerId])
            const isWinnerMintedItem = Boolean(mintedWinnerIds[targetWinnerId])
            const itemError = winnerMintErrors[targetWinnerId]

            return (
              <div
                key={winner.id || targetWinnerId || idx}
                className="flex flex-col rounded-xl border border-border/60 bg-slate-50 p-5"
              >
                <div className="flex items-center gap-2">
                  <FileBadge size={23} className="text-slate-400" />
                  <h3 className="text-sm font-bold truncate">
                    Winner Certificate ({title})
                  </h3>
                  <span className="ml-auto shrink-0">
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
                  disabled={
                    !isAvailable ||
                    isWinnerMintingItem ||
                    isWinnerMintedItem
                  }
                  onClick={() =>
                    handleMintWinnerCertificate(targetWinnerId, title)
                  }
                  className={`mt-5 rounded-lg px-3 py-3 text-xs ${
                    isAvailable &&
                    !isWinnerMintingItem &&
                    !isWinnerMintedItem
                      ? "bg-slate-900 text-white hover:bg-slate-800"
                      : "bg-slate-200/70 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {isWinnerMintedItem
                    ? `Winner Certificate (${title}) Minted`
                    : isWinnerMintingItem
                      ? `Minting Certificate (${title})...`
                      : `Mint Winner Certificate (${title}) NFT`}
                </button>
                {itemError ? (
                  <p
                    role="alert"
                    className="mt-3 rounded-md border border-red-200 bg-red-50 px-2 py-2 text-[11px] leading-4 text-red-700"
                  >
                    {itemError}
                  </p>
                ) : null}
                {winCid ? (
                  <p className="mt-3 text-[10px] leading-5 text-muted-foreground">
                    Certificate CID:{" "}
                    <span className="font-mono break-all">{winCid}</span>
                  </p>
                ) : (
                  <p className="mt-3 text-[10px] leading-5 text-muted-foreground">
                    Available after final judging and prize settlement.
                  </p>
                )}
              </div>
            )
          })
        ) : (
          <div className="flex flex-col rounded-xl border border-border/60 bg-slate-50 p-5">
            <div className="flex items-center gap-2">
              <FileBadge size={23} className="text-slate-400" />
              <h3 className="text-sm font-bold">Winner Certificate</h3>
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
              disabled={
                !isAvailable ||
                Boolean(mintingWinnerIds["default"]) ||
                Boolean(mintedWinnerIds["default"])
              }
              onClick={() => handleMintWinnerCertificate(null, "")}
              className={`mt-5 rounded-lg px-3 py-3 text-xs ${
                isAvailable &&
                !mintingWinnerIds["default"] &&
                !mintedWinnerIds["default"]
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "bg-slate-200/70 text-slate-500 cursor-not-allowed"
              }`}
            >
              {mintedWinnerIds["default"]
                ? "Winner Certificate Minted"
                : mintingWinnerIds["default"]
                  ? "Minting Winner Certificate..."
                  : "Mint Winner Certificate NFT"}
            </button>
            {winnerMintErrors["default"] ? (
              <p
                role="alert"
                className="mt-3 rounded-md border border-red-200 bg-red-50 px-2 py-2 text-[11px] leading-4 text-red-700"
              >
                {winnerMintErrors["default"]}
              </p>
            ) : null}
            <p className="mt-3 text-[10px] leading-5 text-muted-foreground">
              Available after final judging and prize settlement.
            </p>
          </div>
        )}
      </div>
    </Panel>
  )
}
