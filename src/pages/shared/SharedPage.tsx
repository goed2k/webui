import { sharedApi } from "@/services/api/shared";
import { queryKeys } from "@/constants/queryKeys";
import { formatBytes, formatTimestamp } from "@/utils/format";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Form, Input, Modal, Space, Table, Typography, message } from "antd";
import type { SharedFileDTO } from "@/types/dto";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

/** 判断共享文件的绝对路径是否落在某共享根目录下（含子目录）；统一 \\ 与 / 再比较，避免 Windows 混用导致筛不出）。 */
function fileBelongsToSharedDir(filePath: string, sharedRoot: string): boolean {
  if (!filePath || !sharedRoot) return false;
  const norm = (p: string) => p.replace(/[/\\]+/g, "\\").replace(/\\+$/, "").toLowerCase();
  const r = norm(sharedRoot);
  const f = norm(filePath);
  return f === r || f.startsWith(r + "\\");
}

export function SharedPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const files = useQuery({
    queryKey: queryKeys.sharedFiles,
    queryFn: () => sharedApi.files(),
  });
  const dirs = useQuery({
    queryKey: queryKeys.sharedDirs,
    queryFn: () => sharedApi.dirs(),
  });

  const [dirModal, setDirModal] = useState<"add" | "remove" | null>(null);
  const [importModal, setImportModal] = useState(false);
  /** 添加目录或全量重扫后短时间内轮询共享文件列表（后台扫描异步完成）。 */
  const [filesPollSeq, setFilesPollSeq] = useState(0);
  const [formDir] = Form.useForm<{ path: string }>();
  const [formImport] = Form.useForm<{ path: string }>();

  useEffect(() => {
    if (filesPollSeq === 0) return;
    const id = setInterval(() => {
      void qc.invalidateQueries({ queryKey: queryKeys.sharedFiles });
    }, 3000);
    const done = setTimeout(() => clearInterval(id), 120000);
    return () => {
      clearInterval(id);
      clearTimeout(done);
    };
  }, [filesPollSeq, qc]);

  const addDir = useMutation({
    mutationFn: (path: string) => sharedApi.addDir(path),
    onSuccess: () => {
      message.success(t("pages.shared.msgDirAdded"));
      setDirModal(null);
      formDir.resetFields();
      void qc.invalidateQueries({ queryKey: queryKeys.sharedDirs });
      void qc.invalidateQueries({ queryKey: queryKeys.sharedFiles });
      setFilesPollSeq((s) => s + 1);
    },
  });

  const removeDir = useMutation({
    mutationFn: (path: string) => sharedApi.removeDir(path),
    onSuccess: () => {
      message.success(t("pages.shared.msgDirRemoved"));
      setDirModal(null);
      formDir.resetFields();
      void qc.invalidateQueries({ queryKey: queryKeys.sharedDirs });
      void qc.invalidateQueries({ queryKey: queryKeys.sharedFiles });
    },
  });

  const rescan = useMutation({
    mutationFn: () => sharedApi.rescan(),
    onSuccess: () => {
      message.success(t("pages.shared.msgRescan"));
      void qc.invalidateQueries({ queryKey: queryKeys.sharedFiles });
      setFilesPollSeq((s) => s + 1);
    },
  });

  const importFile = useMutation({
    mutationFn: (path: string) => sharedApi.importFile(path),
    onSuccess: () => {
      message.success(t("pages.shared.msgImport"));
      setImportModal(false);
      formImport.resetFields();
      void qc.invalidateQueries({ queryKey: queryKeys.sharedFiles });
    },
  });

  const removeFile = useMutation({
    mutationFn: (hash: string) => sharedApi.removeFile(hash),
    onSuccess: () => {
      message.success(t("pages.shared.msgRemoved"));
      void qc.invalidateQueries({ queryKey: queryKeys.sharedFiles });
    },
  });

  const fileColumns = useMemo(
    () => [
      { title: t("pages.shared.colName"), dataIndex: "name", ellipsis: true },
      {
        title: t("pages.shared.colHash"),
        dataIndex: "hash",
        ellipsis: true,
        render: (x: string) => (
          <Typography.Text copyable style={{ fontSize: 12 }}>
            {x}
          </Typography.Text>
        ),
      },
      { title: t("pages.shared.colPath"), dataIndex: "path", ellipsis: true },
      { title: t("pages.shared.colSize"), dataIndex: "file_size", render: (n: number) => formatBytes(n) },
      { title: t("pages.shared.colOrigin"), dataIndex: "origin", width: 100 },
      {
        title: t("pages.shared.colCompleted"),
        dataIndex: "completed",
        width: 80,
        render: (v: boolean) => (v ? t("common.yes") : t("common.no")),
      },
      {
        title: t("pages.shared.colCanUpload"),
        dataIndex: "can_upload",
        width: 80,
        render: (v: boolean) => (v ? t("common.yes") : t("common.no")),
      },
      {
        title: t("pages.shared.colLastHash"),
        dataIndex: "last_hash_at",
        width: 180,
        render: (x: number) => formatTimestamp(x),
      },
      {
        title: t("pages.shared.colAction"),
        key: "op",
        width: 100,
        render: (_: unknown, r: SharedFileDTO) => (
          <Button
            danger
            size="small"
            onClick={() => {
              Modal.confirm({
                title: t("pages.shared.confirmDelete"),
                onOk: () => removeFile.mutate(r.hash),
              });
            }}
          >
            {t("pages.shared.delete")}
          </Button>
        ),
      },
    ],
    [t, removeFile],
  );

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card
        size="small"
        title={t("pages.shared.dirsTitle")}
        extra={
          <Space>
            <Button size="small" onClick={() => setDirModal("add")}>
              {t("pages.shared.addDir")}
            </Button>
            <Button size="small" onClick={() => setDirModal("remove")}>
              {t("pages.shared.removeDir")}
            </Button>
            <Button size="small" onClick={() => rescan.mutate()} loading={rescan.isPending}>
              {t("pages.shared.rescan")}
            </Button>
            <Button size="small" type="primary" onClick={() => setImportModal(true)}>
              {t("pages.shared.importFile")}
            </Button>
          </Space>
        }
      >
        <Table<string>
          size="small"
          pagination={false}
          rowKey={(p) => p}
          dataSource={dirs.data ?? []}
          columns={[
            {
              title: t("pages.shared.colPath"),
              key: "p",
              ellipsis: true,
              render: (_: unknown, row: string) => row,
            },
            {
              title: t("pages.shared.colAction"),
              key: "op",
              width: 100,
              render: (_: unknown, row: string) => (
                <Button
                  danger
                  size="small"
                  loading={removeDir.isPending}
                  onClick={() => {
                    Modal.confirm({
                      title: t("pages.shared.confirmRemoveDir"),
                      content: row,
                      onOk: () => removeDir.mutate(row),
                    });
                  }}
                >
                  {t("pages.shared.removeDir")}
                </Button>
              ),
            },
          ]}
        />
      </Card>

      {(dirs.data ?? []).map((dir) => {
        const rows = (files.data ?? []).filter((f) => fileBelongsToSharedDir(f.path ?? "", dir));
        return (
          <Card
            key={dir}
            size="small"
            title={`${t("pages.shared.dirFilesTitle")} — ${dir}`}
            extra={<Typography.Text type="secondary">{t("pages.shared.fileCount", { count: rows.length })}</Typography.Text>}
          >
            <Table<SharedFileDTO>
              size="small"
              rowKey={(r) => r.hash}
              loading={files.isLoading}
              dataSource={rows}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
              columns={fileColumns}
            />
          </Card>
        );
      })}

      <Card size="small" title={t("pages.shared.filesTitle")}>
        <Table<SharedFileDTO>
          size="small"
          rowKey={(r) => r.hash}
          loading={files.isLoading}
          dataSource={files.data ?? []}
          pagination={{ pageSize: 15 }}
          scroll={{ x: 1200 }}
          columns={fileColumns}
        />
      </Card>

      <Modal
        title={dirModal === "add" ? t("pages.shared.modalAddDir") : t("pages.shared.modalRemoveDir")}
        open={!!dirModal}
        onCancel={() => {
          setDirModal(null);
          formDir.resetFields();
        }}
        onOk={() => formDir.submit()}
        destroyOnClose
      >
        <Form
          form={formDir}
          layout="vertical"
          onFinish={(v) => {
            if (dirModal === "add") addDir.mutate(v.path);
            else removeDir.mutate(v.path);
          }}
        >
          <Form.Item name="path" label={t("pages.shared.labelDirPath")} rules={[{ required: true }]}>
            <Input placeholder={t("pages.shared.phDir")} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t("pages.shared.modalImport")}
        open={importModal}
        onCancel={() => setImportModal(false)}
        onOk={() => formImport.submit()}
        destroyOnClose
      >
        <Form form={formImport} layout="vertical" onFinish={(v) => importFile.mutate(v.path)}>
          <Form.Item name="path" label={t("pages.shared.labelFilePath")} rules={[{ required: true }]}>
            <Input placeholder={t("pages.shared.phFile")} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
