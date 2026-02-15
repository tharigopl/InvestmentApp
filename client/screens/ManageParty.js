import { useContext, useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import PartyForm from '../components/ManageParty/PartyForm';
import ErrorOverlay from '../components/ui/ErrorOverlay';
import IconButton from '../components/ui/IconButton';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import { GlobalStyles } from '../constants/styles';
import { PartiesContext } from '../store/parties-context';
import { storeParty, updateParty, deleteParty } from '../util/http';
import { AuthContext } from '../store/auth-context';

function ManageParty({ route, navigation }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState();

  const partiesCtx = useContext(PartiesContext);

  const authCtx = useContext(AuthContext);
    const token = authCtx.token;
  
  const editedPartyId = route.params?.partyId;
  const isEditing = !!editedPartyId;

  const selectedParty = partiesCtx.parties.find(
    (party) => party.id === editedPartyId
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Party' : 'Add Party',
    });
  }, [navigation, isEditing]);

  async function deletePartyHandler() {
    setIsSubmitting(true);
    try {
      await deleteParty(editedPartyId, token);
      partiesCtx.deleteParty(editedPartyId);
      navigation.goBack();
    } catch (error) {
      setError('Could not delete party - please try again later!');
      setIsSubmitting(false);
    }
  }

  function cancelHandler() {
    navigation.goBack();
  }

  async function confirmHandler(partyData) {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        partiesCtx.updateParty(editedPartyId, partyData);
        await updateParty(editedPartyId, partyData, token);
      } else {
        const id = await storeParty(partyData, token);
        partiesCtx.addParty({ ...partyData, id: id });
      }
      navigation.goBack();
    } catch (error) {
      setError('Could not save data - please try again later!');
      setIsSubmitting(false);
    }
  }

  if (error && !isSubmitting) {
    return <ErrorOverlay message={error} />;
  }

  if (isSubmitting) {
    return <LoadingOverlay />;
  }

  return (
    <View style={styles.container}>
      <PartyForm
        submitButtonLabel={isEditing ? 'Update' : 'Add'}
        onSubmit={confirmHandler}
        onCancel={cancelHandler}
        defaultValues={selectedParty}
      />
      {isEditing && (
        <View style={styles.deleteContainer}>
          <IconButton
            icon="trash"
            color={GlobalStyles.colors.error500}
            size={36}
            onPress={deletePartyHandler}
          />
        </View>
      )}
    </View>
  );
}

export default ManageParty;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: GlobalStyles.colors.primary800,
  },
  deleteContainer: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: GlobalStyles.colors.primary200,
    alignItems: 'center',
  },
});
