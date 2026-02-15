import React, { createContext, useReducer, useContext } from 'react';
import { io } from 'socket.io-client';

const MessageContext = createContext();

const messageReducer = (state, action) => {
  switch (action.type) {
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload,
        loading: false
      };
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
    
    case 'UPDATE_REACTION':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg._id === action.payload.messageId
            ? { ...msg, reactions: action.payload.reactions }
            : msg
        )
      };
    
    default:
      return state;
  }
};

export function MessageProvider({ children, eventId, token }) {
  const [state, dispatch] = useReducer(messageReducer, {
    messages: [],
    loading: true,
    socket: null
  });
  
  useEffect(() => {
    // Connect to socket
    const socket = io(process.env.BACKEND_URL, {
      auth: { token }
    });
    
    socket.emit('join-event', eventId);
    
    socket.on('new-message', (message) => {
      dispatch({ type: 'ADD_MESSAGE', payload: message });
    });
    
    socket.on('reaction-update', (data) => {
      dispatch({ type: 'UPDATE_REACTION', payload: data });
    });
    
    return () => {
      socket.emit('leave-event', eventId);
      socket.disconnect();
    };
  }, [eventId, token]);
  
  return (
    <MessageContext.Provider value={{ state, dispatch }}>
      {children}
    </MessageContext.Provider>
  );
}

export const useMessages = () => useContext(MessageContext);