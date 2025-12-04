import { useRef, useCallback, forwardRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface SignatureCanvasProps {
    className?: string;
}

export const SignatureCanvas = forwardRef<HTMLCanvasElement, SignatureCanvasProps>(
    ({ className = "" }, ref) => {
        const isDrawingRef = useRef(false);
        const lastPosRef = useRef<{ x: number; y: number } | null>(null);
        const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);

        const getMousePos = useCallback((e: MouseEvent | TouchEvent): { x: number; y: number } => {
            if (!canvasElement) return { x: 0, y: 0 };

            const rect = canvasElement.getBoundingClientRect();
            const scaleX = canvasElement.width / rect.width;
            const scaleY = canvasElement.height / rect.height;

            if ('touches' in e && e.touches.length > 0) {
                return {
                    x: (e.touches[0].clientX - rect.left) * scaleX,
                    y: (e.touches[0].clientY - rect.top) * scaleY,
                };
            } else if ('offsetX' in e) {
                return {
                    x: (e as MouseEvent).offsetX * scaleX,
                    y: (e as MouseEvent).offsetY * scaleY,
                };
            }
            return { x: 0, y: 0 };
        }, [canvasElement]);

        const startDraw = useCallback((e: MouseEvent | TouchEvent) => {
            isDrawingRef.current = true;
            lastPosRef.current = getMousePos(e);
        }, [getMousePos]);

        const draw = useCallback((e: MouseEvent | TouchEvent) => {
            if (!isDrawingRef.current || !canvasElement) return;

            const ctx = canvasElement.getContext("2d");
            if (!ctx) return;

            const pos = getMousePos(e);
            const last = lastPosRef.current;

            if (last) {
                ctx.strokeStyle = "#000";
                ctx.lineWidth = 2;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.moveTo(last.x, last.y);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
            }

            lastPosRef.current = pos;
        }, [canvasElement, getMousePos]);

        const endDraw = useCallback(() => {
            isDrawingRef.current = false;
            lastPosRef.current = null;
        }, []);

        const clear = useCallback(() => {
            const ctx = canvasElement?.getContext("2d");
            if (!canvasElement || !ctx) return;

            const width = canvasElement.clientWidth;
            const height = canvasElement.clientHeight;
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, width, height);
        }, [canvasElement]);

        const initCanvas = useCallback((el: HTMLCanvasElement | null) => {
            if (!el) return;

            const ctx = el.getContext("2d");
            if (!ctx) return;

            // Set canvas size to match display size
            const rect = el.getBoundingClientRect();
            el.width = rect.width * 2; // 2x for retina displays
            el.height = rect.height * 2;
            ctx.scale(2, 2);

            // Fill with white background
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, el.width, el.height);
        }, []);

        const handleRef = useCallback((el: HTMLCanvasElement | null) => {
            setCanvasElement(el);
            if (typeof ref === 'function') {
                ref(el);
            } else if (ref) {
                (ref as React.MutableRefObject<HTMLCanvasElement | null>).current = el;
            }
        }, [ref]);

        useEffect(() => {
            if (canvasElement) {
                initCanvas(canvasElement);
            }
        }, [canvasElement, initCanvas]);

        return (
            <div>
                <div className="rounded-md border bg-white p-2">
                    <canvas
                        ref={handleRef}
                        className={`w-full h-[180px] touch-none select-none ${className}`}
                        onMouseDown={(e) => startDraw(e.nativeEvent)}
                        onMouseMove={(e) => draw(e.nativeEvent)}
                        onMouseUp={endDraw}
                        onMouseLeave={endDraw}
                        onTouchStart={(e) => startDraw(e.nativeEvent)}
                        onTouchMove={(e) => draw(e.nativeEvent)}
                        onTouchEnd={endDraw}
                    />
                </div>
                <div className="mt-2" data-print-exclude>
                    <Button type="button" variant="outline" onClick={clear}>
                        Clear
                    </Button>
                </div>
            </div>
        );
    }
);

SignatureCanvas.displayName = "SignatureCanvas";
