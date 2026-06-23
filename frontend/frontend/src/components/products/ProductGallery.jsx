import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import '../../styles/products.css';

const ProductGallery = ({ images = [], thumbnailPosition = 'bottom' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const hasMultiple = images.length > 1;

  const goToPrevious = () => {
    setCurrentIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
  };

  const goToNext = () => {
    setCurrentIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    document.body.style.overflow = 'unset';
  };

  const goToLightboxPrevious = () => {
    setLightboxIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
  };

  const goToLightboxNext = () => {
    setLightboxIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
  };

  const getThumbnailClass = () => {
    return thumbnailPosition === 'bottom' ? 'thumbnails-bottom' : 'thumbnails-left';
  };

  if (!images || images.length === 0) {
    return (
      <div className="product-gallery">
        <div className="main-image-placeholder">
          <img src="/placeholder-product.jpg" alt="Product" />
        </div>
      </div>
    );
  }

  return (
    <div className="product-gallery">
      <div className="gallery-container">
        <div className="main-image-wrapper">
          <img
            src={images[currentIndex]?.url || '/placeholder-product.jpg'}
            alt={images[currentIndex]?.alt || 'Product image'}
            className="main-image"
            onClick={() => openLightbox(currentIndex)}
          />
          
          {hasMultiple && (
            <>
              <button className="gallery-nav prev" onClick={goToPrevious}>
                <FaChevronLeft />
              </button>
              <button className="gallery-nav next" onClick={goToNext}>
                <FaChevronRight />
              </button>
              <span className="image-counter">
                {currentIndex + 1} / {images.length}
              </span>
            </>
          )}
        </div>

        {hasMultiple && (
          <div className={`thumbnails ${getThumbnailClass()}`}>
            {images.map((image, index) => (
              <button
                key={index}
                className={`thumbnail-btn ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
              >
                <img src={image.url} alt={image.alt || `Thumbnail ${index + 1}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div className="lightbox" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox}>
              <FaTimes />
            </button>
            <button className="lightbox-nav prev" onClick={goToLightboxPrevious}>
              <FaChevronLeft />
            </button>
            <img
              src={images[lightboxIndex]?.url}
              alt={images[lightboxIndex]?.alt || 'Product image'}
              className="lightbox-image"
            />
            <button className="lightbox-nav next" onClick={goToLightboxNext}>
              <FaChevronRight />
            </button>
            <span className="lightbox-counter">
              {lightboxIndex + 1} / {images.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductGallery;