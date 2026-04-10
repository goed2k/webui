import { TransferDetailDrawer } from "@/components/transfer/TransferDetailDrawer";
import { transfersApi } from "@/services/api/transfers";
import { queryKeys } from "@/constants/queryKeys";
import { formatBytes, formatEta, formatPercent, formatSpeed, formatTimestamp } from "@/utils/format";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, Select, Space, Table, Typography, message, Modal } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { TransferDTO } from "@/types/dto";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function TransfersPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const hash = searchParams.get("hash");

  const [stateFilter, setStateFilter] = useState<string | undefined>();
  const [pausedFilter, setPausedFilter] = useState<boolean | undefined>();
  const [keyword, setKeyword] = useState("");

  const listQuery = useQuery({
    queryKey: queryKeys.transfers({ state: stateFilter, paused: pausedFilter }),
    queryFn: () =>
      transfersApi.list({
        state: stateFilter,
        paused: pausedFilter,
      }),
  });

  const data = useMemo(() => {
    const rows = listQuery.data ?? [];
    if (!keyword.trim()) return rows;
    const k = keyword.toLowerCase();
    return rows.filter(
      (r) =>
        r.file_name.toLowerCase().includes(k) ||
        r.hash.toLowerCase().includes(k) ||
        (r.file_path && r.file_path.toLowerCase().includes(k)),
    );
  }, [listQuery.data, keyword]);

  const pauseM = useMutation({
    mutationFn: (h: string) => transfersApi.pause(h),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["transfers"] }),
  });
  const resumeM = useMutation({
    mutationFn: (h: string) => transfersApi.resume(h),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["transfers"] }),
  });
  const deleteM = useMutation({
    mutationFn: (h: string) => transfersApi.remove(h, false),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["transfers"] }),
  });

  const openDetail = useCallback(
    (h: string) => {
      const next = new URLSearchParams(searchParams);
      next.set("hash", h);
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  const closeDetail = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("hash");
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const confirmDelete = useCallback(
    (h: string, name: string) => {
      Modal.confirm({
        title: t("pages.transfers.confirmDelete", { name }),
        okType: "danger",
        onOk: () => deleteM.mutateAsync(h),
      });
    },
    [t, deleteM],
  );

  const columns: ColumnsType<TransferDTO> = useMemo(
    () => [
      {
        title: t("pages.transfers.colFileName"),
        dataIndex: "file_name",
        ellipsis: true,
        minWidth: 340,
      },
      {
        title: t("pages.transfers.colHash"),
        dataIndex: "hash",
        ellipsis: true,
        width: 188,
        render: (x: string) => (
          <Typography.Text copyable style={{ fontSize: 12 }}>
            {x}
          </Typography.Text>
        ),
      },
      { title: t("pages.transfers.colSize"), dataIndex: "size", width: 96, render: (s: number) => formatBytes(s) },
      {
        title: t("pages.transfers.colProgress"),
        dataIndex: "progress",
        width: 82,
        render: (p: number) => formatPercent(p),
      },
      { title: t("pages.transfers.colState"), dataIndex: "state", width: 102 },
      {
        title: t("pages.transfers.colPaused"),
        dataIndex: "paused",
        width: 64,
        render: (v: boolean) => (v ? t("common.yes") : t("common.no")),
      },
      {
        title: t("pages.transfers.colRates"),
        key: "rates",
        width: 132,
        render: (_, r) => `${formatSpeed(r.download_rate)} / ${formatSpeed(r.upload_rate)}`,
      },
      {
        title: t("pages.transfers.colPeers"),
        key: "np",
        width: 72,
        align: "right",
        render: (_, r) => `${r.active_peers}/${r.num_peers}`,
      },
      {
        title: t("pages.transfers.colPieces"),
        dataIndex: "downloading_pieces",
        width: 88,
        align: "right",
      },
      { title: t("pages.transfers.colEta"), dataIndex: "eta", width: 84, render: (e: number) => formatEta(e) },
      {
        title: t("pages.transfers.colCreated"),
        dataIndex: "create_time",
        width: 152,
        render: (x: number) => formatTimestamp(x),
      },
      {
        title: t("pages.transfers.colPath"),
        dataIndex: "file_path",
        ellipsis: true,
        minWidth: 200,
      },
      {
        title: t("pages.transfers.colActions"),
        key: "actions",
        fixed: "right",
        width: 220,
        render: (_, r) => (
          <Space wrap size="small">
            <Button size="small" disabled={r.paused} onClick={() => pauseM.mutate(r.hash)}>
              {t("pages.transfers.pause")}
            </Button>
            <Button size="small" disabled={!r.paused} onClick={() => resumeM.mutate(r.hash)}>
              {t("pages.transfers.resume")}
            </Button>
            <Button size="small" danger onClick={() => confirmDelete(r.hash, r.file_name)}>
              {t("pages.transfers.delete")}
            </Button>
            <Button size="small" type="link" onClick={() => openDetail(r.hash)}>
              {t("pages.transfers.detail")}
            </Button>
          </Space>
        ),
      },
    ],
    [t, pauseM, resumeM, confirmDelete, openDetail],
  );

  const [addOpen, setAddOpen] = useState(false);
  const [form] = Form.useForm<{ ed2k_link: string; target_dir?: string; target_name?: string }>();

  const createM = useMutation({
    mutationFn: (v: { ed2k_link: string; target_dir?: string; target_name?: string }) =>
      transfersApi.create(v),
    onSuccess: () => {
      message.success(t("pages.transfers.msgCreated"));
      setAddOpen(false);
      form.resetFields();
      void qc.invalidateQueries({ queryKey: ["transfers"] });
    },
  });

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <Space wrap>
        <Button type="primary" onClick={() => setAddOpen(true)}>
          {t("pages.transfers.addTask")}
        </Button>
        <Button onClick={() => void listQuery.refetch()}>{t("common.refresh")}</Button>
        <Select
          allowClear
          placeholder={t("pages.transfers.filterState")}
          style={{ width: 160 }}
          value={stateFilter}
          onChange={(v) => setStateFilter(v || undefined)}
          options={[
            { value: "DOWNLOADING", label: "DOWNLOADING" },
            { value: "PAUSED", label: "PAUSED" },
            { value: "FINISHED", label: "FINISHED" },
          ]}
        />
        <Select
          allowClear
          placeholder={t("pages.transfers.filterPaused")}
          style={{ width: 120 }}
          value={pausedFilter === undefined ? undefined : pausedFilter ? "true" : "false"}
          onChange={(v) => setPausedFilter(v === undefined ? undefined : v === "true")}
          options={[
            { value: "true", label: t("pages.transfers.pausedYes") },
            { value: "false", label: t("pages.transfers.pausedNo") },
          ]}
        />
        <Input
          allowClear
          placeholder={t("pages.transfers.searchPlaceholder")}
          style={{ width: 260 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </Space>

      <Table<TransferDTO>
        size="small"
        rowKey={(r) => r.hash}
        loading={listQuery.isLoading}
        tableLayout="fixed"
        scroll={{ x: 1750 }}
        dataSource={data}
        columns={columns}
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />

      <TransferDetailDrawer hash={hash} open={!!hash} onClose={closeDetail} />

      <Modal
        title={t("pages.transfers.modalAddTitle")}
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createM.isPending}
      >
        <Form form={form} layout="vertical" onFinish={(v) => createM.mutate(v)}>
          <Form.Item name="ed2k_link" label={t("pages.transfers.fieldEd2k")} rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder={t("pages.transfers.phEd2k")} />
          </Form.Item>
          <Form.Item name="target_dir" label={t("pages.transfers.fieldTargetDir")}>
            <Input placeholder={t("pages.transfers.phTargetDir")} />
          </Form.Item>
          <Form.Item name="target_name" label={t("pages.transfers.fieldTargetName")}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
