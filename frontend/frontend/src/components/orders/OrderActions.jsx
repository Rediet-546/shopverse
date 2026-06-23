import React, { useState } from 'react';
import { 
  FaCheck, 
  FaTimes, 
  FaTruck, 
  FaBox,
  FaPrint,
  FaEnvelope,
  FaDownload,
  FaShare
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import '../../styles/orders.css';

const OrderActions = ({ order, onStatusUpdate, onCancel, userRole }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action, status) => {
    setIsLoading(true);
    try {
      await onStatusUpdate(status);
      toast.success(`Order ${status} successfully`);
    } catch (error) {
      toast.error(error || `Failed to ${action}`);
    } finally {
      setIsLoading(false);
    }
  };

  const canCancel = ['pending', 'confirmed'].includes(order.status);
  const canConfirm = order.status === 'pending';
  const canProcess = order.status === 'confirmed';
  const canShip = order.status === 'processing';
  const canDeliver = order.status === 'shipped';

  const isAdmin = userRole === 'admin';
  const isVendor = userRole === 'vendor';

  // Vendor can only update shipping status
  const canVendorAct = isVendor && ['processing', 'shipped'].includes(order.status);

  if (!isAdmin && !isVendor && !canCancel) {
    return null;
  }

  return (
    <div className="order-actions">
      <h3>Order Actions</h3>
      <div className="actions-grid">
        {canConfirm && (isAdmin || isVendor) && (
          <button
            className="action-btn success"
            onClick={() => handleAction('confirm', 'confirmed')}
            disabled={isLoading}
          >
            <FaCheck /> Confirm Order
          </button>
        )}

        {canProcess && (isAdmin || isVendor) && (
          <button
            className="action-btn primary"
            onClick={() => handleAction('process', 'processing')}
            disabled={isLoading}
          >
            <FaBox /> Start Processing
          </button>
        )}

        {canShip && (isAdmin || isVendor) && (
          <button
            className="action-btn info"
            onClick={() => handleAction('ship', 'shipped')}
            disabled={isLoading}
          >
            <FaTruck /> Mark as Shipped
          </button>
        )}

        {canDeliver && isAdmin && (
          <button
            className="action-btn success"
            onClick={() => handleAction('deliver', 'delivered')}
            disabled={isLoading}
          >
            <FaCheck /> Mark as Delivered
          </button>
        )}

        {canCancel && (
          <button
            className="action-btn danger"
            onClick={onCancel}
            disabled={isLoading}
          >
            <FaTimes /> Cancel Order
          </button>
        )}

        <button
          className="action-btn outline"
          onClick={() => window.print()}
        >
          <FaPrint /> Print Invoice
        </button>

        <button
          className="action-btn outline"
          onClick={() => {
            toast.success('Invoice downloaded');
          }}
        >
          <FaDownload /> Download Invoice
        </button>

        <button
          className="action-btn outline"
          onClick={() => {
            toast.success('Order receipt sent to email');
          }}
        >
          <FaEnvelope /> Email Receipt
        </button>

        <button
          className="action-btn outline"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: `Order #${order.orderNumber}`,
                url: window.location.href
              });
            } else {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Link copied to clipboard');
            }
          }}
        >
          <FaShare /> Share
        </button>
      </div>
    </div>
  );
};

export default OrderActions;