import React from "react";

const EmptyChatContainer = () => {
  return (
    <div className="flex-1 md:bg-[#1c1d25] md:flex flex-col justify-center items-center hidden duration-1000 transition-all ">
      <div className="text-opacity-80 text-white flex flex-col gap-2 items-center mt-10 lg:text-3xl text-2xl transition-all duration-300 text-center">
        <h3 className=" poppins-medium">
          Welcome to
          <span className="text-purple-500"> ChatRift</span>
        </h3>
        <p className="text-[14px] italic text-gray-400">
          Select a contact or a group to start chatting.
        </p>
      </div>
    </div>
  );
};

export default EmptyChatContainer;
