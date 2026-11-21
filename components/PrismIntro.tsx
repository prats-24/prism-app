"use client";

import { useEffect, useState } from "react";
import { PrismMark } from "@/components/Logo";

export default function PrismIntro() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const key = "prism-intro-seen-v1";
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      setShow(true);
      const timer = window.setTimeout(() => setShow(false), 1950);
      return () => window.clearTimeout(timer);
    }
  }, []);
  if (!show) return null;
  return (
    <div className="prism-intro" aria-label="PRISM is opening" role="status">
      <span className="prism-intro-mark"><PrismMark size={105} /></span>
      <span className="prism-intro-word">SEE YOUR PROGRESS</span>
      <i className="prism-shard" /><i className="prism-shard" /><i className="prism-shard" />
      <i className="prism-shard" /><i className="prism-shard" /><i className="prism-shard" />
    </div>
  );
}
