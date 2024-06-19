import React, { useEffect, useState } from "react"; // Import useState

import NoteCard from "../../components/Cards/NoteCard";
import { MdAdd } from "react-icons/md";
import AddEditNotes from "./AddEditNotes";
import Modal from 'react-modal';
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import Navbar from "../../components/Navbar";
import Toast from "../../components/ToastMessage/Toast";
import EmptyCard from "../../components/EmptyCard/EmptyCard";
import AddNotesImg from '../../assets/images/add-note.svg'
import NoDataImg from '../../assets/images/no-data.svg'
import { BASE_URL } from "../../utils/constants";
const Home = () => {
  const [openAddEditModal, setOpenAddEditModal] = useState({
    isShown: false,
    type: "add",
    data: null,
  });

  const[showToastMsg,setShowToastMsg]=useState({
    isShown:false,
    message:'',
    type:'add'
  })

  const showToastMessage =(message,type)=>{
    setShowToastMsg({
      isShown:true,
      message,
      type,
    })
  }
  const handleCloseToast =()=>{
    setShowToastMsg({
      isShown:false,
      message:''
    })
  }
  const [allNotes,setAllNotes] = useState([])
  const [userInfo,setUserInfo] = useState(null);
  const[isSearch,setIsSearch] = useState(false);
  const navigate = useNavigate();
  const handleEdit = (noteDetails) =>{
    setOpenAddEditModal({
      isShown:true,
      data:noteDetails,
      type:'edit'
    });
  }

  const getUserInfo = async()=>{
    try{
      const response = await axiosInstance.get('https://scribble-backend-8ikx.onrender.com/get-user');
      if(response.data && response.data.user){
        setUserInfo(response.data.user)
      }
    }
    catch(error){
      if(error.response.status === 401){
        localStorage.clear();
        navigate('/login');
      }
    }
  };


  const getAllNotes = async()=>{
    try{
      const response = await axiosInstance.get('https://scribble-backend-8ikx.onrender.com/get-all-notes');
      if(response.data && response.data.notes){
        setAllNotes(response.data.notes);
      }
    }
    catch(error){
      console.log("An unexpected error occured. Please try again.")
    }
  }

  const deleteNote = async(data)=>{

    const noteId = data._id;
    try {
      const response = await axiosInstance.delete('https://scribble-backend-8ikx.onrender.com/delete-note/' + noteId);

      if (response.data && !response.data.error) {
        showToastMessage("Note Deleted Successfully",'delete');
        getAllNotes();
      }
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        console.log("An unexpected error occured. Please try again.")
      }
    }
  }

  const onSearchNote = async(query)=>{
    try{
      const response = await axiosInstance.get('https://scribble-backend-8ikx.onrender.com/search-notes',{
        params:{query},
      });
      if(response.data && response.data.notes){
        setIsSearch(true);
        setAllNotes(response.data.notes);
      }
    }
    catch(error){
      console.log(error);
    }
  }

  const updateIsPinned = async(noteData)=>{
    const noteId = noteData._id;
    try {
      const response = await axiosInstance.put('https://scribble-backend-8ikx.onrender.com/update-note-pinned/' + noteId, {
       isPinned: !noteId.isPinned
      });

      if (response.data && response.data.note) {
        showToastMessage("Note Pinned Successfully");
        getAllNotes();
        
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handleClearSearch = () =>{
    setIsSearch(false);
    getAllNotes();
  }

  useEffect(()=>{
    getAllNotes();
    getUserInfo();
    return ()=>{};
  },[])

  return (
    <>
      <Navbar userInfo={userInfo} onSearchNote = {onSearchNote} handleClearSearch={handleClearSearch} />
      
      <div className="container mx-auto">
        {allNotes.length>0?<div className="grid grid-cols-3 gap-4 mt-8">
          {allNotes.map((item,index)=>(
          <NoteCard
          key={item._id}
            title={item.title}
            date={item.createdOn}
            content={item.content}
            tags={item.tags}
            isPinned={item.isPinned}
            onEdit={() => handleEdit(item)}
            onDelete={() => deleteNote(item)}
            onPinNote={() => updateIsPinned(item)}
          />
          
        ))}
        </div>
      : <EmptyCard 
      imgSrc={isSearch ? NoDataImg : AddNotesImg} 
      message={isSearch ? `No note found` :  `Start creating your first note! Click the 'add' button to jot down your thoughts,ideas, and reminders. Let's get started!`
        
      } 
      />
      }
        </div>
          <button
            className="w-16 h-16 flex items-center justify-center rounded-2xl bg-primary hover:bg-blue-600 absolute right-10 bottom-10"
            onClick={() => setOpenAddEditModal({ isShown: true, type: "add", data: null })} // Updated onClick handler
          >
            <MdAdd className="text-[32px] text-white" />
          </button>
          <Modal
            isOpen={openAddEditModal.isShown} // Correctly formatted props
            onRequestClose={() => setOpenAddEditModal({ isShown: false, type: "add", data: null })} // Updated onRequestClose handler
            style={{
              overlay: {
                backgroundColor: "rgba(0,0,0,0.2)"
              },
            }}
            contentLabel="Add/Edit Note"
            className="w-[40%] max-h-3/4 bg-white rounded-md mx-auto mt-14 p-5 overflow-scroll"
          >
            <AddEditNotes 
            type={openAddEditModal.type}
            noteData={openAddEditModal.data}
              onClose={()=>{
                setOpenAddEditModal({isShown:false,type:"add",data:null});
              }}
              getAllNotes={getAllNotes}
              showToastMessage={showToastMessage}
            /> 
            
          </Modal>

          <Toast
            isShown={showToastMsg.isShown}
            message={showToastMsg.message}
            type={showToastMsg.type}
            onClose={handleCloseToast}
          />
        
    </>
  );
};

export default Home;
