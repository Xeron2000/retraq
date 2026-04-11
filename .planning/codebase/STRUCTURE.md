# Retraq 目录结构

## 顶层目录

```text
.
├── 1.xlsx
├── README.md
├── start.sh
├── start.bat
├── backend/
├── frontend/
├── docs/
└── .planning/codebase/
```

- `README.md`：项目简介、启动方式和端口说明
- `start.sh` / `start.bat`：本地一键启动脚本
- `1.xlsx`：首次导入的示例交易数据
- `docs/images/`：README 里的截图资源
- `.planning/codebase/`：本次架构文档输出目录

## backend/

```text
backend/
├── database.py
├── import_data.py
├── main.py
├── models.py
├── pyproject.toml
├── uv.lock
└── services/
    ├── __init__.py
    ├── kline_service.py
    ├── symbol_utils.py
    ├── trade_analyzer.py
    └── trade_importer.py
```

### 角色分工

- `backend/main.py:28-129`：唯一 API 入口，集中定义路由
- `backend/database.py:4-16`：SQLite 引擎、Session 和 `Base`
- `backend/models.py:5-38`：ORM 数据模型（`Kline`、`Trade`）
- `backend/import_data.py:12-36`：空库时的示例数据导入入口
- `backend/services/`：业务逻辑和数据处理

### 目录心智

- **数据定义**：`models.py`
- **数据库连接**：`database.py`
- **对外 API**：`main.py`
- **导入与计算**：`services/`
- **启动/初始化**：`import_data.py`

## backend/services/

- `kline_service.py`：行情缓存、外部回填、时间范围查询
- `trade_importer.py`：Excel -> `Trade`
- `trade_analyzer.py`：`Trade` -> 汇总统计
- `symbol_utils.py`：币对标准化和校验

这几个文件构成后端真正的业务层；`main.py` 只是把它们接成 HTTP 接口。

## frontend/

```text
frontend/
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.ts
├── src/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── utils/
└── public/
```

### 角色分工

- `frontend/src/main.tsx:1-13`：React 入口和路由注入
- `frontend/src/App.tsx:7-18`：页面路由与全局布局
- `frontend/src/pages/`：路由级页面
- `frontend/src/components/`：页面复用组件和展示组件
- `frontend/src/services/api.ts:35-112`：HTTP/数据契约层
- `frontend/src/utils/tradeAnalysis.ts:146-846`：纯分析函数层
- `frontend/src/index.css:1-225`：全局主题、动画和基础样式
- `frontend/vite.config.ts:5-14`：前端开发代理
- `frontend/tailwind.config.js:2-35`：DaisyUI 主题定义

### pages/

- `ReplayPage.tsx:7-46`：复盘工作台，左列表 / 中图表 / 右详情
- `AnalysisPage.tsx:829-1030`：交易分析中心，全部在前端做二次计算
- `LearnPage.tsx:136-339`：本地学习内容页

### components/

- `Navbar.tsx:4-64`：全局导航
- `TradeList.tsx:11-276`：交易列表和筛选器
- `ChartManager.tsx:52-1066`：主图、对比图、标记、价格线、全屏
- `PositionDetails.tsx:12-49`：选中交易详情
- `StatsBar.tsx`、`StatsPanel.tsx`：独立的 KPI 展示组件；当前路由树没有引入它们

## 数据与页面的对应关系

- `Trade` / `Kline`：后端事实模型
- `frontend/src/services/api.ts`：把后端 JSON 变成前端接口对象
- `ReplayPage`：把 `TradeList` 选中的交易传给 `ChartManager` 和 `PositionDetails`
- `AnalysisPage`：把 `fetchTrades()` 拉下来的交易交给 `tradeAnalysis.ts`
- `LearnPage`：本地静态内容，没有后端依赖

## 读目录时的主线

按下面顺序看最容易建立心智模型：

1. `start.sh` / `start.bat`：应用怎么启动
2. `backend/main.py`：后端暴露什么接口
3. `backend/services/`：接口背后的业务怎么做
4. `frontend/src/services/api.ts`：前端怎么对接接口
5. `frontend/src/pages/ReplayPage.tsx` 和 `AnalysisPage.tsx`：页面怎么组合数据
6. `frontend/src/components/ChartManager.tsx` 和 `tradeAnalysis.ts`：最重的 UI/分析逻辑在哪里

如果只记一件事：**后端负责持久化与行情回填，前端负责页面编排与二次分析。**
