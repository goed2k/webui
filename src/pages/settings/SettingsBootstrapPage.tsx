import { systemApi } from "@/services/api/system";
import { queryKeys } from "@/constants/queryKeys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Form, Select, Space, message } from "antd";
import { useTranslation } from "react-i18next";

export function SettingsBootstrapPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: queryKeys.config,
    queryFn: () => systemApi.config(),
  });

  const [form] = Form.useForm<{
    server_addresses: string[];
    server_met_urls: string[];
    nodes_dat_urls: string[];
    kad_nodes: string[];
  }>();

  const update = useMutation({
    mutationFn: (body: Parameters<typeof systemApi.updateConfig>[0]) => systemApi.updateConfig(body),
    onSuccess: () => {
      message.success(t("pages.settingsBootstrap.msgSaved"));
      void qc.invalidateQueries({ queryKey: queryKeys.config });
    },
  });

  const boot = q.data?.bootstrap;

  return (
    <Card size="small" title={t("pages.settingsBootstrap.title")}>
      <Form
        key={q.dataUpdatedAt}
        form={form}
        layout="vertical"
        initialValues={{
          server_addresses: boot?.server_addresses ?? [],
          server_met_urls: boot?.server_met_urls ?? [],
          nodes_dat_urls: boot?.nodes_dat_urls ?? [],
          kad_nodes: boot?.kad_nodes ?? [],
        }}
        onFinish={(v) =>
          update.mutate({
            bootstrap: {
              server_addresses: v.server_addresses ?? [],
              server_met_urls: v.server_met_urls ?? [],
              nodes_dat_urls: v.nodes_dat_urls ?? [],
              kad_nodes: v.kad_nodes ?? [],
            },
          })
        }
      >
        <Form.Item name="server_addresses" label="server_addresses">
          <Select mode="tags" placeholder={t("pages.settingsBootstrap.phAddresses")} tokenSeparators={[",", " "]} />
        </Form.Item>
        <Form.Item name="server_met_urls" label="server_met_urls">
          <Select mode="tags" placeholder={t("pages.settingsBootstrap.phMet")} tokenSeparators={[",", " "]} />
        </Form.Item>
        <Form.Item name="nodes_dat_urls" label="nodes_dat_urls">
          <Select mode="tags" placeholder={t("pages.settingsBootstrap.phNodes")} tokenSeparators={[",", " "]} />
        </Form.Item>
        <Form.Item name="kad_nodes" label="kad_nodes">
          <Select mode="tags" placeholder={t("pages.settingsBootstrap.phKad")} tokenSeparators={[",", " "]} />
        </Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={update.isPending}>
            {t("common.save")}
          </Button>
          <Button onClick={() => void q.refetch()}>{t("common.reload")}</Button>
        </Space>
      </Form>
    </Card>
  );
}
