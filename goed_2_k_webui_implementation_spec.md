# goed2k WebUI 实现文档（按当前 daemon API 修订）

本文档以 `goed2k/daemon` 当前 `docs/API.md` 为准，目标是让 WebUI 设计与后端已实现能力保持一致，避免前端规划超出后端边界。

后端参考文档：

- <https://github.com/goed2k/daemon/blob/master/docs/API.md>

---

## 1. 项目目标

为 `goed2k` daemon 实现一个现代化 WebUI，用于管理下载任务、搜索、共享库、网络连接与基础系统配置。

该 WebUI 是一个 **下载器控制面板**，不是通用后台系统，也不是官网。

设计目标：

- 功能结构清晰，接近经典下载器的使用逻辑
- 使用 **左侧导航**
- 前端以 **状态可读性、操作效率、信息密度** 为优先
- UI 使用 **Ant Design**
- 前后端分离，前端通过 **HTTP API + WebSocket** 与 daemon 通信
- 第一版以 **贴合现有后端能力** 为核心，不虚构接口

---

## 2. 技术栈要求

前端技术栈固定如下：

- React
- TypeScript
- Vite
- Ant Design
- React Router
- TanStack Query
- WebSocket

可选：

- Zustand：做轻量全局状态管理
- dayjs：时间格式化
- Recharts 或 ECharts：只在确实需要可视化时使用

不要使用：

- Next.js
- Umi
- Ant Design Pro 全家桶
- Redux Toolkit（除非确实必要）
- SSE（当前后端未提供 SSE）

---

## 3. 后端能力基线

当前 daemon 已提供的后端能力主要包括：

- 系统状态查询与引擎启停
- 配置读取与局部热更新
- ed2k 服务器列表与连接
- DHT 状态、启用、导入节点、手动 bootstrap
- 下载任务列表、创建、详情、暂停、恢复、删除
- 下载任务的 peers / pieces 详情
- 单活跃搜索任务
- 从当前搜索结果直接创建下载任务
- 共享目录管理
- 共享文件导入、查询、删除
- WebSocket 实时状态推送

当前后端 **没有明确提供** 的能力：

- SSE 实时流
- 独立日志查询接口
- 独立统计图表接口
- 全局 peers 列表接口
- 全局 connections 列表接口
- server 断开 / 删除接口
- DHT 停止接口
- 多搜索任务历史管理
- 基于用户名密码的登录会话接口

因此，WebUI 第一版必须围绕现有能力实现，未提供的功能只能标注为后续扩展，不能作为本期必做项。

---

## 4. 产品定位

这是一个 **daemon 控制台**。

WebUI 的主要职责：

- 管理下载任务
- 查看 daemon / engine / network 当前状态
- 发起搜索并从搜索结果添加下载
- 管理共享目录与共享文件
- 修改 daemon 可热更新配置
- 接收实时状态推送

不应在第一版承诺的能力：

- 日志中心
- 高级统计分析
- 完整权限系统
- 多用户系统
- SEO / SSR / 官网内容

---

## 5. 总体布局

采用标准三段式布局：

- 左侧：一级导航
- 顶部：全局状态栏
- 中间：页面内容区
- 右侧：任务详情抽屉

布局要求：

- 左侧导航可折叠
- 顶部状态栏固定
- 内容区自适应滚动
- 任务详情默认使用 Drawer，而不是整页跳转
- 桌面端优先，最低宽度建议 1280px

---

## 6. 信息架构

### 6.1 一级导航

左侧导航建议固定为：

1. 仪表盘
2. 任务
3. 搜索
4. 共享
5. 网络
6. 设置

### 6.2 二级导航

#### 网络

- 服务器
- DHT

#### 设置

- 运行控制
- 引导配置
- 状态持久化
- 日志配置

说明：

- 不再保留“统计”“日志”“Peers”“连接”独立一级或二级页面
- Peer 信息仅在任务详情中展示
- 设置项仅围绕后端 `system/config` 当前支持的字段设计

---

## 7. 路由设计

建议路由如下：

```text
/
/dashboard
/transfers
/search
/shared
/network/servers
/network/dht
/settings/runtime
/settings/bootstrap
/settings/state
/settings/logging
```

补充约定：

