import {themeFromPreset,getVideoStyle} from './themes.mjs';

export const TECH_SCENES=[
  {id:'system-map',name:'系统展开',description:'左侧划线排除，右侧系统节点逐步展开，光标引导重点',minItems:2,maxItems:6,maxItemLength:24,beats:['排除单一入口','展开系统','连接能力','聚焦重点'],exampleItems:['单一问答','资料输入','知识组织','练习反馈','长期记忆']},
  {id:'knowledge-intake',name:'资料入库与图谱',description:'三份资料沿路径进入处理区，进度增长，知识图谱连线展开，回答与引用出现',minItems:4,maxItems:4,maxItemLength:80,beats:['导入资料','整理索引','生成图谱','回答与引用'],exampleItems:['教材 · 线性代数','论文 · 检索增强','讲义 · 知识组织','基于导入资料整理回答，并保留引用。']},
  {id:'quiz-feedback',name:'练习与反馈',description:'讲解区与习题区，光标选择选项，错误标红、正确答案标绿；需要 answerIndex',minItems:3,maxItems:6,maxItemLength:48,beats:['展示问题','选择作答','错误反馈','正确反馈'],exampleItems:['哪种做法便于检查结果？','直接相信输出','核对资料与来源','只看界面效果'],answerIndex:1},
  {id:'capability-showcase',name:'多功能联动',description:'功能卡逐项聚焦，曲线绘制、滑块移动、文档高亮按时间变化',minItems:2,maxItems:3,maxItemLength:60,beats:['功能入场','聚焦第一项','聚焦第二项','聚焦第三项'],exampleItems:['深入研究｜定位资料与引用','可视化｜观察数据与趋势','沉浸阅读｜聚焦重要段落']},
  {id:'learning-path',name:'路径规划',description:'曲线依次绘制、节点完成、当前节点脉冲与路径更新',minItems:2,maxItems:6,maxItemLength:18,beats:['展开路径','推进节点','调整路线','展示进度'],exampleItems:['基础','理解','练习','应用','进阶']},
  {id:'channel-memory',name:'记忆与渠道',description:'记忆分层激活、开关切换、渠道标签切换和消息依次出现',minItems:4,maxItems:6,maxItemLength:20,beats:['激活记忆','接入渠道','切换渠道','继续对话'],exampleItems:['轨迹','摘要','综合','网页','聊天渠道']}
];
export const getTechScene=id=>TECH_SCENES.find(s=>s.id===id);
export const isTechTheme=theme=>getVideoStyle(theme)==='tech';

// Every state is calculated directly from the video time; no playback history.
export function techBeat(scene,time,index,count=4){
  const duration=scene.end-scene.start;
  const events=scene.visual?.events;
  const at=i=>events?.length?events[Math.min(i,events.length-1)].at:scene.start+duration*.76*i/count;
  const start=at(index),end=index<count-1?at(index+1):Math.max(start+.01,scene.start+duration*.92);
  return Math.max(0,Math.min(1,(time-start)/Math.max(.001,end-start)));
}
export function validateTechScene(scene){
  const preset=getTechScene(scene.visual?.kind);
  if(!preset)return [];
  const errors=[],fail=text=>errors.push(`场景 ${scene.id} 科技演示：${text}`);
  const items=Array.isArray(scene.items)?scene.items:[];
  if(items.length<preset.minItems||items.length>preset.maxItems||items.some(t=>typeof t!=='string'||!t.trim()||t.length>preset.maxItemLength))fail(`${preset.name} 需要 ${preset.minItems}–${preset.maxItems} 项非空内容，每项最多 ${preset.maxItemLength} 字`);
  if(preset.id==='knowledge-intake'&&items.slice(0,3).some(t=>typeof t==='string'&&t.length>22))fail('前三项是资料名称，各最多 22 字；第四项为回答内容');
  if(preset.id==='quiz-feedback'&&(!Number.isInteger(scene.visual.answerIndex)||scene.visual.answerIndex<0||scene.visual.answerIndex>=items.length-1))fail('answerIndex 必须明确指向一个正确选项（从 0 开始）');
  if(preset.id==='quiz-feedback'&&items.slice(1).some(t=>typeof t==='string'&&t.length>30))fail('选项各最多 30 字，问题最多 48 字');
  const events=scene.visual.events;
  if(events!==undefined&&(!Array.isArray(events)||(events.length!==0&&events.length!==preset.beats.length)||events.some((e,i)=>!e||!Number.isFinite(e.at)||e.at<scene.start||e.at>=scene.end||typeof e.label!=='string'||e.label.length>40||(i>0&&e.at<=events[i-1].at))))fail('events 为空或为四个严格递增的绝对时间点，必须位于场景内并带 label');
  return errors;
}
export function applyTechScene(project,sceneId,id,parameters={}){
  const preset=getTechScene(id);
  if(!preset)throw new Error(`未知科技演示：${id}`);
  if(!project.scenes.some(s=>s.id===sceneId))throw new Error(`找不到场景：${sceneId}`);
  if(!parameters||typeof parameters!=='object'||Array.isArray(parameters)||Object.keys(parameters).some(k=>!['events','answerIndex'].includes(k)))throw new Error('科技演示参数仅支持 events、answerIndex');
  return {...project,theme:themeFromPreset('tech',project.theme),scenes:project.scenes.map(s=>s.id===sceneId?{...s,visual:{kind:id,...parameters}}:s)};
}
export function getTechTransition(project,frame){
  if(!isTechTheme(project.theme))return null;
  const fps=project.settings.fps;
  const index=project.scenes.findIndex(s=>frame/fps>=s.start&&frame/fps<s.end);
  if(index<=0)return null;
  const scene=project.scenes[index],previous=project.scenes[index-1];
  if(scene.transition==='none'||scene.motion?.transition||Math.abs(scene.start-previous.end)>1/fps)return null;
  const elapsed=frame-Math.ceil(scene.start*fps-1e-7),duration=Math.max(1,Math.round(Math.min(.55,(scene.end-scene.start)*.2)*fps));
  return elapsed<duration?{id:'slide-push',previous,progress:elapsed/duration}:null;
}
