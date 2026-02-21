/**
 * Create a WebSocket connection for real-time editor analysis.
 * @param {string} projectId
 * @returns {{ sendAnalyze: (content: string) => void, onAnalysis: (callback: (payload: unknown) => void) => void, close: () => void }}
 */
export function createEditorSocket(projectId) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
  const wsProtocol = baseUrl.startsWith('https') ? 'wss' : 'ws'
  const wsHost = baseUrl.replace(/^https?:\/\//, '')
  const wsUrl = `${wsProtocol}://${wsHost}/ws/editor`

  let ws = null
  let analysisCallback = null

  try {
    ws = new WebSocket(wsUrl)
  } catch (err) {
    console.error('[EditorSocket] Failed to create WebSocket:', err)
    return {
      sendAnalyze: () => {},
      onAnalysis: () => {},
      close: () => {},
    }
  }

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'ping' }))
  }

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      if (msg.type === 'analysis' && msg.payload && analysisCallback) {
        analysisCallback(msg.payload)
      }
    } catch (err) {
      console.error('[EditorSocket] Failed to parse message:', err)
    }
  }

  ws.onerror = (err) => {
    console.error('[EditorSocket] WebSocket error:', err)
  }

  ws.onclose = () => {
    // Normal closure or connection lost
  }

  return {
    sendAnalyze(content) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'analyze',
            project_id: projectId,
            content,
          })
        )
      }
    },
    onAnalysis(callback) {
      analysisCallback = callback
    },
    close() {
      if (ws) {
        ws.close()
        ws = null
      }
    },
  }
}
