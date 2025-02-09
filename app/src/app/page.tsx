"use client"

import { Brain, BookOpen, Sparkles, Lightbulb, GraduationCap, WavesLadderIcon, UserRoundCogIcon, BookUser } from "lucide-react"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { FeatureCard } from "@/components/feature-card"
import Link from "next/link"

export default function LandingPage() {
  const targetRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1])
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1])

  return (
    <div
      className=" w-full"
      ref={targetRef}
    >
      <div className="fixed w-full bg-white/80 backdrop-blur-sm z-50 border-b">
        <div className="p-3 flex items-center justify-between w-full text-gray-700 font-mono">
          <p className="">
            AXONN
          </p>
          <Link href={'/login'}>
            <BookUser/>
          </Link>
        </div>
      </div>

      <main>
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <motion.div
              animate={{
                scale: [1, 1.02, 1],
                rotate: [0, 1, -1, 0],
              }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              <h1 className="text-6xl md:text-8xl font-bold text-[#ff7b7b] tracking-tight">AXONN</h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-xl text-gray-600"
            >
              Welcome to Your AI-Powered Study Assistant
            </motion.p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 rounded-full bg-[#ff7b7b] text-white font-medium hover:bg-[#ff6b6b] transition-colors"
            >
              Get Started
            </motion.button>
          </motion.div>
        </section>

        {/* Study Smarter Section */}
        <motion.section style={{ opacity, scale }} className="py-10 bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Study Smarter, Not Harder</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Say hello to the ultimate AI-powered study assistant designed to revolutionize the way you take notes
                and learn.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Features Section */}
        <section className="py-0">
          <div className="container mx-auto px-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-center mb-12"
            >
              Features That Elevate Your Learning
            </motion.h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Brain className="w-8 h-8" />}
                title="AI-Generated Notes"
                description="Transform raw ideas into structured, high-quality notes with the help of AI."
                delay={0}
              />
              <FeatureCard
                icon={<BookOpen className="w-8 h-8" />}
                title="Smart Summarization"
                description="Let AI condense lengthy content into concise, easy-to-digest summaries."
                delay={0.2}
              />
              <FeatureCard
                icon={<Sparkles className="w-8 h-8" />}
                title="Enhance Your Notes"
                description="Improve clarity and quality with AI-powered refinements."
                delay={0.4}
              />
              <FeatureCard
                icon={<Lightbulb className="w-8 h-8" />}
                title="Quiz & Flashcards"
                description="Reinforce your understanding with AI-generated interactive learning tools."
                delay={0.6}
              />
              <FeatureCard
                icon={<GraduationCap className="w-8 h-8" />}
                title="Personalized Learning"
                description="Get customized study recommendations based on your learning style."
                delay={0.8}
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-[#ff7b7b]/5">
          <div className="container mx-auto px-4 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold mb-8"
            >
              Why Choose Our AI Study Assistant?
            </motion.h2>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                "Boost in Quality of Information",
                "Simplify Complex Topics",
                "Makes Learning More Engaging & Effective",
              ].map((text, index) => (
                <motion.button
                  key={text}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
                  }}
                  className="px-6 py-3 rounded-full bg-white hover:bg-gray-50 transition-colors"
                >
                  {text}
                </motion.button>
              ))}
            </div>
          </div>
        </section>

        {/* Join Section */}
        <section className="py-20 bg-white/80 backdrop-blur-sm relative overflow-hidden">
          <div className="container mx-auto px-4 text-center relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h2 className="text-4xl font-bold">Join Us Today!</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Join thousands of learners and take your studying to the next level with AI. Start today and experience
                smarter learning!
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 rounded-full bg-[#ff7b7b] text-white font-medium hover:bg-[#ff6b6b] transition-colors"
              >
                Get Started Now
              </motion.button>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-50 border-t border-[#f78787]">
        <div className="container mx-auto p-4 text-center text-gray-600">
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            &copy; {new Date().getFullYear()} AXONN. All rights reserved.
          </motion.p>
        </div>
      </footer>
    </div>
  )
}

