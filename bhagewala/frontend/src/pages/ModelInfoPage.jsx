import React from 'react';
import ModelSpecsTab from '../components/ModelSpecsTab';

export default function ModelInfoPage({ modelInfo }) {
  return (
    <div className="page-container">
      <ModelSpecsTab modelInfo={modelInfo} />
    </div>
  );
}
