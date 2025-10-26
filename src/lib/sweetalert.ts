import Swal from 'sweetalert2';

// Success alert (toast)
export const showSuccess = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    timer: 2000,
    showConfirmButton: false,
    toast: true,
    position: 'top-end',
  });
};

// Error alert (modal)
export const showError = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonColor: '#dc2626',
  });
};

// Confirmation dialog (for delete/logout actions)
export const showConfirmation = async (
  title: string,
  text: string,
  confirmButtonText = 'Yes, delete it!'
) => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText,
    cancelButtonText: 'Cancel',
  });
  return result.isConfirmed;
};

// Info alert (for copy actions, etc.)
export const showInfo = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'info',
    title,
    text,
    timer: 1500,
    showConfirmButton: false,
    toast: true,
    position: 'top-end',
  });
};

// Loading alert
export const showLoading = (title: string) => {
  Swal.fire({
    title,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

// Close loading
export const closeLoading = () => {
  Swal.close();
};
