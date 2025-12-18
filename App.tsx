
import React, { useState } from 'react';
import Layout from './components/Layout';
import ChatInterface from './components/ChatInterface';
import IngestionPanel from './components/IngestionPanel';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { AppRoute } from './types';

const App: React.FC = () => {
  const [activeRoute, setActiveRoute] = useState<AppRoute>(AppRoute.CHAT);

  const renderContent = () => {
    switch (activeRoute) {
      case AppRoute.CHAT:
        return <ChatInterface />;
      case AppRoute.INGEST:
        return <IngestionPanel />;
      case AppRoute.ANALYTICS:
        return <AnalyticsDashboard />;
      default:
        return <ChatInterface />;
    }
  };

  return (
    <Layout activeRoute={activeRoute} setActiveRoute={setActiveRoute}>
      {renderContent()}
    </Layout>
  );
};

export default App;
