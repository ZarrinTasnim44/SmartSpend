import React from 'react';
import './StatCard.css';

export default function StatCard({ title, amount, subtitle, icon: Icon, trend: _trend, variant = 'default' }) {
  return (
    <div className={`stat-card variant-${variant}`}>
      <div className="stat-card-content">
        <span className="stat-title">{title}</span>
        <div className="stat-amount">{amount}</div>
        {subtitle && <span className="stat-subtitle">{subtitle}</span>}
      </div>
      {Icon && (
        <div className="stat-icon-wrapper">
          <Icon size={22} />
        </div>
      )}
    </div>
  );
}
