'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
}

export function CompetitionDetail({
  competition: initialCompetition,
  slug,
  id,
}: CompetitionDetailProps) {
  const competitionId = id || slug || initialCompetition?.id || initialCompetition?.slug || "";

  const [storedToken, setStoredToken] = useState<string | null>(null);

  useEffect(() => {
    setStoredToken(getStoredToken());
  }, []);

  const { chain } = useAccount();
  const connectedNativeSymbol = chain?.nativeCurrency?.symbol;

  const { data: meUser } = useQuery({
    queryKey: ["user-me", storedToken],
    queryFn: () => fetchApiMe(storedToken || getStoredToken()),
    enabled: Boolean(storedToken),
  });

  const { data: apiCompetition, isLoading: isLoadingApi } = useQuery({
    queryKey: ["competition", competitionId],
    queryFn: () => fetchApiCompetitionById(competitionId),
    enabled: Boolean(competitionId),
  });

  const { data: tokenPrizeData, isLoading: isLoadingTokenPrize } = useQuery({
    queryKey: ["competition-token-prize", competitionId],
    queryFn: () => fetchTokenPrizeByCompetitionId(competitionId),
    enabled: Boolean(competitionId),
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
    meUser?.role === "organization" ||
    meUser?.role === "organizer" ||
    isOwner
  );

  const guidebookCid = apiCompetition?.guidebook_cid || effectiveCompetition?.guidebookUrl;
  const ipfsGatewayUrl = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs";
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

  return (
    <div className="w-full">
      {isOrganizationRole ? (
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
