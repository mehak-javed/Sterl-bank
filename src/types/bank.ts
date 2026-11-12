import type { Pence } from "@/lib/money";

/**
 * The shape of Sterl's (fake) bank data. The generator, the API route handlers,
 * the MSW test handlers and the screens all share these types, so if one changes
 * the compiler shows every place that needs updating.
 */

export type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string; // always @example.com, a domain reserved so it can never reach a real inbox
};

export type AccountType = "current" | "saver" | "roundup";

export type Account = {
  id: string;
  customerId: string;
  type: AccountType;
  name: string;
  sortCode: string; // "12-34-56"
  accountNumber: string; // 8 digits, kept as a string so leading zeros survive
  currency: "GBP";
  openingBalancePence: Pence; // balance before the first transaction in the data
  balancePence: Pence; // openingBalancePence + every transaction on this account
};

export type SpendCategory =
  | "Groceries"
  | "Eating out"
  | "Transport"
  | "Shopping"
  | "Entertainment";

export type Category =
  | SpendCategory
  | "Subscriptions"
  | "Bills"
  | "Income"
  | "Savings"
  | "Round-ups";

export type TransactionKind =
  | "card"
  | "direct_debit"
  | "standing_order"
  | "salary"
  | "transfer"
  | "roundup";

export type Transaction = {
  id: string;
  accountId: string;
  date: string; // ISO 8601, UTC
  description: string;
  category: Category;
  kind: TransactionKind;
  /** Signed: negative = money out, positive = money in. */
  amountPence: Pence;
  /** Account balance straight after this transaction, like a bank statement. */
  balanceAfterPence: Pence;
  /** Set on both legs of a move between two Sterl accounts. The two legs always sum to 0. */
  transferId?: string;
};

export type Payee = {
  id: string;
  name: string;
  type: "person" | "business";
  sortCode: string;
  accountNumber: string;
};

/** The kinds of card Sterl offers. Each one's name, look and network live in src/lib/cards.ts. */
export type CardProduct = "debit" | "virtual" | "travel" | "premier";

/**
 * A card. Only the last four digits are stored, and they come from PUBLISHED test card numbers
 * (e.g. 4242 4242 4242 4242), never a real card.
 */
export type Card = {
  id: string;
  accountId: string;
  product: CardProduct;
  /** The card network. Always the one its product uses (checked by a test). */
  brand: "Visa" | "Mastercard";
  nameOnCard: string;
  last4: string;
  expiryMonth: number; // 1-12
  expiryYear: number;
  frozen: boolean;
};

export type BankData = {
  customer: Customer;
  accounts: Account[];
  transactions: Transaction[]; // newest first
  payees: Payee[];
  cards: Card[];
};
