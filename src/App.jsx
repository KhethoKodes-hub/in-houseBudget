// src/App.jsx
import React, { useEffect, useState } from "react";
import Auth from "./components/Auth";
import Household from "./components/Household";
import BudgetAndTransactions from "./components/BudgetAndTransactions";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function App() {
  const [user, setUser] = useState(null);
  const [houseId, setHouseId] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return unsub;
  }, []);

  if (!user) {
    return <Auth />;
  }

  if (!houseId) {
    return <Household user={user} setHouseId={setHouseId} />;
  }

  return (
    <div className="container">
      <header style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16}}>
        <h2>House Finance — House ID: {houseId}</h2>
        <div>
          <button onClick={() => setHouseId(null)} style={{marginRight:8}}>Leave / Switch House</button>
          <button onClick={() => signOut(auth)}>Sign out</button>
        </div>
      </header>

      <BudgetAndTransactions user={user} houseId={houseId} />

      <footer style={{marginTop: 24, fontSize: 12, color: "#666"}}>
        Tip: To invite your partner, share this House ID: <strong>{houseId}</strong>
      </footer>
    </div>
  );
}
