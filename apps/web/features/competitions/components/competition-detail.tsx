'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAccount, useChainId } from 'wagmi';
import {
  fetchApiCompetitionById,
  fetchTokenPrizeByCompetitionId,
  fetchApiMe,
  getStoredToken,
  formatTokenPrize,
  getTokenSymbol,
  fetchCompetitionById,
  mapApiCompetitionToCompetition,
} from '@/lib/competitions-api';
import { useDynamicTokenInfo } from '@/lib/hooks/use-dynamic-token';
import { useCompetitionTokenPrize } from '@/lib/hooks/use-competition-token-prize';
import { convertTokenOnChain } from '@/lib/token-convert';
import { zeroAddress } from 'viem';
import type { Competition } from '../types';
import { getPrizeTotal } from '../lib/competition-selectors';
import { PageContainer } from "@/components/ui/page-primitives";
import { NotFoundUI } from "@/components/ui/not-found-ui";
import { formatMoney } from "@/lib/format";
import { notFound } from "next/navigation";
import { Loader2 } from "lucide-react";
import { OrganizationCompetitionDetailView } from "./organization-competition-detail-view";
import { UserCompetitionDetailView } from "./user-competition-detail-view";

interface CompetitionDetailProps {
  competition?: Competition;
  slug?: string;
  id?: string;
  viewMode?: "user" | "organization" | "auto";
}

