import React, { useState, useEffect, useContext, useRef } from "react";
import { UserContext } from "../context/user.context";
import { useLocation } from "react-router-dom";
import axiosInstance from "../config/axios"; // Import the Axios instance
import { initializeSocket, sendMessage, recieveMessage } from "../config/socket";
import Markdown from "markdown-to-jsx"; // Import the markdown-to-jsx library


const Project = () => {
  const location = useLocation();
  const [isSidepanelOpen, setisSidepanelOpen] = useState(false);
  const { user } = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [project, setProject] = useState(location.state?.project || {});
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messageBox = React.createRef();

  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(new Set()) 

  const [fileTree, setFileTree] = useState({});

  const [currentFile, setCurrentFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);

  const [webContainer, setWebContainer] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(null);

  const [runProcess, setRunProcess] = useState(null);


  function SyntaxHighlightedCode(props) {
    const ref = useRef(null);

    React.useEffect(() => {
      if (ref.current && props.className?.includes("lang-") && window.hljs) {
        window.hljs.highlightElement(ref.current);

        // hljs won't reprocess the element unless this attribute is removed
        ref.current.removeAttribute("data-highlighted");
      }
    }, [props.className, props.children]);

    return <code {...props} ref={ref} />;
  }

  useEffect(() => {
    // Fetch all users from the backend

    initializeSocket(project._id);

    recieveMessage("project-message", data => {
      setMessages((prevMessages) => [...prevMessages, data]);
      console.log(data);
    });

    axiosInstance
      .get(`/projects/get-project/${location.state.project._id}`)
      .then((res) => {
        console.log(res.data);
        console.log(res.data.project);
        setProject(res.data.project); // Ensure state is updated correctly
      })
      .catch((error) => {
        console.error("Error fetching project:", error);
      });


    axiosInstance
      .get("/users/all")
      .then((response) => {
        setUsers(response.data.users);
      })
      .catch((error) => {
        console.error("There was an error fetching the users!", error);
      });
  }, []);

    

    const handleUserClick = (id) => {
        setSelectedUserId(prevSelectedUserId => {
            const newSelectedUserId = new Set(prevSelectedUserId);
            if (newSelectedUserId.has(id)) {
                newSelectedUserId.delete(id);
            } else {
                newSelectedUserId.add(id);
            }

            return newSelectedUserId;
        });


    }

 function addCollaborators() {
   axiosInstance
     .put("/projects/add-users", {
       projectId: location.state.project._id,
       users: Array.from(selectedUserId),
     })
     .then((res) => {
       console.log(res.data);
       setIsModalOpen(false);
     })
     .catch((err) => {
       console.log(err);
     });
  }
  
  const send = () => {
    sendMessage("project-message", {
      message,
      sender: user,
    });
    setMessages((prevMessages) => [...prevMessages, { sender: user, message }]); // Update messages state
    console.log(messages);
    setMessage("");
  };


  function WriteAiMessage(message) {
    console.log("AI message:", message)

        const messageObject = JSON.parse(message)

        return (
            <div
                className='overflow-auto bg-slate-950 text-white rounded-sm p-2'
            >
                <Markdown
                    children={messageObject.text}
                    options={{
                        overrides: {
                            code: SyntaxHighlightedCode,
                        },
                    }}
                />
            </div>)
    }

  return (
    <main className="w-screen h-screen flex">
      <section className="left h-screen w-80 bg-zinc-200 flex flex-col relative">
        <header className="bg-zinc-300 p-4 flex items-center justify-between">
          <button
            onClick={() => setIsModalOpen(true)}
            className="hover:bg-zinc-400 py-1 px-2 rounded-lg font-semibold flex items-center gap-1"
          >
            <i className="ri-add-fill"></i>
            <p>Add Collaborators</p>
          </button>
          <button
            onClick={() => {
              setisSidepanelOpen(!isSidepanelOpen);
            }}
            className="hover:text-zinc-100"
          >
            <i className="ri-group-fill"></i>
          </button>
        </header>
        <div className="conversation-area flex-grow overflow-y-auto relative">
          <div
            ref={messageBox}
            className="message-box p-1 flex-grow flex flex-col gap-1 overflow-auto max-h-full scrollbar-hide"
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`${
                  msg.sender._id === "ai" ? "max-w-80" : "max-w-52"
                } ${
                  msg.sender._id == user._id.toString() && "ml-auto"
                }  message flex flex-col p-2 bg-slate-50 w-fit rounded-md`}
              >
                <small className="opacity-65 text-xs">{msg.sender.email}</small>
                <div className="text-sm">
                  {msg.sender._id === "ai" ? (
                    WriteAiMessage(msg.message)
                  ) : (
                    <p>{msg.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="inputarea w-full flex h-14 bg-zinc-300 p-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full p-2 text-zinc-800 bg-zinc-300 focus:outline-none"
          />
          <button
            onClick={send}
            className="bg-zinc-300 px-3 rounded-lg hover:bg-zinc-400"
          >
            <i className="ri-send-plane-fill"></i>
          </button>
        </div>
        <div
          className={`sidepanel w-80 h-screen bg-zinc-200 absolute left-0 top-0 transition-transform transform ${
            isSidepanelOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <header className="bg-zinc-300 p-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Collaborators</h1>
            <button
              onClick={() => {
                setisSidepanelOpen(false);
              }}
              className="hover:text-zinc-100 hover:bg-zinc-300 p-1 rounded-full "
            >
              <i className="ri-close-fill text-xl"></i>
            </button>
          </header>
          {/* Sidepanel content goes here */}
          <div className="users flex flex-col gap-2 p-1">
            {project?.users &&
              project.users.map((user) => {
                return (
                  <div className="user flex items-center gap-1.5 hover:bg-zinc-300 p-2 rounded-lg cursor-pointer">
                    <div className="aspect-square rounded-full px-3 py-2 bg-gray-600">
                      <i className="ri-user-fill text-zinc-100 text-xl"></i>
                    </div>
                    <h1 className="text-md font-semibold">{user.email}</h1>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      <section className="right h-screen w-4/5 bg-zinc-100 flex-grow flex overflow-y-auto">
        <div className="explorer w-72 h-full px-1 py-2 bg-zinc-400">
          <div className="filetree ">
            <div className="file-element flex items-center gap-2 p-1 bg-zinc-300 rounded-sm">
              <p className="font-semibold cursor-pointer p-2 text-sm">
                app.js
              </p>
            </div>
          </div>
        </div>
        <div className="code-editor">
          
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-zinc-200 p-4 rounded-md w-96 max-w-full relative">
            <header className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Select User</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2">
                <i className="ri-close-fill"></i>
              </button>
            </header>
            <div className="users-list flex flex-col gap-2 mb-16 max-h-96 overflow-auto">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`user cursor-pointer rounded-md hover:bg-zinc-300 ${
                    Array.from(selectedUserId).indexOf(user._id) != -1
                      ? "bg-slate-200"
                      : ""
                  } p-2 flex flex-w gap-2 items-center`}
                  onClick={() => handleUserClick(user._id)}
                >
                  <div className="aspect-square relative rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600">
                    <i className="ri-user-fill absolute"></i>
                  </div>
                  <div>
                    <h1 className="font-semibold text-lg w-full">
                      {user.email}
                    </h1>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addCollaborators}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Add Collaborators
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Project;
