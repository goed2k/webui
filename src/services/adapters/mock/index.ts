import i18n from "@/i18n";
import type { ApiResponse } from "@/types/dto";
import type {
  DHTStatusDTO,
  SearchDTO,
  ServerDTO,
  SharedFileDTO,
  SystemConfigDTO,
  SystemHealthDTO,
  SystemInfoDTO,
  TransferDTO,
  TransferDetailDTO,
} from "@/types/dto";

function ok<T>(data: T): ApiResponse<T> {
  return { code: "OK", data };
}

function err(code: string, message: string): ApiResponse<never> {
  return { code, message };
}

const sampleHash = "a1b2c3d4e5f6789012345678901234ab";

let mockTransfers: TransferDTO[] = [
  {
    hash: sampleHash,
    file_name: "示例文件.bin",
    file_path: "./data/downloads/示例文件.bin",
    size: 104857600,
    create_time: Math.floor(Date.now() / 1000),
    state: "DOWNLOADING",
    paused: false,
    download_rate: 512 * 1024,
    upload_rate: 32 * 1024,
    total_done: 50 * 1024 * 1024,
    total_received: 50 * 1024 * 1024,
    total_wanted: 104857600,
    eta: 120,
    num_peers: 12,
    active_peers: 4,
    downloading_pieces: 3,
    progress: 0.48,
    ed2k_link: `ed2k://|file|示例文件.bin|104857600|${sampleHash}|/`,
  },
];

let mockSearch: SearchDTO = {
  id: "mock-search",
  state: "IDLE",
  params: {
    query: "",
    scope: "all",
    min_size: 0,
    max_size: 0,
    min_sources: 0,
    min_complete_sources: 0,
    file_type: "",
    extension: "",
  },
  results: [],
  updated_at: new Date().toISOString(),
};

let mockConfig: SystemConfigDTO = {
  auth_token: "secret-mock-token",
  bootstrap: {
    server_addresses: ["127.0.0.1:4661"],
    server_met_urls: [],
    nodes_dat_urls: [],
    kad_nodes: [],
  },
  state: {
    enabled: true,
    path: "./data/state/client-state.json",
    load_on_start: true,
    save_on_exit: true,
    auto_save_interval_seconds: 30,
  },
  logging: {
    level: "info",
  },
};

const mockServers: ServerDTO[] = [
  {
    identifier: "srv1",
    address: "192.168.1.1:4661",
    name: "Mock eD2k Server",
    description: "demo",
    configured: true,
    connected: true,
    handshake_completed: true,
    primary: true,
    disconnecting: false,
    client_id: 12345,
    id_class: "HIGH_ID",
    tcp_flags: 0x08,
    obfuscation_tcp_port: 4661,
    status_users: 100,
    status_files: 500000,
    udp_users: 99,
    udp_files: 499000,
    max_users: 500000,
    soft_files_limit: 100000,
    hard_files_limit: 200000,
    udp_stats_valid: true,
    download_rate: 102400,
    upload_rate: 51200,
    milliseconds_since_last_receive: 500,
  },
];

const mockSharedFiles: SharedFileDTO[] = [
  {
    hash: sampleHash,
    file_size: 1048576,
    path: "/share/demo.bin",
    name: "demo.bin",
    origin: "imported",
    completed: true,
    can_upload: true,
    last_hash_at: Math.floor(Date.now() / 1000),
  },
];

const mockDirs: string[] = ["/share"];

