import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import MultipleSelector from "@/components/ui/MultipleSelect";
import { useSocket } from "@/Context/SocketContext";
import { createGroup } from "@/services/groupServices";
import { getContactsForGroup } from "@/services/userServices";
import { useAppStore } from "@/store/store";
import React, { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { toast } from "sonner";

const NewGroup = () => {
  const { addGroup } = useAppStore();
  const socket = useSocket();
  const [openNewGroupModal, setOpenNewGroupModal] = useState(false);
  const [allContacts, setAllContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [groupName, setGroupName] = useState("");

  const handleGetContactsForGroup = async () => {
    try {
      const res = await getContactsForGroup();
      if (res.status === 200) {
        setAllContacts(res.data.contacts);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName) {
      return toast.error("Group name is required.");
    }

    if (selectedContacts.length === 0) {
      return toast.error("Please select at least one member.");
    }

    try {
      const members = selectedContacts.map((contact) => contact.value);

      await toast.promise(createGroup(groupName, members), {
        loading: "Creating group...",
        success: (res) => {
          if (res.status === 201) {
            const group = res.data.group;
            addGroup(group);

            setGroupName("");
            setSelectedContacts([]);
            setOpenNewGroupModal(false);

            if (socket) {
              socket.emit("groupCreated", group);
            }

            return "Group created successfully.";
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
      console.error(error);
      toast.error(error?.response?.data || "Something went wrong!");
    }
  };

  return (
    <div>
      <FaPlus
        className="text-neutral-400 font-light text-sm text-opacity-90 text-start hover:text-neutral-100 cursor-pointer transition-all duration-300"
        onClick={() => {
          setOpenNewGroupModal(true);
          handleGetContactsForGroup();
        }}
      />
      <Dialog open={openNewGroupModal} onOpenChange={setOpenNewGroupModal}>
        <DialogContent className="bg-[#181920] border-none text-white w-[400px] h-[400px] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold text-white">
              Creating New Group
            </DialogTitle>
            {/* <DialogDescription>Please select a contact.</DialogDescription> */}
          </DialogHeader>
          <div>
            <Input
              placeholder="Group name"
              className="rounded-lg p-4 bg-[#2c2e3b] border-none"
              onChange={(e) => setGroupName(e.target.value)}
              value={groupName}
            />
          </div>
          <div className="flex-1 flex flex-col items-center justify-between">
            {allContacts.length && (
              <MultipleSelector
                className="rounded-lg bg-[#2c2e3b] border-none py-2 text-white"
                defaultOptions={allContacts}
                placeholder="Search and select members"
                value={selectedContacts}
                onChange={setSelectedContacts}
                emptyIndicator={
                  <p className="text-center text-lg leading-10 text-gray-600">
                    No contacts found!
                  </p>
                }
              />
            )}

            <div>
              <Button
                className="w-full bg-purple-700 hover:bg-purple-900 transition-all duration-300"
                onClick={handleCreateGroup}
              >
                Create Group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewGroup;
