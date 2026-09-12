import { ICON_PATHS, type IconName } from './paths';

export type { IconName };

interface IconProps {
  name: IconName;
  /** Si se pasa → `role="img"` + `<title>`; si no → `aria-hidden="true"` (I3). */
  title?: string;
  className?: string;
}

/** Único grosor de trazo de toda la familia (contract visual-system §2 I1). */
const STROKE_WIDTH = 1.75;

export function Icon({ name, title, className }: IconProps) {
  const segments = ICON_PATHS[name];

  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {segments.map((d, index) => (
        <path key={index} d={d} />
      ))}
    </svg>
  );
}
