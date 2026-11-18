import './style.css';
import { Game, STAGES, PEOPLE, JUMP_MS, FALL_MS } from './game.js';
import { loadSave, storeSave, recordWin } from './save.js';
import { characterArt, names, artImage, preloadArt, recoveryArt } from './art.js';
import { poseFor } from './art-layout.js';
import { stageConfig, restartStage, heightReached, seededRandom } from './progression.js';
import { api } from './online.js';
import { AudioBus } from './audio.js';
let storage;
try { storage = window.localStorage; } catch { storage = null; }
const save = loadSave(storage), audio = new AudioBus(save.settings);
const landed = new Map();
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = save.settings.reducedMotion || motionPreference.matches;
let sessionFalls = 0;
let peak = 0, roundMoves = [], onlineRun = null, onlineNext = null, onlineReady = false;
let returnStage = 0, checkpointBusy = false;
let artLoadError = false;
const artReady = preloadArt().catch(() => { artLoadError = true; });
let game = null, stage = 0, selected = 'potato', userPaused = false, lastTime, resultHandled = false, saveFailed = false;
const $ = id => document.getElementById(id);
document.querySelector('#app').innerHTML = `
<main class="shell">
  <header><a class="wordmark" href="./" aria-label="먼저 가세요 홈">CARZERO <span>STUDIO</span></a><button id="settings-open" class="icon-button" aria-label="설정">⚙</button></header>
  <section class="heading"><div class="eyebrow">A LITTLE COURAGE, PLEASE</div><h1>먼저 가세요<span>AFTER YOU</span></h1><p>소원은 간절합니다. 먼저 갈 생각은 없습니다.</p></section>
  <section class="game-card" aria-label="구름 정거장 게임">
    <div class="hud"><div><small>CHAPTER 01 · 구름 정거장</small><strong id="stage-label">첫 번째 양보</strong></div><button id="pause" class="icon-button" aria-label="일시정지" disabled>Ⅱ</button><div class="timer"><strong id="timer">35</strong><small>남은 시간</small></div></div>
    <div class="scene" id="scene">${artImage('environment/sky_v01', 'scene-sky')}<div class="sun"></div><div class="cloud cloud-a"></div><div class="cloud cloud-b"></div><div class="cloud cloud-c"></div><div class="office">${artImage('environment/office_v01')}<span>소원 접수처</span><small>방문 접수만 가능합니다</small></div><div id="board"></div><div id="hint-map" class="hint-map" aria-label="안전 경로 미리보기"></div><div class="flight-sign">비행 금지<br><span>양보는 환영</span></div><div id="actors"></div><div id="rescue-scene" hidden></div><button id="skip-rescue" hidden>연출 건너뛰기 ↗</button><div class="start-island">CLOUD STATION <span>출발</span></div><div class="scene-caption">아트 v0.2 초안 · 일부 임시 그래픽 / 합성음</div></div>
    <div class="status-line"><span class="status-dot"></span><p id="message" role="status" aria-live="polite">두 발판 중 하나는 안전합니다.</p><span id="progress">0 / 8</span></div>
    <div class="controls"><button id="left" disabled><span>↖</span>왼쪽</button><button id="right" disabled>오른쪽<span>↗</span></button></div>
  </section>
  <footer><span>01 — 구름 위의 작은 양보</span><span>← → 키로도 이동</span></footer>
</main>
<div class="veil" id="lobby"><section class="panel lobby-panel" aria-labelledby="lobby-title"><div class="ticket">소원 접수 초대장 <span>NO. 001</span></div><div class="lobby-art">${characterArt('potato')}${characterArt('pigeon')}</div><div class="eyebrow">WELCOME TO CLOUD STATION</div><h2 id="lobby-title">소원 하나, 용기 한 걸음.</h2><p>안전한 길을 잠깐 기억하세요.<br>망설여진다면 친구들의 발걸음을 살펴보세요.</p><p class="climb-rule">추락하면 한 스테이지 아래에서 다시 출발!<br>높이 올라갈수록 힌트가 짧아져요.</p><div class="online-entry"><label>닉네임 <input id="nickname" maxlength="16" placeholder="구름손님" value="구름손님" autocomplete="nickname"></label><label class="mode-toggle"><input type="checkbox" id="online-mode" disabled> 온라인 순위 도전</label><small id="connection-status" role="status">온라인 서버 확인 중…</small></div><div id="stages" class="stage-picker"></div><div id="characters" class="character-picker"></div><button id="start" class="primary">초대장 들고 출발하기 <span>↗</span></button><button id="leaderboard-open" class="text-button">스코어보드 보기</button><small class="prototype-note">감자·비둘기 아트 초안 적용 · 오리·토끼·음원은 임시</small><p id="save-warning" class="save-warning"></p></section></div>
<div class="veil" id="result" hidden><section class="panel" aria-labelledby="result-title"><div id="result-art" class="result-art"></div><div class="eyebrow" id="result-eyebrow"></div><h2 id="result-title"></h2><p id="result-text"></p><div class="stamp" id="stamp"></div><button id="retry" class="primary">한 번 더 건너기 ↗</button><button id="next" class="secondary" hidden>다음 스테이지</button><p id="online-result" role="status"></p><button id="network-retry" class="secondary" hidden>기록 전송 다시 시도</button><button id="result-leaderboard" class="text-button">스코어보드 보기</button><br><button id="home" class="text-button">정거장으로 돌아가기</button></section></div>
<div class="veil" id="paused" hidden><section class="panel"><div class="eyebrow">TAKE YOUR TIME</div><h2>잠깐, 숨 고르기</h2><p>다리도 시간도 기다리고 있어요.</p><button id="resume" class="primary">다시 건너기</button><button id="pause-home" class="text-button">정거장으로 돌아가기</button></section></div>
<dialog id="leaderboard"><div class="dialog-head"><h2>구름 위 스코어보드</h2><button id="leaderboard-close" class="icon-button" aria-label="스코어보드 닫기">×</button></div><p>최고 도달 높이로 겨뤄요.<br>추락 후 다시 오른 구간은 중복 가산되지 않아요.</p><p id="ranking-status" role="status"></p><ol id="rankings"></ol><button id="ranking-refresh" class="primary">순위 새로고침</button><small>같은 서버에서 플레이한 온라인 도전 기록 · 닉네임은 중복될 수 있어요.</small></dialog><dialog id="settings"><form method="dialog"><div class="dialog-head"><h2>구름 정거장 설정</h2><button class="icon-button" aria-label="설정 닫기">×</button></div><p>편안하게 건너갈 준비를 해요.</p><label>배경 음악 <input type="checkbox" id="music"></label><label>효과음 <input type="checkbox" id="sound"></label><label>진동 <input type="checkbox" id="vibration"></label><label>움직임 줄이기 <input type="checkbox" id="reducedMotion"></label><small>음악·효과음은 임시 합성음입니다.<br>진동은 지원하는 기기에서만 작동합니다.<br>기기의 움직임 줄이기 설정도 함께 따릅니다.</small><button class="primary">설정 완료</button></form></dialog>`;
function persist() { saveFailed = !storeSave(storage, save); $('save-warning').textContent = saveFailed ? '저장소를 사용할 수 없어 이번 방문에서만 진행이 유지됩니다.' : ''; }
function pickers() {
  $('stages').innerHTML = STAGES.map((s, i) => `<button data-stage="${i}" class="${stage === i ? 'selected' : ''}" ${i > save.unlockedStage ? 'disabled' : ''}>${i > save.unlockedStage ? '잠김' : `0${i + 1}`}<small>${s.rows}걸음</small></button>`).join('');
  $('characters').innerHTML = PEOPLE.map(id => `<button data-character="${id}" aria-label="${names[id]}${id !== 'potato' && !save.chapterComplete ? ' · 1챕터 완료 후 해금' : ''}" aria-pressed="${selected === id}" ${id !== 'potato' && !save.chapterComplete ? 'disabled' : ''}>${characterArt(id)}<span>${names[id]}</span></button>`).join('');
}
pickers();
$('stages').onclick = e => { const b = e.target.closest('[data-stage]'); if (b && !b.disabled) { stage = +b.dataset.stage; pickers(); } };
$('characters').onclick = e => { const b = e.target.closest('[data-character]'); if (b && !b.disabled) { selected = b.dataset.character; pickers(); } };
function syncPause() {
  game?.setPaused(userPaused || document.hidden || $('settings').open || $('leaderboard').open);
  if (game?.paused) { audio.stop(); $('skip-rescue').hidden = true; }
}
async function start(continuing = false) {
  $('start').disabled = $('retry').disabled = $('next').disabled = true;
  audio.stop(); audio.unlock(); await artReady;
  $('start').disabled = $('retry').disabled = $('next').disabled = false;
  if (artLoadError) { $('save-warning').textContent = '아트 파일을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.'; return; }
  if (!continuing) {
    onlineRun = null; onlineNext = null; peak = 0;
    if ($('online-mode').checked) {
      try { onlineNext = await api('runs', {name: $('nickname').value}); onlineRun = onlineNext.runId; }
      catch (e) { $('save-warning').textContent = e.message; return; }
    }
  }
  if (onlineRun) stage = onlineNext.stage;
  const random = onlineRun ? seededRandom(onlineNext.seed) : Math.random;
  roundMoves = []; checkpointBusy = false;
  landed.clear(); game = new Game({ stage, character: selected, random }); resultHandled = false; userPaused = false; lastTime = undefined;
  for (const id of ['lobby', 'result', 'paused']) $(id).hidden = true;
  $('stage-label').textContent = `0${stage + 1} · ${stageConfig(stage).title}`;
  $('pause').disabled = false; syncPause(); render();
}
$('start').onclick = () => start();
function continueClimb() { stage = returnStage; start(true); }
$('retry').onclick = $('next').onclick = continueClimb;
function home() { audio.stop(); game = null; onlineRun = null; onlineNext = null; $('skip-rescue').hidden = true; $('result').hidden = $('paused').hidden = true; $('lobby').hidden = false; $('pause').disabled = true; $('left').disabled = $('right').disabled = true; pickers(); $('start').focus(); }
$('home').onclick = $('pause-home').onclick = home;
$('pause').onclick = () => { if (game && !game.result) { userPaused = true; $('paused').hidden = false; syncPause(); } };
$('resume').onclick = () => { userPaused = false; $('paused').hidden = true; lastTime = undefined; audio.unlock(); syncPause(); };
function move(side) { if (game?.move(side)) { roundMoves.push({at:game.clock,side}); render(); } }
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
  $(key).onchange = () => { save.settings[key] = $(key).checked; audio.stop(); persist(); applySettings(); };
}
function applySettings() {
  reducedMotion = save.settings.reducedMotion || motionPreference.matches;
  document.body.classList.toggle('reduced-motion', reducedMotion);
}
motionPreference.addEventListener('change', applySettings);
applySettings();
function result(finishDelay = 0) {
  if (resultHandled) return; resultHandled = true; audio.event('finish', finishDelay);
  const success = game.result === 'success';
  if (success) recordWin(save, stage, game.activeTime);
  peak = Math.max(peak, heightReached(game)); save.bestHeight = Math.max(save.bestHeight, peak); persist();
  returnStage = restartStage(stage, game.result);
  $('result-art').innerHTML = success ? characterArt(selected, 'finished') : game.result === 'fall' ? recoveryArt(selected, true) : characterArt(selected, 'idle');
  $('result-eyebrow').textContent = success ? 'WISH RECEIVED' : 'CLOUD RECOVERY SERVICE';
  $('result-title').textContent = success ? '한 걸음 더 가까워졌어요.' : (game.result === 'timeout' ? '접수 시간이 끝났어요.' : '구름 회수반이 도착했어요.');
  const hintSeconds = (stageConfig(returnStage).hint / 1000).toFixed(1);
  $('result-text').textContent = success
    ? `최고 ${peak}층 · ${(game.activeTime / 1000).toFixed(2)}초\nSTAGE ${returnStage + 1}로 올라갑니다. 다음 힌트 ${hintSeconds}초!`
    : game.result === 'fall'
      ? `푹신한 구름이 받아줬어요!\nSTAGE ${stage + 1} → STAGE ${returnStage + 1}에서 다시 출발해요.\n최고 ${peak}층 기록은 남아 있어요.`
      : `시간이 끝났어요. STAGE ${returnStage + 1}에서 다시 출발해요.\n최고 ${peak}층 기록은 남아 있어요.`;
  if (saveFailed) $('result-text').textContent += '\n저장 불가: 기록은 이번 방문에서만 유지됩니다.';
  $('stamp').textContent = success ? `${peak}층 도달!` : '무사히 반송 완료';
  $('next').hidden = !success; $('retry').hidden = success;
  $('retry').textContent = `STAGE ${returnStage + 1}에서 다시 출발 ↗`;
  $('next').textContent = `STAGE ${returnStage + 1}로 계속 올라가기 ↗`;
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
function render() {
  if (!game) return;
  const g = game, player = g.player, hint = g.hintRoute();
  const events = g.drainEvents();
  for (const event of events) {
    if (event.type === 'land_safe') landed.set(event.actor, event.time);
    if (event.type === 'tile_crack' && event.player) sessionFalls += 1;
  }
  $('skip-rescue').hidden = sessionFalls < 2 || g.phase !== 'rescuing' || g.paused;
  const height = $('scene').clientHeight, spacing = Math.min(76, Math.max(28, (height - 110) / 4));
  const camera = Math.max(-1, player.row - (player.state === 'fall' ? 1 : 0));
  const bottom = 70;
  const tileY = row => bottom + (row - camera) * spacing;
  let tiles = '';
  for (let row = Math.max(0, camera); row < Math.min(g.config.rows, camera + 5); row++) {
    for (let side = 0; side < 2; side++) {
      const state = g.observed[row][side], lit = hint?.[row] === side;
      const cracking = state === 'broken' && g.actors.some(a => a.state === 'fall' && a.row === row && a.side === side && FALL_MS - (a.until - g.clock) < 150);
      tiles += `<div class="tile ${state} ${cracking ? 'cracking' : ''} ${lit ? 'hint' : ''}" data-row="${row}" data-side="${side}" style="height:${Math.min(35, spacing * .62)}px;bottom:${tileY(row)}px;left:${side === 0 ? 27 : 59}%">${state !== 'broken' || cracking ? artImage(cracking ? 'environment/tile_cracked_v01' : 'environment/tile_v01', 'tile-art') : ''}<span>${state === 'safe' ? '✓' : state === 'broken' ? '×' : lit ? '✦' : String(row + 1).padStart(2, '0')}</span></div>`;
    }
  }
  $('board').innerHTML = tiles;
  $('hint-map').hidden = !hint;
  $('hint-map').innerHTML = hint ? `<small>길을 기억하세요 · 전체 경로</small><div>${hint.map((side, row) => `<span><b>${row + 1}</b>${side === 0 ? '↖' : '↗'}</span>`).join('')}</div>` : '';
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
    const x = actor.row < 0 && actor.state !== 'jump' ? 18 + i * 19 : (actor.side === 0 ? 32 : 64) + (i - 1.5) * 2.8;
    return `<div class="actor ${actor.player ? 'player' : 'npc'} ${actor.state}" data-actor="${actor.id}" style="left:${x}%;bottom:${y}px;opacity:${opacity};transform:translateX(-50%) rotate(${angle}deg);z-index:${50 - Math.round(row * 2)}">${actor.player ? '<span class="you">나</span>' : ''}${characterArt(actor.id, poseFor(actor, g.clock, landed.get(actor.id)))}<small>${actor.player ? names[actor.id] : actor.state === 'fall' ? '어…?' : ['','먼저 가세요','왕이 먼저?','준비 운동 중'][i]}</small></div>`;
  }).join('');
  const recoveryActive = player.state === 'fall' && FALL_MS - (player.until - g.clock) >= 1050 && !g.result;
  $('rescue-scene').hidden = !recoveryActive;
  if (recoveryActive) $('rescue-scene').innerHTML = recoveryArt(player.id);
  $('timer').textContent = String(Math.ceil(g.remaining / 1000)).padStart(2, '0');
  $('timer').classList.toggle('urgent', g.remaining < 10000);
  peak = Math.max(peak, heightReached(g));
  document.querySelector('.hud small').textContent = `STAGE ${g.stage + 1} · 최고 ${peak}층`;
  $('progress').textContent = `${Math.max(0, Math.min(g.config.rows, player.row + 1))} / ${g.config.rows}`;
  $('message').textContent = g.paused ? '잠시 쉬어가는 중이에요.' : g.phase === 'hint' ? `반짝이는 길을 기억하세요 · ${Math.max(1, Math.ceil((g.config.hint - g.clock) / 1000))}` : g.phase === 'rescuing' ? (player.until - g.clock > 800 ? '어? 분명 여기였는데…' : '구름 회수반 출동! 가방도 챙기세요.') : g.phase === 'result' ? '오늘도 양보해 주셔서 감사합니다.' : player.state === 'jump' ? '한 걸음, 조심조심.' : '왼쪽일까요, 오른쪽일까요?';
  $('left').disabled = $('right').disabled = g.paused || g.phase !== 'playing' || player.state !== 'idle';
  if (g.phase === 'result' && !resultHandled) audio.stop();
  for (const event of events) {
    if (event.type !== 'finish') audio.event(event.type);
    if (event.type === 'tile_crack' && event.player && save.settings.vibration) navigator.vibrate?.(60);
  }
  if (g.phase === 'result') result(events.some(e => e.type === 'rescue' && e.player) ? .14 : 0);
}
function frame(time) {
  if (game) {
    if (lastTime !== undefined) game.advance(time - lastTime);
    lastTime = time;
    if (!game.paused && game.phase === 'playing') audio.music(game.activeTime);
    render();
  } else lastTime = undefined;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
