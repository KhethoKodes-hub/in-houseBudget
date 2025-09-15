// src/components/Household.jsx
import React, { useState } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp
} from "firebase/firestore";

export default function Household({ user, setHouseId }) {
  const [name, setName] = useState("");
  const [joinId, setJoinId] = useState("");
  const [loading, setLoading] = useState(false);

  async function createHouse() {
    if (!name) return alert("Give your house a name (like 'Our Home').");
    setLoading(true);
    try {
      const houses = collection(db, "houses");
      const ref = await addDoc(houses, {
        name,
        createdAt: serverTimestamp(),
        members: [user.uid]
      });
      alert("House created! Share this ID with your partner:\n\n" + ref.id);
      setHouseId(ref.id);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function joinHouse() {
    if (!joinId) return alert("Paste the House ID you were shared.");
    setLoading(true);
    try {
      const houseRef = doc(db, "houses", joinId);
      const snap = await getDoc(houseRef);
      if (!snap.exists()) {
        alert("No house found with that ID.");
        setLoading(false);
        return;
      }
      await updateDoc(houseRef, { members: arrayUnion(user.uid) });
      alert("Joined house!");
      setHouseId(joinId);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{maxWidth:560, margin:"40px auto", padding:16, border:"1px solid #ddd", borderRadius:8}}>
      <h2>Welcome, {user.email || user.displayName || "friend"}!</h2>
      <p>Create a new household or join an existing one with the House ID.</p>

      <div style={{marginTop:12}}>
        <h3>Create a new house</h3>
        <input placeholder="House name (e.g. Our Home)" value={name} onChange={e=>setName(e.target.value)} />
        <button onClick={createHouse} disabled={loading} style={{marginTop:8}}>Create house</button>
      </div>

      <hr style={{margin:"16px 0"}} />

      <div>
        <h3>Join an existing house</h3>
        <input placeholder="Paste House ID here" value={joinId} onChange={e=>setJoinId(e.target.value)} />
        <button onClick={joinHouse} disabled={loading} style={{marginTop:8}}>Join house</button>
      </div>
    </div>
  );
}
