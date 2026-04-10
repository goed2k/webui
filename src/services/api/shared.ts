import { apiDelete, apiGet, apiPost } from "@/services/api/client";
import type { SharedFileDTO } from "@/types/dto";

export const sharedApi = {
  files: () => apiGet<SharedFileDTO[]>("/shared/files"),
  dirs: () => apiGet<string[]>("/shared/dirs"),
  addDir: (path: string) => apiPost<{ ok: boolean }>("/shared/dirs", { path }),
  removeDir: (path: string) => apiPost<{ ok: boolean }>("/shared/dirs/remove", { path }),
  rescan: () => apiPost<{ ok: boolean }>("/shared/dirs/rescan"),
  importFile: (path: string) => apiPost<{ ok: boolean }>("/shared/import", { path }),
  removeFile: (hash: string) =>
    apiDelete<{ ok: boolean }>(`/shared/files/${encodeURIComponent(hash)}`),
};
