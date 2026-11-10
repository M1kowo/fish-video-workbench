# 大肥鱼视频工作台 · 本地预览版

输入字幕与配音，由用户或外部 agent 编排讲解画面、角色和动效，预览后导出视频。

## 新电脑安装与启动（Windows）

克隆仓库只会取得项目文件，不会安装运行环境。需要：

- 完整的 Node.js 与 npm。推荐 Node 22 的近期维护版本（至少 22.13）或 Node 24；已有版本是否兼容以 `package.json` 的 `engines.node` 为准。只有 `node.exe`、没有 npm 的应用内置运行时不够用。
- FFmpeg，包含可在 PATH 中调用的 `ffmpeg.exe` 和 `ffprobe.exe`。导入音频时会调用 ffprobe。
- Microsoft Edge 或其他 Chromium 浏览器。导出前需要检查浏览器实际路径，必要时设置 `FISH_BROWSER`。
- Git 用于克隆和后续更新；也可以从 GitHub 下载源码 ZIP。

以安装到 `D:\大肥鱼视频工作台\workbench` 为例；也可以选择其他目录。克隆后应在**包含 `package.json` 的目录**执行命令，不需要再创建一层 workbench。

```powershell
New-Item -ItemType Directory -Force 'D:\大肥鱼视频工作台' | Out-Null
git clone --depth 1 https://github.com/M1kowo/fish-video-workbench.git 'D:\大肥鱼视频工作台\workbench'
Set-Location -LiteralPath 'D:\大肥鱼视频工作台\workbench'

node -v
npm.cmd -v
ffmpeg -version
ffprobe -version
npm.cmd ci
# 上一步成功后再启动
npm.cmd run dev
```

打开 http://127.0.0.1:4318 。在另一个 PowerShell 窗口运行 `Invoke-RestMethod http://127.0.0.1:4318/api/health`，应返回 `ok: true`。工程列表可以为空，新副本不会自动创建示例工程。首次完整验收还应检查音频导入及短视频导出。

前台运行 `npm.cmd run dev` 时，在该窗口按 Ctrl+C 停止服务。已有环境也可以运行 `powershell -NoProfile -ExecutionPolicy Bypass -File .\start-workbench.ps1`；这个脚本会后台启动服务，关闭浏览器或启动脚本窗口不会停止后台服务。它默认检查 4318 端口；使用自定义端口时请在已设置环境变量的终端中直接运行 `npm.cmd run dev`。

### 下载或安装卡住

