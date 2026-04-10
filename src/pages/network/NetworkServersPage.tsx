import { networkApi } from "@/services/api/network";
import { queryKeys } from "@/constants/queryKeys";
import { formatSpeed } from "@/utils/format";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Form, Input, Space, Table, Typography, message } from "antd";
import type { ServerDTO } from "@/types/dto";
import { useTranslation } from "react-i18next";

export function NetworkServersPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: queryKeys.servers,
    queryFn: () => networkApi.servers(),
  });

  const connect = useMutation({
    mutationFn: (address: string) => networkApi.connect(address),
    onSuccess: () => {
      message.success(t("pages.networkServers.msgConnect"));
      void qc.invalidateQueries({ queryKey: queryKeys.servers });
    },
  });

  const connectBatch = useMutation({
    mutationFn: (addresses: string[]) => networkApi.connectBatch(addresses),
    onSuccess: () => {
      message.success(t("pages.networkServers.msgBatch"));
      void qc.invalidateQueries({ queryKey: queryKeys.servers });
    },
  });

  const loadMet = useMutation({
    mutationFn: (sources: string[]) => networkApi.loadMet(sources),
    onSuccess: () => {
      message.success(t("pages.networkServers.msgMet"));
      void qc.invalidateQueries({ queryKey: queryKeys.servers });
    },
  });

  const [singleForm] = Form.useForm<{ address: string }>();
  const [batchForm] = Form.useForm<{ text: string }>();
  const [metForm] = Form.useForm<{ sources: string }>();

  const columns = [
    { title: t("pages.networkServers.colIdentifier"), dataIndex: "identifier", ellipsis: true },
    { title: t("pages.networkServers.colAddress"), dataIndex: "address", ellipsis: true },
    {
      title: t("pages.networkServers.colConfigured"),
      dataIndex: "configured",
      width: 90,
      render: (v: boolean) => (v ? t("common.yes") : t("common.no")),
    },
    {
      title: t("pages.networkServers.colConnected"),
      dataIndex: "connected",
      width: 90,
      render: (v: boolean) => (v ? t("common.yes") : t("common.no")),
    },
    {
      title: t("pages.networkServers.colHandshake"),
      dataIndex: "handshake_completed",
      width: 100,
      render: (v: boolean) => (v ? t("common.yes") : t("common.no")),
    },
    {
      title: t("pages.networkServers.colPrimary"),
      dataIndex: "primary",
      width: 80,
      render: (v: boolean) => (v ? t("common.yes") : t("common.no")),
    },
    {
      title: t("pages.networkServers.colDisconnecting"),
      dataIndex: "disconnecting",
      width: 80,
      render: (v: boolean) => (v ? t("common.yes") : t("common.no")),
    },
    { title: t("pages.networkServers.colClientId"), dataIndex: "client_id", width: 100 },
    { title: t("pages.networkServers.colIdClass"), dataIndex: "id_class", width: 100 },
    {
      title: t("pages.networkServers.colRates"),
      key: "ru",
      render: (_: unknown, r: ServerDTO) =>
        `${formatSpeed(r.download_rate)} / ${formatSpeed(r.upload_rate)}`,
    },
    { title: t("pages.networkServers.colLastRecv"), dataIndex: "milliseconds_since_last_receive", width: 140 },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
        {t("pages.networkServers.hint")}
      </Typography.Paragraph>

      <Card size="small" title={t("pages.networkServers.cardSingle")}>
        <Form
          form={singleForm}
          layout="inline"
          onFinish={(v) => connect.mutate(v.address.trim())}
        >
          <Form.Item name="address" rules={[{ required: true }]} style={{ minWidth: 280 }}>
            <Input placeholder={t("pages.networkServers.phHostPort")} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={connect.isPending}>
              {t("pages.networkServers.connect")}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card size="small" title={t("pages.networkServers.cardBatch")}>
        <Form
          form={batchForm}
          layout="vertical"
          onFinish={(v) => {
            const addresses = v.text
              .split(/[\n,]+/)
              .map((s) => s.trim())
              .filter(Boolean);
            if (!addresses.length) {
              message.warning(t("pages.networkServers.warnNoAddr"));
              return;
            }
            connectBatch.mutate(addresses);
          }}
        >
          <Form.Item name="text" label={t("pages.networkServers.batchLabel")} rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="127.0.0.1:4661" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={connectBatch.isPending}>
            {t("pages.networkServers.batchSubmit")}
          </Button>
        </Form>
      </Card>

      <Card size="small" title={t("pages.networkServers.cardMet")}>
        <Form
          form={metForm}
          layout="vertical"
          onFinish={(v) => {
            const sources = v.sources
              .split(/[\n,]+/)
              .map((s) => s.trim())
              .filter(Boolean);
            if (!sources.length) {
              message.warning(t("pages.networkServers.warnNoMet"));
              return;
            }
            loadMet.mutate(sources);
          }}
        >
          <Form.Item name="sources" label={t("pages.networkServers.metLabel")} rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="http://.../server.met" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loadMet.isPending}>
            {t("pages.networkServers.metSubmit")}
          </Button>
        </Form>
      </Card>

      <Card
        size="small"
        title={t("pages.networkServers.listTitle")}
        extra={
          <Button size="small" onClick={() => void q.refetch()}>
            {t("common.refresh")}
          </Button>
        }
      >
        <Table<ServerDTO>
          size="small"
          rowKey={(r) => r.identifier + r.address}
          loading={q.isLoading}
          dataSource={q.data ?? []}
          columns={columns}
          scroll={{ x: 1600 }}
          pagination={{ pageSize: 15 }}
        />
      </Card>
    </Space>
  );
}
