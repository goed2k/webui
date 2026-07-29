import type { KADV6StatusDTO } from "@/types/dto";
import { useWsStore } from "@/store/wsStore";
import { formatSpeed } from "@/utils/format";
import { Space, Tag } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

function wsColor(
  c: "idle" | "connecting" | "open" | "closed" | "error",
): "default" | "success" | "processing" | "error" | "warning" {
  switch (c) {
    case "open":
      return "success";
    case "connecting":
      return "processing";
    case "error":
      return "error";
    case "closed":
      return "warning";
    default:
      return "default";
  }
}

const WS_KEY: Record<"idle" | "connecting" | "open" | "closed" | "error", string> = {
  open: "statusBar.wsOpen",
  connecting: "statusBar.wsConnecting",
  error: "statusBar.wsError",
  closed: "statusBar.wsClosed",
  idle: "statusBar.wsIdle",
};

export function GlobalStatusBar(props: {
  engineRunning?: boolean;
  serverConnected?: number;
  dhtSummary?: string;
  downloadRate?: number;
  uploadRate?: number;
}) {
  const { t } = useTranslation();
  const { connection, clientStatus, lastError } = useWsStore();
  const totals = clientStatus?.totals as { download_rate?: number; upload_rate?: number } | undefined;
  const dl = props.downloadRate ?? totals?.download_rate ?? 0;
  const ul = props.uploadRate ?? totals?.upload_rate ?? 0;
  const engine =
    props.engineRunning ?? (clientStatus?.engine_running as boolean | undefined);
  const servers = props.serverConnected ?? (clientStatus?.servers as { connected?: number } | undefined)?.connected;
  const dht = clientStatus?.dht as { enabled?: boolean; running?: boolean; nodes?: number } | undefined;
  const dhtV6 = clientStatus?.dht_v6 as KADV6StatusDTO | undefined;

  const dhtText = useMemo(() => {
    if (props.dhtSummary) return props.dhtSummary;
    if (!dht) return t("statusBar.dhtEmpty");
    const run = dht.running ? t("statusBar.dhtRunning") : t("statusBar.dhtStopped");
    if (dht.nodes != null) {
      return `DHT ${run} · ${t("statusBar.dhtNodes", { count: dht.nodes })}`;
    }
    return `DHT ${run}`;
  }, [props.dhtSummary, dht, t]);

  const dhtV6Text = useMemo(() => {
    if (!dhtV6) return t("statusBar.dhtV6Empty");
    const run = dhtV6.bootstrapped ? t("statusBar.dhtV6Bootstrapped") : t("statusBar.dhtV6NotBootstrapped");
    if (dhtV6.live_nodes != null) {
      return `DHTv6 ${run} · ${t("statusBar.dhtV6Nodes", { count: dhtV6.live_nodes })}`;
    }
    return `DHTv6 ${run}`;
  }, [dhtV6, t]);

  return (
    <Space size={[8, 8]} wrap>
      <Tag color={wsColor(connection)}>{t(WS_KEY[connection])}</Tag>
      {lastError && connection === "error" ? (
        <Tag color="red">{lastError}</Tag>
      ) : null}
      <Tag color={engine ? "green" : "default"}>
        Engine {engine ? t("statusBar.engineRunning") : t("statusBar.engineStopped")}
      </Tag>
      <Tag>{t("statusBar.servers", { count: servers ?? t("common.dash") })}</Tag>
      <Tag>{dhtText}</Tag>
      <Tag>{dhtV6Text}</Tag>
      <Tag color="blue">↓ {formatSpeed(dl)}</Tag>
      <Tag color="cyan">↑ {formatSpeed(ul)}</Tag>
    </Space>
  );
}
