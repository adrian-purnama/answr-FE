import { io, type Socket } from 'socket.io-client'
import { getAgentToken } from '#/lib/liveAgent'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const LIVE_AGENT_SOCKET_EVENTS = {
  TICKET_CREATED: 'ticket.created',
  TICKET_UPDATED: 'ticket.updated',
  TICKET_CLAIMED: 'ticket.claimed',
  TICKET_CLOSED: 'ticket.closed',
  TICKET_MESSAGE: 'ticket.message',
  TICKET_TYPING: 'ticket.typing',
  QUEUE_UPDATED: 'queue.updated',
  QUEUE_POSITION: 'queue.position',
} as const

export function connectVisitorLiveAgentSocket(input: {
  publicKey: string
  sessionId: string
}): Socket {
  return io(API_BASE_URL, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: {
      role: 'visitor',
      publicKey: input.publicKey,
      sessionId: input.sessionId,
    },
  })
}

export function connectAgentLiveAgentSocket(): Socket {
  const token = getAgentToken()
  return io(API_BASE_URL, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: {
      role: 'agent',
      token: token ?? '',
    },
  })
}

export function joinTicketRoom(socket: Socket, ticketId: string): void {
  socket.emit('ticket.join', { ticketId })
}

export function emitTicketTyping(
  socket: Socket,
  ticketId: string,
  typing: boolean,
): void {
  socket.emit(LIVE_AGENT_SOCKET_EVENTS.TICKET_TYPING, { ticketId, typing })
}
