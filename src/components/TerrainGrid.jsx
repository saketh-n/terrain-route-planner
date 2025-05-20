import React, { useState } from 'react';
import TransportSelect from './TransportSelect';
import './TerrainGrid.css';

const TERRAIN_TYPES = {
  PLAIN: { name: 'plain', symbol: '⬜', truckPassable: true, dronePassable: true },
  FOREST: { name: 'forest', symbol: '🌲', truckPassable: false, dronePassable: true },
  SWAMP: { name: 'swamp', symbol: '💧', truckPassable: false, dronePassable: true },
  STORM: { name: 'storm', symbol: '⚡', truckPassable: false, dronePassable: false },
};

const TerrainGrid = () => {
  const [selectedCell, setSelectedCell] = useState(null);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [transportMethod, setTransportMethod] = useState('auto');
  const [selectedTerrain, setSelectedTerrain] = useState('PLAIN');
  const [grid, setGrid] = useState(
    Array(5).fill().map(() => Array(5).fill('PLAIN'))
  );
  const [path, setPath] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [actualTransport, setActualTransport] = useState('truck');
  const [routeMessage, setRouteMessage] = useState('');

  const handleCellClick = (row, col) => {
    if (isEditMode) {
      // In edit mode, toggle terrain
      const newGrid = [...grid];
      const currentTerrain = grid[row][col];
      
      // If clicking on the same non-PLAIN terrain type, switch to PLAIN
      if (currentTerrain === selectedTerrain && selectedTerrain !== 'PLAIN') {
        newGrid[row][col] = 'PLAIN';
      } else {
        newGrid[row][col] = selectedTerrain;
      }
      
      setGrid(newGrid);
    } else {
      // In point selection mode
      if (!startPoint) {
        setStartPoint({ row, col });
      } else if (!endPoint && !(row === startPoint.row && col === startPoint.col)) {
        setEndPoint({ row, col });
      }
    }
  };

  const clearRoute = () => {
    setStartPoint(null);
    setEndPoint(null);
    setPath([]);
    setRouteMessage('');
  };

  const clearTerrain = () => {
    setGrid(Array(5).fill().map(() => Array(5).fill('PLAIN')));
  };

  const randomizeTerrain = () => {
    const terrainTypes = Object.keys(TERRAIN_TYPES);
    const newGrid = Array(5).fill().map(() => 
      Array(5).fill().map(() => 
        terrainTypes[Math.floor(Math.random() * terrainTypes.length)]
      )
    );
    setGrid(newGrid);
  };

  // Helper function to calculate Manhattan distance between two points
  const calculateDistance = (point1, point2) => {
    return Math.abs(point1.row - point2.row) + Math.abs(point1.col - point2.col);
  };

  // Helper function to check if a cell is valid and passable
  const isValidCell = (row, col, visited, currentTransport) => {
    if (row < 0 || row >= 5 || col < 0 || col >= 5 || visited.has(`${row},${col}`)) {
      return false;
    }
    const terrain = TERRAIN_TYPES[grid[row][col]];
    return currentTransport === 'truck' ? terrain.truckPassable : terrain.dronePassable;
  };

  // Find path using A* algorithm
  const findPath = (start, end, currentTransport) => {
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]]; // right, down, left, up
    const visited = new Set();
    const queue = [{ 
      pos: [start.row, start.col],
      path: [{ row: start.row, col: start.col }],
      cost: 0,
      estimate: calculateDistance(start, end)
    }];

    while (queue.length > 0) {
      // Sort by total estimated cost (current cost + heuristic)
      queue.sort((a, b) => (a.cost + a.estimate) - (b.cost + b.estimate));
      const current = queue.shift();
      const [row, col] = current.pos;
      const key = `${row},${col}`;

      if (row === end.row && col === end.col) {
        return current.path;
      }

      if (visited.has(key)) continue;
      visited.add(key);

      for (const [dx, dy] of directions) {
        const newRow = row + dx;
        const newCol = col + dy;

        if (isValidCell(newRow, newCol, visited, currentTransport)) {
          const newPos = { row: newRow, col: newCol };
          queue.push({
            pos: [newRow, newCol],
            path: [...current.path, newPos],
            cost: current.cost + 1,
            estimate: calculateDistance(newPos, end)
          });
        }
      }
    }

    return null;
  };

  const determineTransport = (start, end) => {
    // Try truck first
    const truckPath = findPath(start, end, 'truck');
    if (truckPath) {
      return { 
        transport: 'truck', 
        path: truckPath,
        message: 'Using truck as a valid path was found. This is preferred over drone when possible.'
      };
    }
    // If truck fails, try drone
    const dronePath = findPath(start, end, 'drone');
    if (dronePath) {
      return { 
        transport: 'drone', 
        path: dronePath,
        message: 'Using drone as the path was blocked for truck due to terrain constraints.'
      };
    }
    return { 
      transport: null, 
      path: null,
      message: 'No valid path found. The route is blocked for both truck and drone. Check for storm cells blocking the path.'
    };
  };

  const handlePlanRoute = () => {
    if (!startPoint || !endPoint) {
      setRouteMessage('Please select both start and end points first!');
      return;
    }

    let foundPath;
    let selectedTransport = transportMethod;
    let message = '';

    if (transportMethod === 'auto') {
      const result = determineTransport(startPoint, endPoint);
      foundPath = result.path;
      selectedTransport = result.transport;
      message = result.message;
      if (result.transport) {
        setActualTransport(result.transport);
      }
    } else {
      foundPath = findPath(startPoint, endPoint, transportMethod);
      if (foundPath) {
        message = `Using ${transportMethod} as specified. Path found successfully.`;
      } else {
        message = `No valid path found for ${transportMethod}. Try a different transport method or check for blocking terrain.`;
      }
      setActualTransport(transportMethod);
    }
    
    setRouteMessage(message);
    setPath(foundPath || []);
  };

  const renderGrid = () => {
    const gridElements = [];
    for (let i = 0; i < 5; i++) {
      const row = [];
      for (let j = 0; j < 5; j++) {
        const isStart = startPoint?.row === i && startPoint?.col === j;
        const isEnd = endPoint?.row === i && endPoint?.col === j;
        const isPath = path.some(p => p.row === i && p.col === j);
        const terrainType = grid[i][j];
        
        row.push(
          <div
            key={`${i}-${j}`}
            className={`cell ${isStart ? 'start' : ''} ${isEnd ? 'end' : ''} ${isPath ? 'path' : ''}`}
            onClick={() => handleCellClick(i, j)}
          >
            {isStart ? 'A' : isEnd ? 'B' : TERRAIN_TYPES[terrainType].symbol}
          </div>
        );
      }
      gridElements.push(<div key={i} className="row">{row}</div>);
    }
    return gridElements;
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <TransportSelect
          selectedTransport={transportMethod}
          onTransportChange={setTransportMethod}
        />
        {path.length > 0 && transportMethod === 'auto' && (
          <div className="transport-info">
            Using: {actualTransport === 'truck' ? '🚛 Truck' : '🚁 Drone'}
          </div>
        )}
        <div className="controls">
          <div className="edit-mode">
            <label>
              <input
                type="checkbox"
                checked={isEditMode}
                onChange={(e) => setIsEditMode(e.target.checked)}
              />
              Edit Terrain
            </label>
          </div>
          <div className="terrain-select">
            {Object.entries(TERRAIN_TYPES).map(([key, { name, symbol }]) => (
              <label key={key}>
                <input
                  type="radio"
                  value={key}
                  checked={selectedTerrain === key}
                  onChange={(e) => setSelectedTerrain(e.target.value)}
                />
                {symbol} {name}
              </label>
            ))}
          </div>
        </div>
        <div className="terrain-grid">
          {renderGrid()}
        </div>
        <div className="button-container">
          <button className="clear-route-button" onClick={clearRoute}>
            Clear Route
          </button>
          <button className="clear-terrain-button" onClick={clearTerrain}>
            Clear Terrain
          </button>
          <button className="randomize-button" onClick={randomizeTerrain}>
            Randomize Terrain
          </button>
          <button className="plan-route-button" onClick={handlePlanRoute}>
            Plan Route
          </button>
        </div>
      </div>
      <div className="message-box">
        <h3>Route Information</h3>
        <p>{routeMessage || 'No route planned yet. Click "Plan Route" to begin.'}</p>
      </div>
    </div>
  );
};

export default TerrainGrid; 