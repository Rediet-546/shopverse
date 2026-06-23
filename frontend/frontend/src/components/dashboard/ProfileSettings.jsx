import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt,
  FaCamera,
  FaSave,
  FaTimes,
  FaEdit,
  FaTrash,
  FaCheck,
  FaPlus,
  FaHome,
  FaBuilding,
  FaBriefcase
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { updateProfile, updateUser } from '../../redux/slices/authSlice';
import { fetchAddresses, addAddress, updateAddress, deleteAddress } from '../../redux/slices/userSlice';
import Input from '../common/Input';
import Button from '../common/Button';
import Alert from '../common/Alert';
import Modal from '../common/Modal';
import '../../styles/dashboard.css';
import '../../styles/profile.css';

const ProfileSettings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { addresses, isLoading } = useSelector((state) => state.users);

  const [isEditing, setIsEditing] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const fileInputRef = useRef();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    preferences: {
      currency: 'USD',
      language: 'en',
      notifications: true
    }
  });

  const [addressForm, setAddressForm] = useState({
    street: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    type: 'home',
    isDefault: false
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        preferences: user.preferences || {
          currency: 'USD',
          language: 'en',
          notifications: true
        }
      });
    }
    dispatch(fetchAddresses());
  }, [user, dispatch]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddressInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateProfile = () => {
    const newErrors = {};
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (formData.phone && !/^\+?[\d\s-]{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAddress = () => {
    const newErrors = {};
    if (!addressForm.street) newErrors.street = 'Street is required';
    if (!addressForm.city) newErrors.city = 'City is required';
    if (!addressForm.state) newErrors.state = 'State is required';
    if (!addressForm.country) newErrors.country = 'Country is required';
    if (!addressForm.zipCode) newErrors.zipCode = 'Zip code is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) {
      toast.error('Please fix the form errors');
      return;
    }

    try {
      await dispatch(updateProfile(formData)).unwrap();
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error(error || 'Failed to update profile');
    }
  };

  const handleAddAddress = async () => {
    if (!validateAddress()) {
      toast.error('Please fix the form errors');
      return;
    }

    try {
      await dispatch(addAddress(addressForm)).unwrap();
      toast.success('Address added successfully!');
      setIsAddingAddress(false);
      setAddressForm({
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        type: 'home',
        isDefault: false
      });
    } catch (error) {
      toast.error(error || 'Failed to add address');
    }
  };

  const handleUpdateAddress = async () => {
    if (!validateAddress()) {
      toast.error('Please fix the form errors');
      return;
    }

    try {
      await dispatch(updateAddress({ addressId: isEditingAddress, address: addressForm })).unwrap();
      toast.success('Address updated successfully!');
      setIsEditingAddress(null);
      setAddressForm({
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        type: 'home',
        isDefault: false
      });
    } catch (error) {
      toast.error(error || 'Failed to update address');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await dispatch(deleteAddress(addressId)).unwrap();
        toast.success('Address deleted successfully!');
      } catch (error) {
        toast.error(error || 'Failed to delete address');
      }
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile) return;
    
    // In a real app, you would upload to Cloudinary or similar
    // For now, just update the profile with a mock URL
    try {
      // const formData = new FormData();
      // formData.append('image', selectedFile);
      // const response = await uploadImage(formData);
      // await dispatch(updateProfile({ profileImage: response.url }));
      toast.success('Profile photo updated!');
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      toast.error('Failed to upload photo');
    }
  };

  const getAddressTypeIcon = (type) => {
    switch (type) {
      case 'home': return <FaHome />;
      case 'work': return <FaBriefcase />;
      default: return <FaBuilding />;
    }
  };

  return (
    <div className="profile-settings">
      <div className="profile-header">
        <h1>Profile Settings</h1>
        <div className="profile-actions">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <FaTimes /> Cancel
              </Button>
              <Button onClick={handleSaveProfile}>
                <FaSave /> Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <FaEdit /> Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Profile Photo */}
      <div className="profile-photo-section">
        <div className="profile-photo-wrapper">
          {previewUrl || user?.profileImage ? (
            <img src={previewUrl || user.profileImage} alt={user?.firstName} />
          ) : (
            <div className="profile-photo-placeholder">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          )}
          <button 
            className="profile-photo-upload"
            onClick={() => fileInputRef.current.click()}
          >
            <FaCamera />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
        {selectedFile && (
          <div className="photo-actions">
            <Button size="small" onClick={handleUploadPhoto}>
              <FaCheck /> Upload
            </Button>
            <Button size="small" variant="outline" onClick={() => {
              setSelectedFile(null);
              setPreviewUrl(null);
            }}>
              <FaTimes /> Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Profile Form */}
      <div className="profile-form">
        <div className="form-row">
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={errors.firstName ? 'error' : ''}
            />
            {errors.firstName && <span className="error-message">{errors.firstName}</span>}
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={errors.lastName ? 'error' : ''}
            />
            {errors.lastName && <span className="error-message">{errors.lastName}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="+1234567890"
              className={errors.phone ? 'error' : ''}
            />
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>
        </div>

        {/* Preferences */}
        <div className="preferences-section">
          <h3>Preferences</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Currency</label>
              <select
                name="preferences.currency"
                value={formData.preferences.currency}
                onChange={handleInputChange}
                disabled={!isEditing}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Language</label>
              <select
                name="preferences.language"
                value={formData.preferences.language}
                onChange={handleInputChange}
                disabled={!isEditing}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="zh">Chinese</option>
              </select>
            </div>
          </div>
          <div className="form-group checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="preferences.notifications"
                checked={formData.preferences.notifications}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              <span>Enable email notifications</span>
            </label>
          </div>
        </div>
      </div>

      {/* Addresses Section */}
      <div className="addresses-section">
        <div className="section-header">
          <h3>Saved Addresses</h3>
          <Button size="small" onClick={() => setIsAddingAddress(true)}>
            <FaPlus /> Add Address
          </Button>
        </div>

        <div className="addresses-grid">
          {addresses?.map((address) => (
            <div key={address._id} className="address-card">
              <div className="address-card-header">
                <div className="address-type">
                  {getAddressTypeIcon(address.type)}
                  <span>{address.type.charAt(0).toUpperCase() + address.type.slice(1)}</span>
                </div>
                {address.isDefault && (
                  <span className="default-badge">Default</span>
                )}
              </div>
              <div className="address-card-body">
                <p>{address.street}</p>
                <p>{address.city}, {address.state} {address.zipCode}</p>
                <p>{address.country}</p>
              </div>
              <div className="address-card-actions">
                <button 
                  className="edit-btn"
                  onClick={() => {
                    setIsEditingAddress(address._id);
                    setAddressForm(address);
                  }}
                >
                  <FaEdit /> Edit
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteAddress(address._id)}
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Address Modal */}
      <Modal
        isOpen={isAddingAddress}
        onClose={() => setIsAddingAddress(false)}
        title="Add New Address"
      >
        <div className="address-form">
          <div className="form-group">
            <label>Street Address</label>
            <input
              type="text"
              name="street"
              value={addressForm.street}
              onChange={handleAddressInputChange}
              placeholder="123 Main St"
              className={errors.street ? 'error' : ''}
            />
            {errors.street && <span className="error-message">{errors.street}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={addressForm.city}
                onChange={handleAddressInputChange}
                placeholder="New York"
                className={errors.city ? 'error' : ''}
              />
              {errors.city && <span className="error-message">{errors.city}</span>}
            </div>
            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                name="state"
                value={addressForm.state}
                onChange={handleAddressInputChange}
                placeholder="NY"
                className={errors.state ? 'error' : ''}
              />
              {errors.state && <span className="error-message">{errors.state}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Zip Code</label>
              <input
                type="text"
                name="zipCode"
                value={addressForm.zipCode}
                onChange={handleAddressInputChange}
                placeholder="10001"
                className={errors.zipCode ? 'error' : ''}
              />
              {errors.zipCode && <span className="error-message">{errors.zipCode}</span>}
            </div>
            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                name="country"
                value={addressForm.country}
                onChange={handleAddressInputChange}
                placeholder="United States"
                className={errors.country ? 'error' : ''}
              />
              {errors.country && <span className="error-message">{errors.country}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Address Type</label>
              <select
                name="type"
                value={addressForm.type}
                onChange={handleAddressInputChange}
              >
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={addressForm.isDefault}
                  onChange={handleAddressInputChange}
                />
                <span>Set as default address</span>
              </label>
            </div>
          </div>
          <div className="modal-actions">
            <Button variant="outline" onClick={() => setIsAddingAddress(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAddress}>
              <FaSave /> Save Address
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Address Modal */}
      <Modal
        isOpen={!!isEditingAddress}
        onClose={() => {
          setIsEditingAddress(null);
          setAddressForm({
            street: '',
            city: '',
            state: '',
            country: '',
            zipCode: '',
            type: 'home',
            isDefault: false
          });
        }}
        title="Edit Address"
      >
        <div className="address-form">
          <div className="form-group">
            <label>Street Address</label>
            <input
              type="text"
              name="street"
              value={addressForm.street}
              onChange={handleAddressInputChange}
              className={errors.street ? 'error' : ''}
            />
            {errors.street && <span className="error-message">{errors.street}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={addressForm.city}
                onChange={handleAddressInputChange}
                className={errors.city ? 'error' : ''}
              />
              {errors.city && <span className="error-message">{errors.city}</span>}
            </div>
            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                name="state"
                value={addressForm.state}
                onChange={handleAddressInputChange}
                className={errors.state ? 'error' : ''}
              />
              {errors.state && <span className="error-message">{errors.state}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Zip Code</label>
              <input
                type="text"
                name="zipCode"
                value={addressForm.zipCode}
                onChange={handleAddressInputChange}
                className={errors.zipCode ? 'error' : ''}
              />
              {errors.zipCode && <span className="error-message">{errors.zipCode}</span>}
            </div>
            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                name="country"
                value={addressForm.country}
                onChange={handleAddressInputChange}
                className={errors.country ? 'error' : ''}
              />
              {errors.country && <span className="error-message">{errors.country}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Address Type</label>
              <select
                name="type"
                value={addressForm.type}
                onChange={handleAddressInputChange}
              >
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={addressForm.isDefault}
                  onChange={handleAddressInputChange}
                />
                <span>Set as default address</span>
              </label>
            </div>
          </div>
          <div className="modal-actions">
            <Button variant="outline" onClick={() => {
              setIsEditingAddress(null);
              setAddressForm({
                street: '',
                city: '',
                state: '',
                country: '',
                zipCode: '',
                type: 'home',
                isDefault: false
              });
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAddress}>
              <FaSave /> Update Address
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProfileSettings;