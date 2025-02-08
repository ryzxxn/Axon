"use client";
import { Dices, FileText, Home, Menu, PieChart, Youtube } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [toggleOptions, setToggleOptions] = useState<boolean>(false);

  const menuItems = [
    {
      title: "Home",
      icon: Home,
      url: "/home",
    },
    {
      title: "Quiz Generator",
      icon: Dices,
      url: "/home/quiz",
    },
    {
      title: "Youtube Summary",
      icon: Youtube,
      url: "/home/youtube",
    },
    {
      title: "Notes",
      icon: FileText,
      url: "/home/notes",
    },
    {
      title: "Summary",
      icon: PieChart,
      url: "#",
    },
  ];


  return (
    <div className="bg-background flex justify-between flex-col">
      <div className="flex w-full justify-between p-2">
        <div className="flex h-full items-center px-4">
          <p className="italic font-bold text-2xl">AXONN</p>
        </div>
        <div className="flex items-center px-4">
          <Menu onClick={() => setToggleOptions(!toggleOptions)} className="cursor-pointer" />
        </div>
      </div>

      {/* {toggleOptions && (
        <div>
          <div className="flex bg-white">
            <div className="flex flex-col w-full sm:flex sm:flex-row">
              {menuItems.map((item) => (
                <div key={item.title}>
                  <div className="p-2">
                    <a
                      href={item.url}
                      className="flex items-center gap-3 hover:bg-slate-100 p-1 rounded-md"
                    >
                      <item.icon className="size-5" />
                      <p className="text-sm text-nowrap sm">{item.title}</p>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
}
