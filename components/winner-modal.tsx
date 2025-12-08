"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WinnerModalProps {
  winner: string;
  onClose: () => void;
}

export function WinnerModal({ winner, onClose }: WinnerModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-4 text-5xl">🎉</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          We Have a Winner!
        </h2>
        <p className="text-2xl font-semibold text-blue-600 mb-6">{winner}</p>
        <p className="text-gray-600 mb-6">
          has found all the secret codes!
        </p>
        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </Card>
    </div>
  );
}
