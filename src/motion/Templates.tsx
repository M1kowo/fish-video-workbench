// Adapted motion recipes from Onda (cursor, spotlight-card, progress-steps, draw-on,
// progress-bar) and RenderComp (counter, charts, chat, chapter). MIT notices, original
// sources and pinned commits are retained in third_party/motion/manifest.json.
// Adaptations: Chinese typography, shared themes, safe caption area, seconds-based
// timing, configurable content, explicit data, and no additional runtime dependencies.
import type {CSSProperties} from 'react';
import {Easing,interpolate,spring} from 'remotion';
import {getMotionTiming} from '../../core/motions.mjs';
import type {Scene} from '../model';

const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
const ease=Easing.out(Easing.cubic);
function split(text:string){const [title,...details]=text.split('｜');return {title,detail:details.join('｜')};}
function chartValue(value:number,unit=''){return new Intl.NumberFormat('en-US',{notation:'compact',maximumSignificantDigits:4}).format(value)+unit;}

// RenderComp's fixed-width odometer: choose the unit once, then roll each column.
function wheelPos(value:number,place:number){
  const q=Math.max(0,value)/10**place,whole=Math.floor(q),fraction=q-whole;
  return whole%10+(place===0?fraction:Math.min(1,Math.max(0,fraction*10-9)));
}
function RollingNumber({value,progress,color}:{value:number;progress:number;color:string}){
  const div=value>=1e9?1e9:value>=1e6?1e6:value>=1e3?1e3:1;
  const unit=div===1e9?'B':div===1e6?'M':div===1e3?'K':'';
  if(value>0&&value<.001)return <span style={{fontSize:60,color,fontWeight:700,fontVariantNumeric:'tabular-nums'}}>{(value*progress).toExponential(2)}</span>;
  const decimals=div>1?1:Number.isInteger(value)?0:(value.toFixed(6).replace(/0+$/,'').split('.')[1]?.length||0);
  const target=Math.round(value/div*10**decimals),text=(target/10**decimals).toFixed(decimals);
  const count=text.replace(/\D/g,'').length;
  const size=count>6?66:88,cell=size*1.2;
  let digit=0;
  return <span style={{display:'inline-flex',alignItems:'center',fontSize:size,color,fontWeight:700,fontVariantNumeric:'tabular-nums',lineHeight:1}}>{Array.from(text).map((char,index)=>{
    if(char==='.')return <span key={index}>.</span>;
    const place=count-1-digit++,pos=wheelPos(target*progress,place);
    return <span key={index} style={{display:'inline-block',position:'relative',overflow:'hidden',width:size*.62,height:cell}}><span style={{position:'absolute',left:0,top:0,width:'100%',translate:`0px ${-pos*cell}px`}}>{Array.from({length:11},(_,i)=><span key={i} style={{display:'block',height:cell,lineHeight:`${cell}px`,textAlign:'center'}}>{i%10}</span>)}</span></span>;
  })}<span style={{fontSize:size*.6}}>{unit}</span></span>;
}

