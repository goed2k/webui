import { useAuth } from "@/app/providers/AuthProvider";
import { Modal, Input, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface TokenModalProps {
  open: boolean;
  onClose: () => void;
  /** 关闭后是否允许无 Token 使用（仅 health） */
  allowSkip?: boolean;
}

export function TokenModal({ open, onClose, allowSkip = true }: TokenModalProps) {
  const { t } = useTranslation();
  const { token, setToken } = useAuth();
  const [value, setValue] = useState(token ?? "");

  useEffect(() => {
    if (open) setValue(token ?? "");
  }, [open, token]);

  const handleOk = () => {
    const tok = value.trim();
    setToken(tok || null);
    onClose();
  };

  return (
    <Modal
      title={t("token.title")}
      open={open}
      onOk={handleOk}
      onCancel={allowSkip ? onClose : undefined}
      okText={t("token.save")}
      cancelText={allowSkip ? t("token.later") : undefined}
      maskClosable={allowSkip}
      closable={allowSkip}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <Typography.Text type="secondary">{t("token.hint")}</Typography.Text>
        <Input.Password
          placeholder={t("token.placeholder")}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
        />
      </Space>
    </Modal>
  );
}
