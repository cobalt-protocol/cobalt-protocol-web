import React from 'react';
import { ChevronRight } from 'lucide-react';

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
const ChevronDownIcon = () => (
    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
);
const UploadIcon = () => (
    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
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

// --- KOMPONEN KECIL UNTUK DATE CARD ---
interface DateCardProps {
    title: string;
    startLabel: string;
    startDate: string;
    endLabel: string;
    endDate: string;
    icon: React.ReactNode;
}

const DateCard = ({ title, startLabel, startDate, endLabel, endDate, icon }: DateCardProps) => (
    <div className="bg-[#EFF4FF] rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
            {icon}
            <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
        </div>
        <div className="flex justify-between text-xs">
            <div>
                <p className="text-slate-400 mb-1 font-medium">{startLabel}</p>
                <p className="text-slate-700 font-semibold">{startDate}</p>
            </div>
            <div className="text-right">
                <p className="text-slate-400 mb-1 font-medium">{endLabel}</p>
                <p className="text-slate-700 font-semibold">{endDate}</p>
            </div>
        </div>
    </div>
);

// --- KOMPONEN UTAMA ---
export default function CreateCompetition() {
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
                        <div className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-md flex items-center">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            Draft #CP-4091
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
                            <input type="text" className="w-full bg-transparent text-slate-700 py-2.5 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" defaultValue="Autonomous Agents Global Hackathon 2025" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-2">Category *</label>
                            <div className="relative">
                                <select className="w-full appearance-none bg-transparent text-slate-700 py-2.5 px-4 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option>AI & Autonomous Systems</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3"><ChevronDownIcon /></div>
                            </div>
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
                        <textarea rows={3} className="w-full bg-transparent text-slate-700 py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" defaultValue="The Autonomous Agents Global Hackathon 2025 invites world-class AI engineers, cryptography researchers, and smart-contract developers to architect, stress-test, and deploy production-ready autonomous agent clusters. Teams will build verifiable execution runtimes leveraging zero-knowledge proofs and decentralized identity primitives."></textarea>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Participant Requirements *</label>
                        <textarea rows={3} className="w-full bg-transparent text-slate-700 py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" defaultValue="- Teams of 1 to 5 members are permitted.&#10;- Open-source codebase with permissive MIT or Apache 2.0 licensing.&#10;- Must provide functional public GitHub repository with reproducible test suites.&#10;- Use of local wallet architecture is not mandatory; however, it is highly recommended."></textarea>
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
                        <DateCard title="Registration Window" icon={<CalendarIcon />} startLabel="START DATE" startDate="04/01/2025, 09:00" endLabel="END DATE" endDate="04/20/2025, 11:59 PM" />
                        <DateCard title="Competition Window" icon={<CalendarIcon />} startLabel="START DATE" startDate="04/22/2025, 12:01" endLabel="END DATE" endDate="05/16/2025, 11:59 PM" />
                        <DateCard title="Submission Deadline" icon={<CalendarIcon />} startLabel="FINAL CUTOFF DATE" startDate="-" endLabel="" endDate="05/16/2025, 11:59 PM" />
                        <DateCard title="Judging & Review" icon={<CalendarIcon />} startLabel="START DATE" startDate="05/16/2025, 09:00" endLabel="END DATE" endDate="05/22/2025, 06:00" />
                        <DateCard title="Results Announcement" icon={<CalendarIcon />} startLabel="ANNOUNCEMENT DATE" startDate="05/24/2025, 03:00 PM" endLabel="" endDate="" />
                        <DateCard title="Prize & Certificate Claim" icon={<CalendarIcon />} startLabel="CLAIM START DATE" startDate="05/25/2025, 10:00 AM" endLabel="" endDate="" />
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
                        {[
                            { place: '1st Place Champion', amount: '35,000', file: 'Upload1.pdf' },
                            { place: '2nd Place', amount: '20,000', file: 'Upload2.pdf' },
                            { place: '3rd Place', amount: '10,000', file: 'Upload3.pdf' },
                            { place: 'Participant', amount: '0', file: 'Upload4.pdf' },
                        ].map((prize, index) => (
                            <div key={index} className="bg-[#EFF4FF] rounded-lg p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                <div className="md:col-span-4">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Prize Category Name</label>
                                    <input type="text" className="w-full bg-transparent text-slate-700 py-2 px-3 rounded-md text-sm" defaultValue={prize.place} readOnly />
                                </div>
                                <div className="md:col-span-4 relative">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Prize Amount</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 text-sm">$</span>
                                        <input type="text" className="w-full bg-transparent text-slate-700 py-2 pl-7 pr-12 rounded-md text-sm" defaultValue={prize.amount} readOnly />
                                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 text-xs">USDC</span>
                                    </div>
                                </div>
                                <div className="md:col-span-4">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Certificate Template</label>
                                    <div className="flex items-center justify-between bg-transparent py-2 px-3 rounded-md text-sm text-blue-600">
                                        <div className="flex items-center space-x-2">
                                            <UploadIcon />
                                            <span className="text-xs font-medium">{prize.file}</span>
                                        </div>
                                        <button className="text-gray-400 hover:text-red-500">×</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>

                {/* SECTION 5: GUIDEBOOK */}
                <SectionCard
                    icon={<BookIcon />}
                    title="5. Guidebook"
                    description="Provide participants with detailed competition guidelines and requirements."
                    step="STEP 05/06"
                >

                    <div className="bg-[#EFF4FF] rounded-xl p-10 flex flex-col items-center justify-center text-center mb-4 cursor-pointer hover:bg-blue-50/50 transition-colors">
                        <div className="bg-white p-3 rounded-full mb-4">
                            <UploadIcon />
                        </div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-1">Upload Guidebook</h4>
                        <p className="text-xs text-slate-500 mb-3">Drag & drop PDF, Markdown file or browse</p>
                        <span className="text-xs font-semibold text-blue-600">Browse Local Files</span>
                    </div>

                    <div className="flex items-center justify-between bg-[#EFF4FF] rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                            <div className="bg-red-100 p-1.5 rounded text-red-500 text-[10px] font-bold">PDF</div>
                            <div>
                                <p className="text-sm font-semibold text-slate-700">Official_Hackathon_Guidebook_v2.4.pdf (4.2 MB)</p>
                                <p className="text-[10px] text-slate-500">Uploaded successfully</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 text-gray-400">
                            <button className="hover:text-slate-600">👁</button>
                            <button className="hover:text-red-500">×</button>
                        </div>
                    </div>
                </SectionCard>

                {/* SECTION 6: PAYMENT */}
                <SectionCard
                    icon={<CreditCardIcon />}
                    title="6. Payment"
                    description="Secure the competition prize before the competition is published."
                    step="STEP 06/06"
                >

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Total Prize */}
                        <div className="bg-[#EFF4FF] rounded-lg p-5 flex flex-col justify-center">
                            <p className="text-xs font-semibold text-slate-500 mb-1">Total Prize Amount</p>
                            <div className="flex items-end space-x-1 mb-2">
                                <span className="text-2xl font-bold text-slate-800">$75,000</span>
                                <span className="text-xs font-semibold text-slate-500 mb-1">USDC</span>
                            </div>
                            <p className="text-[10px] text-slate-400">Calculated across 4 prize pools</p>
                        </div>

                        {/* Wallet Info */}
                        <div className="bg-[#EFF4FF] rounded-lg p-5">
                            <p className="text-xs font-semibold text-slate-500 mb-2">Wallet / Payment Information</p>
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm font-medium text-slate-700">Connected Multi-Sig Wallet</span>
                            </div>
                            <p className="text-[10px] text-slate-500 ml-4">• Arbitrum Escrow Vault v2.1</p>
                        </div>

                        {/* Payment Status */}
                        <div className="bg-[#EFF4FF] rounded-lg p-5 flex flex-col justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 mb-2">Payment Status</p>
                                <div className="flex space-x-2 mb-2">
                                    <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded">Unpaid / Pending</span>
                                    <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded">Escrowed</span>
                                </div>
                                <p className="text-[10px] text-slate-500 mb-4">Prize funds must be transferred to the verifiable on-chain vault prior to network publishing.</p>
                            </div>
                            <button className="w-full bg-[#2563EB] text-white text-xs font-semibold py-2 rounded-md hover:bg-blue-700 transition-colors">
                                Secure Prize / Make Payment
                            </button>
                        </div>
                    </div>
                </SectionCard>

                {/* FOOTER ACTION BAR */}
                <div className="bg-white rounded-xl p-6 flex flex-col gap-4 mt-8">
                    <div className="flex items-center text-xs text-slate-500">
                        <InfoIcon />
                        <span className="ml-2">Once published, competition information cannot be edited. Please review all details before confirming.</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                        <button className="w-full sm:w-auto text-slate-600 font-medium text-sm py-2 px-6 rounded-lg hover:bg-gray-50 transition-colors text-left sm:text-center">
                            Cancel
                        </button>
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                            <button className="w-full sm:w-auto bg-white text-slate-600 font-medium text-sm py-2 px-6 rounded-lg hover:bg-gray-50 transition-colors">
                                Save Draft
                            </button>
                            <button className="w-full sm:w-auto bg-[#2563EB] text-white font-medium text-sm py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
                                Confirm & Publish
                                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}