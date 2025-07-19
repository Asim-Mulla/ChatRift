import { useSocket } from "@/Context/SocketContext";
import { uploadFile } from "@/services/messageServices";
import { useAppStore } from "@/store/store";
import { useEffect, useRef, useState } from "react";
import { MdStop, MdPlayArrow, MdPause } from "react-icons/md";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FaMicrophone } from "react-icons/fa";

const VoiceMessage = () => {
  const [openVoiceDialog, setOpenVoiceDialog] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null); // for audio playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  const socket = useSocket();
  const {
    selectedChatType,
    selectedChatData,
    userInfo,
    receiverUnreadCount,
    setReceiverUnreadCount,
    DMContacts,
    setDMContacts,
  } = useAppStore();

  const handleOpenVoiceDialog = () => {
    setOpenVoiceDialog(true);
  };

  const handleCloseVoiceDialog = () => {
    setOpenVoiceDialog(false);
    handleStopRecording();
    setRecordedBlob(null);
    setRecordingTime(0);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    // Clean up audio URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType,
      });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setRecordedBlob(audioBlob);

        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        setOpenVoiceDialog(true);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      mediaRecorderRef.current.onstart = () => {
        setIsRecording(true);
        setRecordingTime(0);

        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => {
            if (prev >= 59) {
              toast.warning("Recording stopped: 1 minute limit reached.");

              if (mediaRecorderRef.current?.state === "recording") {
                mediaRecorderRef.current.stop();
              }

              setIsRecording(false);
              clearInterval(timerRef.current);
              timerRef.current = null;
              setOpenVoiceDialog(true);

              return prev;
            } else {
              return prev + 1;
            }
          });
        }, 1000);
      };

      mediaRecorderRef.current.onerror = (e) => {
        console.error("MediaRecorder error:", e.error);
      };

      setOpenVoiceDialog(true);
      toast.success("Recording started!");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setRecordingTime((prev) => prev);
      setOpenVoiceDialog(true);
    }
  };

  const handlePlayPause = () => {
    if (!recordedBlob || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.error("Audio playback failed:", err);
            toast.error("Audio playback failed. Try again.");
          });
      }
    }
  };

  const handleSendVoiceMessage = async () => {
    if (!recordedBlob) return;

    setIsSending(true);

    try {
      const formData = new FormData();
      const audioFile = new File(
        [recordedBlob],
        `voice-message-${Date.now()}.webm`,
        {
          type: "audio/webm",
        }
      );
      formData.append("file", audioFile);

      toast.promise(uploadFile(formData), {
        loading: "Sending voice message...",
        success: (res) => {
          if (res.status === 200 && res.data.filePath) {
            if (selectedChatType === "Contact") {
              socket.emit("sendMessage", {
                sender: userInfo.id,
                receiver: selectedChatData._id,
                content: null,
                messageType: "file",
                file: {
                  url: res.data.filePath,
                  fileName: res.data.fileName,
                  size: res.data.fileSize,
                  fileCloudName: res.data.fileCloudName,
                },
              });

              setReceiverUnreadCount(receiverUnreadCount + 1);

              const updatedDMContacts = DMContacts.map((contact) => {
                if (contact._id === selectedChatData._id) {
                  const notifications = contact.notifications?.find(
                    (notifier) => notifier.user === userInfo.id
                  );
                  let updatedNotifications = null;
                  if (notifications) {
                    updatedNotifications = contact.notifications.map(
                      (notifier) => {
                        if (notifier.user === userInfo.id) {
                          return { ...notifier, count: notifier.count + 1 };
                        } else {
                          return notifier;
                        }
                      }
                    );
                  } else {
                    updatedNotifications = [{ user: userInfo.id, count: 1 }];
                  }
                  contact.notifications = updatedNotifications;
                }
                return contact;
              });
              setDMContacts(updatedDMContacts);
            } else if (selectedChatType === "Group") {
              socket.emit("sendGroupMessage", {
                sender: userInfo.id,
                content: null,
                messageType: "file",
                file: {
                  url: res.data.filePath,
                  fileName: res.data.fileName,
                  size: res.data.fileSize,
                  fileCloudName: res.data.fileCloudName,
                },
                groupId: selectedChatData._id,
              });
            }

            handleCloseVoiceDialog();
            return "Voice message sent successfully!";
          } else {
            throw new Error("Upload failed: Something went wrong!");
          }
        },
        error: (err) =>
          err?.response?.data?.error ||
          "Failed to send voice message. Please try again.",
      });
    } catch (err) {
      console.error("Voice message error:", err);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (seconds) => {
    const floored = Math.floor(seconds || 0);
    const mins = Math.floor(floored / 60);
    const secs = floored % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Setup audio event listeners with refs to avoid stale closures
  const setupAudioListeners = (audio) => {
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleCanPlay = () => {
      if (audio.duration) {
        setDuration(audio.duration);
      }
    };

    // Add event listeners
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("canplay", handleCanPlay);

    // Force load metadata
    audio.load();

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  // Handle blob URL creation and cleanup
  useEffect(() => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      setAudioUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [recordedBlob]);

  // Setup audio listeners when audioUrl changes
  useEffect(() => {
    if (audioUrl && recordedBlob) {
      // Small delay to ensure audio element is ready
      const timeoutId = setTimeout(() => {
        const audio = audioRef.current;
        if (audio) {
          // Reset states
          setCurrentTime(0);
          setDuration(0);
          setIsPlaying(false);

          // Setup listeners
          const cleanup = setupAudioListeners(audio);

          return cleanup;
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [audioUrl, recordedBlob]);

  return (
    <div>
      <button
        className="flex items-center justify-center text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-all cursor-pointer hover:text-white p-1 sm:p-0"
        onClick={handleOpenVoiceDialog}
        title="Send voice message"
        type="button"
      >
        <FaMicrophone className="text-base sm:text-lg md:text-xl" />
      </button>

      <AlertDialog open={openVoiceDialog} onOpenChange={setOpenVoiceDialog}>
        <AlertDialogContent className="bg-[#181920] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Voice Message</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {!isRecording &&
                !recordedBlob &&
                "Record a voice message to send."}
              {isRecording && "Recording in progress..."}
              {recordedBlob &&
                !isRecording &&
                "Voice message recorded successfully."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-6 flex flex-col items-center gap-4">
            {/* Recording Animation */}
            {isRecording && (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-[#8417ff] rounded-full flex items-center justify-center animate-pulse">
                    <FaMicrophone className="text-2xl text-white" />
                  </div>
                  <div className="absolute inset-0 w-16 h-16 bg-[#8417ff] rounded-full animate-ping opacity-30"></div>
                </div>
                <div className="text-lg font-mono text-[#8417ff]">
                  {formatTime(recordingTime)}
                </div>
              </div>
            )}

            {/* Initial State */}
            {!isRecording && !recordedBlob && (
              <div className="w-16 h-16 bg-[#8417ff] hover:bg-[#741bda] rounded-full flex items-center justify-center transition-colors cursor-pointer">
                <FaMicrophone className="text-2xl text-white" />
              </div>
            )}

            {/* Recorded State */}
            {recordedBlob && !isRecording && (
              <div className="flex items-center gap-4">
                <button
                  className="w-12 h-12 bg-[#8417ff] hover:bg-[#741bda] rounded-full flex items-center justify-center transition-colors"
                  onClick={handlePlayPause}
                  type="button"
                >
                  {isPlaying ? (
                    <MdPause className="text-xl text-white" />
                  ) : (
                    <MdPlayArrow className="text-xl text-white" />
                  )}
                </button>
                <div className="text-sm text-gray-400 font-mono">
                  {formatTime(currentTime)} / {formatTime(recordingTime)}
                </div>
              </div>
            )}

            {/* Hidden audio element for playback */}
            {audioUrl && (
              <audio
                ref={audioRef}
                src={audioUrl}
                className="hidden"
                preload="metadata"
                onLoadedMetadata={() => {
                  if (audioRef.current) {
                    setDuration(audioRef.current.duration);
                  }
                }}
                onTimeUpdate={() => {
                  if (audioRef.current) {
                    setCurrentTime(audioRef.current.currentTime);
                  }
                }}
                onEnded={() => {
                  setIsPlaying(false);
                  setCurrentTime(0);
                }}
              />
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-[#181920] hover:bg-gray-800 hover:text-white cursor-pointer"
              onClick={handleCloseVoiceDialog}
              disabled={isSending}
            >
              Cancel
            </AlertDialogCancel>

            {!isRecording && !recordedBlob && (
              <AlertDialogAction
                className="bg-[#8417ff] hover:bg-[#741bda] cursor-pointer"
                onClick={handleStartRecording}
              >
                Start Recording
              </AlertDialogAction>
            )}

            {isRecording && (
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 cursor-pointer"
                onClick={handleStopRecording}
              >
                <MdStop className="mr-2" />
                Stop Recording
              </AlertDialogAction>
            )}

            {recordedBlob && !isRecording && (
              <AlertDialogAction
                className={`bg-[#8417ff] hover:bg-[#741bda] cursor-pointer ${
                  isSending ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={handleSendVoiceMessage}
                disabled={isSending}
              >
                {isSending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                    Sending...
                  </div>
                ) : (
                  "Send"
                )}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VoiceMessage;
