# backend/app/routes/meeting.py
import uuid
import socketio
from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/meeting", tags=["Meeting"])

# Create Socket.IO server and ASGI app
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
app = socketio.ASGIApp(sio)

rooms = {}  # room_id -> list of sids

@router.get("/create")
async def create_meeting():
    room_id = str(uuid.uuid4())[:8]
    rooms[room_id] = []
    return JSONResponse({"room_id": room_id})

# Socket.IO events
@sio.event
async def connect(sid, environ):
    print("Socket connected:", sid)

@sio.event
async def join_room(sid, data):
    room = data.get("room")
    if not room:
        await sio.emit("error", {"msg": "no room specified"}, to=sid)
        return
    await sio.save_session(sid, {"room": room})
    await sio.enter_room(sid, room)
    rooms.setdefault(room, []).append(sid)
    # notify existing clients in the room
    await sio.emit("joined", {"sid": sid, "room": room}, room=room)

@sio.event
async def signal(sid, data):
    # data should contain: room, signal (offer/answer/ice)
    room = data.get("room")
    payload = {"signal": data.get("signal"), "from": sid}
    # forward to all in room except sender
    await sio.emit("signal", payload, room=room, skip_sid=sid)

@sio.event
async def disconnect(sid):
    print("Socket disconnected:", sid)
    # cleanup from rooms
    for room, members in list(rooms.items()):
        if sid in members:
            members.remove(sid)
            if not members:
                rooms.pop(room, None)