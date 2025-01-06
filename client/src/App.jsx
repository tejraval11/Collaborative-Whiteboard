import React from 'react';
import Canvas from './components/Canvas';

function App() {
    return (
        <div className="min-h-screen bg-gray-50">

            <main className="flex justify-center items-center p-4">
                {/* Canvas already contains Toolbar */}
                <Canvas />
            </main>
        </div>
    );
}

export default App;
