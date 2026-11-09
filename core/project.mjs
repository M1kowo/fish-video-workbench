export const SCENE_TYPES = ['opening', 'definition', 'flow', 'comparison', 'recap'];
export const DEFAULT_THEME = {name:'雾紫讲解',accent:'#7962df',background:'mist',captionStyle:'clean',fontFamily:'Microsoft YaHei',brand:'大肥鱼知识局'};
export const DEFAULT_SETTINGS = {width:1920,height:1080,fps:30};
export const timecode = (seconds) => `${Math.floor(seconds/60).toString().padStart(2,'0')}:${Math.floor(seconds%60).toString().padStart(2,'0')}`;

function timestamp(value) {
  const parts=value.replace(',','.').split(':').map(Number);
  if(parts.some(n=>!Number.isFinite(n)) || parts.length<2 || parts.length>3) throw new Error(`无法识别字幕时间：${value}`);
  return parts.reduce((a,b)=>a*60+b,0)*1000;
}

export function parseSubtitles(input) {
  if(typeof input!=='string' || !input.trim()) throw new Error('字幕文件为空');
  const lines=input.replace(/^\uFEFF/,'').replace(/\r/g,'').split('\n');
  const captions=[];
  for(let i=0;i<lines.length;i++) {
    const match=lines[i].match(/^\s*((?:\d+:)?\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*((?:\d+:)?\d{2}:\d{2}[,.]\d{1,3})/);
    if(!match) continue;
    const startMs=timestamp(match[1]),endMs=timestamp(match[2]);
    const text=[];
    for(i++;i<lines.length && lines[i].trim();i++) text.push(lines[i]);
    const clean=text.join(' ').replace(/<[^>]*>/g,'').trim();
    if(endMs<=startMs) throw new Error(`第 ${captions.length+1} 条字幕结束时间必须晚于开始时间`);
    if(clean) captions.push({id:`cap-${String(captions.length+1).padStart(3,'0')}`,text:clean,startMs,endMs,timestampMs:null,confidence:null});
  }
  if(!captions.length) throw new Error('没有找到有效字幕，请使用 UTF-8 编码的 SRT 或 VTT 文件');
  return captions.sort((a,b)=>a.startMs-b.startMs);
}

export function createProject({title='未命名视频',captions=[],audio=null,id='project',catalog=[]}={}) {
  const duration=Math.max(1,audio?.duration || (captions.at(-1)?.endMs || 30000)/1000);
  return {schemaVersion:1,id,title,revision:0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),settings:{...DEFAULT_SETTINGS},theme:{...DEFAULT_THEME},audio,duration,captions,scenes:[],catalog};
}

// A transparent, deterministic starting draft. Creative planning belongs to the caller/agent.
export function draftStoryboard(project) {
  const groups=[];
  let group=[];
  for(const cap of project.captions) {
    if(group.length && (cap.endMs-group[0].startMs>10000 || group.length>=3)) {groups.push(group);group=[];}
    group.push(cap);
  }
  if(group.length) groups.push(group);
  if(!groups.length) throw new Error('请先导入字幕');
  return groups.map((caps,i)=>{
    const text=caps.map(c=>c.text).join('');
    const type=i===0?'opening':i===groups.length-1?'recap':/区别|不同|一个.*一个|对比|而另/.test(text)?'comparison':/步骤|首先|然后|最后|任务|流程/.test(text)?'flow':'definition';
    const start=i===0?0:caps[0].startMs/1000;
    const end=i<groups.length-1?groups[i+1][0].startMs/1000:project.duration;
    const asset=/失败|抓狂|不会|错误|问题|不知/.test(text)?'gaming_frustration':/答案|结果|发现|成果/.test(text)?'box_surprise':/等待|轻松|最后/.test(text)?'swing':'lean_forward';
    return {id:`scene-${String(i+1).padStart(3,'0')}`,type,start,end,title:caps[0].text.replace(/[，。！？!?].*$/,'').slice(0,28),subtitle:i===0?'从一个问题开始':'把概念讲清楚',items:type==='flow'?['理解目标','拆解步骤','执行与检查']:type==='comparison'?['概念一','概念二']:caps.slice(0,3).map(c=>c.text.slice(0,36)),captionIds:caps.map(c=>c.id),transition:'fade',character:{assetId:asset,position:'right',height:220,delay:0.5,duration:Math.min(5,Math.max(0.5,end-start-0.5))}};
  });
}

