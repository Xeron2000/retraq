# INTEGRATIONS

## 前端 ↔ 后端
- 前端通过相对路径 `/api` 调后端；Vite 开发代理指向 `http://localhost:9527`（`frontend/vite.config.ts`, `frontend/src/services/api.ts`）
- 主要 API：
  - `GET /api/klines/{symbol}/{timeframe}`：K 线数据，支持 `start` / `end` / `limit` / `nocache`
  - `GET /api/trades`：交易列表，支持 `symbol` / `start_date` / `end_date` / `page` / `limit`
  - `POST /api/trades/import`：Excel 交易单导入
  - `GET /api/stats/overview`：统计概览
  （`backend/main.py`, `frontend/src/services/api.ts`）

## 市场数据源 ↔ 后端缓存
- K 线由 CCXT 拉取，默认 exchange 列表为 `okx,binance`，可通过 `KLINE_EXCHANGES` 环境变量覆盖（`backend/services/kline_service.py`）
- 后端把前端的 `BASE-QUOTE` 交易对转换成 CCXT 的 `BASE/QUOTE`，先查 SQLite 缓存，再按缺口补拉并回写 `klines` 表（`backend/services/kline_service.py`）
- 支持时间周期固定为 `5m/15m/1h/4h/1d`，前后端一致（`backend/services/kline_service.py`, `frontend/src/services/api.ts`）

## 交易 Excel ↔ 数据库
- `POST /api/trades/import` 只接受 `.xlsx/.xls` 的 multipart 上传（`backend/main.py`）
- Excel 列映射是中文表头，且会做方向、收益率、时间戳和 `Asia/Shanghai` 时区归一化（`backend/services/trade_importer.py`）
- 首次启动会尝试把根目录 `1.xlsx` 导入到 `trades` 表；如果已有交易记录则跳过（`backend/import_data.py`, `README.md`）

## 前端本地分析边界
- `AnalysisPage` 在浏览器里基于 `fetchTrades()` 的返回值做二次分析，衍生指标由前端 `tradeAnalysis.ts` 计算，不依赖额外后端分析接口（`frontend/src/pages/AnalysisPage.tsx`, `frontend/src/utils/tradeAnalysis.ts`）
- `StatsBar.tsx`、`StatsPanel.tsx`、`TradeList.tsx`、`ChartManager.tsx` 复用 `/api/stats/overview` 来驱动交易对分布、概览卡片和对比交易对选择（`frontend/src/components/StatsBar.tsx`, `frontend/src/components/StatsPanel.tsx`, `frontend/src/components/TradeList.tsx`, `frontend/src/components/ChartManager.tsx`）

## 边界备注
- 后端 CORS 目前是 `allow_origins=["*"]`，适合本地联调，不是面向公网的收口方案（`backend/main.py`）
- 当前扫描未见队列、消息总线、外部认证提供方或第三方支付等额外集成层
