'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
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
import type { Competition } from '../types';
import { getPrizeTotal } from '../lib/competition-selectors';
import { PageContainer } from "@/components/ui/page-primitives";
import { formatMoney } from "@/lib/format";
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
    queryKey: ["competition", competitionId],
    queryFn: () => fetchApiCompetitionById(competitionId),
    enabled: Boolean(competitionId),
  });

  const targetApiId = apiCompetition?.id || competitionId;

  const { data: tokenPrizeData, isLoading: isLoadingTokenPrize } = useQuery({
    queryKey: ["competition-token-prize", targetApiId],
    queryFn: () => fetchTokenPrizeByCompetitionId(targetApiId),
    enabled: Boolean(targetApiId),
  });

  const { data: fetchedUserCompetition } = useQuery({
    queryKey: ["user-competition-domain", competitionId],
    queryFn: async () => {
      if (initialCompetition) return initialCompetition;
      if (apiCompetition) return mapApiCompetitionToCompetition(apiCompetition);
      if (competitionId) return (await fetchCompetitionById(competitionId)) || undefined;
      return undefined;
    },
    enabled: Boolean(competitionId && !initialCompetition),
  });

  const effectiveCompetition: Competition | undefined = useMemo(() => {
    if (apiCompetition) {
      return mapApiCompetitionToCompetition(apiCompetition);
    }
    return initialCompetition || fetchedUserCompetition;
  }, [apiCompetition, initialCompetition, fetchedUserCompetition]);

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
    if (isLoadingTokenPrize) return "Loading...";
    if (tokenPrizeData && tokenPrizeData.total_prize !== undefined && tokenPrizeData.total_prize !== null) {
      return formatTokenPrize(
        tokenPrizeData.total_prize,
        tokenPrizeData.token_address,
        connectedNativeSymbol,
        18,
        (tokenPrizeData.token_symbol || tokenPrizeData.symbol) ?? undefined
      );
    }
    if (effectiveCompetition) {
      return formatMoney(getPrizeTotal(effectiveCompetition));
    }
    return `75,000 ${getTokenSymbol(null, connectedNativeSymbol)}`;
  }, [tokenPrizeData, isLoadingTokenPrize, connectedNativeSymbol, effectiveCompetition]);

  const showOrgView = viewMode === "organization" || (viewMode === "auto" && isOrganizationRole);

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
