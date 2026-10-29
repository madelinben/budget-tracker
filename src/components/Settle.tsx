import { ArrowRight, Check, Copy } from "lucide-react";
import { useState } from "react";
import { balances, formatMoney, settle, spending, type Trip } from "../lib/budget";
import { card } from "./ui";

export function Settle({ trip, onChange }: { trip: Trip; onChange: (t: Trip) => void }) {
  const [copied, setCopied] = useState(false);
  const net = balances(trip);
  const spent = spending(trip);
  const transfers = settle(net);
  const name = new Map(trip.people.map((p) => [p.id, p.name]));
  const money = (p: number) => formatMoney(p, trip.currency);
  const total = [...spent.values()].reduce((a, b) => a + b, 0);

  function markPaid(from: string, to: string, amount: number) {
    onChange({
      ...trip,
      expenses: [
        { id: crypto.randomUUID(), description: "Settle up", amount, paidBy: from, splitWith: [to], date: new Date().toISOString(), transfer: true },
        ...trip.expenses,
      ],
    });
  }

  async function copy() {
    const lines = [
      `${trip.name}: ${money(total)} total`,
      ...transfers.map((t) => `${name.get(t.from)} → ${name.get(t.to)}: ${money(t.amount)}`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
    } catch {}
  }

  return (
    <section aria-labelledby="settle-h" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 id="settle-h" className="text-xl font-extrabold">
          Settle up
        </h2>
        <p className="text-sm tabular-nums text-slate-600">{money(total)} total</p>
      </div>

      <div className={card}>
        <h3 className="mb-2 font-semibold">Who pays who</h3>
        {transfers.length === 0 ? (
          <p className="flex items-center gap-2 text-emerald-800">
            <Check size={18} aria-hidden="true" /> All square.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {transfers.map((t) => (
              <li key={`${t.from}-${t.to}`} className="flex flex-wrap items-center gap-2">
                <span className="font-bold">{name.get(t.from)}</span>
                <ArrowRight size={16} aria-label="pays" />
                <span className="font-bold">{name.get(t.to)}</span>
                <span className="ml-auto font-black tabular-nums">{money(t.amount)}</span>
                <button
                  type="button"
                  onClick={() => markPaid(t.from, t.to, t.amount)}
                  className="min-h-11 rounded-xl px-3 text-sm font-semibold text-sky-800 ring-1 ring-sky-700 hover:bg-sky-50"
                >
                  Mark paid
                </button>
              </li>
            ))}
          </ul>
        )}
        {transfers.length > 0 && (
          <button type="button" onClick={copy} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-sky-800 underline hover:no-underline">
            <Copy size={14} aria-hidden="true" />
            {copied ? "Copied" : "Copy summary for the group chat"}
          </button>
        )}
      </div>

      <div className={card}>
        <h3 className="mb-2 font-semibold">Balances</h3>
        <table className="w-full text-sm">
          <caption className="sr-only">Each person's share of the costs and what they are owed or owe</caption>
          <thead className="text-slate-600">
            <tr>
              <th scope="col" className="py-1 text-left font-semibold">Person</th>
              <th scope="col" className="py-1 text-right font-semibold">Their share</th>
              <th scope="col" className="py-1 text-right font-semibold">Balance</th>
            </tr>
          </thead>
          <tbody>
            {trip.people.map((p) => {
              const n = net.get(p.id) ?? 0;
              return (
                <tr key={p.id} className="border-t border-slate-100">
                  <th scope="row" className="py-2 text-left font-semibold">{p.name}</th>
                  <td className="py-2 text-right tabular-nums">{money(spent.get(p.id) ?? 0)}</td>
                  <td className={`py-2 text-right font-bold tabular-nums ${n > 0 ? "text-emerald-800" : n < 0 ? "text-rose-700" : ""}`}>
                    {n > 0 ? `is owed ${money(n)}` : n < 0 ? `owes ${money(-n)}` : "square"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
