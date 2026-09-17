"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { Plus, Search, Calendar, ArrowRight } from "lucide-react";

// --- Tipe ---
type CompetitionStatus =
    | "Submission"
    | "Judging"
    | "Registration"
    | "Completed";

type StatusFilter = CompetitionStatus | "all";
type CategoryFilter = string;

interface Competition {
    id: number;
    category: string;
    status: CompetitionStatus;
    title: string;
    date: string;
    prize: string;
}

// --- Data ---
const competitions: Competition[] = [
    {
        id: 1,
        category: "UI/UX Design",
        status: "Submission",
        title: "Autonomous Agents Global Hackathon 2025",
        date: "Apr 20 - May 05, 2025",
        prize: "$75,000 USDC",
    },
    {
        id: 2,
        category: "Web3 & Cryptography",
        status: "Judging",
        title: "Zero-Knowledge Financial Privacy Challenge",
        date: "Mar 15 - Apr 18, 2025",
        prize: "$50,000 USDC",
    },
    {
        id: 3,
        category: "DeFi & UX",
        status: "Registration",
        title: "NextGen DeFiUX & Account Abstraction",
        date: "Registration: May 01 - Jun 15, 2025",
        prize: "$30,000 USDC",
    },
    {
        id: 4,
        category: "ClimateTech",
        status: "Completed",
        title: "Verifiable Carbon Ledger Track",
        date: "Jan 10 - Feb 28, 2025",
        prize: "$40,000 USDC",
    },
];

const statusStyles: Record<CompetitionStatus, { badge: string; dot: string }> =
{
    Submission: {
        badge: "bg-[#E0EAFF] text-[#2563EB] hover:bg-[#E0EAFF]",
        dot: "bg-[#2563EB]",
    },
    Judging: {
        badge: "bg-[#E5E7FF] text-[#565E74] hover:bg-[#E5E7FF]",
        dot: "bg-[#565E74]",
    },
    Registration: {
        badge: "bg-[#D7F5EE] text-[#0D9488] hover:bg-[#D7F5EE]",
        dot: "bg-[#0D9488]",
    },
    Completed: {
        badge: "bg-[#F1F5F9] text-[#64748B] hover:bg-[#F1F5F9]",
        dot: "bg-[#64748B]",
    },
};

const STATUS_OPTIONS: CompetitionStatus[] = [
    "Submission",
    "Judging",
    "Registration",
    "Completed",
];

export default function CompetitionListPage() {
    const [search, setSearch] = useState<string>("");
    const [status, setStatus] = useState<StatusFilter>("all");
    const [category, setCategory] = useState<CategoryFilter>("all");

    const categories = useMemo<string[]>(
        () => Array.from(new Set(competitions.map((c) => c.category))),
        []
    );

    const filtered = useMemo<Competition[]>(() => {
        return competitions.filter((c) => {
            const matchSearch =
                c.title.toLowerCase().includes(search.toLowerCase()) ||
                c.category.toLowerCase().includes(search.toLowerCase());
            const matchStatus = status === "all" || c.status === status;
            const matchCategory = category === "all" || c.category === category;
            return matchSearch && matchStatus && matchCategory;
        });
    }, [search, status, category]);

    return (
        <div className="w-full bg-[#E5EEFF] py-10">
            <div className="mx-auto max-w-7xl px-5 md:px-10 flex flex-col">
                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-black font-bold text-2xl">Competition List</h1>
                    <div className="flex flex-row justify-between items-center">
                        <p className="text-[#434655]">
                            View, search, and manage competitions you have created.
                        </p>
                        <Link href="/organization/create">
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
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((comp) => {
                        const style = statusStyles[comp.status];
                        return (
                            <Card
                                key={comp.id}
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
                                        {comp.title}
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
                                            {comp.prize}
                                        </span>
                                    </div>
                                    <div className="w-full rounded-lg p-2.5 bg-white flex items-center justify-between">
                                        <Button
                                            variant="link"
                                            className="w-full px-0 text-[#2563EB] hover:text-[#1D4ED8] font-medium flex flex-row items-center justify-between h-auto"
                                        >
                                            <span>View Competition Detail</span>
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        );
                    })}

                    {filtered.length === 0 && (
                        <p className="col-span-full text-center text-slate-500 py-12">
                            No competitions found.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}