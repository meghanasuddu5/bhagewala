import React from 'react';
import PredictorTab from '../components/PredictorTab';

export default function ForecastPage({ twinState, health }) {
  return (
    <div className="page-container">
      <PredictorTab twinState={twinState} health={health} />
    </div>
  );
}
