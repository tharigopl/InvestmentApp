import { FlatList } from 'react-native';

import PartyItem from './PartyItem';

function renderPartyItem(itemData) {
  return <PartyItem {...itemData.item} />;
}

function PartiesList({ parties }) {
  return (
    <FlatList
      data={parties}
      renderItem={renderPartyItem}
      keyExtractor={(item) => item.id}
    />
  );
}

export default PartiesList;
