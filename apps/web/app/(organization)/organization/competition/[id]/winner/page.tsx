'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    fetchApiMe,
    getStoredToken,
    fetchPrizeWinnersByCompetitionId,
    fetchParticipantWinnersByCompetitionId,
    fetchPrizeDistributedByCompetitionId,
    fetchOrganizationTeamsByCompetitionIdResult,
    fetchSetWinnerSignature,
    fetchApiCompetitionById,
    ApiTeam,
    ApiParticipantWinner
} from '@/lib/competitions-api';
import CompetitionManagerABI from '@/abi/CompetitionManager.json';
import { getCompetitionContractAddress } from '@/lib/contracts';
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, Loader2, AlertCircle, Coins } from 'lucide-react';

// Komponen Ikon SVG sederhana agar tidak perlu install library eksternal
const ChevronDownIcon = () => (
    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
    </svg>
);

const CheckCircleIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
);

const KNOWN_WINNER_ERRORS = [
    "AmountZero",
    "CertificateAlreadyClaimed",
    "CertificateNonTransferable",
    "CompetitionDoesNotExist",
    "CompetitionNotEnded",
    "ECDSAInvalidSignature",
    "ECDSAInvalidSignatureLength",
    "ECDSAInvalidSignatureS",
    "ERC721IncorrectOwner",
    "ERC721InsufficientApproval",
    "ERC721InvalidApprover",
    "ERC721InvalidOperator",
    "ERC721InvalidOwner",
    "ERC721InvalidReceiver",
    "ERC721InvalidSender",
    "ERC721NonexistentToken",
    "FeeOptionNotFound",
    "IncorrectFeeAmount",
    "IncorrectNativeAmount",
    "InsufficientCompetitionPrize",
    "InsufficientPrizeBalance",
    "InvalidEndTime",
    "InvalidFormation",
    "InvalidRecipient",
    "InvalidSignature",
    "InvalidTeamId",
    "MustHaveWinner",
    "NativeFromMismatch",
    "NotAllWinnersRecorded",
    "NotOrganization",
    "OwnableInvalidOwner",
    "OwnableUnauthorizedAccount",
    "PriceFeeNotFound",
    "PrizeAmountZero",
    "PrizeTokenMismatch",
    "PrizesAlreadyDistributed",
    "PrizesNotDistributed",
    "TokenAlreadyDeactivated",
    "TokenAlreadyListed",
    "TokenNotActive",
    "TokenNotListed",
    "TransferFailed",
    "TreasuryDoesNotExist",
    "WinnerAlreadyClaimed",
    "WinnerDoesNotExist",
    "WinnerMismatch",
    "WithdrawTooEarly",
] as const;

function extractHexData(err: any): string[] {
    const out: string[] = [];
    const seen = new Set<any>();
    const queue: any[] = [err];
    let depth = 0;
    while (queue.length && depth < 50) {
        const cur = queue.shift();
        depth++;
        if (!cur || seen.has(cur)) continue;
        seen.add(cur);
        if (typeof cur === "string") {
            const m = cur.match(/0x[0-9a-fA-F]{8,}/g);
            if (m) out.push(...m);
            continue;
        }
        if (typeof cur === "object") {
            try {
                if (cur instanceof BaseError) {
                    const walked: any = (cur as any).walk?.((e: any) => (e as any)?.data || (e as any)?.cause?.data);
                    if (walked?.data && typeof walked.data === "string" && walked.data.startsWith("0x")) out.push(walked.data);
                }
            } catch {}
            for (const k of ["data", "cause", "error", "details", "message", "shortMessage", "metaMessages", "args", "reason"]) {
                const v = (cur as any)[k];
                if (!v) continue;
                if (typeof v === "string" && v.startsWith("0x") && v.length >= 10) out.push(v);
                else if (typeof v === "string") {
                    const m = v.match(/0x[0-9a-fA-F]{8,}/g);
                    if (m) out.push(...m);
                } else if (Array.isArray(v)) queue.push(...v);
                else if (typeof v === "object") queue.push(v);
            }
            try {
                const s = String((cur as any).message || (cur as any).shortMessage || "");
                const m2 = s.match(/0x[0-9a-fA-F]{8,}/g);
                if (m2) out.push(...m2);
            } catch {}
        }
    }
    return [...new Set(out)].sort((a, b) => b.length - a.length);
}

