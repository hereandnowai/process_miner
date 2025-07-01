
import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { ProcessEvent, AlertNotification, NavigationPath, KPI } from './types';
import { APP_NAME, COMPANY_LOGO_URL, NAVIGATION_ITEMS, INITIAL_KPIS } from './constants';
import DashboardPage from './components/DashboardPage';
import ProcessAnalyzerPage from './components/ProcessAnalyzerPage';
import ChatAssistantPage from './components/ChatAssistantPage';
import DataUploadPage from './components/DataUploadPage';
import AboutPage from './components/AboutPage';
import { XMarkIcon, BellIcon, Bars3Icon, InformationCircleIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'; // Added more icons for alert panel

const AlertPanel: React.FC<{
  alerts: AlertNotification[];
  dismissAlert: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}> = ({ alerts, dismissAlert, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/30 backdrop-blur-xs z-50" 
      onClick={onClose} 
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="absolute top-20 right-4 sm:right-6 lg:right-8 w-full max-w-md glassmorphism p-5 shadow-xl rounded-lg"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside panel
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Notifications</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 focus:outline-none"
            aria-label="Close notifications panel"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        {alerts.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No new notifications.</p>
        ) : (
          <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className={`p-3 rounded-lg border flex items-start space-x-3 ${
                  alert.type === 'error' ? 'border-red-500/50 bg-red-500/10 text-red-300' :
                  alert.type === 'warning' ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300' :
                  alert.type === 'success' ? 'border-green-500/50 bg-green-500/10 text-green-300' :
                  'border-blue-500/50 bg-blue-500/10 text-blue-300'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {alert.type === 'error' && <XMarkIcon className="h-5 w-5 text-red-400" />}
                  {alert.type === 'warning' && <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />}
                  {alert.type === 'success' && <CheckCircleIcon className="h-5 w-5 text-green-400" />}
                  {alert.type === 'info' && <InformationCircleIcon className="h-5 w-5 text-blue-400" />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    alert.type === 'error' ? 'text-red-200' :
                    alert.type === 'warning' ? 'text-yellow-200' :
                    alert.type === 'success' ? 'text-green-200' :
                    'text-blue-200'
                  }`}>
                    {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                  </p>
                  <p className="text-sm text-gray-300">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(alert.timestamp).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 focus:outline-none self-start"
                  aria-label="Dismiss notification"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [processData, setProcessData] = useState<ProcessEvent[] | null>(null);
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [kpis, setKpis] = useState<KPI[]>(INITIAL_KPIS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAlertPanelOpen, setIsAlertPanelOpen] = useState(false); // New state for alert panel
  const location = useLocation();

  const addAlert = useCallback((type: AlertNotification['type'], message: string) => {
    setAlerts(prevAlerts => [
      { id: Date.now().toString(), type, message, timestamp: Date.now() },
      ...prevAlerts, // Add new alerts to the beginning
    ]);
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== id));
  }, []);

  useEffect(() => {
    // Example: addAlert('info', 'Welcome to the Process Mining AI Platform!');
  }, [addAlert]);

  useEffect(() => {
    if (processData && processData.length > 0) {
      const uniqueCases = new Set(processData.map(e => e.caseId)).size;
      setKpis(prevKpis => prevKpis.map(kpi => {
        if (kpi.id === 'avgDuration') return { ...kpi, value: uniqueCases > 0 ? (processData.length / uniqueCases * 0.5).toFixed(1) : 'N/A', trend: 'up'};
        if (kpi.id === 'bottleneckFreq') return { ...kpi, value: Math.floor(Math.random() * 5 + 1), trend: 'down'};
        if (kpi.id === 'complianceRate') return { ...kpi, value: (Math.random() * 15 + 85).toFixed(0), trend: 'neutral'};
        return kpi;
      }));
      // addAlert('success', `Successfully processed ${processData.length} events for ${uniqueCases} cases.`); // This alert is now added in DataUploadPage
    } else {
      setKpis(INITIAL_KPIS);
    }
  }, [processData, addAlert]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleAlertPanel = () => setIsAlertPanelOpen(!isAlertPanelOpen);

  useEffect(() => {
    setIsSidebarOpen(false); // Close sidebar on route change
    setIsAlertPanelOpen(false); // Close alert panel on route change
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 text-gray-200">
      <header className="bg-slate-900/80 backdrop-blur-md shadow-lg sticky top-0 z-40"> {/* z-index adjusted for alert panel */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <img src={COMPANY_LOGO_URL} alt="Company Logo" className="h-12 w-auto mr-3" />
              <span className="text-xl sm:text-2xl font-semibold text-white tracking-tight">{APP_NAME}</span>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              {NAVIGATION_ITEMS.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out hover:bg-brand-teal/80 hover:text-white ${
                      isActive ? 'bg-brand-teal text-white shadow-md' : 'text-gray-300'
                    }`
                  }
                >
                  <item.icon className="inline-block h-5 w-5 mr-2 align-text-bottom" />
                  {item.name}
                </NavLink>
              ))}
            </div>
            <div className="flex items-center">
                <button
                  onClick={toggleAlertPanel}
                  className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white relative mr-2"
                  aria-label="View notifications"
                  aria-expanded={isAlertPanelOpen}
                >
                  <BellIcon className="h-6 w-6" />
                  {alerts.length > 0 && (
                    <span className="absolute top-0 right-0 block h-3 w-3 rounded-full ring-2 ring-slate-800 bg-red-500 text-xs flex items-center justify-center font-bold">{alerts.length > 9 ? '9+' : alerts.length}</span>
                  )}
                </button>
                <button
                    onClick={toggleSidebar}
                    className="md:hidden p-2 rounded-md text-gray-300 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    aria-controls="mobile-menu"
                    aria-expanded={isSidebarOpen}
                >
                    <span className="sr-only">Open main menu</span>
                    {isSidebarOpen ? <XMarkIcon className="block h-6 w-6" /> : <Bars3Icon className="block h-6 w-6" />}
                </button>
            </div>
          </div>
        </div>
        {isSidebarOpen && (
            <div className="md:hidden absolute top-20 left-0 right-0 bg-slate-800/95 backdrop-blur-md shadow-xl z-30 pb-4" id="mobile-menu"> {/* z-index adjusted */}
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    {NAVIGATION_ITEMS.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-150 ease-in-out hover:bg-brand-teal/80 hover:text-white ${
                                isActive ? 'bg-brand-teal text-white' : 'text-gray-300'
                                }`
                            }
                        >
                            <item.icon className="h-5 w-5 mr-3" />
                            {item.name}
                        </NavLink>
                    ))}
                </div>
            </div>
        )}
      </header>

      <AlertPanel alerts={alerts} dismissAlert={dismissAlert} isOpen={isAlertPanelOpen} onClose={() => setIsAlertPanelOpen(false)} />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path={NavigationPath.Dashboard} element={<DashboardPage kpis={kpis} alerts={alerts} dismissAlert={dismissAlert} />} />
          <Route path={NavigationPath.Analyzer} element={<ProcessAnalyzerPage processData={processData} addAlert={addAlert} />} />
          <Route path={NavigationPath.Chat} element={<ChatAssistantPage processDataContext={processData} addAlert={addAlert}/>} />
          <Route path={NavigationPath.Upload} element={<DataUploadPage setProcessData={setProcessData} addAlert={addAlert} />} />
          <Route path={NavigationPath.About} element={<AboutPage />} />
        </Routes>
      </main>

      {/* Floating Alert Toasts (Bottom Right) - Show only latest 3 non-dismissed from panel */}
      <div className="fixed bottom-4 right-4 w-full max-w-sm z-50 space-y-3">
        {alerts.slice(0, 3).map((alert) => (
          <div
            key={alert.id}
            className={`glassmorphism p-4 flex items-start space-x-3 shadow-xl animate-fadeInRight ${
              alert.type === 'error' ? 'bg-red-500/30 border-red-500/50' :
              alert.type === 'warning' ? 'bg-yellow-500/30 border-yellow-500/50' :
              alert.type === 'success' ? 'bg-green-500/30 border-green-500/50' :
              'bg-blue-500/30 border-blue-500/50'
            }`}
          >
            <div className="flex-shrink-0">
              {alert.type === 'error' && <XMarkIcon className="h-6 w-6 text-red-300" />}
              {alert.type === 'warning' && <ExclamationTriangleIcon className="h-6 w-6 text-yellow-300" />}
              {alert.type === 'success' && <CheckCircleIcon className="h-6 w-6 text-green-300" />}
              {alert.type === 'info' && <InformationCircleIcon className="h-6 w-6 text-blue-300" />}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                alert.type === 'error' ? 'text-red-200' :
                alert.type === 'warning' ? 'text-yellow-200' :
                alert.type === 'success' ? 'text-green-200' :
                'text-blue-200'
              }`}>
                {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
              </p>
              <p className="text-sm text-gray-300">{alert.message}</p>
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 focus:outline-none"
              aria-label="Dismiss notification"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      <footer className="bg-slate-900/50 border-t border-slate-700/50 py-6 text-center">
        <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
        <p className="text-xs text-gray-500 mt-1">Powered by Here and Now AI Research Institute</p>
        <p className="text-xs text-gray-500 mt-1">Developed by Bilmia M Binson [AI Products Engineering Team ]</p>
      </footer>
    </div>
  );
};

export default App;
