// Keep browser/bundler temporary files beside local render data. This only changes
// this Node process and its children, never Windows' global environment settings.
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const renderTemp=process.env.FISH_RENDER_TEMP||path.join(root,'data','render-temp');
mkdirSync(renderTemp,{recursive:true});
process.env.TEMP=renderTemp;
process.env.TMP=renderTemp;
