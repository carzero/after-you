# Microsoft Store 제출 · AFTER YOU

제출 파일은 `AFTER_YOU_Store_1.0.0.0_x64.msix`입니다. `.msixupload`도 같은 MSIX를 포함하는 제출 컨테이너로 함께 제공합니다. 둘 중 하나만 Partner Center의 **제출 → 패키지**에 업로드하세요. 일반 게임 실행 ZIP을 올리는 것이 아닙니다.

## 제품 연결

사용자가 제공한 Partner Center 화면의 값으로 설정했습니다. 업로드 전에 화면의 **복사 버튼**으로 얻은 값과 아래 두 값이 같은지 확인하세요. 불일치하면 `deploy/microsoft-store/identity.json`을 수정한 후 다시 패키징해야 합니다.

- Package Identity Name: `Carzero.44873CDC3E8F`
- Publisher: `CN=99365CE3-28E4-4942-9E0A-91393500C01C`
- PublisherDisplayName: `카제로 Carzero`
- Store 패키지 버전: `1.0.0.0` (게임 콘텐츠: `0.10.1`)
- 아키텍처: x64
- 대상: Windows 10 2004 / 빌드 19041 이상, Windows 11

## 앱 구성

최신 게임 웹 파일을 MSIX 안에 포함합니다. 인터넷이 없어도 연습 모드로 실행할 수 있습니다. 인터넷이 연결되면 `https://after-you.kaelsiem.workers.dev`의 기존 API를 사용해 온라인 순위를 겨룹니다. 앱과 웹 브라우저의 저장 공간은 별개입니다. 웹에서 해금한 기록은 앱으로 자동 이전되지 않습니다.

Windows 기본 .NET Framework 4.8을 사용합니다. Microsoft Edge WebView2 Runtime이 필요하며 Windows 11과 대부분의 Windows 10 PC에 설치되어 있습니다. 없는 경우 공식 설치 안내를 표시합니다. 이번 파일에는 WebView2 전체 브라우저 런타임을 재배포하지 않습니다.

온라인 API만 C#에서 지정 서버로 전달합니다. 다른 임의 주소를 프록시하지 않습니다. 게임 파일은 패키지 내부에서 읽고, 개인 진행 기록은 사용자별 WebView2 프로필에 저장합니다. 파일 시스템·장치 권한은 게임에 노출하지 않습니다. F11로 전체 화면을 전환합니다.

## 검증 범위

Windows x64 실행 파일을 실제 컴파일했고, Microsoft의 MSIX Packaging SDK로 MSIX를 생성했습니다. 패키지 XML 스키마, 압축 파일 CRC, 파일별 64KB 블록 SHA256 및 재압축 해제 결과를 검증합니다. **이 Linux 환경에서 Windows 설치·실행과 Windows App Certification Kit(WACK)는 실행하지 못했습니다.** 스토어 승인 완료를 뜻하지 않습니다.

스토어 업로드용 MSIX는 **미서명** 상태입니다. Microsoft Store에서 제출을 처리하고 서명합니다. 이 파일을 더블클릭하여 로컬 설치하면 서명 오류가 날 수 있습니다. 제출 파일에 임의의 테스트 인증서를 넣지 않았습니다.

## 업로드 전 남은 작업

1. 실제 Windows PC에서 실행 확인. 소스 빌드 후 `build/store/publish/AfterYou.Windows.exe`를 실행해 게임 시작·저장·아이템·전체 화면·온라인 순위를 확인하세요. 패키지 설치 경로에서의 검증과 WACK도 권장합니다.
2. Partner Center의 제품 설명, 지원 연락처, 개인정보처리방침 URL 및 IARC 등급 설문을 작성하세요. 실제 운영 정보가 없으므로 임의의 개인정보 URL이나 등급을 넣지 않았습니다.
3. `runFullTrust` 사유를 요청하면 아래 내용을 바탕으로 기재하세요.

> 로컬에 포함된 캐주얼 게임을 Windows 데스크톱 창과 WebView2에서 실행하기 위해 사용합니다. 관리자 권한을 요청하지 않으며, 로컬 게임 파일을 읽고 사용자별 게임 진행 상황을 저장합니다. 온라인 기능은 지정된 게임 서버의 순위 API만 사용합니다. 마이크·카메라·위치 등의 장치 권한은 요청하지 않습니다.

## 소스에서 다시 만들기

스토어 소스 ZIP을 압축 해제하고 `BUILD_STORE.cmd`를 실행하세요. 인터넷 연결이 필요합니다. .NET 10 SDK가 없으면 공식 설치 스크립트로 사용자 폴더에 다운로드합니다. Windows MakeAppx 도구도 Microsoft NuGet 패키지에서 다운로드합니다. 관리자 권한은 요구하지 않습니다.

루트 저장소에서는 `npm ci`, `npm run build` 후 `deploy/microsoft-store/BUILD_STORE.cmd`를 실행합니다. 소스 ZIP에는 이미 빌드된 `dist/`가 들어 있습니다.

생성 위치: `build/store/AFTER_YOU_Store_1.0.0.0_x64.msix`와 `.msixupload`

다음 제출부터는 Store 버전을 올려야 합니다. 예: `BUILD_STORE.cmd -PackageVersion 1.0.1.0`. Store의 네 번째 버전 숫자는 0으로 유지하세요. 새 게임 콘텐츠는 먼저 `dist/`를 갱신하고 `identity.json`의 `gameVersion`도 맞춰 주세요.
