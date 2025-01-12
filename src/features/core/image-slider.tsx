"use client"

import React from 'react';

export function ImageSlider() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-r-3xl">
      <div
        className="absolute inset-0 bg-[url('/image.png')] bg-cover bg-center"
        style={{ backgroundImage: "url('/image.png')" }}
      />
    </div>
  );
} 