export function MotionTemplate({scene,frame,fps,accent,dark,paper}:{scene:Scene;frame:number;fps:number;accent:string;dark:boolean;paper:boolean}){
  const m=scene.motion!,id=m.template;
  const {delay,duration,stagger}=getMotionTiming(scene);
  const local=frame-delay*fps,frames=Math.max(1,duration*fps);
  const p=(index=0)=>interpolate(local-index*stagger*fps,[0,frames],[0,1],{...clamp,easing:ease});
  const ink=dark?'#f0f5ff':paper?'#304f68':'#30314a';
  const muted=dark?'#a2b4ca':'#6c7d92';
  const border=dark?'#92b3da38':'#a9b7d746';
  const panel=dark?'#142238ef':paper?'#fffdf4eb':'#fffffff0';
  const card:CSSProperties={border:`2px solid ${border}`,borderRadius:24,background:panel,overflow:'hidden'};
  const box:CSSProperties={width:'100%',maxWidth:1560,height:390,position:'relative',marginTop:32,color:ink};
  const items=scene.items.filter(t=>t.trim());
  const enter=(index:number):CSSProperties=>({opacity:p(index),translate:`0px ${(1-p(index))*22}px`});
  const number=(i:number)=>String(i+1).padStart(2,'0');

  if(id==='cursor-click'){
    const clickAt=delay*fps+frames*.72;
    const click=frame>=clickAt;
    const ripple=interpolate(frame,[clickAt,clickAt+Math.max(1,frames*.28)],[0,1],clamp);
    const press=interpolate(frame,[clickAt,clickAt+Math.max(1,frames*.08),clickAt+Math.max(2,frames*.18)],[1,.86,1],clamp);
    const travel=spring({frame:Math.max(0,local),fps,config:{damping:200,stiffness:100,mass:1},durationInFrames:Math.max(1,Math.round(frames*.65))});
    // Pointer target is the actual button's top-left anchor in this 1560×390 board.
    const x=interpolate(travel,[0,1],[120,1170]),y=interpolate(travel,[0,1],[325,205]);
    return <div style={{...box,...card,padding:35,display:'grid',gridTemplateColumns:'1fr 480px',gap:50}}><div><div style={{fontSize:22,color:muted,letterSpacing:3,marginBottom:26}}>WORKFLOW / 操作演示</div>{items.map((text,i)=><div key={i} data-layout-check style={{...enter(i),fontSize:items.length>2?29:34,lineHeight:1.6,marginBottom:15,overflowWrap:'anywhere'}}><span style={{color:accent,marginRight:20}}>{number(i)}</span>{text}</div>)}</div><div style={{...card,padding:32,display:'flex',flexDirection:'column',justifyContent:'center',gap:26,borderColor:click?accent:border}}><div style={{fontSize:26,color:muted}}>{click?'操作完成':'等待操作'}</div><div style={{background:click?`${accent}35`:accent,borderRadius:14,padding:'25px 20px',textAlign:'center',fontSize:34,fontWeight:700,color:click?ink:'#ffffff'}}>{click?'✓ 已完成':'开始执行'}</div></div><div style={{position:'absolute',left:x,top:y,pointerEvents:'none'}}>{ripple>0&&ripple<1&&<div style={{position:'absolute',width:80,height:80,left:-32,top:-32,border:`3px solid ${accent}`,borderRadius:'50%',scale:.2+ripple*1.4,opacity:.7*(1-ripple)}}/>}<svg width={36} height={58} viewBox="0 0 40 64" style={{scale:press,transformOrigin:'4px 2px',filter:'drop-shadow(0 4px 8px #0008)'}}><path d="M4 2 L4 46 L15 36 L22 54 L30 50 L23 33 L38 33 Z" fill={dark?'#ffffff':'#243e61'} stroke={dark?'#18243b':'#ffffff'} strokeWidth={2}/></svg></div></div>;
  }

  if(id==='card-spotlight'){
    const current=Math.min(items.length-1,Math.max(0,Math.floor(local/Math.max(1,(scene.end-scene.start-delay)*fps/items.length))));
    return <div style={{...box,display:'flex',gap:24}}>{items.map((text,i)=>{
      const {title,detail}=split(text),active=i===current;
      const t=frame/fps;
      return <div key={i} style={{...card,...enter(i),flex:1,padding:32,position:'relative',borderColor:active?accent:border,opacity:p(i)*(active?1:.48)}}>{active&&<div style={{position:'absolute',inset:0,background:`radial-gradient(circle at ${50+Math.sin(t*.6)*22}% ${40+Math.cos(t*.48)*16}%,${accent}45,transparent 72%)`}}/>}<div style={{position:'relative'}}><div style={{fontSize:24,color:accent,marginBottom:35}}>{number(i)} / {active?'当前重点':'功能模块'}</div><div data-layout-check style={{fontSize:title.length>20?29:40,fontWeight:700,lineHeight:1.6,overflowWrap:'anywhere'}}>{title}</div>{detail&&<div data-layout-check style={{fontSize:25,lineHeight:1.65,color:muted,marginTop:22,overflowWrap:'anywhere'}}>{detail}</div>}</div></div>;
    })}</div>;
  }

  if(id==='progress-steps'){
    const filled=p()*(items.length-1);
    return <div style={{...box,...card,padding:'80px 55px',display:'flex',alignItems:'flex-start'}}>{items.map((text,i)=>{
      const active=filled>=i-.05,connector=interpolate(filled,[i,i+1],[0,1],clamp);
      return <div key={i} style={{flex:1,minWidth:0}}><div style={{display:'flex',alignItems:'center'}}><div style={{width:68,height:68,borderRadius:'50%',flexShrink:0,border:`2px solid ${active?accent:border}`,background:active?`${accent}30`:panel,color:active?accent:muted,display:'grid',placeItems:'center',fontSize:27,fontWeight:700,boxShadow:active?`0 0 25px ${accent}30`:undefined}}>{filled>i+.15?'✓':number(i)}</div>{i<items.length-1&&<div style={{height:3,flex:1,background:border,margin:'0 12px'}}><div style={{width:`${connector*100}%`,height:3,background:accent}}/></div>}</div><div data-layout-check style={{fontSize:items.length>4?25:31,lineHeight:1.5,paddingRight:20,marginTop:34,overflowWrap:'anywhere',color:active?ink:muted}}>{text}</div></div>;
    })}</div>;
  }

  if(id==='draw-connections'){
    const satellites=items.slice(1),cx=780,cy=195;
    const nodes=satellites.map((text,i)=>{const a=-Math.PI/2+i*Math.PI*2/satellites.length;return {text,x:cx+Math.cos(a)*560,y:cy+Math.sin(a)*145};});
    return <div style={{...box,...card}}><svg width="100%" height="100%" viewBox="0 0 1560 390" style={{position:'absolute',inset:0}}>{nodes.map((node,i)=><path key={i} d={`M ${cx} ${cy} L ${node.x} ${node.y}`} pathLength={1} stroke={accent} strokeWidth={3} strokeDasharray={1} strokeDashoffset={1-p(i)} fill="none" opacity={.75}/>)}</svg>{nodes.map((node,i)=><div data-layout-check key={i} style={{...card,...enter(i),position:'absolute',left:node.x-145,top:node.y-50,width:290,minHeight:100,padding:'14px 18px',fontSize:24,textAlign:'center',lineHeight:1.5,overflowWrap:'anywhere',borderColor:`${accent}88`}}>{node.text}</div>)}<div data-layout-check style={{position:'absolute',left:cx-170,top:cy-65,width:340,minHeight:130,padding:26,borderRadius:30,border:`2px solid ${accent}`,background:panel,color:accent,display:'grid',placeItems:'center',fontSize:31,lineHeight:1.5,fontWeight:700,textAlign:'center',opacity:p(),overflowWrap:'anywhere'}}>{items[0]}</div></div>;
  }

  if(id==='progress-bar'){
    const value=m.value??100,fill=p()*value;
    return <div style={{...box,...card,padding:'46px 55px'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:30}}><div data-layout-check style={{fontSize:38,fontWeight:700,lineHeight:1.5,overflowWrap:'anywhere',flex:1}}>{items[0]}</div><div style={{fontSize:82,fontWeight:700,color:accent,fontVariantNumeric:'tabular-nums'}}>{Math.round(fill)}<span style={{fontSize:33}}>%</span></div></div><div style={{height:22,borderRadius:12,background:border,overflow:'hidden',margin:'30px 0'}}><div style={{height:'100%',width:`${fill}%`,borderRadius:12,background:accent}}/></div><div data-layout-check style={{fontSize:27,lineHeight:1.6,color:muted,overflowWrap:'anywhere'}}>{items.slice(1).join(' · ')}</div></div>;
  }

  if(id==='kpi-counter'){
    const data=m.data||[];
    return <div style={{...box,display:'grid',gridTemplateColumns:`repeat(${Math.min(3,data.length)},1fr)`,gap:22}}>{data.map((d,i)=><div key={i} style={{...card,...enter(i),padding:'24px 30px',display:'flex',flexDirection:'column',justifyContent:'center',borderLeft:`5px solid ${accent}`}}><div data-layout-check style={{fontSize:26,color:muted,lineHeight:1.6,overflowWrap:'anywhere',marginBottom:14}}>{d.label}</div><div style={{display:'flex',alignItems:'center',gap:12}}><RollingNumber value={d.value} progress={p(i)} color={ink}/>{(!m.unit||m.unit.length<=3)&&<span style={{fontSize:26,color:accent}}>{m.unit||''}</span>}</div>{m.unit&&m.unit.length>3&&<div style={{fontSize:22,color:accent,lineHeight:1.5,overflowWrap:'anywhere',marginTop:12}}>{m.unit}</div>}</div>)}</div>;
  }

  if(id==='bar-chart'){
    const data=m.data||[],max=Math.max(...data.map(d=>d.value),1);
    return <div style={{...box,...card,padding:'28px 50px 88px',display:'flex',alignItems:'flex-end',justifyContent:'space-around',gap:24}}>{data.map((d,i)=>{
      const height=d.value/max*205*p(i);
      return <div key={i} style={{flex:1,maxWidth:200,position:'relative',display:'flex',flexDirection:'column',alignItems:'center'}}><div style={{fontSize:Math.min(28,180/Math.max(1,chartValue(d.value,m.unit).length)),color:ink,marginBottom:12,opacity:p(i),fontVariantNumeric:'tabular-nums'}}>{chartValue(d.value,m.unit)}</div><div style={{width:'80%',height:Math.max(1,height),background:`linear-gradient(0deg,${accent}55,${accent})`,borderRadius:'12px 12px 0 0'}}/><div data-layout-check style={{position:'absolute',top:'100%',paddingTop:12,fontSize:d.label.length>10?18:23,color:muted,width:'100%',textAlign:'center',lineHeight:1.35,overflowWrap:'anywhere'}}>{d.label}</div></div>;
    })}</div>;
  }

  if(id==='line-chart'){
    const data=m.data||[],max=Math.max(...data.map(d=>d.value),1);
    const coords=data.map((d,i)=>({...d,x:105+i*1350/Math.max(1,data.length-1),y:240-d.value/max*170}));
    const path=coords.map((c,i)=>`${i===0?'M':'L'} ${c.x} ${c.y}`).join(' ');
    const draw=p();
    return <div style={{...box,...card}}><svg width="100%" height="100%" viewBox="0 0 1560 390">{[0,1,2,3].map(i=><line key={i} x1={75} x2={1490} y1={65+i*58} y2={65+i*58} stroke={border} strokeWidth={1}/>)}<path d={path} fill="none" stroke={accent} strokeWidth={5} pathLength={1} strokeDasharray={1} strokeDashoffset={1-draw} strokeLinecap="round" strokeLinejoin="round"/>{coords.map((c,i)=>{const show=draw>=i/Math.max(1,coords.length-1)&&local>=0;return <g key={i} opacity={show?1:0}><circle cx={c.x} cy={c.y} r={8} fill={accent}/><text x={c.x} y={c.y-21} textAnchor="middle" fill={ink} fontSize={25}>{chartValue(c.value,m.unit)}</text><text x={c.x} y={300} textAnchor="middle" fill={muted} fontSize={c.label.length>12?18:23}>{Array.from(c.label).reduce<string[]>((lines,char,index)=>{if(index%6===0)lines.push('');lines[lines.length-1]+=char;return lines;},[]).map((line,index)=><tspan key={index} x={c.x} dy={index===0?0:23}>{line}</tspan>)}</text></g>;})}</svg></div>;
  }

  if(id==='chat-demo'){
    return <div style={{...box,...card,padding:'18px 35px'}}><div style={{fontSize:21,color:muted,borderBottom:`1px solid ${border}`,paddingBottom:14,marginBottom:16}}>●　对话演示</div><div style={{display:'flex',flexDirection:'column',gap:12}}>{items.map((text,i)=>{
      const {title,detail}=split(text),right=i%2===0;
      return <div key={i} style={{...enter(i),alignSelf:right?'flex-end':'flex-start',maxWidth:'86%',display:'flex',alignItems:'center',gap:16,flexDirection:right?'row-reverse':'row'}}><div style={{width:42,height:42,borderRadius:14,background:`${accent}22`,display:'grid',placeItems:'center',fontSize:20,color:accent,flexShrink:0}}>{right?'问':'答'}</div><div data-layout-check style={{background:right?`${accent}28`:dark?'#24364a':'#edf1f7',border:`1px solid ${right?`${accent}66`:border}`,borderRadius:16,padding:'12px 22px',fontSize:items.length>3?23:29,lineHeight:1.5,overflowWrap:'anywhere'}}>{detail||title}</div></div>;
    })}</div></div>;
  }

  if(id==='chapter-card'){
    const chapter=spring({frame:Math.max(0,local),fps,config:{damping:200},durationInFrames:Math.max(1,Math.round(frames))});
    return <div style={{...box,display:'flex',alignItems:'center',gap:65}}><div style={{fontSize:160,fontWeight:700,color:accent,scale:interpolate(chapter,[0,1],[1.6,1]),opacity:p(),letterSpacing:-5,flexShrink:0}}>{(scene.id.match(/\d+/)?.[0]||'01').padStart(2,'0')}</div><div style={{width:3,height:220*p(),background:accent,flexShrink:0}}/><div style={{flex:1}}>{items.map((text,i)=><div data-layout-check key={i} style={{...enter(i),fontSize:items.length>3?28:37,lineHeight:1.6,color:i===0?ink:muted,margin:'14px 0',overflowWrap:'anywhere'}}>{text}</div>)}</div></div>;
  }
  return null;
}
