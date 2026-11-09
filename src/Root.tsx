import {Composition} from 'remotion';
import {VideoComposition} from './Video';
import {demoProject} from '../core/project.mjs';
import catalog from '../public/characters/catalog.json';
import type {Project} from './model';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="FishVideo" component={VideoComposition} width={1920} height={1080} fps={30} durationInFrames={840} defaultProps={{project:demoProject(catalog) as Project,assetBaseUrl:''}} calculateMetadata={({props})=>({width:props.project.settings.width,height:props.project.settings.height,fps:props.project.settings.fps,durationInFrames:Math.max(1,Math.ceil(props.project.duration*props.project.settings.fps))})}/>
    </>
  );
};
