0/**
 * Transfer Types
 * Comprehensive type definitions for Remopay-to-Remopay and Bank Transfers
 * Updated July 25, 2026 - Multi-provider support
 */

/**
 * Transfer Types Enum
 */
export enum TransferType {
  REMOPAY = 'remopay',
  BANK = 'external_bank',
}

export enum IdentifierType {
  PHONE = 'phone',
  EMAIL = 'email',
}

export enum TransferStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

/**
 * Bank-related types
 * Updated: Bank list now returns from multi-provider API
 */
export interface Bank {
  name: string;
  code: string;
  type: string;
  active: boolean;
  logo?: string;
}

export interface BankListResponse {
  data: Bank[];
}

export interface AccountResolution {
  account_number: string;
  account_name: string;
  bank_code: string;
}

export interface AccountResolutionResponse {
  status: boolean;
  message: string;
  data: AccountResolution | null;
}

/**
 * Recipient verification types
 */
export interface RecipientUser {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  avatar?: string;
  identifier_type: IdentifierType;
  identifier: string;
}

export interface VerifyRecipientRequest {
  identifier: string;
  identifier_type: IdentifierType;
}

export interface VerifyRecipientResponse {
  success: boolean;
  message: string;
  data: RecipientUser | null;
}

/**
 * Transfer Recipient types
 */
export interface Recipient {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  bank?: string;
  bank_type: TransferType;
  last_transfer_date?: string;
  transfer_count: number;
  total_transferred: number;
  profile_image?: string;
  account_number?: string;
  identifier_type?: IdentifierType;
}

/**
 * Recipients List Response - represents the data inside ApiResponse
 */
export interface RecipientsListResponse {
  recipients: Recipient[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  count?: number;
  summary?: {
    total_recipients: number;
    remopay_recipients: number;
    external_bank_recipients: number;
    total_transfers_made: number;
    total_amount_transferred: number;
  };
}

/**
 * Remopay Transfer types
 */
export interface RemopayTransferRequest {
  identifier: string; // Normalized phone (10 digits) or email
  identifier_type: IdentifierType;
  amount: number; // In NGN
  description?: string;
  pin: string; // 4-digit PIN
}

export interface RemopayTransferResponse {
  success: boolean;
  message?: string;
  reference: string;
  amount: number;
  sender_balance: number;
  recipient_balance: number;
  status: string; // 'success' or other status
}

/**
 * Bank Transfer types
 * Updated: Backend auto-selects provider; response includes provider info
 */
export interface BankTransferRequest {
  account_number: string; // 10 digits
  bank_code: string; // 3 digits
  bank_name?: string; // Human-readable bank name
  account_name: string;
  amount: number; // In NGN
  reason?: string;
  pin: string; // 4-digit PIN
  idempotency_key?: string; // 🛡️ Prevents duplicate transfers on retry
}

export interface BankTransferResponse {
  success: boolean;
  reference: string;
  provider: string;
  provider_reference: string;
  amount: number;
  status: string;
  message: string;
  all_providers_down?: boolean;
  data?: Omit<BankTransferResponse, 'data'>;
}

/**
 * PIN verification related types
 */
export interface PINVerificationResponse {
  success: boolean;
  message: string;
  code?: string;
  data?: {
    verified: boolean;
    failed_attempts?: number;
    is_locked?: boolean;
    remaining_seconds?: number;
  };
}

/**
 * Form data types for session storage
 */
export interface RemopayTransferFormData {
  recipientIdentifier: string;
  identifierType: IdentifierType;
  amount: number;
  description?: string;
  recipientDetails?: RecipientUser;
}

export interface BankTransferFormData {
  selectedBank: Bank | null;
  accountNumber: string;
  accountName: string;
  amount: number;
  reason?: string;
  accountVerified: boolean;
}

/**
 * Transaction history types (for reference)
 */
export interface Transfer {
  id: number;
  transfer_code: string;
  recipient_name: string;
  recipient_identifier: string;
  amount: number;
  type: TransferType;
  status: TransferStatus;
  created_at: string;
  description?: string;
}

/**
 * Error response type
 */
export interface TransferErrorResponse {
  success: boolean;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
  data?: {
    failed_attempts?: number;
    is_locked?: boolean;
    remaining_seconds?: number;
  };
}

/**
 * PIN lock status type
 */
export interface PINLockStatus {
  is_locked: boolean;
  remaining_seconds: number;
  failed_attempts: number;
}

/**
 * Phone normalization result
 */
export interface PhoneNormalizationResult {
  isValid: boolean;
  normalized?: string;
  error?: string;
}

/**
 * Transfer validation result
 */
export interface TransferValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}
