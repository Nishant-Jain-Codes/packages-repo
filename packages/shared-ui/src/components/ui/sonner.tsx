import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = Omit<React.ComponentProps<typeof Sonner>, "position" | "toastOptions"> & {
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  duration?: number;
  toastOptions?: React.ComponentProps<typeof Sonner>["toastOptions"];
};

const Toaster = ({ position = "top-right", duration = 4000, toastOptions, ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position={position}
      closeButton={false}
      toastOptions={{
        duration,
        classNames: {
          toast: "group toast",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          // cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          // closeButton: "group-[.toast]:opacity-50 group-[.toast]:hover:opacity-100",
        },
        ...toastOptions,
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
