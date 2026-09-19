/**
 * USD Wallet Types
 * Types for USD wallet operations including balance, transactions, and formatting
 */

// ═══════════════════════════════════════════════════════════════════════
// CURRENCY & DENOMINATION HELPERS
// ═══════════════════════════════════════════════════════════════════════

export type WalletCurrency = 'NGN' | 'USD' | 'USDT' | 'USDC';

/**
 * Convert a major unit amount to the lowest denomination (kobo/cents)
 * NGN: ₦100.00 → 10000 kobo
 * USD: $100.00 → 10000 cents
 */
export const toLowestDenomination = (amount: number, currency: WalletCurrency): number => {
  return Math.round(amount * 100);
};

/**
 * Format a lowest-denomination amount for display
 * NGN: 10000 kobo → "₦100.00"
 * USD: 10000 cents → "$100.00"
 */
export const fromLowestDenomination = (amount: number, currency: WalletCurrency): string => {
  const formatted = (amount / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency === 'NGN' ? `₦${formatted}` : `$${formatted}`;
};

/**
 * Format a number as currency with symbol
 */
export const formatCurrency = (amount: number, currency: WalletCurrency): string => {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency === 'NGN' ? `₦${formatted}` : `$${formatted}`;
};

// ═══════════════════════════════════════════════════════════════════════
// USD WALLET — API RESPONSE TYPES (raw from GET /api/v1/usd/wallet/summary)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Transaction types returned by the USD wallet summary endpoint.
 *
 * Mapping                     Is Credit?
 * ─────────────────────────── ──────────
 * conversion_in                ✅ Yes
 * conversion_out               ❌ No
 * credit                       ✅ Yes
 * debit                        ❌ No
 * card_funding                 ❌ No
 * card_refund                  ✅ Yes
 */
export type UsdTransactionType =
  | 'credit'
  | 'debit'
  | 'conversion_in'
  | 'conversion_out'
  | 'card_funding'
  | 'card_refund';

/**
 * A single USD wallet transaction as returned by the API.
 *
 * IMPORTANT GOTCHAS:
 * - `amount` is a **decimal string** (e.g. "0.71") — always parseFloat() before math/comparison.
 * - `balance` in the summary is already in **dollars** (float 0.71 = $0.71).
 *   Do NOT divide by 100 (unlike the /wallets/balances endpoint which uses cents).
 * - `metadata` is nullable — guard with optional chaining: tx.metadata?.rate
 */
export interface UsdTransaction {
  id: number;
  usd_wallet_id: number;
  user_id: number;
  type: UsdTransactionType;
  amount: string;             // decimal string in dollars, e.g. "0.71"
  balance_before: string;     // decimal string in dollars
  balance_after: string;      // decimal string in dollars
  reference: string;          // unique reference e.g. "3264dcde..._USD"
  description: string;
  metadata: UsdTransactionMetadata | null;
  idempotency_key_id: number | null;
  created_at: string;         // ISO 8601 datetime
  updated_at: string;         // ISO 8601 datetime
}

/**
 * Metadata attached to conversion_in / conversion_out transactions.
 * Null for other transaction types.
 */
export interface UsdTransactionMetadata {
  rate?: number;              // FX rate used (e.g. 0.0007107)
  ngn_amount?: number;        // NGN amount in naira (e.g. 1000)
  quote_reference?: string;   // Related FX quote reference
}

/**
 * Raw response envelope from GET /api/v1/usd/wallet/summary.
 */
export interface UsdWalletSummary {
  balance: number;            // USD balance in dollars (e.g. 0.71) — NOT cents
  last_synced_at: string | null;
  recent_transactions: UsdTransaction[];
}

export interface UsdWalletSummaryResponse {
  success: boolean;
  message: string;
  data?: UsdWalletSummary;
  errors?: Record<string, string[]>;
}

// ═══════════════════════════════════════════════════════════════════════
// NEW ENDPOINT: GET /api/v1/usd/wallet — Wallet Info
// ═══════════════════════════════════════════════════════════════════════

/**
 * Response from GET /api/v1/usd/wallet.
 * Returns the authenticated user's USD wallet record.
 */
export interface UsdWalletInfo {
  id: number;
  user_id: number;
  balance: number;            // in dollars (e.g. 0.71)
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsdWalletInfoResponse {
  success: boolean;
  message: string;
  data?: UsdWalletInfo;
  errors?: Record<string, string[]>;
}

// ═══════════════════════════════════════════════════════════════════════
// NEW ENDPOINT: GET /api/v1/usd/transactions — Full Transaction History
// ═══════════════════════════════════════════════════════════════════════

/**
 * Query parameters for GET /api/v1/usd/transactions.
 */
export interface UsdTransactionsQuery {
  limit?: number;     // max 100, default 20
  type?: UsdTransactionType;  // filter by transaction type
}

/**
 * Response data from GET /api/v1/usd/transactions.
 */
export interface UsdTransactionsData {
  transactions: UsdTransaction[];
  balance: number;            // current USD balance in dollars
}

export interface UsdTransactionsResponse {
  success: boolean;
  message: string;
  data?: UsdTransactionsData;
  errors?: Record<string, string[]>;
}

// ═══════════════════════════════════════════════════════════════════════
// USD WALLET — PARSED VIEW MODEL (after normalisation for frontend)
// ═══════════════════════════════════════════════════════════════════════

/**
 * A parsed USD transaction ready for display.
 * All string fields from the API are converted to their proper types.
 */
export interface ParsedUsdTransaction {
  id: number;
  type: UsdTransactionType;
  amount: number;               // parseFloat of API string
  balanceBefore: number;        // parseFloat of API string
  balanceAfter: number;         // parseFloat of API string
  reference: string;
  description: string;
  metadata: UsdTransactionMetadata | null;
  createdAt: Date;
  isCredit: boolean;            // derived: balanceAfter > balanceBefore
  amountFormatted: string;      // "$0.71"
  balanceFormatted: string;     // "$0.71"
  typeLabel: string;            // Human-readable type name
}

/**
 * Frontend view model for the USD wallet summary card.
 */
export interface UsdWalletSummaryViewModel {
  balance: number;
  balanceFormatted: string;
  lastSyncedAt: Date | null;
  recentTransactions: ParsedUsdTransaction[];
}

// ═══════════════════════════════════════════════════════════════════════
// USD WALLET STATE (hook-managed)
// ═══════════════════════════════════════════════════════════════════════

export interface UsdWalletState {
  balance: number;              // in dollars (e.g. 0.71)
  lastSyncedAt: string | null;
  recentTransactions: UsdTransaction[];
  isLoading: boolean;
  error: string | null;
}

// ═══════════════════════════════════════════════════════════════════════
// CONVERSION MODAL STATE
// ═══════════════════════════════════════════════════════════════════════

export interface ConversionState {
  sourceCurrency: WalletCurrency;
  targetCurrency: WalletCurrency;
  sourceAmount: string; // user input in major units
  targetAmount: number | null; // computed in cents
  exchangeRate: number | null;
  quoteReference: string | null;
  quoteExpiresAt: string | null;
  step: 'input' | 'confirm' | 'processing' | 'done';
}

export const initialConversionState: ConversionState = {
  sourceCurrency: 'NGN',
  targetCurrency: 'USD',
  sourceAmount: '',
  targetAmount: null,
  exchangeRate: null,
  quoteReference: null,
  quoteExpiresAt: null,
  step: 'input',
};

// ═══════════════════════════════════════════════════════════════════════
// TRANSACTION DISPLAY HELPERS
// ═══════════════════════════════════════════════════════════════════════

const TRANSACTION_LABELS: Record<UsdTransactionType, string> = {
  credit: 'Credit',
  debit: 'Debit',
  conversion_in: 'Conversion In',
  conversion_out: 'Conversion Out',
  card_funding: 'Card Funding',
  card_refund: 'Card Refund',
};

export const getTransactionLabel = (type: UsdTransactionType): string => {
  return TRANSACTION_LABELS[type] || type;
};

export const getTransactionIcon = (type: UsdTransactionType): 'credit' | 'debit' => {
  switch (type) {
    case 'credit':
    case 'conversion_in':
    case 'card_refund':
      return 'credit';
    case 'debit':
    case 'conversion_out':
    case 'card_funding':
      return 'debit';
  }
};

/**
 * Derive whether a transaction is a credit based on balance change.
 * More reliable than just checking the type.
 */
export const isCreditTransaction = (tx: {
  balance_after: string;
  balance_before: string;
}): boolean => {
  return parseFloat(tx.balance_after) > parseFloat(tx.balance_before);
};

/**
 * Format a dollar amount for display.
 * e.g. 0.71 → "$0.71"
 */
export const formatUsdAmount = (amount: number): string => {
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Parse a raw API transaction into a display-ready ParsedUsdTransaction.
 */
export const parseUsdTransaction = (tx: UsdTransaction): ParsedUsdTransaction => {
  const amount = parseFloat(tx.amount);
  const balanceAfter = parseFloat(tx.balance_after);
  const balanceBefore = parseFloat(tx.balance_before);

  return {
    id: tx.id,
    type: tx.type,
    amount,
    balanceBefore,
    balanceAfter,
    reference: tx.reference,
    description: tx.description,
    metadata: tx.metadata,
    createdAt: new Date(tx.created_at),
    isCredit: balanceAfter > balanceBefore,
    amountFormatted: formatUsdAmount(amount),
    balanceFormatted: formatUsdAmount(balanceAfter),
    typeLabel: getTransactionLabel(tx.type),
  };
};
