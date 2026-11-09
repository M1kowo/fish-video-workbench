import express from 'express';
import multer from 'multer';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia,renderStill} from '@remotion/renderer';
import {createProject,demoProject,draftStoryboard,parseSubtitles,validateProject} from './core/project.mjs';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
const PUBLIC=path.join(ROOT,'public');
const DATA=path.join(ROOT,'data');
const PORT=Number(process.env.FISH_PORT||4318);
const BASE=`http://127.0.0.1:${PORT}`;
const run=promisify(execFile);
await Promise.all(['projects','jobs','renders'].map(d=>fs.mkdir(path.join(DATA,d),{recursive:true})));
await fs.mkdir(path.join(PUBLIC,'uploads'),{recursive:true});
const catalog=JSON.parse(await fs.readFile(path.join(PUBLIC,'characters/catalog.json'),'utf8'));
const app=express();
app.disable('x-powered-by');
// Local-only service. Block browser requests from unrelated sites.
app.use((req,res,next)=>{
  const origin=req.headers.origin;
  if(origin && ![`http://127.0.0.1:${PORT}`,`http://localhost:${PORT}`].includes(origin)) return res.status(403).json({error:'仅接受本地工作台页面的请求'});
  if(!['127.0.0.1','localhost'].includes((req.headers.host||'').split(':')[0])) return res.status(403).json({error:'无效的本地主机'});
  next();
});
app.use(express.json({limit:'4mb'}));
app.use('/media',express.static(PUBLIC));
app.use('/outputs',express.static(path.join(DATA,'renders')));
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:150*1024*1024,files:2}});
const validId=id=>/^[a-zA-Z0-9_-]{1,90}$/.test(id);
const projectPath=id=>{if(!validId(id)) throw Object.assign(new Error('无效项目 ID'),{status:400});return path.join(DATA,'projects',`${id}.json`);};
const readProject=async id=>JSON.parse(await fs.readFile(projectPath(id),'utf8'));
async function atomicWrite(filename,value){const tmp=`${filename}.${randomUUID()}.tmp`;await fs.writeFile(tmp,JSON.stringify(value,null,2),'utf8');await fs.rename(tmp,filename);}
const locks=new Map();
async function saveProject(project,expectedRevision=null){
  const key=project.id;const previous=locks.get(key)||Promise.resolve();
  const operation=previous.catch(()=>{}).then(async()=>{
    let current=null;try{current=await readProject(key);}catch(e){if(e.code!=='ENOENT')throw e;}
    if(current&&expectedRevision!==current.revision) throw Object.assign(new Error('工程已被其他操作更新，请重新加载后再保存'),{status:409});
    project.revision=(current?.revision||0)+1;project.updatedAt=new Date().toISOString();
    await atomicWrite(projectPath(key),project);return project;
  });
  locks.set(key,operation);try{return await operation;}finally{if(locks.get(key)===operation)locks.delete(key);}
}
async function checkMedia(project){
  if(!project.audio)return;
  if(!/^uploads\/[a-f\d-]+\.(mp3|wav|m4a|aac|ogg|flac|mp4)$/i.test(project.audio.src||'')) throw Object.assign(new Error('音轨必须引用通过导入接口保存的本地素材'),{status:400});
  await fs.access(path.join(PUBLIC,project.audio.src));
  if(!Number.isFinite(project.audio.duration)||Math.abs(project.duration-project.audio.duration)>0.1) throw Object.assign(new Error('工程时长必须与音频时长一致'),{status:400});
}

