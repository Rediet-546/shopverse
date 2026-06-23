import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FaSave, 
  FaTimes, 
  FaPlus, 
  FaTrash,
  FaImage,
  FaUpload,
  FaTags,
  FaBox,
  FaDollarSign,
  FaPercent,
  FaInfoCircle
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { createProduct, updateProduct, fetchProduct } from '../../redux/slices/productSlice';
import { fetchCategories } from '../../redux/slices/categorySlice';
import Input from '../common/Input';
import Button from '../common/Button';
import Loader from '../common/Loader';
import ImageUpload from '../common/ImageUpload';
import '../../styles/products.css';

const ProductForm = ({ mode = 'create', vendorMode = false }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { currentProduct, isLoading } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.categories);
  const { user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    subCategory: '',
    price: '',
    discount: '',
    stockQuantity: '',
    stockThreshold: '10',
    images: [],
    attributes: {
      color: [],
      size: [],
      material: '',
      weight: ''
    },
    isActive: true,
    isFeatured: false,
    tags: [],
    shippingCost: '0',
    isFreeShipping: false,
    isDigital: false
  });

  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');
  const [attributeInputs, setAttributeInputs] = useState({
    color: '',
    size: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
    if (mode === 'edit' && id) {
      dispatch(fetchProduct(id));
    }
  }, [dispatch, mode, id]);

  useEffect(() => {
    if (mode === 'edit' && currentProduct) {
      setFormData({
        name: currentProduct.name || '',
        description: currentProduct.description || '',
        category: currentProduct.category || '',
        subCategory: currentProduct.subCategory || '',
        price: currentProduct.price || '',
        discount: currentProduct.discount || '',
        stockQuantity: currentProduct.stockQuantity || '',
        stockThreshold: currentProduct.stockThreshold || '10',
        images: currentProduct.images || [],
        attributes: currentProduct.attributes || {
          color: [],
          size: [],
          material: '',
          weight: ''
        },
        isActive: currentProduct.isActive !== undefined ? currentProduct.isActive : true,
        isFeatured: currentProduct.isFeatured || false,
        tags: currentProduct.tags || [],
        shippingCost: currentProduct.shippingCost || '0',
        isFreeShipping: currentProduct.isFreeShipping || false,
        isDigital: currentProduct.isDigital || false
      });
    }
  }, [currentProduct, mode]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handleArrayAdd = (field, value) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], value.trim()]
    }));
    if (field === 'tags') setTagInput('');
    if (field === 'attributes.color') setAttributeInputs(prev => ({ ...prev, color: '' }));
    if (field === 'attributes.size') setAttributeInputs(prev => ({ ...prev, size: '' }));
  };

  const handleArrayRemove = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = (images) => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...images]
    }));
  };

  const handleImageRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    if (formData.discount && (parseFloat(formData.discount) < 0 || parseFloat(formData.discount) > 100)) {
      newErrors.discount = 'Discount must be between 0 and 100';
    }
    if (!formData.stockQuantity || parseInt(formData.stockQuantity) < 0) {
      newErrors.stockQuantity = 'Stock must be 0 or greater';
    }
    if (formData.images.length === 0) {
      newErrors.images = 'At least one product image is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error('Please fix the form errors');
      return;
    }

    setIsSubmitting(true);
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        discount: parseFloat(formData.discount) || 0,
        stockQuantity: parseInt(formData.stockQuantity),
        stockThreshold: parseInt(formData.stockThreshold) || 10,
        shippingCost: parseFloat(formData.shippingCost) || 0,
        vendorId: vendorMode ? user?.id : formData.vendorId
      };

      let result;
      if (mode === 'edit') {
        result = await dispatch(updateProduct({ id, productData })).unwrap();
        toast.success('Product updated successfully');
      } else {
        result = await dispatch(createProduct(productData)).unwrap();
        toast.success('Product created successfully');
      }

      navigate(vendorMode ? '/vendor/products' : '/products');
    } catch (error) {
      toast.error(error || `Failed to ${mode} product`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && mode === 'edit') {
    return <Loader fullPage text="Loading product..." />;
  }

  return (
    <div className="product-form-container">
      <div className="form-header">
        <h1>{mode === 'edit' ? 'Edit Product' : 'Add New Product'}</h1>
        <button className="btn btn-outline" onClick={() => navigate(-1)}>
          <FaTimes /> Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-grid">
          {/* Basic Information */}
          <div className="form-section">
            <h2>Basic Information</h2>
            
            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter product name"
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your product"
                rows="5"
                className={errors.description ? 'error' : ''}
              />
              {errors.description && <span className="error-message">{errors.description}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={errors.category ? 'error' : ''}
                >
                  <option value="">Select Category</option>
                  {categories?.map(cat => (
                    <option key={cat._id || cat} value={cat._id || cat}>
                      {cat.name || cat}
                    </option>
                  ))}
                </select>
                {errors.category && <span className="error-message">{errors.category}</span>}
              </div>

              <div className="form-group">
                <label>Sub Category</label>
                <input
                  type="text"
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleInputChange}
                  placeholder="e.g., Electronics > Laptops"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="form-section">
            <h2>Pricing & Stock</h2>

            <div className="form-row">
              <div className="form-group">
                <label>Price *</label>
                <div className="input-with-icon">
                  <FaDollarSign className="input-icon" />
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className={errors.price ? 'error' : ''}
                  />
                </div>
                {errors.price && <span className="error-message">{errors.price}</span>}
              </div>

              <div className="form-group">
                <label>Discount %</label>
                <div className="input-with-icon">
                  <FaPercent className="input-icon" />
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>
                {errors.discount && <span className="error-message">{errors.discount}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Stock Quantity *</label>
                <div className="input-with-icon">
                  <FaBox className="input-icon" />
                  <input
                    type="number"
                    name="stockQuantity"
                    value={formData.stockQuantity}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    className={errors.stockQuantity ? 'error' : ''}
                  />
                </div>
                {errors.stockQuantity && <span className="error-message">{errors.stockQuantity}</span>}
              </div>

              <div className="form-group">
                <label>Stock Threshold</label>
                <input
                  type="number"
                  name="stockThreshold"
                  value={formData.stockThreshold}
                  onChange={handleInputChange}
                  placeholder="10"
                  min="0"
                />
                <span className="helper-text">Low stock alert threshold</span>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Shipping Cost</label>
                <div className="input-with-icon">
                  <FaDollarSign className="input-icon" />
                  <input
                    type="number"
                    name="shippingCost"
                    value={formData.shippingCost}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group checkbox">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isFreeShipping"
                    checked={formData.isFreeShipping}
                    onChange={handleInputChange}
                  />
                  <span>Free Shipping</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isDigital"
                    checked={formData.isDigital}
                    onChange={handleInputChange}
                  />
                  <span>Digital Product</span>
                </label>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="form-section">
            <h2>Product Images</h2>
            <ImageUpload
              images={formData.images}
              onUpload={handleImageUpload}
              onRemove={handleImageRemove}
              maxFiles={5}
              error={errors.images}
            />
            {errors.images && <span className="error-message">{errors.images}</span>}
          </div>

          {/* Attributes */}
          <div className="form-section">
            <h2>Attributes</h2>

            <div className="form-group">
              <label>Colors</label>
              <div className="array-input">
                <input
                  type="text"
                  value={attributeInputs.color}
                  onChange={(e) => setAttributeInputs(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="Add color (e.g., Red)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleArrayAdd('attributes.color', attributeInputs.color);
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-small"
                  onClick={() => handleArrayAdd('attributes.color', attributeInputs.color)}
                >
                  <FaPlus /> Add
                </button>
              </div>
              <div className="tag-list">
                {formData.attributes.color?.map((color, index) => (
                  <span key={index} className="tag-item">
                    {color}
                    <button type="button" onClick={() => handleArrayRemove('attributes.color', index)}>
                      <FaTimes />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Sizes</label>
              <div className="array-input">
                <input
                  type="text"
                  value={attributeInputs.size}
                  onChange={(e) => setAttributeInputs(prev => ({ ...prev, size: e.target.value }))}
                  placeholder="Add size (e.g., Large)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleArrayAdd('attributes.size', attributeInputs.size);
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-small"
                  onClick={() => handleArrayAdd('attributes.size', attributeInputs.size)}
                >
                  <FaPlus /> Add
                </button>
              </div>
              <div className="tag-list">
                {formData.attributes.size?.map((size, index) => (
                  <span key={index} className="tag-item">
                    {size}
                    <button type="button" onClick={() => handleArrayRemove('attributes.size', index)}>
                      <FaTimes />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Material</label>
                <input
                  type="text"
                  name="attributes.material"
                  value={formData.attributes.material}
                  onChange={(e) => handleNestedChange('attributes', 'material', e.target.value)}
                  placeholder="e.g., Cotton, Leather"
                />
              </div>
              <div className="form-group">
                <label>Weight (kg)</label>
                <input
                  type="number"
                  name="attributes.weight"
                  value={formData.attributes.weight}
                  onChange={(e) => handleNestedChange('attributes', 'weight', e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="form-section">
            <h2>Tags</h2>
            <div className="form-group">
              <div className="array-input">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tag (e.g., New, Sale, Popular)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleArrayAdd('tags', tagInput);
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-small"
                  onClick={() => handleArrayAdd('tags', tagInput)}
                >
                  <FaPlus /> Add
                </button>
              </div>
              <div className="tag-list">
                {formData.tags?.map((tag, index) => (
                  <span key={index} className="tag-item">
                    <FaTags /> {tag}
                    <button type="button" onClick={() => handleArrayRemove('tags', index)}>
                      <FaTimes />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="form-section">
            <h2>Status</h2>
            <div className="form-row">
              <div className="form-group checkbox">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                  <span>Active (visible in store)</span>
                </label>
              </div>
              <div className="form-group checkbox">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleInputChange}
                  />
                  <span>Featured Product</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                {mode === 'edit' ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <FaSave /> {mode === 'edit' ? 'Update Product' : 'Create Product'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;