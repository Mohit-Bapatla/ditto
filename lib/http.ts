import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { session, type Session } from './db';
import { ZodError } from 'zod';
export async function auth():Promise<Session> {const s=session((await cookies()).get('ditto_session')?.value);if(!s)throw new Error('Session expired. Refresh the page.');return s;}
export function sameOrigin(req:NextRequest){const origin=req.headers.get('origin');if(origin&&new URL(origin).host!==req.headers.get('host'))throw new Error('Cross-origin request rejected.');}
const buckets=new Map<string,{count:number;until:number}>();
export function rateLimit(key:string,max=15){const now=Date.now();if(buckets.size>10000)for(const [k,b]of buckets)if(b.until<now)buckets.delete(k);const b=buckets.get(key);if(b&&b.until>now){if(b.count>=max)throw new Error('Please wait a minute before trying again.');b.count++;}else buckets.set(key,{count:1,until:now+60000});}
export function failure(e:unknown) {return NextResponse.json({error:e instanceof ZodError?'Please check the form fields.':e instanceof Error?e.message:'Something went wrong. Please try again.'},{status:400});}
