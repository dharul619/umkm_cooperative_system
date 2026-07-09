import React from "react";

export default function CooperativeLogo({ size = 40, fill = "#E85D75", ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="25" cy="25" r="25" fill={fill}/>
      <path d="M15 35V20L25 15L35 20V35L25 40L15 35Z" stroke="white" stroke-width="2" fill="none"/>
      <circle cx="25" cy="27" r="5" fill="white"/>
    </svg>
  );
}
