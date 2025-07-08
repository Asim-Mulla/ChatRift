import { useEffect } from "react";

const Loading = () => {
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
    <div className="h-[calc(var(--vh)_*100)] bg-[#1c1d25] flex flex-col  items-center justify-center p-8">
      <div className="relative  rounded w-64 h-40 flex items-center justify-center">
        <div className="">
          <img
            src="/chatrift-logo.png"
            alt="ChatRift Logo"
            className="w-full max-w-[150px] h-auto "
          />
        </div>
      </div>
      <p className="text-gray-400 text-xl font-bold mt-4 fade-in-out">
        Loading...
      </p>
    </div>
  );
};

export default Loading;
