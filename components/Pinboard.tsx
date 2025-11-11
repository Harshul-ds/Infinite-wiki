/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useRef } from 'react';
import { PinnedItem } from '../types';

interface PinboardProps {
  isVisible: boolean;
  items: PinnedItem[];
  onAdd: (item: Omit<PinnedItem, 'id'>) => void;
  onMove: (id: string, x: number, y: number) => void;
  onClose: () => void;
}

const PinnedItemCard: React.FC<{ item: PinnedItem }> = ({ item }) => {
  if (item.type === 'concept') {
    return (
      <>
        <h4>{item.content.title}</h4>
        <p>{item.content.description}</p>
      </>
    );
  }
  if (item.type === 'ascii') {
    return (
      <>
        <h4>{item.content.topic}</h4>
        <pre>{item.content.art}</pre>
      </>
    );
  }
  return null;
};

const Pinboard: React.FC<PinboardProps> = ({ isVisible, items, onAdd, onMove, onClose }) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const canvasBounds = canvas.getBoundingClientRect();
    const movedItemId = event.dataTransfer.getData('application/vnd.iw.pinned-item');
    const droppedData = event.dataTransfer.getData('application/json');

    const x = event.clientX - canvasBounds.left + canvas.scrollLeft;
    const y = event.clientY - canvasBounds.top + canvas.scrollTop;

    if (movedItemId) {
      onMove(movedItemId, x, y);
    } else if (droppedData) {
      try {
        const data = JSON.parse(droppedData);
        onAdd({
          type: data.type,
          content: data.content,
          x: x,
          y: y
        });
      } catch (e) {
        console.error("Failed to parse dropped data:", e);
      }
    }
  };

  const handleItemDragStart = (event: React.DragEvent<HTMLDivElement>, id: string) => {
    event.dataTransfer.setData('application/vnd.iw.pinned-item', id);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className={`pinboard ${isVisible ? 'visible' : ''}`}>
      <div className="pinboard-header">
        <h3>Pinboard</h3>
        <button onClick={onClose} aria-label="Close pinboard">&times;</button>
      </div>
      <div 
        ref={canvasRef}
        className="pinboard-canvas" 
        onDragOver={handleDragOver} 
        onDrop={handleDrop}
      >
        {items.map(item => (
          <div
            key={item.id}
            className="pinned-item"
            style={{ top: `${item.y}px`, left: `${item.x}px` }}
            draggable="true"
            onDragStart={(e) => handleItemDragStart(e, item.id)}
          >
            <PinnedItemCard item={item} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pinboard;