app.get('/api/health',(_req,res)=>res.json({ok:true,version:'0.1.0',agentInterfaces:['cli','http'],renderer:'Remotion',localOnly:true}));
app.get('/api/catalog',(_req,res)=>res.json(catalog));
app.get('/api/projects',async(_req,res)=>{
  const files=(await fs.readdir(path.join(DATA,'projects'))).filter(f=>f.endsWith('.json'));
  const projects=await Promise.all(files.map(async f=>{const p=JSON.parse(await fs.readFile(path.join(DATA,'projects',f),'utf8'));return {id:p.id,title:p.title,updatedAt:p.updatedAt,revision:p.revision,duration:p.duration,sceneCount:p.scenes.length,demo:!!p.demo};}));
  res.json(projects.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)));
});
app.get('/api/projects/:id',async(req,res)=>res.json(await readProject(req.params.id)));
app.post('/api/projects/demo',async(_req,res)=>{
  const p=demoProject(catalog);p.id=`demo-${randomUUID().slice(0,8)}`;res.status(201).json(await saveProject(p));
});
app.post('/api/projects/import',upload.fields([{name:'subtitles',maxCount:1},{name:'audio',maxCount:1}]),async(req,res)=>{
  const subtitles=req.files?.subtitles?.[0];
  if(!subtitles)throw Object.assign(new Error('请选择 SRT 或 VTT 字幕文件'),{status:400});
  if(!/\.(srt|vtt)$/i.test(subtitles.originalname))throw Object.assign(new Error('首版支持 SRT / VTT 字幕'),{status:400});
  const captions=parseSubtitles(subtitles.buffer.toString('utf8'));
  let audio=null;
  const file=req.files?.audio?.[0];
  if(file){
    const ext=path.extname(file.originalname).toLowerCase();
    if(!['.mp3','.wav','.m4a','.aac','.ogg','.flac','.mp4'].includes(ext)) throw Object.assign(new Error('不支持的音频格式'),{status:400});
    const relative=`uploads/${randomUUID()}${ext}`;const filename=path.join(PUBLIC,relative);
    await fs.writeFile(filename,file.buffer);
    try{
      const {stdout}=await run('ffprobe',['-v','error','-show_format','-show_streams','-of','json',filename],{windowsHide:true,timeout:30000});
      const metadata=JSON.parse(stdout);
      if(!metadata.streams.some(s=>s.codec_type==='audio'))throw new Error('文件中没有音轨');
      const duration=Number(metadata.format.duration);
      if(!Number.isFinite(duration)||duration<=0)throw new Error('无法读取音频时长');
      audio={src:relative,name:file.originalname,duration};
    }catch(e){throw Object.assign(new Error(`音频读取失败：${e.message}`),{status:400});}
  }
  const p=createProject({id:`video-${randomUUID().slice(0,8)}`,title:req.body.title||subtitles.originalname.replace(/\.[^.]+$/,''),captions,audio,catalog});
  const validation=validateProject(p);
  if(!validation.valid)throw Object.assign(new Error(validation.errors.join('；')),{status:400});
  res.status(201).json(await saveProject(p));
});
app.put('/api/projects/:id',async(req,res)=>{
  const current=await readProject(req.params.id);
  const p={...req.body,id:current.id,catalog,createdAt:current.createdAt};
  const result=validateProject(p);if(!result.valid)return res.status(400).json({error:result.errors.join('；'),validation:result});
  await checkMedia(p);res.json(await saveProject(p,req.body.revision));
});
app.post('/api/projects/:id/draft',async(req,res)=>{
  const p=await readProject(req.params.id);const revision=p.revision;
  if(req.body.revision!==revision)return res.status(409).json({error:'工程版本已更新，请重新加载'});
  p.scenes=draftStoryboard(p);p.planningSource='rule-draft';
  res.json(await saveProject(p,revision));
});
app.get('/api/projects/:id/validate',async(req,res)=>res.json(validateProject(await readProject(req.params.id))));

