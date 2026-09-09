"use client";

import { useSession } from "next-auth/react";
import LandingPage from "@/components/LandingPage";

export default function LandingPageRoute() {
  const { data: session } = useSession();
  return <LandingPage session={session} />;
}
