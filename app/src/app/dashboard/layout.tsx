import { Navbar } from "@/components/navbar";
import { SessionProvider, useSessionContext } from "@/components/sessionprovider";
import { Home, Dices, Youtube, FileText, PieChart } from "lucide-react";
import Link from "next/link";

export default function RootLayout({children}: Readonly<{children: React.ReactNode;}>) {
    // const {userData}:any = useSessionContext()
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
          url: "#",
        },
      ];
      
    return (
        <>
        <SessionProvider>
      <div className="flex flex-1 max-h-screen min-h-screen flex-col">
        <Navbar/>
        <div className="flex flex-1 border-t">
        <div className="border-r">
            <div className="flex flex-col gap-1 p-3 text-[rgb(21,21,21)]">
            {menuItems.map((item:{title:string, icon:any, url:string}, index:number) => (
                <div key={index}>
                    <Link href={item.url} className="flex text-[.8rem] items-center leading-none gap-2 text-nowrap hover:bg-slate-100 p-2 rounded-md">
                    <item.icon className="size-5 font-thin" />
                    <p className="">{item.title}</p>
                    </Link>
                </div>
            ))}
            </div>
            <div>
                
            </div>
        </div>
        <div className="w-full overflow-y-scroll flex flex-col flex-1">
            {children}
        </div>
        </div>
      </div></SessionProvider></>
    );
  }