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
 d.rounded_rectangle((1118,48,1562,1030),48,fill='#292326')
 save(im,f'architecture-{active}')
im=Image.new('RGB',(1920,1080),BG);paste_logo(im,120,90,260);text(im,(120,280),'Built to bring\npeople together.',76,display=True,width=25)
for i,(a,b) in enumerate([('Next.js + React','The mobile-first experience'),('TypeScript + SQLite','Application logic and persistence'),('Railway','Persistent Node.js hosting'),('Meta Muse Spark','AI-assisted planning'),('SerpApi','Real-world venue discovery')]):
 y=250+i*135;text(im,(1040,y),a,36,bold=True,width=35);text(im,(1040,y+52),b,26,color=MUTED,width=39)
save(im,'tech')
# Connected journey edit. Every transition is real; only AI waiting is shortened.
import bisect, functools, math
J=C/'journey'
shots=[]
def add(name,dur,plate,clip=None,start=0,extra=None,hold=None):
 shots.append(dict(name=name,dur=dur,plate=plate,clip=clip,start=start,extra=extra,hold=hold))
for i in range(1,5):add(f'opening-{i}',2,f'chat-{i}')
add('problem',8,'problem');add('open-ditto',4,'logo')
# One uninterrupted Discover take; change supporting captions after the action.
for a,b,plate in [(0,10,'intro'),(10,16,'filter'),(16,19,'pass'),(19,22,'ditto'),(22,27,'details'),(27,30,'circles')]:
 add('discover-'+plate,b-a,plate,'A-discover-to-circles',a)
add('circle-to-chat',8.8,'chat','B1-circle-to-chat')
add('select-and-request',6.2,'muse','B2-live-ai')
add('real-model-result',1.5,'suggestion','B2-live-ai',9.5)
add('review-to-ideas',4.5,'suggestion','B3-result-to-ideas')
add('start-round',1.2,'mohit','C1-start-round')
add('unanimous-rule',1.6,'mohit','C2-mohit-round')
add('mohit-votes',8,'mohit','C3-mohit-votes')
add('independent-friends',9.7,'friends','C5-paxton-consensus',extra='C4-edwin-votes')
add('reveal-consensus',3,'consensus','C6-reveal-match')
add('plan-from-match',1.7,'consensus','D1-plan-from-consensus')
add('live-venue-request',2.7,'venues','D2-live-venue-plan')
add('live-venue-result',2.5,'venues','D2-live-venue-plan',7.5)
add('review-paxton-approval',5.3,'approve','D3-review-and-paxton-approve')
add('mohit-approval',2,'approve','D4-mohit-approve')
add('edwin-approval-calendar',5.3,'confirmed','D5-edwin-confirm')
add('calendar-navigation',4.5,'calendar','D6-calendar-connected')
add('calendar-export',4.4,'export','D7-export-final')
# Return to the same calendar while its architecture is explained alongside it.
add('architecture-with-calendar',4.1,'architecture-0','D8-return-final-clean')
for i,d in [(1,5),(2,5),(3,7)]:add('architecture-'+str(i),d,'architecture-'+str(i),'D8-return-final-clean',hold=4)
remaining=150-sum(s['dur'] for s in shots)
add('architecture-logic',remaining,'architecture-4','D8-return-final-clean',hold=4)
# Technology stays beside the same phone, rather than switching to a slide deck.
im=base('Built to bring\npeople together.','','')
for i,(a,b) in enumerate([('Next.js · React · TypeScript','Mobile-first interaction'),('SQLite · Railway','Persistent application data'),('Meta Muse Spark · SerpApi','AI planning + real-world places')]):
 y=630+i*100;text(im,(124,y),a,29,bold=True,width=45);text(im,(124,y+43),b,24,color=MUTED,width=45)
save(im,'tech-connected')
add('technology-in-context',16,'tech-connected','D8-return-final-clean',hold=4)
add('closing-in-app',9,'closing','D8-return-final-clean',hold=4)
add('final-logo',5,'logo')
# Labeled comparison uses separate recordings, never implies simultaneous filming.
im=Image.new('RGB',(1920,1080),BG);paste_logo(im,70,65,220)
text(im,(70,310),'Everyone\nhas a say.',58,display=True,width=15)
text(im,(70,520),'Independent votes.\nOne shared decision.',28,color=MUTED,width=24)
text(im,(70,930),'Separate sessions\nRecorded sequentially',20,color=MUTED,width=25)
for x,name in [(650,'Edwin'),(1130,'Paxton')]:
 ImageDraw.Draw(im).rounded_rectangle((x-12,48,x+432,1030),48,fill='#292326')
 text(im,(x,16),name,24,bold=True,width=20)
