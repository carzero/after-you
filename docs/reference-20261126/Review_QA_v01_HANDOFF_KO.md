# 검토 화면 QA v01
2026-11-25

## 실제 결과
오디오 검토 화면 JavaScript를 Node VM에서 실행하고 Audio/DOM/타이머 대역으로 정책 검사 9개를 통과했습니다. 실제 소리·브라우저·기기 검증이 아닙니다. 검토 화면의 재생 제어를 검사했으며 게임 엔진을 검사한 것이 아닙니다.

- 효과음 동시 4개 제한
- 420ms 착지 예약
- 정지 후 예약 취소
- 실패 결과음 우선 및 기존 음 중단
- 새 시퀀스에서 이전 결과 예약 취소
- 탭 숨김 시 소리·예약 중단
- 복귀 시 자동 재생 금지
- 플레이어/NPC 음량 분리
- BGM 교체 시 하나만 유지

검사 명령: `node audio-policy.test.cjs`. 포함된 audio-review-source.js는 검사 당시 청음 화면 스크립트 복사본입니다. 새 스크립트 검사는 `node audio-policy.test.cjs /절대경로/review-script.js`로 실행합니다.

## 브라우저 검사 차단
Playwright는 설치되어 있으나 /usr/bin/chromium 실행기가 가리키는 /usr/lib/chromium/chromium 본체가 없어 종료 코드 127로 실패했습니다. Playwright 기본 Chromium/Firefox/WebKit 실행 파일도 없었습니다. 따라서 화면 넘침·클릭·실제 재생 검사 통과를 주장하지 않습니다.

browser-check.cjs는 Codex 실행용 준비 파일입니다. Playwright와 동작하는 Chromium 환경에서 `node browser-check.cjs /패키지들을_풀어둔_상위폴더`로 실행하세요. 필요하면 CHROMIUM_PATH를 지정합니다. AFTER_YOU_Results_Unlock_v01/review.html이 해당 폴더 아래 있어야 합니다.

검사 예정: 5개 결과 화면 이미지 로드, 320×568 내부 캔버스 자식 요소 경계, chapter→unlock 버튼 이동, pageerror. 검토용 외부 헤더/컨트롤의 페이지 스크롤은 게임 UI 넘침과 구별합니다. 이 준비 파일은 여기서 실행 성공한 결과가 아닙니다.

## 변경 범위
이번 검증에서 정책 오류는 검출되지 않았으므로 기존 아트·음원·검토 화면을 변경하지 않았습니다. 실제 게임 코드·배포·사용자 데이터도 변경하지 않았습니다. 남은 실기기 청음·레이아웃·저장/입력 회귀 검증은 Codex 게임 통합 단계에서 수행해야 합니다.
