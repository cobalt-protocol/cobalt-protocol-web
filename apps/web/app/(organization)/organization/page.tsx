"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Badge } from "@workspace/ui/components/badge";
import {
    Card,
    CardFooter,
    CardHeader,
} from "@workspace/ui/components/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@workspace/ui/components/select";
import { Plus, Search, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { fetchApiCompetitions, fetchTokenPrizeByCompetitionId, formatTokenPrize, getTokenSymbol, getStoredToken, parse18DecimalAmount, type ApiCompetition } from "@/lib/competitions-api";
import { useAccount } from "wagmi";

// --- Tipe ---
type CompetitionStatus =
    | "Submission"
    | "Judging"
    | "Registration"
    | "Completed";

type StatusFilter = CompetitionStatus | "all";
type CategoryFilter = string;

interface OrganizationCompetition {
    id: string;
    txHash?: string | null;
    tx_hash?: string | null;
    category: string;
    status: CompetitionStatus;
    title: string;
    date: string;
    prize: string;
}

// --- Data Fallback ---
const fallbackCompetitions: OrganizationCompetition[] = [
    {
        id: "1",
        category: "UI/UX Design",
        status: "Submission",
        title: "Autonomous Agents Global Hackathon 2025",
        date: "Apr 20 - May 05, 2025",
        prize: "75,000",
    },
    {
        id: "2",
        category: "Web3 & Cryptography",
        status: "Judging",
        title: "Zero-Knowledge Financial Privacy Challenge",
        date: "Mar 15 - Apr 18, 2025",
        prize: "50,000",
    },
    {
        id: "3",
        category: "DeFi & UX",
        status: "Registration",
        title: "NextGen DeFiUX & Account Abstraction",
        date: "Apr 01 - Jun 15, 2025",
        prize: "30,000",
    },
    {
        id: "4",
        category: "ClimateTech",
        status: "Completed",
        title: "Verifiable Carbon Ledger Track",
        date: "Jan 10 - Feb 28, 2025",
        prize: "40,000",
    },
];

const statusStyles: Record<CompetitionStatus, { badge: string; dot: string }> =
{
    Submission: {
        badge: "bg-[#E0EAFF] text-[#2563EB] hover:bg-[#E0EAFF]",
        dot: "bg-[#2563EB]",
    },
    Judging: {
        badge: "bg-[#E5EEFF] text-[#565E74] hover:bg-[#E5EEFF]",
        dot: "bg-[#565E74]",
    },
    Registration: {
        badge: "bg-[#D7F5EE] text-[#0D9488] hover:bg-[#D7F5EE]",
        dot: "bg-[#0D9488]",
    },
    Completed: {
        badge: "bg-[#E5EEFF] text-[#565E74] hover:bg-[#E5EEFF]",
        dot: "bg-[#565E74]",
    },
};

const STATUS_OPTIONS: CompetitionStatus[] = [
    "Submission",
    "Judging",
    "Registration",
    "Completed",
];

function formatDates(comp: ApiCompetition): string {
    const fmt = (dateStr?: string) => {
        if (!dateStr) return "";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
        } catch {
            return dateStr;
        }
    };
    const start = fmt(comp.registration_window);
    const endDateStr = comp.pirze_certificate_claim || comp.result_announcement || comp.submission_deadline;
    const end = fmt(endDateStr);
    if (start && end) {
        const year = new Date(endDateStr || comp.registration_window || Date.now()).getFullYear();
        return `${start} - ${end}, ${year}`;
    }
    if (start) return `Starts ${start}`;
    if (end) return `Ends ${end}`;
    return "TBA";
}

function determineStatus(comp: ApiCompetition): CompetitionStatus {
    const now = new Date();
    const subDeadline = comp.submission_deadline ? new Date(comp.submission_deadline) : null;
    const judgingReview = comp.judging_review ? new Date(comp.judging_review) : null;
    const regWindow = comp.registration_window ? new Date(comp.registration_window) : null;

    if (subDeadline && now > subDeadline) {
        if (judgingReview && now > judgingReview) {
            return "Completed";
        }
        return "Judging";
    }
    if (regWindow && now > regWindow) {
        return "Submission";
    }
    return "Registration";
}

