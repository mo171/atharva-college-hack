import { api } from "./axios";

/**
 * Create a new story brain project.
 * @param {{ userId: string, title: string, genre: string, perspective: string, tone: string, characters: Array<{ name: string, description?: string }>, worldSetting: string }}
 * @returns {Promise<{ status: string, project_id: string }>}
 */
export async function createStoryBrain({
  userId,
  title,
  genre,
  perspective,
  tone,
  characters,
  worldSetting,
}) {
  const { data } = await api.post("/projects/setup", {
    user_id: userId,
    title,
    genre,
    perspective,
    tone,
    characters: (characters || []).map((c) => ({
      name: c.name,
      description: c.description ?? "",
    })),
    world_setting: worldSetting ?? "",
  });
  return data;
}

/**
 * Analyze writing content for a project.
 * @param {{ projectId: string, content: string }}
 * @returns {Promise<{ status: string, entities: Array, alerts: Array, resolved_context: string, detected_actions: Array }>}
 */
export async function analyzeWriting({ projectId, content }) {
  const { data } = await api.post("/editor/analyze", {
    project_id: projectId,
    content,
  });
  return data;
}

/**
 * Save writing content for a project (persistence only, no analysis).
 * @param {{ projectId: string, content: string }}
 * @returns {Promise<{ status: string, project_id: string }>}
 */
export async function saveWriting({ projectId, content }) {
  const { data } = await api.post("/editor/save", {
    project_id: projectId,
    content,
  });
  return data;
}

/**
 * Fetch story brain state (entities + recent history) for a project.
 * @param {string} projectId
 * @returns {Promise<{ entities: Array, recent_history: Array }>}
 */
export async function fetchStoryBrain(projectId) {
  const { data } = await api.get(`/editor/story-brain/${projectId}`);
  return data;
}

/**
 * Update entity metadata.
 * @param {{ entityId: string, metadataPatch: Record<string, unknown> }}
 * @returns {Promise<{ status: string, data: unknown }>}
 */
export async function updateEntityMetadata({ entityId, metadataPatch }) {
  const { data } = await api.post(
    `/editor/update-entity?entity_id=${encodeURIComponent(entityId)}`,
    metadataPatch,
  );
  return data;
}

/**
 * Refresh character persona/story summary for an entity.
 * @param {{ projectId: string, entityId: string }}
 * @returns {Promise<{ status: string, metadata: Record<string, unknown> }>}
 */
export async function refreshCharacterSummary({ projectId, entityId }) {
  const { data } = await api.post("/editor/refresh-character-summary", {
    project_id: projectId,
    entity_id: entityId,
  });
  return data;
}

/**
 * Get ghost text suggestion based on current context.
 */
export async function getGhostSuggestion({ projectId, content }) {
  const { data } = await api.post("/editor/suggest", {
    project_id: projectId,
    content,
  });
  return data;
}

/**
 * Generate suggested text by applying all AI insights.
 * @param {{ projectId: string, content: string }}
 * @returns {Promise<{ status: string, original_text: string, suggested_text: string, alerts_applied: number }>}
 */
export async function generateSuggestions({ projectId, content }) {
  try {
    const { data } = await api.post("/editor/generate-suggestions", {
      project_id: projectId,
      content,
    });
    return data;
  } catch (error) {
    console.error("Generate suggestions API error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
    });
    throw error;
  }
}

/**
 * Fix a spelling error in the text.
 * @param {{ projectId: string, content: string, word: string, suggestion: string }}
 * @returns {Promise<{ status: string, corrected_text: string }>}
 */
