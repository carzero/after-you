# 게임 v0.8 · 기본 포즈와 국소 호흡 적용

사용자의 `반영해` 요청에 따라 Basic_Poses_Clean_v01, Pose_Registration_v01 및 Three_Characters_Finish_v01을 연결했습니다.

- 기본 28포즈는 등록 묶음의 PNG 해시와 대조한 뒤 512px WebP로 변환합니다. 원본 RGBA를 고치는 작업은 하지 않습니다.
- 지상 포즈는 groundContact로, 점프·공중·추락·구조는 대기 포즈의 몸통 높이로 정렬합니다. `src/pose-placement.js`는 제공된 placement.mjs의 배치 수식을 사용합니다. 게임 엔진의 점프·추락·카메라 이동은 바깥 배우 요소가 한 번만 적용합니다.
- 캐릭터별 기본 화면 배율은 기존 값을 유지합니다. 포즈별 상대 배율은 제공된 registration.json을 사용합니다. 원본 픽셀을 수정하지 않습니다.
- 비둘기·오리·토끼는 7단계 국소 호흡을 0→6→1, 단계당 233ms로 재생합니다. 닫힌 눈은 기존 100ms 규약을 사용합니다. 깜빡임 중에는 눈감기 프레임을 우선 표시합니다. 전신 확대 호흡을 중복 적용하지 않습니다.
- 모션 프레임은 해당 묶음에서 측정한 발 접점을 사용합니다. 감자의 기존 깜빡임·미세 호흡은 유지하며 별도 감자 마감 묶음은 전달받지 않았습니다.
- 포즈 우선순위, 게임 시계·일시정지·탭 숨김·움직임 줄이기 규칙은 유지합니다. 추가 연기와 반송 상자 소재는 기존 통합 원화를 사용합니다.
- 좌표는 원본 문서에서 시각 추정 초안으로 제공되었습니다. 이번 적용은 수학적 정렬 검사와 데스크톱 Chromium의 게임 화면 확인을 거친 초안 통합이며 정밀 측정/실기기 승인을 뜻하지 않습니다.

## 재생성

```
node scripts/prepare-registered-art.mjs /path/to/AFTER_YOU_Pose_Registration_v01 /path/to/AFTER_YOU_Three_Characters_Finish_v01
npm run export:playtest -- downloads
python3 scripts/package-runtime.py
```

입력 원본은 업로드 묶음을 별도로 보존하세요. 게임 실행과 소스 빌드에는 포함된 실행용 WebP와 등록 JSON만 필요합니다. 출처 해시는 `docs/idle-review/registered-art-provenance.json`에 있습니다. 새 묶음에 포함되지 않은 양보·검사·안도 포즈는 기존 아트를 그대로 사용합니다.

## 검증

모든 28포즈의 80px/200px 배치 수학 검증, 신규 모션의 발 위치·프레임 교체·일시정지·움직임 줄이기 및 점프 우선순위를 검사합니다. 단독 HTML에서 네 캐릭터의 대기·착지·구조 화면을 캡처해 접지와 쿠션 배치를 확인했습니다. `file://` 및 휴대폰 실기기 검증은 하지 않았습니다.

검증 결과: 단위·서버 테스트 22개, 브라우저 테스트 17개 통과. 오프라인 단독 HTML의 시작·이동 및 JavaScript 비활성 안내 검사 통과.
