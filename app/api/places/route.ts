import { NextRequest,NextResponse } from 'next/server';
import { z } from 'zod';
import { auth,failure,rateLimit,sameOrigin } from '@/lib/http';
import { modelJSON,venues } from '@/lib/providers';
import { intentSchema } from '@/lib/domain';
import { person } from '@/lib/db';
export async function POST(req:NextRequest){try{sameOrigin(req);const s=await auth();rateLimit('places:'+s.owner);const b=z.object({query:z.string().min(2).max(300),city:z.string().min(2).max(100),natural:z.boolean().optional()}).parse(await req.json());let queries=[b.query],explanation='Live Google Maps results, powered by SerpApi.';if(b.natural){const intent=intentSchema.parse(await modelJSON('Interpret this person’s activity request. Return {queries: string[] (1–3 short Maps search phrases), explanation: string}. Respect their budget and interests; do not claim prices or availability are verified.',{request:b.query,city:b.city,profile:person(s.user)}));queries=intent.queries;explanation=intent.explanation;}const results=(await Promise.all(queries.map(q=>venues(q,b.city)))).flat();return NextResponse.json({venues:[...new Map(results.map(v=>[v.id,v])).values()],explanation,source:'SerpApi'});}catch(e){return failure(e);}}
