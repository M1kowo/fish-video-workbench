// Browser regression check on the dedicated review project, never a user's project.
import '../core/render-env.mjs';
import assert from 'node:assert/strict';
import {openBrowser} from '@remotion/renderer';
import {promises as fs} from 'node:fs';
const reviewFile='data/tech-verification/review-project.json';
let project;
try{project=JSON.parse(await fs.readFile(reviewFile,'utf8'));}
catch(error){
  if(error.code!=='ENOENT')throw error;
  // A clean checkout has no local project IDs. Bootstrap an isolated review
  // project from the fixture produced by verify-tech-style, through the API.
  const example=JSON.parse(await fs.readFile('data/tech-verification/tech-preview.project.json','utf8'));
  const stamp=ms=>new Date(ms).toISOString().slice(11,23).replace('.',',');
  const subtitles=example.captions.map((c,i)=>`${i+1}\n${stamp(c.startMs)} --> ${stamp(c.endMs)}\n${c.text}`).join('\n\n');
  const form=new FormData();form.append('title','科技风格 · 连续演示示例');form.append('subtitles',new Blob([subtitles]),'tech-preview.srt');
  let response=await fetch('http://127.0.0.1:4318/api/projects/import',{method:'POST',body:form});
  const imported=await response.json();if(!response.ok)throw new Error(imported.error);
  const draft={...example,id:imported.id,revision:imported.revision,catalog:imported.catalog,createdAt:imported.createdAt,title:imported.title};
  response=await fetch(`http://127.0.0.1:4318/api/projects/${draft.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(draft)});
  project=await response.json();if(!response.ok)throw new Error(project.error);
  await fs.writeFile(reviewFile,JSON.stringify(project,null,2));
}
assert.equal(project.title,'科技风格 · 连续演示示例');
const browser=await openBrowser('chrome',{browserExecutable:process.env.FISH_BROWSER||'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'});
try{
  const page=await browser.newPage({context:()=>null,logLevel:'error',indent:false,pageIndex:0,onBrowserLog:null,onLog:()=>{}});
  await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});
  await page.goto({url:`http://127.0.0.1:4318/?project=${project.id}`,timeout:30000});
  async function until(fn){const deadline=Date.now()+15000;while(Date.now()<deadline){if(await page.evaluate(fn))return;await new Promise(r=>setTimeout(r,150));}throw new Error('UI condition timed out');}
  await until(()=>Boolean(document.querySelector('[aria-label="视频风格"]')));
  const options=await page.evaluate(()=>Array.from(document.querySelector('[aria-label="视频风格"]').options).map(o=>({value:o.value,label:o.textContent})));
  assert.deepEqual(options.map(o=>o.value),['standard','cute','tech']);
  async function select(value){await page.evaluate(value=>{const select=document.querySelector('[aria-label="视频风格"]');select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}));},value);}
  await select('standard');await until(()=>!document.querySelector('[data-tech-frame]'));
  await select('tech');await until(()=>Boolean(document.querySelector('[data-tech-frame]')));
  assert.equal(await page.evaluate(()=>document.querySelector('[aria-label="科技演示效果"]').options.length),7);
  await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='风格设置').click());
  await until(()=>Boolean(document.querySelector('.style-preview.tech')));
  assert.equal(await page.evaluate(()=>document.querySelectorAll('.theme-presets .theme-preset').length),3);
  await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='保存').click());
  await until(()=>Array.from(document.querySelectorAll('.save-state')).some(e=>e.textContent.includes('已保存')));
  const saved=await (await fetch(`http://127.0.0.1:4318/api/projects/${project.id}`)).json();
  assert.equal(saved.theme.preset,'tech');assert.equal(saved.theme.captionStyle,'tech');
  assert.deepEqual(saved.scenes,project.scenes);assert.deepEqual(saved.captions,project.captions);
  const screenshot=await page._client().send('Page.captureScreenshot',{format:'png'});
  await fs.writeFile('data/tech-verification/workbench-tech-ui.png',Buffer.from(screenshot.value.data,'base64'));
  await fs.writeFile('data/tech-verification/review-project.json',JSON.stringify(saved,null,2));
  console.log(JSON.stringify({passed:true,projectId:project.id,revision:saved.revision,checks:['three selectable styles','switch standard to tech','six effect options','three style cards','save and read back','preserved scene and caption timing']}));
}finally{await browser.close({silent:true});}
