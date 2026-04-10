import { searchesApi } from "@/services/api/searches";
import { queryKeys } from "@/constants/queryKeys";
import { formatBytes } from "@/utils/format";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Col,
  Collapse,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Table,
  Typography,
  message,
} from "antd";
import type { SearchResultItemDTO } from "@/types/dto";
import { useTranslation } from "react-i18next";

export function SearchPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [form] = Form.useForm();

  const current = useQuery({
    queryKey: queryKeys.searchCurrent,
    queryFn: () => searchesApi.current(),
    refetchInterval: (q) => (q.state.data?.state === "RUNNING" ? 2000 : false),
  });

  const start = useMutation({
    mutationFn: searchesApi.start,
    onSuccess: () => {
      message.success(t("pages.search.msgStarted"));
      void qc.invalidateQueries({ queryKey: queryKeys.searchCurrent });
    },
  });

  const stop = useMutation({
    mutationFn: () => searchesApi.stop(),
    onSuccess: () => {
      message.success(t("pages.search.msgStopped"));
      void qc.invalidateQueries({ queryKey: queryKeys.searchCurrent });
    },
  });

  const download = useMutation({
    mutationFn: ({ hash }: { hash: string }) => searchesApi.downloadFromResult(hash, {}),
    onSuccess: () => {
      message.success(t("pages.search.msgAdded"));
      void qc.invalidateQueries({ queryKey: ["transfers"] });
    },
  });

  const s = current.data;
  const results = (s?.results ?? []) as SearchResultItemDTO[];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card size="small" title={t("pages.search.cardTitle")}>
        <Form
          form={form}
          layout="vertical"
          onFinish={(v) =>
            start.mutate({
              query: v.query,
              scope: v.scope ?? "all",
              min_size: v.min_size ?? 0,
              max_size: v.max_size ?? 0,
              min_sources: v.min_sources ?? 0,
              min_complete_sources: v.min_complete_sources ?? 0,
              file_type: v.file_type ?? "",
              extension: v.extension ?? "",
            })
          }
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="query" label={t("pages.search.keyword")} rules={[{ required: true }]}>
                <Input placeholder={t("pages.search.phKeyword")} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Space style={{ marginTop: 30 }}>
                <Button type="primary" htmlType="submit" loading={start.isPending}>
                  {t("pages.search.search")}
                </Button>
                <Button onClick={() => stop.mutate()} loading={stop.isPending}>
                  {t("pages.search.stop")}
                </Button>
                <Button
                  onClick={() => {
                    form.resetFields();
                    void current.refetch();
                  }}
                >
                  {t("pages.search.resetForm")}
                </Button>
              </Space>
            </Col>
          </Row>

          <Collapse
            items={[
              {
                key: "adv",
                label: t("pages.search.advanced"),
                children: (
                  <Row gutter={16}>
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item name="scope" label={t("pages.search.scope")} initialValue="all">
                        <Select
                          options={[
                            { value: "all", label: "all" },
                            { value: "server", label: "server" },
                            { value: "dht", label: "dht" },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item name="min_size" label={t("pages.search.minSize")}>
                        <InputNumber style={{ width: "100%" }} min={0} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item name="max_size" label={t("pages.search.maxSize")}>
                        <InputNumber style={{ width: "100%" }} min={0} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item name="min_sources" label={t("pages.search.minSources")}>
                        <InputNumber style={{ width: "100%" }} min={0} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item name="min_complete_sources" label={t("pages.search.minCompleteSources")}>
                        <InputNumber style={{ width: "100%" }} min={0} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item name="file_type" label={t("pages.search.fileType")}>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item name="extension" label={t("pages.search.extension")}>
                        <Input placeholder={t("pages.search.phExtension")} />
                      </Form.Item>
                    </Col>
                  </Row>
                ),
              },
            ]}
          />
        </Form>
      </Card>

      <Card size="small" title={t("pages.search.statusCard")}>
        <Typography.Paragraph style={{ marginBottom: 8 }}>
          {t("pages.search.statusLabel")}
          <Typography.Text code>{s?.state ?? t("common.dash")}</Typography.Text>
          {s?.server_busy ? <TagBusy text={t("pages.search.busyServer")} /> : null}
          {s?.dht_busy ? <TagBusy text={t("pages.search.busyDht")} /> : null}
        </Typography.Paragraph>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 4 }}>
          {t("pages.search.paramsSummary")}
          {JSON.stringify(s?.params ?? {})}
        </Typography.Paragraph>
        <Typography.Paragraph type="secondary">
          {t("pages.search.updatedAt")}
          {s?.updated_at ?? t("common.dash")} {s?.error ? `${t("pages.search.errorPrefix")}${s.error}` : ""}
        </Typography.Paragraph>
      </Card>

      <Card size="small" title={t("pages.search.resultsTitle")}>
        <Table<SearchResultItemDTO>
          size="small"
          rowKey={(r) => r.hash}
          dataSource={results}
          pagination={{ pageSize: 15 }}
          scroll={{ x: 1100 }}
          tableLayout="fixed"
          columns={[
            {
              title: t("pages.search.colName"),
              dataIndex: "name",
              key: "name",
              ellipsis: true,
              minWidth: 280,
              render: (_, r) => r.name ?? r.file_name ?? t("common.dash"),
            },
            {
              title: t("pages.search.colHash"),
              dataIndex: "hash",
              ellipsis: true,
              width: 200,
              render: (x: string) => (
                <Typography.Text copyable style={{ fontSize: 12 }}>
                  {x}
                </Typography.Text>
              ),
            },
            {
              title: t("pages.search.colSize"),
              dataIndex: "size",
              width: 100,
              render: (v: number | undefined) => (v != null ? formatBytes(v) : t("common.dash")),
            },
            {
              title: t("pages.search.colSources"),
              dataIndex: "sources",
              width: 72,
              align: "right",
            },
            {
              title: t("pages.search.colComplete"),
              dataIndex: "complete_sources",
              width: 72,
              align: "right",
            },
            {
              title: t("pages.search.colTypeExt"),
              key: "tp",
              width: 120,
              ellipsis: true,
              render: (_, r) => `${r.file_type ?? ""} ${r.extension ?? ""}`.trim() || t("common.dash"),
            },
            {
              title: t("pages.search.colAction"),
              key: "op",
              width: 88,
              fixed: "right",
              render: (_, r) => (
                <Button
                  type="link"
                  size="small"
                  loading={download.isPending}
                  onClick={() => download.mutate({ hash: r.hash })}
                >
                  {t("pages.search.download")}
                </Button>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  );
}

function TagBusy({ text }: { text: string }) {
  return (
    <Typography.Text type="warning" style={{ marginLeft: 8 }}>
      [{text}]
    </Typography.Text>
  );
}
