import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwKpiTile } from '@/components/oww/OwwKpiTile';
import { Button } from '@/components/ui/button';
import { downloadAnalyticsCsv, fetchAnalytics } from '@/services/adminService';
import type { AnalyticsSummary } from '@/types';
import { formatNumber } from '@/lib/format';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    void fetchAnalytics()
      .then(setData)
      .catch(() =>
        setData({
          individuals: 0,
          employers: 0,
          jobs: 0,
          applications: 0,
          matches: 0,
          interest_submissions: 0,
          engagement_by_day: [],
          funnel: [],
        })
      );
  }, []);

  async function onExport() {
    const blob = await downloadAnalyticsCsv();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'oww-analytics.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const engagement = data?.engagement_by_day || [];
  const funnel = data?.funnel || [];

  return (
    <div className="space-y-6" data-testid="admin-analytics">
      <OwwPageHero
        eyebrow="Administration"
        title="Analytics"
        description="Engagement, funnel, and inventory KPIs. Export CSV for offline review."
        actions={
          <Button className="min-h-[44px] text-base" onClick={() => void onExport()} data-testid="analytics-csv">
            Download CSV
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <OwwKpiTile label="Individuals" value={formatNumber(data?.individuals)} />
        <OwwKpiTile label="Employers" value={formatNumber(data?.employers)} />
        <OwwKpiTile label="Jobs" value={formatNumber(data?.jobs)} />
        <OwwKpiTile label="Applications" value={formatNumber(data?.applications)} />
        <OwwKpiTile label="Matches" value={formatNumber(data?.matches)} />
        <OwwKpiTile label="Interest forms" value={formatNumber(data?.interest_submissions)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-display text-lg font-semibold text-navy">Engagement by day</h2>
          <Line
            data={{
              labels: engagement.map(e => e.date),
              datasets: [
                {
                  label: 'Events',
                  data: engagement.map(e => e.count),
                  borderColor: '#0ea5e9',
                  backgroundColor: 'rgba(14,165,233,0.2)',
                },
              ],
            }}
            options={{ responsive: true, plugins: { legend: { display: false } } }}
          />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-display text-lg font-semibold text-navy">Funnel</h2>
          <Bar
            data={{
              labels: funnel.map(f => f.stage),
              datasets: [
                {
                  label: 'Count',
                  data: funnel.map(f => f.count),
                  backgroundColor: '#0369a1',
                },
              ],
            }}
            options={{ responsive: true, plugins: { legend: { display: false } } }}
          />
        </div>
      </div>
    </div>
  );
}
