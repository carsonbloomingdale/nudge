import { useCallback, useEffect, useState } from "react";
import IdentityRadar from "../components/home/IdentityRadar";
import { fetchPersonalityTraitsChart } from "../api/analyticsApi";
import { fetchAuthenticatedTasks } from "../api/taskApi";

export default function IdentityMapPage() {
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsFailed, setAnalyticsFailed] = useState(false);

  const load = useCallback(async () => {
    setAnalyticsLoading(true);
    const [tasksOutcome, chartOutcome] = await Promise.allSettled([
      fetchAuthenticatedTasks(),
      fetchPersonalityTraitsChart(),
    ]);
    if (tasksOutcome.status === "fulfilled") {
      setTasks(tasksOutcome.value);
    } else {
      setTasks([]);
    }
    if (chartOutcome.status === "fulfilled") {
      setAnalytics(chartOutcome.value);
      setAnalyticsFailed(false);
    } else {
      setAnalytics(null);
      setAnalyticsFailed(true);
    }
    setAnalyticsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <IdentityRadar
      tasks={tasks}
      analytics={analytics}
      analyticsLoading={analyticsLoading}
      analyticsFailed={analyticsFailed}
    />
  );
}
