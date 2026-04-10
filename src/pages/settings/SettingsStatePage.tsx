import { systemApi } from "@/services/api/system";
import { queryKeys } from "@/constants/queryKeys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Form, Input, InputNumber, Space, Switch, message } from "antd";
import { useTranslation } from "react-i18next";

export function SettingsStatePage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: queryKeys.config,
    queryFn: () => systemApi.config(),
  });

  const [form] = Form.useForm<{
    enabled: boolean;
    path: string;
    load_on_start: boolean;
    save_on_exit: boolean;
    auto_save_interval_seconds: number;
  }>();

  const update = useMutation({
    mutationFn: (body: Parameters<typeof systemApi.updateConfig>[0]) => systemApi.updateConfig(body),
    onSuccess: () => {
      message.success(t("pages.settingsState.msgSaved"));
      void qc.invalidateQueries({ queryKey: queryKeys.config });
    },
  });

  const st = q.data?.state;

  return (
    <Card size="small" title={t("pages.settingsState.title")}>
      <Form
        key={q.dataUpdatedAt}
        form={form}
        layout="vertical"
        initialValues={{
          enabled: st?.enabled ?? true,
          path: st?.path ?? "",
          load_on_start: st?.load_on_start ?? true,
          save_on_exit: st?.save_on_exit ?? true,
          auto_save_interval_seconds: st?.auto_save_interval_seconds ?? 30,
        }}
        onFinish={(v) =>
          update.mutate({
            state: {
              enabled: v.enabled,
              path: v.path,
              load_on_start: v.load_on_start,
              save_on_exit: v.save_on_exit,
              auto_save_interval_seconds: v.auto_save_interval_seconds,
            },
          })
        }
      >
        <Form.Item name="enabled" label="enabled" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="path" label="path" rules={[{ required: true }]}>
          <Input placeholder={t("pages.settingsState.phPath")} />
        </Form.Item>
        <Form.Item name="load_on_start" label="load_on_start" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="save_on_exit" label="save_on_exit" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="auto_save_interval_seconds" label="auto_save_interval_seconds">
          <InputNumber min={1} style={{ width: "100%" }} />
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
