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
    <div className="flex flex-col gap-1 relative">
      <label className="text-sm font-medium">{label}</label>

      <input
        type={isPassword && showPassword ? "text" : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="border px-3 py-2 rounded outline-none focus:ring-2 focus:ring-blue-400"
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