save(im,'friends')
assert round(sum(s['dur'] for s in shots),5)==180
start=0
for s in shots:s['timeline_start']=round(start,3);start+=s['dur']
(ROOT/'edit-decision-list.json').write_text(json.dumps(shots,indent=2))
metas={}
for name in sorted({s[k] for s in shots for k in ['clip','extra'] if s[k]}):
 m=json.loads((J/name/'manifest.json').read_text());m['times']=[f['timestamp']-m['start'] for f in m['frames']];metas[name]=m
@functools.lru_cache(maxsize=128)
def ui(name,index):
 f=metas[name]['frames'][index]
 return Image.open(J/name/f['file']).convert('RGB').crop((0,0,750,1688)).resize((420,946),Image.Resampling.LANCZOS)
def source(name,t):
 m=metas[name];return ui(name,max(0,bisect.bisect_right(m['times'],t)-1))
plates={s['plate']:Image.open(G/(s['plate']+'.png')).convert('RGB') for s in shots}
mask=Image.open(G/'phone-mask.png')
def tap(im,name,t,x0=1130):
 # Actual CSS coordinates; no synthetic UI state or cursor movement.
 for action in metas[name].get('actions',[]):
  age=t-action['time']
  if 0<=age<.22:
   alpha=int(180*(1-age/.22));radius=9+13*(age/.22)
   x=x0+action['x']*1.12;y=64+action['y']*946/844
   layer=Image.new('RGBA',(1920,1080));d=ImageDraw.Draw(layer)
   d.ellipse((x-radius,y-radius,x+radius,y+radius),outline=(201,53,80,alpha),width=3)
   d.ellipse((x-5,y-5,x+5,y+5),fill=(201,53,80,alpha//2))
   im.paste(layer,(0,0),layer)
def render_frame(s,local):
 im=plates[s['plate']].copy()
 if s['clip']:
  t=s['hold'] if s['hold'] is not None else s['start']+local
  im.paste(source(s['clip'],t),(1130,64),mask)
  if s['hold'] is None:tap(im,s['clip'],t)
  if s['extra']:
   im.paste(source(s['extra'],s['start']+local),(650,64),mask);tap(im,s['extra'],s['start']+local,650)
  label={'mohit-votes':'Mohit','review-paxton-approval':'Paxton','mohit-approval':'Mohit','edwin-approval-calendar':'Edwin'}.get(s['name'])
  if label:text(im,(1130,16),label,24,bold=True,width=18)
 return im
# Stream exact 30fps frames; screenshot timestamps preserve gesture speed and pauses.
out=ROOT/'ditto-demo-silent.mp4'
cmd=['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size','1920x1080','-framerate','30','-i','-','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(out)]
p=subprocess.Popen(cmd,stdin=subprocess.PIPE)
starts=[s['timeline_start'] for s in shots]
last=-1
review=W/'journey-review';review.mkdir(exist_ok=True)
for n in range(5400):
 t=n/30;idx=max(0,bisect.bisect_right(starts,t)-1);s=shots[idx];local=t-starts[idx]
 im=render_frame(s,local)
 # Only side graphics dissolve. The real phone remains perfectly fixed.
 if idx and local<.25 and s['clip'] and shots[idx-1]['clip'] and s['plate']!='friends' and shots[idx-1]['plate']!='friends':
  old=render_frame(s,local);old.paste(plates[shots[idx-1]['plate']].crop((0,0,1080,1080)),(0,0))
  im=Image.blend(old,im,local/.25)
 if n%180==0 or n in [1230,2040,2850,3570,3840,4260,4800,5340]:im.save(review/f'{n/30:06.2f}.jpg',quality=92)
 p.stdin.write(im.tobytes())
 if idx!=last:print(f'{t:6.2f} {s["name"]}',flush=True);last=idx
p.stdin.close();assert p.wait()==0
render_frame(next(s for s in shots if s['name']=='discover-ditto'),1).save(ROOT/'thumbnail.png')
print('DONE',out,flush=True)
