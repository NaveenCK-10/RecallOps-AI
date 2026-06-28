import { createContext, useContext, useReducer } from 'react';

const AppContext = createContext();

const initialState = {
  incidents: [],
  currentAnalysis: null,
  memories: [],
  runtimeLogs: [],
  analytics: null,
  isAnalyzing: false,
  sidebarOpen: true,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_ANALYZING': return { ...state, isAnalyzing: action.payload };
    case 'SET_ANALYSIS': return { ...state, currentAnalysis: action.payload, isAnalyzing: false };
    case 'ADD_INCIDENT': return { ...state, incidents: [action.payload, ...state.incidents] };
    case 'SET_INCIDENTS': return { ...state, incidents: action.payload };
    case 'SET_MEMORIES': return { ...state, memories: action.payload };
    case 'SET_RUNTIME': return { ...state, runtimeLogs: action.payload };
    case 'SET_ANALYTICS': return { ...state, analytics: action.payload };
    case 'TOGGLE_SIDEBAR': return { ...state, sidebarOpen: !state.sidebarOpen };
    default: return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
