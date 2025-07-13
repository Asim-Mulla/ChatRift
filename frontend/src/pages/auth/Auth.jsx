import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  login,
  loginWithGoogle,
  getOtpForSignup,
  verifyOtpAndSignup,
} from "@/services/authServices";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/store";
import { useGoogleLogin } from "@react-oauth/google";

const Auth = () => {
  const navigate = useNavigate();
  const { setUserInfo } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [tooManyOtp, setTooManyOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const validateLogin = () => {
    if (!email.length && !password.length) {
      toast.error("Email and Password is required!");
      return false;
    } else if (!email.length) {
      toast.error("Email is required!");
      return false;
    } else if (!password.length) {
      toast.error("Password is required!");
      return false;
    }
    return true;
  };

  const validateSignup = () => {
    if (!email.length) {
      toast.error("Email is required!");
      return false;
    } else if (!password.length) {
      toast.error("Password is required!");
      return false;
    } else if (!confirmPassword) {
      toast.error("Confirm password is required!");
      return false;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return false;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return false;
    }

    return true;
  };

  const validateOtp = () => {
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP!");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;

    try {
      await toast.promise(login(email, password), {
        loading: "Logging in...",
        success: (res) => {
          const user = res.data.user;
          if (user?.id) {
            setUserInfo(user);
            if (user.profileSetup) {
              navigate("/chat");
            } else {
              navigate("/profile");
            }
            return "Login successful!";
          } else {
            throw new Error("Invalid user data");
          }
        },
        error: (err) => {
          console.error(err);
          return err?.response?.data || "Login failed.";
        },
      });
    } catch (error) {
      console.error("Unexpected error during login:", error);
      toast.error(error?.response?.data || "Something went wrong!");
    }
  };

  const handleGetOtp = async () => {
    if (!validateSignup()) return;

    try {
      await toast.promise(getOtpForSignup(email), {
        loading: "Sending OTP...",
        success: (res) => {
          if (res.data.success) {
            setOtpSent(true);
            return `OTP sent to ${email}`;
          } else if (!res.data.success && res.data.tooManyAttempts) {
            setTooManyOtp(true);
            throw new Error(res?.data?.message);
          } else {
            throw new Error(res?.data?.message || "Failed to send OTP");
          }
        },
        error: (err) => {
          console.error(err);
          return err?.response?.data || "Failed to send OTP.";
        },
      });
    } catch (error) {
      console.error("Unexpected error during OTP generation:", error);
      toast.error(error?.response?.data || "Something went wrong!");
    }
  };

  const handleVerifyOtpAndSignup = async () => {
    if (!validateOtp()) return;

    const userData = { email, password };

    try {
      await toast.promise(verifyOtpAndSignup(userData, otp), {
        loading: "Verifying OTP and creating account...",
        success: (res) => {
          if (res.status === 201) {
            setUserInfo(res.data.user);
            navigate("/profile");
            // Reset form
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setOtp("");
            setOtpSent(false);
            return "Account created successfully!";
          } else {
            throw new Error(res.data.message || "Signup failed");
          }
        },
        error: (err) => {
          console.error(err);
          return err?.response?.data || "Signup failed.";
        },
      });
    } catch (error) {
      console.error("Unexpected error during signup:", error);
      toast.error(error?.response?.data || "Something went wrong!");
    }
  };

  const handleSignup = async () => {
    if (!otpSent) {
      await handleGetOtp();
    } else {
      await handleVerifyOtpAndSignup();
    }
  };

  const responseGoogle = async (authResult) => {
    const code = authResult["code"];

    if (code) {
      try {
        await toast.promise(loginWithGoogle(code), {
          loading: "Logging in with Google...",
          success: (res) => {
            if (res.status === 200 || res.status === 201) {
              setUserInfo(res.data.user);
              return "Logged in successfully!";
            } else {
              throw new Error("Unexpected response");
            }
          },
          error: (err) => {
            console.error("Google login failed:", err);
            return err?.response?.data || "Failed to login with Google.";
          },
        });
      } catch (error) {
        console.error("Error while requesting google code:", error);
        toast.error(error?.response?.data || "Something went wrong!");
      }
    } else {
      toast.error("Something went wrong!");
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: responseGoogle,
    flow: "auth-code",
  });

  const resetSignupForm = () => {
    setOtpSent(false);
    setOtp("");
  };

  useEffect(() => {
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setViewportHeight();
    window.addEventListener("resize", setViewportHeight);

    return () => window.removeEventListener("resize", setViewportHeight);
  }, []);

  return (
    <div className="h-[calc(var(--vh)_*100)] w-[100vw] bg-[#1b1c24] text-white flex items-center justify-center">
      <div className="max-w-[1200px] border border-[#2f303b] shadow-2xl w-[90vw] md:w-[60vw] lg:w-[50vw] xl:w-[80vw] rounded-3xl grid xl:grid-cols-2 bg-[#2c2e3b]">
        <div className="flex flex-col gap-4 items-center justify-center px-6 pb-6">
          <div className="flex justify-center items-center flex-col">
            <div className="flex justify-center items-center gap-3 p-5 md:p-6">
              <span className="text-4xl sm:text-5xl font-bold text-white/90">
                Welcome
              </span>
            </div>
            <p className="font-medium text-center text-white/70 md:text-base">
              Fill in the details to get started with the best chat app!
            </p>
          </div>
          <div className="w-full flex justify-center items-center">
            <Tabs
              className="w-full"
              defaultValue="login"
              onValueChange={resetSignupForm}
            >
              <TabsList className="bg-transparent rounded-none w-full my-4">
                <TabsTrigger
                  className="data-[state=active]:bg-transparent text-white/70 border-b-2 rounded-none data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:border-b-purple-500 p-3 transition-all duration-300 w-full cursor-pointer"
                  value="login"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  className="data-[state=active]:bg-transparent text-white/70 border-b-2 rounded-none data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:border-b-purple-500 p-3 transition-all duration-300 w-full cursor-pointer"
                  value="signup"
                >
                  Signup
                </TabsTrigger>
              </TabsList>

              <TabsContent className="flex flex-col gap-5 mt-4" value="login">
                <Input
                  placeholder="Email"
                  type="email"
                  className="rounded-full p-6 bg-[#1b1c24] border-none text-white placeholder-white/40"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="relative">
                  <Input
                    placeholder="Password"
                    type={showPassword ? "text" : "password"}
                    className="rounded-full p-6 bg-[#1b1c24] border-none text-white placeholder-white/40"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-5 top-5 text-white/60 hover:text-white transition-colors"
                    onClick={handleShowPassword}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <Button
                  className="rounded-full p-6 bg-purple-700 hover:bg-purple-900 transition-all cursor-pointer"
                  onClick={handleLogin}
                >
                  Login
                </Button>
              </TabsContent>

              <TabsContent className="flex flex-col gap-5 mt-4" value="signup">
                {!otpSent ? (
                  <>
                    <Input
                      placeholder="Email"
                      type="email"
                      className="rounded-full p-6 bg-[#1b1c24] border-none text-white placeholder-white/40"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <div className="relative">
                      <Input
                        placeholder="Password"
                        type={showPassword ? "text" : "password"}
                        className="rounded-full p-6 bg-[#1b1c24] border-none text-white placeholder-white/40"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="absolute right-5 top-5 text-white/60 hover:text-white transition-colors"
                        onClick={handleShowPassword}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        placeholder="Confirm Password"
                        type={showPassword ? "text" : "password"}
                        className="rounded-full p-6 bg-[#1b1c24] border-none text-white placeholder-white/40"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="absolute right-5 top-5 text-white/60 hover:text-white transition-colors"
                        onClick={handleShowPassword}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {!tooManyOtp ? (
                      <Button
                        className="rounded-full p-6 bg-purple-700 font-semibold hover:bg-purple-900 transition-all cursor-pointer"
                        onClick={handleSignup}
                      >
                        Get OTP for Signup
                      </Button>
                    ) : (
                      <Button
                        className="rounded-full p-6 bg-purple-700 font-semibold hover:bg-purple-900 transition-all cursor-pointer"
                        onClick={handleSignup}
                        disabled={tooManyOtp}
                      >
                        Please try again later.
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-semibold text-white">
                        Verify Your Email
                      </h3>
                      <p className="text-white/70 text-sm">
                        We've sent a 6-digit code to{" "}
                        <span className="text-purple-400">{email}</span>
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={(value) => setOtp(value)}
                        className="gap-2"
                      >
                        <InputOTPGroup className="gap-2">
                          <InputOTPSlot
                            index={0}
                            className="w-10 h-10 bg-[#1b1c24] border-[#2f303b] text-white text-lg font-semibold rounded-lg focus:border-purple-500 focus:ring-purple-500"
                          />
                          <InputOTPSlot
                            index={1}
                            className="w-10 h-10 sm:w-12 sm:h-12 bg-[#1b1c24] border-[#2f303b] text-white text-lg font-semibold rounded-lg focus:border-purple-500 focus:ring-purple-500"
                          />
                          <InputOTPSlot
                            index={2}
                            className="w-10 h-10 sm:w-12 sm:h-12 bg-[#1b1c24] border-[#2f303b] text-white text-lg font-semibold rounded-lg focus:border-purple-500 focus:ring-purple-500"
                          />
                          <InputOTPSlot
                            index={3}
                            className="w-10 h-10 sm:w-12 sm:h-12 bg-[#1b1c24] border-[#2f303b] text-white text-lg font-semibold rounded-lg focus:border-purple-500 focus:ring-purple-500"
                          />
                          <InputOTPSlot
                            index={4}
                            className="w-10 h-10 sm:w-12 sm:h-12 bg-[#1b1c24] border-[#2f303b] text-white text-lg font-semibold rounded-lg focus:border-purple-500 focus:ring-purple-500"
                          />
                          <InputOTPSlot
                            index={5}
                            className="w-10 h-10 sm:w-12 sm:h-12 bg-[#1b1c24] border-[#2f303b] text-white text-lg font-semibold rounded-lg focus:border-purple-500 focus:ring-purple-500"
                          />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="rounded-full p-6 flex-1 bg-transparent border-[#2f303b] text-white hover:bg-[#1b1c24] hover:text-white"
                        onClick={resetSignupForm}
                      >
                        Back
                      </Button>
                      <Button
                        className="rounded-full p-6 flex-1 bg-purple-700 font-semibold hover:bg-purple-900 transition-all cursor-pointer"
                        onClick={handleSignup}
                      >
                        Verify & Sign Up
                      </Button>
                    </div>
                    {!tooManyOtp ? (
                      <button
                        className="text-center text-purple-400 hover:text-purple-300 text-sm underline transition-colors"
                        onClick={handleGetOtp}
                      >
                        Didn't receive the code? Resend OTP
                      </button>
                    ) : (
                      <p
                        className="text-center text-purple-400 hover:text-purple-300 text-sm underline transition-colors"
                        // onClick={handleGetOtp}
                      >
                        Too many requests, please try again later.
                      </p>
                    )}
                  </>
                )}
              </TabsContent>

              <div className="text-center text-gray-300 font-semibold my-2">
                or
              </div>

              <button
                className="flex items-center justify-center rounded-full font-semibold gap-3 p-3 bg-purple-700 hover:bg-purple-900 transition-all cursor-pointer"
                onClick={handleGoogleLogin}
              >
                <div className="text-3xl">
                  <FcGoogle />
                </div>
                <span>Continue with Google</span>
              </button>
            </Tabs>
          </div>
        </div>
        <div className="hidden xl:flex justify-center items-center bg-[#1b1c24] rounded-r-3xl">
          <img
            src="/login.png"
            alt="background login"
            className="h-[500px] object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default Auth;
