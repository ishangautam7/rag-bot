'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';

interface UseSocketOptions {
    sessionId: string;
    isCollaborative?: boolean; // Only connect if this is a collaborative session
    onNewMessage?: (message: any) => void;
}

export function useSocket({ sessionId, isCollaborative = false, onNewMessage }: UseSocketOptions) {
    const [connected, setConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        // Only connect for collaborative sessions
        if (!sessionId || !isCollaborative) return;

        // Create socket connection
        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            withCredentials: true,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            // Join the session room
            socket.emit('join-session', sessionId);
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });

        socket.on('new-message', (data: { sessionId: string; message: any }) => {
            if (data.sessionId === sessionId && onNewMessage) {
                onNewMessage(data.message);
            }
        });

        return () => {
            socket.emit('leave-session', sessionId);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [sessionId, isCollaborative, onNewMessage]);

    const sendMessage = useCallback((event: string, data: any) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit(event, data);
        }
    }, []);

    return {
        socket: socketRef.current,
        connected,
        sendMessage,
    };
}
