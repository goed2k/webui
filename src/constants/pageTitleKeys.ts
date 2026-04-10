import { ROUTES } from "@/constants/routes";

/** i18n 键，供 `t(pages.titles.*)` 使用 */
export const PAGE_TITLE_KEYS: Partial<Record<string, string>> = {
  [ROUTES.dashboard]: "pages.titles.dashboard",
  [ROUTES.transfers]: "pages.titles.transfers",
  [ROUTES.search]: "pages.titles.search",
  [ROUTES.shared]: "pages.titles.shared",
  [ROUTES.networkServers]: "pages.titles.networkServers",
  [ROUTES.networkPeers]: "pages.titles.networkPeers",
  [ROUTES.networkDht]: "pages.titles.networkDht",
  [ROUTES.settingsRuntime]: "pages.titles.settingsRuntime",
  [ROUTES.settingsBootstrap]: "pages.titles.settingsBootstrap",
  [ROUTES.settingsState]: "pages.titles.settingsState",
  [ROUTES.settingsLogging]: "pages.titles.settingsLogging",
};
