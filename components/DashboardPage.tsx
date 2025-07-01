
import React from 'react';
import { Link } from 'react-router-dom';
import { KPI, AlertNotification, NavigationPath } from '../types';
import { NAVIGATION_ITEMS } from '../constants';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon, LightBulbIcon, XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

interface DashboardPageProps {
  kpis: KPI[];
  alerts: AlertNotification[];
  dismissAlert: (id: string) => void; // Added dismissAlert prop
}

const StatCard: React.FC<{ kpi: KPI }> = ({ kpi }) => {
  const TrendIcon = kpi.trend === 'up' ? ArrowTrendingUpIcon : kpi.trend === 'down' ? ArrowTrendingDownIcon : MinusIcon;
  const trendColor = kpi.trend === 'up' ? 'text-green-400' : kpi.trend === 'down' ? 'text-red-400' : 'text-yellow-400';
  const IconComponent = kpi.icon || LightBulbIcon;

  return (
    <div className="glassmorphism p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">{kpi.title}</h3>
        <IconComponent className="h-6 w-6 text-brand-teal" />
      </div>
      <div className="mt-2">
        <p className="text-3xl font-bold text-white">
          {kpi.value} <span className="text-base font-normal text-gray-400">{kpi.unit}</span>
        </p>
        <div className={`mt-1 flex items-center text-sm ${trendColor}`}>
          <TrendIcon className={`h-4 w-4 mr-1 ${trendColor}`} />
          <span>{kpi.trend !== 'neutral' ? `${(Math.random() * 5 +1).toFixed(1)}% vs last period` : 'Stable'}</span>
        </div>
      </div>
    </div>
  );
};

const NavigationCard: React.FC<{ item: typeof NAVIGATION_ITEMS[0] }> = ({ item }) => (
  <Link to={item.path} className="block glassmorphism p-6 rounded-xl shadow-lg hover:shadow-2xl hover:bg-brand-teal/20 transition-all duration-300 text-center group">
    <item.icon className="h-12 w-12 text-brand-teal mx-auto mb-3 transition-transform duration-300 group-hover:scale-110" />
    <h3 className="text-lg font-semibold text-white group-hover:text-brand-gold">{item.name}</h3>
    <p className="text-sm text-gray-400 mt-1">Access {item.name.toLowerCase()} features.</p>
  </Link>
);


const DashboardPage: React.FC<DashboardPageProps> = ({ kpis, alerts, dismissAlert }) => {
  const dashboardNavItems = NAVIGATION_ITEMS.filter(item => item.path !== NavigationPath.Dashboard);
  // Show most recent 5 alerts for the dashboard summary
  const recentAlerts = alerts.slice(0, 5);


  return (
    <div className="space-y-8 animate-fadeIn">
      <section>
        <h2 className="text-3xl font-bold text-white mb-6">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kpis.map((kpi) => (
            <StatCard key={kpi.id} kpi={kpi} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-white mb-6">Navigation Hub</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardNavItems.map((item) => (
             item.path !== NavigationPath.Dashboard && <NavigationCard key={item.name} item={item} />
          ))}
        </div>
      </section>

      {recentAlerts.length > 0 && (
        <section>
          <h2 className="text-3xl font-bold text-white mb-6">Recent Activity & Alerts</h2>
          <div className="glassmorphism p-6 rounded-xl shadow-lg">
            <ul className="space-y-3 max-h-72 overflow-y-auto">
              {recentAlerts.map(alert => (
                <li key={alert.id} className={`p-3 rounded-lg border flex items-start space-x-3 ${
                  alert.type === 'error' ? 'border-red-500/50 bg-red-500/10 text-red-300' :
                  alert.type === 'warning' ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300' :
                  alert.type === 'success' ? 'border-green-500/50 bg-green-500/10 text-green-300' :
                  'border-blue-500/50 bg-blue-500/10 text-blue-300'
                }`}>
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
                    <p className="text-xs text-gray-500 mt-1">{new Date(alert.timestamp).toLocaleTimeString()}</p>
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
            {alerts.length > 5 && (
                <p className="text-xs text-gray-400 mt-3 text-center">
                    {alerts.length - 5} more notifications. Click the bell icon in the header to see all.
                </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default DashboardPage;
