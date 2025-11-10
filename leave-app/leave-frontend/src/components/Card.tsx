
import React from 'react';
import CardMui from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  sx?: SxProps<Theme>;
  /** When true, card stretches full-width on xs and constrains progressively on larger screens */
  responsive?: boolean;
  /** Optional flag to reduce vertical spacing for dense areas */
  dense?: boolean;
  /** Override elevation; defaults responsive (1 on xs, 3 otherwise) */
  elevation?: number;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  sx,
  responsive = true,
  dense = false,
  elevation,
}) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  const computedElevation = elevation ?? (isXs ? 1 : 3);

  return (
    <CardMui
      style={style}
      elevation={computedElevation}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        width: responsive ? '100%' : 'auto',
        maxWidth: responsive ? { xs: '100%', sm: 560, md: 720 } : 'none',
        transition: 'box-shadow .25s ease, transform .25s ease',
        '&:hover': {
          boxShadow: isMdUp ? theme.shadows[6] : undefined,
          transform: isMdUp ? 'translateY(-2px)' : 'none',
        },
        // Allow consumer overrides last
        ...sx,
      }}
    >
      <CardContent
        sx={{
          p: dense ? { xs: 1.25, sm: 1.5, md: 2 } : { xs: 2, sm: 2.5, md: 3 },
          '&:last-child': { pb: dense ? { xs: 1.25, sm: 1.5, md: 2 } : { xs: 2, sm: 2.5, md: 3 } },
        }}
      >
        {children}
      </CardContent>
    </CardMui>
  );
};

export default Card;
