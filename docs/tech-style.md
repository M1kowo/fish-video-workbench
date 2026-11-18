# 科技风格与连续演示

参考用户提供的 DeepTutor 视频，实现第三个可选风格 `tech`：深色背景、蓝色细线、分层面板、白色章节标题、章节序号、青色字幕，以及随讲解推进的连续演示。

这是可编辑的程序动画。演示不代表实际调用了知识库、学习系统或聊天渠道；示例不附原视频配音，也没有复制其品牌与产品界面。

## 使用入口

- 工程标题旁的「视频风格」选择「科技」。
- 「风格设置」中也可以选择「科技」。
- 场景检查器增加「科技演示效果」，可选六类连续演示，或保留「按原分镜自动演示」。
- 切换风格保留字幕、音轨、分镜及角色编排；科技风不显示角色 GIF。切回可爱可恢复原角色。
- 标准五类场景直接切换科技风后会使用相同的面板、章节包装、顺序入场、重点切换和章节推移。六类专用演示需要填写对应内容。

## 六类专用效果

| ID | 效果 | scene.items 内容 |
| --- | --- | --- |
| system-map | 左侧划线、右侧节点展开、连线绘制、光标聚焦 | 第一项为单一入口，后续为关联能力；2–6 项，每项最多 24 字 |
| knowledge-intake | 三份资料沿路径飞入，处理模块依次激活，进度增长，图谱生成，回答及引用出现 | 恰好 4 项：前三项是资料名，各最多 22 字；第四项为回答内容，最多 80 字 |
| quiz-feedback | 问题与选项出现，光标选择，错误标红，正确答案标绿 | 第一项为问题，后续为选项；总共 3–6 项；问题最多 48 字，选项最多 30 字 |
| capability-showcase | 卡片逐项聚焦、图谱与曲线绘制、滑块移动、文档段落高亮 | 2–3 项 `标题｜说明`，每项最多 60 字 |
| learning-path | 路径描绘、节点推进、当前节点脉冲、路线更新与进度联动 | 2–6 个节点，每项最多 18 字 |
| channel-memory | 记忆分层点亮、开关滑动、渠道切换、消息出现 | 前三项为记忆层级，后续为 1–3 个渠道；总共 4–6 项，每项最多 20 字 |

专用效果在 `scene.visual.kind` 中选择，优先于 `scene.motion.template`；已接入的 20 项动效仍可独立使用。科技风章节标题、背景和字幕作为统一包装。`motion.title` 可以继续指定标题动画。

## AI 查询与调用

```powershell
node cli.mjs tech-catalog
node cli.mjs tech-catalog knowledge-intake
node cli.mjs inspect <project-id>
node cli.mjs tech-apply <project-id> --scene <scene-id> --preset knowledge-intake
node cli.mjs validate <project-id>
node cli.mjs frame <project-id> --time 8 --wait
```

先修改场景内容以满足目录说明，再应用效果；也可以在完整工程中同时写入内容和 visual，携带所读取的 revision 保存。`tech-apply` 会选择科技主题，并保留其他场景、音轨和字幕。

HTTP 查询：`GET /api/tech-scenes`、`GET /api/tech-scenes/:id`。

## 按配音安排动作

每类演示有四个动作节点。默认相对场景时长自动分配，结尾留出阅读时间。要精确跟随讲解，提供四个绝对秒数的事件，时间必须递增且位于场景内。例如一个从 5 秒开始、13 秒结束的场景：

```json
{
  "kind": "knowledge-intake",
  "events": [
    {"at": 5.0, "label": "资料进入"},
    {"at": 7.0, "label": "处理索引"},
    {"at": 9.0, "label": "生成图谱"},
    {"at": 11.0, "label": "回答与引用"}
  ]
}
```

这里的事件决定动作开始时间；与下一节点之间平滑推进。旁白和字幕保持原有时间，不估算单字发音。所有动画按视频帧求值，前后跳转不会改变结果。

题目演示必须显式填写 `visual.answerIndex`，从选项 0 开始计数，不包含问题那一项。AI 不得猜测正确答案；在检查器中也可以选择「正确选项」。

科技风默认在场景起点使用横向章节推移，同时保留原音轨和总时长。场景原有 `transition:'none'` 会保持直接切换；显式的 `motion.transition` 优先。前场景使用其最后可见帧。

## 本地验收

```powershell
npm.cmd run check
npm.cmd run build
node scripts/verify-tech-style.mjs --video
node scripts/verify-tech-ui.mjs
node tests/motion-integration.mjs --tech --cleanup
```

样片和检查图片位于 `data/tech-verification/`。工作台中的独立示例工程名为「科技风格 · 连续演示示例」。新副本先运行 `verify-tech-style` 生成演示数据并启动本地服务，UI 回归脚本在缺少本地示例 ID 时会通过 API 建立专用示例。它仅切换和保存这个专用示例，不操作用户原工程。

渲染器临时文件默认放在项目的 `data/render-temp/`，避免系统盘空间影响导出；可设置 `FISH_RENDER_TEMP` 改用其他目录。这只影响本地 Node 进程及子进程，不修改 Windows 全局环境变量。开发服务忽略临时渲染目录，导出过程不会触发页面重新加载。
