import { networkApi } from "@/services/api/network";
import { queryKeys } from "@/constants/queryKeys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Descriptions, Form, Input, Space, Typography, message } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function NetworkDhtV6Page() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const dht = useQuery({
    queryKey: queryKeys.dhtV6,
    queryFn: () => networkApi.dhtV6(),
  });

  const enable = useMutation({
    mutationFn: () => networkApi.dhtV6Enable(),
    onSuccess: () => {
      message.success(t("pages.networkDhtV6.msgEnable"));
      void qc.invalidateQueries({ queryKey: queryKeys.dhtV6 });
    },
  });

  const loadNodes = useMutation({
    mutationFn: (sources: string[]) => networkApi.dhtV6LoadNodes(sources),
    onSuccess: () => {
      message.success(t("pages.networkDhtV6.msgLoadNodes"));
      void qc.invalidateQueries({ queryKey: queryKeys.dhtV6 });
    },
  });

  const bootstrap = useMutation({
    mutationFn: (nodes: string[]) => networkApi.dhtV6Bootstrap(nodes),
    onSuccess: () => {
      message.success(t("pages.networkDhtV6.msgBootstrap"));
      void qc.invalidateQueries({ queryKey: queryKeys.dhtV6 });
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
          {t("pages.networkDhtV6.enable")}
        </Button>
        <Button onClick={() => void dht.refetch()}>{t("common.refresh")}</Button>
        <Button onClick={() => setShowNodes((v) => !v)}>
          {showNodes ? t("pages.networkDhtV6.hideImportNodes") : t("pages.networkDhtV6.showImportNodes")}
        </Button>
        <Button onClick={() => setShowBoot((v) => !v)}>
          {showBoot ? t("pages.networkDhtV6.hideBootPanel") : t("pages.networkDhtV6.showBootPanel")}
        </Button>
      </Space>

      <Typography.Paragraph type="secondary">{t("pages.networkDhtV6.hint")}</Typography.Paragraph>

      <Card size="small" title={t("pages.networkDhtV6.statusTitle")}>
        <Descriptions bordered size="small" column={1}>
          {Object.entries(data).map(([k, v]) => (
            <Descriptions.Item key={k} label={k}>
              {typeof v === "object" ? JSON.stringify(v) : String(v)}
            </Descriptions.Item>
          ))}
        </Descriptions>
      </Card>

      {showNodes ? (
        <Card size="small" title={t("pages.networkDhtV6.importTitle")}>
          <Form
            form={nodesForm}
            layout="vertical"
            onFinish={(v) => {
              const sources = v.text
                .split(/[\n,]+/)
                .map((s) => s.trim())
                .filter(Boolean);
              if (!sources.length) {
                message.warning(t("pages.networkDhtV6.warnNoSource"));
                return;
              }
              loadNodes.mutate(sources);
            }}
          >
            <Form.Item name="text" rules={[{ required: true }]}>
              <Input.TextArea rows={4} placeholder="https://.../nodes6.dat" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loadNodes.isPending}>
              {t("common.submit")}
            </Button>
          </Form>
        </Card>
      ) : null}

      {showBoot ? (
        <Card size="small" title={t("pages.networkDhtV6.bootTitle")}>
          <Form
            form={bootForm}
            layout="vertical"
            onFinish={(v) => {
              const nodes = v.text
                .split(/[\n,]+/)
                .map((s) => s.trim())
                .filter(Boolean);
              if (!nodes.length) {
                message.warning(t("pages.networkDhtV6.warnNoNode"));
                return;
              }
              bootstrap.mutate(nodes);
            }}
          >
            <Form.Item name="text" rules={[{ required: true }]}>
              <Input.TextArea rows={4} placeholder="[2001:db8::1]:4672" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={bootstrap.isPending}>
              {t("pages.networkDhtV6.bootBtn")}
            </Button>
          </Form>
        </Card>
      ) : null}
    </Space>
  );
}
