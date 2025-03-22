export type ROOM_STATUS = "ROOM_JOINED" | "ROOM_CREATED" | "ROOM_LEFT" | "IDLE" | "INVALID_ROOM"
export type UserDetail = {
    userName: string | null,
    userId: string | null
}
export type CALL_STATUS = 'idle' | 'calling' | 'connected' | 'failed'