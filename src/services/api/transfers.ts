import { apiDelete, apiGet, apiPost } from "@/services/api/client";
import type { PeerDTO, PieceDTO, TransferDTO, TransferDetailDTO } from "@/types/dto";

export interface TransferListParams {
  state?: string;
  paused?: boolean;
  limit?: number;
  offset?: number;
}

function buildQuery(p: TransferListParams): string {
  const q = new URLSearchParams();
  if (p.state) q.set("state", p.state);
  if (p.paused !== undefined) q.set("paused", String(p.paused));
  if (p.limit !== undefined) q.set("limit", String(p.limit));
  if (p.offset !== undefined) q.set("offset", String(p.offset));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const transfersApi = {
  list: (params: TransferListParams = {}) =>
    apiGet<TransferDTO[]>(`/transfers${buildQuery(params)}`),
  get: (hash: string) => apiGet<TransferDetailDTO>(`/transfers/${encodeURIComponent(hash)}`),
  create: (body: {
    ed2k_link: string;
    target_dir?: string;
    target_name?: string;
    paused?: boolean;
  }) => apiPost<TransferDTO>("/transfers", body),
  pause: (hash: string) => apiPost<{ ok: boolean }>(`/transfers/${encodeURIComponent(hash)}/pause`),
  resume: (hash: string) => apiPost<{ ok: boolean }>(`/transfers/${encodeURIComponent(hash)}/resume`),
  remove: (hash: string, deleteFiles?: boolean) => {
    const q = deleteFiles ? "?delete_files=true" : "";
    return apiDelete<{ ok: boolean }>(`/transfers/${encodeURIComponent(hash)}${q}`);
  },
  peers: (hash: string) => apiGet<PeerDTO[]>(`/transfers/${encodeURIComponent(hash)}/peers`),
  pieces: (hash: string) => apiGet<PieceDTO[]>(`/transfers/${encodeURIComponent(hash)}/pieces`),
};
