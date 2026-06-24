import { useState } from "react";
import { registerUser } from "../services/api";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Input from "../components/Input";
import { toast } from "react-toastify";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setconfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      setLoading(true);
      if (!name || !email || !password) {
        alert("Please fill all fields");
        return;
      }
      if (password.length < 8) {
        toast.error("Password must be at least 8 characters long");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords does not match!");
        return;
      }

      const data = { name, email, password };
      const res = await registerUser(data);

      if (res) {
        toast.success("User registered");
        setTimeout(() => {
          toast.success("Check your email to verify your account");
        }, 2000);
      }

      navigate("/");

      console.log(res);
    } catch (error) {
      console.error(error);
      toast.error(error);

      // error when user already registered
      if (error.message.includes("User already exists")) {
        toast.error("User already registered.");
        setTimeout(() => {
          toast.error("Try to Login.");
        }, 1000);
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-80 p-6 shadow-lg rounded-lg flex flex-col gap-4">
        <h2 className="text-xl font-bold text-center">Register</h2>
        <form onSubmit={handleSubmit}>
          <Input
            label="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

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
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setconfirmPassword(e.target.value)}
            showToggle
          />

          <Button type="submit">Register</Button>
        </form>

        <p onClick={() => navigate("/")}>Already have an account? Login</p>
      </div>
    </div>
  );
}
export default Register;
