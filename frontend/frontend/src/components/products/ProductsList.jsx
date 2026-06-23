import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  FaPlus, 
  FaSearch, 
  FaFilter, 
  FaThLarge, 
  FaList,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye,
  FaEdit,
  FaTrash,
  FaCopy,
  FaToggleOn,
  FaToggleOff,
  FaDownload
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { 
  fetchProducts, 
  deleteProduct, 
  toggleProductStatus 
} from '../../redux/slices/productSlice';
import ProductCard from './ProductCard';
import ProductFilters from './ProductFilters';
import Pagination from '../common/Pagination';
import Loader from '../common/Loader';
import Modal from '../common/Modal';
import { formatCurrency } from '../../utils/helpers';
import '../../styles/products.css';

const ProductsList = () => {
  const dispatch = useDispatch();
  const { products, isLoading, error, total, pages } = useSelector((state) => state.products);
  const { user } = useSelector((state) => state.auth);

  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    status: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 12
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1 }));
    dispatch(fetchProducts(filters));
  };

  const handleSort = (field) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'desc' ? 'asc' : 'desc',
      page: 1
    }));
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      await dispatch(deleteProduct(productToDelete)).unwrap();
      toast.success('Product deleted successfully');
      setShowDeleteModal(false);
      setProductToDelete(null);
      dispatch(fetchProducts(filters));
    } catch (error) {
      toast.error(error || 'Failed to delete product');
    }
  };

  const handleToggleStatus = async (productId, currentStatus) => {
    try {
      await dispatch(toggleProductStatus({ id: productId, isActive: !currentStatus })).unwrap();
      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'}`);
      dispatch(fetchProducts(filters));
    } catch (error) {
      toast.error(error || 'Failed to update product status');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product');
      return;
    }

    try {
      if (action === 'delete') {
        if (!window.confirm(`Delete ${selectedProducts.length} products?`)) return;
        await Promise.all(selectedProducts.map(id => dispatch(deleteProduct(id)).unwrap()));
        toast.success(`${selectedProducts.length} products deleted`);
      } else if (action === 'activate') {
        await Promise.all(selectedProducts.map(id => 
          dispatch(toggleProductStatus({ id, isActive: true })).unwrap()
        ));
        toast.success(`${selectedProducts.length} products activated`);
      } else if (action === 'deactivate') {
        await Promise.all(selectedProducts.map(id => 
          dispatch(toggleProductStatus({ id, isActive: false })).unwrap()
        ));
        toast.success(`${selectedProducts.length} products deactivated`);
      }
      setSelectedProducts([]);
      dispatch(fetchProducts(filters));
    } catch (error) {
      toast.error(error || 'Bulk action failed');
    }
  };

  const handleExport = () => {
    toast.success('Export started. Download will begin shortly.');
  };

  const isVendor = user?.role === 'vendor';
  const isAdmin = user?.role === 'admin';

  if (isLoading && !products.length) {
    return <Loader fullPage text="Loading products..." />;
  }

  return (
    <div className="products-page">
      <div className="products-page-header">
        <div className="header-left">
          <h1>Products</h1>
          <span className="product-count">{total} products</span>
        </div>
        <div className="header-right">
          <button className="btn btn-outline" onClick={handleExport}>
            <FaDownload /> Export
          </button>
          <button 
            className="btn btn-outline" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter /> Filters
          </button>
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <FaThLarge />
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <FaList />
            </button>
          </div>
          {(isVendor || isAdmin) && (
            <Link to="/vendor/products/new" className="btn btn-primary">
              <FaPlus /> Add Product
            </Link>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="products-search">
        <form onSubmit={handleSearch} className="search-form">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </div>

      {/* Filters */}
      {showFilters && (
        <ProductFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedProducts.length} products selected</span>
          <div className="bulk-actions-buttons">
            <button 
              className="btn btn-sm btn-success"
              onClick={() => handleBulkAction('activate')}
            >
              Activate
            </button>
            <button 
              className="btn btn-sm btn-warning"
              onClick={() => handleBulkAction('deactivate')}
            >
              Deactivate
            </button>
            <button 
              className="btn btn-sm btn-danger"
              onClick={() => handleBulkAction('delete')}
            >
              Delete
            </button>
            <button 
              className="btn btn-sm btn-outline"
              onClick={() => setSelectedProducts([])}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Products Grid/List */}
      {products.length === 0 ? (
        <div className="no-products">
          <div className="no-products-icon">📦</div>
          <h3>No products found</h3>
          <p>Try adjusting your filters or search criteria</p>
          {(isVendor || isAdmin) && (
            <Link to="/vendor/products/new" className="btn btn-primary">
              <FaPlus /> Add Your First Product
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Sort Header */}
          <div className="products-sort-header">
            <div className="sort-options">
              <button 
                className={`sort-btn ${filters.sortBy === 'name' ? 'active' : ''}`}
                onClick={() => handleSort('name')}
              >
                Name
                {filters.sortBy === 'name' && (
                  filters.sortOrder === 'desc' ? <FaSortDown /> : <FaSortUp />
                )}
              </button>
              <button 
                className={`sort-btn ${filters.sortBy === 'finalPrice' ? 'active' : ''}`}
                onClick={() => handleSort('finalPrice')}
              >
                Price
                {filters.sortBy === 'finalPrice' && (
                  filters.sortOrder === 'desc' ? <FaSortDown /> : <FaSortUp />
                )}
              </button>
              <button 
                className={`sort-btn ${filters.sortBy === 'sales' ? 'active' : ''}`}
                onClick={() => handleSort('sales')}
              >
                Sales
                {filters.sortBy === 'sales' && (
                  filters.sortOrder === 'desc' ? <FaSortDown /> : <FaSortUp />
                )}
              </button>
              <button 
                className={`sort-btn ${filters.sortBy === 'createdAt' ? 'active' : ''}`}
                onClick={() => handleSort('createdAt')}
              >
                Date Added
                {filters.sortBy === 'createdAt' && (
                  filters.sortOrder === 'desc' ? <FaSortDown /> : <FaSortUp />
                )}
              </button>
            </div>
            <span className="results-count">Showing {products.length} of {total} products</span>
          </div>

          {/* Products Grid */}
          <div className={`products-grid ${viewMode === 'list' ? 'list-mode' : ''}`}>
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                viewMode={viewMode}
                isSelected={selectedProducts.includes(product._id)}
                onSelect={() => {
                  setSelectedProducts(prev =>
                    prev.includes(product._id)
                      ? prev.filter(id => id !== product._id)
                      : [...prev, product._id]
                  );
                }}
                onDelete={(id) => {
                  setProductToDelete(id);
                  setShowDeleteModal(true);
                }}
                onToggleStatus={() => handleToggleStatus(product._id, product.isActive)}
                showActions={isVendor || isAdmin}
              />
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <Pagination
              currentPage={filters.page}
              totalPages={pages}
              onPageChange={(page) => handleFilterChange('page', page)}
            />
          )}
        </>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setProductToDelete(null);
        }}
        title="Delete Product"
      >
        <div className="delete-modal">
          <p>Are you sure you want to delete this product?</p>
          <p className="delete-warning">This action cannot be undone.</p>
          <div className="modal-actions">
            <button 
              className="btn btn-outline"
              onClick={() => {
                setShowDeleteModal(false);
                setProductToDelete(null);
              }}
            >
              Cancel
            </button>
            <button 
              className="btn btn-danger"
              onClick={handleDeleteProduct}
            >
              Yes, Delete Product
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductsList;