import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getColor } from "@/lib/utils";
import { getGroupMessages } from "@/services/groupServices";
import { getMessages, deleteMessage } from "@/services/messageServices";
import { useAppStore } from "@/store/store";
import { useEffect, useRef, useState } from "react";
import {
  MdDownload,
  MdFolderZip,
  MdPictureAsPdf,
  MdDescription,
  MdClose,
  MdOutlineDoNotDisturb,
} from "react-icons/md";
import { toast } from "sonner";
import DeleteMessageDialog from "./DeleteMessageDialog/DeleteMessageDialog";
import { getUserInfo, removeNotification } from "@/services/userServices";
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
import { GoVerified } from "react-icons/go";

const MessageContainer = () => {
  const scrollRef = useRef();
  const unreadMessageRef = useRef();
  const containerRef = useRef();
  const hasResetRef = useRef(false);
  const [downloadingFiles, setDownloadingFiles] = useState(new Set());
  const {
    notifications,
    setNotifications,
    selectedChatType,
    selectedChatData,
    selectedChatMessages,
    setSelectedChatMessages,
    setSelectedChatData,
    setSelectedChatType,
    userInfo,
  } = useAppStore();
  const [showImage, setShowImage] = useState(false);
  const [dm, setDm] = useState();
  const [openDMDialog, setOpenDMDialog] = useState(false);
  const [image, setImage] = useState({
    url: "",
    fileName: "",
  });

  const fetctMessages = async () => {
    try {
      const res = await getMessages(selectedChatData._id);
      setSelectedChatMessages(res.data.messages);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchGroupMessages = async (groupId) => {
    try {
      const res = await getGroupMessages(groupId);
      setSelectedChatMessages(res.data.messages);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDM = async () => {
    try {
      await toast.promise(getUserInfo(dm?._id), {
        loading: "Preparing for DM...",
        success: (res) => {
          if (res.status === 200) {
            setSelectedChatType("Contact");
            setSelectedChatData(res.data.user);

            return "DM ready!";
          } else {
            throw new Error("Unexpected response");
          }
        },
        error: (err) => {
          console.error(err);
          return err?.response?.data || "Failed to create group.";
        },
      });
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data || "Failed to DM");
    }
  };

  useEffect(() => {
    if (selectedChatData?._id && selectedChatType === "Contact") {
      fetctMessages();
    } else if (selectedChatData?._id && selectedChatType === "Group") {
      fetchGroupMessages(selectedChatData?._id);
    }
  }, [selectedChatData, selectedChatType]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (unreadMessageRef.current) {
        unreadMessageRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        return;
      }
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [selectedChatMessages]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    if (!notifications) {
      return;
    }

    const cannotScroll = container.scrollHeight === container.clientHeight;

    const handleScroll = () => {
      const isAtBottom =
        container.scrollHeight - container.scrollTop <=
        container.clientHeight + 5;

      if (
        (isAtBottom && notifications > 0 && !hasResetRef.current) ||
        cannotScroll
      ) {
        hasResetRef.current = true;
        setTimeout(() => {
          setNotifications(0);
        }, 3000);
      }
    };

    if (cannotScroll) {
      handleScroll();
    }
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [notifications, setNotifications]);

  const dontNotify = async () => {
    const latestMessage =
      selectedChatMessages?.[selectedChatMessages?.length - 1];

    if (selectedChatType === "Contact" && latestMessage) {
      if (userInfo?.id === latestMessage?.receiver) {
        try {
          const res = await removeNotification(latestMessage?.sender);
        } catch (error) {
          console.log(error);
        }
      }
    }

    if (selectedChatType === "Group" && latestMessage) {
      try {
        const res = await removeNotification(selectedChatData?._id);
      } catch (error) {
        console.log(error);
      }
    }
  };

  useEffect(() => {
    dontNotify();
  }, [selectedChatMessages]);

  const checkIfImage = (filePath) => {
    const imageRegex = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
    return imageRegex.test(filePath);
  };

  const getFileIcon = (fileName, fileType) => {
    const extension = fileName?.split(".").pop()?.toLowerCase();

    if (
      fileType?.startsWith("image/") ||
      ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)
    ) {
      return <MdPictureAsPdf className="text-blue-500" />;
    } else if (extension === "pdf" || fileType === "application/pdf") {
      return <MdPictureAsPdf className="text-red-500" />;
    } else if (["zip", "rar", "7z"].includes(extension)) {
      return <MdFolderZip className="text-yellow-500" />;
    } else {
      return <MdDescription className="text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleFileDownload = async (file) => {
    if (!file?.url || !file?.fileName) {
      toast.error("Invalid file data");
      return;
    }

    const fileId = file.url.trim(); // normalize

    if (downloadingFiles.has(fileId)) {
      return;
    }

    setDownloadingFiles((prev) => {
      const newSet = new Set(prev);
      newSet.add(fileId);
      return newSet;
    });

    try {
      // Primary attempt
      const response = await fetch(file.url);
      if (!response.ok) throw new Error("Primary download failed");

      const blob = await response.blob();
      downloadBlob(blob, file.fileName);
      setImage({});
      setShowImage(false);
      toast.success(`Downloaded ${file.fileName}`);
    } catch (error) {
      console.warn("Primary download failed:", error.message);

      try {
        console.log("Trying Cloudinary-specific logic for download");
        // Fallback logic
        let downloadUrl = file.url;

        if (
          downloadUrl.includes("/image/upload/") &&
          !checkIfImage(file.fileName)
        ) {
          downloadUrl = downloadUrl.replace("/image/upload/", "/raw/upload/");
        }

        if (
          downloadUrl.includes("/raw/upload/") &&
          !downloadUrl.includes("fl_attachment")
        ) {
          const encodedFileName = encodeURIComponent(file.fileName);
          downloadUrl = `${downloadUrl}?fl_attachment=${encodedFileName}`;
        }

        const fallbackResponse = await fetch(downloadUrl, {
          method: "GET",
          headers: { Accept: "*/*" },
        });

        if (!fallbackResponse.ok) {
          throw new Error(
            `Fallback download failed with status ${fallbackResponse.status}`
          );
        }

        const blob = await fallbackResponse.blob();
        downloadBlob(blob, file.fileName);
        toast.success(`Downloaded ${file.fileName}`);
      } catch (finalError) {
        console.error("Fallback download failed:", finalError);
        toast.error("File download failed. Please try again later.");
      }
    } finally {
      // ✅ This will now always run
      setDownloadingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  // Helper function to handle blob download
  const downloadBlob = (blob, fileName) => {
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = fileName;
    a.style.display = "none";

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up
    window.URL.revokeObjectURL(downloadUrl);
  };

  const renderNotification = () => {
    return (
      <div
        ref={unreadMessageRef}
        className="text-center text-gray-300 my-7 text-xs sm:text-sm"
      >
        <span className="bg-[#1c1d25] p-2 border border-gray-700">
          {notifications} unread {notifications === 1 ? "message" : "messages"}
        </span>
      </div>
    );
  };

  const renderMessages = () => {
    // Group messages by date
    const messagesByDate = selectedChatMessages.reduce((groups, message) => {
      const messageDate = new Date(message?.createdAt).toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "long",
          year: "2-digit",
        }
      );

      if (!groups[messageDate]) {
        groups[messageDate] = [];
      }
      groups[messageDate].push(message);
      return groups;
    }, {});

    const unreadStartIndex = selectedChatMessages?.length - notifications;
    let globalMessageIndex = 0;

    // Render each date group
    return Object.entries(messagesByDate).map(
      ([date, messages], groupIndex) => (
        <div key={`date-group-${groupIndex}`}>
          <div className="sticky top-[-1px] sm:top-[-10px] z-10 text-center text-gray-300 my-2 text-xs sm:text-sm ">
            <span className="bg-[#1c1d25] p-2 border border-gray-700">
              {date}
            </span>
          </div>

          {/* All messages for this date */}
          <div className="pb-2">
            {messages.map((message, messageIndex) => {
              const isUnreadStart = globalMessageIndex === unreadStartIndex;
              globalMessageIndex++;
              return (
                <div key={`${groupIndex}-${messageIndex}`}>
                  {isUnreadStart && renderNotification()}
                  {selectedChatType === "Contact" &&
                    renderContactMessages(message, messageIndex, messages)}
                  {selectedChatType === "Group" &&
                    renderGroupMessages(message, messageIndex, messages)}
                </div>
              );
            })}
          </div>
        </div>
      )
    );
  };

  const renderContactMessages = (message, messageIndex, messagesInGroup) => {
    const isOwnMessage = message?.sender === userInfo?.id;
    const againSameSender =
      messageIndex > 0 &&
      message?.sender === messagesInGroup[messageIndex - 1]?.sender;
    const canDelete = isOwnMessage;

    return (
      <div
        className={`${isOwnMessage ? "text-right" : "text-left"} group ${
          againSameSender ? "mt-1" : "mt-3"
        }`}
      >
        {message?.deleted && (
          <div
            className={`${
              isOwnMessage
                ? "bg-[#8417ff]/25 text-white/80 border-[#8417ff]/50"
                : "bg-[#2e2b33]/5 text-white/80 border-[#ffffff]/20"
            } relative border inline-block p-2 sm:p-3 italic rounded max-w-[85%] sm:max-w-[75%] md:max-w-[60%] lg:max-w-[50%] break-words text-sm sm:text-base`}
          >
            <MdOutlineDoNotDisturb className="inline-block text-xl align-text-bottom me-1" />
            <span>
              <span className="">This message was deleted</span>
              <div className="text-xs text-gray-500 mt-1 text-right">
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </span>
          </div>
        )}
        {!message?.deleted && message?.messageType === "text" && (
          <div className="">
            <div
              className={`${
                isOwnMessage
                  ? "bg-[#8417ff]/25 text-white/80 border-[#8417ff]/50"
                  : "bg-[#2e2b33]/5 text-white/80 border-[#ffffff]/20"
              } relative border inline-block p-2 sm:p-3 rounded  max-w-[85%] sm:max-w-[75%] md:max-w-[60%] lg:max-w-[50%] break-all overflow-wrap-anywhere hyphens-auto text-sm sm:text-base`}
            >
              {message?.content}
              {canDelete && <DeleteMessageDialog message={message} />}
              <div className="text-xs text-gray-600 mt-1 text-right">
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        )}
        {!message?.deleted && message?.messageType === "file" && (
          <div
            className={`${
              isOwnMessage
                ? "bg-[#8417ff]/25 text-white/80 border-[#8417ff]/50"
                : "bg-[#2e2b33]/5 text-white/80 border-[#ffffff]/20"
            } relative border inline-block p-2 sm:p-3 rounded max-w-[85%] sm:max-w-[75%] md:max-w-[60%] lg:max-w-[50%] `}
          >
            {checkIfImage(message?.file?.url) ? (
              <div
                className="cursor-pointer"
                onClick={() => {
                  setShowImage(true);
                  setImage(message?.file);
                }}
              >
                <img
                  src={message?.file?.url || "/placeholder.svg"}
                  alt={message?.file?.fileName}
                  className="max-w-full h-auto max-h-50 sm:max-h-64 md:max-h-80 rounded"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "block";
                  }}
                />
                <div style={{ display: "none" }} className="text-center p-4">
                  <MdDescription className="text-4xl mx-auto mb-2" />
                  <p className="text-sm">Image failed to load</p>
                </div>
              </div>
            ) : (
              <div className="text-start min-w-0 w-full">
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xl sm:text-2xl md:text-3xl flex-shrink-0">
                      {getFileIcon(
                        message?.file?.fileName,
                        message?.file?.fileType
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs sm:text-sm break-all">
                        {message?.file?.fileName}
                      </div>
                      {message?.file?.size && (
                        <div className="text-xs opacity-80">
                          {formatFileSize(message?.file?.size)}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    className={`text-sm sm:text-lg p-1.5 sm:p-2 rounded-full transition-colors flex-shrink-0 ${
                      downloadingFiles.has(message?.file?.url?.trim())
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-gray-600 hover:bg-gray-700 cursor-pointer"
                    }`}
                    onClick={() => handleFileDownload(message?.file)}
                    disabled={downloadingFiles.has(message?.file?.url?.trim())}
                    title={
                      downloadingFiles.has(message?.file?.url?.trim())
                        ? "Downloading..."
                        : "Download file"
                    }
                  >
                    {downloadingFiles.has(message?.file?.url?.trim()) ? (
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <MdDownload className="text-white" />
                    )}
                  </button>
                </div>
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1 text-right">
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            {canDelete && <DeleteMessageDialog message={message} />}
          </div>
        )}
      </div>
    );
  };

  const renderGroupMessages = (message, messageIndex, messagesInGroup) => {
    const isOwnMessage = message.sender._id === userInfo.id;
    const againSameSender =
      messageIndex > 0 &&
      message?.sender?._id === messagesInGroup[messageIndex - 1]?.sender?._id;
    const isAdmin = selectedChatData.admin === userInfo.id;
    const canDelete = isOwnMessage || isAdmin;

    return (
      <div
        className={`${isOwnMessage ? "text-right" : "text-left"} group ${
          againSameSender ? "mt-1" : "mt-3"
        }`}
      >
        {!isOwnMessage && !againSameSender && (
          <div
            className={`flex items-end gap-1 sm:gap-2 mb-2 cursor-pointer`}
            onClick={() => {
              setDm(message.sender);
              setOpenDMDialog(true);
            }}
          >
            <Avatar className="h-6 w-6 rounded-full overflow-hidden flex-shrink-0">
              {message?.sender?.image?.url ? (
                <AvatarImage
                  src={message?.sender?.image?.url || "/placeholder.svg"}
                  alt="profile"
                  className={"object-cover w-full h-full bg-black"}
                  loading="lazy"
                />
              ) : (
                <div
                  className={`uppercase h-6 w-6 text-xs border flex justify-center items-center rounded-full ${getColor(
                    message?.sender?.color
                  )}`}
                >
                  {message?.sender?.firstName && message?.sender?.lastName
                    ? message?.sender?.firstName
                        .trim()
                        .charAt(0)
                        .toUpperCase() +
                      message?.sender?.lastName.trim().charAt(0).toUpperCase()
                    : message?.sender?.email?.split("").shift()}
                </div>
              )}
            </Avatar>
            <span className="text-xs sm:text-sm text-gray-400">
              ~{`${message.sender.firstName} ${message.sender.lastName}`}
            </span>
            {message.sender.verified && (
              <span>
                <GoVerified />
              </span>
            )}
          </div>
        )}

        {message?.deleted && (
          <div
            className={`${
              isOwnMessage
                ? "bg-[#8417ff]/25 text-white/80 border-[#8417ff]/50"
                : "bg-[#2e2b33]/5 text-white/80 border-[#ffffff]/20"
            } relative border inline-block p-2 sm:p-3 italic rounded  max-w-[85%] sm:max-w-[75%] md:max-w-[60%] lg:max-w-[50%] break-words text-sm sm:text-base`}
          >
            <MdOutlineDoNotDisturb className="inline-block text-xl align-text-bottom me-1" />
            {isOwnMessage ? (
              <span>
                <span className="">You deleted this message</span>
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </span>
            ) : (
              <span>
                <span className="">This message was deleted</span>
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </span>
            )}
          </div>
        )}
        {!message?.deleted && message?.messageType === "text" && (
          <div className="">
            <div
              className={`${
                isOwnMessage
                  ? "bg-[#8417ff]/25 text-white/80 border-[#8417ff]/50"
                  : "bg-[#2e2b33]/5 text-white/80 border-[#ffffff]/20"
              } relative border inline-block p-2 sm:p-3 rounded  max-w-[85%] sm:max-w-[75%] md:max-w-[60%] lg:max-w-[50%] break-all overflow-wrap-anywhere hyphens-auto text-sm sm:text-base`}
            >
              {message?.content}
              {canDelete && <DeleteMessageDialog message={message} />}
              <div className="text-xs text-gray-500 mt-1 text-right">
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        )}
        {!message?.deleted && message?.messageType === "file" && (
          <div
            className={`${
              isOwnMessage
                ? "bg-[#8417ff]/25 text-white/80 border-[#8417ff]/50"
                : "bg-[#2e2b33]/5 text-white/80 border-[#ffffff]/20"
            } relative border inline-block p-2 sm:p-3 rounded  max-w-[85%] sm:max-w-[75%] md:max-w-[60%] lg:max-w-[50%] break-words`}
          >
            {checkIfImage(message?.file?.url) ? (
              <div
                className="cursor-pointer"
                onClick={() => {
                  setShowImage(true);
                  setImage(message?.file);
                }}
              >
                <img
                  src={message?.file?.url || "/placeholder.svg"}
                  alt={message?.file?.fileName}
                  className="max-w-full h-auto max-h-48 sm:max-h-64 md:max-h-80 rounded break-words"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "block";
                  }}
                />
                <div style={{ display: "none" }} className="text-center p-4">
                  <MdDescription className="text-4xl mx-auto mb-2" />
                  <p className="text-sm">Image failed to load</p>
                </div>
              </div>
            ) : (
              <div className="text-start min-w-0 w-full">
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xl sm:text-2xl md:text-3xl flex-shrink-0">
                      {getFileIcon(
                        message?.file?.fileName,
                        message?.file?.fileType
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs sm:text-sm break-all">
                        {message?.file?.fileName}
                      </div>
                      {message?.file?.size && (
                        <div className="text-xs opacity-80">
                          {formatFileSize(message?.file?.size)}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    className={`text-sm sm:text-lg p-1.5 sm:p-2 rounded-full transition-colors flex-shrink-0 ${
                      downloadingFiles.has(message?.file?.url?.trim())
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-gray-600 hover:bg-gray-700 cursor-pointer"
                    }`}
                    onClick={() => handleFileDownload(message?.file)}
                    disabled={downloadingFiles.has(message?.file?.url?.trim())}
                    title={
                      downloadingFiles.has(message?.file?.url?.trim())
                        ? "Downloading..."
                        : "Download file"
                    }
                  >
                    {downloadingFiles.has(message?.file?.url?.trim()) ? (
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <MdDownload className="text-white" />
                    )}
                  </button>
                </div>
              </div>
            )}
            {canDelete && <DeleteMessageDialog message={message} />}
            <div className="text-xs text-gray-500 mt-1 text-right">
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto scrollbar-dark p-2 sm:p-4 md:px-6 lg:px-8 w-full"
    >
      {renderMessages()}
      <div ref={scrollRef} />
      {showImage && (
        <div className="fixed z-[1000] top-0 left-0 h-[100vh] w-[100vw] flex items-center justify-center backdrop-blur-lg flex-col p-4">
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={image.url || "/placeholder.svg"}
              alt={image.fileName}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          <div className="absolute top-4 right-4 flex gap-2 sm:gap-3">
            <button
              className={`text-sm sm:text-lg p-2 sm:p-3 rounded-full transition-colors flex-shrink-0 ${
                downloadingFiles.has(image?.url?.trim())
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-gray-600 hover:bg-gray-700 cursor-pointer"
              }`}
              onClick={() => handleFileDownload(image)}
              disabled={downloadingFiles.has(image?.url?.trim())}
              title={
                downloadingFiles.has(image?.url?.trim())
                  ? "Downloading..."
                  : "Download file"
              }
            >
              {downloadingFiles.has(image?.url?.trim()) ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <MdDownload className="text-white" />
              )}
            </button>
            <button
              className="text-sm sm:text-lg p-2 sm:p-3 rounded-full transition-colors flex-shrink-0 bg-gray-600 hover:bg-gray-700 cursor-pointer"
              onClick={() => {
                setShowImage(false);
                setImage({});
              }}
              title="Close"
            >
              <MdClose className="text-white" />
            </button>
          </div>

          <div className="absolute bottom-4 left-4 right-4 bg-black/50 rounded-lg p-2 sm:p-3">
            <p className="text-white text-sm sm:text-base text-center truncate">
              {image.fileName}
            </p>
          </div>
        </div>
      )}
      <AlertDialog open={openDMDialog} onOpenChange={setOpenDMDialog}>
        <AlertDialogContent className="bg-[#181920] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Direct Messaging</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to DM {`${dm?.firstName} ${dm?.lastName}`} ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#181920] hover:bg-gray-800 hover:text-white cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-purple-800 hover:bg-purple-500 cursor-pointer"
              onClick={handleDM}
            >
              Direct Message
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MessageContainer;
