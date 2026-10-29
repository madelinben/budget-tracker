import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { type BudgetData, formatMoney, spending, type Trip } from "../lib/budget";
import { card, field, primary } from "./ui";

const CURRENCIES = ["GBP", "EUR", "USD"];

interface Props {
  data: BudgetData;
  onChange: (d: BudgetData) => void;
  onOpen: (id: string) => void;
}

export function Trips({ data, onChange, onOpen }: Props) {
  const [name, setName] = useState("");
  const [people, setPeople] = useState("");
  const [currency, setCurrency] = useState("GBP");
  const names = people
    .split(/[,\n]/)
    .map((n) => n.trim())
    .filter(Boolean);

  function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || names.length < 2) return;
    const trip: Trip = {
      id: crypto.randomUUID(),
      name: name.trim().slice(0, 60),
      currency,
      people: [...new Set(names)].map((n) => ({ id: crypto.randomUUID(), name: n.slice(0, 30) })),
      expenses: [],
    };
    onChange({ ...data, trips: [trip, ...data.trips], activeTripId: trip.id });
    setName("");
    setPeople("");
    onOpen(trip.id);
  }

  function remove(t: Trip) {
    if (!confirm(`Delete ${t.name} and all its expenses?`)) return;
    onChange({
      ...data,
      trips: data.trips.filter((x) => x.id !== t.id),
      activeTripId: data.activeTripId === t.id ? null : data.activeTripId,
    });
  }

  return (
    <section aria-labelledby="trips-h" className="flex flex-col gap-4">
      <h2 id="trips-h" className="text-xl font-extrabold">
        Groups
      </h2>
      <form onSubmit={create} className={`${card} flex flex-col gap-3`}>
        <h3 className="font-semibold">New holiday, night out or house share</h3>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Lake District 2027"
            className={field}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          People, separated by commas
          <input
            value={people}
            onChange={(e) => setPeople(e.target.value)}
            placeholder="Sam, Alex, Jo"
            className={field}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Currency
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={field}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={!name.trim() || names.length < 2} className={primary}>
          <Plus size={16} aria-hidden="true" />
          Start group
        </button>
      </form>

      {data.trips.length > 0 && (
        <ul className="flex flex-col gap-2">
          {data.trips.map((t) => {
            const total = [...spending(t).values()].reduce((a, b) => a + b, 0);
            return (
              <li key={t.id} className={`${card} flex items-center gap-2 p-2`}>
                <button
                  type="button"
                  onClick={() => onOpen(t.id)}
                  aria-current={t.id === data.activeTripId ? "true" : undefined}
                  className="flex min-h-12 flex-1 items-center justify-between gap-3 rounded-xl px-2 text-left hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-sky-700"
                >
                  <span>
                    <span className="block font-bold">{t.name}</span>
                    <span className="text-sm text-slate-600">
                      {t.people.length} people · {formatMoney(total, t.currency)} spent
                    </span>
                  </span>
                  <ChevronRight size={18} aria-hidden="true" className="text-slate-500" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(t)}
                  aria-label={`Delete ${t.name}`}
                  className="grid size-11 place-items-center rounded-xl text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-rose-700"
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
