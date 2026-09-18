export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <main id="main" className="flex justify-center px-4 py-12 sm:py-20">{children}</main>;
}
