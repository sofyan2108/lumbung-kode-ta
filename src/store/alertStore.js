import { create } from 'zustand'

export const useAlertStore = create((set) => ({
  isOpen: false,
  type: 'success', // Bisa 'success' atau 'error'
  title: '',
  message: '',
  showLoginButton: false, // Untuk menampilkan tombol login di alert

  // Fungsi untuk memanggil alert
  showAlert: (type, title, message, showLoginButton = false) => set({ 
    isOpen: true, 
    type, 
    title, 
    message,
    showLoginButton
  }),

  // Fungsi menutup alert
  closeAlert: () => set({ isOpen: false, showLoginButton: false })
}))