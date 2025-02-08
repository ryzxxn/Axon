import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="w-full h-full flex flex-col bg-white m-0">
        <div className="flex flex-col bg min-h-[500px] md:h-screen">
          <div className="top-0 border-b border-[#FF7878] flex sticky bg-[rgb(255,255,255,.4)] backdrop-blur-md">
            <div>
              <p className="textcolor1 text-[1.3rem] leading-none font-bold italic text-gray-700 p-4 z-40">
                AXONN
              </p>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-start justify-center sm:items-start md:items-center lg:items-center p-6">
            <p className="text-[5rem] sm:text-[6rem] md:text-[6rem] leading-none font-bold italic text-[#FF7878] p-2 textshadow">
              AXONN
            </p>
            <p className="text-gray-700 w-full sm:w-full md:w-1/2 md:text-center lg:w-1/3 lg:text-center">
              Welcome to Your AI-Powered Study Assistant
            </p>
            <Link href='/login' className="bg-[#FF7878] text-white px-6 py-3 rounded-full font-bold">
              Get Started
            </Link>
          </div>
        </div>

        <div className="">
          <div className="border-t p-6 w-full flex flex-col gap-5">
            <p className="text-[#FF7878] capitalize font-medium text-[1.7rem] w-1/2 leading-none">
              Study Smarter, Not Harder
            </p>
            <p className="leading-tight font-thin text-[.9rem]">
              Say hello to the ultimate AI-powered study assistant designed to revolutionize the way you take notes and learn. Whether you need to create high-quality notes, summarize complex topics, or test your knowledge with quizzes and flashcards, our platform has you covered.
            </p>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-8">
          <div className="flex flex-col gap-4 p-0">
            <p className="text-[#FF7878] capitalize font-medium text-[1.7rem] w-1/2 leading-none">
              Features That Elevate Your Learning
            </p>
            <div className="list-disc list-inside leading-tight gap-6 grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
              <div className="text-gray-700 p-4 border rounded-lg">
                <div className="px-2 flex flex-col h-full gap-3">
                <strong className="text-center p-2" >AI-Generated Notes:</strong>
                <p>Transform raw ideas into structured, high-quality notes with the help of AI. Get well-organized study material on any subject effortlessly.</p>
                </div>
              </div>
              <div className="text-gray-700 p-4 border rounded-lg">
                <div className="px-2 flex flex-col h-full gap-3">
                <strong className="text-center p-2">Smart Summarization:</strong>
                <p>Too much information? Let AI condense lengthy content into concise, easy-to-digest summaries, saving you time and effort.</p>
                </div>
              </div>
              <div className="text-gray-700 p-4 border rounded-lg">
                <div className="px-2 flex flex-col h-full gap-3">
                <strong className="text-center p-2">Enhance Your Notes:</strong>
                <p>Improve the clarity and quality of your notes with AI-powered refinements, making them more comprehensive and effective for revision.</p>
                </div>
              </div>
              <div className="text-gray-700 p-4 border rounded-lg">
                <div className="px-2 flex flex-col h-full gap-3">
                <strong className="text-center p-2">Quiz & Flashcards for Active Learning:</strong>
                <p>Reinforce your understanding with AI-generated mdivtiple-choice quizzes and flashcards tailored to your notes. Master topics through interactive learning.</p>
                </div>
              </div>
              <div className="text-gray-700 p-4 border rounded-lg">
                <div className="px-2 flex flex-col h-full gap-3">
                <strong className="text-center p-2">Personalized Learning Experience:</strong>
                <p>Get customized study recommendations based on your learning style, ensuring maximum retention and efficiency.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-[#FF7878] capitalize font-medium text-[1.7rem] w-full text-center leading-none">
              Why Choose Our AI Study Assistant?
            </p>
            <div className="list-disc list-inside leading-tight flex flex-col justify-center items-center gap-4">
              <div className="px-2 py-1 bg-[#FF7878] rounded-xl text-white">Boost in Quality of Information</div>
              <div className="px-2 py-1 bg-[#FF7878] rounded-xl text-white">Simplify Complex Topics</div>
              <div className="px-2 py-1 bg-[#FF7878] rounded-xl text-white">Makes Learning More Engaging & Effective</div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <p className="text-[#FF7878] capitalize font-medium text-[2rem] leading-none">
              Join Us Today!
            </p>
            <p className="leading-tight text-center">
              Join thousands of learners and take your studying to the next level with AI. Start today and experience smarter learning!
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
