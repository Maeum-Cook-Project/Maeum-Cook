import React, {createContext, useContext, useEffect,useRef,useState,ReactNode, useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 기본 설정 (설정에서 변경 가능)
const DEFAULT_QCS6490_IP = "192.168.0.2";
// 주의: 보드 코드에서는 포트 8765를 사용하지만, 실제로는 5555로 포트 포워딩되어 있을 수 있습니다
// 두 포트 모두 시도해보세요
const DEFAULT_WEBSOCKET_PORT = 8765; // 보드 코드의 기본 포트
const WS_PATH = "/control";

// 재연결 설정
const RECONNECT_INITIAL_DELAY = 1000; // 1초
const RECONNECT_MAX_DELAY = 30000; // 최대 30초
const RECONNECT_MULTIPLIER = 1.5; // 지수 백오프 배수

//Context가 제공할 값 정의
interface WebSocketContextType{
    isConnected:boolean;
    isConnecting:boolean;
    lastMessage:string|null;
    connectionError:string|null;
    serverIp:string;
    serverPort:number;
    sendJsonCommand:(cmd:object)=>void;
    reconnect:()=>void;
    setServerConfig:(ip:string, port:number)=>Promise<void>;
}

//Context 생성
const WebSocketContext=createContext<WebSocketContextType|null>(null);

//앱에 제공하는 Provider 컴포넌트
export const WebSocketProvider=({children}:{children:ReactNode})=>{
    const[isConnected,setIsConnected]=useState(false);
    const[isConnecting,setIsConnecting]=useState(false);
    const[lastMessage,setLastMessage]=useState<string|null>(null);
    const[connectionError,setConnectionError]=useState<string|null>(null);
    const[serverIp,setServerIpState]=useState<string>(DEFAULT_QCS6490_IP);
    const[serverPort,setServerPortState]=useState<number>(DEFAULT_WEBSOCKET_PORT);

    const ws=useRef<WebSocket | null>(null);
    const reconnectTimeoutRef=useRef<ReturnType<typeof setTimeout>|null>(null);
    const reconnectAttemptRef=useRef(0);
    const shouldReconnectRef=useRef(true);
    const reconnectDelayRef=useRef(RECONNECT_INITIAL_DELAY);

    // 설정 저장 키
    const SERVER_CONFIG_KEY = 'websocket_server_config';

    // 저장된 설정 불러오기
    useEffect(() => {
        const loadSavedConfig = async () => {
            try {
                const savedConfig = await AsyncStorage.getItem(SERVER_CONFIG_KEY);
                if (savedConfig) {
                    const config = JSON.parse(savedConfig);
                    if (config.ip) {
                        setServerIpState(config.ip);
                        console.log(`[WebSocket] 저장된 IP 주소 로드: ${config.ip}`);
                    }
                    if (config.port) {
                        setServerPortState(config.port);
                        console.log(`[WebSocket] 저장된 포트 번호 로드: ${config.port}`);
                    }
                }
            } catch (error) {
                console.error('[WebSocket] 설정 로드 실패:', error);
            }
        };
        loadSavedConfig();
    }, []);

    // 서버 설정 (IP + 포트) 저장
    const setServerConfig = useCallback(async (ip: string, port: number) => {
        try {
            const config = { ip, port };
            await AsyncStorage.setItem(SERVER_CONFIG_KEY, JSON.stringify(config));
            setServerIpState(ip);
            setServerPortState(port);
            console.log(`[WebSocket] 서버 설정 변경: ${ip}:${port}`);
            // 설정 변경 시 재연결
            reconnect();
        } catch (error) {
            console.error('[WebSocket] 서버 설정 저장 실패:', error);
        }
    }, []);

    // WebSocket 연결 함수
    const connect = useCallback(() => {
        // 이미 연결 중이거나 연결되어 있으면 중복 연결 방지
        if (ws.current?.readyState === WebSocket.CONNECTING || 
            ws.current?.readyState === WebSocket.OPEN) {
            return;
        }

        // 기존 연결 정리
        if (ws.current) {
            try {
                ws.current.close();
            } catch (e) {
                // 무시
            }
            ws.current = null;
        }

        const url = `ws://${serverIp}:${serverPort}${WS_PATH}`;
        console.log(`[WebSocket] 서버 연결 시도: ${url} (시도 ${reconnectAttemptRef.current + 1})`);
        console.log(`[WebSocket] 서버 IP: ${serverIp}, 포트: ${serverPort}, 경로: ${WS_PATH}`);
        
        setIsConnecting(true);
        setConnectionError(null);

        try {
            const socket = new WebSocket(url);
            
            // 연결 타임아웃 설정 (10초)
            const timeout = setTimeout(() => {
                if (socket.readyState === WebSocket.CONNECTING) {
                    console.warn('[WebSocket] 연결 타임아웃');
                    socket.close();
                    setConnectionError('연결 타임아웃');
                }
            }, 10000);

            socket.onopen = () => {
                clearTimeout(timeout);
                console.log('[WebSocket] QCS6490 서버 연결 성공');
                setIsConnected(true);
                setIsConnecting(false);
                setConnectionError(null);
                reconnectAttemptRef.current = 0;
                reconnectDelayRef.current = RECONNECT_INITIAL_DELAY;
            };

            socket.onclose = (e) => {
                clearTimeout(timeout);
                const closeMsg = `서버 연결 끊김 (코드: ${e.code}, 이유: ${e.reason || '없음'}, wasClean: ${e.wasClean})`;
                console.log(`[WebSocket] ${closeMsg}`);
                console.log(`[WebSocket] 연결 시도 URL: ${url}`);
                setIsConnected(false);
                setIsConnecting(false);

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
                
                if (e.code !== 1000) {
                    setConnectionError(`연결 실패: ${serverIp}:${serverPort}${errorDetail}`);
                }

                // 정상 종료가 아닌 경우에만 재연결 시도
                if (shouldReconnectRef.current && e.code !== 1000) {
                    scheduleReconnect();
                }
            };

            socket.onerror = (e) => {
                clearTimeout(timeout);
                const errorMsg = `연결 실패: ${serverIp}:${serverPort}`;
                console.error(`[WebSocket] 에러 발생:`, errorMsg);
                console.error(`[WebSocket] 에러 상세:`, e);
                console.log(`[WebSocket] 연결 시도 URL: ${url}`);
                console.log(`[WebSocket] Socket readyState: ${socket.readyState}`);
                setConnectionError(`${errorMsg} (WebSocket 에러 발생)`);
                setIsConnected(false);
                setIsConnecting(false);
            };

            socket.onmessage = (event) => {
                console.log(`[WebSocket] 명령 수신: ${event.data}`);
                setLastMessage(event.data);
            };

            ws.current = socket;
        } catch (error) {
            console.error('[WebSocket] 연결 생성 실패:', error);
            setConnectionError(`연결 실패: ${error}`);
            setIsConnecting(false);
            scheduleReconnect();
        }
    }, [serverIp, serverPort]);

    // 재연결 스케줄링
    const scheduleReconnect = useCallback(() => {
        if (!shouldReconnectRef.current) return;

        // 기존 재연결 타이머 취소
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        reconnectAttemptRef.current += 1;
        const delay = Math.min(
            reconnectDelayRef.current * Math.pow(RECONNECT_MULTIPLIER, reconnectAttemptRef.current - 1),
            RECONNECT_MAX_DELAY
        );

        console.log(`[WebSocket] ${delay}ms 후 재연결 시도 (시도 ${reconnectAttemptRef.current})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connect();
        }, delay);
    }, [connect]);

    // 수동 재연결 함수
    const reconnect = useCallback(() => {
        reconnectAttemptRef.current = 0;
        reconnectDelayRef.current = RECONNECT_INITIAL_DELAY;
        shouldReconnectRef.current = true;
        
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        
        connect();
    }, [connect]);

    // 초기 연결 및 재연결 관리
    useEffect(() => {
        shouldReconnectRef.current = true;
        connect();

        // 정리 함수
        return () => {
            shouldReconnectRef.current = false;
            
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }

            if (ws.current) {
                try {
                    ws.current.close();
                } catch (e) {
                    // 무시
                }
                ws.current = null;
            }
        };
    }, [connect, serverIp, serverPort]);

    const sendJsonCommand = useCallback((cmd: object) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            const jsonString = JSON.stringify(cmd);
            console.log(`[WebSocket] QCS6490으로 명령 전송: ${jsonString}`);
            ws.current.send(jsonString);
        } else {
            console.warn(`[WebSocket] 연결이 안 됨. 명령 전송 실패. 재연결 시도 중...`);
            // 연결이 안 되어 있으면 재연결 시도
            if (!isConnecting) {
                reconnect();
            }
        }
    }, [isConnecting, reconnect]);

    const contextValue: WebSocketContextType = {
        isConnected,
        isConnecting,
        lastMessage,
        connectionError,
        serverIp,
        serverPort,
        sendJsonCommand,
        reconnect,
        setServerConfig,
    };

    return (
        <WebSocketContext.Provider value={contextValue}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket=()=>{
    const context=useContext(WebSocketContext);
    if (!context){
        throw new Error("useWebSocket은 WebSocketProvider 안에서만 사용해야됨");
    }
    return context;
};

