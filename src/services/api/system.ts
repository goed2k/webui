import { apiGet, apiPost, apiPut } from "@/services/api/client";
import type { SystemConfigDTO, SystemHealthDTO, SystemInfoDTO } from "@/types/dto";

export const systemApi = {
  health: () => apiGet<SystemHealthDTO>("/system/health", true),
  info: () => apiGet<SystemInfoDTO>("/system/info"),
  config: () => apiGet<SystemConfigDTO>("/system/config"),
  updateConfig: (body: Partial<SystemConfigDTO>) => apiPut<SystemConfigDTO>("/system/config", body),
  start: () => apiPost<{ started: boolean }>("/system/start"),
  stop: () => apiPost<{ stopped: boolean }>("/system/stop"),
  saveState: () => apiPost<{ saved: boolean }>("/system/save-state"),
  loadState: () => apiPost<{ loaded: boolean }>("/system/load-state"),
};
