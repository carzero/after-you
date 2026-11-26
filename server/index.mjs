import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, randomUUID } from 'node:crypto';
import { validateCheckpoint } from './validate-run.mjs';
const fail = (status,message) => Object.assign(new Error(message),{status});
export function createApp({dataDir = process.env.DATA_DIR || path.resolve('.data'), clock = Date.now, seed = () => randomBytes(4).readUInt32LE(), dist = path.resolve('dist')} = {}) {
  fs.mkdirSync(dataDir,{recursive:true});
  const file=path.join(dataDir,'leaderboard.json');
  // A damaged existing database must not be silently replaced.
  let entries=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):[];
  if(!Array.isArray(entries)||entries.some(e=>!e||typeof e.id!=='string'||typeof e.name!=='string'||!Number.isSafeInteger(e.height)||e.height<=0||!Number.isFinite(Date.parse(e.updatedAt)))) throw Error('Invalid leaderboard database');
  const runs=new Map(), rate=new Map();
  function persist(list){const temp=file+'.tmp';fs.writeFileSync(temp,JSON.stringify(list));fs.renameSync(temp,file);}
  function snapshot(run) {
    return {token:run.token,stage:run.stage,seed:run.seed,peak:run.peak,items:run.items??{inventory:[],rewardCeiling:-1}};
  }
  function newStage(run) {run.seed=seed();run.token=randomUUID();run.response=null;return snapshot(run);}
  function record(run) {
    if(run.peak<=0)return;
    let next=entries.filter(e=>e.id!==run.id);
    next.push({id:run.id,name:run.name,height:run.peak,updatedAt:new Date(clock()).toISOString()});
    next.sort((a,b)=>b.height-a.height || a.updatedAt.localeCompare(b.updatedAt));next=next.slice(0,1000);persist(next);entries=next;
  }
  async function body(req){let bytes=0,chunks=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>64000)throw fail(413,'요청이 너무 큽니다.');chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks));}catch{throw fail(400,'올바른 JSON이 필요합니다.');}}
  const server=http.createServer(async(req,res)=>{
    const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
    try {
      const url=new URL(req.url,'http://localhost');
      if(url.pathname.startsWith('/api/')) {
        if(req.headers.origin && req.headers.origin!==`http://${req.headers.host}` && req.headers.origin!==`https://${req.headers.host}`)throw fail(403,'다른 사이트의 요청은 허용하지 않습니다.');
        if(req.method==='GET'&&url.pathname==='/api/health')return json(200,{version:1,mode:'online'});
        if(req.method==='GET'&&url.pathname==='/api/leaderboard')return json(200,{entries:entries.slice(0,20).map(({name,height,updatedAt},i)=>({rank:i+1,name,height,updatedAt}))});
        if(req.method!=='POST')throw fail(404,'찾을 수 없습니다.');
        const input=await body(req),now=clock();
        for(const [id,r]of runs)if(now-r.last>3600000)runs.delete(id);
        if(url.pathname==='/api/runs') {
          const ip=req.socket.remoteAddress||'local';const bucket=rate.get(ip);if(bucket&&now-bucket.start<3600000&&bucket.count>=60)throw fail(429,'잠시 후 다시 시작해 주세요.');
          if(!bucket||now-bucket.start>=3600000)rate.set(ip,{start:now,count:1});else bucket.count++;
          if(runs.size>=10000)throw fail(503,'서버가 혼잡합니다.');
          const name=typeof input.name==='string'?input.name.trim():'';
          if(!name||[...name].length>16||/[\x00-\x1f\x7f]/.test(name))throw fail(400,'닉네임은 1~16자로 입력해 주세요.');
          const run={id:randomUUID(),name,stage:0,peak:0,created:now,last:now,virtual:0};
          runs.set(run.id,run);return json(201,{runId:run.id,...newStage(run)});
        }
        const match=url.pathname.match(/^\/api\/runs\/([a-f0-9-]+)\/checkpoint$/);if(!match)throw fail(404,'찾을 수 없습니다.');
        const run=runs.get(match[1]);if(!run)throw fail(410,'도전이 만료됐습니다. 새로 시작해 주세요.');
        if(typeof input.token!=='string')throw fail(400,'스테이지 토큰이 필요합니다.');
        if(input.token===run.previousToken)return json(200,run.response); // lost-response retries are idempotent
        if(input.token!==run.token)throw fail(409,'이미 처리된 스테이지입니다.');
        const verified=validateCheckpoint(run,input,now);
        record({...run,peak:verified.peak});
        const {outcome,from}=verified,oldToken=run.token;
        Object.assign(run,verified);
        const response={outcome,from,...newStage(run)};
        run.previousToken=oldToken;run.response=response;
        return json(200,response);
      }
      if(req.method!=='GET'&&req.method!=='HEAD')throw fail(405,'지원하지 않는 요청입니다.');
      const decoded=decodeURIComponent(url.pathname);
      const target=path.resolve(dist,'.'+(decoded==='/'?'/index.html':decoded));
      if(!target.startsWith(dist+path.sep))throw fail(403,'접근할 수 없습니다.');
      if(!fs.existsSync(target)||!fs.statSync(target).isFile())throw fail(404,'파일을 찾을 수 없습니다.');
      const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav'};
      res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':target.endsWith('.html')?'no-cache':'public, max-age=3600'});
      if(req.method==='HEAD')res.end();else fs.createReadStream(target).pipe(res);
    }catch(e){json(e.status||500,{error:e.status?e.message:'서버 처리에 실패했습니다.'});}
  });
  return server;
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const port=Number(process.env.PORT||8787);createApp().listen(port,'0.0.0.0',()=>console.log(`AFTER YOU server listening on ${port}`));
}
