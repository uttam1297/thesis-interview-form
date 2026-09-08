import { Button as ButtonPrimitive } from "@base-ui/react/button";
import type { VariantProps } from "class-variance-authority";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

type IconButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /** Required: an icon-only button must still be announced by name. */
    "aria-label": string;
  };

function IconButton({
  className,
  variant = "ghost",
  size = "icon",
  ...props
}: IconButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="icon-button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { IconButton };
