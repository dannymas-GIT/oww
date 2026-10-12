/**
 * Render a catalog chart series with Chart.js off-DOM, upload PNG, insert into Studio.
 */
import { useEffect, useState } from 'react';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { fetchDataCatalog, uploadAsset, type DataCatalogChart } from '@/services/docStudioService';

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface ChartInsertDialogProps {
  open: boolean;
  onClose: () => void;
  documentId?: string | null;
  onInserted: (url: string) => void;
  onError?: (message: string) => void;
}

export function ChartInsertDialog({
  open,
  onClose,
  documentId,
  onInserted,
  onError,
}: ChartInsertDialogProps) {
  const [charts, setCharts] = useState<DataCatalogChart[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    void fetchDataCatalog('NY')
      .then(data => {
        setCharts(data.charts || []);
        if (data.charts?.length) setSelected(data.charts[0].id);
      })
      .catch(() => onError?.('Could not load chart catalog.'));
  }, [open, onError]);

  if (!open) return null;

  async function insert() {
    const chart = charts.find(c => c.id === selected);
    if (!chart) return;
    setBusy(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 900;
      canvas.height = 420;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      const instance = new Chart(ctx, {
        type: chart.chart_type === 'line' ? 'line' : 'bar',
        data: {
          labels: chart.labels,
          datasets: [
            {
              label: chart.label,
              data: chart.values,
              backgroundColor: 'rgba(2, 132, 199, 0.55)',
              borderColor: '#0284c7',
              borderWidth: 2,
              tension: 0.25,
            },
          ],
        },
        options: {
          responsive: false,
          animation: false,
          plugins: {
            legend: { display: true },
            title: { display: true, text: chart.label, font: { size: 16 } },
          },
          scales: {
            y: { beginAtZero: true },
          },
        },
      });
      await new Promise(r => setTimeout(r, 50));
      const blob: Blob | null = await new Promise(resolve =>
        canvas.toBlob(b => resolve(b), 'image/png')
      );
      instance.destroy();
      if (!blob) throw new Error('Chart render failed');
      const file = new File([blob], `${chart.id}.png`, { type: 'image/png' });
      const asset = await uploadAsset(file, documentId);
      onInserted(asset.url);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Chart insert failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal>
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="font-display text-xl text-oww-navy">Insert chart snapshot</h2>
        <p className="mt-1 text-base text-slate-600">
          Renders a Chart.js image from live analytics and inserts it into the document.
        </p>
        <div className="mt-4 space-y-2">
          <Label className="text-base">Series</Label>
          <select
            className="min-h-[44px] w-full rounded-md border border-slate-300 bg-white px-3 text-base"
            value={selected}
            onChange={e => setSelected(e.target.value)}
          >
            {charts.map(c => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" className="min-h-[44px] text-base" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700"
            disabled={busy || !selected}
            onClick={() => void insert()}
          >
            {busy ? 'Rendering…' : 'Insert chart'}
          </Button>
        </div>
      </div>
    </div>
  );
}
