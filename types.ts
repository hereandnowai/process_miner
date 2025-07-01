
export interface ProcessEvent {
  caseId: string;
  activity: string;
  timestamp: string;
  resource?: string;
  cost?: number;
  // Add other relevant fields for process events
}

export interface KPI {
  id: string;
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ComponentType<{ className?: string }>; // Updated to ComponentType for better icon handling
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
  audioUrl?: string; // For multimodal response
}

export interface ProcessAnalysis {
  summary: string;
  bottlenecks: string[];
  complianceIssues: string[];
  improvementSuggestions: string[];
}

export interface AlertNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: number;
}

export enum NavigationPath {
  Dashboard = '/',
  Analyzer = '/analyzer',
  Chat = '/chat',
  Upload = '/upload',
  About = '/about',
}
