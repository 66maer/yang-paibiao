import { Card } from '@heroui/react';
import clsx from 'clsx';
import { useRef, useState } from 'react';

export default function HoverEffectCard({
  children,
  maxXRotation = 5,
  maxYRotation = 5,
  className,
  style,
  lightClassName,
  lightStyle,
  ...props
}) {
  const cardRef = useRef(null);
  const lightRef = useRef(null);
  const [isShowLight, setIsShowLight] = useState(false);
  const [pos, setPos] = useState({
    left: 0,
    top: 0,
  });

  return (
    <Card
      {...props}
      ref={cardRef}
      className={clsx(
        'relative overflow-hidden bg-opacity-50 backdrop-blur-lg',
        className
      )}
      style={{
        willChange: 'transform',
        transform:
          'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        ...style,
      }}
      onMouseEnter={() => {
        if (cardRef.current) {
          cardRef.current.style.transition = 'none';
        }
      }}
      onMouseLeave={() => {
        setIsShowLight(false);
        if (cardRef.current) {
          cardRef.current.style.transition = 'transform 0.5s ease-out';
          cardRef.current.style.transform =
            'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        }
      }}
      onMouseMove={(e) => {
        if (cardRef.current) {
          setIsShowLight(true);

          const { x, y, width, height } = cardRef.current.getBoundingClientRect();
          const { clientX, clientY } = e;

          const offsetX = clientX - x;
          const offsetY = clientY - y;

          const lightWidth = lightStyle?.width?.toString() || '100';
          const lightHeight = lightStyle?.height?.toString() || '100';
          const lightWidthNum = parseInt(lightWidth);
          const lightHeightNum = parseInt(lightHeight);

          const left = offsetX - lightWidthNum / 2;
          const top = offsetY - lightHeightNum / 2;

          setPos({
            left,
            top,
          });

          const rangeX = width / 2;
          const rangeY = height / 2;

          const rotateX = ((offsetY - rangeY) / rangeY) * maxXRotation;
          const rotateY = -1 * ((offsetX - rangeX) / rangeX) * maxYRotation;

          cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        }
      }}
    >
      <div
        ref={lightRef}
        className={clsx(
          isShowLight ? 'opacity-100' : 'opacity-0',
          'absolute rounded-full blur-[150px] filter transition-opacity duration-300 dark:bg-[#f31260] bg-[#f31260] w-[100px] h-[100px]',
          lightClassName
        )}
        style={{
          ...pos,
          ...lightStyle,
        }}
      />
      {children}
    </Card>
  );
}