- 任务详情使用 Drawer，建议通过查询参数保持可分享状态，例如 `/transfers?hash=<HASH>`
- 一级和二级页面必须支持刷新后恢复
- 当前菜单高亮与 URL 保持一致

---

## 8. 鉴权与通信约定

### 8.1 API 前缀

所有接口基础路径前缀为：

```text
/api/v1
```

### 8.2 鉴权方式

除 `GET /api/v1/system/health` 外，其余 HTTP 接口和 WebSocket 握手都需要 Token。

后端接受以下任一方式：

- `Authorization: Bearer <token>`
- `X-Auth-Token: <token>`
- WebSocket URL 查询参数 `?token=<token>`

前端建议：

- 首次进入时检测 `system/health`
- Token 通过本地存储或启动弹窗输入
- 第一版不做“用户名密码登录页”，因为后端没有对应会话接口

### 8.3 统一响应结构

成功：

```json
{
  "code": "OK",
  "data": {}
}
```

失败：

```json
{
  "code": "ERROR_CODE",
  "message": "人类可读说明"
}
```

前端必须统一处理业务错误码，至少覆盖：

- `UNAUTHORIZED`
- `ENGINE_NOT_RUNNING`
- `ENGINE_ALREADY_RUNNING`
- `TRANSFER_NOT_FOUND`
- `INVALID_ED2K_LINK`
- `SEARCH_ALREADY_RUNNING`
- `SEARCH_NOT_RUNNING`
- `CONFIG_INVALID`
- `STATE_STORE_ERROR`
- `SHARED_FILE_NOT_FOUND`

---

## 9. 页面详细说明

## 9.1 仪表盘

功能定位：展示 daemon 当前运行全貌，并承载基础系统控制。

数据主要来自：

- `GET /api/v1/system/health`
- `GET /api/v1/system/info`
- `GET /api/v1/network/servers`
- `GET /api/v1/network/dht`
- `GET /api/v1/transfers`
- `GET /api/v1/events/ws`

页面内容建议：

### 顶部状态卡

- Engine 运行状态
- Daemon 可用状态
- daemon 版本
- 运行时长
- 当前连接服务器数
- DHT 状态
- 当前任务总数
- 总下载速度
- 总上传速度

### 中部区块

- 最近任务列表
- 当前主要服务器状态概览
- 当前默认下载目录
- 状态存储是否可用

### 顶部快捷操作

- 启动引擎
- 停止引擎
- 保存状态
- 加载状态

说明：

- “磁盘剩余空间”“最近错误/告警”“日志摘要”“统计趋势图”不是当前后端明确提供的数据，不作为第一版必做内容

---

## 9.2 任务页

这是核心页面，优先级最高。

数据主要来自：

- `GET /api/v1/transfers`
- `POST /api/v1/transfers`
- `GET /api/v1/transfers/{hash}`
- `POST /api/v1/transfers/{hash}/pause`
- `POST /api/v1/transfers/{hash}/resume`
- `DELETE /api/v1/transfers/{hash}`
- `GET /api/v1/transfers/{hash}/peers`
- `GET /api/v1/transfers/{hash}/pieces`
- `GET /api/v1/events/ws`

### 顶部操作区

- 新增 ed2k 任务
- 刷新
- 状态筛选
- 暂停筛选
- 搜索框

说明：

- 第一版不强依赖批量操作，因为后端只提供单任务 pause / resume / delete 接口
- 如果前端要做批量操作，应明确为“串行调用单任务接口”的前端增强，而不是后端原生批量能力

### 列表字段

- 文件名
- Hash
- 大小
- 进度
- 状态
- 是否暂停
- 下载速度
- 上传速度
- Peer 数
- 活跃 Peer 数
- 正在下载分块数
- ETA
- 创建时间
- 本地路径
- 操作列

### 行操作

- 暂停
- 恢复
- 删除
- 查看详情

### 任务详情抽屉 Tabs

- 概览
- Peers
- Pieces

#### 概览

- 文件名
- Hash
- ed2k 链接
- 本地路径
- 大小
- 状态
- 进度
- 是否暂停
- 下载/上传速度
- 总完成量
- 总接收量
- 目标大小
- ETA

#### Peers

- 基于 `GET /transfers/{hash}/peers`
- 展示 endpoint、source、速率等后端返回字段

