import assert from "node:assert/strict";
import { test } from "node:test";
import { balances, parseAmount, settle, spending, splitPence, type Trip } from "./budget.ts";

const trip: Trip = {
  id: "t",
  name: "Lakes",
  currency: "GBP",
  people: ["a", "b", "c"].map((id) => ({ id, name: id })),
  expenses: [
    {
      id: "1",
      description: "Cabin",
      amount: 30000,
      paidBy: "a",
      splitWith: ["a", "b", "c"],
      date: "",
    },
    { id: "2", description: "Fuel", amount: 1001, paidBy: "b", splitWith: ["b", "c"], date: "" },
  ],
};

test("splitPence never loses a penny", () => {
  assert.deepEqual(splitPence(1000, 3), [334, 333, 333]);
  assert.equal(
    splitPence(1001, 7).reduce((a, b) => a + b),
    1001
  );
});

test("balances sum to zero and settle clears them", () => {
  const net = balances(trip);
  assert.equal(
    [...net.values()].reduce((a, b) => a + b),
    0
  );
  assert.deepEqual(Object.fromEntries(net), { a: 20000, b: -9500, c: -10500 });
  const transfers = settle(net);
  assert.deepEqual(transfers, [
    { from: "c", to: "a", amount: 10500 },
    { from: "b", to: "a", amount: 9500 },
  ]);
  const settled: Trip = {
    ...trip,
    expenses: [
      ...trip.expenses,
      ...transfers.map((t, i) => ({
        id: `s${i}`,
        description: "",
        amount: t.amount,
        paidBy: t.from,
        splitWith: [t.to],
        date: "",
        transfer: true,
      })),
    ],
  };
  assert.deepEqual(settle(balances(settled)), []);
  assert.equal(spending(settled).get("a"), 10000);
});

test("parseAmount reads common formats", () => {
  assert.equal(parseAmount("£12.50"), 1250);
  assert.equal(parseAmount("12,5"), 1250);
  assert.equal(parseAmount("0"), null);
  assert.equal(parseAmount("abc"), null);
});
