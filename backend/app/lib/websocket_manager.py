"""WebSocket connection manager with keepalive and message routing."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

# Keepalive settings
PING_INTERVAL_SECONDS = 30
PONG_TIMEOUT_SECONDS = 10


class WebSocketManager:
    """
    Manages WebSocket connections with keepalive and message routing.

    Handles:
    - Connection lifecycle (accept, track, cleanup)
    - Ping/pong keepalive every 30 seconds
    - Message routing by type: "analyze", "save", "ping"
    - Graceful disconnection and cleanup
    """

    def __init__(self) -> None:
        # Track active connections: websocket -> keepalive task
        self._connections: dict[WebSocket, asyncio.Task] = {}

    async def handle_connection(
        self,
        websocket: WebSocket,
        message_handler,
    ) -> None:
        """
        Accept a WebSocket connection and handle its full lifecycle.

        Args:
            websocket: The FastAPI WebSocket instance
            message_handler: Async callable(websocket, msg_type, project_id, content) -> dict
        """
        await websocket.accept()
        logger.info(f"WebSocket connected: {websocket.client}")

        # Start keepalive loop as a background task
        keepalive_task = asyncio.create_task(self.keepalive_loop(websocket))
        self._connections[websocket] = keepalive_task

        try:
            while True:
                try:
                    data = await websocket.receive_json()
                except WebSocketDisconnect:
                    break
                except Exception as e:
                    logger.error(f"WebSocket receive error: {e}")
                    await self.send_error(websocket, "Failed to receive message")
                    break

                msg_type = data.get("type")
                project_id = data.get("project_id")
                content = data.get("content")

                if msg_type == "ping":
                    await websocket.send_json({"type": "pong"})
                    continue

                if msg_type == "pong":
                    # Client responded to our ping — nothing to do
                    continue

                if msg_type in ("analyze", "save"):
                    if not project_id or not content:
                        await self.send_error(
                            websocket, "project_id and content are required"
                        )
                        continue

                    try:
                        result = await message_handler(
                            websocket, msg_type, project_id, content
                        )
                        await self.send_analysis(websocket, result)
                    except Exception as e:
                        logger.error(f"WebSocket handler error ({msg_type}): {e}")
                        await self.send_error(websocket, str(e))
                    continue

                # Unknown message type
                await self.send_error(
                    websocket, f"Unknown message type: {msg_type}"
                )

        finally:
            await self._cleanup(websocket)

    async def keepalive_loop(self, websocket: WebSocket) -> None:
        """
        Send ping every 30 seconds to keep the connection alive.

        Args:
            websocket: The WebSocket connection to ping
        """
        try:
            while True:
                await asyncio.sleep(PING_INTERVAL_SECONDS)
                try:
                    await websocket.send_json({"type": "ping"})
                except Exception:
                    # Connection is gone — stop the loop
                    break
        except asyncio.CancelledError:
            pass

    async def send_analysis(self, websocket: WebSocket, payload: dict[str, Any]) -> None:
        """
        Send an analysis result to the client.

        Args:
            websocket: The target WebSocket
            payload: The analysis result dict
        """
        try:
            await websocket.send_json({"type": "analysis", "payload": payload})
        except WebSocketDisconnect:
            logger.info("Client disconnected before analysis could be sent")
        except Exception as e:
            logger.error(f"Failed to send analysis: {e}")

    async def send_error(self, websocket: WebSocket, error: str) -> None:
        """
        Send an error message to the client.

        Args:
            websocket: The target WebSocket
            error: The error message string
        """
        try:
            await websocket.send_json({"type": "error", "detail": error})
        except Exception:
            pass  # Connection may already be closed

    async def _cleanup(self, websocket: WebSocket) -> None:
        """
        Clean up resources for a disconnected WebSocket.

        Args:
            websocket: The WebSocket to clean up
        """
        task = self._connections.pop(websocket, None)
        if task and not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        logger.info(f"WebSocket cleaned up: {websocket.client}")

    @property
    def active_connections(self) -> int:
        """Return the number of active WebSocket connections."""
        return len(self._connections)


# Global manager instance
_ws_manager: WebSocketManager | None = None


def get_websocket_manager() -> WebSocketManager:
    """Get or create the global WebSocket manager instance."""
    global _ws_manager
    if _ws_manager is None:
        _ws_manager = WebSocketManager()
    return _ws_manager
