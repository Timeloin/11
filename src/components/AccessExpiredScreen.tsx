import React from 'react';

export const AccessExpiredScreen: React.FC<any> = ({ onLogout }) => {
  return (
    <div className="p-4 text-center">
      <p>Simran Mobile</p>
      {onLogout && <button onClick={onLogout}>Sign Out</button>}
    </div>
  );
};
