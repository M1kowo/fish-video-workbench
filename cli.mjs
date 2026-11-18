#!/usr/bin/env node
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {MOTION_CATALOG,getMotionPreset,applyMotionPreset} from './core/motions.mjs';
import {validateProject} from './core/project.mjs';
import {TECH_SCENES,getTechScene,applyTechScene} from './core/tech.mjs';
const {positionals,values}=parseArgs({allowPositionals:true,options:{base:{type:'string',default:'http://127.0.0.1:4318'},subtitles:{type:'string'},audio:{type:'string'},title:{type:'string'},file:{type:'string'},scene:{type:'string'},preset:{type:'string'},revision:{type:'string'},time:{type:'string'},quality:{type:'string'},wait:{type:'boolean'}}});
const [command,id]=positionals;
const base=values.base.replace(/\/$/,'');
async function api(route,options={}){const r=await fetch(base+route,options);const result=await r.json();if(!r.ok)throw new Error(result.error||r.statusText);return result;}
const json=data=>({headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
try{
  let result;
  if(command==='tech-catalog'){
    result=id?getTechScene(id):TECH_SCENES;
    if(!result)throw new Error(`未知科技演示：${id}`);
  }else if(command==='tech-apply'){
    if(!id||!values.scene||!values.preset)throw new Error('需要工程 ID、--scene 场景 ID 和 --preset 科技演示 ID');
    const current=await api(`/api/projects/${id}`);
    const parameters=values.file?JSON.parse(await readFile(values.file,'utf8')):{};
    const changed=applyTechScene(current,values.scene,values.preset,parameters);
    const validation=validateProject(changed);
    if(!validation.valid)throw new Error(validation.errors.join('；'));
    result=await api(`/api/projects/${id}`,{method:'PUT',...json(changed)});
  }else if(command==='motion-catalog'){
    result=id?getMotionPreset(id):MOTION_CATALOG;
    if(!result)throw new Error(`未知动效预设：${id}`);
  }else if(command==='motion-apply'){
    if(!id||!values.scene||!values.preset)throw new Error('需要工程 ID、--scene 场景 ID 和 --preset 预设 ID');
    const current=await api(`/api/projects/${id}`);
    const parameters=values.file?JSON.parse(await readFile(values.file,'utf8')):{};
    const changed=applyMotionPreset(current,values.scene,values.preset,parameters);
    const validation=validateProject(changed);
    if(!validation.valid)throw new Error(validation.errors.join('；'));
    result=await api(`/api/projects/${id}`,{method:'PUT',...json(changed)});
  }else if(command==='list') result=await api('/api/projects');
  else if(command==='catalog')result=await api('/api/catalog');
  else if(command==='demo')result=await api('/api/projects/demo',{method:'POST'});
  else if(command==='inspect')result=await api(`/api/projects/${id}`);
  else if(command==='validate')result=await api(`/api/projects/${id}/validate`);
  else if(command==='import'){
    if(!values.subtitles)throw new Error('需要 --subtitles 文件路径');
    const form=new FormData();
    form.append('subtitles',new Blob([await readFile(values.subtitles)]),path.basename(values.subtitles));
    if(values.audio)form.append('audio',new Blob([await readFile(values.audio)]),path.basename(values.audio));
    if(values.title)form.append('title',values.title);
    result=await api('/api/projects/import',{method:'POST',body:form});
  }else if(command==='save'){
    if(!values.file)throw new Error('需要 --file 工程 JSON 路径');
    result=await api(`/api/projects/${id}`,{method:'PUT',...json(JSON.parse(await readFile(values.file,'utf8')))});
  }else if(command==='draft'){
    const p=await api(`/api/projects/${id}`);
    result=await api(`/api/projects/${id}/draft`,{method:'POST',...json({revision:p.revision})});
  }else if(command==='render'||command==='frame'){
    const p=await api(`/api/projects/${id}`);
    result=await api(`/api/projects/${id}/render`,{method:'POST',...json({revision:values.revision?Number(values.revision):p.revision,kind:command==='frame'?'frame':'video',time:Number(values.time||0),quality:values.quality||'full'})});
    if(values.wait){while(['queued','running'].includes(result.status)){await new Promise(r=>setTimeout(r,1500));result=await api(`/api/jobs/${result.id}`);}if(result.status==='failed')throw new Error(result.error);}
  }else if(command==='job')result=await api(`/api/jobs/${id}`);
  else if(command==='jobs')result=await api('/api/jobs');
  else{console.log(`Fish Workbench CLI\n\nnode cli.mjs list | catalog | demo\nnode cli.mjs tech-catalog [effect-id]  # 查询六类科技演示\nnode cli.mjs tech-apply <id> --scene <scene-id> --preset <effect-id> [--file params.json]\nnode cli.mjs motion-catalog [preset-id]  # 离线查询动效目录\nnode cli.mjs motion-apply <id> --scene <scene-id> --preset <preset-id> [--file params.json]\nnode cli.mjs import --subtitles input.srt --audio narration.mp3 --title 标题\nnode cli.mjs inspect <id>\nnode cli.mjs save <id> --file project.json\nnode cli.mjs draft <id>\nnode cli.mjs validate <id>\nnode cli.mjs frame <id> --time 8 --wait\nnode cli.mjs render <id> --quality preview --wait\nnode cli.mjs job <job-id>\n\n所有命令输出 JSON。--base 可更改本地服务地址。`);process.exit(0);}
  console.log(JSON.stringify(result,null,2));
  if(command==='validate'&&!result.valid)process.exitCode=1;
}catch(e){console.error(JSON.stringify({error:e.message}));process.exitCode=1;}
