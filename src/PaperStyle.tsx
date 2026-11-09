import type {CSSProperties} from 'react';
import {AbsoluteFill,interpolate} from 'remotion';

export function PaperBackground({grain,texture}:{grain:number;texture:string}){
  return <>
    <AbsoluteFill style={{background:'linear-gradient(112deg,#a6cce7 0%,#c6dce7 35%,#e5eae5 65%,#f8f4eb 100%)'}}/>
    <AbsoluteFill style={{background:'radial-gradient(ellipse at 13% 35%,#79b0db35,transparent 60%),radial-gradient(ellipse at 82% 25%,#fffdf34d,transparent 60%)'}}/>
    <AbsoluteFill style={{backgroundImage:`url("${texture}")`,backgroundRepeat:'repeat',backgroundSize:'384px 384px',mixBlendMode:'multiply',opacity:grain,pointerEvents:'none'}}/>
    <svg viewBox="0 0 1920 1080" aria-hidden="true" style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}>
      <g fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity=".6">
        <path d="M1485 142 C1455 130 1459 90 1485 85 C1496 51 1544 54 1554 88 C1585 95 1580 135 1553 143 Z M1470 111 Q1514 99 1570 108 M1504 146 L1507 155 L1534 155 L1538 145 M1519 45 L1521 32 M1483 51 L1476 39 M1552 57 L1560 44"/>
        <path d="M95 791 Q114 769 132 791 Q150 814 169 790 M112 830 L116 847 M159 831 L164 842 M1725 270 L1733 249 L1742 269 L1763 279 L1741 287 L1734 308 L1724 287 L1705 280 Z"/>
        <path d="M154 115 L161 93 L170 114 L191 122 L170 132 L162 153 L153 132 L132 123 Z M1790 828 Q1816 800 1833 827 Q1815 847 1835 860" opacity=".7"/>
      </g>
    </svg>
  </>;
}

export function stickerTextStyle(size:number,shadow:number,emphasis=false):CSSProperties{
  return {fontSize:size,fontWeight:700,lineHeight:1.35,letterSpacing:2,color:emphasis?'#244e6c':'#28516e',WebkitTextStroke:'0px',textShadow:shadow>0?`0 1px 1px rgba(18,42,55,${shadow*0.12})`:'none'};
}

export function PaperHeading({text,size,shadow,fontFamily,cover=false}:{text:string;size:number;shadow:number;fontFamily:string;cover?:boolean}){
  const parts=cover?text.split('，'):[];
  return <div data-layout-check style={{fontFamily:`"${fontFamily}","Microsoft YaHei",sans-serif`,whiteSpace:'pre-line',overflowWrap:'anywhere',rotate:cover?'-1deg':'-0.35deg',...stickerTextStyle(size,shadow,!cover)}}>
    {cover&&parts.length>1?<><div style={stickerTextStyle(size+7,shadow,true)}>{parts[0]}，</div><div style={{marginTop:12,...stickerTextStyle(size,shadow,false)}}>{parts.slice(1).join('，')}</div></>:text}
  </div>;
}

export function paperPop(frame:number,fps:number,index=0){
  const delay=index*0.13*fps;
  const value=interpolate(frame,[delay,delay+0.32*fps,delay+0.48*fps,delay+0.62*fps],[0,1.035,0.995,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return {opacity:interpolate(frame,[delay,delay+0.2*fps],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}),translate:`0px ${(1-value)*24}px`,scale:0.96+0.04*value};
}
