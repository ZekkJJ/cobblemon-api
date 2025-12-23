"use client";

import { cn } from "@/src/lib/utils";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import React, { useRef, useState } from "react";

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface NavItemsProps {
  items: {
    name: string;
    link: string;
    icon?: string;
    badge?: number;
  }[];
  className?: string;
  onItemClick?: () => void;
}

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileNavMenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const Navbar = ({ children, className }: NavbarProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const [visible, setVisible] = useState<boolean>(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  return (
    <motion.div
      ref={ref}
      className={cn("fixed inset-x-0 top-4 z-50 w-full px-4", className)}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(
              child as React.ReactElement<{ visible?: boolean }>,
              { visible }
            )
          : child
      )}
    </motion.div>
  );
};

export const NavBody = ({ children, className, visible }: NavBodyProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(10px)" : "blur(10px)",
        boxShadow: visible
          ? "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset"
          : "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset",
        width: visible ? "60%" : "100%",
        y: visible ? 0 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 50,
      }}
      className={cn(
        "relative z-[60] mx-auto hidden w-full max-w-5xl flex-row items-center justify-between self-start rounded-2xl bg-red-600/90 px-4 py-2 lg:flex",
        visible && "bg-red-600/95",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [showMore, setShowMore] = useState(false);
  
  // Show first 5 items directly, rest in dropdown
  const mainItems = items.slice(0, 5);
  const moreItems = items.slice(5);

  return (
    <motion.div
      onMouseLeave={() => {
        setHovered(null);
        setShowMore(false);
      }}
      className={cn(
        "absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-0.5 text-sm font-medium lg:flex",
        className
      )}
    >
      {mainItems.map((item, idx) => (
        <a
          onMouseEnter={() => setHovered(idx)}
          onClick={onItemClick}
          className="relative px-2.5 py-2 text-white/90 hover:text-white transition-colors whitespace-nowrap"
          key={`link-${idx}`}
          href={item.link}
        >
          {hovered === idx && (
            <motion.div
              layoutId="hovered"
              className="absolute inset-0 h-full w-full rounded-lg bg-white/20"
            />
          )}
          <span className="relative z-20 flex items-center gap-1">
            {item.icon && <i className={`fas ${item.icon} text-xs`}></i>}
            <span className="hidden xl:inline">{item.name}</span>
            {item.badge && item.badge > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-poke-green text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </span>
        </a>
      ))}
      
      {moreItems.length > 0 && (
        <div className="relative">
          <button
            onMouseEnter={() => {
              setHovered(mainItems.length);
              setShowMore(true);
            }}
            className="relative px-2.5 py-2 text-white/90 hover:text-white transition-colors"
          >
            {hovered === mainItems.length && (
              <motion.div
                layoutId="hovered"
                className="absolute inset-0 h-full w-full rounded-lg bg-white/20"
              />
            )}
            <span className="relative z-20 flex items-center gap-1">
              <i className="fas fa-ellipsis-h text-xs"></i>
              <span className="hidden xl:inline">Más</span>
            </span>
          </button>
          
          <AnimatePresence>
            {showMore && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-full right-0 mt-2 bg-red-700/95 backdrop-blur-lg rounded-xl shadow-xl py-2 min-w-[150px] z-50"
                onMouseEnter={() => setShowMore(true)}
                onMouseLeave={() => setShowMore(false)}
              >
                {moreItems.map((item, idx) => (
                  <a
                    key={`more-link-${idx}`}
                    href={item.link}
                    onClick={onItemClick}
                    className="relative flex items-center gap-2 px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    {item.icon && <i className={`fas ${item.icon} text-xs w-4`}></i>}
                    {item.name}
                    {item.badge && item.badge > 0 && (
                      <span className="min-w-[18px] h-[18px] bg-poke-green text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </a>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export const MobileNav = ({ children, className, visible }: MobileNavProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: "blur(10px)",
        boxShadow:
          "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset",
        width: visible ? "90%" : "100%",
        borderRadius: visible ? "16px" : "16px",
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 50,
      }}
      className={cn(
        "relative z-50 mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-col items-center justify-between bg-red-600/95 px-4 py-2 lg:hidden rounded-2xl",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export const MobileNavHeader = ({
  children,
  className,
}: MobileNavHeaderProps) => {
  return (
    <div
      className={cn(
        "flex w-full flex-row items-center justify-between",
        className
      )}
    >
      {children}
    </div>
  );
};

export const MobileNavMenu = ({
  children,
  className,
  isOpen,
  onClose,
}: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            "absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start justify-start gap-4 rounded-2xl bg-red-700/95 backdrop-blur-lg px-4 py-6 shadow-2xl",
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MobileNavToggle = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
    >
      <i className={`fas ${isOpen ? "fa-times" : "fa-bars"}`}></i>
    </button>
  );
};

export const NavbarLogo = () => {
  return (
    <a
      href="/"
      className="relative z-20 flex items-center gap-2 px-2 py-1"
    >
      {/* Pokeball Logo */}
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 bg-white rounded-full border-2 border-slate-800 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-red-500"></div>
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-slate-800 -translate-y-1/2"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full border-2 border-slate-800"></div>
        </div>
      </div>
      <span className="font-bold text-white text-lg hidden sm:block">Los Pitufos</span>
    </a>
  );
};

export const NavbarButton = ({
  href,
  as: Tag = "a",
  children,
  className,
  variant = "primary",
  ...props
}: {
  href?: string;
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "discord" | "danger";
} & (
  | React.ComponentPropsWithoutRef<"a">
  | React.ComponentPropsWithoutRef<"button">
)) => {
  const variantStyles = {
    primary:
      "bg-white text-red-600 hover:bg-red-50 shadow-lg",
    secondary: 
      "bg-white/10 text-white hover:bg-white/20",
    discord:
      "bg-[#5865F2] text-white hover:bg-[#4752C4] shadow-lg",
    danger:
      "bg-slate-900/50 text-white hover:bg-slate-900/70",
  };

  return (
    <Tag
      href={href || undefined}
      className={cn(
        "px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 inline-flex items-center gap-2",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
};
