import {AbsoluteFill,AnimatedImage,Sequence,interpolate,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import type {CharacterAsset,Project,Scene} from './model';
import {EditorialVisual} from './EditorialVisual';
import {PaperBackground,PaperHeading,paperPop} from './PaperStyle';
import {areCharactersEnabled} from '../core/themes.mjs';

export type VideoProps={project:Project;assetBaseUrl?:string};
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
function resolveAsset(base:string,src:string){return base?`${base.replace(/\/?$/,'/')}${src}`:staticFile(src);}
function Character({asset,height,base}:{asset:CharacterAsset;height:number;base:string}){
  const frame=useCurrentFrame();const {fps}=useVideoConfig();
  const [left,top,right,bottom]=asset.bounds;
  const scale=height/(bottom-top);const width=(right-left)*scale;
  return <div style={{width,height,overflow:'hidden',position:'relative',opacity:interpolate(frame,[0,0.25*fps],[0,1],clamp),translate:`0px ${interpolate(frame,[0,0.35*fps],[20,0],clamp)}px`}}>
    <AnimatedImage src={resolveAsset(base,asset.src)} width={Math.ceil(asset.canvas[0]*scale)} height={Math.ceil(asset.canvas[1]*scale)} fit="fill" loopBehavior="pause-after-finish" style={{position:'absolute',left:-left*scale,top:-top*scale}}/>
  </div>;
}

function Diagram({scene,localFrame,accent,dark,paper=false}:{scene:Scene;localFrame:number;accent:string;dark:boolean;paper?:boolean}){
  const {fps}=useVideoConfig();
  if(scene.visual)return <EditorialVisual scene={scene} localFrame={localFrame} accent={accent} dark={dark} paper={paper}/>;
  const ink=dark?'#f5f2ff':paper?'#304f68':'#30314a';const muted=dark?'#a6a8c3':paper?'#6c8b9f':'#9490a9';
  const surface=dark?'#282c47':paper?'#fffdf6d9':'#ffffff';
  const itemStyle=(index:number)=>paper?paperPop(localFrame,fps,index):({opacity:interpolate(localFrame,[0.25*fps+index*0.18*fps,0.6*fps+index*0.18*fps],[0,1],clamp),translate:`0px ${interpolate(localFrame,[0.25*fps+index*0.18*fps,0.6*fps+index*0.18*fps],[28,0],clamp)}px`});
  if(scene.type==='opening')return <div style={{marginTop:64,fontSize:38,color:muted,maxWidth:1130,lineHeight:1.7}}>{scene.items[0]||'把概念理顺，事情就简单了。'}</div>;
  if(scene.type==='comparison')return <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:40,marginTop:75,maxWidth:1590}}>{scene.items.slice(0,2).map((item,i)=>{const [title,...detail]=item.split('｜');return <div data-layout-check key={i} style={{...itemStyle(i),minHeight:295,padding:'48px 50px',background:i===1?`${accent}12`:surface,border:`2px solid ${i===1?`${accent}70`:dark?'#424561':'#e5e1ef'}`,borderRadius:24,position:'relative'}}><div style={{fontSize:25,letterSpacing:3,color:muted,marginBottom:28}}>{i===0?'METHOD / 方法':'ABILITY / 能力'}</div><div style={{fontSize:title.length>16?44:57,lineHeight:1.35,fontWeight:750,color:i===1?accent:ink,overflowWrap:'anywhere'}}>{title}</div>{detail.length>0&&<div style={{fontSize:32,lineHeight:1.5,color:muted,marginTop:20,overflowWrap:'anywhere'}}>{detail.join('｜')}</div>}</div>;})}</div>;
  if(scene.type==='flow'||scene.type==='recap'){
    const duration=scene.end-scene.start;
    const current=Math.min(scene.items.length-1,Math.floor(Math.max(0,localFrame/fps)/(duration/Math.max(1,scene.items.length))));
    return <div style={{display:'flex',alignItems:'stretch',gap:26,marginTop:90,maxWidth:1580}}>{scene.items.map((item,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:26,flex:1,minWidth:0,...itemStyle(i)}}><div data-layout-check style={{flex:1,minWidth:0,padding:'42px 34px',minHeight:230,borderRadius:22,background:i===current?`${accent}16`:surface,border:`2px solid ${i===current?`${accent}80`:dark?'#41445e':'#e5e1ef'}`,boxShadow:dark?'none':'0 12px 25px #28234005'}}><div style={{fontSize:24,color:muted,letterSpacing:3,marginBottom:27}}>0{i+1}</div><div style={{fontSize:scene.items.length>3?37:48,fontWeight:750,color:i===current?accent:ink,lineHeight:1.45,overflowWrap:'anywhere'}}>{item}</div></div>{i<scene.items.length-1&&<span style={{color:muted,fontSize:46}}>→</span>}</div>)}</div>;
  }
  return <div style={{display:'flex',gap:30,marginTop:72,maxWidth:1550,flexWrap:'wrap'}}>{scene.items.map((item,i)=><div data-layout-check key={i} style={{...itemStyle(i),padding:'35px 42px',background:surface,border:'1px solid '+(dark?'#41445e':'#e6e2f0'),borderRadius:20,maxWidth:scene.items.length===1?'100%':'48%',fontSize:42,fontWeight:500,lineHeight:1.6,color:ink,overflowWrap:'anywhere',boxShadow:'0 15px 30px #29234204'}}><span style={{color:accent,marginRight:18}}>✦</span>{item}</div>)}</div>;
}

