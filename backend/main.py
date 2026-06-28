from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from .routes import auth_routes, agent_routes
from .websocket_manager import manager
from .auth import get_current_user
from .database import connect_to_mongo, close_mongo_connection

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(title="BLACKHOLE IDS Backend", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(auth_routes.router, prefix="/api/v1")
app.include_router(agent_routes.router, prefix="/api/v1")

@app.websocket("/api/v1/ws/live-alerts")
async def websocket_endpoint(websocket: WebSocket):
    try:
        await manager.connect(websocket)
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(websocket)
    except Exception as e:
        print(f"WS Error: {e}")
        await websocket.close(code=1008)

@app.get("/")
async def root():
    return {"message": "BLACKHOLE IDS API is running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
