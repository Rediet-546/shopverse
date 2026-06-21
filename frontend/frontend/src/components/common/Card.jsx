import React from 'react';
import '../../styles/card.css';

const Card = ({
  children,
  className = '',
  padding = 'medium',
  shadow = 'medium',
  hover = false,
  onClick,
  ...props
}) => {
  const paddingClass = {
    none: 'card-padding-none',
    small: 'card-padding-small',
    medium: 'card-padding-medium',
    large: 'card-padding-large'
  };

  const shadowClass = {
    none: 'card-shadow-none',
    small: 'card-shadow-small',
    medium: 'card-shadow-medium',
    large: 'card-shadow-large'
  };

  const classes = [
    'card',
    paddingClass[padding],
    shadowClass[shadow],
    hover && 'card-hover',
    onClick && 'card-clickable',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick} {...props}>
      {children}
    </div>
  );
};

// Card Header
export const CardHeader = ({ children, className = '' }) => (
  <div className={`card-header ${className}`}>{children}</div>
);

// Card Body
export const CardBody = ({ children, className = '' }) => (
  <div className={`card-body ${className}`}>{children}</div>
);

// Card Footer
export const CardFooter = ({ children, className = '' }) => (
  <div className={`card-footer ${className}`}>{children}</div>
);

// Card Image
export const CardImage = ({ src, alt, className = '' }) => (
  <div className={`card-image ${className}`}>
    <img src={src} alt={alt} />
  </div>
);

export default Card;