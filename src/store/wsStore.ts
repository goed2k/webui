import { create } from "zustand";
import type { ClientStatusData } from "@/types/dto";

export type WsConnectionState = "idle" | "connecting" | "open" | "closed" | "error";

interface WsStore {
  connection: WsConnectionState;
  lastError: string | null;
  clientStatus: ClientStatusData["status"] | null;
  setConnection: (c: WsConnectionState) => void;
  setLastError: (e: string | null) => void;
  setClientStatus: (s: ClientStatusData["status"] | null) => void;
}

export const useWsStore = create<WsStore>((set) => ({
  connection: "idle",
  lastError: null,
  clientStatus: null,
  setConnection: (connection) => set({ connection }),
  setLastError: (lastError) => set({ lastError }),
  setClientStatus: (clientStatus) => set({ clientStatus }),
}));
