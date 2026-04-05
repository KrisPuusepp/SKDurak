import React, { useContext, type ReactElement } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Heart as LucideHeartIcon, Diamond as LucideDiamondIcon, Club as LucideClubIcon, Spade as LucideSpadeIcon, Rabbit } from "lucide-react";
import type { PlayingCard } from "@/Durak";
import { SettingsContext } from "@/App";

interface PlayingCardComponentProps
{
  card: PlayingCard;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const lucideSuitIcons: { [key: string]: any } = {
  hearts: LucideHeartIcon,
  diamonds: LucideDiamondIcon,
  clubs: LucideClubIcon,
  spades: LucideSpadeIcon,
};

export const svgSuitIcons: { [key: string]: ReactElement } = {
  hearts: <svg
    viewBox="-9 265 260 245"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full"
    fill="inherit"
    stroke="currentColor"
    strokeWidth="20"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M170.439,276.007c-19.285,0-37.521,8.365-50.537,22.804c-13.016-14.439-31.251-22.804-50.537-22.804 C31.118,276.007,0,308.436,0,348.298c0,34.451,19.675,70.372,58.479,106.763c28.292,26.534,56.178,43.139,57.352,43.832 c1.256,0.743,2.664,1.114,4.072,1.114s2.816-0.371,4.072-1.114c1.173-0.693,29.059-17.298,57.352-43.832 c38.804-36.391,58.479-72.312,58.479-106.763C239.806,308.436,208.688,276.007,170.439,276.007z" />
  </svg>,
  diamonds: <svg
    viewBox="253 -8 260 265"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full"
    fill="inherit"
    stroke="currentColor"
    strokeWidth="20"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M267.197,130.366c36.384,26.461,83.775,73.852,110.236,110.235c1.505,2.07,3.91,3.295,6.47,3.295s4.964-1.225,6.47-3.295 c26.461-36.383,73.852-83.774,110.236-110.235c2.07-1.505,3.294-3.91,3.294-6.47s-1.225-4.964-3.294-6.47 C464.225,90.966,416.833,43.574,390.373,7.191c-1.505-2.07-3.91-3.295-6.47-3.295s-4.964,1.225-6.47,3.295 c-26.461,36.383-73.852,83.774-110.236,110.235c-2.07,1.505-3.294,3.91-3.294,6.47S265.127,128.861,267.197,130.366z" />
  </svg>,
  clubs: <svg
    viewBox="255 240 260 270"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full"
    fill="inherit"
    stroke="currentColor"
    strokeWidth="20"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M452.143,350.31c-19.719-1.128-38.368,8.396-49.075,24.639c0.644-2.428,1.366-4.835,2.164-7.219 c0.549-1.64,1.792-3.02,3.501-3.887c19.494-9.894,31.281-30.386,30.03-52.206c-1.598-27.867-24.708-50.577-52.612-51.703 c-15.126-0.611-29.45,4.815-40.341,15.275c-10.896,10.465-16.896,24.546-16.896,39.65c0,20.816,11.568,39.598,30.19,49.017 c1.663,0.842,2.877,2.193,3.417,3.806c0.804,2.399,1.531,4.823,2.179,7.266c-10.707-16.241-29.363-25.769-49.074-24.638 c-27.868,1.598-50.578,24.709-51.703,52.613c-0.609,15.123,4.816,29.45,15.276,40.34c10.465,10.896,24.546,16.896,39.649,16.896 c18.691,0,35.769-9.347,45.873-24.753c-5.029,18.964-14.77,36.613-28.344,51.009c-2.19,2.323-2.79,5.726-1.524,8.658 s4.152,4.831,7.345,4.831h12.781h57.81h12.781c3.193,0,6.08-1.899,7.345-4.831s0.666-6.334-1.524-8.658 c-13.574-14.396-23.314-32.046-28.344-51.009c10.104,15.406,27.183,24.753,45.874,24.753c15.103,0,29.184-6,39.649-16.896 c10.46-10.891,15.885-25.217,15.275-40.34C502.721,375.019,480.01,351.908,452.143,350.31z" />
  </svg>,
  spades: <svg
    viewBox="0 -6 240 268"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full"
    fill="inherit"
    stroke="currentColor"
    strokeWidth="20"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M127.95,4.923c-2.435-1.369-5.407-1.369-7.842,0C115.532,7.496,8.04,68.8,8.04,143.748 c0,36.937,30.155,66.987,67.22,66.987c7.464,0,14.72-1.192,21.587-3.515c-5.451,11.404-12.65,21.975-21.309,31.201 c-2.183,2.326-2.775,5.726-1.508,8.653c1.267,2.927,4.152,4.821,7.341,4.821h85.938c3.189,0,6.074-1.895,7.341-4.821 c1.268-2.927,0.675-6.327-1.508-8.653c-8.596-9.159-15.759-19.653-21.198-30.973c6.659,2.171,13.668,3.286,20.853,3.286 c37.065,0,67.219-30.05,67.219-66.987C240.017,68.8,132.526,7.496,127.95,4.923z" />
  </svg>,
};

export interface ThemeColors
{
  accent: string;       // Text color for rank/suits
  border: string;       // Border color of the card
  glow: string;         // The shadow/glow string
  bg: string;           // The card face color
}

export interface ThemeConfig
{
  red: ThemeColors;     // Colors used for Hearts/Diamonds
  black: ThemeColors;   // Colors used for Spades/Clubs
}

export const CardColors: Record<string, ThemeConfig> = {
  dark: {
    red: {
      accent: "text-red-500",
      border: "border-red-500/50",
      glow: "shadow-[0_0_3vmin_rgba(239,68,68,0.2)]",
      bg: "bg-neutral-900",
    },
    black: {
      accent: "text-white",
      border: "border-white/40",
      glow: "shadow-[0_0_3vmin_rgba(255,255,255,0.15)]",
      bg: "bg-neutral-900",
    },
  },
  classic: {
    red: {
      accent: "text-red-600",
      border: "border-red-600/30",
      glow: "shadow-[0_0_2vmin_rgba(0,0,0,0.1)]",
      bg: "bg-white",
    },
    black: {
      accent: "text-gray-900",
      border: "border-gray-900/50",
      glow: "shadow-[0_0_2vmin_rgba(0,0,0,0.1)]",
      bg: "bg-white",
    },
  },
  purple: {
    red: {
      accent: "text-purple-500",
      border: "border-purple-400/30",
      glow: "shadow-[0_0_2vmin_rgba(0,0,,0.1)]",
      bg: "bg-indigo-950/90",
    },
    black: {
      accent: "text-gray-200",
      border: "border-gray-700/50",
      glow: "shadow-[0_0_2vmin_rgba(0,0,0,0.1)]",
      bg: "bg-gray-950/90",
    },
  },
};

const RANK_LABELS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

export function PlayingCardComponent({ card, onClick, className, style }: PlayingCardComponentProps)
{
  let { settings } = useContext(SettingsContext)!;

  const hidden = card.rank === undefined || card.suit === undefined || card.rank === null || card.suit === null;

  const LucideSuitSVG = (card.suit && lucideSuitIcons[card.suit]) || null;
  const isRedSuit = card.suit === "hearts" || card.suit === "diamonds";
  const displayRank = (card.rank && RANK_LABELS[card.rank]) || "?";

  // Fallback to 'dark' if a theme is missing
  const activeTheme = CardColors[settings.cardTheme] || CardColors.dark;
  const colors = isRedSuit ? activeTheme.red : activeTheme.black;

  // --- Tilt Logic ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-0.5, 0.5], [30, -30]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-30, 30]);

  const springConfig = { damping: 50, stiffness: 350 };
  const smoothX = useSpring(rotateX, springConfig);
  const smoothY = useSpring(rotateY, springConfig);

  const glareOpacity = useTransform(y, [-0.5, 0.5], [0.5, 0]);
  const smoothGlare = useSpring(glareOpacity, springConfig);

  // Detect if the current device is touch-capable
  const isTouchDevice = typeof window !== "undefined" && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>)
  {
    if (hidden || isTouchDevice) return; // skip tilt on touch devices

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
      className={`w-[15vmin] h-[21vmin] rounded-[2vmin] ${onClick !== undefined ? "-translate-y-[2vmin] cursor-pointer" : ""}`
      }
      style={{ perspective: "1200px", ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onPointerDown={onClick}
    >
      {/* Card Tilt */}
      <motion.div
        style={{
          rotateX: smoothX,
          rotateY: smoothY,
          transformStyle: "preserve-3d",
        }}
        className={`relative w-full h-full rounded-[2vmin] duration-500 ${!hidden && settings.cardGlow ? colors.glow : ""} transition-[scale] ${onClick !== undefined ? "hover:scale-115" : ""} ${className}`}
      >
        {hidden ? (
          <div className={`absolute inset-0 w-full h-full rounded-[2vmin] border-[0.2vmin] ${colors.border} ${colors.bg} p-[1.5vmin] overflow-hidden`}>
            {/* BACK SIDE */}

            {/* Glare Effect */}
            <motion.div
              style={{
                opacity: smoothGlare,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)"
              }}
              className="absolute inset-0 pointer-events-none z-20"
            />

            {/* Back Contents */}
            <div className="w-full h-full rounded-lg flex items-center justify-center relative overflow-hidden" >
              <Rabbit className="w-[5vmin] h-[5vmin] text-neutral-600" />
            </div >
          </div >
        ) : (
          <div className={`absolute inset-0 w-full h-full rounded-[2vmin] border-[0.2vmin] ${colors.bg} ${colors.border} p-[1.5vmin] overflow-hidden ${onClick ? "ring-[0.25vmin] ring-white/100" : ""}`}>
            {/* FRONT SIDE */}

            {/* Glare Effect */}
            <motion.div
              style={{
                opacity: smoothGlare,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)"
              }}
              className="absolute inset-0 pointer-events-none z-20"
            />

            {/* Suits and Ranks */}
            <div className="relative w-full h-full" style={{ transform: "translateZ(20px)" }}>
              <div className={`absolute top-0 left-0 flex flex-col items-center ${colors.accent}`}>
                {settings.SKMode && card.rank && card.rank == 12 ? (
                  <img src="./SK_logo.png" className="w-[4.5vmin] h-[4.5vmin] mt-[0.5vmin]" />
                ) : (
                  <span className="text-[3vmin] font-bold leading-none">{displayRank}</span>
                )}
                {card.suit &&
                  (
                    <div className={`w-[2vmin] h-[2vmin] mt-[0.5vmin] ${colors.accent} ${settings.suitFill === "filled" ? "fill-current [&_svg]:stroke-4" : "fill-transparent"}`}>
                      {settings.suitShape === "lucide" && <LucideSuitSVG className="w-full h-full fill-inherit" />}
                      {settings.suitShape === "classic" && <div className="w-full h-full">
                        {svgSuitIcons[card.suit]}
                      </div>}
                    </div>
                  )
                }
              </div>

              <div className="absolute inset-0 flex justify-center items-center" style={{ transform: "translateZ(40px)" }}>
                {card.suit &&
                  (
                    <div className={`w-[6vmin] h-[6vmin] ${colors.accent} ${settings.suitFill === "filled" ? "fill-current [&_svg]:stroke-4" : "fill-transparent"} ${settings.cardGlow ? "filter drop-shadow-[0_0_1.5vmin_currentColor]" : ""}`}>
                      {settings.suitShape === "lucide" && <LucideSuitSVG className="w-full h-full fill-inherit" />}
                      {settings.suitShape === "classic" && <div className="w-full h-full">
                        {svgSuitIcons[card.suit]}
                      </div>}
                    </div>
                  )
                }
              </div>

              <div className={`absolute bottom-0 right-0 flex flex-col items-center transform rotate-180 ${colors.accent}`}>
                {settings.SKMode && card.rank && card.rank == 12 ? (
                  <img src="./SK_logo.png" className="w-[4.5vmin] h-[4.5vmin] mt-[0.5vmin]" />
                ) : (
                  <span className="text-[3vmin] font-bold leading-none">{displayRank}</span>
                )}
                {card.suit &&
                  (
                    <div className={`w-[2vmin] h-[2vmin] mt-[0.5vmin] ${colors.accent} ${settings.suitFill === "filled" ? "fill-current [&_svg]:stroke-4" : "fill-transparent"}`}>
                      {settings.suitShape === "lucide" && <LucideSuitSVG className="w-full h-full fill-inherit" />}
                      {settings.suitShape === "classic" && <div className="w-full h-full">
                        {svgSuitIcons[card.suit]}
                      </div>}
                    </div>
                  )
                }
              </div>
            </div>
          </div >
        )}
      </motion.div >
    </motion.div >
  );
}