function decodeWinnerErrorName(err: any): string | null {
    const hexes = extractHexData(err);
    for (const hex of hexes) {
        try {
            const decoded: any = decodeErrorResult({ abi: CompetitionManagerABI as any, data: hex as `0x${string}` });
            if (decoded?.errorName) return decoded.errorName as string;
        } catch {}
    }
    const msg = String(err?.shortMessage || err?.message || err?.cause?.message || err?.cause?.cause?.message || err?.details || "");
    for (const n of KNOWN_WINNER_ERRORS) {
        if (msg.includes(n)) return n;
    }
    if (/user rejected|user denied|rejected the request/i.test(msg)) return "UserRejected";
    if (/insufficient funds/i.test(msg)) return "InsufficientFunds";
    return null;
}

function friendlyWinnerError(name: string | null, fallback: string): string {
    const cleanFallback = fallback.replace(/0x[0-9a-fA-F]{10,}/g, "[custom error]").slice(0, 500);
    switch (name) {
        case "UserRejected":
            return "Transaksi dibatalkan — kamu menutup / menolak popup MetaMask.";
        case "InsufficientFunds":
            return "Saldo tidak cukup untuk biaya gas transaksi.";
        case "WinnerAlreadyClaimed":
            return "Pemenang sudah di-set untuk kategori/slot ini atau sudah di-claim oleh partisipan.";
        case "WinnerDoesNotExist":
            return "Kategori pemenang (winner ID) tidak ditemukan di smart contract on-chain.";
        case "WinnerMismatch":
            return "Winner tidak cocok dengan kompetisi atau team ID yang dipilih.";
        case "NotOrganization":
            return "Akses ditolak: Hanya wallet organization penyelenggara kompetisi yang berhak menetapkan pemenang.";
        case "InvalidRecipient":
            return "Alamat wallet penerima / pemenang tidak valid atau 0x0.";
        case "InvalidSignature":
            return "Signature tidak valid — signer API tidak cocok dengan signerAddress di kontrak CompetitionManager.";
        case "ECDSAInvalidSignature":
        case "ECDSAInvalidSignatureLength":
        case "ECDSAInvalidSignatureS":
            return "Verifikasi ECDSA gagal — signature tidak cocok dengan signer resmi.";
        case "CompetitionDoesNotExist":
            return "Kompetisi tidak ditemukan on-chain. Cek onchainCompetitionId dan alamat kontrak di .env.";
        case "CompetitionNotEnded":
            return "Kompetisi belum berakhir on-chain. Penentuan pemenang hanya dapat dilakukan setelah kompetisi selesai.";
        case "PrizesAlreadyDistributed":
            return "Hadiah untuk kompetisi ini sudah didistribusikan sebelumnya.";
        case "PrizesNotDistributed":
            return "Hadiah kompetisi belum didistribusikan.";
        case "NotAllWinnersRecorded":
            return "Belum semua pemenang tercatat untuk kompetisi ini.";
        case "InsufficientPrizeBalance":
        case "InsufficientCompetitionPrize":
            return "Saldo hadiah di treasury kontrak tidak mencukupi.";
        case "PrizeTokenMismatch":
            return "Token hadiah tidak sesuai dengan konfigurasi kompetisi.";
        case "AmountZero":
        case "PrizeAmountZero":
            return "Nominal hadiah tidak boleh nol.";
        case "InvalidTeamId":
            return "Team ID tidak valid. Pastikan tim sudah benar.";
        case "MustHaveWinner":
            return "Kompetisi harus memiliki pemenang.";
        case "WithdrawTooEarly":
            return "Penarikan terlalu dini — periode tunggu belum terlewati.";
        default:
            return cleanFallback || "Transaksi gagal di blockchain. Cek console browser untuk detail.";
    }
}

