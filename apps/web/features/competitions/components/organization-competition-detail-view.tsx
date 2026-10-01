'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  ChevronRight,
  Clock,
  ExternalLink,
  Loader2,
  Search,
  Target,
  Trophy,
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
import {
  fetchAllTeamsByCompetitionIdResult,
  getStoredToken,
  type ApiCompetition,
  type ApiTeam,
} from '@/lib/competitions-api';
import { routes } from '@/lib/routes';
import type { Competition } from '../types';

function getTeamInitials(name: string): string {
  if (!name) return "TM";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2 && words[0]?.[0] && words[1]?.[0]) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const StatusBadge = ({ status, visibility }: { status?: string; visibility?: boolean }) => {
  const isPrivate = visibility === false;
  const label = status || (isPrivate ? "Private" : "Public");

  const styles: Record<string, string> = {
    Submitted: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
    "Under Review": "bg-blue-50 text-blue-700 hover:bg-blue-50",
    Incomplete: "bg-red-50 text-red-700 hover:bg-red-50",
    Public: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
    Private: "bg-purple-50 text-purple-700 hover:bg-purple-50",
  };

  const dotColors: Record<string, string> = {
    Submitted: "bg-emerald-500",
    "Under Review": "bg-blue-500",
    Incomplete: "bg-red-500",
    Public: "bg-emerald-500",
    Private: "bg-purple-500",
  };

  return (
    <Badge variant="outline" className={`font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit border-0 ${styles[label] || styles["Public"]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[label] || dotColors["Public"]}`} />
      {label}
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

interface OrganizationViewProps {
  id: string;
  apiCompetition?: ApiCompetition | null;
  effectiveCompetition?: Competition;
  isLoading?: boolean;
  isOwner?: boolean;
  prizePoolDisplay: string;
  guidebookUrl?: string | null;
}

export function OrganizationCompetitionDetailView({
  id,
  apiCompetition,
  effectiveCompetition,
  isLoading,
  isOwner = true,
  prizePoolDisplay,
  guidebookUrl,
}: OrganizationViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [storedToken, setStoredToken] = useState<string | null>(null);

  useEffect(() => {
    setStoredToken(getStoredToken());
  }, []);

  const { data: teamsResult, isLoading: isLoadingTeams } = useQuery({
    queryKey: ["all-competition-teams", id, storedToken],
    queryFn: () => (id ? fetchAllTeamsByCompetitionIdResult(id, storedToken || getStoredToken()) : null),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (teamsResult && [404, 401, 403].includes(teamsResult.status)) {
      router.push(routes.competitions);
    }
  }, [teamsResult, router]);

  const apiTeams = useMemo(() => teamsResult?.data || [], [teamsResult]);

  const formattedTeams = useMemo(() => {
    if (!apiTeams || apiTeams.length === 0) {
      return [];
    }
    return apiTeams.map((team) => {
      const membersStr =
        team.team_roles && team.team_roles.length > 0
          ? team.team_roles
              .map((r) => {
                const u = r.user;
                if (!u) return "Member";
                return (
                  u.username ||
                  u.email ||
                  (u.wallet_address
                    ? `${u.wallet_address.slice(0, 6)}...${u.wallet_address.slice(-4)}`
                    : "Member")
                );
              })
              .join(", ")
          : "No members listed";

      const initials = getTeamInitials(team.name);

      return {
        id: team.id,
        initials,
        name: team.name,
        members: membersStr,
        size: team.team_roles?.length || 1,
        visibility: team.visibility,
        status: team.visibility ? "Public" : "Private",
      };
    });
  }, [apiTeams]);

  const title = apiCompetition?.name || effectiveCompetition?.title || "Autonomous Agents Global Hackathon 2025";
  const rawTxHash = apiCompetition?.tx_hash || "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
  const txHash = rawTxHash.startsWith("0x") ? rawTxHash : `0x${rawTxHash}`;
  const category = apiCompetition?.category || effectiveCompetition?.category || "AI & Autonomous Systems";

  const startDateLabel = formatDate(apiCompetition?.registration_window);
  const endDateLabel = formatDate(apiCompetition?.pirze_certificate_claim);
  const durationLabel = apiCompetition?.registration_window
    ? `${startDateLabel} - ${endDateLabel}`
    : "Apr 20 - May 05, 2025";

  const competitionContractAddress = process.env.NEXT_PUBLIC_COMPETITION_CONTRACT || process.env.COMPETITION_CONTRACT || '0x2938eabf29e9F7ecaff7E11ca9794DFa904e78D7';
  const treasuryPrizeContractAddress = process.env.NEXT_PUBLIC_TREASURY_PRIZE_CONTRACT || process.env.TREASURY_PRIZE_CONTRACT || '0x501c3E1eB0059609Df8DE7bf06e70598e68F2d97';

  const explorerBaseUrl = 'https://scan.bohr.life';
  const competitionTxUrl = `${explorerBaseUrl}/tx/${txHash}`;
  const competitionContractUrl = `${explorerBaseUrl}/address/${competitionContractAddress}`;
  const treasuryPrizeContractUrl = `${explorerBaseUrl}/address/${treasuryPrizeContractAddress}`;

  const filteredTeams = formattedTeams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.members.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full bg-[#F8F9FF] py-10">
      <div className="mx-auto max-w-7xl px-5 md:px-10 flex flex-col space-y-6">

        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center text-sm text-slate-500 mb-2">
              <Link href="/organization/competition" className="hover:underline">Dashboard</Link>
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
                  {(apiCompetition?.description || effectiveCompetition?.description) && (
                    <p className="text-slate-500 text-sm max-w-3xl">
                      {apiCompetition?.description || effectiveCompetition?.description}
                    </p>
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
                    <Link href={`/organization/competition/${id}/winner`}>
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
                <TableHead className="bg-[#EFF4FF] text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 w-[35%]">TEAM MEMBERS</TableHead>
                <TableHead className="bg-[#EFF4FF] text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 text-center">TEAM SIZE</TableHead>
                <TableHead className="bg-[#EFF4FF] text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 text-right">SUBMISSION STATUS</TableHead>
                <TableHead className="bg-[#EFF4FF] text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 text-right pr-6">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingTeams ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-slate-500 text-sm">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading participating teams...
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filteredTeams.map((team) => (
                    <TableRow
                      key={team.id}
                      onClick={() => router.push(routes.organizationTeamDetail(id, team.id))}
                      className="hover:bg-slate-50/50 transition-colors border-0 border-b-0 cursor-pointer"
                    >
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
                      <TableCell className="py-4 text-right">
                        <div className="flex justify-end">
                          <StatusBadge status={team.status} visibility={team.visibility} />
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                        <Link href={routes.organizationTeamDetail(id, team.id)}>
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium">
                            View Detail
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTeams.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-slate-500 text-sm">
                        {searchQuery
                          ? `No teams found matching "${searchQuery}"`
                          : "No teams found for this competition"}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </Card>

      </div>
    </div>
  );
}
