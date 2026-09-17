import React from 'react';
import {
    Search,
    BookOpen,
    Trophy,
    Clock,
    Target,
    ChevronRight
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
        <Badge variant="outline" className={`font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit border-0 ${styles[status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status]}`} />
            {status}
        </Badge>
    );
};

export default function CompetitionDetail() {
    return (
        <div className="w-full bg-[#F8F9FF] py-10">
            <div className="mx-auto max-w-7xl px-5 md:px-10 flex flex-col space-y-6">

                {/* --- Header Section --- */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center text-sm text-slate-500 mb-2">
                            <span>Dashboard</span>
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

                {/* --- Main Info Card --- */}
                <Card className="border-0 ring-0 shadow-sm rounded-xl overflow-hidden bg-white">
                    <CardContent className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                            <div className="space-y-3">
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 font-normal text-xs px-3 py-1 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-2" />
                                    Judging & Evaluation Phase (Submissions Closed)
                                </Badge>
                                <h2 className="text-3xl font-bold text-slate-900">Autonomous Agents Global Hackathon 2025</h2>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <Button variant="outline" className="text-slate-600 font-medium border-0 bg-slate-100 hover:bg-slate-200">
                                    <BookOpen className="w-4 h-4 mr-2" />
                                    View Guidebook
                                </Button>
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                                    <Trophy className="w-4 h-4 mr-2" />
                                    Determine Winner
                                </Button>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Category */}
                            <div className="bg-slate-50 p-5 rounded-xl border-0 flex flex-col gap-2">
                                <div className="flex items-center text-slate-500 text-xs font-semibold tracking-wider uppercase">
                                    <Target className="w-4 h-4 mr-2 text-blue-500" />
                                    Competition Category
                                </div>
                                <div className="text-lg font-semibold text-slate-800">AI & Autonomous Systems</div>
                            </div>

                            {/* Prize Pool */}
                            <div className="bg-slate-50 p-5 rounded-xl border-0 flex flex-col gap-2">
                                <div className="flex items-center text-slate-500 text-xs font-semibold tracking-wider uppercase">
                                    <Trophy className="w-4 h-4 mr-2 text-blue-500" />
                                    Prize Pool
                                </div>
                                <div className="text-lg font-semibold text-slate-800 flex items-baseline gap-1">
                                    $75,000 USDC
                                    <span className="text-sm font-normal text-slate-500">(Guaranteed Escrow Secured)</span>
                                </div>
                            </div>

                            {/* Duration */}
                            <div className="bg-slate-50 p-5 rounded-xl border-0 flex flex-col gap-2">
                                <div className="flex items-center text-slate-500 text-xs font-semibold tracking-wider uppercase">
                                    <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                    Competition Duration
                                </div>
                                <div className="text-lg font-semibold text-slate-800">Apr 20 - May 05, 2025</div>
                                <div className="text-xs text-slate-500">Submission Closed • Code Freeze Active</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* --- Search & Filter Bar --- */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-2 rounded-xl border-0 ring-0 shadow-sm">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by team name or team member name..."
                            className="pl-9 border-0 bg-slate-50 focus-visible:ring-1 focus-visible:ring-blue-500 shadow-none"
                        />
                    </div>
                    <div className="text-sm text-slate-500 font-medium px-4">
                        Total Active: <span className="text-blue-600 font-semibold">5 teams shown</span>
                    </div>
                </div>

                {/* --- Teams Table --- */}
                <Card className="border-0 ring-0 shadow-sm rounded-xl overflow-hidden bg-white">
                    <Table>
                        <TableHeader className="bg-slate-50/80 border-0 [&_tr]:border-b-0">
                            <TableRow className="hover:bg-transparent border-0 border-b-0">
                                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 w-[30%]">TEAM NAME</TableHead>
                                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 w-[40%]">TEAM MEMBERS</TableHead>
                                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 text-center">TEAM SIZE</TableHead>
                                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 text-right pr-6">SUBMISSION STATUS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teamsData.map((team) => (
                                <TableRow key={team.id} className="hover:bg-slate-50/50 transition-colors border-0 border-b-0">
                                    <TableCell className="py-4">
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
                        </TableBody>
                    </Table>
                </Card>

            </div>
        </div>
    );
}