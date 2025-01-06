import React, { memo } from 'react';
import { 
    Pencil, 
    Square, 
    Circle, 
    Type, 
    Eraser, 
    RotateCcw, 
    Download,
    Trash2
} from 'lucide-react';

const TOOLS = [
    { id: 'draw', icon: Pencil, label: 'Draw' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' }
];

const COLORS = [
    { value: '#000000', label: 'Black' },
    { value: '#FFFFFF', label: 'White' },
    { value: '#FF0000', label: 'Red' },
    { value: '#00FF00', label: 'Green' },
    { value: '#0000FF', label: 'Blue' },
    { value: '#FFFF00', label: 'Yellow' },
    { value: '#FF00FF', label: 'Magenta' },
    { value: '#00FFFF', label: 'Cyan' },
    { value: '#FFA500', label: 'Orange' },
    { value: '#800080', label: 'Purple' },
    { value: '#008000', label: 'Dark Green' },
    { value: '#800000', label: 'Maroon' },
    { value: '#008080', label: 'Teal' }
];

const FONT_SIZES = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];

const Toolbar = memo(({ 
    tool, 
    setTool, 
    lineWidth,
    setLineWidth, 
    strokeColor,
    setStrokeColor, 
    textInput, 
    setTextInput,
    onClear,
    onUndo,
    onSave,
    canUndo
}) => {
    return (
        <div className="fixed left-0 top-0 h-full w-20 bg-white border-r border-gray-200 shadow-sm flex flex-col gap-4 p-2 overflow-y-auto">
            {/* Drawing Tools */}
            <div className="flex flex-col gap-2">
                {TOOLS.map(({ id, icon: Icon, label }) => (
                    <button
                        key={id}
                        onClick={() => setTool(id)}
                        className={`p-2 rounded-lg flex flex-col items-center gap-1 ${
                            tool === id 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                        title={label}
                    >
                        <Icon size={20} />
                        <span className="text-xs">{label}</span>
                    </button>
                ))}
            </div>

            <div className="border-t border-gray-200 my-2" />

            {/* Line Width */}
            <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-gray-600">Size</span>
                <select
                    value={lineWidth}
                    onChange={(e) => setLineWidth(Number(e.target.value))}
                    className="w-16 text-sm border border-gray-300 rounded px-1 py-1"
                >
                    {FONT_SIZES.map(size => (
                        <option key={size} value={size}>{size}px</option>
                    ))}
                </select>
            </div>

            {/* Colors */}
            <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-gray-600">Color</span>
                <div className="grid grid-cols-2 gap-1">
                    {COLORS.map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => setStrokeColor(value)}
                            className={`w-6 h-6 rounded-full border-2 ${
                                strokeColor === value ? 'border-blue-500' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: value }}
                            title={label}
                        />
                    ))}
                </div>
            </div>

            {/* Text Input */}
            {tool === 'text' && (
                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs font-medium text-gray-600">Text</span>
                    <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Text..."
                        className="w-16 text-sm border border-gray-300 rounded px-1 py-1"
                    />
                </div>
            )}

            <div className="border-t border-gray-200 my-2" />

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 mt-auto">
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className={`p-2 rounded-lg flex flex-col items-center gap-1 ${
                        canUndo 
                            ? 'bg-gray-50 text-gray-600 hover:bg-gray-100' 
                            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                    title="Undo"
                >
                    <RotateCcw size={20} />
                    <span className="text-xs">Undo</span>
                </button>

                <button
                    onClick={onClear}
                    className="p-2 rounded-lg flex flex-col items-center gap-1 bg-red-50 text-red-600 hover:bg-red-100"
                    title="Clear"
                >
                    <Trash2 size={20} />
                    <span className="text-xs">Clear</span>
                </button>

                <button
                    onClick={onSave}
                    className="p-2 rounded-lg flex flex-col items-center gap-1 bg-green-50 text-green-600 hover:bg-green-100"
                    title="Save"
                >
                    <Download size={20} />
                    <span className="text-xs">Save</span>
                </button>
            </div>
        </div>
    );
});

Toolbar.displayName = 'Toolbar';

export default Toolbar;