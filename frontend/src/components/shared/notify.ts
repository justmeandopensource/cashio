import { toast } from "sonner";

interface NotifyOptions {
  title?: string;
  description?: string;
  status: "success" | "error" | "warning" | "info";
  duration?: number;
}

export const notify = ({
  title,
  description,
  status,
  duration = 2000,
}: NotifyOptions) => {
  const message = title ?? description;
  const subtitle = title ? description : undefined;
  const fn =
    status === "success"
      ? toast.success
      : status === "error"
        ? toast.error
        : status === "warning"
          ? toast.warning
          : toast.info;

  fn(message, { description: subtitle, duration });
};
