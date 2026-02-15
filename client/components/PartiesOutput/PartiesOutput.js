import { StyleSheet, Text, View } from 'react-native';

import { GlobalStyles } from '../../constants/styles';
import PartiesList from './PartiesList';
import PartiesSummary from './PartiesSummary';

function PartiesOutput({ parties, partiesPeriod, fallbackText }) {
  let content = <Text style={styles.infoText}>{fallbackText}</Text>;

  if (parties.length > 0) {
    content = <PartiesList parties={parties} />;
  }

  return (
    <View style={styles.container}>
      <PartiesSummary parties={parties} periodName={partiesPeriod} />
      {content}
    </View>
  );
}

export default PartiesOutput;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 0,
    backgroundColor: GlobalStyles.colors.primary700,
  },
  infoText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
});
