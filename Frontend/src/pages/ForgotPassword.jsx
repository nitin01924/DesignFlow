import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../components/Button";
import Input from "../components/Input";
import { forgotPassword } from "../services/api";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    try {
      setLoading(true);
      const res = await forgotPassword(email);
      toast.success(res.message);
    } catch (error) {
      toast.error(error.message || "Unable to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg p-6 shadow-lg">
        <h2 className="text-center text-xl font-bold">Forgot Password</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button type="submit" loading={loading}>
            Send Reset Link
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

export default ForgotPassword;
