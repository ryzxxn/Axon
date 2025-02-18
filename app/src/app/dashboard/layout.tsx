'use client'
import { SessionProvider } from "@/components/sessionprovider";
import { Home, Dices, Youtube, FileText, PieChart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    {
      title: "Home",
      icon: Home,
      url: "/dashboard",
    },
    {
      title: "Quiz Generator",
      icon: Dices,
      url: "/dashboard/quiz",
    },
    {
      title: "Youtube Summary",
      icon: Youtube,
      url: "/dashboard/youtube",
    },
    {
      title: "Notes",
      icon: FileText,
      url: "/dashboard/notes",
    },
    {
      title: "Summary",
      icon: PieChart,
      url: "/dashboard/stats",
    },
  ];

  return (
    <SessionProvider>
      <div className="flex w-full flex-1 h-full bg-white">
        <div className="p-0 w-[max-content] flex flex-col max-w-[max-content]">
          <Link href="/" className="flex text-[.8rem] p-3 items-center justify-center aspect-square">
            <Image src="/axonn_black.svg" height={50} width={50} alt="AXONN Logo" className="w-4 aspect-square" />
            {/* <p className="text-white font-bold text-[.8rem]">AXONN</p> */}
          </Link>

          {menuItems.map((item, index) => {
            const isActive = pathname === item.url;
            return (
              <div key={index} className="aspect-square p-1 flex items-center justify-center">
                <Link
                  href={item.url}
                  className={`flex text-[.8rem] rounded-md p-2 transition-all ${
                    isActive ? "border" : "border-none"
                  }`}
                >
                  <item.icon className="size-4 font-thin text-gray-600" />
                </Link>
              </div>
            );
          })}
        </div>

        <div className="flex flex-1 min-h-screen max-h-screen w-full">
          <div className="flex flex-1 overflow-y-scroll w-full border-l">{children}</div>
        </div>
      </div>
    </SessionProvider>
  );
}
