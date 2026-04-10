import { AuthProvider, useAuth } from "@/app/providers/AuthProvider";
import { connectEventsWs } from "@/services/ws/eventsWs";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";
import { ConfigProvider, theme } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/zh-cn";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

function EventsWsBridge() {
  const qc = useQueryClient();
  const { token } = useAuth();

  useEffect(() => {
    return connectEventsWs(() => token ?? null, qc);
  }, [qc, token]);

  return null;
}

function Inner({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EventsWsBridge />
      {children}
    </>
  );
}

function AntdLocaleBridge({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const antdLocale = i18n.language.startsWith("zh") ? zhCN : enUS;

  useEffect(() => {
    dayjs.locale(i18n.language.startsWith("zh") ? "zh-cn" : "en");
  }, [i18n.language]);

  useEffect(() => {
    document.documentElement.lang = i18n.language.startsWith("zh") ? "zh-CN" : "en";
  }, [i18n.language]);

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          borderRadius: 6,
          colorPrimary: "#1677ff",
        },
        components: {
          Layout: {
            headerBg: "#fff",
            bodyBg: "#f5f5f5",
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AntdLocaleBridge>
        <AuthProvider>
          <Inner>{children}</Inner>
        </AuthProvider>
      </AntdLocaleBridge>
    </QueryClientProvider>
  );
}
