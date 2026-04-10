import { getToken, setToken as persistToken } from "@/services/api/client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface AuthContextValue {
  token: string | null;
  setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken());

  const setToken = useCallback((t: string | null) => {
    persistToken(t);
    setTokenState(t);
  }, []);

  const value = useMemo(() => ({ token, setToken }), [token, setToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** 与 Provider 同文件导出，便于 Fast Refresh */
// eslint-disable-next-line react-refresh/only-export-components -- useAuth 与 AuthProvider 配对
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
