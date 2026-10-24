"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount, useBalance, useChainId } from "wagmi";
import { formatUnits } from "viem";
import {
  ArrowLeft,
  Check,
  Copy,
  CreditCard,
  Hexagon,
  Info,
  Loader2,
  Save,
  Upload,
} from "lucide-react";
import { routes } from "@/lib/routes";
import { fetchApiMe, getStoredToken } from "@/lib/competitions-api";
import { updateOrganizationProfile } from "@/lib/profile-api";

function formatKuboGatewayUrl(cidOrUrl?: string | null): string | null {
  if (!cidOrUrl) return null;
  const trimmed = cidOrUrl.trim();
  if (!trimmed) return null;
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }
  const ipfsGatewayUrl = (
    process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL || "http://localhost:8081/ipfs"
  ).replace(/\/$/, "");
  return `${ipfsGatewayUrl}/${trimmed.replace(/^ipfs:\/\//, "")}`;
}

async function uploadLogoToKuboIPFS(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/ipfs", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => null);
    throw new Error(
      errJson?.error || `Failed to upload logo to Kubo IPFS (${res.status})`
    );
  }

  const data = await res.json();
  const cid: string = data.cid || data.hash || data.Hash || "";
  if (!cid) {
    throw new Error("Kubo IPFS returned an empty CID");
  }
  return cid;
}

