"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface UsernameSetupProps {
  onUsernameSet: (username: string) => void;
}

export function UsernameSetup({ onUsernameSet }: UsernameSetupProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: insertError } = await supabase
        .from("users")
        .insert({ username: input })
        .select("username")
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          setError("Username already taken");
        } else {
          setError("Failed to create user");
        }
        setLoading(false);
        return;
      }

      if (data) {
        onUsernameSet(data.username);
      }
    } catch (err) {
      setError("An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Easter Egg Hunt
          </h1>
          <p className="text-gray-600">Enter your username to begin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Your username"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="text-lg"
            />
          </div>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <Button
            type="submit"
            disabled={loading || input.length === 0}
            className="w-full text-lg"
          >
            {loading ? "Creating..." : "Start Game"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