#### Pieces

- 基于 `GET /transfers/{hash}/pieces`
- 展示 index、state 及字节统计
- 第一版优先使用表格或简化块状态，不强行做复杂可视化

不做内容：

- 文件列表 Tab
- 任务日志 Tab

原因：

- 当前后端文档未提供对应接口

---

## 9.3 搜索页

数据主要来自：

- `POST /api/v1/searches`
- `GET /api/v1/searches/current`
- `POST /api/v1/searches/current/stop`
- `POST /api/v1/searches/current/results/{hash}/download`

### 顶部搜索区

- 关键字输入框
- 搜索按钮
- 停止搜索按钮
- 清空当前展示
- 高级筛选折叠区

### 高级筛选

- scope：`all` / `server` / `dht`
- 最小大小
- 最大大小
- 最小来源数
- 最小完整源数
- 文件类型
- 扩展名

### 搜索状态区

- 当前搜索是否运行中
- 当前搜索参数摘要
- server busy / dht busy
- 错误信息
- 更新时间

### 搜索结果表格

字段以 `SearchDTO.results` 实际返回结构为准，优先展示：

- 文件名
- Hash
- 大小
- 来源数
- 完整源数
- 文件类型或扩展名
- 操作

### 行操作

- 下载

说明：

- 当前后端只允许一个活跃搜索
- 第一版不做搜索历史、多搜索 Tab、保存搜索会话
- “批量添加下载”不作为后端对齐后的必做项

---

## 9.4 共享页

数据主要来自：

- `GET /api/v1/shared/files`
- `GET /api/v1/shared/dirs`
- `POST /api/v1/shared/dirs`
- `POST /api/v1/shared/dirs/remove`
- `POST /api/v1/shared/dirs/rescan`
- `POST /api/v1/shared/import`
- `DELETE /api/v1/shared/files/{hash}`

页面内容：

### 共享目录区域

- 已注册共享目录列表
- 添加目录
- 移除目录
- 重新扫描目录

### 共享文件区域

- 文件名
- Hash
- 路径
- 大小
- 来源类型 `origin`
- 是否完成 `completed`
- 是否可上传 `can_upload`
- 最近哈希时间 `last_hash_at`

### 操作

- 添加共享目录
- 删除共享目录
- 重新扫描
- 导入单个本地文件
- 删除共享文件记录

说明：

- “重建索引”不作为独立接口能力描述，统一归入 rescan / import

---

## 9.5 网络页

网络页拆分为两个子页。

### 9.5.1 服务器页

数据主要来自：

- `GET /api/v1/network/servers`
- `POST /api/v1/network/servers/connect`
- `POST /api/v1/network/servers/connect-batch`
- `POST /api/v1/network/servers/load-met`

#### 列表字段

- identifier
- address
- configured
- connected
- handshake_completed
- primary
- disconnecting
- client_id
- id_class
- download_rate
- upload_rate
- milliseconds_since_last_receive

#### 操作

- 连接单个服务器地址
- 批量连接服务器地址
- 从 URL / 本地路径加载 `server.met`
- 手动刷新

说明：

- 当前后端文档没有 server 断开、删除、编辑接口
- 因此前端不要设计对应按钮为必做项

### 9.5.2 DHT 页

数据主要来自：

- `GET /api/v1/network/dht`
- `POST /api/v1/network/dht/enable`
- `POST /api/v1/network/dht/load-nodes`
- `POST /api/v1/network/dht/bootstrap-nodes`

#### 页面内容

- DHT 当前状态摘要
- 节点数量或核心状态字段
- 手动导入 `nodes.dat`
- 手动 bootstrap 指定节点

#### 操作

- 启用 DHT
- 导入 nodes 文件或 URL
- 输入节点列表进行 bootstrap
- 手动刷新

说明：

- 当前后端没有 `disable` / `stop dht` 接口

---

## 9.6 设置页

设置页必须严格围绕 `GET /api/v1/system/config` 与 `PUT /api/v1/system/config` 已支持的字段实现。

数据主要来自：

- `GET /api/v1/system/info`
- `GET /api/v1/system/health`
- `GET /api/v1/system/config`
- `PUT /api/v1/system/config`
- `POST /api/v1/system/start`
- `POST /api/v1/system/stop`
- `POST /api/v1/system/save-state`
- `POST /api/v1/system/load-state`

