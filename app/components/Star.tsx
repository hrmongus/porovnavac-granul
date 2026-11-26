/** Oranžová hviezdička z dizajnu granula.sk (ozdoba pri nadpisoch). */
export default function Star({ className = 'star' }: { className?: string }) {
  return (
    <svg className={className} viewBox="-52 -52 104 104" aria-hidden="true" focusable="false">
      <g fill="#FF6900">
        <rect x="-50" y="-15" width="100" height="30" rx="15" transform="rotate(90)" />
        <rect x="-50" y="-15" width="100" height="30" rx="15" transform="rotate(30)" />
        <rect x="-50" y="-15" width="100" height="30" rx="15" transform="rotate(150)" />
      </g>
    </svg>
  );
}
