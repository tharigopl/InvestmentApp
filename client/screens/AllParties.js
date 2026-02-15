import { useContext, useState } from 'react';

import PartiesOutput from '../components/PartiesOutput/PartiesOutput';
import { PartiesContext } from '../store/parties-context';

function AllParties() {
  const partiesCtx = useContext(PartiesContext);
  
  return (
    <PartiesOutput
      parties={partiesCtx.parties}
      partiesPeriod="Total"
      fallbackText="No registered parties found!"
    />
  );
}

export default AllParties;
