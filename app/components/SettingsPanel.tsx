import { config, configDescriptions } from "@/lib/config";

export function SettingsPanel({ open = false }: { open?: boolean }) {
  return (
    <details className="panel" open={open}>
      <summary>Settings in use</summary>
      <dl>
        {configDescriptions.map((d) => (
          <div key={d.key} style={{ display: "contents" }}>
            <dt>{d.label}: {config[d.key]}{d.key === "greenBelow" || d.key === "redAbove" ? "%" : ""}</dt>
            <dd>{d.explain}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
