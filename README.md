# Retraq

本地交易历史复盘工具：多档案隔离、文件导入交割单，在 K 线上回顾与分析任意交易者的记录。

## 截图

![复盘页面](docs/images/replay.png)

![分析页面](docs/images/analysis.png)

## 功能

- 📈 K线图表 - 从 OKX 获取实时行情数据，支持多周期（5m/15m/1h/4h/1d）
- 🔀 多周期多交易对对比 - 同时查看不同时间周期和交易对的走势
- 📍 买卖点标注 - 明确标注买入卖出点和均价，直观复盘每笔交易
- 📊 交易分析 - 统计胜率、盈亏比、收益曲线等关键指标

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

### 一键启动

**Linux / macOS**
```bash
chmod +x start.sh
./start.sh
```

**Windows**
```cmd
start.bat
```

首次空库会创建示例档案「浪哥（示例）」并导入仓库内 `1.xlsx`；已有旧数据会归入档案「默认」。可在导航栏切换档案，在设置页新建/导入/删除。

启动后访问：
- 前端：http://localhost:9528
- 后端 API：http://localhost:9527

### 手动启动

```bash
# 后端
cd backend
uv sync
uv run python import_data.py  # 导入示例数据
uv run uvicorn main:app --reload --port 9527

# 前端（新终端）
cd frontend
pnpm install
pnpm build
pnpm preview --port 9528 &
```

## 注意事项

- 本项目为个人学习工具，数据存储在本地 SQLite
- K 线数据来自 OKX 公开 API，请遵守交易所服务条款
- 不建议直接暴露到公网，如需公开部署请自行添加认证

## License

MIT License
