import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { productsAPI } from '../../api';
import '../../styles/searchbar.css';

const SearchBar = ({ placeholder = 'Search products...', onSearch }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const searchRef = useRef();
  const inputRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await productsAPI.searchProducts(query, { limit: 5 });
        setSuggestions(response.data?.products || []);
        setIsOpen(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSearch = (searchQuery) => {
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery);
      } else {
        navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      }
      setIsOpen(false);
      setQuery(searchQuery);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(query);
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="search-bar" ref={searchRef}>
      <div className="search-input-wrapper">
        <FaSearch className="search-icon" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="search-input"
        />
        {query && (
          <button className="search-clear" onClick={clearSearch}>
            <FaTimes />
          </button>
        )}
        <button 
          className="search-submit" 
          onClick={() => handleSearch(query)}
        >
          Search
        </button>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map((product) => (
            <div
              key={product._id}
              className="suggestion-item"
              onClick={() => {
                setQuery(product.name);
                setIsOpen(false);
                navigate(`/products/${product._id}`);
              }}
            >
              {product.images?.[0]?.url && (
                <img 
                  src={product.images[0].url} 
                  alt={product.name} 
                  className="suggestion-image"
                />
              )}
              <div className="suggestion-info">
                <span className="suggestion-name">{product.name}</span>
                <span className="suggestion-price">${product.finalPrice}</span>
              </div>
            </div>
          ))}
          <div 
            className="suggestion-view-all"
            onClick={() => {
              setIsOpen(false);
              handleSearch(query);
            }}
          >
            View all results for "{query}"
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;