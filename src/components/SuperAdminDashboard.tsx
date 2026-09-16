import React from 'react';

export const SuperAdminDashboard: React.FC<any> = ({ onLogout }) => {
  return (
    <div className="p-4 text-center">
      <p>Simran Mobile Admin</p>
      {onLogout && <button onClick={onLogout}>Sign Out</button>}
    </div>
  );
};
