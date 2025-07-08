import { useEffect, useState, useRef, useCallback } from "react";
import NewContact from "./components/NewContact/NewContact";
import { getDMContacts } from "@/services/userServices";
import { useAppStore } from "@/store/store";
import ContactList from "@/components/ui/contact-list";
import NewGroup from "./components/NewGroup/NewGroup";
import { getGroups } from "@/services/groupServices";
import { useSocket } from "@/Context/SocketContext";
import ProfileInfo from "./components/ProfileInfo/ProfileInfo";
import { ChevronDown, ChevronRight } from "lucide-react";

const ContactsContainer = () => {
  const socket = useSocket();
  const { setDMContacts, DMContacts, groups, setGroups } = useAppStore();
  const [DMTypingMap, setDMTypingMap] = useState({});
  const [GMTypingMap, setGMTypingMap] = useState({});
  const [contactsExpanded, setContactsExpanded] = useState(true);
  const [groupsExpanded, setGroupsExpanded] = useState(true);

  const dmTimeoutsRef = useRef({});
  const gmTimeoutsRef = useRef({});

  const handleDMTypingTimeout = useCallback((userId) => {
    setDMTypingMap((prev) => ({
      ...prev,
      [userId]: false,
    }));
    delete dmTimeoutsRef.current[userId];
  }, []);

  const handleGMTypingTimeout = useCallback((groupId) => {
    setGMTypingMap((prev) => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        typing: false,
      },
    }));
    delete gmTimeoutsRef.current[groupId];
  }, []);

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.on("otherPersonTypingInDM", ({ from, to, isTyping }) => {
      if (isTyping) {
        setDMTypingMap((prev) => ({ ...prev, [from]: true }));

        if (dmTimeoutsRef.current[from]) {
          clearTimeout(dmTimeoutsRef.current[from]);
        }

        dmTimeoutsRef.current[from] = setTimeout(() => {
          handleDMTypingTimeout(from);
        }, 2000);
      } else {
        setDMTypingMap((prev) => ({ ...prev, [from]: false }));

        if (dmTimeoutsRef.current[from]) {
          clearTimeout(dmTimeoutsRef.current[from]);
          delete dmTimeoutsRef.current[from];
        }
      }
    });

    socket.on("personTypingInGroup", (typingData) => {
      const { typer, typing, in: typingIn } = typingData;
      const groupId = typingIn._id;

      if (typing) {
        setGMTypingMap((prev) => ({
          ...prev,
          [groupId]: {
            typing: true,
            typer: `${typer.firstName} ${typer.lastName}`,
          },
        }));

        if (gmTimeoutsRef.current[groupId]) {
          clearTimeout(gmTimeoutsRef.current[groupId]);
        }

        gmTimeoutsRef.current[groupId] = setTimeout(() => {
          handleGMTypingTimeout(groupId);
        }, 2000);
      } else {
        setGMTypingMap((prev) => ({
          ...prev,
          [groupId]: {
            typing: false,
            typer: `${typer.firstName} ${typer.lastName}`,
          },
        }));

        if (gmTimeoutsRef.current[groupId]) {
          clearTimeout(gmTimeoutsRef.current[groupId]);
          delete gmTimeoutsRef.current[groupId];
        }
      }
    });

    return () => {
      socket.off("otherPersonTypingInDM");
      socket.off("personTypingInGroup");

      Object.values(dmTimeoutsRef.current).forEach(clearTimeout);
      Object.values(gmTimeoutsRef.current).forEach(clearTimeout);
      dmTimeoutsRef.current = {};
      gmTimeoutsRef.current = {};
    };
  }, [socket, handleDMTypingTimeout, handleGMTypingTimeout]);

  const getUserGroups = async () => {
    try {
      const res = await getGroups();
      if (res.status === 201) {
        setGroups(res.data.groups);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getContacts = async () => {
    try {
      const res = await getDMContacts();
      if (res.status === 200) {
        setDMContacts(res.data.contacts);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getContacts();
    getUserGroups();
  }, []);

  return (
    <div className="md:w-[35vw] lg:w-[30vw] xl:w-[25vw] bg-[#1b1c24] border-r-2 border-[#2f303b] w-full h-full flex flex-col">
      <div className="pt-3 flex-shrink-0">
        <Logo />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-dark flex flex-col min-h-0 py-4">
        <div className="flex-shrink-0">
          <div
            className="flex items-center justify-between pr-10 p-5 cursor-pointer hover:bg-[#f1f1f111] transition-colors duration-200"
            onClick={() => setContactsExpanded(!contactsExpanded)}
          >
            <div className="flex items-center gap-2">
              {contactsExpanded ? (
                <ChevronDown className="text-sm text-neutral-400" />
              ) : (
                <ChevronRight className="text-sm text-neutral-400" />
              )}
              <Title text="Contacts" />
            </div>
            <NewContact />
          </div>
          {contactsExpanded && (
            <div className="max-h-[40vh] overflow-y-auto scrollbar-dark transition-all duration-300">
              <ContactList contacts={DMContacts} DMTypingMap={DMTypingMap} />
            </div>
          )}
        </div>

        <div className="border-t-2 border-[#2f303b] my-2 flex-shrink-0"></div>

        <div className="flex-shrink-0">
          <div
            className="flex items-center justify-between pr-10 p-5 cursor-pointer hover:bg-[#f1f1f111] transition-colors duration-200"
            onClick={() => setGroupsExpanded(!groupsExpanded)}
          >
            <div className="flex items-center gap-2">
              {groupsExpanded ? (
                <ChevronDown className="text-sm text-neutral-400" />
              ) : (
                <ChevronRight className="text-sm text-neutral-400" />
              )}
              <Title text="Groups" />
            </div>
            <NewGroup />
          </div>
          {groupsExpanded && (
            <div className="max-h-[40vh] overflow-y-auto scrollbar-dark transition-all duration-300">
              <ContactList
                contacts={groups}
                isGroup={true}
                GMTypingMap={GMTypingMap}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex-shrink-0">
        <ProfileInfo />
      </div>
    </div>
  );
};

const Logo = () => {
  return (
    <div className="flex p-1 mx-3 my-1 sm:my-2 sm:mx-4 bg-[#8417ff]/50 justify-center items-center gap-2 rounded-full">
      <img
        src="/chatrift-logo.png"
        className="h-10 w-10 sm:h-14 sm:w-14"
        alt="ChatRift Logo"
      />
      <span className="text-2xl font-semibold ">ChatRift</span>
    </div>
  );
};

const Title = ({ text }) => {
  return (
    <h6 className="uppercase tracking-widest text-neutral-400 pl-10 font-medium text-opacity-90 text-sm">
      {text}
    </h6>
  );
};

export default ContactsContainer;
