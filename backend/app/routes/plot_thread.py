from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from lib.supabase import supabase_client
from services.plot_extraction import get_plot_extraction_service

router = APIRouter(prefix="/plot-thread", tags=["Plot Thread"])

# --- REQUEST/RESPONSE MODELS ---


class PlotThreadCreate(BaseModel):
    title: str = Field(..., example="Main Plot")
    description: Optional[str] = Field(None, example="Primary storyline")
    color: Optional[str] = Field("#5a5fd8", example="#5a5fd8")


class PlotPointCreate(BaseModel):
    plot_thread_id: Optional[str] = Field(None, example="uuid-thread")
    title: str = Field(..., example="Character discovers secret")
    description: Optional[str] = Field(None, example="The protagonist finds a hidden letter")
    event_type: str = Field("OTHER", example="DISCOVERY")
    timeline_position: int = Field(..., example=1)
    narrative_chunk_id: Optional[str] = Field(None, example="uuid-chunk")
    position_x: Optional[float] = Field(0, example=100.0)
    position_y: Optional[float] = Field(0, example=200.0)


class PlotPointUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    timeline_position: Optional[int] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None


class ConnectionCreate(BaseModel):
    from_point_id: str = Field(..., example="uuid-point-1")
    to_point_id: str = Field(..., example="uuid-point-2")
    connection_type: str = Field("FOLLOWS", example="FOLLOWS")
    description: Optional[str] = None


# --- ROUTES ---


@router.get("/{project_id}")
async def get_plot_thread(project_id: str):
    """
    Fetch all plot threads, points, connections, and character involvement for a project.
    """
    try:
        # Fetch plot threads
        threads_resp = (
            supabase_client.table("plot_threads")
            .select("*")
            .eq("project_id", project_id)
            .order("created_at", desc=False)
            .execute()
        )
        threads = threads_resp.data or []

        # Fetch plot points
        points_resp = (
            supabase_client.table("plot_points")
            .select("*")
            .eq("project_id", project_id)
            .order("timeline_position", desc=False)
            .execute()
        )
        points = points_resp.data or []

        # Fetch connections
        if points:
            point_ids = [p["id"] for p in points]
            connections_resp = (
                supabase_client.table("plot_point_connections")
                .select("*")
                .in_("from_point_id", point_ids)
                .execute()
            )
            connections = connections_resp.data or []
        else:
            connections = []

        # Fetch character involvement
        if points:
            point_ids = [p["id"] for p in points]
            chars_resp = (
                supabase_client.table("plot_point_characters")
                .select("*, entities(name, id)")
                .in_("plot_point_id", point_ids)
                .execute()
            )
            characters = chars_resp.data or []
        else:
            characters = []

        # Organize characters by plot point
        characters_by_point = {}
        for char in characters:
            point_id = char["plot_point_id"]
            if point_id not in characters_by_point:
                characters_by_point[point_id] = []
            characters_by_point[point_id].append(char)

        # Attach characters to points
        for point in points:
            point["characters"] = characters_by_point.get(point["id"], [])

        return {
            "status": "success",
            "plot_threads": threads,
            "plot_points": points,
            "connections": connections,
        }
    except Exception as e:
        print(f"Get plot thread error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch plot thread: {str(e)}")


@router.post("/{project_id}/extract")
async def extract_plot_points(project_id: str):
    """
    Trigger AI extraction of plot points from narrative chunks.
    """
    try:
        # Fetch narrative chunks
        chunks_resp = (
            supabase_client.table("narrative_chunks")
            .select("id, content, chunk_index")
            .eq("project_id", project_id)
            .order("chunk_index", desc=False)
            .execute()
        )
        chunks = chunks_resp.data or []

        if not chunks:
            return {
                "status": "error",
                "message": "No narrative chunks found. Write some content first.",
            }

        # Fetch entities (characters)
        entities_resp = (
            supabase_client.table("entities")
            .select("id, name, entity_type")
            .eq("project_id", project_id)
            .eq("entity_type", "CHARACTER")
            .execute()
        )
        entities = entities_resp.data or []

        # Extract plot points
        service = get_plot_extraction_service()
        result = service.extract_plot_points_from_chunks(
            project_id=project_id,
            narrative_chunks=chunks,
            entities=entities,
            supabase_client=supabase_client,
        )

        return result
    except Exception as e:
        print(f"Extract plot points error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to extract plot points: {str(e)}"
        )


