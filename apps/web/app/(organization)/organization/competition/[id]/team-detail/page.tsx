'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { fetchApiMe, fetchTeamDetail, fetchTeamSubmissionResult, getStoredToken } from '@/lib/competitions-api';
import {
    ChevronRight,
    FileText,
    Download,
    ExternalLink,
    Eye,
    CheckCircle2,
    Loader2,
} from 'lucide-react';
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";

// --- Helper Components ---

interface TeamMemberItem {
    initials: string;
    name: string;
    handle: string;
    color?: string;
    text?: string;
}

const AvatarInitials = ({ initials, bgClass = "bg-blue-100", textClass = "text-blue-700" }: { initials: string, bgClass?: string, textClass?: string }) => (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${bgClass} ${textClass}`}>
        {initials}
    </div>
);

function getInitials(name: string): string {
    if (!name) return "TS";
    const words = name.trim().split(/\s+/);
    if (words.length >= 2 && words[0]?.[0] && words[1]?.[0]) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
}

function TeamDetailContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const compId = (params?.id as string) || '';
    const teamId = searchParams.get('teamId') || '';
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

    const { data: apiTeam } = useQuery({
        queryKey: ["team-detail-page", teamId, storedToken],
        queryFn: () => (teamId ? fetchTeamDetail(teamId, storedToken) : null),
        enabled: Boolean(teamId) && Boolean(storedToken),
    });

    const { data: submissionRes, isLoading: isLoadingSubmission } = useQuery({
        queryKey: ["team-submission-detail", teamId, storedToken],
        queryFn: () => (teamId ? fetchTeamSubmissionResult(teamId, storedToken) : null),
        enabled: Boolean(teamId) && Boolean(storedToken),
    });

    const submission = submissionRes?.data;
    const rawCid = submission?.document_cid?.replace(/^ipfs:\/\//, "") || "";
    const ipfsGatewayBase = (
        process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL || "http://localhost:8081/ipfs"
    ).replace(/\/$/, "");
    const ipfsGatewayUrl = rawCid ? `${ipfsGatewayBase}/${rawCid}` : "";

    const shortCid = rawCid
        ? `${rawCid.slice(0, 12)}…${rawCid.slice(-8)}`
        : "";
    const submittedAt = submission?.created_at
        ? new Date(submission.created_at).toLocaleString()
        : "";

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

    if (isChecking || !isOrganizationRole) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-6 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-2" />
                <span>{!isOrganizationRole && !isChecking ? "Redirecting..." : "Loading team details..."}</span>
            </div>
        );
    }
    const displayTeamName = apiTeam?.name || "Team SwarmSynthetix";
    const teamInitials = getInitials(displayTeamName);

    const roles = apiTeam?.team_roles || [];
    const leaderRole = roles.find((r: any) => r.role === "leader") || roles[0];
    const leaderUser = leaderRole?.user;
    const leaderName = leaderUser?.username || leaderUser?.email || (leaderUser?.wallet_address ? `${leaderUser.wallet_address.slice(0, 6)}...${leaderUser.wallet_address.slice(-4)}` : "Alex Rivera");
    const leaderEmail = leaderUser?.email || (leaderUser?.wallet_address ? `${leaderUser.wallet_address.slice(0, 6)}...${leaderUser.wallet_address.slice(-4)}` : "alex.rivera@agentmail.com");

    const dynamicMembers: TeamMemberItem[] | null = roles.length > 0
        ? roles.map((r: any) => {
            const u = r.user;
            const name = u?.username || u?.email || (u?.wallet_address ? `${u.wallet_address.slice(0, 6)}...${u.wallet_address.slice(-4)}` : "Collaborator");
            const handle = u?.email ? `@${u.email.split("@")[0]}` : (u?.wallet_address ? `@${u.wallet_address.slice(0, 6)}` : "@collaborator");
            return {
                name,
                handle,
                initials: getInitials(name),
                color: "bg-blue-100",
                text: "text-blue-700",
            };
        })
        : null;

    const defaultMembers: TeamMemberItem[] = [
        { initials: "SC", name: "Sarah Chen", handle: "@sarahchen", color: "bg-emerald-100", text: "text-emerald-700" },
        { initials: "DK", name: "Daniyal Kim", handle: "@daniyalkim", color: "bg-amber-100", text: "text-amber-700" },
        { initials: "PS", name: "Priya Sharma", handle: "@priyasharma", color: "bg-purple-100", text: "text-purple-700" },
    ];

    const memberList: TeamMemberItem[] = dynamicMembers || defaultMembers;

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans text-slate-900">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* --- Header Section --- */}
                <div>
                    <div className="flex items-center text-sm text-slate-500 mb-2">
                        <Link href="/organization/competition" className="hover:underline">Dashboard</Link>
                        <ChevronRight className="w-4 h-4 mx-1" />
                        <Link href={compId ? `/organization/competition/${compId}` : '/organization/competition'} className="hover:underline">Competition Detail</Link>
                        <ChevronRight className="w-4 h-4 mx-1" />
                        <span className="text-blue-600 font-medium">Team Detail</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Team Detail</h1>
                    <p className="text-slate-500 mt-1">Review a participating team's information and submission before determining winners.</p>
                </div>

                {/* --- Main Content Grid --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* LEFT COLUMN: Team Info Sidebar */}
                    <div className="lg:col-span-4 space-y-4">
                        <Card className="border-0 ring-0 shadow-none rounded-xl overflow-hidden bg-white">
                            <CardContent className="p-0">
                                {/* Team Overview Header */}
                                <div className="p-6 pb-4 flex gap-4">
                                    <AvatarInitials initials={teamInitials} bgClass="bg-blue-600" textClass="text-white" />
                                    <div>
                                        <h3 className="font-semibold text-slate-900">Team Overview</h3>
                                        <p className="text-xs text-slate-500">COHORT 2025 # TRACK A</p>
                                    </div>
                                </div>

                                {/* Team Name */}
                                <div className="px-6 py-4 border-0 bg-slate-50/50">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">TEAM NAME</p>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg text-slate-900">{displayTeamName}</span>
                                        <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-50" />
                                    </div>
                                </div>

                                {/* Team Leader */}
                                <div className="p-6 border-0">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">TEAM LEADER</p>
                                    <div className="bg-blue-50/50 rounded-xl p-4 flex items-center justify-between border-0">
                                        <div className="flex items-center gap-3">
                                            <AvatarInitials initials={getInitials(leaderName)} bgClass="bg-blue-600" textClass="text-white" />
                                            <div>
                                                <p className="font-semibold text-slate-900 text-sm">{leaderName}</p>
                                                <p className="text-xs text-slate-500">{leaderEmail}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Team Members */}
                                <div className="p-6 border-0 pt-0">
                                    <div className="flex justify-between items-center mb-4 mt-6">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">TEAM MEMBERS</p>
                                        <span className="text-xs text-slate-500 font-medium">{memberList.length} Collaborators</span>
                                    </div>

                                    <div className="space-y-4">
                                        {memberList.map((member: TeamMemberItem, i: number) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <AvatarInitials initials={member.initials} bgClass={member.color} textClass={member.text} />
                                                <div>
                                                    <p className="font-medium text-slate-900 text-sm">{member.name}</p>
                                                    <p className="text-xs text-slate-500">{member.handle}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: Submission Details */}
                    <div className="lg:col-span-8">
                        <Card className="border-0 ring-0 shadow-none rounded-xl overflow-hidden bg-white">
                            <CardContent className="p-0">

                                {/* Submission Header */}
                                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-0 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center">
                                            <FileText className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SUBMITTED PROJECT</p>
                                            <h3 className="font-semibold text-slate-900">
                                                {submission?.title || (isLoadingSubmission ? "Loading submission..." : "No Submission Yet")}
                                            </h3>
                                        </div>
                                    </div>
                                    {submission ? (
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-none border-0 hover:bg-emerald-50 w-fit px-3 py-1 shadow-none ring-0">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                                            Submission Finalized
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-none border-0 hover:bg-amber-50 w-fit px-3 py-1 shadow-none ring-0">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2" />
                                            {isLoadingSubmission ? "Loading..." : "Pending Submission"}
                                        </Badge>
                                    )}
                                </div>

                                {/* Submission Content */}
                                <div className="p-6 md:p-8 space-y-8">

                                    {/* Title & Description */}
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">PROJECT TITLE</p>
                                            <h2 className="text-2xl font-bold text-slate-900">{submission?.title || "No Title"}</h2>
                                        </div>

                                        <div className="bg-slate-50 rounded-xl p-5 border-0 text-sm text-slate-600 space-y-4 leading-relaxed">
                                            {submission?.description ? (
                                                <p className="whitespace-pre-wrap">{submission.description}</p>
                                            ) : (
                                                <p className="text-slate-400 italic">No description provided.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Submission Metadata */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="bg-slate-50 border-0 rounded-lg p-3">
                                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Document CID</p>
                                            <p className="text-xs font-medium text-slate-800 break-all">{shortCid || "—"}</p>
                                        </div>
                                        <div className="bg-slate-50 border-0 rounded-lg p-3">
                                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Submitted At</p>
                                            <p className="text-xs font-medium text-slate-800">{submittedAt || "—"}</p>
                                        </div>
                                        <div className="bg-slate-50 border-0 rounded-lg p-3">
                                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Team ID</p>
                                            <p className="text-xs font-medium text-slate-800 break-all">{teamId || "—"}</p>
                                        </div>
                                    </div>

                                    {/* Files Section */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">UPLOADED FILE (IPFS / KUBO)</p>
                                            <span className="text-xs text-slate-400">{rawCid ? "1 File Attached" : "No File Attached"}</span>
                                        </div>

                                        {rawCid ? (
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-0 rounded-xl gap-4 bg-slate-50/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                                        <FileText className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800 text-sm">Project Submission Document</p>
                                                        <p className="text-xs text-slate-500 break-all">{shortCid || rawCid}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <a href={ipfsGatewayUrl} target="_blank" rel="noopener noreferrer">
                                                        <Button variant="outline" size="sm" className="text-slate-600 h-8 border-0 bg-slate-100 hover:bg-slate-200">
                                                            <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview
                                                        </Button>
                                                    </a>
                                                    <a href={ipfsGatewayUrl} target="_blank" rel="noopener noreferrer" download>
                                                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-8">
                                                            <Download className="w-3.5 h-3.5 mr-1.5" /> Download File
                                                        </Button>
                                                    </a>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 border-0 rounded-xl bg-slate-50/50 text-sm text-slate-400 italic">
                                                No submission file has been uploaded yet.
                                            </div>
                                        )}
                                    </div>

                                    {/* Links Section */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SUBMISSION LINK</p>
                                            <span className="text-xs text-slate-400">{submission?.submission_link ? "1 Public Endpoint" : "No Endpoint"}</span>
                                        </div>

                                        {submission?.submission_link ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="border-0 border-none rounded-xl p-4 flex flex-col justify-between gap-4 bg-slate-50/50 shadow-none ring-0">
                                                    <div className="flex items-start gap-3 min-w-0">
                                                        <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center shrink-0">
                                                            <ExternalLink className="w-4 h-4 text-white" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-slate-800 text-sm truncate">Project / Repository Link</p>
                                                            <p className="text-xs text-slate-500 truncate">{submission.submission_link}</p>
                                                        </div>
                                                    </div>
                                                    <a href={submission.submission_link} target="_blank" rel="noopener noreferrer">
                                                        <Button variant="secondary" className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border-0 border-none shadow-none ring-0">
                                                            Open submission link <ExternalLink className="w-3 h-3 ml-1.5" />
                                                        </Button>
                                                    </a>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 border-0 rounded-xl bg-slate-50/50 text-sm text-slate-400 italic">
                                                No submission link provided.
                                            </div>
                                        )}

                                    </div>

                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function TeamDetail() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-6 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-2" />
                <span>Loading team details...</span>
            </div>
        }>
            <TeamDetailContent />
        </Suspense>
    );
}