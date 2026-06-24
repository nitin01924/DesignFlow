import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { verifyEmail } from "../services/api";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link");
        return;
      }

      try {
        const data = await verifyEmail(token);

        setStatus("success");
        setMessage(data.message || "Email verified successfully");
        toast.success("Verification successfully completed");

        setTimeout(() => {
          navigate("/");
        }, 2000);
      } catch (error) {
        setStatus("error");
        setMessage(error.message || "Verification failed");
      }
    };

    verify();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center h-screen text-center">
      {status === "loading" && <h2>Verifying your email...</h2>}
      {status === "success" && <h2 className="text-green-500">{message}</h2>}
      {status === "error" && <h2 className="text-red-500">{message}</h2>}
    </div>
  );
}

export default VerifyEmail;