function formatPrize(comp: ApiCompetition, connectedNativeSymbol?: string): string {
    if (comp.prize_winners && comp.prize_winners.length > 0) {
        const total = comp.prize_winners.reduce((acc, w) => {
          const val = w.prize_amount ?? w.amount ?? 0
          return acc + parse18DecimalAmount(val, 18)
        }, 0);
        if (total > 0) {
            return total.toLocaleString("en-US");
        }
    }
    return "50,000";
}

function OrganizationCompetitionCard({ comp }: { comp: OrganizationCompetition }) {
    const style = statusStyles[comp.status] || statusStyles.Submission;
    const { chain } = useAccount();
    const connectedNativeSymbol = chain?.nativeCurrency?.symbol;

    const explorerBaseUrl = (chain?.blockExplorers?.default?.url || 'https://scan.bohr.life').replace(/\/$/, '');
    const rawTxHash = comp.txHash || comp.tx_hash || '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const txHash = rawTxHash.startsWith('0x') ? rawTxHash : `0x${rawTxHash}`;
    const explorerUrl = `${explorerBaseUrl}/tx/${txHash}`;

    const { data: tokenPrizeData, isLoading: isLoadingTokenPrize } = useQuery({
        queryKey: ["competition-token-prize", comp.id],
        queryFn: () => fetchTokenPrizeByCompetitionId(comp.id),
        enabled: Boolean(comp.id),
    });

    const prizeDisplay = useMemo(() => {
        if (isLoadingTokenPrize) return "Loading...";
        if (tokenPrizeData && tokenPrizeData.total_prize !== undefined && tokenPrizeData.total_prize !== null) {
            return formatTokenPrize(
                tokenPrizeData.total_prize,
                tokenPrizeData.token_address,
                connectedNativeSymbol,
                18,
                (tokenPrizeData.token_symbol || tokenPrizeData.symbol) ?? undefined
            );
        }
        const symbol = getTokenSymbol(null, connectedNativeSymbol);
        if (comp.prize.includes(" ")) {
            return comp.prize;
        }
        return `${comp.prize} ${symbol}`;
    }, [tokenPrizeData, isLoadingTokenPrize, connectedNativeSymbol, comp.prize]);

    return (
        <Card
            className="flex flex-col justify-between shadow-none border-0 ring-0 bg-white"
        >
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-4">
                    <Badge
                        variant="secondary"
                        className="bg-[#F1F5F9] text-[#475569] font-normal hover:bg-[#F1F5F9]"
                    >
                        {comp.category}
                    </Badge>
                    <Badge
                        variant="secondary"
                        className={`${style.badge} font-medium flex items-center gap-1.5 px-2 py-0.5`}
                    >
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                        />
                        {comp.status}
                    </Badge>
                </div>

                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                    <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline hover:text-blue-600 transition-colors"
                    >
                        {comp.title}
                    </a>
                </h3>

                <div className="flex items-center text-sm text-slate-500 mt-2">
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    {comp.date}
                </div>
            </CardHeader>

            <CardFooter className="flex flex-col gap-3 border-0 bg-[#EFF4FF]/40 p-4 rounded-b-xl">
                <div className="flex flex-row justify-between items-center w-full">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Prize Pool
                    </span>
                    <span className="text-xl font-bold text-slate-900">
                        {prizeDisplay}
                    </span>
                </div>
                <div className="w-full rounded-lg p-2.5 bg-white flex items-center justify-between">
                    <Link href={`/competition/${comp.id}`} className="w-full">
                        <Button
                            variant="link"
                            className="w-full px-0 text-[#2563EB] hover:text-[#1D4ED8] font-medium flex flex-row items-center justify-between h-auto"
                        >
                            <span>View Competition Detail</span>
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </CardFooter>
        </Card>
    );
}

