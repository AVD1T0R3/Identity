"use client";

import { useState } from "react";
import { UsernameSetup } from "@/components/username-setup";
import { GameInterface } from "@/components/game-interface";

export default function Home() {
  const [username, setUsername] = useState<string | null>(null);

  if (!username) {
    return <UsernameSetup onUsernameSet={setUsername} />;
  }

  return <GameInterface username={username} />;
}
