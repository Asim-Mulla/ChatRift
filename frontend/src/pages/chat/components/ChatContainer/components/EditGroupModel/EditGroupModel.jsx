import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import MultipleSelector from "@/components/ui/MultipleSelect";
import { editGroupMembers, editGroupName } from "@/services/groupServices";
import { getContactsForGroup } from "@/services/userServices";
import { useAppStore } from "@/store/store";
import { isEqual, sortBy } from "lodash";
import React, { useEffect, useState } from "react";
import { MdEdit } from "react-icons/md";
import { toast } from "sonner";
import DeleteGroupDialog from "./DeleteGroupModel";
import { useSocket } from "@/Context/SocketContext";

const EditGroupModel = () => {
  const { selectedChatData, updateGroup } = useAppStore();
  const socket = useSocket();
  const [openEditGroupModal, setOpenEditGroupModal] = useState(false);
  const [allContacts, setAllContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [originalContacts, setOriginalContacts] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [originalGroupName, setOriginalGroupName] = useState("");
  const [isEdited, setIsEdited] = useState(false);

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

  const handleEditGroup = async () => {
    if (!groupName) {
      return toast.error("Group name is required.");
    }

    const groupNameChanged = groupName.trim() !== originalGroupName;

    const sortedSelectedContacts = sortBy(selectedContacts, ["value"]);
    const sortedOriginalContacts = sortBy(originalContacts, ["value"]);

    const groupMembersNotChanged = isEqual(
      sortedSelectedContacts,
      sortedOriginalContacts
    );

    // Nothing changed
    if (!groupNameChanged && groupMembersNotChanged) {
      setGroupName("");
      setOriginalGroupName("");
      setSelectedContacts([]);
      setOriginalContacts([]);
      setOpenEditGroupModal(false);
      return;
    }

    try {
      if (groupNameChanged && groupMembersNotChanged) {
        await toast.promise(editGroupName(groupName, originalGroupName), {
          loading: "Changing group name...",
          success: (res) => {
            if (res.status === 201) {
              const group = res.data.group;
              updateGroup(group);

              setGroupName("");
              setOriginalGroupName("");
              setSelectedContacts([]);
              setOriginalContacts([]);
              setOpenEditGroupModal(false);

              if (socket) {
                socket.emit("changedGroupName", group);
              }

              return "Group name changed.";
            } else {
              throw new Error("Unexpected response");
            }
          },
          error: (err) => {
            console.error(err);
            return err?.response?.data || "Failed to update group name";
          },
        });
      } else {
        const members = selectedContacts?.map((contact) => contact.value);

        await toast.promise(
          editGroupMembers(groupName, originalGroupName, members),
          {
            loading: "Updating group members...",
            success: (res) => {
              if (res.status === 201) {
                const group = res.data.group;
                const removedMembers = res.data.removedMembers;
                updateGroup(group);

                setGroupName("");
                setOriginalGroupName("");
                setSelectedContacts([]);
                setOriginalContacts([]);
                setOpenEditGroupModal(false);

                if (socket) {
                  socket.emit("changedGroupMembers", { group, removedMembers });
                }

                return "Group members updated.";
              } else {
                throw new Error("Unexpected response");
              }
            },
            error: (err) => {
              console.error(err);
              return err?.response?.data || "Failed to update group members";
            },
          }
        );
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data || "Something went wrong!");
    }
  };

  const changeGroupMembersToLabel = () => {
    const labelledContacts = selectedChatData?.members?.map((contact) => {
      return {
        label: `${contact?.firstName} ${contact?.lastName}`,
        value: contact?._id,
        verified: contact.verified,
      };
    });
    setSelectedContacts(labelledContacts);
    setOriginalContacts(labelledContacts);
  };

  const copyGroupName = () => {
    setGroupName(selectedChatData?.name);
    setOriginalGroupName(selectedChatData?.name);
  };

  useEffect(() => {
    const groupNameChanged = groupName.trim() !== originalGroupName;
    const sortedSelectedContacts = sortBy(selectedContacts, ["value"]);
    const sortedOriginalContacts = sortBy(originalContacts, ["value"]);

    const groupMembersNotChanged = isEqual(
      sortedSelectedContacts,
      sortedOriginalContacts
    );
    if (groupNameChanged || !groupMembersNotChanged) {
      setIsEdited(true);
    } else {
      setIsEdited(false);
    }
  }, [groupName, selectedContacts]);

  return (
    <div>
      <MdEdit
        className="text-neutral-400 text-xl focus:border-none focus:outline-none focus:text-white duration-300 transition-all cursor-pointer"
        onClick={() => {
          setOpenEditGroupModal(true);
          handleGetContactsForGroup();
          changeGroupMembersToLabel();
          copyGroupName();
        }}
      />
      <Dialog open={openEditGroupModal} onOpenChange={setOpenEditGroupModal}>
        <DialogContent className="bg-[#181920] border-none text-white w-[400px] h-[400px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Editing Group</DialogTitle>
          </DialogHeader>
          <DialogDescription>Enter group name</DialogDescription>
          <div>
            <Input
              placeholder="Group name"
              className="rounded-lg p-4 bg-[#2c2e3b] border-none"
              onChange={(e) => setGroupName(e.target.value)}
              value={groupName}
            />
          </div>
          <DialogDescription>Search and select group members</DialogDescription>
          {allContacts.length && (
            <MultipleSelector
              className="rounded-lg bg-[#2c2e3b] border-none py-2 text-white"
              defaultOptions={allContacts}
              placeholder="Search here"
              value={selectedContacts}
              onChange={setSelectedContacts}
              emptyIndicator={
                <p className="text-center text-lg leading-10 text-gray-600">
                  No contacts found!
                </p>
              }
            />
          )}

          <div className="flex flex-col h-full items-center justify-between">
            <div className="w-full">
              <Button
                className="w-full bg-purple-700 hover:bg-purple-900 transition-all duration-300 cursor-pointer"
                onClick={handleEditGroup}
              >
                {isEdited ? "Save Changes" : "Cancel"}
              </Button>
            </div>
            <div className="w-full">
              <DeleteGroupDialog />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditGroupModel;
