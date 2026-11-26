import './style.css';
import { Game, STAGES, PEOPLE, JUMP_MS, FALL_MS } from './game.js';
import { loadSave, storeSave, recordWin } from './save.js';
import { characterArt, names, artImage, preloadArt, recoveryArt, portrait, icon, sceneArtwork, chapterFile, artUrl } from './art.js';
import { poseFor, worldEffects, actingPose } from './art-layout.js';
import { stageConfig, restartStage, heightReached, seededRandom } from './progression.js';
import { THEMES, themeForStage, themeName } from './scene.js';
import { api } from './online.js';
import { AudioBus } from './audio.js';
import { audioUrls, audioTracks } from './audio-assets.js';
import { rescueFrame } from './rescue-transition.js';
let storage;
try { storage = window.localStorage; } catch { storage = null; }
const save = loadSave(storage), audio = new AudioBus(save.settings,{urls:audioUrls,tracks:audioTracks});
const landed = new Map(), jumped = new Map(), cracked = new Map();
let activeTheme = themeForStage(0, save.theme), themeLoading = false, starting = false, artNotice = '';
preloadArt(activeTheme).catch(() => {});
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = save.settings.reducedMotion || motionPreference.matches;
let sessionFalls = 0;
let peak = 0, roundMoves = [], onlineRun = null, onlineNext = null, onlineReady = false;
let returnStage = 0, checkpointBusy = false, displayedPhase=null, warnedTimer=false, lastReaction=-Infinity;
let game = null, stage = 0, selected = 'potato', userPaused = false, lastTime, resultHandled = false, saveFailed = false;
const $ = id => document.getElementById(id);
document.querySelector('#app').innerHTML = `
<main class="shell">
  <header><a class="wordmark" href="./" aria-label="먼저 가세요 홈">CARZERO <span>STUDIO</span></a><button id="settings-open" class="icon-button" aria-label="설정">${icon('settings')}</button></header>
  <section class="heading"><div class="eyebrow">A LITTLE COURAGE, PLEASE</div><h1>먼저 가세요<span>AFTER YOU</span></h1><p>소원은 간절합니다. 먼저 갈 생각은 없습니다.</p></section>
  <section class="game-card" aria-label="구름 정거장 게임">
    <div class="hud"><div><small>CHAPTER 01 · 구름 정거장</small><strong id="stage-label">첫 번째 양보</strong></div><button id="pause" class="icon-button" aria-label="일시정지" disabled>${icon('pause')}</button><div class="timer"><strong id="timer">35</strong><small>남은 시간</small></div></div>
    <div class="scene" id="scene"><div id="scene-art">${sceneArtwork(activeTheme)}</div><div id="board"></div><div id="hint-map" class="hint-map" aria-label="안전 경로 미리보기"></div><div class="flight-sign">${artImage('props/no_flying_v001')}<span>비행 금지</span></div><div id="world-effects" aria-hidden="true"></div><div id="actors"><div id="rescue-scene" hidden></div></div><button id="skip-rescue" hidden>연출 건너뛰기 ↗</button><div class="start-island">CLOUD STATION <span>출발</span></div><div class="scene-caption">배경·모션·사운드 통합 초안</div></div>
    <div class="status-line"><span class="status-dot"></span><p id="message" role="status" aria-live="polite">두 발판 중 하나는 안전합니다.</p><span id="progress">0 / 8</span></div>
    <div class="controls"><button id="left" disabled>${icon('arrow_left')}왼쪽</button><button id="right" disabled>오른쪽${icon('arrow_right')}</button></div>
  </section>
  <footer><span>01 — 구름 위의 작은 양보</span><span>← → 키로도 이동</span></footer>
</main>
<div class="veil" id="lobby"><section class="panel lobby-panel" aria-labelledby="lobby-title"><div class="ticket">${artImage('ui/invitation', 'invitation-art')}소원 접수 초대장 <span>NO. 001</span></div><div class="lobby-art">${artImage('integration/ui/title', 'title-art')}${artImage('integration/ui/logo','lobby-logo')}</div><div class="eyebrow">WELCOME TO CLOUD STATION</div><h2 id="lobby-title">소원 하나, 용기 한 걸음.</h2><p>안전한 길을 잠깐 기억하세요.<br>망설여진다면 친구들의 발걸음을 살펴보세요.</p><p class="climb-rule">추락하면 한 스테이지 아래에서 다시 출발!<br>높이 올라갈수록 힌트가 짧아져요.</p><div class="online-entry"><label>닉네임 <input id="nickname" maxlength="16" placeholder="구름손님" value="구름손님" autocomplete="nickname"></label><label class="mode-toggle"><input type="checkbox" id="online-mode" disabled> 온라인 순위 도전</label><small id="connection-status" role="status">온라인 서버 확인 중…</small></div><div id="stages" class="stage-picker"></div><div id="characters" class="character-picker"></div><button id="start" class="primary">${icon('play')}초대장 들고 출발하기</button><button id="leaderboard-open" class="text-button">${icon('record')}스코어보드 보기</button><small class="prototype-note">주연 4인 · 오리지널 BGM·효과음 적용</small><p id="save-warning" class="save-warning"></p></section></div>
<div class="veil" id="result" hidden><section class="panel" aria-labelledby="result-title"><div id="result-art" class="result-art"></div><div class="eyebrow" id="result-eyebrow"></div><h2 id="result-title"></h2><p id="result-text"></p><div class="stamp" id="stamp"></div><button id="retry" class="primary">한 번 더 건너기 ↗</button><button id="next" class="secondary" hidden>다음 스테이지</button><button id="replay-stage" class="text-button" hidden>이 스테이지 다시 도전</button><button id="unlock-show" class="text-button" hidden>참가자 해금 보기</button><div id="unlock-panel" hidden></div><p id="online-result" role="status"></p><button id="network-retry" class="secondary" hidden>기록 전송 다시 시도</button><button id="result-leaderboard" class="text-button">${icon('record')}스코어보드 보기</button><br><button id="home" class="text-button">${icon('home')}정거장으로 돌아가기</button></section></div>
<div class="veil" id="paused" hidden><section class="panel"><div class="eyebrow">TAKE YOUR TIME</div>${artImage('staff/guide','pause-guide')}<h2>잠깐, 숨 고르기</h2><p>다리도 시간도 기다리고 있어요.</p><button id="resume" class="primary">${icon('play')}다시 건너기</button><button id="pause-home" class="text-button">${icon('home')}정거장으로 돌아가기</button></section></div>
<dialog id="leaderboard"><div class="dialog-head"><h2>구름 위 스코어보드</h2><button id="leaderboard-close" class="icon-button" aria-label="스코어보드 닫기">${icon('close')}</button></div><p>최고 도달 높이로 겨뤄요.<br>추락 후 다시 오른 구간은 중복 가산되지 않아요.</p><p id="ranking-status" role="status"></p><ol id="rankings"></ol><button id="ranking-refresh" class="primary">순위 새로고침</button><small>같은 서버에서 플레이한 온라인 도전 기록 · 닉네임은 중복될 수 있어요.</small></dialog><dialog id="settings"><form method="dialog"><div class="dialog-head"><h2>구름 정거장 설정</h2><button class="icon-button" aria-label="설정 닫기">${icon('close')}</button></div><p>편안하게 건너갈 준비를 해요.</p><label><span class="label-title">${icon('music')}배경 음악</span> <input type="checkbox" id="music"></label><label><span class="label-title">${icon('sound')}효과음</span> <input type="checkbox" id="sound"></label><label><span class="label-title">${icon('vibration')}진동</span> <input type="checkbox" id="vibration"></label><label><span class="label-title">${icon('reduce_motion')}움직임 줄이기</span> <input type="checkbox" id="reducedMotion"></label><label><span class="label-title">${icon('wish')}배경 테마</span><select id="theme-select" aria-label="배경 테마"><option value="auto">높이에 따라 바꾸기</option>${THEMES.map(t=>`<option value="${t.id}">${t.name}</option>`).join('')}</select></label><p id="theme-status" role="status"></p><p id="audio-status" role="status"></p><small>오리지널 BGM·효과음 적용 · 음량은 기기에서 조절해 주세요.<br>진동은 지원하는 기기에서만 작동합니다.<br>기기의 움직임 줄이기 설정도 함께 따릅니다.</small><button class="primary">설정 완료</button></form></dialog>`;
const favicon = document.createElement('link'); favicon.rel = 'icon'; favicon.type = 'image/webp'; favicon.href = artUrl('branding/app_icon'); document.head.append(favicon);
function persist() { saveFailed = !storeSave(storage, save); $('save-warning').textContent = saveFailed ? '저장소를 사용할 수 없어 이번 방문에서만 진행이 유지됩니다.' : ''; }
function pickers() {
  $('stages').innerHTML = STAGES.map((s, i) => `<button data-stage="${i}" class="${stage === i ? 'selected' : ''}" ${i > save.unlockedStage ? 'disabled' : ''}>${i > save.unlockedStage ? icon('lock')+'잠김' : `0${i + 1}`}<small>${s.rows}걸음</small></button>`).join('');
  $('characters').innerHTML = PEOPLE.map(id => `<button data-character="${id}" aria-label="${names[id]}${id !== 'potato' && !save.chapterComplete ? ' · 1챕터 완료 후 해금' : ''}" aria-pressed="${selected === id}" ${id !== 'potato' && !save.chapterComplete ? 'disabled' : ''}>${portrait(id)}${id !== 'potato' && !save.chapterComplete ? `<span class="character-lock">${icon('lock')}</span>` : ''}<span>${names[id]}</span></button>`).join('');
}
pickers();
$('stages').onclick = e => { const b = e.target.closest('[data-stage]'); if (b && !b.disabled) { stage = +b.dataset.stage; pickers(); } };
$('characters').onclick = e => { const b = e.target.closest('[data-character]'); if (b && !b.disabled) { selected = b.dataset.character; pickers(); } };
function syncPause() {
  game?.setPaused(userPaused || document.hidden || $('settings').open || $('leaderboard').open || themeLoading);
  if (userPaused||document.hidden||$('settings').open||$('leaderboard').open||themeLoading) { audio.stop(); $('skip-rescue').hidden = true; }
  if (game) render();
}
async function start(continuing = false) {
  if (starting) return;
  starting = true; $('start').disabled = $('retry').disabled = $('next').disabled = true;
  audio.stop();
  try {
    await audio.unlock();
    $('audio-status').textContent=audio.notice;
    if (!continuing) {
      onlineRun = null; onlineNext = null; peak = 0;
      if ($('online-mode').checked) { onlineNext = await api('runs', {name: $('nickname').value}); onlineRun = onlineNext.runId; }
    }
    if (onlineRun) stage = onlineNext.stage;
    const nextTheme = themeForStage(stage, save.theme);
    await preloadArt(nextTheme); await audio.prepare(nextTheme); activeTheme = nextTheme; artNotice = '';
    const random = onlineRun ? seededRandom(onlineNext.seed) : Math.random;
    roundMoves = []; checkpointBusy = false;
    landed.clear(); jumped.clear(); cracked.clear(); game = new Game({stage, character:selected, random});
    displayedPhase=null;warnedTimer=false;lastReaction=-Infinity; resultHandled = false; userPaused = false; lastTime = undefined;
    for (const id of ['lobby','result','paused']) $(id).hidden = true;
    $('stage-label').textContent = `${String(stage+1).padStart(2,'0')} · ${stageConfig(stage).title}`;
    $('pause').disabled = false; audio.event('envelope_open'); audio.event('hint_show'); syncPause(); render();
  } catch (e) {
    const message = e.message === 'Art image failed to load' ? '원화를 불러오지 못했어요. 다시 출발을 눌러 주세요.' : e.message;
    $('save-warning').textContent = message; $('online-result').textContent = message;
  } finally {
    starting = false; $('start').disabled = $('retry').disabled = $('next').disabled = false;
  }
}
$('start').onclick = () => start();
function continueClimb() { stage = returnStage; start(true); }
$('retry').onclick = $('next').onclick = continueClimb;
function home() { audio.stop(); game = null; onlineRun = null; onlineNext = null; $('skip-rescue').hidden = true; $('result').hidden = $('paused').hidden = true; $('lobby').hidden = false; $('pause').disabled = true; $('left').disabled = $('right').disabled = true; pickers(); $('start').focus(); audio.unlock().then(()=>{if(!game&&!document.hidden&&!$('settings').open&&!$('leaderboard').open)audio.music(0,'title');}); }
$('replay-stage').onclick=()=>start(false);
$('unlock-show').onclick=()=>{ $('unlock-panel').hidden=!$('unlock-panel').hidden; $('unlock-panel').innerHTML=PEOPLE.map(id=>`<div>${portrait(id)}<span>${names[id]}</span>${icon('unlock')}</div>`).join(''); if(!$('unlock-panel').hidden)audio.event('unlock'); };
$('home').onclick = $('pause-home').onclick = home;
$('pause').onclick = () => { if (game && !game.result) { userPaused = true; $('paused').hidden = false; syncPause(); } };
$('resume').onclick = () => { userPaused = false; $('paused').hidden = true; lastTime = undefined; audio.unlock(); syncPause(); };
function move(side) { if (game?.move(side)) { artNotice = ''; roundMoves.push({at:game.clock,side}); render(); } }
$('left').onclick = () => move(0); $('right').onclick = () => move(1);
$('skip-rescue').onclick = () => { if (sessionFalls >= 2 && game?.skipRescue()) render(); };
document.addEventListener('keydown', e => { if (e.repeat || $('settings').open || $('leaderboard').open || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return; if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(e.key === 'ArrowLeft' ? 0 : 1); } });
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game && !game.result) { userPaused = true; $('paused').hidden = false; }
  lastTime = undefined; syncPause();
});
$('settings-open').onclick = () => { $('settings').showModal(); syncPause(); };
$('settings').onclose = () => { lastTime = undefined; syncPause(); };
for (const key of Object.keys(save.settings)) {
  $(key).checked = save.settings[key];
  $(key).onchange = () => { save.settings[key] = $(key).checked; audio.stop(); persist(); applySettings(); if(key==='music'||key==='sound')audio.event($(key).checked?'ui_toggle_on':'ui_toggle_off'); };
}
function applySettings() {
  reducedMotion = save.settings.reducedMotion || motionPreference.matches;
  document.body.classList.toggle('reduced-motion', reducedMotion);
  if (game) render();
}
motionPreference.addEventListener('change', applySettings);
applySettings();
function result() {
  if (resultHandled) return; resultHandled = true; audio.event('finish',{outcome:game.result});
  const success = game.result === 'success';
  const newlyUnlocked=success&&stage===2&&!save.chapterComplete;
  if (success) recordWin(save, stage, game.activeTime);
  peak = Math.max(peak, heightReached(game)); save.bestHeight = Math.max(save.bestHeight, peak); persist();
  returnStage = restartStage(stage, game.result);
  $('result-art').innerHTML = success ? characterArt(selected, 'finished') : game.result === 'fall' ? recoveryArt(selected, true) : characterArt(selected, 'idle');
  $('result-eyebrow').textContent = success ? 'WISH RECEIVED' : 'CLOUD RECOVERY SERVICE';
  $('result-title').textContent = success ? (newlyUnlocked?'구름 정거장 완료!':'무사히 도착했어요') : (game.result === 'timeout' ? '접수 시간이 끝났어요.' : '구름 회수 완료');
  const hintSeconds = (stageConfig(returnStage).hint / 1000).toFixed(1);
  $('result-text').textContent = success
    ? `최고 ${peak}층 · ${(game.activeTime / 1000).toFixed(2)}초\nSTAGE ${returnStage + 1}로 올라갑니다. 다음 힌트 ${hintSeconds}초!`
    : game.result === 'fall'
      ? `푹신한 구름이 받아줬어요!\nSTAGE ${stage + 1} → STAGE ${returnStage + 1}에서 다시 출발해요.\n최고 ${peak}층 기록은 남아 있어요.`
      : `시간이 끝났어요. STAGE ${returnStage + 1}에서 다시 출발해요.\n최고 ${peak}층 기록은 남아 있어요.`;
  if(newlyUnlocked) $('result-text').textContent+='\n네 참가자를 선택할 수 있어요. 도전은 계속됩니다!';
  $('unlock-show').hidden=!newlyUnlocked; $('unlock-panel').hidden=true;
  $('replay-stage').hidden=!success||!!onlineRun;
  if (saveFailed) $('result-text').textContent += '\n저장 불가: 기록은 이번 방문에서만 유지됩니다.';
  $('stamp').innerHTML = `${artImage('ui/stamp','stamp-art')}<span>${success ? `${peak}층 도달!` : '무사히 반송 완료'}</span>`;
  $('next').hidden = !success; $('retry').hidden = success;
  $('retry').innerHTML = `${icon('retry')}STAGE ${returnStage + 1}에서 다시 출발`;
  $('next').innerHTML = `${icon('arrow_right')}STAGE ${returnStage + 1}로 계속 올라가기`;
  $('online-result').textContent = onlineRun ? '온라인 기록 확인 중…' : `연습 기록 · 이 브라우저 최고 ${save.bestHeight}층`;
  $('network-retry').hidden = true;
  $('result').hidden = false; $('pause').disabled = true; (success ? $('next') : $('retry')).focus();
  if (onlineRun) settleOnline();
}
async function settleOnline() {
  if (checkpointBusy || !onlineRun || !game?.result) return;
  checkpointBusy = true; $('retry').disabled = $('next').disabled = true; $('network-retry').hidden = true;
  const current = game, id = onlineRun;
  try {
    const reply = await api(`runs/${id}/checkpoint`, {token: onlineNext.token, moves: roundMoves, end: current.clock, skipped: current.player.state === 'rescued'});
    if (game !== current || onlineRun !== id) return;
    onlineNext = reply; returnStage = reply.stage; peak = reply.peak;
    $('online-result').textContent = `온라인 스코어보드에 최고 ${reply.peak}층 기록 확인!`;
    $('retry').disabled = $('next').disabled = false;
  } catch (e) {
    if (game !== current || onlineRun !== id) return;
    $('online-result').textContent = `${e.message} 기록을 확인한 뒤 계속할 수 있어요.`;
    $('network-retry').hidden = false;
  } finally { if (game === current) checkpointBusy = false; }
}
$('network-retry').onclick = settleOnline;
async function refreshRankings() {
  $('ranking-status').textContent = '온라인 순위 불러오는 중…'; $('rankings').replaceChildren();
  try {
    const data = await api('leaderboard');
    $('ranking-status').textContent = data.entries.length ? '최고 도달 높이 TOP 20' : '아직 기록이 없어요. 첫 기록에 도전해 보세요!';
    for (const entry of data.entries) {
      const row = document.createElement('li');
      const name = document.createElement('span'); name.textContent = `${entry.rank}. ${entry.name}`;
      const height = document.createElement('strong'); height.textContent = `${entry.height}층`;
      row.append(name, height); $('rankings').append(row);
    }
  } catch { $('ranking-status').textContent = '온라인 서버에 연결할 수 없습니다. 다운로드판은 연습용이며, 서버 주소에서 접속하면 다른 사람과 순위를 겨룰 수 있어요.'; }
}
function openRankings() { $('leaderboard').showModal(); syncPause(); refreshRankings(); }
document.addEventListener('pointerdown',()=>{if(!game&&!starting)audio.unlock().then(()=>{if(!game&&!starting&&!document.hidden&&!$('settings').open&&!$('leaderboard').open)audio.music(0,'title');});},{once:true});
document.addEventListener('click',e=>{if(game?.result||game?.paused)return;if(e.target.closest('button')&&!e.target.closest('#left,#right,#start,#retry,#next'))audio.event('ui_click');});
$('leaderboard-open').onclick = $('result-leaderboard').onclick = openRankings;
$('leaderboard-close').onclick = () => $('leaderboard').close();
$('leaderboard').onclose = () => { lastTime = undefined; syncPause(); };
$('ranking-refresh').onclick = refreshRankings;
$('online-mode').onchange = () => { $('stages').hidden = $('online-mode').checked; };
api('health').then(data => {
  onlineReady = data.version === 1;
  $('online-mode').disabled = !onlineReady; $('online-mode').checked = onlineReady;
  $('stages').hidden = onlineReady;
  $('connection-status').textContent = onlineReady ? '온라인 연결됨 · STAGE 1부터 도전해요' : '연습 모드';
}).catch(() => { $('connection-status').textContent = '연습 모드 · 온라인 서버 연결 없음'; });
$('theme-select').value = save.theme;
$('theme-select').onchange = async () => {
  const preference = $('theme-select').value, previous = save.theme;
  themeLoading = true; $('theme-select').disabled = true; syncPause();
  $('theme-status').textContent = '새 배경을 준비하고 있어요…';
  try {
    const theme = themeForStage(game?.stage ?? stage, preference);
    await preloadArt(theme); await audio.prepare(theme); activeTheme = theme; save.theme = preference; persist(); artNotice = '';
    $('theme-status').textContent = `${themeName(theme)} 배경을 선택했어요.`;
    updateScene();
  } catch {
    $('theme-select').value = previous;
    artNotice = '배경을 불러오지 못해 이전 배경을 유지해요.';
    $('theme-status').textContent = artNotice;
  } finally {
    themeLoading = false; $('theme-select').disabled = false; lastTime = undefined; syncPause();
  }
};
function updateScene() {
  if ($('scene').dataset.theme !== activeTheme) {
    $('scene-art').innerHTML = sceneArtwork(activeTheme); $('scene').dataset.theme = activeTheme;
    document.querySelector('.landmark-label').textContent = themeName(activeTheme);
    document.querySelector('footer span').textContent = themeName(activeTheme);
  }
}
updateScene();
function render() {
  if (!game) return;
  const g = game, player = g.player, hint = g.hintRoute();
  updateScene();
  const events = g.drainEvents();
  if(displayedPhase==='hint'&&g.phase==='playing')audio.event('hint_end');
  displayedPhase=g.phase;
  if(g.phase==='playing'&&!g.paused&&player.state==='idle'&&g.clock-lastReaction>=8000&&![...audio.nodes].some(n=>!n.music)){lastReaction=g.clock;audio.event('reaction_'+selected);}
  if(g.phase==='playing'&&g.remaining<=10000&&!warnedTimer){warnedTimer=true;audio.event('timer_warning');}
  for (const event of events) {
    if (event.type === 'land_safe') landed.set(event.actor, event.time);
    if (event.type === 'jump') jumped.set(event.actor, event.time);
    if (event.type === 'tile_crack') {
      const key = event.row*2+event.side; if (!cracked.has(key)) cracked.set(key,event.time);
      if (event.player) sessionFalls += 1;
    }
  }
  $('skip-rescue').hidden = sessionFalls < 2 || g.phase !== 'rescuing' || g.paused;
  const height = $('scene').clientHeight, spacing = Math.min(76, Math.max(28, (height - 110) / 4));
  const camera = Math.max(-1, player.row - (player.state === 'fall' ? 1 : 0));
  const bottom = 70;
  const tileY = row => bottom + (row - camera) * spacing;
  const startPlatform = document.querySelector('.scene-start'), finishPlatform = document.querySelector('.scene-finish');
  startPlatform.style.bottom = `${45-(camera+1)*spacing}px`;
  startPlatform.hidden = camera > 2; document.querySelector('.start-island').hidden = camera > 2;
  finishPlatform.style.bottom = `${tileY(g.config.rows)}px`; finishPlatform.hidden = tileY(g.config.rows) > height-40;
  let tiles = '';
  for (let row = Math.max(0, camera); row < Math.min(g.config.rows, camera + 5); row++) {
    for (let side = 0; side < 2; side++) {
      const state = g.observed[row][side], lit = hint?.[row] === side;
      const brokenAt = cracked.get(row*2+side), age = brokenAt === undefined ? Infinity : g.clock-brokenAt;
      const cracking = state === 'broken' && age < 150, collapsing = state === 'broken' && age >= 150 && age < 600;
      tiles += `<div class="tile ${state} ${cracking ? 'cracking' : collapsing ? 'collapsing' : ''} ${lit ? 'hint' : ''}" data-row="${row}" data-side="${side}" style="--collapse-opacity:${Math.max(0,1-(age-150)/450)};height:${Math.min(35, spacing * .62)}px;bottom:${tileY(row)}px;left:${side === 0 ? 27 : 59}%">${state !== 'broken' || cracking || collapsing ? artImage(chapterFile(activeTheme,cracking ? 'crack' : collapsing ? 'collapse' : 'tile'),'tile-art') : ''}<span>${state === 'safe' ? icon('safe_check') : state === 'broken' ? '×' : lit ? '✦' : String(row + 1).padStart(2, '0')}</span></div>`;
    }
  }
  $('board').innerHTML = tiles;
  $('hint-map').hidden = !hint;
  $('hint-map').innerHTML = hint ? `<small>길을 기억하세요 · 전체 경로</small><div>${hint.map((side, row) => `<span><b>${row + 1}</b>${side === 0 ? '↖' : '↗'}</span>`).join('')}</div>` : '';
  $('world-effects').innerHTML = g.actors.flatMap((actor, i) => {
    if (actor.state === 'rescued') return [];
    const x = actor.row < 0 ? 18 + i * 19 : (actor.side === 0 ? 32 : 64) + (i - 1.5) * 2.8;
    return worldEffects(g.clock, jumped.get(actor.id), landed.get(actor.id), reducedMotion).map(effect => `<div class="world-effect ${effect.kind}" style="left:${x}%;bottom:${tileY(actor.row)+5}px;opacity:${effect.opacity}">${artImage(`vfx/${effect.kind}_v01`)}</div>`);
  }).join('');
  $('actors').innerHTML = g.actors.map((actor, i) => {
    if (actor.state === 'rescued' || actor.state === 'finished' && !actor.player) return '';
    let row = actor.row, jumpHeight = 0, angle = 0, opacity = 1;
    if (actor.state === 'jump') { const t = 1 - (actor.until - g.clock) / JUMP_MS; row += t; jumpHeight = Math.sin(t * Math.PI) * (reducedMotion ? 0 : 25); }
    let y = tileY(row) + 10 + jumpHeight;
    if (actor.state === 'fall') {
      const t = FALL_MS - (actor.until - g.clock);
      if (t >= 1050) { if (actor.player) return ''; y = 30; }
      else if (t > 600) { y -= (t - 600) * .28; angle = reducedMotion ? 0 : (t - 600) * .06; opacity = Math.max(.2, 1 - (t - 700) / 550); }
    }
    const rescue=actor.state==='fall'?rescueFrame(FALL_MS-(actor.until-g.clock),reducedMotion):null;
    const x = actor.row < 0 && actor.state !== 'jump' ? 18 + i * 19 : (actor.side === 0 ? 32 : 64) + (i - 1.5) * 2.8;
    return `<div class="actor ${actor.player ? 'player' : 'npc'} ${actor.state}" data-actor="${actor.id}" style="left:${x}%;bottom:${y}px;opacity:1;transform:translateX(-50%) rotate(${angle}deg);z-index:${50 - Math.round(row * 2)}"><div class="actor-visual" style="opacity:${opacity};visibility:${rescue&&!rescue.actorVisible?'hidden':'visible'}">${actor.player ? '<span class="you">나</span>' : ''}${characterArt(actor.id, g.phase === 'hint' ? 'idle' : actingPose(actor,g.clock,landed.get(actor.id),g.observed), actor.state === 'idle' && ['hint','playing'].includes(g.phase) ? {clock:g.clock,index:i,reducedMotion} : undefined)}<small>${actor.player ? names[actor.id] : actor.state === 'fall' ? '어…?' : ['','먼저 가세요','왕이 먼저?','준비 운동 중'][i]}</small></div>${rescue&&rescue.cloudOpacity>0?`<div class="actor-cloud" style="opacity:${rescue.cloudOpacity};transform:translateY(${rescue.cloudY}px)">${artImage('integration/rescue/cloud')}</div>`:''}</div>`;
  }).join('')+'<div id="rescue-scene" hidden></div>';
  const recoveryActive = player.state === 'fall' && FALL_MS - (player.until - g.clock) >= 1050 && !g.result;
  $('rescue-scene').hidden = !recoveryActive;
  if (recoveryActive) {
    const transition=rescueFrame(FALL_MS-(player.until-g.clock),reducedMotion);
    $('rescue-scene').innerHTML = recoveryArt(player.id, false, reducedMotion);
    $('rescue-scene').style.zIndex='55';
    $('rescue-scene').querySelector('.recovery-person').style.visibility=transition.actorVisible?'visible':'hidden';
    $('rescue-scene').insertAdjacentHTML('beforeend',`<div class="rescue-cover" style="opacity:${transition.cloudOpacity};transform:translateY(${transition.cloudY}px)">${artImage('integration/rescue/cloud')}</div>`);
  }
  $('timer').textContent = String(Math.ceil(g.remaining / 1000)).padStart(2, '0');
  $('timer').classList.toggle('urgent', g.remaining < 10000);
  peak = Math.max(peak, heightReached(g));
  document.querySelector('.hud small').textContent = `${themeName(activeTheme)} · 최고 ${peak}층`;
  $('progress').textContent = `${Math.max(0, Math.min(g.config.rows, player.row + 1))} / ${g.config.rows}`;
  $('message').textContent = artNotice || (g.paused ? '잠시 쉬어가는 중이에요.' : g.phase === 'hint' ? `반짝이는 길을 기억하세요 · ${Math.max(1, Math.ceil((g.config.hint - g.clock) / 1000))}` : g.phase === 'rescuing' ? (player.until - g.clock > 800 ? '어? 분명 여기였는데…' : '구름 회수반 출동! 가방도 챙기세요.') : g.phase === 'result' ? '오늘도 양보해 주셔서 감사합니다.' : player.state === 'jump' ? '한 걸음, 조심조심.' : '왼쪽일까요, 오른쪽일까요?');
  $('left').disabled = $('right').disabled = g.paused || g.phase !== 'playing' || player.state !== 'idle';
  if (g.phase === 'result' && !resultHandled) audio.stop();
  for (const event of events) {
    if (event.type !== 'finish' && !(g.result && event.type==='rescue')) audio.event(event.type,{player:event.player});
    if (event.type === 'tile_crack' && event.player && save.settings.vibration) navigator.vibrate?.(60);
  }
  if (g.phase === 'result') result();
}
function frame(time) {
  if (game) {
    if (lastTime !== undefined) game.advance(time - lastTime);
    lastTime = time;
    if (!game.paused && ['hint','playing'].includes(game.phase)) audio.music(game.activeTime,activeTheme);
    render();
  } else lastTime = undefined;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
