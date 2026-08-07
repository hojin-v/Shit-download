# Shit! Download Page

Shit! APK를 받는 정적 페이지이고, 릴리스가 올라오는 곳입니다. 다운로드와 소개, 그것뿐입니다.

## Local preview

```bash
python3 -m http.server 8000    # http://localhost:8000
```

`index.html`을 파일로 바로 열어도 됩니다. `/api/latest-apk`는 배포 환경에서만 동작하고, 그 경우 버튼은 스크립트가 채우거나 릴리스 페이지로 남습니다.

## Deploy

[Vercel](https://vercel.com/) 정적 사이트 + Serverless Function 기준입니다.

| 파일 | 역할 |
| --- | --- |
| `index.html` `styles.css` `script.js` | 페이지 |
| `assets/` | 로고, 아이콘 |
| `api/latest-apk.js` | 최신 APK로 302 redirect |
| `vercel.json` | cleanUrls, 에셋 캐시 |

배포 후 `https://<도메인>/api/latest-apk`는 GitHub Releases에서 설치 가능한 최신 APK를 찾아 그 asset으로 redirect합니다. 릴리스가 나갈 때 이 저장소를 손댈 필요는 없습니다.

## APK

APK는 **이 저장소의 Releases**에 올라옵니다. 소스는 비공개 저장소(`hojin-v/Shit`)에 있고, 그쪽 CI가 태그를 받아 빌드한 뒤 결과물만 여기로 릴리스합니다.

이렇게 나눈 이유는 하나입니다. 소스는 가려도 되지만 **사용자가 설치하는 것은 토큰 없이 닿을 수 있어야** 합니다. 앱의 업데이트 확인도 이 저장소를 익명으로 조회합니다. 앞단에 프록시를 두거나 APK에 자격증명을 심는 방법은, 심는 순간 누구나 꺼낼 수 있어서 성립하지 않습니다.

릴리스에 관여하는 토큰은 소스 저장소의 Actions secret `RELEASE_TOKEN` 하나뿐이고, 빌드가 도는 동안에만 존재합니다.

받을 수 있는 릴리스로 인정하는 조건은 앱 안의 업데이트 확인과 같습니다.

- `draft`도 `prerelease`도 아님
- 태그가 `v1.2.3` 또는 `v1.2` 형식
- `.apk` asset이 붙어 있고 URL이 `https://`

태그는 CI가 APK를 올리기 전에 먼저 푸시되므로, 받을 것이 없는 릴리스가 잠시 존재할 수 있습니다. asset 조건이 그걸 걸러냅니다.

버튼은 스크립트 없이도 릴리스 페이지로 동작하고, 스크립트가 응답을 받으면 버전과 파일 크기를 채워 직접 링크로 바꿉니다. 실패하면 릴리스 페이지로 남습니다 — 오래된 버전을 보여주지는 않습니다.

## Design

색과 형태는 앱의 `Palette.kt`에서 그대로 가져왔습니다. 밝은 바닥, 흰 둥근 카드, 하나의 초록. 히어로의 원형 배지는 앱을 열면 보이는 그 버튼입니다.

앱이 의도적으로 라이트 전용이라 이 페이지도 다크 팔레트를 따로 만들지 않았습니다.
