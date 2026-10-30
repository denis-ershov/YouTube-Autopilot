interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Логотип расширения. Мастер-файл `public/icons/icon.svg` генерируется
 * `scripts/generate_icons.py` вместе с PNG-иконками манифеста — один источник геометрии.
 */
export function Logo({ size = 32, className = '' }: LogoProps) {
  return (
    <img
      src="/icons/icon.svg"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`block shrink-0 ${className}`}
    />
  );
}
