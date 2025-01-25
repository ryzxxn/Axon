
export default function Home() {
  return (
    <>
    <div className="w-full h-screen bg flex flex-col flex-1">
      {/* <Navbar/> */}
      <div className="py-[10rem] flex justify-center flex-col items-center">
        <p className="textcolor text-[8rem] leading-none font-bold italic text-gray-300 bg-gradient-to-t from-black to-white bg-clip-text p-2">
          AXON
        </p>
        <p className=" text-white w-1/3 text-center textcolor1">Personalized learning experiences powered by artificial intelligence. Boost your knowledge and skills faster than ever before.</p>
      </div>

      <div className="px-20 py-10 flex flex-col items-center text-white gap-6"> 
        <p className="text-4xl font-bold">Features</p>
        <div className="grid grid-cols-3 text-white gap-20">
          <div className="flex flex-col items-center gap-2">
            <p className="text-center font-bold text-2xl">Adaptive Learning</p>
            <p className="text-center">AI-powered system adapts to your learning style and pace.</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-center font-bold text-2xl">Instant Feedback</p>
            <p className="text-center">Clear your doubts using the AI chat feature</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-center font-bold text-2xl">Benchmark your self </p>
            <p className="text-center">Evaluate your self if you are ready for an interview or exam</p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
