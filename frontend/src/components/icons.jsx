function Icon({ size = 16, strokeWidth = 2, children, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function LogoIcon(props) {
  return (
    <Icon size={22} strokeWidth={1.8} {...props}>
      <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
      <path d="m3 8 9 5 9-5" />
      <path d="M12 13v8" />
    </Icon>
  );
}

export function TableIcon(props) {
  return (
    <Icon size={18} strokeWidth={1.8} {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18M9 4v16" />
    </Icon>
  );
}

export function ListIcon(props) {
  return (
    <Icon size={18} strokeWidth={1.8} {...props}>
      <path d="M4 6h16M4 12h16M4 18h10" />
    </Icon>
  );
}

export function KeyIcon(props) {
  return (
    <Icon size={18} strokeWidth={1.8} {...props}>
      <circle cx="8" cy="15" r="4" />
      <path d="m10.8 12.2 9.2-9.2M17 6l3 3M14 9l2 2" />
    </Icon>
  );
}

export function LogoutIcon(props) {
  return (
    <Icon size={15} {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </Icon>
  );
}

export function PlusIcon(props) {
  return (
    <Icon size={15} strokeWidth={2.2} {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function EditIcon(props) {
  return (
    <Icon size={14} {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </Icon>
  );
}

export function TrashIcon(props) {
  return (
    <Icon size={14} {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
    </Icon>
  );
}

export function ArrowLeftIcon(props) {
  return (
    <Icon size={14} {...props}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </Icon>
  );
}
