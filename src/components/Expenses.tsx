import { Plus, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { type Expense, formatMoney, parseAmount, type Trip } from "../lib/budget";
import { card, field, primary } from "./ui";

export function Expenses({ trip, onChange }: { trip: Trip; onChange: (t: Trip) => void }) {
  const everyone = trip.people.map((p) => p.id);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(everyone[0] ?? "");
  const [splitWith, setSplitWith] = useState<string[]>(everyone);
  const [newPerson, setNewPerson] = useState("");
  const pence = parseAmount(amount);
  const name = new Map(trip.people.map((p) => [p.id, p.name]));

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!pence || !splitWith.length || !name.has(paidBy)) return;
    const expense: Expense = {
      id: crypto.randomUUID(),
      description: description.trim().slice(0, 80) || "Expense",
      amount: pence,
      paidBy,
      splitWith: everyone.filter((id) => splitWith.includes(id)),
      date: new Date().toISOString(),
    };
    onChange({ ...trip, expenses: [expense, ...trip.expenses] });
    setDescription("");
    setAmount("");
    setSplitWith(everyone);
  }

  function addPerson(e: React.FormEvent) {
    e.preventDefault();
    const n = newPerson.trim().slice(0, 30);
    if (!n) return;
    const id = crypto.randomUUID();
    onChange({ ...trip, people: [...trip.people, { id, name: n }] });
    setSplitWith([...splitWith, id]);
    setNewPerson("");
  }

  const toggle = (id: string) =>
    setSplitWith(splitWith.includes(id) ? splitWith.filter((x) => x !== id) : [...splitWith, id]);

  return (
    <section aria-labelledby="expenses-h" className="flex flex-col gap-4">
      <h2 id="expenses-h" className="text-xl font-extrabold">
        Expenses
      </h2>
      <form onSubmit={add} className={`${card} flex flex-col gap-3`}>
        <div className="grid grid-cols-[1fr_8rem] gap-2">
          <label className="flex flex-col gap-1 text-sm font-semibold">
            What for
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dinner"
              className={field}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Amount
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              aria-invalid={amount !== "" && !pence}
              className={`${field} tabular-nums`}
              required
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Paid by
          <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)} className={field}>
            {trip.people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend className="mb-1 text-sm font-semibold">Shared by</legend>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSplitWith(splitWith.length === everyone.length ? [] : everyone)}
              className="min-h-11 rounded-full px-3 text-sm font-semibold text-sky-800 underline hover:no-underline"
            >
              {splitWith.length === everyone.length ? "Nobody" : "Everyone"}
            </button>
            {trip.people.map((p) => (
              <label
                key={p.id}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-3 text-sm font-semibold ring-1 ring-slate-300 has-checked:bg-sky-50 has-checked:ring-sky-700 has-focus-visible:outline-2 has-focus-visible:outline-sky-700"
              >
                <input
                  type="checkbox"
                  checked={splitWith.includes(p.id)}
                  onChange={() => toggle(p.id)}
                  className="size-4 accent-sky-700"
                />
                {p.name}
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" disabled={!pence || !splitWith.length} className={primary}>
          <Plus size={16} aria-hidden="true" />
          Add {pence ? formatMoney(pence, trip.currency) : "expense"}
          {pence && splitWith.length
            ? ` · ${formatMoney(Math.ceil(pence / splitWith.length), trip.currency)} each`
            : ""}
        </button>
      </form>

      <form onSubmit={addPerson} className="flex gap-2">
        <label htmlFor="new-person" className="sr-only">
          Add someone to {trip.name}
        </label>
        <input
          id="new-person"
          value={newPerson}
          onChange={(e) => setNewPerson(e.target.value)}
          placeholder="Someone joined late?"
          className={`${field} flex-1`}
        />
        <button
          type="submit"
          className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold ring-1 ring-slate-300 hover:bg-white"
        >
          <UserPlus size={16} aria-hidden="true" />
          Add person
        </button>
      </form>

      {trip.expenses.length > 0 && (
        <ul className="flex flex-col gap-2">
          {trip.expenses.map((e) => (
            <li key={e.id} className={`${card} flex items-center gap-3 p-3`}>
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {e.transfer
                    ? `${name.get(e.paidBy)} paid ${name.get(e.splitWith[0] ?? "")}`
                    : e.description}
                </p>
                <p className="truncate text-sm text-slate-600">
                  {e.transfer
                    ? "Settle-up payment"
                    : `${name.get(e.paidBy)} paid · ${
                        e.splitWith.length === trip.people.length
                          ? "everyone"
                          : e.splitWith.map((id) => name.get(id)).join(", ")
                      }`}
                </p>
              </div>
              <span className="font-black tabular-nums">
                {formatMoney(e.amount, trip.currency)}
              </span>
              <button
                type="button"
                onClick={() =>
                  onChange({ ...trip, expenses: trip.expenses.filter((x) => x.id !== e.id) })
                }
                aria-label={`Delete ${e.description}`}
                className="grid size-11 place-items-center rounded-xl text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-rose-700"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
