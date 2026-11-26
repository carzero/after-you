# 다음 에이전트 시작 안내 · 게임 v0.9.1 · 자료 통합 2026-11-26

현재 작업 폴더의 소스·실행용 아트·서버·테스트·빌드·연습 HTML을 담은 인계본이다. package.json version 0.1.0은 최초 프로젝트 표기이며 실행 인계 버전은 v0.6이다.

## 먼저 읽기

1. docs/ART_INTEGRATION_20261121.md: 이번 적용 범위, 남은 품질, 미사용 역할
2. docs/ONLINE.md: 무한 진행/하락/점수와 서버 배포
3. docs/HANDOFF.md: 현재 상태와 과거 이력

기존 변경을 보존한다. Game/progression/server의 경로·NPC·진행·순위 규칙은 이번 아트 작업에서 변경하지 않았다. 스테이지는 무한 상승, 추락은 한 단계 아래, 힌트는 2.6초부터 최소 0.6초, 점수는 최고 안전 도달 층수다.

## 즉시 실행

Node.js 24에서 압축을 푼 폴더로 이동:

    npm run serve

이미 빌드된 dist와 서버를 실행하며 기본 포트는 8787. 설치 없이 가능. 온라인 순위 파일은 DATA_DIR, 포트는 PORT로 지정한다. 예:

    DATA_DIR=/absolute/persistent/path PORT=8787 npm run serve

서버/영구 저장/HTTPS를 실제 호스팅에 배포해야 다른 기기들이 같은 순위를 공유한다. 아직 공개 배포하지 않았고, 호스팅 계정이나 자격증명이 연결됐다고 가정하지 않는다.

playtest/AFTER_YOU_Playtest_v0.6.html은 Chrome/Edge로 여는 오프라인 연습판이다. 온라인 기록을 제출하는 게임처럼 표시하지 않는다.

## 소스 작업

    npm ci
    npm test
    npm run build
    npm run test:browser
    npm run test:online

개발 서버는 npm run dev(5173). 온라인 개발은 다른 터미널의 npm run serve(8787)를 사용하며 Vite /api 프록시가 연결한다. 브라우저 테스트는 기본 /usr/bin/chromium; 다른 환경은 CHROMIUM_PATH 지정. 온라인 검증 서버는 8791을 사용한다.

## 아트

- assets/runtime/art-20261121/: 실행 WebP 124개 + SVG 24개. 이 파일만으로 실행·수정·빌드·검증 가능.
- assets/source/art-20261121/: 원본 manifest/연결표/검수 자료. PNG 168개는 별도 Original_Art_*_20261121.zip들에 나눠 보관.
- 원본을 재가공하려면 ORIGINAL_ART_PARTS.json에 있는 원본 ZIP을 모두 같은 상위 폴더에 풀면 본 소스 폴더에 합쳐진다. 이후 npm run art:prepare로 해시 확인과 런타임 재생성.
- src/art-catalog.js는 생성된 실제 파일 연결표, src/art-layout.js와 docs/ART_REGISTRATION.json은 수동 기준점/고정 배율.
- 설정 → 배경 테마에서 5개 배경을 볼 수 있음. 자동은 5단계마다 배경 순환이며 게임/해금 조건은 바꾸지 않음.
- duck jump_v02, rabbit fall_v02를 사용. 반송 합성에 캐릭터/상자를 중복 배치하지 않음.
- 본편 엔딩/진입 컷/turnaround/대체 backdrop/콘셉트/archive는 보존만 한다. 정적 UI 예시를 게임 루트에 덮어쓰지 않는다.

원화는 여전히 초안. 외곽 잔여 픽셀·번짐·포즈 비율 통일·연속 모션·실제 음원·실기기 품질은 남아 있다. 기존 Web Audio 임시 합성음 유지.

## 검증과 내보내기

단위/API 19개, 브라우저 13개, 온라인 공유 순위 1개 통과. 작은 화면/5개 테마/설정 복원/이미지 지연 로드/실패 시 이전 배경 유지/반송 합성/기존 진행과 순위를 확인했다. 실제 모바일 기기의 청음·진동·메모리/프레임 검증은 미실행.

    npm run export:playtest
    python3 scripts/package-handoff.py

