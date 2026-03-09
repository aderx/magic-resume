import NextLink from "next/link";
import { AnchorHTMLAttributes, forwardRef, PropsWithChildren } from "react";

type Props = PropsWithChildren<
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
  }
>;

const Link = forwardRef<HTMLAnchorElement, Props>(function Link(
  { href, children, ...rest },
  ref
) {
  return (
    <NextLink ref={ref} href={href} {...(rest as any)}>
      {children}
    </NextLink>
  );
});

export default Link;
