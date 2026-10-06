import { useEffect, useRef, useState } from 'react';

interface Props {
  text: string;
  label?: string;
  testId: string;
  className?: string;
}

export default function CopyButton({ text, label = 'Copy', testId, className }: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API can be unavailable (non-secure context); fall back to a hidden textarea.
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* give up silently */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <button className={className ? `copy ${className}` : 'copy'} onClick={copy} data-testid={testId} title="Copy to clipboard">
      {copied ? 'Copied!' : label}
    </button>
  );
}
