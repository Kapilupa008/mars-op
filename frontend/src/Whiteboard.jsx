import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { useParams, useLocation } from 'react-router-dom';
import socket from './socket';

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const { roomId } = useParams();
  const location = useLocation();

  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState('pen');

  const toolRef = useRef(tool);
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const isUpdating = useRef(false);
  const isRemoteUpdate = useRef(false);
  const drawingShape = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });

  const isEditable = location.state?.isEditable ?? false;
  const password = location.state?.password || '';
  const username = location.state?.username || prompt('Enter your name:') || 'Anonymous';

  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  const saveState = () => {
    if (!isEditable) return;
    if (!isUpdating.current && canvasRef.current && !isRemoteUpdate.current) {
      const json = canvasRef.current.toJSON();
      undoStack.current.push(json);
      redoStack.current = [];
      socket.emit('drawing', { roomId, pathData: json });
    }
  };

  const updateBrush = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.isDrawingMode = isEditable && (toolRef.current === 'pen' || toolRef.current === 'eraser');
      if (canvas.freeDrawingBrush) {
        const brush = canvas.freeDrawingBrush;
        brush.color = toolRef.current === 'eraser' ? '#ffffff' : color;
        brush.width = brushSize;
      }
    }
  };

  useEffect(() => {
    const canvas = new fabric.Canvas('whiteboard', {
      isDrawingMode: false,
      backgroundColor: '#ffffff',
    });

    canvasRef.current = canvas;
    updateBrush();

    socket.emit('join-room', { roomId, password, username }, (res) => {
      if (!res.success) alert(res.message);
    });

    socket.on('drawing', ({ pathData }) => {
      isRemoteUpdate.current = true;
      canvas.loadFromJSON(pathData, () => {
        canvas.renderAll();
        undoStack.current.push(pathData);
        isRemoteUpdate.current = false;
      });
    });

    socket.on('clear-canvas', () => {
      isRemoteUpdate.current = true;
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
      isRemoteUpdate.current = false;
    });

    canvas.on('path:created', () => {
      if (isEditable && (toolRef.current === 'pen' || toolRef.current === 'eraser')) saveState();
    });

    canvas.on('mouse:down', (opt) => {
      if (!isEditable) return;

      const pointer = canvas.getPointer(opt.e);
      startPos.current = pointer;

      if (toolRef.current === 'pen' || toolRef.current === 'eraser') return;

      canvas.isDrawingMode = false;

      if (toolRef.current === 'rect') {
        drawingShape.current = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          fill: color,
          width: 0,
          height: 0,
          selectable: false,
        });
        canvas.add(drawingShape.current);
      } else if (toolRef.current === 'circle') {
        drawingShape.current = new fabric.Ellipse({
          left: pointer.x,
          top: pointer.y,
          rx: 0,
          ry: 0,
          fill: color,
          originX: 'left',
          originY: 'top',
          selectable: false,
        });
        canvas.add(drawingShape.current);
      } else if (toolRef.current === 'text') {
        const input = prompt('Enter text:');
        if (input) {
          const textObj = new fabric.Textbox(input, {
            left: pointer.x,
            top: pointer.y,
            fill: color,
            fontSize: 20,
            fontFamily: 'Arial',
            selectable: false,
          });
          canvas.add(textObj);
          canvas.renderAll();
          saveState();
        }
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (!drawingShape.current) return;
      const pointer = canvas.getPointer(opt.e);
      const shape = drawingShape.current;

      const width = pointer.x - startPos.current.x;
      const height = pointer.y - startPos.current.y;

      if (toolRef.current === 'rect') {
        shape.set({
          width: Math.abs(width),
          height: Math.abs(height),
          left: width < 0 ? pointer.x : startPos.current.x,
          top: height < 0 ? pointer.y : startPos.current.y,
        });
      } else if (toolRef.current === 'circle') {
        shape.set({
          rx: Math.abs(width) / 2,
          ry: Math.abs(height) / 2,
          left: width < 0 ? pointer.x : startPos.current.x,
          top: height < 0 ? pointer.y : startPos.current.y,
        });
      }

      shape.setCoords();
      canvas.renderAll();
    });

    canvas.on('mouse:up', () => {
      if (drawingShape.current) {
        drawingShape.current.set({ selectable: false });
        drawingShape.current = null;
        saveState();
      }
    });

    saveState();

    return () => {
      socket.off('drawing');
      socket.off('clear-canvas');
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    updateBrush();
  }, [tool, color, brushSize]);

  const handleUndo = () => {
    if (!isEditable || undoStack.current.length <= 1) return;
    const canvas = canvasRef.current;
    isUpdating.current = true;
    const current = undoStack.current.pop();
    redoStack.current.push(current);
    const prev = undoStack.current[undoStack.current.length - 1];
    canvas.loadFromJSON(prev, () => {
      canvas.renderAll();
      isUpdating.current = false;
      socket.emit('drawing', { roomId, pathData: prev });
    });
  };

  const handleRedo = () => {
    if (!isEditable || redoStack.current.length === 0) return;
    const canvas = canvasRef.current;
    isUpdating.current = true;
    const next = redoStack.current.pop();
    undoStack.current.push(next);
    canvas.loadFromJSON(next, () => {
      canvas.renderAll();
      isUpdating.current = false;
      socket.emit('drawing', { roomId, pathData: next });
    });
  };

  const handleClear = () => {
    if (!isEditable) return;
    const canvas = canvasRef.current;
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
    saveState();
    socket.emit('clear-canvas', { roomId });
  };

  const handleSavePNG = () => {
    const dataURL = canvasRef.current.toDataURL({ format: 'png', quality: 1 });
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'whiteboard.png';
    link.click();
  };

  const handleSavePDF = () => {
    const dataURL = canvasRef.current.toDataURL('image/png');
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Whiteboard PDF</title></head>
      <body style="margin:0"><img src="${dataURL}" style="width:100%"/></body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 10 }}>
        🎨 Color:
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          disabled={!isEditable || tool === 'eraser'}
        />
        &nbsp;🛠 Tool:
        <button onClick={() => setTool('pen')} disabled={!isEditable} style={{ fontWeight: tool === 'pen' ? 'bold' : 'normal' }}>Pen</button>
        <button onClick={() => setTool('eraser')} disabled={!isEditable} style={{ fontWeight: tool === 'eraser' ? 'bold' : 'normal' }}>Eraser</button>
        <button onClick={() => setTool('rect')} disabled={!isEditable} style={{ fontWeight: tool === 'rect' ? 'bold' : 'normal' }}>Rectangle</button>
        <button onClick={() => setTool('circle')} disabled={!isEditable} style={{ fontWeight: tool === 'circle' ? 'bold' : 'normal' }}>Circle</button>
        <button onClick={() => setTool('text')} disabled={!isEditable} style={{ fontWeight: tool === 'text' ? 'bold' : 'normal' }}>Text</button>
        &nbsp;📏 Size:
        <input
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) => setBrushSize(parseInt(e.target.value))}
          disabled={!isEditable}
        />
        {brushSize}px
        &nbsp;
        <button onClick={handleUndo} disabled={!isEditable}>↩ Undo</button>
        <button onClick={handleRedo} disabled={!isEditable}>↪ Redo</button>
        <button onClick={handleClear} disabled={!isEditable}>🧼 Clear</button>
        <button onClick={handleSavePNG}>📸 Save PNG</button>
        <button onClick={handleSavePDF}>📄 Save PDF</button>
      </div>

      <canvas id="whiteboard" width={1000} height={600} style={{ border: '2px solid black' }} />
    </div>
  );
};

export default Whiteboard;
