import type { SVGProps } from 'react';

/** 20px stroke icons. Paths are simple on purpose so they stay crisp at small sizes. */
const Icon = ({ children, ...rest }: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 20 20"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

export const SearchIcon = () => (
  <Icon>
    <circle cx="9" cy="9" r="5.5" />
    <path d="m13 13 4 4" />
  </Icon>
);
export const ChevronDown = () => (
  <Icon>
    <path d="m6 8 4 4 4-4" />
  </Icon>
);
export const RefreshIcon = () => (
  <Icon>
    <path d="M16 10a6 6 0 1 1-1.8-4.3" />
    <path d="M16 3.5v3h-3" />
  </Icon>
);
export const CopyIcon = () => (
  <Icon>
    <rect x="7" y="7" width="9" height="9" rx="2" />
    <path d="M13 7V5.5A1.5 1.5 0 0 0 11.5 4h-6A1.5 1.5 0 0 0 4 5.5v6A1.5 1.5 0 0 0 5.5 13H7" />
  </Icon>
);
export const DownloadIcon = () => (
  <Icon>
    <path d="M10 3.5v9M6 9l4 4 4-4M4 16h12" />
  </Icon>
);
export const CheckIcon = () => (
  <Icon>
    <path d="m4.5 10.5 3.5 3.5 7.5-8" />
  </Icon>
);
export const AlertIcon = () => (
  <Icon>
    <circle cx="10" cy="10" r="7" />
    <path d="M10 6.5v4M10 13.5v.01" />
  </Icon>
);
export const CloseIcon = () => (
  <Icon>
    <path d="m5 5 10 10M15 5 5 15" />
  </Icon>
);
export const ShuffleIcon = () => (
  <Icon>
    <path d="M3 6h2.5a4 4 0 0 1 3.3 1.8l2.4 4.4A4 4 0 0 0 14.5 14H17M3 14h2.5a4 4 0 0 0 3.3-1.8M14.5 6H17M15 4l2 2-2 2M15 12l2 2-2 2" />
  </Icon>
);
export const SunIcon = () => (
  <Icon>
    <circle cx="10" cy="10" r="3.2" />
    <path d="M10 2.5v1.5M10 16v1.5M2.5 10H4M16 10h1.5M4.7 4.7l1 1M14.3 14.3l1 1M4.7 15.3l1-1M14.3 5.7l1-1" />
  </Icon>
);
export const MoonIcon = () => (
  <Icon>
    <path d="M16 12.2A6.5 6.5 0 0 1 7.8 4 6.5 6.5 0 1 0 16 12.2Z" />
  </Icon>
);
export const MonitorIcon = () => (
  <Icon>
    <rect x="3" y="4" width="14" height="9.5" rx="1.5" />
    <path d="M7.5 16.5h5" />
  </Icon>
);
export const Logo = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <rect x="2" y="6" width="20" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M6.5 12h4M13.5 12h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
