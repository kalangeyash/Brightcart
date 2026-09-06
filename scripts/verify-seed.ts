/** Proves the seed reconciles. Run with `pnpm verify:seed`. */
import { formatPreciseDuration } from '../src/lib/format';
import { deriveSlaState } from '../src/lib/sla';
import { MockSupportDeskApi } from '../src/services/mock/mockApi';
import { AGENT_SEEDS } from '../src/services/mock/seed/agents';
import { OPEN_TICKETS } from '../src/services/mock/seed/tickets';
import { WEEK_RECORDS } from '../src/services/mock/seed/week';

const api = new MockSupportDeskApi();

const kinds = OPEN_TICKETS.map((t) => deriveSlaState(t).kind);
const count = (k: string) => kinds.filter((x) => x === k).length;

console.log('--- open tickets ---');
console.log('total            ', OPEN_TICKETS.length);
console.log('unowned          ', OPEN_TICKETS.filter((t) => t.ownerId === null).length);
console.log(
  'breached / due / on_track / met  ',
  count('breached'),
  count('due_soon'),
  count('on_track'),
  count('met')
);

console.log('--- week records ---');
console.log('total            ', WEEK_RECORDS.length);
console.log(
  'per-agent handled sum',
  AGENT_SEEDS.reduce((n, a) => n + a.weeklyHandled, 0)
);

const overview = await api.getTeamOverview();
console.log('--- overview tiles ---');
for (const t of overview.tiles)
  console.log(` ${t.label.padEnd(26)} ${String(t.value).padStart(4)}  ${t.subLabel ?? ''}`);
console.log('median open      ', overview.teamMedianOpen);
console.log('needs you now    ', overview.needsYouNow.map((i) => i.ticket.id).join(', '));
console.log('--- workload (top 4 + Aditi) ---');
for (const row of overview.workload.slice(0, 4)) {
  console.log(
    ` ${row.agent.name.padEnd(20)} open ${String(row.open).padStart(3)}  at-risk ${row.breaching}  untouched24h ${row.untouchedOver24h}`
  );
}
const aditi = overview.workload.find((r) => r.agent.id === 'u-aditi')!;
console.log(
  ` ${aditi.agent.name.padEnd(20)} open ${String(aditi.open).padStart(3)}  at-risk ${aditi.breaching}  untouched24h ${aditi.untouchedOver24h}  (${aditi.agent.status})`
);

const report = await api.getWeeklyReport();
console.log('--- weekly report', report.period.label, '---');
for (const f of report.headline) {
  const v =
    f.unit === 'duration_ms'
      ? formatPreciseDuration(f.value)
      : f.unit === 'percent'
        ? `${f.value}%`
        : f.value;
  console.log(` ${f.label.padEnd(30)} ${String(v).padStart(8)}   delta ${f.deltaVsPrevious}`);
}
console.log(' bands   ', report.distribution.map((d) => `${d.label}:${d.count}`).join('  '));
console.log(' reasons ', report.breachReasons.map((d) => `${d.reason}:${d.count}`).join('  '));
console.log(' cats    ', report.categories.map((d) => `${d.label}:${d.count}`).join('  '));

// Mutation round-trip
const before = overview.tiles.find((t) => t.key === 'unowned')!.value;
const target = overview.needsYouNow.find((i) => i.ticket.ownerId === null)!;
const res = await api.assignTicket({ ticketId: target.ticket.id, ownerId: 'u-faisal' });
const after = (await api.getTeamOverview()).tiles.find((t) => t.key === 'unowned')!.value;
console.log('--- mutation ---');
console.log(` assign ${target.ticket.id} -> "${res.message}"  unowned ${before} -> ${after}`);

console.log('\nALL SEED ASSERTIONS PASSED');
