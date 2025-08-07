import { toast, ToastOptions } from "react-toastify";

type ToastType = "success" | "error" | "info" | "warning";

const toastConfig: ToastOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: false,
  draggable: true,
  progress: undefined,
};

export const showToast = (type: ToastType, message: string) => {
  switch (type) {
    case "success":
      toast.success(message, toastConfig);
      break;
    case "error":
      toast.error(message, toastConfig);
      break;
    case "info":
      toast.info(message, toastConfig);
      break;
    case "warning":
      toast.warning(message, toastConfig);
      break;
    default:
      toast(message, toastConfig);
  }
};
