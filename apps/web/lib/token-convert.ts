import {
  formatUnits,
  getAddress,
  isAddress,
  zeroAddress,
  type PublicClient,
} from "viem"
import { publicClient as defaultPublicClient } from "./public-client"

export const NATIVE_TOKEN = zeroAddress

export const ERC20_ABI = [
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const

export type TokenType = "Native Token" | "ERC-20 Token"

export interface ConvertTokenParams {
  token: string
  amount: string | number | bigint
  client?: PublicClient
}

export interface ConvertTokenResult {
  tokenType: TokenType
  tokenAddress: `0x${string}`
  symbol: string
  decimals: number
  rawAmount: bigint
  convertedAmount: string
  formatted: string
}

function parseRawAmount(amount: string | number | bigint): bigint {
  if (typeof amount === "bigint") {
    if (amount < 0n) {
      throw new Error("Amount cannot be negative.")
    }
    return amount
  }

  if (typeof amount === "number") {
    if (!Number.isFinite(amount) || !Number.isInteger(amount)) {
      throw new Error("Amount must be a non-negative integer in smallest units.")
    }
    if (amount < 0) {
      throw new Error("Amount cannot be negative.")
    }
    return BigInt(amount)
  }

  if (typeof amount === "string") {
    const trimmed = amount.trim()
    if (!trimmed) {
      throw new Error("Amount must be a non-negative integer in smallest units.")
    }

    if (trimmed.startsWith("-")) {
      throw new Error("Amount cannot be negative.")
    }

    // Must be integer digits only
    if (!/^\d+$/.test(trimmed)) {
      throw new Error("Amount must be a non-negative integer in smallest units.")
    }

    try {
      const raw = BigInt(trimmed)
      if (raw < 0n) {
        throw new Error("Amount cannot be negative.")
      }
      return raw
    } catch {
      throw new Error("Amount must be a non-negative integer in smallest units.")
    }
  }

  throw new Error("Amount must be a non-negative integer in smallest units.")
}

/**
 * Converts an on-chain token raw amount to human-readable decimals,
 * mirroring `cobalt-protocol-smart-contract/scripts/token_convert.py`.
 *
 * @param token Token contract address or zero address for native token
 * @param amount Amount in smallest token units (integer)
 * @param client Optional Viem PublicClient (defaults to app publicClient)
 */
export async function convertTokenOnChain(
  params: ConvertTokenParams
): Promise<ConvertTokenResult>
export async function convertTokenOnChain(
  token: string,
  amount: string | number | bigint,
  client?: PublicClient
): Promise<ConvertTokenResult>
export async function convertTokenOnChain(
  tokenOrParams: string | ConvertTokenParams,
  maybeAmount?: string | number | bigint,
  maybeClient?: PublicClient
): Promise<ConvertTokenResult> {
  let token: string
  let amount: string | number | bigint
  let client: PublicClient

  if (typeof tokenOrParams === "object" && tokenOrParams !== null) {
    token = tokenOrParams.token
    amount = tokenOrParams.amount
    client = tokenOrParams.client ?? defaultPublicClient
  } else {
    token = tokenOrParams
    if (maybeAmount === undefined) {
      throw new Error("Amount is required.")
    }
    amount = maybeAmount
    client = maybeClient ?? defaultPublicClient
  }

  const rawAmount = parseRawAmount(amount)

  const isNative =
    !token ||
    token.toLowerCase() === NATIVE_TOKEN.toLowerCase() ||
    token.toLowerCase() === "0x0"

  let tokenType: TokenType
  let symbol: string
  let decimals: number
  let tokenAddress: `0x${string}`

  if (isNative) {
    tokenType = "Native Token"
    tokenAddress = NATIVE_TOKEN
    symbol = client?.chain?.nativeCurrency?.symbol ?? "BOT"
    decimals = 18
  } else {
    if (!isAddress(token)) {
      throw new Error(`Invalid token address: ${token}`)
    }

    tokenAddress = getAddress(token)
    tokenType = "ERC-20 Token"

    try {
      symbol = (await client.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "symbol",
      })) as string
    } catch {
      symbol = "UNKNOWN"
    }

    try {
      const decResult = await client.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "decimals",
      })
      decimals = Number(decResult)
    } catch (exc: any) {
      throw new Error(
        `Cannot read decimals from token ${token}: ${exc?.message || exc}`
      )
    }

    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) {
      throw new Error(`Invalid token decimals: ${decimals}`)
    }
  }

  const convertedAmount = formatUnits(rawAmount, decimals)

  return {
    tokenType,
    tokenAddress,
    symbol,
    decimals,
    rawAmount,
    convertedAmount,
    formatted: `${convertedAmount} ${symbol}`,
  }
}
