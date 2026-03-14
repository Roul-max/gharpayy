import type { Server as SocketIOServer } from 'socket.io';

let ioRef: SocketIOServer | null = null;

export function setSocketServer(io: SocketIOServer) {
  ioRef = io;
}

export function emitRealtime(event: string, payload: unknown) {
  if (!ioRef) return;
  ioRef.emit(event, payload);
}
