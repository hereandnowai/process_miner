import { KPI, NavigationPath } from './types'; // Added KPI import
import { HomeIcon, ChartBarIcon, ChatBubbleLeftEllipsisIcon, ArrowUpTrayIcon, InformationCircleIcon } from '@heroicons/react/24/outline'; // Using Heroicons for a modern look

export const APP_NAME = "Process Miner";
export const COMPANY_LOGO_URL = "https://raw.githubusercontent.com/hereandnowai/images/refs/heads/main/logos/HNAI%20Title%20-Teal%20%26%20Golden%20Logo%20-%20DESIGN%203%20-%20Raj-07.png";
export const GEMINI_TEXT_MODEL = "gemini-2.5-flash-preview-04-17"; // For general text tasks

export const NAVIGATION_ITEMS = [
  { name: 'Dashboard', path: NavigationPath.Dashboard, icon: HomeIcon },
  { name: 'Process Analyzer', path: NavigationPath.Analyzer, icon: ChartBarIcon },
  { name: 'AI Chat Assistant', path: NavigationPath.Chat, icon: ChatBubbleLeftEllipsisIcon },
  { name: 'Data Upload', path: NavigationPath.Upload, icon: ArrowUpTrayIcon },
  { name: 'About', path: NavigationPath.About, icon: InformationCircleIcon },
];

export const INITIAL_KPIS: KPI[] = [ // Explicitly typed as KPI[]
  { id: 'avgDuration', title: 'Avg. Process Duration', value: 'N/A', unit: 'days', trend: 'neutral' },
  { id: 'bottleneckFreq', title: 'Bottleneck Frequency', value: 'N/A', unit: 'occurrences', trend: 'neutral' },
  { id: 'complianceRate', title: 'Compliance Rate', value: 'N/A', unit: '%', trend: 'neutral' },
];

export const MOCK_ALERTS_COUNT = 3; // For demonstrating alert center