type Name =
  | "document"
  | "screen"
  | "server"
  | "check"
  | "arrow"
  | "retry"
  | "code"
  | "play"
  | "warning"
  | "chevron"
  | "copy"
  | "close"
  | "send";
export function Icon({
  name,
  className = "",
}: {
  name: Name;
  className?: string;
}) {
  const paths: Record<Name, React.ReactNode> = {
    send: (
      <>
        <path d="m3 10 18-7-7 18-3-8-8-3Z" />
        <path d="m11 13 10-10" />
      </>
    ),
    chevron: <path d="m6 9 6 6 6-6" />,
    copy: (
      <>
        <rect x="8" y="8" width="12" height="13" rx="2" />
        <path d="M16 8V3H3v13h5" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    document: (
      <>
        <path d="M7 3h7l4 4v14H6V3z" />
        <path d="M14 3v5h4M9 12h6M9 16h6" />
      </>
    ),
    screen: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </>
    ),
    server: (
      <>
        <rect x="4" y="3" width="16" height="7" rx="2" />
        <rect x="4" y="14" width="16" height="7" rx="2" />
        <path d="M8 6.5h.01M8 17.5h.01M12 6.5h5M12 17.5h5" />
      </>
    ),
    check: <path d="m5 12 4 4 10-10" />,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    retry: (
      <>
        <path d="M4 10a8 8 0 1 1 1 8M4 4v6h6" />
      </>
    ),
    code: (
      <>
        <path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 20" />
      </>
    ),
    play: <path d="m8 4 12 8-12 8z" />,
    warning: (
      <>
        <path d="m12 3 10 18H2zM12 9v5M12 17h.01" />
      </>
    ),
  };
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
