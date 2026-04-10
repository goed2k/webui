/** 与 daemon docs/API.md 对齐的 DTO 类型 */

export interface ApiOk<T> {
  code: "OK";
  data: T;
}

export interface ApiErr {
  code: string;
  message: string;
}

export type ApiResponse<T> = ApiOk<T> | ApiErr;

export interface SystemHealthDTO {
  daemon_running: boolean;
  engine_running: boolean;
  state_store_ok: boolean;
  rpc_available: boolean;
}

export interface SystemInfoDTO {
  daemon_version: string;
  engine_running: boolean;
  uptime_seconds: number;
  rpc_listen: string;
  state_path: string;
  default_download_dir: string;
}

export interface TransferDTO {
  hash: string;
  file_name: string;
  file_path: string;
  size: number;
  create_time: number;
  state: string;
  paused: boolean;
  download_rate: number;
  upload_rate: number;
  total_done: number;
  total_received: number;
  total_wanted: number;
  eta: number;
  num_peers: number;
  active_peers: number;
  downloading_pieces: number;
  progress: number;
  ed2k_link: string;
}

export interface TransferDetailDTO extends TransferDTO {
  peers?: PeerDTO[];
  pieces?: PieceDTO[];
}

export interface PeerDTO {
  endpoint?: string;
  source?: string;
  download_rate?: number;
  upload_rate?: number;
  [key: string]: unknown;
}

export interface PieceDTO {
  index: number;
  state: string;
  [key: string]: unknown;
}

export interface SearchParamsDTO {
  query: string;
  scope: string;
  min_size: number;
  max_size: number;
  min_sources: number;
  min_complete_sources: number;
  file_type: string;
  extension: string;
}

export interface SearchResultItemDTO {
  hash: string;
  name?: string;
  file_name?: string;
  size?: number;
  sources?: number;
  complete_sources?: number;
  file_type?: string;
  extension?: string;
  [key: string]: unknown;
}

export interface SearchDTO {
  id: string;
  state: string;
  params: SearchParamsDTO;
  results: SearchResultItemDTO[];
  updated_at: string;
  started_at?: string;
  server_busy?: boolean;
  dht_busy?: boolean;
  kad_keyword?: string;
  error?: string;
}

export interface ServerDTO {
  identifier: string;
  address: string;
  configured: boolean;
  connected: boolean;
  handshake_completed: boolean;
  primary: boolean;
  disconnecting: boolean;
  client_id: number;
  id_class: string;
  download_rate: number;
  upload_rate: number;
  milliseconds_since_last_receive: number;
}

export interface DHTStatusDTO {
  enabled?: boolean;
  running?: boolean;
  nodes?: number;
  [key: string]: unknown;
}

export interface SharedFileDTO {
  hash: string;
  file_size: number;
  path: string;
  name: string;
  origin: string;
  completed: boolean;
  can_upload: boolean;
  last_hash_at: number;
}

export interface SystemConfigDTO {
  auth_token?: string;
  bootstrap?: {
    server_addresses: string[];
    server_met_urls: string[];
    nodes_dat_urls: string[];
    kad_nodes: string[];
  };
  state?: {
    enabled: boolean;
    path: string;
    load_on_start: boolean;
    save_on_exit: boolean;
    auto_save_interval_seconds: number;
  };
  logging?: {
    level: string;
  };
  [key: string]: unknown;
}

/** WebSocket 事件外壳 */
export interface WsEventEnvelope<T = unknown> {
  type: string;
  at: string;
  data: T;
}

export interface ClientStatusData {
  status?: {
    engine_running?: boolean;
    servers?: { connected?: number; total?: number };
    transfers?: { count?: number; download_rate?: number; upload_rate?: number };
    dht?: DHTStatusDTO;
    totals?: { download_rate?: number; upload_rate?: number };
    [key: string]: unknown;
  };
}

export interface TransferProgressData {
  progress?: {
    transfers?: TransferDTO[];
  };
}
