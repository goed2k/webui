# goed2k WebUI

基于 React、Vite、TypeScript、Ant Design 的 goed2k daemon 控制台，对接 `GET/POST /api/v1/*` 与 WebSocket `/api/v1/events/ws`。

## 开发

```bash
pnpm install
pnpm dev
```

浏览器访问开发服务器提示的本地地址（默认 `http://127.0.0.1:5173`）。

### 环境变量

复制 `.env.example` 为 `.env` 并按需修改：

| 变量 | 说明 |
|------|------|
| `VITE_API_BASE` | API 根前缀前的 origin；留空则请求同源 `/api/v1` |
| `VITE_USE_MOCK` | 为 `true` 时使用前端 Mock，可离线预览界面 |
| `VITE_DEV_PROXY_TARGET` | 开发时代理 `/api` 的目标 daemon 地址 |

开发模式下，Vite 将 `/api` 代理到 `VITE_DEV_PROXY_TARGET`（含 WebSocket），便于与本地 daemon 联调。

### 多语言

界面支持 **简体中文**（`zh-CN`，默认）与 **英文**（`en`）。在顶栏右侧语言下拉框切换；选择会写入 `localStorage`（键名 `goed2k_i18n_lang`）。Ant Design 组件与 `dayjs` 会随语言切换。

文案资源位于 [`src/locales/zh-CN.json`](src/locales/zh-CN.json)、[`src/locales/en.json`](src/locales/en.json)；初始化见 [`src/i18n/index.ts`](src/i18n/index.ts)。

### 鉴权

除 `GET /api/v1/system/health` 外，HTTP 与 WebSocket 需携带与 `rpc.auth_token` 一致的 Token。首次进入可在弹窗或顶栏「设置 Token」中粘贴；Mock 模式下可不填。

## 构建

```bash
pnpm build
pnpm preview
```

## 规范与接口

产品行为见仓库内 `goed_2_k_webui_implementation_spec.md`；字段与路径以 daemon 的 `docs/API.md` 为准。
