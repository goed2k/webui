import { apiGet, apiPost } from "@/services/api/client";
import type { SearchDTO, TransferDTO } from "@/types/dto";

export interface SearchCreateBody {
  query: string;
  scope?: string;
  min_size?: number;
  max_size?: number;
  min_sources?: number;
  min_complete_sources?: number;
  file_type?: string;
  extension?: string;
}

export const searchesApi = {
  start: (body: SearchCreateBody) => apiPost<SearchDTO>("/searches", body),
  current: () => apiGet<SearchDTO>("/searches/current"),
  stop: () => apiPost<{ ok: boolean }>("/searches/current/stop"),
  downloadFromResult: (
    hash: string,
    body: { target_dir?: string; target_name?: string; paused?: boolean },
  ) =>
    apiPost<TransferDTO>(
      `/searches/current/results/${encodeURIComponent(hash)}/download`,
      body,
    ),
};
