# AI 动效资源包

第一批包含 20 个可调用预设。资源保存在本地，供 Agent 通过 CLI、HTTP 或直接阅读源码选择；没有新增工作台素材页面，也不需要联网加载、账号或模型密钥。

## 查询

在工作台目录执行，不启动服务也能查询：

```powershell
node cli.mjs motion-catalog
node cli.mjs motion-catalog draw-connections
node cli.mjs motion-catalog bar-chart
```

每项返回稳定 ID、中文名称、类别、用途、标签、内容数量限制、参数、最小示例和上游源码链接。`core/motions.mjs` 是唯一目录来源。

服务运行时，也支持 `GET /api/motions` 与 `GET /api/motions/:id`。

## 20 项目录

| slot | ID | 用途 |
| --- | --- | --- |
| title | text-mask | 色块扫过后揭示标题 |
| title | typewriter | 中文逐字输入 |
| title | word-stagger | 中文短语或英文单词依次浮现 |
| title | marker-highlight | 强调色在文字后铺开 |
| template | cursor-click | 光标移动、点击、完成反馈 |
| template | card-spotlight | 功能卡片依次聚焦 |
| template | progress-steps | 流程节点与连接轨道推进 |
| template | draw-connections | 中心节点与关系连线展开 |
| template | progress-bar | 处理进度增长 |
| template | kpi-counter | 数据卡片与滚动数字 |
| template | bar-chart | 柱形依次增长 |
| template | line-chart | 折线与数据点绘制 |
| background | grid-flow | 缓慢移动网格 |
| background | mesh-gradient | 流动渐变 |
| background | film-grain | 静态、确定性的胶片颗粒 |
| transition | slide-push | 前后场景横向推移 |
| transition | circle-wipe | 圆形窗口揭示新场景 |
| transition | card-flip | 场景卡片翻转 |
| template | chat-demo | 消息依次出现 |
| template | chapter-card | 章节编号缩放落位与分隔线 |

## 应用到已有工程

先读取工程与字幕，再选择合适场景。应用命令会读取最新 revision，校验后保存；发生 409 时不自动重试覆盖。

```powershell
node cli.mjs inspect <project-id>
node cli.mjs motion-apply <project-id> --scene <scene-id> --preset draw-connections
node cli.mjs motion-apply <project-id> --scene <scene-id> --preset typewriter
node cli.mjs motion-apply <project-id> --scene <scene-id> --preset grid-flow
node cli.mjs validate <project-id>
node cli.mjs frame <project-id> --time 8 --wait
```

不同 slot 可以组合，同一 slot 后一次选择替换前一次。上述三条应用命令组合为“关系图 + 逐字标题 + 动态网格”。不修改字幕、音轨、工程时长或其他场景。

需要同时修改标题、内容、参数和多个场景时，读取完整工程，直接编辑 `scene.motion` 后通过既有 `save` 命令携带 revision 保存，避免逐项提交。

```json
{
  "template": "draw-connections",
  "title": "word-stagger",
  "background": "grid-flow",
  "transition": "slide-push",
  "delay": 0.2,
  "duration": 0.9,
  "stagger": 0.15,
  "intensity": 0.5
}
```

以上对象放在 `scene.motion`。关系图的 `scene.items` 第一项是中心，后续项是关联节点；例如 `["知识中心", "教材", "论文", "讲义"]`。每项最多 18 字。没有 `motion` 的旧工程使用原渲染路径，schemaVersion 仍为 1。

## 参数与内容约定

- `duration`：单项动作持续秒数，0.05–30；默认按场景时长自适应。对转场而言，这是转场持续秒数。
- `delay`：相对场景起点的延迟秒数，默认 0。影响标题和内容，不移动配音或字幕，也不延迟场景转场。
- `stagger`：分项依次开始的间隔秒数，0–10；默认自适应。
- `intensity`：背景强度，0–1，默认 0.5。
- `value`：进度条目标百分比，0–100，默认 100。
- `data`：图表、滚动数字的显式数据，例如 `[{"label":"示例 A","value":24},{"label":"示例 B","value":72}]`。示例数字仅用于演示，实际项目必须使用有依据的真实数据。
- `unit`：数字后缀，最多 12 字。计数器固定显示 K/M/B 单位，避免增长过程中跳宽；支持非负数。
- `scene.items`：内容模板使用现有图解内容；卡片可用 `标题｜说明`，聊天可用 `角色｜消息`。具体最少、最多项数见目录。
- 数据标签最多 24 字；建议图表标签控制在 8 字以内，数字单位保持简短。计数器最多 3 组，图表最多 6 组，图表单位最多 4 字。

标题动画是视觉呈现，不代表语音逐字对齐。保留用户字幕原有时间，不推测单字或单词的发音时刻。

动作时间、分项间隔与文字长度的组合必须适合当前场景；超出时保存会报错。短场景可缩短 duration/stagger。内容模板覆盖标准图解；原有 `visual` 与角色对象保留在工程中。角色仍受标准/可爱风格的既有显示规则约束。

转场在新场景起点开始，前一场景使用其最后可见帧，新场景继续自己的时钟。音轨、字幕和总时长不缩短。第一场景与前方存在空白的场景不执行双场景转场。

## 给应用命令传参数

把参数写入 UTF-8 JSON 文件，例如 `examples/motion-chart-params.json`，然后：

```powershell
node cli.mjs motion-apply <project-id> --scene <scene-id> --preset bar-chart --file examples/motion-chart-params.json
```

模板之外的可选 slot 可一起放入参数文件。不要拼接未经检查的 shell JSON；文件方式能保留中文和换行。

## 来源与适配范围

- Onda：`https://github.com/degueba/onda`，固定版本 `3c814051269597b31fee1603bef7ccfb93d091b6`。
- RenderComp：`https://github.com/RenderComp/free-remotion-templates`，固定版本 `f648980e528defb7594e24c6447055f0540f340b`。

20 项分别保留了上游原文件、MIT 许可证和 SHA-256，见 `third_party/motion/manifest.json`。运行时代码位于 `src/motion/`，是针对当前工作台的适配版本，并非原库全部组件的安装。

适配包括中文字体、统一主题、字幕安全区、秒数参数、稳定 ID、显式数据、从任意帧求值，以及使用真实场景内容替换转场样例。上游官网、品牌、外部字体、图片和音频未作为新资产引入；不需要额外 npm 依赖。

## 验收与维护

```powershell
npm.cmd run check
npm.cmd run build
node scripts/verify-motion-pack.mjs --video
node tests/motion-integration.mjs
```

渲染验收使用本机 Edge，也可通过 `FISH_BROWSER` 指定浏览器。`verify-motion-pack` 在 `data/motion-verification/` 写入 20 项关键帧、跳转一致性检查、演示工程 JSON 和 16 秒 MP4，演示项目不会自动加入工程列表。API 集成检查需要本地服务运行，会建立独立的 `[动效验收]` 测试工程，验证 CLI 应用、保存、冲突拒绝及带音轨视频导出。

增加新资源时，先核对来源许可证并保留固定版本，添加目录、渲染实现、参数校验、调用示例，最后检查关键帧与导出。不要仅复制文件后把尚不可渲染的资源标为可用。
