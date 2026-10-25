import { NextRequest,NextResponse } from 'next/server';
import {z} from 'zod';
import {auth,failure,rateLimit,sameOrigin} from '@/lib/http';
import {directions} from '@/lib/providers';
export async function POST(req:NextRequest){try{sameOrigin(req);const s=await auth();rateLimit('directions:'+s.owner);const b=z.object({origin:z.string().min(2).max(200),destination:z.string().min(2).max(300)}).parse(await req.json());return NextResponse.json({route:await directions(b.origin,b.destination)});}catch(e){return failure(e);}}
