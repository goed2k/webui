import { networkApi } from "@/services/api/network";
import { queryKeys } from "@/constants/queryKeys";
import { formatSpeed } from "@/utils/format";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { ClientPeerEntryDTO } from "@/types/dto";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

function u32Hex(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return `0x${(n >>> 0).toString(16)}`;
}

export function NetworkPeersPage() {
  const { t } = useTranslation();
  const q = useQuery({
    queryKey: queryKeys.networkPeers,
    queryFn: () => networkApi.peers(),
  });

  const columns: ColumnsType<ClientPeerEntryDTO> = useMemo(
    () => [
      {
        title: t("pages.networkPeers.colTransferHash"),
        dataIndex: "transfer_hash",
        key: "transfer_hash",
        width: 120,
        ellipsis: true,
        render: (v: string) =>
          v ? (
            <Typography.Text copyable ellipsis style={{ maxWidth: 112 }}>
              {v}
            </Typography.Text>
          ) : (
            "—"
          ),
      },
      {
        title: t("pages.networkPeers.colFileName"),
        dataIndex: "file_name",
        key: "file_name",
        ellipsis: true,
        width: 160,
      },
      {
        title: t("pages.networkPeers.colNick"),
        key: "nick",
        width: 100,
        ellipsis: true,
        render: (_, r) => r.peer?.nick_name || "—",
      },
      {
        title: t("pages.networkPeers.colEndpoint"),
        key: "ep",
        width: 140,
        ellipsis: true,
        render: (_, r) => r.peer?.endpoint || "—",
      },
      {
        title: t("pages.networkPeers.colClient"),
        key: "client",
        width: 140,
        ellipsis: true,
        render: (_, r) => {
          const mod = r.peer?.mod_name?.trim();
          const sv = r.peer?.str_mod_version?.trim();
          if (!mod && !sv) return "—";
          return [mod, sv].filter(Boolean).join(" · ");
        },
      },
      {
        title: t("pages.networkPeers.colConnected"),
        key: "conn",
        width: 80,
        render: (_, r) => {
          const v = r.peer?.connected;
          return v === true ? t("common.yes") : v === false ? t("common.no") : "—";
        },
      },
      {
        title: t("pages.networkPeers.colDl"),
        key: "dl",
        width: 88,
        render: (_, r) => formatSpeed(r.peer?.download_speed ?? 0),
      },
      {
        title: t("pages.networkPeers.colUl"),
        key: "ul",
        width: 88,
        render: (_, r) => formatSpeed(r.peer?.upload_speed ?? 0),
      },
      {
        title: t("pages.networkPeers.colSource"),
        key: "src",
        width: 100,
        ellipsis: true,
        render: (_, r) => r.peer?.source || "—",
      },
      {
        title: t("pages.networkPeers.colHelloMisc"),
        key: "hm",
        width: 180,
        render: (_, r) => `${u32Hex(r.peer?.hello_misc1)} / ${u32Hex(r.peer?.hello_misc2)}`,
      },
    ],
    [t],
  );

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
        {t("pages.networkPeers.hint")}
      </Typography.Paragraph>
      {q.isError ? (
        <Typography.Text type="danger">{t("common.loadFailed")}</Typography.Text>
      ) : null}
      <Card
        size="small"
        title={t("pages.networkPeers.listTitle")}
        extra={
          <Button size="small" onClick={() => void q.refetch()} loading={q.isFetching}>
            {t("common.refresh")}
          </Button>
        }
      >
        <Table<ClientPeerEntryDTO>
          size="small"
          rowKey={(r) => `${r.transfer_hash}-${r.peer?.endpoint ?? ""}-${r.peer?.user_hash ?? ""}`}
          loading={q.isLoading}
          dataSource={q.data ?? []}
          columns={columns}
          scroll={{ x: 1500 }}
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </Space>
  );
}
