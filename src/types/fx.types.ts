/**
 * FX Conversion Types and Interfaces
 * Handles foreign exchange quote generation and currency conversion
 */

// Currency types
export type Currency = 'NGN' | 'USD' | 'USDT' | 'USDC';

// Quote status
export type QuoteStatus = 'ACTIVE' | 'EXPIRED';

// Transaction status
export type FxTransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

/**
 * Currency amount with human readable display
 */
export interface CurrencyAmount {
  currency: Currency;
  amount: number; // in lowest denomination
  human_readable_amount: number; // display amount
}

/**
 * FX Quote object
 * Represents an exchange rate quote with expiration
 */
export interface FxQuote {
  quote_reference: string;
  source_currency: Currency;
  target_currency: Currency;
  source_amount: number; // in lowest denomination (kobo/cents)
  converted_amount: number; // in lowest denomination
  exchange_rate: number;
  expires_at: string; // ISO 8601 timestamp
  created_at: string; // ISO 8601 timestamp
}

/**
 * FX Transaction
 * Represents a completed or pending currency exchange
 */
export interface FxTransaction {
  transaction_reference: string; // Unique transaction identifier
  source: CurrencyAmount;
  target: CurrencyAmount;
  rate: number;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * API Response wrapper for FX operations
 */
export interface FxApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

/**
 * Request body for generating FX quote
 */
export interface GenerateFxQuoteRequest {
  source_currency: Currency;
  target_currency: Currency;
  amount: number; // in lowest denomination
}

/**
 * Response for generate quote endpoint
 */
export interface GenerateFxQuoteResponse extends FxApiResponse<FxQuote> {}

/**
 * Request body for executing FX exchange
 */
export interface ExecuteFxExchangeRequest {
  quote_reference: string;
}

/**
 * Response for execute exchange endpoint
 */
export interface ExecuteFxExchangeResponse
  extends FxApiResponse<FxTransaction> {}

/**
 * Response for FX history endpoint
 */
export interface GetFxHistoryResponse extends FxApiResponse<FxTransaction[]> {}
