// pages/ProLandingPage.js
export const ProLandingPage = ({ onSignIn, onSignUp }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      {/* Hero for nutritionists */}
      <h1>Manage Your Clients' Nutrition Plans</h1>
      <button onClick={onSignUp}>Start Free Trial</button>
      <button onClick={onSignIn}>Sign In</button>
    </div>
  );
};

export default ProLandingPage;