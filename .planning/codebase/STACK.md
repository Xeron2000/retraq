# STACK

## 运行时 / 包管理
- Python 3.11+（`backend/pyproject.toml`, `README.md`）
- Node.js 18+、pnpm、uv（`README.md`, `start.sh`, `start.bat`）
- 前后端独立管理：后端锁文件 `backend/uv.lock`，前端锁文件 `frontend/pnpm-lock.yaml`；仓库根目录未见独立 `package.json` / workspace 文件（当前扫描结果）

## 后端
- FastAPI + Uvicorn + SQLAlchemy 2 + CCXT + pandas + openpyxl + python-multipart + pytz（`backend/pyproject.toml`）
- 入口：`backend/main.py`（API）和 `backend/import_data.py`（示例数据导入）
- Excel 导入链路依赖 pandas/openpyxl；上传接口依赖 multipart 表单（`backend/services/trade_importer.py`, `backend/main.py`）

## 前端
- React 19 + TypeScript + Vite 7 + React Router 7 + axios + lightweight-charts + lucide-react + Tailwind CSS v4 + DaisyUI（`frontend/package.json`, `frontend/vite.config.ts`, `frontend/src/index.css`, `frontend/src/App.tsx`）
- 构建链路：`tsc -b && vite build`；本地预览：`vite preview`（`frontend/package.json`, `start.sh`, `start.bat`）

## 存储
- 本地 SQLite：`sqlite:///./trading.db`（`backend/database.py`）
- 表：`klines`、`trades`；启动时自动 `Base.metadata.create_all`（`backend/models.py`, `backend/main.py`, `backend/import_data.py`）
- 索引：`klines(symbol,timeframe,timestamp)` 唯一索引，`trades(symbol)` 普通索引（`backend/models.py`）

## 本地运行假设
- 后端命令默认在 `backend/` 目录内执行，入口直接是 `uvicorn main:app`（`start.sh`, `start.bat`）
- 前端开发代理将 `/api` 转发到 `http://localhost:9527`（`frontend/vite.config.ts`）
- 启动脚本会在首次运行时导入根目录 `1.xlsx` 示例数据（`README.md`, `backend/import_data.py`）
