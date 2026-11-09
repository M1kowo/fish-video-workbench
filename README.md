# 大肥鱼视频工作台 · 本地预览版

输入字幕与配音，由用户或外部 agent 编排讲解画面、角色和动效，预览后导出视频。

## 启动

要求 Node.js 22+、FFmpeg/ffprobe，以及 Chromium / Microsoft Edge。当前 Windows 主机已具备这些基础工具。

```powershell
cd 'E:\MCS\大肥鱼视频工作台\workbench'
npm run dev
```

打开 http://127.0.0.1:4318 。也可以运行 `start-workbench.ps1`。服务仅监听本机，文件不上传云端。

安装新副本时先执行 `npm install`。若 GIF 尚未打包，可用 `python scripts/prepare_assets.py` 从当前用户桌面的 `GIF` 目录准备素材；已经打包的副本无需 Python。

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