function shortenAddress(addr?: string | null): string {
  if (!addr || addr.length < 10) return "0x3aF2...9c4D";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function OrganizationProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const chainId = useChainId();
  const { address, isConnected, status: accountStatus, chain } = useAccount();
  const { data: balanceData } = useBalance({
    address,
    query: { enabled: Boolean(address) },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [storedToken, setStoredToken] = useState<string | null>(null);
  const [hasCheckedToken, setHasCheckedToken] = useState(false);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    setStoredToken(getStoredToken());
    setHasCheckedToken(true);
  }, []);

  const isWagmiLoading =
    accountStatus === "connecting" || accountStatus === "reconnecting";
  const token = storedToken || getStoredToken();
  const isUnauthenticated =
    hasCheckedToken && !isWagmiLoading && !isConnected && !token;

  useEffect(() => {
    if (isUnauthenticated) {
      router.replace(routes.home);
    }
  }, [isUnauthenticated, router]);

  const { data: meUser, isLoading: isLoadingMe } = useQuery({
    queryKey: ["user-me", storedToken],
    queryFn: () => fetchApiMe(storedToken || getStoredToken()),
    enabled: Boolean(storedToken),
  });

  useEffect(() => {
    if (!meUser) return;
    const org = (meUser as any)?.organization;
    if (org) {
      if (typeof org.name === "string") setName(org.name.slice(0, 100));
      if (typeof org.description === "string")
        setDescription(org.description.slice(0, 500));
      if (typeof org.avatar_url === "string" && org.avatar_url) {
        setAvatarUrl(org.avatar_url);
        const resolvedUrl =
          formatKuboGatewayUrl(org.avatar_url) || org.avatar_url;
        setLogoPreview(resolvedUrl);
      }
    }
  }, [meUser]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setStatusMessage({
        type: "error",
        text: "Logo file size must not exceed 2MB.",
      });
      return;
    }

    setStatusMessage(null);
    setLogoFile(file);
    const localUrl = URL.createObjectURL(file);
    setLogoPreview(localUrl);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const trimmedName = name.trim();
    const trimmedDesc = description.trim();

    if (!trimmedName) {
      setStatusMessage({
        type: "error",
        text: "Organization Name is required.",
      });
      return;
    }

    if (!trimmedDesc) {
      setStatusMessage({
        type: "error",
        text: "Short Description is required.",
      });
      return;
    }

    const token = storedToken || getStoredToken();
    if (!token) {
      setStatusMessage({
        type: "error",
        text: "Please connect your wallet and sign in first.",
      });
      return;
    }

    setIsSaving(true);
    try {
      let finalAvatarUrl = avatarUrl;

      // Upload logo file to Kubo IPFS first to obtain CID, then format as Kubo gateway URL
      if (logoFile) {
        setIsUploadingLogo(true);
        try {
          const cid = await uploadLogoToKuboIPFS(logoFile);
          const kuboUrl = formatKuboGatewayUrl(cid);
          if (kuboUrl) {
            finalAvatarUrl = kuboUrl;
            setAvatarUrl(kuboUrl);
            setLogoPreview(kuboUrl);
          }
        } finally {
          setIsUploadingLogo(false);
        }
      }

      await updateOrganizationProfile(
        token,
        {
          name: trimmedName,
          description: trimmedDesc,
          avatar_url: finalAvatarUrl,
        },
        chainId
      );
      setLogoFile(null);
      await queryClient.invalidateQueries({ queryKey: ["user-me"] });
      setStatusMessage({
        type: "success",
        text: "Organization profile saved successfully!",
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to save organization profile.",
      });
    } finally {
      setIsSaving(false);
      setIsUploadingLogo(false);
    }
  };

  const walletAddressToCopy =
    address || (meUser as any)?.wallet_address || "0x3aF2...9c4D";

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddressToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const tokenSymbol =
    balanceData?.symbol || chain?.nativeCurrency?.symbol || "USDC";
  const rawFormattedBalance = balanceData
    ? Number(formatUnits(balanceData.value, balanceData.decimals))
    : null;
  const formattedBalanceDisplay =
    rawFormattedBalance !== null && !Number.isNaN(rawFormattedBalance)
      ? `${rawFormattedBalance.toLocaleString("en-US", {
          maximumFractionDigits: 4,
        })} ${tokenSymbol}`
      : "1,250 USDC";

  const idrEquivalentDisplay =
    rawFormattedBalance !== null && !Number.isNaN(rawFormattedBalance)
      ? `≈ Rp ${Math.round(rawFormattedBalance * 16200).toLocaleString("id-ID")}`
      : "≈ Rp 20.250.000";

  const networkName = chain?.name || "Base";

  if (isUnauthenticated) {
    return null;
  }

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-[#F8F9FF] py-8 md:py-10 font-sans text-slate-800">
      <div className="mx-auto max-w-6xl px-5 md:px-10">
        {/* Back Link & Page Title */}
        <div className="mb-7">
          <Link
            href={routes.organization}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl md:text-[28px] font-bold tracking-tight text-slate-900">
            Organizer Profile
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Set up your organization profile so participants can learn more about
            who is hosting the competition.
          </p>
        </div>

        {/* Main Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Organization Profile Form */}
          <form
            onSubmit={handleSaveProfile}
            className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-2xs"
          >
            <h2 className="text-base font-bold text-slate-900 mb-5">
              Organization Profile
            </h2>

            {/* Organization Logo */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-800">
                Organization Logo
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5 mb-3">
                Upload your organization logo. Square image recommended.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogoChange}
                className="hidden"
              />

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#EFF4FF] border border-blue-100/80 flex items-center justify-center overflow-hidden shrink-0">
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoPreview}
                      alt="Organization Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-xs">
                      <Hexagon className="w-5 h-5 stroke-[2.2]" />
                    </div>
                  )}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
                  >
                    {isUploadingLogo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-[#2563EB]" />
                    )}
                    <span>
                      {isUploadingLogo ? "Uploading..." : "Upload Logo"}
                    </span>
                  </button>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    JPG, PNG (Max 2MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Organization Name */}
            <div className="mb-5">
              <label
                htmlFor="organization-name"
                className="block text-xs font-semibold text-slate-800 mb-2"
              >
                Organization Name <span className="text-red-500">*</span>
              </label>
              <input
                id="organization-name"
                type="text"
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 100))}
                placeholder="e.g. Google Developer Student Clubs"
                disabled={isLoadingMe}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs md:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-colors"
              />
              <div className="text-[11px] text-slate-400 text-right mt-1">
                {name.length}/100
              </div>
            </div>

            {/* Short Description */}
            <div className="mb-5">
              <label
                htmlFor="organization-description"
                className="block text-xs font-semibold text-slate-800 mb-2"
              >
                Short Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="organization-description"
                rows={4}
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                placeholder="Tell participants about your organization..."
                disabled={isLoadingMe}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs md:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-colors resize-none"
              />
              <div className="text-[11px] text-slate-400 text-right mt-1">
                {description.length}/500
              </div>
            </div>

            {statusMessage && (
              <div
                className={`mb-4 rounded-xl px-4 py-3 text-xs font-medium border ${
                  statusMessage.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-red-50 border-red-200 text-red-600"
                }`}
              >
                {statusMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving || isUploadingLogo}
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-400 text-white font-semibold text-xs md:text-sm py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaving ? "Saving Profile..." : "Save Profile"}</span>
            </button>
          </form>

          {/* Right Column: Wallet Overview */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 md:p-7 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900">
              Wallet Overview
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5 mb-5">
              Manage the wallet connected to your organizer account.
            </p>

            {/* Balance Card */}
            <div className="rounded-2xl bg-gradient-to-br from-[#EAF2FF] via-[#E1ECFF] to-[#D4E4FF] p-5 border border-blue-100/80 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-xs">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
                    <span>Available Balance</span>
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                    isConnected
                      ? "bg-emerald-50 border-emerald-200/80 text-emerald-600"
                      : "bg-slate-100 border-slate-200 text-slate-500"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isConnected ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  />
                  {isConnected ? "Connected" : "Connected"}
                </span>
              </div>

              <div className="mt-4">
                <div className="text-2xl md:text-[26px] font-extrabold text-slate-900 tracking-tight">
                  {formattedBalanceDisplay}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {idrEquivalentDisplay}
                </div>
              </div>
            </div>

            {/* Wallet Details Box */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
              <div>
                <p className="text-[10px] font-medium text-slate-400">
                  Wallet Address
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-bold text-slate-800 font-mono">
                    {shortenAddress(
                      address || (meUser as any)?.wallet_address
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title="Copy Wallet Address"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-200/70 my-3.5" />

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                WALLET INFORMATION
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Network</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <span className="w-4 h-4 rounded-full bg-[#2563EB] text-white text-[9px] font-bold flex items-center justify-center">
                      B
                    </span>
                    <span>{networkName}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Token</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <span className="w-4 h-4 rounded-full bg-[#2563EB] text-white text-[9px] font-bold flex items-center justify-center">
                      $
                    </span>
                    <span>{tokenSymbol}</span>
                  </div>
                </div>

                <div className="flex items-start justify-between pt-0.5">
                  <span className="text-slate-500">Balance</span>
                  <div className="text-right">
                    <div className="font-bold text-slate-800">
                      {formattedBalanceDisplay}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {idrEquivalentDisplay}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

