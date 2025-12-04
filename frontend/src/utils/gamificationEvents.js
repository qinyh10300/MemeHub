const EVENT_NAME = 'gamification-task-progress'
const TASK_QUEUE_PREFIX = 'memehub_task_queue'
const LISTENER_FLAG_PREFIX = 'memehub_gamification_listener'

export const GAMIFICATION_TASK_EVENT = EVENT_NAME

const normalizeIncrement = (increment) => (typeof increment === 'number' && increment > 0 ? increment : 1)
const normalizeUsername = (username) => (username && String(username).trim()) || 'guest'
const getQueueKey = (username) => `${TASK_QUEUE_PREFIX}_${normalizeUsername(username)}`
const getListenerKey = (username) => `${LISTENER_FLAG_PREFIX}_${normalizeUsername(username)}`

const enqueueTaskProgress = (username, taskId, increment) => {
  if (typeof window === 'undefined') return
  const key = getQueueKey(username)
  let payload = []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]')
    payload = Array.isArray(parsed) ? parsed : []
  } catch {
    payload = []
  }
  payload.push({ taskId, increment, ts: Date.now() })
  if (payload.length > 50) {
    payload = payload.slice(payload.length - 50)
  }
  window.localStorage.setItem(key, JSON.stringify(payload))
}

const isListenerActive = (username) => {
  if (typeof window === 'undefined') return false
  const key = getListenerKey(username)
  return window.localStorage.getItem(key) === '1'
}

/**
 * 在全局派发完成任务的事件，并在需要时记录到离线队列
 */
export const emitTaskProgress = (taskId, increment = 1, options = {}) => {
  if (!taskId) return
  const safeIncrement = normalizeIncrement(increment)
  const username = normalizeUsername(options.username)

  if (typeof window !== 'undefined' && !isListenerActive(username)) {
    enqueueTaskProgress(username, taskId, safeIncrement)
  }

  if (typeof window !== 'undefined') {
    const detail = { taskId, increment: safeIncrement }
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }))
  }
}

export const drainQueuedTaskProgress = (username) => {
  if (typeof window === 'undefined') return []
  const key = getQueueKey(username)
  let payload = []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]')
    payload = Array.isArray(parsed) ? parsed : []
  } catch {
    payload = []
  }
  if (payload.length) {
    window.localStorage.removeItem(key)
  }
  return payload
}

export const setGamificationListenerActive = (username, active) => {
  if (typeof window === 'undefined') return
  const key = getListenerKey(username)
  if (active) {
    window.localStorage.setItem(key, '1')
  } else {
    window.localStorage.removeItem(key)
  }
}