export function VideoComposition({project,assetBaseUrl='/media/'}:VideoProps){
  const frame=useCurrentFrame();const {fps}=useVideoConfig();const time=frame/fps;
  const scene=project.scenes.find(s=>time>=s.start&&time<s.end)||[...project.scenes].reverse().find(s=>time>=s.start)||project.scenes[0];
  const cap=project.captions.find(c=>time*1000>=c.startMs&&time*1000<c.endMs);
  const localFrame=scene?frame-Math.round(scene.start*fps):frame;
  const paper=project.theme.background==='paper';
  const charactersEnabled=areCharactersEnabled(project.theme);
  const cover=paper&&scene?.type==='opening';
  const dark=!paper&&(scene?.type==='opening'||project.theme.background==='dark');
  const accent=project.theme.accent;const ink=dark?'#f3f1ff':paper?'#304f68':'#292c44';const muted=dark?'#9ea3c5':paper?'#6c879a':'#aaa4ba';
  const coverAsset=project.catalog.find(a=>a.id==='box_surprise');
  const char=scene?.character;const asset=project.catalog.find(a=>a.id===char?.assetId);
  const enter=scene?.transition==='none'?1:interpolate(localFrame,[0,0.35*fps],[0,1],clamp);
  return <AbsoluteFill style={{fontFamily:`"${project.theme.fontFamily}", "Microsoft YaHei", sans-serif`,background:dark?'#1b203b':'#f6f5fb',color:ink,overflow:'hidden'}}>
    {paper&&<PaperBackground grain={project.theme.grain??0.14} texture={resolveAsset(assetBaseUrl,'themes/paper-grain.svg')}/>}
    {!paper&&<AbsoluteFill style={{background:`radial-gradient(ellipse at ${75+Math.sin(time*0.15)*5}% 15%,${accent}${dark?'28':'12'},transparent 58%)`}}/>}
    {project.theme.background==='grid'&&!dark&&<AbsoluteFill style={{backgroundImage:'linear-gradient(#e9e5f050 1px,transparent 1px),linear-gradient(90deg,#e9e5f050 1px,transparent 1px)',backgroundSize:'70px 70px'}}/>}
    <div style={{position:'absolute',left:112,right:112,top:75,display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:25,color:muted,letterSpacing:3,zIndex:3}}><div style={{display:'flex',alignItems:'center',gap:16}}><span style={{width:16,height:16,borderRadius:8,background:accent}}/><span style={{fontWeight:650}}>{project.theme.brand}</span></div><span style={{fontSize:21,letterSpacing:2}}>{scene?`${String(project.scenes.indexOf(scene)+1).padStart(2,'0')} / ${String(project.scenes.length).padStart(2,'0')}`:'READY TO CREATE'}</span></div>
    {cover&&scene?<div style={{position:'absolute',left:112,right:112,top:175,opacity:enter,zIndex:2}}><div style={{fontSize:30,color:'#f7fcff',letterSpacing:3,textShadow:'0 2px 4px #24485d66',marginBottom:33}}>{scene.subtitle}</div><div style={{maxWidth:1270}}><PaperHeading text={scene.title} size={130} shadow={project.theme.shadow??0.65} fontFamily={project.theme.titleFontFamily||'Microsoft YaHei'} cover/></div><div style={{display:'inline-block',fontSize:34,color:'#3d6d91',fontWeight:700,marginTop:35,padding:'16px 25px',borderRadius:18,background:'#fffdf5a3',border:'2px solid #ffffffb0',rotate:'-1deg'}}>{scene.visual?.kind==='cta'?'安装教程 · 使用文档 · Agent 指令':'一句自然语言，连接 CAD 工作流。'}</div></div>:scene?<div style={{position:'absolute',left:112,right:112,top:scene.type==='opening'?245:205,opacity:enter,translate:`0px ${scene.transition==='slide'?interpolate(localFrame,[0,0.4*fps],[40,0],clamp):0}px`}}>
      <div style={{fontSize:27,color:muted,letterSpacing:4,marginBottom:28}}>{scene.subtitle}</div>
      {paper&&project.theme.titleStyle==='sticker'?<PaperHeading text={scene.title} size={scene.title.length>25?69:79} shadow={(project.theme.shadow??0.65)*0.7} fontFamily={project.theme.titleFontFamily||'Microsoft YaHei'}/>:<div data-layout-check style={{fontSize:scene.type==='opening'?102:scene.title.length>26?72:83,lineHeight:1.35,fontWeight:800,letterSpacing:-2,whiteSpace:'pre-line',maxWidth:scene.type==='opening'?1280:1620,overflowWrap:'anywhere'}}>{scene.title}</div>}
      <Diagram scene={scene} localFrame={localFrame} accent={accent} dark={dark} paper={paper}/>
    </div>:<div style={{margin:'auto',textAlign:'center'}}><div style={{fontSize:88,fontWeight:750}}>每一句讲解，都值得一个画面。</div><div style={{fontSize:36,color:muted,marginTop:35}}>字幕已就绪，等待分镜编排</div></div>}
    {charactersEnabled&&cover&&scene&&project.theme.coverCharacter!==false&&coverAsset&&<Sequence name="封面大角色" from={Math.round(scene.start*fps)} durationInFrames={Math.max(1,Math.round((scene.end-scene.start)*fps))} premountFor={fps}><div style={{position:'absolute',right:-170,bottom:-270,zIndex:2}}><Character asset={coverAsset} height={800} base={assetBaseUrl}/></div></Sequence>}
    {charactersEnabled&&!cover&&scene&&char&&asset&&<Sequence name={`角色 ${asset.name}`} from={Math.round((scene.start+char.delay)*fps)} durationInFrames={Math.max(1,Math.round(char.duration*fps))} premountFor={fps}><div style={{position:'absolute',[char.position==='left'?'left':'right']:100,bottom:scene.type==='opening'?240:195}}><Character asset={asset} height={char.height} base={assetBaseUrl}/></div></Sequence>}
    {cap&&<div style={{position:'absolute',left:cover?140:250,right:cover?400:250,bottom:78,zIndex:5,display:'flex',justifyContent:'center',textAlign:'center'}}><div data-layout-check style={{fontFamily:`"${project.theme.fontFamily}",sans-serif`,fontSize:cap.text.length>34?42:49,fontWeight:750,lineHeight:1.55,maxWidth:1320,overflowWrap:'anywhere',padding:project.theme.captionStyle==='clean'?'15px 32px':0,borderRadius:16,background:project.theme.captionStyle==='clean'?(dark?'#30344ce8':'#fffffff2'):'transparent',color:project.theme.captionStyle==='outlined'?'#ffffff':project.theme.captionStyle==='neon'?'#142007':project.theme.captionStyle==='minimal'?'#fff':ink,paintOrder:'stroke fill',WebkitTextStroke:project.theme.captionStyle==='outlined'?'5px #325b78':project.theme.captionStyle==='minimal'?'1.5px #26233c':project.theme.captionStyle==='neon'?'1px #192211':undefined,textShadow:project.theme.captionStyle==='outlined'?'0 4px 4px #21405866':project.theme.captionStyle==='neon'?'0 0 5px #b5ff54,0 0 14px #a5ff3c,0 0 28px #8cff00':project.theme.captionStyle==='minimal'?'0 2px 8px #0008':'none'}}>{cap.text}</div></div>}
    <div style={{position:'absolute',left:112,right:112,bottom:35,height:3,background:dark?'#ffffff0c':'#3e36500a'}}><div style={{height:'100%',width:`${Math.min(100,time/project.duration*100)}%`,background:`${accent}70`}}/></div>
    {project.audio&&<Audio src={resolveAsset(assetBaseUrl,project.audio.src)} premountFor={fps}/>}
  </AbsoluteFill>;
}
