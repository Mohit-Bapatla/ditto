import { DatabaseSync, backup } from "node:sqlite";
import { existsSync, mkdirSync, readFileSync, writeFileSync, lstatSync, chmodSync } from "node:fs";
import { join, resolve } from "node:path";
import { presentationActivities, presentationCircles } from "./presentation-fixtures";
import { dayKey, shiftDay } from "./agenda";
import { assertShowcaseEnvironment, showcaseId as key, showcaseNames, showcaseOwner, showcaseVersion } from "./showcase-policy";

// 18:00 Austin time, including daylight-saving transitions; never host-timezone dependent.
export function showcaseDate(now: Date, offset: number) {
  const day = shiftDay(dayKey(now), offset);
  const guess = new Date(`${day}T18:00:00Z`);
  const hour = Number(new Intl.DateTimeFormat("en-US", {timeZone:"America/Chicago",hour:"2-digit",hourCycle:"h23"}).format(guess));
  return new Date(+guess + (18-hour)*3600000).toISOString();
}
function safePaths(root: string) {
  for (const p of ["data", "data/showcase", "data/showcase/media", "data/showcase/backups", "data/showcase/ditto-presentation-showcase.sqlite"])
    if (existsSync(join(root,p)) && lstatSync(join(root,p)).isSymbolicLink()) throw new Error("Showcase refuses symlinked storage.");
}
function readPhotos(root: string) {
  const media = join(root,"data/showcase/media");
  mkdirSync(media,{recursive:true,mode:0o700});
  // Import only the explicitly recovered sample owner's photos, never select by name globally.
  const config = join(root,"data/presentation-recovery.json"), original = join(root,"data/ditto-presentation.sqlite");
  if (existsSync(config) && existsSync(original)) {
    const owner = JSON.parse(readFileSync(config,"utf8")).owner;
    const db = new DatabaseSync(original,{readOnly:true});
    try {
      for (const row of db.prepare("SELECT data FROM profiles WHERE owner=?").all(owner)) {
        const p = JSON.parse(String(row.data));
        if (!p.demo || !showcaseNames.includes(p.name)) continue;
        const file=join(media,p.name.toLowerCase()+".jpg");
        if (!existsSync(file) && p.photo?.startsWith("data:image/jpeg;base64,")) writeFileSync(file,Buffer.from(p.photo.split(",")[1],"base64"),{mode:0o600,flag:"wx"});
      }
    } finally {db.close();}
  }
  return Object.fromEntries(showcaseNames.map(n=>{
    const file=join(media,n.toLowerCase()+".jpg");
    return [n,existsSync(file)?"data:image/jpeg;base64,"+readFileSync(file).toString("base64"):undefined];
  }));
}
function seed(db: DatabaseSync, root: string, now: Date) {
  const photos = readPhotos(root);
  const insert=(table:string,values:unknown[])=>db.prepare(`INSERT INTO ${table} VALUES(${values.map(()=>"?").join(",")})`).run(...values as (string|number|null)[]);
  const people=showcaseNames.map((name,i)=>({id:key("person:"+name),name,avatar:name[0],city:"Austin, TX",interests:[["Sports","Food","Games"],["Fitness","Games","Food"],["Outdoors","Arts","Music"]][i],budget:[25,30,20][i],demo:true,photo:photos[name]}));
  people.forEach(p=>insert("profiles",[p.id,showcaseOwner,JSON.stringify(p)]));
  const activities=presentationActivities.map(([title,category,area,budget,capacity,image,description],i)=>({id:key("activity:"+i),creator:people[i%3].id,title,category,venue:`${area} · choose a venue together`,city:"Austin, TX",budget,capacity,image:`/activities/${image}.webp`,description,start:showcaseDate(now,i%7+1),tags:["All levels welcome","Choose a time together"],demo:true,fixture:{version:"showcase-v1",index:i,area,schedule:"illustrative",cost:"planning allowance",image:"representative"}}));
  activities.forEach(a=>{insert("activities",[a.id,showcaseOwner,a.creator,JSON.stringify(a)]);insert("showcase_schedule",["activities",a.id,a.fixture.index%7+1,a.start]);});
  [2,5,14,18].forEach(i=>{insert("swipes",[activities[i].id,people[0].id,"yes"]);insert("participation",[activities[i].id,people[0].id,"interested"]);});
  presentationCircles.forEach((c,ci)=>{
    const cid=key("circle:"+c.name),invite=key("invite:"+c.name);
    insert("circles",[cid,showcaseOwner,invite,JSON.stringify({id:cid,name:c.name,description:c.description,city:"Austin, TX",budget:30,demo:true})]);
    people.forEach(p=>insert("members",[cid,p.id]));
    const ideas=c.picks.map((ai,ii)=>({id:key(`idea:${ci}:${ii}`),title:activities[ai].title,category:activities[ai].category,image:activities[ai].image,creator:people[ii%3].id,activityId:activities[ai].id}));
    ideas.forEach(i=>insert("ideas",[i.id,cid,JSON.stringify(i)]));
    // Historical consensus supports the sample plans; a separate current round remains interactive.
    const historical=key("history-round:"+ci),current=key("round:"+ci);
    for (const [rid,time] of [[historical,+now-86400000],[current,+now]] as const) {
      insert("rounds",[rid,cid,"everyone",time]);
      people.forEach(p=>insert("round_members",[rid,p.id]));
      ideas.forEach(i=>insert("round_ideas",[rid,i.id]));
    }
    ideas.forEach((idea,i)=>{
      people.forEach(p=>insert("votes",[historical,idea.id,p.id,i===0?1:0]));
      insert("votes",[current,idea.id,people[1].id,i===3?0:1]);
    });
    const a=activities[c.picks[0]],pid=key("plan:"+ci),confirmed=ci===1||ci===2;
    const plan={id:pid,circle:cid,round:historical,title:a.title,explanation:a.description,start:showcaseDate(now,ci+1),stops:[{title:a.title,duration:90,note:`${a.fixture.area}. Choose the venue together; no reservation is implied.`}],source:"demo",template:"showcase-v1",status:"proposed",approvals:[],eligible:people.map(p=>p.id),rsvps:[]};
    insert("plans",[pid,cid,JSON.stringify(plan)]);
    insert("showcase_schedule",["plans",pid,ci+1,plan.start]);
    (confirmed?people:people.slice(1,2)).forEach(p=>insert("approvals",[pid,p.id]));
    if(confirmed)people.forEach(p=>insert("rsvps",[pid,p.id]));
    const message=["Pickleball or tacos? Vote and let’s choose together.","Chess and coffee sounds like a good project break.","Karaoke or bowling? I’m adding both.","Anyone up for a low-key hike?"][ci];
    db.prepare("INSERT INTO messages(id,circle_id,user_id,text,created_at,nonce) VALUES(?,?,?,?,?,?)").run(key("message:"+ci),cid,people[ci%2+1].id,message,now.toISOString(),key("message-nonce:"+ci));
  });
  insert("showcase_meta",["version",String(showcaseVersion)]);
  insert("showcase_meta",["owner",showcaseOwner]);
  insert("showcase_meta",["created",now.toISOString()]);
}
export async function prepareShowcase(root=process.cwd(), mode:"seed"|"reset"="seed", now=new Date(), env: Record<string, string | undefined>=process.env) {
  const path=assertShowcaseEnvironment(env,root);
  safePaths(root);
  mkdirSync(join(root,"data/showcase"),{recursive:true,mode:0o700});
  const lock=join(root,"data/showcase/server.pid");
  if(mode==="reset" && existsSync(lock)) {
    const pid=Number(readFileSync(lock,"utf8"));let running=false;
    if(Number.isSafeInteger(pid)&&pid>0)try{process.kill(pid,0);running=true;}catch{}
    if(running)throw new Error("Stop npm run showcase before resetting. No changes made.");
  }
  for(const a of presentationActivities) if(!existsSync(join(root,`public/activities/${a[5]}.webp`)))throw new Error(`Missing activity image: ${a[5]}.webp`);
  const existed=existsSync(path),db=new DatabaseSync(path);
  db.exec("PRAGMA busy_timeout=5000");
  let backupPath:string|undefined;
  try {
    if(existed) {
      const table=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='showcase_meta'").get();
      if(!table)throw new Error("Unrecognized existing database. Refusing to seed/reset it.");
      const meta=Object.fromEntries(db.prepare("SELECT key,value FROM showcase_meta").all().map(r=>[String(r.key),String(r.value)]));
      if(meta.version!==String(showcaseVersion)||meta.owner!==showcaseOwner)throw new Error("Unknown showcase version/owner. Back up and use an explicit migration; no data changed.");
    } else if(mode==="reset")throw new Error("No initialized showcase to reset. Run showcase:seed first.");
    if(mode==="reset") {
      mkdirSync(join(root,"data/showcase/backups"),{recursive:true,mode:0o700});
      backupPath=join(root,"data/showcase/backups",`before-reset-${Date.now()}.sqlite`);
      await backup(db,backupPath);chmodSync(backupPath,0o600);
      // Preserve subsequent uploads for the three standard profiles before restoring scenarios.
      for(const name of showcaseNames) {
        const row=db.prepare("SELECT data FROM profiles WHERE id=?").get(key("person:"+name));
        const photo=row&&JSON.parse(String(row.data)).photo;
        if(photo?.startsWith("data:image/jpeg;base64,"))writeFileSync(join(root,"data/showcase/media",name.toLowerCase()+".jpg"),Buffer.from(photo.split(",")[1],"base64"),{mode:0o600});
      }
    }
    db.exec(readFileSync(resolve(root,"database/schema.sql"),"utf8"));
    db.exec("CREATE TABLE IF NOT EXISTS showcase_meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);CREATE TABLE IF NOT EXISTS showcase_schedule(kind TEXT NOT NULL,id TEXT PRIMARY KEY,offset INTEGER NOT NULL,start TEXT NOT NULL)");
    db.exec("BEGIN IMMEDIATE");
    try {
      if(mode==="reset") {
        for(const table of ["decision_history","venue_selections","submissions","proposals","constraints_by_member","messages","rsvps","approvals","plans","votes","round_ideas","round_members","rounds","ideas","swipes","participation","activities","members","circles","sessions","profiles","showcase_schedule","showcase_meta"])db.exec(`DELETE FROM ${table}`);
      }
      if(!existed||mode==="reset")seed(db,root,now);
      else {
        // Advance only untouched baseline schedules once expired. User-edited dates remain intact.
        for(const row of db.prepare("SELECT * FROM showcase_schedule").all()) {
          if(!["activities","plans"].includes(String(row.kind)))throw new Error("Invalid showcase schedule kind.");
          const record=db.prepare(`SELECT data FROM ${row.kind} WHERE id=?`).get(row.id);
          if(!record)continue;
          const data=JSON.parse(String(record.data));
          if(data.start===row.start && Date.parse(data.start)<=+now) {
            data.start=showcaseDate(now,Number(row.offset));
            db.prepare(`UPDATE ${row.kind} SET data=? WHERE id=?`).run(JSON.stringify(data),row.id);
            db.prepare("UPDATE showcase_schedule SET start=? WHERE id=?").run(data.start,row.id);
          }
        }
      }
      if(db.prepare("PRAGMA foreign_key_check").all().length)throw new Error("Showcase foreign-key validation failed.");
      db.exec("COMMIT");
    }catch(e){db.exec("ROLLBACK");throw e;}
    chmodSync(path,0o600);
    return {path,backupPath,version:showcaseVersion,missingPhotos:showcaseNames.filter(n=>!JSON.parse(String(db.prepare("SELECT data FROM profiles WHERE id=?").get(key("person:"+n))!.data)).photo)};
  }finally{db.close();}
}
