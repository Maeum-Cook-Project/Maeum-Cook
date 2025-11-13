import React, {createContext, useContext, useEffect,useRef,useState,ReactNode} from 'react';

//IP주소 환경마다 변경필요!
const QCS6490_IP="192.168.0.0";
const WEBSOCKET_URL=`ws://${QCS6490_IP}:8765/control`;

//Context가 제공할 값 정의
interface WebSocketContextType{
    isConnected:boolean;
    lastMessage:string|null;
    sendJsonCommand:(cmd:object)=>void;
}

//Context 생성
const WebSocketContext=createContext<WebSocketContextType|null>(null);

//앱에 제공하는 Provider 컴포넌트
export const WebSocketProvider=({children}:{children:ReactNode})=>{
    const[isConnected,setIsConnected]=useState(false);
    const[lastMessage,setLastMessage]=useState<string|null>(null);

    const ws=useRef<WebSocket | null>(null);

    const sendJsonCommand=(cmd:object)=>{
        if(ws.current && ws.current.readyState===WebSocket.OPEN){
            const jsonString=JSON.stringify(cmd);
            console.log(`[WebSocket] QCS6490으로 명령 전송 : ${jsonString}`);
            ws.current.send(jsonString);
        }else{
            console.warn(`[WebSocket] 연결이 안 됨. 명령 전송 실패.`)
        }
    };
    //앱이 켜질 때 한 번만 실행
    useEffect(()=>{
        console.log(`[WebSocket]서버 (${WEBSOCKET_URL}에 연결 시도,,,)`);
        const socket = new WebSocket(WEBSOCKET_URL);
        
        socket.onopen=()=>{
            console.log("[WebSocket] QCS6490 서버 연결 성공");
        };
        socket.onclose=(e)=>{
            console.log("[WebSocket] 서버 연걸 끊김",e);
            setIsConnected(false);
        };

        socket.onerror=(e)=>{
            console.error("WebSocket] 에러 발생:",e)
            setIsConnected(false);
        };

        //서버로부터 방송 수신 시
        socket.onmessage=(event)=>{
            console.log(`[WebSocket] 명령 수신: ${event.data}`);
            setLastMessage(event.data)
        };

        ws.current=socket;

        //앱이 꺼질 때 연결 종료
        return()=>{
            console.log("[WebSocket] 앱 종료, 연결 닫습니다.");
            socket.close();
        };   
    },[]);
    const contextValue={
        isConnected,
        lastMessage,
        sendJsonCommand
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

