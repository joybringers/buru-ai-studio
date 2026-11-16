"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function RefCapture() {
  const searchParams = useSearchParams();
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      try { localStorage.setItem("buru_ref", ref); } catch {}
    }
  }, [searchParams]);
  return null;
}
