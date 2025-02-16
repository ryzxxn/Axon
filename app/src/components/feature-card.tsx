"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  delay: number
}

export function FeatureCard({ icon, title, description, delay }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
    >
      <motion.div
        whileHover={{
          scale: 1.05,
          boxShadow: "0 20px 30px rgba(0,0,0,0.1)",
          y: -5,
        }}
        transition={{ type: "spring", stiffness: 300 }}
        className="p-6 h-full bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200"
      >
        <motion.div className="space-y-4" whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
          <motion.div
            className="w-12 h-12 rounded-full bg-[#ff7b7b]/10 flex items-center justify-center text-[#ff7b7b]"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            {icon}
          </motion.div>
          <motion.h3 className="text-xl font-semibold" whileHover={{ scale: 1.05 }}>
            {title}
          </motion.h3>
          <p className="text-gray-600">{description}</p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}