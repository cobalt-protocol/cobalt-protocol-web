export interface Token {
  name: string
  symbol: string
  address: `0x${string}`
  decimals: number
  isNative?: boolean
}

export const TOKENS = {
  USDT: {
    name: "USDT",
    symbol: "USDT",
    address: "0x75edC9335175Fc0552D51D48439F229c10420fe3",
    decimals: 18,
    isNative: false,
  },
  BOT: {
    name: "BOT",
    symbol: "BOT",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    isNative: true,
  },
} as const satisfies Record<string, Token>

export type TokenKey = keyof typeof TOKENS
export type TokenSymbol = typeof TOKENS[TokenKey]["symbol"]

export const TOKEN_LIST: Token[] = [TOKENS.USDT, TOKENS.BOT]

export const TOKEN_DICTIONARY: Record<string, Token> = {
  [TOKENS.USDT.address.toLowerCase()]: TOKENS.USDT,
  [TOKENS.BOT.address.toLowerCase()]: TOKENS.BOT,
  "0x0": TOKENS.BOT,
  USDT: TOKENS.USDT,
  BOT: TOKENS.BOT,
}

export function getTokenByAddress(address?: string | null): Token {
  if (!address) return TOKENS.BOT
  const key = address.toLowerCase()
  return TOKEN_DICTIONARY[key] || TOKENS.BOT
}

export function getTokenSymbol(
  tokenAddress?: string | null,
  chainNativeSymbol?: string,
  tokenObjSymbol?: string
): string {
  if (tokenObjSymbol) {
    return tokenObjSymbol
  }
  if (
    !tokenAddress ||
    tokenAddress === TOKENS.BOT.address ||
    tokenAddress === "0x0"
  ) {
    return chainNativeSymbol || TOKENS.BOT.symbol
  }
  const token = TOKEN_DICTIONARY[tokenAddress.toLowerCase()]
  if (token) {
    return token.symbol
  }
  return TOKENS.USDT.symbol
}
