import '../core/render-env.mjs';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill,renderMedia,openBrowser} from '@remotion/renderer';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createProject,validateProject} from '../core/project.mjs';
import {themeFromPreset} from '../core/themes.mjs';
import {MOTION_CATALOG} from '../core/motions.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'data/motion-verification');
await fs.mkdir(output,{recursive:true});
function demoScene(preset,index){
  const content={
    'cursor-click':['导入资料','核对内容','开始处理'],
    'card-spotlight':['资料入库｜整理教材、论文和讲义','知识连接｜组织彼此关联的内容','结果核验｜保留引用与来源'],
    'progress-steps':['导入资料','解析内容','构建索引','核验结果'],
    'draw-connections':['知识中心','教材','论文','讲义','问答'],
    'progress-bar':['资料解析','文本拆分','索引处理'],
    'chat-demo':['用户｜能帮我整理这些资料吗？','助手｜可以，先建立内容索引。','用户｜回答能追溯到原文吗？','助手｜可以在回答中保留引用。'],
    'chapter-card':['从一个清楚的目标出发','让复杂内容逐步清晰']
  };
  return {id:`scene-${String(index+1).padStart(2,'0')}`,type:'definition',start:index*4,end:(index+1)*4,title:preset.name,subtitle:'大肥鱼动效资源包 · 示例内容与演示数据',items:content[preset.id]||['整理信息','建立联系','看见结果'],captionIds:[],transition:'none',character:null,motion:{[preset.slot]:preset.id,...(preset.slot==='transition'?{template:'progress-steps'}:{}),...(preset.requiresData?{data:[{label:'阶段一',value:24},{label:'阶段二',value:72},{label:'阶段三',value:128}]}:{}),...(preset.id==='progress-bar'?{value:72}:{}),...(preset.slot==='background'?{intensity:.8}:{})}};
}
const project=createProject({id:'motion-showcase',title:'大肥鱼 · 动效资源验收'});
project.theme={...themeFromPreset('night'),accent:'#65b9ff',brand:'大肥鱼 · 动效资源'};
project.duration=MOTION_CATALOG.length*4;
project.scenes=MOTION_CATALOG.map(demoScene);
const validation=validateProject(project);
if(!validation.valid)throw new Error(validation.errors.join('；'));
await fs.writeFile(path.join(output,'all-presets.project.json'),JSON.stringify(project,null,2));
const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts'),publicDir:path.join(root,'public')});
const browserExecutable=process.env.FISH_BROWSER||'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browser=await openBrowser('chrome',{browserExecutable});
const props={project,assetBaseUrl:''};
const base={serveUrl,browserExecutable,puppeteerInstance:browser};
const composition=await selectComposition({...base,id:'FishVideo',inputProps:props});
try{
  for(let i=0;i<MOTION_CATALOG.length;i++){
    const preset=MOTION_CATALOG[i];
    const offset=preset.slot==='transition'?8:75;
    const frame=i*120+offset;
    await renderStill({...base,composition,inputProps:props,frame,output:path.join(output,`${preset.id}.png`),scale:.5,imageFormat:'png'});
    console.log(JSON.stringify({preset:preset.id,frame,status:'rendered'}));
  }
  // A previous/new scene blend, a settled layout, and nonconsecutive frame order.
  for(const [name,frame] of [['transition-end',16*120+30],['jump-forward',7*120+85],['jump-backward',7*120+35],['jump-repeat',7*120+85],['long-title',5*120+85]]){
    const inputProps=name==='long-title'?{...props,project:{...project,scenes:project.scenes.map((s,i)=>i===5?{...s,title:'把不同来源的资料整理起来，让复杂知识逐步变得清晰易懂'}:s)}}:props;
    const selected=name==='long-title'?await selectComposition({...base,id:'FishVideo',inputProps}):composition;
    await renderStill({...base,composition:selected,inputProps,frame,output:path.join(output,`${name}.png`),scale:.5,imageFormat:'png'});
  }
  const first=await fs.readFile(path.join(output,'jump-forward.png'));
  const repeated=await fs.readFile(path.join(output,'jump-repeat.png'));
  if(!first.equals(repeated))throw new Error('跳转后相同视频帧的像素不一致');
  for(const preset of ['cute','standard']){
    const inputProps={...props,project:{...project,theme:themeFromPreset(preset,project.theme)}};
    const selected=await selectComposition({...base,id:'FishVideo',inputProps});
    await renderStill({...base,composition:selected,inputProps,frame:7*120+85,output:path.join(output,`theme-${preset}.png`),scale:.5,imageFormat:'png'});
  }
  if(process.argv.includes('--video')){
    const ids=['draw-connections','bar-chart','progress-steps','chat-demo'];
    const demo={...project,id:'motion-preview',title:'大肥鱼 · 动效预览',duration:16,scenes:ids.map((id,index)=>{
      const scene=demoScene(MOTION_CATALOG.find(p=>p.id===id),index);
      scene.motion={...scene.motion,title:['typewriter','text-mask','marker-highlight','word-stagger'][index],background:['grid-flow','mesh-gradient','film-grain','grid-flow'][index],...(index?{transition:['slide-push','circle-wipe','card-flip'][index-1]}:{})};
      return scene;
    })};
    demo.captions=ids.map((_,i)=>({id:`cap-${i+1}`,text:'动效预览 · 画面与数值均为演示示例',startMs:i*4000,endMs:(i+1)*4000,timestampMs:null,confidence:null}));
    demo.scenes.forEach((s,i)=>{s.captionIds=[`cap-${i+1}`];});
    const checked=validateProject(demo);if(!checked.valid)throw new Error(checked.errors.join('；'));
    await fs.writeFile(path.join(output,'preview.project.json'),JSON.stringify(demo,null,2));
    const inputProps={project:demo,assetBaseUrl:''};
    const demoComposition=await selectComposition({...base,id:'FishVideo',inputProps});
    let lastProgress=-1;
    await renderMedia({...base,composition:demoComposition,inputProps,codec:'h264',outputLocation:path.join(output,'motion-pack-preview.mp4'),scale:.5,concurrency:2,crf:25,onProgress:({progress})=>{const pct=Math.floor(progress*5)*20;if(pct!==lastProgress){console.log(`video ${pct}%`);lastProgress=pct;}}});
  }
  console.log(JSON.stringify({passed:true,presets:20,deterministicSeek:true,output}));
}finally{await browser.close({silent:true});}
