import type * as React from "react";

interface QwenLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

const QwenLogo = ({
  size = 24,
  className = "",
  ...props
}: QwenLogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Qwen Logo"
      {...props}
    >
      <title>Qwen</title>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="currentColor" opacity="0.1" />
      <path
        d="M12 4.5a7.5 7.5 0 1 0 4.77 13.29l2.23 1.98.99-1.11-2.2-1.95A7.5 7.5 0 0 0 12 4.5Zm0 1.5a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm-.15 2.4c-1.94 0-3.35 1.32-3.35 3.15 0 1.9 1.49 3.12 3.38 3.12.8 0 1.53-.22 2.08-.68l.72.83 1.03-.9-.72-.83c.35-.47.56-1.07.56-1.72 0-1.83-1.48-2.97-3.7-2.97Zm.09 1.38c1.18 0 2.06.65 2.06 1.7 0 .35-.1.68-.3.95l-.9-1.03-1.02.89.92 1.05c-.24.11-.5.17-.8.17-1.15 0-1.98-.75-1.98-1.81 0-1 .77-1.92 2.02-1.92Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default QwenLogo;