const jobs=new Map();let queue=Promise.resolve();let bundlePromise=null;
for(const filename of await fs.readdir(path.join(DATA,'jobs'))){
  if(!filename.endsWith('.json'))continue;
  const job=JSON.parse(await fs.readFile(path.join(DATA,'jobs',filename),'utf8'));
  if(['queued','running'].includes(job.status)){job.status='failed';job.error='服务曾重启，请重新提交渲染';await atomicWrite(path.join(DATA,'jobs',filename),job);}
  jobs.set(job.id,job);
}
async function persistJob(job){await atomicWrite(path.join(DATA,'jobs',`${job.id}.json`),job);}
async function renderJob(job,project,options){
  try{
    job.status='running';job.stage='正在准备渲染环境';await persistJob(job);
    if(!bundlePromise)bundlePromise=bundle({entryPoint:path.join(ROOT,'src/index.ts'),publicDir:PUBLIC,onProgress:()=>{}}).catch(e=>{bundlePromise=null;throw e;});
    const serveUrl=await bundlePromise;
    const inputProps={project,assetBaseUrl:`${BASE}/media/`};
    const browserExecutable=process.env.FISH_BROWSER || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const rendererOptions={serveUrl,inputProps,browserExecutable,chromiumOptions:{disableWebSecurity:false}};
    const composition=await selectComposition({...rendererOptions,id:'FishVideo'});
    const filename=`${job.id}.${job.kind==='frame'?'png':'mp4'}`;
    const output=path.join(DATA,'renders',filename);
    job.stage=job.kind==='frame'?'正在绘制关键帧':'正在渲染视频';
    if(job.kind==='frame'){
      await renderStill({...rendererOptions,composition,output,frame:Math.min(composition.durationInFrames-1,Math.max(0,Math.round((options.time||0)*project.settings.fps))),scale:0.5,imageFormat:'png'});
    }else{
      await renderMedia({...rendererOptions,composition,codec:'h264',outputLocation:output,scale:options.quality==='preview'?0.5:1,concurrency:2,crf:options.quality==='preview'?25:18,onProgress:({progress})=>{job.progress=Math.round(progress*100);job.stage=`正在渲染 · ${job.progress}%`;}});
    }
    job.status='completed';job.progress=100;job.stage='已完成';job.outputUrl=`/outputs/${filename}`;
  }catch(e){job.status='failed';job.error=e.message;job.stage='渲染失败';}
  job.finishedAt=new Date().toISOString();await persistJob(job);
}
app.post('/api/projects/:id/render',async(req,res)=>{
  const p=await readProject(req.params.id);const validation=validateProject(p);
  if(!validation.valid||!p.scenes.length)return res.status(400).json({error:validation.errors.join('；')||'请先添加分镜'});
  await checkMedia(p);
  if(req.body.revision!==p.revision)return res.status(409).json({error:'请保存并重新加载最新版本后导出'});
  const kind=req.body.kind==='frame'?'frame':'video';
  if(req.body.time!==undefined&&(!Number.isFinite(req.body.time)||req.body.time<0))return res.status(400).json({error:'关键帧时间无效'});
  const existing=[...jobs.values()].find(j=>j.projectId===p.id&&j.revision===p.revision&&j.kind===kind&&['queued','running'].includes(j.status));
  if(existing)return res.json(existing);
  const job={id:randomUUID(),projectId:p.id,revision:p.revision,kind,status:'queued',progress:0,stage:'等待渲染',createdAt:new Date().toISOString()};
  jobs.set(job.id,job);await persistJob(job);
  queue=queue.catch(()=>{}).then(()=>renderJob(job,p,req.body));
  res.status(202).json(job);
});
app.get('/api/jobs',(_req,res)=>res.json([...jobs.values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt))));
app.get('/api/jobs/:id',(req,res)=>{const job=jobs.get(req.params.id);if(!job)return res.status(404).json({error:'找不到任务'});res.json(job);});

if(process.env.NODE_ENV==='production'){
  app.use(express.static(path.join(ROOT,'dist')));
  app.get('/{*splat}',(_req,res)=>res.sendFile(path.join(ROOT,'dist/index.html')));
}else{
  const {createServer}=await import('vite');
  const vite=await createServer({root:ROOT,server:{middlewareMode:true},appType:'spa'});
  app.use(vite.middlewares);
}
app.use((error,_req,res,_next)=>{
  const status=error.status||(error.code==='ENOENT'?404:error instanceof multer.MulterError?400:500);
  res.status(status).json({error:error.code==='ENOENT'?'找不到项目或素材':error.message||'服务发生错误'});
});
app.listen(PORT,'127.0.0.1',()=>console.log(`大肥鱼视频工作台 Local: ${BASE}`));
