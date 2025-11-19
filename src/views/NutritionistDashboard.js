// pages/NutritionistDashboard.js
export const NutritionistDashboard = ({ user, userName, onSignOut }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header>Welcome, {userName}</header>
      {/* Client list, invite code, etc. */}
      <button onClick={onSignOut}>Sign Out</button>
    </div>
  );
};

export default NutritionistDashboard;