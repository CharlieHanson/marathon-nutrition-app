import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Users, TrendingUp, Calendar, ArrowRight, User } from 'lucide-react';
import { authenticatedFetch, getApiUrl } from '../../../shared/services/api';
import { Card } from '@/src/components/shared/Card';
import { Button } from '@/src/components/shared/Button';
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar';
import { Skeleton } from '@/src/components/ui/skeleton';

export const NutritionistDashboard = ({ currentUser }) => {
  const [stats, setStats] = useState({
    totalClients: 0,
    activeThisWeek: 0,
    pendingReviews: 0,
  });
  const [recentClients, setRecentClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);

    try {
      if (!currentUser) {
        setStats({
          totalClients: 0,
          activeThisWeek: 0,
          pendingReviews: 0,
        });
        setRecentClients([]);
        return;
      }

      const userId = currentUser.id;
      const res = await authenticatedFetch(
        getApiUrl(`/api/pro/dashboard?userId=${encodeURIComponent(userId)}`)
      );

      if (!res.ok) {
        console.error(
          'NutritionistDashboard: API /pro/dashboard not ok',
          res.status
        );
        setStats({
          totalClients: 0,
          activeThisWeek: 0,
          pendingReviews: 0,
        });
        setRecentClients([]);
        return;
      }

      const json = await res.json();

      setStats({
        totalClients: json.stats?.totalClients ?? 0,
        activeThisWeek: json.stats?.activeThisWeek ?? 0,
        pendingReviews: json.stats?.pendingReviews ?? 0,
      });

      setRecentClients(json.recentClients || []);
    } catch (error) {
      console.error('NutritionistDashboard: UNCAUGHT error', error);
      setStats({
        totalClients: 0,
        activeThisWeek: 0,
        pendingReviews: 0,
      });
      setRecentClients([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-card" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full rounded-card" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage your clients and track their progress
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          icon={Users}
          label="Total Clients"
          value={stats.totalClients}
          accent="bg-primary-50 text-primary"
        />
        <StatCard
          icon={TrendingUp}
          label="Active This Week"
          value={stats.activeThisWeek}
          accent="bg-green-50 text-green-700"
        />
        <StatCard
          icon={Calendar}
          label="Pending Reviews"
          value={stats.pendingReviews}
          accent="bg-secondary-50 text-secondary-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card
          title="Recent Clients"
          headerAction={
            <Link href="/pro/clients">
              <Button variant="ghost" size="sm" icon={ArrowRight}>
                View all
              </Button>
            </Link>
          }
        >
          {recentClients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No clients yet</p>
              <Link href="/pro/profile">
                <Button variant="outline" size="sm">
                  Share your invite code
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-1 -mx-1">
              {recentClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/pro/clients/${client.client_user_id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-cream-200 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 border border-primary-100">
                      <AvatarFallback className="bg-primary-50 text-primary font-semibold">
                        {client.name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {client.name || 'Unknown Client'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Added{' '}
                        {new Date(client.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card title="Quick Actions">
          <div className="space-y-2">
            <QuickLink
              href="/pro/clients"
              icon={Users}
              label="View All Clients"
              description="Manage and track client progress"
            />
            <QuickLink
              href="/pro/profile"
              icon={User}
              label="Your Profile"
              description="Update business info and invite code"
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <Card>
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${accent}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
      </div>
    </div>
  </Card>
);

const QuickLink = ({ href, icon: Icon, label, description }) => (
  <Link
    href={href}
    className="flex items-center gap-3 p-3 rounded-xl hover:bg-cream-200 transition-colors group"
  >
    <div className="p-2 bg-primary-50 rounded-xl group-hover:bg-primary-100 transition-colors">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
  </Link>
);
