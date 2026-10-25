import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth, sameOrigin, failure, rateLimit } from '@/lib/http';
import { one,run,id,person,state,transaction,createCircle,addIdea,startRound,vote,swipe,attend,requireMember,planState } from '@/lib/db';
import {photos} from '@/lib/types';
const str=z.string().trim().min(1).max(200);const uuid=z.string().uuid();
const schema=z.discriminatedUnion('type',[
 z.object({type:z.literal('switch'),user:uuid}),
 z.object({type:z.literal('profile'),name:str,avatar:z.string().max(10),city:str,interests:z.array(str).max(12),budget:z.number().min(0).max(1000)}),
 z.object({type:z.literal('circle'),name:str,description:z.string().max(500),city:str,budget:z.number().min(0).max(1000)}),
 z.object({type:z.literal('join'),invite:uuid}),
 z.object({type:z.literal('idea'),circle:uuid,title:str,category:str}),
 z.object({type:z.literal('round'),circle:uuid,threshold:z.enum(['everyone','majority'])}),
 z.object({type:z.literal('vote'),circle:uuid,idea:uuid,vote:z.boolean()}),
 z.object({type:z.literal('swipe'),activity:uuid,direction:z.enum(['yes','no'])}),
 z.object({type:z.literal('attend'),activity:uuid,withdraw:z.boolean().optional()}),
 z.object({type:z.literal('activity'),title:str,description:z.string().max(1000),category:str,venue:str,city:str,start:z.iso.datetime(),capacity:z.number().int().min(2).max(100),budget:z.number().min(0).max(1000)}),
 z.object({type:z.literal('approve'),plan:uuid}),z.object({type:z.literal('rsvp'),plan:uuid,going:z.boolean()}),
 z.object({type:z.literal('resetDeck')})
]);
export async function POST(req:NextRequest){try{sameOrigin(req);const s=await auth();rateLimit('action:'+s.owner,120);const b=schema.parse(await req.json());let resultId:string|undefined;
 transaction(()=>{switch(b.type){
 case 'switch':{if(!one('SELECT 1 FROM profiles WHERE id=? AND owner=?',b.user,s.owner))throw new Error('You can only switch identities in your own sandbox.');run('UPDATE sessions SET user_id=? WHERE id=?',b.user,s.id);s.user=b.user;break;}
 case 'profile':{let p=person(s.user);if(p.demo){p={...p,id:id(),demo:false};run('INSERT INTO profiles VALUES(?,?,?)',p.id,s.owner,JSON.stringify(p));s.user=p.id;run('UPDATE sessions SET user_id=? WHERE id=?',p.id,s.id);}const data={...p,name:b.name,avatar:b.avatar,city:b.city,interests:b.interests,budget:b.budget};run('UPDATE profiles SET data=? WHERE id=?',JSON.stringify(data),p.id);break;}
 case 'circle':{if(person(s.user).demo)throw new Error('Save your personal profile first to create a shared Circle.');resultId=createCircle(s,b.name,b.description,b.city,b.budget);break;}
 case 'join':{if(person(s.user).demo)throw new Error('Save your personal profile before joining a shared Circle.');const c=one('SELECT * FROM circles WHERE invite=?',b.invite);if(!c||JSON.parse(String(c.data)).demo)throw new Error('This invite is invalid or belongs to a private demo.');run('INSERT OR IGNORE INTO members VALUES(?,?)',c.id,s.user);resultId=String(c.id);break;}
 case 'idea':resultId=addIdea(s,b.circle,b.title,b.category);break;
 case 'round':resultId=startRound(s,b.circle,b.threshold);break;
 case 'vote':vote(s,b.circle,b.idea,b.vote);break;
 case 'swipe':swipe(s,b.activity,b.direction);break;
 case 'attend':attend(s,b.activity,b.withdraw);break;
 case 'activity':{if(new Date(b.start).getTime()<Date.now())throw new Error('Choose a future date.');const a={...b,id:id(),creator:s.user,image:photos[b.category]||photos.Outdoors,tags:['New friends welcome'],demo:person(s.user).demo};run('INSERT INTO activities VALUES(?,?,?,?)',a.id,s.owner,s.user,JSON.stringify(a));resultId=a.id;break;}
 case 'approve':case 'rsvp':{const row=one('SELECT * FROM plans WHERE id=?',b.plan);if(!row)throw new Error('Plan not found.');requireMember(s,String(row.circle_id));const p=planState(row);if(!p.eligible.includes(s.user))throw new Error('You joined after this plan was proposed.');if(b.type==='approve')run('INSERT OR IGNORE INTO approvals VALUES(?,?)',b.plan,s.user);else {if(p.status!=='confirmed')throw new Error('The plan is still awaiting approval.');if(b.going)run('INSERT OR IGNORE INTO rsvps VALUES(?,?)',b.plan,s.user);else run('DELETE FROM rsvps WHERE plan_id=? AND user_id=?',b.plan,s.user);}break;}
 case 'resetDeck':run('DELETE FROM swipes WHERE user_id=?',s.user);break;
 }});return NextResponse.json({state:state(s),id:resultId});}catch(e){return failure(e);}}
