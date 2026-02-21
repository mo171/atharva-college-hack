import json

from fastapi import APIRouter, WebSocket

from app.routes.editor import run_analysis

router = APIRouter(tags=["WebSocket Editor"])


@router.websocket("/ws/editor")
async def websocket_editor(websocket: WebSocket):
    """
    WebSocket endpoint for real-time editor analysis.
    Client sends: { "type": "analyze", "project_id": "...", "content": "..." }
    Server responds: { "type": "analysis", "payload": { ... } } or { "type": "error", "detail": "..." }
    """
    await websocket.accept()

    while True:
        try:
            data = await websocket.receive_text()
        except Exception:
            break

        try:
            msg = json.loads(data)
        except json.JSONDecodeError:
            await websocket.send_json({"type": "error", "detail": "Invalid JSON"})
            continue

        msg_type = msg.get("type")

        if msg_type == "ping":
            await websocket.send_json({"type": "pong"})
            continue

        if msg_type == "analyze":
            project_id = msg.get("project_id")
            content = msg.get("content")

            if not project_id or not content:
                await websocket.send_json(
                    {"type": "error", "detail": "project_id and content are required"}
                )
                continue

            try:
                payload = await run_analysis(project_id=project_id, text_content=content)
                await websocket.send_json({"type": "analysis", "payload": payload})
            except Exception as e:
                print(f"WebSocket analyze error: {e}")
                await websocket.send_json(
                    {"type": "error", "detail": str(e)}
                )
            continue

        # Unknown type: ignore or optionally send error
        await websocket.send_json(
            {"type": "error", "detail": f"Unknown message type: {msg_type}"}
        )