export function CompetitionDetail({
  competition: initialCompetition,
  slug,
  id,
  viewMode = "auto",
}: CompetitionDetailProps) {
  const chainId = useChainId()
  const router = useRouter();
  const { isConnected } = useAccount();
  const competitionId = id || slug || initialCompetition?.id || initialCompetition?.slug || "";

  const [storedToken, setStoredToken] = useState<string | null>(null);
  const [hasCheckedToken, setHasCheckedToken] = useState(false);

  useEffect(() => {
    setStoredToken(getStoredToken());
    setHasCheckedToken(true);
  }, []);

  const { chain } = useAccount();
  const connectedNativeSymbol = chain?.nativeCurrency?.symbol;

  const { data: meUser, isLoading: isLoadingMe } = useQuery({
    queryKey: ["user-me", storedToken],
    queryFn: () => fetchApiMe(storedToken || getStoredToken()),
    enabled: Boolean(storedToken),
  });

  const { data: apiCompetition, isLoading: isLoadingApi } = useQuery({
    queryKey: ["competition", chainId, competitionId],
    queryFn: () => fetchApiCompetitionById(chainId, competitionId),
    enabled: Boolean(competitionId),
  });

  const targetApiId = apiCompetition?.id || competitionId;

  const { data: fetchedUserCompetition } = useQuery({
    queryKey: ["user-competition-domain", chainId, competitionId],
    queryFn: async () => {
      if (initialCompetition) return initialCompetition;
      if (apiCompetition) return mapApiCompetitionToCompetition(apiCompetition);
      if (competitionId) return (await fetchCompetitionById(chainId, competitionId)) || undefined;
      return undefined;
    },
    enabled: Boolean(competitionId && !initialCompetition),
  });

  const onchainCompId = apiCompetition?.competition_id || initialCompetition?.onchainCompetitionId || fetchedUserCompetition?.onchainCompetitionId;

  const { data: tokenPrizeData, isLoading: isLoadingTokenPrize } = useCompetitionTokenPrize(onchainCompId);

  const effectiveCompetition: Competition | undefined = useMemo(() => {
    if (apiCompetition) {
      return mapApiCompetitionToCompetition(apiCompetition);
    }
    if (apiCompetition === null && !isLoadingApi) {
      return undefined;
    }

    return initialCompetition || fetchedUserCompetition;
  }, [apiCompetition, initialCompetition, fetchedUserCompetition]);

  const deposit = apiCompetition?.prize_deposits?.[0] ?? effectiveCompetition?.prizeDeposits?.[0] ?? null;

  const depositAmountRaw =
    deposit?.amount !== undefined && deposit?.amount !== null && String(deposit.amount).trim() !== ""
      ? String(deposit.amount).trim()
      : tokenPrizeData?.total_prize !== undefined && tokenPrizeData?.total_prize !== null && String(tokenPrizeData.total_prize).trim() !== ""
        ? String(tokenPrizeData.total_prize).trim()
        : null;

  const depositTokenAddress =
    (deposit?.token_address && String(deposit.token_address).trim() ? String(deposit.token_address).trim() : null) ||
    (tokenPrizeData?.token_address && String(tokenPrizeData.token_address).trim() ? String(tokenPrizeData.token_address).trim() : null) ||
    (apiCompetition?.fee_token_address && String(apiCompetition.fee_token_address).trim() ? String(apiCompetition.fee_token_address).trim() : null) ||
    (effectiveCompetition?.fee_token_address && String(effectiveCompetition.fee_token_address).trim() ? String(effectiveCompetition.fee_token_address).trim() : null) ||
    null;

  const hasDepositRaw = Boolean(depositAmountRaw && depositAmountRaw !== "0");

  const { decimals, symbol: dynamicSymbol, isLoading: isLoadingDynamic } = useDynamicTokenInfo(depositTokenAddress);

  const { data: convertedPrize, isLoading: isLoadingConverted } = useQuery({
    queryKey: ["convert-org-detail-prize", depositTokenAddress ?? zeroAddress, depositAmountRaw],
    queryFn: async () => {
      if (!depositAmountRaw) return null;
      const addr = depositTokenAddress || zeroAddress;
      return await convertTokenOnChain(addr, depositAmountRaw);
    },
    enabled: Boolean(depositAmountRaw),
    staleTime: 60_000,
  });

  const isOwner = Boolean(
    apiCompetition?.user_id &&
    meUser?.id &&
    apiCompetition.user_id === meUser.id
  );

  const isOrganizationRole = Boolean(
    isConnected &&
    storedToken &&
    (meUser?.role === "organization" ||
     meUser?.role === "organizer" ||
     isOwner)
  );

  const guidebookCid = apiCompetition?.guidebook_cid || effectiveCompetition?.guidebookUrl;
  const ipfsGatewayUrl = (process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL || "http://localhost:8081/ipfs").replace(/\/$/, "");
  const guidebookUrl = guidebookCid
    ? guidebookCid.startsWith("http://") || guidebookCid.startsWith("https://")
      ? guidebookCid
      : `${ipfsGatewayUrl}/${guidebookCid.replace(/^ipfs:\/\//, "")}`
    : null;

  const prizePoolDisplay = useMemo(() => {
    const isLoadingAny = (hasDepositRaw && (isLoadingConverted || isLoadingDynamic)) || (!hasDepositRaw && isLoadingTokenPrize);
    if (isLoadingAny) return "Loading...";

    if (convertedPrize) {
      return `${convertedPrize.convertedAmount} ${convertedPrize.symbol}`;
    }

    if (depositAmountRaw) {
      return formatTokenPrize(
        depositAmountRaw,
        depositTokenAddress,
        connectedNativeSymbol,
        decimals,
        dynamicSymbol || (tokenPrizeData as any)?.token_symbol || (tokenPrizeData as any)?.symbol || undefined
      );
    }

    if (effectiveCompetition) {
      return formatMoney(getPrizeTotal(effectiveCompetition));
    }
    return `75,000 ${getTokenSymbol(null, connectedNativeSymbol)}`;
  }, [
    hasDepositRaw,
    isLoadingConverted,
    isLoadingDynamic,
    isLoadingTokenPrize,
    convertedPrize,
    depositAmountRaw,
    depositTokenAddress,
    connectedNativeSymbol,
    decimals,
    dynamicSymbol,
    tokenPrizeData,
    effectiveCompetition,
  ]);

  const showOrgView = viewMode === "organization" || (viewMode === "auto" && isOrganizationRole);

  if (!isLoadingApi && !effectiveCompetition) {
    return <NotFoundUI />;
  }

  return (
    <div className="w-full">
      {showOrgView ? (
        <OrganizationCompetitionDetailView
          id={competitionId}
          apiCompetition={apiCompetition}
          effectiveCompetition={effectiveCompetition}
          isLoading={isLoadingApi}
          isOwner={isOwner}
          prizePoolDisplay={prizePoolDisplay}
          guidebookUrl={guidebookUrl}
        />
      ) : effectiveCompetition ? (
        <UserCompetitionDetailView
          competition={effectiveCompetition}
          guidebookUrl={guidebookUrl}
        />
      ) : (
        <PageContainer>
          <div className="py-20 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
            <p>Loading competition details...</p>
          </div>
        </PageContainer>
      )}
    </div>
  );
}
