import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaBox, 
  FaUser, 
  FaEnvelope, 
  FaPhone,
  FaMapMarkerAlt,
  FaCreditCard,
  FaTruck,
  FaCheck,
  FaTimes,
  FaPrint,
  FaDownload,
  FaSyncAlt,
  FaShoppingBag,
  FaClock,
  FaCheckCircle
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { fetchOrder, updateOrderStatus } from '../../redux/slices/orderSlice'; // Changed from fetchVendorOrder to fetchOrder
import OrderStatusBadge from './OrderStatusBadge';
import OrderItems from './OrderItems';
import OrderTimeline from './OrderTimeline';
import OrderTracking from './OrderTracking';
import Loader from '../common/Loader';
import Modal from '../common/Modal';
import { formatDate, formatCurrency } from '../../utils/helpers';
import '../../styles/orders.css';

const VendorOrderDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentOrder: order, isLoading } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('details');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchOrder(id)); // Changed from fetchVendorOrder to fetchOrder
    }
  }, [dispatch, id]);

  const handleStatusUpdate = async (status) => {
    try {
      setIsSubmitting(true);
      await dispatch(updateOrderStatus({ orderId: id, status })).unwrap();
      toast.success(`Order status updated to ${status}`);
      setShowStatusModal(false);
      dispatch(fetchOrder(id)); // Changed from fetchVendorOrder to fetchOrder
    } catch (error) {
      toast.error(error || 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRefresh = () => {
    dispatch(fetchOrder(id)); // Changed from fetchVendorOrder to fetchOrder
    toast.success('Order refreshed');
  };

  const getAvailableActions = () => {
    const actions = [];
    const status = order?.status;

    if (status === 'pending') {
      actions.push({ label: 'Confirm Order', value: 'confirmed', icon: <FaCheck />, color: '#48bb78' });
    }
    if (status === 'confirmed') {
      actions.push({ label: 'Start Processing', value: 'processing', icon: <FaBox />, color: '#667eea' });
    }
    if (status === 'processing') {
      actions.push({ label: 'Mark as Shipped', value: 'shipped', icon: <FaTruck />, color: '#4299e1' });
    }
    if (status === 'shipped') {
      actions.push({ label: 'Mark as Delivered', value: 'delivered', icon: <FaCheckCircle />, color: '#38a169' });
    }
    if (status === 'pending' || status === 'confirmed') {
      actions.push({ label: 'Cancel Order', value: 'cancelled', icon: <FaTimes />, color: '#fc8181' });
    }

    return actions;
  };

  const tabs = [
    { id: 'details', label: 'Order Details' },
    { id: 'items', label: 'Items' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'tracking', label: 'Tracking' },
    { id: 'shipping', label: 'Shipping Info' }
  ];

  if (isLoading || !order) {
    return <Loader fullPage text="Loading order details..." />;
  }

  return (
    <div className="vendor-order-details">
      <div className="details-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/vendor/orders')}>
            <FaArrowLeft /> Back to Orders
          </button>
          <div className="order-info">
            <h1>Order #{order.orderNumber}</h1>
            <div className="order-meta">
              <span className="order-date">
                <FaClock /> Placed on {formatDate(order.createdAt, 'MMM DD, YYYY HH:mm')}
              </span>
              <OrderStatusBadge status={order.status} size="medium" />
            </div>
          </div>
        </div>
        <div className="header-right">
          <button className="btn btn-outline" onClick={handleRefresh}>
            <FaSyncAlt /> Refresh
          </button>
          <button className="btn btn-outline" onClick={handlePrint}>
            <FaPrint /> Print
          </button>
          <button className="btn btn-outline" onClick={() => setShowTrackModal(true)}>
            <FaTruck /> Track
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="order-quick-stats">
        <div className="stat-item">
          <FaShoppingBag className="stat-icon" />
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
          <FaUser className="stat-icon" />
          <div className="stat-content">
            <span className="stat-label">Customer</span>
            <span className="stat-value">{order.userId?.firstName} {order.userId?.lastName}</span>
          </div>
        </div>
        <div className="stat-item">
          <FaClock className="stat-icon" />
          <div className="stat-content">
            <span className="stat-label">Status</span>
            <OrderStatusBadge status={order.status} size="small" />
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="customer-info-section">
        <h3>Customer Information</h3>
        <div className="customer-grid">
          <div className="customer-detail">
            <FaUser className="detail-icon" />
            <div>
              <span className="label">Name</span>
              <span className="value">{order.userId?.firstName} {order.userId?.lastName}</span>
            </div>
          </div>
          <div className="customer-detail">
            <FaEnvelope className="detail-icon" />
            <div>
              <span className="label">Email</span>
              <span className="value">{order.userId?.email}</span>
            </div>
          </div>
          <div className="customer-detail">
            <FaPhone className="detail-icon" />
            <div>
              <span className="label">Phone</span>
              <span className="value">{order.userId?.phone || 'N/A'}</span>
            </div>
          </div>
          <div className="customer-detail">
            <FaMapMarkerAlt className="detail-icon" />
            <div>
              <span className="label">Shipping Address</span>
              <span className="value">
                {order.shipping?.address?.street}, {order.shipping?.address?.city}, 
                {order.shipping?.address?.state} {order.shipping?.address?.zipCode}
              </span>
            </div>
          </div>
        </div>
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
                <h4>Order Information</h4>
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
                    <OrderStatusBadge status={order.status} size="small" />
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
                <h4>Payment Information</h4>
                <div className="detail-row">
                  <span className="label">Method</span>
                  <span className="value">{order.payment?.method?.toUpperCase() || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Status</span>
                  <span className={`value payment-${order.payment?.status || 'pending'}`}>
                    {order.payment?.status?.toUpperCase() || 'PENDING'}
                  </span>
                </div>
                {order.payment?.transactionId && (
                  <div className="detail-row">
                    <span className="label">Transaction ID</span>
                    <span className="value">{order.payment.transactionId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {getAvailableActions().length > 0 && (
              <div className="order-actions-section">
                <h4>Update Status</h4>
                <div className="actions-grid">
                  {getAvailableActions().map((action, idx) => (
                    <button
                      key={idx}
                      className={`action-btn ${action.value}`}
                      style={{ borderColor: action.color, color: action.color }}
                      onClick={() => {
                        setStatusAction(action.value);
                        setShowStatusModal(true);
                      }}
                      disabled={isSubmitting}
                    >
                      {action.icon} {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'items' && (
          <OrderItems items={order.items} />
        )}

        {activeTab === 'timeline' && (
          <OrderTimeline order={order} />
        )}

        {activeTab === 'tracking' && (
          <OrderTracking order={order} />
        )}

        {activeTab === 'shipping' && (
          <div className="tab-shipping">
            <div className="shipping-details">
              <h4>Shipping Information</h4>
              <div className="detail-row">
                <span className="label">Method</span>
                <span className="value">{order.shipping?.method || 'Standard'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Tracking Number</span>
                <span className="value">{order.shipping?.trackingNumber || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Carrier</span>
                <span className="value">{order.shipping?.carrier || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Estimated Delivery</span>
                <span className="value">
                  {order.shipping?.estimatedDelivery 
                    ? formatDate(order.shipping.estimatedDelivery, 'MMM DD, YYYY')
                    : 'N/A'}
                </span>
              </div>
              {order.shipping?.shippedDate && (
                <div className="detail-row">
                  <span className="label">Shipped Date</span>
                  <span className="value">{formatDate(order.shipping.shippedDate, 'MMM DD, YYYY')}</span>
                </div>
              )}
              <div className="shipping-address">
                <h5>Shipping Address</h5>
                <p>{order.shipping?.address?.street}</p>
                <p>{order.shipping?.address?.city}, {order.shipping?.address?.state} {order.shipping?.address?.zipCode}</p>
                <p>{order.shipping?.address?.country}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Order Status</h3>
              <button className="modal-close" onClick={() => setShowStatusModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-message">
                Are you sure you want to mark this order as{' '}
                <strong>{statusAction.toUpperCase()}</strong>?
              </p>
              <div className="modal-actions">
                <button 
                  className="btn btn-outline"
                  onClick={() => setShowStatusModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleStatusUpdate(statusAction)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : `Confirm ${statusAction}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Track Modal */}
      {showTrackModal && (
        <div className="modal-overlay" onClick={() => setShowTrackModal(false)}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Track Order</h3>
              <button className="modal-close" onClick={() => setShowTrackModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <OrderTracking order={order} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorOrderDetails;