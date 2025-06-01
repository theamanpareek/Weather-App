import React, { useState } from 'react';
import { format, subDays, isAfter, isBefore } from 'date-fns';

const DateRangePicker = ({ startDate, endDate, onDateChange, disabled = false }) => {
  const [errors, setErrors] = useState({});

  // Get today's date and 5 days ago (API limitation)
  const today = new Date();
  const fiveDaysAgo = subDays(today, 5);
  
  // Format dates for input fields
  const formatDateForInput = (date) => {
    return date ? format(date, 'yyyy-MM-dd') : '';
  };

  const validateDates = (start, end) => {
    const newErrors = {};
    
    if (!start) {
      newErrors.startDate = 'Start date is required';
    } else if (isBefore(start, fiveDaysAgo)) {
      newErrors.startDate = 'Start date cannot be more than 5 days in the past';
    } else if (isAfter(start, today)) {
      newErrors.startDate = 'Start date cannot be in the future';
    }
    
    if (!end) {
      newErrors.endDate = 'End date is required';
    } else if (isAfter(end, today)) {
      newErrors.endDate = 'End date cannot be in the future';
    } else if (start && isAfter(start, end)) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    // Check if date range is not too long (more than 7 days)
    if (start && end && !newErrors.startDate && !newErrors.endDate) {
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 7) {
        newErrors.endDate = 'Date range cannot be more than 7 days';
      }
    }
    
    return newErrors;
  };

  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value ? new Date(e.target.value) : null;
    const newErrors = validateDates(newStartDate, endDate);
    setErrors(newErrors);
    
    onDateChange({
      startDate: newStartDate,
      endDate: endDate,
      isValid: Object.keys(newErrors).length === 0
    });
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value ? new Date(e.target.value) : null;
    const newErrors = validateDates(startDate, newEndDate);
    setErrors(newErrors);
    
    onDateChange({
      startDate: startDate,
      endDate: newEndDate,
      isValid: Object.keys(newErrors).length === 0
    });
  };

  const setQuickRange = (days) => {
    const end = today;
    const start = subDays(end, days);
    const newErrors = validateDates(start, end);
    setErrors(newErrors);
    
    onDateChange({
      startDate: start,
      endDate: end,
      isValid: Object.keys(newErrors).length === 0
    });
  };

  return (
    <div className="date-range-picker">
      <div className="date-inputs">
        <div className="date-input-group">
          <label htmlFor="start-date">Start Date</label>
          <input
            id="start-date"
            type="date"
            value={formatDateForInput(startDate)}
            onChange={handleStartDateChange}
            min={formatDateForInput(fiveDaysAgo)}
            max={formatDateForInput(today)}
            disabled={disabled}
            className={errors.startDate ? 'error' : ''}
          />
          {errors.startDate && (
            <span className="error-message">{errors.startDate}</span>
          )}
        </div>

        <div className="date-input-group">
          <label htmlFor="end-date">End Date</label>
          <input
            id="end-date"
            type="date"
            value={formatDateForInput(endDate)}
            onChange={handleEndDateChange}
            min={formatDateForInput(startDate || fiveDaysAgo)}
            max={formatDateForInput(today)}
            disabled={disabled}
            className={errors.endDate ? 'error' : ''}
          />
          {errors.endDate && (
            <span className="error-message">{errors.endDate}</span>
          )}
        </div>
      </div>

      <div className="quick-ranges">
        <span className="quick-ranges-label">Quick select:</span>
        <button
          type="button"
          onClick={() => setQuickRange(1)}
          disabled={disabled}
          className="quick-range-btn"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setQuickRange(3)}
          disabled={disabled}
          className="quick-range-btn"
        >
          Last 3 days
        </button>
        <button
          type="button"
          onClick={() => setQuickRange(5)}
          disabled={disabled}
          className="quick-range-btn"
        >
          Last 5 days
        </button>
      </div>

      <style jsx>{`
        .date-range-picker {
          margin: 1rem 0;
        }

        .date-inputs {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .date-input-group {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .date-input-group label {
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
          color: #374151;
        }

        .date-input-group input {
          padding: 0.5rem;
          border: 2px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.9rem;
          transition: border-color 0.2s;
        }

        .date-input-group input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .date-input-group input.error {
          border-color: #ef4444;
        }

        .date-input-group input:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
        }

        .error-message {
          font-size: 0.8rem;
          color: #ef4444;
          margin-top: 0.25rem;
        }

        .quick-ranges {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .quick-ranges-label {
          font-size: 0.9rem;
          color: #6b7280;
          margin-right: 0.5rem;
        }

        .quick-range-btn {
          padding: 0.25rem 0.75rem;
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .quick-range-btn:hover:not(:disabled) {
          background-color: #e5e7eb;
          border-color: #9ca3af;
        }

        .quick-range-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .date-inputs {
            flex-direction: column;
          }
          
          .quick-ranges {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default DateRangePicker;
