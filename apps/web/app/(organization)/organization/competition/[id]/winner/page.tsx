'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { fetchApiMe, getStoredToken, fetchPrizeWinnersByCompetitionId, fetchOrganizationTeamsByCompetitionIdResult, fetchSetWinnerSignature, ApiTeam } from '@/lib/competitions-api';
import CompetitionManagerABI from '@/abi/CompetitionManager.json';
import { getCompetitionContractAddress } from '@/lib/contracts';
import { useToast } from "@/hooks/use-toast";
import { getAddress, isAddress, decodeErrorResult, BaseError } from 'viem';
import { ChevronRight, Loader2, AlertCircle } from 'lucide-react';

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
}

export default function DetermineWinner() {
    const router = useRouter();
    const params = useParams();
    const compId = (params?.id as string) || '';
    const chainId = useChainId()
    const { address, isConnected, status: accountStatus } = useAccount();
    const publicClient = usePublicClient();
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

    // Owner-only: GET /api/v1/chains/:chainId/competitions/:id/teams/organization (Bearer JWT) — returns all teams (public+private)
    const { data: teamsData, isLoading: isLoadingTeams } = useQuery({
        queryKey: ["organization-competition-teams", chainId, compId, storedToken],
        queryFn: () => fetchOrganizationTeamsByCompetitionIdResult(chainId, compId, storedToken || getStoredToken()),
        enabled: Boolean(compId && storedToken),
    });

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
    const { toast } = useToast();
    
    const { writeContractAsync } = useWriteContract();

    // To wait for tx receipts dynamically, we could use wagmi useWaitForTransactionReceipt 
    // but since we map over multiple categories, it's easier to use a public client or just wait for the promise if available. 
    // Wagmi writeContractAsync just returns tx hash. We will just show toast when it is sent successfully.

    useEffect(() => {
        if (prizeWinners) {
            if (prizeWinners.length > 0) {
                const mappedCategories: CategoryItem[] = prizeWinners.map((pw, index) => {
                    const existing = categories.find((c) => String(c.id) === String(pw.id));
                    const matchingTeam = pw.winner
                        ? allTeams.find((t) => t.user_id === pw.winner?.user_id || t.team_roles?.some((r: any) => r.user_id === pw.winner?.user_id))
                        : undefined;
                    const assignedTeamId = existing?.teamId || matchingTeam?.id || allTeams[index]?.id || allTeams[0]?.id || '';
                    return {
                        id: pw.id,
                        name: pw.category,
                        teamId: assignedTeamId,
                    };
                });
                setCategories(mappedCategories);

                const initialWinnerSet: Record<string | number, boolean> = {};
                prizeWinners.forEach((pw) => {
                    if (Boolean(pw.winner)) {
                        initialWinnerSet[pw.id] = true;
                    }
                });
                setWinnerSet((prev) => ({ ...initialWinnerSet, ...prev }));
            } else {
                setCategories([]);
            }
        }
    }, [prizeWinners, allTeams]);

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
        setCategories((prev) =>
            prev.map((c) => (String(c.id) === String(categoryId) ? { ...c, teamId } : c))
        );
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

            await writeContractAsync({
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

                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-1">
                            Configuration Phase
                        </p>
                        <h2 className="text-xl font-bold text-slate-800">Winner Selection</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Select the winning team for each competition category.
                        </p>
                    </div>
                    <span className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                        {categories.length} Available Categories
                    </span>
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
                            {isLoadingPrizeWinners ? (
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
                                                                <option value="" disabled>No teams found</option>
                                                            ) : (
                                                                allTeams.map((team) => (
                                                                    <option key={team.id} value={team.id}>
                                                                        {team.name}
                                                                    </option>
                                                                ))
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
            </div>

            </div>
        </div>
    );
}