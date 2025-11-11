/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface BreadcrumbsProps {
  path: string[];
  onNavigate: (index: number) => void;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ path, onNavigate }) => {
  if (path.length <= 1) {
    return null; // Don't show breadcrumbs for a single item path
  }

  return (
    <nav className="breadcrumbs-container" aria-label="Breadcrumb">
      {path.map((topic, index) => {
        const isLast = index === path.length - 1;
        return (
          <React.Fragment key={index}>
            {isLast ? (
              <span className="breadcrumb-item-active" aria-current="page">
                {topic}
              </span>
            ) : (
              <button
                onClick={() => onNavigate(index)}
                className="breadcrumb-item"
              >
                {topic}
              </button>
            )}
            {!isLast && <span className="breadcrumb-separator" aria-hidden="true">&gt;</span>}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
