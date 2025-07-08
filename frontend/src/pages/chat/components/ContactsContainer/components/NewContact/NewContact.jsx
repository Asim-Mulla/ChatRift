import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getColor } from "@/lib/utils";
import { getContacts } from "@/services/userServices";
import { useAppStore } from "@/store/store";
import React, { useState } from "react";
import { FaPlus } from "react-icons/fa";

const NewContact = () => {
  const { setSelectedChatType, setSelectedChatData } = useAppStore();
  const [openNewContactModal, setOpenNewContactModal] = useState(false);
  const [searchedContacts, setSearchedContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const handleGetContacts = async () => {
    try {
      const res = await getContacts();
      if (res.status === 200) {
        setSearchedContacts(res.data.users);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleSelectNewContact = (contact) => {
    setOpenNewContactModal(false);
    setSelectedChatType("Contact");
    setSelectedChatData(contact);
  };

  return (
    <div>
      <FaPlus
        className="text-neutral-400 font-light text-sm text-opacity-90 text-start hover:text-neutral-100 cursor-pointer transition-all duration-300"
        onClick={() => {
          setOpenNewContactModal(true);
          handleGetContacts();
        }}
      />
      <Dialog open={openNewContactModal} onOpenChange={setOpenNewContactModal}>
        <DialogContent className="bg-[#181920] border-none text-white w-[400px] h-[400px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Please select a contact</DialogTitle>
          </DialogHeader>
          <div>
            <Input
              placeholder="Search contact"
              className="rounded-lg p-4 bg-[#2c2e3b] border-none"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm && (
            <ScrollArea className="h-[240px]">
              <div className="flex flex-col gap-1">
                {searchTerm &&
                  searchedContacts
                    ?.filter(
                      (contact) =>
                        contact?.firstName
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        contact?.lastName
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        contact?.email
                          ?.split("@")[0]
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())
                    )
                    .map((contact) => (
                      <div
                        key={contact._id}
                        className="flex items-center gap-3 cursor-pointer p-3 rounded-md hover:bg-[#2a2b33]"
                        onClick={() => handleSelectNewContact(contact)}
                      >
                        <div className="w-12 h-12 relative">
                          <Avatar className="h-12 w-12  rounded-full overflow-hidden">
                            {contact?.image?.url ? (
                              <AvatarImage
                                src={contact?.image?.url}
                                alt="profile"
                                className={
                                  "object-cover w-full h-full bg-black"
                                }
                                loading="lazy"
                              />
                            ) : (
                              <div
                                className={`uppercase h-12 w-12  text-lg border flex justify-center items-center rounded-full ${getColor(
                                  contact?.color
                                )}`}
                              >
                                {contact.firstName && contact.lastName
                                  ? contact.firstName
                                      .trim()
                                      .charAt(0)
                                      .toUpperCase() +
                                    contact.lastName
                                      .trim()
                                      .charAt(0)
                                      .toUpperCase()
                                  : contact.email.split("").shift()}
                              </div>
                            )}
                          </Avatar>
                        </div>
                        <div className="flex flex-col">
                          <span>
                            {contact.firstName && contact.lastName
                              ? `${contact.firstName} ${contact.lastName}`
                              : ""}
                          </span>
                          <span>{contact.email}</span>
                        </div>
                      </div>
                    ))}
              </div>
            </ScrollArea>
          )}
          {searchTerm?.length <= 0 && (
            <div className="flex-1 flex flex-col justify-center items-center  duration-1000 transition-all ">
              <div className="text-opacity-80 text-white flex flex-col gap-5 items-center mt-5 lg:text-xl text-md transition-all duration-300 text-center">
                <h3 className=" poppins-medium">
                  Search for a<span className="text-purple-500"> Contact</span>
                </h3>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewContact;
