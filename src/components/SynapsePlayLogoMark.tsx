import React from 'react';

interface SynapsePlayLogoMarkProps {
  sizeClassName?: string;
  className?: string;
}

/**
 * Official SynapsePlay Brand Logo Mark:
 * Soft Sage rounded-square badge containing the dual-tone Cream & Slate organic sprout,
 * Smooth Landing circular focus ring, and 4-node Terracotta/Cream neural synapse constellation.
 */
export const SynapsePlayLogoMark: React.FC<SynapsePlayLogoMarkProps> = ({
  sizeClassName = 'w-11 h-11',
  className = '',
}) => {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center rounded-2xl overflow-hidden shadow-sm shrink-0 bg-[#7A9A7B] ${sizeClassName} ${className}`}
    >
      <img
        src="/brand-kit/png/favicon-512x512.png"
        alt=""
        className="w-full h-full object-cover"
      />
    </span>
  );
};

export default SynapsePlayLogoMark;
