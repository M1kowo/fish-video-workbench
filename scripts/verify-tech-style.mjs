import '../core/render-env.mjs';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill,renderMedia,openBrowser} from '@remotion/renderer';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createProject,validateProject} from '../core/project.mjs';
import {themeFromPreset} from '../core/themes.mjs';
import {TECH_SCENES} from '../core/tech.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'data/tech-verification');await fs.mkdir(output,{recursive:true});
const timings=[[0,5],[5,13],[13,18],[18,24],[24,30],[30,36]];
const titles=['从一个入口，展开完整系统','资料进入，知识逐步连起来','讲完就练，练完就检查','研究、可视化、阅读，逐项演示','沿着路径，找到下一步','记得住，也能继续对话'];
const project=createProject({id:'tech-effect-showcase',title:'科技风格 · 连续演示效果'});
project.theme={...themeFromPreset('tech'),brand:'大肥鱼 · 科技演示'};project.duration=36;
project.scenes=TECH_SCENES.map((preset,index)=>({id:`scene-${String(index+1).padStart(2,'0')}`,type:'definition',start:timings[index][0],end:timings[index][1],title:titles[index],subtitle:['系统展开 · 能力连接','资料输入 · 索引处理 · 图谱与引用','知识讲解 · 练习反馈','功能聚焦 · 图表联动','节点推进 · 路径调整','记忆分层 · 渠道切换'][index],items:preset.exampleItems,captionIds:[`cap-${index+1}`],transition:'slide',character:null,visual:{kind:preset.id,...(preset.answerIndex!==undefined?{answerIndex:preset.answerIndex}:{})}}));
project.captions=TECH_SCENES.map((preset,index)=>({id:`cap-${index+1}`,text:['把相关能力连接成一套清楚的工作流。','资料进入处理区，再展开图谱与回答。','通过选择、反馈和核验，展示练习过程。','跟着讲解，依次突出当前功能。','让节点和连线一起表达推进过程。','从保留上下文，到跨渠道继续对话。'][index],startMs:timings[index][0]*1000,endMs:timings[index][1]*1000,timestampMs:null,confidence:null}));
const checked=validateProject(project);if(!checked.valid)throw new Error(checked.errors.join('；'));
await fs.writeFile(path.join(output,'tech-preview.project.json'),JSON.stringify(project,null,2));
const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts'),publicDir:path.join(root,'public')});
const browserExecutable=process.env.FISH_BROWSER||'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browser=await openBrowser('chrome',{browserExecutable});
const base={serveUrl,browserExecutable,puppeteerInstance:browser},inputProps={project,assetBaseUrl:''};
const composition=await selectComposition({...base,id:'FishVideo',inputProps});
try{
  for(let i=0;i<TECH_SCENES.length;i++){
    const time=timings[i][0]+(timings[i][1]-timings[i][0])*.86;
    await renderStill({...base,composition,inputProps,frame:Math.floor(time*30),output:path.join(output,TECH_SCENES[i].id+'.png'),scale:.5,imageFormat:'png'});
    console.log(`rendered ${TECH_SCENES[i].id}`);
  }
  for(const [name,time] of [['intake-start',5.7],['intake-process',8],['intake-graph',10],['intake-answer',12],['quiz-wrong',15.5],['quiz-right',17.3],['transition-mid',13.2],['seek-repeat',12]]){
    await renderStill({...base,composition,inputProps,frame:Math.round(time*30),output:path.join(output,name+'.png'),scale:.5,imageFormat:'png'});
  }
  if(!(await fs.readFile(path.join(output,'intake-answer.png'))).equals(await fs.readFile(path.join(output,'seek-repeat.png'))))throw new Error('科技演示跳转后同帧像素不一致');
  // Also verify direct style selection on existing scene types, without native effects.
  const original={...project,scenes:project.scenes.map((s,i)=>({...s,visual:undefined,type:['opening','definition','flow','comparison','recap','definition'][i],items:i===3?['方案一｜保留原有内容','方案二｜增加视觉讲解']:s.items}))};
  const originalProps={project:original,assetBaseUrl:''};
  const originalComposition=await selectComposition({...base,id:'FishVideo',inputProps:originalProps});
  await renderStill({...base,composition:originalComposition,inputProps:originalProps,frame:45,output:path.join(output,'existing-scene.png'),scale:.5,imageFormat:'png'});
  if(process.argv.includes('--video')){
    let last=-1;
    await renderMedia({...base,composition,inputProps,codec:'h264',outputLocation:path.join(output,'tech-effects-preview.mp4'),scale:.5,concurrency:2,crf:23,onProgress:({progress})=>{const pct=Math.floor(progress*10)*10;if(pct!==last){console.log(`video ${pct}%`);last=pct;}}});
  }
  console.log(JSON.stringify({passed:true,scenes:6,deterministicSeek:true,duration:36,output}));
}finally{await browser.close({silent:true});}
