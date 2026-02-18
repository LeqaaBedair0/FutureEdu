import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function MonthlyChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="dashboard-card">
        <h3>Monthly Performance</h3>

        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      <h3>Monthly Performance</h3>

      <div style={{ width: "100%", height: 250 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <XAxis dataKey="month" />

            <YAxis />

            <Tooltip />

            <Line type="monotone" dataKey="average" stroke="#2563eb" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default MonthlyChart;
