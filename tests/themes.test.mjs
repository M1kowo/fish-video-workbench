import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {themeFromPreset,THEME_PRESETS,getVideoStyle,areCharactersEnabled} from '../core/themes.mjs';
import {demoProject,validateProject} from '../core/project.mjs';
const catalog=JSON.parse(readFileSync(new URL('../public/characters/catalog.json',import.meta.url),'utf8'));
test('theme presets apply without changing the brand or mutating a saved theme',()=>{
  const source={brand:'我的系列',accent:'#123456',background:'dark'};
  const theme=themeFromPreset('blue-paper',source);
  assert.equal(theme.brand,'我的系列');assert.equal(theme.background,'paper');assert.equal(theme.captionStyle,'outlined');assert.equal(source.background,'dark');
});
test('all available presets are valid video themes',()=>{
  for(const preset of THEME_PRESETS){const project=demoProject(catalog);project.theme=themeFromPreset(preset.id,project.theme);assert.deepEqual(validateProject(project).errors,[]);}
});
test('rejects invalid texture and shadow inputs from agents',()=>{
  const project=demoProject(catalog);project.theme=themeFromPreset('blue-paper',project.theme);project.theme.grain=2;project.theme.shadow=NaN;assert.equal(validateProject(project).valid,false);
});
test('standard restores the first look and suppresses every character layer',()=>{
  const theme=themeFromPreset('standard',themeFromPreset('cute',{brand:'我的系列'}));
  assert.equal(theme.name,'标准');assert.equal(theme.background,'mist');assert.equal(theme.captionStyle,'clean');assert.equal(theme.titleStyle,'plain');assert.equal(theme.coverCharacter,false);assert.equal(areCharactersEnabled(theme),false);
  assert.equal(areCharactersEnabled({...theme,charactersEnabled:true,coverCharacter:true}),false);
});
test('switching back to cute restores GIFs without deleting their scene timing',()=>{
  const p=demoProject(catalog);const original=structuredClone(p.scenes);
  p.theme=themeFromPreset('standard',p.theme);assert.equal(areCharactersEnabled(p.theme),false);assert.deepEqual(p.scenes,original);
  p.theme=themeFromPreset('cute',p.theme);assert.equal(p.theme.name,'可爱');assert.equal(areCharactersEnabled(p.theme),true);assert.equal(p.theme.coverCharacter,true);assert.deepEqual(p.scenes,original);
});
test('legacy project presets resolve to the two public video styles',()=>{
  assert.deepEqual(THEME_PRESETS.map(p=>p.name),['标准','可爱']);
  assert.equal(getVideoStyle({preset:'blue-paper',background:'paper'}),'cute');
  assert.equal(getVideoStyle({preset:'mist',background:'mist'}),'standard');
  assert.equal(themeFromPreset('blue-paper').preset,'cute');
  assert.equal(themeFromPreset('mist').preset,'standard');
});
