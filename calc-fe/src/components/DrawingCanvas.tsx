import React, { useRef, useState, useEffect } from 'react';

const DrawingCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [undoStack, setUndoStack] = useState<ImageData[]>([]);
    const [redoStack, setRedoStack] = useState<ImageData[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set canvas to fill the parent container
        const resizeCanvas = () => {
            canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
            canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);

        // Save the current canvas state
        setUndoStack((prev) => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
        setRedoStack([]); // Clear redo stack on new action
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const handleUndo = () => {
        const canvas = canvasRef.current;
        if (!canvas || undoStack.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const lastState = undoStack.pop()!;
        setRedoStack((prev) => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
        ctx.putImageData(lastState, 0, 0);
    };

    const handleRedo = () => {
        const canvas = canvasRef.current;
        if (!canvas || redoStack.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const nextState = redoStack.pop()!;
        setUndoStack((prev) => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
        ctx.putImageData(nextState, 0, 0);
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <canvas
                ref={canvasRef}
                style={{ display: 'block', width: '100%', height: '100%', background: 'white' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
                <button onClick={handleUndo} style={{ marginRight: 10 }}>
                    Undo
                </button>
                <button onClick={handleRedo}>Redo</button>
            </div>
        </div>
    );
};

export default DrawingCanvas;
