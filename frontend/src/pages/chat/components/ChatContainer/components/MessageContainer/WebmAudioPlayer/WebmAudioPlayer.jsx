import { useRef, useState, useEffect } from "react";
import { MdPlayArrow, MdPause } from "react-icons/md";

const WebmAudioPlayer = ({ file }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      if (audio.duration === Infinity) {
        audio.currentTime = 1e101;
        const fixDuration = () => {
          setDuration(audio.duration);
          audio.removeEventListener("timeupdate", fixDuration);
          audio.currentTime = 0;
        };
        audio.addEventListener("timeupdate", fixDuration);
      } else {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }

    setIsPlaying(!isPlaying);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <audio
        ref={audioRef}
        src={file.url}
        preload="metadata"
        className="hidden"
      />
      <button
        onClick={togglePlay}
        className="bg-[#8417ff] hover:bg-[#741bda] p-2 rounded-full mb-1"
      >
        {isPlaying ? (
          <MdPause className="text-white text-sm sm:text-lg" />
        ) : (
          <MdPlayArrow className="text-white text-sm sm:text-lg" />
        )}
      </button>
      <span className="text-xs text-white">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  );
};

export default WebmAudioPlayer;
