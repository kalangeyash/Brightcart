import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { LeadShell } from './app/layout/LeadShell';
import RootProvider from './components/providers/root';
import { ReportsScreen } from './features/reports/ReportsScreen';
import { SettingsStub } from './features/stubs/SettingsStub';
import { UnassignedStub } from './features/stubs/UnassignedStub';
import { TeamOverviewScreen } from './features/team-overview/TeamOverviewScreen';
import { AllTicketsScreen } from './features/tickets/AllTicketsScreen';
import { TicketDetailScreen } from './features/tickets/TicketDetailScreen';

export default function App() {
  return (
    <RootProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<LeadShell />}>
            <Route index element={<TeamOverviewScreen />} />
            <Route path='reports' element={<ReportsScreen />} />
            <Route path='unassigned' element={<UnassignedStub />} />
            <Route path='tickets' element={<AllTicketsScreen />} />
            <Route path='tickets/:ticketId' element={<TicketDetailScreen />} />
            <Route path='settings' element={<SettingsStub />} />
            <Route path='*' element={<Navigate to='/' replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </RootProvider>
  );
}
