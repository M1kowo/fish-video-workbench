import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createProject,validateProject} from '../core/project.mjs';
import {MOTION_CATALOG,applyMotionPreset,getMotionTiming,getMotionTransition,validateSceneMotion} from '../core/motions.mjs';

function fixture(){
  const project=createProject({title:'动效测试'});
  project.duration=8;
  project.scenes=[{id:'scene-01',type:'definition',start:0,end:4,title:'从资料走向结果',subtitle:'保留声音的原有时间',items:['资料','处理','结果'],captionIds:[],transition:'none',character:null},{id:'scene-02',type:'recap',start:4,end:8,title:'检查结果',subtitle:'第二章节',items:['核对','交付'],captionIds:[],transition:'none',character:null}];
  return project;
}

test('all 20 callable presets make valid saved projects without mutating narration or source scenes',()=>{
  assert.equal(MOTION_CATALOG.length,20);
  const source=fixture(),original=structuredClone(source);
  for(const preset of MOTION_CATALOG){
    const parameters=preset.requiresData?{data:[{label:'示例 A',value:0},{label:'示例 B',value:72}]}:{};
    const changed=applyMotionPreset(source,'scene-01',preset.id,parameters);
    assert.equal(changed.scenes[0].motion[preset.slot],preset.id);
    assert.deepEqual(validateProject(changed).errors,[],preset.id);
    assert.deepEqual(changed.audio,source.audio);assert.deepEqual(changed.captions,source.captions);assert.equal(changed.duration,source.duration);
  }
  assert.deepEqual(source,original);
});

test('composes independent slots and preserves existing editorial scenes and character timing',()=>{
  let p=fixture();p.scenes[0].visual={kind:'resources'};
  p=applyMotionPreset(p,'scene-01','word-stagger');p=applyMotionPreset(p,'scene-01','grid-flow');p=applyMotionPreset(p,'scene-01','progress-steps');
  assert.deepEqual(p.scenes[0].motion,{title:'word-stagger',background:'grid-flow',template:'progress-steps'});
  assert.deepEqual(p.scenes[0].visual,{kind:'resources'});
  assert.deepEqual(validateProject(p).errors,[]);
});

test('rejects missing templates, wrong slots, unknown parameters and impossible timing',()=>{
  assert.throws(()=>applyMotionPreset(fixture(),'missing','typewriter'),/找不到场景/);
  assert.throws(()=>applyMotionPreset(fixture(),'scene-01','missing'),/未知动效/);
  for(const motion of [{title:'progress-bar'},{template:'missing'},{title:'typewriter',duraton:2},{template:'progress-steps',duration:3,delay:2},{title:'typewriter',intensity:Infinity},{title:'typewriter',duration:0},{title:'typewriter',stagger:-1},{template:'progress-bar',value:101}]){
    const p=fixture();p.scenes[0].motion=motion;
    assert.equal(validateProject(p).valid,false,JSON.stringify(motion));
  }
});

test('data templates require explicit, bounded data and never supply invented metrics',()=>{
  for(const template of ['kpi-counter','bar-chart','line-chart']){
    const p=fixture();p.scenes[0].motion={template};assert.equal(validateProject(p).valid,false);
    p.scenes[0].motion.data=[{label:'错误',value:-1}];assert.equal(validateProject(p).valid,false);
    p.scenes[0].motion.data=[{label:'错误',value:NaN}];assert.equal(validateProject(p).valid,false);
  }
  const p=fixture();p.scenes[0].motion={template:'kpi-counter',data:Array.from({length:4},(_,i)=>({label:String(i),value:i}))};
  assert.equal(validateProject(p).valid,false);
});

test('invalid JSON shapes return validation errors instead of throwing',()=>{
  for(const motion of [null,[],42,'bad',{template:'progress-steps',data:{}},{title:'word-stagger'}]){
    const scene={...fixture().scenes[0],items:{},title:42,motion};
    assert.doesNotThrow(()=>validateSceneMotion(scene));
  }
});

test('default timings fit short scenes with a long Chinese heading',()=>{
  const scene={...fixture().scenes[0],end:.2,title:'很长的中文标题'.repeat(6),motion:{title:'word-stagger',template:'progress-steps'}};
  assert.deepEqual(validateSceneMotion(scene),[]);
  const timing=getMotionTiming(scene);assert.ok(timing.duration>0);assert.ok(timing.duration<.2);
});

test('transitions use incoming scene time at every supported FPS, hold previous frame and do not shorten duration',()=>{
  for(const fps of [24,25,30,60]){
    const p=fixture();p.settings.fps=fps;p.scenes[1].motion={transition:'slide-push',duration:.5};
    assert.equal(getMotionTransition(p,4*fps-1),null);
    const start=getMotionTransition(p,4*fps);assert.equal(start.previous.id,'scene-01');assert.equal(start.progress,0);
    assert.ok(getMotionTransition(p,4*fps+Math.floor(fps*.25)).progress>0);
    assert.equal(getMotionTransition(p,Math.ceil(4.5*fps)),null);
    assert.equal(p.duration,8);
    p.scenes[1].start=4.2;assert.equal(getMotionTransition(p,Math.round(4.2*fps)),null);
  }
});

test('fractional scene boundaries start a transition on the first actually visible frame',()=>{
  const p=fixture();p.scenes[0].end=4.01;p.scenes[1].start=4.01;p.scenes[1].motion={transition:'circle-wipe'};
  assert.equal(getMotionTransition(p,120),null);
  assert.equal(getMotionTransition(p,121).progress,0);
});

test('every upstream snapshot has its pinned source hash and MIT notice',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../third_party/motion/manifest.json',import.meta.url),'utf8'));
  assert.equal(manifest.length,20);
  for(const item of manifest){
    const bytes=readFileSync(new URL(`../${item.snapshot}`,import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256,item.id);
    assert.match(item.commit,/^[a-f0-9]{40}$/);assert.equal(item.license,'MIT');
  }
  for(const name of ['onda','rendercomp'])assert.match(readFileSync(new URL(`../third_party/motion/${name}/LICENSE`,import.meta.url),'utf8'),/MIT License/);
});
