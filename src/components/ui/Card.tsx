"use client";

import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  onClick?: () => void;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", onClick, children, ...rest }, ref) => {
    const isClickable = typeof onClick === "function";

    return (
      <div
        ref={ref}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onClick={onClick}
        onKeyDown={
          isClickable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        className={`
          bg-surface rounded-2xl shadow-sm p-4
          ${isClickable ? "cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0" : ""}
          ${className}
        `}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

export default Card;
