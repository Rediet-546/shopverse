import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaPrint, 
  FaDownload, 
  FaShare,
  FaBox,
  FaTruck,
  FaCreditCard,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhone,
  FaUser,
  FaCheck,
  FaTimes,
  FaClock,
  FaShippingFast,
  FaPackage
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { fetchOrder, updateOrderStatus, cancelOrder } from '../../redux/slices/orderSlice';
import OrderItems from './OrderItems';
import OrderTimeline from './OrderTimeline';
import OrderSummary from './OrderSummary';
import OrderStatusBadge from './OrderStatusBadge';
import OrderActions from './OrderActions';
import OrderTracking from './OrderTracking';
import OrderShipping from './OrderShipping';
import OrderPayment from './OrderPayment';
import Loader from '../common/Loader';
import Modal from '../common/Modal';
import { formatDate, formatCurrency } from '../../utils/helpers';
import '../../styles/orders.css';

const OrderDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentOrder: order, isLoading } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('details');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showTrackModal, setShowTrackModal] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchOrder(id));
    }
  }, [dispatch, id]);

  const handleStatusUpdate = async (status) => {
    try {
      await dispatch(updateOrderStatus({ orderId: id, status })).unwrap();
      toast.success(`Order status updated to ${status}`);
      dispatch(fetchOrder(id));
    } catch (error) {
      toast.error(error || 'Failed to update status');
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    try {
      await dispatch(cancelOrder({ orderId: id, reason: cancelReason })).unwrap();
      toast.success('Order cancelled successfully');
      setShowCancelModal(false);
      dispatch(fetchOrder(id));
    } catch (error) {
      toast.error(error || 'Failed to cancel order');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Order #${order?.orderNumber}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  if (isLoading || !order) {
    return <Loader fullPage text="Loading order details..." />;
  }

  const tabs = [
    { id: 'details', label: 'Order Details' },
    { id: 'items', label: 'Items' },
    { id: 'tracking', label: 'Tracking' },
    { id: 'shipping', label: 'Shipping' },
    { id: 'payment', label: 'Payment' }
  ];

  return (
    <div className="order-details-page">
      {/* Header */}
      <div className="order-details-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Back
          </button>
          <div className="order-info">
            <h1>Order #{order.orderNumber}</h1>
            <div className="order-meta">
              <span className="order-date">
                Placed on {formatDate(order.createdAt, 'MMM DD, YYYY')}
              </span>
              <OrderStatusBadge status={order.status} size="large" />
            </div>
          </div>
        </div>
        <div className="header-right">
          <button className="btn btn-outline" onClick={handlePrint}>
            <FaPrint /> Print
          </button>
          <button className="btn btn-outline" onClick={handleShare}>
            <FaShare /> Share
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="order-quick-stats">
        <div className="stat-item">
          <FaPackage className="stat-icon" />
          <div className="stat-content">
            <span className="stat-label">Total Items</span>
            <span className="stat-value">{order.items?.length || 0}</span>
          </div>
        </div>
        <div className="stat-item">
          <FaCreditCard className="stat-icon" />
          <div className="stat-content">
            <span className="stat-label">Total Amount</span>
            <span className="stat-value">{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>
        <div className="stat-item">
          <FaClock className="stat-icon" />
          <div className="stat-content">
            <span className="stat-label">Status</span>
            <span className="stat-value">
              <OrderStatusBadge status={order.status} />
            </span>
          </div>
        </div>
        {order.payment?.status && (
          <div className="stat-item">
            <FaCreditCard className="stat-icon" />
            <div className="stat-content">
              <span className="stat-label">Payment</span>
              <span className={`stat-value payment-${order.payment.status}`}>
                {order.payment.status.charAt(0).toUpperCase() + order.payment.status.slice(1)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="order-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="order-tab-content">
        {activeTab === 'details' && (
          <div className="tab-details">
            <div className="details-grid">
              <div className="details-section">
                <h3>Order Information</h3>
                <div className="detail-row">
                  <span className="label">Order Number</span>
                  <span className="value">#{order.orderNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Date Placed</span>
                  <span className="value">{formatDate(order.createdAt, 'MMM DD, YYYY HH:mm')}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Last Updated</span>
                  <span className="value">{formatDate(order.updatedAt, 'MMM DD, YYYY HH:mm')}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Status</span>
                  <span className="value">
                    <OrderStatusBadge status={order.status} />
                  </span>
                </div>
                {order.notes && (
                  <div className="detail-row">
                    <span className="label">Notes</span>
                    <span className="value">{order.notes}</span>
                  </div>
                )}
              </div>

              <div className="details-section">
                <h3>Customer Information</h3>
                <div className="detail-row">
                  <span className="label"><FaUser /> Name</span>
                  <span className="value">{order.userId?.firstName} {order.userId?.lastName}</span>
                </div>
                <div className="detail-row">
                  <span className="label"><FaEnvelope /> Email</span>
                  <span className="value">{order.userId?.email}</span>
                </div>
                <div className="detail-row">
                  <span className="label"><FaPhone /> Phone</span>
                  <span className="value">{order.userId?.phone || 'N/A'}</span>
                </div>
              </div>

              <div className="details-section">
                <h3>Shipping Address</h3>
                <div className="address-display">
                  <p>{order.shipping?.address?.street}</p>
                  <p>{order.shipping?.address?.city}, {order.shipping?.address?.state} {order.shipping?.address?.zipCode}</p>
                  <p>{order.shipping?.address?.country}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="order-timeline-section">
              <h3>Order Timeline</h3>
              <OrderTimeline order={order} />
            </div>

            {/* Actions */}
            <div className="order-actions-section">
              <OrderActions 
                order={order}
                onStatusUpdate={handleStatusUpdate}
                onCancel={() => setShowCancelModal(true)}
                userRole={user?.role}
              />
            </div>
          </div>
        )}

        {activeTab === 'items' && (
          <OrderItems items={order.items} />
        )}

        {activeTab === 'tracking' && (
          <OrderTracking 
            order={order}
            onTrack={handleStatusUpdate}
          />
        )}

        {activeTab === 'shipping' && (
          <OrderShipping order={order} />
        )}

        {activeTab === 'payment' && (
          <OrderPayment order={order} />
        )}
      </div>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setCancelReason('');
        }}
        title="Cancel Order"
      >
        <div className="cancel-order-modal">
          <p>Are you sure you want to cancel this order?</p>
          <div className="form-group">
            <label htmlFor="cancelReason">Reason for cancellation</label>
            <textarea
              id="cancelReason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please provide a reason..."
              className="form-control"
            />
          </div>
          <div className="modal-actions">
            <button 
              className="btn btn-outline"
              onClick={() => {
                setShowCancelModal(false);
                setCancelReason('');
              }}
            >
              Keep Order
            </button>
            <button 
              className="btn btn-danger"
              onClick={handleCancelOrder}
              disabled={!cancelReason.trim()}
            >
              Yes, Cancel Order
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrderDetails;