'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import {
  getTokenSymbol,
  parse18DecimalAmount,
} from '@/lib/competitions-api';
import { useDynamicTokenInfo } from '@/lib/hooks/use-dynamic-token';
import { useCompetitionTokenPrize } from '@/lib/hooks/use-competition-token-prize';
import {
  Badge,
  Breadcrumbs,
  PageContainer,
  Panel,
  SectionHeading,
} from "@/components/ui/page-primitives";
import { formatDate } from "@/lib/format";
import { routes } from "@/lib/routes";
import {
  Award,
  BookOpen,
  CalendarDays,
  Code2,
  Coins,
  ExternalLink,
  Users,
  Wifi,
} from "lucide-react";
import type { Competition } from "../types";
import { CompetitionOverview } from "./competition-overview";
import { CompetitionTimeline } from "./competition-timeline";
import { convertTokenOnChain, type ConvertTokenResult } from '@/lib/token-convert';

interface UserViewProps {
  competition: Competition;
  guidebookUrl?: string | null;
}

export function UserCompetitionDetailView({
  competition,
  guidebookUrl,
}: UserViewProps) {
  const effectiveGuidebookUrl = guidebookUrl || competition.guidebookUrl;
  const { chain } = useAccount();
  const connectedNativeSymbol = chain?.nativeCurrency?.symbol;

  const { data: tokenPrizeData } = useCompetitionTokenPrize(competition.onchainCompetitionId);

  // Same vault source as Prize vault (homepage) and Total guaranteed prize:
  // GET /api/v1/chains/<chain_id>/competitions[].prize_deposits[0] { token_address, amount }
  // on-chain decimals/symbol via useDynamicTokenInfo + convertTokenOnChain
  const vaultDeposit = (competition.prizeDeposits?.[0] ?? null) as { token_address?: string | null; amount?: string | number | null } | null
  const vaultTokenAddress: string | null =
    (vaultDeposit?.token_address && String(vaultDeposit.token_address).trim() ? String(vaultDeposit.token_address).trim() : null) ||
    (tokenPrizeData?.token_address && String(tokenPrizeData.token_address).trim() ? String(tokenPrizeData.token_address).trim() : null) ||
    (competition.fee_token_address && String(competition.fee_token_address).trim() ? String(competition.fee_token_address).trim() : null) ||
    ((competition as any).tokenAddress && String((competition as any).tokenAddress).trim() ? String((competition as any).tokenAddress).trim() : null) ||
    null

  const { symbol: dynamicSymbol, decimals, isLoading: isLoadingDynamic } = useDynamicTokenInfo(vaultTokenAddress);

  const tokenSymbol =
    dynamicSymbol ??
    ((tokenPrizeData as any)?.token_symbol || (tokenPrizeData as any)?.symbol) ??
    getTokenSymbol(vaultTokenAddress, connectedNativeSymbol) ??
    competition.currency;

  const { data: convertedPrizes } = useQuery({
    queryKey: ['prize-distribution-conversion', vaultTokenAddress, competition.prizes],
    queryFn: async () => {
      const results: Record<string, ConvertTokenResult> = {};
      const targetToken = vaultTokenAddress || "0x0000000000000000000000000000000000000000";

      await Promise.all(
        competition.prizes.map(async (prize) => {
          if (prize.rawAmount) {
            try {
              results[prize.id] = await convertTokenOnChain(targetToken, prize.rawAmount);
            } catch (err) {
              console.warn(`Failed to convert prize ${prize.id} via convertTokenOnChain:`, err);
            }
          }
        })
      );
      return results;
    },
    enabled: Boolean(competition.prizes && competition.prizes.length > 0),
    staleTime: 60_000,
  });

  const totalPrizeAmount = React.useMemo(() => {
    return competition.prizes.reduce((sum, prize) => {
      const converted = convertedPrizes?.[prize.id];
      const amount = converted
        ? Number(converted.convertedAmount)
        : prize.rawAmount && decimals !== undefined
        ? parse18DecimalAmount(prize.rawAmount, decimals)
        : prize.rawAmount && isLoadingDynamic
        ? 0
        : prize.amount;
      return sum + amount;
    }, 0);
  }, [competition.prizes, decimals, isLoadingDynamic, convertedPrizes]);

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Home", href: routes.home },
          { label: "Competitions", href: routes.competitions },
          { label: "Detail Competition" },
        ]}
      />
      <div className="space-y-5">
        <CompetitionOverview competition={competition} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              label: "Registration End",
              value: formatDate(competition.registrationEndsAt),
              caption: "Registration window",
              icon: CalendarDays,
            },
            {
              label: "Duration",
              value: `${formatDate(competition.startsAt)} – ${formatDate(competition.endsAt)}`,
              caption: "Competition period",
              icon: Code2,
            },
            {
              label: "Team Size",
              value: `1–${competition.maxTeamSize} Builders`,
              caption: "Solo or squads",
              icon: Users,
            },
            {
              label: "Competition Format",
              value: "100% Online",
              caption: "Asynchronous submissions",
              icon: Wifi,
            },
            {
              label: "Prize Currency",
              value: `${tokenSymbol} Token`,
              caption: "Arbitrum escrow",
              icon: Coins,
            },
          ].map(({ label, value, caption, icon: Icon }) => (
            <Panel key={label} className="p-4 md:p-4">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon size={15} className="text-primary" />
                {label}
              </p>
              <h2 className="mt-2 text-sm font-bold">{value}</h2>
              <p className="mt-4 text-[11px] text-muted-foreground">
                {caption}
              </p>
            </Panel>
          ))}
        </div>
        <CompetitionTimeline stages={competition.timeline} />
        <Panel>
          <SectionHeading title="Description & Requirements" />
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground/80 mb-1">
                Description
              </h3>
              <p className="text-xs leading-6 text-muted-foreground whitespace-pre-line">
                {competition.description || "No description provided."}
              </p>
            </div>
            {(competition.requirement || (competition.rules && competition.rules.length > 0)) && (
              <div>
                <h3 className="text-sm font-semibold text-foreground/80 mb-1">
                  Requirements
                </h3>
                <p className="text-xs leading-6 text-muted-foreground whitespace-pre-line">
                  {competition.requirement || competition.rules?.join("\n")}
                </p>
              </div>
            )}
          </div>
        </Panel>
        <div className="space-y-5">
          <Panel>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Competition Guidebook</h3>
                  <p className="text-xs text-muted-foreground">
                    {effectiveGuidebookUrl
                      ? "Read rules, guidelines, and submission details"
                      : "Guidebook not provided yet"}
                  </p>
                </div>
              </div>
              {effectiveGuidebookUrl ? (
                <a
                  href={effectiveGuidebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shrink-0"
                >
                  View Guidebook
                  <ExternalLink size={14} />
                </a>
              ) : (
                <button
                  disabled
                  className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-muted-foreground cursor-not-allowed shrink-0"
                >
                  Not Available
                </button>
              )}
            </div>
          </Panel>
          <Panel>
            <p className="text-[10px] font-bold text-primary uppercase">
              Organizer verification
            </p>
            <h2 className="mt-5 text-base font-bold">
              {competition.organizer}
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {competition.organizerDescription}
            </p>
          </Panel>
        </div>
        <Panel>
          <p className="mb-2 text-[10px] font-bold text-primary uppercase">
            Secured payout pool
          </p>
          <SectionHeading title="Prize Distribution" />
          <div className="space-y-3">
            {competition.prizes.map((prize, index) => {
              const converted = convertedPrizes?.[prize.id];
              const displayFormattedAmount = converted 
                ? converted.convertedAmount 
                : isLoadingDynamic && prize.rawAmount && decimals === undefined
                ? "…"
                : (prize.rawAmount && decimals !== undefined ? parse18DecimalAmount(prize.rawAmount, decimals) : prize.amount).toLocaleString("en-US", { maximumFractionDigits: 6 });
              
              const numericAmount = converted 
                ? Number(converted.convertedAmount) 
                : prize.rawAmount && decimals !== undefined
                ? parse18DecimalAmount(prize.rawAmount, decimals)
                : prize.rawAmount && isLoadingDynamic
                ? 0
                : prize.amount;
                
              const displaySymbol = converted?.symbol || tokenSymbol;
              const total = totalPrizeAmount;
              const pct = total > 0 ? Math.round((numericAmount / total) * 100) : 0;

              return (
                <div
                  key={prize.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl bg-secondary/60 p-5"
                >
                  <span className="rounded-lg bg-blue-100 p-2 text-amber-600">
                    <Award size={23} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold">
                      {prize.title} {index === 0 && <Badge>Grand Prize</Badge>}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {prize.description}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <strong className="text-xl">
                      {displayFormattedAmount}
                    </strong>
                    {total > 0 && (
                      <p className="text-[11px] font-semibold text-primary">
                        {pct}% allocation
                      </p>
                    )}
                    <p className="text-[10px] font-bold text-teal-700">
                      {displaySymbol} Escrow
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </PageContainer>
  );
}
