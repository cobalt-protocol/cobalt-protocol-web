"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { routes } from "@/lib/routes";
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
import { zeroAddress } from "viem";
import { createSignatureCreateCompetition, fetchApiOrganizationCompetitions, fetchApiMe, formatTokenPrize, getTokenSymbol, getStoredToken, parse18DecimalAmount, type ApiCompetition } from "@/lib/competitions-api";
import { Modal } from "@/components/ui/modal";
import { ProfilePrompt } from "@/features/registration/components/profile-prompt";
import { useDynamicTokenInfo } from "@/lib/hooks/use-dynamic-token";
import { useCompetitionTokenPrize } from "@/lib/hooks/use-competition-token-prize";
import { convertTokenOnChain } from "@/lib/token-convert";
import { useAccount, useChainId } from "wagmi";

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
    rawCompetition?: ApiCompetition;
}

// --- Data Fallback ---

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

function formatPrize(comp: ApiCompetition, connectedNativeSymbol?: string, decimals?: number): string {
    if (comp.prize_winners && comp.prize_winners.length > 0) {
        const total = comp.prize_winners.reduce((acc, w) => {
          const val = w.prize_amount ?? w.amount ?? 0
          return acc + parse18DecimalAmount(val, decimals ?? 18)
        }, 0);
        if (total > 0) {
            return total.toLocaleString("en-US", { maximumFractionDigits: 6 });
        }
    }
    return "0";
}