### 9.6.1 运行控制

展示：

- daemon 版本
- engine 是否运行
- uptime
- RPC 监听地址
- 默认下载目录
- 状态文件路径
- state store 是否可用

操作：

- 启动引擎
- 停止引擎
- 保存状态
- 加载状态

### 9.6.2 引导配置

对应配置块：

```json
{
  "bootstrap": {
    "server_addresses": [],
    "server_met_urls": [],
    "nodes_dat_urls": [],
    "kad_nodes": []
  }
}
```

表单项：

- server_addresses
- server_met_urls
- nodes_dat_urls
- kad_nodes

### 9.6.3 状态持久化

对应配置块：

```json
{
  "state": {
    "enabled": true,
    "path": "./data/state/client-state.json",
    "load_on_start": true,
    "save_on_exit": true,
    "auto_save_interval_seconds": 30
  }
}
```

表单项：

- enabled
- path
- load_on_start
- save_on_exit
- auto_save_interval_seconds

### 9.6.4 日志配置

对应配置块：

```json
{
  "logging": {
    "level": "info"
  }
}
```

表单项：

- level

### 设置页要求

- 只提交后端允许的字段
- 未修改字段不要随意回填脏数据
- 保存前进行前端校验
- 保存后刷新配置快照
- 对 `CONFIG_INVALID` 给出清晰提示

说明：

- `GET /system/config` 可能返回完整配置且含 `auth_token`
- 第一版不建议在设置页暴露可编辑 token 能力
- 若需要显示，默认做掩码处理，并标注“仅可信环境使用”

---

## 10. 顶部状态栏设计

顶部状态栏用于全局状态展示，而不是二级导航。

### 左侧

- 当前页面标题
- 面包屑

### 右侧

- WebSocket 连接状态
- Engine 状态
- 服务器连接数
- DHT 状态
- 当前总下载速度
- 当前总上传速度

状态展示要求：

- 用 Tag / Badge 显示状态
- 成功=绿色，告警=橙色，错误=红色，未知=灰色
- 实时数值优先使用 WebSocket 推送更新

---

## 11. 实时更新策略

前端通过 **WebSocket** 接收 daemon 推送的实时事件，不使用 SSE。

### WebSocket 地址

```text
GET /api/v1/events/ws
```

### 事件格式

```json
{
  "type": "client.status",
  "at": "2026-03-31T10:00:00Z",
  "data": {}
}
```

### 当前已知事件类型

- `client.status`
- `transfer.progress`

### 前端处理策略

- 页面初始化先拉取 HTTP 快照
- 然后建立 WebSocket 连接
- `client.status` 用于刷新全局状态
- `transfer.progress` 用于增量更新任务列表与详情
- 断线自动重连
- 顶栏展示实时连接状态

注意：

- 后端会发送 Ping，浏览器会自动处理 Pong
- 服务端对慢客户端可能丢弃部分消息，前端需要接受“最终一致”而不是假设每条事件都必达

---

## 12. API 对接清单

此处列出前端应直接对接的真实接口。

### 系统

- `GET /api/v1/system/health`
- `GET /api/v1/system/info`
- `POST /api/v1/system/start`
- `POST /api/v1/system/stop`
- `POST /api/v1/system/save-state`
- `POST /api/v1/system/load-state`
- `GET /api/v1/system/config`
- `PUT /api/v1/system/config`

### 网络

- `GET /api/v1/network/servers`
- `POST /api/v1/network/servers/connect`
- `POST /api/v1/network/servers/connect-batch`
- `POST /api/v1/network/servers/load-met`
- `GET /api/v1/network/dht`
- `POST /api/v1/network/dht/enable`
- `POST /api/v1/network/dht/load-nodes`
- `POST /api/v1/network/dht/bootstrap-nodes`

### 下载任务

- `GET /api/v1/transfers`
- `POST /api/v1/transfers`
- `GET /api/v1/transfers/{hash}`
- `POST /api/v1/transfers/{hash}/pause`
- `POST /api/v1/transfers/{hash}/resume`
- `DELETE /api/v1/transfers/{hash}`
- `GET /api/v1/transfers/{hash}/peers`
- `GET /api/v1/transfers/{hash}/pieces`