export default function CompetitionListPage() {
    const [search, setSearch] = useState<string>("");
    const [status, setStatus] = useState<StatusFilter>("all");
    const [category, setCategory] = useState<CategoryFilter>("all");
    const [storedToken, setStoredToken] = useState<string | null>(null);

    const { chain } = useAccount();
    const connectedNativeSymbol = chain?.nativeCurrency?.symbol;

    useEffect(() => {
        setStoredToken(getStoredToken());
    }, []);

    const { data: apiCompetitions, isLoading } = useQuery({
        queryKey: ["organization-competitions", storedToken],
        queryFn: () => {
            const token = storedToken || getStoredToken();
            return fetchApiCompetitions(token || undefined);
        },
    });

    const competitionsList = useMemo<OrganizationCompetition[]>(() => {
        if (apiCompetitions && apiCompetitions.length > 0) {
            return apiCompetitions.map((comp) => ({
                id: comp.id,
                txHash: comp.tx_hash || null,
                tx_hash: comp.tx_hash || null,
                category: comp.category || "General",
                status: determineStatus(comp),
                title: comp.name || "Untitled Competition",
                date: formatDates(comp),
                prize: formatPrize(comp, connectedNativeSymbol),
            }));
        }
        if (apiCompetitions && apiCompetitions.length === 0 && !isLoading) {
            return [];
        }
        return fallbackCompetitions;
    }, [apiCompetitions, isLoading, connectedNativeSymbol]);

    const categories = useMemo<string[]>(
        () => Array.from(new Set(competitionsList.map((c) => c.category))),
        [competitionsList]
    );

    const filtered = useMemo<OrganizationCompetition[]>(() => {
        return competitionsList.filter((c) => {
            const matchSearch =
                c.title.toLowerCase().includes(search.toLowerCase()) ||
                c.category.toLowerCase().includes(search.toLowerCase());
            const matchStatus = status === "all" || c.status === status;
            const matchCategory = category === "all" || c.category === category;
            return matchSearch && matchStatus && matchCategory;
        });
    }, [competitionsList, search, status, category]);

    return (
        <div className="w-full min-h-[calc(100vh-80px)] bg-[#F8F9FF] py-10">
            <div className="mx-auto max-w-7xl px-5 md:px-10 flex flex-col">
                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-black font-bold text-2xl">Competition List</h1>
                    <div className="flex flex-row justify-between items-center">
                        <p className="text-[#434655]">
                            View, search, and manage competitions you have created.
                        </p>
                        <Link href="/competition/create">
                            <Button
                                variant="outline"
                                className="text-white bg-[#2563EB]! font-normal px-8 py-5 flex flex-row items-center"
                            >
                                <Plus />
                                <p>Create Competition</p>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="mt-8 flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-2 rounded-xl shadow-none border-0">
                    <div className="relative w-full md:w-1/2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by competition name or category..."
                            className="pl-9 border-0 bg-[#F8FAFC] focus-visible:ring-0 focus-visible:ring-offset-0 text-sm h-10"
                        />
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <Select
                            value={status}
                            onValueChange={(v) => {
                                if (v !== null) setStatus(v as StatusFilter);
                            }}
                        >
                            <SelectTrigger className="w-full md:w-37.5 border-0 bg-[#F8FAFC] focus:ring-0 text-sm h-10">
                                <SelectValue placeholder="Status: All" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Status: All</SelectItem>
                                {STATUS_OPTIONS.map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {s}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={category}
                            onValueChange={(v) => {
                                if (v !== null) setCategory(v);
                            }}
                        >
                            <SelectTrigger className="w-full md:w-50 border-0 bg-[#F8FAFC] focus:ring-0 text-sm h-10">
                                <SelectValue placeholder="Category: All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Category: All Categories</SelectItem>
                                {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
                    </div>
                ) : (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((comp) => (
                            <OrganizationCompetitionCard key={comp.id} comp={comp} />
                        ))}

                        {filtered.length === 0 && (
                            <p className="col-span-full text-center text-slate-500 py-12">
                                No competitions found.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}