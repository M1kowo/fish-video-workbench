import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createProject,validateProject} from '../core/project.mjs';
import {themeFromPreset,getVideoStyle,areCharactersEnabled} from '../core/themes.mjs';
import {TECH_SCENES,applyTechScene,techBeat,validateTechScene,getTechTransition} from '../core/tech.mjs';

function fixture(preset=TECH_SCENES[0]){
  const p=createProject({title:'科技演示'});p.duration=12;
  p.scenes=[{id:'scene-01',type:'definition',start:0,end:6,title:'讲清一个过程',subtitle:'跟随讲解推进',items:[...preset.exampleItems],captionIds:[],transition:'fade',character:null},{id:'scene-02',type:'recap',start:6,end:12,title:'检查结果',subtitle:'保留音轨时间',items:['过程','结果'],captionIds:[],transition:'slide',character:null}];
  return p;
}
test('all six tech effects validate with explicit contents, preserving audio and caption timing',()=>{
  for(const preset of TECH_SCENES){
    const source=fixture(preset),original=structuredClone(source);
    const p=applyTechScene(source,'scene-01',preset.id,preset.answerIndex!==undefined?{answerIndex:preset.answerIndex}:{});
    assert.deepEqual(validateProject(p).errors,[],preset.id);assert.equal(getVideoStyle(p.theme),'tech');
    assert.deepEqual(source,original);assert.deepEqual(p.audio,source.audio);assert.deepEqual(p.captions,source.captions);assert.equal(p.duration,source.duration);
  }
});
test('tech can be selected and switched back without deleting scenes or GIF timing',()=>{
  const source=fixture();source.theme.brand='我的品牌';const scenes=structuredClone(source.scenes);
  source.theme=themeFromPreset('tech',source.theme);
  assert.equal(source.theme.brand,'我的品牌');assert.equal(source.theme.captionStyle,'tech');assert.equal(areCharactersEnabled({...source.theme,charactersEnabled:true}),false);
  source.theme=themeFromPreset('cute',source.theme);assert.equal(areCharactersEnabled(source.theme),true);assert.deepEqual(source.scenes,scenes);
  assert.equal(getVideoStyle(themeFromPreset('night')),'standard');
});
test('tech beats are seekable and custom absolute timing controls state changes',()=>{
  const scene={...fixture().scenes[0],visual:{kind:'system-map',events:[{at:0,label:'一'},{at:1,label:'二'},{at:3,label:'三'},{at:4,label:'四'}]}};
  assert.equal(techBeat(scene,.5,1),0);assert.equal(techBeat(scene,2,1),.5);assert.equal(techBeat(scene,3,1),1);
  const forward=techBeat(scene,4.5,3);techBeat(scene,.2,0);assert.equal(techBeat(scene,4.5,3),forward);
});
test('rejects unknown targets, ambiguous quiz answers and invalid beat times',()=>{
  assert.throws(()=>applyTechScene(fixture(),'missing','system-map'),/找不到场景/);
  assert.throws(()=>applyTechScene(fixture(),'scene-01','missing'),/未知科技/);
  const quiz=fixture(TECH_SCENES.find(p=>p.id==='quiz-feedback')).scenes[0];quiz.visual={kind:'quiz-feedback'};assert.ok(validateTechScene(quiz).length);
  quiz.visual.answerIndex=30;assert.ok(validateTechScene(quiz).length);
  const scene=fixture().scenes[0];scene.visual={kind:'system-map',events:[{at:0,label:'一'},{at:2,label:'二'},{at:1,label:'三'},{at:7,label:'四'}]};assert.ok(validateTechScene(scene).length);
});
test('tech default scene changes slide without shortening narration and respect direct cuts',()=>{
  const p=fixture();p.theme=themeFromPreset('tech',p.theme);
  assert.equal(getTechTransition(p,179),null);assert.equal(getTechTransition(p,180).progress,0);assert.equal(getTechTransition(p,200),null);assert.equal(p.duration,12);
  p.scenes[1].transition='none';assert.equal(getTechTransition(p,180),null);
  p.scenes[1].transition='slide';p.scenes[1].motion={transition:'circle-wipe'};assert.equal(getTechTransition(p,180),null);
});
