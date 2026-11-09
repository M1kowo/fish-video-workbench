import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseSubtitles,createProject,validateProject,draftStoryboard,demoProject} from '../core/project.mjs';
const catalog=JSON.parse(readFileSync(new URL('../public/characters/catalog.json',import.meta.url),'utf8'));
test('imports SRT BOM/CRLF and VTT, preserves timed text and strips markup',()=>{
  const srt='\uFEFF1\r\n00:00:01,200 --> 00:00:03,400\r\n你好 <b>世界</b>\r\n第二行\r\n';
  const [c]=parseSubtitles(srt);assert.equal(c.startMs,1200);assert.equal(c.endMs,3400);assert.equal(c.text,'你好 世界 第二行');
  const [v]=parseSubtitles('WEBVTT\n\ncue-name\n00:01.500 --> 00:03.000 align:start\n字幕');assert.equal(v.startMs,1500);
});
test('rejects malformed or backwards subtitles',()=>{assert.throws(()=>parseSubtitles('nothing'));assert.throws(()=>parseSubtitles('1\n00:00:04,000 --> 00:00:03,000\n错误'));});
test('audio is the master clock and captions beyond it are rejected',()=>{
  const captions=parseSubtitles('1\n00:00:00,000 --> 00:00:10,000\n文字');
  const p=createProject({captions,audio:{duration:5},catalog});assert.equal(p.duration,5);assert.equal(validateProject(p).valid,false);
});
test('draft covers timeline and keeps caption IDs, supports a short scene',()=>{
  const captions=parseSubtitles('1\n00:00:00,000 --> 00:00:00,800\n先开始');
  const p=createProject({captions,catalog});p.scenes=draftStoryboard(p);assert.equal(p.scenes[0].start,0);assert.equal(p.scenes[0].end,p.duration);assert.deepEqual(p.scenes[0].captionIds,['cap-001']);assert.equal(validateProject(p).valid,true);
});
test('example project is valid and covers all scene templates in sample',()=>{
  const p=demoProject(catalog);assert.deepEqual(validateProject(p).errors,[]);assert.equal(p.scenes[0].start,0);assert.equal(p.scenes.at(-1).end,p.duration);
});
test('rejects overlapping scenes, broken references and nonfinite timing',()=>{
  const p=demoProject(catalog);p.scenes[1].start=6;p.scenes[1].captionIds=['missing'];p.scenes[2].character.assetId='missing';p.scenes[3].end=NaN;
  const check=validateProject(p);assert.equal(check.valid,false);assert.ok(check.errors.some(e=>e.includes('重叠')));assert.ok(check.errors.some(e=>e.includes('不存在')));assert.ok(check.errors.some(e=>e.includes('时间越界')));
});
test('invalid nested data returns validation errors instead of throwing',()=>{
  const p=demoProject(catalog);p.scenes=[null];assert.equal(validateProject(p).valid,false);
  const p2=demoProject(catalog);p2.scenes[0].subtitle={bad:'value'};assert.equal(validateProject(p2).valid,false);
});
