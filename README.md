[최신 실행 소스와 아트 다운로드](https://github.com/carzero/after-you/tree/handoff/v0.4/downloads) · [다음 에이전트 시작 안내](START_HERE_KO.md)

# after-you

먼저 가세요 — CARZERO STUDIO 모바일 구름다리 코미디 게임

계속 올라가는 구름다리 웹 게임 프로토타입입니다. 추락하면 한 스테이지 아래에서 다시 출발하고, 올라갈수록 힌트가 짧아집니다. 2026-11-21 통합 원화의 수정 포즈·5개 배경 레이어·추가 연기·반송·UI 소재를 반영한 게임 v0.9입니다. 2026-11-24 보정된 기본 28포즈·등록 좌표와 세 캐릭터 국소 호흡을 추가 적용했습니다. 음원은 임시 합성음이며 최종 완성본이 아닙니다. 외부 API와 서버 계정 없이 실행됩니다.

## 실행

Node.js 24에서 확인했습니다.

```sh
npm ci --cache /workspace/.npm-cache
npm run dev
```

화면의 출발 버튼 → 잠깐 표시되는 경로 기억 → 왼쪽·오른쪽 버튼 또는 방향키로 이동합니다. NPC가 확인한 안전 발판도 이용할 수 있습니다. 첫 챕터 완료 시 네 캐릭터가 해금됩니다. 진행과 설정은 브라우저의 로컬 저장소에 저장됩니다.

```sh
npm test
npm run build
npm run test:browser
```

브라우저 검증은 기본적으로 `/usr/bin/chromium`을 사용합니다. 다른 환경에서는 `CHROMIUM_PATH`를 지정하세요. `npm run preview`로 빌드 결과를 실행할 수 있습니다. 서비스는 다음 작업에서 다시 시작해야 합니다.

상세 구현 범위·판정 정책·검증·미완료 항목은 [HANDOFF](docs/HANDOFF.md), 기획 원본은 [기획 및 인계서](docs/GAME_PLAN_AND_HANDOFF.md)를 참고하세요.

아트 원본은 `assets/source/art-20261121/`, 실행용 WebP는 `assets/runtime/art-20261121/`에 있습니다. 원본 검증과 실행용 재생성은 `npm run art:prepare`로 수행합니다. 적용 규약은 [ART_MANIFEST](docs/ART_MANIFEST.md)를 참고하세요.

반복 플레이 개선: 같은 방문에서 두 번째 추락부터 ‘연출 건너뛰기’로 결과 화면에 바로 갈 수 있습니다. 실패 판정과 해금 조건은 그대로입니다. 기기의 움직임 줄이기 설정도 따르며, 모바일 가로 화면에서는 게임과 제목을 나란히 배치합니다.

`npm run simulate`는 시드 1–300으로 3스테이지 × 3자동 입력 정책을 비교합니다. `npm run simulate -- --write`로 결과 JSON을 갱신할 수 있습니다. 사람의 플레이테스트 결과는 아니며, 방법과 한계는 [플레이 검증 기록](docs/PLAYTEST.md)에 정리했습니다.


v0.4 온라인판: `npm run build` 후 `npm run serve`로 같은 주소의 게임과 스코어보드 API를 시작합니다. 닉네임으로 도전하며 서버가 이동 기록을 검증해 최고 도달 층수를 비교합니다. 기본 포트 8787, 순위 저장 위치는 DATA_DIR로 지정하세요. 다운로드 HTML은 연습용입니다. 배포 방법/서버 검증 범위는 [ONLINE](docs/ONLINE.md) 참조.

`npm run test:online`으로 독립 브라우저 간 공유 순위를 검사합니다. `npm run export:playtest`로 새 연습용 HTML과 Node 서버 배포 ZIP을 `/workspace/shared/downloads`에 생성합니다. 이 명령은 외부 배포나 환경 게시를 하지 않습니다.

설정 → 배경 테마에서 5개 배경을 선택할 수 있습니다. 기본값은 다섯 스테이지마다 배경만 바뀝니다. 최신 적용 범위와 미사용 원화는 [11월 21일 통합 기록](docs/ART_INTEGRATION_20261121.md)을 참고하세요.

최신 통합: 2026-11-26 배경·전용 구름 v03·타이틀/결과·착지 직전 포즈·구조 가림·실제 BGM/효과음을 적용했습니다. `docs/INTEGRATION_20261126.md`를 확인하세요. 실행 ZIP과 최신 소스는 downloads/README.md의 v0.9 링크를 사용하세요.

Cloudflare 배포는 `docs/CLOUDFLARE.md`를 참고하세요. 게임과 순위 서버를 Workers + SQLite Durable Object로 배포하도록 준비되어 있습니다. 배포 준비 코드가 있다는 것과 공개 배포 완료는 별개입니다.
