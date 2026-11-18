// Adapted from Onda DynamicGrid, MeshGradient and GrainOverlay (MIT).
// Pure frame evaluation; upstream source and notices: third_party/motion/.
import {AbsoluteFill} from 'remotion';
import type {MotionOptions} from '../model';

export function MotionBackground({motion,frame,fps,accent,id}:{motion:MotionOptions;frame:number;fps:number;accent:string;id:string}){
  const intensity=motion.intensity??.5;
  if(motion.background==='grid-flow'){
    const offset=(frame/fps*12)%70;
    return <AbsoluteFill style={{overflow:'hidden',pointerEvents:'none'}}><div style={{position:'absolute',inset:-70,translate:`${-offset}px ${-offset}px`,backgroundImage:`linear-gradient(${accent}35 1px,transparent 1px),linear-gradient(90deg,${accent}35 1px,transparent 1px)`,backgroundSize:'70px 70px',opacity:intensity*.6}}/></AbsoluteFill>;
  }
  if(motion.background==='mesh-gradient'){
    const t=frame/fps;
    const gradients=[accent,'#3e9ae8','#b991ed'].map((color,i)=>`radial-gradient(circle at ${35+i*15+Math.sin(t*.18+i*2)*18}% ${45+Math.cos(t*.15+i*2)*25}%,${color} 0%,transparent 48%)`);
    return <AbsoluteFill style={{backgroundImage:gradients.join(','),opacity:intensity*.35,filter:'blur(8px)',pointerEvents:'none'}}/>;
  }
  if(motion.background==='film-grain'){
    const filterId=`motion-grain-${id.replace(/[^a-zA-Z0-9_-]/g,'')}`;
    return <AbsoluteFill style={{opacity:intensity*.13,pointerEvents:'none'}}><svg width="100%" height="100%"><filter id={filterId}><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves={3} seed={17} stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0"/></filter><rect width="100%" height="100%" filter={`url(#${filterId})`}/></svg></AbsoluteFill>;
  }
  return null;
}
