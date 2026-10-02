'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { fetchApiMe, getStoredToken, fetchPrizeWinnersByCompetitionId, fetchAllTeamsByCompetitionId } from '@/lib/competitions-api';
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
        queryFn: () => fetchPrizeWinnersByCompetitionId(compId, storedToken || getStoredToken()),
        enabled: Boolean(compId && storedToken),
    });

    const { data: allTeams = [], isLoading: isLoadingTeams } = useQuery({
        queryKey: ["competition-all-teams", compId, storedToken],
        queryFn: () => fetchAllTeamsByCompetitionId(compId, storedToken || getStoredToken()),
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

    useEffect(() => {
        if (prizeWinners) {
            if (prizeWinners.length > 0) {
                const mappedCategories: CategoryItem[] = prizeWinners.map((pw, index) => {
                    const assignedTeamId = pw.winner_id
                        ? String(pw.winner_id)
                        : pw.winner?.id
                        ? String(pw.winner.id)
                        : (allTeams[index]?.id || allTeams[0]?.id || '');
                    return {
                        id: pw.id,
                        name: pw.category,
                        teamId: assignedTeamId,
                    };
                });
                setCategories(mappedCategories);

                const initialWinnerSet: Record<string | number, boolean> = {};
                prizeWinners.forEach((pw) => {
                    if (pw.winner || pw.winner_id) {
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

    const handleSetWinner = (categoryId: string | number) => {
        setWinnerSet((prev) => ({ ...prev, [categoryId]: true }));
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
                                                        onClick={() => handleSetWinner(category.id)}
                                                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                                                    >
                                                        Set Winner
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