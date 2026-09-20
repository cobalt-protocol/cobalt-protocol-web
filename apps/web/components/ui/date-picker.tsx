'use client';

import * as React from 'react';
import { format, parseISO, isValid, setHours, setMinutes } from 'date-fns';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@workspace/ui/components/popover';
import { cn } from '@workspace/ui/lib/utils';

export function DateTimePicker({
    value,
    onChange,
    placeholder = 'Pick date and time',
    className,
}: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
}) {
    const [open, setOpen] = React.useState(false);

    const date = React.useMemo(() => {
        if (!value) return new Date();
        const parsed = parseISO(value);
        return isValid(parsed) ? parsed : new Date();
    }, [value]);

    const [viewDate, setViewDate] = React.useState<Date>(date);

    React.useEffect(() => {
        if (open) setViewDate(date);
    }, [open, date]);

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    const handleDateSelect = (selectedDay: Date) => {
        const updated = setMinutes(setHours(selectedDay, date.getHours()), date.getMinutes());
        onChange(format(updated, "yyyy-MM-dd'T'HH:mm"));
    };

    const handleTimeChange = (h: number, m: number) => {
        const updated = setMinutes(setHours(date, h), m);
        onChange(format(updated, "yyyy-MM-dd'T'HH:mm"));
    };

    const currentMonth = viewDate.getMonth();
    const currentYear = viewDate.getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

    const calendarDays = React.useMemo(() => {
        const days: (Date | null)[] = [];
        for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
        for (let d = 1; d <= daysInMonth; d++) days.push(new Date(currentYear, currentMonth, d));
        return days;
    }, [currentYear, currentMonth, daysInMonth, firstDayOfWeek]);
    const isSelected = (d: Date | null) => d && d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                className={cn(
                    "w-full flex items-center justify-between gap-2 px-3 py-2 bg-white text-slate-800 text-xs font-medium rounded-lg border border-slate-200/80 hover:border-blue-400 hover:bg-slate-50/50 shadow-2xs transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer",
                    !value && "text-slate-400",
                    className
                )}
            >
                <div className="flex items-center space-x-2 truncate">
                    <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate">
                        {value && isValid(parseISO(value)) ? format(parseISO(value), "MMM d, yyyy 'at' HH:mm") : placeholder}
                    </span>
                </div>
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </PopoverTrigger>

            <PopoverContent align="start" className="w-[280px] p-3.5 bg-white rounded-xl shadow-xl border border-slate-200 z-50">
                <div className="flex items-center justify-between mb-2">
                    <button type="button" onClick={() => setViewDate(new Date(currentYear, currentMonth - 1, 1))} className="p-1 rounded hover:bg-slate-100 text-slate-600">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-slate-800">{monthNames[currentMonth]} {currentYear}</span>
                    <button type="button" onClick={() => setViewDate(new Date(currentYear, currentMonth + 1, 1))} className="p-1 rounded hover:bg-slate-100 text-slate-600">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400 mb-1">
                    <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-3">
                    {calendarDays.map((d, i) => (
                        !d ? <div key={i} className="h-6 w-6" /> : (
                            <button
                                key={i}
                                type="button"
                                onClick={() => handleDateSelect(d)}
                                className={cn(
                                    "h-6.5 w-6.5 text-xs rounded-full flex items-center justify-center font-medium transition-all mx-auto cursor-pointer",
                                    isSelected(d) ? "bg-blue-600 text-white font-bold" : "text-slate-700 hover:bg-slate-100"
                                )}
                            >
                                {d.getDate()}
                            </button>
                        )
                    ))}
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">Time</span>
                    <div className="flex items-center space-x-1">
                        <input
                            type="number"
                            min={0}
                            max={23}
                            value={hours}
                            onChange={(e) => handleTimeChange(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)), parseInt(minutes))}
                            className="w-10 text-center bg-slate-50 border border-slate-200 rounded py-0.5 text-xs text-slate-800 font-bold"
                        />
                        <span className="text-slate-400 font-bold">:</span>
                        <input
                            type="number"
                            min={0}
                            max={59}
                            value={minutes}
                            onChange={(e) => handleTimeChange(parseInt(hours), Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                            className="w-10 text-center bg-slate-50 border border-slate-200 rounded py-0.5 text-xs text-slate-800 font-bold"
                        />
                    </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px]">
                    <button type="button" onClick={() => { onChange(format(new Date(), "yyyy-MM-dd'T'HH:mm")); setOpen(false); }} className="text-blue-600 font-semibold hover:underline">
                        Set Now
                    </button>
                    <button type="button" onClick={() => setOpen(false)} className="bg-blue-600 text-white px-2.5 py-0.5 rounded font-semibold hover:bg-blue-700">
                        Done
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

