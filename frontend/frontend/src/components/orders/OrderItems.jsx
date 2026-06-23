import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/helpers';
import '../../styles/orders.css';

const OrderItems = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <div className="order-items-empty">
        <p>No items in this order</p>
      </div>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalDiscount = items.reduce((sum, item) => sum + ((item.price - item.total) * item.quantity), 0);

  return (
    <div className="order-items">
      <div className="items-header">
        <h3>Order Items</h3>
        <span className="items-count">{items.length} items</span>
      </div>

      <div className="items-table-wrapper">
        <table className="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Discount</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="item-row">
                <td className="item-product">
                  <div className="item-image">
                    <img 
                      src={item.image || '/placeholder-product.jpg'} 
                      alt={item.name}
                      loading="lazy"
                    />
                  </div>
                  <div className="item-info">
                    <Link to={`/products/${item.productId}`} className="item-name">
                      {item.name}
                    </Link>
                    {item.variant && (
                      <div className="item-variant">
                        {Object.entries(item.variant).map(([key, value]) => (
                          <span key={key} className="variant-tag">
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="item-price">{formatCurrency(item.price)}</td>
                <td className="item-quantity">{item.quantity}</td>
                <td className="item-discount">
                  {item.discount > 0 ? (
                    <span className="discount-value">
                      -{Math.round(item.discount)}%
                    </span>
                  ) : (
                    <span className="no-discount">-</span>
                  )}
                </td>
                <td className="item-total">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="subtotal-row">
              <td colSpan="3"></td>
              <td>Subtotal</td>
              <td>{formatCurrency(subtotal)}</td>
            </tr>
            {totalDiscount > 0 && (
              <tr className="discount-row">
                <td colSpan="3"></td>
                <td>Discount</td>
                <td>-{formatCurrency(totalDiscount)}</td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default OrderItems;