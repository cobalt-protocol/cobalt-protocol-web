import React from 'react';
import {
    ChevronRight,
    FileText,
    Download,
    ExternalLink,
    Eye,
    CheckCircle2,
} from 'lucide-react';
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";

// --- Helper Components ---

const AvatarInitials = ({ initials, bgClass = "bg-blue-100", textClass = "text-blue-700" }: { initials: string, bgClass?: string, textClass?: string }) => (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${bgClass} ${textClass}`}>
        {initials}
    </div>
);

export default function TeamDetail() {
    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans text-slate-900">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* --- Header Section --- */}
                <div>
                    <div className="flex items-center text-sm text-slate-500 mb-2">
                        <span>Dashboard</span>
                        <ChevronRight className="w-4 h-4 mx-1" />
                        <span className="text-blue-600 font-medium">Competition Detail</span>
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
                                    <AvatarInitials initials="SS" bgClass="bg-blue-600" textClass="text-white" />
                                    <div>
                                        <h3 className="font-semibold text-slate-900">Team Overview</h3>
                                        <p className="text-xs text-slate-500">COHORT 2025 # TRACK A</p>
                                    </div>
                                </div>

                                {/* Team Name */}
                                <div className="px-6 py-4 border-0 bg-slate-50/50">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">TEAM NAME</p>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg text-slate-900">Team SwarmSynthetix</span>
                                        <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-50" />
                                    </div>
                                </div>

                                {/* Team Leader */}
                                <div className="p-6 border-0">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">TEAM LEADER</p>
                                    <div className="bg-blue-50/50 rounded-xl p-4 flex items-center justify-between border-0">
                                        <div className="flex items-center gap-3">
                                            <AvatarInitials initials="AR" bgClass="bg-blue-600" textClass="text-white" />
                                            <div>
                                                <p className="font-semibold text-slate-900 text-sm">Alex Rivera</p>
                                                <p className="text-xs text-slate-500">alex.rivera@agentmail.com</p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 font-medium text-[10px] uppercase">
                                            Primary Contact
                                        </Badge>
                                    </div>
                                </div>

                                {/* Team Members */}
                                <div className="p-6 border-0 pt-0">
                                    <div className="flex justify-between items-center mb-4 mt-6">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">TEAM MEMBERS</p>
                                        <span className="text-xs text-slate-500 font-medium">3 Collaborators</span>
                                    </div>

                                    <div className="space-y-4">
                                        {[
                                            { initials: "SC", name: "Sarah Chen", handle: "@sarahchen", color: "bg-emerald-100", text: "text-emerald-700" },
                                            { initials: "DK", name: "Daniyal Kim", handle: "@daniyalkim", color: "bg-amber-100", text: "text-amber-700" },
                                            { initials: "PS", name: "Priya Sharma", handle: "@priyasharma", color: "bg-purple-100", text: "text-purple-700" },
                                        ].map((member, i) => (
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
                                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center">
                                            <FileText className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SUBMITTED PROJECT</p>
                                            <h3 className="font-semibold text-slate-900">Hackathon Deliverable</h3>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-0 hover:bg-emerald-50 w-fit px-3 py-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                                        Submission Finalized
                                    </Badge>
                                </div>

                                {/* Submission Content */}
                                <div className="p-6 md:p-8 space-y-8">

                                    {/* Title & Description */}
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">PROJECT TITLE</p>
                                            <h2 className="text-2xl font-bold text-slate-900">SynthetixCore: Recursive Multi-Agent Execution & Trustless State Arbiter</h2>
                                        </div>

                                        <div className="bg-slate-50 rounded-xl p-5 border-0 text-sm text-slate-600 space-y-4 leading-relaxed">
                                            <p>
                                                <strong className="text-slate-800">Architectural Overview:</strong> SynthetixCore implements a hierarchical zero-knowledge arbiter network designed to coordinate autonomous machine actors across fragmented liquidity clusters. By combining recursive SNARKs with deterministic state machines, the protocol allows swarms to execute concurrent task workflows without central orchestration.
                                            </p>
                                            <p>
                                                <strong className="text-slate-800">Multi-Agent Consensus Protocols:</strong> The implementation resolves distributed deadlock through an asynchronous Byzantine agreement layer. Individual agent micro-actions are bundled into local DAG clusters, which are then compressed into succinct state proofs verified by the root arbiter contract on Ethereum mainnet.
                                            </p>
                                            <p>
                                                <strong className="text-slate-800">Verification Benchmarks & Problem Solving Approach:</strong> Existing solutions suffer from exponential gas blowup when scaling agent swarms past 32 nodes. SynthetixCore demonstrates deterministic settlement times with a 94.2% reduction in L1 calldata overhead, achieving sub-second optimistic consensus across test swarms of 512 active nodes.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Tech Specs Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: "EVM Target", value: "v0.8.27 . Yul" },
                                            { label: "Gas Efficiency Index", value: "98.4 / 100" },
                                            { label: "Language", value: "Rust / Solidity 0.8.24" },
                                        ].map((spec, i) => (
                                            <div key={i} className="bg-slate-50 border-0 rounded-lg p-3">
                                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{spec.label}</p>
                                                <p className="text-xs font-medium text-slate-800">{spec.value}</p>
                                            </div>
                                        ))}
                                        {/* Empty div for grid alignment if needed, or adjust grid cols */}
                                    </div>

                                    {/* Files Section */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">UPLOADED FILES (SUBMISSION FORMAT: FILE UPLOAD)</p>
                                            <span className="text-xs text-slate-400">1 Package Attached</span>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-0 rounded-xl gap-4 bg-slate-50/50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                                    <FileText className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800 text-sm">synthetix-core-bundle-v1.0.tar.gz</p>
                                                    <p className="text-xs text-slate-500">45.6 MB • 0 SHA-256 Verified • Feb 3, 2025</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Button variant="outline" size="sm" className="text-slate-600 h-8 border-0 bg-slate-100 hover:bg-slate-200">
                                                    <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview Bundle
                                                </Button>
                                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-8">
                                                    <Download className="w-3.5 h-3.5 mr-1.5" /> Download File
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Links Section */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SUBMISSION LINKS (SUBMISSION FORMAT: EXTERNAL PROJECT LINK)</p>
                                            <span className="text-xs text-slate-400">2 Public Endpoints</span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* GitHub Card */}
                                            <div className="border-0 rounded-xl p-4 flex flex-col justify-between gap-4 bg-slate-50/50">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center shrink-0">
                                                        {/* Simple GitHub Icon representation */}
                                                        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                                                            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-semibold text-slate-800 text-sm">GitHub Repository</p>
                                                                <p className="text-xs text-slate-500">https://github.com/swarmsynthetix/core-arbiter</p>
                                                            </div>
                                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px]">Main Branch</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button variant="secondary" className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium">
                                                    Open submission link <ExternalLink className="w-3 h-3 ml-1.5" />
                                                </Button>
                                            </div>

                                            {/* Loom Card */}
                                            <div className="border-0 rounded-xl p-4 flex flex-col justify-between gap-4 bg-slate-50/50">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded bg-[#625DF5] flex items-center justify-center shrink-0">
                                                        {/* Simple Loom Icon representation */}
                                                        <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
                                                            <path d="M24 10.6h-8.4l5.9-5.9-2.1-2.1-5.9 5.9V0H10.6v8.4L4.7 2.5 2.6 4.6l5.9 5.9H0v2.9h8.4l-5.9 5.9 2.1 2.1 5.9-5.9V24h2.9v-8.4l5.9 5.9 2.1-2.1-5.9-5.9H24v-2.9z" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-semibold text-slate-800 text-sm">Loom Video Walkthrough</p>
                                                                <p className="text-xs text-slate-500">https://loom.com/share/fc83...synthetic-demo</p>
                                                            </div>
                                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px]">1080p HD</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button variant="secondary" className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium">
                                                    Open submission link <ExternalLink className="w-3 h-3 ml-1.5" />
                                                </Button>
                                            </div>
                                        </div>
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