export function validateProject(p) {
  const errors=[],warnings=[];
  if(!p || typeof p!=='object') return {valid:false,errors:['工程必须是 JSON 对象'],warnings};
  if(p.schemaVersion!==1) errors.push('不支持的工程版本');
  if(typeof p.title!=='string' || !p.title.trim()) errors.push('项目名称不能为空');
  if(!Number.isFinite(p.duration)||p.duration<=0||p.duration>7200) errors.push('时长必须在 0–7200 秒之间');
  if(!p.settings || ![24,25,30,60].includes(p.settings.fps) || p.settings.width!==1920 || p.settings.height!==1080) errors.push('首版支持 1920×1080，帧率为 24、25、30 或 60');
  if(!p.theme || !/^#[\da-f]{6}$/i.test(p.theme.accent||'')) errors.push('强调色必须是六位 HEX 颜色');
  if(!['clean','neon','minimal'].includes(p.theme?.captionStyle)) errors.push('未知字幕样式');
  if(!['mist','grid','dark'].includes(p.theme?.background)) errors.push('未知背景样式');
  if(!Array.isArray(p.captions)||!Array.isArray(p.scenes)||!Array.isArray(p.catalog)) return {valid:false,errors:[...errors,'缺少字幕、场景或素材数组'],warnings};
  const ids=new Set();
  const assetIds=new Set(p.catalog.map(a=>a.id));
  const captionIds=new Set();
  for(let i=0;i<p.captions.length;i++) {
    const c=p.captions[i];
    if(!c.id || captionIds.has(c.id)) errors.push(`字幕 ID 重复或缺失：${c.id}`);
    captionIds.add(c.id);
    if(typeof c.text!=='string'||!c.text.trim()||!Number.isFinite(c.startMs)||!Number.isFinite(c.endMs)||c.startMs<0||c.endMs<=c.startMs) errors.push(`字幕 ${c.id} 的内容或时间无效`);
    if(c.endMs>p.duration*1000+100) errors.push(`字幕 ${c.id} 超出音轨/工程时长`);
    if(i && c.startMs<p.captions[i-1].startMs) errors.push('字幕必须按开始时间排序');
    if(i && c.startMs<p.captions[i-1].endMs) warnings.push(`字幕 ${c.id} 与上一条重叠，预览优先显示较早的一条`);
    if(c.text?.length>38) warnings.push(`字幕 ${c.id} 超过 38 字，建议分句`);
  }
  if(!p.audio) warnings.push('当前没有配音：可以预览，也可以导出无声视频');
  if(!p.scenes.length) warnings.push('还没有场景，请生成分镜草稿或由 agent 写入分镜');
  let previousEnd=0;
  for(const s of p.scenes) {
    if(!s.id||ids.has(s.id)) errors.push(`场景 ID 重复或缺失：${s.id}`);ids.add(s.id);
    if(!SCENE_TYPES.includes(s.type)) errors.push(`场景 ${s.id} 类型无效`);
    if(!Number.isFinite(s.start)||!Number.isFinite(s.end)||s.start<0||s.end<=s.start||s.end>p.duration+0.05) errors.push(`场景 ${s.id} 时间越界`);
    if(s.start<previousEnd-0.001) errors.push(`场景 ${s.id} 与上一场景重叠或顺序不正确`);
    if(s.start>previousEnd+0.05) warnings.push(`场景 ${s.id} 之前存在空白，画面将延续上一场景`);
    previousEnd=s.end;
    if(typeof s.title!=='string'||!s.title.trim()||s.title.length>56) errors.push(`场景 ${s.id} 标题不能为空且最多 56 字`);
    if(!Array.isArray(s.items)||s.items.length>6||s.items.some(t=>typeof t!=='string'||t.length>100)) errors.push(`场景 ${s.id} 最多 6 个内容项，每项最多 100 字`);
    if(s.type==='comparison'&&s.items?.length!==2) warnings.push(`场景 ${s.id} 的对比建议使用 2 项内容`);
    if(!['fade','slide','none'].includes(s.transition)) errors.push(`场景 ${s.id} 转场无效`);
    if(!Array.isArray(s.captionIds)||s.captionIds.some(id=>!captionIds.has(id))) errors.push(`场景 ${s.id} 引用了不存在的字幕`);
    if(s.character) {
      const c=s.character;
      if(!assetIds.has(c.assetId)) errors.push(`角色素材不存在：${c.assetId}`);
      if(!['left','right'].includes(c.position)||!Number.isFinite(c.height)||c.height<100||c.height>350||!Number.isFinite(c.delay)||c.delay<0||!Number.isFinite(c.duration)||c.duration<=0||c.delay+c.duration>s.end-s.start+0.05) errors.push(`场景 ${s.id} 的角色位置、尺寸或出场时间无效`);
    }
  }
  if(p.scenes.length&&previousEnd<p.duration-0.1) warnings.push('最后一个场景未覆盖片尾，画面将延续');
  return {valid:errors.length===0,errors,warnings};
}

export function demoProject(catalog=[]) {
  const captions=parseSubtitles(`1\n00:00:00,000 --> 00:00:03,500\n装了一堆工具，为什么还是不会用？\n\n2\n00:00:03,500 --> 00:00:07,000\n先把概念理顺，事情就简单了。\n\n3\n00:00:07,000 --> 00:00:10,500\n你给 agent 一个目标。\n\n4\n00:00:10,500 --> 00:00:14,000\n它会拆解任务、调用工具，再检查结果。\n\n5\n00:00:14,000 --> 00:00:17,500\nSkill 像一份菜谱，告诉它怎么做。\n\n6\n00:00:17,500 --> 00:00:21,000\n工具像锅和刀，提供实际操作能力。\n\n7\n00:00:21,000 --> 00:00:24,500\n把方法和工具组合起来。\n\n8\n00:00:24,500 --> 00:00:28,000\n从一个清楚的目标，走向一个可检查的结果。`);
  const p=createProject({id:'demo',title:'从目标到结果：认识 Agent',captions,catalog});
  p.demo=true;
  p.scenes=[
    {id:'scene-001',type:'opening',start:0,end:7,title:'工具装了很多，\n为什么还是不会用？',subtitle:'从一个小问题开始',items:[],captionIds:['cap-001','cap-002'],transition:'fade',character:{assetId:'gaming_frustration',position:'right',height:310,delay:0.4,duration:6}},
    {id:'scene-002',type:'flow',start:7,end:14,title:'给出目标，一步步完成。',subtitle:'认识 AGENT',items:['拆解任务','调用工具','检查结果'],captionIds:['cap-003','cap-004'],transition:'slide',character:{assetId:'lean_forward',position:'right',height:215,delay:1,duration:5.4}},
    {id:'scene-003',type:'comparison',start:14,end:21,title:'一份菜谱，一套厨具。',subtitle:'用熟悉的事情，解释新概念',items:['Skill｜告诉你怎么做','工具｜提供实际操作能力'],captionIds:['cap-005','cap-006'],transition:'fade',character:{assetId:'box_surprise',position:'left',height:210,delay:1,duration:5.7}},
    {id:'scene-004',type:'recap',start:21,end:28,title:'清楚的目标，可检查的结果。',subtitle:'把概念连起来',items:['目标','方法 + 工具','结果'],captionIds:['cap-007','cap-008'],transition:'fade',character:{assetId:'swing',position:'right',height:215,delay:0.5,duration:6}}
  ];
  return p;
}
