"""Export untouched connected browser takes using their original event timestamps."""
from pathlib import Path
import json, subprocess, concurrent.futures
ROOT=Path(__file__).resolve().parent
shots=json.loads((ROOT/'edit-decision-list.json').read_text())
names=sorted({s[k] for s in shots for k in ('clip','extra') if s[k]})
def export(name):
 folder=ROOT/'clips/journey'/name;m=json.loads((folder/'manifest.json').read_text());frames=m['frames'];lines=[]
 for i,f in enumerate(frames):
  end=frames[i+1]['timestamp'] if i+1<len(frames) else m['end']
  lines.extend(['file '+str(folder/f['file']),f'duration {max(.001,end-f["timestamp"]):.6f}'])
 lines.append('file '+str(folder/frames[-1]['file']))
 listing=folder/'frames.ffconcat';listing.write_text('\n'.join(lines))
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(listing),'-vf','fps=30,setsar=1','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p',str(folder.with_suffix('.mp4'))],check=True)
 print(name,flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(export,names))
