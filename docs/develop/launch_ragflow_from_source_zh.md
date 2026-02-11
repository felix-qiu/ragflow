---
sidebar_position: 2
slug: /launch_ragflow_from_source_zh
sidebar_custom_props: {
  categoryIcon: LucideMonitorPlay
}
---
# 从源码启动服务

本指南介绍如何从源码启动 RAGFlow 服务。按照本指南，您将能够使用源码进行调试。

## 目标受众

已添加新功能或修改现有代码，并希望使用源码进行调试的开发者，*前提是*您的机器已设置好目标部署环境。

## 前置要求

- CPU ≥ 4 核
- RAM ≥ 16 GB
- 磁盘空间 ≥ 50 GB
- Docker ≥ 24.0.0 & Docker Compose ≥ v2.26.1

:::tip 提示
如果您尚未在本地机器（Windows、Mac 或 Linux）上安装 Docker，请参阅 [安装 Docker Engine](https://docs.docker.com/engine/install/) 指南。
:::

## 从源码启动服务

要从源码启动 RAGFlow 服务，请按以下步骤操作：

### 克隆 RAGFlow 仓库

```bash
git clone https://github.com/infiniflow/ragflow.git
cd ragflow/
```

### 安装 Python 依赖

1. 安装 uv：
   
   ```bash
   pipx install uv
   ```

2. 安装 RAGFlow 服务的 Python 依赖：

   ```bash
   uv sync --python 3.12 --frozen
   ```
   *将创建一个名为 `.venv` 的虚拟环境，所有 Python 依赖都将安装到这个新环境中。*

   如果您需要运行测试，请安装测试依赖：

   ```bash
   uv sync --python 3.12 --group test --frozen && uv pip install sdk/python --group test
   ```

3. **下载必需的依赖**（NLTK 数据、tiktoken 文件和模型文件）：

   ```bash
   uv run download_deps.py --china-mirrors
   ```
   
   :::tip 提示
   - 如果您在中国或遇到网络访问问题，请使用 `--china-mirrors` 标志
   - 这将下载 NLTK 数据（wordnet、punkt、punkt_tab）、tiktoken 编码文件和 HuggingFace 模型文件
   - 根据您的网络速度，下载可能需要几分钟
   - 此步骤很重要，可以避免后续启动时的网络连接错误
   :::

### 启动第三方服务

以下命令使用 Docker Compose 启动"基础"服务（MinIO、Elasticsearch、Redis 和 MySQL）：

```bash
docker compose -f docker/docker-compose-base.yml up -d
```

### 更新第三方服务的 host 和 port 设置

1. 在 `/etc/hosts` 中添加以下行，将 **docker/service_conf.yaml.template** 中指定的所有主机名解析为 `127.0.0.1`：

   ```
   127.0.0.1       es01 infinity mysql minio redis
   ```

2. 在 **docker/service_conf.yaml.template** 中，将 mysql 端口更新为 `5455`，将 es 端口更新为 `1200`，如 **docker/.env** 中指定的那样。

   :::important 重要说明
   从源码启动时，RAGFlow 实际读取的是 `conf/service_conf.yaml` 配置文件。请确保该文件中的端口配置正确：
   - MySQL 端口应为 `5455`
   - Elasticsearch 端口应为 `1200`
   
   如果端口不匹配，后端服务将无法连接到数据库和搜索引擎。
   :::

### 启动 RAGFlow 后端服务

RAGFlow 后端需要启动四个服务：
- **任务执行器** (`rag/svr/task_executor.py`)：处理文档解析和索引任务
- **API 服务器** (`api/ragflow_server.py`)：为前端提供 HTTP API 端点
- **数据源同步服务** (`rag/svr/sync_data_source.py`)：处理外部数据源的同步任务
- **Admin 服务器** (`admin/server/admin_server.py`)：提供管理功能

:::important 重要提示：环境变量设置
在启动后端服务之前，**必须**设置以下环境变量，否则会出现 `ModuleNotFoundError: No module named 'api'` 或 `LookupError: Resource wordnet not found` 等错误：

- `PYTHONPATH=$(pwd)`：**必需**，让 Python 能够找到 `api`、`common` 等模块
- `NLTK_DATA=$(pwd)/nltk_data`：**必需**，让 NLTK 能够找到 wordnet 等数据文件
- `HF_ENDPOINT=https://hf-mirror.com`：**可选**，如果无法访问 HuggingFace，使用镜像站点

这些环境变量需要在**每个终端窗口**中设置。
:::

1. 注释掉 **docker/entrypoint.sh** 中的 `nginx` 行：
   
   ```
   # /usr/sbin/nginx
   ```

2. 检查 **conf/service_conf.yaml** 中的配置，确保所有主机和端口都正确设置。
   
3. 在**四个终端窗口**中分别启动后端服务：

   **终端 1 - 启动任务执行器**：
   
   ```bash
   # 确保在项目根目录
   cd /Users/felix/Documents/develop/python/ragflow
   
   # 激活虚拟环境并设置环境变量
   source .venv/bin/activate
   export PYTHONPATH=$(pwd)
   export NLTK_DATA=$(pwd)/nltk_data
   export HF_ENDPOINT=https://hf-mirror.com  # 可选
   
   # 启动任务执行器
   JEMALLOC_PATH=$(pkg-config --variable=libdir jemalloc)/libjemalloc.so
   LD_PRELOAD=$JEMALLOC_PATH python rag/svr/task_executor.py 1
   ```
   
   或者使用一键命令：
   ```bash
   source .venv/bin/activate && \
   export PYTHONPATH=$(pwd) && \
   export NLTK_DATA=$(pwd)/nltk_data && \
   export HF_ENDPOINT=https://hf-mirror.com && \
   JEMALLOC_PATH=$(pkg-config --variable=libdir jemalloc)/libjemalloc.so && \
   LD_PRELOAD=$JEMALLOC_PATH python rag/svr/task_executor.py 1
   ```

   **终端 2 - 启动 API 服务器**：
   
   ```bash
   # 确保在项目根目录
   cd /Users/felix/Documents/develop/python/ragflow
   
   # 激活虚拟环境并设置环境变量
   source .venv/bin/activate
   export PYTHONPATH=$(pwd)
   export NLTK_DATA=$(pwd)/nltk_data
   export HF_ENDPOINT=https://hf-mirror.com  # 可选
   
   # 启动 API 服务器
   python api/ragflow_server.py
   ```
   
   或者使用一键命令：
   ```bash
   source .venv/bin/activate && \
   export PYTHONPATH=$(pwd) && \
   export NLTK_DATA=$(pwd)/nltk_data && \
   export HF_ENDPOINT=https://hf-mirror.com && \
   python api/ragflow_server.py
   ```

   **终端 3 - 启动数据源同步服务**：
   
   ```bash
   # 确保在项目根目录
   cd /Users/felix/Documents/develop/python/ragflow
   
   # 激活虚拟环境并设置环境变量
   source .venv/bin/activate
   export PYTHONPATH=$(pwd)
   export NLTK_DATA=$(pwd)/nltk_data
   export HF_ENDPOINT=https://hf-mirror.com  # 可选
   
   # 启动数据源同步服务
   python rag/svr/sync_data_source.py
   ```
   
   或者使用一键命令：
   ```bash
   source .venv/bin/activate && \
   export PYTHONPATH=$(pwd) && \
   export NLTK_DATA=$(pwd)/nltk_data && \
   export HF_ENDPOINT=https://hf-mirror.com && \
   python rag/svr/sync_data_source.py
   ```

   **终端 4 - 启动 Admin 服务器**：
   
   ```bash
   # 确保在项目根目录
   cd /Users/felix/Documents/develop/python/ragflow
   
   # 激活虚拟环境并设置环境变量
   source .venv/bin/activate
   export PYTHONPATH=$(pwd)
   export NLTK_DATA=$(pwd)/nltk_data
   export HF_ENDPOINT=https://hf-mirror.com  # 可选
   
   # 启动 Admin 服务器
   python admin/server/admin_server.py
   ```
   
   或者使用一键命令：
   ```bash
   source .venv/bin/activate && \
   export PYTHONPATH=$(pwd) && \
   export NLTK_DATA=$(pwd)/nltk_data && \
   python admin/server/admin_server.py
   ```

   :::tip 提示
   您应该看到类似以下的输出：
   - 任务执行器：`RAGFlow ingestion is ready after X.XXs initialization.`
   - API 服务器：将在 `http://127.0.0.1:9380` 上启动
   - 数据源同步服务：`RAGFlow data sync is ready after X.XXs initialization.`
   - Admin 服务器：将在相应的端口上启动
   :::

### 启动 RAGFlow 前端服务

:::tip 重要提示
前端已迁移到 Vite，API 代理配置已在 `vite.config.ts` 中设置。**无需修改 `.umirc.ts` 文件**（该文件已弃用）。
:::

1. 导航到 `web` 目录并安装前端依赖：

   ```bash
   cd web
   npm install
   ```

2. 启动 RAGFlow 前端服务：

   ```bash
   npm run dev
   ```

   前端服务将启动，您应该看到类似以下的输出：

   ```
   VITE v7.x.x  ready in XXXX ms
   
     ➜  Local:   http://localhost:9222/
     ➜  Network: http://192.168.x.x:9222/
   ```

### 访问 RAGFlow 服务

在 Web 浏览器中，输入 `http://127.0.0.1:<PORT>/`，确保端口号与前端服务输出中显示的端口号匹配（默认是 `9222`）。

在访问 Web 界面之前，请确保：
- 后端 API 服务器正在运行（`http://127.0.0.1:9380`）
- 前端服务正在运行（`http://localhost:9222`）

### 开发完成后停止 RAGFlow 服务

1. 停止 RAGFlow 前端服务：
   ```bash
   pkill npm
   ```
   或在运行 `npm run dev` 的终端中按 `Ctrl+C`

2. 停止 RAGFlow 后端服务：
   
   在每个运行后端服务的终端中按 `Ctrl+C`，或使用以下命令：
   ```bash
   # 停止 API 服务器
   pkill -f "ragflow_server.py"
   
   # 停止任务执行器
   pkill -f "task_executor.py"
   
   # 停止数据源同步服务
   pkill -f "sync_data_source.py"
   
   # 停止 Admin 服务器
   pkill -f "admin_server.py"
   ```

3. **可选**：停止 Docker 服务：
   ```bash
   docker compose -f docker/docker-compose-base.yml down
   ```

## 故障排除

### ModuleNotFoundError: No module named 'api'

**问题**：Python 找不到 `api` 模块。这通常发生在启动服务时没有设置 `PYTHONPATH` 环境变量。

**错误示例**：
```
ModuleNotFoundError: No module named 'api'
```

**解决方案**：
1. 确保在项目根目录（`/Users/felix/Documents/develop/python/ragflow`）
2. 在启动服务之前，设置 `PYTHONPATH` 环境变量：
   ```bash
   export PYTHONPATH=$(pwd)
   ```
3. 完整的启动命令应该是：
   ```bash
   source .venv/bin/activate
   export PYTHONPATH=$(pwd)
   export NLTK_DATA=$(pwd)/nltk_data
   python api/ragflow_server.py
   ```

**注意**：`PYTHONPATH` 必须在**每个终端窗口**中设置，因为它不会自动继承到新的终端会话中。

### LookupError: Resource wordnet not found

**问题**：NLTK 找不到 wordnet 资源。这通常发生在：
- 没有下载 NLTK 数据文件
- 没有设置 `NLTK_DATA` 环境变量指向正确的目录

**错误示例**：
```
LookupError: Resource wordnet not found.
Please use the NLTK Downloader to obtain the resource:
```

**解决方案**：
1. **下载 NLTK 数据**（如果还没有下载）：
   ```bash
   uv run download_deps.py --china-mirrors
   ```
   这将下载 wordnet、punkt、punkt_tab 等 NLTK 数据到 `./nltk_data` 目录。

2. **设置 `NLTK_DATA` 环境变量**：
   ```bash
   export NLTK_DATA=$(pwd)/nltk_data
   ```

3. **验证数据文件是否存在**：
   ```bash
   ls -la nltk_data/corpora/wordnet/
   ```
   如果文件存在，说明下载成功。

4. **重新启动服务**，确保环境变量已设置。

### ConnectionError: tiktoken BPE file download failed

**问题**：tiktoken 无法从网络下载编码文件。

**解决方案**：运行依赖下载脚本，这将本地下载所需的 tiktoken 编码文件：
```bash
uv run download_deps.py --china-mirrors
```

### 前端无法连接到后端 (ECONNREFUSED 127.0.0.1:9380)

**问题**：前端无法连接到后端 API 服务器。

**解决方案**：
1. 确保 API 服务器 (`api/ragflow_server.py`) 正在运行
2. 检查端口是否被占用：
   ```bash
   lsof -i :9380
   ```
3. 如果端口未被占用，重新启动 API 服务器

### python: command not found

**问题**：找不到 `python` 命令。

**解决方案**：确保您已激活虚拟环境：
```bash
source .venv/bin/activate
```

或使用完整路径：
```bash
.venv/bin/python api/ragflow_server.py
```

### 无法连接到 MySQL 或 Elasticsearch

**问题**：如果 `conf/service_conf.yaml` 中的端口配置与 Docker Compose 映射的端口不匹配，会出现连接错误。

**解决方案**：
1. 检查 Docker 容器的端口映射：
   ```bash
   docker compose -f docker/docker-compose-base.yml ps
   ```

2. 确认 `conf/service_conf.yaml` 中的端口配置：
   ```bash
   cat conf/service_conf.yaml | grep -A 2 "mysql:"
   cat conf/service_conf.yaml | grep -A 2 "es:"
   ```

3. 如果端口不匹配，更新 `conf/service_conf.yaml`：
   - MySQL 端口应该是 `5455`（对应 Docker 映射的 `${MYSQL_PORT}`）
   - Elasticsearch 端口应该是 `1200`（对应 Docker 映射的 `${ES_PORT}`）

**不修改的后果**：
- 如果 MySQL 端口配置错误（例如使用默认的 3306），后端服务将无法连接到数据库，会出现类似 `Can't connect to MySQL server` 的错误
- 如果 Elasticsearch 端口配置错误（例如使用默认的 9200），文档索引功能将无法工作，会出现连接超时或拒绝连接的错误
