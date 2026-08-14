export function PripleMark({
  className,
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 36 36"
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      <rect width="36" height="36" rx="9" fill="#0a0a0a" />
      <path
        fill="#f5f5f5"
        d="M11 8.5h9.2c4.6 0 7.4 2.4 7.4 6.2 0 3.9-2.8 6.3-7.4 6.3H15.2V27.5H11V8.5Zm4.2 3.4v5.7h4.8c2.1 0 3.3-1.1 3.3-2.85 0-1.74-1.2-2.85-3.3-2.85H15.2Z"
      />
    </svg>
  );
}
