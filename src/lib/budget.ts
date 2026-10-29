export interface Person {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  description: string;
  /** Whole pence: never floats for money */
  amount: number;
  paidBy: string;
  /** People who share the cost equally */
  splitWith: string[];
  date: string;
  /** A settle-up payment from paidBy to the single person in splitWith */
  transfer?: boolean;
}

export interface Trip {
  id: string;
  name: string;
  currency: string;
  people: Person[];
  expenses: Expense[];
}

export interface BudgetData {
  version: 1;
  trips: Trip[];
  activeTripId: string | null;
}

export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

export const EMPTY: BudgetData = { version: 1, trips: [], activeTripId: null };

/** Split pence as evenly as possible; the first shares take the leftover pennies. */
export function splitPence(amount: number, ways: number): number[] {
  if (ways <= 0) return [];
  const base = Math.floor(amount / ways);
  const extra = amount - base * ways;
  return Array.from({ length: ways }, (_, i) => base + (i < extra ? 1 : 0));
}

/** Net position per person: positive is owed money, negative owes. Always sums to zero. */
export function balances(trip: Trip): Map<string, number> {
  const net = new Map(trip.people.map((p) => [p.id, 0]));
  const add = (id: string, n: number) => net.set(id, (net.get(id) ?? 0) + n);
  for (const e of trip.expenses) {
    if (!e.splitWith.length) continue;
    add(e.paidBy, e.amount);
    const shares = splitPence(e.amount, e.splitWith.length);
    for (const [i, id] of e.splitWith.entries()) add(id, -(shares[i] ?? 0));
  }
  return net;
}

/** What each person consumed (their shares), excluding settle-up payments. */
export function spending(trip: Trip): Map<string, number> {
  const out = new Map(trip.people.map((p) => [p.id, 0]));
  for (const e of trip.expenses) {
    if (e.transfer) continue;
    const shares = splitPence(e.amount, e.splitWith.length);
    for (const [i, id] of e.splitWith.entries()) out.set(id, (out.get(id) ?? 0) + (shares[i] ?? 0));
  }
  return out;
}

/**
 * Fewest-ish transfers to settle: the biggest debtor pays the biggest creditor until clear.
 * ponytail: greedy, at most n-1 transfers; the true minimum is NP-hard and groups are small
 */
export function settle(net: Map<string, number>): Transfer[] {
  const debtors = [...net].filter(([, n]) => n < 0).map(([id, n]) => ({ id, n: -n }));
  const creditors = [...net].filter(([, n]) => n > 0).map(([id, n]) => ({ id, n }));
  const out: Transfer[] = [];
  for (;;) {
    debtors.sort((a, b) => b.n - a.n);
    creditors.sort((a, b) => b.n - a.n);
    const d = debtors[0];
    const c = creditors[0];
    if (!d || !c || d.n === 0 || c.n === 0) return out;
    const amount = Math.min(d.n, c.n);
    out.push({ from: d.id, to: c.id, amount });
    d.n -= amount;
    c.n -= amount;
  }
}

/** "12.50" or "12,50" or "£12" to pence, or null when not a positive amount */
export function parseAmount(text: string): number | null {
  const n = Number(text.replace(/[£$€,\s]/g, (m) => (m === "," ? "." : "")));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
}

export function formatMoney(pence: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(pence / 100);
}

export function parseBudget(raw: unknown): BudgetData | null {
  if (typeof raw !== "object" || raw === null) return null;
  const d = raw as Partial<BudgetData>;
  return d.version === 1 && Array.isArray(d.trips)
    ? { version: 1, trips: d.trips, activeTripId: d.activeTripId ?? null }
    : null;
}
