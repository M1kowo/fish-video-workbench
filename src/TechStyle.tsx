import type {ReactNode} from 'react';
import {AbsoluteFill,interpolate} from 'remotion';
import type {Project,Scene} from './model';
import {getTechScene} from '../core/tech.mjs';
import {TechSceneStage} from './TechScenes';
import {MotionTemplate} from './motion/Templates';
import {MotionTitle} from './motion/Title';

const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
export function TechFrame({project,scene,frame,localFrame,fps,children}:{project:Project;scene:Scene;frame:number;localFrame:number;fps:number;children:ReactNode}){
  const accent=project.theme.accent,time=frame/fps;
  const index=project.scenes.indexOf(scene),preset=getTechScene(scene.visual?.kind);
  const enter=interpolate(localFrame,[0,fps*.35],[0,1],clamp);
  const titleStyle={fontSize:scene.title.length>26?48:64,fontWeight:700,lineHeight:1.35,color:'#f2f5fa',whiteSpace:'pre-line' as const,overflowWrap:'anywhere' as const,maxWidth:1390};
  const nodes=Array.from({length:14},(_,i)=>({x:60+(i*139)%1800,y:250+(i*107)%630}));
  return <AbsoluteFill data-tech-frame style={{background:'#090e16',fontFamily:`"${project.theme.fontFamily}","Microsoft YaHei",sans-serif`,overflow:'hidden',color:'#eff4fa'}}>
    <AbsoluteFill style={{background:`radial-gradient(ellipse at ${35+Math.sin(time*.08)*12}% 52%,${accent}0e,transparent 58%),radial-gradient(ellipse at 85% 30%,#7254a50b,transparent 50%)`}}/>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{position:'absolute',inset:0,pointerEvents:'none'}}>{nodes.map((n,i)=><g key={i} opacity={.12}><circle cx={n.x} cy={n.y+Math.sin(time*.2+i)*5} r={i%3+2} fill={accent}/>{i%2===0&&i<nodes.length-1&&<path d={`M${n.x} ${n.y} L${nodes[i+1].x} ${nodes[i+1].y}`} stroke={accent} strokeWidth={.6}/>}</g>)}<path d="M34 280 V990 M34 344 H48 M34 568 H48 M34 792 H48" stroke="#7997b82a" fill="none"/><text x={1780} y={820} fontSize={90} fill="#94b3d00b">λ</text><text x={1020} y={320} fontSize={65} fill="#94b3d00c">∂</text></svg>
    <svg width="100%" height="100%" style={{position:'absolute',inset:0,opacity:project.theme.grain??.06,pointerEvents:'none'}}><filter id={`tech-grain-${index}`}><feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves={2} seed={23}/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter={`url(#tech-grain-${index})`}/></svg>
    <div style={{position:'absolute',left:120,top:56,fontSize:20,letterSpacing:4,color:accent,fontFamily:'Consolas,"Microsoft YaHei",monospace'}}>{project.theme.brand} · {String(index+1).padStart(2,'0')} / {String(project.scenes.length).padStart(2,'0')}</div>
    <svg width={70} height={70} viewBox="0 0 70 70" style={{position:'absolute',left:38,top:60}}><path d="M9 45 L25 10 L43 50 L62 20" fill="none" stroke={`${accent}aa`} strokeWidth={1}/>{[[9,45],[25,10],[43,50],[62,20]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i===1?6:3} fill={accent}/>)}</svg>
    <div style={{position:'absolute',left:120,top:107,opacity:enter}}>{scene.motion?.title?<MotionTitle scene={scene} frame={localFrame} fps={fps} accent={accent} style={titleStyle}/>:<div data-layout-check style={titleStyle}><span style={{backgroundImage:`linear-gradient(${accent},${accent})`,backgroundSize:`${interpolate(localFrame,[fps*.2,fps*.9],[0,100],clamp)}% 3px`,backgroundPosition:'0 100%',backgroundRepeat:'no-repeat'}}>{scene.title}</span></div>}</div>
    <div style={{position:'absolute',left:122,top:255,fontSize:26,color:'#a4b2c2',letterSpacing:2}}>{scene.subtitle}</div>
    <div style={{position:'absolute',left:1640,top:70,borderLeft:'1px solid #7a8d9d66',paddingLeft:32}}><div style={{fontSize:60,fontWeight:700,lineHeight:1.1}}>{String(index+1).padStart(2,'0')}</div><div style={{fontSize:21,color:'#8c9bad',marginTop:12}}>/ {String(project.scenes.length).padStart(2,'0')}</div><div style={{fontSize:19,color:accent,marginTop:12}}>{preset?.name||'讲解演示'}</div></div>
    <div style={{position:'absolute',left:120,right:120,top:305,height:1,background:'#8dabc329'}}><div style={{height:2,width:240*enter,background:accent}}/></div>
    <div style={{position:'absolute',left:120,top:327,fontSize:20,color:accent,letterSpacing:3,fontFamily:'Consolas,"Microsoft YaHei",monospace'}}>{preset?.name||'KNOWLEDGE / 核心内容'} <span style={{color:'#697f94',fontSize:17,letterSpacing:1,marginLeft:18}}>流程示意</span></div>
    <div style={{position:'absolute',left:120,top:370,width:1680,height:480,opacity:enter}}>{!preset&&scene.motion?.template?<div style={{position:'absolute',left:60,top:0,width:1560}}><MotionTemplate scene={scene} frame={localFrame} fps={fps} accent={accent} dark paper={false}/></div>:<TechSceneStage scene={scene} frame={localFrame} fps={fps} accent={accent}/>}</div>
    <div style={{position:'absolute',left:0,right:0,top:895,bottom:0,background:'#050810'}}/>
    {children}
    <div style={{position:'absolute',left:120,right:120,bottom:25,height:2,background:'#7a97b817'}}><div style={{height:'100%',width:`${Math.min(100,frame/fps/project.duration*100)}%`,background:`${accent}88`}}/></div>
  </AbsoluteFill>;
}
