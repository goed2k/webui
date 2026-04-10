import { transfersApi } from "@/services/api/transfers";
import { queryKeys } from "@/constants/queryKeys";
import { formatBytes, formatEta, formatPercent, formatSpeed, formatTimestamp } from "@/utils/format";
import { useQuery } from "@tanstack/react-query";
import { Descriptions, Drawer, Space, Table, Tabs, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { PeerDTO, PieceDTO } from "@/types/dto";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface TransferDetailDrawerProps {
  hash: string | null;
  open: boolean;
  onClose: () => void;
}

export function TransferDetailDrawer({ hash, open, onClose }: TransferDetailDrawerProps) {
  const { t } = useTranslation();
  const detailQuery = useQuery({
    queryKey: hash ? queryKeys.transfer(hash) : ["transfers", "none"],
    queryFn: () => transfersApi.get(hash!),
    enabled: !!hash && open,
  });

  const peersQuery = useQuery({
    queryKey: hash ? queryKeys.transferPeers(hash) : ["transfers", "peers", "none"],
    queryFn: () => transfersApi.peers(hash!),
    enabled: !!hash && open,
  });

  const piecesQuery = useQuery({
    queryKey: hash ? queryKeys.transferPieces(hash) : ["transfers", "pieces", "none"],
    queryFn: () => transfersApi.pieces(hash!),
    enabled: !!hash && open,
  });

  const d = detailQuery.data;

  const peerCols: ColumnsType<PeerDTO> = useMemo(
    () => [
      { title: "Endpoint", dataIndex: "endpoint", key: "endpoint", ellipsis: true },
      { title: "Source", dataIndex: "source", key: "source" },
      {
        title: t("pages.transfers.peerColDl"),
        key: "dr",
        render: (_, r) => formatSpeed((r.download_rate as number) ?? 0),
      },
      {
        title: t("pages.transfers.peerColUl"),
        key: "ur",
        render: (_, r) => formatSpeed((r.upload_rate as number) ?? 0),
      },
    ],
    [t],
  );

  const pieceCols: ColumnsType<PieceDTO> = useMemo(
    () => [
      { title: "Index", dataIndex: "index", key: "index", width: 80 },
      { title: "State", dataIndex: "state", key: "state" },
    ],
    [],
  );

  return (
    <Drawer
      title={d?.file_name ?? t("pages.transfers.drawerTitle")}
      width={720}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {detailQuery.isLoading ? (
        <Typography.Text type="secondary">{t("common.loading")}</Typography.Text>
      ) : detailQuery.isError ? (
        <Typography.Text type="danger">{t("common.loadFailed")}</Typography.Text>
      ) : !d ? null : (
        <Tabs
          items={[
            {
              key: "overview",
              label: t("pages.transfers.tabOverview"),
              children: (
                <Descriptions bordered size="small" column={1}>
                  <Descriptions.Item label={t("pages.transfers.labelFileName")}>{d.file_name}</Descriptions.Item>
                  <Descriptions.Item label={t("pages.transfers.colHash")}>
                    <Typography.Text copyable>{d.hash}</Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item label={t("pages.transfers.fieldEd2k")}>
                    <Typography.Paragraph copyable ellipsis style={{ marginBottom: 0 }}>
                      {d.ed2k_link || t("common.dash")}
                    </Typography.Paragraph>
                  </Descriptions.Item>
                  <Descriptions.Item label={t("pages.transfers.labelLocalPath")}>{d.file_path || t("common.dash")}</Descriptions.Item>
                  <Descriptions.Item label={t("pages.transfers.colSize")}>{formatBytes(d.size)}</Descriptions.Item>
                  <Descriptions.Item label={t("pages.transfers.colState")}>{d.state}</Descriptions.Item>
                  <Descriptions.Item label={t("pages.transfers.colProgress")}>{formatPercent(d.progress)}</Descriptions.Item>
                  <Descriptions.Item label={t("pages.transfers.colPaused")}>
                    {d.paused ? t("common.yes") : t("common.no")}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("pages.transfers.labelDlUl")}>
                    {formatSpeed(d.download_rate)} / {formatSpeed(d.upload_rate)}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("pages.transfers.labelBytes")}>
                    {formatBytes(d.total_done)} / {formatBytes(d.total_received)} / {formatBytes(d.total_wanted)}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("pages.transfers.colEta")}>{formatEta(d.eta)}</Descriptions.Item>
                  <Descriptions.Item label={t("pages.transfers.labelCreated")}>{formatTimestamp(d.create_time)}</Descriptions.Item>
                </Descriptions>
              ),
            },
            {
              key: "peers",
              label: t("pages.transfers.tabPeers"),
              children: (
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Table
                    size="small"
                    rowKey={(_, i) => String(i)}
                    loading={peersQuery.isLoading}
                    columns={peerCols}
                    dataSource={peersQuery.data ?? []}
                    pagination={false}
                  />
                </Space>
              ),
            },
            {
              key: "pieces",
              label: t("pages.transfers.tabPieces"),
              children: (
                <Table
                  size="small"
                  rowKey={(r) => String(r.index)}
                  loading={piecesQuery.isLoading}
                  columns={pieceCols}
                  dataSource={piecesQuery.data ?? []}
                  pagination={{ pageSize: 50 }}
                />
              ),
            },
          ]}
        />
      )}
    </Drawer>
  );
}
