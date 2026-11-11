"use client";

import { useState } from "react";
import { cloudinaryUrl } from "@/lib/events";
import { FaceBox, faceCropStyle } from "@/lib/faces";

// Round crop of one face, cut from the photo it was found in
export default function FaceThumb({
  url,
  box,
  className = "h-16 w-16",
}: {
  url: string;
  box: FaceBox;
  className?: string;
}) {
  const [aspect, setAspect] = useState<number | null>(null);

  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800 ${className}`}>
      <img
        src={cloudinaryUrl(url, "c_limit,w_800,q_auto,f_auto")}
        alt=""
        loading="lazy"
        draggable={false}
        onLoad={(e) => setAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
        style={aspect ? faceCropStyle(box, aspect) : { opacity: 0 }}
        className="transition-opacity duration-300"
      />
    </span>
  );
}
