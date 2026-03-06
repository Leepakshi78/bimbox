import { useLocation, Link } from "react-router-dom";

export default function Blocked() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const msg = params.get("msg") || "Your account is blocked. Contact admin.";

  return (
    <div className="card" style={{ maxWidth: 720, margin: "60px auto" }}>
      <h2 className="card__title">Access Restricted</h2>
      <p className="card__subtitle">{msg}</p>

      <div className="row" style={{ marginTop: 14 }}>
        <Link className="btn btn--primary" to="/login">
          Back to Login
        </Link>
      </div>
    </div>
  );
}