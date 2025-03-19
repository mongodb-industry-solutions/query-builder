"use client";

import React from 'react';
import PropTypes from 'prop-types';

const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-slate-800 p-6 rounded-lg shadow-lg max-w-sm w-full">
        <p className="text-slate-200 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 bg-slate-600 text-slate-200 rounded hover:bg-slate-500"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

ConfirmationModal.propTypes = {
  message: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default ConfirmationModal;