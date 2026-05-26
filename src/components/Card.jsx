// src/components/Card.jsx
export default function Card({ icon, title, description }) {
  return (
    <div className="bg-[#1A1A1A] p-8 rounded-3xl hover:scale-105 transition-all">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-2xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}