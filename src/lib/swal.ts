import Swal from 'sweetalert2';

// Create a pre-styled SweetAlert2 instance
export const swalAlert = (title: string, text: string = '', icon: 'success' | 'error' | 'warning' | 'info' | 'question' = 'info') => {
  return Swal.fire({
    title,
    text,
    icon,
    confirmButtonColor: '#10b981', // emerald-500
    customClass: {
      popup: 'rounded-3xl border border-slate-100 shadow-xl font-sans text-slate-800 bg-white p-6',
      title: 'text-xl font-black uppercase tracking-tight text-slate-800 mb-2',
      htmlContainer: 'text-sm text-slate-500 leading-relaxed font-semibold',
      confirmButton: 'px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 border-0 focus:outline-none focus:ring-2 focus:ring-emerald-200'
    },
    buttonsStyling: false
  });
};

export const swalConfirm = (title: string, text: string = '') => {
  return Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#10b981', // emerald-500
    cancelButtonColor: '#64748b', // slate-500
    confirmButtonText: 'Yes, proceed',
    cancelButtonText: 'Cancel',
    customClass: {
      popup: 'rounded-3xl border border-slate-100 shadow-xl font-sans text-slate-800 bg-white p-6',
      title: 'text-xl font-black uppercase tracking-tight text-slate-800 mb-2',
      htmlContainer: 'text-sm text-slate-500 leading-relaxed font-semibold mb-4',
      confirmButton: 'px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 border-0 focus:outline-none focus:ring-2 focus:ring-emerald-200 mr-3',
      cancelButton: 'px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-all shadow-sm active:scale-95 border-0 focus:outline-none'
    },
    buttonsStyling: false
  }).then(result => result.isConfirmed);
};

export default Swal;
