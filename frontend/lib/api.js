import { api } from './axios'

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
  const { data } = await api.post('/projects/setup', {
    user_id: userId,
    title,
    genre,
    perspective,
    tone,
    characters: (characters || []).map((c) => ({
      name: c.name,
      description: c.description ?? '',
    })),
    world_setting: worldSetting ?? '',
  })
  return data
}

/**
 * Analyze writing content for a project.
 * @param {{ projectId: string, content: string }}
 * @returns {Promise<{ status: string, entities: Array, alerts: Array, resolved_context: string, detected_actions: Array }>}
 */
export async function analyzeWriting({ projectId, content }) {
  const { data } = await api.post('/editor/analyze', {
    project_id: projectId,
    content,
  })
  return data
}

/**
 * Fetch story brain state (entities + recent history) for a project.
 * @param {string} projectId
 * @returns {Promise<{ entities: Array, recent_history: Array }>}
 */
export async function fetchStoryBrain(projectId) {
  const { data } = await api.get(`/editor/story-brain/${projectId}`)
  return data
}

/**
 * Update entity metadata.
 * @param {{ entityId: string, metadataPatch: Record<string, unknown> }}
 * @returns {Promise<{ status: string, data: unknown }>}
 */
export async function updateEntityMetadata({ entityId, metadataPatch }) {
  const { data } = await api.post(
    `/editor/update-entity?entity_id=${encodeURIComponent(entityId)}`,
    metadataPatch
  )
  return data
}

/**
 * Refresh character persona/story summary for an entity.
 * @param {{ projectId: string, entityId: string }}
 * @returns {Promise<{ status: string, metadata: Record<string, unknown> }>}
 */
export async function refreshCharacterSummary({ projectId, entityId }) {
  const { data } = await api.post('/editor/refresh-character-summary', {
    project_id: projectId,
    entity_id: entityId,
  })
  return data
}
