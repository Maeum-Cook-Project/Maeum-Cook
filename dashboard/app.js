// ==========================================
// WebSocket 연결 관리 (FrontEnd와 동일한 로직)
// ==========================================

// 기본 설정 (FrontEnd와 동일)
const DEFAULT_QCS6490_IP = "192.168.0.3";
const DEFAULT_WEBSOCKET_PORT = 8765; // 보드 코드의 기본 포트
const WS_PATH = "/control";

// 재연결 설정 (FrontEnd와 동일)
const RECONNECT_INITIAL_DELAY = 1000; // 1초
const RECONNECT_MAX_DELAY = 30000; // 최대 30초
const RECONNECT_MULTIPLIER = 1.5; // 지수 백오프 배수

// 설정 저장 키
const SERVER_CONFIG_KEY = 'websocket_server_config';

// 전역 변수
let socket = null;
let reconnectTimeout = null;
let reconnectAttempt = 0;
let shouldReconnect = true;
let reconnectDelay = RECONNECT_INITIAL_DELAY;
let serverIp = DEFAULT_QCS6490_IP;
let serverPort = DEFAULT_WEBSOCKET_PORT;
let isConnected = false;
let isConnecting = false;

// 저장된 설정 불러오기
function loadSavedConfig() {
    try {
        const savedConfig = localStorage.getItem(SERVER_CONFIG_KEY);
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            if (config.ip) {
                serverIp = config.ip;
                console.log(`[WebSocket] 저장된 IP 주소 로드: ${config.ip}`);
            }
            if (config.port) {
                serverPort = config.port;
                console.log(`[WebSocket] 저장된 포트 번호 로드: ${config.port}`);
            }
            // UI 업데이트
            updateConfigInputs();
        }
    } catch (error) {
        console.error('[WebSocket] 설정 로드 실패:', error);
    }
}

// 서버 설정 저장
function saveServerConfig(ip, port) {
    try {
        const config = { ip, port };
        localStorage.setItem(SERVER_CONFIG_KEY, JSON.stringify(config));
        serverIp = ip;
        serverPort = port;
        console.log(`[WebSocket] 서버 설정 변경: ${ip}:${port}`);
        // 설정 변경 시 재연결
        reconnect();
    } catch (error) {
        console.error('[WebSocket] 서버 설정 저장 실패:', error);
    }
}

// WebSocket 연결 함수
function connectWebSocket() {
    // 이미 연결 중이거나 연결되어 있으면 중복 연결 방지
    if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) {
        return;
    }

    // 기존 연결 정리
    if (socket) {
        try {
            socket.close();
        } catch (e) {
            // 무시
        }
        socket = null;
    }

    const url = `ws://${serverIp}:${serverPort}${WS_PATH}`;
    console.log(`[WebSocket] 서버 연결 시도: ${url} (시도 ${reconnectAttempt + 1})`);
    console.log(`[WebSocket] 서버 IP: ${serverIp}, 포트: ${serverPort}, 경로: ${WS_PATH}`);
    
    isConnecting = true;
    updateConnectionStatus(false, true);

    try {
        socket = new WebSocket(url);
        
        // 연결 타임아웃 설정 (10초)
        const timeout = setTimeout(() => {
            if (socket && socket.readyState === WebSocket.CONNECTING) {
                console.warn('[WebSocket] 연결 타임아웃');
                socket.close();
                updateConnectionStatus(false, false, '연결 타임아웃');
            }
        }, 10000);

        socket.onopen = function() {
            clearTimeout(timeout);
            console.log('[WebSocket] QCS6490 서버 연결 성공');
            isConnected = true;
            isConnecting = false;
            reconnectAttempt = 0;
            reconnectDelay = RECONNECT_INITIAL_DELAY;
            updateConnectionStatus(true, false);
        };

        socket.onclose = function(e) {
            clearTimeout(timeout);
            const closeMsg = `서버 연결 끊김 (코드: ${e.code}, 이유: ${e.reason || '없음'})`;
            console.log(`[WebSocket] ${closeMsg}`);
            console.log(`[WebSocket] 연결 시도 URL: ${url}`);
            isConnected = false;
            isConnecting = false;

            // 연결 실패 원인에 대한 더 자세한 정보 제공
            let errorDetail = '';
            if (e.code === 1006) {
                errorDetail = ' (연결이 비정상적으로 종료됨 - 서버가 응답하지 않음)';
            } else if (e.code === 1002) {
                errorDetail = ' (프로토콜 오류)';
            } else if (e.code === 1003) {
                errorDetail = ' (데이터 타입 오류)';
            } else if (e.code === 1005) {
                errorDetail = ' (상태 코드 없음)';
            }
            
            updateConnectionStatus(false, false, `연결 실패: ${serverIp}:${serverPort}${errorDetail}`);

            // 정상 종료가 아닌 경우에만 재연결 시도
            if (shouldReconnect && e.code !== 1000) {
                scheduleReconnect();
            }
        };

        socket.onerror = function(e) {
            clearTimeout(timeout);
            const errorMsg = `연결 실패: ${serverIp}:${serverPort}`;
            console.error(`[WebSocket] 에러 발생:`, errorMsg);
            console.error(`[WebSocket] 에러 상세:`, e);
            console.log(`[WebSocket] 연결 시도 URL: ${url}`);
            if (socket) {
                console.log(`[WebSocket] Socket readyState: ${socket.readyState}`);
            }
            isConnected = false;
            isConnecting = false;
            updateConnectionStatus(false, false, `${errorMsg} (WebSocket 에러 발생)`);
        };

        socket.onmessage = function(event) {
            console.log(`[WebSocket] 명령 수신: ${event.data}`);
            try {
                const cmd = JSON.parse(event.data);
                updateUI(cmd);
            } catch (e) {
                console.error("JSON 파싱 에러:", e);
            }
        };
    } catch (error) {
        console.error('[WebSocket] 연결 생성 실패:', error);
        isConnecting = false;
        updateConnectionStatus(false, false, `연결 실패: ${error}`);
        scheduleReconnect();
    }
}

