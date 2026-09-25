'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, Calendar as CalendarIconLucide, Clock } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseEther, parseUnits, getAddress } from 'viem';
import CompetitionManagerABI from '@/abi/CompetitionManager.json';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { DateTimePicker } from '@/components/ui/date-picker';
import { fetchListingTokenPrizes, fetchPriceCompetitionById, getTokenSymbol, type ApiListingTokenPrize } from '@/lib/competitions-api';
import { TOKENS } from '@/lib/tokens';

// --- KUMPULAN IKON SVG ---
const InfoIcon = () => (
    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);
const CalendarIcon = () => (
    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
);
const TrophyIcon = () => (
    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
);
const BookIcon = () => (
    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
);
const CreditCardIcon = () => (
    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
);
const UploadIcon = () => (
    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
);
const PlusIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
);
const TrashIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
);

// --- KOMPONEN WRAPPER SECTION ---
interface SectionCardProps {
    icon: React.ReactNode;
    title: string;
    description?: string;
    step: string;
    children: React.ReactNode;
}

const SectionCard = ({ icon, title, description, step, children }: SectionCardProps) => (
    <div className="bg-white rounded-xl p-6 md:p-8 mb-6">
        <div className="bg-[#EFF4FF]/50 rounded-lg p-4 md:p-5 mb-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="p-1">{icon}</div>
                    <div className="flex flex-col">
                        <div className="flex items-center space-x-3">
                            <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                            <span className="bg-red-50 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Required
                            </span>
                        </div>
                        {description && (
                            <p className="text-sm text-slate-500 mt-1">{description}</p>
                        )}
                    </div>
                </div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 ml-4">
                    {step}
                </span>
            </div>
        </div>
        <div>{children}</div>
    </div>
);

// --- KOMPONEN KECIL UNTUK CERTIFICATE FILE INPUT ---
interface CertificateFileInputProps {
    fileName: string;
    onFileChange: (file: File | null) => void;
    label?: string;
    accept?: string;
}

