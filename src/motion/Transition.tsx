// Adapted from RenderComp SlideWipe, TransitionCircleWipe and CardFlipTransition (MIT).
// Scene children replace upstream's demo labels; narration time is never shortened.
import type {ReactNode,CSSProperties} from 'react';
import {AbsoluteFill,Easing} from 'remotion';

export function MotionTransition({id,progress,previous,current,background}:{id:string;progress:number;previous:ReactNode;current:ReactNode;background:string}){
  const p=Easing.inOut(Easing.cubic)(progress);
  let before:CSSProperties={},after:CSSProperties={};
  if(id==='slide-push'){
    before={translate:`${-p*100}% 0px`};after={translate:`${(1-p)*100}% 0px`};
  }else if(id==='circle-wipe'){
    // Farthest 1920×1080 corner is 1101 px from the centre.
    after={clipPath:`circle(${p*1120}px at 50% 50%)`};
  }else{
    before={transform:`rotateY(${p*180}deg)`,backfaceVisibility:'hidden'};
    after={transform:`rotateY(${p*180-180}deg)`,backfaceVisibility:'hidden'};
  }
  return <AbsoluteFill style={{overflow:'hidden',background,perspective:id==='card-flip'?2200:undefined}}><AbsoluteFill style={before}>{previous}</AbsoluteFill><AbsoluteFill style={after}>{current}</AbsoluteFill></AbsoluteFill>;
}
