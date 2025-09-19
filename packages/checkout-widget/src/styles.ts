const containerStyle = ({ primaryColor }: { primaryColor?: string }): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px',
  border: `2px solid ${primaryColor || '#007bff'}`,
  borderRadius: '8px',
  maxWidth: '300px',
  fontFamily: 'Arial, sans-serif',
});

const labelStyle: React.CSSProperties = {
  color: '#96969B',
  fontSize: '14px',
  fontWeight: 500,
  marginBottom: '16px',
  textAlign: 'center',
  opacity: 0.7,
};

const qrStyle = ({ primaryColor }: { primaryColor?: string }): React.CSSProperties => ({
  maxWidth: '200px',
  maxHeight: '200px',
  border: `4px solid ${primaryColor || '#373737'}`,
  borderRadius: '17px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 32px auto',
  padding: '16px',
});

const loadingStyle = ({ primaryColor }: { primaryColor?: string }): React.CSSProperties => ({
  color: primaryColor || '#007bff',
  fontSize: '14px',
});

const cardStyles = ({ primaryColor }: { primaryColor?: string }): React.CSSProperties => {
  const color = primaryColor || '#007bff';
  
  // Convert color to RGB for alpha transparency
  const colorToRgb = (colorInput: string) => {
    // Handle hex colors
    const hexResult = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colorInput);
    if (hexResult) {
      return {
        r: parseInt(hexResult[1], 16),
        g: parseInt(hexResult[2], 16),
        b: parseInt(hexResult[3], 16)
      };
    }
    
    // Handle CSS color names and other formats
    const colorMap: { [key: string]: { r: number; g: number; b: number } } = {
      'red': { r: 255, g: 0, b: 0 },
      'green': { r: 0, g: 128, b: 0 },
      'blue': { r: 0, g: 0, b: 255 },
      'yellow': { r: 255, g: 255, b: 0 },
      'purple': { r: 128, g: 0, b: 128 },
      'orange': { r: 255, g: 165, b: 0 },
      'pink': { r: 255, g: 192, b: 203 },
      'cyan': { r: 0, g: 255, b: 255 },
      'lime': { r: 0, g: 255, b: 0 },
      'magenta': { r: 255, g: 0, b: 255 },
      'black': { r: 0, g: 0, b: 0 },
      'white': { r: 255, g: 255, b: 255 },
      'gray': { r: 128, g: 128, b: 128 },
      'grey': { r: 128, g: 128, b: 128 },
    };
    
    const lowerColor = colorInput.toLowerCase();
    if (colorMap[lowerColor]) {
      return colorMap[lowerColor];
    }
    
    // Fallback to blue
    return { r: 0, g: 123, b: 255 };
  };
  
  const rgb = colorToRgb(color);
  
  return {
    width: '100%',
    maxWidth: '400px',
    minWidth: '300px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: `0 8px 32px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4), 0 16px 64px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`,
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };
};

const mainContentStyles: React.CSSProperties = {
  padding: '48px 32px',
  textAlign: 'center',
};

const labelStyles: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '14px',
  marginBottom: '8px',
  fontWeight: '400',
};

const amountStyles: React.CSSProperties = {
  fontSize: '36px',
  fontWeight: 'bold',
  color: '#111827',
  margin: '0',
};

const footerStyles: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  padding: '16px 24px',
  textAlign: 'center',
  borderTop: '1px solid #f3f4f6',
};

const footerContentStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
};

const poweredByTextStyles: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '14px',
};

const logoContainerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
};

export {
  amountStyles,
  cardStyles,
  containerStyle,
  footerContentStyles,
  footerStyles,
  labelStyle,
  labelStyles,
  loadingStyle,
  logoContainerStyles,
  mainContentStyles,
  poweredByTextStyles,
  qrStyle,
};
