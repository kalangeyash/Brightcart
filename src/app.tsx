import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { LeadShell } from './app/layout/LeadShell';
import RootProvider from './components/providers/root';
import { ReportsScreen } from './features/reports/ReportsScreen';
import { SettingsStub } from './features/stubs/SettingsStub';
import { TicketsStub } from './features/stubs/TicketsStub';
import { UnassignedStub } from './features/stubs/UnassignedStub';
import { TeamOverviewScreen } from './features/team-overview/TeamOverviewScreen';

export default function App() {
  return (
    <RootProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<LeadShell />}>
            <Route index element={<TeamOverviewScreen />} />
            <Route path='reports' element={<ReportsScreen />} />
            <Route path='unassigned' element={<UnassignedStub />} />
            <Route path='tickets' element={<TicketsStub />} />
            <Route path='settings' element={<SettingsStub />} />
            <Route path='*' element={<Navigate to='/' replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </RootProvider>
  );
}
