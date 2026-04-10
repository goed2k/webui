import i18n from "@/i18n";
import { useWsStore } from "@/store/wsStore";
import type { ClientStatusData, TransferProgressData, WsEventEnvelope } from "@/types/dto";
import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";

function getWsBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE;
  if (base) {
    const u = new URL(base);
    const wsProto = u.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProto}//${u.host}`;
  }
  const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${wsProto}//${window.location.host}`;
}

export interface EventsWsCallbacks {
  onClientStatus?: (data: ClientStatusData) => void;
  onTransferProgress?: (data: TransferProgressData) => void;
}

export function connectEventsWs(
  getToken: () => string | null,
  queryClient: QueryClient,
  callbacks?: EventsWsCallbacks,
): () => void {
  const useMock = import.meta.env.VITE_USE_MOCK === "true";
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let mockTimer: ReturnType<typeof setInterval> | null = null;
  let stopped = false;
  const { setConnection, setLastError, setClientStatus } = useWsStore.getState();

  function scheduleReconnect() {
    if (stopped) return;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => connect(), 3000);
  }

  function handleMessage(raw: string) {
    try {
      const env = JSON.parse(raw) as WsEventEnvelope;
      if (env.type === "client.status") {
        const d = env.data as ClientStatusData;
        setClientStatus(d.status ?? null);
        callbacks?.onClientStatus?.(d);
        void queryClient.invalidateQueries({ queryKey: queryKeys.info });
        void queryClient.invalidateQueries({ queryKey: queryKeys.servers });
        void queryClient.invalidateQueries({ queryKey: queryKeys.dht });
      } else if (env.type === "transfer.progress") {
        const d = env.data as TransferProgressData;
        callbacks?.onTransferProgress?.(d);
        void queryClient.invalidateQueries({ queryKey: ["transfers"] });
        const list = d.progress?.transfers;
        if (list?.length) {
          for (const t of list) {
            void queryClient.invalidateQueries({ queryKey: queryKeys.transfer(t.hash) });
          }
        }
      }
    } catch {
      /* ignore */
    }
  }

  function connect() {
    if (stopped) return;

    if (useMock) {
      setConnection("open");
      setLastError(null);
      mockTimer = setInterval(() => {
        const fake: WsEventEnvelope<ClientStatusData> = {
          type: "client.status",
          at: new Date().toISOString(),
          data: {
            status: {
              engine_running: true,
              servers: { connected: 1, total: 2 },
              transfers: { count: 1, download_rate: 102400, upload_rate: 51200 },
              dht: { enabled: true, running: true, nodes: 10 },
              totals: { download_rate: 102400, upload_rate: 51200 },
            },
          },
        };
        handleMessage(JSON.stringify(fake));
      }, 5000);
      return;
    }

    const token = getToken();
    if (!token) {
      setConnection("idle");
      scheduleReconnect();
      return;
    }

    setConnection("connecting");
    setLastError(null);

    const url = `${getWsBaseUrl()}/api/v1/events/ws?token=${encodeURIComponent(token)}`;
    ws = new WebSocket(url);

    ws.onopen = () => {
      setConnection("open");
    };

    ws.onmessage = (ev) => {
      if (typeof ev.data === "string") handleMessage(ev.data);
    };

    ws.onerror = () => {
      setLastError(i18n.t("statusBar.wsStreamError"));
      setConnection("error");
    };

    ws.onclose = () => {
      ws = null;
      setConnection("closed");
      scheduleReconnect();
    };
  }

  connect();

  return () => {
    stopped = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (mockTimer) clearInterval(mockTimer);
    if (ws) {
      ws.close();
      ws = null;
    }
    setConnection("idle");
  };
}
