// Buffers and sources only: simulation events decide timing, never wall-clock callbacks.
export class AudioBus {
  constructor(settings,{urls={},tracks=[],contextFactory}={}) {
    this.settings=settings;this.urls=urls;this.tracks=tracks;this.contextFactory=contextFactory;
    this.nodes=new Set();this.buffers=new Map();this.loading=new Map();this.epoch=0;this.notice='';
  }
  async unlock(){
    try{
      this.context??=this.contextFactory?this.contextFactory():new (window.AudioContext||window.webkitAudioContext)();
      if(!this.master){this.master=this.context.createGain();this.master.gain.value=.5;this.master.connect(this.context.destination);}
      if(this.context.state==='suspended')await this.context.resume();
      this.ready??=Promise.all(Object.keys(this.urls).filter(id=>!id.startsWith('bgm_')||id==='bgm_title').map(id=>this.load(id))).catch(()=>{this.notice='일부 소리를 불러오지 못했어요. 소리 없이도 플레이할 수 있어요.';this.ready=null;});
      await this.ready;
    }catch{this.notice='이 브라우저에서는 소리를 사용할 수 없어요.';}
  }
  async load(id){
    if(this.buffers.has(id))return;
    if(!this.loading.has(id))this.loading.set(id,(async()=>{
      const response=await fetch(this.urls[id],{signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error('Audio load failed');
      const buffer=await this.context.decodeAudioData(await response.arrayBuffer());this.buffers.set(id,buffer);
    })().finally(()=>this.loading.delete(id)));
    return this.loading.get(id);
  }
  async prepare(theme){
    if(!this.context)return;
    try{const id='bgm_'+theme;await this.load(id);for(const key of this.buffers.keys())if(key.startsWith('bgm_')&&key!=='bgm_title'&&key!==id)this.buffers.delete(key);}
    catch{this.notice='배경 음악을 불러오지 못했어요. 소리 설정에서 다시 확인해 주세요.';}
  }
  play(id,{music=false,npc=false}={}){
    if(!this.context||this.context.state!=='running'||!(music?this.settings.music:this.settings.sound))return;
    const buffer=this.buffers.get(id);if(!buffer)return;
    if(music&&this.bgm?.id===id)return;
    if(music&&this.bgm)this.stopNode(this.bgm);
    const effects=[...this.nodes].filter(n=>!n.music);if(!music&&effects.length>=4){if(npc)return;this.stopNode(effects[0]);}
    const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=buffer;
    gain.gain.value=music ? .45 : npc ? .2 : .65;source.connect(gain).connect(this.master);
    const node={source,gain,music,id};this.nodes.add(node);
    source.onended=()=>{this.nodes.delete(node);if(this.bgm===node)this.bgm=null;source.disconnect();gain.disconnect();};
    if(music){source.loop=true;source.loopStart=0;source.loopEnd=Math.min(buffer.duration,this.tracks.find(t=>t.id===id)?.duration??buffer.duration);this.bgm=node;}
    try{source.start();}catch{this.stopNode(node);}
  }
  event(type,{player=true,outcome}={}){
    if(type==='finish'){this.stop();this.play(`finish_${outcome}`);return;}
    this.play(type,{npc:!player});
  }
  music(_time,theme='ch01'){if(this.settings.music)this.play('bgm_'+theme,{music:true});else if(this.bgm)this.stopNode(this.bgm);}
  stopNode(node){this.nodes.delete(node);if(this.bgm===node)this.bgm=null;try{node.source.stop();}catch{}node.source.disconnect();node.gain.disconnect();}
  stop(){this.epoch++;for(const node of [...this.nodes])this.stopNode(node);}
}
