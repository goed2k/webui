import { systemApi } from "@/services/api/system";
import { networkApi } from "@/services/api/network";
import { transfersApi } from "@/services/api/transfers";
import { queryKeys } from "@/constants/queryKeys";
import { formatSpeed, formatTimestamp } from "@/utils/format";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Col, Row, Space, Statistic, Table, Typography, message } from "antd";
import type { TransferDTO } from "@/types/dto";
import { ApiError } from "@/services/api/client";
import { useTranslation } from "react-i18next";

export function DashboardPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const health = useQuery({
    queryKey: queryKeys.health,
    queryFn: () => systemApi.health(),
  });

  const info = useQuery({
    queryKey: queryKeys.info,
    queryFn: () => systemApi.info(),
  });

  const servers = useQuery({
    queryKey: queryKeys.servers,
    queryFn: () => networkApi.servers(),
  });

  const dht = useQuery({
    queryKey: queryKeys.dht,
    queryFn: () => networkApi.dht(),
  });

  const transfers = useQuery({
    queryKey: queryKeys.transfers(),
    queryFn: () => transfersApi.list({ limit: 50 }),
  });

  const start = useMutation({
    mutationFn: () => systemApi.start(),
    onSuccess: () => {
      message.success(t("pages.dashboard.msgStart"));
      void qc.invalidateQueries();
    },
    onError: (e: Error) => {
      if (e instanceof ApiError && e.code === "ENGINE_ALREADY_RUNNING")
        message.warning(t("pages.dashboard.msgEngineRunning"));
    },
  });

  const stop = useMutation({
    mutationFn: () => systemApi.stop(),
    onSuccess: () => {
      message.success(t("pages.dashboard.msgStop"));
      void qc.invalidateQueries();
    },
  });

  const saveState = useMutation({
    mutationFn: () => systemApi.saveState(),
    onSuccess: () => {
      message.success(t("pages.dashboard.msgSaved"));
      void qc.invalidateQueries();
    },
  });

  const loadState = useMutation({
    mutationFn: () => systemApi.loadState(),
    onSuccess: () => {
      message.success(t("pages.dashboard.msgLoaded"));
      void qc.invalidateQueries();
    },
  });

  const connectedCount = (servers.data ?? []).filter((s) => s.connected).length;
  const recent = (transfers.data ?? []).slice(0, 8);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space wrap>
        <Button type="primary" onClick={() => start.mutate()} loading={start.isPending}>
          {t("pages.dashboard.startEngine")}
        </Button>
        <Button danger onClick={() => stop.mutate()} loading={stop.isPending}>
          {t("pages.dashboard.stopEngine")}
        </Button>
        <Button onClick={() => saveState.mutate()} loading={saveState.isPending}>
          {t("pages.dashboard.saveState")}
        </Button>
        <Button onClick={() => loadState.mutate()} loading={loadState.isPending}>
          {t("pages.dashboard.loadState")}
        </Button>
        <Button onClick={() => void qc.invalidateQueries()}>{t("pages.dashboard.refreshData")}</Button>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title={t("pages.dashboard.statDaemon")}
              value={health.data?.daemon_running ? t("pages.dashboard.daemonOk") : t("pages.dashboard.daemonBad")}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title={t("pages.dashboard.statEngine")}
              value={
                health.data?.engine_running ? t("statusBar.engineRunning") : t("statusBar.engineStopped")
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title={t("pages.dashboard.statVersion")} value={info.data?.daemon_version ?? t("common.dash")} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title={t("pages.dashboard.statUptime")} value={info.data?.uptime_seconds ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title={t("pages.dashboard.statServers")} value={connectedCount} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title={t("pages.dashboard.statDht")}
              value={
                dht.data && typeof dht.data === "object" && "nodes" in dht.data
                  ? String((dht.data as { nodes?: number }).nodes ?? t("common.dash"))
                  : t("common.dash")
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title={t("pages.dashboard.statTasks")} value={transfers.data?.length ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title={t("pages.dashboard.statStateStore")}
              value={health.data?.state_store_ok ? t("pages.dashboard.stateOk") : t("pages.dashboard.stateBad")}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title={t("pages.dashboard.recentTasks")} size="small">
            <Table<TransferDTO>
              size="small"
              rowKey={(r) => r.hash}
              pagination={false}
              dataSource={recent}
              columns={[
                { title: t("pages.dashboard.colFileName"), dataIndex: "file_name", ellipsis: true },
                {
                  title: t("pages.dashboard.colProgress"),
                  dataIndex: "progress",
                  render: (p: number) => `${(p * 100).toFixed(1)}%`,
                },
                {
                  title: t("pages.dashboard.colRates"),
                  key: "sp",
                  render: (_, r) => `${formatSpeed(r.download_rate)} / ${formatSpeed(r.upload_rate)}`,
                },
                { title: t("pages.dashboard.colState"), dataIndex: "state", width: 120 },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title={t("pages.dashboard.serverOverview")} size="small">
            <Table
              size="small"
              rowKey={(r) => r.identifier + r.address}
              pagination={false}
              dataSource={(servers.data ?? []).slice(0, 6)}
              columns={[
                { title: t("pages.dashboard.colAddress"), dataIndex: "address", ellipsis: true },
                {
                  title: t("pages.dashboard.colConnected"),
                  dataIndex: "connected",
                  width: 90,
                  render: (v: boolean) => (v ? t("common.yes") : t("common.no")),
                },
                {
                  title: t("pages.dashboard.colPrimary"),
                  dataIndex: "primary",
                  width: 80,
                  render: (v: boolean) => (v ? t("common.yes") : t("common.no")),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card size="small">
        <Typography.Text strong>{t("pages.dashboard.defaultDownloadDir")}</Typography.Text>{" "}
        <Typography.Text code>{info.data?.default_download_dir ?? t("common.dash")}</Typography.Text>
        <br />
        <Typography.Text strong>{t("pages.dashboard.stateFilePath")}</Typography.Text>{" "}
        <Typography.Text code>{info.data?.state_path ?? t("common.dash")}</Typography.Text>
        <br />
        <Typography.Text type="secondary">
          {t("pages.dashboard.lastUpdated")}
          {formatTimestamp(Math.floor(Date.now() / 1000))}
        </Typography.Text>
      </Card>
    </Space>
  );
}
