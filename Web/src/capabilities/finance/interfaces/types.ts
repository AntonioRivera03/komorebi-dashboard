export type Money = { minor: number; currency: string }

export type Obligation = { id: string; kind: 'bill' | 'subscription'; name: string; amount: Money; dueAt: string; cadence: string; reminder?: { channel: string; daysBefore: number; taskRef?: string }; lastPayment?: { at: string; provenance: 'manual' | 'imported' } }
export type SavingsTarget = { id: string; name: string; target: Money; balance: Money; balanceEnteredAt: string }
export type FinanceSummary = { obligations: Obligation[]; savings: SavingsTarget[]; monthTotals: { currency: string; minor: number }[]; conversionNote?: string }
