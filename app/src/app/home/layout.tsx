import { SessionProvider } from "../components/sessionprovider";

export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
        <>
        <SessionProvider>
            {children}
        </SessionProvider>
        </>
    );
  }