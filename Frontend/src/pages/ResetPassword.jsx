import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../components/Button";
import Input from "../components/Input";
import { resetPassword } from "../services/api";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = searchParams.get("token");

    if (!token) {
      toast.error("Invalid reset link");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const res = await resetPassword(token, password);
      toast.success(res.message);

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      toast.error(error.message || "Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg p-6 shadow-lg">
        <h2 className="text-center text-xl font-bold">Reset Password</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            showToggle
          />

          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            showToggle
          />

          <Button type="submit" loading={loading}>
            Reset Password
          </Button>
        </form>

        <p
          onClick={() => navigate("/")}
          className="cursor-pointer text-sm text-blue-500"
        >
          Back to login
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
