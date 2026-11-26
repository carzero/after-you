# Cloudflare 배포

정적 게임과 `/api`를 하나의 Cloudflare Worker로 배포합니다. 전역 순위, 진행 중인 도전, 이전 토큰 응답과 시작 제한을 SQLite Durable Object에 저장합니다. 브라우저를 닫거나 Worker가 재시작돼도 서버 기록은 보존됩니다. 로컬 연습 저장은 별도로 같은 브라우저의 localStorage를 사용합니다.

## 실행

Node 24 이상에서:

```
npm ci
npm test
npm run test:cloudflare
npm run deploy:cloudflare
```

`deploy:cloudflare`는 Vite 빌드 후 Wrangler로 배포합니다. `wrangler.jsonc`의 Worker 이름은 `after-you`이며, 첫 배포 때 RankingStore SQLite Durable Object를 생성합니다. 별도 DB ID를 소스에 하드코딩하지 않습니다. 기존 동일 이름 Worker가 있으면 기존 프로젝트인지 확인한 뒤 배포하세요. 사용자 도전 토큰/순위가 있는 Durable Object의 이름 `global-v1`이나 binding/migration을 함부로 바꾸거나 삭제하지 마세요.

## 인증과 네트워크

`CLOUDFLARE_API_TOKEN`은 비밀값으로, `CLOUDFLARE_ACCOUNT_ID`는 대상 계정 ID로 환경에 등록합니다. Cloudflare의 Edit Cloudflare Workers 템플릿에서 대상 계정만 선택하세요. 토큰은 소스, 커밋, 채팅, README 또는 로그에 넣지 않습니다. 계정 설정 페이지에서 Account ID를 확인할 수 있습니다.

배포에는 `api.cloudflare.com` HTTPS 접근이 필요합니다. 배포 후 표시되는 실제 `after-you.<subdomain>.workers.dev` 주소도 공개 검증을 위해 접근 가능해야 합니다. Workers.dev 서브도메인은 Cloudflare 계정에서 제공하는 값이며 배포 전 임의로 만들거나 추정하지 않습니다.

현재 채팅의 준비 시점에는 인증 변수가 없고, Cloudflare API에 대한 CONNECT가 환경 프록시에서 403으로 차단됐습니다. 따라서 로컬 검증 통과가 공개 배포 성공을 의미하지 않습니다. 인증/네트워크 설정이 실제 반영된 뒤 계정과 대상 Worker를 확인하고 배포합니다.

## Cloudflare 대시보드에서 GitHub 연동하는 대안

Workers & Pages에서 GitHub 저장소 `carzero/after-you`, 브랜치 `handoff/v0.4`를 선택합니다. Workers 프로젝트의 빌드 명령은 `npm run build`, 배포 명령은 `npx wrangler deploy`, 프로젝트 루트는 저장소 루트입니다. 정적 파일 전용 Pages 업로드로는 Durable Object 순위 서버가 배포되지 않으므로 Worker 설정을 사용하세요. 대시보드 인증을 사용할 때에는 API 토큰을 GitHub 소스에 넣을 필요가 없습니다.

## 검증 및 운영

- `npm run check:cloudflare`: 로그인 없이 번들과 binding 구성을 dry-run 검사.
- `npm run test:cloudflare`: Wrangler/Workerd 로컬 런타임에 임시 SQLite 저장소를 만들어 두 브라우저가 순위를 공유하고, 손실 응답 재전송과 스테이지 복귀를 검사.
- `npm run test:online`: 기존 Node 서버에 대한 같은 브라우저 검증.
- 공개 `/api/health`는 version 1, mode online 및 storage durable-object-sqlite를 반환해야 합니다.
- 사이트 진입 후 온라인 도전이 활성화되는지, 실제 게임 기록이 서버 검증 후 올라오는지 확인하세요. 클라이언트 점수는 신뢰하지 않고 공통 validate-run 모듈이 이동 경로/시간/최고 층수/복귀를 다시 계산합니다.
- 동일 IP의 시작 요청은 시간당 60회이며 원본 IP 대신 Cloudflare edge IP의 SHA256만 제한 키로 보관합니다. 서버 순위는 최대 1000개, 공개 목록은 상위 20개입니다. 활동 없는 도전은 1시간 뒤 만료됩니다.
- Node 서버에서 생성한 로컬 순위 JSON을 자동 이관하지 않습니다. 아직 공개 배포된 서버가 없으므로 Cloudflare 순위는 새 저장소에서 시작합니다.
- `.wrangler`, `.dev.vars`, `.env`와 개발용 DB는 Git에서 제외합니다. 운영 시에는 배포 URL과 검증 결과를 별도로 기록하세요.

컨테이너나 `/workspace` 쓰기 제한 때문에 Wrangler 기본 설정 경로가 막히는 개발 환경에서는, 사용자 쓰기 가능한 디렉터리를 XDG_CONFIG_HOME으로 지정하고 WRANGLER_LOG_PATH를 `/tmp` 아래로 지정할 수 있습니다. 실제 인증 값은 계속 환경 비밀값으로 관리합니다.

## 준비 검사 결과 · 2026-11-26

공통 및 Cloudflare API 단위 검사 32개, Workerd+SQLite의 실제 두 브라우저 순위 검사 1개, Node 서버의 동일 검사 1개 통과. Worker dry-run 빌드와 ASSETS/RANKINGS 바인딩 확인 완료. 아직 Cloudflare 인증/네트워크 연결이 없어 운영 배포 명령은 실행하지 않았으며 공개 URL은 없습니다.

## Windows CMD 전용 ZIP

`downloads/AFTER_YOU_Cloudflare_CMD_v0.9.zip`은 Git 없이 배포할 수 있는 독립 묶음입니다. Node.js 24 이상 설치 후 전체 압축을 풀고 루트의 `DEPLOY.cmd`를 실행하세요. 의존성 설치, 브라우저 로그인, 빌드/배포를 순서대로 수행합니다. 원본 비밀값이나 기존 순위 DB는 포함하지 않습니다.

재포장: `python3 scripts/package-cloudflare.py`. ZIP 내부 해시와 ASCII/CRLF 배치 파일을 확인했고, 압축 해제본의 빌드와 Workers dry-run도 통과했습니다. Linux 환경이므로 Windows CMD 자체의 실제 실행/로그인 승인은 사용자 PC에서 진행해야 합니다.

## v0.9.1 업데이트

사용자가 v0.9 배포 주소로 https://after-you.kaelsiem.workers.dev 를 알려주었습니다. 이 환경에서는 해당 도메인 접근이 차단되어 원격 확인은 하지 못했습니다. 수정판 v0.9.1은 AFTER_YOU_Cloudflare_CMD_v0.9.1.zip의 UPDATE.cmd로 동일 계정/Worker에 재배포합니다. Worker 이름·Durable Object binding·migration과 저장소 이름은 변경하지 않았습니다.
