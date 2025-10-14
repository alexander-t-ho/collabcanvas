const CURSOR_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
  ];
  
  export const generateRandomColor = (): string => {
    return CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];
  };