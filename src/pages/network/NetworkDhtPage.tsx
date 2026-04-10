import { networkApi } from "@/services/api/network";
import { queryKeys } from "@/constants/queryKeys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Descriptions, Form, Input, Space, Typography, message } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function NetworkDhtPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const dht = useQuery({
    queryKey: queryKeys.dht,
    queryFn: () => networkApi.dht(),
  });

  const enable = useMutation({
    mutationFn: () => networkApi.dhtEnable(),
    onSuccess: () => {
      message.success(t("pages.networkDht.msgEnable"));
      void qc.invalidateQueries({ queryKey: queryKeys.dht });
    },
  });

  const loadNodes = useMutation({
    mutationFn: (sources: string[]) => networkApi.dhtLoadNodes(sources),
    onSuccess: () => {
      message.success(t("pages.networkDht.msgLoadNodes"));
      void qc.invalidateQueries({ queryKey: queryKeys.dht });
    },
  });

  const bootstrap = useMutation({
    mutationFn: (nodes: string[]) => networkApi.dhtBootstrap(nodes),
    onSuccess: () => {
      message.success(t("pages.networkDht.msgBootstrap"));
      void qc.invalidateQueries({ queryKey: queryKeys.dht });
    },
  });

  const [nodesForm] = Form.useForm<{ text: string }>();
  const [bootForm] = Form.useForm<{ text: string }>();
  const [showNodes, setShowNodes] = useState(false);
  const [showBoot, setShowBoot] = useState(false);

  const data = dht.data ?? {};

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space wrap>
        <Button type="primary" onClick={() => enable.mutate()} loading={enable.isPending}>
          {t("pages.networkDht.enable")}
        </Button>
        <Button onClick={() => void dht.refetch()}>{t("common.refresh")}</Button>
        <Button onClick={() => setShowNodes((v) => !v)}>
          {showNodes ? t("pages.networkDht.hideImportNodes") : t("pages.networkDht.showImportNodes")}
        </Button>
        <Button onClick={() => setShowBoot((v) => !v)}>
          {showBoot ? t("pages.networkDht.hideBootPanel") : t("pages.networkDht.showBootPanel")}
        </Button>
      </Space>

      <Typography.Paragraph type="secondary">{t("pages.networkDht.hint")}</Typography.Paragraph>

      <Card size="small" title={t("pages.networkDht.statusTitle")}>
        <Descriptions bordered size="small" column={1}>
          {Object.entries(data).map(([k, v]) => (
            <Descriptions.Item key={k} label={k}>
              {typeof v === "object" ? JSON.stringify(v) : String(v)}
            </Descriptions.Item>
          ))}
        </Descriptions>
      </Card>

      {showNodes ? (
        <Card size="small" title={t("pages.networkDht.importTitle")}>
          <Form
            form={nodesForm}
            layout="vertical"
            onFinish={(v) => {
              const sources = v.text
                .split(/[\n,]+/)
                .map((s) => s.trim())
                .filter(Boolean);
              if (!sources.length) {
                message.warning(t("pages.networkDht.warnNoSource"));
                return;
              }
              loadNodes.mutate(sources);
            }}
          >
            <Form.Item name="text" rules={[{ required: true }]}>
              <Input.TextArea rows={4} placeholder="https://.../nodes.dat" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loadNodes.isPending}>
              {t("common.submit")}
            </Button>
          </Form>
        </Card>
      ) : null}

      {showBoot ? (
        <Card size="small" title={t("pages.networkDht.bootTitle")}>
          <Form
            form={bootForm}
            layout="vertical"
            onFinish={(v) => {
              const nodes = v.text
                .split(/[\n,]+/)
                .map((s) => s.trim())
                .filter(Boolean);
              if (!nodes.length) {
                message.warning(t("pages.networkDht.warnNoNode"));
                return;
              }
              bootstrap.mutate(nodes);
            }}
          >
            <Form.Item name="text" rules={[{ required: true }]}>
              <Input.TextArea rows={4} placeholder="1.2.3.4:4661" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={bootstrap.isPending}>
              {t("pages.networkDht.bootBtn")}
            </Button>
          </Form>
        </Card>
      ) : null}
    </Space>
  );
}
