import { PAGE_TITLE_KEYS } from "@/constants/pageTitleKeys";
import { ROUTES } from "@/constants/routes";
import { GlobalStatusBar } from "@/components/status/GlobalStatusBar";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { useAuth } from "@/app/providers/AuthProvider";
import { TokenModal } from "@/components/common/TokenModal";
import {
  CloudServerOutlined,
  DashboardOutlined,
  DownloadOutlined,
  GlobalOutlined,
  SearchOutlined,
  SettingOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import { Breadcrumb, Button, Layout, Menu, theme, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { getToken } from "@/services/api/client";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const { Header, Sider, Content } = Layout;

export function AppLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [tokenOpen, setTokenOpen] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    const mock = import.meta.env.VITE_USE_MOCK === "true";
    if (mock) return;
    if (!getToken() && !sessionStorage.getItem("goed2k_dismiss_token_hint")) {
      setTokenOpen(true);
    }
  }, []);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const selectedKeys = [location.pathname];

  const openKeysDefault = useMemo(() => {
    const p = location.pathname;
    const keys: string[] = [];
    if (p.startsWith("/network")) keys.push("sub-network");
    if (p.startsWith("/settings")) keys.push("sub-settings");
    return keys;
  }, [location.pathname]);

  const [openKeys, setOpenKeys] = useState<string[]>(openKeysDefault);
  useEffect(() => {
    setOpenKeys(openKeysDefault);
  }, [openKeysDefault]);

  const titleKey = PAGE_TITLE_KEYS[location.pathname];
  const title = titleKey ? t(titleKey) : t("app.name");

  const menuItems = useMemo(
    () => [
      {
        key: ROUTES.dashboard,
        icon: <DashboardOutlined />,
        label: <Link to={ROUTES.dashboard}>{t("layout.menu.dashboard")}</Link>,
      },
      {
        key: ROUTES.transfers,
        icon: <DownloadOutlined />,
        label: <Link to={ROUTES.transfers}>{t("layout.menu.transfers")}</Link>,
      },
      {
        key: ROUTES.search,
        icon: <SearchOutlined />,
        label: <Link to={ROUTES.search}>{t("layout.menu.search")}</Link>,
      },
      {
        key: ROUTES.shared,
        icon: <ShareAltOutlined />,
        label: <Link to={ROUTES.shared}>{t("layout.menu.shared")}</Link>,
      },
      {
        key: "sub-network",
        icon: <CloudServerOutlined />,
        label: t("layout.menu.network"),
        children: [
          {
            key: ROUTES.networkServers,
            label: <Link to={ROUTES.networkServers}>{t("layout.menu.networkServers")}</Link>,
          },
          {
            key: ROUTES.networkPeers,
            label: <Link to={ROUTES.networkPeers}>{t("layout.menu.networkPeers")}</Link>,
          },
          {
            key: ROUTES.networkDht,
            label: <Link to={ROUTES.networkDht}>{t("layout.menu.networkDht")}</Link>,
          },
        ],
      },
      {
        key: "sub-settings",
        icon: <SettingOutlined />,
        label: t("layout.menu.settings"),
        children: [
          {
            key: ROUTES.settingsRuntime,
            label: <Link to={ROUTES.settingsRuntime}>{t("layout.menu.settingsRuntime")}</Link>,
          },
          {
            key: ROUTES.settingsBootstrap,
            label: <Link to={ROUTES.settingsBootstrap}>{t("layout.menu.settingsBootstrap")}</Link>,
          },
          {
            key: ROUTES.settingsState,
            label: <Link to={ROUTES.settingsState}>{t("layout.menu.settingsState")}</Link>,
          },
          {
            key: ROUTES.settingsLogging,
            label: <Link to={ROUTES.settingsLogging}>{t("layout.menu.settingsLogging")}</Link>,
          },
        ],
      },
    ],
    [t],
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={220}
      >
        <div
          style={{
            height: 48,
            margin: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.85)",
            fontWeight: 600,
            letterSpacing: 0.5,
          }}
        >
          <GlobalOutlined style={{ marginRight: 8 }} />
          {!collapsed ? "goed2k" : "g2k"}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: "0 20px",
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <Typography.Title level={5} style={{ margin: "12px 0" }} ellipsis>
              {title}
            </Typography.Title>
            <Breadcrumb
              items={[
                { title: <Link to={ROUTES.dashboard}>{t("layout.home")}</Link> },
                { title },
              ]}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,
            }}
          >
            <LanguageSwitcher />
            <GlobalStatusBar />
            <Button size="small" type={token ? "default" : "primary"} onClick={() => setTokenOpen(true)}>
              {token ? t("layout.tokenSet") : t("layout.tokenSetup")}
            </Button>
          </div>
        </Header>
        <Content style={{ margin: 16, minHeight: 360 }}>
          <div
            style={{
              background: colorBgContainer,
              padding: 16,
              borderRadius: 8,
              minHeight: "calc(100vh - 64px - 32px)",
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
      <TokenModal
        open={tokenOpen}
        onClose={() => {
          setTokenOpen(false);
          sessionStorage.setItem("goed2k_dismiss_token_hint", "1");
        }}
      />
    </Layout>
  );
}
