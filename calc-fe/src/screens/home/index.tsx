import React, {useEffect, useRef, useState} from 'react';
import {SWATCHES} from '@/constants';
//import {ColorSwatch, Group} from '@mantine/core';
import {Button} from '@/components/ui/button';
import axios from 'axios';
import Draggable from 'react-draggable';
//import { log } from 'console';


interface Response {
    expr: string;
    result: string;
    assign: boolean;
}

interface GeneratedResult {
    expression: string;
    answer:string;
}

const undoStack: ImageData[] = [];
const redoStack: ImageData[] = [];

export default function Home() {
    const canvasRef  = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('rgb(255,255,255');
    const [reset, setReset] = useState(false);
    const [result, setResult] = useState<GeneratedResult>();
    const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
    const [latexPosition, setLatexPosition] = useState({x:10, y: 200});
    const [dictOfVars, setDictOfVars] = useState({});
    const [brushSize, setBrushSize] = useState(5); // Default brush size
    const [isEraser, setIsEraser] = useState(false); // Tracks eraser mode


    useEffect(() => {
        if(reset) {
            resetCanvas();
            setLatexExpression([]); //empty array
            setResult(undefined);
            setDictOfVars({}); //empty dictionary
            setReset(false);
        }
    }, [reset]);



    useEffect(() => {
        if (latexExpression.length > 0 && window.MathJax) {
            setTimeout(() => {
                window.MathJax.Hub.Queue(["Typescript", window.MathJax.Hub]);
            }, 0);
        }

    }, [latexExpression])

    useEffect(() => {
        if(result) {
            renderLatexToCanvas(result.expression, result.answer);
        }
    }, [result])

    useEffect(() => {
        const canvas = canvasRef.current;

        if(canvas) {
            const ctx = canvas.getContext('2d',{ willReadFrequently: true });
            if(ctx) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight - canvas.offsetTop;
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.lineCap = 'round';
                ctx.lineWidth = 3;
            }
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';
        script.async = true;
        document.head.appendChild(script);
        
        script.onload = () => {
            window.MathJax.Hub.Config({
                tex2jax: {inlineMath: [['$', '$'], ['\\(', '\\)']]},    
            });
        };


        return () => {
            document.head.removeChild(script);
        }
    }, []);

    


    const renderLatexToCanvas = (expression: string, answer: string) => {
        const latex = `\(\\${expression} = ${answer})`;
        setLatexExpression([...latexExpression, latex]);

        const canvas = canvasRef.current;
        if(canvas) {
            const ctx = canvas.getContext('2d');
            if(ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    // Undo/Redo stacks


  const saveState = () => {
    const canvas = canvasRef.current;
    if (canvas) {
        const context = canvas.getContext('2d');
        if (context) {
            console.log("Pushed!");
            undoStack.push(context.getImageData(0, 0, canvas.width, canvas.height));
            // Limit undo stack size if needed (e.g., keep the last 50 states)
            if (undoStack.length > 50) undoStack.shift();
            redoStack.length = 0; // Clear redoStack whenever a new action is taken
        }
    }
};


 const undo = () => {

    console.log(undoStack);

     if (undoStack.length === 0) { 
        return ;
     }
     
     const canvas = canvasRef.current;
     if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        redoStack.push(context.getImageData(0, 0, canvas.width, canvas.height));
        const lastState = undoStack.pop();
        if (lastState) context.putImageData(lastState, 0, 0);
      }
    }
  };

  const redo = () => {
      if (redoStack.length === 0) {
        return ;
      } 
      
      const canvas = canvasRef.current;
      if (canvas) {   
      const context = canvas.getContext('2d');
      if (context) {
        undoStack.push(context.getImageData(0, 0, canvas.width, canvas.height));
        const nextState = redoStack.pop();
        if (nextState) context.putImageData(nextState, 0, 0);
      }
    }
  };

    const resetCanvas = () => {
        const canvas = canvasRef.current;
        if(canvas) {
            const ctx = canvas.getContext('2d');
            if(ctx){
                ctx.clearRect(0,0, canvas.width, canvas.height);
            }
         }
         undoStack.length = 0;
         redoStack.length = 0; 
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault(); // Prevent default touch behavior like scrolling
        let offsetX, offsetY;
    
        const canvas = canvasRef.current;
        if (!canvas) return;

       // saveState();
    
        if ("touches" in e) { // Handle touch events
            const pos = convertTouchToMouse(e, canvas);
            offsetX = pos.offsetX;
            offsetY = pos.offsetY;
        } else { // Handle mouse events
            offsetX = e.nativeEvent.offsetX;
            offsetY = e.nativeEvent.offsetY;
        }
    
        setIsDrawing(true);
        const context = canvas.getContext('2d');
        if (context) {
            context.beginPath();
            context.moveTo(offsetX, offsetY);
            context.strokeStyle = isEraser ? 'black' : color; // Eraser logic
            context.lineWidth = brushSize; // Set brush size dynamically
        }
    };
    
      

   
    /*?const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if(!isDrawing) {
            return;
        }
        const canvas = canvasRef.current;
        if(canvas) {
            const ctx = canvas.getContext('2d');
            if(ctx) {
                ctx.strokeStyle = color;
                ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                ctx.stroke();
            }
        }
    };/*/
    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    e.preventDefault(); // Prevent scrolling or unintended behavior

    let offsetX, offsetY;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if ("touches" in e) { // Handle touch events
        const pos = convertTouchToMouse(e, canvas);
        offsetX = pos.offsetX;
        offsetY = pos.offsetY;
    } else { // Handle mouse events
        offsetX = e.nativeEvent.offsetX;
        offsetY = e.nativeEvent.offsetY;
    }

    const context = canvas.getContext('2d');
    if (context) {
        context.lineTo(offsetX, offsetY);
        context.strokeStyle = isEraser ? 'black' : color; // Eraser logic
        context.lineWidth = brushSize;
        context.stroke();
        // Save state for undo/redo after each draw step
        saveState();
    }
};

      
    

    const stopDrawing = () => {
        setIsDrawing(false);
        const context = canvasRef.current?.getContext('2d');
        if (context) {
            context.closePath(); // End the current drawing path
        }
    };
    

    const runRoute = async () => {
        const canvas = canvasRef.current;

        if(canvas) {
            console.log('sending data...',`${import.meta.env.VITE_API_URL}/calculate`);
            const response = await axios({
                method: 'post',
                url: `${import.meta.env.VITE_API_URL}/calculate`,
                data: {
                    image: canvas.toDataURL('image/png'),
                    dict_of_vars: dictOfVars,
                }
            });

            const resp = await response.data;
            resp.data.forEach((data: Response) => {
                if(data.assign == true) {
                    setDictOfVars({
                        ...dictOfVars,
                        [data.expr]: data.result
                    });
                }
            });
        

        const ctx = canvas.getContext('2d', {willReadFreqently: true}) as CanvasRenderingContext2D | null;
        if(!ctx) return;
        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
        let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;

        for (let y = 0; y < canvas?.height; y++) {
            for(let x = 0; x < canvas.width; x++) {
                if(imageData.data[(y * canvas.width + x) * 4 + 3] > 0) {
                    if(x < minX) minX = x;
                    if(x > maxX) maxX = x;
                    if(y < minY) minY = y;
                    if(y > maxY) maxY = y;
                }
            }
        }
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        setLatexPosition({x: centerX, y: centerY});

        resp.data.forEach((data: Response) => {
            setTimeout(() => {
                setResult({
                    expression: data.expr,
                    answer: data.result
                });
            });
        }, 200);
    }
    };

    const convertTouchToMouse = (e: React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect(); // Get canvas position
        return {
          offsetX: touch.clientX - rect.left, // Calculate offsetX
          offsetY: touch.clientY - rect.top,  // Calculate offsetY
          clientX: touch.clientX,
          clientY: touch.clientY,
        };
      };
      
      

return (
    <>
    <div className="contianer mx-aut0 p-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-center fixed top-4 left-4 flex flex-col items-start gap-4 p-4 bg-gray-900 rounded-lg shadow-2xl z-20">
            {/* Reset Button */}
            <Button
                className="w-full px-4 py-2 text-white bg-red-500 rounded-md shadow-md hover:bg-red-600 transition duration-300"
                onClick={() => setReset(true)}
            >
                Reset
            </Button>

            {/* Color Palette */}
            <div className="flex flex-wrap gap-2 justify-center">
                {SWATCHES.map((swatchColor: string) => (
                    <div
                        key={swatchColor}
                        className={`w-8 h-8 rounded-full border-2 cursor-pointer shadow-md transition duration-200 ${
                            color === swatchColor
                                ? 'border-yellow-400 scale-110'
                                : 'border-gray-700'
                        }`}
                        style={{ backgroundColor: swatchColor }}
                        onClick={() => setColor(swatchColor)}
                    />
                ))}
            </div>

            {/* Undo/Redo Buttons */}
            <div className="flex gap-4">
                <Button
                    onClick={undo}
                    className="px-4 py-2 text-white bg-gray-700 rounded-md shadow-md hover:bg-gray-800 transition duration-300"
                >
                    Undo
                </Button>
                <Button
                    onClick={redo}
                    className="px-4 py-2 text-white bg-gray-700 rounded-md shadow-md hover:bg-gray-800 transition duration-300"
                >
                    Redo
                </Button>
            </div>

            {/* Brush Size */}
            <div className="flex flex-col items-center">
                <label className="text-white">Brush Size</label>
                <input
                    type="range"
                    min="1"
                    max="20"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer"
                />
            </div>
            {/* Eraser Button */}
            <Button
                onClick={() => setIsEraser((prev) => !prev)}
                className={`w-full px-4 py-2 rounded-md shadow-md transition duration-300 ${
                    isEraser
                        ? 'bg-red-700 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
            >
                {isEraser ? 'Eraser ON' : 'Eraser'}
            </Button>

            {/* Calculate Button */}
            <Button
                onClick={runRoute}
                className="w-full px-4 py-2 text-white bg-blue-500 rounded-md shadow-md hover:bg-blue-600 transition duration-300"
            >
                Calculate
            </Button>
           
        </div>

        {/* Canvas */}
        <div className="flex justify-center">
        <canvas
            ref={canvasRef}
            id="canvas"
            className="absolute top-0 left-0 w-full h-full bg-black"
            onMouseDown={startDrawing}
            onMouseOut={stopDrawing}
            onMouseUp={stopDrawing}
            onMouseMove={draw}
            onTouchStart={(e) => { e.preventDefault(); startDrawing(e); }}
            onTouchMove={(e) => { e.preventDefault(); draw(e); }}
            onTouchEnd={(e) => { e.preventDefault(); stopDrawing(); }}
        />
        </div>
        
        {/* Latex Expressions */}
        {latexExpression &&
            latexExpression.map((latex, index) => (
                <Draggable
                    key={index}
                    defaultPosition={latexPosition}
                    onStop={(_e, data) =>
                        setLatexPosition({ x: data.x, y: data.y })
                    }
                >
                    <div className="absolute p-2 text-white bg-gray-800 rounded-lg shadow-lg">
                        <div className="latex-content">{latex}</div>
                    </div>
                </Draggable>
            ))}
            </div>
    </>
);

}



