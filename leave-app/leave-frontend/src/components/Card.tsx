
import React from 'react';
import CardMui from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <CardMui style={style} elevation={3}>
    <CardContent>
      {children}
    </CardContent>
  </CardMui>
);

export default Card;
