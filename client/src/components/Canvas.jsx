import React, { useRef, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import Toolbar from './Toolbar';

let socket;

const Canvas = () => {
    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const [tool, setTool] = useState('draw');
    const [lineWidth, setLineWidth] = useState(2);
    const [strokeColor, setStrokeColor] = useState('#000000');
    const [textInput, setTextInput] = useState('');
    const [drawing, setDrawing] = useState(false);
    const [canvasData, setCanvasData] = useState(null);
    const [undoStack, setUndoStack] = useState([]);
    const [error, setError] = useState(null);
    const [textPreview, setTextPreview] = useState({ show: false, x: 0, y: 0 });

    // Initialize canvas context
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        ctx.strokeStyle = strokeColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctxRef.current = ctx;
    }, [strokeColor]);

    // Handle line width changes
    useEffect(() => {
        if (ctxRef.current) {
            ctxRef.current.lineWidth = lineWidth;
        }
    }, [lineWidth]);

    // Handle canvas resize
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        const resizeCanvas = () => {
            // Store the current canvas content
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            tempCtx.drawImage(canvas, 0, 0);

            // Resize canvas
            const parent = canvas.parentElement;
            canvas.width = parent.clientWidth;
            canvas.height = window.innerHeight - 56; // Subtract toolbar height

            // Restore the content
            ctx.drawImage(tempCanvas, 0, 0);
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    // Initialize socket connection
    useEffect(() => {
        try {
            socket = io('http://localhost:5000', {
                reconnectionAttempts: 5,
                timeout: 10000,
            });

            socket.on('connect_error', (error) => {
                setError('Failed to connect to server. Please try again later.');
                console.error('Socket connection error:', error);
            });

            socket.on('canvas-data', handleCanvasData);

            return () => {
                socket.off('canvas-data', handleCanvasData);
                socket.close();
            };
        } catch (err) {
            setError('Failed to initialize socket connection');
            console.error('Socket initialization error:', err);
        }
    }, []);

    // Handle incoming canvas data
    const handleCanvasData = useCallback((data) => {
        if (!ctxRef.current) return;

        const img = new Image();
        img.src = data;
        img.onload = () => {
            ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctxRef.current.drawImage(img, 0, 0);
            setCanvasData(data);
        };
    }, []);

    // Handle undo functionality
    const handleUndo = useCallback(() => {
        if (undoStack.length === 0) return;

        const previousState = undoStack[undoStack.length - 1];
        const newStack = undoStack.slice(0, -1);
        
        const img = new Image();
        img.src = previousState;
        img.onload = () => {
            ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctxRef.current.drawImage(img, 0, 0);
            setCanvasData(previousState);
            setUndoStack(newStack);
            
            if (socket?.connected) {
                socket.emit('canvas-data', previousState);
            }
        };
    }, [undoStack]);

    // Handle clear canvas
    const handleClear = useCallback(() => {
        if (!ctxRef.current || !canvasRef.current) return;
        
        // Save current state to undo stack before clearing
        setUndoStack(prev => [...prev, canvasRef.current.toDataURL()]);
        
        ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        setCanvasData(null);
        
        if (socket?.connected) {
            socket.emit('canvas-data', canvasRef.current.toDataURL());
        }
    }, []);

    // Handle save drawing
    const handleSave = useCallback(() => {
        if (!canvasRef.current) return;
        
        const link = document.createElement('a');
        link.download = 'drawing.png';
        link.href = canvasRef.current.toDataURL();
        link.click();
    }, []);

    // Text preview handlers
    const handleMouseMove = useCallback((e) => {
        if (tool === 'text' && textInput.trim()) {
            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setTextPreview({ show: true, x, y });
        }
    }, [tool, textInput]);

    const handleMouseLeave = useCallback(() => {
        setTextPreview({ show: false, x: 0, y: 0 });
    }, []);

    // Drawing handlers
    const startDrawing = useCallback((e) => {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

        if (!x || !y) return;

        ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : strokeColor;

        if (tool === 'draw' || tool === 'eraser') {
            setDrawing(true);
            ctx.beginPath();
            ctx.moveTo(x, y);
        } else if (tool === 'rectangle' || tool === 'circle') {
            setDrawing(true);
            canvas.dataset.startX = x;
            canvas.dataset.startY = y;
            canvas.dataset.savedData = canvasRef.current.toDataURL();
        }
    }, [tool, strokeColor]);

    const draw = useCallback((e) => {
        if (!drawing || !ctxRef.current) return;

        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

        if (!x || !y) return;

        if (tool === 'draw' || tool === 'eraser') {
            ctx.lineTo(x, y);
            ctx.stroke();
        } else if (tool === 'rectangle' || tool === 'circle') {
            const startX = parseFloat(canvas.dataset.startX);
            const startY = parseFloat(canvas.dataset.startY);
            
            const img = new Image();
            img.src = canvas.dataset.savedData;
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);

                ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : strokeColor;

                if (tool === 'rectangle') {
                    ctx.strokeRect(startX, startY, x - startX, y - startY);
                } else if (tool === 'circle') {
                    const radius = Math.sqrt(
                        Math.pow(x - startX, 2) + Math.pow(y - startY, 2)
                    );
                    ctx.beginPath();
                    ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
                    ctx.stroke();
                }
            };
        }
    }, [drawing, tool, strokeColor]);

    const stopDrawing = useCallback(() => {
        if (!drawing) return;
        
        setDrawing(false);
        ctxRef.current?.closePath();
        
        const currentState = canvasRef.current.toDataURL();
        setUndoStack(prev => [...prev, currentState]);
        
        if (socket?.connected) {
            socket.emit('canvas-data', currentState);
        }
    }, [drawing]);

    const handleText = useCallback((e) => {
        if (tool !== 'text' || !textInput.trim() || !ctxRef.current) return;

        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setUndoStack(prev => [...prev, canvas.toDataURL()]);

        ctx.fillStyle = strokeColor;
        ctx.font = `${lineWidth * 5}px Arial`;
        ctx.fillText(textInput, x, y);

        if (socket?.connected) {
            socket.emit('canvas-data', canvas.toDataURL());
        }
        setTextInput('');
        setTextPreview({ show: false, x: 0, y: 0 });
    }, [tool, textInput, strokeColor, lineWidth]);

    // Add event listeners
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleTouchStart = (e) => {
            e.preventDefault();
            startDrawing(e);
        };

        const handleTouchMove = (e) => {
            e.preventDefault();
            draw(e);
        };

        const handleTouchEnd = () => {
            stopDrawing();
        };

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseleave', stopDrawing);
        canvas.addEventListener('click', handleText);
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd);

        return () => {
            canvas.removeEventListener('mousedown', startDrawing);
            canvas.removeEventListener('mousemove', draw);
            canvas.removeEventListener('mouseup', stopDrawing);
            canvas.removeEventListener('mouseleave', stopDrawing);
            canvas.removeEventListener('click', handleText);
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('touchend', handleTouchEnd);
        };
    }, [startDrawing, draw, stopDrawing, handleText]);

    return (
        <div className="h-screen w-screen overflow-hidden relative">
            {error && (
                <div className="fixed left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                </div>
            )}
            <Toolbar
                tool={tool}
                setTool={setTool}
                lineWidth={lineWidth}
                setLineWidth={setLineWidth}
                strokeColor={strokeColor}
                setStrokeColor={setStrokeColor}
                textInput={textInput}
                setTextInput={setTextInput}
                onClear={handleClear}
                onUndo={handleUndo}
                onSave={handleSave}
                canUndo={undoStack.length > 0}
            />
            {textPreview.show && (
                <div 
                    className="absolute pointer-events-none"
                    style={{
                        left: textPreview.x,
                        top: textPreview.y,
                        color: strokeColor,
                        fontSize: `${lineWidth * 5}px`
                    }}
                >
                    {textInput}
                </div>
            )}
            <canvas
                ref={canvasRef}
                className="bg-white"
                style={{ 
                    touchAction: 'none',
                    marginTop: '0px'
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            />
        </div>
    );
};

export default Canvas;