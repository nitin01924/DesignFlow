import { useState } from "react";
import { loginUser, resendVerification } from "../services/api";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Input from "../components/Input";
import { toast } from "react-toastify";

function Login({ onAuthSuccess }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);

  // handle resend
  const handleResend = async () => {
    try {
      const res = await resendVerification(email);
      toast.success(res.message);
    } catch (err) {
      toast.error("Failed to resend email");
    }
  };

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      setLoading(true);
      setShowResend(false); // reset the button

      if (!email || !password) {
        alert("Please fill all fields");
        toast.error("Please fill the fields first");
        return;
      }

      const data = { email, password };
      const res = await loginUser(data);

      toast.success("Login successful.");
      if (res?.token) {
        onAuthSuccess?.(res.token);
      }
      navigate("/under-construction");
    } catch (error) {
      const message = error.message || "Unable to login";
      toast.error(message);

      // show resend button if not verified
      if (message.toLowerCase().includes("verify")) {
        setShowResend(true);
      }

      // redirect to register if user not found
      if (error.message.toLowerCase().includes("not found")) {
        navigate("/register");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-80 p-6 shadow-lg rounded-lg flex flex-col gap-4">
        <h2 className="text-xl font-bold text-center">Login</h2>

        <Input
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          showToggle
        />

        <p
          onClick={() => navigate("/forgot-password")}
          className="text-sm text-blue-500 cursor-pointer"
        >
          Forgot Password?
        </p>

        <Button onClick={handleSubmit} loading={loading}>
          Login
        </Button>

        {/*  resend button */}
        {showResend && (
          <button
            onClick={handleResend}
            className="text-blue-500 underline text-sm"
          >
            Resend Verification Email
          </button>
        )}

        <p onClick={() => navigate("/register")}>
          Don't have an account? Register
        </p>
      </div>
    </div>
  );
}

export default Login;
