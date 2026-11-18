# 다른 에이전트용 시작 안내 · 최신 v0.5 · 아트 v0.3 · 2026-11-18

이 ZIP은 Git 커밋 여부와 관계없이 현재 작업 폴더의 실제 최신 소스를 포함합니다. package.json의 version 0.1.0은 초기 패키지 표기이며 게임 구현 버전은 v0.5입니다.

## 먼저 읽기

1. docs/ONLINE.md: 현재 진행·힌트·온라인 점수 규칙과 배포 방법
2. docs/HANDOFF.md: 최신 변경과 과거 버전의 검증 이력
3. docs/ART_MANIFEST.md: 아트 초안 상태·기준점·레이어

기존 폴더가 있다면 수정 내용을 먼저 보존하세요. 게임 규칙은 src/game.js/progression.js, UI는 src/main.js, 서버는 server/index.mjs입니다.

## 즉시 실행 (이미 빌드된 온라인판)

Node.js 24에서 이 폴더로 이동해:

    npm run serve

기본 포트 8787. 서버가 게임과 온라인 스코어보드 API를 함께 제공합니다. DATA_DIR은 영구 저장 디렉터리, PORT는 포트 번호입니다. POSIX 예:

    DATA_DIR=/absolute/persistent/path PORT=8787 npm run serve

의존성 설치 없이 dist와 서버를 실행할 수 있습니다. 다른 사람과 순위를 공유하려면 실제 호스팅과 HTTPS 연결이 필요합니다. 공개 배포는 아직 하지 않았고, 연결된 호스팅 계정이나 도메인을 가정하지 마세요.

## 소스 수정·검증

    npm ci
    npm test
    npm run build
    npm run test:browser
    npm run test:online

일반 개발: npm run dev (기본 5173). 온라인 개발은 별도 터미널에 npm run serve를 켜면 Vite가 /api를 8787로 프록시합니다.

브라우저 테스트 기본 경로는 /usr/bin/chromium입니다. 환경에 맞게 CHROMIUM_PATH를 지정하거나 Playwright Chromium을 준비하세요. 온라인 테스트는 8791번 포트를 사용하며 테스트 순위는 임시 디렉터리에만 저장합니다.

원본 PNG 없이도 실행·수정·빌드·테스트할 수 있습니다. 실행용 WebP 40개를 포함했습니다. 원본 PNG 43개는 별도 Original_Art_1/2/3 ZIP에 원래 경로로 보관했습니다. 이 세 ZIP을 같은 상위 폴더에 풀어 합친 후 npm run art:prepare를 사용하세요. 원본 manifest와 아트 인계 문서는 본 ZIP에도 포함합니다. 주연 4인 원화와 공통 효과는 초안이며 음원은 임시입니다.

## 최신 규칙

- 성공 시 계속 다음 스테이지로 상승. 세 번째 이후에도 진행.
- 추락 시 직전 스테이지로 복귀. 첫 단계는 그대로. 시간 종료는 같은 단계 재시작.
- 힌트 2.6초부터 단계마다 0.2초 감소, 최소 0.6초.
- 점수는 최고 안전 도달 층수. 재등반 중복 가산 없음.
- 온라인 도전은 STAGE 1부터. 서버가 이동 기록을 재생해 점수를 검증하고 공용 순위를 파일로 보존.
- 계정 인증이나 완전한 봇 방지까지 구현한 서비스는 아님. 공개 운영 전 상세 한계는 docs/ONLINE.md 참조.

## 인계 시점 검증

단위/API 17개 통과, 브라우저 10개 항목(오리·토끼 320px 포즈/VFX와 기존 하락 진행 포함) 통과. 독립 브라우저 둘의 공유 순위/응답 유실 재전송/하락을 별도 온라인 검사로 확인했습니다. 포함된 연습 HTML의 오프라인 상승·하락·복귀 및 서버 ZIP의 Node 실행도 검증했습니다. 실제 모바일 기기의 청음·진동·재미 검증은 미실행입니다.

.git, node_modules, 캐시, 개인 순위 데이터, 환경 설정/자격증명, 테스트 출력은 포함하지 않습니다. 게임 저장은 새 브라우저에서 새로 시작합니다. PLAYTEST_SIMULATION.json은 v0.3 시점 자료이므로 현재 난이도 검증으로 혼동하지 마세요.

## 아트 v0.3 추가 인계

오리·토끼 각 7포즈, 도약·착지·구조 PNG 효과를 반영했습니다. 현재 사용 원본 경로는 assets/source/art-v03/, 실행용은 assets/runtime/art-v03/. 기준점/일정 배율은 src/art-layout.js와 docs/ART_REGISTRATION.json을 읽으세요. 원본 PNG의 번짐/오리 jump 치아/토끼 fall 가장자리는 초안 한계로 남아 있습니다. 게임 판정·힌트·하락·순위 규칙은 변경하지 않았습니다.

배포/다운로드 파일을 다시 만들 때 `npm run export:playtest` 다음 `python3 scripts/package-handoff.py`를 실행하세요. Python은 인계 ZIP 묶기만 사용하며 게임 실행에는 Node.js만 필요합니다.

GitHub의 최신 다운로드 목록: https://github.com/carzero/after-you/tree/handoff/v0.4/downloads
