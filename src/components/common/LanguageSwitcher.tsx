import { Select } from "antd";
import { useTranslation } from "react-i18next";

const OPTIONS = [
  { value: "zh-CN", labelKey: "language.zhCN" as const },
  { value: "en", labelKey: "language.en" as const },
];

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  return (
    <Select
      size="small"
      value={i18n.language.startsWith("zh") ? "zh-CN" : "en"}
      onChange={(lng) => void i18n.changeLanguage(lng)}
      options={OPTIONS.map((o) => ({
        value: o.value,
        label: t(o.labelKey),
      }))}
      style={{ width: 130 }}
      aria-label={t("language.label")}
    />
  );
}
