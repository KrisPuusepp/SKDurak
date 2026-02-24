import React from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Heart as HeartIcon, Diamond as DiamondIcon, Club as ClubIcon, Spade as SpadeIcon, CircleHelp as QuestionMark, Rabbit } from "lucide-react";
import type { PlayingCard } from "@/Durak";

interface PlayingCardComponentProps
{
  card: PlayingCard;
  interactable?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const suitIcons: { [key: string]: any } = {
  hearts: HeartIcon,
  diamonds: DiamondIcon,
  clubs: ClubIcon,
  spades: SpadeIcon,
};

const RANK_LABELS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

export function PlayingCardComponent({ card, interactable = false, className, style }: PlayingCardComponentProps)
{
  const hidden = card.rank === undefined || card.suit === undefined || card.rank === null || card.suit === null;

  const SuitSVG = (card.suit && suitIcons[card.suit]) || QuestionMark;
  const isRedSuit = card.suit === "hearts" || card.suit === "diamonds";

  const displayRank = (card.rank && RANK_LABELS[card.rank]) || "?";
  const accentColor = isRedSuit ? "text-red-500" : "text-white";
  const borderColor = isRedSuit ? "border-red-500/50" : "border-white/40";
  const glowStyle = hidden ? "" : (isRedSuit
    ? "shadow-[0_0_3vmin_rgba(239,68,68,0.2)]"
    : "shadow-[0_0_3vmin_rgba(255,255,255,0.15)]");

  // --- Tilt Logic ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-0.5, 0.5], [30, -30]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-30, 30]);

  const springConfig = { damping: 50, stiffness: 350 };
  const smoothX = useSpring(rotateX, springConfig);
  const smoothY = useSpring(rotateY, springConfig);

  const glareOpacity = useTransform(y, [-0.5, 0.5], [0.4, 0]);
  const smoothGlare = useSpring(glareOpacity, springConfig);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>)
  {
    if (hidden) return;

    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left) / rect.width - 0.5);
    y.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave()
  {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div // Layout Container
      layout
      layoutId={card.id}
      className={`w-[15vmin] h-[21vmin] transition-[scale] ${interactable ? "cursor-pointer hover:scale-115" : ""}`
      }
      style={{ perspective: "1200px", ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* 180 Degree Rotation */}
      <motion.div
        initial={false}
        animate={{ rotateY: hidden ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 25 }}
        style={{ transformStyle: "preserve-3d", width: "100%", height: "100%" }}
      >
        {/* Card Tilt */}
        <motion.div
          style={{
            rotateX: smoothX,
            rotateY: smoothY, // This gets overridden by the animate prop for the flip, or we can combine them:
            transformStyle: "preserve-3d",
          }}
          className={`relative w-full h-full pointer-events-none rounded-[2vmin] transition-shadow duration-500 ${glowStyle} ${className}`}
        >
          {/* FRONT SIDE */}
          <div
            className={`absolute inset-0 w-full h-full rounded-[2vmin] border-[0.2vmin] ${borderColor} backdrop-blur-md p-[1.5vmin] overflow-hidden`}
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden"
            }}
          >
            {/* Glare Effect */}
            <motion.div
              style={{
                opacity: smoothGlare,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)"
              }}
              className="absolute inset-0 pointer-events-none z-20"
            />

            {/* Suits and Ranks */}
            <div className="relative w-full h-full" style={{ transform: "translateZ(20px)" }}>
              <div className={`absolute top-0 left-0 flex flex-col items-center ${accentColor}`}>
                <span className="text-[3vmin] font-bold leading-none">{displayRank}</span>
                <SuitSVG className="w-[2vmin] h-[2vmin] mt-0.5" />
              </div>

              <div className="absolute inset-0 flex justify-center items-center" style={{ transform: "translateZ(40px)" }}>
                <SuitSVG className={`w-[6vmin] h-[6vmin] ${accentColor} filter drop-shadow-[0_0_1.5vmin_currentColor] opacity-90`} />
              </div>

              <div className={`absolute bottom-0 right-0 flex flex-col items-center transform rotate-180 ${accentColor}`}>
                <span className="text-[3vmin] font-bold leading-none">{displayRank}</span>
                <SuitSVG className="w-[2vmin] h-[2vmin] mt-0.5" />
              </div>
            </div>
          </div >

          {/* BACK SIDE (Hidden) */}
          <div
            className="absolute inset-0 w-full h-full rounded-[2vmin] border-[0.2vmin] border-neutral-600 bg-neutral-900 p-[1.5vmin] overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)"
            }}
          >
            {/* Glare Effect */}
            <motion.div
              style={{
                opacity: smoothGlare,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)"
              }}
              className="absolute inset-0 pointer-events-none z-20"
            />

            {/* Back Contents */}
            <div className="w-full h-full rounded-lg flex items-center justify-center relative overflow-hidden" >
              <Rabbit className="w-[5vmin] h-[5vmin] text-neutral-600" />
            </div >
          </div >
        </motion.div >
      </motion.div >
    </motion.div >
  );
}