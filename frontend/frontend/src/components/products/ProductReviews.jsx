import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaStar, FaStarHalfAlt, FaRegStar, FaUser, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { formatDate } from '../../utils/helpers';
import '../../styles/products.css';

const ProductReviews = ({ productId, reviews, onAddReview }) => {
  const { user } = useSelector((state) => state.auth);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    title: '',
    comment: ''
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const averageRating = reviews?.reduce((sum, r) => sum + r.rating, 0) / (reviews?.length || 1) || 0;
  const ratingCount = reviews?.length || 0;

  const ratingDistribution = [1, 2, 3, 4, 5].map(star => {
    const count = reviews?.filter(r => Math.floor(r.rating) === star).length || 0;
    return {
      star,
      count,
      percentage: ratingCount > 0 ? (count / ratingCount) * 100 : 0
    };
  });

  const handleRatingClick = (rating) => {
    setReviewData(prev => ({ ...prev, rating }));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewData.comment.trim()) {
      toast.error('Please write a review');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddReview(productId, reviewData);
      setReviewData({ rating: 5, title: '', comment: '' });
      setShowReviewForm(false);
    } catch (error) {
      toast.error(error || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating, size = 'small') => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`star-${i}`} className={`star-filled ${size}`} />);
    }

    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="star-half" className={`star-half ${size}`} />);
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`star-empty-${i}`} className={`star-empty ${size}`} />);
    }

    return stars;
  };

  return (
    <div className="product-reviews">
      <div className="reviews-header">
        <h3>Customer Reviews</h3>
        <div className="reviews-summary">
          <div className="average-rating">
            <span className="rating-number">{averageRating.toFixed(1)}</span>
            <div className="stars">{renderStars(averageRating, 'medium')}</div>
            <span className="rating-count">{ratingCount} reviews</span>
          </div>
        </div>
      </div>

      <div className="reviews-content">
        {/* Rating Distribution */}
        <div className="rating-distribution">
          {ratingDistribution.reverse().map(({ star, percentage }) => (
            <div key={star} className="distribution-row">
              <span className="star-label">{star} ★</span>
              <div className="distribution-bar">
                <div className="distribution-fill" style={{ width: `${percentage}%` }} />
              </div>
              <span className="distribution-count">{Math.round(percentage)}%</span>
            </div>
          ))}
        </div>

        {/* Write Review Button */}
        {user && !showReviewForm && (
          <button 
            className="btn btn-primary write-review-btn"
            onClick={() => setShowReviewForm(true)}
          >
            Write a Review
          </button>
        )}

        {/* Review Form */}
        {showReviewForm && (
          <div className="review-form">
            <h4>Write Your Review</h4>
            <form onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label>Rating</label>
                <div className="rating-select">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className="rating-star-btn"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => handleRatingClick(star)}
                    >
                      {star <= (hoverRating || reviewData.rating) ? (
                        <FaStar className="star-filled large" />
                      ) : (
                        <FaRegStar className="star-empty large" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={reviewData.title}
                  onChange={(e) => setReviewData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Summarize your experience"
                />
              </div>

              <div className="form-group">
                <label>Review</label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Share your experience with this product..."
                  rows="4"
                  required
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setShowReviewForm(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reviews List */}
        <div className="reviews-list">
          {reviews?.length > 0 ? (
            reviews.map((review, index) => (
              <div key={index} className="review-item">
                <div className="review-header">
                  <div className="reviewer-info">
                    <div className="reviewer-avatar">
                      <FaUser />
                    </div>
                    <div className="reviewer-details">
                      <span className="reviewer-name">{review.userId?.firstName || 'Anonymous'}</span>
                      <span className="review-date">{formatDate(review.date, 'MMM DD, YYYY')}</span>
                    </div>
                  </div>
                  <div className="review-rating">
                    {renderStars(review.rating)}
                  </div>
                </div>
                {review.title && <h5 className="review-title">{review.title}</h5>}
                <p className="review-comment">{review.comment}</p>
                {review.verified && (
                  <span className="verified-badge">✓ Verified Purchase</span>
                )}
                <div className="review-actions">
                  <button className="helpful-btn">
                    <FaThumbsUp /> Helpful
                  </button>
                  <button className="not-helpful-btn">
                    <FaThumbsDown />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-reviews">
              <p>No reviews yet. Be the first to review this product!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductReviews;