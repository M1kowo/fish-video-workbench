// Run against the local workbench: node tests/motion-integration.mjs
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {themeFromPreset} from '../core/themes.mjs';
const run=promisify(execFile),base='http://127.0.0.1:4318';
const fixture=path.resolve('data/motion-verification');await fs.mkdir(fixture,{recursive:true});
const audio=path.join(fixture,'integration-audio.wav');
await run('ffmpeg',['-hide_banner','-loglevel','error','-f','lavfi','-i','sine=frequency=440:sample_rate=44100','-t','2','-y',audio],{windowsHide:true});
const json=value=>({headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});
async function request(route,options={}){const r=await fetch(base+route,options);return {status:r.status,data:await r.json()};}
assert.equal((await request('/api/motions')).data.length,20);
assert.equal((await request('/api/motions/not-a-preset')).status,404);
assert.equal((await request('/api/motions/typewriter')).data.slot,'title');
const catalog=JSON.parse((await run(process.execPath,['cli.mjs','motion-catalog','bar-chart'],{windowsHide:true})).stdout);
assert.equal(catalog.requiresData,true);
const form=new FormData();form.append('title','[动效验收] 字幕音轨与新模板');form.append('subtitles',new Blob(['1\n00:00:00,000 --> 00:00:02,000\n字幕与配音时间保持一致。']),'test.srt');form.append('audio',new Blob([await fs.readFile(audio)]),'motion.wav');
const imported=await request('/api/projects/import',{method:'POST',body:form});assert.equal(imported.status,201,JSON.stringify(imported.data));
let project=(await request(`/api/projects/${imported.data.id}/draft`,{method:'POST',...json({revision:imported.data.revision})})).data;
const originalAudio=structuredClone(project.audio),originalCaptions=structuredClone(project.captions);
const parameters=path.join(fixture,'integration-params.json');await fs.writeFile(parameters,JSON.stringify({title:'typewriter',background:'grid-flow',duration:.5,value:72}));
const applied=await run(process.execPath,['cli.mjs','motion-apply',project.id,'--scene',project.scenes[0].id,'--preset','progress-bar','--file',parameters],{windowsHide:true});
const previousRevision=project.revision;project=JSON.parse(applied.stdout);
assert.equal(project.revision,previousRevision+1);assert.deepEqual(project.audio,originalAudio);assert.deepEqual(project.captions,originalCaptions);assert.equal(project.duration,2);
assert.equal(project.scenes[0].motion.template,'progress-bar');assert.equal(project.scenes[0].motion.title,'typewriter');
project.scenes[0].end=.8;project.scenes[0].character=null;
project.scenes.push({...project.scenes[0],id:'scene-motion-02',type:'flow',start:.8,end:2,title:'核验完成',items:['核对','完成'],motion:{template:'progress-steps',transition:'slide-push',duration:.4}});
if(process.argv.includes('--tech')){
  project.theme=themeFromPreset('tech',project.theme);
  project.scenes[1].items=['哪项便于核验？','只看输出','核对来源'];
  project.scenes[1].visual={kind:'quiz-feedback',answerIndex:1};
}
const withTransition=await request(`/api/projects/${project.id}`,{method:'PUT',...json(project)});assert.equal(withTransition.status,200,JSON.stringify(withTransition.data));project=withTransition.data;
assert.equal((await request(`/api/projects/${project.id}`,{method:'PUT',...json({...project,revision:previousRevision})})).status,409);
const invalid=structuredClone(project);invalid.scenes[0].motion.template='does-not-exist';
assert.equal((await request(`/api/projects/${project.id}`,{method:'PUT',...json(invalid)})).status,400);
const invalidData=structuredClone(project);invalidData.scenes[0].motion={template:'bar-chart'};
assert.equal((await request(`/api/projects/${project.id}`,{method:'PUT',...json(invalidData)})).status,400);
const persisted=(await request(`/api/projects/${project.id}`)).data;
assert.deepEqual(persisted.scenes[0].motion,project.scenes[0].motion);
assert.equal((await request(`/api/projects/${project.id}/validate`)).data.valid,true);
let job=(await request(`/api/projects/${project.id}/render`,{method:'POST',...json({revision:project.revision,kind:'video',quality:'preview'})})).data;
const deadline=Date.now()+180000;
while(['queued','running'].includes(job.status)&&Date.now()<deadline){await new Promise(r=>setTimeout(r,1000));job=(await request(`/api/jobs/${job.id}`)).data;}
assert.equal(job.status,'completed',job.error||'render timeout');
const output=path.resolve('data/renders',path.basename(job.outputUrl));
const meta=JSON.parse((await run('ffprobe',['-v','error','-show_format','-show_streams','-of','json',output],{windowsHide:true})).stdout);
assert.ok(meta.streams.some(s=>s.codec_type==='audio'));
const video=meta.streams.find(s=>s.codec_type==='video');assert.equal(video.width,960);assert.equal(video.height,540);assert.ok(Math.abs(Number(meta.format.duration)-2)<.1);
const silence=await run('ffmpeg',['-hide_banner','-i',output,'-af','silencedetect=noise=-45dB:d=0.1','-f','null','-'],{windowsHide:true});assert.ok(!silence.stderr.includes('silence_start:'),'转场期间音轨出现断音');
console.log(JSON.stringify({passed:true,projectId:project.id,jobId:job.id,output,checks:['HTTP catalog','offline CLI catalog','CLI apply','save and reload','revision conflict','invalid preset rejection','explicit data requirement','caption and audio preservation','MP4 export with audio','continuous audio across scene transition']},null,2));
if(process.argv.includes('--cleanup')){
  await fs.writeFile(path.join(fixture,'last-integration-result.json'),JSON.stringify({passed:true,tech:process.argv.includes('--tech'),projectId:project.id,jobId:job.id,output},null,2));
  await fs.writeFile(path.join(fixture,'last-integration-project.json'),JSON.stringify(project,null,2));
  await fs.unlink(path.resolve('data/projects',project.id+'.json'));
  await fs.unlink(path.resolve('data/jobs',job.id+'.json'));
}