// 재연결 스케줄링
function scheduleReconnect() {
    if (!shouldReconnect) return;

    // 기존 재연결 타이머 취소
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
    }

    reconnectAttempt += 1;
    const delay = Math.min(
        reconnectDelay * Math.pow(RECONNECT_MULTIPLIER, reconnectAttempt - 1),
        RECONNECT_MAX_DELAY
    );

    console.log(`[WebSocket] ${delay}ms 후 재연결 시도 (시도 ${reconnectAttempt})`);
    
    reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null;
        connectWebSocket();
    }, delay);
}

// 수동 재연결 함수
function reconnect() {
    reconnectAttempt = 0;
    reconnectDelay = RECONNECT_INITIAL_DELAY;
    shouldReconnect = true;
    
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    
    connectWebSocket();
}

// UI 상태 업데이트 함수
function updateUI(cmd) {
    // --------------------------
    // (1) 인덕션 (Induction)
    // --------------------------
    if (cmd.device === 'induction') {
        const card = document.getElementById('card-induction');
        const statusText = document.getElementById('status-induction');
        const levelText = document.getElementById('level-induction');

        if (cmd.command === 'power') {
            if (cmd.value === 'on') {
                card.classList.add('active');
                statusText.innerText = "ON";
            } else {
                card.classList.remove('active');
                statusText.innerText = "OFF";
                if(levelText) levelText.innerText = "0";
            }
        } else if (cmd.command === 'level') {
            card.classList.add('active');
            statusText.innerText = "ON";
            if(levelText) levelText.innerText = cmd.value;
        } else if (cmd.command === 'timer') {
            // 타이머 설정 시 UI 업데이트 (필요시)
            console.log(`[WebSocket] 타이머 설정: ${cmd.value}초`);
        }
    }

    // --------------------------
    // (2) 환풍기 (Fan)
    // --------------------------
    if (cmd.device === 'fan') {
        const card = document.getElementById('card-fan');
        const statusText = document.getElementById('status-fan');

        if (cmd.value === 'on') {
            card.classList.add('active');
            statusText.innerText = "ON";
        } else {
            card.classList.remove('active');
            statusText.innerText = "OFF";
        }
    }

    // --------------------------
    // (3) 싱크대 (Sink)
    // --------------------------
    if (cmd.device === 'sink') {
        const card = document.getElementById('card-sink');
        const statusText = document.getElementById('status-sink');

        if (cmd.value === 'on') {
            card.classList.add('active');
            statusText.innerText = "ON";
        } else {
            card.classList.remove('active');
            statusText.innerText = "OFF";
        }
    }
}

// 연결 상태 표시 함수
function updateConnectionStatus(connected, connecting, errorMsg) {
    const statusEl = document.getElementById('connection-status');
    if (!statusEl) return;

    if (connected) {
        statusEl.innerText = `QCS6490 연결됨 (${serverIp}:${serverPort}) ✅`;
        statusEl.style.color = "#4caf50";
        statusEl.style.backgroundColor = "#e8f5e9";
        statusEl.style.fontWeight = "bold";
    } else if (connecting) {
        statusEl.innerText = `연결 중... (${serverIp}:${serverPort}) ⏳`;
        statusEl.style.color = "#ff9800";
        statusEl.style.backgroundColor = "#fff3e0";
    } else {
        if (errorMsg) {
            statusEl.innerText = `${errorMsg} ❌`;
        } else {
            statusEl.innerText = `서버 연결 끊김 (${serverIp}:${serverPort}) ❌`;
        }
        statusEl.style.color = "#c62828";
        statusEl.style.backgroundColor = "#ffebee";
    }
}

// 설정 모달 관련 함수
function showConfigModal() {
    document.getElementById('config-modal').style.display = 'flex';
    updateConfigInputs();
}

function hideConfigModal() {
    document.getElementById('config-modal').style.display = 'none';
}

function updateConfigInputs() {
    document.getElementById('ip-input').value = serverIp;
    document.getElementById('port-input').value = serverPort;
}

function saveConfig() {
    const ipInput = document.getElementById('ip-input').value.trim();
    const portInput = document.getElementById('port-input').value.trim();

    // IP 주소 검증
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(ipInput)) {
        alert('올바른 IP 주소 형식을 입력해주세요.\n예: 192.168.0.3');
        return;
    }

    // 포트 번호 검증
    const port = parseInt(portInput, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
        alert('올바른 포트 번호를 입력해주세요.\n범위: 1-65535');
        return;
    }

    saveServerConfig(ipInput, port);
    hideConfigModal();
    alert(`서버 설정이 ${ipInput}:${port}로 변경되었습니다.`);
}

// 페이지 로드 시 실행
window.onload = function() {
    loadSavedConfig();
    connectWebSocket();
    
    // 설정 버튼 이벤트
    document.getElementById('config-button').addEventListener('click', showConfigModal);
    document.getElementById('config-cancel').addEventListener('click', hideConfigModal);
    document.getElementById('config-save').addEventListener('click', saveConfig);
    document.getElementById('reconnect-button').addEventListener('click', reconnect);
    
    // 모달 외부 클릭 시 닫기
    document.getElementById('config-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            hideConfigModal();
        }
    });
};
