// The callable, local registry. Upstream snapshots and MIT notices live in third_party/motion/.
const sources={
  onda:{repo:'https://github.com/degueba/onda',commit:'3c814051269597b31fee1603bef7ccfb93d091b6',license:'MIT'},
  rendercomp:{repo:'https://github.com/RenderComp/free-remotion-templates',commit:'f648980e528defb7594e24c6447055f0540f340b',license:'MIT'}
};
const definitions=[
  ['text-mask','遮罩揭示','title','文字被色块扫过后显现，适合章节标题',['文字','开场'],'rendercomp','src/components/text-mask-reveal/TextMaskReveal.tsx'],
  ['typewriter','逐字输入','title','恒定速度显示标题，自动适配中文',['文字','输入'],'onda','registry/components/typewriter/Typewriter.tsx'],
  ['word-stagger','分段浮现','title','中文按短语分组，英文按单词依次上移出现',['文字','讲解'],'onda','registry/components/word-stagger/WordStagger.tsx'],
  ['marker-highlight','荧光强调','title','标题出现后从左向右铺开强调色',['文字','强调'],'onda','registry/components/highlight/Highlight.tsx'],
  ['cursor-click','光标点击','template','光标移向操作卡，点击后显示完成反馈',['界面','操作'],'onda','registry/components/cursor/Cursor.tsx',1],
  ['card-spotlight','卡片聚焦','template','内容卡依次激活，当前卡获得移动光斑和边框强调',['界面','功能介绍'],'onda','registry/components/spotlight-card/SpotlightCard.tsx',2],
  ['progress-steps','步骤推进','template','节点依次完成，连接轨道随时间填充',['流程','步骤'],'onda','registry/components/progress-steps/ProgressSteps.tsx',2],
  ['draw-connections','关系连线','template','第一项为中心，其他项为关联节点，连线逐段绘制',['关系图','知识图谱'],'onda','registry/components/draw-on/DrawOn.tsx',3],
  ['progress-bar','进度增长','template','进度从零增长至 value，展示处理或完成过程',['进度','处理'],'onda','registry/components/progress-bar/ProgressBar.tsx',1],
  ['kpi-counter','滚动数字','template','数字按固定单位滚动到提供的真实数值；必须传入 data',['数字','数据'],'rendercomp','src/components/kpi-counter/KpiCounter.tsx',0,true],
  ['bar-chart','动态柱状图','template','柱形依次增长；必须传入至少两组 data',['图表','比较'],'rendercomp','src/components/bar-chart-anim/BarChartAnim.tsx',0,true],
  ['line-chart','折线绘制','template','折线和数据点逐步出现；必须传入至少两组 data',['图表','趋势'],'rendercomp','src/components/line-chart-anim/LineChartAnim.tsx',0,true],
  ['grid-flow','流动网格','background','缓慢平移的技术网格，叠加在当前主题上',['背景','科技'],'onda','registry/components/dynamic-grid/DynamicGrid.tsx'],
  ['mesh-gradient','流动渐变','background','以当前强调色为主的缓慢移动渐变',['背景','氛围'],'onda','registry/components/mesh-gradient/MeshGradient.tsx'],
  ['film-grain','胶片颗粒','background','确定性的轻量纹理，intensity 控制强弱',['背景','质感'],'onda','registry/components/grain-overlay/GrainOverlay.tsx'],
  ['slide-push','横向推移','transition','场景开始时同时推移前后画面，保留配音和字幕时间',['转场','章节'],'rendercomp','src/components/slide-wipe/SlideWipe.tsx'],
  ['circle-wipe','圆形揭幕','transition','通过扩大的圆形窗口显露下一场景',['转场','揭晓'],'rendercomp','src/components/transition-circle-wipe/TransitionCircleWipe.tsx'],
  ['card-flip','卡片翻转','transition','前后场景作为卡片两面进行三维翻转',['转场','对比'],'rendercomp','src/components/card-flip-transition/CardFlipTransition.tsx'],
  ['chat-demo','对话演示','template','内容项作为对话消息依次出现，适合问答演示',['场景','聊天'],'rendercomp','src/components/community-chat/CommunityChat.tsx',2],
  ['chapter-card','章节标题','template','章节编号缩小落位，分隔线展开，内容项作为摘要',['场景','章节'],'rendercomp','src/components/chapter-title/ChapterTitle.tsx',0]
];

