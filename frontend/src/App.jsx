import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import LoginPage from "./pages/LoginPage";
import ClaimPage from "./pages/ClaimPage";
import Dashboard from "./pages/Dashboard";
import ExplorePage from "./pages/ExplorePage";
import { api } from "./lib/api";

export default function App() {
  const [user,setUser]=useState(null);
  const [checking,setChecking]=useState(true);
  const [authError,setAuthError]=useState("");

  useEffect(()=>{
    let active=true;
    api("/api/auth/me").then((data)=>{if(active)setUser(data.user)}).catch(()=>{if(active)setUser(null)}).finally(()=>{if(active)setChecking(false)});
    return ()=>{active=false};
  },[]);

  const login = useCallback(async (credential)=>{
    const data=await api("/api/auth/google",{method:"POST",body:JSON.stringify({credential})});
    setUser(data.user); return data.user;
  },[]);
  const logout = useCallback(async ()=>{
    try{await api("/api/auth/logout",{method:"POST"})}catch{}
    setUser(null);
  },[]);

  if(checking) return <div className="grid min-h-screen place-items-center bg-cream"><div className="text-center"><LoaderCircle className="mx-auto animate-spin text-forest" size={30}/><p className="mt-3 text-sm text-muted">Preparing your little corner of happiness…</p></div></div>;

  return <Routes>
    <Route path="/claim/:token" element={<ClaimPage user={user} onLogin={login} onClaimed={()=>api("/api/auth/me").then(d=>setUser(d.user))}/>} />
    <Route path="/login" element={user?<Navigate to="/" replace/>:<LoginPage onLogin={login}/>} />
    <Route path="/explore" element={user?<ExplorePage user={user} onLogout={logout}/>:<Navigate to="/login" replace/>}/>
    <Route path="/" element={user?<Dashboard user={user} onLogout={logout}/>:<LoginPage onLogin={login}/>} />
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>;
}