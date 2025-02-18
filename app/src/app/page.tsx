"use client"
import { useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export default function LandingPage() {
  return (
    <div className="w-full flex flex-col gap-8">
      <motion.div
        initial="hidden"
        animate="visible"
        className="p-3 flex items-center justify-between w-full text-gray-700"
      >
        <Image src="/axonn.svg" height={100} width={100} alt="AXONN Logo" className="w-8 aspect-square" />

        <div className="flex gap-4 text-white items-center">
          <Link href={'/login'} className="px-3 py-2 font-thin text-[0.8rem] border rounded-3xl border-gray-500 w-[max-content] cursor-pointer hover:bg-white hover:text-gray-600">
            Login
          </Link>
          <Link href={'/signup'} className="px-3 py-2 font-thin text-[0.8rem] border rounded-3xl border-gray-500 w-[max-content] cursor-pointer hover:bg-white hover:text-gray-600">
            Get Started
          </Link>
        </div>
      </motion.div>

      <motion.div
        variants={fadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="flex flex-col items-center justify-center text-center bg text-white h-full gap-[3rem] transition-opacity pt-[6rem]"
      >
        <div className="py-[6rem] flex justify-center flex-col items-center gap-4">
          <p className="text-[8rem] font-bold italic leading-none">AXONN</p>
          <Link href={'/dashboard'} className="px-3 py-2 font-thin text-[0.8rem] border rounded-3xl border-gray-500 w-[max-content] cursor-pointer hover:bg-white hover:text-gray-600">Get Started</Link>
        </div>
        <p className="text-white px-6 text-center">Say hello to the ultimate AI-powered study assistant designed to revolutionize the way you take notes and learn.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-12 px-[2rem] py-[3rem]">
        {["Smart Summarization", "Quiz & Flashcards", "Enhance Your Notes"].map((title, index) => (
          <motion.div
            key={index}
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-white grid col-span-1 text-center border border-gray-700 p-5 rounded-xl"
          >
            <h1 className="font-medium text-[1.3rem] text-gray-300">{title}</h1>
            <p>{
              title === "Smart Summarization" ? "Let AI condense lengthy content into concise, easy-to-digest summaries."
                : title === "Quiz & Flashcards" ? "Reinforce your understanding with AI-generated interactive learning tools."
                : "Improve clarity and quality with AI-powered refinements."
            }</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        variants={fadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="text-center text-gray-200 flex flex-col gap-8 py-12"
      >
        <div className="flex flex-col">
          <h1 className="text-2xl">Why Axonn</h1>
          <p className="text-gray-400 font-mono">somebody took axon.com already</p>
        </div>
        <div className="flex justify-center gap-4 px-8 flex-col sm:flex-col md:flex-col lg:flex-row lg:text-nowrap break-words">
          {["Enhance Quality of Information", "Get Highly Accurate Context Specific Answers", "Simplify Complex Topics", "Intuitive Learning"].map((item, index) => (
            <motion.p
              key={index}
              variants={fadeIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="border border-[rgb(31,31,31)] px-3 py-2 rounded-3xl"
            >
              {item}
            </motion.p>
          ))}
        </div>
      </motion.div>

      <motion.div
        variants={fadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="text-white border-t border-[rgb(21,21,21)]"
      >
        <div className="container mx-auto p-4 text-center text-gray-600">
          <div>
            &copy; {new Date().getFullYear()} AXONN. All rights reserved.
          </div>
        </div>
      </motion.div>
    </div>
  )
}
