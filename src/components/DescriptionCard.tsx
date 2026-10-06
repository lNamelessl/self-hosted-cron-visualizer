import CopyButton from './CopyButton';

interface Props {
  description: string;
  expr: string;
  macro: string | null;
  hasSeconds: boolean;
}

export default function DescriptionCard({ description, expr, macro, hasSeconds }: Props) {
  return (
    <section className="card description" data-testid="description-card">
      <div className="row-title">
        What it means
        {macro && macro !== '@reboot' && <span className="badge">macro {macro} → normalized</span>}
        {hasSeconds && <span className="badge">seconds field</span>}
      </div>
      <p className="desc-text" data-testid="description">
        {description}
      </p>
      <div className="card-actions">
        <CopyButton text={expr} label="Copy expression" testId="copy-expr" />
      </div>
    </section>
  );
}