- Node 官方入口：[nodejs.org/en/download](https://nodejs.org/en/download)。选择对应 Windows 架构的完整 MSI 或 ZIP 包。winget 下载卡住时切换直连下载或作者提供的离线包；更换包管理器仍可能下载同一个地址。不要卸载应用自带的 Node 来修复项目。
- Node ZIP 解压后，找到同时包含 `node.exe`、`npm.cmd`、`node_modules\npm` 的目录；把该目录放在当前进程 PATH 前面。下载链接对应的校验文件可用于 SHA-256 校验。
- FFmpeg Windows 构建：[Gyan 下载页](https://www.gyan.dev/ffmpeg/builds/)。ZIP 通常带版本号顶层目录，实际 PATH 必须指向同时包含 `ffmpeg.exe` 和 `ffprobe.exe` 的 `bin`，不要假设直接解压就得到 `C:\ffmpeg\bin`。
- 可把便携工具放在仓库之外，例如 `D:\大肥鱼视频工作台\tools`。每次启动服务都应继承相同 PATH；安装后也要在当前终端重新验证实际命令路径，必要时重启终端或 Codex。
- `npm.cmd` 可以避免 PowerShell 优先匹配 `npm.ps1` 造成的执行策略问题。`npm ci` 按仓库 lockfile 安装；失败时先看完整日志，不要自动改成 `npm install`、删 lockfile 或升级依赖。npm registry 的切换只针对依赖下载，不能解决 Node 安装包下载失败。
- 下载持续 60 秒为 0 字节或连续 120 秒无进展时，停止本次下载并切换方案；有持续进展的大文件下载可继续。全部可用方案失败时，向作者索取离线包并说明需要的版本和架构。

完整的可转发安装提示词见 [Windows 环境配置提示词](docs/windows-setup-prompt.md)，支持从中断的位置继续安装。

服务仅监听本机；正常工作流程中的字幕、配音、工程和视频文件保存在本机。安装依赖和下载工具需要联网。仓库已包含角色素材，无需 Python；仅在需要重新整理桌面 GIF 时才使用 `python scripts/prepare_assets.py`。

## 当前可用

- 导入 UTF-8 SRT / VTT，支持 MP3 / WAV / M4A / AAC / OGG / FLAC / 含音轨的 MP4。
- 配音决定工程时长；检测字幕越界、时间重叠、无效素材与场景结构。
- 规则分镜草稿：按时间与关键词分组，明确标记为规则草稿；不调用大模型。
- 5 种参数化场景：开场、定义、流程、双栏对比、总结。
- 编辑标题、图解内容、场景时间、转场、字幕、背景与强调色。
- 视频风格：标准（第一版画面，隐藏全部 GIF）与可爱（第二版蓝白纸感与角色效果）。工程标题旁可直接切换，也可在“风格设置”中选择；切换后保存即可用于导出。
- 标准风格仅隐藏角色，保留已编排的 GIF 动作与时间；切回可爱可恢复。可爱风格中可继续调整纸感颗粒、投影、字体和封面角色。
- 5 个透明角色 GIF；统一可见范围与锚点；按时间轴确定性播放。
- 实时 Remotion 预览、时间轴定位、当前帧导出。
- 异步 MP4 导出：1920×1080 正式版，960×540 快速版。
- 持久化工程与渲染任务，保存时检查版本，服务重启后标记被中断的任务。
- CLI 与 HTTP API，可供不同外部 agent 使用。

示例工程没有配音，仅用于预览视觉与编辑流程。导入真实字幕和音频即可建立自己的工程。

## 推荐操作

1. 点击“导入素材”，选择字幕与配音。
2. 生成规则草稿后编辑，或让外部 agent 写入更合适的分镜。
3. 点击场景、字幕或时间轴，检查对应画面。
4. 保存工程，导出当前帧或视频。
5. 在“渲染任务”查看进度、结果或错误。

## Agent CLI

保持服务运行，在工作台目录执行。所有结果与错误均输出 JSON，失败返回非零退出码。

```powershell
node cli.mjs list
node cli.mjs catalog
node cli.mjs import --subtitles input.srt --audio voice.mp3 --title '我的视频'
node cli.mjs inspect <project-id>
node cli.mjs draft <project-id>
node cli.mjs save <project-id> --file project.json
node cli.mjs validate <project-id>
node cli.mjs frame <project-id> --time 8 --wait
node cli.mjs render <project-id> --quality preview --wait
node cli.mjs render <project-id> --wait
node cli.mjs jobs
node cli.mjs job <job-id>
```

`inspect` 返回完整工程，包含 `revision`。修改并保存时必须保留该版本号；若其他 agent 已保存，服务返回 409，重新读取并合并后再保存。

规则草稿只是起点。外部 agent 应阅读字幕、按意思分组、选择图解、提炼标题、合理安排角色，而不是每条字幕机械对应一个场景。

## HTTP API

默认基地址 `http://127.0.0.1:4318`。

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/api/health` | 服务状态 |
| GET | `/api/catalog` | 角色目录 |
| GET | `/api/projects` | 工程列表 |
| POST | `/api/projects/demo` | 建立一个示例工程 |
| POST | `/api/projects/import` | multipart：subtitles 必填，audio 与 title 可选 |
| GET | `/api/projects/:id` | 读取完整工程 |
| PUT | `/api/projects/:id` | 写入完整工程，必须携带 revision |
| POST | `/api/projects/:id/draft` | `{revision}`，生成规则草稿 |
| GET | `/api/projects/:id/validate` | 工程检查 |
| POST | `/api/projects/:id/render` | `{revision, kind:"video"或"frame", quality:"full"或"preview", time:8}` |
| GET | `/api/jobs` | 渲染队列 |
| GET | `/api/jobs/:id` | 状态、进度、输出地址与错误 |

输出地址 `outputUrl` 相对于上述基地址。渲染任务使用提交时的工程快照；后续修改不会改变正在导出的内容。

## 数据与源码

```text
core/project.mjs          字幕导入、规则分镜与工程检查
src/Video.tsx             预览与导出共用的场景渲染器
src/App.tsx               工作台界面
server.mjs               本地接口、工程保存、渲染队列
cli.mjs                  agent 命令行入口
public/characters/       已打包的角色 GIF、缩略图与目录
public/uploads/          导入的音频
data/projects/           持久化工程 JSON
data/jobs/               任务状态
data/renders/            导出的 PNG / MP4
```

帧级时钟统一驱动画面、字幕和 GIF。场景时间使用秒，字幕使用毫秒；所有区间均为开始包含、结束不包含。

`npm run studio` 可打开底层 Remotion Studio。主要编辑入口是工作台的 JSON 工程，生成的场景由同一个源模板控制。

`FISH_PORT` 可更改服务端口，`FISH_BROWSER` 可指定其他 Chromium 可执行文件路径。首版渲染默认使用 Windows Microsoft Edge。

## 验证

```powershell
npm run check
npm run build
```

核心测试覆盖 SRT/VTT、音轨时长、短场景、场景重叠与素材引用。

## 首版范围

这是单机、单用户工作台，可供多个本机 agent 通过版本检查协作。尚未提供内置大模型、自动转写/强制对齐、MCP 封装、云端访问或通用拖拽剪辑器。输入字幕需已与音频对齐。GIF 标签为编辑建议。

独特视觉可以通过扩展 `src/Video.tsx` 添加。首版不执行用户上传的任意脚本。
