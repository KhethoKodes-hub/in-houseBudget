// src/components/Auth.jsx
import React, { useState } from "react";
import { auth, googleProvider } from "../firebase";
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleGoogle() {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEmail(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{maxWidth:420, margin:"40px auto", padding:20, border:"1px solid #ddd", borderRadius:8}}>
      <h2>{isRegister ? "Create account" : "Sign in"}</h2>

      <button onClick={handleGoogle} disabled={loading} style={{marginBottom:12}}>
        Continue with Google
      </button>

      <hr />

      <form onSubmit={handleEmail} style={{display:"grid", gap:8, marginTop:12}}>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button type="submit" disabled={loading}>{isRegister ? "Register" : "Sign in"}</button>
      </form>

      <div style={{marginTop:12}}>
        <button onClick={() => setIsRegister(!isRegister)} style={{fontSize:13}}>
          {isRegister ? "Have an account? Sign in" : "No account? Register"}
        </button>
      </div>
    </div>
  );
}
