import React from 'react';
import './TransportSelect.css';

const TransportSelect = ({ selectedTransport, onTransportChange }) => {
  return (
    <div className="transport-select">
      <label>
        <input
          type="radio"
          value="auto"
          checked={selectedTransport === 'auto'}
          onChange={(e) => onTransportChange(e.target.value)}
        />
        🤖 Auto
      </label>
      <label>
        <input
          type="radio"
          value="truck"
          checked={selectedTransport === 'truck'}
          onChange={(e) => onTransportChange(e.target.value)}
        />
        🚛 Truck
      </label>
      <label>
        <input
          type="radio"
          value="drone"
          checked={selectedTransport === 'drone'}
          onChange={(e) => onTransportChange(e.target.value)}
        />
        🚁 Drone
      </label>
    </div>
  );
};

export default TransportSelect; 