export const MOTION_CATALOG=definitions.map(([id,name,slot,description,tags,source,path,minItems=0,requiresData=false])=>({
  id,name,slot,description,tags,minItems,requiresData,
  maxItems:({'cursor-click':3,'card-spotlight':3,'progress-steps':5,'draw-connections':6,'progress-bar':3,'chat-demo':4,'chapter-card':4})[id]??6,
  maxDataItems:id==='kpi-counter'?3:6,
  maxItemLength:({'cursor-click':24,'card-spotlight':60,'progress-steps':24,'draw-connections':18,'progress-bar':24,'chat-demo':36,'chapter-card':30})[id]??100,
  maxUnitLength:['bar-chart','line-chart'].includes(id)?4:12,
  source:{...sources[source],path,url:`${sources[source].repo}/blob/${sources[source].commit}/${path}`},
  example:{motion:{[slot]:id,...(requiresData?{data:[{label:'示例 A',value:24},{label:'示例 B',value:72}]}:{})}},
  parameters:{duration:'动作持续秒数；默认按场景时长自适应',delay:'相对场景起点的延迟秒数，默认 0',stagger:'同组内容依次启动的间隔秒数；默认自适应',intensity:'背景强度 0–1，默认 0.5',...(id==='progress-bar'?{value:'目标百分比 0–100，默认 100'}:{}),...(requiresData?{data:'[{label:文本,value:非负数}]，最多 6 项，不自动虚构数据',unit:['bar-chart','line-chart'].includes(id)?'数值后缀，最多 4 字':'数值后缀，最多 12 字'}:{})}
}));

export const MOTION_SLOTS=['template','title','background','transition'];
export function getMotionPreset(id){return MOTION_CATALOG.find(p=>p.id===id);}

export function getMotionTiming(scene){
  const length=Math.max(0,scene.end-scene.start);
  return {delay:scene.motion?.delay??0,duration:scene.motion?.duration??Math.min(0.9,length*0.35),stagger:scene.motion?.stagger??Math.min(0.18,length*0.04)};
}