### 搜索

- `POST /api/v1/searches`
- `GET /api/v1/searches/current`
- `POST /api/v1/searches/current/stop`
- `POST /api/v1/searches/current/results/{hash}/download`

### 共享

- `GET /api/v1/shared/files`
- `GET /api/v1/shared/dirs`
- `POST /api/v1/shared/dirs`
- `POST /api/v1/shared/dirs/remove`
- `POST /api/v1/shared/dirs/rescan`
- `POST /api/v1/shared/import`
- `DELETE /api/v1/shared/files/{hash}`

### 实时事件

- `GET /api/v1/events/ws`（WebSocket）

---

## 13. 前端目录结构建议

```text
src/
  app/
    router/
    providers/
    store/
  components/
    layout/
    common/
    status/
    transfer/
    search/
    shared/
    network/
    system/
  pages/
    dashboard/
    transfers/
    search/
    shared/
    network/
    settings/
  services/
    api/
    ws/
    adapters/
  hooks/
  utils/
  types/
  constants/
  styles/
```

要求：

- API 请求层统一封装
- WebSocket 事件统一封装
- 类型定义集中管理
- 后端 DTO 与前端 ViewModel 可分层，但不要过度抽象
- 状态映射、时间格式化、字节单位转换统一沉淀到 `utils`

---

## 14. 视觉风格要求

整体风格：

- 专业下载器控制台
- 深色侧栏 + 明亮内容区
- 表格优先
- 组件密度中等偏紧凑
- 信息优先于装饰

具体要求：

- 不要做过多视觉噪音
- 不要做夸张渐变和大面积装饰图
- 状态、速度、进度、连接信息必须清晰
- 表格、状态卡、Drawer 是主要 UI 载体

---

## 15. 第一版必须完成的功能

MVP 必须实现：

1. 左侧导航布局
2. 顶部状态栏
3. 仪表盘页面
4. 任务列表页
5. 任务详情抽屉
6. 搜索页
7. 共享页
8. 网络页面（服务器 / DHT）
9. 设置页（运行控制 / bootstrap / state / logging）
10. Token 鉴权接入
11. HTTP API 对接
12. WebSocket 实时更新

---

## 16. 当前版本明确不做

以下内容不应作为第一版开发目标：

- 日志页
- 统计页
- 独立 Peers 页
- 独立 Connections 页
- SSE
- 用户名密码登录系统
- 会话管理
- 多搜索历史管理
- server 断开 / 删除
- DHT 停止
- 后端未提供接口的高级设置页

若未来后端补齐接口，再扩展对应页面。

---

## 17. AI 实现要求

给 AI 的实现约束如下：

- 先搭建完整项目骨架与路由
- 先实现与真实后端一致的数据模型
- mock 数据结构必须模拟真实 API 响应包格式
- 优先保证 API 层、DTO、页面状态流正确
- 不要为不存在的接口预埋大段复杂代码
- 页面优先可用，再逐步补细节

建议实现顺序：

1. Layout
2. Token 鉴权接入
3. API Client 与错误处理
4. Dashboard
5. Transfers + Drawer
6. Search
7. Shared
8. Network
9. Settings
10. WebSocket 实时状态接入

---

## 18. 交付要求

AI 最终需要输出：

1. 完整前端项目代码
2. 可直接 `npm install && npm run dev`
3. 有 mock 数据可本地预览
4. API 层与 WebSocket 层有明确接口定义
5. 路由完整
6. 页面可点击切换
7. 任务详情抽屉可工作
8. 与当前 daemon API 对齐

如果后端暂不可用，前端 mock adapter 也必须遵守：

- `/api/v1` 前缀
- 统一 `{ code, data }` / `{ code, message }` 结构
- WebSocket 事件格式与正式接口一致

---

## 19. 一句话总结

请实现一个基于 **React + Vite + TypeScript + Ant Design** 的 `goed2k` WebUI，采用 **左侧导航 + 顶部状态栏 + 内容区 + 任务详情抽屉** 的布局，功能严格围绕当前 daemon 已实现的 **system、network、transfers、searches、shared、events/ws** 接口展开，优先保证 **任务管理、搜索、共享、网络状态、系统配置、实时状态更新** 这些核心能力可用。
