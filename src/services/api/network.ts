import { apiGet, apiPost } from "@/services/api/client";
import type { DHTStatusDTO, ServerDTO } from "@/types/dto";

export const networkApi = {
  servers: () => apiGet<ServerDTO[]>("/network/servers"),
  connect: (address: string) => apiPost<{ ok: boolean }>("/network/servers/connect", { address }),
  connectBatch: (addresses: string[]) =>
    apiPost<{ ok: boolean }>("/network/servers/connect-batch", { addresses }),
  loadMet: (sources: string[]) =>
    apiPost<{ ok: boolean }>("/network/servers/load-met", { sources }),
  dht: () => apiGet<DHTStatusDTO>("/network/dht"),
  dhtEnable: () => apiPost<{ ok: boolean }>("/network/dht/enable"),
  dhtLoadNodes: (sources: string[]) =>
    apiPost<{ ok: boolean }>("/network/dht/load-nodes", { sources }),
  dhtBootstrap: (nodes: string[]) =>
    apiPost<{ ok: boolean }>("/network/dht/bootstrap-nodes", { nodes }),
};
