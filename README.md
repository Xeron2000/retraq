# Retraq

本地交易历史复盘工具：按数据集导入交割单，在 K 线上回顾与分析交易记录。

## 截图

![复盘页面](docs/images/replay.png)

![分析页面](docs/images/analysis.png)

## 功能

- 📈 K线图表 - 从 OKX 获取实时行情数据，支持多周期（5m/15m/1h/4h/1d）
- 🔀 多周期多交易对对比 - 同时查看不同时间周期和交易对的走势
- 📍 买卖点标注 - 明确标注买入卖出点和均价，直观复盘每笔交易
- 📊 交易分析 - 统计胜率、盈亏比、收益曲线等关键指标
- 📥 多模板导入 - 交割单表格、币安合约交易/仓位历史等（按当前数据集）

## 导入交易记录

在顶栏 **数据集** 处上传 `.xlsx` / `.csv`（交割单格式支持 csv）。数据写入**当前选中的数据集**。

| 模板 | 说明 |
|------|------|
| **交割单表格** | 表头含「交易对」等列；`template=auto` 自动识别。示例见 `samples/bit-langge-delivery-example.xlsx`（bit浪浪 交割单数据，仅作格式参考） |
| **币安 U 本位合约交易历史（推荐）** | 下载中心「合约交易历史」；按成交聚合为开平仓，利润用表内「已实现利润」汇总 |
| **币安 U 本位合约仓位历史** | 下载中心「仓位历史」；已平仓行直接导入 |

### 币安 U 本位合约交易历史（推荐）

1. [下载中心 → 合约交易历史（U 本位）](https://www.binance.com/zh-CN/my/download-center?type=trade-futures-trade-history&child-type=trade-futures-trade-history-u)（路径以币安页面为准）。
2. 顶栏导入 **币安 U 本位合约交易历史** xlsx（`template=auto` 可识别）。
3. 系统按时间将 BUY/SELL 成交合成回合：开仓加权均价、平仓加权均价；**profit = 该回合各笔「已实现利润」之和**（与币安一致）；**profit_rate** 用价差相对开仓价估算；**margin** 用开仓名义价值（无杠杆列时 leverage=1）。

### 币安 U 本位合约仓位历史

1. 登录 [币安](https://www.binance.com)，打开 [下载中心 → 合约仓位历史（U 本位）](https://www.binance.com/zh-CN/my/download-center?type=trade-futures-position-history&child-type=trade-futures-position-history-u)。
2. 选择时间范围并下载 Excel（表头行为「代币名称/币种名称/币对」等，文件内前几行为账户信息）。
3. 顶栏上传 **币安 U 本位合约仓位历史** xlsx。系统会按文件名创建/更新数据集并自动切换到该表（默认覆盖，仅含本表仓位）。

导入会映射：交易对、多/空、入场价、平仓均价、结算盈亏、开仓/平仓时间（按 UTC+8 解析）。仅导入状态为 **Closed** 的仓位；杠杆、保证金、收益率等字段导出中无则留空。

## 技术栈

**前端**
- React 19 + TypeScript
- Vite
- TailwindCSS + DaisyUI
- Lightweight Charts

**后端**
- FastAPI
- SQLAlchemy + SQLite
- CCXT (OKX)

## 快速开始

### 环境要求

- Python 3.11+
- Node.js 18+
- pnpm
- uv (Python 包管理器)

### 安装

```bash
# 克隆项目
git clone https://github.com/Xeron2000/retraq.git
cd retraq
```

### 启动

无「档案」概念：仅**数据集（= 导入的表格）**。顶栏上传/切换数据集；首次安装库为空，需自行导入。

```bash
# 后端
cd backend
uv sync
uv run python import_data.py
uv run uvicorn main:app --reload --port 9527

# 前端（新终端）
cd frontend
pnpm install
pnpm dev
```

- 后端 API：http://localhost:9527
- 前端：见 `pnpm dev` 终端中的本地地址（常用 http://localhost:5173）

### Docker（单容器，推荐本地部署）

前后端打在一个镜像里：FastAPI 提供 `/api`，静态页为构建后的前端；SQLite 持久化在卷 `/data`。

```bash
# 本地构建
docker compose up --build -d
# 浏览器打开 http://localhost:8080
```

或拉取 CI 构建的镜像（`main` 推送后）：

```bash
docker run -d --name retraq -p 8080:8080 -v retraq-data:/data ghcr.io/xeron2000/retraq:latest
```

将 `xeron2000/retraq` 换成你的 `ghcr.io/<owner>/<repo>`（全小写）。数据在命名卷 `retraq-data`，删容器不删库。

## 注意事项

- 本项目为个人学习工具，数据存储在本地 SQLite
- K 线数据来自 OKX 公开 API，请遵守交易所服务条款
- 不建议直接暴露到公网，如需公开部署请自行添加认证

## License

MIT License
