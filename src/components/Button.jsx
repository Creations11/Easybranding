// src/components/Button.jsx
export default function Button({ children, onClick, className = "" }) {
  return (
    <button 
      onClick={onClick}
      className={`px-8 py-4 bg-white text-black rounded-2xl font-medium hover:scale-105 transition-all active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
}