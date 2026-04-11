# Retraq 架构概览

## 1. 系统边界

Retraq 是一个本地运行的前后端分离应用，运行时有两个独立进程：

- 前端：React SPA，入口是 `frontend/src/main.tsx:1-13`，路由壳在 `frontend/src/App.tsx:7-18`
- 后端：FastAPI 服务，入口是 `backend/main.py:17-129`

启动脚本 `start.sh:6-36` 和 `start.bat:5-32` 的顺序是固定的：先同步后端依赖、初始化/导入示例数据，再启动后端 9527，最后构建并预览前端 9528。前端开发代理在 `frontend/vite.config.ts:5-14`，把 `/api` 转发到 `http://localhost:9527`。

唯一的本地持久层是 SQLite 文件 `backend/trading.db`，由 `backend/database.py:4-16` 创建并管理。

## 2. 后端：数据与计算边界

后端没有拆成多个 router 包，当前 API surface 集中在 `backend/main.py:28-129`：

- `GET /api/klines/{symbol}/{timeframe}`：返回 K 线数据
- `POST /api/trades/import`：上传 Excel 交易单并入库
- `GET /api/trades`：分页返回交易记录
- `GET /api/stats/overview`：返回汇总统计

`backend/main.py` 里直接返回字典，没有单独的 Pydantic 响应模型层；前端用 TypeScript 接口对齐这些 JSON 结构，见 `frontend/src/services/api.ts:3-112`。

### 2.1 数据模型

`backend/models.py:5-38` 只有两张核心表：

- `Kline`：行情缓存表，按 `symbol + timeframe + timestamp` 做唯一索引
- `Trade`：复盘交易表，保存方向、杠杆、开平仓价格、盈亏、收益率、时间戳等字段

这意味着系统的“事实数据”只有两类：行情片段和交易记录，其它页面指标都是派生结果。

### 2.2 服务层职责

- `backend/services/kline_service.py:18-306`：行情获取与缓存层。它按时间范围查 SQLite，缺口再用 `ccxt` 从外部交易所回填，随后 upsert 到 `Kline` 表。
- `backend/services/trade_importer.py:21-100`：Excel 导入层。它把中文表头映射到 `Trade` 字段，做方向、币对、时间戳等清洗后写库。
- `backend/services/trade_analyzer.py:7-75`：后端汇总统计层。它从 `Trade` 计算总盈亏、胜率、盈亏比、回撤、平均持仓时长和币对分布。
- `backend/services/symbol_utils.py:6-31`：币对规范化与校验层，保证查询和导入使用统一格式。

`backend/import_data.py:12-36` 是种子导入入口：当数据库为空时，从仓库根目录的 `1.xlsx` 导入示例交易。

### 2.3 外部数据源

外部行情只在 `kline_service` 的缓存未命中时才进入流程。`backend/services/kline_service.py:21-29` 从环境变量 `KLINE_EXCHANGES` 读取交易所列表（默认 `okx,binance`），然后通过 `ccxt` 拉取 OHLCV。也就是说，外部交易所是行情的上游源，SQLite 是落地缓存。

## 3. 前端：路由与视图编排边界

前端是一个路由驱动的单页应用：

- `frontend/src/main.tsx:1-13` 负责挂载 React 和 `BrowserRouter`
- `frontend/src/App.tsx:7-18` 定义三个页面路由：`/replay`、`/analysis`、`/learn`
- `frontend/src/components/Navbar.tsx:4-64` 提供全局导航壳

### 3.1 复盘页

`frontend/src/pages/ReplayPage.tsx:7-46` 负责把三个子组件拼成主工作台：

- `TradeList`：左侧交易列表与交易对筛选
- `ChartManager`：中间 K 线与对比图
- `PositionDetails`：右侧仓位详情

这条页面链路的状态核心是 `symbol` 和 `selectedTrade`。交易对改变会清空当前选择；选择某笔交易又会反向同步交易对。

`frontend/src/components/TradeList.tsx:11-276` 是列表侧栏，先拉 `fetchStats()` 再拉 `fetchTrades()`，用统计结果构建交易对过滤器，并默认选中 BTC 相关或交易量最多的币对。

`frontend/src/components/ChartManager.tsx:52-1066` 是图表编排层，不只是渲染图表：它还负责拉取 K 线、同步主图/对比图范围、给选中交易打买卖点标记、画价格线、支持全屏和多交易对对比。

`frontend/src/components/PositionDetails.tsx:12-49` 只是把选中交易渲染成只读详情卡。

### 3.2 分析页

`frontend/src/pages/AnalysisPage.tsx:829-1030` 先调用 `fetchTrades()` 拉全量交易，然后在前端本地计算总盈亏、胜率、回撤、时间模式、行为模式、风险分布和币对分布。

`frontend/src/utils/tradeAnalysis.ts:146-846` 是分析页的纯计算层，分成四类：

- 时间分析
- 行为分析
- 风险分析
- 币对分析

`generateInsights()` 再把这些指标组合成智能洞察卡片。

这说明分析页不是一个“后端算好再前端展示”的模型，而是“后端提供原始交易，前端做二次分析”的模型。

### 3.3 学习页

`frontend/src/pages/LearnPage.tsx:136-339` 是静态内容型页面，内部以本地数组驱动，不依赖后端。

### 3.4 传输边界

`frontend/src/services/api.ts:35-112` 是前端唯一的 API 入口：

- `fetchKlines()`：请求 `/api/klines/...`，把后端毫秒时间戳转换成轻量图表使用的秒级时间
- `fetchTrades()`：分页拉取 `/api/trades`
- `importTrades()`：上传 Excel 到 `/api/trades/import`
- `fetchStats()`：读取 `/api/stats/overview`

这里是前后端契约的直接边界：后端返回原始 JSON，前端负责把它转成 UI 可用的数据结构。

## 4. 数据流：从源头到 UI

1. `1.xlsx` 或用户上传的 Excel 进入 `backend/import_data.py:12-36` / `backend/main.py:64-77`
2. `TradeImporter` 清洗并写入 `Trade` 表
3. `TradeList` 和 `AnalysisPage` 通过 `frontend/src/services/api.ts` 读取交易数据
4. `ChartManager` 根据当前 `symbol` 和 `selectedTrade` 请求 K 线，`kline_service` 先查 SQLite，再在缺口处回填外部交易所数据
5. 图表层把选中交易的开平仓点、价格线和对比图同步到 UI
6. `AnalysisPage` 把全量交易送入 `tradeAnalysis.ts`，在浏览器端生成时间、行为、风险和标的洞察

## 5. 心智模型

可以把系统理解成三层：

1. **后端是事实层**：`Trade`、`Kline`、导入、缓存、汇总都在这里
2. **前端是编排层**：路由、交互、图表状态、页面布局都在这里
3. **派生分析在前端完成**：分析页对交易做二次计算，而不是再走一套后端分析 API

换句话说，Retraq 的核心不是“很多服务”，而是“两个稳定事实表 + 一层 UI 编排 + 一层本地分析”。
