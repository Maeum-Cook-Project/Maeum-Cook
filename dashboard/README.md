# Smart Kitchen Dashboard

IoT 기기 모니터링을 위한 웹 대시보드입니다. FrontEnd 앱과 동일한 WebSocket 서버에 연결하여 실시간으로 기기 상태를 확인할 수 있습니다.

## 기능

- ✅ WebSocket 자동 재연결 (지수 백오프)
- ✅ IP 주소 및 포트 번호 설정 (localStorage 저장)
- ✅ 실시간 기기 상태 모니터링
- ✅ 연결 상태 표시
- ✅ 수동 재연결 기능

## 실행 방법

### 방법 1: 간단한 HTTP 서버 사용

터미널에서 dashboard 폴더로 이동 후:

```bash
cd dashboard

# Python 3 사용
python3 -m http.server 3000

# 또는 Python 2 사용
python -m SimpleHTTPServer 3000

# 또는 Node.js 사용 (http-server 설치 필요)
npx http-server -p 3000
```

브라우저에서 `http://localhost:3000` 접속

### 방법 2: VS Code Live Server 사용

VS Code의 Live Server 확장을 사용하여 실행

## 설정

1. 대시보드에서 **⚙️ 설정** 버튼 클릭
2. QCS6490 보드의 IP 주소와 포트 번호 입력
   - 기본값: IP `192.168.0.3`, 포트 `8765`
3. **저장** 버튼 클릭
4. 설정은 localStorage에 저장되어 다음 접속 시에도 유지됩니다

## 연결 문제 해결

- **연결 실패 시**: **🔄 재연결** 버튼 클릭
- **포트 확인**: 보드 코드에서 실제 사용하는 포트 확인 (기본: 8765)
- **네트워크 확인**: 노트북과 보드가 같은 와이파이 네트워크에 연결되어 있는지 확인

## FrontEnd 앱과의 동기화

- 동일한 WebSocket 서버에 연결
- 동일한 IP/포트 설정 사용 가능
- 실시간으로 동일한 기기 상태 표시

