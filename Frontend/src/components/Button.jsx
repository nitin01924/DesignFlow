const Button = ({ children, variant = "primary", loading, ...props }) => {
  const base = "px-4 py-2 rounded font-semibold transition";

  const variants = {
    primary: "bg-blue-500 hover:bg-blue-600 text-white",
    danger: "bg-rose-700 hover:bg-red-600 text-white",
    success: "bg-green-500 hover:bg-green-600 text-white",
    warning: "bg-yellow-400 hover:bg-yellow-500 text-black",
    secondary: "bg-gray-400 hover:bg-gray-500 text-black",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${loading && "opacity-50 cursor-not-allowed"}`}
      disabled={loading}
      {...props}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
};

export default Button;