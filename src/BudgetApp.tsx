import { Briefcase, ReceiptText, Scale } from "lucide-react";
import { useEffect, useState } from "react";
import { DataBackup } from "./components/DataBackup";
import { Expenses } from "./components/Expenses";
import { Settle } from "./components/Settle";
import { Trips } from "./components/Trips";
import { type BudgetData, EMPTY, parseBudget, type Trip } from "./lib/budget";
import { type BeforeExport, load, save } from "./lib/storage";

const KEY = "budget-tracker";
type Tab = "expenses" | "settle" | "trips";

const TABS = [
  { id: "expenses", label: "Expenses", Icon: ReceiptText },
  { id: "settle", label: "Settle up", Icon: Scale },
  { id: "trips", label: "Groups", Icon: Briefcase },
] as const;

export function BudgetApp({ beforeExport }: { beforeExport?: BeforeExport }) {
  const [tab, setTab] = useState<Tab>("trips");
  const [data, setData] = useState<BudgetData>(EMPTY);
  const [ready, setReady] = useState(false);

  // Load after mount: localStorage is unavailable during SSR and would cause a hydration mismatch.
  useEffect(() => {
    const stored = parseBudget(load<unknown>(KEY, null)) ?? EMPTY;
    setData(stored);
    if (stored.activeTripId) setTab("expenses");
    setReady(true);
  }, []);

  const update = (next: BudgetData) => {
    setData(next);
    save(KEY, next);
  };
  const trip = data.trips.find((t) => t.id === data.activeTripId) ?? null;
  const setTrip = (next: Trip) =>
    update({ ...data, trips: data.trips.map((t) => (t.id === next.id ? next : t)) });

  if (!ready) return <div className="h-full animate-pulse bg-slate-100" />;

  return (
    <div className="flex h-full flex-col bg-slate-50 text-slate-900">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-2xl flex-col gap-5 p-4">
          {trip && tab !== "trips" && (
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-800">
              {trip.name}
            </p>
          )}
          {tab === "trips" && (
            <>
              <Trips
                data={data}
                onChange={update}
                onOpen={(id) => {
                  update({ ...data, activeTripId: id });
                  setTab("expenses");
                }}
              />
              <DataBackup
                filename="budget-tracker.json"
                data={data}
                parse={parseBudget}
                onRestore={update}
                beforeExport={beforeExport}
              />
            </>
          )}
          {tab !== "trips" && !trip && (
            <p className="rounded-2xl bg-white p-8 text-center text-slate-600 ring-1 ring-slate-200">
              Start a group in the Groups tab first.
            </p>
          )}
          {tab === "expenses" && trip && <Expenses key={trip.id} trip={trip} onChange={setTrip} />}
          {tab === "settle" && trip && <Settle trip={trip} onChange={setTrip} />}
        </div>
      </div>
      <nav
        aria-label="Budget Tracker"
        className="grid grid-cols-3 gap-1 border-t border-slate-200 bg-white p-1.5"
      >
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            aria-current={tab === id ? "page" : undefined}
            onClick={() => setTab(id)}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-xl text-sm font-extrabold transition active:scale-[0.97] ${
              tab === id ? "bg-sky-700 text-white" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Icon size={18} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
