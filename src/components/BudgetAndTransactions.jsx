// src/components/BudgetAndTransactions.jsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";

export default function BudgetAndTransactions({ user, houseId }) {
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // form state
  const [newCategory, setNewCategory] = useState("");
  const [newPlanned, setNewPlanned] = useState("");
  const [amount, setAmount] = useState("");
  const [txnType, setTxnType] = useState("out"); // 'in' or 'out'
  const [desc, setDesc] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // subscribe to budgets
  useEffect(() => {
    if (!houseId) return;
    const q = query(collection(db, "houses", houseId, "budgets"), orderBy("name"));
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setBudgets(arr);
    });
    return unsub;
  }, [houseId]);

  // subscribe to transactions
  useEffect(() => {
    if (!houseId) return;
    const q = query(
      collection(db, "houses", houseId, "transactions"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(arr);
    });
    return unsub;
  }, [houseId]);

  async function addBudget(e) {
    e.preventDefault();
    if (!newCategory || !newPlanned)
      return alert("Enter category name and planned amount.");
    try {
      await addDoc(collection(db, "houses", houseId, "budgets"), {
        name: newCategory,
        planned: parseFloat(newPlanned),
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        createdByEmail: user.email || user.displayName || "Unknown"
      });
      setNewCategory("");
      setNewPlanned("");
    } catch (e) {
      alert(e.message);
    }
  }

  async function addTransaction(e) {
    e.preventDefault();
    if (!amount) return alert("Enter an amount.");
    try {
      await addDoc(collection(db, "houses", houseId, "transactions"), {
        amount: parseFloat(amount),
        type: txnType,
        description: desc || "",
        categoryId: selectedCategory || null,
        createdBy: user.uid,
        createdByEmail: user.email || user.displayName || "Unknown",
        createdAt: serverTimestamp()
      });
      setAmount("");
      setDesc("");
    } catch (e) {
      alert(e.message);
    }
  }

  // compute monthly totals (current month)
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const thisMonthTxns = transactions.filter((t) => {
    if (!t.createdAt) return false;
    const date = t.createdAt.toDate
      ? t.createdAt.toDate()
      : new Date(t.createdAt);
    return date.getMonth() === month && date.getFullYear() === year;
  });

  const incomeThisMonth = thisMonthTxns
    .filter((t) => t.type === "in")
    .reduce((s, t) => s + (t.amount || 0), 0);
  const expensesThisMonth = thisMonthTxns
    .filter((t) => t.type === "out")
    .reduce((s, t) => s + (t.amount || 0), 0);
  const net = incomeThisMonth - expensesThisMonth;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Dashboard + Budgets */}
      <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
        <h3>Dashboard (this month)</h3>
        <p>
          Income: <strong>{incomeThisMonth.toFixed(2)}</strong>
        </p>
        <p>
          Expenses: <strong>{expensesThisMonth.toFixed(2)}</strong>
        </p>
        <p>
          Net: <strong>{net.toFixed(2)}</strong>
        </p>

        <hr />

        <h4>Budgets</h4>
        <form
          onSubmit={addBudget}
          style={{ display: "flex", gap: 8, marginBottom: 12 }}
        >
          <input
            placeholder="Category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <input
            placeholder="Planned amount"
            value={newPlanned}
            onChange={(e) => setNewPlanned(e.target.value)}
          />
          <button type="submit">Add</button>
        </form>

        <div>
          {budgets.length === 0 && <p>No budgets yet.</p>}
          {budgets.map((b) => {
            const spent = thisMonthTxns
              .filter((t) => t.categoryId === b.id && t.type === "out")
              .reduce((s, t) => s + (t.amount || 0), 0);
            const remaining = (b.planned || 0) - spent;
            return (
              <div
                key={b.id}
                style={{ padding: 8, borderBottom: "1px solid #eee" }}
              >
                <strong>{b.name}</strong>
                <div>
                  Planned: {Number(b.planned || 0).toFixed(2)}
                </div>
                <div>Spent: {spent.toFixed(2)}</div>
                <div>Remaining: {remaining.toFixed(2)}</div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  Added by: {b.createdByEmail}
                </div>

                <button
                  onClick={() => {
                    const newName = prompt("New name:", b.name);
                    const newPlanned = prompt(
                      "New planned amount:",
                      b.planned
                    );
                    if (newName && newPlanned) {
                      updateDoc(doc(db, "houses", houseId, "budgets", b.id), {
                        name: newName,
                        planned: parseFloat(newPlanned)
                      });
                    }
                  }}
                >
                  Edit
                </button>

                <button
                  onClick={() => {
                    if (confirm("Delete this budget?")) {
                      deleteDoc(doc(db, "houses", houseId, "budgets", b.id));
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div style={{ marginTop: 12, fontWeight: "bold" }}>
          Total Planned:{" "}
          {budgets
            .reduce((s, b) => s + (b.planned || 0), 0)
            .toFixed(2)}
          <br />
          Total Spent:{" "}
          {thisMonthTxns
            .reduce(
              (s, t) => s + (t.type === "out" ? (t.amount || 0) : 0),
              0
            )
            .toFixed(2)}
          <br />
          Total Remaining:{" "}
          {(
            budgets.reduce((s, b) => s + (b.planned || 0), 0) -
            thisMonthTxns.reduce(
              (s, t) => s + (t.type === "out" ? (t.amount || 0) : 0),
              0
            )
          ).toFixed(2)}
        </div>
      </div>

      {/* Transactions */}
      <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
        <h3>Add transaction</h3>
        <form onSubmit={addTransaction} style={{ display: "grid", gap: 8 }}>
          <input
            placeholder="Amount (e.g. 15.50)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <select value={txnType} onChange={(e) => setTxnType(e.target.value)}>
            <option value="out">Expense (out)</option>
            <option value="in">Income (in)</option>
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">-- Category (optional) --</option>
            {budgets.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Description (optional)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <button type="submit">Add transaction</button>
        </form>

        <hr style={{ margin: "12px 0" }} />

        <h4>Recent transactions (all)</h4>
        <div style={{ maxHeight: 300, overflow: "auto" }}>
          {transactions.length === 0 && <p>No transactions yet.</p>}
          {transactions.map((t) => {
            const date = t.createdAt?.toDate
              ? t.createdAt.toDate().toLocaleString()
              : "";
            const cat = budgets.find((b) => b.id === t.categoryId);
            return (
              <div
                key={t.id}
                style={{ padding: 8, borderBottom: "1px solid #eee" }}
              >
                <div>
                  <strong>
                    {t.type === "in" ? "+" : "-"}
                    {Number(t.amount || 0).toFixed(2)}
                  </strong>{" "}
                  &nbsp;
                  <span style={{ color: "#666" }}>
                    {cat ? `(${cat.name})` : ""}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  {t.description || ""} — {date}
                  <br />
                  Added by: {t.createdByEmail}
                </div>

                <button
                  onClick={() => {
                    const newAmount = prompt("New amount:", t.amount);
                    const newDesc = prompt(
                      "New description:",
                      t.description || ""
                    );
                    if (newAmount) {
                      updateDoc(
                        doc(db, "houses", houseId, "transactions", t.id),
                        {
                          amount: parseFloat(newAmount),
                          description: newDesc
                        }
                      );
                    }
                  }}
                >
                  Edit
                </button>

                <button
                  onClick={() => {
                    if (confirm("Delete this transaction?")) {
                      deleteDoc(
                        doc(db, "houses", houseId, "transactions", t.id)
                      );
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
