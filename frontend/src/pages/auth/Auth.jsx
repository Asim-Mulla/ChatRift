import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import background from "../../assets/login2.png";
import { Button } from "@/components/ui/button";
import victory from "../../assets/victory.svg";
import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { login, signup } from "@/services/authServices";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/store";

const Auth = () => {
  const navigate = useNavigate();
  const { setUserInfo } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    if (!email.length && !password.length && !confirmPassword) {
      toast.error("All fields are required!");
      return false;
    } else if (!email.length) {
      toast.error("Email is required!");
      return false;
    } else if (!password.length) {
      toast.error("Password is required!");
      return false;
    } else if (!confirmPassword) {
      toast.error("Incorrect confirm password!");
      return false;
    }

    if (password !== confirmPassword) {
      toast.error("Incorrect confirm password!");
      return false;
    }

    if (password.length < 8) {
      toast.error("Please enter a strong password.");
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (validateLogin()) {
      try {
        const res = await login(email, password);
        if (res.data.user.id) {
          setUserInfo(res.data.user);
          if (res.data.user.profileSetup) {
            navigate("/chat");
          } else {
            navigate("/profile");
          }
        }
      } catch (error) {
        console.log(error);
        toast.error(error.response.data);
      }
    }
  };

  const handleSignup = async () => {
    if (validateSignup()) {
      try {
        const res = await signup(email, password);
        if (res.status === 201) {
          setUserInfo(res.data.user);
          navigate("/profile");
        }
      } catch (error) {
        console.log(error);
        toast.error(error?.response?.data);
      }
    }
  };

  useEffect(() => {
    const setViewportHeight = () => {
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    // Set it on load
    setViewportHeight();

    // Update it on resize (optional)
    window.addEventListener("resize", setViewportHeight);
  }, []);

  return (
    <div className="h-[calc(var(--vh)_*100)] w-[100vw] bg-[#1b1c24] text-white flex items-center justify-center">
      <div className="max-w-[1200px]  border border-[#2f303b] shadow-2xl w-[90vw] md:w-[60vw] lg:w-[50vw] xl:w-[80vw] rounded-3xl grid xl:grid-cols-2 bg-[#2c2e3b]">
        <div className=" flex flex-col gap-4 items-center justify-center px-6 pb-6">
          <div className="flex justify-center items-center flex-col">
            <div className="flex justify-center items-center gap-3">
              <h1 className="text-4xl md:text-5xl font-bold text-white/90">
                Welcome
              </h1>
              <img src={victory} alt="Victory Emoji" className="h-[80px]" />
            </div>
            <p className="font-medium text-center text-white/70 text-sm md:text-base">
              Fill in the details to get started with the best chat app!
            </p>
          </div>
          <div className="w-full flex justify-center items-center">
            <Tabs className="w-full" defaultValue="login">
              <TabsList className="bg-transparent rounded-none w-full  my-4">
                <TabsTrigger
                  className="data-[state=active]:bg-transparent text-white/70 border-b-2 rounded-none data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:border-b-purple-500 p-3 transition-all duration-300 w-full"
                  value="login"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  className="data-[state=active]:bg-transparent text-white/70 border-b-2 rounded-none data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:border-b-purple-500 p-3 transition-all duration-300 w-full"
                  value="Signup"
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
                    type={showPassword ? "input" : "password"}
                    className="rounded-full p-6 bg-[#1b1c24] border-none text-white placeholder-white/40"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-5 top-5 text-white/60"
                    onClick={handleShowPassword}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <Button
                  className="rounded-full p-6 bg-purple-700 hover:bg-purple-900 transition-all"
                  onClick={handleLogin}
                >
                  Login
                </Button>
              </TabsContent>
              <TabsContent className="flex flex-col gap-5 mt-4" value="Signup">
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
                    type={showPassword ? "input" : "password"}
                    className="rounded-full p-6 bg-[#1b1c24] border-none text-white placeholder-white/40"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-5 top-5 text-white/60"
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
                    type={showPassword ? "input" : "password"}
                    className="rounded-full p-6 bg-[#1b1c24] border-none text-white placeholder-white/40"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-5 top-5 text-white/60"
                    onClick={handleShowPassword}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <Button
                  className="rounded-full p-6 bg-purple-700 hover:bg-purple-900 transition-all"
                  onClick={handleSignup}
                >
                  Signup
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <div className="hidden xl:flex justify-center items-center bg-[#1b1c24] rounded-r-3xl">
          <img src={background} alt="background login" className="h-[500px]" />
        </div>
      </div>
    </div>
  );
};

export default Auth;
