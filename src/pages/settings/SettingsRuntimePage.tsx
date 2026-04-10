import { systemApi } from "@/services/api/system";
import { queryKeys } from "@/constants/queryKeys";
import { maskToken } from "@/utils/format";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Descriptions, Space, Typography, message } from "antd";
import { useTranslation } from "react-i18next";

export function SettingsRuntimePage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const health = useQuery({ queryKey: queryKeys.health, queryFn: () => systemApi.health() });
  const info = useQuery({ queryKey: queryKeys.info, queryFn: () => systemApi.info() });
  const config = useQuery({ queryKey: queryKeys.config, queryFn: () => systemApi.config() });

  const start = useMutation({
    mutationFn: () => systemApi.start(),
    onSuccess: () => {
      message.success(t("pages.settingsRuntime.msgStart"));
      void qc.invalidateQueries();
    },
  });
  const stop = useMutation({
    mutationFn: () => systemApi.stop(),
    onSuccess: () => {
      message.success(t("pages.settingsRuntime.msgStop"));
      void qc.invalidateQueries();
    },
  });
  const saveState = useMutation({
    mutationFn: () => systemApi.saveState(),
    onSuccess: () => {
      message.success(t("pages.settingsRuntime.msgSaved"));
      void qc.invalidateQueries();
    },
  });
  const loadState = useMutation({
    mutationFn: () => systemApi.loadState(),
    onSuccess: () => {
      message.success(t("pages.settingsRuntime.msgLoaded"));
      void qc.invalidateQueries();
    },
  });

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space wrap>
        <Button type="primary" onClick={() => start.mutate()} loading={start.isPending}>
          {t("pages.settingsRuntime.startEngine")}
        </Button>
        <Button danger onClick={() => stop.mutate()} loading={stop.isPending}>
          {t("pages.settingsRuntime.stopEngine")}
        </Button>
        <Button onClick={() => saveState.mutate()} loading={saveState.isPending}>
          {t("pages.settingsRuntime.saveState")}
        </Button>
        <Button onClick={() => loadState.mutate()} loading={loadState.isPending}>
          {t("pages.settingsRuntime.loadState")}
        </Button>
      </Space>

      <Card size="small" title={t("pages.settingsRuntime.cardTitle")}>
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label={t("pages.settingsRuntime.labelVersion")}>
            {info.data?.daemon_version ?? t("common.dash")}
          </Descriptions.Item>
          <Descriptions.Item label={t("pages.settingsRuntime.labelEngine")}>
            {info.data?.engine_running ? t("pages.settingsRuntime.engineRunning") : t("pages.settingsRuntime.engineStopped")}
          </Descriptions.Item>
          <Descriptions.Item label={t("pages.settingsRuntime.labelUptime")}>{info.data?.uptime_seconds ?? 0}</Descriptions.Item>
          <Descriptions.Item label={t("pages.settingsRuntime.labelRpc")}>{info.data?.rpc_listen ?? t("common.dash")}</Descriptions.Item>
          <Descriptions.Item label={t("pages.settingsRuntime.labelDownloadDir")}>
            <Typography.Text code>{info.data?.default_download_dir ?? t("common.dash")}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label={t("pages.settingsRuntime.labelStatePath")}>
            <Typography.Text code>{info.data?.state_path ?? t("common.dash")}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label={t("pages.settingsRuntime.labelStateStore")}>
            {health.data?.state_store_ok ? t("pages.settingsRuntime.storeOk") : t("pages.settingsRuntime.storeBad")}
          </Descriptions.Item>
          <Descriptions.Item label={t("pages.settingsRuntime.labelAuthToken")}>
            <Typography.Text type="secondary">
              {maskToken(config.data?.auth_token)} {t("pages.settingsRuntime.authHint")}
            </Typography.Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Space>
  );
}
