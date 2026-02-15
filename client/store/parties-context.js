import { createContext, useReducer } from 'react';

export const PartiesContext = createContext({
  parties: [],
  addParty: ({ description, location, date }) => {},
  setParties: (parties) => {},
  deleteParty: (id) => {},
  updateParty: (id, { description, location, date }) => {},
});

function partiesReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return [action.payload, ...state];
    case 'SET':
      const inverted = action.payload.reverse();
      return inverted;
    case 'UPDATE':
      const updatablePartyIndex = state.findIndex(
        (party) => party.id === action.payload.id
      );
      const updatableParty = state[updatablePartyIndex];
      const updatedItem = { ...updatableParty, ...action.payload.data };
      const updatedParties = [...state];
      updatedParties[updatablePartyIndex] = updatedItem;
      return updatedParties;
    case 'DELETE':
      return state.filter((party) => party.id !== action.payload);
    default:
      return state;
  }
}

function PartiesContextProvider({ children }) {
  const [partiesState, dispatch] = useReducer(partiesReducer, []);

  function addParty(partyData) {
    dispatch({ type: 'ADD', payload: partyData });
  }

  function setParties(parties) {
    dispatch({ type: 'SET', payload: parties });
  }

  function deleteParty(id) {
    dispatch({ type: 'DELETE', payload: id });
  }

  function updateParty(id, partyData) {
    dispatch({ type: 'UPDATE', payload: { id: id, data: partyData } });
  }

  const value = {
    parties: partiesState,
    setParties: setParties,
    addParty: addParty,
    deleteParty: deleteParty,
    updateParty: updateParty,
  };

  return (
    <PartiesContext.Provider value={value}>
      {children}
    </PartiesContext.Provider>
  );
}

export default PartiesContextProvider;
