import type {
  CodeRequest,
  ReviewResponse,
  SupportedLanguage,
  ReviewMode,
} from '../lib/types'
import type { IssueSeverity } from '../lib/types'

export interface AppState {
  editorContent: string
  selectedLanguage: SupportedLanguage
  selectedMode: ReviewMode
  reviewResult: ReviewResponse | null
  isLoading: boolean
  error: string | null
  healthStatus: any | null
  filterSeverity: IssueSeverity | 'all'
  isDark: boolean
}

export type AppAction =
  | { type: 'SET_EDITOR_CONTENT'; payload: string }
  | { type: 'SET_LANGUAGE'; payload: SupportedLanguage }
  | { type: 'SET_MODE'; payload: ReviewMode }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REVIEW_RESULT'; payload: ReviewResponse | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_HEALTH_STATUS'; payload: any | null }
  | { type: 'SET_FILTER_SEVERITY'; payload: IssueSeverity | 'all' }
  | { type: 'SET_DARK_MODE'; payload: boolean }
  | { type: 'RESET_STATE' }

// Initial state
export const initialState: AppState = {
  editorContent: '',
  selectedLanguage: 'python',
  selectedMode: 'comprehensive',
  reviewResult: null,
  isLoading: false,
  error: null,
  healthStatus: null,
  filterSeverity: 'all',
  isDark: false
}

// Reducer
export const appReducer = (
  state: AppState,
  action: AppAction
): AppState => {
  switch (action.type) {
    case 'SET_EDITOR_CONTENT':
      return { ...state, editorContent: action.payload }
    case 'SET_LANGUAGE':
      return { ...state, selectedLanguage: action.payload }
    case 'SET_MODE':
      return { ...state, selectedMode: action.payload }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_REVIEW_RESULT':
      return { ...state, reviewResult: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_HEALTH_STATUS':
      return { ...state, healthStatus: action.payload }
    case 'SET_FILTER_SEVERITY':
      return { ...state, filterSeverity: action.payload }
    case 'SET_DARK_MODE':
      return { ...state, isDark: action.payload }
    case 'RESET_STATE':
      return initialState
    default:
      return state
  }
}