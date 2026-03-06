import { useLocation } from "react-router-dom";

export default function Maintenance() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const msg = params.get("msg") || "System under maintenance. Please try later.";

  return (
    <div className="card" style={{ maxWidth: 720, margin: "60px auto" }}>
      <h2 className="card__title">Maintenance</h2>
      <p className="card__subtitle">{msg}</p>
      <div className="alert">Only admins can access during maintenance.</div>
    </div>
  );
}