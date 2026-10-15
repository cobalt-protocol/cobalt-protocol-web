'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { fetchApiMe, getStoredToken, fetchPrizeWinnersByCompetitionId, fetchOrganizationTeamsByCompetitionId, fetchSetWinnerSignature } from '@/lib/competitions-api';
import CompetitionManagerABI from '@/abi/CompetitionManager.json';
import { getCompetitionContractAddress } from '@/lib/contracts';
import { useToast } from "@/hooks/use-toast";
import { getAddress, isAddress, decodeErrorResult } from 'viem';
import { ChevronRight, Loader2 } from 'lucide-react';

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
    const { isConnected, status: accountStatus } = useAccount();
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
    const { data: allTeams = [], isLoading: isLoadingTeams } = useQuery({
        queryKey: ["organization-competition-teams", chainId, compId, storedToken],
        queryFn: () => fetchOrganizationTeamsByCompetitionId(chainId, compId, storedToken || getStoredToken()),
        enabled: Boolean(compId && storedToken),
    });

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
        setCategories((prev) =>
            prev.map((c) => (String(c.id) === String(categoryId) ? { ...c, teamId } : c))
        );
    };

    const handleSetWinner = async (categoryId: string | number) => {
        const teamId = categories.find((c) => String(c.id) === String(categoryId))?.teamId;
        if (!teamId) {
            toast({
                title: "No team selected",
                description: "Please select a team for this category before setting the winner.",
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

            if (!signature || !onchainWinnerId || !participant || !onchainCompetitionId || !numericTeamId) {
                throw new Error(sigResp?.message || "Incomplete signature payload from API.");
            }
            // Guard: contract expects uint256 numeric strings — ULID will throw "Cannot convert ... to BigInt"
            const numericRe = /^\d+$/;
            if (!numericRe.test(String(onchainWinnerId)) || !numericRe.test(String(onchainCompetitionId)) || !numericRe.test(String(numericTeamId))) {
                throw new Error(`Invalid numeric payload from API (expected competition_onchain_id numeric, got winner_id=${String(onchainWinnerId)} competition_onchain_id=${String(onchainCompetitionId)} numeric_team_id=${String(numericTeamId).slice(0, 20)}… — check API/contract address and chain)`);
            }

            // 2. Call Smart Contract
            const competitionContractAddress = getCompetitionContractAddress();

            await writeContractAsync({
                address: competitionContractAddress,
                abi: CompetitionManagerABI as any,
                functionName: "setWinner",
                args: [
                    BigInt(onchainWinnerId),
                    participant,
                    BigInt(onchainCompetitionId),
                    BigInt(numericTeamId),
                    signature as `0x${string}`
                ]
            });

            setWinnerSet((prev) => ({ ...prev, [categoryId]: true }));
            toast({
                title: "Winner Set Successfully",
                description: "The winner has been set on-chain.",
            });
        } catch (error: any) {
            console.error("Failed to set winner:", error);
            let decoded: string | null = null;
            try {
                const d: string | undefined = error?.data || error?.cause?.data || error?.cause?.cause?.data;
                if (d && typeof d === "string" && d.startsWith("0x") && d.length >= 10) {
                    const r: any = decodeErrorResult({ abi: CompetitionManagerABI as any, data: d as `0x${string}` });
                    if (r?.errorName) decoded = r.errorName as string;
                }
            } catch {}
            if (!decoded) {
                const m = String(error?.shortMessage || error?.message || error?.cause?.message || "");
                for (const n of ["InvalidSignature","WinnerAlreadyClaimed","WinnerDoesNotExist","WinnerMismatch","InsufficientCompetitionPrize","CompetitionDoesNotExist","NotOrganization","ECDSAInvalidSignature","ECDSAInvalidSignatureLength","ECDSAInvalidSignatureS","PrizeTokenMismatch","AmountZero","InsufficientPrizeBalance","TreasuryDoesNotExist"]) if (m.includes(n)) { decoded = n; break; }
            }
            const map: Record<string,string> = {
                InvalidSignature: "Invalid signature — signer mismatch or wrong chain/contract/ids. Ensure API PRIVATE_KEY_SIGNER matches CompetitionManager.signerAddress (NEXT_PRIVATE_KEY_SIGNER 0x289E…).",
                WinnerAlreadyClaimed: "Winner already claimed for this competition/team/wallet.",
                WinnerDoesNotExist: "Winner ID does not exist.",
                WinnerMismatch: "Winner does not belong to this competition.",
                NotOrganization: "Only the competition organization can set the winner.",
                ECDSAInvalidSignature: "ECDSA recovery failed — signature not from signerAddress.",
            };
            const msg = decoded ? (map[decoded] || `${decoded}: ${error?.shortMessage || error?.message}`) : (error?.cause?.message || error?.shortMessage || error?.message || "Failed to set winner.");
            toast({
                title: decoded ? `Failed: ${decoded}` : "Failed to Set Winner",
                description: msg,
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
                                    return (
                                        <tr key={category.id} className="border-b border-slate-100 last:border-0">
                                            <td className="py-4 pr-4">
                                                <span className="font-semibold text-slate-800">{category.name}</span>
                                            </td>
                                            <td className="py-4 pr-4">
                                                <div className="relative max-w-xs">
                                                    <select
                                                        value={category.teamId}
                                                        onChange={(e) => handleAssignTeam(category.id, e.target.value)}
                                                        className="w-full appearance-none bg-white border border-slate-200 text-slate-700 py-2.5 px-4 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                                    >
                                                        {isLoadingTeams ? (
                                                            <option value="" disabled>Loading teams...</option>
                                                        ) : allTeams.length === 0 ? (
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