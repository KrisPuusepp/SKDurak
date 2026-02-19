import React from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Heart as HeartIcon, Diamond as DiamondIcon, Club as ClubIcon, Spade as SpadeIcon } from "lucide-react";

interface PlayingCardProps {
  rank: string;
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  className?: string;
}

const suitIcons: { [key: string]: any } = {
  hearts: HeartIcon,
  diamonds: DiamondIcon,
  clubs: ClubIcon,
  spades: SpadeIcon,
};

export function PlayingCard({ rank, suit, className }: PlayingCardProps) {
  const SuitSVG = suitIcons[suit];
  const isRedSuit = suit === "hearts" || suit === "diamonds";
  const accentColor = isRedSuit ? "text-red-500" : "text-white";
  const borderColor = isRedSuit ? "border-red-500/50" : "border-white/40";
  const glowStyle = isRedSuit 
    ? "shadow-[0_0_25px_rgba(239,68,68,0.2)]" 
    : "shadow-[0_0_25px_rgba(255,255,255,0.15)]";

  // 1. Setup Motion Values for mouse position
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // 2. Map mouse position to rotation (max 20 degrees)
  const rotateX = useTransform(y, [-0.5, 0.5], [30, -30]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-30, 30]);

  // 3. Smooth the movement with springs
  const springConfig = { damping: 20, stiffness: 150 };
  const smoothX = useSpring(rotateX, springConfig);
  const smoothY = useSpring(rotateY, springConfig);

  // 4. Glare effect following the mouse
  const glareOpacity = useTransform(y, [-0.5, 0.5], [0.4, 0]);
  const smoothGlare = useSpring(glareOpacity, springConfig);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Normalize to range -0.5 to 0.5
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <div 
      className="perspective-1000 w-32 h-48"
      style={{ perspective: "1000px" }}
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: smoothX,
          rotateY: smoothY,
          transformStyle: "preserve-3d",
        }}
        className={`relative w-full h-full rounded-xl cursor-pointer 
          bg-gray/40 backdrop-blur-md border ${borderColor} ${glowStyle}
          /* Subtle white top highlight for the "3D edge" */
          before:absolute before:inset-0 before:rounded-xl before:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]
          ${className}`}
      >
        {/* Dynamic Glare Overlay */}
        <motion.div 
          style={{ 
            opacity: smoothGlare,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)"
          }}
          className="absolute inset-0 pointer-events-none z-20"
        />

        {/* Card Content Container */}
        <div className="relative w-full h-full p-3 rounded-xl overflow-hidden translate-z-20">
          
          {/* Subtle inner background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

          {/* Top-left rank + suit */}
          <div className={`absolute top-3 left-3 flex flex-col items-center z-10 ${accentColor}`}>
            <span className="text-lg font-bold leading-none">{rank}</span>
            <SuitSVG className="w-5 h-5 mt-0.5" />
          </div>

          {/* Center suit large (Floating slightly higher in 3D) */}
          <div 
            className="absolute inset-0 flex justify-center items-center z-0"
            style={{ transform: "translateZ(40px)" }}
          >
            <SuitSVG 
              className={`w-14 h-14 ${accentColor} filter drop-shadow-[0_0_15px_currentColor] opacity-90`} 
            />
          </div>

          {/* Bottom-right rank + suit rotated */}
          <div className={`absolute bottom-3 right-3 flex flex-col items-center transform rotate-180 z-10 ${accentColor}`}>
            <span className="text-lg font-bold leading-none">{rank}</span>
            <SuitSVG className="w-5 h-5 mt-0.5" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}