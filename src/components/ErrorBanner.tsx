interface Props {
  error: string;
}

export default function ErrorBanner({ error }: Props) {
  return (
    <section className="card error-banner" role="alert" data-testid="error">
      <span className="err-icon" aria-hidden>
        ⚠
      </span>
      <span>{error}</span>
    </section>
  );
}