export async function fixSpelling({ projectId, content, word, suggestion }) {
  try {
    const { data } = await api.post("/editor/fix-spelling", {
      project_id: projectId,
      content,
      word,
      suggestion,
    });
    return data;
  } catch (error) {
    console.error("Fix spelling API error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
}

/**
 * Get grammar suggestion for a specific alert.
 * @param {{ projectId: string, content: string, alert: object }}
 * @returns {Promise<{ status: string, original_text: string, suggested_text: string, explanation: string }>}
 */
export async function getGrammarSuggestion({ projectId, content, alert }) {
  try {
    const { data } = await api.post("/editor/get-grammar-suggestion", {
      project_id: projectId,
      content,
      alert,
    });
    return data;
  } catch (error) {
    console.error("Get grammar suggestion API error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
}

/**
 * Upload a PDF/TXT for behavioral style analysis.
 */
export async function analyzeBehavior(projectId, file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post(
    `/projects/${projectId}/analyze-behavior`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return data;
}

/**
 * Fetch plot thread data for a project.
 * @param {string} projectId
 * @returns {Promise<{ status: string, plot_threads: Array, plot_points: Array, connections: Array }>}
 */
export async function fetchPlotThread(projectId) {
  const { data } = await api.get(`/plot-thread/${projectId}`);
  return data;
}

/**
 * Trigger AI extraction of plot points from narrative chunks.
 * @param {string} projectId
 * @returns {Promise<{ status: string, plot_points_created: number, thread_id: string }>}
 */
export async function extractPlotPoints(projectId) {
  const { data } = await api.post(`/plot-thread/${projectId}/extract`);
  return data;
}

/**
 * Create a new plot thread.
 * @param {{ projectId: string, title: string, description?: string, color?: string }}
 * @returns {Promise<{ status: string, thread: Object }>}
 */
export async function createPlotThread({ projectId, title, description, color }) {
  const { data } = await api.post(`/plot-thread/${projectId}/thread`, {
    title,
    description,
    color: color || "#5a5fd8",
  });
  return data;
}

/**
 * Create a new plot point.
 * @param {{ projectId: string, plotThreadId?: string, title: string, description?: string, eventType?: string, timelinePosition: number, narrativeChunkId?: string, positionX?: number, positionY?: number }}
 * @returns {Promise<{ status: string, point: Object }>}
 */
export async function createPlotPoint({
  projectId,
  plotThreadId,
  title,
  description,
  eventType,
  timelinePosition,
  narrativeChunkId,
  positionX,
  positionY,
}) {
  const { data } = await api.post(`/plot-thread/${projectId}/point`, {
    plot_thread_id: plotThreadId,
    title,
    description,
    event_type: eventType || "OTHER",
    timeline_position: timelinePosition,
    narrative_chunk_id: narrativeChunkId,
    position_x: positionX || 0,
    position_y: positionY || 0,
  });
  return data;
}

/**
 * Update a plot point.
 * @param {{ pointId: string, title?: string, description?: string, eventType?: string, timelinePosition?: number, positionX?: number, positionY?: number }}
 * @returns {Promise<{ status: string, point: Object }>}
 */
export async function updatePlotPoint({
  pointId,
  title,
  description,
  eventType,
  timelinePosition,
  positionX,
  positionY,
}) {
  const { data } = await api.put(`/plot-thread/point/${pointId}`, {
    title,
    description,
    event_type: eventType,
    timeline_position: timelinePosition,
    position_x: positionX,
    position_y: positionY,
  });
  return data;
}

/**
 * Delete a plot point.
 * @param {string} pointId
 * @returns {Promise<{ status: string, message: string }>}
 */
export async function deletePlotPoint(pointId) {
  const { data } = await api.delete(`/plot-thread/point/${pointId}`);
  return data;
}

/**
 * Create a connection between two plot points.
 * @param {{ fromPointId: string, toPointId: string, connectionType?: string, description?: string }}
 * @returns {Promise<{ status: string, connection: Object }>}
 */
export async function createConnection({
  fromPointId,
  toPointId,
  connectionType,
  description,
}) {
  const { data } = await api.post("/plot-thread/connection", {
    from_point_id: fromPointId,
    to_point_id: toPointId,
    connection_type: connectionType || "FOLLOWS",
    description,
  });
  return data;
}

/**
 * Delete a connection between plot points.
 * @param {string} connectionId
 * @returns {Promise<{ status: string, message: string }>}
 */
export async function deleteConnection(connectionId) {
  const { data } = await api.delete(`/plot-thread/connection/${connectionId}`);
  return data;
}
