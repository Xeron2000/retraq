# CONCERNS

> 这是一份风险/缺口清单，不是完整架构说明。

## 总览
- 该仓库的意图很明确：本地交易复盘 + 分析 + 学习。
- 但当前实现更像“SQLite + Excel 导入 + 实时 K 线”的单机工具，真正会影响后续路线图的风险集中在数据/历史规模、导入脆弱性、外部行情依赖、前端状态耦合，以及 README 对学习/分析能力的部分超前表述。

## P1 / High
- **学习模块与真实数据链路脱节**：`README.md` 把学习模块描述成“通过所有复盘提取视频”的系统，但 `frontend/src/pages/LearnPage.tsx` 目前是静态硬编码内容，没有接交易数据、回放数据或视频抽取链路。后续如果要做“学习闭环”，这一块需要重新定义，而不是在静态页面上继续堆内容。
- **多周期/对比能力被文档写得比实现更强**：`README.md` 说明支持“多周期多交易对对比”，但 `frontend/src/components/ChartManager.tsx` 的对比图和主图共用同一个 `activeTimeframe`，当前并不是独立多周期并排比较。这个差距会直接影响未来 compare/overlay 的规划。
- **数据历史天然受限于本地 SQLite**：`README.md` 明确是本地存储，`backend/main.py` 启动即 `Base.metadata.create_all(...)`，没有看到迁移/版本化 schema 体系。对小数据量没问题，但一旦交易量、字段或回放历史增长，表结构演进和数据迁移会变成主风险。

## P2 / Medium
- **导入链路脆弱且强依赖仓库布局**：`backend/import_data.py` 只认根目录 `1.xlsx`，并且只在数据库为空时导入；`backend/services/trade_importer.py` 对每行异常只做计数，缺少可观测日志。初次导入、表头变更、坏行数据都很容易静默退化。
- **行情依赖是外部网络敏感点**：`backend/services/kline_service.py` 默认 exchange 列表是 `okx,binance`，拉取失败时会在缓存/实时源之间兜底，但本质上仍依赖 CCXT 和交易所可用性。若后续要支持更长历史或更稳定的回放，行情层需要更明确的缓存失效策略和失败可见性。
- **前端分析层把 UI、指标计算和格式化揉在一起**：`frontend/src/pages/AnalysisPage.tsx` 很大，`frontend/src/utils/tradeAnalysis.ts` 也在做衍生分析，`StatsPanel.tsx` / `StatsBar.tsx` / `TradeList.tsx` / `ChartManager.tsx` 之间复用数据但边界不够硬。这里是未来重构最容易踩坑的地方。
- **类型安全在 chart 代码里被削弱**：`frontend/src/components/ChartManager.tsx` 使用了 `any/as any`，分析页还出现了 `@ts-expect-error`。图表库或数据形状一变，回归会更难提前发现。
- **质量门禁偏弱**：当前前端脚本看起来主要是 build/lint/preview，未见独立 test/typecheck 命令。对原型够用，但对快速迭代分析功能不够稳。

## P3 / Low
- **`.planning/codebase` 目前偏薄**：现有材料只有 `STACK.md` 和 `INTEGRATIONS.md`，没有看到更细的 roadmap / decision / milestone 文档。能支撑“现状说明”，但不够支撑后续里程碑管理。
- **`frontend/README.md` 仍是默认 Vite 模板**：它不是项目文档，容易让新成员误判前端子项目的真实约束。

## 后续规划热点
- `backend/import_data.py`
- `backend/services/trade_importer.py`
- `backend/services/kline_service.py`
- `backend/main.py`
- `frontend/src/components/ChartManager.tsx`
- `frontend/src/pages/AnalysisPage.tsx`
- `frontend/src/pages/LearnPage.tsx`