@router.post("/{project_id}/thread")
async def create_plot_thread(project_id: str, thread_data: PlotThreadCreate):
    """
    Create a new plot thread.
    """
    try:
        resp = (
            supabase_client.table("plot_threads")
            .insert(
                {
                    "project_id": project_id,
                    "title": thread_data.title,
                    "description": thread_data.description,
                    "color": thread_data.color,
                }
            )
            .execute()
        )
        return {"status": "success", "thread": resp.data[0]}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create plot thread: {str(e)}"
        )


@router.post("/{project_id}/point")
async def create_plot_point(project_id: str, point_data: PlotPointCreate):
    """
    Create a new plot point.
    """
    try:
        # If no thread_id provided, get or create default thread
        thread_id = point_data.plot_thread_id
        if not thread_id:
            thread_resp = (
                supabase_client.table("plot_threads")
                .select("id")
                .eq("project_id", project_id)
                .limit(1)
                .execute()
            )
            if thread_resp.data:
                thread_id = thread_resp.data[0]["id"]
            else:
                thread_resp = (
                    supabase_client.table("plot_threads")
                    .insert(
                        {
                            "project_id": project_id,
                            "title": "Main Plot",
                            "color": "#5a5fd8",
                        }
                    )
                    .execute()
                )
                thread_id = thread_resp.data[0]["id"]

        resp = (
            supabase_client.table("plot_points")
            .insert(
                {
                    "plot_thread_id": thread_id,
                    "project_id": project_id,
                    "title": point_data.title,
                    "description": point_data.description,
                    "event_type": point_data.event_type,
                    "timeline_position": point_data.timeline_position,
                    "narrative_chunk_id": point_data.narrative_chunk_id,
                    "position_x": point_data.position_x,
                    "position_y": point_data.position_y,
                }
            )
            .execute()
        )
        return {"status": "success", "point": resp.data[0]}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create plot point: {str(e)}"
        )


@router.put("/point/{point_id}")
async def update_plot_point(point_id: str, point_data: PlotPointUpdate):
    """
    Update a plot point.
    """
    try:
        update_data = {}
        if point_data.title is not None:
            update_data["title"] = point_data.title
        if point_data.description is not None:
            update_data["description"] = point_data.description
        if point_data.event_type is not None:
            update_data["event_type"] = point_data.event_type
        if point_data.timeline_position is not None:
            update_data["timeline_position"] = point_data.timeline_position
        if point_data.position_x is not None:
            update_data["position_x"] = point_data.position_x
        if point_data.position_y is not None:
            update_data["position_y"] = point_data.position_y

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        resp = (
            supabase_client.table("plot_points")
            .update(update_data)
            .eq("id", point_id)
            .execute()
        )
        return {"status": "success", "point": resp.data[0] if resp.data else None}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update plot point: {str(e)}"
        )


@router.delete("/point/{point_id}")
async def delete_plot_point(point_id: str):
    """
    Delete a plot point (cascades to connections and character links).
    """
    try:
        supabase_client.table("plot_points").delete().eq("id", point_id).execute()
        return {"status": "success", "message": "Plot point deleted"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete plot point: {str(e)}"
        )


@router.post("/connection")
async def create_connection(connection_data: ConnectionCreate):
    """
    Create a connection between two plot points.
    """
    try:
        resp = (
            supabase_client.table("plot_point_connections")
            .insert(
                {
                    "from_point_id": connection_data.from_point_id,
                    "to_point_id": connection_data.to_point_id,
                    "connection_type": connection_data.connection_type,
                    "description": connection_data.description,
                }
            )
            .execute()
        )
        return {"status": "success", "connection": resp.data[0]}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create connection: {str(e)}"
        )


@router.delete("/connection/{connection_id}")
async def delete_connection(connection_id: str):
    """
    Delete a connection between plot points.
    """
    try:
        supabase_client.table("plot_point_connections").delete().eq("id", connection_id).execute()
        return {"status": "success", "message": "Connection deleted"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete connection: {str(e)}"
        )
