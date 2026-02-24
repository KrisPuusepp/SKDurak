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
    ? "shadow-[0_0_25px_rgba(239,68,68,0.2)]"
    : "shadow-[0_0_25px_rgba(255,255,255,0.15)]");

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
    if (!interactable) return;

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
      className={`w-32 h-48 ${hidden || !interactable ? "pointer-events-none" : "cursor-pointer"}`
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
          className={`relative w-full h-full pointer-events-none rounded-xl ${glowStyle} ${className}`}
        >
          {/* FRONT SIDE */}
          <div
            className={`absolute inset-0 w-full h-full rounded-xl border ${borderColor} backdrop-blur-md p-3 overflow-hidden`}
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden"
            }}
          >
            {/* Glare Effect */}
            <motion.div
              style={{
                opacity: smoothGlare,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)"
              }}
              className="absolute inset-0 pointer-events-none z-20"
            />

            <div className="relative w-full h-full" style={{ transform: "translateZ(20px)" }}>
              <div className={`absolute top-0 left-0 flex flex-col items-center ${accentColor}`}>
                <span className="text-lg font-bold leading-none">{displayRank}</span>
                <SuitSVG className="w-5 h-5 mt-0.5" />
              </div>

              <div className="absolute inset-0 flex justify-center items-center" style={{ transform: "translateZ(40px)" }}>
                <SuitSVG className={`w-14 h-14 ${accentColor} filter drop-shadow-[0_0_15px_currentColor] opacity-90`} />
              </div>

              <div className={`absolute bottom-0 right-0 flex flex-col items-center transform rotate-180 ${accentColor}`}>
                <span className="text-lg font-bold leading-none">{displayRank}</span>
                <SuitSVG className="w-5 h-5 mt-0.5" />
              </div>
            </div>
          </div >

          {/* BACK SIDE (Hidden) */}
          <div
            className="absolute inset-0 w-full h-full rounded-xl border border-neutral-800/80 bg-neutral-900/50 p-2 overflow-hidden"
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
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)"
              }}
              className="absolute inset-0 pointer-events-none z-20"
            />
            {/* Decorative Back Pattern */}
            <div className="w-full h-full rounded-lg border border-neutral-800/20 flex items-center backdrop-blur-md justify-center relative overflow-hidden" >
              <div
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Cpath d='M10 3l7 7-7 7-7-7z' fill='%233b82f6'/%3E%3C/svg%3E")`,
                  backgroundSize: "20px 20px"
                }}
              />
              <Rabbit className="w-12 h-12 text-neutral-600" />
            </div >
          </div >
        </motion.div >
      </motion.div >
    </motion.div >
  );
}