export function validateSceneMotion(scene){
  const errors=[];
  const m=scene.motion;
  if(m===undefined)return errors;
  const fail=message=>errors.push(`场景 ${scene.id} 动效：${message}`);
  if(!m||typeof m!=='object'||Array.isArray(m)){fail('必须是对象');return errors;}
  const allowed=[...MOTION_SLOTS,'duration','delay','stagger','intensity','data','unit','value'];
  for(const key of Object.keys(m))if(!allowed.includes(key))fail(`未知参数 ${key}`);
  for(const slot of MOTION_SLOTS){if(m[slot]!==undefined&&getMotionPreset(m[slot])?.slot!==slot)fail(`${slot} 预设不存在或类别错误：${m[slot]}`);}
  if(!MOTION_SLOTS.some(slot=>m[slot]!==undefined))fail('至少选择一个预设');
  for(const [key,min,max] of [['duration',0.05,30],['delay',0,7200],['stagger',0,10],['intensity',0,1],['value',0,100]]){
    if(m[key]!==undefined&&(!Number.isFinite(m[key])||m[key]<min||m[key]>max))fail(`${key} 必须在 ${min}–${max} 之间`);
  }
  if(m.unit!==undefined&&(typeof m.unit!=='string'||m.unit.length>12))fail('unit 最多 12 字');
  if(m.data!==undefined&&(!Array.isArray(m.data)||!m.data.length||m.data.length>6||m.data.some(d=>!d||typeof d!=='object'||typeof d.label!=='string'||!d.label.trim()||d.label.length>24||!Number.isFinite(d.value)||d.value<0||d.value>1e12)))fail('data 需要 1–6 项，每项 label 为 1–24 字，value 为 0–1000000000000');
  const preset=getMotionPreset(m.template);
  if(preset){
    const items=Array.isArray(scene.items)?scene.items:[];
    const nonempty=items.filter(t=>typeof t==='string'&&t.trim()).length;
    if(nonempty<preset.minItems)fail(`${preset.name} 至少需要 ${preset.minItems} 项非空图解内容`);
    if(nonempty>preset.maxItems)fail(`${preset.name} 最多支持 ${preset.maxItems} 项图解内容`);
    if(Array.isArray(m.data)&&m.data.length>preset.maxDataItems)fail(`${preset.name} 最多支持 ${preset.maxDataItems} 组数据`);
    const maxText=preset.maxItemLength;
    if(items.some(t=>typeof t==='string'&&t.length>maxText))fail(`${preset.name} 每项内容最多 ${maxText} 字`);
    if(typeof m.unit==='string'&&m.unit.length>preset.maxUnitLength)fail(`${preset.name} unit 最多 ${preset.maxUnitLength} 字`);
    if(preset.requiresData&&(!Array.isArray(m.data)||m.data.length<(m.template==='kpi-counter'?1:2)))fail(`${preset.name} 需要提供${m.template==='kpi-counter'?'至少一组':'至少两组'} data 数据`);
  }
  const timing=getMotionTiming(scene);
  const count=preset?.requiresData?(m.data?.length||0):m.template==='draw-connections'?Math.max(0,(scene.items?.length||0)-1):(scene.items?.length||0);
  const steps=m.template&&m.template!=='progress-bar'?Math.max(0,count-1):0;
  const titleSteps=m.title==='word-stagger'&&typeof scene.title==='string'?Math.max(0,splitMotionText(scene.title).length-1):0;
  if(timing.delay+timing.duration+timing.stagger*Math.max(steps,titleSteps)>scene.end-scene.start+0.001)fail('延迟、持续时间与分项间隔超出场景时长');
  return errors;
}

export function splitMotionText(text){
  if(/\s/.test(text.trim()))return text.split(/\s+/).filter(Boolean);
  return Array.from(text).reduce((groups,char,index)=>{if(index%4===0)groups.push('');groups[groups.length-1]+=char;return groups;},[]);
}

export function applyMotionPreset(project,sceneId,presetId,parameters={}){
  const preset=getMotionPreset(presetId);
  if(!preset)throw new Error(`未知动效预设：${presetId}`);
  if(!project.scenes.some(s=>s.id===sceneId))throw new Error(`找不到场景：${sceneId}`);
  if(!parameters||typeof parameters!=='object'||Array.isArray(parameters))throw new Error('动效参数必须为 JSON 对象');
  return {...project,scenes:project.scenes.map(s=>s.id===sceneId?{...s,motion:{...s.motion,...parameters,[preset.slot]:preset.id}}:s)};
}

// Transition progress is local to the incoming scene. No clips or narration are shortened.
export function getMotionTransition(project,frame){
  const fps=project.settings.fps;
  const firstFrame=seconds=>Math.ceil(seconds*fps-1e-7);
  const index=project.scenes.findIndex(s=>frame>=firstFrame(s.start)&&frame<firstFrame(s.end));
  if(index<=0)return null;
  const incoming=project.scenes[index],previous=project.scenes[index-1];
  if(!getMotionPreset(incoming.motion?.transition)||Math.abs(previous.end-incoming.start)>1/fps)return null;
  const elapsed=frame-firstFrame(incoming.start);
  const duration=Math.max(1,Math.round(Math.min(incoming.motion?.duration??0.7,incoming.end-incoming.start)*fps));
  if(elapsed>=duration)return null;
  return {id:incoming.motion.transition,previous,progress:elapsed/duration};
}
