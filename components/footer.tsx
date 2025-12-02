'use client';

import { ContributorCard } from "@/components/contributor-card";
import { motion } from "framer-motion";

function AnimatedHeading() {
  const headingVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.4, 0.0, 0.2, 1]
      }
    }
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.5,
        ease: [0.4, 0.0, 0.2, 1]
      }
    })
  };

  const text = "Team DTD";

  return (
    <motion.h1
      className="text-3xl md:text-5xl lg:text-6xl font-overusedGrotesk font-bold text-white mb-12 md:mb-16 text-center z-50 drop-shadow-lg"
      initial="hidden"
      animate="visible"
      variants={headingVariants as any}
    >
      <span className="inline-block overflow-hidden z-50">
        {text.split("").map((char, index) => (
          <motion.span
            key={index}
            custom={index}
            variants={letterVariants as any}
            initial="hidden"
            animate="visible"
            className="inline-block z-50"
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </span>
    </motion.h1>
  );
}

function UnderlineDemo() {
  const contributors = [
    {
        name: "Vardaan Bhatia",
        githubUsername: "vardaanaroracodes", // Update with correct GitHub username
        linkedinUrl: "https://www.linkedin.com/in/vardaan-bhatia12/",
    },
    {
      name: "Lalith Srinandan",
      githubUsername: "lalith454545", // Update with correct GitHub username
      linkedinUrl: "https://www.linkedin.com/in/lalith-srinandan-920540267/",
    },
    {
      name: "Srikar Veluvali",
      githubUsername: "srikarveluvali", // Update with correct GitHub username
      linkedinUrl: "https://www.linkedin.com/in/srikarveluvali/",
    },
    {
      name: "Akuldeep Jakkula",
      githubUsername: "akuldeepj", // Update with correct GitHub username
      linkedinUrl: "https://www.linkedin.com/in/akuldeepj/",
    },
  ];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="w-full max-w-6xl mx-auto px-4">
        <AnimatedHeading />
        <div className="w-full grid grid-cols-2 md:grid-cols-2 gap-6 md:gap-8 lg:gap-10 justify-items-center">
          {contributors.map((contributor) => (
            <ContributorCard key={contributor.name} {...contributor} />
          ))}
        </div>
      </div>
    </div>
  );
}

export { UnderlineDemo };