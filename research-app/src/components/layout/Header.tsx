// ============================================
// Layout: Header Component
// ============================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import './Header.css';

interface HeaderProps {
  documentTitle: string;
  onTitleChange?: (title: string) => void;
  sessionTime?: string;
  onLogout: () => void;
}

export function Header({
  documentTitle,
  onTitleChange,
  sessionTime,
  onLogout,
}: HeaderProps) {
  const navigate = useNavigate();
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [title, setTitle] = React.useState(documentTitle);

  const handleTitleSubmit = () => {
    if (onTitleChange && title.trim()) {
      onTitleChange(title.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setTitle(documentTitle);
      setIsEditingTitle(false);
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo">
          <img src="/logo.svg" alt="BTK Institute" />
        </div>
        {isEditingTitle && onTitleChange ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={handleTitleKeyDown}
            className="header-title-input"
            autoFocus
          />
        ) : (
          <h1
            className="header-title"
            onClick={() => onTitleChange && setIsEditingTitle(true)}
            style={{ cursor: onTitleChange ? 'pointer' : 'default' }}
          >
            {documentTitle}
          </h1>
        )}
      </div>
      <div className="header-right">
        {sessionTime && <span className="header-session-time">{sessionTime}</span>}
        <button
          className="header-icon-button"
          onClick={() => navigate('/admin')}
          title="Administration"
        >
          ⚙️
        </button>
        <Button onClick={onLogout} variant="secondary">
          Logout
        </Button>
      </div>
    </header>
  );
}
