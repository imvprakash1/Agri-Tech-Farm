import { AlertBanner } from "@/app/components/AlertBanner";
import { NodeGrid } from "@/app/components/NodeGrid";
import { AutomationPanel } from "@/app/components/AutomationPanel";

export default function OverviewPage() {
  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="text-xl font-bold">Overview</h1>
      <AlertBanner />
      <section>
        <h2 className="text-sm font-semibold text-text-muted mb-3">Farm Nodes</h2>
        <NodeGrid />
      </section>
      <section>
        <h2 className="text-sm font-semibold text-text-muted mb-3">Automation</h2>
        <AutomationPanel />
      </section>
    </div>
  );
}
