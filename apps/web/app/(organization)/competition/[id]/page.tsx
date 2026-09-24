'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { fetchApiCompetitionById, fetchTokenPrizeByCompetitionId, fetchApiMe, getStoredToken, formatTokenPrize, getTokenSymbol } from '@/lib/competitions-api';
import {
    Search,
    BookOpen,
    Trophy,
    Clock,
    Target,
    ChevronRight,
    Loader2,
    ExternalLink,
} from 'lucide-react';
import { Button } from "@workspace/ui/components/button";
import { Input } from '@workspace/ui/components/input';
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@workspace/ui/components/table";

// --- Dummy Data ---
const teamsData = [
    {
        id: 1,
        initials: "SS",
        name: "Team SwarmSynthetix",
        members: "Alex Rivera, Sarah Chen, Marcus Zhao, Elena Vance",
        size: 4,
        status: "Submitted",
    },
    {
        id: 2,
        initials: "AZ",
        name: "AgentZero Labs",
        members: "Daniyal Kim, Sophie Tremblay, Leo Sterling",
        size: 3,
        status: "Submitted",
    },
    {
        id: 3,
        initials: "NV",
        name: "Nexus Vector",
        members: "Priya Sharma, Liam O'Connor, Mateo Santos, Aoi Tanai",
        size: 5,
        status: "Submitted",
    },
    {
        id: 4,
        initials: "CM",
        name: "Cognitive Mesh",
        members: "Kavita Reddy, Jordan Miller, Carlos Reyes, Ananya Gupta",
        size: 4,
        status: "Under Review",
    },
    {
        id: 5,
        initials: "DA",
        name: "DeFi Autonomous Ops",
        members: "Henrik Lindqvist, Maya Lin, Ethan Brooks",
        size: 3,
        status: "Incomplete",
    },
];

// --- Helper Components ---

const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        Submitted: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
        "Under Review": "bg-blue-50 text-blue-700 hover:bg-blue-50",
        Incomplete: "bg-red-50 text-red-700 hover:bg-red-50",
    };

    const dotColors: Record<string, string> = {
        Submitted: "bg-emerald-500",
        "Under Review": "bg-blue-500",
        Incomplete: "bg-red-500",
    };

    return (
        <Badge variant="outline" className={`font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit border-0 ${styles[status] || styles["Under Review"]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status] || dotColors["Under Review"]}`} />
            {status}
        </Badge>
    );
};

function formatDate(dateStr?: string): string {
    if (!dateStr) return "TBA";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    } catch {
        return dateStr;
    }
}

