'use client';

import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const dotVariants = {
  hidden: { y: 0, scale: 0.8 },
  visible: {
    y: [0, -10, 0],
    scale: [0.8, 1.2, 0.8],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export function QuizLoading() {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <motion.div
        className="flex space-x-2 mb-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="w-3 h-3 bg-black"
            variants={dotVariants}
          />
        ))}
      </motion.div>
      <p className="text-sm text-muted-foreground">
        Loading Question...
      </p>
    </div>
  );
}