const CertificateFileInput = ({
    fileName,
    onFileChange,
    label = "Certificate Template",
    accept = "image/*",
}: CertificateFileInputProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            onFileChange(file);
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onFileChange(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                {label}
            </label>
            <input
                type="file"
                ref={inputRef}
                onChange={handleFileSelect}
                accept={accept}
                className="hidden"
            />
            {fileName ? (
                <div
                    onClick={() => inputRef.current?.click()}
                    className="flex items-center justify-between bg-white/70 hover:bg-white cursor-pointer py-2 px-3 rounded-md text-sm text-blue-600 border border-slate-200/80 transition-colors"
                >
                    <div className="flex items-center space-x-2 truncate">
                        <UploadIcon />
                        <span className="text-xs font-medium truncate">{fileName}</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="text-gray-400 hover:text-red-500 font-bold ml-2 transition-colors focus:outline-none"
                        title="Remove template"
                    >
                        ×
                    </button>
                </div>
            ) : (
                <div
                    onClick={() => inputRef.current?.click()}
                    className="flex items-center justify-between bg-white/50 hover:bg-white cursor-pointer py-2 px-3 rounded-md text-sm text-slate-400 hover:text-blue-600 transition-colors border border-dashed border-slate-300"
                >
                    <div className="flex items-center space-x-2">
                        <UploadIcon />
                        <span className="text-xs font-medium">Upload File</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- KOMPONEN KECIL UNTUK DATE CARD ---
interface DateCardProps {
    title: string;
    startLabel: string;
    startDateValue: string;
    onStartChange: (val: string) => void;
    endLabel?: string;
    endDateValue?: string;
    onEndChange?: (val: string) => void;
    icon: React.ReactNode;
}

const DateCard = ({
    title,
    startLabel,
    startDateValue,
    onStartChange,
    endLabel,
    endDateValue,
    onEndChange,
    icon,
}: DateCardProps) => (
    <div className="bg-[#EFF4FF] rounded-xl p-4 border border-blue-100/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center space-x-2.5 mb-3.5">
            <div className="p-1.5 bg-white rounded-lg text-blue-600 shadow-xs">
                {icon}
            </div>
            <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        </div>
        <div className={`grid ${endLabel && endDateValue !== undefined ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-3 text-xs`}>
            <div className="bg-white/90 p-2 rounded-lg border border-slate-200/80 hover:border-blue-300 transition-colors">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider flex items-center gap-1.5">
                    <CalendarIconLucide className="w-3 h-3 text-blue-500 shrink-0" />
                    {startLabel}
                </label>
                <DateTimePicker
                    value={startDateValue}
                    onChange={onStartChange}
                    placeholder="Select date & time"
                />
            </div>
            {endLabel && endDateValue !== undefined && onEndChange && (
                <div className="bg-white/90 p-2 rounded-lg border border-slate-200/80 hover:border-blue-300 transition-colors">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-blue-500 shrink-0" />
                        {endLabel}
                    </label>
                    <DateTimePicker
                        value={endDateValue}
                        onChange={onEndChange}
                        placeholder="Select date & time"
                    />
                </div>
            )}
        </div>
    </div>
);

interface PrizeCategory {
    place: string;
    amount: string;
    file: string;
    fileObj?: File | null;
}

const INITIAL_PRIZES: PrizeCategory[] = [
    { place: '1st Place Champion', amount: '30', file: 'Upload1.png', fileObj: null },
    { place: '2nd Place', amount: '20', file: 'Upload2.png', fileObj: null },
    { place: '3rd Place', amount: '10', file: 'Upload3.png', fileObj: null },
];

async function uploadToKuboIPFS(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    try {
        // Use local Next.js API route (/api/ipfs) as proxy to avoid browser CORS issues with Kubo IPFS RPC on port 5001
        const res = await fetch('/api/ipfs', {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
            console.warn(`IPFS upload API returned status ${res.status}`);
            return file.name || 'QmDefaultMockCID';
        }

        const data = await res.json();
        const cid: string = data.cid || data.hash || data.Hash || '';
        if (!cid) {
            return file.name || 'QmDefaultMockCID';
        }
        return cid;
    } catch (err) {
        console.warn('Kubo IPFS upload fetch error, falling back:', err);
        return file.name || 'QmDefaultMockCID';
    }
}

// --- KOMPONEN UTAMA ---
export default function CreateCompetition() {
    const publicClient = usePublicClient();
    const { address, isConnected, chain } = useAccount();
    const { writeContractAsync, data: txHash, isPending: isWritePending, error: writeError } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

    const [txErrorCustom, setTxErrorCustom] = useState<string | null>(null);
    const [isUploadingIpfs, setIsUploadingIpfs] = useState(false);

    const [name, setName] = useState('Autonomous Agents Global Hackathon 2025');
    const [category, setCategory] = useState('AI & Autonomous Systems');
    const [description, setDescription] = useState(
        'The Autonomous Agents Global Hackathon 2025 invites world-class AI engineers, cryptography researchers, and smart-contract developers to architect, stress-test, and deploy production-ready autonomous agent clusters. Teams will build verifiable execution runtimes leveraging zero-knowledge proofs and decentralized identity primitives.'
    );
    const [requirements, setRequirements] = useState(
        '- Teams of 1 to 5 members are permitted.\n- Open-source codebase with permissive MIT or Apache 2.0 licensing.\n- Must provide functional public GitHub repository with reproducible test suites.\n- Use of local wallet architecture is not mandatory; however, it is highly recommended.'
    );
    const [teamSize, setTeamSize] = useState<'1-3 member' | '1-5 member'>('1-5 member');

    const handleTeamSizeChange = (selected: '1-3 member' | '1-5 member') => {
        setTeamSize(selected);
        if (selected === '1-3 member') {
            setRequirements((prev) => prev.replace('1 to 5 members', '1 to 3 members'));
        } else {
            setRequirements((prev) => prev.replace('1 to 3 members', '1 to 5 members'));
        }
    };
    const [prizes, setPrizes] = useState<PrizeCategory[]>(INITIAL_PRIZES);
    const [participantCertificate, setParticipantCertificate] = useState('Upload4.png');
    const [participantCertificateFile, setParticipantCertificateFile] = useState<File | null>(null);
    const [guidebookFile, setGuidebookFile] = useState('Official_Hackathon_Guidebook_v2.4.pdf');
    const [guidebookFileObj, setGuidebookFileObj] = useState<File | null>(null);
    const [priceCompetitionFeeId, setPriceCompetitionFeeId] = useState('1');
    const [feeCompetitionTitle, setFeeCompetitionTitle] = useState<string>('');
    const [feeTreasuryAmount, setFeeTreasuryAmount] = useState<string>('0');
    const [feeTokenAddress, setFeeTokenAddress] = useState<string>(TOKENS.BOT.address);
    const [isLoadingPriceComp, setIsLoadingPriceComp] = useState<boolean>(false);

    const [listingTokens, setListingTokens] = useState<ApiListingTokenPrize[]>([]);
    const [selectedTokenAddress, setSelectedTokenAddress] = useState<string>(TOKENS.BOT.address);
    const [tokenSymbol, setTokenSymbol] = useState<string>(TOKENS.BOT.symbol);

    useEffect(() => {
        async function loadPriceCompetition() {
            const targetId = priceCompetitionFeeId || '1';
            setIsLoadingPriceComp(true);
            const priceComp = await fetchPriceCompetitionById(targetId);
            if (priceComp) {
                if (priceComp.title) setFeeCompetitionTitle(priceComp.title);
                if (priceComp.treasury_fee) setFeeTreasuryAmount(priceComp.treasury_fee);
                if (priceComp.token_address) setFeeTokenAddress(priceComp.token_address);
            } else {
                setFeeCompetitionTitle('');
            }
            setIsLoadingPriceComp(false);
        }
        loadPriceCompetition();
    }, [priceCompetitionFeeId]);

    useEffect(() => {
        async function loadListingTokenPrizes() {
            const tokens = await fetchListingTokenPrizes();
            if (tokens && tokens.length > 0) {
                setListingTokens(tokens);
                const activeToken = tokens.find((t) => t.is_active) || tokens[0];
                if (activeToken?.token_address) {
                    setSelectedTokenAddress(activeToken.token_address);
                    const formattedSymbol = getTokenSymbol(
                        activeToken.token_address,
                        chain?.nativeCurrency?.symbol,
                        activeToken.symbol || activeToken.token_symbol
                    );
                    setTokenSymbol(formattedSymbol);
                }
            } else {
                const defaultSymbol = getTokenSymbol(selectedTokenAddress, chain?.nativeCurrency?.symbol);
                setTokenSymbol(defaultSymbol);
            }
        }
        loadListingTokenPrizes();
    }, [chain?.nativeCurrency?.symbol]);

    const [duration, setDuration] = useState({
        registrationStart: '',
        registrationEnd: '',
        competitionStart: '',
        competitionEnd: '',
        submissionDeadline: '',
        judgingStart: '',
        judgingEnd: '',
        resultsAnnouncement: '',
        prizeClaimStart: '',
    });

    useEffect(() => {
        const now = new Date();
        const base = new Date(now.getTime() + 60 * 60 * 1000);
        base.setSeconds(0, 0);

        const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400000);

        const regStart = base;
        const regEnd = addDays(regStart, 7);
        const compStart = regEnd;
        const compEnd = addDays(compStart, 7);
        const subDeadline = compEnd;
        const judgingStart = compEnd;
        const judgingEnd = addDays(judgingStart, 4);
        const resultsAnnounce = addDays(judgingEnd, 2);
        const prizeClaim = addDays(resultsAnnounce, 1);

        const fmt = (dt: Date) => {
            const pad = (n: number) => String(n).padStart(2, '0');
            return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
        };

        setDuration({
            registrationStart: fmt(regStart),
            registrationEnd: fmt(regEnd),
            competitionStart: fmt(compStart),
            competitionEnd: fmt(compEnd),
            submissionDeadline: fmt(subDeadline),
            judgingStart: fmt(judgingStart),
            judgingEnd: fmt(judgingEnd),
            resultsAnnouncement: fmt(resultsAnnounce),
            prizeClaimStart: fmt(prizeClaim),
        });
    }, []);

    const handleDurationChange = (key: keyof typeof duration, val: string) => {
        setDuration((prev) => ({ ...prev, [key]: val }));
    };

    const handlePrizeChange = (index: number, field: keyof PrizeCategory, value: string) => {
        setPrizes((prev) =>
            prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
        );
    };

    const handleCertificateChange = (index: number, file: File | null) => {
        setPrizes((prev) =>
            prev.map((item, i) =>
                i === index ? { ...item, file: file ? file.name : '', fileObj: file } : item
            )
        );
    };

    const handleParticipantCertificateChange = (file: File | null) => {
        setParticipantCertificate(file ? file.name : '');
        setParticipantCertificateFile(file);
    };

    const handleAddPrize = () => {
        const nextNum = prizes.length + 1;
        const ordinal = nextNum === 4 ? '4th' : nextNum === 5 ? '5th' : `${nextNum}th`;
        setPrizes((prev) => [
            ...prev,
            { place: `${ordinal} Place`, amount: '0', file: '', fileObj: null },
        ]);
    };

    const guidebookInputRef = useRef<HTMLInputElement>(null);

    const competitionContractAddress = (process.env.NEXT_PUBLIC_COMPETITION_CONTRACT ||
        process.env.COMPETITION_CONTRACT ||
        '0x2938eabf29e9F7ecaff7E11ca9794DFa904e78D7') as `0x${string}`;

    const explorerBaseUrl = (chain?.blockExplorers?.default?.url || 'https://scan.bohr.life').replace(/\/$/, '');

    const handleGuidebookSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            setGuidebookFile(file.name);
            setGuidebookFileObj(file);
        }
    };

    const handleRemovePrize = (index: number) => {
        if (index < INITIAL_PRIZES.length) return;
        setPrizes((prev) => prev.filter((_, i) => i !== index));
    };

    const totalPrizeAmount = prizes.reduce((acc, p) => {
        const parsed = parseFloat(p.amount.replace(/,/g, ''));
        return acc + (isNaN(parsed) ? 0 : parsed);
    }, 0);

    // --- Executing createCompetition function on CompetitionManager ---
    const handleCreateCompetition = async () => {
        setTxErrorCustom(null);

        if (!isConnected || !address) {
            setTxErrorCustom('Please connect your Web3 wallet before publishing the competition.');
            return;
        }

        if (!name.trim()) {
            setTxErrorCustom('Competition Name is required.');
            return;
        }

        if (!prizes || prizes.length === 0) {
            setTxErrorCustom('Competition must have at least one prize category/winner.');
            return;
        }

        try {
            setIsUploadingIpfs(true);

            // Upload files to Kubo IPFS to obtain CIDs
            const winnerCIDs = await Promise.all(
                prizes.map(async (p) => {
                    if (p.fileObj) {
                        return await uploadToKuboIPFS(p.fileObj);
                    }
                    return p.file || '';
                })
            );

            let participantCertCID = participantCertificate;
            if (participantCertificateFile) {
                participantCertCID = await uploadToKuboIPFS(participantCertificateFile);
            }

            let guidebookCID = guidebookFile;
            if (guidebookFileObj) {
                guidebookCID = await uploadToKuboIPFS(guidebookFileObj);
            }

            setIsUploadingIpfs(false);

            const toUnix = (dtStr: string): bigint => {
                if (!dtStr) return 0n;
                const ts = Math.floor(new Date(dtStr).getTime() / 1000);
                return isNaN(ts) ? 0n : BigInt(ts);
            };

            const nowTs = BigInt(Math.floor(Date.now() / 1000));
            const prizeClaimTs = toUnix(duration.prizeClaimStart);
            if (prizeClaimTs <= nowTs) {
                setTxErrorCustom('Prize & Certificate Claim Date must be set to a future date & time.');
                setIsUploadingIpfs(false);
                return;
            }

            const _competition = {
                id: 0n,
                name: name.trim(),
                category: category.trim(),
                description: description.trim(),
                requirements: requirements.trim(),
                formation: teamSize.trim(),
                organization: (address || '0x0000000000000000000000000000000000000000') as `0x${string}`,
                schedule: {
                    registrationWindow: toUnix(duration.registrationEnd || duration.registrationStart),
                    competitionWindow: toUnix(duration.competitionEnd || duration.competitionStart),
                    submissionDeadline: toUnix(duration.submissionDeadline),
                    judgingReview: toUnix(duration.judgingEnd || duration.judgingStart),
                    resultAnnouncement: toUnix(duration.resultsAnnouncement),
                    prizeCertificateClaim: prizeClaimTs,
                },
                certificateCID: participantCertCID || '',
                guideBookCID: guidebookCID || '',
            };

            const getTokenDecimals = async (tokenAddress: string): Promise<number> => {
                if (!tokenAddress || tokenAddress === TOKENS.BOT.address || tokenAddress === '0x0') {
                    return 18;
                }
                if (publicClient) {
                    try {
                        const dec = await publicClient.readContract({
                            address: tokenAddress as `0x${string}`,
                            abi: [
                                {
                                    constant: true,
                                    inputs: [],
                                    name: 'decimals',
                                    outputs: [{ name: '', type: 'uint8' }],
                                    payable: false,
                                    stateMutability: 'view',
                                    type: 'function',
                                },
                            ],
                            functionName: 'decimals',
                        });
                        return Number(dec);
                    } catch (e) {
                        console.warn('Could not fetch token decimals on-chain, falling back to 18:', e);
                    }
                }
                return 18;
            };

            const prizeTokenDecimals = await getTokenDecimals(selectedTokenAddress);

            const _winners = prizes.map((p, index) => {
                const rawAmount = p.amount.replace(/,/g, '').trim();
                let prizeAmountBigInt = 0n;
                try {
                    prizeAmountBigInt = parseUnits(rawAmount || '0', prizeTokenDecimals);
                } catch {
                    prizeAmountBigInt = 0n;
                }
                return {
                    id: 0n,
                    competitionId: 0n,
                    title: p.place.trim(),
                    prizeToken: (selectedTokenAddress || TOKENS.BOT.address) as `0x${string}`,
                    prizeAmount: prizeAmountBigInt,
                    certificateCID: winnerCIDs[index] || '',
                };
            });

            for (const winner of _winners) {
                if (winner.prizeAmount <= 0n) {
                    setTxErrorCustom(`Prize amount for category "${winner.title}" must be greater than 0.`);
                    setIsUploadingIpfs(false);
                    return;
                }
            }

            const feeIdBigInt = BigInt(priceCompetitionFeeId || 1);

            // Fetch platform fee configuration directly from on-chain PriceCompetitionManager
            let feeWei = 0n;
            let feeToken = feeTokenAddress;

            let priceCompetitionManagerAddress = process.env.NEXT_PUBLIC_PRICE_COMPETITION_MANAGER_CONTRACT as `0x${string}`;
            if (!priceCompetitionManagerAddress && publicClient) {
                try {
                    priceCompetitionManagerAddress = await publicClient.readContract({
                        address: getAddress(competitionContractAddress),
                        abi: CompetitionManagerABI as any,
                        functionName: 'priceCompetitionManagerContract',
                    }) as `0x${string}`;
                } catch (e) {
                    console.warn('Could not fetch priceCompetitionManagerContract address:', e);
                }
            }

            if (priceCompetitionManagerAddress && publicClient) {
                try {
                    const feeAbi = [
                        {
                            constant: true,
                            inputs: [{ name: '_priceCompetitionFeeId', type: 'uint256' }],
                            name: 'getPriceCompetitionFee',
                            outputs: [
                                {
                                    components: [
                                        { name: 'id', type: 'uint256' },
                                        { name: 'treasuryFee', type: 'uint256' },
                                        { name: 'tokenAddress', type: 'address' },
                                        { name: 'title', type: 'string' },
                                        { name: 'description', type: 'string' },
                                    ],
                                    name: '',
                                    type: 'tuple',
                                },
                            ],
                            payable: false,
                            stateMutability: 'view',
                            type: 'function',
                        },
                    ] as const;

                    const feeData = await publicClient.readContract({
                        address: priceCompetitionManagerAddress,
                        abi: feeAbi,
                        functionName: 'getPriceCompetitionFee',
                        args: [feeIdBigInt],
                    }) as { id: bigint; treasuryFee: bigint; tokenAddress: `0x${string}`; title: string; description: string };

                    if (feeData && feeData.id !== 0n) {
                        feeWei = feeData.treasuryFee;
                        feeToken = feeData.tokenAddress;
                    } else {
                        setTxErrorCustom(`Fee option ID ${feeIdBigInt.toString()} does not exist in PriceCompetitionManager.`);
                        setIsUploadingIpfs(false);
                        return;
                    }
                } catch (e) {
                    console.warn('Could not query PriceCompetitionManager on-chain fee, using API fallback:', e);
                    if (feeTreasuryAmount) {
                        try {
                            feeWei = typeof feeTreasuryAmount === 'string' && feeTreasuryAmount.includes('.')
                                ? parseEther(feeTreasuryAmount)
                                : BigInt(feeTreasuryAmount);
                        } catch {
                            feeWei = 0n;
                        }
                    }
                }
            } else if (feeTreasuryAmount) {
                try {
                    feeWei = typeof feeTreasuryAmount === 'string' && feeTreasuryAmount.includes('.')
                        ? parseEther(feeTreasuryAmount)
                        : BigInt(feeTreasuryAmount);
                } catch {
                    feeWei = 0n;
                }
            }

            const isNativePrizeToken =
                !selectedTokenAddress ||
                selectedTokenAddress === TOKENS.BOT.address ||
                selectedTokenAddress === '0x0';

            const isNativeFeeToken =
                !feeToken ||
                feeToken === TOKENS.BOT.address ||
                feeToken === '0x0';

            const totalPrizeWei = _winners.reduce((acc, w) => acc + w.prizeAmount, 0n);

            let txValue = 0n;
            if (isNativeFeeToken) {
                txValue += feeWei;
            }
            if (isNativePrizeToken) {
                txValue += totalPrizeWei;
            }

            if (txValue > 0n && publicClient) {
                try {
                    const balance = await publicClient.getBalance({ address });
                    if (balance < txValue) {
                        setTxErrorCustom(
                            `Insufficient Native Token balance. Required: ${(Number(txValue) / 1e18).toFixed(4)}, Balance: ${(Number(balance) / 1e18).toFixed(4)}`
                        );
                        setIsUploadingIpfs(false);
                        return;
                    }
                } catch (e) {
                    console.warn('Could not verify native balance:', e);
                }
            }

            // Pre-flight check: Verify prize token is listed and active on ListingTokenPrizeContract
            let listingTokenPrizeAddress = process.env.NEXT_PUBLIC_LISTING_TOKEN_PRIZE_CONTRACT as `0x${string}`;
            if (!listingTokenPrizeAddress && publicClient) {
                try {
                    listingTokenPrizeAddress = await publicClient.readContract({
                        address: getAddress(competitionContractAddress),
                        abi: CompetitionManagerABI as any,
                        functionName: 'listingTokenPrizeContract',
                    }) as `0x${string}`;
                } catch (e) {
                    console.warn('Could not fetch listingTokenPrizeContract:', e);
                }
            }

            if (listingTokenPrizeAddress && publicClient) {
                try {
                    const prizeTokenAddr = getAddress(selectedTokenAddress || TOKENS.BOT.address) as `0x${string}`;
                    const listingTokenAbi = [
                        {
                            constant: true,
                            inputs: [{ name: '_tokenAddress', type: 'address' }],
                            name: 'listingToken',
                            outputs: [
                                { name: 'id', type: 'uint256' },
                                { name: 'tokenAddress', type: 'address' },
                                { name: 'isActive', type: 'bool' },
                            ],
                            payable: false,
                            stateMutability: 'view',
                            type: 'function',
                        },
                    ] as const;

                    const tokenInfo = await publicClient.readContract({
                        address: listingTokenPrizeAddress,
                        abi: listingTokenAbi,
                        functionName: 'listingToken',
                        args: [prizeTokenAddr],
                    }) as any;

                    const listingId = Array.isArray(tokenInfo) ? BigInt(tokenInfo[0]) : (tokenInfo?.id ? BigInt(tokenInfo.id) : 0n);
                    const isPrizeActive = Array.isArray(tokenInfo) ? Boolean(tokenInfo[2]) : Boolean(tokenInfo?.isActive);
                    if (listingId === 0n) {
                        setTxErrorCustom(`Prize token (${prizeTokenAddr}) is not listed in ListingTokenPrizeContract.`);
                        setIsUploadingIpfs(false);
                        return;
                    }
                    if (!isPrizeActive) {
                        setTxErrorCustom(`Prize token (${prizeTokenAddr}) is deactivated in ListingTokenPrizeContract.`);
                        setIsUploadingIpfs(false);
                        return;
                    }
                } catch (e) {
                    console.warn('Error checking prize token listing status:', e);
                }
            }

            const erc20Abi = [
                {
                    constant: true,
                    inputs: [{ name: '_owner', type: 'address' }],
                    name: 'balanceOf',
                    outputs: [{ name: '', type: 'uint256' }],
                    payable: false,
                    stateMutability: 'view',
                    type: 'function',
                },
                {
                    constant: true,
                    inputs: [
                        { name: '_owner', type: 'address' },
                        { name: '_spender', type: 'address' },
                    ],
                    name: 'allowance',
                    outputs: [{ name: '', type: 'uint256' }],
                    payable: false,
                    stateMutability: 'view',
                    type: 'function',
                },
                {
                    constant: false,
                    inputs: [
                        { name: '_spender', type: 'address' },
                        { name: '_value', type: 'uint256' },
                    ],
                    name: 'approve',
                    outputs: [{ name: '', type: 'bool' }],
                    payable: false,
                    stateMutability: 'nonpayable',
                    type: 'function',
                },
            ] as const;

            // Check and approve ERC20 Fee Token allowance if needed
            if (!isNativeFeeToken && feeWei > 0n && publicClient) {
                let treasuryPlatformAddress = process.env.NEXT_PUBLIC_TREASURY_PLATFORM_CONTRACT as `0x${string}`;
                if (!treasuryPlatformAddress) {
                    try {
                        treasuryPlatformAddress = await publicClient.readContract({
                            address: competitionContractAddress,
                            abi: CompetitionManagerABI as any,
                            functionName: 'treasuryPlatformContract',
                        }) as `0x${string}`;
                    } catch (e) {
                        console.warn('Could not fetch treasuryPlatformContract:', e);
                    }
                }

                if (treasuryPlatformAddress) {
                    const feeTokenBalance = await publicClient.readContract({
                        address: feeTokenAddress as `0x${string}`,
                        abi: erc20Abi,
                        functionName: 'balanceOf',
                        args: [address],
                    }) as bigint;

                    if (feeTokenBalance < feeWei) {
                        setTxErrorCustom(`Insufficient Fee Token balance (${feeTokenAddress}). Required: ${feeWei.toString()}, Balance: ${feeTokenBalance.toString()}`);
                        setIsUploadingIpfs(false);
                        return;
                    }

                    const allowanceFee = await publicClient.readContract({
                        address: feeTokenAddress as `0x${string}`,
                        abi: erc20Abi,
                        functionName: 'allowance',
                        args: [address, treasuryPlatformAddress],
                    }) as bigint;

                    if (allowanceFee < feeWei) {
                        const approveFeeTx = await writeContractAsync({
                            address: feeTokenAddress as `0x${string}`,
                            abi: erc20Abi,
                            functionName: 'approve',
                            args: [treasuryPlatformAddress, feeWei],
                        });
                        if (publicClient) {
                            await publicClient.waitForTransactionReceipt({ hash: approveFeeTx });
                        }
                    }
                }
            }

            // Check and approve ERC20 Prize Token allowance if needed
            if (!isNativePrizeToken && totalPrizeWei > 0n && publicClient) {
                let treasuryPrizeAddress = process.env.NEXT_PUBLIC_TREASURY_PRIZE_CONTRACT as `0x${string}`;
                if (!treasuryPrizeAddress) {
                    try {
                        treasuryPrizeAddress = await publicClient.readContract({
                            address: competitionContractAddress,
                            abi: CompetitionManagerABI as any,
                            functionName: 'treasuryPrizeContract',
                        }) as `0x${string}`;
                    } catch (e) {
                        console.warn('Could not fetch treasuryPrizeContract:', e);
                    }
                }

                if (treasuryPrizeAddress) {
                    const prizeTokenBalance = await publicClient.readContract({
                        address: selectedTokenAddress as `0x${string}`,
                        abi: erc20Abi,
                        functionName: 'balanceOf',
                        args: [address],
                    }) as bigint;

                    if (prizeTokenBalance < totalPrizeWei) {
                        setTxErrorCustom(`Insufficient Prize Token balance (${selectedTokenAddress}). Required: ${totalPrizeWei.toString()}, Balance: ${prizeTokenBalance.toString()}`);
                        setIsUploadingIpfs(false);
                        return;
                    }

                    const allowancePrize = await publicClient.readContract({
                        address: selectedTokenAddress as `0x${string}`,
                        abi: erc20Abi,
                        functionName: 'allowance',
                        args: [address, treasuryPrizeAddress],
                    }) as bigint;

                    if (allowancePrize < totalPrizeWei) {
                        const approvePrizeTx = await writeContractAsync({
                            address: selectedTokenAddress as `0x${string}`,
                            abi: erc20Abi,
                            functionName: 'approve',
                            args: [treasuryPrizeAddress, totalPrizeWei],
                        });
                        if (publicClient) {
                            await publicClient.waitForTransactionReceipt({ hash: approvePrizeTx });
                        }
                    }
                }
            }

            await writeContractAsync({
                address: competitionContractAddress,
                abi: CompetitionManagerABI as any,
                functionName: 'createCompetition',
                args: [_competition, _winners, feeIdBigInt],
                value: txValue,
            });
        } catch (err: any) {
            console.error('createCompetition error:', err);
            setIsUploadingIpfs(false);
            setTxErrorCustom(err?.shortMessage || err?.message || 'Failed to complete process');
        }
    };

    const isProcessing = isWritePending || isConfirming;
    const activeError = txErrorCustom || (writeError ? (writeError as any).shortMessage || writeError.message : null);
    return (
        <div className="w-full bg-[#F8F9FF] py-10 font-sans text-slate-800">
            <div className="mx-auto max-w-7xl px-5 md:px-10 flex flex-col">

                {/* HEADER HALAMAN */}
                <div className="mb-8">
                    <div className="flex items-center text-sm text-slate-500 mb-2">
                        <span>Dashboard</span>
                        <ChevronRight className="w-4 h-4 mx-1" />
                        <span className="text-blue-600 font-medium">Create Competition</span>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create Competition</h1>
                            <p className="text-slate-500 mt-1 max-w-2xl text-sm">
                                Create and publish a competition by providing the required competition information, prize details, guidebook, and payment.
                            </p>
                        </div>
                    </div>
                </div>

                {/* SECTION 1: BASIC INFORMATION */}
                <SectionCard
                    icon={<InfoIcon />}
                    title="1. Basic Information"
                    description="Provide the essential information needed to identify the competition."
                    step="STEP 01/06"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-2">Competition Name *</label>
                            <input
                                type="text"
                                className="w-full bg-white border border-slate-200/80 text-slate-700 py-2.5 px-4 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-2">Category *</label>
                            <Select value={category} onValueChange={(val) => val && setCategory(val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="AI & Autonomous Systems">AI & Autonomous Systems</SelectItem>
                                    <SelectItem value="DeFi & Financial Technology">DeFi & Financial Technology</SelectItem>
                                    <SelectItem value="Biotech & Healthcare">Biotech & Healthcare</SelectItem>
                                    <SelectItem value="Zero-Knowledge & Cryptography">Zero-Knowledge & Cryptography</SelectItem>
                                    <SelectItem value="Infrastructure & Web3">Infrastructure & Web3</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </SectionCard>

                {/* SECTION 2: DESCRIPTION */}
                <SectionCard
                    icon={<InfoIcon />}
                    title="2. Description"
                    description="Explain the competition, its challenges, and what participants are expected to do."
                    step="STEP 02/06"
                >
                    <div className="mb-6">
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Competition Description *</label>
                        <textarea
                            rows={3}
                            className="w-full bg-white border border-slate-200/80 text-slate-700 py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-2xs"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Team Member Limit *</label>
                        <div className="flex items-center space-x-6">
                            <label className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={teamSize === '1-3 member'}
                                    onChange={() => handleTeamSizeChange('1-3 member')}
                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="font-medium text-slate-700">1-3 member</span>
                            </label>
                            <label className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={teamSize === '1-5 member'}
                                    onChange={() => handleTeamSizeChange('1-5 member')}
                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="font-medium text-slate-700">1-5 member</span>
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Participant Requirements *</label>
                        <textarea
                            rows={3}
                            className="w-full bg-white border border-slate-200/80 text-slate-700 py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-2xs"
                            value={requirements}
                            onChange={(e) => setRequirements(e.target.value)}
                        />
                    </div>
                </SectionCard>

                {/* SECTION 3: DURATION */}
                <SectionCard
                    icon={<InfoIcon />}
                    title="3. Duration"
                    description="Set the competition timeline that will be displayed to participants."
                    step="STEP 03/06"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <DateCard
                            title="Registration Window"
                            icon={<CalendarIcon />}
                            startLabel="Start Date & Time"
                            startDateValue={duration.registrationStart}
                            onStartChange={(val) => handleDurationChange('registrationStart', val)}
                            endLabel="End Date & Time"
                            endDateValue={duration.registrationEnd}
                            onEndChange={(val) => handleDurationChange('registrationEnd', val)}
                        />
                        <DateCard
                            title="Competition Window"
                            icon={<CalendarIcon />}
                            startLabel="Start Date & Time"
                            startDateValue={duration.competitionStart}
                            onStartChange={(val) => handleDurationChange('competitionStart', val)}
                            endLabel="End Date & Time"
                            endDateValue={duration.competitionEnd}
                            onEndChange={(val) => handleDurationChange('competitionEnd', val)}
                        />
                        <DateCard
                            title="Submission Deadline"
                            icon={<CalendarIcon />}
                            startLabel="Final Cutoff Date & Time"
                            startDateValue={duration.submissionDeadline}
                            onStartChange={(val) => handleDurationChange('submissionDeadline', val)}
                        />
                        <DateCard
                            title="Judging & Review"
                            icon={<CalendarIcon />}
                            startLabel="Start Date & Time"
                            startDateValue={duration.judgingStart}
                            onStartChange={(val) => handleDurationChange('judgingStart', val)}
                            endLabel="End Date & Time"
                            endDateValue={duration.judgingEnd}
                            onEndChange={(val) => handleDurationChange('judgingEnd', val)}
                        />
                        <DateCard
                            title="Results Announcement"
                            icon={<CalendarIcon />}
                            startLabel="Announcement Date & Time"
                            startDateValue={duration.resultsAnnouncement}
                            onStartChange={(val) => handleDurationChange('resultsAnnouncement', val)}
                        />
                        <DateCard
                            title="Prize & Certificate Claim"
                            icon={<CalendarIcon />}
                            startLabel="Claim Start Date & Time"
                            startDateValue={duration.prizeClaimStart}
                            onStartChange={(val) => handleDurationChange('prizeClaimStart', val)}
                        />
                    </div>
                </SectionCard>

                {/* SECTION 4: PRIZE */}
                <SectionCard
                    icon={<TrophyIcon />}
                    title="4. Prize"
                    description="Define the rewards participants can receive."
                    step="STEP 04/06"
                >
                    <div className="space-y-3">
                        {prizes.map((prize, index) => {
                            const isDefaultCard = index < INITIAL_PRIZES.length;
                            return (
                                <div key={index} className="bg-[#EFF4FF] rounded-lg p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                    <div className={!isDefaultCard ? "md:col-span-4" : "md:col-span-4"}>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Prize Category Name</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white/70 focus:bg-white text-slate-700 py-2 px-3 rounded-md text-sm border border-slate-200/80 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                                            value={prize.place}
                                            onChange={(e) => handlePrizeChange(index, 'place', e.target.value)}
                                        />
                                    </div>
                                    <div className="md:col-span-4 relative">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Prize Amount</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="w-full bg-white/70 focus:bg-white text-slate-700 py-2 px-3 pr-12 rounded-md text-sm border border-slate-200/80 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                                                value={prize.amount}
                                                onChange={(e) => handlePrizeChange(index, 'amount', e.target.value)}
                                            />
                                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 text-xs font-semibold">
                                                {listingTokens.length > 1 ? (
                                                    <Select
                                                        value={selectedTokenAddress}
                                                        onValueChange={(val) => {
                                                            if (!val) return;
                                                            setSelectedTokenAddress(val);
                                                            const selectedItem = listingTokens.find((t) => t.token_address === val);
                                                            const sym = getTokenSymbol(
                                                                val,
                                                                chain?.nativeCurrency?.symbol,
                                                                selectedItem?.symbol || selectedItem?.token_symbol
                                                            );
                                                            setTokenSymbol(sym);
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-5 text-xs border-none bg-transparent p-0 text-slate-400 font-semibold focus:ring-0 shadow-none gap-0.5">
                                                            <SelectValue>{tokenSymbol}</SelectValue>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {listingTokens.map((t) => {
                                                                const sym = getTokenSymbol(
                                                                    t.token_address,
                                                                    chain?.nativeCurrency?.symbol,
                                                                    t.symbol || t.token_symbol
                                                                );
                                                                return (
                                                                    <SelectItem key={t.id} value={t.token_address}>
                                                                        {sym}
                                                                    </SelectItem>
                                                                );
                                                            })}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    tokenSymbol
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={!isDefaultCard ? "md:col-span-3" : "md:col-span-4"}>
                                        <CertificateFileInput
                                            fileName={prize.file}
                                            onFileChange={(file) => handleCertificateChange(index, file)}
                                            accept="image/*"
                                        />
                                    </div>
                                    {!isDefaultCard && (
                                        <div className="md:col-span-1 flex justify-end items-center pt-2 md:pt-4">
                                            <button
                                                type="button"
                                                onClick={() => handleRemovePrize(index)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                                title="Remove Prize Category"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={handleAddPrize}
                        className="flex items-center space-x-2 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/60 hover:bg-blue-50 border border-blue-200 px-4 py-2.5 rounded-lg transition-colors mt-4"
                    >
                        <PlusIcon />
                        <span>Add Prize Category</span>
                    </button>

                    <div className="mt-6 pt-5 border-t border-slate-200/80">
                        <div className="bg-[#EFF4FF] rounded-lg p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                            <div className="md:col-span-8">
                                <h4 className="text-sm font-bold text-slate-800">Participant Certificate</h4>
                                <p className="text-xs text-slate-500 mt-0.5">Upload an image certificate awarded to all registered participants.</p>
                            </div>
                            <div className="md:col-span-4">
                                <CertificateFileInput
                                    fileName={participantCertificate}
                                    onFileChange={handleParticipantCertificateChange}
                                    label="Participant Certificate Image"
                                    accept="image/*"
                                />
                            </div>
                        </div>
                    </div>
                </SectionCard>

                <SectionCard
                    icon={<BookIcon />}
                    title="5. Guidebook"
                    description="Provide participants with detailed competition guidelines and requirements."
                    step="STEP 05/06"
                >
                    <input
                        type="file"
                        ref={guidebookInputRef}
                        onChange={handleGuidebookSelect}
                        accept=".pdf,.md,.doc,.docx"
                        className="hidden"
                    />

                    <div
                        onClick={() => guidebookInputRef.current?.click()}
                        className="bg-[#EFF4FF] rounded-xl p-8 flex flex-col items-center justify-center text-center mb-4 cursor-pointer hover:bg-blue-50/70 border border-dashed border-blue-200 transition-colors"
                    >
                        <div className="bg-white p-3 rounded-full mb-3 shadow-xs">
                            <UploadIcon />
                        </div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-1">Upload Guidebook</h4>
                        <p className="text-xs text-slate-500 mb-2">Drag & drop PDF or document file or browse</p>
                        <span className="text-xs font-semibold text-blue-600">Browse Local Files</span>
                    </div>

                    {guidebookFile && (
                        <div className="flex items-center justify-between bg-[#EFF4FF] rounded-lg p-3.5 border border-blue-100">
                            <div className="flex items-center space-x-3">
                                <div className="bg-red-500 text-white p-1.5 rounded text-[10px] font-bold tracking-wider">DOC</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700">{guidebookFile}</p>
                                    <p className="text-[10px] text-green-600 font-medium">Selected for upload</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3 text-slate-400">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setGuidebookFile('');
                                        setGuidebookFileObj(null);
                                    }}
                                    className="hover:text-red-500 text-sm font-bold px-1"
                                    title="Remove file"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    )}
                </SectionCard>

                {/* SECTION 6: PAYMENT & PUBLISH */}
                <SectionCard
                    icon={<CreditCardIcon />}
                    title="6. Payment & Fee Configuration"
                    description="Configure pricing fee tier and confirm prize pool payment before publishing on-chain."
                    step="STEP 06/06"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {/* Total Prize */}
                        <div className="bg-[#EFF4FF] rounded-lg p-5 flex flex-col justify-center border border-blue-100">
                            <p className="text-xs font-semibold text-slate-500 mb-1">Total Prize Pool</p>
                            <div className="flex items-end space-x-1.5 mb-2">
                                <span className="text-2xl font-bold text-slate-800">{totalPrizeAmount.toLocaleString()}</span>
                                <span className="text-xs font-semibold text-slate-600 mb-1">{tokenSymbol}</span>
                            </div>
                            <p className="text-[10px] text-slate-500">Calculated across {prizes.length} prize {prizes.length === 1 ? 'pool' : 'pools'}</p>
                        </div>

                        {/* Fee Competition */}
                        <div className="bg-[#EFF4FF] rounded-lg p-5 border border-blue-100 flex flex-col justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 mb-2">Fee Competition</p>
                                <div className="text-sm font-semibold text-slate-800">
                                    {isLoadingPriceComp ? (
                                        <span className="text-slate-400 font-normal">Loading...</span>
                                    ) : feeCompetitionTitle ? (
                                        <span className="text-blue-600 font-semibold">{feeCompetitionTitle}</span>
                                    ) : (
                                        <span className="text-slate-500 text-xs">Standard Price Competition</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Contract Address Competition */}
                        <div className="bg-[#EFF4FF] rounded-lg p-5 flex flex-col justify-between border border-blue-100">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 mb-2">Contract Address Competition</p>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs font-mono font-semibold text-slate-700 break-all">
                                        {competitionContractAddress}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TRANSACTION STATUS FEEDBACK */}
                    {activeError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start space-x-2">
                            <span className="font-bold">Error:</span>
                            <span className="break-all">{activeError}</span>
                        </div>
                    )}

                    {isProcessing && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center space-x-3">
                            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>
                                {isUploadingIpfs
                                    ? 'Uploading certificate and guidebook files to Kubo IPFS (http://127.0.0.1:5001/api/v0/add)...'
                                    : isWritePending
                                        ? 'Awaiting transaction signature in wallet...'
                                        : 'Transaction submitted! Waiting for block confirmation...'}
                            </span>
                        </div>
                    )}

                    {isSuccess && txHash && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm space-y-2">
                            <div className="font-bold flex items-center space-x-2">
                                <span>✓ Competition Successfully Created On-Chain!</span>
                            </div>
                            <div className="text-xs">
                                Transaction Hash: <span className="font-mono">{txHash}</span>
                            </div>
                            <div>
                                <a
                                    href={`${explorerBaseUrl}/tx/${txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                                >
                                    View Transaction Receipt on Block Explorer →
                                </a>
                            </div>
                        </div>
                    )}

                    {/* SUBMIT BUTTON */}
                    <div className="pt-4 border-t border-slate-200/80 flex justify-end">
                        <button
                            type="button"
                            onClick={handleCreateCompetition}
                            disabled={isProcessing}
                            className={`px-8 py-3.5 rounded-lg text-sm font-semibold text-white transition-all shadow-md ${isProcessing
                                ? 'bg-blue-300 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-98'
                                }`}
                        >
                            {isUploadingIpfs
                                ? 'Uploading Files to IPFS...'
                                : isProcessing
                                    ? 'Processing Transaction...'
                                    : 'Publish Competition On-Chain'}
                        </button>
                    </div>
                </SectionCard>

                {/* END FORM SECTIONS */}
            </div>
        </div>
    );
}