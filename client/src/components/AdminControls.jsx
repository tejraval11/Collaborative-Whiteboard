import React from 'react';

const AdminControls = () => {
    const handleClearCanvas = () => {
        const canvas = document.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    return (
        <div className="p-4">
            <h2 className="text-lg font-semibold">Admin Controls</h2>
            <button
                onClick={handleClearCanvas}
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
                Clear Canvas (Admin)
            </button>
        </div>
    );
};

export default AdminControls;
