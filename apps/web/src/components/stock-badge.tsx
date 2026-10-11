interface StockBadgeProps {
  isAvailable: boolean;
  testId?: string;
}

export function StockBadge({ isAvailable, testId }: StockBadgeProps) {
  return (
    <span
      data-testid={testId}
      className={`inline-block rounded-full px-2 py-0.5 text-caption ${
        isAvailable ? 'bg-primary-light text-success' : 'bg-error-bg text-error'
      }`}
    >
      {isAvailable ? 'Tersedia' : 'Habis'}
    </span>
  );
}