interface CategoryItem {
    id: string | number;
    name: string;
    teamId: number | string;
    teamName?: string;
}

export default function DetermineWinner() {
    const router = useRouter();
    const params = useParams();
    const compId = (params?.id as string) || '';
    const chainId = useChainId()
    const { address, isConnected, status: accountStatus } = useAccount();
    const publicClient = usePublicClient();
    const queryClient = useQueryClient();
    const [storedToken, setStoredToken] = useState<string | null>(null);
    const [hasCheckedToken, setHasCheckedToken] = useState(false);

    useEffect(() => {
        setStoredToken(getStoredToken());
        setHasCheckedToken(true);
    }, []);

    const { data: meUser, isLoading: isLoadingMe } = useQuery({
        queryKey: ["user-me", storedToken],
        queryFn: () => fetchApiMe(storedToken || getStoredToken()),
        enabled: Boolean(storedToken),
    });

    const { data: prizeWinners, isLoading: isLoadingPrizeWinners } = useQuery({
        queryKey: ["prize-winners", compId, storedToken],
        queryFn: () => fetchPrizeWinnersByCompetitionId(chainId, compId, storedToken || getStoredToken()),
        enabled: Boolean(compId && storedToken),
    });

    const { data: participantWinners = [], isLoading: isLoadingParticipantWinners } = useQuery({
        queryKey: ["participant-winners", compId, storedToken],
        queryFn: () => fetchParticipantWinnersByCompetitionId(chainId, compId, storedToken || getStoredToken()),
        enabled: Boolean(compId && storedToken),
    });

    // Owner-only: GET /api/v1/chains/:chainId/competitions/:id/teams/organization (Bearer JWT) — returns all teams (public+private)
    const { data: teamsData, isLoading: isLoadingTeams } = useQuery({
        queryKey: ["organization-competition-teams", chainId, compId, storedToken],
        queryFn: () => fetchOrganizationTeamsByCompetitionIdResult(chainId, compId, storedToken || getStoredToken()),
        enabled: Boolean(compId && storedToken),
    });

    const { data: competitionData } = useQuery({
        queryKey: ["competition-detail", chainId, compId, storedToken],
        queryFn: () => fetchApiCompetitionById(chainId, compId, storedToken || getStoredToken()),
        enabled: Boolean(compId),
    });

    const onchainCompetitionId = competitionData?.competition_id || (/^\d+$/.test(compId) ? compId : null);

    const { data: isAlreadyDistributed = false, refetch: refetchDistributed } = useQuery({
        queryKey: ["prizes-distributed", chainId, onchainCompetitionId],
        queryFn: async () => {
            if (!publicClient || !onchainCompetitionId) return false;
            try {
                const competitionContractAddress = getCompetitionContractAddress();
                const distributed = await publicClient.readContract({
                    address: competitionContractAddress,
                    abi: CompetitionManagerABI as any,
                    functionName: "prizesDistributed",
                    args: [BigInt(onchainCompetitionId)],
                });
                return Boolean(distributed);
            } catch (e) {
                console.error("Failed to check prizesDistributed:", e);
                return false;
            }
        },
        enabled: Boolean(publicClient && onchainCompetitionId),
    });

    // Prize already distributed per indexed prize_distributed table (API returns 404 -> [] when none)
    const { data: prizeDistributedRows = [], refetch: refetchPrizeDistributedRows } = useQuery({
        queryKey: ["prize-distributed-api", chainId, compId],
        queryFn: () => fetchPrizeDistributedByCompetitionId(chainId, compId),
        enabled: Boolean(compId),
    });
    const isPrizeDistributedIndexed = prizeDistributedRows.length > 0;

    const allTeams = useMemo<ApiTeam[]>(() => {
        if (!teamsData) return [];
        if (Array.isArray(teamsData)) return teamsData;
        if (Array.isArray((teamsData as any).data)) return (teamsData as any).data;
        return [];
    }, [teamsData]);

    // wagmi sempat berstatus "connecting"/"reconnecting" sesaat saat hard
    // refresh sebelum wallet selesai di-restore. Jika kita menilai role di
    // tengah proses ini, isConnected masih false dan organizer yang sah akan
    // terlempar kembali ke halaman competition.
    const isWagmiLoading =
        accountStatus === "connecting" || accountStatus === "reconnecting";

    const isOrganizationRole = Boolean(
        isConnected &&
        storedToken &&
        (meUser?.role === "organization" || meUser?.role === "organizer")
    );

    const isChecking =
        !hasCheckedToken ||
        (Boolean(storedToken) && isLoadingMe) ||
        (Boolean(storedToken) && isWagmiLoading);

    useEffect(() => {
        if (!isChecking && !isOrganizationRole) {
            router.replace(compId ? `/organization/competition/${compId}` : '/organization/competition');
        }
    }, [isChecking, isOrganizationRole, compId, router]);

    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [winnerSet, setWinnerSet] = useState<Record<string | number, boolean>>({});
    const [isSettingWinner, setIsSettingWinner] = useState<Record<string | number, boolean>>({});
    const [winnerErrors, setWinnerErrors] = useState<Record<string | number, string | null>>({});
    const [isDistributingPrize, setIsDistributingPrize] = useState(false);
    const { toast } = useToast();
    
    const { writeContractAsync } = useWriteContract();

    // To wait for tx receipts dynamically, we could use wagmi useWaitForTransactionReceipt 
    // but since we map over multiple categories, it's easier to use a public client or just wait for the promise if available. 
    // Wagmi writeContractAsync just returns tx hash. We will just show toast when it is sent successfully.

    useEffect(() => {
        if (prizeWinners) {
            if (prizeWinners.length > 0) {
                const initialWinnerSet: Record<string | number, boolean> = {};

                const mappedCategories: CategoryItem[] = prizeWinners.map((pw, index) => {
                    const existing = categories.find((c) => String(c.id) === String(pw.id));

                    // Match participant winner from table participant_winner
                    const pWinner = participantWinners.find((pwItem: ApiParticipantWinner) => {
                        if (!pwItem) return false;
                        if (pwItem.prize_winner) {
                            if (String(pwItem.prize_winner.id) === String(pw.id)) return true;
                            if (pw.winner_id != null && String(pwItem.prize_winner.winner_id) === String(pw.winner_id)) return true;
                            if (pwItem.prize_winner.category && pw.category && pwItem.prize_winner.category.trim().toLowerCase() === pw.category.trim().toLowerCase()) return true;
                        }
                        if (pwItem.prize_winner_id) {
                            if (String(pwItem.prize_winner_id) === String(pw.id)) return true;
                            if (pw.winner_id != null && String(pwItem.prize_winner_id) === String(pw.winner_id)) return true;
                        }
                        if (pwItem.title && pw.category && pwItem.title.trim().toLowerCase() === pw.category.trim().toLowerCase()) {
                            return true;
                        }
                        return false;
                    });

                    const isAlreadyWon = Boolean(pw.winner || pWinner);
                    if (isAlreadyWon) {
                        initialWinnerSet[pw.id] = true;
                    }

                    const matchingTeam = (pWinner?.team?.id
                        ? allTeams.find((t) => String(t.id) === String(pWinner.team?.id))
                        : undefined) ||
                        (pWinner?.user?.id
                        ? allTeams.find((t) => t.user_id === pWinner.user?.id || t.team_roles?.some((r: any) => r.user_id === pWinner.user?.id))
                        : undefined) ||
                        (pWinner?.participant
                        ? allTeams.find((t) =>
                            t.user?.wallet_address?.toLowerCase() === pWinner.participant.toLowerCase() ||
                            t.team_roles?.some((r: any) => r.user?.wallet_address?.toLowerCase() === pWinner.participant.toLowerCase())
                          )
                        : undefined) ||
                        (pw.winner
                        ? allTeams.find((t) => t.user_id === pw.winner?.user_id || t.team_roles?.some((r: any) => r.user_id === pw.winner?.user_id))
                        : undefined);

                    const winningTeamId = pWinner?.team?.id || matchingTeam?.id;
                    const winningTeamName = pWinner?.team?.name || matchingTeam?.name;

                    const assignedTeamId = isAlreadyWon && winningTeamId
                        ? winningTeamId
                        : existing?.teamId || winningTeamId || allTeams[index]?.id || allTeams[0]?.id || '';

                    const assignedTeamName = isAlreadyWon && winningTeamName
                        ? winningTeamName
                        : existing?.teamName || winningTeamName || allTeams.find((t) => String(t.id) === String(assignedTeamId))?.name || '';

                    return {
                        id: pw.id,
                        name: pw.category,
                        teamId: assignedTeamId,
                        teamName: assignedTeamName,
                    };
                });
                setCategories(mappedCategories);
                setWinnerSet((prev) => ({ ...initialWinnerSet, ...prev }));
            } else {
                setCategories([]);
            }
        }
    }, [prizeWinners, participantWinners, allTeams]);

    if (isChecking || !isOrganizationRole) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-6 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-2" />
                <span>{!isOrganizationRole && !isChecking ? "Redirecting..." : "Loading winner configuration..."}</span>
            </div>
        );
    }

    const handleAssignTeam = (categoryId: string | number, teamId: number | string) => {
        setWinnerErrors((prev) => ({ ...prev, [categoryId]: null }));
        const selectedTeam = allTeams.find((t) => String(t.id) === String(teamId));
        setCategories((prev) =>
            prev.map((c) => (String(c.id) === String(categoryId) ? { ...c, teamId, teamName: selectedTeam?.name } : c))
        );
    };

    const allWinnersSet = categories.length > 0 && categories.every((c) => Boolean(winnerSet[c.id]));
    const setWinnersCount = categories.filter((c) => Boolean(winnerSet[c.id])).length;

    const handleDistributePrize = async () => {
        setIsDistributingPrize(true);
        try {
            let targetCompId = onchainCompetitionId || competitionData?.competition_id;
            if (!targetCompId && !/^\d+$/.test(compId)) {
                try {
                    const fetched = await fetchApiCompetitionById(chainId, compId, storedToken || getStoredToken());
                    targetCompId = fetched?.competition_id;
                } catch {}
            }
            const finalId = targetCompId || compId;

            const competitionContractAddress = getCompetitionContractAddress();

            const tx = await writeContractAsync({
                address: competitionContractAddress,
                abi: CompetitionManagerABI as any,
                functionName: "distributePrizes",
                args: [BigInt(finalId)],
            });

            toast({
                title: "Transaksi Distribusi Terkirim",
                description: "Transaksi distributePrizes sedang dikonfirmasi di blockchain...",
            });

            if (publicClient && tx) {
                await publicClient.waitForTransactionReceipt({ hash: tx });
            }

            toast({
                title: "Hadiah Berhasil Didistribusikan!",
                description: "Fungsi distributePrizes berhasil dieksekusi di blockchain.",
            });

            queryClient.invalidateQueries({ queryKey: ["prizes-distributed", chainId, onchainCompetitionId] });
            queryClient.invalidateQueries({ queryKey: ["participant-winners", compId] });
            queryClient.invalidateQueries({ queryKey: ["prize-winners", compId] });
            refetchDistributed?.();
            refetchPrizeDistributedRows?.();
        } catch (error: any) {
            console.error("Failed to distribute prizes:", error);
            const name = decodeWinnerErrorName(error);
            const raw = error?.cause?.message || error?.shortMessage || error?.message || "Gagal mendistribusikan hadiah.";
            const msg = friendlyWinnerError(name, raw);
            const full = `${name ? name + ": " : ""}${msg}`;
            toast({
                title: name ? `Gagal: ${name}` : "Gagal Mendistribusikan Hadiah",
                description: full,
                variant: "destructive",
            });
        } finally {
            setIsDistributingPrize(false);
        }
    };

    const handleSetWinner = async (categoryId: string | number) => {
        setWinnerErrors((prev) => ({ ...prev, [categoryId]: null }));
        const teamId = categories.find((c) => String(c.id) === String(categoryId))?.teamId;
        if (!teamId) {
            const noTeamMsg = "Silakan pilih tim untuk kategori ini sebelum menetapkan pemenang.";
            setWinnerErrors((prev) => ({ ...prev, [categoryId]: noTeamMsg }));
            toast({
                title: "Belum ada tim yang dipilih",
                description: noTeamMsg,
                variant: "destructive"
            });
            return;
        }

        setIsSettingWinner((prev) => ({ ...prev, [categoryId]: true }));
        try {
            // 1. Fetch Signature
            const sigResp: any = await fetchSetWinnerSignature(chainId, compId, String(categoryId), String(teamId));
            const data = sigResp?.data;
            const signature = data?.signature;
            const onchainWinnerId = data?.winner_id;
            const participant = data?.participant;
            // API returns { competition_onchain_id: "2" } plus row.competition_id ULID — must read onchain field
            const onchainCompetitionId = (data as any)?.competition_onchain_id ?? data?.competition_id;
            const numericTeamId = data?.numeric_team_id;

            if (!signature || !onchainWinnerId || !participant || !onchainCompetitionId) {
                throw new Error(sigResp?.message || "Incomplete signature payload from API.");
            }
            // Guard: contract expects uint256 numeric strings for winnerId and competitionId
            const numericRe = /^\d+$/;
            if (!numericRe.test(String(onchainWinnerId)) || !numericRe.test(String(onchainCompetitionId))) {
                throw new Error(`Invalid numeric payload from API (expected competition_onchain_id numeric, got winner_id=${String(onchainWinnerId)} competition_onchain_id=${String(onchainCompetitionId)} — check API/contract address and chain)`);
            }

            // 2. Call Smart Contract
            const competitionContractAddress = getCompetitionContractAddress();

            // Pre-simulate to decode custom error before triggering MetaMask popup
            if (publicClient && address) {
                try {
                    await publicClient.simulateContract({
                        address: competitionContractAddress,
                        abi: CompetitionManagerABI as any,
                        functionName: "setWinner",
                        args: [
                            BigInt(onchainWinnerId),
                            participant,
                            BigInt(onchainCompetitionId),
                            String(teamId),
                            signature as `0x${string}`
                        ],
                        account: address as `0x${string}`,
                    });
                } catch (simErr: any) {
                    const name = decodeWinnerErrorName(simErr);
                    const raw = simErr?.shortMessage || simErr?.cause?.shortMessage || simErr?.message || "Simulate failed";
                    const msg = friendlyWinnerError(name, raw);
                    const full = `${name ? name + ": " : ""}${msg}`;
                    console.error("[setWinner][simulate] revert", name, simErr);
                    setWinnerErrors((prev) => ({ ...prev, [categoryId]: full }));
                    toast({
                        title: name ? `Gagal: ${name}` : "Gagal Menetapkan Pemenang",
                        description: full,
                        variant: "destructive",
                    });
                    return;
                }
            }

            const tx = await writeContractAsync({
                address: competitionContractAddress,
                abi: CompetitionManagerABI as any,
                functionName: "setWinner",
                args: [
                    BigInt(onchainWinnerId),
                    participant,
                    BigInt(onchainCompetitionId),
                    String(teamId),
                    signature as `0x${string}`
                ]
            });

            setWinnerErrors((prev) => ({ ...prev, [categoryId]: null }));
            setWinnerSet((prev) => ({ ...prev, [categoryId]: true }));
            toast({
                title: "Winner Set Successfully",
                description: "The winner has been set on-chain.",
            });

            queryClient.invalidateQueries({ queryKey: ["participant-winners", compId] });
            queryClient.invalidateQueries({ queryKey: ["prize-winners", compId] });

            if (publicClient && tx) {
                publicClient.waitForTransactionReceipt({ hash: tx }).then(() => {
                    queryClient.invalidateQueries({ queryKey: ["participant-winners", compId] });
                    queryClient.invalidateQueries({ queryKey: ["prize-winners", compId] });
                }).catch(console.error);
            }

            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["participant-winners", compId] });
                queryClient.invalidateQueries({ queryKey: ["prize-winners", compId] });
            }, 3000);
        } catch (error: any) {
            console.error("Failed to set winner:", error);
            const name = decodeWinnerErrorName(error);
            const raw = error?.cause?.message || error?.shortMessage || error?.message || "Failed to set winner.";
            const msg = friendlyWinnerError(name, raw);
            const full = `${name ? name + ": " : ""}${msg}`;
            setWinnerErrors((prev) => ({ ...prev, [categoryId]: full }));
            toast({
                title: name ? `Gagal: ${name}` : "Gagal Menetapkan Pemenang",
                description: full,
                variant: "destructive",
            });
        } finally {
            setIsSettingWinner((prev) => ({ ...prev, [categoryId]: false }));
        }
    };

    return (
        <div className="w-full bg-[#F8F9FF] py-10 font-sans text-slate-800">
            <div className="mx-auto max-w-7xl px-5 md:px-10 flex flex-col">

                {/* Bagian Header Atas */}
                <div className="mb-8">
                    <div className="flex items-center text-sm text-slate-500 mb-2">
                        <span>Dashboard</span>
                        <ChevronRight className="w-4 h-4 mx-1" />
                        <span>Competition Detail</span>
                        <ChevronRight className="w-4 h-4 mx-1" />
                        <span className="text-blue-600 font-medium">Determine Winner</span>
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Determine Winner</h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Assign a winning team to each competition category.
                    </p>
                </div>

            {/* Winner Selection */}
            <div className="bg-white rounded-xl p-6">

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <p className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-1">
                            Configuration Phase
                        </p>
                        <h2 className="text-xl font-bold text-slate-800">Winner Selection</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Select the winning team for each competition category.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                            {categories.length} Available Categories
                        </span>
                        <button
                            type="button"
                            onClick={handleDistributePrize}
                            disabled={isDistributingPrize || isPrizeDistributedIndexed || isAlreadyDistributed}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isDistributingPrize ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Distributing...</span>
                                </>
                            ) : (
                                <>
                                    <Coins className="w-3.5 h-3.5" />
                                    <span>Distribute Prize</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                <th className="py-3 pr-4 font-semibold">Category</th>
                                <th className="py-3 pr-4 font-semibold">Assigned Winning Team</th>
                                <th className="py-3 text-right font-semibold">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoadingPrizeWinners || isLoadingParticipantWinners ? (
                                <tr>
                                    <td colSpan={3} className="py-8 text-center text-slate-400">
                                        <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-blue-600" />
                                        <span>Loading categories...</span>
                                    </td>
                                </tr>
                            ) : categories.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="py-8 text-center text-slate-400">
                                        No categories found.
                                    </td>
                                </tr>
                            ) : (
                                categories.map((category) => {
                                    const isSet = Boolean(winnerSet[category.id]);
                                    const err = winnerErrors[category.id];
                                    return (
                                        <React.Fragment key={category.id}>
                                            <tr className={`border-b border-slate-100 ${err ? 'border-b-0' : 'last:border-0'}`}>
                                                <td className="py-4 pr-4">
                                                    <span className="font-semibold text-slate-800">{category.name}</span>
                                                </td>
                                                <td className="py-4 pr-4">
                                                    <div className="relative max-w-xs">
                                                        <select
                                                            value={category.teamId}
                                                            onChange={(e) => handleAssignTeam(category.id, e.target.value)}
                                                            disabled={isSet || Boolean(isSettingWinner[category.id])}
                                                            className="w-full appearance-none bg-white border border-slate-200 text-slate-700 py-2.5 px-4 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
                                                        >
                                                            {isLoadingTeams ? (
                                                                <option value="" disabled>Loading teams...</option>
                                                            ) : !Array.isArray(allTeams) || allTeams.length === 0 ? (
                                                                <>
                                                                    {category.teamId ? (
                                                                        <option value={category.teamId}>
                                                                            {category.teamName || `Team #${category.teamId}`}
                                                                        </option>
                                                                    ) : (
                                                                        <option value="" disabled>No teams found</option>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    {!allTeams.some((t) => String(t.id) === String(category.teamId)) && category.teamId ? (
                                                                        <option value={category.teamId}>
                                                                            {category.teamName || `Team #${category.teamId}`}
                                                                        </option>
                                                                    ) : null}
                                                                    {allTeams.map((team) => (
                                                                        <option key={team.id} value={team.id}>
                                                                            {team.name}
                                                                        </option>
                                                                    ))}
                                                                </>
                                                            )}
                                                        </select>
                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                                                            <ChevronDownIcon />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-right">
                                                    {isSet ? (
                                                        <button
                                                            disabled
                                                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-700 cursor-default"
                                                        >
                                                            Winner Set
                                                            <CheckCircleIcon />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            disabled={Boolean(isSettingWinner[category.id])}
                                                            onClick={() => handleSetWinner(category.id)}
                                                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {isSettingWinner[category.id] ? (
                                                                <>
                                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                    <span>Setting...</span>
                                                                </>
                                                            ) : (
                                                                <span>Set Winner</span>
                                                            )}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                            {err ? (
                                                <tr className="border-b border-slate-100 last:border-0 bg-red-50/40">
                                                    <td colSpan={3} className="pt-0 pb-3 px-2">
                                                        <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50/90 p-3 text-xs leading-5 text-red-700 shadow-xs">
                                                            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                                                            <div className="flex-1">
                                                                <span className="font-semibold text-red-800 mr-1.5">Gagal menetapkan pemenang:</span>
                                                                <span>{err}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : null}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Prize Distribution Banner & Action */}
                <div className={`mt-8 pt-6 border-t flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl border ${
                    isAlreadyDistributed
                        ? "bg-emerald-50/50 border-emerald-200"
                        : "bg-slate-50/70 border-slate-100"
                }`}>
                    <div className="flex items-start gap-3.5">
                        <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                            isAlreadyDistributed
                                ? 'bg-emerald-100 text-emerald-700'
                                : allWinnersSet
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-200/80 text-slate-600'
                        }`}>
                            <Coins className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-800">Distribusi Hadiah Kompetisi</h3>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    isAlreadyDistributed
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : allWinnersSet
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                    {isAlreadyDistributed
                                        ? 'Selesai Didistribusikan'
                                        : allWinnersSet
                                            ? 'Siap Didistribusikan'
                                            : `${setWinnersCount}/${categories.length} Kategori Siap`}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                                {isAlreadyDistributed
                                    ? "Seluruh hadiah kompetisi telah sukses didistribusikan di blockchain kepada wallet para pemenang."
                                    : allWinnersSet
                                        ? "Seluruh pemenang untuk setiap kategori telah ditetapkan. Klik tombol di samping untuk mendistribusikan hadiah ke smart contract."
                                        : `Pastikan semua kategori pemenang telah ditetapkan (${setWinnersCount}/${categories.length}) sebelum mendistribusikan prize pool.`}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleDistributePrize}
                        disabled={isDistributingPrize || isPrizeDistributedIndexed || isAlreadyDistributed}
                        className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-emerald-600/20 transition-all shadow-xs cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDistributingPrize ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Memproses Distribusi...</span>
                            </>
                        ) : (
                            <>
                                <Coins className="w-4 h-4" />
                                <span>Distribute Prize</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            </div>
        </div>
    );
}