export default function CompetitionDetail({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;
    const [searchQuery, setSearchQuery] = useState("");
    const [storedToken, setStoredToken] = useState<string | null>(null);

    useEffect(() => {
        setStoredToken(getStoredToken());
    }, []);

    const { chain } = useAccount();
    const connectedNativeSymbol = chain?.nativeCurrency?.symbol;

    const { data: meUser } = useQuery({
        queryKey: ["user-me", storedToken],
        queryFn: () => fetchApiMe(storedToken || getStoredToken()),
    });

    const { data: apiCompetition, isLoading } = useQuery({
        queryKey: ["competition", id],
        queryFn: () => fetchApiCompetitionById(id),
        enabled: Boolean(id),
    });

    const { data: tokenPrizeData, isLoading: isLoadingTokenPrize } = useQuery({
        queryKey: ["competition-token-prize", id],
        queryFn: () => fetchTokenPrizeByCompetitionId(id),
        enabled: Boolean(id),
    });

    const isOwner = Boolean(
        apiCompetition?.user_id &&
        meUser?.id &&
        apiCompetition.user_id === meUser.id
    );

    const filteredTeams = teamsData.filter(
        (team) =>
            team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            team.members.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const title = apiCompetition?.name || "Autonomous Agents Global Hackathon 2025";
    const rawTxHash = apiCompetition?.tx_hash || "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const txHash = rawTxHash.startsWith("0x") ? rawTxHash : `0x${rawTxHash}`;
    const category = apiCompetition?.category || "AI & Autonomous Systems";
    const ipfsGatewayUrl = (process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL || "http://localhost:8081/ipfs").replace(/\/$/, "");
    const guidebookUrl = apiCompetition?.guidebook_cid
        ? apiCompetition.guidebook_cid.startsWith("http://") || apiCompetition.guidebook_cid.startsWith("https://")
            ? apiCompetition.guidebook_cid
            : `${ipfsGatewayUrl}/${apiCompetition.guidebook_cid.replace(/^ipfs:\/\//, "")}`
        : null;

    const startDateLabel = formatDate(apiCompetition?.registration_window);
    const endDateLabel = formatDate(apiCompetition?.pirze_certificate_claim);
    const durationLabel = apiCompetition?.registration_window
        ? `${startDateLabel} - ${endDateLabel}`
        : "Apr 20 - May 05, 2025";

    const prizePoolDisplay = React.useMemo(() => {
        if (isLoadingTokenPrize) return "Loading...";
        if (tokenPrizeData && tokenPrizeData.total_prize !== undefined && tokenPrizeData.total_prize !== null) {
            return formatTokenPrize(tokenPrizeData.total_prize, tokenPrizeData.token_address, connectedNativeSymbol);
        }
        return `75,000 ${getTokenSymbol(null, connectedNativeSymbol)}`;
    }, [tokenPrizeData, isLoadingTokenPrize, connectedNativeSymbol]);

    const competitionContractAddress = process.env.NEXT_PUBLIC_COMPETITION_CONTRACT || process.env.COMPETITION_CONTRACT || '0x3fA5bCC0f97ffd83Dcc92176751eDF65F98D1c61';
    const treasuryPrizeContractAddress = process.env.NEXT_PUBLIC_TREASURY_PRIZE_CONTRACT || process.env.TREASURY_PRIZE_CONTRACT || '0x29bBE85C2C893A7515Cda962F849B7D43ccFa9CA';

    const explorerBaseUrl = (chain?.blockExplorers?.default?.url || 'https://scan.bohr.life').replace(/\/$/, '');
    const competitionTxUrl = `${explorerBaseUrl}/tx/${txHash}`;
    const competitionContractUrl = `${explorerBaseUrl}/address/${competitionContractAddress}`;
    const treasuryPrizeContractUrl = `${explorerBaseUrl}/address/${treasuryPrizeContractAddress}`;
    return (
        <div className="w-full bg-[#F8F9FF] py-10">
            <div className="mx-auto max-w-7xl px-5 md:px-10 flex flex-col space-y-6">

                {/* --- Header Section --- */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center text-sm text-slate-500 mb-2">
                            <Link href="/organization" className="hover:underline">Dashboard</Link>
                            <ChevronRight className="w-4 h-4 mx-1" />
                            <span className="text-blue-600 font-medium">Competition Detail</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Competition Detail</h1>
                        <p className="text-slate-500 mt-1">Review competition information, monitor participating teams, and determine the winners.</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-0 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                        EVALUATION PROTOCOL ACTIVE
                    </Badge>
                </div>

                {isLoading ? (
                    <Card className="border-0 ring-0 shadow-none rounded-xl bg-white p-12 text-center text-slate-500">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
                        <p>Loading competition details from API...</p>
                    </Card>
                ) : (
                    /* --- Main Info Card --- */
                    <Card className="border-0 ring-0 shadow-none rounded-xl overflow-hidden bg-white">
                        <CardContent className="p-6 md:p-8">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                                <div className="space-y-3">
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 font-normal text-xs px-3 py-1 rounded-full">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-2" />
                                        Judging & Evaluation Phase (Submissions Closed)
                                    </Badge>
                                    <h2 className="text-3xl font-bold text-slate-900">
                                        <a
                                            href={competitionTxUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:underline hover:text-blue-600 transition-colors"
                                        >
                                            {title}
                                        </a>
                                    </h2>
                                    {apiCompetition?.description && (
                                        <p className="text-slate-500 text-sm max-w-3xl">{apiCompetition.description}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    {guidebookUrl ? (
                                        <a href={guidebookUrl} target="_blank" rel="noreferrer">
                                            <Button variant="outline" className="text-slate-600 font-medium border-0 bg-slate-100 hover:bg-slate-200">
                                                <BookOpen className="w-4 h-4 mr-2" />
                                                View Guidebook
                                            </Button>
                                        </a>
                                    ) : (
                                        <Button variant="outline" className="text-slate-600 font-medium border-0 bg-slate-100 hover:bg-slate-200" disabled>
                                            <BookOpen className="w-4 h-4 mr-2" />
                                            View Guidebook
                                        </Button>
                                    )}
                                    {isOwner && (
                                        <Link href={`/competition/${id}/winner`}>
                                            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                                                <Trophy className="w-4 h-4 mr-2" />
                                                Determine Winner
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Category */}
                            <div className="bg-slate-50 p-5 rounded-xl border-0 flex flex-col justify-between gap-2">
                                <div>
                                    <div className="flex items-center text-slate-500 text-xs font-semibold tracking-wider uppercase">
                                        <Target className="w-4 h-4 mr-2 text-blue-500" />
                                        Competition Category
                                    </div>
                                    <div className="text-lg font-semibold text-slate-800 mt-1">{category}</div>
                                </div>
                                {competitionContractAddress && (
                                    <a
                                        href={competitionContractUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-mono gap-1 hover:underline mt-1 w-fit"
                                        title={competitionContractAddress}
                                    >
                                        <span>Contract: {competitionContractAddress.slice(0, 6)}...{competitionContractAddress.slice(-4)}</span>
                                        <ExternalLink className="w-3 h-3 shrink-0" />
                                    </a>
                                )}
                            </div>

                            {/* Prize Pool */}
                            <div className="bg-slate-50 p-5 rounded-xl border-0 flex flex-col justify-between gap-2">
                                <div>
                                    <div className="flex items-center text-slate-500 text-xs font-semibold tracking-wider uppercase">
                                        <Trophy className="w-4 h-4 mr-2 text-blue-500" />
                                        Prize Pool
                                    </div>
                                    <div className="text-lg font-semibold text-slate-800 flex items-baseline gap-1 mt-1">
                                        {prizePoolDisplay}
                                        <span className="text-sm font-normal text-slate-500">(Guaranteed Escrow Secured)</span>
                                    </div>
                                </div>
                                {treasuryPrizeContractAddress && (
                                    <a
                                        href={treasuryPrizeContractUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-mono gap-1 hover:underline mt-1 w-fit"
                                        title={treasuryPrizeContractAddress}
                                    >
                                        <span>Contract: {treasuryPrizeContractAddress.slice(0, 6)}...{treasuryPrizeContractAddress.slice(-4)}</span>
                                        <ExternalLink className="w-3 h-3 shrink-0" />
                                    </a>
                                )}
                            </div>

                            {/* Duration */}
                            <div className="bg-slate-50 p-5 rounded-xl border-0 flex flex-col justify-between gap-2">
                                <div>
                                    <div className="flex items-center text-slate-500 text-xs font-semibold tracking-wider uppercase">
                                        <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                        Competition Duration
                                    </div>
                                    <div className="text-lg font-semibold text-slate-800 mt-1">{durationLabel}</div>
                                </div>
                                <div className="text-xs text-slate-500 mt-1">Submission Closed • Code Freeze Active</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                )}

                {/* --- Search & Filter Bar --- */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-2 rounded-xl border-0 ring-0 shadow-none">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by team name or team member name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 border-0 bg-slate-50 focus-visible:ring-1 focus-visible:ring-blue-500 shadow-none"
                        />
                    </div>
                    <div className="text-sm text-slate-500 font-medium px-4">
                        Total Active: <span className="text-blue-600 font-semibold">{filteredTeams.length} teams shown</span>
                    </div>
                </div>

                {/* --- Teams Table --- */}
                <Card className="border-0 ring-0 shadow-none rounded-xl overflow-hidden bg-white py-0">
                    <Table>
                        <TableHeader className="bg-[#EFF4FF] border-0 [&_tr]:border-b-0">
                            <TableRow className="bg-[#EFF4FF] hover:bg-[#EFF4FF] border-0 border-b-0">
                                <TableHead className="bg-[#EFF4FF] text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 pl-6 w-[30%]">TEAM NAME</TableHead>
                                <TableHead className="bg-[#EFF4FF] text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 w-[40%]">TEAM MEMBERS</TableHead>
                                <TableHead className="bg-[#EFF4FF] text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 text-center">TEAM SIZE</TableHead>
                                <TableHead className="bg-[#EFF4FF] text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 text-right pr-6">SUBMISSION STATUS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTeams.map((team) => (
                                <TableRow key={team.id} className="hover:bg-slate-50/50 transition-colors border-0 border-b-0">
                                    <TableCell className="py-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                                                {team.initials}
                                            </div>
                                            <span className="font-semibold text-slate-800">{team.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 text-slate-500 text-sm">
                                        {team.members}
                                    </TableCell>
                                    <TableCell className="py-4 text-center">
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100 font-medium px-2.5 py-0.5 rounded-full">
                                            {team.size} members
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-4 text-right pr-6">
                                        <div className="flex justify-end">
                                            <StatusBadge status={team.status} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredTeams.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-8 text-center text-slate-500 text-sm">
                                        No teams found matching &quot;{searchQuery}&quot;
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>

            </div>
        </div>
    );
}