export async function mockRequest<T>(
  path: string,
  init: RequestInit,
): Promise<ApiResponse<T>> {
  const method = (init.method || "GET").toUpperCase();
  await Promise.resolve();

  if (path === "/system/health" && method === "GET") {
    const data: SystemHealthDTO = {
      daemon_running: true,
      engine_running: true,
      state_store_ok: true,
      rpc_available: true,
    };
    return ok(data) as ApiResponse<T>;
  }

  if (path === "/system/info" && method === "GET") {
    const data: SystemInfoDTO = {
      daemon_version: "0.0.0-mock",
      engine_running: true,
      uptime_seconds: 3600,
      rpc_listen: "127.0.0.1:8080",
      state_path: mockConfig.state?.path ?? "",
      default_download_dir: "./data/downloads",
    };
    return ok(data) as ApiResponse<T>;
  }

  if (path === "/system/config" && method === "GET") {
    return ok({ ...mockConfig }) as ApiResponse<T>;
  }

  if (path === "/system/config" && method === "PUT") {
    const body = JSON.parse((init.body as string) || "{}") as Partial<SystemConfigDTO>;
    const prevBoot = mockConfig.bootstrap ?? {
      server_addresses: [],
      server_met_urls: [],
      nodes_dat_urls: [],
      kad_nodes: [],
    };
    const prevState = mockConfig.state ?? {
      enabled: true,
      path: "",
      load_on_start: true,
      save_on_exit: true,
      auto_save_interval_seconds: 30,
    };
    const prevLog = mockConfig.logging ?? { level: "info" };
    mockConfig = {
      ...mockConfig,
      ...body,
      bootstrap: { ...prevBoot, ...body.bootstrap },
      state: { ...prevState, ...body.state },
      logging: { ...prevLog, ...body.logging },
    };
    return ok({ ...mockConfig }) as ApiResponse<T>;
  }

  if (path === "/system/start" && method === "POST") {
    return ok({ started: true }) as ApiResponse<T>;
  }
  if (path === "/system/stop" && method === "POST") {
    return ok({ stopped: true }) as ApiResponse<T>;
  }
  if (path === "/system/save-state" && method === "POST") {
    return ok({ saved: true }) as ApiResponse<T>;
  }
  if (path === "/system/load-state" && method === "POST") {
    return ok({ loaded: true }) as ApiResponse<T>;
  }

  if (path === "/network/servers" && method === "GET") {
    return ok([...mockServers]) as ApiResponse<T>;
  }
  if (path === "/network/servers/connect" && method === "POST") {
    return ok({ ok: true }) as ApiResponse<T>;
  }
  if (path === "/network/servers/connect-batch" && method === "POST") {
    return ok({ ok: true }) as ApiResponse<T>;
  }
  if (path === "/network/servers/load-met" && method === "POST") {
    return ok({ ok: true }) as ApiResponse<T>;
  }

  if (path === "/network/peers" && method === "GET") {
    return ok([
      {
        transfer_hash: "a".repeat(32),
        file_name: "mock.bin",
        file_path: "./data/mock.bin",
        peer: {
          endpoint: "1.2.3.4:5678",
          user_hash: "b".repeat(32),
          nick_name: "mock-client",
          connected: true,
          download_speed: 102400,
          upload_speed: 51200,
          source: "server|kad",
          mod_name: "eMule",
          str_mod_version: "0.50a",
          hello_misc1: 0x00fa00f9,
          hello_misc2: 0x100,
        },
      },
    ]) as ApiResponse<T>;
  }

  if (path === "/network/dht" && method === "GET") {
    const data: DHTStatusDTO = { enabled: true, running: true, nodes: 42 };
    return ok(data) as ApiResponse<T>;
  }
  if (path === "/network/dht/enable" && method === "POST") {
    return ok({ ok: true }) as ApiResponse<T>;
  }
  if (path === "/network/dht/load-nodes" && method === "POST") {
    return ok({ ok: true }) as ApiResponse<T>;
  }
  if (path === "/network/dht/bootstrap-nodes" && method === "POST") {
    return ok({ ok: true }) as ApiResponse<T>;
  }

  if (path === "/transfers" && method === "GET") {
    return ok([...mockTransfers]) as ApiResponse<T>;
  }

  if (path === "/transfers" && method === "POST") {
    const body = JSON.parse((init.body as string) || "{}") as {
      ed2k_link?: string;
      target_dir?: string;
      target_name?: string;
      paused?: boolean;
    };
    if (!body.ed2k_link) return err("BAD_REQUEST", i18n.t("mock.missingEd2kLink"));
    const t: TransferDTO = {
      hash: sampleHash,
      file_name: body.target_name || "new.bin",
      file_path: `${body.target_dir || "./data/downloads"}/new.bin`,
      size: 1000,
      create_time: Math.floor(Date.now() / 1000),
      state: "DOWNLOADING",
      paused: !!body.paused,
      download_rate: 0,
      upload_rate: 0,
      total_done: 0,
      total_received: 0,
      total_wanted: 1000,
      eta: 0,
      num_peers: 0,
      active_peers: 0,
      downloading_pieces: 0,
      progress: 0,
      ed2k_link: body.ed2k_link,
    };
    mockTransfers = [t, ...mockTransfers];
    return ok(t) as ApiResponse<T>;
  }

  const transferDetail = /^\/transfers\/([^/]+)$/.exec(path);
  if (transferDetail && method === "GET") {
    const hash = transferDetail[1];
    const tr = mockTransfers.find((x) => x.hash.toLowerCase() === hash.toLowerCase());
    if (!tr) return err("TRANSFER_NOT_FOUND", i18n.t("mock.transferNotFound"));
    const detail: TransferDetailDTO = { ...tr, peers: [], pieces: [] };
    return ok(detail) as ApiResponse<T>;
  }

  const pauseRe = /^\/transfers\/([^/]+)\/(pause|resume)$/.exec(path);
  if (pauseRe && method === "POST") {
    return ok({ ok: true }) as ApiResponse<T>;
  }

  const delRe = /^\/transfers\/([^/]+)$/.exec(path);
  if (delRe && method === "DELETE") {
    mockTransfers = mockTransfers.filter((x) => x.hash !== delRe[1]);
    return ok({ ok: true }) as ApiResponse<T>;
  }

  const peersRe = /^\/transfers\/([^/]+)\/peers$/.exec(path);
  if (peersRe && method === "GET") {
    return ok([
      {
        endpoint: "1.2.3.4:5678",
        user_hash: "a".repeat(32),
        nick_name: "mock-peer",
        connected: true,
        total_uploaded: 1024,
        total_downloaded: 2048,
        download_speed: 102400,
        payload_download_speed: 100000,
        upload_speed: 51200,
        payload_upload_speed: 50000,
        source: "server",
        mod_name: "eMule",
        version: 0x3c,
        mod_version: 0,
        str_mod_version: "0.50.0",
        hello_misc1: 0x00fa00f9,
        hello_misc2: 0x100,
        fail_count: 0,
      },
    ]) as ApiResponse<T>;
  }

  const piecesRe = /^\/transfers\/([^/]+)\/pieces$/.exec(path);
  if (piecesRe && method === "GET") {
    return ok([
      { index: 0, state: "COMPLETE", bytes_done: 102400 },
      { index: 1, state: "DOWNLOADING", bytes_done: 51200 },
    ]) as ApiResponse<T>;
  }

  if (path === "/searches" && method === "POST") {
    const body = JSON.parse((init.body as string) || "{}") as { query?: string };
    if (mockSearch.state === "RUNNING") return err("SEARCH_ALREADY_RUNNING", i18n.t("mock.searchAlreadyRunning"));
    mockSearch = {
      ...mockSearch,
      state: "RUNNING",
      params: {
        query: body.query ?? "",
        scope: "all",
        min_size: 0,
        max_size: 0,
        min_sources: 0,
        min_complete_sources: 0,
        file_type: "",
        extension: "",
      },
      results: [
        {
          hash: sampleHash,
          name: `结果 ${body.query ?? ""}.bin`,
          size: 999999,
          sources: 5,
          complete_sources: 2,
        },
      ],
      updated_at: new Date().toISOString(),
      server_busy: false,
      dht_busy: false,
    };
    return ok(mockSearch) as ApiResponse<T>;
  }

  if (path === "/searches/current" && method === "GET") {
    return ok(mockSearch) as ApiResponse<T>;
  }

  if (path === "/searches/current/stop" && method === "POST") {
    mockSearch = { ...mockSearch, state: "IDLE", results: [] };
    return ok({ ok: true }) as ApiResponse<T>;
  }

  const dlRe = /^\/searches\/current\/results\/([^/]+)\/download$/.exec(path);
  if (dlRe && method === "POST") {
    const hash = dlRe[1];
    const t: TransferDTO = {
      hash,
      file_name: "from-search.bin",
      file_path: "./data/downloads/from-search.bin",
      size: 999999,
      create_time: Math.floor(Date.now() / 1000),
      state: "DOWNLOADING",
      paused: false,
      download_rate: 0,
      upload_rate: 0,
      total_done: 0,
      total_received: 0,
      total_wanted: 999999,
      eta: 0,
      num_peers: 0,
      active_peers: 0,
      downloading_pieces: 0,
      progress: 0,
      ed2k_link: "",
    };
    mockTransfers = [t, ...mockTransfers];
    return ok(t) as ApiResponse<T>;
  }

  if (path === "/shared/files" && method === "GET") {
    return ok([...mockSharedFiles]) as ApiResponse<T>;
  }

  if (path === "/shared/dirs" && method === "GET") {
    return ok([...mockDirs]) as ApiResponse<T>;
  }

  if (path === "/shared/dirs" && method === "POST") {
    const body = JSON.parse((init.body as string) || "{}") as { path?: string };
    if (body.path) mockDirs.push(body.path);
    return ok({ ok: true }) as ApiResponse<T>;
  }

  if (path === "/shared/dirs/remove" && method === "POST") {
    return ok({ ok: true }) as ApiResponse<T>;
  }

  if (path === "/shared/dirs/rescan" && method === "POST") {
    return ok({ ok: true }) as ApiResponse<T>;
  }

  if (path === "/shared/import" && method === "POST") {
    return ok({ ok: true }) as ApiResponse<T>;
  }

  const sharedDel = /^\/shared\/files\/([^/]+)$/.exec(path);
  if (sharedDel && method === "DELETE") {
    return ok({ ok: true }) as ApiResponse<T>;
  }

  return err("NOT_FOUND", i18n.t("mock.notImplemented", { method, path }));
}
