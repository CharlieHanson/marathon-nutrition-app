import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, TrendingUp, Calendar, ArrowRight, User } from 'lucide-react';
import { supabase } from '../../supabaseClient';

export const NutritionistDashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalClients: 0,
    activeThisWeek: 0,
    pendingReviews: 0,
  });
  const [recentClients, setRecentClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Get nutritionist ID
      const { data: nutritionist } = await supabase
        .from('nutritionists')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      console.log('Nutritionist:', nutritionist);

      if (!nutritionist) return;

      // Get client connections (without trying to join)
      const { data: connections, error: connError } = await supabase
        .from('client_nutritionist')
        .select('client_user_id, created_at')
        .eq('nutritionist_id', nutritionist.id)
        .order('created_at', { ascending: false })
        .limit(5);
        
      console.log('Connections:', connections);

      if (connError) throw connError;

      if (!connections || connections.length === 0) {
        setStats({
          totalClients: 0,
          activeThisWeek: 0,
          pendingReviews: 0,
        });
        setRecentClients([]);
        setLoading(false);
        return;
      }

      // Get total count for stats
      const { count: totalCount } = await supabase
        .from('client_nutritionist')
        .select('*', { count: 'exact', head: true })
        .eq('nutritionist_id', nutritionist.id);

      console.log('Total Count:', totalCount);

      // Fetch client profiles separately
      const clientIds = connections.map(c => c.client_user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', clientIds);

      console.log('Client IDs:', clientIds);  
      console.log('Profiles:', profiles);

      if (profileError) throw profileError;

      // Combine data
      const clientsWithProfiles = connections.map(conn => {
        const profile = profiles.find(p => p.id === conn.client_user_id);
        return {
          id: conn.client_user_id,
          client_user_id: conn.client_user_id,
          created_at: conn.created_at,
          name: profile?.name || 'Unknown Client',
        };
      });

      setStats({
        totalClients: totalCount || 0,
        activeThisWeek: 0, // TODO: Calculate from meal plans
        pendingReviews: 0, // TODO: Calculate from feedback
      });

      setRecentClients(clientsWithProfiles);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage your clients and track their progress</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={Users}
          label="Total Clients"
          value={stats.totalClients}
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="Active This Week"
          value={stats.activeThisWeek}
          color="green"
        />
        <StatCard
          icon={Calendar}
          label="Pending Reviews"
          value={stats.pendingReviews}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Clients */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Clients</h2>
            <Link href="/pro/clients">
              <button className="text-primary hover:text-primary-700 text-sm font-medium flex items-center gap-1">
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          {recentClients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No clients yet</p>
              <Link href="/pro/profile">
                <button className="text-primary hover:text-primary-700 text-sm font-medium">
                  Share your invite code →
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentClients.map((client) => (
                <Link key={client.id} href={`/pro/clients/${client.client_user_id}`}>
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {client.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {client.name || 'Unknown Client'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Added {new Date(client.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
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
        </div>
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

const QuickLink = ({ href, icon: Icon, label, description }) => (
  <Link href={href}>
    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group">
      <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
    </div>
  </Link>
);