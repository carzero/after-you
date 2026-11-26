import { validateCheckpoint } from '../server/validate-run.mjs';
const fail=(status,message)=>Object.assign(new Error(message),{status});
const json=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
function checkOrigin(request){const origin=request.headers.get('Origin');if(origin&&origin!==new URL(request.url).origin)throw fail(403,'다른 사이트의 요청은 허용하지 않습니다.');}
async function readBody(request){
 const reader=request.body?.getReader();if(!reader)throw fail(400,'올바른 JSON이 필요합니다.');
 let size=0;const chunks=[];
 while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>64000){await reader.cancel();throw fail(413,'요청이 너무 큽니다.');}chunks.push(value);}
 const bytes=new Uint8Array(size);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
 try{const input=JSON.parse(new TextDecoder().decode(bytes));if(!input||typeof input!=='object'||Array.isArray(input))throw Error();return input;}catch{throw fail(400,'올바른 JSON이 필요합니다.');}
}
function nextStage(run){run.seed=crypto.getRandomValues(new Uint32Array(1))[0];run.token=crypto.randomUUID();return {token:run.token,stage:run.stage,seed:run.seed,peak:run.peak,items:run.items??{inventory:[],rewardCeiling:-1}};}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
  try{
   checkOrigin(request);
   // Cloudflare overwrites CF-Connecting-IP at its edge. Do not store raw IP addresses.
   const ip=request.headers.get('CF-Connecting-IP')||'local';
   const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip));
   const headers=new Headers(request.headers);headers.set('X-Afteryou-Client',[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join(''));
   const forwarded=new Request(request,{headers});
   return await env.RANKINGS.get(env.RANKINGS.idFromName('global-v1')).fetch(forwarded);
  }catch(e){return json(e.status||500,{error:e.status?e.message:'서버 처리에 실패했습니다.'});}
 }
};
// A SQLite-backed Durable Object provides a single atomic ranking board and persistent runs.
export class RankingStore {
 constructor(ctx){this.ctx=ctx;this.sql=ctx.storage.sql;
  this.sql.exec('CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, data TEXT NOT NULL, last INTEGER NOT NULL)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS entries (id TEXT PRIMARY KEY, name TEXT NOT NULL, height INTEGER NOT NULL, updatedAt TEXT NOT NULL)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS rate (client TEXT PRIMARY KEY, start INTEGER NOT NULL, count INTEGER NOT NULL)');
  this.sql.exec('CREATE INDEX IF NOT EXISTS runs_last ON runs(last)');
 }
 async fetch(request){
  try{
   checkOrigin(request);const url=new URL(request.url);
   if(request.method==='GET'&&url.pathname==='/api/health')return json(200,{version:1,mode:'online',storage:'durable-object-sqlite'});
   if(request.method==='GET'&&url.pathname==='/api/leaderboard'){
    const rows=this.sql.exec('SELECT name,height,updatedAt FROM entries ORDER BY height DESC,updatedAt ASC,id ASC LIMIT 20').toArray();
    return json(200,{entries:rows.map((e,i)=>({rank:i+1,...e}))});
   }
   if(request.method!=='POST')throw fail(404,'찾을 수 없습니다.');
   const input=await readBody(request),now=Date.now();
   return this.ctx.storage.transactionSync(()=>this.write(url.pathname,input,request.headers.get('X-Afteryou-Client')||'local',now));
  }catch(e){return json(e.status||500,{error:e.status?e.message:'서버 처리에 실패했습니다.'});}
 }
 write(route,input,client,now){
  this.sql.exec('DELETE FROM runs WHERE last < ?',now-3600000);this.sql.exec('DELETE FROM rate WHERE start < ?',now-3600000);
  if(route==='/api/runs'){
   const bucket=this.sql.exec('SELECT start,count FROM rate WHERE client = ?',client).toArray()[0];
   if(bucket&&bucket.count>=60)throw fail(429,'잠시 후 다시 시작해 주세요.');
   if(this.sql.exec('SELECT COUNT(*) AS n FROM runs').toArray()[0].n>=10000)throw fail(503,'서버가 혼잡합니다.');
   const name=typeof input.name==='string'?input.name.trim():'';if(!name||[...name].length>16||/[\x00-\x1f\x7f]/.test(name))throw fail(400,'닉네임은 1~16자로 입력해 주세요.');
   this.sql.exec('INSERT INTO rate(client,start,count) VALUES(?,?,1) ON CONFLICT(client) DO UPDATE SET count=count+1',client,now);
   const run={id:crypto.randomUUID(),name,stage:0,peak:0,created:now,last:now,virtual:0};const snapshot=nextStage(run);
   this.sql.exec('INSERT INTO runs(id,data,last) VALUES(?,?,?)',run.id,JSON.stringify(run),now);return json(201,{runId:run.id,...snapshot});
  }
  const match=route.match(/^\/api\/runs\/([a-f0-9-]+)\/checkpoint$/);if(!match)throw fail(404,'찾을 수 없습니다.');
  const row=this.sql.exec('SELECT data FROM runs WHERE id = ?',match[1]).toArray()[0];if(!row)throw fail(410,'도전이 만료됐습니다. 새로 시작해 주세요.');const run=JSON.parse(row.data);
  if(typeof input.token!=='string')throw fail(400,'스테이지 토큰이 필요합니다.');
  if(input.token===run.previousToken)return json(200,run.response);
  if(input.token!==run.token)throw fail(409,'이미 처리된 스테이지입니다.');
  const verified=validateCheckpoint(run,input,now),oldToken=run.token;
  if(verified.peak>0){
   this.sql.exec('INSERT INTO entries(id,name,height,updatedAt) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET height=excluded.height,updatedAt=excluded.updatedAt',run.id,run.name,verified.peak,new Date(now).toISOString());
   this.sql.exec('DELETE FROM entries WHERE id NOT IN (SELECT id FROM entries ORDER BY height DESC,updatedAt ASC,id ASC LIMIT 1000)');
  }
  Object.assign(run,verified);const response={outcome:verified.outcome,from:verified.from,...nextStage(run)};run.previousToken=oldToken;run.response=response;
  this.sql.exec('UPDATE runs SET data=?,last=? WHERE id=?',JSON.stringify(run),now,run.id);return json(200,response);
 }
}
