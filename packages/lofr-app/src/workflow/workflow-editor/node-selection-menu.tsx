import React, { useState, useMemo, useEffect, useRef } from 'react';
import { WorkflowNodeTypes, WorkflowRegistry } from './types';

type NodeSelectionMenuProps = {
    registry: WorkflowRegistry;
    position: { x: number; y: number };
    onSelect: (nodeType: WorkflowNodeTypes[number]) => void;
    onClose: () => void;
};

export const NodeSelectionMenu: React.FC<NodeSelectionMenuProps> = ({ registry, position, onSelect, onClose }) => {
    const nodeDefinitions = Object.values(registry.nodeTypes);

    const [searchTerm, setSearchTerm] = useState(``);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

    const filteredNodeDefinitions = useMemo(() => {
        return nodeDefinitions.filter((def) => def.typeName.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [registry, searchTerm]);

    useEffect(() => {
        setHighlightedIndex(0);
    }, [filteredNodeDefinitions]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener(`mousedown`, handleClickOutside);
        return () => {
            document.removeEventListener(`mousedown`, handleClickOutside);
        };
    }, [onClose]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === `Enter`) {
            e.preventDefault();
            if (filteredNodeDefinitions[highlightedIndex]) {
                onSelect(filteredNodeDefinitions[highlightedIndex]);
            }
        } else if (e.key === `Escape`) {
            e.preventDefault();
            onClose();
        } else if (e.key === `ArrowDown`) {
            e.preventDefault();
            setHighlightedIndex((prevIndex) => Math.min(prevIndex + 1, filteredNodeDefinitions.length - 1));
        } else if (e.key === `ArrowUp`) {
            e.preventDefault();
            setHighlightedIndex((prevIndex) => Math.max(prevIndex - 1, 0));
        }
    };

    return (
        <div
            ref={menuRef}
            className="absolute z-50 flex flex-col rounded border border-gray-300 bg-white shadow-lg"
            style={{ top: position.y, left: position.x }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="border-b border-gray-200 p-2">
                <input
                    type="text"
                    placeholder="Search nodes..."
                    className="w-full rounded border border-gray-300 p-1 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                />
            </div>
            <ul className="max-h-60 overflow-y-auto">
                {filteredNodeDefinitions.length > 0 ? (
                    filteredNodeDefinitions.map((def, index) => (
                        <li
                            key={def.typeName}
                            className={`cursor-pointer px-3 py-2 text-sm ${index === highlightedIndex ? `bg-blue-100` : `hover:bg-gray-100`}`}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                onSelect(def);
                            }}
                        >
                            {def.typeName}
                        </li>
                    ))
                ) : (
                    <li className="px-3 py-2 text-sm text-gray-500">No matching nodes</li>
                )}
            </ul>
        </div>
    );
};
