import Navbar from "./components/navbar"

export default function Home() {
  return (
    <>
    <div className="w-full h-screen bg flex flex-col flex-1">
      <Navbar/>
      <div className="py-[20rem]">
        <p className="textcolor text-[8rem] leading-none font-bold italic text-white bg-gradient-to-t from-black to-white bg-clip-text p-2 text-center">
          AXON
        </p>
      </div>
    </div>
    </>
  );
}
