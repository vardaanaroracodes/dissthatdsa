"use client";
import { Code2, Brain, Sparkles, Video, Users, Trophy } from "lucide-react";

export default function Services() {
  const services = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "Affordable Classes (Minimal Fee)",
      description: "High-quality sessions at a minimal fee so anyone can learn without barriers.",
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Data Structures & Algorithms",
      description: "Strengthen problem-solving and reasoning with comprehensive DSA practice and explanations.",
    },
    {
      icon: <Code2 className="w-8 h-8" />,
      title: "Web Development (Frontend)",
      description: "Build modern UIs with HTML/CSS, React, and Next.js — from fundamentals to real apps.",
    },
    {
      icon: <Video className="w-8 h-8" />,
      title: "Backend Development",
      description: "APIs, databases, authentication, and performance — learn how real backends are built and deployed.",
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: "Product Building",
      description: "End-to-end projects that ship — plan, build, and iterate on real tech products.",
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "AI & ML",
      description: "Learn AI/ML foundations with practical demos and projects you can actually run and extend.",
    },
  ];

  return (
    <section className="relative text-white py-24 px-4 md:px-8">
      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            What We Offer
          </h2>
          <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            Minimal-fee classes in <span className="text-white font-semibold">DSA</span>,
            <span className="text-white font-semibold"> Web Development (frontend + backend)</span>,
            <span className="text-white font-semibold"> AI</span> and <span className="text-white font-semibold">ML</span>,
            with practical, product-building focus.
          </p>
        </div>

        <div className="h-px w-full bg-white/10 mb-12" />

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16">
          {services.map((service, index) => (
            <div
              key={index}
              className="group relative bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-7 md:p-8 transition-all duration-300 hover:border-white/20 hover:bg-white/5"
            >
              {/* Icon */}
              <div className="mb-5 inline-flex p-3.5 bg-white/5 rounded-xl border border-white/10 group-hover:border-white/20 group-hover:bg-white/10 transition-all duration-200">
                <div className="text-red-400">
                  {service.icon}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-white transition-colors duration-300">
                {service.title}
              </h3>

              {/* Description */}
              <p className="text-white/70 leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>

        {/* Use Case Statement */}
        <div className="border border-white/10 rounded-3xl p-8 md:p-12 bg-black/40">
          <div className="text-center">
            <div className="inline-block mb-5 px-5 py-2 bg-red-500/10 border border-red-500/30 rounded-full">
              <span className="text-red-400 font-semibold text-xs md:text-sm uppercase tracking-wider">
                Our Use Case
              </span>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              Minimal-Fee Classes. Practical Skills. Real Projects.
            </h3>
            <p className="text-base md:text-lg text-white/80 max-w-4xl mx-auto leading-relaxed mb-8">
              We take a <span className="text-white font-semibold">minimal pay</span> and offer classes in
              <span className="text-white font-semibold"> Data Structures & Algorithms</span>,
              <span className="text-white font-semibold"> Web Development (frontend + backend)</span>, and
              <span className="text-white font-semibold"> AI/ML</span>. Our sessions are live and hands-on, focused on
              <span className="text-white font-semibold"> building real tech products</span> so you learn by doing.
            </p>
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 text-xs md:text-sm">
              <div className="px-5 py-2.5 bg-white/5 border border-white/15 rounded-full"><span className="text-white/90">💸 Minimal Fee</span></div>
              <div className="px-5 py-2.5 bg-white/5 border border-white/15 rounded-full"><span className="text-white/90">🛠️ Hands-on Projects</span></div>
              <div className="px-5 py-2.5 bg-white/5 border border-white/15 rounded-full"><span className="text-white/90">🧩 Frontend + Backend</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
