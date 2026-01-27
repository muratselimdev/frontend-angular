import { Component, OnInit } from '@angular/core';

interface StatCard {
  title: string;
  value: string | number;
  change: number;
  isPositive: boolean;
  icon: string;
}

interface ChartData {
  label: string;
  value: number;
}

@Component({
  selector: 'app-admin-panel',
  standalone: false,
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.scss',
})
export class AdminPanel implements OnInit {
  statCards: StatCard[] = [
    {
      title: 'Total Patients',
      value: 3456,
      change: 8.5,
      isPositive: true,
      icon: '👥'
    },
    {
      title: 'Active Campaigns',
      value: 12,
      change: 2.0,
      isPositive: true,
      icon: '📢'
    },
    {
      title: 'Total Clinics',
      value: 45,
      change: -0.5,
      isPositive: false,
      icon: '🏥'
    },
    {
      title: 'Revenue',
      value: '$45,231',
      change: 12.3,
      isPositive: true,
      icon: '💰'
    }
  ];

  recentActivities = [
    { user: 'John Doe', action: 'Created new patient record', time: '2 mins ago' },
    { user: 'Jane Smith', action: 'Updated clinic information', time: '15 mins ago' },
    { user: 'Mike Johnson', action: 'Added new campaign', time: '1 hour ago' },
    { user: 'Sarah Wilson', action: 'Modified doctor schedule', time: '2 hours ago' },
  ];

  chartData: ChartData[] = [
    { label: 'Mon', value: 45 },
    { label: 'Tue', value: 52 },
    { label: 'Wed', value: 38 },
    { label: 'Thu', value: 65 },
    { label: 'Fri', value: 42 },
    { label: 'Sat', value: 75 },
    { label: 'Sun', value: 48 },
  ];

  ngOnInit(): void {
    // Initialize dashboard data
  }

  getMaxChartValue(): number {
    return Math.max(...this.chartData.map(d => d.value));
  }
}
