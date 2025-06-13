import { useEffect, useState } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

export const useResponsiveDimensions = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const onChange = ({ window }: { window: ScaledSize }) => {
      setDimensions(window);
    };

    const subscription = Dimensions.addEventListener('change', onChange);

    return () => {
      subscription.remove();
    };
  }, []);

  return {
    screenWidth: dimensions.width,
    screenHeight: dimensions.height,
  };
};