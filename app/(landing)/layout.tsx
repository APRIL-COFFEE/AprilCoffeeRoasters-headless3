
import { ReactNode } from "react";

export const metadata = {
  description: `April is a coffee roastery and equipment manufacturer with a flagship store in Copenhagen. Discover terroir-driven coffees, April Brewers and brewing tools shipped worldwide.

April Coffee Roasters Founder Patrik Rolf`,
};

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div
      aria-label="layout"
      className="flex min-h-dvh flex-col bg-white text-standard-grey"
    >
      {children}
    </div>
  );
}
