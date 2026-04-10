import { systemApi } from "@/services/api/system";
import { queryKeys } from "@/constants/queryKeys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Form, Select, Space, message } from "antd";
import { useTranslation } from "react-i18next";

const LEVELS = ["debug", "info", "warn", "error"].map((v) => ({ value: v, label: v }));

export function SettingsLoggingPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: queryKeys.config,
    queryFn: () => systemApi.config(),
  });

  const [form] = Form.useForm<{ level: string }>();

  const update = useMutation({
    mutationFn: (body: Parameters<typeof systemApi.updateConfig>[0]) => systemApi.updateConfig(body),
    onSuccess: () => {
      message.success(t("pages.settingsLogging.msgSaved"));
      void qc.invalidateQueries({ queryKey: queryKeys.config });
    },
  });

  const level = q.data?.logging?.level ?? "info";

  return (
    <Card size="small" title={t("pages.settingsLogging.title")}>
      <Form
        key={q.dataUpdatedAt}
        form={form}
        layout="vertical"
        initialValues={{ level }}
        onFinish={(v) => update.mutate({ logging: { level: v.level } })}
      >
        <Form.Item name="level" label="level" rules={[{ required: true }]}>
          <Select options={LEVELS} />
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