기본 출력 /workspace/shared/downloads. 두 명령에 출력 폴더를 인수로 전달 가능. Python은 인계 ZIP 묶기만 사용하며 게임 실행에는 필요 없음. .git/node_modules/캐시/개인 순위/환경 자격증명은 인계 ZIP에 포함하지 않는다.

GitHub 다운로드 목록: https://github.com/carzero/after-you/tree/handoff/v0.4/downloads

## 2026-11-23 다운로드 HTML 호환성 수정

단독 HTML은 모듈 대신 자체 포함 일반 스크립트로 내보냅니다. JavaScript를 실행하지 않는 미리보기에서도 브라우저 열기 안내를 표시합니다. `node scripts/test-standalone.mjs`는 서버·네트워크·저장소 없는 opaque origin에서 시작과 이동, JavaScript 비활성 안내를 검증합니다. 관리형 브라우저의 파일 URL 정책 때문에 실제 file:// 탐색은 검증하지 못했습니다.

## 2026-11-24 게임 v0.7

대기 중 눈 깜빡임과 미세 호흡 적용. 이동/연기/추락/결과 동작이 우선하고 설정·일시정지·탭 숨김 중에는 게임 시계와 함께 멈춥니다. 움직임 줄이기는 정지 대기를 표시합니다. 들숨 후보 원화는 사용하지 않습니다. `docs/idle-review/README_KO.md`와 `runtime-manifest.json` 참고. 최신 실행 파일: AFTER_YOU_Playtest_v0.7.html. 소스 ZIP의 실행용 아트는 모두 포함되어 있어 원화 ZIP이 없어도 실행할 수 있습니다.

## 2026-11-24 게임 v0.8

기본 28포즈 보정·몸통/지상 기준점 등록, 비둘기·오리·토끼의 국소 호흡 프레임을 적용했습니다. `docs/ART_INTEGRATION_20261124.md`부터 확인하세요. 최신 게임 다운로드는 AFTER_YOU_Playtest_v0.8.zip이며 압축을 풀고 AFTER_YOU.html을 실제 브라우저에서 엽니다. 최신 소스는 AFTER_YOU_Source_v0.8.zip입니다. 아래 이전 기록의 다운로드 버전은 당시 스냅샷입니다.

## 최신 게임 v0.9 · 2026-11-26

`docs/INTEGRATION_20261126.md`가 최신 인계 기준입니다. 5개 배경 레이어와 4/5챕터 전용 구름 v03, 새 타이틀·결과·해금 표시, descent 4장, 구조 가림 및 실제 음원 33종을 통합했습니다. 무한 진행과 서버 순위 규칙은 유지합니다. 실행은 AFTER_YOU_Playtest_v0.9.zip의 압축을 풀고 AFTER_YOU.html을 여세요. 전체 소스는 AFTER_YOU_Source_v0.9.zip이며 실행용 WebP/MP3가 포함되어 있어 원본 아트·음원 ZIP 없이 빌드할 수 있습니다. 기록·자격증명·캐시는 포함하지 않습니다. 이전 문서의 다운로드 버전은 당시 기록입니다.

## Cloudflare 배포 준비 · 2026-11-26

`docs/CLOUDFLARE.md`, `wrangler.jsonc`, `cloudflare/worker.js`가 추가됐습니다. 게임은 v0.9이며 Cloudflare용 영구 순위 API를 준비했습니다. `server/validate-run.mjs`를 Node와 Worker가 공유합니다. 실제 배포 여부는 배포 URL/Cloudflare CLI 성공 결과로 확인해야 하며 준비 시점에는 인증·API 네트워크 접근이 미설정입니다.

## v0.9.1 · 플레이 화면 깜빡임 수정

`docs/RENDER_FIX_20261126.md` 참고. RAF마다 SVG를 재생성하지 않고 keyed DOM 갱신을 사용합니다. 기존 Cloudflare 배포 사용자는 CMD v0.9.1 ZIP의 UPDATE.cmd로 재배포합니다. Worker 이름과 영구 저장소는 동일하게 유지합니다.
