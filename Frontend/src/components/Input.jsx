import { useState } from "react";

const Input = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  showToggle,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";

  return (
    <div className="relative flex flex-col gap-1">
      <label className="text-sm font-medium dark:text-slate-200">{label}</label>

      <input
        type={isPassword && showPassword ? "text" : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
      />

      {isPassword && showToggle && (
        <span
          className="absolute right-3 top-9 cursor-pointer text-sm"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? "Hide" : "Show"}
        </span>
      )}
    </div>
  );
};

export default Input;