function OrganizationCompetitionCard({ comp }: { comp: OrganizationCompetition }) {
    const style = statusStyles[comp.status] || statusStyles.Submission;
    const { chain } = useAccount();
    const connectedNativeSymbol = chain?.nativeCurrency?.symbol;

    const explorerBaseUrl = (chain?.blockExplorers?.default?.url || 'https://scan.bohr.life').replace(/\/$/, '');
    const txHash = comp.txHash || comp.tx_hash || '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const explorerUrl = `${explorerBaseUrl}/tx/${txHash}`;

    const onchainCompId = comp.rawCompetition?.competition_id || (/^\d+$/.test(comp.id) ? comp.id : null);
    const { data: tokenPrizeData, isLoading: isLoadingTokenPrize } = useCompetitionTokenPrize(onchainCompId);

    const deposit = comp.rawCompetition?.prize_deposits?.[0] ?? null;
    const depositAmountRaw =
        deposit?.amount !== undefined && deposit?.amount !== null && String(deposit.amount).trim() !== ""
            ? String(deposit.amount).trim()
            : tokenPrizeData?.total_prize !== undefined && tokenPrizeData?.total_prize !== null && String(tokenPrizeData.total_prize).trim() !== ""
                ? String(tokenPrizeData.total_prize).trim()
                : null;

    const depositTokenAddress =
        (deposit?.token_address && String(deposit.token_address).trim() ? String(deposit.token_address).trim() : null) ||
        (tokenPrizeData?.token_address && String(tokenPrizeData.token_address).trim() ? String(tokenPrizeData.token_address).trim() : null) ||
        (comp.rawCompetition?.fee_token_address && String(comp.rawCompetition.fee_token_address).trim() ? String(comp.rawCompetition.fee_token_address).trim() : null) ||
        null;

    const hasDepositRaw = Boolean(depositAmountRaw && depositAmountRaw !== "0");

    const { decimals, symbol: dynamicSymbol, isLoading: isLoadingDynamic } = useDynamicTokenInfo(depositTokenAddress);

    const { data: convertedPrize, isLoading: isLoadingConverted } = useQuery({
        queryKey: ["convert-org-prize", depositTokenAddress ?? zeroAddress, depositAmountRaw],
        queryFn: async () => {
            if (!depositAmountRaw) return null;
            const addr = depositTokenAddress || zeroAddress;
            return await convertTokenOnChain(addr, depositAmountRaw);
        },
        enabled: Boolean(depositAmountRaw),
        staleTime: 60_000,
    });

    const prizeDisplay = useMemo(() => {
        const isLoadingAny = (hasDepositRaw && (isLoadingConverted || isLoadingDynamic)) || (!hasDepositRaw && isLoadingTokenPrize);
        if (isLoadingAny) return "Loading...";

        if (convertedPrize) {
            return `${convertedPrize.convertedAmount} ${convertedPrize.symbol}`;
        }

        if (depositAmountRaw) {
            return formatTokenPrize(
                depositAmountRaw,
                depositTokenAddress,
                connectedNativeSymbol,
                decimals,
                dynamicSymbol || (tokenPrizeData as any)?.token_symbol || (tokenPrizeData as any)?.symbol || undefined
            );
        }

        const symbol = dynamicSymbol || getTokenSymbol(depositTokenAddress, connectedNativeSymbol);
        if (comp.rawCompetition) {
            const calculatedPrize = formatPrize(comp.rawCompetition, connectedNativeSymbol, decimals);
            if (calculatedPrize !== "0") {
                return `${calculatedPrize} ${symbol}`;
            }
        }
        return `${comp.prize} ${symbol}`;
    }, [
        hasDepositRaw,
        isLoadingConverted,
        isLoadingDynamic,
        isLoadingTokenPrize,
        convertedPrize,
        depositAmountRaw,
        depositTokenAddress,
        connectedNativeSymbol,
        decimals,
        dynamicSymbol,
        tokenPrizeData,
        comp,
    ]);

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
                    <Link href={`/organization/competition/${comp.id}`} className="w-full">
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
    const router = useRouter();
    const [search, setSearch] = useState<string>("");
    const [status, setStatus] = useState<StatusFilter>("all");
    const [category, setCategory] = useState<CategoryFilter>("all");
    const [storedToken, setStoredToken] = useState<string | null>(null);
    const [hasCheckedToken, setHasCheckedToken] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isCheckingCreatePermission, setIsCheckingCreatePermission] = useState(false);

    const chainId = useChainId()
    const { isConnected, status: accountStatus, chain } = useAccount();
    const connectedNativeSymbol = chain?.nativeCurrency?.symbol;

    async function handleCreateCompetitionClick() {
        const token = storedToken || getStoredToken();
        setIsCheckingCreatePermission(true);
        try {
            await createSignatureCreateCompetition(chainId, null, token);
            router.push(routes.createCompetition);
        } catch (err: any) {
            const errStatus = err?.status ?? err?.payload?.statusCode;
            const errMsg = String(err?.message || "");
            if (
                errStatus === 403 ||
                errMsg.toLowerCase().includes("silahkan update organization profile") ||
                errMsg.toLowerCase().includes("silahkan update profile") ||
                errMsg.includes("403")
            ) {
                setIsProfileModalOpen(true);
                return;
            }
            router.push(routes.createCompetition);
        } finally {
            setIsCheckingCreatePermission(false);
        }
    }

    useEffect(() => {
        setStoredToken(getStoredToken());
        setHasCheckedToken(true);
    }, []);

    useEffect(() => {
        const token = storedToken || getStoredToken();
        const isWagmiLoading = accountStatus === "connecting" || accountStatus === "reconnecting";
        if (hasCheckedToken && !isWagmiLoading && !isConnected && !token) {
            router.push(routes.competitions);
        }
    }, [hasCheckedToken, isConnected, accountStatus, storedToken, router]);

    const { data: meUser, isLoading: isLoadingMe } = useQuery({
        queryKey: ["user-me", storedToken],
        queryFn: () => fetchApiMe(storedToken || getStoredToken()),
        enabled: Boolean(storedToken),
    });

    const isOrganizationRole = Boolean(
        isConnected &&
        storedToken &&
        (meUser?.role === "organization" || meUser?.role === "organizer")
    );

    const isChecking = !hasCheckedToken || (Boolean(storedToken) && isLoadingMe);

    const { data: apiCompetitions, isLoading } = useQuery({
        queryKey: ["organization-competitions", storedToken],
        queryFn: () => {
            const token = storedToken || getStoredToken();
            return fetchApiOrganizationCompetitions(chainId, token || undefined);
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
                rawCompetition: comp,
            }));
        }
        if (apiCompetitions && apiCompetitions.length === 0 && !isLoading) {
            return [];
        }
        return [];
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
                        <Button
                            variant="outline"
                            onClick={handleCreateCompetitionClick}
                            disabled={isCheckingCreatePermission}
                            className="text-white bg-[#2563EB]! font-normal px-8 py-5 flex flex-row items-center cursor-pointer"
                        >
                            {isCheckingCreatePermission ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                                <Plus />
                            )}
                            <p>Create Competition</p>
                        </Button>
                    </div>
                </div>

                <Modal
                    open={isProfileModalOpen}
                    onOpenChange={setIsProfileModalOpen}
                    title="Set Up Your Profile"
                >
                    <ProfilePrompt
                        onLater={() => setIsProfileModalOpen(false)}
                        onSetup={() => {
                            setIsProfileModalOpen(false);
                            router.push(routes.organizationProfile);
                        }}
                    />
                </Modal>

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