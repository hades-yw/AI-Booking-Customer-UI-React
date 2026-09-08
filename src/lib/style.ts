import type { CSSProperties } from "react";
import type { GradientPair } from "../types";

export function gradientStyle(colors: GradientPair): CSSProperties {
  return { backgroundImage: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` };
}

export function formatCurrency(amount: number, options?: { estimate?: boolean }): string {
  return `${options?.estimate ? "≈ " : ""}RM${amount}`;
}
