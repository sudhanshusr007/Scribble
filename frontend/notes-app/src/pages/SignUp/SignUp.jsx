import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PasswordInput from "../../components/input/PasswordInput";
import { validateEmail } from "../../utils/helper";
import axiosInstance from "../../utils/axiosInstance"; // Ensure axiosInstance is imported
import Navbar from "../../components/Navbar";
import { BASE_URL } from "../../utils/constants";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responseUser = await axiosInstance.get("/get-user");
        const responseNotes = await axiosInstance.get("/get-all-notes");
        if (responseUser.data && responseNotes.data) {
          // Navigate to the dashboard only if both requests succeed
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error retrieving user data or notes:", error);
        setError("Failed to fetch user data or notes");
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      fetchData();
    }
  }, [loading, navigate]);

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!name) {
      setError("Please enter your name");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email");
      return;
    }

    if (!password) {
      setError("Please enter the password");
      return;
    }

    setError("");
    setLoading(true); // Start loading indicator

    try {
      const response = await axiosInstance.post("/create-account", {
        fullName: name,
        email: email,
        password: password,
      });

      if (response.data && response.data.error) {
        setError(response.data.message);
        setLoading(false); // Stop loading indicator
        return;
      }

      if (response.data && response.data.accessToken) {
        localStorage.setItem("token", response.data.accessToken);
      }
    } catch (error) {
      console.error("Error creating account:", error);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false); // Stop loading indicator
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex items-center justify-center mt-28">
        <div className="w-96 border rounded bg-white px-7 py-10">
          <form onSubmit={handleSignUp}>
            <h4 className="text-2xl mb-7">Sign Up</h4>
            <input
              type="text"
              placeholder="Name"
              className="input-box"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Email"
              className="input-box"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-red-500 text-xs pb-1">{error}</p>}

            <button type="submit" className="btn-primary">
              {loading ? "Creating Account..." : "Create an Account"}
            </button>
            <p className="text-sm text-center mt-4">
              Already have an Account?{" "}
              <Link to="/login" className="font-medium text-primary underline">
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
};

export default SignUp;
