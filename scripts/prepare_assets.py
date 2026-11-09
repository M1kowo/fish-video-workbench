from pathlib import Path
from PIL import Image
import json, shutil

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r'C:\Users\XuJiu\Desktop\GIF')
TARGET = ROOT / 'public' / 'characters'
TARGET.mkdir(parents=True, exist_ok=True)
LABELS = {
    '1.0.gif': ('box_surprise', '开盒 · 惊喜', ['发现', '揭晓', '成果']),
    '1.gif': ('box_surprise_variant', '开盒 · 小画布变体', ['发现', '揭晓', '成果']),
    '10.gif': ('swing', '荡秋千 · 轻松', ['轻松', '等待', '收尾']),
    '12.gif': ('lean_forward', '探头 · 关注', ['提问', '观察', '注意']),
    '13.gif': ('gaming_frustration', '打游戏 · 抓狂', ['痛点', '失败', '误区']),
}
catalog=[]
for filename,(asset_id,label,tags) in LABELS.items():
    original=SOURCE/filename
    destination=TARGET/filename
    if original.exists(): shutil.copy2(original,destination)
    elif not destination.exists(): continue
    im=Image.open(destination)
    bounds=None
    duration=0
    for i in range(im.n_frames):
        im.seek(i)
        duration+=im.info.get('duration',100)
        box=im.convert('RGBA').getchannel('A').getbbox()
        if box: bounds=box if bounds is None else (min(bounds[0],box[0]),min(bounds[1],box[1]),max(bounds[2],box[2]),max(bounds[3],box[3]))
    im.seek(int(im.n_frames*0.25))
    thumb=im.convert('RGBA').crop(bounds)
    thumb.thumbnail((300,300))
    thumb.save(TARGET/f'{asset_id}.png')
    catalog.append({'id':asset_id,'name':label,'tags':tags,'src':f'characters/{filename}','thumbnail':f'characters/{asset_id}.png','duration':duration/1000,'canvas':[im.width,im.height],'bounds':list(bounds),'loop':'once'})
(TARGET/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Prepared {len(catalog)} character assets')
