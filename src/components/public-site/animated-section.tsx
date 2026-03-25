"use client";

import { type ReactNode, Children } from "react";
import { motion, useReducedMotion } from "framer-motion";

type Animation = "fade-up" | "fade-in" | "slide-left" | "slide-right" | "none";

const VARIANTS: Record<
  Animation,
  { hidden: Record<string, number>; visible: Record<string, number> }
> = {
  "fade-up": {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
  },
  "fade-in": {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  "slide-left": {
    hidden: { opacity: 0, x: -32 },
    visible: { opacity: 1, x: 0 },
  },
  "slide-right": {
    hidden: { opacity: 0, x: 32 },
    visible: { opacity: 1, x: 0 },
  },
  none: {
    hidden: { opacity: 1 },
    visible: { opacity: 1 },
  },
};

interface AnimatedSectionProps {
  children: ReactNode;
  animation?: Animation;
  delay?: number;
  className?: string;
}

export function AnimatedSection({
  children,
  animation = "fade-up",
  delay = 0,
  className,
}: AnimatedSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion || animation === "none") {
    return className ? <div className={className}>{children}</div> : <>{children}</>;
  }

  const v = VARIANTS[animation];

  return (
    <motion.div
      initial={v.hidden}
      whileInView={v.visible}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedStaggerProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

export function AnimatedStagger({
  children,
  staggerDelay = 0.08,
  className,
}: AnimatedStaggerProps) {
  const prefersReducedMotion = useReducedMotion();
  const items = Children.toArray(children);

  if (prefersReducedMotion) {
    return className ? <div className={className}>{children}</div> : <>{children}</>;
  }

  return (
    <div className={className}>
      {items.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
            delay: i * staggerDelay,
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}
