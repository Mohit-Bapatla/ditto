"""Reproduce the silent edit: Python 3 + Pillow, ffmpeg/ffprobe. Run from repo root.
Source frames are genuine browser screencasts. Their event timestamps are retained.
No generated graphic represents an application response or vote.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import subprocess, json, textwrap, concurrent.futures
ROOT=Path(__file__).resolve().parent
REPO=ROOT.parents[2]
G=ROOT/'graphics'; W=ROOT/'work'; C=ROOT/'clips'
for p in [G,W,C]:p.mkdir(exist_ok=True)
BG='#FFF9F8'; INK='#241E21'; RED='#C93550'; MUTED='#66565D'; GREEN='#216C4B'
FONT=REPO/'public/fonts'
def font(n,bold=False,display=False):return ImageFont.truetype(str(FONT/('syne-700.ttf' if display else 'manrope-700.ttf' if bold else 'manrope-400.ttf')),n)
def text(im,xy,s,size=36,color=INK,width=38,display=False,bold=False,spacing=12):
 d=ImageDraw.Draw(im);x,y=xy
 for para in s.split('\n'):
  for line in textwrap.wrap(para,width=width) or ['']:
   d.text((x,y),line,font=font(size,bold,display),fill=color);y+=size+spacing
 return y
logo=Image.open(REPO/'public/brand/official/logo-horizontal.webp').convert('RGBA')
def paste_logo(im,x=120,y=80,w=250):
 l=logo.copy();l.thumbnail((w,200));im.paste(l,(x,y),l)
def base(title='',sub='',foot='',phone=True):
 im=Image.new('RGB',(1920,1080),BG);d=ImageDraw.Draw(im);paste_logo(im)
 if title:text(im,(120,320),title,76,width=21,display=True,spacing=10)
 if sub:text(im,(124,625),sub,32,color=MUTED,width=41,spacing=13)
 if foot:text(im,(124,962),foot,22,color=MUTED,width=75)
 if phone:d.rounded_rectangle((1118,48,1562,1030),radius=48,fill='#292326')
 return im
# Rounded alpha mask applied to real footage, with a thin device surround.
mask=Image.new('L',(420,946),0);ImageDraw.Draw(mask).rounded_rectangle((0,0,419,945),radius=32,fill=255);mask.save(G/'phone-mask.png')
def save(im,name):im.save(G/(name+'.png'));return name
# Illustrative messaging is visibly distinguished from real product footage.
messages=[('Mohit','What are we doing tonight?'),('Edwin','Bowling?'),('Paxton',"I’m down for whatever"),('Mohit','Maybe food instead?'),('Edwin','idk…')]
for count in range(1,6):
 im=base('The hardest part?\nMaking the plan.', 'Three friends. Too many options.', 'Illustrative conversation',False);d=ImageDraw.Draw(im)
 d.rounded_rectangle((1070,50,1600,1025),48,fill='#292326');d.rounded_rectangle((1083,64,1587,1011),36,fill='white')
 text(im,(1120,110),'Weekend Crew',30,bold=True);text(im,(1120,155),'Mohit · Edwin · Paxton',21,color=MUTED)
 y=235
 for who,msg in messages[:count]:
  right=who=='Mohit';x=1190 if right else 1110;w=360;h=115 if len(msg)>26 else 95
  text(im,(x,y-28),who,20,color=MUTED)
  d.rounded_rectangle((x,y,x+w,y+h),22,fill=RED if right else '#F2ECEE')
  text(im,(x+20,y+18),msg,27,color='white' if right else INK,width=23,spacing=7);y+=h+55
 save(im,f'chat-{count}')
im=base("Making plans\nshouldn’t be\nthis hard.", 'Less back-and-forth. More time together.', 'Illustrative opening',False)
chat=Image.open(G/'chat-5.png');im.paste(chat.crop((1070,50,1601,1026)),(1070,50));save(im,'problem')
im=Image.new('RGB',(1920,1080),BG);endmark=Image.open(REPO/'public/brand/official/logo-stacked.png').convert('RGBA');endmark.thumbnail((550,550));im.paste(endmark,((1920-endmark.width)//2,150),endmark);tag='Less scrolling. More doing.';tw=ImageDraw.Draw(im).textbbox((0,0),tag,font=font(52,display=True))[2];text(im,((1920-tw)//2,790),tag,52,display=True,width=40);save(im,'logo')
# All external captions describe the authentic clip, never overwrite app state.
plates={
 'intro':('Swipe. Match.\nMake plans.','Your next good memory starts here.',''),
 'discover':('Find your\nnext yes.','Explore activities. Make room for something new.','Actual Ditto mobile interface'),
 'filter':('Your interests.\nYour kind of day.','Choose a category, a city, and a budget.',''),
 'pass':('Not your thing?\nPass.','Physical swipes. Immediate feedback.',''),
 'ditto':('That’s a ditto.','Save an activity you’d love to try.',''),
 'details':('Know the details.','Location, timing, and estimated cost before you decide.',''),
 'saved':('Good ideas\nstay with you.','Return to your interested activities anytime.',''),
 'circles':('Bring your\npeople.','Weekend Crew. Build Break. After Hours. Side Quests.',''),
 'chat':('Start with a\nconversation.','Real preferences, shared with your Circle.','Isolated showcase · sample conversation'),
 'muse':('Scattered ideas.\nClear possibilities.','Meta Muse Spark turns selected messages into a reviewable proposal.','Real model response · waiting time shortened'),
 'suggestion':('A plan starts\ntaking shape.','Bouldering. Monday at 6. A budget to review together.','AI suggests. People decide.'),
 'venues':('Ideas meet\nreal places.','SerpApi retrieves nearby venues and location information.','Real venue listings · hours and prices require verification'),
 'mohit':('Everyone\nhas a say.','Mohit wants to go bouldering.','Real session · recorded independently'),
 'edwin':('Different tastes.\nCommon ground.','Edwin likes pickleball—and bouldering.','Real session · recorded independently'),
 'paxton':('Room for\nevery opinion.','Paxton is open to both.','Real session · recorded independently'),
 'consensus':('One shared yes.','Bouldering earns three out of three votes.','Consensus is calculated from saved votes'),
 'approve':('Review it.\nMake it real.','A proposal becomes a plan when the group approves.','Actual approvals · no reservation is made'),
 'confirmed':('Everyone’s in.','Three approvals. One shared plan.','Bouldering Project – Springdale'),
 'calendar':('From “we should”\nto “let’s go”.','Monday, October 26 · 6 PM\nBouldering in Austin','Actual confirmed plan'),
 'export':('Take the plan\nwith you.','Download a calendar file and add it to your own calendar.','ICS export succeeded · no external event was created'),
 'closing':('Put the phone\ndown. Go live it.','Less scrolling. More doing.',''),
}
for k,v in plates.items():save(base(*v),k)
# Explanatory architecture: application logic, model work, and retrieval stay distinct.
steps=[('Group conversation','Only messages the user selects'),('Meta Muse Spark','Conversation understanding + planning'),('Structured suggestions','Human review before adding ideas'),('SerpApi venue discovery','Real place listings and locations'),('Ditto application logic','Votes · consensus · approvals · SQLite')]
for active in range(5):
 im=Image.new('RGB',(1920,1080),BG);paste_logo(im,100,65,220);text(im,(100,210),'How a conversation\nbecomes a plan.',64,display=True,width=28)
 d=ImageDraw.Draw(im)
 for i,(name,desc) in enumerate(steps):
  y=415+i*112;color=RED if i==active else INK
  d.ellipse((108,y+13,122,y+27),fill=color)
  if i<4:d.line((115,y+40,115,y+108),fill='#DCCCD0',width=2)
  text(im,(150,y),name,32,color=color,bold=i==active,width=45)
  text(im,(150,y+45),desc,23,color=MUTED,width=55)
 d.rounded_rectangle((1200,130,1748,950),35,fill='#292326')
 save(im,f'architecture-{active}')
im=Image.new('RGB',(1920,1080),BG);paste_logo(im,120,90,260);text(im,(120,280),'Built to bring\npeople together.',76,display=True,width=25)
for i,(a,b) in enumerate([('Next.js + React','The mobile-first experience'),('TypeScript + SQLite','Application logic and persistence'),('Railway','Persistent Node.js hosting'),('Meta Muse Spark','AI-assisted planning'),('SerpApi','Real-world venue discovery')]):
 y=250+i*135;text(im,(1040,y),a,36,bold=True,width=35);text(im,(1040,y+52),b,26,color=MUTED,width=39)
save(im,'tech')
# An edit decision list: exact lengths sum to 180 seconds. Offsets remove idle wait only.
shots=[]
def shot(name,dur,plate,clip=None,start=0,mode='phone',extra=None):shots.append(dict(name=name,dur=dur,plate=plate,clip=clip,start=start,mode=mode,extra=extra))
for i in range(1,5):shot(f'opening-{i}',2,f'chat-{i}',mode='graphic')
shot('problem',8,'problem',mode='graphic');shot('brand',4,'logo',mode='graphic')
shot('intro',10,'intro','09-discover-clean')
shot('filters',6,'filter','29-filter',.7)
shot('pass',6,'pass','10-left-clean')
shot('ditto',6,'ditto','11-right-clean')
shot('details',4,'details','12-details-clean',.8)
shot('saved',3,'saved','30-saved')
shot('circles',6,'circles','13-circles-clean',.9)
shot('chat',7,'chat','27-chat-clean')
shot('muse-processing',3,'muse','28-muse-clean',1)
shot('muse-result',4,'suggestion','08-ai-result')
shot('venues',5,'venues','31-venues-result',1.2)
shot('mohit',7,'mohit','14-mohit-votes',5.7)
shot('friends',7,'edwin','15-edwin-votes',5.7,'duo','16-paxton-votes')
shot('progress',6,'paxton','16-paxton-votes',7.2)
shot('consensus',5,'consensus','17-consensus',.7)
shot('approve-paxton',2,'approve','19-paxton-approval',.7)
shot('approve-mohit',3,'approve','20-mohit-approval',.7)
shot('confirmed',4,'confirmed','21-confirmed',1)
shot('calendar',4,'calendar','24-calendar-day',1)
shot('export',2,'export','22-calendar-export',.8)
shot('architecture-input',8,'architecture-0','27-chat-clean',0,'architecture')
shot('architecture-model',4,'architecture-1','28-muse-clean',1,'architecture')
shot('architecture-suggestion',4,'architecture-2','08-ai-result',0,'architecture')
shot('architecture-venues',7,'architecture-3','31-venues-result',1,'architecture')
shot('architecture-logic',7,'architecture-4','17-consensus',1,'architecture')
shot('technology',9,'tech',mode='graphic')
shot('montage-swipe',3,'ditto','11-right-clean',.4)
shot('montage-chat',2,'chat','27-chat-clean')
shot('montage-match',2,'consensus','17-consensus',1)
shot('montage-approved',2,'confirmed','21-confirmed',2)
shot('closing-app',7,'closing','25-calendar-detail',1)
shot('final',5,'logo',mode='graphic')
assert sum(s['dur'] for s in shots)==180,sum(s['dur'] for s in shots)
(ROOT/'edit-decision-list.json').write_text(json.dumps(shots,indent=2))
def run(args):
 p=subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y']+args,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 if p.returncode:raise RuntimeError(p.stderr.decode()[-4000:])
def encode_source(name):
 folder=C/name;meta=json.loads((folder/'manifest.json').read_text());frames=meta['frames'];lines=[]
 for i,f in enumerate(frames):
  nxt=frames[i+1]['timestamp'] if i+1<len(frames) else meta['end']
  duration=max(.001,nxt-f['timestamp']);lines+=['file '+str((folder/f['file']).resolve()),f'duration {duration:.6f}']
 lines+=['file '+str((folder/frames[-1]['file']).resolve())];lst=folder/'frames.ffconcat';lst.write_text('\n'.join(lines))
 out=C/(name+'.mp4')
 run(['-f','concat','-safe','0','-i',str(lst),'-vf','fps=30,scale=780:1688:force_original_aspect_ratio=disable,setsar=1','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p',str(out)])
 return name
sources=sorted(set(s['clip'] for s in shots if s['clip'])|set(s['extra'] for s in shots if s['extra']))
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:
 for name in ex.map(encode_source,sources):print('source',name,flush=True)
def render(item):
 idx,s=item;out=W/f'{idx:02d}-{s["name"]}.mp4';bg=G/(s['plate']+'.png');dur=s['dur'];args=['-loop','1','-framerate','30','-i',str(bg)]
 if s['mode']=='graphic':filters='[0:v]format=yuv420p[v]'
 else:
  args+=['-ss',str(s['start']),'-i',str(C/(s['clip']+'.mp4'))]
  if s['mode']=='duo':
   # Two large independently recorded views, clearly labeled; no claim of simultaneous filming.
   im=Image.new('RGB',(1920,1080),BG);paste_logo(im,80,55,200);text(im,(80,255),'Everyone\nhas a say.',64,display=True,width=15);text(im,(80,500),'Independent votes.\nA shared decision.',29,color=MUTED,width=25)
   text(im,(690,48),'Edwin',30,bold=True);text(im,(1250,48),'Paxton',30,bold=True);text(im,(80,970),'Separate sessions · recorded sequentially',20,color=MUTED,width=48)
   im.save(G/'duo.png');args[5]=str(G/'duo.png')
   args+=['-ss',str(s['start']),'-i',str(C/(s['extra']+'.mp4'))]
   filters='[1:v]crop=750:1688:0:0,scale=410:922,setsar=1,tpad=stop_mode=clone:stop_duration=20[p1];[2:v]crop=750:1688:0:0,scale=410:922,setsar=1,tpad=stop_mode=clone:stop_duration=20[p2];[0:v][p1]overlay=630:112[a];[a][p2]overlay=1190:112,format=yuv420p[v]'
  elif s['mode']=='architecture':
   filters='[1:v]crop=750:1125:0:0,scale=520:780,setsar=1,tpad=stop_mode=clone:stop_duration=20[p];[0:v][p]overlay=1214:150,format=yuv420p[v]'
  else:
   args+=['-loop','1','-i',str(G/'phone-mask.png')]
   filters='[1:v]crop=750:1688:0:0,scale=420:946,setsar=1,tpad=stop_mode=clone:stop_duration=20,format=rgb24[p];[p][2:v]alphamerge[round];[0:v][round]overlay=1130:64,format=yuv420p[v]'
 args+=['-filter_complex',filters,'-map','[v]','-t',str(dur),'-r','30','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(out)]
 run(args);print('render',idx,s['name'],flush=True);return out
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:outputs=list(ex.map(render,enumerate(shots)))
listing=W/'timeline.ffconcat';listing.write_text('\n'.join('file '+str(p) for p in outputs))
run(['-f','concat','-safe','0','-i',str(listing),'-c','copy','-an','-movflags','+faststart',str(ROOT/'ditto-demo-silent.mp4')])
run(['-ss','6.7','-i',str(C/'14-mohit-votes.mp4'),'-frames:v','1',str(W/'thumbnail-source.png')])
thumb=Image.open(G/'intro.png').convert('RGB');ui=Image.open(W/'thumbnail-source.png').crop((0,0,750,1688)).resize((420,946),Image.Resampling.LANCZOS);thumb.paste(ui,(1130,64),Image.open(G/'phone-mask.png'));thumb.save(ROOT/'thumbnail.png')
print('DONE',ROOT/'ditto-demo-silent.mp4')
