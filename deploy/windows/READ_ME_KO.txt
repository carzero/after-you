v0.9.4: 승인된 밀도 개선 타이틀 적용. 캐릭터 확대, 말풍선 근접 배치, 출발자 없음 도장.

깜빡임 수정 업데이트 v0.9.1

이미 배포했던 PC라면 압축을 푼 뒤 UPDATE.cmd를 실행하세요. 기존 Cloudflare 로그인을 사용해 다시 배포합니다. 완료 후 게임에서 Ctrl+F5를 눌러 주세요. 최초 배포나 로그인이 필요한 경우 DEPLOY.cmd를 사용합니다. 순위 저장소 이름과 마이그레이션을 변경하지 않았습니다.

AFTER YOU v0.9.4 - Cloudflare CMD 배포 묶음

준비물: Windows, Node.js 24 이상, Cloudflare 계정, 인터넷 연결.
Git은 없어도 됩니다. 이 ZIP에는 게임 코드, 실행용 아트/음원, Cloudflare 순위 서버와 배포 설정이 포함됩니다.

1. ZIP의 압축을 모두 풉니다. ZIP 안에서 CMD 파일만 직접 열지 마세요.
2. 압축을 푼 폴더에서 DEPLOY.cmd를 실행합니다.
3. 브라우저가 열리면 Cloudflare에 로그인하고 Wrangler 접근을 허용합니다.
4. 계정 선택을 묻는 경우 배포할 Cloudflare 계정을 선택합니다.
5. 마지막에 출력되는 https://after-you.<계정서브도메인>.workers.dev 주소를 엽니다.

DEPLOY.cmd는 의존성 설치 -> Cloudflare 로그인 -> 빌드와 배포를 순서대로 실행합니다.
PC에 CLOUDFLARE_API_TOKEN이 이미 설정돼 있으면 기존 토큰 인증을 사용합니다. 토큰을 새로 채팅에 입력할 필요는 없습니다.
같은 계정에 after-you라는 Worker가 이미 있다면 해당 프로젝트가 맞는지 확인하고 실행하세요.

CMD에서 직접 실행하려면 이 폴더의 주소 표시줄에 cmd를 입력한 뒤 아래 명령을 순서대로 입력해도 됩니다.

npm ci
npx wrangler login
npm run deploy:cloudflare

이 배포는 게임과 /api 순위 서버를 하나의 Worker에 연결하고 SQLite Durable Object에 순위를 영구 저장합니다.
정적 HTML만 업로드하는 방식이 아닙니다. 공개 주소 생성은 실제 로그인/배포 성공 후에만 완료됩니다.
실패하면 마지막 오류 내용을 확인하세요. 토큰/비밀번호는 공유하지 마세요.
이 ZIP에는 토큰, 계정 인증 파일, 기존 사용자 순위, 개발 캐시와 node_modules를 포함하지 않습니다.

테스트: npm test
배포 전 빌드 검사: npm run check:cloudflare
배포 설정 설명: docs/CLOUDFLARE.md
