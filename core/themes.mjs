export const THEME_PRESETS=[
  {id:'standard',name:'标准',description:'第一版画面 · 清晰讲解 · 不使用 GIF',swatches:['#eeebfa','#7962df','#ffffff'],values:{name:'标准',accent:'#7962df',background:'mist',captionStyle:'clean',fontFamily:'Microsoft YaHei',titleFontFamily:'Microsoft YaHei',titleStyle:'plain',grain:0,shadow:0,coverCharacter:false,charactersEnabled:false}},
  {id:'cute',name:'可爱',description:'第二版画面 · 蓝白纸感 · 角色 GIF',swatches:['#a7cce7','#e0e9e8','#f8f4eb'],values:{name:'可爱',accent:'#4c90cb',background:'paper',captionStyle:'outlined',fontFamily:'Microsoft YaHei',titleFontFamily:'Microsoft YaHei',titleStyle:'sticker',grain:0.14,shadow:0.2,coverCharacter:true,charactersEnabled:true}}
];
export function getVideoStyle(theme={}){
  if(theme.preset==='standard'||theme.preset==='cute')return theme.preset;
  return theme.preset==='blue-paper'||theme.background==='paper'?'cute':'standard';
}
export function areCharactersEnabled(theme={}){
  return getVideoStyle(theme)==='cute'&&theme.charactersEnabled!==false;
}
export function themeFromPreset(id,current={}){
  const canonical=({ 'blue-paper':'cute',mist:'standard',night:'standard' })[id]||id;
  const preset=THEME_PRESETS.find(p=>p.id===canonical);
  if(!preset)throw new Error('未知视频风格');
  const values=id==='night'?{...preset.values,accent:'#a79be9',background:'dark'}:preset.values;
  return {...current,...values,preset:canonical};
}
