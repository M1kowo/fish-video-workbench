// Adapted from Onda Typewriter / WordStagger / Highlight and RenderComp TextMaskReveal.
// MIT notices and unmodified, pinned originals: third_party/motion/manifest.json.
import type {CSSProperties} from 'react';
import {interpolate, spring} from 'remotion';
import {getMotionTiming, splitMotionText} from '../../core/motions.mjs';
import type {Scene} from '../model';

const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
export function MotionTitle({scene,frame,fps,accent,style}:{scene:Scene;frame:number;fps:number;accent:string;style:CSSProperties}){
  const timing=getMotionTiming(scene);
  const local=frame-timing.delay*fps;
  const frames=Math.max(1,timing.duration*fps);
  const p=interpolate(local,[0,frames],[0,1],clamp);
  const text=scene.title;
  const id=scene.motion?.title;
  if(id==='typewriter'){
    const chars=Array.from(text),visible=Math.floor(p*chars.length);
    return <div data-layout-check style={{...style,position:'relative'}}><span style={{visibility:'hidden'}}>{text}</span><span style={{position:'absolute',inset:0}}>{chars.slice(0,visible).join('')}<span style={{color:accent,opacity:p<1&&local>=0&&Math.floor(local/(fps/2))%2===0?1:0}}>|</span></span></div>;
  }
  if(id==='word-stagger'){
    return <div data-layout-check style={style}>{splitMotionText(text).map((word:string,index:number)=>{
      const t=local-index*timing.stagger*fps;
      const s=spring({frame:Math.max(0,t),fps,config:{damping:200,stiffness:100,mass:1},durationInFrames:Math.max(1,Math.round(frames))});
      return <span key={index} style={{display:'inline-block',whiteSpace:'pre',opacity:interpolate(t,[0,frames*.65],[0,1],clamp),translate:`0px ${(1-s)*30}px`}}>{word}{/\s/.test(text)?' ':''}</span>;
    })}</div>;
  }
  if(id==='marker-highlight'){
    const width=interpolate(p,[.2,1],[0,100],clamp);
    return <div data-layout-check style={{...style,opacity:interpolate(p,[0,.3],[0,1],clamp)}}><span style={{backgroundImage:`linear-gradient(${accent}48,${accent}48)`,backgroundRepeat:'no-repeat',backgroundSize:`${width}% 45%`,backgroundPosition:'0 90%',boxDecorationBreak:'clone',WebkitBoxDecorationBreak:'clone'}}>{text}</span></div>;
  }
  const cover=interpolate(p,[0,.42],[0,1],clamp),reveal=interpolate(p,[.42,1],[0,1],clamp);
  return <div data-layout-check style={{...style,position:'relative',overflow:'hidden'}}><span style={{display:'block',clipPath:`inset(0 ${100-reveal*100}% 0 0)`,translate:`0px ${(1-reveal)*10}px`}}>{text}</span><div style={{position:'absolute',inset:0,background:accent,clipPath:`inset(0 ${(1-cover)*100}% 0 ${reveal*100}%)`,opacity:p<1?1:0}}/></div>;
}
