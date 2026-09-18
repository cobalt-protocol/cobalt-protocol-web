import React from 'react';

// Komponen Ikon SVG sederhana agar tidak perlu install library eksternal
const ChevronDownIcon = () => (
    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
    </svg>
);

const InfoIcon = () => (
    <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
);

const WarningIcon = () => (
    <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
    </svg>
);

const CheckCircleIcon = () => (
    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
);

export default function DetermineWinner() {
    // Data dummy untuk kategori
    const categories = [
        { id: 1, name: '1st Place', team: 'Team SwarmSynthetic' },
        { id: 2, name: '2nd Place', team: 'AgentZeroLabs' },
        { id: 3, name: '3rd Place', team: 'Nexus Vector' },
    ];

    return (
        <div className="w-full bg-[#F8F9FF] py-10 font-sans text-slate-800">
            <div className="mx-auto max-w-7xl px-5 md:px-10 flex flex-col">

                {/* Bagian Header Atas */}
            <div className="mb-8">
                <div className="flex items-center text-xs font-medium text-gray-500 mb-4 space-x-2">
                    <span>Dashboard</span>
                    <span>/</span>
                    <span>Competition Detail</span>
                    <span>/</span>
                    <span className="text-blue-600 font-semibold">Determine Winner</span>
                </div>

                <h1 className="text-3xl font-bold text-slate-900 mb-2">Determine Winner</h1>
                <p className="text-slate-500 text-sm">
                    Assign winning categories to participating teams and finalize the competition results.
                </p>
            </div>

            {/* Grid Layout Utama */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Kolom Kiri: Winner Selection (Mengambil 2 span kolom) */}
                <div className="lg:col-span-2 bg-white rounded-xl p-6">

                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-1">
                                Configuration Phase
                            </p>
                            <h2 className="text-xl font-bold text-slate-800">Winner Selection</h2>
                            <p className="text-sm text-slate-500 mt-1">
                                Select the winning team for each competition category.
                            </p>
                        </div>
                        <span className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                            6 Available Categories
                        </span>
                    </div>

                    <div className="space-y-4">
                        {categories.map((category) => (
                            <div key={category.id} className="bg-[#f8f9ff] rounded-lg p-5 flex flex-col md:flex-row gap-4">

                                {/* Dropdown Kategori */}
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                                        Category
                                    </label>
                                    <div className="relative">
                                        <select className="w-full appearance-none bg-white border-0 text-slate-700 py-2.5 px-4 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-none">
                                            <option>{category.name}</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                                            <ChevronDownIcon />
                                        </div>
                                    </div>
                                </div>

                                {/* Dropdown Tim */}
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                                        Assigned Winning Team
                                    </label>
                                    <div className="relative">
                                        <select className="w-full appearance-none bg-white border-0 text-slate-700 py-2.5 px-4 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-none">
                                            <option>{category.team}</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                                            <ChevronDownIcon />
                                        </div>
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>
                </div>

                {/* Kolom Kanan: Finalize & Settlement */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl p-6 sticky top-8">

                        <div className="flex items-center mb-6">
                            <InfoIcon />
                            <h3 className="text-lg font-bold text-slate-800">Finalize & Settlement</h3>
                        </div>

                        {/* Kotak Peringatan Merah */}
                        <div className="bg-[#FFF5F5] rounded-lg p-4 mb-6">
                            <div className="flex items-start">
                                <WarningIcon />
                                <div>
                                    <h4 className="text-sm font-bold text-red-700 mb-1">
                                        Irreversible Action Warning
                                    </h4>
                                    <p className="text-xs text-red-600 leading-relaxed">
                                        Once the results are finalized, the winner information cannot be edited. Please review all selections before confirming.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Informasi Apa yang Terjadi */}
                        <div className="bg-[#F8FAFC] rounded-lg p-4 mb-8">
                            <h4 className="text-xs font-bold text-slate-700 mb-2">
                                What happens after confirmation:
                            </h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                The competition results are finalized and winners are announced. Prize and certificate claims become available according to the competition timeline. Result cannot be edited.
                            </p>
                        </div>

                        {/* Tombol Aksi */}
                        <div className="flex items-center gap-3">
                            <button className="flex-1 bg-white text-slate-600 font-medium text-xs py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
                                Save Draft
                            </button>
                            <button className="flex-1 bg-[#2563EB] text-white font-medium text-xs py-2.5 px-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center whitespace-nowrap gap-1">
                                Confirm & Finalize
                                <CheckCircleIcon />
                            </button>
                        </div>

                    </div>
                </div>

            </div>
            </div>
        </div>
    );
}